import { defineComponent } from 'ui.vue3';

import {
	capabilityPackEmits,
	capabilityPackProps,
	CrmSettingsHubCapabilityPack,
} from '../../component/capability-pack/capability-pack';
import { CrmSettingsHubDocNumeratorsLink } from '../../setting/docs/doc-numerators';
import { CrmSettingsHubNumeratorInvoicesSetting } from '../../setting/docs/numerator-invoices';
import { CrmSettingsHubNumeratorInvoicesOldSetting } from '../../setting/docs/numerator-invoices-old';
import { CrmSettingsHubNumeratorQuotesSetting } from '../../setting/docs/numerator-quotes';
import { CrmSettingsHubRequisitesTemplatesLink } from '../../setting/docs/requisites-templates';

export const CrmSettingsHubDocumentsCapability = defineComponent({
	name: 'CrmSettingsHubDocumentsCapability',
	components: {
		CrmSettingsHubCapabilityPack,
		CrmSettingsHubDocNumeratorsLink,
		CrmSettingsHubNumeratorInvoicesSetting,
		CrmSettingsHubNumeratorInvoicesOldSetting,
		CrmSettingsHubNumeratorQuotesSetting,
		CrmSettingsHubRequisitesTemplatesLink,
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
			<CrmSettingsHubDocNumeratorsLink />
			<CrmSettingsHubNumeratorInvoicesSetting />
			<CrmSettingsHubNumeratorInvoicesOldSetting />
			<CrmSettingsHubNumeratorQuotesSetting />
			<CrmSettingsHubRequisitesTemplatesLink />
		</CrmSettingsHubCapabilityPack>
	`,
});
