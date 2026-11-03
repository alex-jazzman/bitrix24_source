import { Loc } from 'main.core';

import {
	registration as externalSaleRegistration,
} from '../../setting/integrations/external-sale';
import {
	registration as integrationsSmsRegistration,
} from '../../setting/integrations/integrations-sms';
import {
	registration as integrations1cRegistration,
} from '../../setting/integrations/integrations-1c';
import {
	registration as crmMigrationRegistration,
} from '../../setting/integrations/crm-migration';
import { type SettingsSectionRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

export const integrationsSection: SettingsSectionRegistration = {
	id: 'integrations',
	title: getMessage('CRM_SETTINGS_HUB_SECTION_INTEGRATIONS_TITLE'),
	type: 'settings-group',
	blocks: [
		{
			id: 'external_systems',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_EXTERNAL_SYSTEMS_TITLE'),
			icon: 'o-connection',
			settings: [
				externalSaleRegistration,
				integrationsSmsRegistration,
				integrations1cRegistration,
				crmMigrationRegistration,
			],
		},
	],
};
