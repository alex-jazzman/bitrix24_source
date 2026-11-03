import { defineComponent } from 'ui.vue3';

import {
	capabilityPackEmits,
	capabilityPackProps,
	CrmSettingsHubCapabilityPack,
} from '../../component/capability-pack/capability-pack';
import { CrmSettingsHubActMarkFwdEmaiOutgoingSetting } from '../../setting/comms/act-mark-fwd-emai-outgoing';
import { CrmSettingsHubActivityEnableUnconnectedRecipientsSetting } from '../../setting/comms/activity-enable-unconnected-recipients';
import {
	CrmSettingsHubActivityOutgoingEmailOwnerTypeSetting,
} from '../../setting/comms/activity-outgoing-email-owner-type';
import { CrmSettingsHubEmailServiceCodeAllocationSetting } from '../../setting/comms/email-service-code-allocation';
import { CrmSettingsHubEnableB24EmailSignSetting } from '../../setting/comms/enable-b24-email-sign';
import { CrmSettingsHubMailSendsaveLink } from '../../setting/comms/mail-sendsave';
import { CrmSettingsHubMailTemplatesLink } from '../../setting/comms/mail-templates';
import { CrmSettingsHubMailTrackerSetting } from '../../setting/comms/mail-tracker';

export const CrmSettingsHubCrmMailCapability = defineComponent({
	name: 'CrmSettingsHubCrmMailCapability',
	components: {
		CrmSettingsHubCapabilityPack,
		CrmSettingsHubActMarkFwdEmaiOutgoingSetting,
		CrmSettingsHubActivityEnableUnconnectedRecipientsSetting,
		CrmSettingsHubEnableB24EmailSignSetting,
		CrmSettingsHubEmailServiceCodeAllocationSetting,
		CrmSettingsHubMailSendsaveLink,
		CrmSettingsHubActivityOutgoingEmailOwnerTypeSetting,
		CrmSettingsHubMailTrackerSetting,
		CrmSettingsHubMailTemplatesLink,
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
			<CrmSettingsHubActMarkFwdEmaiOutgoingSetting />
			<CrmSettingsHubActivityEnableUnconnectedRecipientsSetting />
			<CrmSettingsHubEnableB24EmailSignSetting />
			<CrmSettingsHubEmailServiceCodeAllocationSetting />
			<CrmSettingsHubMailSendsaveLink />
			<CrmSettingsHubActivityOutgoingEmailOwnerTypeSetting />
			<CrmSettingsHubMailTrackerSetting />
			<CrmSettingsHubMailTemplatesLink />
		</CrmSettingsHubCapabilityPack>
	`,
});
