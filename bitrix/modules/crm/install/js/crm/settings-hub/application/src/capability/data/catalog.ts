import { defineComponent } from 'ui.vue3';

import {
	capabilityPackEmits,
	capabilityPackProps,
	CrmSettingsHubCapabilityPack,
} from '../../component/capability-pack/capability-pack';
import { CrmSettingsHubCurrenciesLink } from '../../setting/catalog/currencies';
import { CrmSettingsHubMeasuresLink } from '../../setting/catalog/measures';
import { CrmSettingsHubProductPropsLink } from '../../setting/catalog/product-props';
import { CrmSettingsHubTaxesLink } from '../../setting/catalog/taxes';

export const CrmSettingsHubCatalogCapability = defineComponent({
	name: 'CrmSettingsHubCatalogCapability',
	components: {
		CrmSettingsHubCapabilityPack,
		CrmSettingsHubCurrenciesLink,
		CrmSettingsHubTaxesLink,
		CrmSettingsHubMeasuresLink,
		CrmSettingsHubProductPropsLink,
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
			<CrmSettingsHubCurrenciesLink />
			<CrmSettingsHubTaxesLink />
			<CrmSettingsHubMeasuresLink />
			<CrmSettingsHubProductPropsLink />
		</CrmSettingsHubCapabilityPack>
	`,
});
