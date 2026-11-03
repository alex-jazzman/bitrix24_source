import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSidePanelLink } from '../../component/side-panel-link/side-panel-link';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'bizproc';
const navigationId = 'business-processes';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_BIZPROC_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_BIZPROC_WHY',
);
const optionKey = '';
const description = why || optionKey;

export const CrmSettingsHubBusinessProcessesLink = defineComponent({
	name: 'CrmSettingsHubBizprocSetting',
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

export const CrmSettingsHubBizprocSetting = CrmSettingsHubBusinessProcessesLink;

export const registration: SettingRegistration = {
	id: settingId,
	navigationId,
	component: CrmSettingsHubBusinessProcessesLink,
	searchText: [
		title,
		why,
	],
};
