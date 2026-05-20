/* eslint-disable */
this.BX = this.BX || {};
this.BX.Disk = this.BX.Disk || {};
(function (exports, main_core, ui_infoHelper, ui_feedback_form, disk_promoBoost, disk_popupLimits) {
	'use strict';

	class OnlyOfficePromoActions {
		action = null;
		isCreate = false;
		analytics = null;
		constructor(isCreate = false, analytics = null) {
			this.isCreate = isCreate;
			this.analytics = analytics;
			this.action = this.#getExtensionParam('action');
			this.documentEditSessionLimit = BX.Disk.OnlyOfficeSessionRestrictions.DocumentEditSessionLimit.getInstance();
		}
		shouldShow() {
			return this.#isActionDefined() && (this.#canEditBeRestrictedByTariff() || this.documentEditSessionLimit.isExceeded());
		}
		#canEditBeRestrictedByTariff() {
			return !this.#getExtensionParam('canUseEditByTariff');
		}
		show(target, needOverlay) {
			if (!this.#isActionDefined()) {
				return;
			}
			const actionType = this.action?.type;
			let limitReached = true;
			switch (actionType) {
				case 'slider':
					this.#showSlider();
					break;
				case 'sliderWithPopup':
					this.#showPopupWithSlider(target);
					break;
				case 'form':
					this.#showForm();
					break;
				case 'formWithPopup':
					this.#showPopupWithForm(target);
					break;
				case 'boost':
					this.#showBoostPromo(target, needOverlay);
					break;
				case 'link':
					this.#showPopupWithLink(target);
					break;
				default:
					limitReached = false;
					console.error(`Unknown promo action type: ${actionType}`);
			}
			if (limitReached) {
				this.#notifyLimitReached();
			}
		}
		#notifyLimitReached() {
			main_core.ajax.runAction('disk.api.limitEncounter.documentEditSession', {});
		}
		#isActionDefined() {
			return this.action !== null;
		}
		#showPopupWithSlider(target) {
			if (!target) {
				console.error('OnlyofficePromoActions: target is not defined for slider with popup action');
			}
			const popupLimits = new disk_popupLimits.PopupLimits({
				bindElement: target,
				isLimitEdit: !this.isCreate,
				submitButtonCallback: () => {
					const sliderCode = this.#showSlider();
					if (sliderCode !== '') {
						popupLimits.hide();
						BX.UI.Analytics.sendData({
							tool: 'docs',
							category: 'docs',
							event: 'limit_popup_click',
							type: `sliderId_${sliderCode}`,
							...this.analytics
						});
					}
				}
			});
			popupLimits.show();
			BX.UI.Analytics.sendData({
				tool: 'docs',
				category: 'docs',
				event: 'limit_popup_show',
				...this.analytics
			});
		}
		#showSlider() {
			const sliderCode = this.action?.code || '';
			if (sliderCode === '') {
				return '';
			}
			ui_infoHelper.InfoHelper.show(sliderCode);
			return sliderCode;
		}
		#showForm() {
			ui_feedback_form.Form.open(this.action.params);
		}
		#showPopupWithForm(target) {
			if (!target) {
				console.error('OnlyofficePromoActions: target is not defined for slider with popup action');
			}
			const popupLimits = new disk_popupLimits.PopupLimits({
				bindElement: target,
				isLimitEdit: !this.isCreate,
				submitButtonCallback: () => {
					popupLimits.hide();
					ui_feedback_form.Form.open(this.action.params);
					BX.UI.Analytics.sendData({
						tool: 'docs',
						category: 'docs',
						event: 'limit_popup_click',
						type: 'feedback',
						...this.analytics
					});
				}
			});
			popupLimits.show();
			BX.UI.Analytics.sendData({
				tool: 'docs',
				category: 'docs',
				event: 'limit_popup_show',
				...this.analytics
			});
		}
		#showBoostPromo(target, needOverlay) {
			if (target) {
				const widget = disk_promoBoost.Factory.getSessionBoostWidget().bindTo(target);
				if (needOverlay) {
					widget.setOverlay();
				}
				widget.show();
			} else {
				console.error('OnlyofficePromoActions: target is not defined for boost promo action');
			}
		}
		#showPopupWithLink(target) {
			const url = this.action.params?.url ?? null;
			if (typeof url !== 'string' || url === '') {
				throw new Error('invalid url');
			}
			const popupLimits = new disk_popupLimits.PopupLimits({
				bindElement: target,
				isLimitEdit: !this.isCreate,
				submitButtonCallback: () => {
					const isNewTab = this.action.params?.isNewTab ?? true;
					const urlTarget = isNewTab ? '_blank' : '_self';
					popupLimits.hide();
					window.open(url, urlTarget);
					BX.UI.Analytics.sendData({
						tool: 'docs',
						category: 'docs',
						event: 'limit_popup_click',
						type: 'helpdesk',
						...this.analytics
					});
				}
			});
			popupLimits.show();
			BX.UI.Analytics.sendData({
				tool: 'docs',
				category: 'docs',
				event: 'limit_popup_show',
				...this.analytics
			});
		}
		#getExtensionParam(paramName) {
			return main_core.Extension.getSettings('disk.onlyoffice-promo-actions').get(paramName);
		}
	}

	exports.OnlyOfficePromoActions = OnlyOfficePromoActions;

})(this.BX.Disk.OnlyOfficePromoActions = this.BX.Disk.OnlyOfficePromoActions || {}, BX, BX.UI, BX.UI.Feedback, BX.Disk.PromoBoost, BX.Disk);
//# sourceMappingURL=onlyoffice-promo-actions.bundle.js.map
