import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubToggleSettingView } from '../../component/setting-view/toggle-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'callto_normalize_number';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_CALLTO_NORMALIZE_NUMBER_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_CALLTO_NORMALIZE_NUMBER_WHY',
);
const note = getMessage(
	'CRM_SETTINGS_HUB_SETTING_CALLTO_NORMALIZE_NUMBER_NOTE',
);
const optionKey = 'callto_custom_settings';
const description = why || note || optionKey;

export const CrmSettingsHubCalltoNormalizeNumberSetting = defineComponent({
	name: 'CrmSettingsHubCalltoNormalizeNumberSetting',
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
			setting-id="callto_normalize_number"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubCalltoNormalizeNumberSetting,
	searchText: [
		title,
		why,
		note,
		optionKey,
	],
};
