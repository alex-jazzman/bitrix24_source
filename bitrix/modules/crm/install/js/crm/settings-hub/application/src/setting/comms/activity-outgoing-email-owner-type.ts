import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSelectSettingView } from '../../component/setting-view/select-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'activity_outgoing_email_owner_type';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ACTIVITY_OUTGOING_EMAIL_OWNER_TYPE_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ACTIVITY_OUTGOING_EMAIL_OWNER_TYPE_WHY',
);
const note = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ACTIVITY_OUTGOING_EMAIL_OWNER_TYPE_NOTE',
);
const optionKey = 'activity_outgoing_email_owner_type';
const description = why || note || optionKey;
const options = [
	{
		value: '1',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_ACTIVITY_OUTGOING_EMAIL_OWNER_TYPE_OPTION_1'),
	},
	{
		value: '3',
		label: getMessage('CRM_SETTINGS_HUB_SETTING_ACTIVITY_OUTGOING_EMAIL_OWNER_TYPE_OPTION_3'),
	},
];

export const CrmSettingsHubActivityOutgoingEmailOwnerTypeSetting = defineComponent({
	name: 'CrmSettingsHubActivityOutgoingEmailOwnerTypeSetting',
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
			setting-id="activity_outgoing_email_owner_type"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubActivityOutgoingEmailOwnerTypeSetting,
	searchText: [
		title,
		why,
		note,
		optionKey,
		...options.map(({ label }) => label),
	],
	parentId: 'activity_enable_unconnected_recipients',
};
