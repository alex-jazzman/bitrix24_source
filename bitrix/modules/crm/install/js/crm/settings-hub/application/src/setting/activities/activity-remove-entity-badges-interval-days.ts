import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSelectSettingView } from '../../component/setting-view/select-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'activity_remove_entity_badges_interval_days';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ACTIVITY_REMOVE_ENTITY_BADGES_INTERVAL_DAYS_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ACTIVITY_REMOVE_ENTITY_BADGES_INTERVAL_DAYS_WHY',
);
const note = '';
const optionKey = 'activity_remove_entity_badges_interval_days';
const description = why || note || optionKey;
const options = [
	{
		value: '30',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_ACTIVITY_REMOVE_ENTITY_BADGES_INTERVAL_DAYS_OPTION_30'),
	},
	{
		value: '60',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_ACTIVITY_REMOVE_ENTITY_BADGES_INTERVAL_DAYS_OPTION_60'),
	},
	{
		value: '90',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_ACTIVITY_REMOVE_ENTITY_BADGES_INTERVAL_DAYS_OPTION_90'),
	},
];

export const CrmSettingsHubActivityRemoveEntityBadgesIntervalDaysSetting = defineComponent({
	name: 'CrmSettingsHubActivityRemoveEntityBadgesIntervalDaysSetting',
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
			setting-id="activity_remove_entity_badges_interval_days"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubActivityRemoveEntityBadgesIntervalDaysSetting,
	searchText: [
		title,
		why,
		optionKey,
		...options.map(({ label }) => label),
	],
};
