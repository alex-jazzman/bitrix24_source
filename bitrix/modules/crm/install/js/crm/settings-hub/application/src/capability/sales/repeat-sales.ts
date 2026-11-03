import { defineComponent } from 'ui.vue3';

import {
	capabilityPackEmits,
	capabilityPackProps,
	CrmSettingsHubCapabilityPack,
} from '../../component/capability-pack/capability-pack';
import { CrmSettingsHubCopilotRepeatSaleSetting } from '../../setting/copilot/copilot-repeat-sale';
import { CrmSettingsHubEnableAutoUsingFinishedLeadSetting } from '../../setting/legacy/enable-auto-using-finished-lead';
import { CrmSettingsHubConversionEnableAutocreateSetting } from '../../setting/sales/conversion-enable-autocreate';
import { CrmSettingsHubEnableAutoGenRcSetting } from '../../setting/sales/enable-auto-gen-rc';

export const CrmSettingsHubRepeatSalesCapability = defineComponent({
	name: 'CrmSettingsHubRepeatSalesCapability',
	components: {
		CrmSettingsHubCapabilityPack,
		CrmSettingsHubEnableAutoGenRcSetting,
		CrmSettingsHubConversionEnableAutocreateSetting,
		CrmSettingsHubEnableAutoUsingFinishedLeadSetting,
		CrmSettingsHubCopilotRepeatSaleSetting,
	},
	props: capabilityPackProps,
	emits: capabilityPackEmits,
	template: `
		<CrmSettingsHubCapabilityPack
			:capability="capability"
			:active-capability-id="activeCapabilityId"
			:selected-section-id="selectedSectionId"
			:query="query"
			@select-capability="$emit('select-capability', $event)"
			@content-sections-change="$emit('content-sections-change', $event)"
			@activate="$emit('activate', $event)"
		>
			<CrmSettingsHubEnableAutoGenRcSetting />
			<CrmSettingsHubConversionEnableAutocreateSetting />
			<CrmSettingsHubEnableAutoUsingFinishedLeadSetting />
			<CrmSettingsHubCopilotRepeatSaleSetting />
		</CrmSettingsHubCapabilityPack>
	`,
});
