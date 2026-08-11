import {Type} from 'main.core';

export abstract class SettingsHolder
{
	protected settings: Record<string, any> = {};

	public getSettings(): Record<string, any>
	{
		return this.settings;
	}

	public setSettings(settings: Record<string, any>): void
	{
		this.settings = Type.isPlainObject(settings) ? settings : {};
	}

	public getSettingValue(name: string, defaultValue?: any): any
	{
		return this.settings.hasOwnProperty(name) ? this.settings[name] : defaultValue;
	}

	public setSettingValue(name: string, value: any): void
	{
		this.settings[name] = value;
	}
}
