import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubToggleSettingView } from '../../component/setting-view/toggle-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'enable_slider';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ENABLE_SLIDER_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ENABLE_SLIDER_WHY',
);
const note = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ENABLE_SLIDER_NOTE',
);
const optionKey = 'enable_slider';
const description = why || note || optionKey;

export const CrmSettingsHubEnableSliderSetting = defineComponent({
	name: 'CrmSettingsHubEnableSliderSetting',
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
			setting-id="enable_slider"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubEnableSliderSetting,
	searchText: [
		title,
		why,
		note,
		optionKey,
	],
};
