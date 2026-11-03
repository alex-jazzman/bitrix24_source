import { defineComponent } from 'ui.vue3';

import {
	capabilityPackEmits,
	capabilityPackProps,
	CrmSettingsHubCapabilityPack,
} from '../../component/capability-pack/capability-pack';
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
import { CrmSettingsHubCopilotRepeatSaleSetting } from '../../setting/copilot/copilot-repeat-sale';
import { CrmSettingsHubCopilotSummarizeSetting } from '../../setting/copilot/copilot-summarize';

export const CrmSettingsHubBitrixGptCapability = defineComponent({
	name: 'CrmSettingsHubBitrixGptCapability',
	components: {
		CrmSettingsHubCapabilityPack,
		CrmSettingsHubCopilotFillItemFromCallSetting,
		CrmSettingsHubCopilotCallAssessmentSetting,
		CrmSettingsHubCopilotAnalyzeCommunicationSetting,
		CrmSettingsHubCopilotSummarizeSetting,
		CrmSettingsHubCopilotRepeatSaleSetting,
		CrmSettingsHubCopilotFillCrmTextSetting,
		CrmSettingsHubCopilotMessageSenderEditorSetting,
		CrmSettingsHubAiCallProcessingAutoSetting,
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
			<CrmSettingsHubCopilotFillItemFromCallSetting />
			<CrmSettingsHubCopilotCallAssessmentSetting />
			<CrmSettingsHubCopilotAnalyzeCommunicationSetting />
			<CrmSettingsHubCopilotSummarizeSetting />
			<CrmSettingsHubCopilotRepeatSaleSetting />
			<CrmSettingsHubCopilotFillCrmTextSetting />
			<CrmSettingsHubCopilotMessageSenderEditorSetting />
			<CrmSettingsHubAiCallProcessingAutoSetting />
		</CrmSettingsHubCapabilityPack>
	`,
});
