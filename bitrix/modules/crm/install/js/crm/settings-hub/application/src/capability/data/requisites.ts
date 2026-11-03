import { defineComponent } from 'ui.vue3';

import {
	capabilityPackEmits,
	capabilityPackProps,
	CrmSettingsHubCapabilityPack,
} from '../../component/capability-pack/capability-pack';
import { CrmSettingsHubMyCompaniesRequisitesLink } from '../../setting/docs/my-companies-requisites';
import { CrmSettingsHubRequisitesTemplatesLink } from '../../setting/docs/requisites-templates';

export const CrmSettingsHubRequisitesCapability = defineComponent({
	name: 'CrmSettingsHubRequisitesCapability',
	components: {
		CrmSettingsHubCapabilityPack,
		CrmSettingsHubRequisitesTemplatesLink,
		CrmSettingsHubMyCompaniesRequisitesLink,
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
			<CrmSettingsHubRequisitesTemplatesLink />
			<CrmSettingsHubMyCompaniesRequisitesLink />
		</CrmSettingsHubCapabilityPack>
	`,
});
