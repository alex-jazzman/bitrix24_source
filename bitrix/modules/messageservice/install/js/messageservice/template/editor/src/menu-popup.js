import { Loc, Runtime, Text } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Menu, MenuItemOptions, MenuManager } from 'main.popup';

export class MenuPopup extends EventEmitter
{
	#menu: Menu = null;
	#bindElement: HTMLElement = null;
	#isTextItemFirst: boolean = false;
	#messages: { selectField?: string } = {};

	constructor({ bindElement, isTextItemFirst, messages = {}, events = {} })
	{
		super();

		this.setEventNamespace('BX.MessageService.Template.Editor.MenuPopup');

		this.#bindElement = bindElement;
		this.#isTextItemFirst = isTextItemFirst;
		this.#messages = messages;

		this.subscribeFromOptions(events);
	}

	show(): void
	{
		this.#getMenuPopup().show();
	}

	destroy(): void
	{
		this.unsubscribeAll();

		this.#menu?.destroy();
		this.#menu = null;

		Runtime.destroy(this);
	}

	#getMenuPopup(): Menu
	{
		if (this.#menu === null)
		{
			this.#menu = MenuManager.create({
				id: 'messageservice-template-editor-placeholder-selector',
				bindElement: this.#bindElement,
				autoHide: true,
				offsetLeft: 20,
				angle: true,
				closeByEsc: false,
				cacheable: false,
				items: this.#getItems(),
			});
		}

		return this.#menu;
	}

	#getItems(): Object[]
	{
		const editorItem = this.#getEditorItem();
		const textItem = this.#getTextItem();

		if (this.#isTextItemFirst)
		{
			return [
				textItem,
				editorItem,
			];
		}

		return [
			editorItem,
			textItem,
		];
	}

	#getEditorItem(): MenuItemOptions
	{
		const title = this.#messages.selectField
			?? Loc.getMessage('MESSAGESERVICE_TEMPLATE_EDITOR_SELECT_FIELD');

		return {
			html: this.#getItemHtml(title),
			onclick: () => {
				this.emit('onEditorItemClick', { bindElement: this.#bindElement });
			},
		};
	}

	#getTextItem(): MenuItemOptions
	{
		const code = (
			this.#isTextItemFirst
				? 'MESSAGESERVICE_TEMPLATE_EDITOR_UPDATE_TEXT'
				: 'MESSAGESERVICE_TEMPLATE_EDITOR_CREATE_TEXT'
		);

		return {
			html: this.#getItemHtml(Loc.getMessage(code)),
			onclick: () => {
				this.#getMenuPopup().close();
				this.emit('onTextItemClick', { bindElement: this.#bindElement });
			},
		};
	}

	#getItemHtml(title: string): string
	{
		return `<span class="messageservice-template-editor-placeholder-selector-menu-item">${
			Text.encode(title)
		}</span>`;
	}
}
