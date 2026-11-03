import { defineComponent } from 'ui.vue3';

import {
	capabilityPackEmits,
	capabilityPackProps,
	CrmSettingsHubCapabilityPack,
} from '../../component/capability-pack/capability-pack';
import { CrmSettingsHubEnableAutoUsingFinishedLeadSetting } from '../../setting/legacy/enable-auto-using-finished-lead';
import { CrmSettingsHubConversionEnableAutocreateSetting } from '../../setting/sales/conversion-enable-autocreate';

export const CrmSettingsHubConversionCapability = defineComponent({
	name: 'CrmSettingsHubConversionCapability',
	components: {
		CrmSettingsHubCapabilityPack,
		CrmSettingsHubConversionEnableAutocreateSetting,
		CrmSettingsHubEnableAutoUsingFinishedLeadSetting,
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
			<CrmSettingsHubConversionEnableAutocreateSetting />
			<CrmSettingsHubEnableAutoUsingFinishedLeadSetting />
		</CrmSettingsHubCapabilityPack>
	`,
});
