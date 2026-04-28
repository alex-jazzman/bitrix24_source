import { Event, Dom } from 'main.core';
import type { GoTopButton } from './go-top-button';

export type BackgroundStyle = {
	backgroundColor: string;
	backgroundImage: string;
	backgroundPosition: string;
	backgroundRepeat: string;
	backgroundSize: string;
};

export type RightBarOptions = {
	goTopButton: GoTopButton;
};

export class RightBar
{
	#isScrollMode: boolean = false;
	#scrollModeThreshold: number = window.innerHeight;
	#goTopButton: GoTopButton;

	constructor(options: RightBarOptions)
	{
		const redraw = this.redraw.bind(this);
		Event.bind(window, 'scroll', redraw, { passive: true });
		Event.bind(window, 'resize', redraw);
		this.#scrollModeThreshold = window.innerHeight;
		this.#goTopButton = options.goTopButton;

		this.#goTopButton.subscribe('show', () => {
			Dom.addClass(this.getContainer(), '--show-scroll-btn');
		});

		this.#goTopButton.subscribe('hide', () => {
			Dom.removeClass(this.getContainer(), '--show-scroll-btn');
		});

		Event.ready(() => {
			this.redraw();
		});
	}

	redraw(): void
	{
		const rightBar = this.getContainer();

		this.#scrollModeThreshold = window.innerHeight;

		if (window.pageYOffset > this.#scrollModeThreshold)
		{
			if (!this.#isScrollMode)
			{
				Dom.addClass(rightBar, '--scroll-mode');
				this.#isScrollMode = true;
			}
		}
		else if (this.#isScrollMode)
		{
			Dom.removeClass(rightBar, '--scroll-mode');
			this.#isScrollMode = false;
		}
	}

	getContainer(): HTMLElement
	{
		return document.getElementById('right-bar');
	}

	show(): void
	{
		Dom.removeClass(this.getContainer(), '--hidden');
	}

	hide(): void
	{
		Dom.addClass(this.getContainer(), '--hidden');
	}

	isVisible(): boolean
	{
		return !Dom.hasClass(this.getContainer(), '--hidden');
	}

	setBackground(background: BackgroundStyle): void
	{
		Dom.style(this.getContainer(), {
			backgroundImage: background?.backgroundImage ?? null,
			backgroundColor: background?.backgroundColor ?? null,
			backgroundPosition: background?.backgroundPosition ?? null,
			backgroundRepeat: background?.backgroundRepeat ?? null,
			backgroundSize: background?.backgroundSize ?? null,
		});
	}

	resetBackground(): void
	{
		Dom.style(this.getContainer(), {
			backgroundImage: null,
			backgroundColor: null,
			backgroundRepeat: null,
			backgroundSize: null,
			backgroundPosition: null,
		});
	}
}
