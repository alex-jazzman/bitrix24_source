import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSelectSettingView } from '../../component/setting-view/select-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'invoice_default_list_view';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_INVOICE_DEFAULT_LIST_VIEW_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_INVOICE_DEFAULT_LIST_VIEW_WHY',
);
const note = '';
const optionKey = 'invoice_default_list_view';
const description = why || note || optionKey;
const options = [
	{
		value: '1',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_INVOICE_DEFAULT_LIST_VIEW_OPTION_1'),
	},
	{
		value: '3',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_INVOICE_DEFAULT_LIST_VIEW_OPTION_3'),
	},
];

export const CrmSettingsHubInvoiceDefaultListViewSetting = defineComponent({
	name: 'CrmSettingsHubInvoiceDefaultListViewSetting',
	components: {
		CrmSettingsHubSelectSettingView,
	},
	setup(): Object
	{
		useSettingState(settingId);

		return { description, options, title };
	},
	template: `
		<CrmSettingsHubSelectSettingView
			setting-id="invoice_default_list_view"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubInvoiceDefaultListViewSetting,
	searchText: [
		title,
		why,
		optionKey,
		...options.map(({ label }) => label),
	],
};
