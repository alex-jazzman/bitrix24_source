/**
 * @module more-menu/block/company/app-font-scale
 */
jn.define('more-menu/block/company/app-font-scale', (require, exports, module) => {
	const { Feature } = require('feature');

	const STORAGE_ID = 'app-font-scale';
	const STORAGE_KEY = 'value';

	const NORMAL_APP_FONT_SCALE = '1.0';
	const APP_FONT_SCALES = new Set([NORMAL_APP_FONT_SCALE, '1.1', '1.2']);

	/**
	 * Read out of a store every JS context shares, because the setting itself only reads asynchronously
	 * while a consumer states the height of its card as its extension loads. The section of the company
	 * runs in a context of its own, so a module variable of the menu would never reach it.
	 * @returns {string}
	 */
	const getAppFontScale = () => {
		if (!Feature.isAppFontSizeEnabled())
		{
			return NORMAL_APP_FONT_SCALE;
		}

		const stored = Application.sharedStorage(STORAGE_ID).get(STORAGE_KEY);

		return APP_FONT_SCALES.has(stored) ? stored : NORMAL_APP_FONT_SCALE;
	};

	/**
	 * Reads the setting and stores it for the synchronous readers above. Called by the menu, which waits
	 * for its own data anyway; the settings are required here rather than at the top of the extension, so
	 * that a consumer of the scale alone brings in neither them nor the native config behind them.
	 * @returns {Promise<void>}
	 */
	const storeAppFontScale = async () => {
		if (!Feature.isAppFontSizeEnabled())
		{
			return;
		}

		const { NativeSettingController } = require('settings-v2/controller/native');
		const { NativeSettingsId } = require('settings-v2/const');

		const scale = await new NativeSettingController({
			settingId: NativeSettingsId.APP_FONT_SIZE,
			fallbackValue: NORMAL_APP_FONT_SCALE,
		}).get();

		if (APP_FONT_SCALES.has(scale))
		{
			Application.sharedStorage(STORAGE_ID).set(STORAGE_KEY, scale);
		}
	};

	module.exports = {
		NORMAL_APP_FONT_SCALE,
		getAppFontScale,
		storeAppFontScale,
	};
});
