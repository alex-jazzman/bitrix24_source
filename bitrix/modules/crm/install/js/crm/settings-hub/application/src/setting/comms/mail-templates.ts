import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSidePanelLink } from '../../component/side-panel-link/side-panel-link';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'mail_templates';
const navigationId = 'mail-templates';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_MAIL_TEMPLATES_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_MAIL_TEMPLATES_WHY',
);
const optionKey = '';
const description = why || optionKey;
export const CrmSettingsHubMailTemplatesLink = defineComponent({
	name: 'CrmSettingsHubMailTemplatesSetting',
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

export const CrmSettingsHubMailTemplatesSetting = CrmSettingsHubMailTemplatesLink;

export const registration: SettingRegistration = {
	id: settingId,
	navigationId,
	component: CrmSettingsHubMailTemplatesLink,
	searchText: [
		title,
		why,
	],
};
