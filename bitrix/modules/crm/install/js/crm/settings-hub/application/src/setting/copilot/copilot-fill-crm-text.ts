import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubToggleSettingView } from '../../component/setting-view/toggle-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'copilot_fill_crm_text';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_COPILOT_FILL_CRM_TEXT_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_COPILOT_FILL_CRM_TEXT_WHY',
);
const note = '';
const optionKey = 'crm_copilot_fill_crm_text_enabled';
const description = why || note || optionKey;

export const CrmSettingsHubCopilotFillCrmTextSetting = defineComponent({
	name: 'CrmSettingsHubCopilotFillCrmTextSetting',
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
			setting-id="copilot_fill_crm_text"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubCopilotFillCrmTextSetting,
	searchText: [
		title,
		why,
		optionKey,
	],
};
