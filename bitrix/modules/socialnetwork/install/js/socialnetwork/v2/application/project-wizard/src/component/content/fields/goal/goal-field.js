import { mapWritableState } from 'ui.vue3.pinia';

import { useProjectStore } from 'socialnetwork.v2.model.project';
import { UiField } from 'socialnetwork.v2.components.elements.ui-field';
import { UiTextarea } from 'socialnetwork.v2.components.elements.ui-textarea';

import './goal-field.css';

// @vue/component
export const GoalField = {
	name: 'ProjectWizardGoalField',
	components: {
		UiField,
		UiTextarea,
	},
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		...mapWritableState(useProjectStore, ['goal']),
		inputId(): string
		{
			return 'sonet-project-wizard-goal';
		},
	},
	template: `
		<UiField
			class="socialnetwork--project-wizard-goal-field"
			:label="loc('SONET_EXT_PROJECT_WIZARD_GOAL_LABEL')"
			:labelFor="inputId"
		>
			<UiTextarea
				v-model.trim="goal"
				:id="inputId"
				:placeholder="loc('SONET_EXT_PROJECT_WIZARD_GOAL_PLACEHOLDER')"
				:disabled
			/>
		</UiField>
	`,
};
