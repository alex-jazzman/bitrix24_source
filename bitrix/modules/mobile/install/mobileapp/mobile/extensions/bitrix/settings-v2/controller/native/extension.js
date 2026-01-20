/**
 * @module settings-v2/controller/native
 */
jn.define('settings-v2/controller/native', (require, exports, module) => {
	const { BaseSettingController } = require('settings-v2/controller/base');
	const { appConfig } = require('native/config');

	class NativeSettingController extends BaseSettingController
	{
		/**
		 * @public
		 */
		async get()
		{
			try
			{
				const currentSetting = await this.getCurrentSetting();

				return currentSetting.value ?? this.fallbackValue;
			}
			catch (e)
			{
				console.warn(e);

				return null;
			}
		}

		/**
		 * @public
		 * @param {*} value
		 */
		async set(value)
		{
			try
			{
				const currentSetting = await this.getCurrentSetting();
				if (currentSetting.reloadOnChanged)
				{
					this.showOnChangeAlert(async () => {
						await currentSetting.set(value);
						if (this.onChange)
						{
							this.onChange(value);
						}
					});
				}
				else
				{
					await currentSetting.set(value);
					if (this.onChange)
					{
						this.onChange(value);
					}
				}
			}
			catch (e)
			{
				console.error(e);
			}
		}

		async getCurrentSetting()
		{
			const settingsList = await appConfig.getSettings();

			return settingsList.find((setting) => setting.id === this.settingId);
		}
	}

	module.exports = {
		NativeSettingController,
	};
});
