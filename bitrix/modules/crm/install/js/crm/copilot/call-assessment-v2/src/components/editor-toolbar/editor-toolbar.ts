import { NameService } from 'crm.ai.name-service';
import { AirSwitcherStyle } from 'ui.switcher';
import { TextSm } from 'ui.system.typography.vue';
import { hint } from 'ui.vue3.directives.hint';
import { Switcher } from 'ui.vue3.components.switcher';
import { defineComponent } from 'ui.vue3';
import { EditableTitle } from '../editable-title/editable-title';
import { createCalloutHint } from '../../utils/callout-hint';
import './editor-toolbar.css';

export const EditorToolbar = defineComponent({
	name: 'CrmCopilotCallAssessmentV2EditorToolbar',
	directives: {
		hint,
	},
	components: {
		EditableTitle,
		TextSm,
		Switcher,
	},
	props: {
		isEditMode: {
			type: Boolean,
			default: false,
		},
		isCreateMode: {
			type: Boolean,
			default: false,
		},
		isLoadingMode: {
			type: Boolean,
			default: false,
		},
		isAiToggleEnabled: {
			type: Boolean,
			required: true,
		},
		canToggleAi: {
			type: Boolean,
			default: false,
		},
		title: {
			type: String,
			default: '',
		},
	},
	emits: [
		'aiToggleChanged',
		'update:title',
	],
	setup(): Object
	{
		return {
			airSwitcherStyle: AirSwitcherStyle.SOLID,
		};
	},
	computed: {
		showAiToggle(): boolean
		{
			return !this.isLoadingMode && this.canToggleAi;
		},
		displayedTitle(): string
		{
			if (this.isCreateMode || this.isLoadingMode)
			{
				return this.loc('CRM_CALL_ASSESSMENT_V2_PAGE_TITLE');
			}

			return this.title;
		},
		aiHintOptions(): Object
		{
			const copilotReplacement = { '#COPILOT_NAME#': NameService.copilotName() };

			return createCalloutHint({
				variant: 'ai-update',
				title: this.loc('CRM_CALL_ASSESSMENT_V2_AI_HINT_TITLE'),
				description: this.loc('CRM_CALL_ASSESSMENT_V2_AI_HINT_DESCRIPTION', copilotReplacement),
			});
		},
	},
	methods: {
		handleToggleAi(value: boolean): void
		{
			this.$emit('aiToggleChanged', value);
		},
		handleTitleUpdate(value: string): void
		{
			this.$emit('update:title', value);
		},
	},
	template: `
		<div class="crm-call-assessment-v2-toolbar">
			<EditableTitle
				:modelValue="displayedTitle"
				:isEditable="isEditMode"
				@update:modelValue="handleTitleUpdate"
			/>
			<div class="crm-call-assessment-v2-toolbar__controls">
				<div v-if="showAiToggle" class="crm-call-assessment-v2-toolbar__ai-pill" v-hint="aiHintOptions">
					<TextSm class="crm-call-assessment-v2-toolbar__ai-label">
						{{ loc('CRM_CALL_ASSESSMENT_V2_TOGGLE_AUTOFILL') }}
					</TextSm>
					<span class="crm-call-assessment-v2-toolbar__ai-divider" aria-hidden="true"></span>
					<span class="crm-call-assessment-v2-toolbar__ai-toggle">
						<Switcher
							:isChecked="isAiToggleEnabled"
							:options="{ size: 'extra-small', useAirDesign: true, style: airSwitcherStyle }"
							@check="handleToggleAi(true)"
							@uncheck="handleToggleAi(false)"
						/>
					</span>
				</div>
			</div>
		</div>
	`,
});
