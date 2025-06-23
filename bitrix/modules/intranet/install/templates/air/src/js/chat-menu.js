import { Reflection } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';

export class ChatMenu
{
	constructor()
	{
		EventEmitter.subscribe('IM.Layout:onLayoutChange', this.#handleImLayoutChange.bind(this));
		EventEmitter.subscribe('IM.Counters:onUpdate', this.#handleCounterUpdate.bind(this));
		EventEmitter.subscribe('BX.Intranet.Bitrix24.ChatMenu:onSelect', this.#handleChatMenuSelect.bind(this));
	}

	getMenu(): typeof(BX.Main.interfaceButtons) | null
	{
		/**
		 *
		 * @type {BX.Main.interfaceButtonsManager}
		 */
		const menuManager = Reflection.getClass('BX.Main.interfaceButtonsManager');
		if (menuManager)
		{
			return menuManager.getById('chat-menu');
		}

		return null;
	}

	#handleChatMenuSelect(event: BaseEvent): void
	{
		const data = event.getData();
		const { id, entityId } = data;
		let target = data.event?.target;
		if (target)
		{
			target = target.closest('.main-buttons-item-link, .menu-popup-item');
		}

		const Public = Reflection.getClass('BX.Messenger.Public');
		Public?.openNavigationItem({ id, entityId, target });
	}

	#handleImLayoutChange(event: BaseEvent): void
	{
		const data = event.getData();
		const menu = this.getMenu();

		menu?.unsetActive(data.from.name.toLowerCase());
		menu?.setActive(data.to.name.toLowerCase());
		menu?.closeMoreMenu();
	}

	#handleCounterUpdate(event: BaseEvent): void
	{
		const counters: Object<string, number> = event.getData();
		const menu = this.getMenu();
		for (const [counterId, counterValue] of Object.entries(counters))
		{
			menu?.updateCounter(counterId, counterValue);
		}
	}
}
