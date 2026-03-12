/**
 * @module settings-v2/services/native/src/style
 */
jn.define('settings-v2/services/native/src/style', (require, exports, module) => {
	const { appConfig } = require('native/config');
	const { NativeSettingsId } = require('settings-v2/const');

	/**
	 * @class NativeStyleService
	 */
	class NativeStyleService
	{
		/**
		 * @return {Promise<Object>}
		 */
		static async getOptionLabels()
		{
			const setting = await NativeStyleService.#getSetting();

			return setting.optionLabels;
		}

		/**
		 * @return {Promise<Array<String>>}
		 */
		static async getOptions()
		{
			const setting = await NativeStyleService.#getSetting();

			return setting.options;
		}

		static async #getSetting()
		{
			const settingsList = await appConfig.getSettings();

			return settingsList.find((setting) => setting.id === NativeSettingsId.APP_STYLE);
		}
	}

	module.exports = {
		NativeStyleService,
	};
});
