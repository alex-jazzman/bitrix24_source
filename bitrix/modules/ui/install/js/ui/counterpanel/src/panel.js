import { Dom, Loc, Tag, Type, Extension, Event } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Counter, CounterColor, CounterStyle, type CounterOptions } from 'ui.cnt';
import { FocusZone, FocusKeys } from 'ui.a11y';
import { Menu, MenuItemDesign, type MenuItemOptions } from 'ui.system.menu';
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

	#focusZone: ?FocusZone = null;

	// The user's intended entry point: a stable item id (or '__more__'), so it survives the
	// frequent full DOM rebuilds that leave FocusZone with dead element references.
	#focusIntentKey: ?string = null;
	#suppressFocusIntent: boolean = false;

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

	static #rovingMoreKey: string = '__more__';

	// Native buttons only: non-interactive items are rendered as spans and stay out of the roving set.
	static #rovingButtonSelector: string = 'button.ui-counter-panel__item';

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
				Dom.attr(this.container, 'role', 'toolbar');

				const accessibleName = this.#getAccessibleName();
				if (accessibleName)
				{
					Dom.attr(this.container, 'aria-label', accessibleName);
				}

				Event.bind(this.container, 'focusin', this.#onFocusIn);

				// FocusZone owns the roving tabindex: arrow/Home/End navigation and, through its
				// mutation observer, resynchronisation of the set on lock/unlock and on rebuilds.
				this.#focusZone = new FocusZone(this.container, {
					bindKeys: FocusKeys.ArrowHorizontal | FocusKeys.HomeAndEnd,
					focusOutBehavior: 'stop',
					focusInStrategy: 'previous',
				});

				this.#focusZone.activate();
			}
		}

		return this.container;
	}

	#getAccessibleName(): ?string
	{
		return this.title ?? null;
	}

	#initMenuTrigger(trigger: HTMLElement): void
	{
		if (!this.hasAirDesign())
		{
			return;
		}

		Dom.attr(trigger, 'aria-haspopup', 'menu');
		this.#setExpanded(trigger, false);
	}

	#setExpanded(trigger: HTMLElement, isExpanded: boolean): void
	{
		if (this.hasAirDesign())
		{
			Dom.attr(trigger, 'aria-expanded', isExpanded ? 'true' : 'false');
		}
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
			this.#tagRovingKey(item.getContainer(), item.getId());

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
			const moreButton = this.#getMoreButton();
			Dom.append(moreButton, this.#getContainer());
			this.#tagRovingKey(moreButton, CounterPanel.#rovingMoreKey);
			this.#refreshMoreHighlight();
		}
	}

	#tagRovingKey(button: HTMLElement, key: ?string): void
	{
		// Skip empty keys: a blank data-roving-key would collide across id-less items and mislead
		// focus restore (#findRovingButton). Without a key such a button falls back cleanly.
		if (this.hasAirDesign() && Type.isStringFilled(key))
		{
			Dom.attr(button, 'data-roving-key', key);
		}
	}

	#bindParentDropdown(item: CounterItem): void
	{
		if (this.boundParents.has(item))
		{
			return;
		}

		this.boundParents.add(item);
		this.#initMenuTrigger(item.getContainer());

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
					this.#setExpanded(item.getContainer(), true);
				},
				onClose: () => {
					Dom.removeClass(item.getContainer(), '--hover');
					Dom.removeClass(item.getContainer(), '--pointer-events-none');
					this.#setExpanded(item.getContainer(), false);
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
		const isDisabled = item.isLocked() || item.isRestricted;
		const isSelectable = item.isInteractive() && !isDisabled;

		// Unavailable and non-interactive entries are non-clickable disabled items: the panel and its
		// collapsed menu share one interactivity model.
		return {
			id: item.getId() ?? undefined,
			title: Type.isString(item.title) ? item.title : '',
			design: isSelectable ? undefined : MenuItemDesign.Disabled,
			isLocked: item.isRestricted,
			isSelected: isSelectable ? item.isActive : undefined,
			counter: this.#getMenuItemCounterOptions(item),
			icon: item.getCollapsedIcon() ?? undefined,
			sectionCode: item.hasCollapsedIcon() ? CounterPanel.#collapsedIconSection : undefined,
			onClick: isSelectable
				? () => {
					EventEmitter.emit('BX.UI.CounterPanel.Item:click', { item });

					if (item.isActive)
					{
						item.deactivate();
					}
					else
					{
						item.activate();
					}
				}
				: undefined,
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
			// Attach before filling: FocusZone only manages elements that are already in the
			// document, so the buttons must be connected by the time they are rendered.
			Dom.clean(this.target);
			Dom.append(this.#getContainer(), this.target);
			this.#rerender();
		}
	}

	init()
	{
		this.#adjustData();
		this.#render();
		this.#refreshParentHighlights();
		EventEmitter.subscribe('BX.UI.CounterPanel.Item:activate', this.#onChildActivityChange);
		EventEmitter.subscribe('BX.UI.CounterPanel.Item:deactivate', this.#onChildActivityChange);
		EventEmitter.subscribe('BX.UI.CounterPanel.Item:disable', this.#onChildDisable);
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
		// Capture focus BEFORE Dom.clean wipes the buttons - a rebuild triggered by updateValue()
		// or ui.actions-bar must not steal focus from a user working elsewhere on the page.
		const hadFocusInside = this.#hasFocusInside() || this.#captureMenuFocusIntent();

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

		// The observer inside FocusZone is debounced by a frame, and a rebuild must leave the
		// toolbar with a valid entry point right away.
		this.#focusZone?.refreshElements();
		this.#restoreFocusIntent(hadFocusInside);
	}

	#hasFocusInside(): boolean
	{
		if (!this.hasAirDesign() || !this.container)
		{
			return false;
		}

		const active = document.activeElement;

		return Boolean(active) && active !== this.container && this.container.contains(active);
	}

	#hasFocusInMenu(): boolean
	{
		if (!this.hasAirDesign() || !this.activeMenu)
		{
			return false;
		}

		const popupContainer = this.activeMenu?.getPopupContainer?.();
		const active = document.activeElement;

		return Boolean(popupContainer) && Boolean(active) && popupContainer.contains(active);
	}

	// Focus inside an open menu (a popup in <body>) - the imminent close() would drop it to <body>;
	// remember the trigger's key so the rebuild returns focus to the initiator or the nearest button.
	#captureMenuFocusIntent(): boolean
	{
		if (!this.hasAirDesign() || !this.#hasFocusInMenu())
		{
			return false;
		}

		if (this.activeClickElement)
		{
			const key = this.#rovingKeyOf(this.activeClickElement);
			if (key !== null)
			{
				this.#focusIntentKey = key;
			}
		}

		return true;
	}

	// A rebuild replaces every node, so FocusZone can only fall back to the first button. Only if
	// focus was inside before the rebuild, move it back to the intended element (by key, not index).
	#restoreFocusIntent(hadFocusInside: boolean): void
	{
		if (!hadFocusInside)
		{
			return;
		}

		const buttons = this.#getRovingButtons();
		const target = this.#findRovingButton(this.#focusIntentKey, buttons) ?? this.#fallbackRovingButton(buttons);
		if (target)
		{
			// Programmatic restore preserves the user's intended key, so after an
			// expand/collapse/expand burst focus returns to the original item.
			this.#suppressFocusIntent = true;
			target.focus();
			this.#suppressFocusIntent = false;
		}
	}

	#getRovingButtons(): HTMLElement[]
	{
		if (!this.hasAirDesign() || !this.container)
		{
			return [];
		}

		return [...this.container.querySelectorAll(CounterPanel.#rovingButtonSelector)]
			.filter((button) => !button.disabled);
	}

	#rovingKeyOf(button: HTMLElement): ?string
	{
		return button.getAttribute('data-roving-key');
	}

	#findRovingButton(key: ?string, buttons: HTMLElement[] = this.#getRovingButtons()): ?HTMLElement
	{
		if (key === null)
		{
			return null;
		}

		return buttons.find((button) => this.#rovingKeyOf(button) === key) ?? null;
	}

	#fallbackRovingButton(buttons: HTMLElement[] = this.#getRovingButtons()): ?HTMLElement
	{
		return buttons.find((button) => this.#rovingKeyOf(button) === CounterPanel.#rovingMoreKey)
			?? buttons[0]
			?? null;
	}

	#nextRovingButton(fromButton: HTMLElement): ?HTMLElement
	{
		const buttons = this.#getRovingButtons();
		if (buttons.length === 0)
		{
			return null;
		}

		const following = buttons.find(
			(button) => (fromButton.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
		);

		return following ?? buttons[buttons.length - 1];
	}

	#onFocusIn = (event): void => {
		const button = event.target?.closest?.(CounterPanel.#rovingButtonSelector);
		if (!button)
		{
			return;
		}

		if (!this.#suppressFocusIntent)
		{
			this.#focusIntentKey = this.#rovingKeyOf(button);
		}
	};

	// Locking an item disables its button, and the browsers disagree on what happens to the focus:
	// Chrome drops it to <body>, Firefox leaves it on the unusable button. FocusZone rebuilds the
	// roving set on the same change but never moves real focus, so the keyboard user is handed to
	// the neighbouring button here. The item reports who held the focus before the disable, which is
	// the only moment when the answer is the same in both browsers.
	#onChildDisable = (event): void => {
		const { item, hadFocus } = event.data;
		if (hadFocus !== true || item?.panel !== this)
		{
			return;
		}

		const target = this.#nextRovingButton(item.getContainer()) ?? this.container;
		if (target === this.container)
		{
			// The container is not in the Tab order; -1 only makes it programmatically focusable.
			Dom.attr(this.container, 'tabindex', '-1');
		}

		target?.focus();
	};

	#getMoreButton(): HTMLElement
	{
		if (!this.moreButton)
		{
			const hiddenItems = this.#getHiddenRootItems();
			const totalValue = this.#getTotalValue(hiddenItems);
			const counterContainer = totalValue > 0 ? this.#getMoreCounterContainer(hiddenItems) : '';

			this.moreButton = this.hasAirDesign()
				? Tag.render`
					<button type="button" class="ui-counter-panel__item ui-counter-panel__item--more-trigger">
						<span class="ui-counter-panel__visually-hidden">${Loc.getMessage('UI_COUNTER_PANEL_MORE_BUTTON')}</span>
						${counterContainer}
						<span class="ui-counter-panel__item-dropdown" aria-hidden="true"><i></i></span>
					</button>
				`
				: Tag.render`
					<div class="ui-counter-panel__item ui-counter-panel__item--more-trigger">
						${counterContainer}
						<div class="ui-counter-panel__item-dropdown"><i></i></div>
					</div>
				`;

			this.#initMenuTrigger(this.moreButton);

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

	#getMoreCounterContainer(items: CounterItem[]): HTMLElement
	{
		const counterNode = this.#getMoreCounter(items).getContainer();

		return this.hasAirDesign()
			? Tag.render`<span class="ui-counter-panel__item-value">${counterNode}</span>`
			: Tag.render`
				<div class="ui-counter-panel__item-value">
					${counterNode}
				</div>
			`;
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
			onShow: () => {
				Dom.addClass(this.moreButton, '--hover');
				this.#setExpanded(this.moreButton, true);
			},
			onClose: () => {
				Dom.removeClass(this.moreButton, '--hover');
				this.#setExpanded(this.moreButton, false);
			},
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
