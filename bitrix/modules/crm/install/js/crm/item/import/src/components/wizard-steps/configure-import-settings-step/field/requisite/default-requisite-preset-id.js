import { BitrixVueComponentProps } from 'ui.vue3';
import { ImportSettings } from '../../../../../lib/model/import-settings';
import { TagSelector } from '../../../../layout';

export const DefaultRequisitePresetId: BitrixVueComponentProps = {
	name: 'DefaultRequisitePresetId',

	components: {
		TagSelector,
	},

	props: {
		model: {
			type: ImportSettings,
			required: true,
		},
		requisitePresets: {
			type: Array,
			required: true,
		},
	},

	template: `
		<TagSelector
			field-name="defaultRequisitePresetId"
			:model="model"
			:options="requisitePresets"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_DEFAULT_REQUISITE_PRESET')"
		/>
	`,
};
