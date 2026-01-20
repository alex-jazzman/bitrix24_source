import { ITEM_TYPES } from '../constants';
import { ConstantComponent } from './item/constant';
import { DelimiterComponent } from './item/delimiter';
import { DescriptionComponent } from './item/description';
import { TitleComponent } from './item/title';
import { TitleIconComponent } from './item/title-with-icon';

import '../css/style.css';

const componentMap = {
	[ITEM_TYPES.TITLE]: 'TitleComponent',
	[ITEM_TYPES.TITLE_WITH_ICON]: 'TitleIconComponent',
	[ITEM_TYPES.DESCRIPTION]: 'DescriptionComponent',
	[ITEM_TYPES.DELIMITER]: 'DelimiterComponent',
	[ITEM_TYPES.CONSTANT]: 'ConstantComponent',
};

// @vue/component
export const FormElement = {
	name: 'FormElement',
	components: {
		TitleComponent,
		TitleIconComponent,
		DelimiterComponent,
		DescriptionComponent,
		ConstantComponent,
	},
	props: {
		/** @type Item */
		item: {
			type: Object,
			required: true,
		},
		formData: {
			type: Object,
			required: true,
		},
		errors: {
			type: Object,
			required: true,
		},
	},
	emits: ['constantUpdate'],
	computed: {
		componentName(): ?string
		{
			return componentMap[this.item.itemType] || null;
		},
		constantFormData(): Object | undefined
		{
			if (this.item.itemType === ITEM_TYPES.CONSTANT)
			{
				return this.formData;
			}

			return undefined;
		},
	},
	methods: {
		constantUpdate(constantId: string, value: string): void
		{
			this.$emit('constantUpdate', constantId, value);
		},
	},
	template: `
		<component
			v-if="componentName"
			:is="componentName"
			:item="item"
			:formData="constantFormData"
			:error="errors[item.id]"
			@constantUpdate="constantUpdate"
		/>
	`,
};
