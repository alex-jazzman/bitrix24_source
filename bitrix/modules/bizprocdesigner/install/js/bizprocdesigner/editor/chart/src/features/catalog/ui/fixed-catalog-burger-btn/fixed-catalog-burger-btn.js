import { storeToRefs } from 'ui.vue3.pinia';
import { BurgerBtn, useCatalogStore } from '../../../../entities/catalog';

type FixedCatalogBurgerBtnSetup = {
	isFixedCatalog: boolean,
	toggleFixedCatalog: () => void,
};

// @vue/component
export const FixedCatalogBurgerBtn = {
	name: 'fixed-catalog-burger-btn',
	components: {
		BurgerBtn,
	},
	setup(): FixedCatalogBurgerBtnSetup
	{
		const catalogStore = useCatalogStore();
		const { isFixedCatalog } = storeToRefs(catalogStore);

		return {
			isFixedCatalog,
			toggleFixedCatalog: catalogStore.toggleFixedCatalog,
		};
	},
	template: `
		<BurgerBtn
			:opened="isFixedCatalog"
			@click="toggleFixedCatalog"
		/>
	`,
};
