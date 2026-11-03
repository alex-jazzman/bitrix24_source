import { Loc, Tag, Text } from 'main.core';
import { KanbanMenu } from '../kanban-menu';
import { KanbanSort } from '../kanban-sort';
import { OrderType } from '../order-type/order-type';

export type SortField = {
	id: string,
	title: string,
};

export type SortMenuOptions = {
	order: string,
	field: ?string,
	direction: ?string,
	savedDirection: ?string,
	fields: SortField[],
};

const ROOT_ITEM_ID = 'tasksKanbanSortMenu';
const ITEM_ID_PREFIX = 'tasksKanbanSort';

export class KanbanSortMenu
{
	#options: SortMenuOptions;
	#sort: KanbanSort;

	constructor(options: SortMenuOptions)
	{
		this.#options = KanbanSortMenu.#withActivityAxis(options ?? {});
		this.#sort = KanbanSort.getInstance();
	}

	// a board nobody has sorted yet is ordered by the activity axis descending, and the menu says so
	// instead of leaving the choice unmarked
	static #withActivityAxis(options: SortMenuOptions): SortMenuOptions
	{
		if (options.order !== OrderType.ACTUAL)
		{
			return options;
		}

		return {
			...options,
			field: OrderType.ACTIVITY_FIELD,
			direction: OrderType.DESC,
		};
	}

	// the board offers ten axes on top of the modes, and the root of the settings menu has no room
	// for all of them: the sort lives in a sub menu of its own, as it already does in the task list
	get menuItem(): Object
	{
		return {
			id: ROOT_ITEM_ID,
			text: Loc.getMessage('TASKS_KANBAN_SORT_MENU_TITLE'),
			className: 'menu-popup-item-none',
			dataset: { testid: 'tasks-kanban-sort-menu' },
			// the chosen order is kept by the menu itself, so the sub menu has to outlive its closing
			cacheable: true,
			events: {
				onSubMenuShow: this.#handleSubMenuShow,
			},
			items: this.#getItems(),
		};
	}

