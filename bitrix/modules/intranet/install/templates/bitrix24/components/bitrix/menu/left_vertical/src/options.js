import { Type } from 'main.core';
import { EventEmitter } from 'main.core.events';

export default class Options
{
	static version = '2021.10';
	static eventNameSpace = 'BX.Intranet.LeftMenu:';

	static eventName(name): string
	{
		return ['BX.Intranet.LeftMenu:', ...(Type.isStringFilled(name) ? [name] : name)].join(':');
	}

	static isExtranet = false;
	static isAdmin = false;
	static isCustomPresetRestricted = false;
	static settingsPath = null;
	static isMainPageEnabled = false;
	static isMessengerEmbedded = false;
	static isMainToolPickerEnabled = false;
	static mainToolPickerBootstrapRevision = 0;
	static mainToolState = null;

	static setMainToolPickerEnabled(enabled: boolean): void
	{
		this.isMainToolPickerEnabled = enabled === true;
		this.mainToolPickerBootstrapRevision++;
		this.mainToolState = null;
		EventEmitter.emit(this.eventName('onMainToolPickerBootstrap'), {
			enabled: this.isMainToolPickerEnabled,
		});
	}

	static canChangeMainTool(): boolean
	{
		return this.mainToolState?.canChangePersonal === true || this.mainToolState?.canManageAll === true;
	}

	static availablePresetTools = null;
	static inviteDialogLink = null;
	static showMarta = null;
	static showSitemapMenuItem = null;
}
