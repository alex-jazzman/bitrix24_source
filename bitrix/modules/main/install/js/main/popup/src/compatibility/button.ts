import { Type, Dom } from 'main.core';
import { type Popup } from '../popup/popup';

export type ButtonEvents = { [event: string]: (event: Event) => void };

export type ButtonOptions = {
	id?: string;
	text?: string;
	className?: string;
	events?: ButtonEvents;
};

/**
 * @memberOf BX.Main.Popup
 * @deprecated use BX.UI.Button
 */
export class Button
{
	// `declare` below: the field is assigned unconditionally while constructing, so
	// emitting a slot for it only adds a redundant write to the bundle.
	declare popupWindow: Popup | null;
	declare params: ButtonOptions;
	declare text: string;
	declare id: string;
	declare className: string;
	declare events: ButtonEvents;
	declare contextEvents: ButtonEvents;
	declare buttonNode: HTMLElement;

	constructor(params: ButtonOptions)
	{
		this.popupWindow = null;

		this.params = params || {};

		this.text = this.params.text || '';
		this.id = this.params.id || '';
		this.className = this.params.className || '';
		this.events = this.params.events || {};

		this.contextEvents = {};
		for (const eventName of Object.keys(this.events))
		{
			if (Type.isFunction(this.events[eventName]))
			{
				this.contextEvents[eventName] = this.events[eventName].bind(this);
			}
		}

		const customClassName = this.className.length > 0 ? ` ${this.className}` : '';
		this.buttonNode = Dom.create('button', {
			props: {
				className: `popup-window-button${customClassName}`,
				id: this.id,
			},
			attrs: {
				tabindex: '0',
				type: 'button',
			},
			events: this.contextEvents,
			text: this.text,
		});
	}

	render(): Element
	{
		return this.buttonNode;
	}

	getId(): string
	{
		return this.id;
	}

	getContainer(): Element
	{
		return this.buttonNode;
	}

	getName(): string
	{
		return this.text;
	}

	setName(name: string): void
	{
		this.text = name || '';
		if (this.buttonNode)
		{
			Dom.clean(this.buttonNode);
			Dom.adjust(this.buttonNode, { text: this.text });
		}
	}

	setClassName(className: string): void
	{
		if (this.buttonNode)
		{
			if (Type.isString(this.className) && this.className !== '')
			{
				Dom.removeClass(this.buttonNode, this.className);
			}

			Dom.addClass(this.buttonNode, className);
		}

		this.className = className;
	}

	addClassName(className: string): void
	{
		if (this.buttonNode)
		{
			Dom.addClass(this.buttonNode, className);
			this.className = this.buttonNode.className;
		}
	}

	removeClassName(className: string): void
	{
		if (this.buttonNode)
		{
			Dom.removeClass(this.buttonNode, className);
			this.className = this.buttonNode.className;
		}
	}
}
