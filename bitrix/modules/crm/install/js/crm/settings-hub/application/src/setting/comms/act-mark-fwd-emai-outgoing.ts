import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { CrmSettingsHubToggleSettingView } from '../../component/setting-view/toggle-setting-view';
import { useSettingState } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'act_mark_fwd_emai_outgoing';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ACT_MARK_FWD_EMAI_OUTGOING_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ACT_MARK_FWD_EMAI_OUTGOING_WHY',
);
const note = '';
const optionKey = 'act_mark_fwd_emai_outgoing';
const description = why || note || optionKey;

export const CrmSettingsHubActMarkFwdEmaiOutgoingSetting = defineComponent({
	name: 'CrmSettingsHubActMarkFwdEmaiOutgoingSetting',
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
			setting-id="act_mark_fwd_emai_outgoing"
			:description="description"
			:title="title"
		/>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubActMarkFwdEmaiOutgoingSetting,
	searchText: [
		title,
		why,
		optionKey,
	],
};
