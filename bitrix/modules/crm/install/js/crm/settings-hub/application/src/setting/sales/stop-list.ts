import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSidePanelLink } from '../../component/side-panel-link/side-panel-link';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'stop_list';
const navigationId = 'stop-list';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_STOP_LIST_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_STOP_LIST_WHY',
);
const optionKey = '';
const description = why || optionKey;

export const CrmSettingsHubStopListLink = defineComponent({
	name: 'CrmSettingsHubStopListSetting',
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

export const CrmSettingsHubStopListSetting = CrmSettingsHubStopListLink;

export const registration: SettingRegistration = {
	id: settingId,
	navigationId,
	component: CrmSettingsHubStopListLink,
	searchText: [
		title,
		why,
	],
};
