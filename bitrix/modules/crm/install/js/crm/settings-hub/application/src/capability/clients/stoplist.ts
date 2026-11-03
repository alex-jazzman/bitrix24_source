import { defineComponent } from 'ui.vue3';

import {
	capabilityPackEmits,
	capabilityPackProps,
	CrmSettingsHubCapabilityPack,
} from '../../component/capability-pack/capability-pack';
import { CrmSettingsHubStopListLink } from '../../setting/sales/stop-list';

export const CrmSettingsHubStoplistCapability = defineComponent({
	name: 'CrmSettingsHubStoplistCapability',
	components: {
		CrmSettingsHubCapabilityPack,
		CrmSettingsHubStopListLink,
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
			<CrmSettingsHubStopListLink />
		</CrmSettingsHubCapabilityPack>
	`,
});
