import { BitrixVueComponentProps } from 'ui.vue3';
import { Checkbox } from '../../../../layout';

export const IsSkipEmptyColumns: BitrixVueComponentProps = {
	name: 'IsSkipEmptyColumns',

	components: {
		Checkbox,
	},

	props: {
		model: {
			type: Object,
			required: true,
		},
	},

	template: `
		<Checkbox
			field-name="isSkipEmptyColumns"
			:model="model"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_IS_SKIP_EMPTY_COLUMNS')"
		/>
	`,
};
