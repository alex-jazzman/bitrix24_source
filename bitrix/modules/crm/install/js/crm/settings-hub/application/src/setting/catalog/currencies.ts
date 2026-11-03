import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSidePanelLink } from '../../component/side-panel-link/side-panel-link';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'currencies';
const navigationId = 'currencies';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_CURRENCIES_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_CURRENCIES_WHY',
);
const optionKey = '';
const description = why || optionKey;

export const CrmSettingsHubCurrenciesLink = defineComponent({
	name: 'CrmSettingsHubCurrenciesSetting',
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

export const CrmSettingsHubCurrenciesSetting = CrmSettingsHubCurrenciesLink;

export const registration: SettingRegistration = {
	id: settingId,
	navigationId,
	component: CrmSettingsHubCurrenciesLink,
	searchText: [
		title,
		why,
	],
};
