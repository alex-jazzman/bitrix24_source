import { type BitrixVueComponentProps } from 'ui.vue3';
import { Menu, type MenuOptions } from 'main.popup';

import { ServiceLocator } from '../../../lib/service-locator';
import { ShowMore } from './show-more';

export const ShowMoreMenu: BitrixVueComponentProps = {
	name: 'ShowMoreMenu',

	components: {
		ShowMore,
	},

	props: {
		items: {
			/** @type MenuOptions[] */
			type: Array,
			required: true,
		},
	},

	data(): Object
	{
		return {
			isMenuShown: false,
		};
	},

	// The menu is held by the global PopupManager and can outlive the component
	// (the card is redrawn while the menu is open), so handlers left subscribed
	// would keep the unmounted component alive through their closure. The menu
	// itself is not destroyed: that would tear down a menu the user is reading.
	beforeUnmount(): void
	{
		this.menu?.unsubscribe('onShow', this.onMenuShow);
		this.menu?.unsubscribe('onClose', this.onMenuClose);
	},

	methods: {
		getMenu(): Menu
		{
			if (!this.menu)
			{
				this.menu = new Menu({
					items: this.items,
					bindElement: this.$refs.showMoreContainer.$el,
					angle: {
						offset: this.$refs.showMoreContainer.$el.offsetWidth / 2,
					},
				});

				// Named methods, not inline closures: unsubscribing on unmount needs
				// the very same references, and Vue keeps one bound copy per instance.
				this.menu.subscribe('onShow', this.onMenuShow);
				this.menu.subscribe('onClose', this.onMenuClose);

				ServiceLocator
					.getInstance()
					.getEventService()
					.registerChildPopup(this.$Bitrix.eventEmitter, this.menu.getPopupWindow());
			}

			return this.menu;
		},

		onMenuShow(): void
		{
			this.isMenuShown = true;
		},

		onMenuClose(): void
		{
			this.isMenuShown = false;
			this.restoreFocus();
		},

		// Focus goes back to the trigger only when the closing menu was holding it,
		// otherwise the caret is somewhere else and must stay there. The trigger is
		// read defensively: the menu is shared layout and a redraw can replace it.
		restoreFocus(): void
		{
			const menuContainer = this.menu?.getMenuContainer();
			const { activeElement } = document;

			if (!menuContainer || activeElement === null || !menuContainer.contains(activeElement))
			{
				return;
			}

			this.$refs.showMoreContainer?.$el?.focus();
		},

		toggleMenu(): void
		{
			this.getMenu().toggle();
		},
	},

	template: `
		<ShowMore
			ref="showMoreContainer"
			:count="items.length"
			has-popup="menu"
			:expanded="isMenuShown"
			@click="toggleMenu"
		/>
	`,
};
