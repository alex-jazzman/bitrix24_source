import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubToggleSettingView } from '../../component/setting-view/toggle-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'act_cal_show_compl_meeting';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ACT_CAL_SHOW_COMPL_MEETING_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ACT_CAL_SHOW_COMPL_MEETING_WHY',
);
const note = '';
const optionKey = 'act_cal_show_compl_meeting';
const description = why || note || optionKey;

export const CrmSettingsHubActCalShowComplMeetingSetting = defineComponent({
	name: 'CrmSettingsHubActCalShowComplMeetingSetting',
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
			setting-id="act_cal_show_compl_meeting"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubActCalShowComplMeetingSetting,
	searchText: [
		title,
		why,
		optionKey,
	],
};
