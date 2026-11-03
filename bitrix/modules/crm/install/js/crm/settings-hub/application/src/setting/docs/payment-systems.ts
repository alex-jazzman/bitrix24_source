import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSidePanelLink } from '../../component/side-panel-link/side-panel-link';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'payment_systems';
const navigationId = 'payment-systems';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_PAYMENT_SYSTEMS_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_PAYMENT_SYSTEMS_WHY',
);
const note = '';
const optionKey = '';
const description = why || note || optionKey;

export const CrmSettingsHubPaymentSystemsLink = defineComponent({
	name: 'CrmSettingsHubPaymentSystemsSetting',
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

export const CrmSettingsHubPaymentSystemsSetting = CrmSettingsHubPaymentSystemsLink;

export const registration: SettingRegistration = {
	id: settingId,
	navigationId,
	component: CrmSettingsHubPaymentSystemsLink,
	searchText: [
		title,
		why,
	],
};
