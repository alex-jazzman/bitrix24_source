/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_popup, main_core_events, main_polyfill_intersectionobserver, ui_analytics, ui_buttons, ui_notification, ui_infoHelper, ui_bannerDispatcher, ui_notificationPanel, ui_iconSet_api_core) {
	'use strict';

	class MarketItem {
		#name;
		#icon;
		constructor(options) {
			this.#name = options.name;
			this.#icon = options.icon;
		}
		getContainer() {
			return main_core.Tag.render`
			<span class="rest-market-item">
				${this.renderIcon()}
				<span class="rest-market-item__name" title="${this.getName()}">${this.getName()}</span>
			</span>
		`;
		}
		renderTo(node) {
			main_core.Dom.append(this.getContainer(), node);
		}
		getName() {
			return this.#name;
		}
		renderIcon() {
			if (!this.#icon) {
				return main_core.Tag.render`
				<div class="rest-market-item__icon-container">
					<div class="ui-icon-set --cube-plus rest-market-item__icon"></div>
				</div>
			`;
			}
			return main_core.Tag.render`
			<div class="rest-market-item__icon-container" 
				style="
					background-image: url(${this.#icon});
					background-size: cover;
				">
			</div>
		`;
		}
	}

	class MarketList {
		#items;
		#title;
		#link;
		#count;
		#onClick;
		constructor(options) {
			this.#items = main_core.Type.isArray(options.items) ? options.items : [];
			this.#title = options.title;
			this.#link = options.link;
			this.#count = options.count;
			this.#onClick = options.onClick;
		}
		render() {
			return main_core.Tag.render`
			<div class="rest-market-list">
				<div class="rest-market-list__header">
					<span class="rest-market-list__title">${this.#title}</span>
					<a class="rest-market-list__link" href="${this.#link}" onclick="${this.#onClick}">
						${main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_MARKET_LIST_LINK', {
			'#COUNT#': this.#count
		})}
					</a>
				</div>
				${this.#renderList()}
			</div>
		`;
		}
		#renderList() {
			if (this.#items.length === 0) {
				return '';
			}
			const listContainer = main_core.Tag.render`
			<div class="rest-market-list__container"></div>
		`;
			this.#items.forEach(item => {
				item.renderTo(listContainer);
			});
			return listContainer;
		}
	}

	class DiscountEar {
		getContainer() {
			throw new Error('Not implemented');
		}
	}

	class PopupType {
		static FINAL = 'FINAL';
		static WARNING = 'WARNING';
	}

	class PopupCategory {
		static TRANSITION = 'transition';
		static SUBSCRIPTION = 'subscription';
		static TRIAL = 'trial';
	}

	class Analytic {
		constructor(context) {
			this.context = context;
		}
		sendShow() {
			this.#send({
				tool: 'infohelper',
				category: 'market',
				event: 'show_popup'
			});
		}
		sendClickButton(button) {
			this.#send({
				tool: 'infohelper',
				category: 'market',
				event: 'click_button',
				c_element: button
			});
		}
		sendDemoActivated() {
			this.#send({
				tool: 'intranet',
				category: 'demo',
				event: 'market_demo_activated'
			});
		}
		#send(options) {
			ui_analytics.sendData({
				...options,
				type: this.#getType(),
				p1: this.#getP1()
			});
		}
		#getType() {
			let type = this.context.popupType === PopupType.WARNING ? 'pre_disconnection_alert' : 'post_disconnection_notice';
			if (this.context.popupCategory === PopupCategory.TRIAL) {
				type = `${type}_demo`;
			}
			return type;
		}
		#getP1() {
			return `discount_${this.context.withDiscount ? 'Y' : 'N'}`;
		}
	}

	class MarketExpiredPopup extends main_core_events.EventEmitter {
		#popup = null;
		#container = null;
		#appList;
		#integrationList;
		#analytic;
		constructor(options) {
			super();
			this.setEventNamespace('Rest.MarketExpired:Popup');
			this.expireDate = options.expireDate;
			this.#appList = options.appList;
			this.#integrationList = options.integrationList;
			this.withDemo = options.withDemo;
			this.olWidgetCode = options.olWidgetCode;
			this.#analytic = options.analytic;
			this.type = options.type;
			this.expireDays = options.expireDays;
			this.discountEar = options.discountEar;
			this.isRenamedMarket = options.isRenamedMarket;
		}
		getTitle() {
			throw new Error('Not implemented');
		}
		getCategory() {
			throw new Error('Not implemented');
		}
		show() {
			this.#popup ??= main_popup.PopupWindowManager.create(`marketExpiredPopup_${this.getCategory()}_${this.type}`, null, {
				animation: {
					showClassName: 'rest-market-expired-popup__show',
					closeAnimationType: 'animation'
				},
				overlay: true,
				content: this.#getContent(),
				disableScroll: true,
				padding: 0,
				className: 'rest-market-expired-popup-wrapper',
				closeByEsc: true,
				events: {
					onClose: this.onClose.bind(this),
					onShow: this.onOpen.bind(this)
				}
			});
			const observerCallback = (entries, observer) => {
				entries.forEach(entry => {
					if (!entry.isIntersecting) {
						this.#popup.setDisableScroll(false);
						observer.unobserve(entry.target);
					}
				});
			};
			const observer = new IntersectionObserver(observerCallback, {
				root: null,
				rootMargin: '0px',
				threshold: [0, 1]
			});
			observer.observe(this.#popup.getContentContainer().querySelector('.rest-market-expired-popup__close-icon'));
			observer.observe(this.#popup.getContentContainer().querySelector('.rest-market-expired-popup__button-container'));
			this.#popup?.show();
			this.#analytic?.sendShow();

			// hack for blur
			if (this.discountEar) {
				if (this.#popup.getContentContainer().querySelector('.rest-market-expired-popup__content-wrapper').offsetHeight < window.innerHeight) {
					main_core.Dom.style(this.#getContainer(), {
						maxHeight: `${this.discountEar.getContainer().offsetHeight}px`
					});
				} else {
					main_core.Dom.style(this.#popup.getContentContainer().parentNode, {
						'backdrop-filter': 'none',
						'-webkit-backdrop-filter': 'none'
					});
				}
				this.#popup.adjustPosition();
			}
		}
		close() {
			this.#popup.close();
		}
		onClose() {
			this.emit('onClose');
		}
		onOpen() {
			this.emit('onOpen');
		}
		renderDescription() {
			return null;
		}
		renderButtons() {
			return null;
		}
		renderAboutLink() {
			return '';
		}
		getAnalytic() {
			return this.#analytic;
		}
		getCopilotReplacements() {
			return {
				'#COPILOT_NAME#': main_core.Extension.getSettings('rest.market-expired')?.copilotName ?? ''
			};
		}
		#getContent() {
			return main_core.Tag.render`
			<div class="rest-market-expired-popup">
				${this.#getContainer()}
			</div>
		`;
		}
		#getContainer() {
			this.#container ??= main_core.Tag.render`
			<div class="rest-market-expired-popup__container">
				${this.discountEar?.getContainer()}
				<div class="rest-market-expired-popup__content-wrapper">
					<div class="rest-market-expired-popup__content">
						<span class="rest-market-expired-popup__title">${this.getTitle()}</span>
						${this.renderDescription()}
						${this.renderAboutLink()}
						${this.renderButtons()}
					</div>
					${this.#renderMarketList()}
					${this.#renderCloseIcon()}
				</div>
			</div>
		`;
			return this.#container;
		}
		#renderCloseIcon() {
			const onClick = () => {
				this.#popup.close();
				this.#analytic?.sendClickButton('cancel');
			};
			return main_core.Tag.render`
			<div class="rest-market-expired-popup__close-icon ui-icon-set --cross-30" onclick="${onClick}"></div>
		`;
		}
		#renderMarketList() {
			return main_core.Tag.render`
			<aside class="rest-market-expired-popup__aside">
				${this.#appList?.render()}
				${this.#integrationList?.render()}
			</aside>
		`;
		}
	}

	class MarketPopupButton extends main_core_events.EventEmitter {
		constructor(options) {
			super();
			this.setEventNamespace('BX.Rest.MarketExpired.Button');
			this.text = options.text;
			this.onSuccess = options.onSuccess;
		}
		render() {
			return this.getButton().render();
		}
		getButtonConfig() {
			return {};
		}
		onClick() {
			this.onSuccess?.();
		}
		getButton() {
			this.button ??= new ui_buttons.Button({
				...this.getButtonConfig(),
				className: 'rest-market-expired-popup__button',
				text: this.text,
				onclick: this.onClick.bind(this)
			});
			return this.button;
		}
	}

	class SubscribeButton extends MarketPopupButton {
		getButtonConfig() {
			return {
				id: 'marketExpiredPopup_button_subscribe',
				size: ui_buttons.Button.Size.MEDIUM,
				color: ui_buttons.Button.Color.SUCCESS,
				noCaps: true,
				round: true,
				tag: ui_buttons.Button.Tag.LINK,
				link: this.#getSubscribeLink()
			};
		}
		onClick() {
			this.analytic?.sendClickButton('buy');
			super.onClick();
		}
		#getSubscribeLink() {
			return main_core.Extension.getSettings('rest.market-expired')?.marketSubscriptionUrl ?? '';
		}
	}

	class HideButton extends MarketPopupButton {
		getButtonConfig() {
			return {
				id: 'marketExpiredPopup_button_hide',
				size: ui_buttons.Button.Size.EXTRA_SMALL,
				color: ui_buttons.Button.Color.LINK,
				noCaps: true
			};
		}
		onClick() {
			this.analytic?.sendClickButton('ok');
			super.onClick();
		}
	}

	class MarketTrialPopup extends MarketExpiredPopup {
		getCategory() {
			return PopupCategory.TRIAL;
		}
		renderDescription() {
			return main_core.Tag.render`
			<div class="rest-market-expired-popup__description">
				<p class="rest-market-expired-popup__description-text">
					${this.isRenamedMarket ? main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_DESCRIPTION_TRIAL_BITRIX_GPT_MSGVER_1', {
			...this.getCopilotReplacements(),
			'[br]': '<br>'
		}) : main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_DESCRIPTION_TRIAL_MARKET_PLUS')}
				</p>
			</div>
		`;
		}
		getTitle() {
			const replacements = {
				...this.getCopilotReplacements(),
				'#DAYS#': this.expireDays
			};
			if (this.type === PopupType.FINAL) {
				return this.isRenamedMarket ? main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_TITLE_TRIAL_FINAL_BITRIX_GPT', replacements) : main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_TITLE_TRIAL_FINAL_MARKET_PLUS', replacements);
			}
			return this.isRenamedMarket ? main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_TITLE_TRIAL_WARNING_BITRIX_GPT_MSGVER_1', replacements) : main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_TITLE_TRIAL_WARNING_MARKET_PLUS', replacements);
		}
		renderButtons() {
			return main_core.Tag.render`
			<div class="rest-market-expired-popup__buttons-wrapper">
				<div class="rest-market-expired-popup__button-container">
					${this.#getSubscribeButton().render()}
					${this.#getHideButton().render()}
				</div>
			</div>
		`;
		}
		onOpen() {
			if (this.type === PopupType.FINAL) {
				BX.userOptions.save('rest', 'marketSubscriptionPopupDismiss', null, 'Y');
			} else {
				BX.userOptions.save('rest', 'marketSubscriptionPopupTs', null, Math.floor(Date.now() / 1000));
			}
			super.onOpen();
		}
		renderAboutLink() {
			const onclick = () => {
				BX.Helper.show('redirect=detail&code=17451118');
				this.getAnalytic()?.sendClickButton('details');
			};
			return main_core.Tag.render`
			<span class="rest-market-expired-popup__details">
				<a
					class="ui-link rest-market-expired-popup__link"
					href="#"
					onclick="${onclick}"
				>
					${main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_DETAILS')}
				</a>
			</span>
		`;
		}
		#getSubscribeButton() {
			return new SubscribeButton({
				text: main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_BUTTON_SUBSCRIBE'),
				analytic: this.getAnalytic()
			});
		}
		#getHideButton() {
			return new HideButton({
				text: main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_BUTTON_NEVER_SHOW_AGAIN'),
				onSuccess: () => {
					BX.userOptions.save('rest', 'marketSubscriptionPopupDismiss', null, 'Y');
					this.close();
				},
				analytic: this.getAnalytic()
			});
		}
	}

	class MarketSubscriptionPopup extends MarketExpiredPopup {
		getCategory() {
			return PopupCategory.SUBSCRIPTION;
		}
		getTitle() {
			const replacements = {
				...this.getCopilotReplacements(),
				'#DAYS#': this.expireDays
			};
			if (this.type === PopupType.FINAL) {
				return this.isRenamedMarket ? main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_TITLE_SUBSCRIPTION_FINAL_BITRIX_GPT', replacements) : main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_TITLE_SUBSCRIPTION_FINAL_MARKET_PLUS', replacements);
			}
			return this.isRenamedMarket ? main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_TITLE_SUBSCRIPTION_WARNING_BITRIX_GPT', replacements) : main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_TITLE_SUBSCRIPTION_WARNING_MARKET_PLUS', replacements);
		}
		renderDescription() {
			return main_core.Tag.render`
			<div class="rest-market-expired-popup__description">
				<p class="rest-market-expired-popup__description-text">
					${this.#getDescription()}
				</p>
			</div>
		`;
		}
		#getDescription() {
			const replacements = {
				...this.getCopilotReplacements(),
				'#DATE#': this.expireDate,
				'[br]': '<br>'
			};
			if (this.type === PopupType.FINAL) {
				return this.isRenamedMarket ? main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_DESCRIPTION_SUBSCRIPTION_FINAL_BITRIX_GPT_MSGVER_1', replacements) : main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_DESCRIPTION_SUBSCRIPTION_FINAL_MARKET_PLUS', replacements);
			}
			return this.isRenamedMarket ? main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_DESCRIPTION_SUBSCRIPTION_WARNING_BITRIX_GPT', replacements) : main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_DESCRIPTION_SUBSCRIPTION_WARNING_MARKET_PLUS', replacements);
		}
		renderButtons() {
			return main_core.Tag.render`
			<div class="rest-market-expired-popup__buttons-wrapper">
				<div class="rest-market-expired-popup__button-container">
					${this.#getSubscribeButton().render()}
					${this.#getHideButton().render()}
				</div>
			</div>
		`;
		}
		onOpen() {
			if (this.type === PopupType.FINAL) {
				BX.userOptions.save('rest', 'marketSubscriptionPopupDismiss', null, 'Y');
			} else {
				BX.userOptions.save('rest', 'marketSubscriptionPopupTs', null, Math.floor(Date.now() / 1000));
			}
			super.onOpen();
		}
		renderAboutLink() {
			const onclick = () => {
				BX.Helper.show('redirect=detail&code=17451118');
				this.getAnalytic()?.sendClickButton('details');
			};
			return main_core.Tag.render`
			<span class="rest-market-expired-popup__details">
				<a
					class="ui-link rest-market-expired-popup__link"
					href="#"
					onclick="${onclick}"
				>
					${main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_DETAILS')}
				</a>
			</span>
		`;
		}
		#getSubscribeButton() {
			return new SubscribeButton({
				text: main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_BUTTON_RENEW_SUBSCRIPTION'),
				analytic: this.getAnalytic()
			});
		}
		#getHideButton() {
			return new HideButton({
				text: main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_BUTTON_NEVER_SHOW_AGAIN'),
				onSuccess: () => {
					BX.userOptions.save('rest', 'marketSubscriptionPopupDismiss', null, 'Y');
					this.close();
				},
				analytic: this.getAnalytic()
			});
		}
	}

	class DiscountEarSubscription extends DiscountEar {
		constructor(props) {
			super(props);
			this.discountPercentage = props?.discountPercentage ?? null;
			this.termsUrl = props?.termsUrl ?? null;
			this.isRenamedMarket = props?.isRenamedMarket ?? false;
		}
		getContainer() {
			this.container ??= main_core.Tag.render`
			<aside class="rest-market-expired-popup__discount rest-market-expired-popup__discount--subscription">
				${this.#renderDiscountPercent()}
				<p class="rest-market-expired-popup__discount-description">
					${this.#getDescription()}
				</p>
				${this.#renderTermsOfPromotion()}
			</aside>
		`;
			return this.container;
		}
		#getDescription() {
			return this.isRenamedMarket ? main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_DISCOUNT_SUBSCRIPTION_DESCRIPTION_BITRIX_GPT', {
				'#COPILOT_NAME#': main_core.Extension.getSettings('rest.market-expired')?.copilotName ?? ''
			}) : main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_DISCOUNT_SUBSCRIPTION_DESCRIPTION_MARKET_PLUS');
		}
		#renderDiscountPercent() {
			if (this.discountPercentage) {
				return main_core.Tag.render`
				<p class="rest-market-expired-popup__discount-percentage">
					- ${this.discountPercentage}%
				</p>
			`;
			}
			return '';
		}
		#renderTermsOfPromotion() {
			if (this.termsUrl) {
				return main_core.Tag.render`
				<a href="${this.termsUrl}" target="_blank" class="ui-link rest-market-expired-popup__discount-terms">
					${main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_TERMS_OF_PROMOTION')}
				</a>
			`;
			}
			return '';
		}
	}

	class DiscountEarTransition extends DiscountEar {
		getContainer() {
			this.container ??= main_core.Tag.render`
			<aside class="rest-market-expired-popup__discount">
				<p class="rest-market-expired-popup__discount-description">
					${main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_DISCOUNT_DESCRIPTION', {
			'[white-span]': '<span class="rest-market-expired-popup__discount-description-white">',
			'[/white-span]': '</span>'
		})}
				</p>
			</aside>
		`;
			return this.container;
		}
	}

	class TrialButton extends MarketPopupButton {
		getButtonConfig() {
			return {
				id: 'marketExpiredPopup_button_demo',
				size: ui_buttons.Button.Size.MEDIUM,
				color: ui_buttons.Button.Color.LIGHT_BORDER,
				noCaps: true,
				round: true
			};
		}
		onClick() {
			this.getButton().unbindEvent('click');
			this.getButton().setState(ui_buttons.Button.State.WAITING);
			this.analytic?.sendClickButton('demo');
			main_core.ajax({
				url: '/bitrix/tools/rest.php',
				method: 'POST',
				dataType: 'json',
				data: {
					sessid: BX.bitrix_sessid(),
					action: 'activate_demo'
				},
				onsuccess: result => {
					this.onSuccess();
					if (result.error) {
						ui_notification.UI.Notification.Center.notify({
							content: result.error,
							category: 'demo_subscribe_error',
							position: 'top-right'
						});
					} else {
						this.analytic?.sendDemoActivated();
						ui_infoHelper.FeaturePromotersRegistry.getPromoter({
							code: 'limit_market_trial_active'
						}).show();
					}
				}
			});
		}
	}

	class MarketTransitionPopup extends MarketExpiredPopup {
		getCategory() {
			return PopupCategory.TRANSITION;
		}
		getTitle() {
			return this.type === PopupType.FINAL ? main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_TITLE_FINAL') : main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_TITLE_WARNING');
		}
		renderDescription() {
			const descriptionContainer = main_core.Tag.render`
			<div class="rest-market-expired-popup__description">
				<p class="rest-market-expired-popup__description-text">
					${main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_DESCRIPTION_1')}
				</p>
				<p class="rest-market-expired-popup__description-text">
					${main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_DESCRIPTION_2')}
				</p>
				<p class="rest-market-expired-popup__description-text">
					${main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_DESCRIPTION_3')}
				</p>
			</div>
		`;
			if (this.type === 'FINAL') {
				main_core.Dom.append(main_core.Tag.render`
					<p class="rest-market-expired-popup__description-text">
						${main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_DESCRIPTION_FINAL')}
					</p>
				`, descriptionContainer);
			}
			main_core.Dom.append(main_core.Tag.render`
				<p class="rest-market-expired-popup__description-text">
					${main_core.Loc.getMessage(`REST_MARKET_EXPIRED_POPUP_${this.type}_DESCRIPTION${this.withDemo ? '_DEMO' : ''}`, {
			'#DATE#': this.expireDate
		})}
				</p>
			`, descriptionContainer);
			return descriptionContainer;
		}
		renderButtons() {
			if (this.type === PopupType.WARNING) {
				return this.#renderButtonsForWarning();
			}
			return this.#renderButtonsForFinal();
		}
		show() {
			super.show();
			if (main_core.Type.isStringFilled(this.olWidgetCode) && (!this.withDemo || this.type === 'FINAL')) {
				this.#showOpenLinesWidget(window, document, `https://bitrix24.team/upload/crm/site_button/loader_${this.olWidgetCode}.js`);
			}
		}
		onClose() {
			BX.SiteButton?.hide();
			BX.userOptions.save('rest', 'marketTransitionPopupTs', null, Math.floor(Date.now() / 1000));
			super.onClose();
		}
		renderAboutLink() {
			const onclick = () => {
				this.getAnalytic()?.sendClickButton('details');
			};
			return main_core.Tag.render`
			<span class="rest-market-expired-popup__details">
				<a
					class="ui-link rest-market-expired-popup__link"
					href="FEATURE_PROMOTER=${this.#getFeatureCode()}"
					onclick="${onclick}"
				>
					${main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_DETAILS')}
				</a>
			</span>
		`;
		}
		#getDemoButton() {
			return new TrialButton({
				text: main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_BUTTON_DEMO'),
				onSuccess: this.close.bind(this),
				analytic: this.getAnalytic()
			});
		}
		#getSubscribeButton() {
			return new SubscribeButton({
				text: main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_BUTTON_SUBSCRIBE'),
				analytic: this.getAnalytic()
			});
		}
		#getHideButton() {
			return new HideButton({
				text: main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_BUTTON_HIDE'),
				onSuccess: () => {
					BX.userOptions.save('rest', 'marketTransitionPopupDismiss', null, 'Y');
					this.close();
				},
				analytic: this.getAnalytic()
			});
		}
		#renderButtonsForWarning() {
			return main_core.Tag.render`
			<div class="rest-market-expired-popup__buttons-wrapper">
				<div class="rest-market-expired-popup__button-container">
					${this.#getSubscribeButton().render()}
					${this.withDemo ? this.#getDemoButton().render() : ''}
				</div>
			</div>
		`;
		}
		#renderButtonsForFinal() {
			if (this.withDemo) {
				return main_core.Tag.render`
				<div class="rest-market-expired-popup__buttons-wrapper">
					${this.#getSubscribeButton().render()}
					<div class="rest-market-expired-popup__button-container">
						${this.#getDemoButton().render()}
						${this.#getHideButton().render()}
					</div>
				</div>
			`;
			}
			return main_core.Tag.render`
			<div class="rest-market-expired-popup__buttons-wrapper">
				<div class="rest-market-expired-popup__button-container">
					${this.#getSubscribeButton().render()}
					${this.#getHideButton().render()}
				</div>
			</div>
		`;
		}

		/**
		 * limit_v2_nosubscription_marketplace_withapplications_off
		 * limit_v2_nosubscription_marketplace_withapplications_off_no_demo
		 * limit_v2_nosubscription_marketplace_withapplications_nodiscount_off
		 * limit_v2_nosubscription_marketplace_withapplications_nodiscount_off_no_demo
		 */
		#getFeatureCode() {
			return `
			limit_v2_nosubscription_marketplace_withapplications
			${this.withDiscount ? '' : '_nodiscount'}
			_off
			${this.withDemo ? '' : '_no_demo'}
		`;
		}
		#showOpenLinesWidget(w, d, u) {
			// eslint-disable-next-line unicorn/prefer-math-trunc
			const s = d.createElement('script');
			s.async = true;
			s.src = `${u}?${Date.now() / 60000 | 0}`;
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dom-methods
			const h = d.getElementsByTagName('script')[0];
			h.parentNode.insertBefore(s, h);
		}
	}

	class PopupFactory {
		constructor(config) {
			this.config = config;
		}
		async createPopup() {
			let popup = null;
			const analytic = this.#getAnalytic();
			const listItemCount = this.#getListItemCount();
			const {
				appList,
				integrationList
			} = await this.#getMarketList(listItemCount, analytic);
			if (appList || integrationList) {
				const discountEar = this.#getDiscountEar();
				const PopupClass = this.#getPopupClass();
				popup = new PopupClass({
					appList,
					integrationList,
					analytic,
					discountEar,
					expireDate: this.config.expireDate,
					marketSubscriptionUrl: this.config.marketSubscriptionUrl,
					withDemo: this.config.withDemo,
					olWidgetCode: this.config.olWidgetCode,
					type: this.config.type,
					expireDays: this.config.expireDays,
					isRenamedMarket: this.config.isRenamedMarket
				});
			}
			return popup;
		}
		#getPopupClass() {
			switch (this.config.category) {
				case PopupCategory.TRIAL:
					return MarketTrialPopup;
				case PopupCategory.SUBSCRIPTION:
					return MarketSubscriptionPopup;
				case PopupCategory.TRANSITION:
				default:
					return MarketTransitionPopup;
			}
		}
		#getAnalytic() {
			return new Analytic({
				withDiscount: this.config.discount?.isAvailable ?? false,
				popupType: this.config.type,
				popupCategory: this.config.category
			});
		}
		#getListItemCount() {
			switch (this.config.category) {
				case PopupCategory.TRIAL:
				case PopupCategory.SUBSCRIPTION:
					return 2;
				case PopupCategory.TRANSITION:
				default:
					return 3;
			}
		}
		#getDiscountEar() {
			const discountConfig = this.config.discount;
			if (!discountConfig?.isAvailable) {
				return null;
			}
			switch (this.config.category) {
				case PopupCategory.TRIAL:
				case PopupCategory.SUBSCRIPTION:
					return new DiscountEarSubscription({
						discountPercentage: discountConfig.percentage,
						termsUrl: discountConfig.termsUrl,
						isRenamedMarket: this.config.isRenamedMarket
					});
				case PopupCategory.TRANSITION:
				default:
					return new DiscountEarTransition();
			}
		}
		async #getMarketList(limit, analytic) {
			const getMarketListFromResponse = (response, moreLink, title, onClick) => {
				if (!response || !response.data) {
					return null;
				}
				const {
					items,
					count
				} = response.data;
				const marketList = [];
				if (items.length === 0 || count < 1) {
					return null;
				}
				Object.values(items).forEach(item => {
					marketList.push(new MarketItem({
						name: item.name,
						icon: item.icon
					}));
				});
				return new MarketList({
					title,
					count,
					items: marketList,
					link: moreLink,
					onClick
				});
			};
			let appList = null;
			let integrationList = null;
			await Promise.all([main_core.ajax.runAction('rest.integration.getApplicationList', {
				data: {
					limit
				}
			}), main_core.ajax.runAction('rest.integration.getIntegrationList', {
				data: {
					limit
				}
			})]).then(([appsResponse, integrationsResponse]) => {
				appList = getMarketListFromResponse(appsResponse, '/market/installed/', main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_MARKET_LIST_TITLE_APPS'), () => {
					analytic.sendClickButton('view_all_apps');
				});
				integrationList = getMarketListFromResponse(integrationsResponse, '/devops/list/', main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_MARKET_LIST_TITLE_INTEGRATIONS'), () => {
					analytic.sendClickButton('view_all_integrations');
				});
			}).catch(error => {
				console.log(error);
			});
			return {
				appList,
				integrationList
			};
		}
	}

	class CurtainPage {
		static INTEGRATION = 'Integration';
		static APPLICATION = 'Application';
		static ANY_PAGE = 'AnyPage';
	}

	class MarketExpiredCurtain {
		#panel = null;
		constructor(options) {
			this.options = options;
		}
		#getPanel(onDone) {
			this.#panel ??= new ui_notificationPanel.NotificationPanel({
				content: main_core.Tag.render`
				<span class="rest-market-expired-curtain">${this.getContent()}</span>
			`,
				backgroundColor: '#E89B06',
				crossColor: '#FFFFFF',
				leftIcon: new ui_iconSet_api_core.Icon({
					icon: ui_iconSet_api_core.Main.MARKET_1,
					color: '#FFFFFF'
				}),
				rightButtons: this.getRightButtons(),
				events: {
					onHide: () => {
						onDone();
						this.onHide();
					}
				},
				zIndex: 1001
			});
			return this.#panel;
		}
		show() {
			ui_bannerDispatcher.BannerDispatcher.high.toQueue(onDone => {
				const panel = this.#getPanel(onDone);
				panel.show();
				this.#sendAnalytics('show_notification_panel');
			});
		}
		getRightButtons() {
			return [];
		}
		getContent() {
			throw new Error('Not Implemented');
		}
		onRightButtonClick() {
			this.#getPanel().hide();
			this.#sendAnalytics('click_button');
		}
		getCopilotReplacements() {
			return {
				'#COPILOT_NAME#': main_core.Extension.getSettings('rest.market-expired')?.copilotName ?? ''
			};
		}
		onHide() {}
		#sendAnalytics(event) {
			const params = {
				tool: 'infohelper',
				category: 'market',
				event,
				type: 'notification_panel'
			};
			ui_analytics.sendData(params);
		}
	}

	class MarketTrialCurtain extends MarketExpiredCurtain {
		getRightButtons() {
			return [new ui_buttons.Button({
				text: main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_BUTTON_SUBSCRIBE'),
				size: ui_buttons.Button.Size.EXTRA_SMALL,
				color: ui_buttons.Button.Color.CURTAIN_WARNING,
				tag: ui_buttons.Button.Tag.LINK,
				noCaps: true,
				round: true,
				props: {
					href: this.options.marketSubscriptionUrl
				},
				onclick: () => super.onRightButtonClick.bind(this)
			})];
		}
		getContent() {
			if (this.options.type === PopupType.FINAL) {
				return this.options.isRenamedMarket ? main_core.Loc.getMessage('REST_MARKET_EXPIRED_CURTAIN_TRIAL_FINAL_TEXT_BITRIX_GPT_MSGVER_1', this.getCopilotReplacements()) : main_core.Loc.getMessage('REST_MARKET_EXPIRED_CURTAIN_TRIAL_FINAL_TEXT_MARKET_PLUS');
			}
			return this.options.isRenamedMarket ? main_core.Loc.getMessage('REST_MARKET_EXPIRED_CURTAIN_TRIAL_WARNING_TEXT_BITRIX_GPT_MSGVER_1', {
				...this.getCopilotReplacements(),
				'#DAYS#': this.options.expireDays
			}) : main_core.Loc.getMessage('REST_MARKET_EXPIRED_CURTAIN_TRIAL_WARNING_TEXT_MARKET_PLUS', {
				'#DAYS#': this.options.expireDays
			});
		}
		onHide() {
			if (this.options.type === PopupType.FINAL) {
				BX.userOptions.save('rest', `marketSubscriptionCurtain${this.options.curtainPage}Dismiss`, null, 'Y');
			} else {
				BX.userOptions.save('rest', `marketSubscriptionCurtain${this.options.curtainPage}Ts`, null, Math.floor(Date.now() / 1000));
			}
		}
	}

	class MarketSubscriptionCurtain extends MarketExpiredCurtain {
		getRightButtons() {
			return [new ui_buttons.Button({
				text: main_core.Loc.getMessage('REST_MARKET_EXPIRED_POPUP_BUTTON_RENEW_SUBSCRIPTION'),
				size: ui_buttons.Button.Size.EXTRA_SMALL,
				color: ui_buttons.Button.Color.CURTAIN_WARNING,
				tag: ui_buttons.Button.Tag.LINK,
				noCaps: true,
				round: true,
				props: {
					href: this.options.marketSubscriptionUrl
				},
				onclick: () => super.onRightButtonClick.bind(this)
			})];
		}
		getContent() {
			if (this.options.type === PopupType.FINAL) {
				return this.options.isRenamedMarket ? main_core.Loc.getMessage('REST_MARKET_EXPIRED_CURTAIN_SUBSCRIPTION_FINAL_TEXT_BITRIX_GPT_MSGVER_1', this.getCopilotReplacements()) : main_core.Loc.getMessage('REST_MARKET_EXPIRED_CURTAIN_SUBSCRIPTION_FINAL_TEXT_MARKET_PLUS');
			}
			return this.options.isRenamedMarket ? main_core.Loc.getMessage('REST_MARKET_EXPIRED_CURTAIN_SUBSCRIPTION_WARNING_TEXT_BITRIX_GPT_MSGVER_1', {
				...this.getCopilotReplacements(),
				'#DAYS#': this.options.expireDays
			}) : main_core.Loc.getMessage('REST_MARKET_EXPIRED_CURTAIN_SUBSCRIPTION_WARNING_TEXT_MARKET_PLUS', {
				'#DAYS#': this.options.expireDays
			});
		}
		onHide() {
			if (this.options.type === PopupType.FINAL) {
				BX.userOptions.save('rest', `marketSubscriptionCurtain${this.options.curtainPage}Dismiss`, null, 'Y');
			} else {
				BX.userOptions.save('rest', `marketSubscriptionCurtain${this.options.curtainPage}Ts`, null, Math.floor(Date.now() / 1000));
			}
		}
	}

	class MarketTransitionCurtain extends MarketExpiredCurtain {
		getRightButtons() {
			return [new ui_buttons.Button({
				text: main_core.Loc.getMessage('REST_MARKET_EXPIRED_CURTAIN_TRANSITION_BUTTON'),
				size: ui_buttons.Button.Size.EXTRA_SMALL,
				color: ui_buttons.Button.Color.CURTAIN_WARNING,
				tag: ui_buttons.Button.Tag.LINK,
				noCaps: true,
				round: true,
				props: {
					href: 'FEATURE_PROMOTER=limit_v2_nosubscription_marketplace_withapplications_off'
				},
				onclick: () => super.onRightButtonClick.bind(this)
			})];
		}
		getContent() {
			return main_core.Loc.getMessage('REST_MARKET_EXPIRED_CURTAIN_TRANSITION_TEXT');
		}
		onHide() {
			BX.userOptions.save('rest', `marketTransitionCurtain${this.options.curtainPage}Ts`, null, Math.floor(Date.now() / 1000));
		}
	}

	class CurtainFactory {
		constructor(config) {
			this.config = config;
		}
		createCurtain(curtainPage) {
			const CurtainClass = this.#getCurtainClass();
			return new CurtainClass({
				marketSubscriptionUrl: this.config.marketSubscriptionUrl,
				type: this.config.type,
				expireDays: this.config.expireDays,
				curtainPage,
				isRenamedMarket: this.config.isRenamedMarket
			});
		}
		#getCurtainClass() {
			switch (this.config.category) {
				case PopupCategory.TRIAL:
					return MarketTrialCurtain;
				case PopupCategory.SUBSCRIPTION:
					return MarketSubscriptionCurtain;
				case PopupCategory.TRANSITION:
				default:
					return MarketTransitionCurtain;
			}
		}
	}

	class MarketExpired {
		constructor(config) {
			this.config = config;
		}
		static async getPopup(config = null) {
			const popupConfig = config ?? main_core.Extension.getSettings('rest.market-expired');
			const manager = new PopupFactory(popupConfig);
			return manager.createPopup();
		}
		static getCurtain(curtainPage, config = null) {
			const curtainConfig = config ?? main_core.Extension.getSettings('rest.market-expired');
			const manager = new CurtainFactory(curtainConfig);
			return manager.createCurtain(curtainPage);
		}
	}

	exports.CurtainPage = CurtainPage;
	exports.MarketExpired = MarketExpired;

})(this.BX.Rest = this.BX.Rest || {}, BX, BX.Main, BX.Event, BX, BX.UI.Analytics, BX.UI, BX.UI.Notification, BX.UI, BX.UI, BX.UI, BX.UI.IconSet);
//# sourceMappingURL=market-expired.bundle.js.map
