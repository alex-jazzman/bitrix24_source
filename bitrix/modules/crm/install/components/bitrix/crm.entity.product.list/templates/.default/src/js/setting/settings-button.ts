import {Popup} from 'main.popup';
import {ajax, Cache, Event as EventBinder, Loc, Tag, Type} from 'main.core';
import {EventEmitter} from 'main.core.events';
import {FocusNavigator, InteractivityChecker} from 'ui.a11y';
import type {Editor} from '../editor/product-list-editor';

declare const BX: any;

type CrmEntityProductListSettingItem = {
	id: string;
	title: string;
	desc?: string;
	hint?: string;
	checked?: boolean;
	disabled?: boolean;
	action?: string;
	columns?: string[];
};

export default class SettingsPopup
{
	private static lastActiveSelector: string | null = null;

	private readonly target: HTMLElement;
	private readonly settings: CrmEntityProductListSettingItem[];
	private readonly editor: Editor;
	private readonly cache = new Cache.MemoryCache<Popup>();
	private keydownHandler: ((event: KeyboardEvent) => void) | null = null;
	private keydownBound: boolean = false;

	constructor(target: HTMLElement, settings: CrmEntityProductListSettingItem[] = [], editor: Editor)
	{
		this.target = target;
		this.settings = settings;
		this.editor = editor;
	}

	public show(): void
	{
		const popup = this.getPopup();
		popup.show();
	}

	public getPopup(): Popup
	{
		return this.cache.remember('settings-popup', () => {
			const popup = new Popup({
				id: this.editor.getId() + '_' + Math.random() * 100,
				bindElement: this.target,
				autoHide: true,
				draggable: false,
				angle: {position: 'top', offset: 43},
				noAllPaddings: true,
				bindOptions: {forceBindPosition: true},
				closeByEsc: true,
				// own looped focus trap: the card lives in a sidepanel whose trap would otherwise
				// steal Tab out of this non-modal popup. Passing an object opts the popup's trap in
				// regardless of the global setting; initialFocus true focuses the first tabbable
				// checkbox and falls back to the container when every setting is disabled, so Esc
				// still works.
				focusTrap: {
					initialFocus: true,
				},
				content: this.prepareSettingsContent(),
				events: {
					onShow: () => {
						this.setTriggerExpanded(popup, true);
						this.bindKeyboardNavigation(popup);
					},
					onClose: () => {
						this.setTriggerExpanded(popup, false);
						this.unbindKeyboardNavigation(popup);
					},
				},
			});

			return popup;
		}) as Popup;
	}

	private setTriggerExpanded(popup: Popup, expanded: boolean): void
	{
		const container = this.editor.getContainer();
		if (Type.isElementNode(container))
		{
			container!
				.querySelectorAll('[data-role="product-list-settings-button"]')
				.forEach((trigger) => {
					trigger.setAttribute('aria-expanded', 'false');
				})
			;
		}

		if (expanded)
		{
			const trigger = (popup as any).bindElement;
			if (Type.isElementNode(trigger))
			{
				(trigger as HTMLElement).setAttribute('aria-expanded', 'true');
			}
		}
	}

	// Menu-like keyboard model (APG checkbox pattern): Up/Down roam the checkboxes with wrap,
	// Home/End jump to edges, Enter/Space toggle, Tab leaves the popup instead of cycling inside it.
	private bindKeyboardNavigation(popup: Popup): void
	{
		if (this.keydownBound)
		{
			return;
		}

		const container = popup.getContentContainer();
		if (!Type.isElementNode(container))
		{
			return;
		}

		if (this.keydownHandler === null)
		{
			this.keydownHandler = this.handleKeyboardNavigation.bind(this);
		}

		EventBinder.bind(container, 'keydown', this.keydownHandler);
		this.keydownBound = true;
	}

	private unbindKeyboardNavigation(popup: Popup): void
	{
		if (!this.keydownBound || this.keydownHandler === null)
		{
			return;
		}

		const container = popup.getContentContainer();
		if (Type.isElementNode(container))
		{
			EventBinder.unbind(container, 'keydown', this.keydownHandler);
		}

		this.keydownBound = false;
	}

