/**
 * @module settings-v2/services/native/src/cache
 */
jn.define('settings-v2/services/native/src/cache', (require, exports, module) => {
	const { appConfig } = require('native/config');
	const { NativeSettingsId } = require('settings-v2/const');

	/**
	 * @class NativeCacheService
	 */
	class NativeCacheService
	{
		/**
		 * @return {Promise<Record<string, string>>}
		 */
		static async getCacheIntervalOptionLabels()
		{
			const setting = await NativeCacheService.getCacheIntervalSetting();

			return setting.optionLabels;
		}

		/**
		 * @return {Promise<String[]>}
		 */
		static async getCacheIntervalOptions()
		{
			const setting = await NativeCacheService.getCacheIntervalSetting();

			return setting.options;
		}

		static async getCacheIntervalSetting()
		{
			return NativeCacheService.getSettingById(NativeSettingsId.CACHE_INTERVAL);
		}

		static async getCacheSettings()
		{
			return appConfig.cache.getSettings();
		}

		static async getSettingById(id)
		{
			const cacheSettings = await NativeCacheService.getCacheSettings();

			return cacheSettings.find((setting) => setting.id === id);
		}

		static async getSettingValueById(id)
		{
			const setting = await NativeCacheService.getSettingById(id);

			return setting?.value;
		}

		/**
		 * @return {Promise<String>}
		 */
		static async clearFiles()
		{
			return appConfig.cache.clearFiles();
		}

		/**
		 * @return {Promise<String>}
		 */
		static async clearMedia()
		{
			return appConfig.cache.clearMedia();
		}

		/**
		 * @return {Promise<String>}
		 */
		static async clearSystem()
		{
			return appConfig.cache.clearSystem();
		}
	}

	module.exports = {
		NativeCacheService,
	};
});