	#getItems(): Object[]
	{
		const items = [
			this.#getCustomSortItem(),
			{ delimiter: true },
			this.#getActivitySortItem(),
			{ delimiter: true },
			...this.#getFieldItems(),
			{ id: KanbanMenu.DIRECTION_DELIMITER_ID, delimiter: true },
			this.#getDirectionItem(OrderType.ASC),
			this.#getDirectionItem(OrderType.DESC),
		];

		if (this.#isCustomSort())
		{
			items.push(...this.#getNewTaskItems());
		}

		return items;
	}

	#getCustomSortItem(): Object
	{
		return {
			id: `${ITEM_ID_PREFIX}OrderCustom`,
			dataset: { testid: 'tasks-kanban-sort-order-custom' },
			text: Loc.getMessage('TASKS_KANBAN_SORT_MENU_MY_SORT'),
			className: KanbanSortMenu.#getClassName(this.#isCustomSort()),
			// the "new tasks" block belongs to the custom sort and joins the menu together with it
			params: { items: this.#getNewTaskItems() },
			onclick: this.#sort.enableCustomSort,
		};
	}

	// the activity is an axis like the rest, it only keeps the item of its own above them — as in the task list
	#getActivitySortItem(): Object
	{
		return {
			id: `${ITEM_ID_PREFIX}OrderActual`,
			dataset: { testid: 'tasks-kanban-sort-order-actual' },
			html: KanbanSortMenu.#renderRecommended(Loc.getMessage('TASKS_KANBAN_SORT_MENU_ACTIVITY')),
			className: KanbanSortMenu.#getClassName(this.#options.field === OrderType.ACTIVITY_FIELD),
			params: this.#getFieldParams(OrderType.ACTIVITY_FIELD),
			onclick: this.#sort.selectSortField,
		};
	}

	#getFieldItems(): Object[]
	{
		return (this.#options.fields ?? []).map((field: SortField) => ({
			id: `${ITEM_ID_PREFIX}Field${field.id}`,
			dataset: { testid: `tasks-kanban-sort-field-${KanbanSortMenu.#toTestId(field.id)}` },
			text: field.title,
			className: KanbanSortMenu.#getClassName(this.#options.field === field.id),
			params: this.#getFieldParams(field.id),
			onclick: this.#sort.selectSortField,
		}));
	}

	// outside the field sort mode the menu has no direction chosen, so the saved one travels with the axis;
	// the activity axis falls back to the descending order — the freshest tasks on top, as the board opens
	#getFieldParams(fieldId: string): Object
	{
		const defaultDirection = this.#options.savedDirection
			?? (fieldId === OrderType.ACTIVITY_FIELD ? OrderType.DESC : null);

		return defaultDirection
			? { field: fieldId, defaultDirection }
			: { field: fieldId }
		;
	}

	#getDirectionItem(direction: string): Object
	{
		const phraseId = direction === OrderType.ASC
			? 'TASKS_KANBAN_SORT_MENU_DIRECTION_ASC'
			: 'TASKS_KANBAN_SORT_MENU_DIRECTION_DESC'
		;

		return {
			id: `${ITEM_ID_PREFIX}Direction${direction}`,
			dataset: { testid: `tasks-kanban-sort-direction-${direction}` },
			text: Loc.getMessage(phraseId),
			className: KanbanSortMenu.#getClassName(this.#options.direction === direction),
			params: { direction },
			onclick: this.#sort.selectSortDirection,
		};
	}

	#getNewTaskItems(): Object[]
	{
		return [
			{
				id: `${ITEM_ID_PREFIX}NewTasksDelimiter`,
				delimiter: true,
				params: { type: 'sub' },
			},
			{
				id: `${ITEM_ID_PREFIX}NewTasksTitle`,
				html: KanbanSortMenu.#renderTitle(Loc.getMessage('TASKS_KANBAN_SORT_MENU_NEW_TASKS')),
				params: { type: 'sub' },
			},
			this.#getNewTaskItem(OrderType.DESC),
			this.#getNewTaskItem(OrderType.ASC),
		];
	}

	// the new task goes to the top of the column in the descending order and to the bottom in the ascending one
	#getNewTaskItem(order: string): Object
	{
		const phraseId = order === OrderType.DESC
			? 'TASKS_KANBAN_SORT_MENU_NEW_TASKS_TOP'
			: 'TASKS_KANBAN_SORT_MENU_NEW_TASKS_BOTTOM'
		;

		return {
			id: `${ITEM_ID_PREFIX}Order${order}`,
			dataset: { testid: `tasks-kanban-sort-order-${order}` },
			text: Loc.getMessage(phraseId),
			className: KanbanSortMenu.#getClassName(this.#options.order === order),
			params: { type: 'sub', order },
			onclick: this.#sort.selectCustomOrder,
		};
	}

	#isCustomSort(): boolean
	{
		return this.#options.order === OrderType.ASC || this.#options.order === OrderType.DESC;
	}

	#handleSubMenuShow = (event: Object) => {
		const subMenu = event.getTarget()?.getSubMenu();
		if (subMenu)
		{
			new KanbanMenu(null, subMenu).syncAriaState();
		}
	};

	static #getClassName(selected: boolean): string
	{
		return selected ? KanbanMenu.SELECTED : KanbanMenu.DESELECTED;
	}

	static #renderTitle(text: string): HTMLElement
	{
		return Tag.render`<b>${Text.encode(text)}</b>`;
	}

	static #renderRecommended(text: string): HTMLElement
	{
		const label = Text.encode(Loc.getMessage('TASKS_KANBAN_SORT_MENU_ACTIVITY_LABEL'));
		const labelNode = Tag.render`<span class="menu-popup-item-sort-field-label">${label}</span>`;

		return Tag.render`<span>${Text.encode(text)}${labelNode}</span>`;
	}

	static #toTestId(field: string): string
	{
		return field.toLowerCase().replaceAll('_', '-');
	}
}
