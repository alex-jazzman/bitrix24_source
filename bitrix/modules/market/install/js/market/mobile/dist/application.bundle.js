/* eslint-disable */
this.BX = this.BX || {};
this.BX.Market = this.BX.Market || {};
(function (exports, main_core, ui_vue3, market_mobile_bridge, market_mobile_detail) {
	'use strict';

	const DETAIL_PAGE_CODE = 'detail';
	const THEME_QUERY_PARAM = 'mobileThemeId';
	const LIGHT_THEME_ID = 'light';
	const DARK_THEME_ID = 'dark';
	const LIGHT_CONTEXT_CLASS = '--ui-context-content-light';
	const DARK_CONTEXT_CLASS = '--ui-context-content-dark';
	class Application {
		constructor(options = {}) {
			this.params = main_core.Type.isPlainObject(options.params) ? options.params : {};
			this.result = main_core.Type.isPlainObject(options.result) ? options.result : {};
			this.rootNode = document.getElementById('market-wrapper-vue');
			this.themeObserver = null;
			if (!this.rootNode) {
				return;
			}
			this.bridgeManager = new market_mobile_bridge.BridgeManager({
				page: DETAIL_PAGE_CODE,
				getUrl: () => this.getCurrentPageUrl(),
				getTitle: () => this.getToolbarTitle(),
				onInstallComplete: data => {
					this.handleInstallComplete(data);
				}
			});
			this.syncThemeContext();
			this.observeThemeContext();
			this.mountVueApp();
			this.bridgeManager.init();
		}
		getCurrentPageUrl() {
			return String(window.location.href || '').trim();
		}
		getToolbarTitle() {
			const app = main_core.Type.isPlainObject(this.result.APP) ? this.result.APP : {};
			const title = this.result.TITLE || app.NAME;
			if (!main_core.Type.isString(title)) {
				return '';
			}
			return title.trim();
		}
		handleInstallComplete() {
			window.location.reload();
		}
		syncThemeContext() {
			if (!this.rootNode) {
				return;
			}
			const themeClass = this.resolveThemeId() === DARK_THEME_ID ? DARK_CONTEXT_CLASS : LIGHT_CONTEXT_CLASS;
			this.rootNode.classList.remove(LIGHT_CONTEXT_CLASS, DARK_CONTEXT_CLASS);
			this.rootNode.classList.add(themeClass);
		}
		observeThemeContext() {
			if (this.themeObserver || main_core.Type.isUndefined(window.MutationObserver) || !document.documentElement) {
				return;
			}
			this.themeObserver = new MutationObserver(() => {
				this.syncThemeContext();
			});
			this.themeObserver.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ['class']
			});
		}
		resolveThemeId() {
			const themeIdFromQuery = this.resolveThemeIdFromQuery();
			if (themeIdFromQuery !== '') {
				return themeIdFromQuery;
			}
			const themeIdFromDocument = this.resolveThemeIdFromDocument();
			return themeIdFromDocument || LIGHT_THEME_ID;
		}
		resolveThemeIdFromQuery() {
			try {
				const currentUrl = new main_core.Uri(this.getCurrentPageUrl());
				return this.normalizeThemeId(currentUrl.getQueryParam(THEME_QUERY_PARAM));
			} catch {
				return '';
			}
		}
		resolveThemeIdFromDocument() {
			const rootElement = document.documentElement;
			return this.normalizeThemeId(rootElement ? rootElement.className : '');
		}
		normalizeThemeId(themeId) {
			const preparedThemeId = main_core.Type.isString(themeId) ? themeId.trim().toLowerCase() : '';
			if (preparedThemeId.includes(DARK_THEME_ID)) {
				return DARK_THEME_ID;
			}
			if (preparedThemeId.includes(LIGHT_THEME_ID)) {
				return LIGHT_THEME_ID;
			}
			return '';
		}
		mountVueApp() {
			const application = this;
			this.app = ui_vue3.BitrixVue.createApp({
				name: 'MarketMobileApplication',
				components: {
					Detail: market_mobile_detail.Detail
				},
				data: () => ({
					params: application.params,
					result: application.result
				}),
				methods: {
					handleMobileUiUpdate(payload) {
						application.bridgeManager.applyMobileUi(main_core.Type.isPlainObject(payload) ? payload : {});
					}
				},
				template: `
				<div class="market-mobile-application">
					<Detail
						:params="params"
						:result="result"
						@mobile-ui-update="handleMobileUiUpdate"
					/>
				</div>
			`
			});
			this.app.mount(this.rootNode);
		}
	}

	exports.Application = Application;

})(this.BX.Market.Mobile = this.BX.Market.Mobile || {}, BX, BX.Vue3, BX.Market.Mobile, BX.Market.Mobile);
