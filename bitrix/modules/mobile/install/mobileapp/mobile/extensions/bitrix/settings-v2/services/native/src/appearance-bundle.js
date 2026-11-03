/**
 * @module settings-v2/services/native/src/appearance-bundle
 */
jn.define('settings-v2/services/native/src/appearance-bundle', (require, exports, module) => {
	const { appConfig } = require('native/config');
	const { NativeSettingsId } = require('settings-v2/const');

	/**
	 * @class NativeAppearanceBundleService
	 */
	class NativeAppearanceBundleService
	{
		/**
		 * @return {Promise<{options: Array<String>, optionData: Object}>}
		 */
		static async getCatalog()
		{
			const setting = await NativeAppearanceBundleService.#getSetting();

			return {
				options: setting?.options ?? [],
				optionData: setting?.optionData ?? {},
			};
		}

		/**
		 * @return {Promise<Array<String>>}
		 */
		static async getOptions()
		{
			const { options } = await NativeAppearanceBundleService.getCatalog();

			return options;
		}

		/**
		 * @return {Promise<Object>}
		 */
		static async getOptionData()
		{
			const { optionData } = await NativeAppearanceBundleService.getCatalog();

			return optionData;
		}

		/**
		 * @return {Promise<string|null>}
		 */
		static async getBackgroundTextColorMode()
		{
			const setting = await NativeAppearanceBundleService.#getSetting();
			const bundleId = setting?.value;

			if (!bundleId)
			{
				return null;
			}

			return setting?.optionData?.[bundleId]?.backgroundTextColorMode ?? null;
		}

		static async #getSetting()
		{
			const settingsList = await appConfig.getSettings() ?? [];

			return settingsList.find((setting) => setting.id === NativeSettingsId.APP_BUNDLE);
		}
	}

	module.exports = {
		NativeAppearanceBundleService,
	};
});
