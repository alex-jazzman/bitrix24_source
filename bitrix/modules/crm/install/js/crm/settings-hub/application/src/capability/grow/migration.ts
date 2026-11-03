import { defineComponent } from 'ui.vue3';

import {
	capabilityPackEmits,
	capabilityPackProps,
	CrmSettingsHubCapabilityPack,
} from '../../component/capability-pack/capability-pack';
import { CrmSettingsHubCrmMigrationSetting } from '../../setting/integrations/crm-migration';

export const CrmSettingsHubMigrationCapability = defineComponent({
	name: 'CrmSettingsHubMigrationCapability',
	components: {
		CrmSettingsHubCapabilityPack,
		CrmSettingsHubCrmMigrationSetting,
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
			<CrmSettingsHubCrmMigrationSetting />
		</CrmSettingsHubCapabilityPack>
	`,
});
