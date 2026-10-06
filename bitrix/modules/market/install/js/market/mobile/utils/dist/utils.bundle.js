/* eslint-disable */
this.BX = this.BX || {};
this.BX.Market = this.BX.Market || {};
(function (exports, main_core) {
	'use strict';

	const MarketMobileNativeEvent = Object.freeze({
		INSTALL_OPEN: 'market:install:open',
		APP_OPEN: 'market:app:open'
	});
	class MarketMobileHelper {
		static normalizeString(value, fallback = '') {
			const preparedValue = main_core.Type.isString(value) ? value.trim() : '';
			return main_core.Type.isStringFilled(preparedValue) ? preparedValue : fallback;
		}
		static normalizePositiveInt(value, fallback = 1) {
			const preparedValue = parseInt(value, 10);
			if (Number.isNaN(preparedValue) || preparedValue < 1) {
				return fallback;
			}
			return preparedValue;
		}
		static normalizeNonNegativeInt(value, fallback = 0) {
			const preparedValue = parseInt(value, 10);
			if (Number.isNaN(preparedValue) || preparedValue < 0) {
				return fallback;
			}
			return preparedValue;
		}
		static cloneArray(value) {
			return main_core.Type.isArray(value) ? [...value] : [];
		}
		static cloneObject(value) {
			return main_core.Type.isPlainObject(value) ? {
				...value
			} : {};
		}
		static resolveResultTitle(result, fallback = '') {
			const preparedResult = main_core.Type.isPlainObject(result) ? result : {};
			return MarketMobileHelper.normalizeString(preparedResult.TITLE || (main_core.Type.isPlainObject(preparedResult.APP) ? preparedResult.APP.NAME : ''), fallback);
		}
		static resolveAppCode(app) {
			return MarketMobileHelper.normalizeString(app && (app.CODE || app.APP_CODE || app.ID), '');
		}
		static getAppKey(app, index, fallbackPrefix = 'app') {
			const appCode = MarketMobileHelper.resolveAppCode(app);
			return appCode !== '' ? `${appCode}-${index}` : `${fallbackPrefix}-${index}`;
		}
		static buildMarketUrl(params = {}, path = '/mobile/market/') {
			const uri = new main_core.Uri(path);
			const preparedParams = main_core.Type.isPlainObject(params) ? params : {};
			Object.keys(preparedParams).forEach(key => {
				const value = preparedParams[key];
				if (!main_core.Type.isNil(value) && value !== '') {
					uri.setQueryParam(key, value);
				}
			});
			return uri.toString();
		}
		static buildAbsoluteUrl(url = '') {
			const preparedUrl = MarketMobileHelper.normalizeString(url, '');
			if (preparedUrl === '') {
				return '';
			}
			const uri = new main_core.Uri(preparedUrl);
			if (uri.getHost() === '' && uri.getSchema() === '') {
				return `${window.location.origin}${preparedUrl.startsWith('/') ? preparedUrl : `/${preparedUrl}`}`;
			}
			return uri.toString();
		}
		static buildAppDetailUrl(app, from = 'list') {
			const appCode = MarketMobileHelper.resolveAppCode(app);
			if (appCode === '') {
				return '#';
			}
			return MarketMobileHelper.buildMarketUrl({
				page: 'detail',
				appCode,
				from
			});
		}
		static buildAppInstallUrl(app, from = 'list') {
			const appCode = MarketMobileHelper.resolveAppCode(app);
			if (appCode === '') {
				return '';
			}
			return MarketMobileHelper.buildMarketUrl({
				page: 'install',
				appCode,
				from
			});
		}
		static normalizeText(value) {
			return String(value || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
		}
		static openAppInstall(app, options = {}) {
			const installUrl = MarketMobileHelper.buildAppInstallUrl(app, MarketMobileHelper.normalizeString(options.from, 'list'));
			if (installUrl === '') {
				return false;
			}
			const title = MarketMobileHelper.normalizeString(options.title);
			const installInfo = main_core.Type.isPlainObject(app?.INSTALL_INFO) ? app.INSTALL_INFO : {};
			const isSent = MarketMobileHelper.sendNativeEvent(MarketMobileNativeEvent.INSTALL_OPEN, {
				url: installUrl,
				title,
				code: MarketMobileHelper.normalizeString(installInfo.CODE || app?.CODE, ''),
				version: MarketMobileHelper.normalizeNonNegativeInt(installInfo.VERSION, 0),
				checkHash: MarketMobileHelper.normalizeString(installInfo.CHECK_HASH, ''),
				installHash: MarketMobileHelper.normalizeString(installInfo.INSTALL_HASH, '')
			});
			if (!isSent) {
				window.location.href = installUrl;
			}
			return true;
		}
		static openApp(url, options = {}) {
			const absoluteUrl = MarketMobileHelper.buildAbsoluteUrl(url);
			if (absoluteUrl === '') {
				return false;
			}
			const title = MarketMobileHelper.normalizeString(options.title, '');
			const isSent = MarketMobileHelper.sendNativeEvent(MarketMobileNativeEvent.APP_OPEN, {
				url: absoluteUrl,
				title
			});
			if (!isSent) {
				window.location.href = absoluteUrl;
			}
			return true;
		}
		static sendNativeEvent(eventType, data = {}) {
			const preparedEventType = MarketMobileHelper.normalizeString(eventType, '');
			if (preparedEventType === '' || !main_core.Type.isFunction(window.BXNativeBridge && window.BXNativeBridge.sendEvent)) {
				return false;
			}
			try {
				window.BXNativeBridge.sendEvent(preparedEventType, main_core.Type.isPlainObject(data) ? data : {});
				return true;
			} catch (error) {
				console.error(error);
				return false;
			}
		}
	}

	exports.MarketMobileHelper = MarketMobileHelper;
	exports.MarketMobileNativeEvent = MarketMobileNativeEvent;

})(this.BX.Market.Mobile = this.BX.Market.Mobile || {}, BX);
