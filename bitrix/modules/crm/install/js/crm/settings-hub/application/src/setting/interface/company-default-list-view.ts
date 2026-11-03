import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSelectSettingView } from '../../component/setting-view/select-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'company_default_list_view';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_COMPANY_DEFAULT_LIST_VIEW_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_COMPANY_DEFAULT_LIST_VIEW_WHY',
);
const note = getMessage(
	'CRM_SETTINGS_HUB_SETTING_COMPANY_DEFAULT_LIST_VIEW_NOTE',
);
const optionKey = 'company_default_list_view';
const description = why || note || optionKey;
const options = [
	{
		value: '1',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_COMPANY_DEFAULT_LIST_VIEW_OPTION_1'),
	},
];

export const CrmSettingsHubCompanyDefaultListViewSetting = defineComponent({
	name: 'CrmSettingsHubCompanyDefaultListViewSetting',
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
			setting-id="company_default_list_view"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubCompanyDefaultListViewSetting,
	searchText: [
		title,
		why,
		note,
		optionKey,
		...options.map(({ label }) => label),
	],
};
