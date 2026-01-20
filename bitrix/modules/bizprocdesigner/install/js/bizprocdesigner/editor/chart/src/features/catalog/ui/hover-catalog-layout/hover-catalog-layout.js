import { storeToRefs } from 'ui.vue3.pinia';
import {
	CatalogLayout,
	useCatalogStore,
} from '../../../../entities/catalog';

type HoverCatalogLayoutSetup = {
	isExpandedCatalog: boolean,
	isShowSearchResults: boolean,
	onMouseOver: () => void,
	onMouseLeave: () => void,
};

// @vue/component
export const HoverCatalogLayout = {
	name: 'HoverCatalogLayout',
	components: {
		CatalogLayout,
	},
	setup(): HoverCatalogLayoutSetup
	{
		const catalogStore = useCatalogStore();
		const { isExpandedCatalog, isShowSearchResults } = storeToRefs(catalogStore);

		function onMouseOver(): void
		{
			catalogStore.expandCatalog();
		}

		function onMouseLeave(): void
		{
			catalogStore.collapseCatalog();
		}

		return {
			isExpandedCatalog,
			isShowSearchResults,
			onMouseOver,
			onMouseLeave,
		};
	},
	template: `
		<CatalogLayout
			:hasSearchResults="isShowSearchResults"
			:expanded="isExpandedCatalog"
			@mouseover="onMouseOver"
			@mouseleave="onMouseLeave"
		>
			<template #header>
				<slot name="header"/>
			</template>

			<template #search>
				<slot name="search"/>
			</template>

			<template #content>
				<slot name="content"/>
			</template>

			<template #search-results>
				<slot name="search-results"/>
			</template>

			<template #footer>
				<slot name="footer"/>
			</template>
		</CatalogLayout>
	`,
};
