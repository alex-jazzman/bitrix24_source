/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, ui_buttons, ui_bannerDispatcher, ui_system_dialog, ui_system_typography) {
	'use strict';

	const ButtonStyle = Object.freeze({
		Filled: 'filled',
		Plain: 'plain',
		Outline: 'outline'
	});
	class LockPopup {
		#options;
		#dialog = null;
		#contentContainer = null;
		#onDone = null;
		constructor(options = {}) {
			const preparedOptions = {
				title: '',
				content: '',
				buttons: [],
				width: 400,
				hasCloseButton: true,
				closeByEsc: true,
				closeByClickOutside: true,
				hasOverlay: true,
				showIcon: true,
				useQueue: true,
				closeSidePanelOnClose: false,
				emitOnClose: '',
				...options
			};
			preparedOptions.buttons = Array.isArray(options.buttons) ? options.buttons : [];
			this.#options = preparedOptions;
		}
		static show(options = {}) {
			const popup = new this(options);
			popup.show();
			return popup;
		}
		show() {
			if (this.#options.useQueue === false) {
				this.#showDialog();
				return;
			}
			ui_bannerDispatcher.BannerDispatcher.high.toQueue(onDone => {
				this.#onDone = () => {
					onDone();
				};
				this.#showDialog();
				return {};
			});
		}
		hide() {
			this.#dialog?.hide();
		}
		#showDialog() {
			const dialogOptions = {
				title: this.#options.hasCloseButton ? ' ' : '',
				content: this.#renderContent(),
				centerButtons: this.#createButtons(),
				hasOverlay: this.#options.hasOverlay,
				width: this.#options.width,
				hasCloseButton: this.#options.hasCloseButton,
				hasVerticalPadding: false,
				hasHorizontalPadding: false,
				closeByEsc: this.#options.closeByEsc,
				closeByClickOutside: this.#options.closeByClickOutside
			};
			this.#dialog = new ui_system_dialog.Dialog(dialogOptions);
			this.#dialog.subscribe('onShow', () => {
				this.#handleShow();
			});
			this.#dialog.subscribe('onHide', () => {
				this.#handleHide();
			});
			this.#dialog.show();
		}
		#createButtons() {
			return this.#options.buttons.map(buttonOptions => {
				const options = {
					text: buttonOptions.text,
					size: ui_buttons.ButtonSize.LARGE,
					style: this.#getButtonStyle(buttonOptions.style),
					useAirDesign: true,
					onclick: () => {
						this.#handleButtonClick(buttonOptions);
						return {};
					}
				};
				return new ui_buttons.Button(options);
			});
		}
		#getButtonStyle(style) {
			switch (style) {
				case ButtonStyle.Plain:
					return ui_buttons.AirButtonStyle.PLAIN;
				case ButtonStyle.Outline:
					return ui_buttons.AirButtonStyle.OUTLINE;
				case ButtonStyle.Filled:
				default:
					return ui_buttons.AirButtonStyle.FILLED;
			}
		}
		#handleButtonClick(buttonOptions) {
			const {
				onclick,
				url
			} = buttonOptions;
			if (typeof onclick === 'function') {
				onclick();
			}
			if (typeof url === 'string' && url.length > 0 && window.top) {
				window.top.location.href = url;
			}
			if (buttonOptions.closesPopup !== false) {
				this.hide();
			}
		}
		#renderContent() {
			const title = ui_system_typography.Headline.render(this.#options.title, {
				size: 'sm',
				align: 'center',
				className: 'biconnector-lock-popup__title'
			});
			const content = ui_system_typography.Text.render('', {
				tag: 'div',
				size: 'md',
				align: 'center',
				className: 'biconnector-lock-popup__content'
			});
			content.innerHTML = this.#options.content;
			const textBlock = main_core.Tag.render`
			<div class="biconnector-lock-popup__text">
				${title}
				${content}
			</div>
		`;
			const contentContainer = main_core.Tag.render`
			<div class="biconnector-lock-popup">
				${this.#renderIcon()}
				${textBlock}
			</div>
		`;
			this.#contentContainer = contentContainer;
			return contentContainer;
		}
		#renderIcon() {
			if (this.#options.showIcon === false) {
				return '';
			}
			return main_core.Tag.render`<div class="biconnector-lock-popup__icon"></div>`;
		}
		#handleShow() {
			const dialogContainer = this.#contentContainer?.closest('.ui-system-dialog');
			dialogContainer?.classList.add('biconnector-lock-popup-dialog');
			if (this.#options.hasCloseButton) {
				dialogContainer?.classList.add('biconnector-lock-popup-dialog--with-header');
			}
		}
		#handleHide() {
			if (this.#options.closeSidePanelOnClose && BX.SidePanel?.Instance?.isOpen()) {
				BX.SidePanel.Instance.close();
			}
			if (main_core.Type.isStringFilled(this.#options.emitOnClose)) {
				main_core_events.EventEmitter.emit(this.#options.emitOnClose);
			}
			this.#onDone?.();
			this.#onDone = null;
			this.#dialog = null;
		}
	}
	class LimitLockPopup extends LockPopup {}

	exports.LimitLockPopup = LimitLockPopup;
	exports.LockPopup = LockPopup;

})(this.BX.BIConnector = this.BX.BIConnector || {}, BX, BX.Event, BX.UI, BX.UI, BX.UI.System, BX.UI.System.Typography);
//# sourceMappingURL=lock-popup.bundle.js.map
