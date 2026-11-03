import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubToggleSettingView } from '../../component/setting-view/toggle-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'enable_user_name_sorting';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ENABLE_USER_NAME_SORTING_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ENABLE_USER_NAME_SORTING_WHY',
);
const note = '';
const optionKey = 'enable_user_name_sorting';
const description = why || note || optionKey;

export const CrmSettingsHubEnableUserNameSortingSetting = defineComponent({
	name: 'CrmSettingsHubEnableUserNameSortingSetting',
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
			setting-id="enable_user_name_sorting"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubEnableUserNameSortingSetting,
	searchText: [
		title,
		why,
		optionKey,
	],
};
