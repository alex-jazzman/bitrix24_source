/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_popup, ui_buttons, ui_system_typography) {
	'use strict';

	const NoticePopupMode = Object.freeze({
		Popover: 'popover',
		Dialog: 'dialog'
	});

	const DEFAULT_OPTIONS = Object.freeze({
		mode: 'popover',
		illustration: 'access-denied',
		title: '',
		text: '',
		width: 500,
		angle: false,
		autoHide: true,
		closeByEsc: true,
		closeIcon: true,
		bindElement: null,
		buttons: null,
		cacheable: false
	});

	function prepareOptions(options = {}) {
		return {
			...DEFAULT_OPTIONS,
			...options
		};
	}
	function resolveButtons(preparedOptions) {
		if (main_core.Type.isArrayFilled(preparedOptions.buttons)) {
			return preparedOptions.buttons;
		}
		return [{
			text: main_core.Loc.getMessage('CRM_NOTICE_POPUP_BTN_GOT_IT') ?? '',
			style: 'filled'
		}];
	}

	const PRESETS = Object.freeze({
		accessDenied: {
			illustration: 'access-denied',
			titleId: 'CRM_NOTICE_POPUP_ACCESS_DENIED_TITLE',
			textId: 'CRM_NOTICE_POPUP_ACCESS_DENIED_TEXT'
		}
	});
	function getPreset(name) {
		const preset = PRESETS[name];
		if (!preset) {
			throw new Error(`Unknown notice popup preset: ${name}`);
		}
		return preset;
	}
	function buildAccessDeniedOptions(overrides = {}) {
		const preset = getPreset('accessDenied');
		return {
			illustration: preset.illustration,
			title: main_core.Loc.getMessage(preset.titleId) ?? '',
			text: main_core.Loc.getMessage(preset.textId) ?? '',
			...overrides
		};
	}

	const BUTTON_STYLE_MAP = {
		filled: ui_buttons.AirButtonStyle.FILLED,
		outline: ui_buttons.AirButtonStyle.OUTLINE,
		plain: ui_buttons.AirButtonStyle.PLAIN
	};
	const DIALOG_CLASS_NAME = 'crm-notice-popup-dialog';
	class NoticePopup {
		#options;
		#popover = null;
		#dialog = null;
		#dialogLoadPromise = null;
		constructor(options = {}) {
			this.#options = prepareOptions(options);
		}
		static show(options = {}) {
			const popup = new this(options);
			popup.show();
			return popup;
		}
		static showAccessDenied(bindElement, overrides = {}) {
			return this.show({
				bindElement,
				...buildAccessDeniedOptions(overrides)
			});
		}
		show() {
			if (this.#isDialog()) {
				void this.#showDialog();
				return;
			}
			this.#getPopover().show();
		}
		close() {
			if (this.#isDialog()) {
				this.#dialog?.hide();
			} else {
				this.#popover?.close();
			}
		}
		#isDialog() {
			return this.#options.mode === NoticePopupMode.Dialog;
		}
		#getPopover() {
			if (!this.#popover) {
				const content = main_core.Tag.render`
				<div class="crm-notice-popup__content">
					${this.#renderBody()}
					<div class="crm-notice-popup__buttons"></div>
				</div>
			`;
				const buttonsContainer = content.querySelector('.crm-notice-popup__buttons');
				this.#createButtons().forEach(button => main_core.Dom.append(button.render(), buttonsContainer));
				this.#popover = new main_popup.Popup({
					bindElement: this.#options.bindElement,
					content,
					className: 'crm-notice-popup',
					ariaLabel: this.#options.title,
					width: this.#options.width,
					angle: this.#options.angle,
					autoHide: this.#options.autoHide,
					closeByEsc: this.#options.closeByEsc,
					closeIcon: this.#options.closeIcon,
					cacheable: this.#options.cacheable,
					padding: 0,
					contentPadding: 0,
					events: {
						onPopupDestroy: () => {
							this.#popover = null;
						}
					}
				});
			}
			return this.#popover;
		}
		async #showDialog() {
			const dialog = await this.#getDialog();
			dialog.show();
		}
		#getDialog() {
			if (this.#dialog) {
				return Promise.resolve(this.#dialog);
			}
			this.#dialogLoadPromise ??= main_core.Runtime.loadExtension('ui.system.dialog').then(extensionExports => {
				if (this.#dialog) {
					return this.#dialog;
				}
				const {
					Dialog
				} = extensionExports;
				const body = this.#renderBody();
				main_core.Dom.addClass(body, '--boxed');
				const dialog = new Dialog({
					content: body,
					centerButtons: this.#createButtons(),
					hasOverlay: true,
					hasVerticalPadding: false,
					hasHorizontalPadding: false,
					width: this.#options.width,
					closeByEsc: this.#options.closeByEsc,
					closeByClickOutside: this.#options.autoHide,
					hasCloseButton: this.#options.closeIcon
				});
				dialog.subscribe('onShow', () => {
					this.#handleDialogShow(body);
				});
				dialog.subscribeOnce('onHide', () => {
					this.#dialog = null;
					this.#dialogLoadPromise = null;
				});
				this.#dialog = dialog;
				return dialog;
			});
			return this.#dialogLoadPromise;
		}
		#handleDialogShow(body) {
			const dialogContainer = body.closest('.ui-system-dialog');
			if (dialogContainer) {
				main_core.Dom.addClass(dialogContainer, DIALOG_CLASS_NAME);
				if (main_core.Type.isStringFilled(this.#options.title)) {
					main_core.Dom.attr(dialogContainer, 'aria-label', this.#options.title);
				}
			}
		}
		#renderBody() {
			return main_core.Tag.render`
			<div class="crm-notice-popup__body">
				${this.#renderIllustration()}
				<div class="crm-notice-popup__text">
					${ui_system_typography.Headline.render(this.#options.title, {
			size: 'md',
			align: 'center',
			className: 'crm-notice-popup__title'
		})}
					${ui_system_typography.Text.render(this.#options.text, {
			tag: 'p',
			size: 'lg',
			align: 'center',
			className: 'crm-notice-popup__subtitle'
		})}
				</div>
			</div>
		`;
		}
		#renderIllustration() {
			const illustration = this.#options.illustration;
			const node = main_core.Tag.render`<div class="crm-notice-popup__illustration"></div>`;
			if (!main_core.Type.isStringFilled(illustration)) {
				return node;
			}
			main_core.Dom.addClass(node, `--${illustration}`);
			return node;
		}
		#createButtons() {
			return resolveButtons(this.#options).map(config => {
				const buttonOptions = {
					text: config.text,
					size: ui_buttons.ButtonSize.LARGE,
					style: config.style ? BUTTON_STYLE_MAP[config.style] : ui_buttons.AirButtonStyle.FILLED,
					useAirDesign: true,
					onclick: () => {
						this.#handleButtonClick(config);
						return {};
					}
				};
				return new ui_buttons.Button(buttonOptions);
			});
		}
		#handleButtonClick(config) {
			if (main_core.Type.isFunction(config.onclick)) {
				config.onclick({
					close: () => this.close()
				});
			}
			if (config.closesPopup !== false) {
				this.close();
			}
		}
	}

	exports.NoticePopup = NoticePopup;
	exports.NoticePopupMode = NoticePopupMode;

})(this.BX.Crm = this.BX.Crm || {}, BX, BX.Main, BX.UI, BX.UI.System.Typography);
//# sourceMappingURL=notice-popup.bundle.js.map
