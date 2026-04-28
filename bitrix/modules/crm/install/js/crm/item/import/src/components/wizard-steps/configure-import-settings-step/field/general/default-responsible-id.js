import { BitrixVueComponentProps } from 'ui.vue3';
import { UserSelector } from '../../../../layout';

export const DefaultResponsibleId: BitrixVueComponentProps = {
	name: 'DefaultResponsibleId',

	components: {
		UserSelector,
	},

	props: {
		model: {
			type: Object,
			required: true,
		},
	},

	template: `
		<UserSelector
			field-name="defaultResponsibleId"
			:model="model"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_DEFAULT_RESPONSIBLE_ID')"
		/>
	`,
};
