import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSidePanelLink } from '../../component/side-panel-link/side-panel-link';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'lead_automation';
const navigationId = 'automation-lead';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_LEAD_AUTOMATION_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_LEAD_AUTOMATION_WHY',
);
const optionKey = '';
const description = why || optionKey;

export const CrmSettingsHubLeadAutomationLink = defineComponent({
	name: 'CrmSettingsHubLeadAutomationSetting',
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

export const CrmSettingsHubLeadAutomationSetting = CrmSettingsHubLeadAutomationLink;

export const registration: SettingRegistration = {
	id: settingId,
	navigationId,
	component: CrmSettingsHubLeadAutomationLink,
	searchText: [
		title,
		why,
	],
};
