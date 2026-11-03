import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubToggleSettingView } from '../../component/setting-view/toggle-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'enable_depricated_statuses';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ENABLE_DEPRICATED_STATUSES_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ENABLE_DEPRICATED_STATUSES_WHY',
);
const note = '';
const optionKey = 'enable_depricated_statuses';
const description = why || note || optionKey;

export const CrmSettingsHubEnableDepricatedStatusesSetting = defineComponent({
	name: 'CrmSettingsHubEnableDepricatedStatusesSetting',
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
			setting-id="enable_depricated_statuses"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubEnableDepricatedStatusesSetting,
	searchText: [
		title,
		why,
		optionKey,
	],
};
