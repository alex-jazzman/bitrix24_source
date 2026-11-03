import { Dom, Event, Loc, Page, Runtime, Tag, Text, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { PopupManager } from 'main.popup';
import { Loader } from 'main.loader';
import DefaultController from './default-controller';
import Options from '../options';
import Backend from '../backend';
import Utils from '../utils';
import { CancelButton, CreateButton } from 'ui.buttons';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { FocusNavigator, InteractivityChecker } from 'ui.a11y';
import { Line } from 'ui.system.skeleton';

export default class PresetDefaultController extends DefaultController
{
	isReady: boolean = true;
	#unavailableToolPopup: ?MessageBox;
	#mode: string;
	#mainToolPicker = null;
	currentPresetId: ?string;

	constructor(container, { events }, currentPresetId)
	{
		super(container, { events });
		this.currentPresetId = currentPresetId;
	}

	createPopup(mode)
	{
		this.#mode = mode;
		let button;
		const content = Tag.render`
			<div class="left-menu-popup-wrapper-skeleton"><div>
		`;

		new Loader({
			size: 100,
		}).show(content);

		const popup = PopupManager.create(this.constructor.name.toString(), null, {
			overlay: true,
			contentColor: 'white',
			contentNoPaddings: true,
			lightShadow: true,
			draggable: { restrict: true },
			closeByEsc: true,
			offsetTop: 1,
			offsetLeft: 20,
			cacheable: false,
			closeIcon: true,
			content,
			buttons: [
				(button = new CreateButton({
					text: Loc.getMessage('MENU_CONFIRM_BUTTON'),
					onclick: () => {
						if (button.isWaiting())
						{
							return;
						}
						button.setWaiting(true);
						const currentPreset = this.getSelectedPreset();

						if (
							!Options.isAdmin
							&& Options.availablePresetTools
							&& Options.availablePresetTools[currentPreset] === false
						)
						{
							button.setWaiting(false);
							this.showUnavailableToolPopup();

							return;
						}

						EventEmitter.emit(
							this,
							Options.eventName('onPresetIsSet'),
							{ presetId: currentPreset, mode },
						)
							.forEach((promise) => {
								promise
									.then((response) => {
										button.setWaiting(false);
										this.hide();
										if (response.data.hasOwnProperty('url'))
										{
											document.location.href = response.data.url;
										}
										else
										{
											document.location.reload();
										}
									}).catch(Utils.catchError);
							});
					},
				})),
				new CancelButton({
					text: Loc.getMessage('MENU_DELAY_BUTTON'),
					onclick: () => {
						EventEmitter.emit(this, Options.eventName('onPresetIsPostponed'), { mode });
						this.hide();
					},
				}),
			],
		});

		Runtime.loadExtension('intranet.menu-preset').then((exports) => {
			const menuPreset = new exports.MenuPreset({
				containerNode: document.querySelector('#left-menu-preset-popup'),
				currentPresetId: this.currentPresetId,
			});

			popup.setContent(menuPreset.getContent());
			popup.adjustPosition();
		}).catch(() => {});

		return popup;
	}

	show(mode)
	{
		if (Options.isMainToolPickerEnabled)
		{
			if (mode === 'global')
			{
				EventEmitter.emit(this, Options.eventName('onMainToolPickerAutoRequested'));

				return;
			}

			this.openMainToolPicker();

			return;
		}

		if (this.#mainToolPicker)
		{
			this.closeMainToolPicker(this.#mainToolPicker.popup, 'bootstrap');
		}

		if (this.popup === null)
		{
			this.popup = this.createPopup(mode);
			this.bindPopupEvents();
		}

		this.popup.show();
	}

	openMainToolPicker(): Promise
	{
		if (!Options.isMainToolPickerEnabled)
		{
			return Promise.resolve(null);
		}

		if (this.#mainToolPicker)
		{
			if (this.#mainToolPicker.popup.isShown())
			{
				return this.#mainToolPicker.readyPromise;
			}

			this.closeMainToolPicker(this.#mainToolPicker.popup, 'replaced');
		}

		const instance = this.#createMainToolPicker('manual');
		instance.popup.show();
		Backend.getMainToolState()
			.then(({ data }) => this.#mountMainToolPicker(instance, data))
			.catch((response) => this.#failMainToolPicker(instance, response))
		;

		return instance.readyPromise;
	}

	prepareMainToolPicker(state): Promise
	{
		if (!Options.isMainToolPickerEnabled || this.popup)
		{
			return Promise.resolve(null);
		}

		const instance = this.#createMainToolPicker('auto');
		this.#mountMainToolPicker(instance, state)
			.catch((response) => this.#failMainToolPicker(instance, response))
		;

		return instance.readyPromise;
	}

	showPreparedMainToolPicker(popup): boolean
	{
		if (
			!this.isMainToolPickerActive(popup)
			|| !this.#mainToolPicker.ready
			|| document.visibilityState !== 'visible'
		)
		{
			return false;
		}

		popup.show();
		this.#reportMainToolPickerShown(this.#mainToolPicker);

		return true;
	}

	isMainToolPickerActive(popup): boolean
	{
		return Boolean(
			this.#mainToolPicker
			&& this.#mainToolPicker.popup === popup
			&& !popup.isDestroyed()
			&& Options.isMainToolPickerEnabled
			&& this.#mainToolPicker.bootstrapRevision === Options.mainToolPickerBootstrapRevision
		);
	}

	closeMainToolPicker(popup, reason: string = 'close'): void
	{
		const instance = this.#mainToolPicker;
		if (!instance || instance.popup !== popup)
		{
			return;
		}

		this.#mainToolPicker = null;
		this.popup = null;
		this.isReady = true;
		instance.resolveReady(null);
		EventEmitter.unsubscribe(Options.eventName('onMainToolPickerBootstrap'), instance.onBootstrap);
		Event.unbind(window, 'pagehide', instance.onPageHide);
		Event.unbind(window, 'resize', instance.onResize);
		cancelAnimationFrame(instance.focusFrame);
		if (reason === 'success' || reason === 'pagehide')
		{
			popup.getFocusTrap()?.setRestoreFocus(false);
		}

		instance.busy = false;
		instance.application?.setBusy(false);
		instance.application?.unsubscribeAll();
		instance.application?.destroy();
		popup.destroy();
		popup.unsubscribeAll();

		EventEmitter.emit(this, Options.eventName('onMainToolPickerClosed'), {
			popup,
			openingReason: instance.openingReason,
			reason,
			wasShown: instance.showReported,
		});
	}

	destroy(): void
	{
		if (this.#mainToolPicker)
		{
			this.closeMainToolPicker(this.#mainToolPicker.popup, 'destroy');
		}
		else
		{
			this.popup?.destroy();
		}
	}

	#createMainToolPicker(openingReason: string)
	{
		PopupManager.getPopupById(this.constructor.name.toString())?.destroy();
		const opener = FocusNavigator.getActiveElement();
		const content = Tag.render`
			<div class="intranet-main-tool-picker-loading" aria-busy="true"
				data-testid="intranet-main-tool-picker-loading">
				<div class="intranet-main-tool-picker-loading__skeleton" aria-hidden="true">
					<div class="intranet-main-tool-picker-loading__scene">
						<div class="intranet-main-tool-picker-loading__illustration">${Line(0, 0, 24)}</div>
						<div class="intranet-main-tool-picker-loading__text">
							${Line(0, 28, 8)}
							${Line(0, 12, 8)}
							${Line(0, 12, 8)}
						</div>
					</div>
					<div class="intranet-main-tool-picker-loading__presets">
						${Array.from({ length: 4 }, () => Line(0, 64, 12))}
					</div>
				</div>
			</div>
		`;
		const popup = PopupManager.create({
			id: this.constructor.name.toString(),
			className: 'intranet-main-tool-picker-popup',
			overlay: true,
			background: 'transparent',
			contentBackground: 'transparent',
			padding: 0,
			contentPadding: 0,
			fixed: true,
			disableScroll: true,
			closeByEsc: true,
			cacheable: false,
			closeIcon: true,
			focusTrap: {
				initialFocus: [
					'input[type="radio"]:checked:not(:disabled)',
					'input[type="radio"]:not(:disabled)',
					'.popup-window-close-icon',
				],
				preventScroll: false,
				restoreFocus: () => this.#getMainToolPickerReturnFocus(opener),
			},
			ariaLabel: Loc.getMessage('MENU_SET_DEFAULT2'),
			content,
		});
		Dom.attr(popup.getPopupContainer(), 'data-testid', 'intranet-main-tool-picker-popup');
		Dom.attr(
			popup.getPopupContainer().querySelector('.popup-window-close-icon'),
			{
				'aria-label': Loc.getMessage('MENU_MAIN_TOOL_PICKER_CLOSE'),
				'data-testid': 'intranet-main-tool-picker-close',
			},
		);
		const instance = {
			popup,
			loadingContent: content,
			openingReason,
			bootstrapRevision: Options.mainToolPickerBootstrapRevision,
			application: null,
			state: null,
			ready: false,
			busy: false,
			showReported: false,
			focusFrame: 0,
			onBootstrap: () => this.closeMainToolPicker(popup, 'bootstrap'),
			onPageHide: () => this.closeMainToolPicker(popup, 'pagehide'),
			onResize: () => this.#updateMainToolPickerSize(instance),
		};
		instance.readyPromise = new Promise((resolve) => {
			instance.resolveReady = resolve;
		});
		this.#mainToolPicker = instance;
		this.popup = popup;
		this.#mode = openingReason === 'auto' ? 'global' : 'personal';
		this.isReady = false;
		popup.subscribe('onClose', () => this.closeMainToolPicker(popup));
		popup.subscribe('onDestroy', () => this.closeMainToolPicker(popup, 'destroy'));
		EventEmitter.subscribe(Options.eventName('onMainToolPickerBootstrap'), instance.onBootstrap);
		Event.bind(window, 'pagehide', instance.onPageHide);
		Event.bind(window, 'resize', instance.onResize);
		this.#updateMainToolPickerSize(instance);

		return instance;
	}

	#getMainToolPickerReturnFocus(opener: HTMLElement | null): HTMLElement | null
	{
		const settingsButton = this.container.querySelector('[data-role="menu-settings-item"]');
		if (InteractivityChecker.isFocusable(settingsButton))
		{
			return settingsButton;
		}

		if (InteractivityChecker.isFocusable(opener))
		{
			return opener;
		}

		for (const container of [this.container, document.body])
		{
			const fallback = Array.from(container.querySelectorAll('button')).find((button) => (
				InteractivityChecker.isTabbable(button)
				&& !InteractivityChecker.isDisabled(button)
				&& !button.closest('[aria-hidden="true"], .intranet-main-tool-picker-popup')
				&& (
					Type.isStringFilled(button.getAttribute('aria-label'))
					|| Type.isStringFilled(button.getAttribute('aria-labelledby'))
					|| Type.isStringFilled(button.textContent.trim())
				)
			));
			if (fallback)
			{
				return fallback;
			}
		}

		return null;
	}

	#updateMainToolPickerSize(instance): void
	{
		if (!this.isMainToolPickerActive(instance.popup))
		{
			return;
		}

		instance.popup.setWidth(Math.min(820, document.documentElement.clientWidth - 32));
		if (!instance.ready)
		{
			Dom.style(instance.loadingContent, 'height', `${Math.min(500, window.innerHeight - 32)}px`);
		}

		instance.popup.adjustPosition();
	}

	#focusMainToolPicker(instance): void
	{
		cancelAnimationFrame(instance.focusFrame);
		instance.focusFrame = requestAnimationFrame(() => {
			if (!this.isMainToolPickerActive(instance.popup) || !instance.popup.isShown() || instance.busy)
			{
				return;
			}

			const focusTrap = instance.popup.getFocusTrap();
			if (!focusTrap?.focusBySelector('input[type="radio"]:checked:not(:disabled)', { wrap: true }))
			{
				focusTrap?.focusBySelector('input[type="radio"]:not(:disabled)', { wrap: true });
			}
		});
	}

	async #mountMainToolPicker(instance, state): Promise
	{
		if (!this.isMainToolPickerActive(instance.popup))
		{
			return;
		}

		if (
			!Type.isPlainObject(state)
			|| !Type.isBoolean(state.canChangePersonal)
			|| !Type.isBoolean(state.canManageAll)
			|| !Type.isArray(state.availablePresets)
			|| !state.availablePresets.every((preset) => (
				Type.isPlainObject(preset)
				&& Type.isStringFilled(preset.id)
				&& Type.isBoolean(preset.canApplyForAll)
			))
		)
		{
			throw new Error('Invalid main tool state.');
		}

		Options.mainToolState = state;
		if (!Options.canChangeMainTool())
		{
			this.#failMainToolPicker(instance, {
				errors: [{ code: state.forced ? 'MAIN_TOOL_FORCED' : 'MAIN_TOOL_ACCESS_DENIED' }],
			});

			return;
		}

		if (!Type.isArrayFilled(state.availablePresets))
		{
			this.#failMainToolPicker(instance, { errors: [{ code: 'MAIN_TOOL_UNAVAILABLE' }] });

			return;
		}

		instance.state = state;
		const { createMainToolPicker } = await Runtime.loadExtension('intranet.menu-preset');
		if (!this.isMainToolPickerActive(instance.popup))
		{
			return;
		}

		instance.application = createMainToolPicker({ state, openingReason: instance.openingReason, busy: false });
		instance.application.subscribe('confirm', ({ data }) => this.#applyMainTool(instance, data));
		instance.application.subscribe('closeRequested', () => this.closeMainToolPicker(instance.popup));
		instance.application.subscribe('error', ({ data }) => this.#failMainToolPicker(instance, data));
		let content: HTMLElement;
		instance.application.subscribe('ready', () => {
			if (!this.isMainToolPickerActive(instance.popup) || instance.ready)
			{
				return;
			}

			instance.ready = true;
			instance.popup.setContent(content);
			Dom.attr(instance.popup.getPopupContainer(), {
				'aria-labelledby': content.querySelector('.intranet-main-tool-picker__title').id,
				'aria-describedby': content.querySelector('.intranet-main-tool-picker__description').id,
			});
			this.isReady = true;
			instance.application.setBusy(false);
			this.#updateMainToolPickerSize(instance);
			if (instance.popup.isShown())
			{
				this.#focusMainToolPicker(instance);
			}

			instance.resolveReady(instance.popup);
			this.#reportMainToolPickerShown(instance);
		});
		content = instance.application.getContent();
	}

	#reportMainToolPickerShown(instance): void
	{
		if (!instance.ready || !instance.popup.isShown() || instance.showReported)
		{
			return;
		}

		instance.showReported = true;
		EventEmitter.emit(this, Options.eventName('onMainToolPickerShown'), {
			popup: instance.popup,
			openingReason: instance.openingReason,
		});
	}

	#applyMainTool(instance, selection): void
	{
		if (!this.isMainToolPickerActive(instance.popup) || !instance.ready || instance.busy)
		{
			return;
		}

		const { presetId, applyForAll } = selection ?? {};
		const preset = instance.state.availablePresets.find((item) => item.id === presetId);
		if (
			!Type.isStringFilled(presetId)
			|| !Type.isBoolean(applyForAll)
			|| !preset
			|| (applyForAll && (!instance.state.canManageAll || !preset.canApplyForAll))
			|| (!applyForAll && !instance.state.canChangePersonal && !instance.state.canManageAll)
		)
		{
			this.#failMainToolPicker(instance, { errors: [{ code: 'MAIN_TOOL_INVALID_ARGUMENT' }] });

			return;
		}

		instance.busy = true;
		instance.popup.getFocusTrap()?.focusBySelector('.popup-window-close-icon', { wrap: true });
		instance.application.setBusy(true);
		Backend.applyMainTool({ presetId, applyForAll })
			.then((response) => {
				if (!this.isMainToolPickerActive(instance.popup))
				{
					return;
				}

				if (!Type.isStringFilled(response?.data?.url))
				{
					throw new Error('Missing main tool URL.');
				}

				EventEmitter.emit(this, Options.eventName('onMainToolPickerApplied'), {
					presetId,
					applyForAll,
					openingReason: instance.openingReason,
				});
				this.closeMainToolPicker(instance.popup, 'success');
				if (response.data.url === document.location.pathname + document.location.search)
				{
					document.location.reload();
				}
				else
				{
					Page.redirect(response.data.url);
				}
			})
			.catch((response) => this.#failMainToolPicker(instance, response))
		;
	}

	#failMainToolPicker(instance, response): void
	{
		if (!this.isMainToolPickerActive(instance.popup))
		{
			return;
		}

		this.closeMainToolPicker(instance.popup, 'error');
		PresetDefaultController.notifyMainToolError(response);
	}

	static notifyMainToolError(response): void
	{
		const code = Type.isArray(response?.errors) ? response.errors[0]?.code : null;
		if (code === 'MAIN_TOOL_FEATURE_DISABLED')
		{
			Options.setMainToolPickerEnabled(false);
		}

		const messages = {
			MAIN_TOOL_FORCED: 'MENU_MAIN_TOOL_PICKER_FORCED',
			MAIN_TOOL_ACCESS_DENIED: 'MENU_MAIN_TOOL_PICKER_ACCESS_DENIED',
			MAIN_TOOL_UNAVAILABLE: 'MENU_MAIN_TOOL_PICKER_UNAVAILABLE',
		};
		const message = Loc.getMessage(messages[code] || 'MENU_MAIN_TOOL_PICKER_ERROR');
		Utils.catchError({ errors: [{ message: Text.encode(message) }] });
	}

	getMode(): string
	{
		return this.#mode;
	}

	getSelectedPreset()
	{
		const form = document.forms['left-menu-preset-form'];
		const selectedPreset = form?.querySelector('input[name="presetType"]:checked');

		return selectedPreset?.value ?? '';
	}

	showUnavailableToolPopup(): void
	{
		if (!(this.#unavailableToolPopup instanceof MessageBox))
		{
			this.#unavailableToolPopup = MessageBox.create({
				message: Loc.getMessage('MENU_UNAVAILABLE_TOOL_POPUP_DESCRIPTION'),
				buttons: MessageBoxButtons.OK,
			});
		}

		this.#unavailableToolPopup.show();
	}
}
