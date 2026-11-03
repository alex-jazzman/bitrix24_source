import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSidePanelLink } from '../../component/side-panel-link/side-panel-link';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'order_automation';
const navigationId = 'automation-order';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ORDER_AUTOMATION_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ORDER_AUTOMATION_WHY',
);
const optionKey = '';
const description = why || optionKey;

export const CrmSettingsHubOrderAutomationLink = defineComponent({
	name: 'CrmSettingsHubOrderAutomationSetting',
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

export const CrmSettingsHubOrderAutomationSetting = CrmSettingsHubOrderAutomationLink;

export const registration: SettingRegistration = {
	id: settingId,
	navigationId,
	component: CrmSettingsHubOrderAutomationLink,
	searchText: [
		title,
		why,
	],
};
