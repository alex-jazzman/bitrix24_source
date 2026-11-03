import { defineComponent } from 'ui.vue3';

import {
	capabilityPackEmits,
	capabilityPackProps,
	CrmSettingsHubCapabilityPack,
} from '../../component/capability-pack/capability-pack';
import { CrmSettingsHubActivityEnableUnconnectedRecipientsSetting } from '../../setting/comms/activity-enable-unconnected-recipients';
import { CrmSettingsHubCalltoClickHandlerSetting } from '../../setting/comms/callto-click-handler';
import { CrmSettingsHubCalltoFrmtSetting } from '../../setting/comms/callto-frmt';
import { CrmSettingsHubCalltoNormalizeNumberSetting } from '../../setting/comms/callto-normalize-number';
import { CrmSettingsHubCalltoUrlTemplateSetting } from '../../setting/comms/callto-url-template';
import { CrmSettingsHubCrmSenderSetting } from '../../setting/comms/crm-sender';
import { CrmSettingsHubEnableB24EmailSignSetting } from '../../setting/comms/enable-b24-email-sign';
import { CrmSettingsHubIntegrationsSetting } from '../../setting/comms/integrations';
import { CrmSettingsHubSmsLimitsSetting } from '../../setting/comms/sms-limits';
import { CrmSettingsHubSmsMarketplaceSetting } from '../../setting/comms/sms-marketplace';
import { CrmSettingsHubAiCallProcessingAutoSetting } from '../../setting/copilot/ai-call-processing-auto';
import {
	CrmSettingsHubCopilotAnalyzeCommunicationSetting,
} from '../../setting/copilot/copilot-analyze-communication';
import { CrmSettingsHubCopilotCallAssessmentSetting } from '../../setting/copilot/copilot-call-assessment';
import { CrmSettingsHubCopilotFillCrmTextSetting } from '../../setting/copilot/copilot-fill-crm-text';
import { CrmSettingsHubCopilotFillItemFromCallSetting } from '../../setting/copilot/copilot-fill-item-from-call';
import {
	CrmSettingsHubCopilotMessageSenderEditorSetting,
} from '../../setting/copilot/copilot-message-sender-editor';
import { CrmSettingsHubCopilotSummarizeSetting } from '../../setting/copilot/copilot-summarize';
import { CrmSettingsHubIntegrationsSmsLink } from '../../setting/integrations/integrations-sms';

export const CrmSettingsHubCommunicationsCapability = defineComponent({
	name: 'CrmSettingsHubCommunicationsCapability',
	components: {
		CrmSettingsHubCapabilityPack,
		CrmSettingsHubActivityEnableUnconnectedRecipientsSetting,
		CrmSettingsHubEnableB24EmailSignSetting,
		CrmSettingsHubCalltoFrmtSetting,
		CrmSettingsHubIntegrationsSetting,
		CrmSettingsHubSmsMarketplaceSetting,
		CrmSettingsHubCalltoUrlTemplateSetting,
		CrmSettingsHubCalltoClickHandlerSetting,
		CrmSettingsHubCalltoNormalizeNumberSetting,
		CrmSettingsHubSmsLimitsSetting,
		CrmSettingsHubIntegrationsSmsLink,
		CrmSettingsHubCrmSenderSetting,
		CrmSettingsHubAiCallProcessingAutoSetting,
		CrmSettingsHubCopilotFillItemFromCallSetting,
		CrmSettingsHubCopilotCallAssessmentSetting,
		CrmSettingsHubCopilotAnalyzeCommunicationSetting,
		CrmSettingsHubCopilotSummarizeSetting,
		CrmSettingsHubCopilotMessageSenderEditorSetting,
		CrmSettingsHubCopilotFillCrmTextSetting,
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
			<CrmSettingsHubActivityEnableUnconnectedRecipientsSetting />
			<CrmSettingsHubEnableB24EmailSignSetting />
			<CrmSettingsHubCalltoFrmtSetting />
			<CrmSettingsHubIntegrationsSetting />
			<CrmSettingsHubSmsMarketplaceSetting />
			<CrmSettingsHubCalltoUrlTemplateSetting />
			<CrmSettingsHubCalltoClickHandlerSetting />
			<CrmSettingsHubCalltoNormalizeNumberSetting />
			<CrmSettingsHubSmsLimitsSetting />
			<CrmSettingsHubIntegrationsSmsLink />
			<CrmSettingsHubCrmSenderSetting />
			<CrmSettingsHubAiCallProcessingAutoSetting />
			<CrmSettingsHubCopilotFillItemFromCallSetting />
			<CrmSettingsHubCopilotCallAssessmentSetting />
			<CrmSettingsHubCopilotAnalyzeCommunicationSetting />
			<CrmSettingsHubCopilotSummarizeSetting />
			<CrmSettingsHubCopilotMessageSenderEditorSetting />
			<CrmSettingsHubCopilotFillCrmTextSetting />
		</CrmSettingsHubCapabilityPack>
	`,
});
