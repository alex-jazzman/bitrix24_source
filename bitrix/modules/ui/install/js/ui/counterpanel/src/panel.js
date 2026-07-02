import { Dom, Tag, Type, Extension, Event } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Counter, CounterColor, CounterStyle, type CounterOptions } from 'ui.cnt';
import { Menu, type MenuItemOptions } from 'ui.system.menu';
import CounterItem, { type CounterItemOptions } from './item';
import './style.css';

type CounterPanelOptions = {
	target: HTMLElement;
	items: Array;
	multiselect: boolean;
	title: string;
}

type PopupHooks = {
	onShow?: () => void,
	onClose?: () => void,
}

const instanceMap: WeakMap<HTMLElement, CounterPanel> = new WeakMap();

export default class CounterPanel
{
	static #collapsedIconSection: string = 'collapsed-icon';

	static getInstanceByNode(node: HTMLElement): ?CounterPanel
	{
		return instanceMap.get(node) ?? null;
	}

	constructor(options: CounterPanelOptions)
	{
		this.target = Type.isDomNode(options.target) ? options.target : null;
		this.items = Type.isArray(options.items) ? options.items : [];
		this.multiselect = Type.isBoolean(options.multiselect) ? options.multiselect : null;
		this.title = Type.isStringFilled(options.title) ? options.title : null;
		this.container = null;
		this.keys = [];
		this.hasParent = [];
		this.collapsedState = false;
		this.moreButton = null;
		this.moreCounter = null;
		this.boundParents = new WeakSet();
		this.activeMenu = null;
		this.activeClickElement = null;
	}

	#adjustData()
	{
		this.items = this.items.map((item) => {
			this.keys.push(item.id);
			if (item.parentId)
			{
				this.hasParent.push(item.parentId);
			}

			return new CounterItem({
				...item,
				useAirDesign: this.hasAirDesign(),
				panel: this,
			});
		});

		this.hasParent.forEach((item) => {
			const index = this.keys.indexOf(item);
			this.items[index].parent = true;
		});

		this.items.forEach((item) => {
			if (item.parentId)
			{
				const index = this.keys.indexOf(item.parentId);
				this.items[index].items.push(item.id);
			}
		});
	}

	isMultiselect(): boolean
	{
		return this.multiselect;
	}

	getItems(): (CounterItem | CounterItemOptions)[]
	{
		return this.items;
	}

	getItemById(param): CounterItem | undefined
	{
		if (param)
		{
			const index = this.keys.indexOf(param);

			return this.items[index];
		}

		return undefined;
	}

	#getRootItems(): CounterItem[]
	{
		return this.items.filter(
			(item) => item instanceof CounterItem && !item.hasParentId(),
		);
	}

	#getVisibleRootItems(): CounterItem[]
	{
		const rootItems = this.#getRootItems();

		return this.collapsedState ? rootItems.slice(0, 1) : rootItems;
	}

	#getHiddenRootItems(): CounterItem[]
	{
		return this.collapsedState ? this.#getRootItems().slice(1) : [];
	}

	#flattenParents(items: CounterItem[]): CounterItem[]
	{
		// Replace each parent item with its children so a hidden user "More"
		// surfaces its contents directly in the popup, not as a nested entry.
		return items.flatMap((item) => {
			if (item.parent !== true)
			{
				return [item];
			}

			return item.getItems()
				.map((childId) => this.getItemById(childId))
				.filter(Boolean);
		});
	}

	#getContainer(): HTMLElement
	{
		if (!this.container)
		{
			this.container = Tag.render`
				<div class="ui-counter-panel ui-counter-panel__scope"></div>
			`;

			instanceMap.set(this.container, this);

			if (this.hasAirDesign() === true)
			{
				Dom.addClass(this.container, '--air');
			}
		}

		return this.container;
	}

	#getTitleNode(): HTMLElement
	{
		return Tag.render`
			<div class="ui-counter-panel__item-head">${this.title}</div>
		`;
	}

