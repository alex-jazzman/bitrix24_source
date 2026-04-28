import { BitrixVueComponentProps } from 'ui.vue3';
import { Checkbox } from '../../../../layout';

export const IsRequisitePresetAssociate: BitrixVueComponentProps = {
	name: 'IsRequisitePresetAssociate',

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
			field-name="isRequisitePresetAssociate"
			:model="model"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_IS_REQUISITE_ASSOC_PRESET')"
		/>
	`,
};
