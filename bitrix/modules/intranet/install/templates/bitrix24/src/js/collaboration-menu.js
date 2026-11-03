import { Event, Loc, Page, Reflection, Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';

export class CollaborationMenu
{
	#messageCounter: number | null = null;
	#counterMenu: typeof(BX.Main.interfaceButtons) | null = null;
	#entryRequested: boolean = false;

	constructor()
	{
		EventEmitter.subscribe('onImUpdateCounterMessage', this.#handleCounterUpdate.bind(this));
		EventEmitter.subscribe('onCounterDecrement', this.#handleLiveFeedCounterDecrement.bind(this));
		EventEmitter.subscribe('onFrameDataProcessed', this.#restoreCounter.bind(this));
		EventEmitter.subscribe('onFrameDataProcessed', () => queueMicrotask(() => this.#restoreEntry()));
		Event.ready(() => queueMicrotask(() => this.#restoreCounter()));
		Event.ready(() => queueMicrotask(() => this.#restoreEntry()));
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
			const menuId = this.#getConfiguredMenuId() || 'top_menu_id_collaboration';

			return menuManager.getById(menuId) || null;
		}

		return null;
	}

	openFirstItem(menuId: string, entryUrl: string): boolean
	{
		if (!Type.isStringFilled(menuId) || !Type.isStringFilled(entryUrl))
		{
			return false;
		}

		const menuManager = Reflection.getClass('BX.Main.interfaceButtonsManager');
		const menu = menuManager?.getById(menuId);
		if (!menu)
		{
			if (this.#entryRequested)
			{
				return false;
			}

			this.#saveEntry(menuId, entryUrl);
			this.#entryRequested = true;
			Page.redirect(entryUrl);

			return true;
		}

		this.#saveEntry(menuId, null);
		this.#entryRequested = false;
		const firstItem = menu.getVisibleItems()[0];
		if (Type.isDomNode(firstItem))
		{
			const itemData = menu.getItemData(firstItem);
			const link = itemData?.NODE?.querySelector('.main-buttons-item-link');
			link?.click();
		}

		return true;
	}

	#getEntryStorageKey(menuId: string): string
	{
		return `intranet.collaboration-menu.entry.${menuId}`;
	}

	#saveEntry(menuId: string, entryUrl: string | null): boolean
	{
		try
		{
			const storageKey = this.#getEntryStorageKey(menuId);
			if (Type.isStringFilled(entryUrl))
			{
				sessionStorage.setItem(storageKey, entryUrl);
			}
			else
			{
				sessionStorage.removeItem(storageKey);
			}

			return true;
		}
		catch
		{
			return false;
		}
	}

	#getEntryUrl(menuId: string): string | null
	{
		try
		{
			return sessionStorage.getItem(this.#getEntryStorageKey(menuId));
		}
		catch
		{
			return null;
		}
	}

	#restoreEntry(): void
	{
		const menuId = this.#getConfiguredMenuId();
		if (!Type.isStringFilled(menuId))
		{
			return;
		}

		const entryUrl = this.#getEntryUrl(menuId);
		if (Type.isStringFilled(entryUrl)
			&& new URL(entryUrl, window.location.origin).pathname === window.location.pathname
			&& this.getMenu()
			&& this.#saveEntry(menuId, null))
		{
			this.openFirstItem(menuId, entryUrl);
		}
	}

	#getConfiguredMenuId(): string | null
	{
		return Loc.hasMessage('INTRANET_COLLABORATION_MENU_ID')
			? Loc.getMessage('INTRANET_COLLABORATION_MENU_ID')
			: null;
	}

	#restoreCounter(): void
	{
		if (Type.isStringFilled(this.#getConfiguredMenuId())
			&& Type.isNumber(this.#messageCounter))
		{
			const menu = this.getMenu();
			if (menu && menu !== this.#counterMenu)
			{
				menu.updateCounter('im-message', this.#messageCounter);
				this.#counterMenu = menu;
			}
		}
	}

	#handleCounterUpdate(event: BaseEvent): void
	{
		const menu = this.getMenu();
		const [counter] = event.getCompatData();
		this.#messageCounter = counter;
		this.#counterMenu = menu;
		menu?.updateCounter('im-message', counter);
	}

	#handleLiveFeedCounterDecrement(event: BaseEvent): void
	{
		const [decrement] = event.getCompatData();
		const menu = this.getMenu();
		if (menu)
		{
			const item = menu.getItemById('menu_live_feed');
			if (item)
			{
				const itemData = menu.getItemData(item);
				const { COUNTER, COUNTER_ID } = itemData;

				menu?.updateCounter(COUNTER_ID, Math.max(0, COUNTER - decrement));
			}
		}
	}
}
