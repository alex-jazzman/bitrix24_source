import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubToggleSettingView } from '../../component/setting-view/toggle-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'deal_opened_flag';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_DEAL_OPENED_FLAG_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_DEAL_OPENED_FLAG_WHY',
);
const note = '';
const optionKey = 'deal_opened_flag';
const description = why || note || optionKey;

export const CrmSettingsHubDealOpenedFlagSetting = defineComponent({
	name: 'CrmSettingsHubDealOpenedFlagSetting',
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
			setting-id="deal_opened_flag"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubDealOpenedFlagSetting,
	searchText: [
		title,
		why,
		optionKey,
	],
};
