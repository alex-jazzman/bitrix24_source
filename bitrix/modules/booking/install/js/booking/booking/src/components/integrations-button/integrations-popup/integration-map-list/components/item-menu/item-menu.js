import { Text } from 'main.core';
import { Menu, MenuManager } from 'main.popup';

import type { IntegrationMapItem } from '../../integration-map-list';

import './item-menu.css';

// @vue/component
export const ItemMenu = {
	name: 'IntegrationMapItemMenu',
	props: {
		item: {
			type: Object,
			required: true,
		},
	},
	data(): { menuPopup: Menu | null }
	{
		return {
			menuPopup: null,
		};
	},
	computed: {
		popupId(): string
		{
			return `integration-map-item-menu-${Text.getRandom(4)}`;
		},
		getItem(): IntegrationMapItem
		{
			return this.item;
		},
	},
	unmounted(): void
	{
		this.menuPopup?.destroy();
	},
	methods: {
		openMenu(): void
		{
			if (this.menuPopup?.popupWindow?.isShown())
			{
				this.destroy();

				return;
			}

			const menuButton = this.$refs['menu-button'];
			this.menuPopup = MenuManager.create(
				this.popupId,
				menuButton,
				this.getMenuItems(),
				{
					className: 'integration-map-item-menu-popup',
					closeByEsc: true,
					autoHide: true,
					cacheable: true,
				},
			);
			this.menuPopup.show();
		},
		getMenuItems(): Array<Object>
		{
			return [
				{
					html: `<span>${this.loc('BOOKING_INTEGRATIONS_MAPS_LIST_ITEM_MENU_EDIT_BUTTON_LABEL')}</span>`,
					onclick: (): void => {
						if (this.getItem.click)
						{
							this.getItem.click();
						}

						this.destroy();
					},
				},
			];
		},
		destroy(): void
		{
			MenuManager.destroy(this.popupId);
		},
	},
	template: `
		<button 
			ref="menu-button" 
			class="booking--integration-popup--integration-map-list-item__action-button ui-icon-set --more" 
			@click="openMenu"
		></button>
	`,
};
