import { Dom, Event, Type } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';
import { type Menu, type MenuItemOptions, MenuManager } from 'main.popup';

import { GridEvent, MoveActionIdPrefix, RowActionsMenuIdPrefix } from '../../const';
import { type FolderMenuItem, type RowAction } from '../../model/grid/types';

/**
 * An item of the menu of a row. `dataset` is widened on purpose: the screen reads `hasChild` and
 * `isDisabled` of a folder out of the options of the item rather than out of the node
 * (`list.es6.js:601`), and a boolean turned into a string would send every folder asking the server
 * for children it has not got.
 */
export type RowMenuItem = Omit<MenuItemOptions, 'dataset' | 'items'> & {
	dataset?: Record<string, unknown>,
	items?: RowMenuItem[],
	/** Which row a submenu of this item belongs to; the screen puts it into the popup. */
	gridRowId?: string,
};

export type RowActionsMenuOptions = {
	/** Which of the two lists of the screen the row belongs to; its menus are kept apart by it. */
	gridId: string,
	rowId: string,
	actions: RowAction[],
	/** The tree the submenu "move to folder" is filled with; empty where the action has no place. */
	folders: FolderMenuItem[],
	bindElement: HTMLElement,
};

type EventGrid = {
	getId(): string,
};

/** How far above the button the menu stands, taken from the grid of the platform (`row.js:1012`). */
const MenuOffsetTop = 26;
const MenuOffsetLeft = 30;
const MenuAngleOffset = 8;

const MenuItemSelector = '.menu-popup-item';

/**
 * Menus built so far, by the grid they belong to and by the row each was built for. A set per grid:
 * the list of messages drawing its rows again has no business taking down a menu opened in the list
 * of drafts, and the identifier of the row would not tell one list from the other.
 */
const builtMenuIds = new Map<string, Set<string>>();

/**
 * One listener for the page rather than one per grid: the word names the grid whose menus go, and a
 * listener per grid would have to be taken off when its grid goes.
 */
let listeningToRowsChange = false;

function menuId(rowId: string): string
{
	return `${RowActionsMenuIdPrefix}${rowId}`;
}

function rememberMenu(gridId: string, id: string): void
{
	const built = builtMenuIds.get(gridId) ?? new Set<string>();

	built.add(id);
	builtMenuIds.set(gridId, built);
}

function destroyMenusOf(gridId: string): void
{
	builtMenuIds.get(gridId)?.forEach((id: string): void => MenuManager.destroy(id));
	builtMenuIds.delete(gridId);
}

function destroyEveryMenu(): void
{
	builtMenuIds.forEach((built: Set<string>): void => {
		built.forEach((id: string): void => MenuManager.destroy(id));
	});
	builtMenuIds.clear();
}

/**
 * The menu of a row goes away when the rows change: the row it was built for may be gone, and the
 * grid of the platform took its menus down on the same word (`row.js:1027`). Choosing a folder says
 * that word itself to close the menu (`list.es6.js:1637`).
 *
 * A word that carries no grid is a request to close whatever stands open, so it takes down every
 * menu - the way the row of the platform answered any word about any grid.
 */
function listenToRowsChange(): void
{
	if (listeningToRowsChange)
	{
		return;
	}

	listeningToRowsChange = true;
	EventEmitter.subscribe(GridEvent.Updated, (event: BaseEvent): void => {
		const [grid] = (event.getCompatData() ?? []) as [EventGrid?];

		if (grid && Type.isFunction(grid.getId))
		{
			destroyMenusOf(grid.getId());

			return;
		}

		destroyEveryMenu();
	});
}

function isMoveAction(action: RowAction): boolean
{
	return action.id.startsWith(MoveActionIdPrefix);
}

/**
 * The action of moving arrives with an empty submenu on every page of the transport: one tree of
 * folders serves every row of a mailbox, and it comes with the screen.
 */
function resolveSubItems(action: RowAction, folders: FolderMenuItem[]): RowMenuItem[] | undefined
{
	if (isMoveAction(action))
	{
		return folders;
	}

	return action.items?.map((item: RowAction): RowMenuItem => toMenuItem(item, folders));
}

