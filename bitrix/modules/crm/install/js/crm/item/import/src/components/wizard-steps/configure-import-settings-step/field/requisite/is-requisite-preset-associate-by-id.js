import { BitrixVueComponentProps } from 'ui.vue3';
import { Checkbox } from '../../../../layout';

export const IsRequisitePresetAssociateById: BitrixVueComponentProps = {
	name: 'isRequisitePresetAssociateById',

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
			field-name="isRequisitePresetAssociateById"
			:model="model"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_IS_REQUISITE_ASSOC_PRESET_BY_ID')"
		/>
	`,
};
