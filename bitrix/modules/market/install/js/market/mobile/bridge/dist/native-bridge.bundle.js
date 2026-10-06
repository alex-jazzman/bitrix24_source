/* eslint-disable */
this.BX = this.BX || {};
this.BX.Market = this.BX.Market || {};
(function (exports, main_core) {
	'use strict';

	class BridgeEvents {
		static get PAGE_READY() {
			return 'market:page:ready';
		}
		static get TOOLBAR_UPDATE() {
			return 'market:toolbar:update';
		}
		static get INSTALL_COMPLETE() {
			return 'market:install:complete';
		}
		static get NAVIGATION_BACK() {
			return 'market:navigation:back';
		}
		static get MENU_CLICK() {
			return 'market:menu:click';
		}
	}

	class NativeBridge {
		static isAvailable() {
			return main_core.Type.isFunction(window.BXNativeBridge && window.BXNativeBridge.sendEvent);
		}
		static sendEvent(eventType, data = {}) {
			if (!eventType || !this.isAvailable()) {
				return false;
			}
			try {
				window.BXNativeBridge.sendEvent(eventType, data);
				return true;
			} catch (error) {
				console.error(error);
				return false;
			}
		}
		static subscribe(handler) {
			if (!main_core.Type.isFunction(handler) || !main_core.Type.isFunction(window.BXNativeBridge && window.BXNativeBridge.onReceiveEvent)) {
				return false;
			}
			window.BXNativeBridge.onReceiveEvent(event => {
				handler(main_core.Type.isPlainObject(event) ? event : {});
			});
			return true;
		}
	}

	class PageController {
		constructor(options = {}) {
			this.onEvent = main_core.Type.isFunction(options.onEvent) ? options.onEvent : null;
			this.isSubscribed = false;
		}
		connect(force = false) {
			if (this.isSubscribed && force !== true) {
				return;
			}
			this.isSubscribed = NativeBridge.subscribe(event => {
				if (this.onEvent) {
					this.onEvent(event || {});
				}
			});
		}
		emitReady(data = {}) {
			return NativeBridge.sendEvent(BridgeEvents.PAGE_READY, data);
		}
		updateToolbar(data = {}) {
			return NativeBridge.sendEvent(BridgeEvents.TOOLBAR_UPDATE, data);
		}
	}

	const NATIVE_BRIDGE_READY_EVENT = 'BXNativeBridgeReady';
	const DEFAULT_PAGE_CODE = 'detail';
	class BridgeManager {
		constructor(options = {}) {
			this.page = this.normalizeString(options.page, DEFAULT_PAGE_CODE);
			this.getUrl = main_core.Type.isFunction(options.getUrl) ? options.getUrl : () => window.location.href;
			this.getTitle = main_core.Type.isFunction(options.getTitle) ? options.getTitle : () => '';
			this.onMenuClick = main_core.Type.isFunction(options.onMenuClick) ? options.onMenuClick : null;
			this.onInstallComplete = main_core.Type.isFunction(options.onInstallComplete) ? options.onInstallComplete : null;
			this.onNavigationBack = main_core.Type.isFunction(options.onNavigationBack) ? options.onNavigationBack : null;
			this.currentUiPayload = {};
			this.lastReadyKey = '';
			this.pageController = new PageController({
				onEvent: event => {
					this.handleNativeEvent(event);
				}
			});
			this.pageController.connect();
			this.nativeBridgeReadyHandler = null;
		}
		init() {
			this.initBridgeReadySync();
			this.trySyncWithNativeBridge();
		}
		applyMobileUi(payload = {}) {
			this.currentUiPayload = main_core.Type.isPlainObject(payload) ? payload : {};
			this.syncCurrentPageState();
		}
		syncCurrentPageState(overridePayload = null) {
			if (this.pageController) {
				this.pageController.connect(true);
			}
			const toolbarPayload = this.buildToolbarPayload(overridePayload);
			this.notifyPageReady(toolbarPayload);
			this.updateNativeToolbar(toolbarPayload);
		}
		buildToolbarPayload(overridePayload = null) {
			const pageUiPayload = main_core.Type.isPlainObject(overridePayload) ? {
				...this.currentUiPayload,
				...overridePayload
			} : this.currentUiPayload;
			const currentPageUrl = this.normalizeString(this.getUrl(), window.location.href || '');
			const navigation = main_core.Type.isPlainObject(pageUiPayload.navigation) ? pageUiPayload.navigation : {};
			const title = this.normalizeString(pageUiPayload.title, this.getTitle());
			const menu = main_core.Type.isPlainObject(pageUiPayload.menu) ? pageUiPayload.menu : {};
			return {
				page: this.page,
				url: currentPageUrl,
				title,
				menu,
				tabs: [],
				navigation: {
					canGoBack: main_core.Type.isBoolean(navigation.canGoBack) ? navigation.canGoBack : false,
					loading: navigation.loading === true
				}
			};
		}
		notifyPageReady(payload = {}) {
			if (!this.pageController || payload.navigation && payload.navigation.loading === true) {
				return;
			}
			const readyKey = this.normalizeString(payload.url, '');
			if (readyKey === '' || this.lastReadyKey === readyKey) {
				return;
			}
			const isSent = this.pageController.emitReady({
				page: payload.page,
				url: readyKey
			});
			if (isSent) {
				this.lastReadyKey = readyKey;
			} else {
				this.trySyncWithNativeBridge();
			}
		}
		updateNativeToolbar(payload = {}) {
			if (!this.pageController) {
				return;
			}
			const isSent = this.pageController.updateToolbar(payload);
			if (!isSent) {
				this.trySyncWithNativeBridge();
			}
		}
		handleNativeEvent(event = {}) {
			const eventType = this.resolveBridgeEventType(event);
			const data = this.resolveBridgeEventData(event);
			switch (eventType) {
				case BridgeEvents.MENU_CLICK:
					{
						if (this.onMenuClick) {
							this.onMenuClick(data);
						}
						break;
					}
				case BridgeEvents.NAVIGATION_BACK:
					{
						if (this.onNavigationBack) {
							this.onNavigationBack();
						}
						break;
					}
				case BridgeEvents.INSTALL_COMPLETE:
					{
						if (this.onInstallComplete) {
							this.onInstallComplete(data);
						}
						break;
					}
			}
		}
		resolveBridgeEventType(event = {}) {
			if (!main_core.Type.isPlainObject(event)) {
				return '';
			}
			return this.normalizeString(event.eventType || event.type || event.name || (main_core.Type.isPlainObject(event.data) ? event.data.eventType || event.data.type || event.data.name : '') || (main_core.Type.isPlainObject(event.params) ? event.params.eventType || event.params.type || event.params.name : ''), '');
		}
		resolveBridgeEventData(event = {}) {
			if (!main_core.Type.isPlainObject(event)) {
				return {};
			}
			if (main_core.Type.isPlainObject(event.data)) {
				return event.data;
			}
			if (main_core.Type.isPlainObject(event.params)) {
				return event.params;
			}
			return {};
		}
		normalizeString(value, fallback = '') {
			const preparedValue = main_core.Type.isString(value) ? value.trim() : '';
			return main_core.Type.isStringFilled(preparedValue) ? preparedValue : fallback;
		}
		initBridgeReadySync() {
			this.nativeBridgeReadyHandler = () => {
				this.trySyncWithNativeBridge(true);
			};
			document.addEventListener(NATIVE_BRIDGE_READY_EVENT, this.nativeBridgeReadyHandler);
		}
		trySyncWithNativeBridge(force = false) {
			if (!NativeBridge.isAvailable()) {
				return false;
			}
			if (this.pageController) {
				this.pageController.connect(true);
			}
			if (force) {
				this.lastReadyKey = '';
			}
			this.syncCurrentPageState();
			return true;
		}
	}

	exports.BridgeManager = BridgeManager;

})(this.BX.Market.Mobile = this.BX.Market.Mobile || {}, BX);
