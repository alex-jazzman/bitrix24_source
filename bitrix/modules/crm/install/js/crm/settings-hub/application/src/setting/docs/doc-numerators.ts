import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSidePanelLink } from '../../component/side-panel-link/side-panel-link';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'doc_numerators';
const navigationId = 'document-numerators';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_DOC_NUMERATORS_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_DOC_NUMERATORS_WHY',
);
const note = '';
const optionKey = '';
const description = why || note || optionKey;

export const CrmSettingsHubDocNumeratorsLink = defineComponent({
	name: 'CrmSettingsHubDocNumeratorsSetting',
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

export const CrmSettingsHubDocNumeratorsSetting = CrmSettingsHubDocNumeratorsLink;

export const registration: SettingRegistration = {
	id: settingId,
	navigationId,
	component: CrmSettingsHubDocNumeratorsLink,
	searchText: [
		title,
		why,
	],
};
