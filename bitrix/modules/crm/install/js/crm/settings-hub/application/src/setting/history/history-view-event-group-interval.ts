import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubTextSettingView } from '../../component/setting-view/text-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'history_view_event_group_interval';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_HISTORY_VIEW_EVENT_GROUP_INTERVAL_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_HISTORY_VIEW_EVENT_GROUP_INTERVAL_WHY',
);
const note = '';
const optionKey = 'history_view_event_group_interval';
const description = why || note || optionKey;

export const CrmSettingsHubHistoryViewEventGroupIntervalSetting = defineComponent({
	name: 'CrmSettingsHubHistoryViewEventGroupIntervalSetting',
	components: {
		CrmSettingsHubTextSettingView,
	},
	setup(): Object
	{
		useSettingState(settingId);

		return { description, title };
	},
	template: `
		<CrmSettingsHubTextSettingView
			setting-id="history_view_event_group_interval"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubHistoryViewEventGroupIntervalSetting,
	searchText: [
		title,
		why,
		optionKey,
	],
};
