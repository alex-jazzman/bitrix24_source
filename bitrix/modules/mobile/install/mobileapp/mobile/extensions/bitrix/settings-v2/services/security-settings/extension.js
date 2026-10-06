/**
 * @module settings-v2/services/security-settings
 */
jn.define('settings-v2/services/security-settings', (require, exports, module) => {
	const { SECURITY_SETTINGS_KEY } = require('settings-v2/const');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { SecuritySetActionByOption, EventType, SecurityOption } = require('settings-v2/const');
	const { SettingEmitter } = require('settings-v2/emitter');
	const { isEqual } = require('utils/object');

	const CACHE_TTL = 2_592_000;
	const GET_SECURITY_SETTINGS_ACTION = 'mobile.Settings.getSecuritySettings';
	const LOGOUT_OTHER_DEVICES_ACTION = 'intranetmobile.loginhistory.logoutOtherDevices';

	class SecuritySettingsService
	{
		static #getExecutor()
		{
			return (new RunActionExecutor(GET_SECURITY_SETTINGS_ACTION, {}))
				.enableJson()
				.setCacheId(SECURITY_SETTINGS_KEY)
				.setCacheTtl(CACHE_TTL)
				.setCacheHandler(() => {})
				.setHandler((response) => SecuritySettingsService.handleResponse(response));
		}

		static async handleResponse(response)
		{
			const cachedData = await SecuritySettingsService.getCache().data;
			const responseData = response.data;

			if (!isEqual(cachedData, responseData))
			{
				for (const [key, value] of Object.entries(cachedData))
				{
					if (!isEqual(value, responseData[key]))
					{
						SettingEmitter.emit(EventType.changeSecurityState, {
							settingId: key,
							value,
						});
					}
				}
			}
		}

		static async fetch()
		{
			return SecuritySettingsService.#getExecutor().call(true);
		}

		static async getCache()
		{
			const executor = SecuritySettingsService.#getExecutor();

			return executor.getCache().getData();
		}

		static async getCachedSecurityOptions()
		{
			const cache = await SecuritySettingsService.getCache();

			return cache?.data || null;
		}

		static async setCacheBySecurityOption(securityOption, value)
		{
			const cache = await SecuritySettingsService.getCache();
			if (cache && cache.data)
			{
				const updatedCache = {
					...cache,
					data: {
						...cache.data,
						[securityOption]: value,
					},
				};

				const executor = SecuritySettingsService.#getExecutor();
				executor.getCache().saveData(updatedCache);
			}
			else
			{
				console.warn('Cache not found for security settings');
			}
		}

		static async update(securityOption, value)
		{
			if (!SecuritySetActionByOption[securityOption])
			{
				console.error('Set action is not defined for type:', securityOption);

				return Promise.reject(new Error(`Set action is not defined for type: ${securityOption}`));
			}

			const response = await (new RunActionExecutor(SecuritySetActionByOption[securityOption], { value }))
				.enableJson()
				.call();

			if (response.errors && response.errors.length > 0)
			{
				console.error('Update failed:', response.errors);

				return Promise.reject(response.errors);
			}

			await SecuritySettingsService.setCacheBySecurityOption(securityOption, value);

			return response;
		}

		static async logoutOtherDevices()
		{
			const response = await (new RunActionExecutor(LOGOUT_OTHER_DEVICES_ACTION, {}))
				.enableJson()
				.setSkipDuplicateRequests()
				.call();

			if (response.errors && response.errors.length > 0)
			{
				console.error('Logout other devices failed:', response.errors);

				return Promise.reject(response.errors);
			}

			return response;
		}
	}

	module.exports = {
		SecuritySettingsService,
	};
});
