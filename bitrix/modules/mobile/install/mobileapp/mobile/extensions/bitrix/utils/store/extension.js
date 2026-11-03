/**
 * @module utils/store
 */
jn.define('utils/store', (require, exports, module) => {
	const { Feature } = require('feature');
	// the module is missing below api 59, and Feature.isNativeStoreSupported() guards every use
	const { store } = require('native/store') || {};
	const { showErrorToast } = require('toast');

	const APP_STORE_URL = 'https://apps.apple.com/ru/app/bitrix24/id561683423';
	const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.bitrix24.android';
	const APP_GALLERY_URL = 'https://appgallery.huawei.com/app/C105947779';
	const RU_STORE_URL = 'https://www.rustore.ru/catalog/app/com.bitrix24.android';

	const isAndroid = Application.getPlatform() === 'android';

	const STORE_URLS = {
		appstore: APP_STORE_URL,
		googleplay: GOOGLE_PLAY_URL,
		appgallery: APP_GALLERY_URL,
		rustore: RU_STORE_URL,
	};

	const openStore = () => {
		if (!Feature.isNativeStoreSupported())
		{
			showErrorToast();

			return;
		}

		const storeId = store.getStoreId();

		const storeUrl = STORE_URLS[storeId];
		if (storeUrl)
		{
			Application.openUrl(storeUrl);
		}
		else
		{
			Application.openUrl(isAndroid ? GOOGLE_PLAY_URL : APP_STORE_URL);
		}
	};

	/**
	 * Whether the store this build came from lets tariffs and subscriptions be sold inside the app.
	 * Only RuStore does; every other store demands its own billing, and a build that cannot name its
	 * store is counted with them. The answer only ever takes a purchase call away - whether there is a
	 * call to make at all the server decides - so a caller ands its own flag with it, never replaces it.
	 *
	 * @return {boolean}
	 */
	const isPurchaseAllowedInStore = () => Feature.isNativeStoreSupported() && store.getStoreId() === 'rustore';

	/**
	 * Whether a purchase call may be drawn at all. The store of the build decides, unless the server
	 * hands over the debug flag that forces the call on any build; every caller asks this one and not
	 * the store rule directly.
	 *
	 * @param {boolean} [isCtaForced]
	 * @return {boolean}
	 */
	const isPurchaseAllowed = (isCtaForced = false) => isCtaForced === true || isPurchaseAllowedInStore();

	module.exports = {
		openStore,
		isPurchaseAllowedInStore,
		isPurchaseAllowed,
	};
});
