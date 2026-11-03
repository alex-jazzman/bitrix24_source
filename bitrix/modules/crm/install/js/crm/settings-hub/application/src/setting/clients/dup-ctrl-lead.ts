import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubToggleSettingView } from '../../component/setting-view/toggle-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'dup_ctrl_lead';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_DUP_CTRL_LEAD_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_DUP_CTRL_LEAD_WHY',
);
const note = '';
const optionKey = 'dup_ctrl';
const description = why || note || optionKey;

export const CrmSettingsHubDupCtrlLeadSetting = defineComponent({
	name: 'CrmSettingsHubDupCtrlLeadSetting',
	components: {
		CrmSettingsHubToggleSettingView,
	},
	setup(): Object
	{
		useSettingState(settingId);

		return { description, title };
	},
	template: `
		<CrmSettingsHubToggleSettingView
			setting-id="dup_ctrl_lead"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubDupCtrlLeadSetting,
	searchText: [
		title,
		why,
		optionKey,
	],
};
