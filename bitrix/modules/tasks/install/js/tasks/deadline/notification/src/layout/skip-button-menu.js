import { Loc, Dom } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { MenuItem } from 'main.popup';
import { Button } from 'ui.buttons';

type SkipButtonMenuOptions = {
	events: {
		[eventName: string]: (event: BaseEvent) => void,
	},
}

export class SkipButtonMenu extends EventEmitter
{
	#EVENT_NAMESPACE: string = 'BX.Tasks.Deadline.Notification.Layout.SkipButtonMenu';
	#ACCEPTED_ITEM_CLASS: string = 'menu-popup-item-accept';
	#ITEMS_CLASSES: string = 'menu-popup-icon menu-popup-item-none';

	#button: Button;
	#items: Array;
	#period: string;

	constructor(options: SkipButtonMenuOptions = {})
	{
		super();

		this.setEventNamespace(this.#EVENT_NAMESPACE);
		this.subscribeFromOptions(options.events);

		this.#init();
	}

	getMenu(): Object
	{
		return {
			closeByEsc: true,
			items: this.#items,
			minWidth: 180,
		};
	}

	getPeriod(): string
	{
		return this.#period;
	}

	setButton(button: Button): void
	{
		this.#button = button;
	}

	#onMenuItemClick(period: string, text: string): void
	{
		const buttonMenu = this.#button?.getMenuWindow();
		if (!buttonMenu)
		{
			return;
		}

		if (this.#period === period)
		{
			this.#period = '';
			this.#refreshMenuItemsIcons(buttonMenu.getMenuItems(), this.#period);

			const event = new BaseEvent({
				data: { buttonMenu },
			});
			this.emit('onMenuItemDeselect', event);

			return;
		}

		this.#period = period;
		this.#refreshMenuItemsIcons(buttonMenu.getMenuItems(), this.#period);

		const event = new BaseEvent({
			data: { buttonMenu, text },
		});
		this.emit('onMenuItemSelect', event);
	}

	#refreshMenuItemsIcons(items: MenuItem[], period: string): void
	{
		items.forEach((item: MenuItem): void => {
			const node = item.getLayout().item;
			if (!node)
			{
				return;
			}

			if (item.getId() === period)
			{
				Dom.addClass(node, this.#ACCEPTED_ITEM_CLASS);

				return;
			}

			Dom.removeClass(node, this.#ACCEPTED_ITEM_CLASS);
		});
	}

	#init(): void
	{
		this.#items = [
			{
				dataset: { id: 'tasks-deadline-notification-skip-day' },
				id: 'day',
				text: Loc.getMessage('TASKS_DEADLINE_NOTIFICATION_DAY'),
				className: this.#ITEMS_CLASSES,
			},
			{
				dataset: { id: 'tasks-deadline-notification-skip-week' },
				id: 'week',
				text: Loc.getMessage('TASKS_DEADLINE_NOTIFICATION_WEEK'),
				className: this.#ITEMS_CLASSES,
			},
			{
				dataset: { id: 'tasks-deadline-notification-skip-month' },
				id: 'month',
				text: Loc.getMessage('TASKS_DEADLINE_NOTIFICATION_MONTH'),
				className: this.#ITEMS_CLASSES,
			},
			{
				dataset: { id: 'tasks-deadline-notification-skip-forever' },
				id: 'forever',
				text: Loc.getMessage('TASKS_DEADLINE_NOTIFICATION_FOREVER'),
				className: this.#ITEMS_CLASSES,
			},
		];

		this.#items.forEach((item: Object): void => {
			item.onclick = this.#onMenuItemClick.bind(this, item.id, item.text);
		});
	}
}
