import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { BInput, InputDesign, InputSize } from 'ui.system.input.vue';
import { defineComponent } from 'ui.vue3';
import { adjustTextareaHeight } from '../../utils/autosize-textarea';
import './scenario-step-edit.css';

const DESCRIPTION_MAX_HEIGHT = 200;

export const ScenarioStepEdit = defineComponent({
	name: 'CrmCopilotCallAssessmentV2ScenarioStepEdit',
	components: {
		BIcon,
		BInput,
	},
	props: {
		criterionKey: {
			type: String,
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
	emits: [
		'update:title',
		'update:description',
		'remove',
	],
	setup(): Object
	{
		return {
			InputDesign,
			InputSize,
			Outline,
		};
	},
	watch: {
		description(): void
		{
			void this.$nextTick(() => this.adjustDescriptionHeight());
		},
	},
	mounted(): void
	{
		void this.$nextTick(() => this.adjustDescriptionHeight());
	},
	methods: {
		adjustDescriptionHeight(): void
		{
			adjustTextareaHeight(
				this.$refs.descriptionInput as { $el?: HTMLElement } | undefined,
				DESCRIPTION_MAX_HEIGHT,
			);
		},
	},
	template: `
		<div class="crm-call-assessment-v2-step-edit" :data-criterion-key="criterionKey">
			<button
				type="button"
				class="crm-call-assessment-v2-step-edit__handle"
				:title="loc('CRM_CALL_ASSESSMENT_V2_DRAG_HINT')"
			>
				<BIcon :name="Outline.DRAG_M" :size="24"/>
			</button>
			<div class="crm-call-assessment-v2-step-edit__card">
				<BInput
					class="crm-call-assessment-v2-step-edit__title-input"
					:modelValue="title"
					:design="InputDesign.Naked"
					:size="InputSize.Lg"
					:placeholder="loc('CRM_CALL_ASSESSMENT_V2_STEP_TITLE_PLACEHOLDER')"
					stretched
					@update:modelValue="$emit('update:title', $event)"
				/>
				<BInput
					ref="descriptionInput"
					class="crm-call-assessment-v2-step-edit__description-input"
					:modelValue="description"
					:design="InputDesign.Naked"
					:size="InputSize.Md"
					:rowsQuantity="2"
					resize="none"
					:placeholder="loc('CRM_CALL_ASSESSMENT_V2_STEP_DESCRIPTION_PLACEHOLDER')"
					stretched
					@update:modelValue="$emit('update:description', $event)"
				/>
			</div>
			<button
				type="button"
				class="crm-call-assessment-v2-step-edit__remove"
				:title="loc('CRM_CALL_ASSESSMENT_V2_REMOVE_CRITERION')"
				@click="$emit('remove')"
			>
				<BIcon :name="Outline.TRASHCAN" :size="24" color="var(--ui-color-accent-main-alert)"/>
			</button>
		</div>
	`,
});
