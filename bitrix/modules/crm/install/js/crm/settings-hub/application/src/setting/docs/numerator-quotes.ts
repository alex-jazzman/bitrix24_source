import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSidePanelLink } from '../../component/side-panel-link/side-panel-link';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'numerator_quotes';
const navigationId = 'quote-numerator';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_NUMERATOR_QUOTES_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_NUMERATOR_QUOTES_WHY',
);
const note = '';
const optionKey = '';
const description = why || note || optionKey;

export const CrmSettingsHubNumeratorQuotesSetting = defineComponent({
	name: 'CrmSettingsHubNumeratorQuotesSetting',
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
	component: CrmSettingsHubNumeratorQuotesSetting,
	searchText: [
		title,
		why,
	],
};
