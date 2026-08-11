/* eslint-disable */
this.BX = this.BX || {};
this.BX.Disk = this.BX.Disk || {};
(function (exports, main_core, ui_analytics, ui_feedback_form, ui_infoHelper, disk_onlyofficeSessionRestrictions, disk_popupLimits, disk_promoBoost, im_public) {
	'use strict';

	class ChatWithManager {
		increaseLimitRequest;
		isCreate;
		constructor(isCreate, increaseLimitRequest) {
			this.isCreate = isCreate;
			this.increaseLimitRequest = increaseLimitRequest;
		}
		canOpen() {
			return this.increaseLimitRequest !== null && this.increaseLimitRequest.chatId > 0;
		}
		getOpenHandler() {
			if (this.increaseLimitRequest === null) {
				throw new Error('No increase limit request');
			}
			return async () => {
				const dialogId = this.increaseLimitRequest?.dialogId;
				if (main_core.Type.isStringFilled(dialogId)) {
					if (this.isCreate) {
						await this.openInCurrentTab(dialogId);
					} else {
						await this.openInNewTab(dialogId);
					}
				}
				return {};
			};
		}
		async openInCurrentTab(dialogId) {
			await im_public.Messenger.openChat(dialogId);
			if (im_public.Messenger.isChatOpened(dialogId)) {
				const chatId = this.increaseLimitRequest?.chatId;
				if (main_core.Type.isNumber(chatId)) {
					await this.prefillMessage(im_public.Messenger, chatId);
				}
			}
		}
		async openInNewTab(dialogId) {
			const chatWindow = window.open(`/online/?IM_DIALOG=${dialogId}`, '_blank');
			if (!chatWindow) {
				console.error('Unable to open tab. The browser may have blocked the popup.');
				return;
			}
			try {
				const result = await this.waitForResult(this.createNewTabChatResolver(chatWindow, dialogId));
				const {
					messenger,
					chatId
				} = result;
				await this.prefillMessage(messenger, chatId);
				chatWindow.focus();
			} catch (error) {
				console.error('Failed to insert text into chat:', error);
			}
		}
		async waitForResult(check, {
			attempts = 120,
			delay = 100
		} = {}) {
			for (let i = 0; i < attempts; i++) {
				const result = check();
				if (result) {
					return result;
				}
				await new Promise(resolve => {
					setTimeout(resolve, delay);
				});
			}
			throw new Error('Timeout!');
		}
		createNewTabChatResolver(chatWindow, dialogId) {
			return () => {
				const BX = chatWindow.BX;
				const messenger = BX?.Messenger?.Public;
				const core = BX?.Messenger?.v2?.Application?.Core;
				const store = core?.getStore?.();
				const chat = store?.getters?.['chats/get']?.(dialogId);
				if (messenger && chat?.chatId) {
					return {
						messenger,
						chatId: chat.chatId
					};
				}
				return null;
			};
		}
		async prefillMessage(messenger, chatId) {
			const text = await messenger.textarea.getText(chatId);
			if (!main_core.Type.isStringFilled(text)) {
				const replacements = {
					'[buy_link]': `[URL=${this.increaseLimitRequest?.buyLink}]`,
					'[/buy_link]': '[/URL]'
				};
				const insertText = (this.isCreate ? main_core.Loc.getMessage('DISK_OPA_CREATE_MANAGER_TEXT', replacements) : main_core.Loc.getMessage('DISK_OPA_EDIT_MANAGER_TEXT', replacements)) || '';
				messenger.textarea.insertText(chatId, insertText);
			}
		}
	}

	class OnlyOfficePromoActions {
		action = null;
		isCreate = false;
		analytics = null;
		documentEditSessionLimit;
		isCloud;
		constructor(isCreate = false, analytics = null) {
			this.isCreate = isCreate;
			this.analytics = analytics;
			this.action = this.#getExtensionParam('action');
			this.documentEditSessionLimit = disk_onlyofficeSessionRestrictions.DocumentEditSessionLimit.getInstance();
			this.isCloud = this.#getExtensionParam('isCloud');
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
			this.#getPopupLimitsWithSlider().show(target);
			ui_analytics.sendData({
				tool: 'docs',
				category: 'docs',
				event: 'limit_popup_show',
				...this.analytics
			});
		}
		#getPopupLimitsWithSlider() {
			const chatWithManager = new ChatWithManager(this.isCreate, this.action?.params?.increaseLimitRequest || null);
			const popup = new disk_popupLimits.PopupLimits({
				isCloud: this.isCloud,
				popupId: String(Math.random()),
				isLimitEdit: !this.isCreate,
				submitButtonCallback: () => {
					const sliderCode = this.#showSlider();
					if (sliderCode !== '') {
						popup.hide();
						ui_analytics.sendData({
							tool: 'docs',
							category: 'docs',
							event: 'limit_popup_click',
							type: `sliderId_${sliderCode}`,
							...this.analytics
						});
					}
					return {};
				},
				...(chatWithManager.canOpen() ? {
					increaseLimitRequestButtonCallback: chatWithManager.getOpenHandler()
				} : {})
			});
			return popup;
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
			const formOptions = this.action?.params?.formOptions;
			if (main_core.Type.isUndefined(formOptions)) {
				console.error('OnlyofficePromoActions: form options is required');
				return;
			}
			ui_feedback_form.Form.open(formOptions);
		}
		#showPopupWithForm(target) {
			if (!target) {
				console.error('OnlyofficePromoActions: target is not defined for form with popup action');
			}
			const formOptions = this.action?.params?.formOptions;
			if (main_core.Type.isUndefined(formOptions)) {
				console.error('OnlyofficePromoActions: form options is required');
				return;
			}
			const popupLimits = new disk_popupLimits.PopupLimits({
				isCloud: this.isCloud,
				popupId: String(Math.random()),
				isLimitEdit: !this.isCreate,
				submitButtonCallback: () => {
					popupLimits.hide();
					ui_feedback_form.Form.open(formOptions);
					ui_analytics.sendData({
						tool: 'docs',
						category: 'docs',
						event: 'limit_popup_click',
						type: 'feedback',
						...this.analytics
					});
					return {};
				}
			});
			popupLimits.show(target);
			ui_analytics.sendData({
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
			const url = this.action?.params?.url ?? null;
			if (!main_core.Type.isStringFilled(url)) {
				throw new Error('invalid url');
			}
			this.#getPopupLimitsWithLink(url).show(target);
			ui_analytics.sendData({
				tool: 'docs',
				category: 'docs',
				event: 'limit_popup_show',
				...this.analytics
			});
		}
		#getPopupLimitsWithLink(url) {
			const popup = new disk_popupLimits.PopupLimits({
				isCloud: this.isCloud,
				popupId: String(Math.random()),
				isLimitEdit: !this.isCreate,
				submitButtonCallback: () => {
					const isNewTab = this.action?.params?.isNewTab ?? true;
					const urlTarget = isNewTab ? '_blank' : '_self';
					popup.hide();
					window.open(url, urlTarget);
					ui_analytics.sendData({
						tool: 'docs',
						category: 'docs',
						event: 'limit_popup_click',
						type: 'helpdesk',
						...this.analytics
					});
					return {};
				}
			});
			return popup;
		}
		#getExtensionParam(paramName) {
			return main_core.Extension.getSettings('disk.onlyoffice-promo-actions').get(paramName);
		}
	}

	exports.OnlyOfficePromoActions = OnlyOfficePromoActions;

})(this.BX.Disk.OnlyOfficePromoActions = this.BX.Disk.OnlyOfficePromoActions || {}, BX, BX.UI.Analytics, BX.UI.Feedback, BX.UI, BX.Disk.OnlyOfficeSessionRestrictions, BX.Disk, BX.Disk.PromoBoost, BX.Messenger.v2.Lib);
//# sourceMappingURL=onlyoffice-promo-actions.bundle.js.map
