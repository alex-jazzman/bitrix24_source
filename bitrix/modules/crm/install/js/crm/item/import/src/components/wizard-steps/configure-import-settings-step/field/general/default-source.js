import { BitrixVueComponentProps } from 'ui.vue3';
import { TagSelector } from '../../../../layout';

export const DefaultSource: BitrixVueComponentProps = {
	name: 'DefaultSource',

	components: {
		TagSelector,
	},

	props: {
		model: {
			type: Object,
			required: true,
		},
		sources: {
			type: Array,
			required: true,
		},
	},

	template: `
		<TagSelector
			field-name="defaultSource"
			:model="model"
			:options="sources"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_DEFAULT_SOURCE')"
		/>
	`,
};
