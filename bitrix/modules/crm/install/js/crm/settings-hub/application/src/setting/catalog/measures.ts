import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSidePanelLink } from '../../component/side-panel-link/side-panel-link';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'measures';
const navigationId = 'measures';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_MEASURES_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_MEASURES_WHY',
);
const optionKey = '';
const description = why || optionKey;

export const CrmSettingsHubMeasuresLink = defineComponent({
	name: 'CrmSettingsHubMeasuresSetting',
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

export const CrmSettingsHubMeasuresSetting = CrmSettingsHubMeasuresLink;

export const registration: SettingRegistration = {
	id: settingId,
	navigationId,
	component: CrmSettingsHubMeasuresLink,
	searchText: [
		title,
		why,
	],
};
