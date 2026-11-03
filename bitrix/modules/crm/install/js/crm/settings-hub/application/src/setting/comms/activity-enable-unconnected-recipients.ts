import { Loc } from 'main.core';
import { computed, defineComponent } from 'ui.vue3';

import { CrmSettingsHubToggleSettingView } from '../../component/setting-view/toggle-setting-view';
import { CrmSettingsHubDependentSetting } from '../../component/dependent-setting/dependent-setting';
import {
	CrmSettingsHubActivityOutgoingEmailOwnerTypeSetting,
} from './activity-outgoing-email-owner-type';
import { useSettingsStateContext } from '../../context/settings-state';
import { type SettingRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

const settingId = 'activity_enable_unconnected_recipients';
const title = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ACTIVITY_ENABLE_UNCONNECTED_RECIPIENTS_TITLE',
);
const why = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ACTIVITY_ENABLE_UNCONNECTED_RECIPIENTS_WHY',
);
const note = getMessage(
	'CRM_SETTINGS_HUB_SETTING_ACTIVITY_ENABLE_UNCONNECTED_RECIPIENTS_NOTE',
);
const optionKey = 'activity_enable_unconnected_recipients';
const description = why || note || optionKey;

export const CrmSettingsHubActivityEnableUnconnectedRecipientsSetting = defineComponent({
	name: 'CrmSettingsHubActivityEnableUnconnectedRecipientsSetting',
	components: {
		CrmSettingsHubToggleSettingView,
		CrmSettingsHubDependentSetting,
		CrmSettingsHubActivityOutgoingEmailOwnerTypeSetting,
	},
	setup(): Object
	{
		const settingsStateContext = useSettingsStateContext();

		return {
			dependentVisible: computed(() => settingsStateContext.get(settingId).raw === true),
			description,
			title,
		};
	},
	template: `
		<CrmSettingsHubToggleSettingView
			setting-id="activity_enable_unconnected_recipients"
			:description="description"
			:title="title"
		>
			<template #dependents>
				<CrmSettingsHubDependentSetting :visible="dependentVisible">
					<CrmSettingsHubActivityOutgoingEmailOwnerTypeSetting
						data-testid="crm-settings-hub-application-setting-activity_outgoing_email_owner_type"
					/>
				</CrmSettingsHubDependentSetting>
			</template>
		</CrmSettingsHubToggleSettingView>
	`,
});

export const registration: SettingRegistration = {
	id: settingId,
	component: CrmSettingsHubActivityEnableUnconnectedRecipientsSetting,
	searchText: [
		title,
		why,
		note,
		optionKey,
	],
};
