import { BitrixVueComponentProps } from 'ui.vue3';
import { TagSelector } from '../../../layout';

export const DuplicateControlTargets: BitrixVueComponentProps = {
	name: 'DuplicateControlTargets',

	components: {
		TagSelector,
	},

	props: {
		model: {
			type: Object,
			required: true,
		},
		targets: {
			type: Array,
			required: true,
		},
	},

	template: `
		<TagSelector
			field-name="duplicateControlTargets"
			:model="model"
			:options="targets"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_DUPLICATE_CONTROL_TARGETS')"
			:multiple="true"
			:nullable="true"
		/>
	`,
};
