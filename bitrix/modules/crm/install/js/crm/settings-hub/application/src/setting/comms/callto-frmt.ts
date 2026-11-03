import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSelectSettingView } from '../../component/setting-view/select-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'callto_frmt';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_CALLTO_FRMT_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_CALLTO_FRMT_WHY',
);
const note = '';
const optionKey = 'callto_frmt';
const description = why || note || optionKey;
const options = [
	{
		value: '1',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_CALLTO_FRMT_OPTION_1'),
	},
	{
		value: '2',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_CALLTO_FRMT_OPTION_2'),
	},
	{
		value: '4',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_CALLTO_FRMT_OPTION_4'),
	},
	{
		value: '3',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_CALLTO_FRMT_OPTION_3'),
	},
];

export const CrmSettingsHubCalltoFrmtSetting = defineComponent({
	name: 'CrmSettingsHubCalltoFrmtSetting',
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
			setting-id="callto_frmt"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubCalltoFrmtSetting,
	searchText: [
		title,
		why,
		optionKey,
		...options.map(({ label }) => label),
	],
};
