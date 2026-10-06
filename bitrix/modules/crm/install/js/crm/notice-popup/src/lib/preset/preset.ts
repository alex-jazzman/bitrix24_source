import { Loc } from 'main.core';

import type { NoticePopupOptions } from '../../const/options';

type NoticePopupPreset = {
	illustration: string,
	titleId: string,
	textId: string,
};

const PRESETS: Record<string, NoticePopupPreset> = Object.freeze({
	accessDenied: {
		illustration: 'access-denied',
		titleId: 'CRM_NOTICE_POPUP_ACCESS_DENIED_TITLE',
		textId: 'CRM_NOTICE_POPUP_ACCESS_DENIED_TEXT',
	},
});

export function getPreset(name: string): NoticePopupPreset
{
	const preset = PRESETS[name];
	if (!preset)
	{
		throw new Error(`Unknown notice popup preset: ${name}`);
	}

	return preset;
}

export function buildAccessDeniedOptions(overrides: NoticePopupOptions = {}): NoticePopupOptions
{
	const preset = getPreset('accessDenied');

	return {
		illustration: preset.illustration,
		title: Loc.getMessage(preset.titleId) ?? '',
		text: Loc.getMessage(preset.textId) ?? '',
		...overrides,
	};
}
