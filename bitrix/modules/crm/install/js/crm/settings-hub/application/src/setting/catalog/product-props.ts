import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubSidePanelLink } from '../../component/side-panel-link/side-panel-link';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'product_props';
const navigationId = 'product-properties';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_PRODUCT_PROPS_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_PRODUCT_PROPS_WHY',
);
const optionKey = '';
const description = why || optionKey;
export const CrmSettingsHubProductPropsLink = defineComponent({
	name: 'CrmSettingsHubProductPropsSetting',
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

export const CrmSettingsHubProductPropsSetting = CrmSettingsHubProductPropsLink;

export const registration: SettingRegistration = {
	id: settingId,
	navigationId,
	component: CrmSettingsHubProductPropsLink,
	searchText: [
		title,
		why,
	],
};