	private handleKeyboardNavigation(event: KeyboardEvent): void
	{
		if (event.metaKey || event.ctrlKey || event.altKey)
		{
			return;
		}

		const popup = this.getPopup();
		const container = popup.getContentContainer();
		if (!Type.isElementNode(container))
		{
			return;
		}

		switch (event.key)
		{
			case 'ArrowDown':
				event.preventDefault();
				this.focusRelativeSetting(container, 1);
				break;

			case 'ArrowUp':
				event.preventDefault();
				this.focusRelativeSetting(container, -1);
				break;

			case 'Home':
				event.preventDefault();
				this.focusEdgeSetting(container, 'first');
				break;

			case 'End':
				event.preventDefault();
				this.focusEdgeSetting(container, 'last');
				break;

			case 'Enter':
			case ' ':
			case 'Space':
			{
				event.preventDefault();
				const active = FocusNavigator.getActiveElement();
				// single toggle: native Space toggle is suppressed above, click() fires one change -> setSetting
				if (active instanceof HTMLInputElement && !active.disabled)
				{
					active.click();
				}

				break;
			}

			case 'Tab':
			{
				event.preventDefault();
				const editorContainer = this.editor.getContainer();
				// close() restores focus to the kebab trigger synchronously (focus trap deactivate)
				popup.close();
				if (!event.shiftKey && Type.isElementNode(editorContainer))
				{
					FocusNavigator.focusNext(editorContainer as HTMLElement);
				}

				break;
			}

			default:
				break;
		}
	}

	private getFocusableSettingInputs(container: HTMLElement): HTMLInputElement[]
	{
		const inputs = container.querySelectorAll('input[type="checkbox"][data-setting-id]');

		return Array.from(inputs).filter((input) => {
			return !(input as HTMLInputElement).disabled && InteractivityChecker.isVisible(input as HTMLElement);
		}) as HTMLInputElement[];
	}

	private focusRelativeSetting(container: HTMLElement, direction: number): void
	{
		const items = this.getFocusableSettingInputs(container);
		if (items.length === 0)
		{
			return;
		}

		const active = FocusNavigator.getActiveElement();
		const current = active instanceof HTMLInputElement ? items.indexOf(active) : -1;

		const next = current === -1
			? (direction > 0 ? 0 : items.length - 1)
			: (current + direction + items.length) % items.length
		;

		items[next].focus();
	}

	private focusEdgeSetting(container: HTMLElement, edge: 'first' | 'last'): void
	{
		const items = this.getFocusableSettingInputs(container);
		if (items.length === 0)
		{
			return;
		}

		const item = edge === 'first' ? items[0] : items[items.length - 1];
		item.focus();
	}

	public onSettingsGridReloaded(popupContainer: HTMLElement): void
	{
		const restored = Type.isStringFilled(SettingsPopup.lastActiveSelector)
			? FocusNavigator.focusBySelector(popupContainer, SettingsPopup.lastActiveSelector as string)
			: null
		;

		if (restored === null)
		{
			FocusNavigator.focusFirst(popupContainer);
		}
	}

	private buildSelectorForActiveControl(): string | null
	{
		const active = FocusNavigator.getActiveElement();
		if (!Type.isElementNode(active))
		{
			return null;
		}

		const settingId = active!.dataset ? active!.dataset.settingId : undefined;

		return Type.isStringFilled(settingId) ? `input[data-setting-id="${settingId}"]` : null;
	}

	private scheduleFocusRestoreOnReload(): void
	{
		SettingsPopup.lastActiveSelector = this.buildSelectorForActiveControl();

		EventEmitter.subscribeOnce(this.editor, 'onGridReloaded', () => {
			const settingsPopup = this.editor.getSettingsPopup();
			const popup = settingsPopup.getPopup();
			popup.show();
			settingsPopup.onSettingsGridReloaded(popup.getContentContainer());
		});
	}

	public getSetting(id: string): CrmEntityProductListSettingItem | undefined
	{
		return this.settings.filter(item => {
			return item.id === id;
		})[0];
	}

	private prepareSettingsContent(): HTMLElement
	{
		const content = Tag.render`
			<div class='ui-entity-editor-popup-create-field-list'></div>
		`;

		this.settings.forEach(item => {
			content.append(this.getCrmEntityProductListSettingItem(item));
		});

		return content;
	}

	private getCrmEntityProductListSettingItem(item: CrmEntityProductListSettingItem): HTMLElement
	{
		const input = Tag.render`
			<input type="checkbox">
		` as HTMLInputElement;
		input.checked = item.checked ?? false;
		input.disabled = item.disabled ?? false;
		input.dataset.settingId = item.id;

		const descriptionNode = (
			Type.isStringFilled(item.desc)
				? Tag.render`<span class="ui-entity-editor-popup-create-field-item-desc">${item.desc}</span>`
				: ''
		);

		const hintNode = (
			Type.isStringFilled(item.hint)
				? Tag.render`<span class="crm-entity-product-list-setting-hint" data-hint="${item.hint}"></span>`
				: ''
		);

		const setting = Tag.render`
			<label class="ui-ctl-block ui-entity-editor-popup-create-field-item ui-ctl-w100 crm-entity-product-list-setting-row" data-testid="${'product-list-setting-row-' + item.id}">
				<div class="ui-ctl-w10" style="text-align: center">${input}</div>
				<div class="ui-ctl-w75">
					<span class="ui-entity-editor-popup-create-field-item-title ${item.disabled ? 'crm-entity-product-list-disabled-setting' : ''}">${item.title}${hintNode}</span>
					${descriptionNode}
				</div>
			</label>
		`;

		BX.UI.Hint.init(setting);

		EventBinder.bind(setting, 'change', this.setSetting.bind(this));

		return setting;
	}

