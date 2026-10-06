import { Dom, Tag, Type, Event, Loc } from 'main.core';
import 'ui.design-tokens';
import './style.css';
import { Checker } from '../checker';
import { Widget } from '../widget';

export type ButtonOptions = {
	service: string,
	containerId?: string,
	selector?: string,
	widget: Widget,
};

export class Button
{
	#service: string = null;
	#container: ?HTMLElement = null;
	#selector: string = null;
	#uninitialized: boolean = true;
	#button: ?HTMLElement = null;
	#node: ?HTMLElement = null;
	#widget: Widget;

	constructor(options: ButtonOptions = {})
	{
		this.#service = options.service ?? '';
		this.#widget = options.widget;

		if (Type.isStringFilled(options.selector))
		{
			this.#selector = options.selector;
		}
		else
		{
			this.#container = document.getElementById(options.containerId);
		}
	}

	init(): void
	{
		if (this.#isBindMode())
		{
			this.#initBind();

			return;
		}

		if (this.#uninitialized && this.#checkServiceAvailability())
		{
			this.#uninitialized = false;
			if (this.#renderTo())
			{
				this.#bindEvent();
			}
		}
	}

	showWidget(): void
	{
		this.#widget.bindTo(this.#getTarget());
		this.#widget.show();
	}

	setOverlayToWidget(): void
	{
		this.#widget.setOverlay();
	}

	#isBindMode(): boolean
	{
		return this.#selector !== null;
	}

	#initBind(): void
	{
		if (!this.#uninitialized)
		{
			return;
		}

		const node = document.querySelector(this.#selector);
		if (!Type.isElementNode(node))
		{
			return;
		}

		this.#uninitialized = false;

		if (this.#checkServiceAvailability())
		{
			this.#node = node;
			Dom.prepend(Tag.render`<span class="ui-icon-set --s-rocket" aria-hidden="true"></span>`, node);
			Event.bind(node, 'click', this.#click.bind(this));
		}
		else
		{
			Dom.remove(node);
		}
	}

	#checkServiceAvailability(): boolean
	{
		return Checker.isServiceAvailable(this.#service);
	}

	#renderTo(): boolean
	{
		if (!Type.isElementNode(this.#container))
		{
			console.error('Disk: BoostButton: Container for service does not exist!');
		}

		Dom.append(this.#getButton(), this.#container);

		return true;
	}

	#bindEvent(): void
	{
		Event.bind(this.#getButton(), 'click', this.#click.bind(this));
	}

	#click(): void
	{
		this.#widget.bindTo(this.#getTarget());
		this.#widget.show();
	}

	#getTarget(): HTMLElement
	{
		return this.#isBindMode() ? this.#node : this.#getButton();
	}

	#getButton(): HTMLElement
	{
		if (!this.#button)
		{
			// noinspection JSAnnotator
			const text: string = Loc.getMessage('DISK_PROMO_BOOST_BUTTON_TEXT');
			this.#button = Tag.render`<button class="bx-disk-promo-boost-button"><span>${text}</span></button>`;
		}

		return this.#button;
	}
}
