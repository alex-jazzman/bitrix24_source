import { Dom, Tag, Type, Event, Loc } from 'main.core';
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
		return this.title ?? '';
	}

	getContainer(): HTMLElement | null
	{
		if (this.active === false && this.#isDropdown)
		{
			return null;
		}

		if (!this.linkContainer)
		{
			this.linkContainer = this.#renderContainer();

			if (this.#isDropdown)
			{
				Dom.addClass(this.linkContainer, '--dropdown');
				this.linkContainer.setAttribute('aria-haspopup', 'menu');
				this.#setExpanded(false);
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

	#isLink(): boolean
	{
		// only a link with an href is a real anchor; an href-less <a> drops out of the focus zone (a[href])
		return Type.isStringFilled(this.link?.href) && this.#isDropdown === false;
	}

	#renderContainer(): HTMLElement
	{
		const id = this.id ? `id="ui-nav-panel-item-${this.id}"` : '';
		const title = Tag.render`
			<span class="ui-nav-panel__item-title">${this.getTitle()}</span>
		`;

		if (this.#isLink())
		{
			return Tag.render`
				<a ${id} class="ui-nav-panel__item">${title}</a>
			`;
		}

		return Tag.render`
			<button ${id} type="button" class="ui-nav-panel__item">
				${title}
				${this.#isDropdown ? this.#renderDropdownIcon() : ''}
			</button>
		`;
	}

	isLocked(): boolean
	{
		return this.locked;
	}

	lock()
	{
		this.locked = true;

		const container = this.getContainer();
		if (!container)
		{
			return;
		}

		// locked items stay operable (e.g. to surface an upsell), so no aria-disabled;
		// the lock is conveyed to assistive tech through the accessible name instead
		Dom.addClass(container, '--locked');

		const lockedLabel = Loc.getMessage('UI_NAV_PANEL_ITEM_LOCKED_ARIA', { '#TITLE#': this.getTitle() });
		if (Type.isStringFilled(lockedLabel))
		{
			container.setAttribute('aria-label', lockedLabel);
		}
	}

	unLock()
	{
		this.locked = false;

		const container = this.getContainer();
		if (!container)
		{
			return;
		}

		Dom.removeClass(container, '--locked');

		// restore the consumer-provided accessible name (from the link option) instead of dropping it
		const ariaLabel = this.link?.['aria-label'];
		if (Type.isStringFilled(ariaLabel))
		{
			container.setAttribute('aria-label', ariaLabel);
		}
		else
		{
			container.removeAttribute('aria-label');
		}
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
		const container = this.getContainer();

		if (this.#isDropdown === false)
		{
			Dom.addClass(container, '--active');
		}

		// aria-current is independent of the visual class: a collapsed active item is a dropdown trigger too
		container?.setAttribute('aria-current', this.#isLink() ? 'page' : 'true');

		this.#onActivate?.(this);
		EventEmitter.emit('BX.UI.NavigationPanel.Item:active', this);
	}

	inactivate()
	{
		this.active = false;
		// getContainer() returns null for an inactive dropdown, so fall back to the rendered node
		const container = this.linkContainer ?? this.getContainer();

		if (this.#isDropdown === false)
		{
			Dom.removeClass(container, '--active');
		}

		container?.removeAttribute('aria-current');

		EventEmitter.emit('BX.UI.NavigationPanel.Item:inactive', this);
	}

	#renderDropdownIcon(): HTMLElement
	{
		const icon = (new Icon({
			size: 16,
			icon: OutlineIconSet.CHEVRON_DOWN_L,
		})).render();

		return Tag.render`
			<span class="ui-nav-panel__item-dropdown-icon ui-icon-set__scope" aria-hidden="true">${icon}</span>
		`;
	}

	#setExpanded(isExpanded: boolean): void
	{
		this.linkContainer?.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
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
					this.#setExpanded(true);
				},
				onClose: () => {
					Dom.removeClass(this.linkContainer, '--active');
					this.#setExpanded(false);
				},
			},
		});

		return this.#menu;
	}
}
