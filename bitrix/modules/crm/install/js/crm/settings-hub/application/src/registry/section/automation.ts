import { Loc } from 'main.core';

import {
	registration as leadAutomationRegistration,
} from '../../setting/automation/lead-automation';
import {
	registration as dealAutomationRegistration,
} from '../../setting/automation/deal-automation';
import {
	registration as orderAutomationRegistration,
} from '../../setting/automation/order-automation';
import {
	registration as bizprocRegistration,
} from '../../setting/automation/bizproc';
import { type SettingsSectionRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

export const automationSection: SettingsSectionRegistration = {
	id: 'automation',
	title: getMessage('CRM_SETTINGS_HUB_SECTION_AUTOMATION_TITLE'),
	type: 'settings-group',
	blocks: [
		{
			id: 'robots',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_ROBOTS_TITLE'),
			icon: 'o-robot',
			settings: [
				leadAutomationRegistration,
				dealAutomationRegistration,
				orderAutomationRegistration,
			],
		},
		{
			id: 'business_processes',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_BUSINESS_PROCESSES_TITLE'),
			icon: 'o-business-process',
			settings: [
				bizprocRegistration,
			],
		},
	],
};
