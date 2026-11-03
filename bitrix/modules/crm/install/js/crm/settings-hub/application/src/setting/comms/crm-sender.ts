import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSelectSettingView } from '../../component/setting-view/select-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'crm_sender';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_CRM_SENDER_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_CRM_SENDER_WHY',
);
const note = getMessage(
	'CRM_SETTINGS_HUB_SETTING_CRM_SENDER_NOTE',
);
const optionKey = '~CRM_SENDER';
const description = why || note || optionKey;
const options = [
	{
		value: 'auto',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_CRM_SENDER_OPTION_AUTO'),
	},
	{
		value: 'bitrix24',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_CRM_SENDER_OPTION_BITRIX24'),
	},
	{
		value: 'sms_provider',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_CRM_SENDER_OPTION_SMS_PROVIDER'),
	},
	{
		value: 'mail',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_CRM_SENDER_OPTION_MAIL'),
	},
];

export const CrmSettingsHubCrmSenderSetting = defineComponent({
	name: 'CrmSettingsHubCrmSenderSetting',
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
			setting-id="crm_sender"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubCrmSenderSetting,
	searchText: [
		title,
		why,
		note,
		optionKey,
		...options.map(({ label }) => label),
	],
};
