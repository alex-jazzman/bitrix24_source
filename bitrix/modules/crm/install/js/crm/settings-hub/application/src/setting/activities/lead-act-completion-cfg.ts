import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubMatrixSettingView } from '../../component/setting-view/matrix-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'lead_act_completion_cfg';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_LEAD_ACT_COMPLETION_CFG_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_LEAD_ACT_COMPLETION_CFG_WHY',
);
const note = getMessage(
	'CRM_SETTINGS_HUB_SETTING_LEAD_ACT_COMPLETION_CFG_NOTE',
);
const optionKey = 'lead_act_completion_cfg';
const description = why || note || optionKey;

export const CrmSettingsHubLeadActCompletionCfgSetting = defineComponent({
	name: 'CrmSettingsHubLeadActCompletionCfgSetting',
	components: {
		CrmSettingsHubMatrixSettingView,
	},
	emits: ['activate'],
	setup(): Object
	{
		useSettingState(settingId);

		return { description, title };
	},
	template: `
		<CrmSettingsHubMatrixSettingView
			setting-id="lead_act_completion_cfg"
			:description="description"
			:title="title"
			@activate="$emit('activate', $event)"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubLeadActCompletionCfgSetting,
	searchText: [
		title,
		why,
		note,
		optionKey,
	],
};
