import { Loc } from 'main.core';

export const ButtonRole = Object.freeze({
	PRIMARY: 'primary',
	DESTRUCTIVE: 'destructive',
});

export const ConfirmPreset = Object.freeze({
	YES_NO: 'YES_NO',
	OK_CANCEL: 'OK_CANCEL',
});

export function getPresetDefaults(preset: string): { confirmText: string, cancelText: string }
{
	if (preset === ConfirmPreset.YES_NO)
	{
		return {
			confirmText: Loc.getMessage('CRM_TIMELINE_DIALOG_YES'),
			cancelText: Loc.getMessage('CRM_TIMELINE_DIALOG_NO'),
		};
	}

	return {
		confirmText: Loc.getMessage('CRM_TIMELINE_DIALOG_OK'),
		cancelText: Loc.getMessage('CRM_TIMELINE_DIALOG_CANCEL'),
	};
}
