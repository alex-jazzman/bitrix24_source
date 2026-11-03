import { Event } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { PopupManager, type PopupTarget } from 'main.popup';
import { Menu, type MenuItemOptions, type MenuOptions, type MenuSectionOptions } from 'ui.system.menu';
import { type Store } from 'ui.vue3.vuex';

import { type RestClient } from 'rest.client';

import { Core } from 'im.v2.application.core';

const EVENT_NAMESPACE = 'BX.Messenger.v2.Lib.Menu';

export class BaseMenu extends EventEmitter
{
	static events = {
		close: 'close',
	};

	menuInstance: Menu;
	context: Object;
	target: HTMLElement;
	store: Store;
	restClient: RestClient;
	id: String = 'im-base-context-menu';

	constructor()
	{
		super();
		this.setEventNamespace(EVENT_NAMESPACE);

		this.store = Core.getStore();
		this.restClient = Core.getRestClient();
	}

	// public
	openMenu(context: Object, target: PopupTarget)
	{
		const existingPopupWithId = PopupManager.getPopupById(this.id);
		if (existingPopupWithId)
		{
			existingPopupWithId.close();
		}

		if (this.menuInstance)
		{
			this.close();
		}
		this.context = context;
		this.target = target;
		this.menuInstance = new Menu(this.getMenuOptions());
		this.menuInstance.show(this.target);

		this.#bindBlurEvent();
	}

	// public
	// Keyboard path: anchor the menu to the focused element itself (not cursor coordinates)
	// and return focus to it once the menu closes.
	openMenuFromKeyboard(context: Object, anchor: HTMLElement)
	{
		this.openMenu(context, anchor);
		this.#restoreFocusOnClose(anchor);
	}

	getMenuOptions(): MenuOptions
	{
		return {
			id: this.id,
			bindOptions: { forceBindPosition: true, position: 'bottom' },
			targetContainer: document.body,
			cacheable: false,
			closeByEsc: true,
			className: this.getMenuClassName(),
			items: this.#prepareItems(),
			sections: this.getMenuGroups(),
			events: {
				onClose: () => this.close(),
				onDestroy: () => this.destroy(),
			},
		};
	}

	getMenuItems(): MenuItemOptions[] | null[]
	{
		return [];
	}

	getMenuGroups(): MenuSectionOptions[]
	{
		return [];
	}

	groupItems(menuItems: MenuItemOptions[] | null[], group: string): MenuItemOptions[]
	{
		return menuItems.filter((item) => item !== null).map((item: MenuItemOptions) => {
			return {
				...item,
				sectionCode: group,
			};
		});
	}

	getMenuClassName(): string
	{
		return '';
	}

	close()
	{
		this.emit(BaseMenu.events.close);
		if (!this.menuInstance)
		{
			return;
		}

		this.menuInstance.destroy();
		this.menuInstance = null;
	}

	destroy()
	{
		this.close();
	}

	getCurrentUserId(): number
	{
		return Core.getUserId();
	}

	#prepareItems(): MenuItemOptions[]
	{
		return this.getMenuItems().filter((item) => item !== null);
	}

	#bindBlurEvent(): void
	{
		Event.bindOnce(window, 'blur', () => {
			this.destroy();
		});
	}

	#restoreFocusOnClose(anchor: HTMLElement): void
	{
		// This subscription is a fallback for a subclass that opts out of the trap via
		// focusTrap: false. When a trap is present — and for menus built on ui.system.menu
		// it always is — the popup already restores focus to this same anchor on its own,
		// so subscribing here too would move it twice.
		const focusTrap = this.menuInstance?.getPopup()?.getFocusTrap() ?? null;
		if (focusTrap !== null)
		{
			return;
		}

		// subscribeOnce auto-removes the listener after the first close, so repeated keyboard
		// opens never accumulate subscriptions (both re-open and unmount emit close).
		this.subscribeOnce(BaseMenu.events.close, () => {
			anchor.focus();
		});
	}
}
