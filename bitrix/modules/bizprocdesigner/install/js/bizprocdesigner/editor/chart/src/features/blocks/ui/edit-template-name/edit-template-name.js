import { Type } from 'main.core';
import { mapWritableState, mapActions } from 'ui.vue3.pinia';
// eslint-disable-next-line no-unused-vars
import type { MenuOptions } from 'ui.vue3.components.menu';
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
		...mapWritableState(useDiagramStore, [
			'template',
		]),
		templateName:
		{
			get(): string
			{
				return this.template?.NAME ?? '';
			},
			set(name: string): void
			{
				this.template.NAME =
					Type.isStringFilled(name)
						? name
						: this.loc('BIZPROCDESIGNER_EDITOR_DEFAULT_TITLE')
				;

				this.updateTemplateData({
					NAME: this.template.NAME,
				});
			},
		},
	},
	methods: {
		...mapActions(useDiagramStore, [
			'updateTemplateData',
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
		/>
	`,
};
