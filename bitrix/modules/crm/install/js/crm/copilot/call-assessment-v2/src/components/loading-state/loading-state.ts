import { HeadlineLg } from 'ui.system.typography.vue';
import { defineComponent } from 'ui.vue3';
import './loading-state.css';
import { NameService } from "crm.ai.name-service";

export const LoadingState = defineComponent({
	name: 'CrmCopilotCallAssessmentV2LoadingState',
	components: {
		HeadlineLg,
	},
	computed: {
		copilotNameReplacement(): { [key: string]: string }
		{
			return { '#COPILOT_NAME#': NameService.copilotName() };
		},
	},
	template: `
		<section class="crm-call-assessment-v2-loading-state">
			<video class="crm-call-assessment-v2-loading-state__mascot" autoplay loop muted playsinline>
				<source src="/bitrix/js/crm/copilot/call-assessment-v2/images/loading-mascot.webm" type="video/webm"/>
			</video>
			<HeadlineLg accent class="crm-call-assessment-v2-loading-state__text" tag="p">
				{{ loc('CRM_CALL_ASSESSMENT_V2_CREATE_LOADING_TEXT', copilotNameReplacement) }}
			</HeadlineLg>
		</section>
	`,
});
