import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSidePanelLink } from '../../component/side-panel-link/side-panel-link';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'sms_marketplace';
const navigationId = 'sms-marketplace';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_SMS_MARKETPLACE_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_SMS_MARKETPLACE_WHY',
);
const note = getMessage(
	'CRM_SETTINGS_HUB_SETTING_SMS_MARKETPLACE_NOTE',
);
const optionKey = '';
const description = why || note || optionKey;
export const CrmSettingsHubSmsMarketplaceSetting = defineComponent({
	name: 'CrmSettingsHubSmsMarketplaceSetting',
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
	component: CrmSettingsHubSmsMarketplaceSetting,
	searchText: [
		title,
		why,
		note,
	],
};
