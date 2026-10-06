import { HeadlineXs, TextXs } from 'ui.system.typography.vue';
import { defineComponent } from 'ui.vue3';
import './scenario-step-view.css';

export const ScenarioStepView = defineComponent({
	name: 'CrmCopilotCallAssessmentV2ScenarioStepView',
	components: {
		HeadlineXs,
		TextXs,
	},
	props: {
		index: {
			type: Number,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			default: '',
		},
	},
	template: `
		<div class="crm-call-assessment-v2-step-view">
			<div class="crm-call-assessment-v2-step-view__bullet">
				<span class="crm-call-assessment-v2-step-view__bullet-number">
					{{ index }}
				</span>
			</div>
			<div class="crm-call-assessment-v2-step-view__body">
				<HeadlineXs class="crm-call-assessment-v2-step-view__title" tag="div">
					{{ title }}
				</HeadlineXs>
				<TextXs v-if="description" class="crm-call-assessment-v2-step-view__description" tag="div">
					{{ description }}
				</TextXs>
			</div>
		</div>
	`,
});
