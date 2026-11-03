import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubToggleSettingView } from '../../component/setting-view/toggle-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'rest_enable_req_uf_check';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_REST_ENABLE_REQ_UF_CHECK_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_REST_ENABLE_REQ_UF_CHECK_WHY',
);
const note = getMessage(
	'CRM_SETTINGS_HUB_SETTING_REST_ENABLE_REQ_UF_CHECK_NOTE',
);
const optionKey = 'rest_enable_req_uf_check';
const description = why || note || optionKey;

export const CrmSettingsHubRestEnableReqUfCheckSetting = defineComponent({
	name: 'CrmSettingsHubRestEnableReqUfCheckSetting',
	components: {
		CrmSettingsHubToggleSettingView,
	},
	setup(): Object
	{
		useSettingState(settingId);

		return { description, title };
	},
	template: `
		<CrmSettingsHubToggleSettingView
			setting-id="rest_enable_req_uf_check"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubRestEnableReqUfCheckSetting,
	searchText: [
		title,
		why,
		note,
		optionKey,
	],
};
