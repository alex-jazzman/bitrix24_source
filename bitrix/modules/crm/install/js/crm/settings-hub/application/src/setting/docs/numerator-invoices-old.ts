import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSidePanelLink } from '../../component/side-panel-link/side-panel-link';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'numerator_invoices_old';
const navigationId = 'legacy-invoice-numerator';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_NUMERATOR_INVOICES_OLD_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_NUMERATOR_INVOICES_OLD_WHY',
);
const note = getMessage(
	'CRM_SETTINGS_HUB_SETTING_NUMERATOR_INVOICES_OLD_NOTE',
);
const optionKey = '';
const description = why || note || optionKey;

export const CrmSettingsHubNumeratorInvoicesOldSetting = defineComponent({
	name: 'CrmSettingsHubNumeratorInvoicesOldSetting',
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
	component: CrmSettingsHubNumeratorInvoicesOldSetting,
	searchText: [
		title,
		why,
		note,
	],
};
