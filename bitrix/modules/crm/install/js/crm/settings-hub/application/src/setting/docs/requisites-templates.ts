import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSidePanelLink } from '../../component/side-panel-link/side-panel-link';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'requisites_templates';
const navigationId = 'requisite-templates';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_REQUISITES_TEMPLATES_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_REQUISITES_TEMPLATES_WHY',
);
const optionKey = '';
const description = why || optionKey;

export const CrmSettingsHubRequisitesTemplatesLink = defineComponent({
	name: 'CrmSettingsHubRequisitesTemplatesSetting',
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

export const CrmSettingsHubRequisitesTemplatesSetting = CrmSettingsHubRequisitesTemplatesLink;

export const registration: SettingRegistration = {
	id: settingId,
	navigationId,
	component: CrmSettingsHubRequisitesTemplatesLink,
	searchText: [
		title,
		why,
	],
};
