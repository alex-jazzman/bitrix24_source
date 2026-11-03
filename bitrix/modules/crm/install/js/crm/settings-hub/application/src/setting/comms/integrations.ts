import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSidePanelLink } from '../../component/side-panel-link/side-panel-link';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'integrations';
const navigationId = 'contact-center';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_INTEGRATIONS_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_INTEGRATIONS_WHY',
);
const note = getMessage(
	'CRM_SETTINGS_HUB_SETTING_INTEGRATIONS_NOTE',
);
const optionKey = '';
const description = why || note || optionKey;

export const CrmSettingsHubIntegrationsSetting = defineComponent({
	name: 'CrmSettingsHubIntegrationsSetting',
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
	component: CrmSettingsHubIntegrationsSetting,
	searchText: [
		title,
		why,
		note,
	],
};
