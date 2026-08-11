/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_popup, ui_buttons, ui_infoHelper) {
	'use strict';

	class PopupLimits {
		popupId;
		isLimitEdit = false;
		submitButton;
		popup = null;
		increaseLimitRequestButton = null;
		partnerButtonId = 'popup-limits-partner-button-';
		isCloud;
		constructor(options) {
			this.isCloud = options.isCloud;
			this.popupId = options.popupId || String(Math.random());
			this.partnerButtonId += String(Math.random());
			this.isLimitEdit = options.isLimitEdit === true;
			this.submitButton = this.initSubmitButton(options.submitButtonCallback);
			if (main_core.Type.isFunction(options.increaseLimitRequestButtonCallback)) {
				this.increaseLimitRequestButton = this.initIncreaseLimitRequestButton(options.increaseLimitRequestButtonCallback);
			}
		}
		getPopupId() {
			return this.popupId;
		}
		getPopup() {
			return this.popup;
		}
		renderPopupContent() {
			return main_core.Tag.render`
			<div class="disk-popup-limits__content">
				<div class="disk-popup-limits__content_main">
					<div class="disk-popup-limits__content_text">
						${this.getText()}
					</div>
					<div class="disk-popup-limits__content_icon-box">
						<div class="disk-popup-limits__content_icon"></div>
					</div>
				</div>
				<div class="disk-popup-limits__content_footer">
					${this.submitButton.render()}
					${this.increaseLimitRequestButton?.render()}
				</div>
			</div>
		`;
		}
		getText() {
			if (this.isCloud) {
				const replacements = {
					'[partner_link]': `<a href="#" id="${this.partnerButtonId}">`,
					'[/partner_link]': '</a>'
				};
				if (this.isLimitEdit) {
					return main_core.Loc.getMessage('DISK_POPUP_LIMITS_EDIT_CLOUD', replacements) ?? '';
				}
				return main_core.Loc.getMessage('DISK_POPUP_LIMITS_DOCUMENT_CREATE_CLOUD', replacements) ?? '';
			}
			if (this.isLimitEdit) {
				return main_core.Loc.getMessage('DISK_POPUP_LIMITS_EDIT') ?? '';
			}
			return main_core.Loc.getMessage('DISK_POPUP_LIMITS_DOCUMENT_CREATE') ?? '';
		}
		createPopup() {
			this.popup = new main_popup.Popup({
				id: this.popupId,
				titleBar: this.isLimitEdit ? main_core.Loc.getMessage('DISK_POPUP_LIMITS_TITLE_EDIT') ?? '' : main_core.Loc.getMessage('DISK_POPUP_LIMITS_TITLE_DOCUMENT_CREATE') ?? '',
				cacheable: true,
				closeIcon: true,
				className: 'disk-popup-limits',
				content: this.renderPopupContent(),
				width: 664,
				padding: 0,
				autoHide: true,
				events: {
					onAfterPopupShow: () => this.initPartnerButton(),
					onPopupAfterClose: () => {
						this.popup?.destroy();
						this.popup = null;
					}
				}
			});
			return this.popup;
		}
		initSubmitButton(callback) {
			return new ui_buttons.Button({
				useAirDesign: true,
				text: this.getSubmitButtonText(),
				round: true,
				noCaps: true,
				collapsedIcon: '',
				size: ui_buttons.ButtonSize.MEDIUM,
				style: ui_buttons.AirButtonStyle.FILLED,
				onclick: callback ?? (() => ({}))
			});
		}
		getSubmitButtonText() {
			if (this.isCloud) {
				return main_core.Loc.getMessage('DISK_POPUP_LIMITS_SUBMIT_BTN_CLOUD') ?? '';
			}
			return main_core.Loc.getMessage('DISK_POPUP_LIMITS_SUBMIT_BTN') ?? '';
		}
		initIncreaseLimitRequestButton(callback) {
			return new ui_buttons.Button({
				useAirDesign: true,
				text: main_core.Loc.getMessage('DISK_POPUP_LIMITS_WRITE_TO_MANAGER_BTN') ?? '',
				round: true,
				noCaps: true,
				collapsedIcon: '',
				size: ui_buttons.ButtonSize.MEDIUM,
				style: ui_buttons.AirButtonStyle.OUTLINE,
				onclick: callback
			});
		}
		initPartnerButton() {
			const partnerButton = document.getElementById(this.partnerButtonId);
			if (partnerButton !== null) {
				main_core.Event.bind(partnerButton, 'click', event => {
					event.preventDefault();
					ui_infoHelper.InfoHelper.show('info_implementation_request_boost');
					this.hide();
				});
			}
		}
		show(bindElement) {
			if (this.popup === null) {
				this.createPopup();
			}
			this.popup?.setBindElement(bindElement);
			this.popup?.show();
		}
		hide() {
			this.popup?.close();
		}
	}

	exports.PopupLimits = PopupLimits;

})(this.BX.Disk = this.BX.Disk || {}, BX, BX.Main, BX.UI, BX.UI);
//# sourceMappingURL=popup-limits.bundle.js.map
