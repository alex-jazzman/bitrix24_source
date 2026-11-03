import { defineComponent } from 'ui.vue3';

import {
	capabilityPackEmits,
	capabilityPackProps,
	CrmSettingsHubCapabilityPack,
} from '../../component/capability-pack/capability-pack';
import { CrmSettingsHubEnableCloseDateSyncSetting } from '../../setting/sales/enable-close-date-sync';
import { CrmSettingsHubPipelinesLink } from '../../setting/sales/pipelines';

export const CrmSettingsHubPipelinesCapability = defineComponent({
	name: 'CrmSettingsHubPipelinesCapability',
	components: {
		CrmSettingsHubCapabilityPack,
		CrmSettingsHubEnableCloseDateSyncSetting,
		CrmSettingsHubPipelinesLink,
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
			<CrmSettingsHubEnableCloseDateSyncSetting />
			<CrmSettingsHubPipelinesLink />
		</CrmSettingsHubCapabilityPack>
	`,
});
