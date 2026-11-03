import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubToggleSettingView } from '../../component/setting-view/toggle-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'copilot_message_sender_editor';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_COPILOT_MESSAGE_SENDER_EDITOR_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_COPILOT_MESSAGE_SENDER_EDITOR_WHY',
);
const note = '';
const optionKey = 'crm_copilot_message_sender_editor_enabled';
const description = why || note || optionKey;

export const CrmSettingsHubCopilotMessageSenderEditorSetting = defineComponent({
	name: 'CrmSettingsHubCopilotMessageSenderEditorSetting',
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
			setting-id="copilot_message_sender_editor"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubCopilotMessageSenderEditorSetting,
	searchText: [
		title,
		why,
		optionKey,
	],
};
