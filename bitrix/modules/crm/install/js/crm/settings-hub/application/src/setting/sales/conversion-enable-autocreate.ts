import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubToggleSettingView } from '../../component/setting-view/toggle-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'conversion_enable_autocreate';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_CONVERSION_ENABLE_AUTOCREATE_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_CONVERSION_ENABLE_AUTOCREATE_WHY',
);
const note = '';
const optionKey = 'conversion_enable_autocreate';
const description = why || note || optionKey;

export const CrmSettingsHubConversionEnableAutocreateSetting = defineComponent({
	name: 'CrmSettingsHubConversionEnableAutocreateSetting',
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
			setting-id="conversion_enable_autocreate"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubConversionEnableAutocreateSetting,
	searchText: [
		title,
		why,
		optionKey,
	],
};
