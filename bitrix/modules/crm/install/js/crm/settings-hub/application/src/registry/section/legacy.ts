import { Loc } from 'main.core';

import {
	registration as enableSliderRegistration,
} from '../../setting/legacy/enable-slider';
import {
	registration as enableDepricatedStatusesRegistration,
} from '../../setting/legacy/enable-depricated-statuses';
import {
	registration as enableAutoUsingFinishedLeadRegistration,
} from '../../setting/legacy/enable-auto-using-finished-lead';
import { type SettingsSectionRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

export const legacySection: SettingsSectionRegistration = {
	id: 'legacy',
	title: getMessage('CRM_SETTINGS_HUB_SECTION_LEGACY_TITLE'),
	type: 'settings-group',
	blocks: [
		{
			id: 'compatibility',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_COMPATIBILITY_TITLE'),
			icon: 'o-alert',
			settings: [
				enableSliderRegistration,
				enableDepricatedStatusesRegistration,
				enableAutoUsingFinishedLeadRegistration,
			],
		},
	],
};
