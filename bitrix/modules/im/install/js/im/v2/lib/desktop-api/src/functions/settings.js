import { Extension } from 'main.core';

import type { SettingsCollection } from 'main.core.collections';

export const DesktopSettingsKey = {
	hideImTab: 'bxd_hide_im_tab',
	smoothing: 'bxd_camera_smoothing',
	smoothing_v2: 'bxd_camera_smoothing_v2',
	telemetry: 'bxd_telemetry',
	sliderBindingsStatus: 'sliderBindingsStatus',
};

export const settingsFunctions = {
	getSliderBindingsStatus(): boolean
	{
		const result = this.getCustomSetting(DesktopSettingsKey.sliderBindingsStatus, '1');

		return result === '1';
	},
	isAirDesignEnabledInDesktop(): boolean
	{
		// duplicate setting from im.v2.lib.layout to minimize dependencies in external usages
		const settings: SettingsCollection = Extension.getSettings('im.v2.lib.layout');

		return this.isDesktop() && settings.get('isAirDesignEnabled', true);
	},
	getCameraSmoothingStatus(): boolean
	{
		return this.getCustomSetting(DesktopSettingsKey.smoothing, '0') === '1';
	},
	setCameraSmoothingStatus(status: boolean)
	{
		const preparedStatus = status === true ? '1' : '0';

		if (this.getApiVersion() > 76)
		{
			this.setCustomSetting(DesktopSettingsKey.smoothing_v2, preparedStatus);
			return;
		}

		this.setCustomSetting(DesktopSettingsKey.smoothing, preparedStatus);
	},
	isTwoWindowMode(): boolean
	{
		return Boolean(BXDesktopSystem?.IsTwoWindowsMode());
	},
	setTwoWindowMode(flag: boolean)
	{
		if (flag === true)
		{
			BXDesktopSystem?.V10();

			return;
		}

		BXDesktopSystem?.V8();
	},
	getAutostartStatus(): boolean
	{
		return BXDesktopSystem?.GetProperty('autostart');
	},
	setAutostartStatus(flag: boolean)
	{
		BXDesktopSystem?.SetProperty('autostart', flag);
	},
	getTelemetryStatus(): boolean
	{
		return this.getCustomSetting(DesktopSettingsKey.telemetry, '1') === '1';
	},
	setTelemetryStatus(flag: boolean)
	{
		this.setCustomSetting(DesktopSettingsKey.telemetry, flag ? '1' : '0');
	},
	setCustomSetting(name: string, value: string)
	{
		BXDesktopSystem?.StoreSettings(name, value);
	},
	getCustomSetting(name: string, defaultValue: string): string
	{
		return BXDesktopSystem?.QuerySettings(name, defaultValue);
	},
};
