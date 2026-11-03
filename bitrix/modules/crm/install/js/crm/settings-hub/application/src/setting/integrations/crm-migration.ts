import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSidePanelLink } from '../../component/side-panel-link/side-panel-link';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'crm_migration';
const navigationId = 'crm-migration';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_CRM_MIGRATION_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_CRM_MIGRATION_WHY',
);
const note = getMessage(
	'CRM_SETTINGS_HUB_SETTING_CRM_MIGRATION_NOTE',
);
const optionKey = '';
const description = why || note || optionKey;
export const CrmSettingsHubCrmMigrationSetting = defineComponent({
	name: 'CrmSettingsHubCrmMigrationSetting',
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

export const registration: SettingRegistration = {
	id: settingId,
	navigationId,
	component: CrmSettingsHubCrmMigrationSetting,
	searchText: [
		title,
		why,
		note,
	],
};
