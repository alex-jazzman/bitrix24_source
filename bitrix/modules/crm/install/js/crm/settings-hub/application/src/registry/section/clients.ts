import { Loc } from 'main.core';

import {
	registration as dupCtrlLeadRegistration,
} from '../../setting/clients/dup-ctrl-lead';
import {
	registration as dupCtrlContactRegistration,
} from '../../setting/clients/dup-ctrl-contact';
import {
	registration as dupCtrlCompanyRegistration,
} from '../../setting/clients/dup-ctrl-company';
import {
	registration as prsnNmFrmtIdRegistration,
} from '../../setting/clients/prsn-nm-frmt-id';
import {
	registration as entAddrFrmtIdRegistration,
} from '../../setting/clients/ent-addr-frmt-id';
import { type SettingsSectionRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

export const clientsSection: SettingsSectionRegistration = {
	id: 'clients',
	title: getMessage('CRM_SETTINGS_HUB_SECTION_CLIENTS_TITLE'),
	type: 'settings-group',
	blocks: [
		{
			id: 'duplicates',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_DUPLICATES_TITLE'),
			icon: 'o-duplicate',
			settings: [
				dupCtrlLeadRegistration,
				dupCtrlContactRegistration,
				dupCtrlCompanyRegistration,
			],
		},
		{
			id: 'data_formats',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_DATA_FORMATS_TITLE'),
			icon: 'o-text',
			settings: [
				prsnNmFrmtIdRegistration,
				entAddrFrmtIdRegistration,
			],
		},
	],
};
