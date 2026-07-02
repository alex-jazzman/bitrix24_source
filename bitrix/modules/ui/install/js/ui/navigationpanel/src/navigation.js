import { Dom, Tag, Text, Type, Extension } from 'main.core';
import { type MenuItemOptions } from 'ui.system.menu';
import NavigationItem from './item';
import 'ui.fonts.opensans';
import './style.css';

export type NavigationPanelOptions = {
	target: HTMLElement;
	items: Object[];
	collapsed?: boolean;
};

const instanceMap: WeakMap<HTMLElement, NavigationPanel> = new WeakMap();

export default class NavigationPanel
{
	keys: string[];
	#isCollapsed: boolean = false;

	static getInstanceByNode(node: HTMLElement): ?NavigationPanel
	{
		return instanceMap.get(node) ?? null;
	}

	#rawItems: Object[] = [];

	constructor(options: NavigationPanelOptions)
	{
		this.target = Type.isDomNode(options.target) ? options.target : null;
		const rawItems = Type.isArray(options.items) ? options.items : [];
		this.#rawItems = rawItems.map((item) => ({
			...item,
			id: item.id ?? `nav-${Text.getRandom(8)}`,
		}));
		this.items = this.#rawItems;
		this.container = null;
		this.keys = [];
		this.#isCollapsed = options.collapsed === true;
	}

	adjustItem()
	{
		this.items = this.items.map((item) => {
			this.keys.push(item.id);

			return new NavigationItem({
				id: item.id ?? null,
				title: item.title ?? null,
				active: item.active === true,
				events: item.events ?? null,
				link: item.link ?? null,
				locked: item.locked === true,
				dropdown: item.active === true && this.#isCollapsed,
				menuItems: item.active === true && this.#isCollapsed ? this.#getMenuItems() : [],
				onActivate: this.#deactivateOthers,
			});
		});
	}

	#deactivateOthers = (activatedItem: NavigationItem): void => {
		this.items.forEach((item) => {
			if (item !== activatedItem && item.active)
			{
				item.inactivate();
			}
		});
	};

	getItemById(value: string): ?NavigationItem
	{
		if (value)
		{
			const id = this.keys.indexOf(value);

			return this.items[id];
		}

		return null;
	}

	getContainer(): HTMLElement
	{
		if (!this.container)
		{
			this.container = Tag.render`
				<div class="ui-nav-panel ui-nav-panel__scope"></div>
			`;

			instanceMap.set(this.container, this);

			if (this.hasAirDesign())
			{
				Dom.addClass(this.container, '--air');
			}

			if (this.#isCollapsed)
			{
				Dom.addClass(this.container, '--collapsed');
			}
		}

		return this.container;
	}

	render()
	{
		this.items.forEach((item) => {
			if (this.#isCollapsed && item.active === false)
			{
				return;
			}

			if (item instanceof NavigationItem)
			{
				Dom.append(item.getContainer(), this.getContainer());
			}
		});

		Dom.clean(this.target);
		Dom.append(this.getContainer(), this.target);
	}

	init()
	{
		this.adjustItem();
		this.render();
	}

	isCollapsed(): boolean
	{
		return this.#isCollapsed;
	}

	collapse(): void
	{
		if (this.#isCollapsed)
		{
			return;
		}

		this.#isCollapsed = true;
		this.#rebuild();
	}

	expand(): void
	{
		if (!this.#isCollapsed)
		{
			return;
		}

		this.#isCollapsed = false;
		this.#rebuild();
	}

	#rebuild(): void
	{
		this.items.forEach((item) => {
			if (item instanceof NavigationItem)
			{
				item.closeMenu();
			}
		});

		const currentActiveId = this.items.find((item) => item.active === true)?.id ?? null;

		this.#rawItems = this.#rawItems.map((item) => ({
			...item,
			active: item.id === currentActiveId,
		}));

		this.keys = [];
		this.items = this.#rawItems;

		this.adjustItem();
		this.#rerenderContent();
	}

	#rerenderContent(): void
	{
		const container = this.getContainer();

		Dom.clean(container);

		if (this.#isCollapsed)
		{
			Dom.addClass(container, '--collapsed');
		}
		else
		{
			Dom.removeClass(container, '--collapsed');
		}

		this.items.forEach((item) => {
			if (this.#isCollapsed && item.active === false)
			{
				return;
			}

			if (item instanceof NavigationItem)
			{
				Dom.append(item.getContainer(), container);
			}
		});
	}

	hasAirDesign(): boolean
	{
		return Extension.getSettings('ui.navigationpanel').get('useAirDesign');
	}

	#getMenuItems(): MenuItemOptions[]
	{
		return this.items.map((item: NavigationItem): MenuItemOptions => {
			return {
				id: item.id ?? Math.random(),
				title: item.title,
				isSelected: item.active === true,
				isLocked: item.locked === true,
				onClick: () => {
					if (Type.isFunction(item.events?.click))
					{
						item.events.click();

						return;
					}

					const href = item.link?.href;
					if (Type.isStringFilled(href))
					{
						window.location.href = href;
					}
				},
			};
		});
	}
}
