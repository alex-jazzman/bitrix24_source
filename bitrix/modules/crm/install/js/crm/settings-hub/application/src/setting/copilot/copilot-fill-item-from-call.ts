import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubToggleSettingView } from '../../component/setting-view/toggle-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'copilot_fill_item_from_call';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_COPILOT_FILL_ITEM_FROM_CALL_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_COPILOT_FILL_ITEM_FROM_CALL_WHY',
);
const note = '';
const optionKey = 'crm_copilot_fill_item_from_call_enabled';
const description = why || note || optionKey;

export const CrmSettingsHubCopilotFillItemFromCallSetting = defineComponent({
	name: 'CrmSettingsHubCopilotFillItemFromCallSetting',
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
			setting-id="copilot_fill_item_from_call"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubCopilotFillItemFromCallSetting,
	searchText: [
		title,
		why,
		optionKey,
	],
};
