import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubToggleSettingView } from '../../component/setting-view/toggle-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'enable_auto_using_finished_lead';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ENABLE_AUTO_USING_FINISHED_LEAD_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ENABLE_AUTO_USING_FINISHED_LEAD_WHY',
);
const note = '';
const optionKey = 'enable_auto_using_finished_lead';
const description = why || note || optionKey;

export const CrmSettingsHubEnableAutoUsingFinishedLeadSetting = defineComponent({
	name: 'CrmSettingsHubEnableAutoUsingFinishedLeadSetting',
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
			setting-id="enable_auto_using_finished_lead"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubEnableAutoUsingFinishedLeadSetting,
	searchText: [
		title,
		why,
		optionKey,
	],
};
