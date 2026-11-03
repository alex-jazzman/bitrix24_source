import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSidePanelLink } from '../../component/side-panel-link/side-panel-link';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'deal_automation';
const navigationId = 'automation-deal';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_DEAL_AUTOMATION_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_DEAL_AUTOMATION_WHY',
);
const optionKey = '';
const description = why || optionKey;

export const CrmSettingsHubDealAutomationLink = defineComponent({
	name: 'CrmSettingsHubDealAutomationSetting',
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

export const CrmSettingsHubDealAutomationSetting = CrmSettingsHubDealAutomationLink;

export const registration: SettingRegistration = {
	id: settingId,
	navigationId,
	component: CrmSettingsHubDealAutomationLink,
	searchText: [
		title,
		why,
	],
};
