import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSelectSettingView } from '../../component/setting-view/select-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'ent_addr_frmt_id';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ENT_ADDR_FRMT_ID_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ENT_ADDR_FRMT_ID_WHY',
);
const note = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ENT_ADDR_FRMT_ID_NOTE',
);
const optionKey = 'ent_addr_frmt_id';
const description = why || note || optionKey;
const options = [
	{
		value: '1',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_ENT_ADDR_FRMT_ID_OPTION_1'),
	},
	{
		value: '2',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_ENT_ADDR_FRMT_ID_OPTION_2'),
	},
	{
		value: '3',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_ENT_ADDR_FRMT_ID_OPTION_3'),
	},
	{
		value: '4',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_ENT_ADDR_FRMT_ID_OPTION_4'),
	},
	{
		value: '5',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_ENT_ADDR_FRMT_ID_OPTION_5'),
	},
	{
		value: '6',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_ENT_ADDR_FRMT_ID_OPTION_6'),
	},
];

export const CrmSettingsHubEntAddrFrmtIdSetting = defineComponent({
	name: 'CrmSettingsHubEntAddrFrmtIdSetting',
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
			setting-id="ent_addr_frmt_id"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubEntAddrFrmtIdSetting,
	searchText: [
		title,
		why,
		note,
		optionKey,
		...options.map(({ label }) => label),
	],
};
