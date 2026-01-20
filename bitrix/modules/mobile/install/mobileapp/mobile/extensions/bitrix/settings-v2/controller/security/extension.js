/**
 * @module settings-v2/controller/security
 */
jn.define('settings-v2/controller/security', (require, exports, module) => {
	const { BaseSettingController } = require('settings-v2/controller/base');
	const { SecuritySettingsService } = require('settings-v2/services/security-settings');

	class SecuritySettingsController extends BaseSettingController
	{
		constructor(props)
		{
			super(props);

			if (!props.securityOption)
			{
				throw new Error('Missing required securityOption');
			}

			this.securityOption = props.securityOption;
		}

		async get()
		{
			const securitySettings = await SecuritySettingsService.getCachedSecurityOptions();
			if (securitySettings)
			{
				return securitySettings[this.securityOption] ?? this.fallbackValue;
			}

			const response = await SecuritySettingsService.fetch();

			return response.data[this.securityOption] ?? this.fallbackValue;
		}

		async set(value)
		{
			SecuritySettingsService.update(this.securityOption, value).then(() => {
				if (this.onChange)
				{
					this.onChange(value);
				}
			}).catch(console.error);
		}
	}

	module.exports = {
		SecuritySettingsController,
	};
});
