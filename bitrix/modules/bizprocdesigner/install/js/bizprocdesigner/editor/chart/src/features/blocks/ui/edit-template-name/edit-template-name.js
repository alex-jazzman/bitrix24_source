import { Type } from 'main.core';
import { type MenuOptions } from 'ui.vue3.components.menu';
import { mapState, mapActions } from 'ui.vue3.pinia';

import {
	TemplateNameInput,
	diagramStore as useDiagramStore,
} from '../../../../entities/blocks';

// @vue/component
export const EditTemplateName = {
	name: 'EditTemplateName',
	components: {
		TemplateNameInput,
	},
	props: {
		/** @type MenuOptions */
		dropdownOptions:
		{
			type: Object,
			default: () => ({}),
		},
	},
	computed: {
		...mapState(useDiagramStore, [
			'template',
			'isWriteLocked',
		]),
		templateName:
		{
			get(): string
			{
				return this.template?.NAME ?? '';
			},
			set(name: string): void
			{
				const templateName = Type.isStringFilled(name)
					? name
					: this.loc('BIZPROCDESIGNER_EDITOR_DEFAULT_TITLE')
				;

				// A setter cannot wait for the server, and it does not have to: the title on the
				// screen is the one from the store, and the store puts the new name there only
				// once the server has accepted it.
				void this.applyTemplateMetadata({
					NAME: templateName,
				});
			},
		},
	},
	methods: {
		...mapActions(useDiagramStore, [
			'applyTemplateMetadata',
		]),
		loc(locString: string): string
		{
			return this.$bitrix.Loc.getMessage(locString);
		},
	},
	template: `
		<TemplateNameInput
			v-model:title="templateName"
			:dropdownOptions="dropdownOptions"
			:readonly="isWriteLocked"
		/>
	`,
};
