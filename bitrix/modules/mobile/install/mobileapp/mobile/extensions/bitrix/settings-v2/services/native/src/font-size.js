/**
 * @module settings-v2/services/native/src/font-size
 */
jn.define('settings-v2/services/native/src/font-size', (require, exports, module) => {
	const { appConfig } = require('native/config');
	const { NativeSettingsId } = require('settings-v2/const');

	/**
	 * @class NativeFontSizeService
	 */
	class NativeFontSizeService
	{
		/**
		 * @return {Promise<Array<String>>}
		 */
		static async getOptions()
		{
			const setting = await NativeFontSizeService.#getSetting();

			return setting?.options ?? [];
		}

		static async #getSetting()
		{
			const settingsList = await appConfig.getSettings();

			return settingsList.find((setting) => setting.id === NativeSettingsId.APP_FONT_SIZE);
		}
	}

	module.exports = {
		NativeFontSizeService,
	};
});
