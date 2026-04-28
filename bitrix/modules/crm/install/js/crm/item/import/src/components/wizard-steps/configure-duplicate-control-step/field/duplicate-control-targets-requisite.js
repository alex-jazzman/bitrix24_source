import { BitrixVueComponentProps } from 'ui.vue3';
import type { SelectOption } from '../../../layout';
import { TagSelector } from '../../../layout';

export const DuplicateControlTargetsRequisite: BitrixVueComponentProps = {
	name: 'DuplicateControlTargetsRequisite',

	components: {
		TagSelector,
	},

	props: {
		countryId: {
			type: Number,
			required: true,
		},

		countryCaption: {
			type: String,
			required: true,
		},

		targets: {
			type: Array,
			required: true,
		},

		model: {
			type: Object,
			required: true,
		},
	},

	mounted(): void
	{
		if (!this.model.get(this.fieldName))
		{
			this.model.set(this.fieldName, this.targets.map((target: SelectOption) => target.value));
		}
	},

	computed: {
		fieldCaption(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_DUPLICATE_CONTROL_TARGETS_REQUISITE', {
				'#COUNTRY_TITLE#': this.countryCaption,
			});
		},

		fieldName(): string
		{
			return `duplicateControlTargetsRequisite__${this.countryId}`;
		},
	},

	template: `
		<TagSelector
			:field-name="fieldName"
			:model="model"
			:options="targets"
			:field-caption="fieldCaption"
			:multiple="true"
			:nullable="true"
		/>
	`,
};
