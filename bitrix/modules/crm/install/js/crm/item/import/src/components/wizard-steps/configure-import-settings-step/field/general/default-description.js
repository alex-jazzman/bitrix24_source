import { BitrixVueComponentProps } from 'ui.vue3';
import { Textarea } from '../../../../layout';

export const DefaultDescription: BitrixVueComponentProps = {
	name: 'DefaultDescription',

	components: {
		Textarea,
	},

	props: {
		model: {
			type: Object,
			required: true,
		},
	},

	template: `
		<Textarea
			field-name="defaultDescription"
			:model="model"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_DEFAULT_DESCRIPTION')"
		/>
	`,
};
