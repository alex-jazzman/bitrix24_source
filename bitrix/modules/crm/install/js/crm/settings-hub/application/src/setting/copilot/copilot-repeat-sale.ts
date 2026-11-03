import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubToggleSettingView } from '../../component/setting-view/toggle-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'copilot_repeat_sale';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_COPILOT_REPEAT_SALE_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_COPILOT_REPEAT_SALE_WHY',
);
const note = '';
const optionKey = 'crm_copilot_repeat_sale_enabled';
const description = why || note || optionKey;

export const CrmSettingsHubCopilotRepeatSaleSetting = defineComponent({
	name: 'CrmSettingsHubCopilotRepeatSaleSetting',
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
			setting-id="copilot_repeat_sale"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubCopilotRepeatSaleSetting,
	searchText: [
		title,
		why,
		optionKey,
	],
};
