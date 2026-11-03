import { Event, Loc, Reflection, Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';

export class ChatMenu
{
	#counters: Record<string, number> = {};
	#counterMenu: typeof(BX.Main.interfaceButtons) | null = null;

	constructor()
	{
		EventEmitter.subscribe('IM.Layout:onLayoutChange', this.#handleImLayoutChange.bind(this));
		EventEmitter.subscribe('IM.Counters:onUpdate', this.#handleCounterUpdate.bind(this));
		EventEmitter.subscribe('BX.Intranet.Bitrix24.ChatMenu:onSelect', this.#handleChatMenuSelect.bind(this));
		EventEmitter.subscribe('onFrameDataProcessed', this.#restoreCounters.bind(this));
		Event.ready(() => queueMicrotask(() => this.#restoreCounters()));
	}

	getChatMenu(): typeof(BX.Main.interfaceButtons) | null
	{
		/**
		 *
		 * @type {BX.Main.interfaceButtonsManager}
		 */
		const menuManager = Reflection.getClass('BX.Main.interfaceButtonsManager');
		if (menuManager)
		{
			return menuManager.getById('chat-menu') || null;
		}

		return null;
	}

	getCollaborationMenu(): typeof(BX.Main.interfaceButtons) | null
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
		if (id === 'call' && Type.isFunction(Public?.openPhoneKeyPad))
		{
			void Public.openPhoneKeyPad({ bindElement: this.#resolveTelephonyAnchor(target) });

			return;
		}

		Public?.openNavigationItem?.({ id, entityId, target });
	}

	/**
	 * A submenu popup closes right after the click, and the keypad opens only after the phone
	 * lines are loaded, so it is anchored at the visible Sync item of the collaboration menu,
	 * or at the "More" button when Sync is folded into it.
	 */
	#resolveTelephonyAnchor(target: HTMLElement | null): HTMLElement | null
	{
		if (target?.matches('.menu-popup-item'))
		{
			const menu = this.getCollaborationMenu();
			const syncItem = menu?.getItemById?.('menu_sync');
			if (this.#isMenuItemVisible(menu, syncItem))
			{
				return syncItem;
			}

			const moreButton = Type.isDomNode(syncItem) ? menu.getMoreButton?.() : null;
			if (Type.isDomNode(moreButton))
			{
				return moreButton;
			}
		}

		return target;
	}

	#isMenuItemVisible(menu: typeof(BX.Main.interfaceButtons), item: ?HTMLElement): boolean
	{
		if (!Type.isDomNode(item))
		{
			return false;
		}

		if (Type.isFunction(menu.isVisibleItem))
		{
			return menu.isVisibleItem(item);
		}

		return item.getClientRects().length > 0;
	}

	/**
	 * This template is loaded on every portal page, the messenger is not, so its facade
	 * is resolved through the class registry. The im and intranet modules are updated
	 * separately, so a portal may run an im without this method; a messenger that is not
	 * initialized yet answers with an empty string. Both cases fall back to the layout name.
	 */
	#resolveNavigationItemId(layoutName: string): string
	{
		const Public = Reflection.getClass('BX.Messenger.Public');
		if (!Public?.getNavigationItemId)
		{
			return layoutName;
		}

		return Public.getNavigationItemId(layoutName) || layoutName;
	}

	#getNavigationItemId(layout: { name: string, entityId: string | number }): string
	{
		const itemId = this.#resolveNavigationItemId(layout.name).toLowerCase();
		if (itemId === 'market' && layout.entityId)
		{
			return `${itemId}_${layout.entityId}`;
		}

		return itemId;
	}

	#handleImLayoutChange(event: BaseEvent): void
	{
		const data = event.getData();

		const fromItemId = this.#getNavigationItemId(data.from);
		const toItemId = this.#getNavigationItemId(data.to);

		const chatMenu = this.getChatMenu();
		if (chatMenu !== null)
		{
			chatMenu.unsetActive(fromItemId);
			chatMenu.setActive(toItemId);
			chatMenu.reset();
		}

		const collaborationMenu = this.getCollaborationMenu();
		const siteDir = Loc.getMessage('SITE_DIR') || '/';
		const isMessengerEmbedded = window.location.pathname.toString().startsWith(`${siteDir}online/`);
		if (collaborationMenu !== null)
		{
			if (isMessengerEmbedded)
			{
				collaborationMenu.unsetActive(this.#getCollaborationItemId(collaborationMenu, fromItemId));
				collaborationMenu.setActive(this.#getCollaborationItemId(collaborationMenu, toItemId));
			}

			collaborationMenu.reset();
		}
	}

	#getCollaborationItemId(menu: typeof(BX.Main.interfaceButtons), itemId: string): string
	{
		if (!Type.isStringFilled(this.#getConfiguredMenuId()))
		{
			return itemId;
		}

		const menuItemId = { messenger: 'menu_im_messenger', notification: 'menu_notifications' }[itemId];

		return menuItemId && menu.getItemById(menuItemId) ? menuItemId : itemId;
	}

	#getConfiguredMenuId(): string | null
	{
		return Loc.hasMessage('INTRANET_COLLABORATION_MENU_ID')
			? Loc.getMessage('INTRANET_COLLABORATION_MENU_ID')
			: null;
	}

	#restoreCounters(): void
	{
		if (Type.isStringFilled(this.#getConfiguredMenuId()))
		{
			const menu = this.getCollaborationMenu();
			if (menu && menu !== this.#counterMenu)
			{
				this.#updateCounters(menu, this.#counters);
				this.#counterMenu = menu;
			}
		}
	}

	#updateCounters(menu: typeof(BX.Main.interfaceButtons) | null, counters: Record<string, number>): void
	{
		if (menu)
		{
			for (const [counterId, counterValue] of Object.entries(counters))
			{
				menu.updateCounter(counterId, counterValue);
			}
		}
	}

	#handleCounterUpdate(event: BaseEvent): void
	{
		const counters: Record<string, number> = event.getData();
		this.#counters = { ...this.#counters, ...counters };
		this.#counterMenu = this.getCollaborationMenu();
		const menus = [this.getChatMenu(), this.#counterMenu];
		for (const menu of menus)
		{
			this.#updateCounters(menu, counters);
		}
	}
}
