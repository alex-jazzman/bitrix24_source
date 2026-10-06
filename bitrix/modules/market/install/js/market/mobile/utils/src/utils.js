import { Loc, Type, Uri } from 'main.core';

export const MarketMobileNativeEvent = Object.freeze({
	INSTALL_OPEN: 'market:install:open',
	APP_OPEN: 'market:app:open',
});

export class MarketMobileHelper
{
	static normalizeString(value, fallback = ''): string
	{
		const preparedValue = Type.isString(value) ? value.trim() : '';

		return Type.isStringFilled(preparedValue) ? preparedValue : fallback;
	}

	static normalizePositiveInt(value, fallback = 1): number
	{
		const preparedValue = parseInt(value, 10);

		if (Number.isNaN(preparedValue) || preparedValue < 1)
		{
			return fallback;
		}

		return preparedValue;
	}

	static normalizeNonNegativeInt(value, fallback = 0): number
	{
		const preparedValue = parseInt(value, 10);

		if (Number.isNaN(preparedValue) || preparedValue < 0)
		{
			return fallback;
		}

		return preparedValue;
	}

	static cloneArray(value): Array
	{
		return Type.isArray(value) ? [...value] : [];
	}

	static cloneObject(value): Object
	{
		return Type.isPlainObject(value) ? { ...value } : {};
	}

	static resolveResultTitle(result, fallback = ''): string
	{
		const preparedResult = Type.isPlainObject(result) ? result : {};

		return MarketMobileHelper.normalizeString(
			preparedResult.TITLE || (Type.isPlainObject(preparedResult.APP) ? preparedResult.APP.NAME : ''),
			fallback,
		);
	}

	static resolveAppCode(app): string
	{
		return MarketMobileHelper.normalizeString(
			app && (app.CODE || app.APP_CODE || app.ID),
			'',
		);
	}

	static getAppKey(app, index, fallbackPrefix = 'app'): string
	{
		const appCode = MarketMobileHelper.resolveAppCode(app);

		return appCode !== '' ? `${appCode}-${index}` : `${fallbackPrefix}-${index}`;
	}

	static buildMarketUrl(params = {}, path = '/mobile/market/'): string
	{
		const uri = new Uri(path);
		const preparedParams = Type.isPlainObject(params) ? params : {};

		Object.keys(preparedParams).forEach((key) => {
			const value = preparedParams[key];

			if (!Type.isNil(value) && value !== '')
			{
				uri.setQueryParam(key, value);
			}
		});

		return uri.toString();
	}

	static buildAbsoluteUrl(url = ''): string
	{
		const preparedUrl = MarketMobileHelper.normalizeString(url, '');
		if (preparedUrl === '')
		{
			return '';
		}

		const uri = new Uri(preparedUrl);
		if (uri.getHost() === '' && uri.getSchema() === '')
		{
			return `${window.location.origin}${preparedUrl.startsWith('/') ? preparedUrl : `/${preparedUrl}`}`;
		}

		return uri.toString();
	}

	static buildAppDetailUrl(app, from = 'list'): string
	{
		const appCode = MarketMobileHelper.resolveAppCode(app);

		if (appCode === '')
		{
			return '#';
		}

		return MarketMobileHelper.buildMarketUrl({
			page: 'detail',
			appCode,
			from,
		});
	}

	static buildAppInstallUrl(app, from = 'list'): string
	{
		const appCode = MarketMobileHelper.resolveAppCode(app);

		if (appCode === '')
		{
			return '';
		}

		return MarketMobileHelper.buildMarketUrl({
			page: 'install',
			appCode,
			from,
		});
	}

	static normalizeText(value): string
	{
		return String(value || '')
			.replace(/<[^>]*>/g, ' ')
			.replace(/&nbsp;/gi, ' ')
			.replace(/\s+/g, ' ')
			.trim();
	}

	static openAppInstall(app, options = {}): boolean
	{
		const installUrl = MarketMobileHelper.buildAppInstallUrl(
			app,
			MarketMobileHelper.normalizeString(options.from, 'list'),
		);

		if (installUrl === '')
		{
			return false;
		}

		const title = MarketMobileHelper.normalizeString(
			options.title,
		);
		const installInfo = Type.isPlainObject(app?.INSTALL_INFO) ? app.INSTALL_INFO : {};
		const isSent = MarketMobileHelper.sendNativeEvent(MarketMobileNativeEvent.INSTALL_OPEN, {
			url: installUrl,
			title,
			code: MarketMobileHelper.normalizeString(installInfo.CODE || app?.CODE, ''),
			version: MarketMobileHelper.normalizeNonNegativeInt(installInfo.VERSION, 0),
			checkHash: MarketMobileHelper.normalizeString(installInfo.CHECK_HASH, ''),
			installHash: MarketMobileHelper.normalizeString(installInfo.INSTALL_HASH, ''),
		});

		if (!isSent)
		{
			window.location.href = installUrl;
		}

		return true;
	}

	static openApp(url, options = {}): boolean
	{
		const absoluteUrl = MarketMobileHelper.buildAbsoluteUrl(url);
		if (absoluteUrl === '')
		{
			return false;
		}

		const title = MarketMobileHelper.normalizeString(options.title, '');
		const isSent = MarketMobileHelper.sendNativeEvent(MarketMobileNativeEvent.APP_OPEN, {
			url: absoluteUrl,
			title,
		});

		if (!isSent)
		{
			window.location.href = absoluteUrl;
		}

		return true;
	}

	static sendNativeEvent(eventType, data = {}): boolean
	{
		const preparedEventType = MarketMobileHelper.normalizeString(eventType, '');

		if (
			preparedEventType === ''
			|| !Type.isFunction(window.BXNativeBridge && window.BXNativeBridge.sendEvent)
		)
		{
			return false;
		}

		try
		{
			window.BXNativeBridge.sendEvent(
				preparedEventType,
				Type.isPlainObject(data) ? data : {},
			);

			return true;
		}
		catch (error)
		{
			console.error(error);

			return false;
		}
	}
}
