import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSidePanelLink } from '../../component/side-panel-link/side-panel-link';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'integrations_sms';
const navigationId = 'sms-integrations';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_INTEGRATIONS_SMS_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_INTEGRATIONS_SMS_WHY',
);
const optionKey = '';
const description = why || optionKey;

export const CrmSettingsHubIntegrationsSmsLink = defineComponent({
	name: 'CrmSettingsHubIntegrationsSmsSetting',
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

export const CrmSettingsHubIntegrationsSmsSetting = CrmSettingsHubIntegrationsSmsLink;

export const registration: SettingRegistration = {
	id: settingId,
	navigationId,
	component: CrmSettingsHubIntegrationsSmsLink,
	searchText: [
		title,
		why,
	],
};
