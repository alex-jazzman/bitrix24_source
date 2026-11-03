import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubToggleSettingView } from '../../component/setting-view/toggle-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'copilot_call_assessment';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_COPILOT_CALL_ASSESSMENT_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_COPILOT_CALL_ASSESSMENT_WHY',
);
const note = '';
const optionKey = 'crm_copilot_call_assessment_enabled';
const description = why || note || optionKey;

export const CrmSettingsHubCopilotCallAssessmentSetting = defineComponent({
	name: 'CrmSettingsHubCopilotCallAssessmentSetting',
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
			setting-id="copilot_call_assessment"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubCopilotCallAssessmentSetting,
	searchText: [
		title,
		why,
		optionKey,
	],
};
