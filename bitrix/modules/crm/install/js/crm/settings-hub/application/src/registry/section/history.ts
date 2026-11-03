import { Loc } from 'main.core';

import {
	registration as historyEnableExportEventRegistration,
} from '../../setting/history/history-enable-export-event';
import {
	registration as historyEnableViewEventRegistration,
} from '../../setting/history/history-enable-view-event';
import {
	registration as historyViewEventGroupIntervalRegistration,
} from '../../setting/history/history-view-event-group-interval';
import {
	registration as historyEnableLeadRmEventRegistration,
} from '../../setting/history/history-enable-lead-rm-event';
import {
	registration as historyEnableContactRmEventRegistration,
} from '../../setting/history/history-enable-contact-rm-event';
import {
	registration as historyEnableCompanyRmEventRegistration,
} from '../../setting/history/history-enable-company-rm-event';
import {
	registration as historyEnableDealRmEventRegistration,
} from '../../setting/history/history-enable-deal-rm-event';
import {
	registration as historyEnableQuoteRmEventRegistration,
} from '../../setting/history/history-enable-quote-rm-event';
import {
	registration as enableDealRecycleBinRegistration,
} from '../../setting/history/enable-deal-recycle-bin';
import {
	registration as enableLeadRecycleBinRegistration,
} from '../../setting/history/enable-lead-recycle-bin';
import {
	registration as enableContactRecycleBinRegistration,
} from '../../setting/history/enable-contact-recycle-bin';
import {
	registration as enableCompanyRecycleBinRegistration,
} from '../../setting/history/enable-company-recycle-bin';
import {
	registration as recyclebinTtlRegistration,
} from '../../setting/history/recyclebin-ttl';
import {
	registration as volumeRegistration,
} from '../../setting/history/volume';
import { type SettingsSectionRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

export const historySection: SettingsSectionRegistration = {
	id: 'history',
	title: getMessage('CRM_SETTINGS_HUB_SECTION_HISTORY_TITLE'),
	type: 'settings-group',
	blocks: [
		{
			id: 'events',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_EVENTS_TITLE'),
			icon: 'o-timeline',
			settings: [
				historyEnableExportEventRegistration,
				historyEnableViewEventRegistration,
				historyViewEventGroupIntervalRegistration,
				historyEnableLeadRmEventRegistration,
				historyEnableContactRmEventRegistration,
				historyEnableCompanyRmEventRegistration,
				historyEnableDealRmEventRegistration,
				historyEnableQuoteRmEventRegistration,
			],
		},
		{
			id: 'recycle_bin',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_RECYCLE_BIN_TITLE'),
			icon: 'o-trashcan',
			settings: [
				enableDealRecycleBinRegistration,
				enableLeadRecycleBinRegistration,
				enableContactRecycleBinRegistration,
				enableCompanyRecycleBinRegistration,
				recyclebinTtlRegistration,
			],
		},
		{
			id: 'disk_space',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_DISK_SPACE_TITLE'),
			icon: 'o-storage',
			settings: [
				volumeRegistration,
			],
		},
	],
};
