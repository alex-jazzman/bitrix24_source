import { mapActions, mapGetters } from 'ui.vue3.pinia';
import { CatalogGroup, useCatalogStore } from '../../../../entities/catalog';
// eslint-disable-next-line no-unused-vars
import type { CatalogMenuGroup } from '../../../../entities/catalog';

// @vue/component
export const ChangeFoundedCatalogGroup = {
	name: 'ChangeFoundedCatalogGroup',
	components: {
		CatalogGroup,
	},
	props: {
		/** @type CatalogMenuGroup */
		group: {
			type: Object,
			required: true,
		},
	},
	computed: {
		...mapGetters(useCatalogStore, [
			'searchResults',
		]),
	},
	methods: {
		...mapActions(useCatalogStore, [
			'showFoundedGroupItems',
			'changeCurrentGroup',
			'setHighlightedItem',
		]),
		onChangeGroup(): void
		{
			this.showFoundedGroupItems();
			this.changeCurrentGroup(this.group);
			this.setHighlightedItem(
				this.searchResults.items.map((item) => item.id),
			);
		},
	},
	template: `
		<CatalogGroup
			:group="group"
			:showItems="false"
			@changeGroup="onChangeGroup"
		>
			<template #icon>
				<slot name="icon"/>
			</template>
		</CatalogGroup>
	`,
};
