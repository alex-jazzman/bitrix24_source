import { Loc } from 'main.core';

import {
	registration as restEnableReqUfCheckRegistration,
} from '../../setting/rest/rest-enable-req-uf-check';
import {
	registration as marketplaceRegistration,
} from '../../setting/rest/marketplace';
import {
	registration as appConfigurationRegistration,
} from '../../setting/rest/app-configuration';
import { type SettingsSectionRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

export const restSection: SettingsSectionRegistration = {
	id: 'rest',
	title: getMessage('CRM_SETTINGS_HUB_SECTION_REST_TITLE'),
	type: 'settings-group',
	blocks: [
		{
			id: 'rest_api',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_REST_API_TITLE'),
			icon: 'o-developer-resources',
			settings: [
				restEnableReqUfCheckRegistration,
			],
		},
		{
			id: 'applications',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_APPLICATIONS_TITLE'),
			icon: 'o-apps',
			settings: [
				marketplaceRegistration,
				appConfigurationRegistration,
			],
		},
	],
};
