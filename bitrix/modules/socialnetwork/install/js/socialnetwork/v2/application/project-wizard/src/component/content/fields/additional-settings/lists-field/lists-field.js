import { mapState, mapActions } from 'ui.vue3.pinia';

import { UiSwitcherField } from 'socialnetwork.v2.components.elements.ui-switcher-field';
import { useProjectStore } from 'socialnetwork.v2.model.project';

// @vue/component
export const ListsField = {
	name: 'ListsField',
	components: {
		UiSwitcherField,
	},
	computed: {
		...mapState(useProjectStore, ['features']),
		value(): boolean
		{
			return Boolean(this.features.groupLists);
		},
	},
	methods: {
		...mapActions(useProjectStore, ['updateFeature']),
		onUpdate(value: boolean): void
		{
			this.updateFeature('groupLists', value);
		},
	},
	template: `
		<UiSwitcherField
			:modelValue="value"
			:label="loc('SONET_EXT_PROJECT_WIZARD_LEGACY_TOOLS_GROUP_LISTS_LABEL')"
			data-testid="project-additional-settings-toggle-groupLists"
			@update:modelValue="onUpdate"
		/>
	`,
};
