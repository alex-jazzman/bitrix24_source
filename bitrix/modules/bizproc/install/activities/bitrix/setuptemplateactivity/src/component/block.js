import { BMenu } from 'ui.system.menu.vue';
import type { MenuOptions } from 'ui.system.menu';
// eslint-disable-next-line no-unused-vars
import { $Bitrix } from 'ui.vue';
import type { Item, UpdateItemPropertyEventPayload } from '../types';
import { makeEmptyConstant, makeEmptyDelimiter, makeEmptyDescription, makeEmptyTitle } from '../utils';
import { ItemComponent } from './item';

// @vue/component
export const BlockComponent = {
	name: 'BlockComponent',
	components: {
		ItemComponent,
		BMenu,
	},
	props: {
		/** @type Array<Item> */
		items: {
			type: Array,
			required: true,
		},
		position: {
			type: Number,
			required: true,
		},
		/** Record<string, string> */
		fieldTypeNames: {
			type: Object,
			required: true,
		},
	},
	emits: ['addItem', 'deleteBlock', 'deleteItem', 'updateItemProperty'],
	data(): { isMenuShown: boolean }
	{
		return {
			isMenuShown: false,
		};
	},
	computed: {
		title(): string
		{
			return this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_BLOCK_TITLE', {
				'#POSITION#': this.position,
			});
		},
		menuOptions(): MenuOptions {
			return {
				bindElement: this.$refs.addItemElementRef,
				items: [
					{
						onClick: () => this.addItem(makeEmptyTitle()),
						title: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_TITLE_ITEM_LABEL'),
					},
					{
						onClick: () => this.addItem(makeEmptyDescription()),
						title: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DESCRIPTION_ITEM_LABEL'),
					},
					{
						onClick: () => this.addItem(makeEmptyDelimiter()),
						title: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DELIMITER_ITEM_LABEL'),
					},
					{
						onClick: () => this.addItem(makeEmptyConstant()), // todo add event to change constants of workflow
						title: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_MENU'),
					},
				],
			};
		},
	},
	methods: {
		addItem(item: Item): void
		{
			this.$emit('addItem', item);
		},
		deleteBlock(): void
		{
			this.$emit('deleteBlock');
		},
		deleteItem(itemIndex: number): void
		{
			this.$emit('deleteItem', itemIndex);
		},
		onUpdateItemProperty(itemIndex: number, payload: UpdateItemPropertyEventPayload): void
		{
			const filledPayload: UpdateItemPropertyEventPayload = {
				propertyValues: payload.propertyValues,
				itemIndex,
			};
			this.$emit('updateItemProperty', filledPayload);
		},
	},
	template: `
		<div>
			<div>
				{{ title }} 
				<button @click="deleteBlock" type="button">
					{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DELETE') }}
				</button>
			</div>
			<div v-for="(item, index) in items">
				<ItemComponent 
					:key="index"
					:item="item"
					:fieldTypeNames="fieldTypeNames"
					@deleteItem="deleteItem(index)"
					@updateItemProperty="onUpdateItemProperty(index, $event)"
				/>
			</div>
			<div @click="isMenuShown = true" ref="addItemElementRef">
				{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ADD_ITEM') }}
				<BMenu  v-if="isMenuShown" :options="menuOptions" @close="isMenuShown = false" />
			</div>
		</div>
	`,
};
