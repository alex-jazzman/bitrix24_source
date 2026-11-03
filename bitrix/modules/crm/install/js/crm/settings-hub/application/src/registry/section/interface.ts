import { Loc } from 'main.core';

import {
	registration as leadDefaultListViewRegistration,
} from '../../setting/interface/lead-default-list-view';
import {
	registration as contactDefaultListViewRegistration,
} from '../../setting/interface/contact-default-list-view';
import {
	registration as companyDefaultListViewRegistration,
} from '../../setting/interface/company-default-list-view';
import {
	registration as dealDefaultListViewRegistration,
} from '../../setting/interface/deal-default-list-view';
import {
	registration as invoiceDefaultListViewRegistration,
} from '../../setting/interface/invoice-default-list-view';
import {
	registration as enableUserNameSortingRegistration,
} from '../../setting/interface/enable-user-name-sorting';
import {
	registration as enableSimpleTimeFormatRegistration,
} from '../../setting/interface/enable-simple-time-format';
import { type SettingsSectionRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

export const interfaceSection: SettingsSectionRegistration = {
	id: 'interface',
	title: getMessage('CRM_SETTINGS_HUB_SECTION_INTERFACE_TITLE'),
	type: 'settings-group',
	blocks: [
		{
			id: 'list_views',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_LIST_VIEWS_TITLE'),
			icon: 'o-list-viewer',
			settings: [
				leadDefaultListViewRegistration,
				contactDefaultListViewRegistration,
				companyDefaultListViewRegistration,
				dealDefaultListViewRegistration,
				invoiceDefaultListViewRegistration,
			],
		},
		{
			id: 'display',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_DISPLAY_TITLE'),
			icon: 'o-screen',
			settings: [
				enableUserNameSortingRegistration,
				enableSimpleTimeFormatRegistration,
			],
		},
	],
};
