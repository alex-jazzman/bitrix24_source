/**
 * @module settings-v2/controller/native
 */
jn.define('settings-v2/controller/native', (require, exports, module) => {
	const { BaseSettingController } = require('settings-v2/controller/base');
	const { SettingApplyStatus } = require('settings-v2/const');
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
		 * @return {Promise<SettingApplyResult>}
		 */
		async set(value)
		{
			try
			{
				const currentSetting = await this.getCurrentSetting();

				if (currentSetting.reloadOnChanged)
				{
					return await this.applyConfirmed(currentSetting, value);
				}

				return await this.apply(currentSetting, value);
			}
			catch (e)
			{
				console.error(e);

				return {
					status: SettingApplyStatus.ERROR,
					value,
				};
			}
		}

		/**
		 * @param {NativeSetting} currentSetting
		 * @param {*} value
		 * @return {Promise<SettingApplyResult>}
		 */
		async applyConfirmed(currentSetting, value)
		{
			return new Promise((resolve) => {
				this.showOnChangeAlert(
					async () => {
						resolve(await this.apply(currentSetting, value));
					},
					() => {
						resolve({
							status: SettingApplyStatus.CANCELLED,
							value,
						});
					},
				);
			});
		}

		/**
		 * @param {NativeSetting} currentSetting
		 * @param {*} value
		 * @return {Promise<SettingApplyResult>}
		 */
		async apply(currentSetting, value)
		{
			try
			{
				await currentSetting.set(value);

				if (this.onChange)
				{
					this.onChange(value);
				}

				return {
					status: SettingApplyStatus.SUCCESS,
					value,
				};
			}
			catch (e)
			{
				console.error(e);

				return {
					status: SettingApplyStatus.ERROR,
					value,
				};
			}
		}

		async getCurrentSetting()
		{
			const settingsList = await appConfig.getSettings() ?? [];

			return settingsList.find((setting) => setting.id === this.settingId);
		}
	}

	module.exports = {
		NativeSettingController,
	};
});
