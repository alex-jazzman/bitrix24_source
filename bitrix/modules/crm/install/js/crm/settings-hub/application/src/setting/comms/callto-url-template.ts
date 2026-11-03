import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubTextSettingView } from '../../component/setting-view/text-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'callto_url_template';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_CALLTO_URL_TEMPLATE_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_CALLTO_URL_TEMPLATE_WHY',
);
const note = getMessage(
	'CRM_SETTINGS_HUB_SETTING_CALLTO_URL_TEMPLATE_NOTE',
);
const optionKey = 'callto_custom_settings';
const description = why || note || optionKey;

export const CrmSettingsHubCalltoUrlTemplateSetting = defineComponent({
	name: 'CrmSettingsHubCalltoUrlTemplateSetting',
	components: {
		CrmSettingsHubTextSettingView,
	},
	setup(): Object
	{
		useSettingState(settingId);

		return { description, title };
	},
	template: `
		<CrmSettingsHubTextSettingView
			setting-id="callto_url_template"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubCalltoUrlTemplateSetting,
	searchText: [
		title,
		why,
		note,
		optionKey,
	],
};
