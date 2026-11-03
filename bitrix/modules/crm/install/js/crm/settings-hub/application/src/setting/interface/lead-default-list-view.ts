import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSelectSettingView } from '../../component/setting-view/select-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'lead_default_list_view';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_LEAD_DEFAULT_LIST_VIEW_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_LEAD_DEFAULT_LIST_VIEW_WHY',
);
const note = '';
const optionKey = 'lead_default_list_view';
const description = why || note || optionKey;
const options = [
	{
		value: '1',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_LEAD_DEFAULT_LIST_VIEW_OPTION_1'),
	},
	{
		value: '3',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_LEAD_DEFAULT_LIST_VIEW_OPTION_3'),
	},
];

export const CrmSettingsHubLeadDefaultListViewSetting = defineComponent({
	name: 'CrmSettingsHubLeadDefaultListViewSetting',
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
			setting-id="lead_default_list_view"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubLeadDefaultListViewSetting,
	searchText: [
		title,
		why,
		optionKey,
		...options.map(({ label }) => label),
	],
};
