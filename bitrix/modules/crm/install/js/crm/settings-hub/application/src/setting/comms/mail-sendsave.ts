import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSidePanelLink } from '../../component/side-panel-link/side-panel-link';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'mail_sendsave';
const navigationId = 'mail-sendsave';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_MAIL_SENDSAVE_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_MAIL_SENDSAVE_WHY',
);
const optionKey = '';
const description = why || optionKey;
export const CrmSettingsHubMailSendsaveLink = defineComponent({
	name: 'CrmSettingsHubMailSendsaveSetting',
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

export const CrmSettingsHubMailSendsaveSetting = CrmSettingsHubMailSendsaveLink;

export const registration: SettingRegistration = {
	id: settingId,
	navigationId,
	component: CrmSettingsHubMailSendsaveLink,
	searchText: [
		title,
		why,
	],
};
