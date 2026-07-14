import { mapWritableState } from 'ui.vue3.pinia';

import { useProjectStore } from 'socialnetwork.v2.model.project';
import { UiField } from 'socialnetwork.v2.components.elements.ui-field';
import { UiTextarea } from 'socialnetwork.v2.components.elements.ui-textarea';

import './description-field.css';

// @vue/component
export const DescriptionField = {
	name: 'ProjectWizardDescriptionField',
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
		...mapWritableState(useProjectStore, ['description']),
		inputId(): string
		{
			return 'sonet-project-wizard-description';
		},
	},
	template: `
		<UiField
			class="socialnetwork--project-wizard-description-field"
			:label="loc('SONET_EXT_PROJECT_WIZARD_DESCRIPTION_LABEL')"
			:labelFor="inputId"
		>
			<UiTextarea
				v-model.trim="description"
				:id="inputId"
				:placeholder="loc('SONET_EXT_PROJECT_WIZARD_DESCRIPTION_PLACEHOLDER')"
				:disabled
			/>
		</UiField>
	`,
};
