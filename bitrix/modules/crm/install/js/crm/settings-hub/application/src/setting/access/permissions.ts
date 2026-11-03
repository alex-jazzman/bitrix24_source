import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSidePanelLink } from '../../component/side-panel-link/side-panel-link';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'permissions';
const navigationId = 'crm-permissions';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_PERMISSIONS_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_PERMISSIONS_WHY',
);
const note = getMessage(
	'CRM_SETTINGS_HUB_SETTING_PERMISSIONS_NOTE',
);
const optionKey = '';
const description = why || note || optionKey;

export const CrmSettingsHubPermissionsLink = defineComponent({
	name: 'CrmSettingsHubPermissionsSetting',
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

export const CrmSettingsHubPermissionsSetting = CrmSettingsHubPermissionsLink;

export const registration: SettingRegistration = {
	id: settingId,
	navigationId,
	component: CrmSettingsHubPermissionsLink,
	searchText: [
		title,
		why,
		note,
	],
};
