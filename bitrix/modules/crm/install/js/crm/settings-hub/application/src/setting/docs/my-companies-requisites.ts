import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSidePanelLink } from '../../component/side-panel-link/side-panel-link';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'my_companies_requisites';
const navigationId = 'my-companies';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_MY_COMPANIES_REQUISITES_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_MY_COMPANIES_REQUISITES_WHY',
);
const optionKey = '';
const description = why || optionKey;

export const CrmSettingsHubMyCompaniesRequisitesLink = defineComponent({
	name: 'CrmSettingsHubMyCompaniesRequisitesSetting',
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

export const CrmSettingsHubMyCompaniesRequisitesSetting = CrmSettingsHubMyCompaniesRequisitesLink;

export const registration: SettingRegistration = {
	id: settingId,
	navigationId,
	component: CrmSettingsHubMyCompaniesRequisitesLink,
	searchText: [
		title,
		why,
	],
};
