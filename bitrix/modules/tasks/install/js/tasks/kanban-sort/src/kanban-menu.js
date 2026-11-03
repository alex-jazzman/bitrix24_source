import { Dom, Loc, Type } from 'main.core';
import { MenuItem, Menu } from 'main.popup';
import { FocusMonitor, LiveAnnouncer } from 'ui.a11y';
import { OrderType } from './order-type/order-type';

export class KanbanMenu
{
	#mainMenu: Menu;
	#mainItem: ?MenuItem;

	static SELECTED = 'menu-popup-item-accept';
	static DESELECTED = 'menu-popup-item-none';
	// the class comes from the filter template, the sort menu of the task list hides its items by it
	static HIDDEN = 'menu-popup-item-display-none';
	static DIRECTION_DELIMITER_ID = 'tasksKanbanSortDirectionDelimiter';
	// one role in a flat menu reads as one set of mutually exclusive items, so the radio role stays
	// with the order of the board alone: the direction and the new task placement are chosen on top of it
	static ORDER_ROLE = 'menuitemradio';
	static MODIFIER_ROLE = 'menuitemcheckbox';

	constructor(item: ?MenuItem, menu: ?Menu = null)
	{
		this.#mainItem = item;
		this.#mainMenu = menu ?? this.#mainItem.getMenuWindow();
	}

	/**
	 * The first render of the menu comes from the server, where the choice is expressed by a class
	 * only, and the sort options reach the item as options of a foreign menu we hold no reference to.
	 * The show of the menu is the single moment both are reachable.
	 */
	static describeOptions(items: MenuItem[])
	{
		items.forEach((item) => {
			const node = item?.layout?.item;
			const role = KanbanMenu.#getChoiceRole(item);
			if (!node || !role)
			{
				return;
			}

			Dom.attr(node, 'role', role);
			KanbanMenu.#nameItself(node);
			KanbanMenu.#markState(item, Dom.hasClass(node, KanbanMenu.SELECTED));
		});
	}

	/**
	 * The accessible name comes from the server on a nested span, whose generic role forbids
	 * `aria-label` - WebKit ignores it there. The name belongs to the item itself.
	 */
	static #nameItself(node: HTMLElement)
	{
		const named = node.querySelector('.menu-popup-item-text [aria-label]');
		if (!named)
		{
			return;
		}

		Dom.attr(node, 'aria-label', named.getAttribute('aria-label'));
		Dom.attr(named, 'aria-label', null);
	}

	static #markState(item: MenuItem, selected: boolean)
	{
		const node = item?.layout?.item;
		if (!node || !KanbanMenu.#getChoiceRole(item))
		{
			return;
		}

		Dom.attr(node, 'aria-checked', selected ? 'true' : 'false');
	}

	select(item: MenuItem)
	{
		Dom.removeClass(item.layout.item, KanbanMenu.DESELECTED);
		Dom.addClass(item.layout.item, KanbanMenu.SELECTED);
		KanbanMenu.#markState(item, true);
	}

	deselect(item: MenuItem)
	{
		Dom.removeClass(item.layout.item, KanbanMenu.SELECTED);
		Dom.addClass(item.layout.item, KanbanMenu.DESELECTED);
		KanbanMenu.#markState(item, false);
	}

	// the chosen axis and direction are marked by a class only: a screen reader needs the aria state
	syncAriaState()
	{
		KanbanMenu.describeOptions(this.getItems());
		this.#syncDirectionVisibility();
	}

	deselectAll()
	{
		this.getItems().forEach(element => {
			this.deselect(element);
		});
		this.#syncDirectionVisibility();
	}

	deselectSubItems()
	{
		this.getSubItems().forEach(element => {
			this.deselect(element);
		});
	}

	isSelected(item: MenuItem): boolean
	{
		return Dom.hasClass(item.layout.item, KanbanMenu.SELECTED);
	}

	getSelectedField(): ?string
	{
		return this.#getSelectedParam('field');
	}

	getSelectedDirection(): ?string
	{
		return this.#getSelectedParam('direction');
	}

	applyFieldSort(field: string, direction: string)
	{
		this.removeSubItems();
		this.deselectAll();
		this.#select('field', field);
		this.#select('direction', direction);
		this.#syncDirectionVisibility();
	}

	isCustomSortEnabled()
	{
		const items = this.getItems();
		const ascSort = items.find(item => item.params?.type === 'sub' && item.params?.order === OrderType.ASC);
		const descSort = items.find(item => item.params?.type === 'sub' && item.params?.order === OrderType.DESC);

		return Boolean(ascSort) && Boolean(descSort);
	}

	addItemsFromItemParams(onSelectCallback)
	{
		KanbanMenu.#getOwnedItems(this.#mainItem).forEach(subItem => {
			if (Type.isString(subItem.params))
			{
				subItem.params = BX.parseJSON(subItem.params);
			}
			if (subItem.params?.order)
			{
				subItem.onclick = onSelectCallback;
			}
			this.#mainMenu.addMenuItem(subItem);
		});

