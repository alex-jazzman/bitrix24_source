import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSelectSettingView } from '../../component/setting-view/select-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'recyclebin_ttl';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_RECYCLEBIN_TTL_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_RECYCLEBIN_TTL_WHY',
);
const note = '';
const optionKey = 'recyclebin_ttl';
const description = why || note || optionKey;
const options = [
	{
		value: '30',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_RECYCLEBIN_TTL_OPTION_30'),
	},
	{
		value: '60',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_RECYCLEBIN_TTL_OPTION_60'),
	},
	{
		value: '90',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_RECYCLEBIN_TTL_OPTION_90'),
	},
	{
		value: '0',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_RECYCLEBIN_TTL_OPTION_0'),
	},
];

export const CrmSettingsHubRecyclebinTtlSetting = defineComponent({
	name: 'CrmSettingsHubRecyclebinTtlSetting',
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
			setting-id="recyclebin_ttl"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubRecyclebinTtlSetting,
	searchText: [
		title,
		why,
		optionKey,
		...options.map(({ label }) => label),
	],
};
