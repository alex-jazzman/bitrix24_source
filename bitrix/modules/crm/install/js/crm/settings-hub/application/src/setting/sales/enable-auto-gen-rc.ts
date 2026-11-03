import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubToggleSettingView } from '../../component/setting-view/toggle-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'enable_auto_gen_rc';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ENABLE_AUTO_GEN_RC_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ENABLE_AUTO_GEN_RC_WHY',
);
const note = '';
const optionKey = 'enable_auto_gen_rc';
const description = why || note || optionKey;

export const CrmSettingsHubEnableAutoGenRcSetting = defineComponent({
	name: 'CrmSettingsHubEnableAutoGenRcSetting',
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
			setting-id="enable_auto_gen_rc"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubEnableAutoGenRcSetting,
	searchText: [
		title,
		why,
		optionKey,
	],
};
