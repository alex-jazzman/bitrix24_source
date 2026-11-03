import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSelectSettingView } from '../../component/setting-view/select-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'is_counters_use_activity_responsible';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_IS_COUNTERS_USE_ACTIVITY_RESPONSIBLE_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_IS_COUNTERS_USE_ACTIVITY_RESPONSIBLE_WHY',
);
const note = '';
const optionKey = 'is_counters_use_activity_responsible';
const description = why || note || optionKey;
const options = [
	{
		value: 'act',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_IS_COUNTERS_USE_ACTIVITY_RESPONSIBLE_OPTION_ACT'),
	},
	{
		value: 'entity',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_IS_COUNTERS_USE_ACTIVITY_RESPONSIBLE_OPTION_ENTITY'),
	},
];

export const CrmSettingsHubIsCountersUseActivityResponsibleSetting = defineComponent({
	name: 'CrmSettingsHubIsCountersUseActivityResponsibleSetting',
	components: {
		CrmSettingsHubSelectSettingView,
	},
	setup(): Object
	{
		useSettingState(settingId);

		return { description, options, title };
	},
	template: `
		<CrmSettingsHubSelectSettingView
			setting-id="is_counters_use_activity_responsible"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubIsCountersUseActivityResponsibleSetting,
	searchText: [
		title,
		why,
		optionKey,
		...options.map(({ label }) => label),
	],
};
