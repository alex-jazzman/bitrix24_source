/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_popup, ui_buttons, ui_system_typography) {
	'use strict';

	class PopupRequestInstall {
		#popup = null;
		#icon;
		#appName;
		#onConfirm;
		#onComplete;
		#confirmButton = null;
		#cancelButton = null;
		constructor(options = {}) {
			this.#icon = main_core.Type.isStringFilled(options.icon) ? options.icon : '';
			this.#appName = main_core.Type.isStringFilled(options.appName) ? options.appName : '';
			this.#onConfirm = main_core.Type.isFunction(options.onConfirm) ? options.onConfirm : () => {};
			this.#onComplete = main_core.Type.isFunction(options.onComplete) ? options.onComplete : () => {};
		}
		show() {
			const popup = this.#getPopup();
			this.#setLoading(false);
			popup.show();
		}
		#setLoading(loading) {
			if (this.#confirmButton) {
				this.#confirmButton.setWaiting(loading);
			}
			if (this.#cancelButton) {
				this.#cancelButton.setDisabled(loading);
			}
		}
		#handleConfirm() {
			this.#setLoading(true);
			const complete = () => {
				this.#setLoading(false);
				this.close();
				this.#onComplete();
			};
			Promise.resolve(this.#onConfirm()).then(complete).catch(complete);
		}
		close() {
			if (this.#popup) {
				this.#popup.close();
			}
		}
		#getPopup() {
			if (this.#popup) {
				return this.#popup;
			}
			const content = main_core.Tag.render`
			<div class="market-popup-request" data-test-id="market_popup-request-install">
				<div class="market-popup-request__illustration">
					<div class="market-popup-request__icon">
						<img class="market-popup-request__icon-img" alt="">
					</div>
					<div class="market-popup-request__badge"></div>
				</div>
				${ui_system_typography.Headline.render(main_core.Loc.getMessage('MARKET_POPUP_REQUEST_INSTALL_TITLE'), {
			size: 'md'
		})}
				${ui_system_typography.Text.render(main_core.Loc.getMessage('MARKET_POPUP_REQUEST_INSTALL_TEXT'), {
			size: 'lg',
			className: 'market-popup-request__text',
			tag: 'div'
		})}
			</div>
		`;
			const iconNode = content.querySelector('.market-popup-request__icon-img');
			if (iconNode) {
				if (this.#icon) {
					iconNode.src = this.#icon;
				}
				iconNode.alt = this.#appName;
			}
			this.#cancelButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('MARKET_POPUP_REQUEST_INSTALL_CANCEL'),
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.OUTLINE_NO_ACCENT,
				size: ui_buttons.ButtonSize.LARGE,
				dataset: {
					testId: 'market_popup-request-install__cancel-button'
				},
				events: {
					click: button => {
						button.getContext().close();
					}
				}
			});
			this.#confirmButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('MARKET_POPUP_REQUEST_INSTALL_CONFIRM'),
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.FILLED,
				size: ui_buttons.ButtonSize.LARGE,
				dataset: {
					testId: 'market_popup-request-install__submit-button'
				},
				events: {
					click: () => {
						this.#handleConfirm();
					}
				}
			});
			this.#popup = new main_popup.Popup({
				className: 'market-popup-request-window',
				content,
				overlay: true,
				closeIcon: true,
				autoHide: true,
				closeByEsc: true,
				width: 480,
				borderRadius: 20,
				padding: 24,
				buttons: [this.#confirmButton, this.#cancelButton],
				ariaLabel: main_core.Loc.getMessage('MARKET_POPUP_REQUEST_INSTALL_TITLE')
			});
			this.#confirmButton.setContext(this.#popup);
			this.#cancelButton.setContext(this.#popup);
			return this.#popup;
		}
	}

	exports.PopupRequestInstall = PopupRequestInstall;

})(this.BX.Market = this.BX.Market || {}, BX, BX.Main, BX.UI, BX.UI.System.Typography);
