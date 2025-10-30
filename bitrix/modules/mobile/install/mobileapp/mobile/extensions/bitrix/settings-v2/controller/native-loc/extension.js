/**
 * @module settings-v2/controller/native-loc
 */
jn.define('settings-v2/controller/native-loc', (require, exports, module) => {
	const { NativeSettingController } = require('settings-v2/controller/native');
	const { appConfig } = require('native/config');

	class NativeLocSettingController extends NativeSettingController
	{
		/**
		 * @return {Promise<Object>}
		 */
		async getOptionLabels()
		{
			const currentSetting = await this.getCurrentSetting();

			return currentSetting.optionLabels;
		}

		/**
		 * @return {Promise<Array<String>>}
		 */
		async getOptions()
		{
			const currentSetting = await this.getCurrentSetting();

			return currentSetting.options;
		}

		getSystemLoc()
		{
			return appConfig.getSystemLang();
		}
	}

	module.exports = {
		NativeLocSettingController,
	};
});
