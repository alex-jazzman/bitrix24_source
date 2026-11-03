import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubToggleSettingView } from '../../component/setting-view/toggle-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'enable_b24_email_sign';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ENABLE_B24_EMAIL_SIGN_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ENABLE_B24_EMAIL_SIGN_WHY',
);
const note = '';
const optionKey = 'enable_b24_email_sign';
const description = why || note || optionKey;

export const CrmSettingsHubEnableB24EmailSignSetting = defineComponent({
	name: 'CrmSettingsHubEnableB24EmailSignSetting',
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
			setting-id="enable_b24_email_sign"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubEnableB24EmailSignSetting,
	searchText: [
		title,
		why,
		optionKey,
	],
};
