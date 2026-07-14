import { mapWritableState } from 'ui.vue3.pinia';
import { useProjectStore } from 'socialnetwork.v2.model.project';
import { UiSwitcherField } from 'socialnetwork.v2.components.elements.ui-switcher-field';

// @vue/component
export const PublicationField = {
	name: 'PublicationField',
	components: {
		UiSwitcherField,
	},
	computed: {
		...mapWritableState(useProjectStore, ['publication']),
	},
	template: `
		<UiSwitcherField
			v-model="publication"
			:label="loc('SONET_EXT_PROJECT_WIZARD_PUBLICATION_LABEL')"
		/>
	`,
};
