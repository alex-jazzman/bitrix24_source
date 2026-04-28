import { BitrixVueComponentProps } from 'ui.vue3';
import { Checkbox } from '../../../../layout';

export const IsRequisitePresetUseDefault: BitrixVueComponentProps = {
	name: 'IsRequisitePresetUseDefault',

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
			field-name="isRequisitePresetUseDefault"
			:model="model"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_IS_REQUISITE_PRESET_USE_DEFAULT')"
		/>
	`,
};
