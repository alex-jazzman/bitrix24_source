import { Loc, Text, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Menu, MenuManager } from 'main.popup';
import { Events } from './components/todo-editor';
import type { ActionMenuItem } from './todo-editor';

const DELIMITER_TYPE = 'delimiter';

export default class ActionsPopup
{
	#menu: Menu = null;
	#items: ActionMenuItem[] = [];
	#bindElement: HTMLElement = null;

	constructor(items: Object[])
	{
		this.#items = items;
	}

	bindElement(bindElement: HTMLElement): ActionsPopup
	{
		this.#bindElement = bindElement;

		return this;
	}

	show(): void
	{
		this.#getMenuPopup().show();
	}

	#getMenuPopup(): Menu
	{
		if (Type.isNil(this.#menu))
		{
			this.#menu = MenuManager.create({
				id: `crm-activity__todo-editor-v2-actions-menu_${Text.getRandom()}`,
				bindElement: this.#bindElement,
				autoHide: true,
				offsetLeft: 50,
				angle: true,
				closeByEsc: false,
				items: this.#getPreparedItems(),
			});
		}

		return this.#menu;
	}

	#getPreparedItems(): Object[]
	{
		const result = [];

		this.#items.forEach((itemData) => {
			if (itemData.hidden)
			{
				return;
			}

			result.push(this.#getActionItem(itemData));
		});

		return result;
	}

	#getActionItem(itemData: Object): Object
	{
		const { svgData, messageCode, id, onClick, type, componentId, componentParams } = itemData;

		if (type === DELIMITER_TYPE)
		{
			return {
				delimiter: true,
			};
		}

		return {
			html: this.#getActionItemHtml(svgData, messageCode),
			onclick: this.onItemClick.bind(this, { id, componentId, componentParams, onClick }),
		};
	}

	onItemClick({ id, componentId, componentParams, onClick }): void
	{
		if (Type.isFunction(onClick))
		{
			onClick();
		}
		else
		{
			this.#onClickActionItem({
				id,
				componentId,
				componentParams,
			});
		}

		this.#menu.close();
	}

	#getActionItemHtml(svgData: string, messageCode: string): string
	{
		return `
			<span class="crm-activity__todo-editor-v2-actions-menu-item">
				<span 
					class="crm-activity__todo-editor-v2-actions-menu-item-icon"
					style="background-image: url('data:image/svg+xml,${encodeURIComponent(svgData)}')"
				></span>
				${Loc.getMessage(messageCode)}
			</span>
		`;
	}

	#onClickActionItem({ id, componentId, componentParams }): void
	{
		const data = {
			id,
			componentId,
			componentParams,
		};

		EventEmitter.emit(this, Events.EVENT_ACTIONS_POPUP_ITEM_CLICK, data);
	}
}
