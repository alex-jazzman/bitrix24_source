import { defineComponent } from 'ui.vue3';

import {
	capabilityPackEmits,
	capabilityPackProps,
	CrmSettingsHubCapabilityPack,
} from '../../component/capability-pack/capability-pack';
import { CrmSettingsHubBusinessProcessesLink } from '../../setting/automation/bizproc';
import { CrmSettingsHubDealAutomationLink } from '../../setting/automation/deal-automation';
import { CrmSettingsHubLeadAutomationLink } from '../../setting/automation/lead-automation';
import { CrmSettingsHubOrderAutomationLink } from '../../setting/automation/order-automation';
import { CrmSettingsHubAiCallProcessingAutoSetting } from '../../setting/copilot/ai-call-processing-auto';
import { CrmSettingsHubCopilotAnalyzeCommunicationSetting } from '../../setting/copilot/copilot-analyze-communication';
import { CrmSettingsHubCopilotCallAssessmentSetting } from '../../setting/copilot/copilot-call-assessment';
import { CrmSettingsHubCopilotFillItemFromCallSetting } from '../../setting/copilot/copilot-fill-item-from-call';
import { CrmSettingsHubCopilotRepeatSaleSetting } from '../../setting/copilot/copilot-repeat-sale';
import { CrmSettingsHubCopilotSummarizeSetting } from '../../setting/copilot/copilot-summarize';

export const CrmSettingsHubAutomationCapability = defineComponent({
	name: 'CrmSettingsHubAutomationCapability',
	components: {
		CrmSettingsHubCapabilityPack,
		CrmSettingsHubLeadAutomationLink,
		CrmSettingsHubDealAutomationLink,
		CrmSettingsHubOrderAutomationLink,
		CrmSettingsHubBusinessProcessesLink,
		CrmSettingsHubAiCallProcessingAutoSetting,
		CrmSettingsHubCopilotFillItemFromCallSetting,
		CrmSettingsHubCopilotCallAssessmentSetting,
		CrmSettingsHubCopilotAnalyzeCommunicationSetting,
		CrmSettingsHubCopilotSummarizeSetting,
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
			<CrmSettingsHubLeadAutomationLink />
			<CrmSettingsHubDealAutomationLink />
			<CrmSettingsHubOrderAutomationLink />
			<CrmSettingsHubBusinessProcessesLink />
			<CrmSettingsHubAiCallProcessingAutoSetting />
			<CrmSettingsHubCopilotFillItemFromCallSetting />
			<CrmSettingsHubCopilotCallAssessmentSetting />
			<CrmSettingsHubCopilotAnalyzeCommunicationSetting />
			<CrmSettingsHubCopilotSummarizeSetting />
			<CrmSettingsHubCopilotRepeatSaleSetting />
		</CrmSettingsHubCapabilityPack>
	`,
});