		KanbanMenu.describeOptions(this.getItems());

		LiveAnnouncer.announce(Loc.getMessage('TASKS_KANBAN_A11Y_SORT_MENU_EXPANDED'), 'polite');
	}

	removeSubItems()
	{
		const subItems = this.getSubItems();

		this.#moveFocusOut(subItems);
		subItems.forEach(subItem => {
			this.#mainMenu.removeMenuItem(subItem.getId());
		});

		LiveAnnouncer.announce(Loc.getMessage('TASKS_KANBAN_A11Y_SORT_MENU_COLLAPSED'), 'polite');
	}

	#moveFocusOut(items: MenuItem[])
	{
		const focusedItem = items.find(item => this.#holdsFocus(item));
		if (!focusedItem)
		{
			return;
		}

		const menuItems = this.getItems();
		const stays = (item: MenuItem) => item.isFocusable() && !items.includes(item);
		const position = menuItems.indexOf(focusedItem);
		const neighbour = (
			menuItems.slice(0, position).reverse().find(stays)
			?? menuItems.slice(position + 1).find(stays)
		);

		neighbour?.focus(FocusMonitor.Instance.getLastInputModality() === 'keyboard');
	}

	#holdsFocus(item: MenuItem)
	{
		return item.isFocused() || item.layout.item.contains(document.activeElement);
	}

	getSubItems()
	{
		return this.getItems().filter(element => element.params?.type === 'sub');
	}

	getItems()
	{
		return this.#mainMenu.getMenuItems();
	}

	find(order: string = '')
	{
		return this.getItems().find(element => element.params?.order === order);
	}

	#getSelectedParam(name: string): ?string
	{
		const selected = this.getItems().find(
			element => element.params?.[name] && this.isSelected(element)
		);

		return selected?.params?.[name] ?? null;
	}

	#select(name: string, value: ?string)
	{
		// an empty value matches every item without the param, so there is nothing to highlight
		if (!value)
		{
			return;
		}

		const item = this.getItems().find(element => element.params?.[name] === value);
		if (item)
		{
			this.select(item);
		}
	}

	// the direction has nothing to apply to until an axis is chosen: a dead grey line reads as a defect,
	// so the direction leaves the menu the same way it does in the task list
	#syncDirectionVisibility()
	{
		const hasSelectedField = Boolean(this.getSelectedField());

		this.#getDirectionItems().forEach((item) => {
			const node = item?.layout?.item;
			if (!node)
			{
				return;
			}

			if (hasSelectedField)
			{
				Dom.removeClass(node, KanbanMenu.HIDDEN);
			}
			else
			{
				Dom.addClass(node, KanbanMenu.HIDDEN);
			}
		});
	}

	// the line above the direction opens its block and leaves the menu together with it
	#getDirectionItems(): MenuItem[]
	{
		return this.getItems().filter(
			(item) => Boolean(item.params?.direction) || item.getId() === KanbanMenu.DIRECTION_DELIMITER_ID,
		);
	}

	// the php menu keeps the sub items of the custom sort in its params list itself,
	// the menu built by the extension — under the items key
	static #getOwnedItems(item: ?MenuItem): Object[]
	{
		const params = item?.params;
		if (!KanbanMenu.#ownsSubItems(params))
		{
			return [];
		}

		return Array.isArray(params) ? params : params.items;
	}

	static #ownsSubItems(params: ?Object): boolean
	{
		return Array.isArray(params) || Array.isArray(params?.items);
	}

	static #getChoiceRole(item: MenuItem): ?string
	{
		const params = item?.params;
		// the sub items place new tasks inside the custom sort, they do not order the board
		const isSubItem = params?.type === 'sub';

		// the custom sort item is the only one that carries sub items of its own
		const isOrderItem = KanbanMenu.#ownsSubItems(params)
			|| Boolean(params?.field)
			|| (Boolean(params?.order) && !isSubItem)
		;

		if (isOrderItem)
		{
			return KanbanMenu.ORDER_ROLE;
		}

		return Boolean(params?.direction) || Boolean(params?.order)
			? KanbanMenu.MODIFIER_ROLE
			: null
		;
	}
}

