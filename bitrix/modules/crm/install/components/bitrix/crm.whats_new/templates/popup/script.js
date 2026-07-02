/* eslint-disable */
(function (main_core, main_popup, crm_integration_ui_bannerDispatcher) {
	'use strict';

	const namespaceCrmWhatsNew = main_core.Reflection.namespace('BX.Crm.WhatsNew');
	class RichPopup {
		#popup;
		#data;
		#options;
		#bannerDispatcher;
		#userOptionCategory;
		#userOptionName;
		constructor({
			data,
			options,
			userOptionCategory,
			userOptionName
		}) {
			this.#popup = null;
			this.#data = data;
			this.#options = main_core.Type.isObject(options) ? options : {};
			this.#userOptionCategory = main_core.Type.isString(userOptionCategory) ? userOptionCategory : 'crm';
			this.#userOptionName = main_core.Type.isString(userOptionName) ? userOptionName : '';
			if (main_core.Type.isNumber(options.entityTypeId) && main_core.Type.isStringFilled(this.#userOptionName)) {
				this.#userOptionName = `${this.#userOptionName}${options.entityTypeId}`;
			}
			this.#bannerDispatcher = new crm_integration_ui_bannerDispatcher.BannerDispatcher();
		}
		show() {
			const isAnyPopupShown = main_popup.PopupManager && main_popup.PopupManager.isAnyPopupShown();
			const isAnySliderShown = BX.SidePanel.Instance.getOpenSlidersCount() > 0;
			if (isAnyPopupShown || isAnySliderShown) {
				return;
			}
			if (!this.#popup) {
				const htmlStyles = getComputedStyle(document.documentElement);
				const popupPadding = htmlStyles.getPropertyValue('--ui-space-inset-sm');
				const popupPaddingNumberValue = parseFloat(popupPadding) || 12;
				const popupOverlayColor = htmlStyles.getPropertyValue('--ui-color-base-solid') || '#000000';
				this.#popup = new main_popup.Popup({
					className: 'crm-rich-popup-wrapper',
					closeIcon: true,
					closeByEsc: true,
					cacheable: false,
					padding: popupPaddingNumberValue,
					overlay: {
						opacity: 40,
						backgroundColor: popupOverlayColor
					},
					content: this.#getPopupContent(),
					width: 640,
					height: 400,
					events: {
						onPopupClose: () => {
							this.save();
						}
					}
				});
				this.#bannerDispatcher.toQueue(onDone => {
					this.#popup.subscribe('onClose', onDone);
					this.#popup.show();
				});
			}
		}
		#getPopupContent() {
			return main_core.Tag.render`
			<div class="crm-rich-popup-slide">
				<img src="${this.#data.innerImage}" alt="">
				<div class="crm-rich-popup-slide-inner-title"> ${this.#data.innerTitle} </div>
				<div class="crm-rich-popup-slide-inner-subtitle"> ${this.#data.innerSubTitle} </div>
				<div class="crm-rich-popup-slide-inner-description">${this.#data.innerDescription}</div>
				<div class="crm-rich-popup-slide-inner-info">${this.#data.innerInfo}</div>
			</div>
		`;
		}
		save() {
			BX.userOptions.save(this.#userOptionCategory, this.#userOptionName, 'count', this.#options.checkpoint);
		}
	}
	namespaceCrmWhatsNew.RichPopup = RichPopup;

})(BX, BX.Main, BX.Crm.Integration.UI);
//# sourceMappingURL=script.js.map
