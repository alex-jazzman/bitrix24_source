import { Browser } from 'main.core';
import { toValue } from 'ui.vue3';
import { storeToRefs } from 'ui.vue3.pinia';
import { BurgerBtn, useCatalogStore } from '../../../../entities/catalog';

type FixedCatalogBurgerBtnSetup = {
	isExpandedCatalog: boolean,
	shortcut: string,
	toggleFixedCatalog: () => void,
};

// The combo the catalog widget registers, spelled the way `aria-keyshortcuts` is read: key names of
// the keyboard event, not the tokens of the input state.
const SHORTCUT = {
	mac: 'Meta+B',
	other: 'Control+B',
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
		// What the button reports is what the panel shows, and that is the expansion: a catalog opened
		// by the pointer alone is unpinned and open at once.
		const { isExpandedCatalog, isFixedCatalog } = storeToRefs(catalogStore);

		// The click does what the button announced: a catalog left open by the pointer alone is
		// collapsed along with the pin, so the expansion follows the pin on this path as it does on
		// the keyboard one.
		function toggleFixedCatalog(): void
		{
			catalogStore.toggleFixedCatalog();
			catalogStore.setExpandedCatalog(toValue(isFixedCatalog));
		}

		return {
			isExpandedCatalog,
			shortcut: Browser.isMac() ? SHORTCUT.mac : SHORTCUT.other,
			toggleFixedCatalog,
		};
	},
	template: `
		<BurgerBtn
			:opened="isExpandedCatalog"
			:aria-keyshortcuts="shortcut"
			@click="toggleFixedCatalog"
		/>
	`,
};
