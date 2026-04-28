import { BitrixVueComponentProps } from 'ui.vue3';
import { Select } from '../../../layout';
import { InfoHelper } from 'ui.info-helper';

import 'ui.icon-set.outline';

export const DuplicateControlBehavior: BitrixVueComponentProps = {
	name: 'DuplicateControlBehavior',

	components: {
		Select,
	},

	props: {
		model: {
			type: Object,
			required: true,
		},
		behaviors: {
			type: Array,
			required: true,
		},
		isDuplicateControlPermitted: {
			type: Boolean,
			required: true,
		},
	},

	methods: {
		getIcon(): ?Object
		{
			if (this.isDuplicateControlPermitted)
			{
				return null;
			}

			return {
				name: BX.UI.IconSet.Outline.LOCK_M,
			};
		},

		isReadonly(): boolean
		{
			return !this.isDuplicateControlPermitted;
		},

		tryShowRestrictionSlider(event): void
		{
			if (this.isDuplicateControlPermitted)
			{
				return;
			}

			event.preventDefault();
			InfoHelper.show('limit_crm_duplicates_search');
		},
	},

	template: `
		<Select
			field-name="duplicateControlBehavior"
			:model="model"
			:options="behaviors"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_DUPLICATE_CONTROL_BEHAVIOR')"
			:readonly="isReadonly()"
			:icon="getIcon()"
			@onSelectMouseDown="tryShowRestrictionSlider($event)"
		/>
	`,
};
