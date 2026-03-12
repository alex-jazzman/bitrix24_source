import { Dom, Tag, Type, Event, Loc } from 'main.core';
import 'ui.design-tokens';
import './style.css';
import { Checker } from '../checker';
import { Widget } from '../widget';

export type ButtonOptions = {
	service: string,
	containerId: string,
	widget: Widget,
};

export class Button
{
	#service: string = null;
	#container: ?HTMLElement = null;
	#uninitialized: boolean = true;
	#button: ?HTMLElement = null;
	#widget: Widget;

	constructor(options: ButtonOptions = {})
	{
		this.#service = options.service ?? '';
		this.#container = document.getElementById(options.containerId);
		this.#widget = options.widget;
	}

	init(): void
	{
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
		this.#widget.bindTo(this.#getButton());
		this.#widget.show();
	}

	setOverlayToWidget(): void
	{
		this.#widget.setOverlay();
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
		this.#widget.bindTo(this.#getButton());
		this.#widget.show();
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
