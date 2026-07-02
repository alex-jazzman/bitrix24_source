/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_system_dialog, ui_system_typography) {
	'use strict';

	class LoadingPopup {
		#isPopupClosedByUser = false;
		#loadingPopup = null;
		#loadingMessage;
		#errorMessage;
		#popupOptions;
		#callbacks;
		constructor(options = {}) {
			this.#loadingMessage = options.loadingMessage || main_core.Loc.getMessage('BICONNECTOR_LOADING_POPUP_LOAD_MESSAGE');
			this.#errorMessage = options.errorMessage || main_core.Loc.getMessage('BICONNECTOR_LOADING_POPUP_LOAD_ERROR');
			const defaultOptions = this.#getDefaultPopupOptions();
			this.#popupOptions = {
				...defaultOptions,
				...options.popupOptions
			};
			this.#callbacks = options.callbacks;
		}
		showLoadPopup() {
			this.#isPopupClosedByUser = false;
			this.#loadingPopup = new ui_system_dialog.Dialog(this.#popupOptions);
			this.#loadingPopup.show();
			this.#callbacks.loadData().then(result => {
				if (this.#isPopupClosedByUser) {
					return;
				}
				this.#hideLoadingPopup();
				if (this.#callbacks.checkData(result)) {
					this.#callbacks.onSuccess();
				} else {
					this.#callbacks.onFail();
				}
			}).catch(() => {
				this.#hideLoadingPopup();
				BX.UI.Notification.Center.notify({
					content: this.#errorMessage
				});
			});
		}
		#hideLoadingPopup() {
			if (this.#loadingPopup) {
				this.#loadingPopup.hide();
				this.#loadingPopup = null;
			}
		}
		#getDefaultPopupOptions() {
			return {
				content: this.#getContent(),
				width: 400,
				height: 176,
				title: ' ',
				hasCloseButton: true,
				hasOverlay: true,
				disableScrolling: false,
				hasVerticalPadding: false,
				hasHorizontalPadding: false,
				events: {
					onHide: () => {
						this.#isPopupClosedByUser = true;
					}
				}
			};
		}
		#getContent() {
			const loadingText = ui_system_typography.Text.render(this.#loadingMessage, {
				size: 'sm'
			});
			return main_core.Tag.render`
			<div class="biconnector-loading-popup">
				<div class="biconnector-loading-popup-spinner-wrapper">
					<img
						class="biconnector-loading-popup-spinner"
						src="/bitrix/js/biconnector/loading-popup/src/images/spinner.png"
						alt="Loading"
					/>
				</div>
				<div class="biconnector-loading-popup-text">
					${loadingText}
				</div>
			</div>
		`;
		}
	}

	exports.LoadingPopup = LoadingPopup;

})(this.BX.BIConnector = this.BX.BIConnector || {}, BX, BX.UI.System, BX.UI.System.Typography);
