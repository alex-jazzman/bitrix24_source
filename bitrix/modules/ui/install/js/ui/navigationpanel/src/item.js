import { Dom, Tag, Type, Event } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Icon, Outline as OutlineIconSet } from 'ui.icon-set.api.core';
import { Menu, type MenuItemOptions } from 'ui.system.menu';

import 'ui.icon-set.outline';

export type NavigationItemOptions = {
	id: string;
	title: string;
	events?: Object;
	link?: Object;
	locked?: boolean;
	active?: boolean;
	menuItems?: MenuItemOptions[];
	onActivate?: (item: NavigationItem) => void;
}
export default class NavigationItem
{
	#isDropdown = false;
	#menuItems: MenuItemOptions = [];
	#onActivate: ?(item: NavigationItem) => void = null;
	#menu: ?Menu = null;

	constructor({
		id,
		title,
		active,
		events,
		link,
		locked,
		dropdown = false,
		menuItems = [],
		onActivate,
	}: NavigationItemOptions)
	{
		this.id = id ?? null;
		this.title = Type.isString(title) ? title : null;
		this.active = Type.isBoolean(active) ? active : false;
		this.events = events ?? null;
		this.link = link ?? null;
		this.locked = Type.isBoolean(locked) ? locked : false;
		this.#isDropdown = dropdown === true;
		this.#menuItems = menuItems ?? [];
		this.#onActivate = Type.isFunction(onActivate) ? onActivate : null;

		this.linkContainer = null;
	}

	getTitle(): string
	{
		if (!this.title)
		{
			this.title = Tag.render`
				<div class="ui-nav-panel__item-title">${this.title}</div>	
			`;
		}

		return this.title;
	}

	getContainer(): HTMLElement | null
	{
		if (this.active === false && this.#isDropdown)
		{
			return null;
		}

		if (!this.linkContainer)
		{
			const id = this.id ? `id="ui-nav-panel-item-${this.id}"` : '';
			this.linkContainer = Tag.render`
				<div ${id} class="ui-nav-panel__item">
					<span>${this.title ? this.getTitle() : ''}</span>
					${this.#isDropdown ? this.#renderDropdownIcon() : ''}
				</div>
			`;

			if (this.#isDropdown)
			{
				Dom.addClass(this.linkContainer, '--dropdown');
			}

			this.setEvents();

			if (this.active)
			{
				this.activate();
			}
			else
			{
				this.inactivate();
			}

			if (this.locked)
			{
				this.lock();
			}
			else
			{
				this.unLock();
			}
		}

		return this.linkContainer;
	}

	isLocked(): boolean
	{
		return this.locked;
	}

	lock()
	{
		this.locked = true;
		Dom.addClass(this.getContainer(), '--locked');
	}

	unLock()
	{
		this.locked = false;
		Dom.removeClass(this.getContainer(), '--locked');
	}

	setEvents()
	{
		if (this.#isDropdown)
		{
			Event.bind(this.linkContainer, 'click', () => {
				this.#showMenu();
			});

			return;
		}

		if (this.link)
		{
			this.linkContainer = Tag.render`
				<a class="ui-nav-panel__item">
					<span>${this.title ? this.getTitle() : ''}</span>
				</a>
			`;

			Object.entries(this.link).forEach(([linkKey, linkValue]) => {
				this.linkContainer.setAttribute(linkKey, linkValue);
			});
		}

		if (this.events)
		{
			Object.entries(this.events).forEach(([eventKey, eventHandler]) => {
				Event.bind(this.getContainer(), eventKey, () => {
					eventHandler();
				});
			});
		}
	}

	activate()
	{
		this.active = true;
		if (this.#isDropdown === false)
		{
			Dom.addClass(this.getContainer(), '--active');
		}

		this.#onActivate?.(this);
		EventEmitter.emit('BX.UI.NavigationPanel.Item:active', this);
	}

	inactivate()
	{
		this.active = false;

		if (this.#isDropdown === false)
		{
			Dom.removeClass(this.getContainer(), '--active');
		}

		EventEmitter.emit('BX.UI.NavigationPanel.Item:inactive', this);
	}

	#renderDropdownIcon(): HTMLElement
	{
		const icon = (new Icon({
			size: 16,
			icon: OutlineIconSet.CHEVRON_DOWN_L,
		})).render();

		return Tag.render`
			<span class="ui-nav-panel__item-dropdown-icon ui-icon-set__scope">${icon}</span>
		`;
	}

	#showMenu(): void
	{
		this.#getMenu().show(this.getContainer());
	}

	closeMenu(): void
	{
		if (this.#menu && this.#menu.getPopup()?.isShown())
		{
			this.#menu.close();
		}
	}

	#getMenu(): Menu
	{
		if (this.#menu)
		{
			return this.#menu;
		}

		this.#menu = new Menu({
			items: this.#menuItems,
			bindOptions: {
				forceBindPosition: true,
				forceTop: true,
			},
			offsetTop: 8,
			offsetLeft: 0,
			events: {
				onShow: () => {
					Dom.addClass(this.linkContainer, '--active');
				},
				onClose: () => {
					Dom.removeClass(this.linkContainer, '--active');
				},
			},
		});

		return this.#menu;
	}
}
