// eslint-disable-next-line no-unused-vars
import { $Bitrix } from 'ui.vue3';
import { ITEM_TYPES } from '../constants';
// eslint-disable-next-line no-unused-vars
import type { Item, UpdateItemPropertyEventPayload } from '../types';
import { ConstantComponent } from './item/constant';
import { DelimiterComponent } from './item/delimiter';
import { DescriptionComponent } from './item/description';
import { TitleComponent } from './item/title';

// @vue/component
export const ItemComponent = {
	name: 'ItemComponent',
	components: {
		TitleComponent,
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
		/** Record<string, string> */
		fieldTypeNames: {
			type: Object,
			required: true,
		},
	},
	emits: ['deleteItem', 'updateItemProperty'],
	computed: {
		type(): string
		{
			return this.item.itemType;
		},
		isItemTitle(): boolean
		{
			return this.type === ITEM_TYPES.TITLE;
		},
		isItemDelimiter(): boolean
		{
			return this.type === ITEM_TYPES.DELIMITER;
		},
		isItemDescription(): boolean
		{
			return this.type === ITEM_TYPES.DESCRIPTION;
		},
		isItemConstant(): boolean
		{
			return this.type === ITEM_TYPES.CONSTANT;
		},
	},
	methods: {
		deleteItem(): void
		{
			this.$emit('deleteItem');
		},
		onUpdateItemProperty(payload: UpdateItemPropertyEventPayload): void
		{
			this.$emit('updateItemProperty', payload);
		},
	},
	template: `
		<div>
			<TitleComponent 
				v-if="isItemTitle"
				:item="item" 
				@updateItemProperty="onUpdateItemProperty"
			/>
			<DescriptionComponent
				v-if="isItemDescription"
				:item="item"
				@updateItemProperty="onUpdateItemProperty"
			/>
			<DelimiterComponent
				v-if="isItemDelimiter"
				:item="item"
				@updateItemProperty="onUpdateItemProperty"
			/>
			<ConstantComponent
				v-if="isItemConstant"
				:item="item"
				:fieldTypeNames="fieldTypeNames"
				@updateItemProperty="onUpdateItemProperty"
				@cancelItem="deleteItem"
			/>
			<button @click="deleteItem" type="button">
				{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DELETE') }}
			</button>
		</div>
	`,
};
