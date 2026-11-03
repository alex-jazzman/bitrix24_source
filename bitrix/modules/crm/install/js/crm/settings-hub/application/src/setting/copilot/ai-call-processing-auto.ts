import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubToggleSettingView } from '../../component/setting-view/toggle-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'ai_call_processing_auto';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_AI_CALL_PROCESSING_AUTO_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_AI_CALL_PROCESSING_AUTO_WHY',
);
const note = getMessage(
	'CRM_SETTINGS_HUB_SETTING_AI_CALL_PROCESSING_AUTO_NOTE',
);
const optionKey = 'AI_CALL_PROCESSING_ALLOWED_AUTO_V2';
const description = why || note || optionKey;

export const CrmSettingsHubAiCallProcessingAutoSetting = defineComponent({
	name: 'CrmSettingsHubAiCallProcessingAutoSetting',
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
			setting-id="ai_call_processing_auto"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubAiCallProcessingAutoSetting,
	searchText: [
		title,
		why,
		note,
		optionKey,
	],
};