	#renderItems(): void
	{
		const visibleRootItems = this.#getVisibleRootItems();
		const showMoreButton = this.collapsedState && this.#getHiddenRootItems().length > 0;

		visibleRootItems.forEach((item, index) => {
			Dom.append(item.getContainer(), this.#getContainer());

			const isLastVisible = index === visibleRootItems.length - 1;
			const needsSeparator = !isLastVisible || showMoreButton;
			if (needsSeparator)
			{
				Dom.append(Tag.render`
					<div class="ui-counter-panel__item-separator ${item.getSeparator() ? '' : '--invisible'}"></div>
				`, this.#getContainer());
			}

			if (item.parent)
			{
				this.#bindParentDropdown(item);
			}
		});

		if (showMoreButton)
		{
			Dom.append(this.#getMoreButton(), this.#getContainer());
			this.#refreshMoreHighlight();
		}
	}

	#bindParentDropdown(item: CounterItem): void
	{
		if (this.boundParents.has(item))
		{
			return;
		}

		this.boundParents.add(item);

		Event.bind(item.getContainer(), 'click', () => {
			if (this.#toggleActiveMenu(item.getContainer()))
			{
				return;
			}

			const childItems = item.getItems()
				.map((childId) => this.getItemById(childId))
				.filter(Boolean);

			this.#showItemsPopup(childItems, item.getContainer(), item.getContainer(), {
				onShow: () => {
					Dom.addClass(item.getContainer(), '--hover');
					Dom.addClass(item.getContainer(), '--pointer-events-none');
				},
				onClose: () => {
					Dom.removeClass(item.getContainer(), '--hover');
					Dom.removeClass(item.getContainer(), '--pointer-events-none');
				},
			});
		});
	}

	#toggleActiveMenu(clickElement: HTMLElement): boolean
	{
		if (this.activeClickElement === clickElement)
		{
			this.activeMenu?.close();

			return true;
		}

		return false;
	}

	#buildPopupItem(item: CounterItem): MenuItemOptions
	{
		return {
			id: item.getId() ?? undefined,
			title: Type.isString(item.title) ? item.title : '',
			isSelected: item.isActive,
			counter: this.#getMenuItemCounterOptions(item),
			icon: item.getCollapsedIcon() ?? undefined,
			sectionCode: item.hasCollapsedIcon() ? CounterPanel.#collapsedIconSection : undefined,
			onClick: () => {
				EventEmitter.emit('BX.UI.CounterPanel.Item:click', { item });

				if (item.isActive)
				{
					item.deactivate();
				}
				else
				{
					item.activate();
				}
			},
		};
	}

	#getMenuItemCounterOptions(item: CounterItem): ?CounterOptions
	{
		if (!Type.isNumber(item.value) || item.hideValue)
		{
			return null;
		}

		return item.getCounterOptions();
	}

	#render(): void
	{
		if (this.target && this.items.length > 0)
		{
			this.#rerender();
			Dom.clean(this.target);
			Dom.append(this.#getContainer(), this.target);
		}
	}

	init()
	{
		this.#adjustData();
		this.#render();
		this.#refreshParentHighlights();
		EventEmitter.subscribe('BX.UI.CounterPanel.Item:activate', this.#onChildActivityChange);
		EventEmitter.subscribe('BX.UI.CounterPanel.Item:deactivate', this.#onChildActivityChange);
	}

	#onChildActivityChange = (event): void => {
		const item = event.data;
		if (!item || item.panel !== this)
		{
			return;
		}

		const parent = item.parentId ? this.getItemById(item.parentId) : null;
		if (parent)
		{
			this.#refreshParentHighlight(parent);
		}

		this.#refreshMoreHighlight();
	};

	#refreshParentHighlights(): void
	{
		this.#getRootItems()
			.filter((item) => item.parent === true)
			.forEach((parent) => this.#refreshParentHighlight(parent));
	}

	#refreshParentHighlight(parent: CounterItem): void
	{
		const hasActiveChild = parent.getItems()
			.map((childId) => this.getItemById(childId))
			.some((child) => child?.isActive === true);

		Dom[hasActiveChild ? 'addClass' : 'removeClass'](parent.getContainer(), '--active');
	}

	#refreshMoreHighlight(): void
	{
		if (!this.moreButton)
		{
			return;
		}

		const hiddenLeaves = this.#flattenParents(this.#getHiddenRootItems());
		const hasActive = hiddenLeaves.some((item) => item?.isActive === true);

		Dom[hasActive ? 'addClass' : 'removeClass'](this.moreButton, '--active');
	}

	setItems(items)
	{
		this.items = items;
	}

	isCollapsed(): boolean
	{
		return this.collapsedState;
	}

	collapse(): void
	{
		if (this.collapsedState)
		{
			return;
		}

		this.collapsedState = true;
		this.#rerender();
	}

	expand(): void
	{
		if (!this.collapsedState)
		{
			return;
		}

		this.collapsedState = false;
		this.#rerender();
	}

	#rerender(): void
	{
		this.activeMenu?.close();

		const container = this.#getContainer();

		Dom.clean(container);

		this.moreButton = null;
		this.moreCounter = null;

		if (this.collapsedState)
		{
			Dom.addClass(container, '--panel-collapsed');
		}
		else
		{
			Dom.removeClass(container, '--panel-collapsed');

			if (this.title)
			{
				Dom.append(this.#getTitleNode(), container);
			}
		}

		this.#renderItems();
	}

	#getMoreButton(): HTMLElement
	{
		if (!this.moreButton)
		{
			const hiddenItems = this.#getHiddenRootItems();
			const totalValue = this.#getTotalValue(hiddenItems);
			const counterContainer = totalValue > 0
				? Tag.render`
					<div class="ui-counter-panel__item-value">
						${this.#getMoreCounter(hiddenItems).getContainer()}
					</div>
				`
				: ''
			;

			this.moreButton = Tag.render`
				<div class="ui-counter-panel__item ui-counter-panel__item--more-trigger">
					${counterContainer}
					<div class="ui-counter-panel__item-dropdown"><i></i></div>
				</div>
			`;

			Event.bind(this.moreButton, 'click', () => {
				if (this.#toggleActiveMenu(this.moreButton))
				{
					return;
				}

				this.#showMorePopup();
			});
		}

		return this.moreButton;
	}

	#getTotalValue(items: CounterItem[]): number
	{
		let total = 0;

		for (const item of items)
		{
			if (Type.isNumber(item.value))
			{
				total += item.value;
			}
		}

		return total;
	}

	#getMoreCounter(items: CounterItem[]): Counter
	{
		if (!this.moreCounter)
		{
			this.moreCounter = this.#createAggregateCounter(items);
		}

		return this.moreCounter;
	}

	#createAggregateCounter(items: CounterItem[]): Counter
	{
		const hasDanger = items.some(
			(item) => item.color && item.color.toUpperCase() === 'DANGER',
		);

		const color = hasDanger ? Counter.Color.DANGER : Counter.Color.THEME;

		return new Counter({
			color,
			value: this.#getTotalValue(items),
			animation: false,
			useAirDesign: this.hasAirDesign(),
			style: this.#getAggregateCounterStyle(color),
		});
	}

	#getAggregateCounterStyle(color: string): string
	{
		if (color === CounterColor.DANGER)
		{
			return CounterStyle.FILLED_ALERT;
		}

		return CounterStyle.OUTLINE_NO_ACCENT;
	}

	#showMorePopup(): void
	{
		this.#showItemsPopup(this.#getHiddenRootItems(), this.moreButton, this.moreButton, {
			onShow: () => Dom.addClass(this.moreButton, '--hover'),
			onClose: () => Dom.removeClass(this.moreButton, '--hover'),
		});
	}

	#showItemsPopup(
		items: CounterItem[],
		bindElement: HTMLElement,
		clickElement: HTMLElement,
		hooks: PopupHooks = {},
	): void
	{
		this.activeMenu?.close();

		const menu = new Menu({
			className: 'ui-counter-panel__popup ui-counter-panel__scope',
			animation: 'fading-slide',
			items: this.#flattenParents(items).map((item) => this.#buildPopupItem(item)),
			sections: [{ code: CounterPanel.#collapsedIconSection }],
			autoHideHandler: (event: MouseEvent): boolean => {
				if (clickElement.contains(event.target))
				{
					return false;
				}

				const popupContainer = menu?.getPopupContainer();

				return !popupContainer?.contains(event.target);
			},
			offsetTop: 8,
			events: {
				onShow: () => {
					this.activeMenu = menu;
					this.activeClickElement = clickElement;
					hooks.onShow?.();
				},
				onClose: () => {
					if (this.activeMenu === menu)
					{
						this.activeMenu = null;
						this.activeClickElement = null;
					}
					hooks.onClose?.();
				},
			},
		});

		menu.show(bindElement);
	}

	hasAirDesign(): boolean
	{
		return Extension.getSettings('ui.counterpanel').get('useAirDesign') === true;
	}
}
