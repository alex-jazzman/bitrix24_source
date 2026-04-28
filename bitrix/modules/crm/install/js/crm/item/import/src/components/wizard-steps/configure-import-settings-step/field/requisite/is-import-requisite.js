import { BitrixVueComponentProps } from 'ui.vue3';
import { Checkbox } from '../../../../layout';

export const IsImportRequisite: BitrixVueComponentProps = {
	name: 'IsImportRequisite',

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
			field-name="isImportRequisite"
			:model="model"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_IS_IMPORT_REQUISITE')"
		/>
	`,
};
