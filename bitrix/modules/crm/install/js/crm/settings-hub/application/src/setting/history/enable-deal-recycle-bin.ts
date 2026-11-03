import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubToggleSettingView } from '../../component/setting-view/toggle-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'enable_deal_recycle_bin';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ENABLE_DEAL_RECYCLE_BIN_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ENABLE_DEAL_RECYCLE_BIN_WHY',
);
const note = '';
const optionKey = 'enable_deal_recycle_bin';
const description = why || note || optionKey;

export const CrmSettingsHubEnableDealRecycleBinSetting = defineComponent({
	name: 'CrmSettingsHubEnableDealRecycleBinSetting',
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
			setting-id="enable_deal_recycle_bin"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubEnableDealRecycleBinSetting,
	searchText: [
		title,
		why,
		optionKey,
	],
};
