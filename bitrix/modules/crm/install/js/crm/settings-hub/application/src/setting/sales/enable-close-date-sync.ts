import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubToggleSettingView } from '../../component/setting-view/toggle-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'enable_close_date_sync';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ENABLE_CLOSE_DATE_SYNC_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ENABLE_CLOSE_DATE_SYNC_WHY',
);
const note = '';
const optionKey = 'enable_close_date_sync';
const description = why || note || optionKey;

export const CrmSettingsHubEnableCloseDateSyncSetting = defineComponent({
	name: 'CrmSettingsHubEnableCloseDateSyncSetting',
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
			setting-id="enable_close_date_sync"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubEnableCloseDateSyncSetting,
	searchText: [
		title,
		why,
		optionKey,
	],
};
