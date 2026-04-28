import { BitrixVueComponentProps } from 'ui.vue3';
import { Select } from '../../../../layout';

export const NameFormat: BitrixVueComponentProps = {
	name: 'NameFormat',

	components: {
		Select,
	},

	props: {
		model: {
			type: Object,
			required: true,
		},
		nameFormats: {
			type: Array,
			required: true,
		},
	},

	template: `
		<Select
			field-name="nameFormat"
			:model="model"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_NAME_FORMAT')"
			:options="nameFormats"
		/>
	`,
};
