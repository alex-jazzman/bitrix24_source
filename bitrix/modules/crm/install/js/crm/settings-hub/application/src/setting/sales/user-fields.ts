import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSidePanelLink } from '../../component/side-panel-link/side-panel-link';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'user_fields';
const navigationId = 'user-fields';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_USER_FIELDS_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_USER_FIELDS_WHY',
);
const optionKey = '';
const description = why || optionKey;

export const CrmSettingsHubUserFieldsLink = defineComponent({
	name: 'CrmSettingsHubUserFieldsSetting',
	components: {
		CrmSettingsHubSidePanelLink,
	},
	setup(): Object
	{
		return { description, navigationId, settingId, title };
	},
	template: `
		<CrmSettingsHubSidePanelLink
			:setting-id="settingId"
			:navigation-id="navigationId"
			:description="description"
			:title="title"
		/>
	`,
});

export const CrmSettingsHubUserFieldsSetting = CrmSettingsHubUserFieldsLink;

export const registration: SettingRegistration = {
	id: settingId,
	navigationId,
	component: CrmSettingsHubUserFieldsLink,
	searchText: [
		title,
		why,
	],
};
