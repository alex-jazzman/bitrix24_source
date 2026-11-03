import { bind, Dom, Loc, onCustomEvent, Tag, Type, unbind } from 'main.core';
import 'ui.design-tokens';
import 'ui.design-tokens.air';

import { AirSwitcherStyle, SwitcherColor, SwitcherSize } from './const';
import {
	type SwitcherEvent,
	type SwitcherEventName,
	type SwitcherHandlers,
	type SwitcherNodeData,
	type SwitcherOptions,
} from './types';

export class Switcher
{
	#classNameSize: Record<string, string> = {
		[SwitcherSize.extraExtraSmall]: 'ui-switcher-size-xss',
		[SwitcherSize.extraSmall]: 'ui-switcher-size-xs',
		[SwitcherSize.small]: 'ui-switcher-size-sm',
		[SwitcherSize.medium]: 'ui-switcher-size-md',
		[SwitcherSize.large]: 'ui-switcher-size-lg',
		[SwitcherSize.extraLarge]: 'ui-switcher-size-xl',
	};

	#classNameColor: Record<string, string> = {
		[SwitcherColor.primary]: '',
		[SwitcherColor.green]: 'ui-switcher-color-green',
	};

	#classNameStyle: Record<string, string> = {
		[AirSwitcherStyle.FILLED]: '--style-filled',
		[AirSwitcherStyle.SOLID]: '--style-filled',
		[AirSwitcherStyle.TINTED]: '--style-tinted',
		[AirSwitcherStyle.FILLED_SUCCESS]: '--style-filled-success',
		[AirSwitcherStyle.FILLED_ALERT]: '--style-filled-alert',
		[AirSwitcherStyle.FILLED_WARNING]: '--style-filled-warning',
		[AirSwitcherStyle.FILLED_BLACK]: '--style-filled-black',
		[AirSwitcherStyle.FILLED_WHITE]: '--style-filled-white',
		[AirSwitcherStyle.FILLED_NO_ACCENT]: '--style-filled-na',
		[AirSwitcherStyle.FILLED_BITRIX_GPT]: '--style-filled-bitrix-gpt',
		[AirSwitcherStyle.FILLED_BOOST]: '--style-filled-boost',
		[AirSwitcherStyle.TINTED_ACCENT_1]: '--style-tinted-a1',
		[AirSwitcherStyle.TINTED_SUCCESS]: '--style-tinted-success',
		[AirSwitcherStyle.TINTED_ALERT]: '--style-tinted-alert',
		[AirSwitcherStyle.TINTED_WARNING]: '--style-tinted-warning',
		[AirSwitcherStyle.TINTED_GREEN]: '--style-tinted-green',
		[AirSwitcherStyle.TINTED_VIOLET]: '--style-tinted-violet',
		[AirSwitcherStyle.TINTED_NO_ACCENT]: '--style-tinted-na',
		[AirSwitcherStyle.TINTED_BITRIX_GPT]: '--style-tinted-bitrix-gpt',
		[AirSwitcherStyle.OUTLINE]: '--style-outline',
		[AirSwitcherStyle.OUTLINE_ACCENT_1]: '--style-outline-a1',
		[AirSwitcherStyle.OUTLINE_ACCENT_2]: '--style-outline-a2',
		[AirSwitcherStyle.OUTLINE_ALERT]: '--style-outline-alert',
		[AirSwitcherStyle.OUTLINE_BOOST]: '--style-outline-boost',
		[AirSwitcherStyle.OUTLINE_NO_ACCENT]: '--style-outline-na',
		[AirSwitcherStyle.OUTLINE_SUCCESS]: '--style-outline-success',
		[AirSwitcherStyle.OUTLINE_WARNING]: '--style-outline-warning',
		[AirSwitcherStyle.OUTLINE_BITRIX_GPT]: '--style-outline-bitrix-gpt',
		[AirSwitcherStyle.SELECTION]: '--style-selection',
	};

	#useAirDesign: boolean = false;

	// Assigned by init() from the constructor, so it is a node for every observable state of the
	// instance. Kept as HTMLElement to keep getNode() narrow, see the comment there.
	node!: HTMLElement;
	checked: boolean = false;
	// `string | number`: numeric ids come from templates and the fallback is Math.random().
	id: string | number = '';
	handlers: SwitcherHandlers = {};
	// Created only when an input name is given, so consumers may legitimately find it missing.
	inputNode?: HTMLInputElement;
	#disabled: boolean = false;
	// `string | undefined`: init() assigns data.inputName from the attribute without a type check,
	// unlike the neighbouring fields. Narrowing the type would be a lie about the runtime.
	#inputName: string | undefined = '';
	#loading: boolean = false;
	events: Record<SwitcherEventName, SwitcherEventName> = {
		toggled: 'toggled',
		checked: 'checked',
		unchecked: 'unchecked',
		lock: 'lock',
		unlock: 'unlock',
	};

	#classNameOff: string = 'ui-switcher-off';
	#classNameLock: string = 'ui-switcher-lock';
	#attributeName: string = 'data-switcher';
	#showStateTitle: boolean = true;
	#accessible: boolean = false;
	// The node this instance gave the semantics to, not a flag: init() can be handed another node,
	// and a bare boolean would then read as "done" for a node that never got the role.
	#semanticsNode: HTMLElement | null = null;
	#ariaLabel: string = '';
	#ariaLabelledBy: string = '';
	#clickHandler: ((event: SwitcherEvent) => void) | null = null;
	#keydownHandler: ((event: KeyboardEvent) => void) | null = null;

	static #attributeInitName: string = 'data-switcher-init';
	static list: Switcher[] = [];
	static className: string = 'ui-switcher';
	static classNameOff: string = 'ui-switcher-off';

	/**
	 * Switcher.
	 *
	 * @param {object} [options] - Options.
	 * @param {string} [options.attributeName] - Name of switcher attribute.
	 * @param {Element} [options.node] - Node.
	 * @param {string} [options.id] - ID.
	 * @param {123} [options.checked] - Checked.
	 * @param {string} [options.inputName] - Input name.
	 * @constructor
	 */
	constructor(options?: SwitcherOptions)
	{
		this.init(options);
		Switcher.list.push(this);
	}

	static getById(id: string | number): Switcher | null
	{
		return Switcher.list.find((item) => item.id === id) || null;
	}

	static initByClassName(): void
	{
		const nodes = document.getElementsByClassName(Switcher.className);
		[...nodes].forEach((node) => {
			if (node.getAttribute(Switcher.#attributeInitName))
			{
				return;
			}
			new Switcher({ node: node as HTMLElement });
		});
	}

	static getList(): Switcher[]
	{
		return Switcher.list;
	}

	// `options` is written to, not just read: a valid size/color from the node attribute is stored
	// back into it below, and that precedence is part of the contract. Do not make it Readonly.
	init(options: SwitcherOptions = {}): void
	{
		this.#attributeName = Type.isString(options.attributeName) ? options.attributeName : this.#attributeName;
		this.handlers = Type.isPlainObject(options.handlers) ? options.handlers : {};
		this.#inputName = Type.isString(options.inputName) ? options.inputName : '';
		this.#loading = false;
		this.#showStateTitle = Type.isBoolean(options.showStateTitle) ? options.showStateTitle : true;
		this.events = {
			toggled: 'toggled',
			checked: 'checked',
			unchecked: 'unchecked',
			lock: 'lock',
			unlock: 'unlock',
		};

		let accessibleFromNode = false;

		if (options.node)
		{
			if (!Type.isDomNode(options.node))
			{
				throw new Error('Parameter `node` DOM Node expected.');
			}

			// Only a real swap: the previous node has to let go of our role, tab stop and keyboard,
			// or it keeps them for good. Re-init on the very same node keeps what it has.
			if (this.#semanticsNode !== null && this.#semanticsNode !== options.node)
			{
				this.#clearAccessibility(this.#semanticsNode);
			}

			this.node = options.node;
			const attributeValue = this.node.getAttribute(this.#attributeName);
			let data: SwitcherNodeData = {};
			try
			{
				data = JSON.parse(attributeValue ?? '') || {};
			}
			catch
			{
				data = {};
			}

			if (data.id)
			{
				this.id = data.id;
			}

			this.checked = Boolean(data.checked);

			this.#inputName = data.inputName;
			// The runtime membership check is the type guard here: the values arrive from PHP as
			// plain strings, so the cast only tells the compiler what the check already proved.
			if (Type.isString(data.color) && Object.values<string>(SwitcherColor).includes(data.color))
			{
				options.color = data.color as SwitcherColor;
			}

			if (Type.isString(data.size) && Object.values<string>(SwitcherSize).includes(data.size))
			{
				options.size = data.size as SwitcherSize;
			}

			// Strict `=== true`: the attribute carries unvalidated JSON, and "true" or 1 must not
			// turn the semantics on.
			accessibleFromNode = data.accessible === true;

			if (Type.isString(data.ariaLabel) && data.ariaLabel.trim() !== '')
			{
				this.#ariaLabel = data.ariaLabel.trim();
			}

			if (Type.isString(data.ariaLabelledBy) && data.ariaLabelledBy.trim() !== '')
			{
				this.#ariaLabelledBy = data.ariaLabelledBy.trim();
			}

			if (Dom.hasClass(this.node, '--air'))
			{
				options.useAirDesign = true;
			}
		}
		else
		{
			this.node = document.createElement('span');
		}

		this.#useAirDesign = options.useAirDesign === true;

		if (this.#useAirDesign)
		{
			this.setAirDesign();
			this.#applyLookClassName(this.#classNameStyle, options.style ?? '');
		}

		this.#applyLookClassName(this.#classNameSize, options.size ?? '');

		if (this.#useAirDesign === false)
		{
			this.#applyLookClassName(this.#classNameColor, options.color ?? '');
		}

		if (Type.isString(options.id) || Type.isNumber(options.id))
		{
			this.id = options.id;
		}
		else if (!this.id)
		{
			this.id = Math.random();
		}

		if (Type.isString(options.inputName))
		{
			this.#inputName = options.inputName;
		}
		this.checked = Type.isBoolean(options.checked) ? options.checked : this.checked;
		this.#disabled = Type.isBoolean(options.disabled) ? options.disabled : this.#disabled;

		// Trimmed like the setters do: a blank is no accessible name, whichever way it arrives.
		if (Type.isString(options.ariaLabel) && options.ariaLabel.trim() !== '')
		{
			this.#ariaLabel = options.ariaLabel.trim();
		}

		if (Type.isString(options.ariaLabelledBy) && options.ariaLabelledBy.trim() !== '')
		{
			this.#ariaLabelledBy = options.ariaLabelledBy.trim();
		}

		// A re-init without `accessible` keeps the semantics that were already turned on:
		// templates call init() with a partial set of options and must not silently drop them.
		const accessibleRequested = options.accessible === true || accessibleFromNode || this.#accessible;
		this.#accessible = this.#resolveAccessible(accessibleRequested);

		this.#initNode();
		this.#applyAccessibility();
		this.check(this.checked, false);
		this.disable(this.#disabled, false);
	}

	/**
	 * One dimension of the look is one class of a dictionary, so the previous one comes off: init() can
	 * be called again on a live node - the node is kept and #initNode() leaves early - and two classes
	 * of the same dictionary would leave the order of air.css to decide the look. Only a class this call
	 * resolved takes anything off: a node can arrive from markup wearing a class the options never
	 * named, and there is nothing to put it back from. A dictionary may map a known value onto no class
	 * at all, as SwitcherColor.primary does, and such an entry takes part in neither step.
	 */
	#applyLookClassName(dictionary: Record<string, string>, value: string): void
	{
		const className = dictionary[value];
		if (!className)
		{
			return;
		}

		Dom.removeClass(this.node, Object.values(dictionary).filter(Boolean));
		Dom.addClass(this.node, className);
	}

	#initNode(): void
	{
		if (this.node.getAttribute(Switcher.#attributeInitName))
		{
			return;
		}
		this.node.setAttribute(Switcher.#attributeInitName, 'y');

		Dom.addClass(this.node, Switcher.className);

		if (this.#useAirDesign)
		{
			this.setAirDesign();
		}

		const element = Tag.render`
			<div>
				<span class="ui-switcher-cursor"></span>
				<span class="ui-switcher-enabled">
					${this.#showStateTitle ? Loc.getMessage('UI_SWITCHER_ON') : ''}
				</span>
				<span class="ui-switcher-disabled">
					${this.#showStateTitle ? Loc.getMessage('UI_SWITCHER_OFF') : ''}
				</span>
			</div>
		`;

		this.node.innerHTML = element.innerHTML;

		if (this.#inputName)
		{
			this.inputNode = Tag.render`
				<input type="hidden" name="${this.#inputName}" />
			`;

			Dom.append(this.inputNode, this.node);
		}

		this.#clickHandler = this.toggle.bind(this);
		bind(this.node, 'click', this.#clickHandler);
	}

	/**
	 * Releases the instance. Every switcher is kept in the static list, so an owner that drops
	 * the node has to call this or the node and the handler closures stay reachable through it.
	 * Idempotent: a second call does nothing.
	 */
	destroy(): void
	{
		const index = Switcher.list.indexOf(this);
		if (index !== -1)
		{
			Switcher.list.splice(index, 1);
		}

		if (this.#clickHandler)
		{
			unbind(this.node, 'click', this.#clickHandler);
			this.#clickHandler = null;
		}

		// Nulling the field is what lets a reused node get its keydown back: #applyAccessibility()
		// binds only while the field is empty.
		if (this.#keydownHandler)
		{
			unbind(this.node, 'keydown', this.#keydownHandler);
			this.#keydownHandler = null;
		}

		this.#clearAccessibility(this.node);

		this.#loading = false;
		this.#accessible = false;

		// The init mark is what makes #initNode() a no-op, so it has to go together with the
		// handler: without it a node reused by a new instance would never get its click back.
		this.node?.removeAttribute(Switcher.#attributeInitName);

		this.handlers = {};
	}

	disable(disabled: boolean, fireEvents: boolean = true, event: SwitcherEvent = {}): void
	{
		if (this.isLoading())
		{
			return;
		}

		this.#disabled = disabled;

		// tabindex stays 0: the node is a <span>, so aria-disabled is the only way to announce
		// the lock, and dropping the tab stop would hide the state from keyboard users.
		if (this.#accessible)
		{
			Dom.attr(this.node, 'aria-disabled', String(disabled));
		}

		fireEvents = fireEvents !== false;

		if (disabled)
		{
			Dom.addClass(this.node, this.#classNameLock);
			fireEvents ? this.#fireEvent(this.events.lock, event) : null;
		}
		else
		{
			Dom.removeClass(this.node, this.#classNameLock);
			fireEvents ? this.#fireEvent(this.events.unlock, event) : null;
		}
	}

	check(checked: boolean, fireEvents: boolean = true, event: SwitcherEvent = {}): void
	{
		if (this.isLoading())
		{
			return;
		}

		this.checked = !!checked;
		if (this.inputNode)
		{
			this.inputNode.value = this.checked ? 'Y' : 'N';
		}

		if (this.#accessible)
		{
			Dom.attr(this.node, 'aria-checked', String(this.checked));
		}

		fireEvents = fireEvents !== false;

		if (this.checked)
		{
			Dom.removeClass(this.node, this.#classNameOff);
			fireEvents ? this.#fireEvent(this.events.unchecked, event) : null;
		}
		else
		{
			Dom.addClass(this.node, this.#classNameOff);
			fireEvents ? this.#fireEvent(this.events.checked, event) : null;
		}

		if (fireEvents)
		{
			this.#fireEvent(this.events.toggled, event);
		}
	}

	isDisabled(): boolean
	{
		return this.#disabled;
	}

	isChecked(): boolean
	{
		return this.checked;
	}

	toggle(event?: SwitcherEvent): void
	{
		if (this.isDisabled())
		{
			return;
		}

		this.check(!this.isChecked(), true, event);
	}

	setLoading(mode: boolean): void
	{
		this.#loading = Boolean(mode);

		if (this.#accessible)
		{
			Dom.attr(this.node, 'aria-busy', String(this.#loading));
		}

		const cursor = this.getNode().querySelector<HTMLElement>('.ui-switcher-cursor');

		if (this.#loading)
		{
			const svg = Tag.render`
				<svg viewBox="25 25 50 50">
					<circle
						class="ui-sidepanel-wrapper-loader-path"
						cx="50"
						cy="50"
						r="19"
						fill="none"
						stroke-width="5"
						stroke-miterlimit="10"
					>
					</circle>
				</svg>
			`;
			Dom.append(svg, cursor);
		}
		else
		{
			// Non-null on purpose: #initNode() always renders the cursor, and a throw on a node
			// without it is the current behaviour. An optional call here would swallow it.
			cursor!.innerHTML = '';
		}
	}

	isLoading(): boolean
	{
		return this.#loading;
	}

	setAirDesign(flag: boolean = true): void
	{
		if (flag)
		{
			Dom.addClass(this.node, '--air');
		}
		else
		{
			Dom.removeClass(this.node, '--air');
		}
	}

	// The single place that turns the semantics on. Called from init() after #initNode(), which
	// rebuilds the children through innerHTML, and from the name setters, which have to reach an
	// already initialized node.
	#applyAccessibility(): void
	{
		if (!this.#accessible)
		{
			return;
		}

		this.#applyAccessibleName();

		// Before the early return, like the name: init() resets #loading, so a node that kept
		// aria-busy from an earlier load would go on announcing it while already accepting input.
		Dom.attr(this.node, 'aria-busy', String(this.#loading));

		// Idempotent by what this instance applied, not by the role being on the node: a node can
		// already carry `role="switch"` written by the consumer itself, and reading that as "done"
		// would leave the control half-done - named, but without a tab stop or a keyboard.
		if (this.#semanticsNode === this.node)
		{
			return;
		}

		this.#semanticsNode = this.node;

		Dom.attr(this.node, 'role', 'switch');
		Dom.attr(this.node, 'tabindex', '0');
		Dom.attr(this.node, 'aria-checked', String(this.checked));

		// role="switch" takes its name from the content, so without this the name would become
		// the visual "on off" labels instead of the one the consumer passed.
		[...this.node.children].forEach((child) => {
			Dom.attr(child as HTMLElement, 'aria-hidden', 'true');
		});

		if (this.#keydownHandler === null)
		{
			this.#keydownHandler = this.#handleKeydown.bind(this);
			bind(this.node, 'keydown', this.#keydownHandler);
		}
	}

	// Only what this instance set: a consumer that spells the switch semantics out on the node
	// itself keeps its own attributes, and clearing them would strip a working control.
	#clearAccessibility(node: HTMLElement | null): void
	{
		if (!node || this.#semanticsNode !== node)
		{
			return;
		}

		if (this.#keydownHandler)
		{
			unbind(node, 'keydown', this.#keydownHandler);
			this.#keydownHandler = null;
		}

		['role', 'tabindex', 'aria-checked', 'aria-disabled', 'aria-busy', 'aria-label', 'aria-labelledby']
			.forEach((name) => {
				Dom.attr(node, name, null);
			});

		[...node.children].forEach((child) => {
			Dom.attr(child as HTMLElement, 'aria-hidden', null);
		});

		this.#semanticsNode = null;
	}

	#applyAccessibleName(): void
	{
		// A null value is how main.core's Dom.attr() removes an attribute.
		Dom.attr(this.node, 'aria-labelledby', this.#ariaLabelledBy === '' ? null : this.#ariaLabelledBy);
		Dom.attr(this.node, 'aria-label', this.#ariaLabel === '' ? null : this.#ariaLabel);
	}

	#handleKeydown(event: KeyboardEvent): void
	{
		// 'Spacebar' is the legacy key name still reported by older IE-era engines.
		if (event.key !== ' ' && event.key !== 'Spacebar' && event.key !== 'Enter')
		{
			return;
		}

		// A locked control keeps its tab stop but not the keys: swallowing them there would take
		// away the page scrolling of Space without toggling anything.
		if (this.isDisabled() || this.isLoading())
		{
			return;
		}

		// Space scrolls the page by default, and Enter may submit the surrounding form.
		event.preventDefault();
		this.toggle(event);
	}

	// Refuses to empty the last remaining name while the semantics are on: role="switch" without
	// an accessible name is an axe violation, so the previous name is kept instead.
	#canDropName(other: string): boolean
	{
		if (!this.#accessible || other.trim() !== '')
		{
			return true;
		}

		// eslint-disable-next-line no-console -- a misconfiguration the developer has to see
		console.warn('ui.switcher: `ariaLabel` or `ariaLabelledBy` is required while accessible, name kept');

		return false;
	}

	// A warning, not a throw: the constructor runs inside consumers' render code, so a throw here
	// would take down the whole screen instead of one control.
	#resolveAccessible(requested: boolean): boolean
	{
		if (!requested)
		{
			return false;
		}

		if (this.#ariaLabel.trim() === '' && this.#ariaLabelledBy.trim() === '')
		{
			// eslint-disable-next-line no-console -- a misconfiguration the developer has to see
			console.warn('ui.switcher: `accessible` needs `ariaLabel` or `ariaLabelledBy`, semantics not applied');

			return false;
		}

		return true;
	}

	#fireEvent(eventName: SwitcherEventName, event: SwitcherEvent): void
	{
		onCustomEvent(this, eventName);
		if (this.handlers[eventName])
		{
			this.handlers[eventName].call(this, event);
		}
	}

	// Returns void, not the node: Dom.append() itself returns nothing (main.core), and the old
	// annotation promised a node it never produced. Adding a return would change behaviour.
	renderTo(targetNode: HTMLElement): void
	{
		if (!Type.isDomNode(targetNode))
		{
			throw new Error('Target node must be HTMLElement');
		}

		Dom.append(this.getNode(), targetNode);
	}

	// Stays HTMLElement on purpose. The node always exists after init(), and widening to
	// `HTMLElement | null` would force a null check on every external call site.
	getNode(): HTMLElement
	{
		return this.node;
	}

	getAttributeName(): string
	{
		return this.#attributeName;
	}

	// `string | undefined`: mirrors #inputName, which init() may leave undefined (see the field).
	getInputName(): string | undefined
	{
		return this.#inputName;
	}

	setAriaLabel(value: string): void
	{
		// Trimmed on the way in: #resolveAccessible() reads blanks as no name at all, so storing
		// them would let a blank pass as an accessible name here.
		const next = Type.isString(value) ? value.trim() : '';
		if (next === '' && !this.#canDropName(this.#ariaLabelledBy))
		{
			return;
		}

		this.#ariaLabel = next;
		this.#applyAccessibility();
	}

	getAriaLabel(): string
	{
		return this.#ariaLabel;
	}

	setAriaLabelledBy(value: string): void
	{
		const next = Type.isString(value) ? value.trim() : '';
		if (next === '' && !this.#canDropName(this.#ariaLabel))
		{
			return;
		}

		this.#ariaLabelledBy = next;
		this.#applyAccessibility();
	}

	getAriaLabelledBy(): string
	{
		return this.#ariaLabelledBy;
	}
}
