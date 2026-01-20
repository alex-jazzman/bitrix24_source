import { mapActions } from 'ui.vue3.pinia';
import {
	CatalogItem,
	useCatalogStore,
	getDragItemSlotName,
} from '../../../../entities/catalog';
import type {
	GetDragItemSlotName,
	// eslint-disable-next-line no-unused-vars
	CatalogMenuItem,
} from '../../../../entities/catalog';

// @vue/component
export const ChangeFoundedCatalogItem = {
	name: 'ChangeFoundedCatalogItem',
	components: {
		CatalogItem,
	},
	props: {
		/** @type CatalogMenuItem */
		item: {
			type: Object,
			required: true,
		},
	},
	setup(): Record<string, GetDragItemSlotName>
	{
		return {
			getDragItemSlotName,
		};
	},
	methods: {
		...mapActions(useCatalogStore, [
			'changeCurrentGroup',
			'showFoundedGroupItems',
			'setHighlightedItem',
		]),
		onChangeItem(): void
		{
			this.changeCurrentGroup(this.item.parentGroup);
			this.showFoundedGroupItems();
			this.setHighlightedItem(this.item.id);
		},
	},
	template: `
		<CatalogItem
			:item="item"
			@dblclick="onChangeItem"
		>
			<template #[getDragItemSlotName(item.type)]="{ item }">
				<slot
					:name="getDragItemSlotName(item.type)"
					:item="item"
				/>
			</template>
		</CatalogItem>
	`,
};
