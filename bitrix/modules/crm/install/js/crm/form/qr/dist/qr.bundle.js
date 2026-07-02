/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, ui_designTokens, ui_fonts_opensans, main_qrcode, main_core, main_popup) {
	'use strict';

	class Qr {
		#link;
		#qrNode = null;
		#button = null;
		#containerCopyLink = null;
		#containerInputLink = null;
		constructor(options) {
			this.#link = options.link;
		}
		renderTo(target) {
			const button = this.#renderButton();
			target.appendChild(button);
			return button;
		}
		#renderButton() {
			if (!this.#button) {
				this.#button = main_core.Tag.render`
				<button
					type="button"
					class="crm-webform-qr-btn ui-btn ui-btn-xs ui-btn-light-border ui-btn-round ui-btn-no-caps ui-btn-icon-share"
				>
					${main_core.Loc.getMessage('CRM_WEBFORM_QR_OPEN')}
				</button>
			`;
				this.#button.addEventListener("click", e => {
					e.stopPropagation();
					this.show();
				});
			}
			return this.#button;
		}
		#getImageContainer() {
			if (!this.#qrNode) {
				this.#qrNode = main_core.Tag.render`
				<div class="crm-webform__popup-image"></div>
			`;
			}
			return this.#qrNode;
		}
		#getPopup() {
			if (!this.popup) {
				const container = main_core.Tag.render`
				<div class="crm-webform__scope">
					<div class="crm-webform__popup-container --qr">
						<div class="crm-webform__popup-wrapper">
							<div class="crm-webform__popup-content">
								<div class="crm-webform__popup-text">${main_core.Loc.getMessage('CRM_WEBFORM_QR_TITLE')}</div>
								${this.#getImageContainer()}
								<div class="crm-webform__popup-text --sm">
									${main_core.Loc.getMessage('CRM_WEBFORM_QR_DESC')}
								</div>
								<div class="crm-webform__popup-buttons">
									<a href="${this.#link}" target="_blank" class="ui-btn ui-btn-light-border ui-btn-round">
										${main_core.Loc.getMessage('CRM_WEBFORM_QR_TILE_POPUP_OPEN_SITE')}
									</a>
								</div>
							</div>
							<div class="crm-webform__popup-bottom">
								<a href="${this.#link}" target="_blank" class="crm-webform__popup-url">
									${this.#link}
									${this.#getContainerInputLink()}
								</a>
								${this.#getContainerCopyLink()}
							</div>
						</div>
					</div>
				</div>
			`;
				this.popup = new main_popup.Popup({
					className: 'crm-webform__status-popup',
					content: container,
					bindElement: window,
					width: 405,
					minWidth: 220,
					closeByEsc: true,
					autoHide: true,
					animation: 'fading-slide',
					closeIcon: true,
					padding: 0
				});
			}
			return this.popup;
		}
		show() {
			this.#renderImage();
			if (!this.#getPopup().isShown()) {
				this.#getPopup().show();
			}
		}
		close() {
			if (this.#getPopup().isShown()) {
				this.#getPopup().close();
			}
		}
		#renderImage() {
			if (!this.#qrNode) {
				new QRCode(this.#getImageContainer(), {
					text: this.#link,
					width: 250,
					height: 250
				});
			}
		}
		#getContainerInputLink() {
			if (!this.#containerInputLink) {
				this.#containerInputLink = main_core.Tag.render`
				<input 
					type="text" 
					style="position: absolute; opacity: 0; pointer-events: none"
					value="${this.#link}">
			`;
			}
			return this.#containerInputLink;
		}
		#getContainerCopyLink() {
			if (!this.#containerCopyLink) {
				this.#containerCopyLink = main_core.Tag.render`
				<div class="crm-webform__popup-copy">
					${main_core.Loc.getMessage('CRM_WEBFORM_QR_TILE_POPUP_COPY_LINK')}
				</div>
			`;
				main_core.Event.bind(this.#containerCopyLink, 'click', () => {
					this.#getContainerInputLink().select();
					document.execCommand('copy');
					BX.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('CRM_WEBFORM_QR_TILE_POPUP_COPY_LINK_COMPLETE'),
						autoHideDelay: 2000
					});
				});
			}
			return this.#containerCopyLink;
		}
	}

	exports.Qr = Qr;

})(this.BX.Crm.Form = this.BX.Crm.Form || {}, BX, BX, BX, BX, BX.Main);
//# sourceMappingURL=qr.bundle.js.map
