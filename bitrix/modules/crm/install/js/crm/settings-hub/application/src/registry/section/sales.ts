import { Loc } from 'main.core';

import {
	registration as pipelinesRegistration,
} from '../../setting/sales/pipelines';
import {
	registration as userFieldsRegistration,
} from '../../setting/sales/user-fields';
import {
	registration as directoriesRegistration,
} from '../../setting/sales/directories';
import {
	registration as stopListRegistration,
} from '../../setting/sales/stop-list';
import {
	registration as analyticsReportsRegistration,
} from '../../setting/sales/analytics-reports';
import {
	registration as locationsRegistration,
} from '../../setting/sales/locations';
import {
	registration as conversionEnableAutocreateRegistration,
} from '../../setting/sales/conversion-enable-autocreate';
import {
	registration as enableAutoGenRcRegistration,
} from '../../setting/sales/enable-auto-gen-rc';
import {
	registration as enableCloseDateSyncRegistration,
} from '../../setting/sales/enable-close-date-sync';
import {
	registration as actTaskKeepUnboundRegistration,
} from '../../setting/sales/act-task-keep-unbound';
import { type SettingsSectionRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

export const salesSection: SettingsSectionRegistration = {
	id: 'sales',
	title: getMessage('CRM_SETTINGS_HUB_SECTION_SALES_TITLE'),
	type: 'settings-group',
	blocks: [
		{
			id: 'funnels',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_FUNNELS_TITLE'),
			icon: 'o-filter-funnel',
			settings: [
				pipelinesRegistration,
			],
		},
		{
			id: 'fields_and_reports',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_FIELDS_AND_REPORTS_TITLE'),
			icon: 'o-table',
			settings: [
				userFieldsRegistration,
				directoriesRegistration,
				stopListRegistration,
				analyticsReportsRegistration,
				locationsRegistration,
			],
		},
		{
			id: 'deals',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_DEALS_TITLE'),
			icon: 'o-handshake',
			settings: [
				conversionEnableAutocreateRegistration,
				enableAutoGenRcRegistration,
				enableCloseDateSyncRegistration,
				actTaskKeepUnboundRegistration,
			],
		},
	],
};
