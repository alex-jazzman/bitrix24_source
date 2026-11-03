import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubTextSettingView } from '../../component/setting-view/text-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'callto_click_handler';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_CALLTO_CLICK_HANDLER_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_CALLTO_CLICK_HANDLER_WHY',
);
const note = getMessage(
	'CRM_SETTINGS_HUB_SETTING_CALLTO_CLICK_HANDLER_NOTE',
);
const optionKey = 'callto_custom_settings';
const description = why || note || optionKey;

export const CrmSettingsHubCalltoClickHandlerSetting = defineComponent({
	name: 'CrmSettingsHubCalltoClickHandlerSetting',
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
			setting-id="callto_click_handler"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubCalltoClickHandlerSetting,
	searchText: [
		title,
		why,
		note,
		optionKey,
	],
};
