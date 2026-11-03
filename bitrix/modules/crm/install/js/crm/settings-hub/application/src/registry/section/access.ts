import { Loc } from 'main.core';

import {
	registration as permissionsRegistration,
} from '../../setting/access/permissions';
import {
	registration as leadOpenedFlagRegistration,
} from '../../setting/access/lead-opened-flag';
import {
	registration as contactOpenedFlagRegistration,
} from '../../setting/access/contact-opened-flag';
import {
	registration as companyOpenedFlagRegistration,
} from '../../setting/access/company-opened-flag';
import {
	registration as dealOpenedFlagRegistration,
} from '../../setting/access/deal-opened-flag';
import {
	registration as quoteOpenedFlagRegistration,
} from '../../setting/access/quote-opened-flag';
import { type SettingsSectionRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

export const accessSection: SettingsSectionRegistration = {
	id: 'access',
	title: getMessage('CRM_SETTINGS_HUB_SECTION_ACCESS_TITLE'),
	type: 'settings-group',
	blocks: [
		{
			id: 'rights',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_RIGHTS_TITLE'),
			icon: 'o-key',
			settings: [
				permissionsRegistration,
			],
		},
		{
			id: 'default_openness',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_DEFAULT_OPENNESS_TITLE'),
			icon: 'o-three-persons',
			settings: [
				leadOpenedFlagRegistration,
				contactOpenedFlagRegistration,
				companyOpenedFlagRegistration,
				dealOpenedFlagRegistration,
				quoteOpenedFlagRegistration,
			],
		},
	],
};
