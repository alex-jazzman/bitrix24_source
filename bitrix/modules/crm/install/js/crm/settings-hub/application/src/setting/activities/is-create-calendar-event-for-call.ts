import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubToggleSettingView } from '../../component/setting-view/toggle-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'is_create_calendar_event_for_call';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_IS_CREATE_CALENDAR_EVENT_FOR_CALL_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_IS_CREATE_CALENDAR_EVENT_FOR_CALL_WHY',
);
const note = '';
const optionKey = 'is_create_calendar_event_for_call';
const description = why || note || optionKey;

export const CrmSettingsHubIsCreateCalendarEventForCallSetting = defineComponent({
	name: 'CrmSettingsHubIsCreateCalendarEventForCallSetting',
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
			setting-id="is_create_calendar_event_for_call"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubIsCreateCalendarEventForCallSetting,
	searchText: [
		title,
		why,
		optionKey,
	],
};
