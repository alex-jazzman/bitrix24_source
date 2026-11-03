import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSelectSettingView } from '../../component/setting-view/select-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'email_service_code_allocation';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_EMAIL_SERVICE_CODE_ALLOCATION_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_EMAIL_SERVICE_CODE_ALLOCATION_WHY',
);
const note = '';
const optionKey = 'email_service_code_allocation';
const description = why || note || optionKey;
const options = [
	{
		value: '2',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_EMAIL_SERVICE_CODE_ALLOCATION_OPTION_2'),
	},
	{
		value: '1',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_EMAIL_SERVICE_CODE_ALLOCATION_OPTION_1'),
	},
	{
		value: '0',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_EMAIL_SERVICE_CODE_ALLOCATION_OPTION_0'),
	},
];

export const CrmSettingsHubEmailServiceCodeAllocationSetting = defineComponent({
	name: 'CrmSettingsHubEmailServiceCodeAllocationSetting',
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
			setting-id="email_service_code_allocation"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubEmailServiceCodeAllocationSetting,
	searchText: [
		title,
		why,
		optionKey,
		...options.map(({ label }) => label),
	],
};
