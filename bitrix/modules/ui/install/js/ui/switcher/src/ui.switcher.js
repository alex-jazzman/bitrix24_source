import { bind, Dom, Loc, onCustomEvent, Tag, Type } from 'main.core';
import { BaseEvent } from 'main.core.events';
import 'ui.design-tokens';
import 'ui.design-tokens.air';

import { AirSwitcherStyle } from './air-switcher-style';
import './css/style.css';
import './css/air.css';

/*
* extraLarge, large, extraExtraSmall options supported only by the air button
* */
export const SwitcherSize = Object.freeze({
	extraLarge: 'extra-large',
	large: 'large',
	medium: 'medium',
	small: 'small',
	extraSmall: 'extra-small',
	extraExtraSmall: 'extra-extra-small',
});

export const SwitcherColor = Object.freeze({
	primary: 'primary',
	green: 'green',
});

export { AirSwitcherStyle } from './air-switcher-style';

export type SwitcherOptions = {
	attributeName: string;
	node: HTMLElement;
	id: string;
	checked: boolean;
	inputName: string;
	handlers: Object;
	size: string;
	color: string;
	disabled: boolean;
	useAirDesign: boolean;
	style: AirSwitcherStyle;
	showStateTitle?: boolean;
}

export class Switcher
{
	#classNameSize = {
		[SwitcherSize.extraExtraSmall]: 'ui-switcher-size-xss',
		[SwitcherSize.extraSmall]: 'ui-switcher-size-xs',
		[SwitcherSize.small]: 'ui-switcher-size-sm',
		[SwitcherSize.medium]: 'ui-switcher-size-md',
		[SwitcherSize.large]: 'ui-switcher-size-lg',
		[SwitcherSize.extraLarge]: 'ui-switcher-size-xl',
	};

	#classNameColor = {
		[SwitcherColor.primary]: '',
		[SwitcherColor.green]: 'ui-switcher-color-green',
	};

	#classNameStyle = {
		[AirSwitcherStyle.SOLID]: '--style-solid',
		[AirSwitcherStyle.TINTED]: '--style-tinted',
	};

	#useAirDesign: boolean = false;

	node: HTMLElement | null = null;
	checked: boolean = false;
	id: string = '';
	#disabled: boolean = false;
	#inputName: string = '';
	#loading: boolean;
	events: Object;
	#classNameOff: string = 'ui-switcher-off';
	#classNameLock: string = 'ui-switcher-lock';
	#attributeName: string = 'data-switcher';
	#showStateTitle: boolean = true;

	static #attributeInitName: string = 'data-switcher-init';
	static list = [];
	static className = 'ui-switcher';
	static classNameOff = 'ui-switcher-off';

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
	constructor(options: SwitcherOptions)
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
		Array.from(nodes).forEach(function(node) {
			if (node.getAttribute(Switcher.#attributeInitName))
			{
				return;
			}
			new Switcher({ node: node });
		});
	}

	static getList(): Switcher[]
	{
		return Switcher.list;
	}

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

		if (options.node)
		{
			if (!Type.isDomNode(options.node))
			{
				throw new Error('Parameter `node` DOM Node expected.');
			}

			this.node = options.node;
			let data = this.node.getAttribute(this.#attributeName);
			try
			{
				data = JSON.parse(data) || {};
			}
			catch (e)
			{
				data = {};
			}

			if (data.id)
			{
				this.id = data.id;
			}

			this.checked = Boolean(data.checked);

			this.#inputName = data.inputName;
			if (Type.isString(data.color) && Object.values(SwitcherColor).includes(data.color))
			{
				options.color = data.color;
			}
			if (Type.isString(data.size) && Object.values(SwitcherSize).includes(data.size))
			{
				options.size = data.size;
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
			Dom.addClass(this.node, this.#classNameStyle[options.style] ?? '');
		}

		if (this.#classNameSize[options.size])
		{
			Dom.addClass(this.node, this.#classNameSize[options.size]);
		}

		if (this.#classNameColor[options.color] && this.#useAirDesign === false)
		{
			Dom.addClass(this.node, this.#classNameColor[options.color]);
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

		this.#initNode();
		this.check(this.checked, false);
		this.disable(this.#disabled, false);
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

		bind(this.node, 'click', this.toggle.bind(this));
	}

	disable(disabled: boolean, fireEvents: boolean = true, event: BaseEvent = {}): void
	{
		if (this.isLoading())
		{
			return;
		}

		this.#disabled = disabled;

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

	check(checked: boolean, fireEvents: boolean = true, event: BaseEvent = {}): void
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

	isDisabled()
	{
		return this.#disabled;
	}

	isChecked(): boolean
	{
		return this.checked;
	}

	toggle(event: BaseEvent): void
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

		const cursor = this.getNode().querySelector('.ui-switcher-cursor');

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
			cursor.innerHTML = '';
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

	#fireEvent(eventName: string, event: BaseEvent): void
	{
		onCustomEvent(this, eventName);
		if (this.handlers[eventName])
		{
			this.handlers[eventName].call(this, event);
		}
	}

	renderTo(targetNode: HTMLElement): HTMLElement
	{
		if (!Type.isDomNode(targetNode))
		{
			throw new Error('Target node must be HTMLElement');
		}

		return Dom.append(this.getNode(), targetNode);
	}

	getNode(): HTMLElement
	{
		return this.node;
	}

	getAttributeName(): string
	{
		return this.#attributeName;
	}

	getInputName(): string
	{
		return this.#inputName;
	}
}
