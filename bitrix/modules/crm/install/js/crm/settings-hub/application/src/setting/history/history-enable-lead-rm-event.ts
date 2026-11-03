import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubToggleSettingView } from '../../component/setting-view/toggle-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'history_enable_lead_rm_event';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_HISTORY_ENABLE_LEAD_RM_EVENT_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_HISTORY_ENABLE_LEAD_RM_EVENT_WHY',
);
const note = '';
const optionKey = 'history_enable_lead_rm_event';
const description = why || note || optionKey;

export const CrmSettingsHubHistoryEnableLeadRmEventSetting = defineComponent({
	name: 'CrmSettingsHubHistoryEnableLeadRmEventSetting',
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
			setting-id="history_enable_lead_rm_event"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubHistoryEnableLeadRmEventSetting,
	searchText: [
		title,
		why,
		optionKey,
	],
};