	private setSetting(event: Event): void
	{
		const target = event.target as HTMLInputElement;
		const settingItem = this.getSetting(target.dataset.settingId as string);
		if (!settingItem)
		{
			return;
		}

		const settingEnabled = target.checked;
		this.requestGridSettings(settingItem, settingEnabled);
	}

	public requestGridSettings(setting: CrmEntityProductListSettingItem, enabled: boolean): void
	{
		const headers: string[] = [];
		const cells = this.editor.gridLifecycle.getGrid().getRows().getHeadFirstChild().getCells();

		Array.from(cells).forEach((header: any) => {
			if ('name' in header.dataset)
			{
				headers.push(header.dataset.name);
			}
		});

		ajax.runComponentAction(
			this.editor.getComponentName(),
			'setGridSetting',
			{
				mode: 'class',
				data: {
					signedParameters: this.editor.getSignedParameters(),
					settingId: setting.id,
					selected: enabled,
					currentHeaders: headers
				}
			}
		).then(() => {
			let message: string;
			setting.checked = enabled;
			if (setting.id === 'ADD_NEW_ROW_TOP')
			{
				const panel = enabled ? 'top' : 'bottom';
				this.editor.setSettingValue('newRowPosition', panel);
				const activePanel = this.editor.changeActivePanelButtons(panel);
				const settingButton = activePanel?.querySelector('[data-role="product-list-settings-button"]') ?? null;
				if (settingButton)
				{
					this.getPopup().setBindElement(settingButton);
				}

				this.getPopup().close();

				// changeActivePanelButtons() hides the panel that held the original trigger before
				// close(), so the trap's restoreFocus lands on <body>; there is no grid reload here,
				// so move focus to the now-visible trigger explicitly.
				if (settingButton)
				{
					FocusNavigator.focusTarget(settingButton as HTMLElement);
				}

				message = (enabled
					? Loc.getMessage('CRM_ENTITY_PL_SETTING_ENABLED')
					: Loc.getMessage('CRM_ENTITY_PL_SETTING_DISABLED')
				) as string;
				message = message.replace('#NAME#', setting.title);
			}
			else if (setting.id === 'WAREHOUSE')
			{
				// grid reload destroys the popup and drops focus to body - restore it after re-render
				this.scheduleFocusRestoreOnReload();
				this.editor.reloadGrid(false);
				message = (enabled
					? Loc.getMessage('CRM_ENTITY_CARD_WAREHOUSE_ENABLED')
					: Loc.getMessage('CRM_ENTITY_CARD_WAREHOUSE_DISABLED')
				) as string;
			}
			else
			{
				// grid reload destroys the popup and drops focus to body - restore it after re-render
				this.scheduleFocusRestoreOnReload();
				this.editor.reloadGrid();

				message = (enabled
					? Loc.getMessage('CRM_ENTITY_PL_SETTING_ENABLED')
					: Loc.getMessage('CRM_ENTITY_PL_SETTING_DISABLED')
				) as string;
				message = message.replace('#NAME#', setting.title);
			}

			this.showNotification(message, {
				category: 'popup-settings'
			});
		});
	}

	private showNotification(content: string, options?: Record<string, any>): void
	{
		options = options || {};

		BX.UI.Notification.Center.notify({
			content: content,
			stack: options.stack || null,
			position: 'top-right',
			width: 'auto',
			category: options.category || null,
			autoHideDelay: options.autoHideDelay || 3000
		});
	}

	public updateCheckboxState(): void
	{
		const popupContainer = this.getPopup().getContentContainer();

		this.settings
			.filter(item => item.action === 'grid' && Type.isArray(item.columns))
			.forEach(item => {
				let allColumnsExist = true;

				item.columns!.forEach(columnName => {
					if (!this.editor.gridLifecycle.getGrid().getColumnHeaderCellByName(columnName))
					{
						allColumnsExist = false;
					}
				});

				const checkbox = popupContainer.querySelector('input[data-setting-id="' + item.id + '"]') as HTMLInputElement | null;
				if (Type.isElementNode(checkbox))
				{
					checkbox!.checked = allColumnsExist;
				}
			});
	}
}