/**
 * The descriptions of a row with the tree of folders hung on the action of moving. The panel of mass
 * actions of one marked row is built of these same descriptions, and the platform reads the submenu
 * of a button as it opens it (`ui/actionpanel/src/item.js:576`): an item with neither submenu nor
 * call of its own does nothing at all (`:479`).
 */
export function withFolderSubmenus(actions: RowAction[], folders: FolderMenuItem[]): RowAction[]
{
	return actions.map((action: RowAction): RowAction => (
		isMoveAction(action) ? { ...action, items: folders } : action
	));
}

/**
 * One description of the server as one item of the menu; the keys that describe the same action for
 * the panel of mass actions are of no use here.
 *
 * The label of a few items comes as markup and is given as markup: those are built by the server
 * with their escaping and carry the marks the screen finds an exclusive pair by
 * (`user-interface-manager.js:255`).
 */
export function toMenuItem(action: RowAction, folders: FolderMenuItem[]): RowMenuItem
{
	return {
		id: action.id,
		html: action.html,
		text: action.text,
		title: action.title,
		className: action.className,
		href: action.href,
		disabled: action.disabled,
		dataset: action.dataset,
		onclick: action.onclick,
		gridRowId: action.gridRowId,
		items: resolveSubItems(action, folders),
	};
}

/**
 * A click inside the menu closes it, unless the item asked to be left alone - that is what keeps the
 * submenu of the labels open while the reader ticks several of them (`row.js:1034`).
 */
function closeOnItemClick(menu: Menu): void
{
	Event.bind(menu.getMenuContainer(), 'click', (event: MouseEvent): void => {
		const item = (event.target as HTMLElement).closest(MenuItemSelector) as HTMLElement | null;

		if (!item || !item.dataset.preventCloseContextMenu)
		{
			menu.close();
		}
	});
}

/**
 * The state is written by the menu rather than by the button: the menu also goes away by itself, and
 * a button that only knew about the press would keep saying "open" over nothing.
 */
function setExpanded(bindElement: HTMLElement, expanded: boolean): void
{
	Dom.attr(bindElement, 'aria-expanded', expanded ? 'true' : 'false');
}

function createMenu(options: RowActionsMenuOptions): Menu
{
	const { height } = options.bindElement.getBoundingClientRect();
	const items = options.actions.map(
		(action: RowAction): RowMenuItem => toMenuItem(action, options.folders),
	);

	const menu = MenuManager.create(
		menuId(options.rowId),
		options.bindElement,
		items as MenuItemOptions[],
		{
			autoHide: true,
			offsetTop: -((height / 2) + MenuOffsetTop),
			offsetLeft: MenuOffsetLeft,
			angle: {
				position: 'left',
				offset: (height / 2) - MenuAngleOffset,
			},
			events: {
				onShow: (): void => setExpanded(options.bindElement, true),
				onClose: (): void => setExpanded(options.bindElement, false),
				onDestroy: (): void => setExpanded(options.bindElement, false),
			},
		},
	);

	rememberMenu(options.gridId, menuId(options.rowId));
	closeOnItemClick(menu);
	listenToRowsChange();

	return menu;
}

/**
 * The items of a menu are read once, as it is built, so a grid whose rows now offer something else
 * has to let the menus built out of the previous answer go (`grid-facade.ts:setMigrationLocked`).
 */
export function dropRowActionsMenus(gridId: string): void
{
	destroyMenusOf(gridId);
}

/** The menu of a row, once it has been built; the screen asks the row for it while it is shown. */
export function getRowActionsMenu(rowId: string): Menu | null
{
	return MenuManager.getMenuById(menuId(rowId));
}

/**
 * Built once and kept until the rows change, the way the grid of the platform kept it
 * (`grid.js:1605`).
 */
export function toggleRowActionsMenu(options: RowActionsMenuOptions): void
{
	const menu = getRowActionsMenu(options.rowId) ?? createMenu(options);

	if (menu.isShown())
	{
		menu.close();

		return;
	}

	menu.show();
}
