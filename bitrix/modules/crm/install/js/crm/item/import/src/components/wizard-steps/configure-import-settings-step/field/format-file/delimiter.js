import { BitrixVueComponentProps } from 'ui.vue3';
import { Select } from '../../../../layout';

export const Delimiter: BitrixVueComponentProps = {
	name: 'Delimiter',

	components: {
		Select,
	},

	props: {
		model: {
			type: Object,
			required: true,
		},
		delimiters: {
			type: Array,
			required: true,
		},
	},

	template: `
		<Select
			field-name="delimiter"
			:model="model"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_DELIMITER')"
			:options="delimiters"
		/>
	`,
};
