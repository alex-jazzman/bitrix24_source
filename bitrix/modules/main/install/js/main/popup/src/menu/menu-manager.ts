import { Type } from 'main.core';

import { type PopupTarget } from '../popup/popup-types';
import { Menu } from './menu';
import { type MenuLegacyOptions, type MenuOptions, type MenuItemOptions } from './menu-types';

export class MenuManager
{
	private static Data: { [id: string]: Menu } = {};
	private static currentItem: Menu | null = null;

	constructor()
	{
		throw new Error('You cannot make an instance of MenuManager.');
	}

	static show(options?: MenuOptions): void;

	static show(
		id: string | null,
		bindElement?: PopupTarget,
		menuItems?: MenuItemOptions[],
		params?: MenuLegacyOptions,
	): void;

	static show(
		options?: MenuOptions | string | null,
		compatBindElement?: PopupTarget,
		compatMenuItems?: MenuItemOptions[],
		compatParams?: MenuLegacyOptions,
	): void
	{
		if (this.currentItem !== null)
		{
			this.currentItem.getPopupWindow().close();
		}

		this.currentItem = this.create(
			options as string | null,
			compatBindElement,
			compatMenuItems,
			compatParams,
		);
		this.currentItem.getPopupWindow().show();
	}

	/**
	 * Modern signature: a single options object.
	 */
	static create(options?: MenuOptions): Menu;

	/**
	 * Legacy positional signature `(id, bindElement, items, params)`. Kept for
	 * backward compatibility. `params` is an extensible options bag and may carry
	 * legacy keys that are not part of {@link MenuOptions}.
	 */
	static create(
		id: string | null,
		bindElement?: PopupTarget,
		menuItems?: MenuItemOptions[],
		params?: MenuLegacyOptions,
	): Menu;

	static create(
		options?: MenuOptions | string | null,
		compatBindElement?: PopupTarget,
		compatMenuItems?: MenuItemOptions[],
		compatParams?: MenuLegacyOptions,
	): Menu
	{
		const menuId = this.resolveMenuId(options, compatBindElement, compatMenuItems, compatParams);

		if (!this.Data[menuId])
		{
			// Menu re-detects modern mode at runtime from the argument shape, so the options
			// object is passed through the positional overload as is.
			const menu = new Menu(options as string | null, compatBindElement, compatMenuItems, compatParams);
			menu.getPopupWindow().subscribe('onDestroy', () => {
				MenuManager.destroy(menuId);
			});

			this.Data[menuId] = menu;
		}

		return this.Data[menuId];
	}

	private static resolveMenuId(
		options?: MenuOptions | string | null,
		compatBindElement?: PopupTarget,
		compatMenuItems?: MenuItemOptions[],
		compatParams?: MenuLegacyOptions,
	): string
	{
		if (Type.isPlainObject(options) && !compatBindElement && !compatMenuItems && !compatParams)
		{
			if (!Type.isStringFilled(options.id))
			{
				throw new Error('BX.Main.Menu.create: "id" parameter is required.');
			}

			return options.id;
		}

		return options as string;
	}

	static getCurrentMenu(): Menu | null
	{
		return this.currentItem;
	}

	static getMenuById(id: string): Menu | null
	{
		return this.Data[id] || null;
	}

	static getMenus(): Menu[]
	{
		return Object.values(this.Data);
	}

	/**
	 * compatibility
	 */
	private static onPopupDestroy(popupMenuWindow: Menu): void
	{
		this.destroy(popupMenuWindow.getId());
	}

	static destroy(id: string): void
	{
		const menu = this.getMenuById(id);
		if (menu)
		{
			if (this.currentItem === menu)
			{
				this.currentItem = null;
			}

			delete this.Data[id];
			menu.getPopupWindow().destroy();
		}
	}
}
