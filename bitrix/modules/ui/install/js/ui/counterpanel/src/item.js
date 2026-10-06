import { Dom, Loc, Tag, Type, Event } from 'main.core';
import { Counter, CounterColor, CounterStyle } from 'ui.cnt';
import { EventEmitter } from 'main.core.events';
import 'ui.design-tokens';
import 'ui.icon-set.api.core';
import 'ui.icon-set.outline';

import { CounterPanel } from './index';

export type CounterItemOptions = {
	id?: string;
	panel: CounterPanel;
	title: string | { value: number, order: number };
	parentId: string;
	collapsedIcon?: string;
	collapsed?: string;
	locked?: boolean;
	dataAttributes?: { [key: string]: string };
	color?: CounterColor;
	value?: number;
	isActive: boolean;
	separator?: boolean;
	items?: CounterItemOptions[];
	type?: string;
	eventsForActive: Object;
	eventsForUnActive: Object;
	hideValue: boolean;
	isRestricted?: boolean;
	useAirDesign?: boolean;
}

export default class CounterItem
{
	#collapsedIcon: ?string;
	#collapsed: ?boolean;
	counter: ?Counter;
	#dataAttributes: ?{ [key: string]: string };
	#useAirDesign: boolean = false;

	constructor(args: CounterItemOptions)
	{
		this.id = args.id ?? null;
		this.separator = Type.isBoolean(args.separator) ? args.separator : true;
		this.items = Type.isArray(args.items) ? args.items : [];
		this.popupMenu = null;
		this.isActive = Type.isBoolean(args.isActive) ? args.isActive : false;
		this.isRestricted = Type.isBoolean(args.isRestricted) ? args.isRestricted : false;
		this.panel = args.panel ?? null;
		this.title = args.title ?? null;
		this.value = (Type.isNumber(args.value) && args.value !== undefined) ? args.value : null;
		this.titleOrder = null;
		this.valueOrder = null;
		this.color = args.color ?? null;
		this.parent = Type.isBoolean(args.parent) ? args.parent : null;
		this.parentId = args.parentId ?? null;
		this.locked = args.locked === true;
		this.type = Type.isString(args.type) ? args.type.toLowerCase() : null;
		this.eventsForActive = Type.isObject(args.eventsForActive) ? args.eventsForActive : {};
		this.eventsForUnActive = Type.isObject(args.eventsForUnActive) ? args.eventsForUnActive : {};
		this.hideValue = Type.isBoolean(args.hideValue) ? args.hideValue : false;
		this.#collapsedIcon = args.collapsedIcon ?? null;
		this.#collapsed = args.collapsed === true;
		this.#dataAttributes = Type.isPlainObject(args.dataAttributes) ? args.dataAttributes : {};
		this.#useAirDesign = args.useAirDesign === true;

		if (Type.isObject(args.title))
		{
			this.title = args.title.value ?? null;
			this.titleOrder = Type.isNumber(args.title.order) ? args.title.order : null;
		}

		if (Type.isObject(args.value))
		{
			this.value = Type.isNumber(args.value.value) ? args.value.value : null;
			this.valueOrder = Type.isNumber(args.value.order) ? args.value.order : null;
		}

		this.layout = {
			container: null,
			value: null,
			title: null,
			cross: null,
			dropdownArrow: null,
		};

		this.counter = this.#getCounter();

		if (!this.#getPanel().isMultiselect())
		{
			this.#bindEvents();
		}
	}

	getItems(): (CounterItemOptions | CounterItem)[]
	{
		return this.items;
	}

	getId(): ?string
	{
		return this.id;
	}

	hasParentId(): ?string
	{
		return this.parentId;
	}

	hasCollapsedIcon(): boolean
	{
		return this.#collapsedIcon !== null;
	}

	getCollapsedIcon(): ?string
	{
		return this.#collapsedIcon;
	}

	#bindEvents(): void
	{
		EventEmitter.subscribe('BX.UI.CounterPanel.Item:activate', (item) => {
			const isLinkedItems = item.data.parentId === this.id;
			if (item.data !== this && !isLinkedItems)
			{
				this.deactivate();
			}
		});
	}

	updateValue(param: number): void
	{
		if (Type.isNumber(param))
		{
			this.value = param;
			this.#getCounter().update(param);

			if (param === 0)
			{
				this.updateColor(this.parentId ? 'GRAY' : 'THEME');
				Dom.addClass(this.layout.container, this.#getZeroItemClassModifier());
			}
			else
			{
				Dom.removeClass(this.layout.container, this.#getZeroItemClassModifier());
			}

			this.#refreshAccessibleName();
		}
	}

	updateValueAnimate(param: Number)
	{
		if (Type.isNumber(param))
		{
			this.value = param;
			this.#getCounter().update(param);
			this.#getCounter().show();

			if (param === 0)
			{
				const color = this.parentId ? 'GRAY' : 'THEME';

				this.updateColor(color);
				this.#getCounter().setStyle(this.#getCounterStyleByColor(Counter.Color[color]));
			}

			this.#refreshAccessibleName();
		}
	}

	updateColor(param: string)
	{
		if (Type.isString(param))
		{
			this.color = param;
			this.#getCounter().setColor(Counter.Color[param]);
			this.#getCounter().setStyle(this.#getCounterStyleByColor(Counter.Color[param]));
		}
	}

	activate(isEmitEvent: boolean = true)
	{
		this.isActive = true;
		if (!this.parentId)
		{
			Dom.addClass(this.getContainer(), '--active');
			this.#refreshPressedState();
		}

		if (isEmitEvent)
		{
			EventEmitter.emit('BX.UI.CounterPanel.Item:activate', this);
		}
	}

	deactivate(isEmitEvent: boolean = true)
	{
		this.isActive = false;
		if (!this.parentId)
		{
			Dom.removeClass(this.getContainer(), '--active');
			Dom.removeClass(this.getContainer(), '--hover');
			this.#refreshPressedState();
		}

		if (isEmitEvent)
		{
			EventEmitter.emit('BX.UI.CounterPanel.Item:deactivate', this);
		}
	}

	collapse(): void
	{
		Dom.addClass(this.getContainer(), '--collapsed');
	}

	expand(): void
	{
		Dom.removeClass(this.getContainer(), '--collapsed');
	}

	getSeparator()
	{
		return this.separator;
	}

	#getPanel(): CounterPanel
	{
		return this.panel;
	}

	#getCounter(): Counter
	{
		if (!this.counter)
		{
			this.counter = new Counter(this.getCounterOptions());
		}

		return this.counter;
	}

	getCounterOptions(): Object
	{
		const counterColor = this.color
			? Counter.Color[this.color.toUpperCase()]
			: (this.parentId ? Counter.Color.GRAY : Counter.Color.THEME)
		;

		return {
			color: counterColor,
			value: this.value,
			animation: false,
			useAirDesign: this.#useAirDesign,
			style: this.#getCounterStyleByColor(counterColor),
		};
	}

	getCounterContainer(): ?HTMLElement
	{
		return this.layout.value;
	}

	#getValue(): HTMLElement
	{
		if (!this.layout.value)
		{
			const counterValue = this.isRestricted
				? this.#getLockIcon()
				: this.#getCounter().getContainer();

			this.layout.value = this.#useAirDesign
				? Tag.render`<span class="ui-counter-panel__item-value">${counterValue}</span>`
				: Tag.render`
					<div class="ui-counter-panel__item-value">
						${counterValue}
					</div>
				`;

			Dom.style(this.layout.value, 'order', this.valueOrder);
		}

		return this.layout.value;
	}

	// The lock replaces the counter value, so it carries meaning and needs a text alternative
	#getLockIcon(): HTMLElement
	{
		if (!this.#useAirDesign)
		{
			return Tag.render`<div class="ui-counter-panel__item-lock"></div>`;
		}

		const label = Loc.getMessage('UI_COUNTER_PANEL_ITEM_RESTRICTED');

		return Tag.render`<span class="ui-counter-panel__item-lock" role="img" aria-label="${label}"></span>`;
	}

	#getTitle(): HTMLElement
	{
		if (!this.layout.title)
		{
			this.layout.title = this.#useAirDesign
				? Tag.render`<span class="ui-counter-panel__item-title">${this.title}</span>`
				: Tag.render`
					<div class="ui-counter-panel__item-title">${this.title}</div>
				`;

			Dom.style(this.layout.title, 'order', this.titleOrder);
		}

		return this.layout.title;
	}

	#getCollapsedIcon(): HTMLElement
	{
		const className = `ui-counter-panel__item-collapsed-icon ui-icon-set__scope --icon-${this.#collapsedIcon}`;

		return this.#useAirDesign
			? Tag.render`<span class="${className}" aria-hidden="true"></span>`
			: Tag.render`<div class="${className}"></div>`;
	}

	#getCross(): HTMLElement
	{
		if (!this.layout.cross)
		{
			this.layout.cross = this.#useAirDesign
				? Tag.render`<span class="ui-counter-panel__item-cross" aria-hidden="true"><i></i></span>`
				: Tag.render`
					<div class="ui-counter-panel__item-cross">
						<i></i>
					</div>
				`;
		}

		return this.layout.cross;
	}

	setEvents(container)
	{
		const target = container ?? this.getContainer();

		if (this.eventsForActive)
		{
			const eventKeys = Object.keys(this.eventsForActive);

			for (const event of eventKeys)
			{
				Event.bind(target, event, () => {
					if (this.isActive)
					{
						this.eventsForActive[event]();
					}
				});
			}
		}

		if (this.eventsForUnActive)
		{
			const eventKeys = Object.keys(this.eventsForUnActive);

			for (const event of eventKeys)
			{
				Event.bind(target, event, () => {
					if (!this.isActive)
					{
						this.eventsForUnActive[event]();
					}
				});
			}
		}
	}

	isLocked(): boolean
	{
		return this.locked;
	}

	lock(): void
	{
		this.locked = true;

		Dom.addClass(this.getContainer(), '--locked');
		this.#refreshDisabledState();
		this.#refreshAccessibleName();
	}

	unLock(): void
	{
		this.locked = false;
		Dom.removeClass(this.getContainer(), '--locked');
		this.#refreshDisabledState();
		this.#refreshAccessibleName();
	}

	// Air renders an interactive item as a native button, so unavailability is exposed via the disabled
	// state. The panel's FocusZone observes the attribute and rebuilds the roving set on its own; the
	// panel itself is told about the transition by the event, as only it may move real focus.
	#refreshDisabledState(): void
	{
		if (!this.#useAirDesign || !this.isInteractive())
		{
			return;
		}

		const button = this.getContainer();
		const isDisabled = this.locked || this.isRestricted;
		if (button.disabled === isDisabled)
		{
			return;
		}

		// Read the focus holder BEFORE the flag: afterwards Chrome has already dropped focus to <body>,
		// while Firefox keeps document.activeElement on the unusable button and fires no focusout.
		const hadFocus = document.activeElement === button;

		button.disabled = isDisabled;

		if (isDisabled)
		{
			EventEmitter.emit('BX.UI.CounterPanel.Item:disable', { item: this, hadFocus });
		}
	}

	// Only an item that reacts to a click deserves the button role: a filter with a counter, a menu
	// trigger or an item with consumer events. The rest are plain labels inside the toolbar.
	isInteractive(): boolean
	{
		return this.parent === true
			|| Type.isNumber(this.value)
			|| Object.keys(this.eventsForActive).length > 0
			|| Object.keys(this.eventsForUnActive).length > 0;
	}

	// Mirrors the --active class, but only on truly toggleable filters. The gate matches the toggle-click
	// binding (numeric value, no children, not a parent) so non-interactive titles stay unpressed. A parent
	// item is a menu trigger: its state is aria-expanded, not aria-pressed.
	#refreshPressedState(): void
	{
		if (this.#isToggleFilter())
		{
			Dom.attr(this.getContainer(), 'aria-pressed', this.isActive ? 'true' : 'false');
		}
	}

	#isToggleFilter(): boolean
	{
		return this.#useAirDesign
			&& !this.parentId
			&& !this.parent
			&& Type.isNumber(this.value)
			&& this.items.length === 0;
	}

	// The button name is composed as "title, value" so a screen reader reads the label before the count,
	// regardless of the DOM order of the badge and title nodes. An explicit aria-label overrides the child
	// nodes, so it must carry both the number and, when unavailable, the lock phrase itself.
	#refreshAccessibleName(): void
	{
		if (!this.#useAirDesign || this.parent || !this.layout.container || !this.isInteractive())
		{
			return;
		}

		Dom.attr(this.layout.container, 'aria-label', this.#composeAccessibleName());
	}

	#composeAccessibleName(): string
	{
		const parts = [];

		if (this.title)
		{
			parts.push(String(this.title));
		}

		const valueLabel = this.#getAccessibleValueLabel();
		if (valueLabel)
		{
			parts.push(valueLabel);
		}

		return parts.join(', ');
	}

	#getAccessibleValueLabel(): ?string
	{
		if (!Type.isNumber(this.value) || this.hideValue)
		{
			return null;
		}

		if (this.locked || this.isRestricted)
		{
			return Loc.getMessage('UI_COUNTER_PANEL_ITEM_RESTRICTED');
		}

		return String(this.value);
	}

	getArrowDropdown(): HTMLElement
	{
		if (!this.layout.dropdownArrow)
		{
			this.layout.dropdownArrow = this.#useAirDesign
				? Tag.render`<span class="ui-counter-panel__item-dropdown" aria-hidden="true"><i></i></span>`
				: Tag.render`
					<div class="ui-counter-panel__item-dropdown">
						<i></i>
					</div>
				`;
		}

		return this.layout.dropdownArrow;
	}

	// A non-interactive item stays a plain span: a native button without an action is announced as a
	// button, joins the roving set and adds an empty step to the arrow navigation.
	#renderAirContainer(className: string, isValue: boolean): HTMLElement
	{
		const content = [
			this.#collapsedIcon ? this.#getCollapsedIcon() : '',
			isValue && !this.hideValue ? this.#getValue() : '',
			this.title ? this.#getTitle() : '',
			isValue ? this.#getCross() : '',
		];

		return this.isInteractive()
			? Tag.render`<button type="button" class="${className}">${content}</button>`
			: Tag.render`<span class="${className}">${content}</span>`;
	}

	getContainer(): HTMLElement
	{
		if (!this.layout.container)
		{
			const isValue = Type.isNumber(this.value);

			this.layout.container = this.#buildContainerNode(isValue);
			this.#applyContainerState(isValue);
			this.#bindContainerEvents(isValue);
		}

		return this.layout.container;
	}

	#buildContainerNode(isValue: boolean): HTMLElement
	{
		const type = this.type ? `id="ui-counter-panel-item-${this.type}"` : '';
		const className = `ui-counter-panel__item ${this.#getItemClassModifierByValue(this.value)}`;

		let container = this.#useAirDesign
			? this.#renderAirContainer(className, isValue)
			: Tag.render`
				<div ${type} class="${className}">
					${this.#collapsedIcon ? this.#getCollapsedIcon() : ''}
					${isValue && !this.hideValue ? this.#getValue() : ''}
					${this.title ? this.#getTitle() : ''}
					${isValue ? this.#getCross() : ''}
				</div>
			`;

		// Air replaces the non-unique id: several panels may render the same item type on a page
		if (this.#useAirDesign && this.type)
		{
			Dom.attr(container, 'data-type', this.type);
		}

		if (this.parent)
		{
			container = this.#useAirDesign
				? Tag.render`
					<button type="button" class="ui-counter-panel__item">
						${this.title ? this.#getTitle() : ''}
						${isValue ? this.#getValue() : ''}
						${this.#getCross()}
					</button>
				`
				: Tag.render`
					<div class="ui-counter-panel__item">
						${this.title ? this.#getTitle() : ''}
						${isValue ? this.#getValue() : ''}
						${this.#getCross()}
					</div>
				`;

			Event.bind(this.#getCross(), 'click', (ev) => {
				this.deactivate();
				ev.stopPropagation();
			});

			Dom.addClass(container, '--dropdown');
		}

		return container;
	}

	#applyContainerState(isValue: boolean): void
	{
		const container = this.layout.container;

		if (!isValue)
		{
			Dom.addClass(container, '--string');
		}

		if (!isValue && !this.eventsForActive && !this.eventsForUnActive)
		{
			Dom.addClass(container, '--title');
		}

		if (!this.separator)
		{
			Dom.addClass(container, '--without-separator');
		}

		if (this.locked)
		{
			Dom.addClass(container, '--locked');
		}

		if (this.isActive)
		{
			this.activate();
		}

		if (this.isRestricted)
		{
			Dom.addClass(container, '--restricted');
		}

		if (this.#collapsed)
		{
			this.collapse();
		}

		if (this.locked)
		{
			this.lock();
		}

		this.#refreshDisabledState();
		this.#refreshPressedState();
		this.#refreshAccessibleName();

		this.setEvents(container);
		this.#setElementDataAttributes(container);
	}

	#bindContainerEvents(isValue: boolean): void
	{
		const container = this.layout.container;

		Event.bind(container, 'click', () => {
			EventEmitter.emit('BX.UI.CounterPanel.Item:click', {
				item: this,
			});
		});

		if (isValue && this.items.length === 0 && !this.parent)
		{
			Event.bind(container, 'mouseenter', () => {
				if (!this.isActive)
				{
					Dom.addClass(container, '--hover');
				}
			});

			Event.bind(container, 'mouseleave', () => {
				if (!this.isActive)
				{
					Dom.removeClass(container, '--hover');
				}
			});

			Event.bind(container, 'click', () => {
				if (this.isActive)
				{
					this.deactivate();
				}
				else
				{
					this.activate();
				}
			});
		}

		if (this.parent)
		{
			Dom.append(this.getArrowDropdown(), container);
		}
	}

	setDataAttributes(attributes: Object): void
	{
		this.#dataAttributes = Type.isPlainObject(attributes) || {};
		this.#setElementDataAttributes(this.getContainer());
	}

	#setElementDataAttributes(element?: HTMLElement): void
	{
		if (!element)
		{
			return;
		}

		Object.entries(this.#dataAttributes).forEach(([key, value]) => {
			Dom.attr(element, `data-${key}`, value);
		});
	}

	#getCounterStyleByColor(color: string): string
	{
		if (color === CounterColor.DANGER)
		{
			return CounterStyle.FILLED_ALERT;
		}

		if (color === CounterColor.SUCCESS)
		{
			return CounterStyle.FILLED_SUCCESS;
		}

		return CounterStyle.OUTLINE_NO_ACCENT;
	}

	#getItemClassModifierByValue(value: number): string
	{
		return value === 0 ? this.#getZeroItemClassModifier() : '';
	}

	#getZeroItemClassModifier(): string
	{
		return '--zero';
	}
}
