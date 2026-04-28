import { BitrixVueComponentProps } from 'ui.vue3';
import { Checkbox } from '../../../../layout';

export const IsFirstRowHasHeaders: BitrixVueComponentProps = {
	name: 'IsFirstRowHasHeaders',

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
			field-name="isFirstRowHasHeaders"
			:model="model"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_IS_FIRST_ROW_HAS_HEADERS')"
		/>
	`,
};
