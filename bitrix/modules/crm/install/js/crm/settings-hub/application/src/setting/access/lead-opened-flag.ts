import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubToggleSettingView } from '../../component/setting-view/toggle-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'lead_opened_flag';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_LEAD_OPENED_FLAG_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_LEAD_OPENED_FLAG_WHY',
);
const note = '';
const optionKey = 'lead_opened_flag';
const description = why || note || optionKey;

export const CrmSettingsHubLeadOpenedFlagSetting = defineComponent({
	name: 'CrmSettingsHubLeadOpenedFlagSetting',
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
			setting-id="lead_opened_flag"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubLeadOpenedFlagSetting,
	searchText: [
		title,
		why,
		optionKey,
	],
};
