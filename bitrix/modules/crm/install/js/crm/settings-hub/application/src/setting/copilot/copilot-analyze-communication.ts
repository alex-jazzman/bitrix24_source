import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubToggleSettingView } from '../../component/setting-view/toggle-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'copilot_analyze_communication';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_COPILOT_ANALYZE_COMMUNICATION_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_COPILOT_ANALYZE_COMMUNICATION_WHY',
);
const note = '';
const optionKey = 'crm_copilot_analyze_communication_enabled';
const description = why || note || optionKey;

export const CrmSettingsHubCopilotAnalyzeCommunicationSetting = defineComponent({
	name: 'CrmSettingsHubCopilotAnalyzeCommunicationSetting',
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
			setting-id="copilot_analyze_communication"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubCopilotAnalyzeCommunicationSetting,
	searchText: [
		title,
		why,
		optionKey,
	],
};
