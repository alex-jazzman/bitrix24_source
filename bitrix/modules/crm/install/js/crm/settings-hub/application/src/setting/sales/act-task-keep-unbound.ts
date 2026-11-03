import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubToggleSettingView } from '../../component/setting-view/toggle-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'act_task_keep_unbound';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ACT_TASK_KEEP_UNBOUND_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ACT_TASK_KEEP_UNBOUND_WHY',
);
const note = '';
const optionKey = 'act_task_keep_unbound';
const description = why || note || optionKey;

export const CrmSettingsHubActTaskKeepUnboundSetting = defineComponent({
	name: 'CrmSettingsHubActTaskKeepUnboundSetting',
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
			setting-id="act_task_keep_unbound"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubActTaskKeepUnboundSetting,
	searchText: [
		title,
		why,
		optionKey,
	],
};
