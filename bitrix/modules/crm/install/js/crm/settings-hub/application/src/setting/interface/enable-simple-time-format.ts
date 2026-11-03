import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubToggleSettingView } from '../../component/setting-view/toggle-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'enable_simple_time_format';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ENABLE_SIMPLE_TIME_FORMAT_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ENABLE_SIMPLE_TIME_FORMAT_WHY',
);
const note = '';
const optionKey = 'enable_simple_time_format';
const description = why || note || optionKey;

export const CrmSettingsHubEnableSimpleTimeFormatSetting = defineComponent({
	name: 'CrmSettingsHubEnableSimpleTimeFormatSetting',
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
			setting-id="enable_simple_time_format"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubEnableSimpleTimeFormatSetting,
	searchText: [
		title,
		why,
		optionKey,
	],
};
