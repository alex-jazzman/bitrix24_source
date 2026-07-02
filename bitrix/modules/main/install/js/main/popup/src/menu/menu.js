import { Type, Text, Tag } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { FocusTrap, type InputModality } from 'ui.a11y';

import { Popup } from '../popup/popup';
import { type PopupTargetOptions } from '../popup/popup-types';
import { MenuItem } from './menu-item';
import { MenuNavigation } from './menu-navigation';
import { type MenuOptions, type MenuItemOptions } from './menu-types';

/**
 * @memberof BX.Main
 */
export class Menu extends EventEmitter
{
	#navigation: MenuNavigation | null = null;
	#focusedItem: MenuItem | null = null;
	#lastInputModality: InputModality | null = null;
	#ignoreMouseEnter: boolean = true;

	constructor(options: MenuOptions)
	{
		super();
		this.setEventNamespace('BX.Main.Menu');

		let [
			id: string,
			bindElement: PopupTargetOptions,
			menuItems: MenuItemOptions[],
			params: MenuOptions,
		] = arguments;

		if (Type.isPlainObject(options) && !bindElement && !menuItems && !params)
		{
			params = options;
			params.compatibleMode = false;

			id = options.id;
			bindElement = options.bindElement;
			menuItems = options.items;

			if (!Type.isStringFilled(id))
			{
				id = `menu-popup-${Text.getRandom()}`;
			}
		}

		this.emit('onInit', { id, bindElement, menuItems, params });

		this.id = id;
		this.bindElement = bindElement;

		/**
		 *
		 * @type {MenuItem[]}
		 */
		this.menuItems = [];
		this.itemsContainer = null;
		this.params = params && typeof (params) === 'object' ? params : {};
		this.parentMenuWindow = null;
		this.parentMenuItem = null;

		if (menuItems && Type.isArray(menuItems))
		{
			for (const menuItem of menuItems)
			{
				this.addMenuItemInternal(menuItem, null);
			}
		}

		this.layout = {
			menuContainer: null,
			itemsContainer: null,
		};

		this.popupWindow = this.#createPopup();
		this.#navigation = new MenuNavigation(this, params?.navigationOptions);

		this.subscribe('Item:onFocus', this.#handleItemFocus.bind(this));
		this.subscribe('Item:onBlur', this.#handleItemBlur.bind(this));
	}

	/**
	 * @private
	 */
	#createPopup(): Popup
	{
		const domItems = [];
		for (let i = 0; i < this.menuItems.length; i++)
		{
			const item = this.menuItems[i];
			const itemLayout = item.getLayout();
			domItems.push(itemLayout.item);
		}

		const defaults = {
			closeByEsc: true,
			angle: false,
			autoHide: true,
			offsetTop: 1,
			offsetLeft: 0,
			animation: 'fading',
		};

		const options = Object.assign(defaults, this.params);

		// Override user params
		options.noAllPaddings = true;
		options.darkMode = false;
		options.autoHideHandler = this.#handleAutoHide.bind(this);
		options.role = 'menu';

		if (Type.isNil(options.focusTrap) && Popup.shouldUseFocusTrapByDefault())
		{
			options.focusTrap = { initialFocus: 'container' };
		}

		this.layout.itemsContainer = Tag.render`
			<div class="menu-popup-items" role="presentation">${domItems}</div>
		`;

		this.layout.menuContainer = Tag.render`
			<div class="menu-popup" role="presentation">${this.layout.itemsContainer}</div>
		`;

		this.itemsContainer = this.layout.itemsContainer;
		options.content = this.layout.menuContainer;

		// Make internal event handlers first in the queue.
		options.events = {
			onBeforeShow: this.#handlePopupBeforeShow.bind(this),
			onShow: this.#handlePopupShow.bind(this),
			onAfterShow: this.#handlePopupAfterShow.bind(this),
			onClose: this.#handlePopupClose.bind(this),
			onDestroy: this.#handlePopupDestroy.bind(this),
		};

		const id = options.compatibleMode === false ? this.getId() : `menu-popup-${this.getId()}`;
		const popup = new Popup(id, this.bindElement, options);
		if (this.params && this.params.events)
		{
			popup.subscribeFromOptions(this.params.events);
		}

		return popup;
	}

	getPopupWindow(): Popup
	{
		return this.popupWindow;
	}

	show(): void
	{
		this.getPopupWindow().show();
	}

	close(): void
	{
		this.getPopupWindow().close();
	}

	destroy(): void
	{
		this.getPopupWindow().destroy();
	}

	toggle(): void
	{
		if (this.getPopupWindow().isShown())
		{
			this.close();
		}
		else
		{
			this.show();
		}
	}

	isShown(): boolean
	{
		return this.getPopupWindow().isShown();
	}

	getId(): string
	{
		return this.id;
	}

	getNavigation(): MenuNavigation
	{
		return this.#navigation;
	}

	getFocusTrap(): FocusTrap | null
	{
		return this.getPopupWindow().getFocusTrap();
	}

	setLastInputModality(modality: InputModality): void
	{
		this.#lastInputModality = modality;
	}

	getLastInputModal(): InputModality
	{
		return this.#lastInputModality;
	}

	shouldIgnoreMouseEnter(): boolean
	{
		return this.#ignoreMouseEnter;
	}

	#handlePopupBeforeShow(): void
	{
		this.emit('onBeforeShow');

		this.#ignoreMouseEnter = true;
	}

	#handlePopupShow(): void
	{
		this.emit('onShow');
	}

	#handlePopupAfterShow(): void
	{
		this.emit('onAfterShow');

		this.#ignoreMouseEnter = false;
	}

	#handlePopupClose(): void
	{
		this.emit('onClose');

		for (let i = 0; i < this.menuItems.length; i++)
		{
			const item = this.menuItems[i];
			item.blur();
			item.closeSubMenu();
		}
	}

	#handlePopupDestroy(): void
	{
		this.emit('onDestroy');

		for (let i = 0; i < this.menuItems.length; i++)
		{
			const item = this.menuItems[i];
			item.blur();
			item.destroySubMenu();
		}
	}

	#handleAutoHide(event): boolean
	{
		return !this.containsTarget(event.target);
	}

	/**
	 * @private
	 */
	containsTarget(target: Element): boolean
	{
		const el = this.getPopupWindow().getPopupContainer();
		if (this.getPopupWindow().isShown() && (target === el || el.contains(target)))
		{
			return true;
		}

		return this.getMenuItems().some((item: MenuItem) => {
			return item.getSubMenu() && item.getSubMenu().containsTarget(target);
		});
	}

	setParentMenuWindow(parentMenu: Menu): void
	{
		if (parentMenu instanceof Menu)
		{
			this.parentMenuWindow = parentMenu;
		}
	}

	getParentMenuWindow(): Menu | null
	{
		return this.parentMenuWindow;
	}

	isRootMenu(): boolean
	{
		return this.getParentMenuWindow() === null;
	}

	getRootMenuWindow(): Menu | null
	{
		let root = null;
		let parent = this.getParentMenuWindow();
		while (parent !== null)
		{
			root = parent;
			parent = parent.getParentMenuWindow();
		}

		return root;
	}

	setParentMenuItem(parentItem: MenuItem): void
	{
		if (parentItem instanceof MenuItem)
		{
			this.parentMenuItem = parentItem;
		}
	}

	getParentMenuItem(): MenuItem | null
	{
		return this.parentMenuItem;
	}

	addMenuItem(menuItemJson: any, targetItemId: string): MenuItem
	{
		const menuItem = this.addMenuItemInternal(menuItemJson, targetItemId);
		if (!menuItem)
		{
			return null;
		}

		const itemLayout = menuItem.getLayout();
		const targetItem = this.getMenuItem(targetItemId);
		if (targetItem === null)
		{
			this.itemsContainer.appendChild(itemLayout.item);
		}
		else
		{
			const targetLayout = targetItem.getLayout();
			this.itemsContainer.insertBefore(itemLayout.item, targetLayout.item);
		}

		return menuItem;
	}

	/**
	 * @private
	 */
	addMenuItemInternal(menuItemJson: any, targetItemId: string): MenuItem
	{
		if (
			!menuItemJson
			|| (
				!menuItemJson.delimiter
				&& !Type.isStringFilled(menuItemJson.text)
				&& !Type.isStringFilled(menuItemJson.html)
				&& !Type.isElementNode(menuItemJson.html)
			)
			|| (menuItemJson.id && this.getMenuItem(menuItemJson.id) !== null)
		)
		{
			return null;
		}

		if (Type.isNumber(this.params.menuShowDelay))
		{
			menuItemJson.menuShowDelay = this.params.menuShowDelay;
		}

		const menuItem = new MenuItem(menuItemJson);
		menuItem.setMenuWindow(this);

		const position = this.getMenuItemPosition(targetItemId);
		if (position >= 0)
		{
			this.menuItems.splice(position, 0, menuItem);
		}
		else
		{
			this.menuItems.push(menuItem);
		}

		return menuItem;
	}

	removeMenuItem(itemId: string, options = {
		destroyEmptyPopup: true,
	}): void
	{
		const item = this.getMenuItem(itemId);
		if (!item)
		{
			return;
		}

		for (let position = 0; position < this.menuItems.length; position++)
		{
			if (this.menuItems[position] === item)
			{
				item.destroySubMenu();
				this.menuItems.splice(position, 1);
				break;
			}
		}

		if (this.menuItems.length === 0)
		{
			const menuWindow = item.getMenuWindow();
			if (menuWindow)
			{
				const parentMenuItem = menuWindow.getParentMenuItem();
				if (parentMenuItem)
				{
					parentMenuItem.destroySubMenu();
				}
				else if (options.destroyEmptyPopup)
				{
					menuWindow.destroy();
				}
			}
		}

		item.layout.item.parentNode.removeChild(item.layout.item);
		item.layout = {
			item: null,
			text: null,
		};
	}

	getMenuItem(itemId: string): MenuItem | null
	{
		for (let i = 0; i < this.menuItems.length; i++)
		{
			if (this.menuItems[i].id && this.menuItems[i].id === itemId)
			{
				return this.menuItems[i];
			}
		}

		return null;
	}

	getMenuItems(): MenuItem[]
	{
		return this.menuItems;
	}

	getMenuItemPosition(itemId: string): number
	{
		if (itemId)
		{
			for (let i = 0; i < this.menuItems.length; i++)
			{
				if (this.menuItems[i].id && this.menuItems[i].id === itemId)
				{
					return i;
				}
			}
		}

		return -1;
	}

	getMenuContainer(): HTMLElement
	{
		return this.getPopupWindow().getPopupContainer();
	}

	getFocusedItem(): MenuItem | null
	{
		return this.#focusedItem;
	}

	clearFocus(): void
	{
		if (this.#focusedItem)
		{
			this.#focusedItem.blur();
			this.#focusedItem = null;
		}
	}

	#handleItemFocus(event: BaseEvent): void
	{
		const { item } = event.getData();
		if (this.#focusedItem === item)
		{
			return;
		}

		this.clearFocus();

		this.#focusedItem = item;
	}

	#handleItemBlur(): void
	{
		this.clearFocus();
	}
}
