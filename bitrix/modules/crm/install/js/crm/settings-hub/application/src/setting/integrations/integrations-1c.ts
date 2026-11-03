import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSidePanelLink } from '../../component/side-panel-link/side-panel-link';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'integrations_1c';
const navigationId = 'exchange-1c';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_INTEGRATIONS_1C_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_INTEGRATIONS_1C_WHY',
);
const optionKey = '';
const description = why || optionKey;
export const CrmSettingsHubIntegrations1cLink = defineComponent({
	name: 'CrmSettingsHubIntegrations1cSetting',
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

export const CrmSettingsHubIntegrations1cSetting = CrmSettingsHubIntegrations1cLink;

export const registration: SettingRegistration = {
	id: settingId,
	navigationId,
	component: CrmSettingsHubIntegrations1cLink,
	searchText: [
		title,
		why,
	],
};
