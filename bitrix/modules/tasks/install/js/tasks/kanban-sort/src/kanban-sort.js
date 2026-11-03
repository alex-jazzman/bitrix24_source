import { Loc, Text } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { MenuItem } from 'main.popup';
import { MessageBox } from 'ui.dialogs.messagebox';
import { KanbanMenu } from './kanban-menu';
import { KanbanRequestSender } from './kanban-request/kanban-request-sender';
import { OrderType } from './order-type/order-type';

const SETTINGS_MENU_ID = 'popupMenuOptions';

export class KanbanSort
{
	#kanbanMenu: KanbanMenu;
	#requestSender: KanbanRequestSender;
	static #menuObserved: boolean = false;

	constructor()
	{
		this.#bindMethods();
	}

	static getInstance()
	{
		return new this();
	}

	enableCustomSort(event: PointerEvent, item: MenuItem)
	{
		this.#requestSender = new KanbanRequestSender();
		this.#kanbanMenu = new KanbanMenu(item);
		if (this.#kanbanMenu.isCustomSortEnabled())
		{
			return;
		}

		this.#kanbanMenu.addItemsFromItemParams(this.selectCustomOrder.bind(this));

		this.#kanbanMenu.deselectAll();
		this.#kanbanMenu.select(item);
		const selectedItem = this.#kanbanMenu.find(OrderType.DESC);
		this.#kanbanMenu.select(selectedItem);
		this.#setOrder(selectedItem);
	}

	disableCustomSort(event: PointerEvent, item: MenuItem)
	{
		this.#requestSender = new KanbanRequestSender();
		this.#kanbanMenu = new KanbanMenu(item);
		// any other mode is left through this item, so the current selection is the only stop condition
		if (this.#kanbanMenu.isSelected(item))
		{
			return;
		}

		this.#kanbanMenu.removeSubItems();
		this.#kanbanMenu.deselectAll();
		this.#kanbanMenu.select(item);
		this.#setOrder(item);
	}

	selectCustomOrder(event: PointerEvent, item: MenuItem)
	{
		this.#requestSender = new KanbanRequestSender();
		this.#kanbanMenu = new KanbanMenu(item);
		if (!this.#kanbanMenu.isCustomSortEnabled())
		{
			return;
		}

		this.#kanbanMenu.deselectSubItems();
		this.#kanbanMenu.select(item);
		this.#setOrder(item);
	}

	selectSortField(event: PointerEvent, item: MenuItem)
	{
		const field = item?.params?.field;
		if (!field)
		{
			return;
		}

		this.#kanbanMenu = new KanbanMenu(item);

		const direction = this.#kanbanMenu.getSelectedDirection();
		// the same axis with the same direction is already applied, a board reload would change nothing
		if (direction && this.#kanbanMenu.isSelected(item))
		{
			return;
		}

		// outside the field sort mode the menu has no direction chosen, so the saved one is the default
		this.#setFieldOrder(field, direction ?? item.params.defaultDirection ?? OrderType.ASC);
	}

	selectSortDirection(event: PointerEvent, item: MenuItem)
	{
		const direction = item?.params?.direction;
		if (!direction)
		{
			return;
		}

		this.#kanbanMenu = new KanbanMenu(item);

		const field = this.#kanbanMenu.getSelectedField();
		// the direction belongs to a chosen axis, and the applied one needs no board reload
		if (!field || this.#kanbanMenu.isSelected(item))
		{
			return;
		}

		this.#setFieldOrder(field, direction);
	}

	// the menu is built by the settings component, so its own opening is the only point
	// where the initial state of the axes and the direction can be announced
	static observeSettingsMenu()
	{
		if (KanbanSort.#menuObserved)
		{
			return;
		}

		KanbanSort.#menuObserved = true;
		EventEmitter.subscribe('BX.Main.Menu:onShow', (event) => {
			const menu = event.getTarget();
			if (menu?.getId() !== SETTINGS_MENU_ID)
			{
				return;
			}

			new KanbanMenu(null, menu).syncAriaState();
		});
	}

	#bindMethods()
	{
		this.enableCustomSort = this.enableCustomSort.bind(this);
		this.disableCustomSort = this.disableCustomSort.bind(this);
		this.selectCustomOrder = this.selectCustomOrder.bind(this);
		this.selectSortField = this.selectSortField.bind(this);
		this.selectSortDirection = this.selectSortDirection.bind(this);
	}

	#setOrder(item: MenuItem)
	{
		const order = item?.params?.order || '';
		this.#requestSender.setOrder(order).catch(KanbanSort.#showRequestError);
	}

	#setFieldOrder(field: string, direction: string)
	{
		this.#requestSender = new KanbanRequestSender();
		this.#requestSender
			.setFieldOrder(field, direction)
			.then((state) => {
				// the menu follows the saved state: an order the backend refused, as well as one the sender
				// dropped as outdated, must not stay highlighted
				if (state?.newTaskOrder === OrderType.FIELD)
				{
					this.#kanbanMenu.applyFieldSort(state.sortField, state.sortDirection);
				}
			})
			.catch(KanbanSort.#showRequestError)
		;
	}

	// the menu is already switched to the order the request was about to save, so a refused save
	// leaves it out of sync with the server until the page is reloaded
	static #showRequestError(response: Object)
	{
		const message = response?.errors?.[0]?.message;

		MessageBox.alert(
			// the dialog puts its message into the DOM as html, and the server text is out of our control
			message ? Text.encode(message) : Loc.getMessage('TASKS_KANBAN_SORT_ERROR_SAVE_FAILED'),
			Loc.getMessage('TASKS_KANBAN_SORT_ERROR_TITLE'),
			() => window.location.reload(),
			Loc.getMessage('TASKS_KANBAN_SORT_ERROR_RELOAD'),
		);
	}
}