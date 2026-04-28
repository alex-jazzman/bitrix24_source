import { BitrixVueComponentProps } from 'ui.vue3';
import { TagSelector } from '../../../../layout';

export const DefaultContactType: BitrixVueComponentProps = {
	name: 'DefaultContactType',

	components: {
		TagSelector,
	},

	props: {
		model: {
			type: Object,
			required: true,
		},
		contactTypes: {
			type: Array,
			required: true,
		},
	},

	template: `
		<TagSelector
			field-name="defaultContactType"
			:model="model"
			:options="contactTypes"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_DEFAULT_CONTACT_TYPE')"
		/>
	`,
};
