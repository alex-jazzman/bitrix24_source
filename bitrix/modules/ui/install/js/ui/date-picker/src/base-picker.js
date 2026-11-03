import { Dom, Tag } from 'main.core';
import { MemoryCache, type BaseCache } from 'main.core.cache';
import { EventEmitter } from 'main.core.events';
import { type DatePicker } from './date-picker';

export class BasePicker extends EventEmitter
{
	#datePicker: DatePicker = null;
	#refs: BaseCache<HTMLElement> = new MemoryCache();
	#rendered: boolean = false;

	constructor(datePicker)
	{
		super();
		this.setEventNamespace('BX.UI.DatePicker.BasePicker');

		this.#datePicker = datePicker;
	}

	getContainer(): HTMLElement
	{
		throw new Error('You must implement getContainer method');
	}

	getHeaderContainer(...children: HTMLElement): HTMLElement
	{
		return this.#refs.remember('header', () => {
			return Tag.render`<div class="ui-date-picker-header" role="none">${children}</div>`;
		});
	}

	getContentContainer(...children: HTMLElement): HTMLElement
	{
		return this.#refs.remember('content', () => {
			return Tag.render`<div class="ui-date-picker-content" role="none">${children}</div>`;
		});
	}

	getPrevBtn(): HTMLButtonElement
	{
		return this.#refs.remember('prev-button', () => {
			return Tag.render`
				<button
					type="button"
					class="ui-date-picker-button --left-arrow"
					data-testid="ui-date-picker-prev-btn"
					aria-label="${this.getPrevBtnLabel()}"
					title="${this.getPrevBtnLabel()}"
					onclick="${this.handlePrevBtnClick.bind(this)}"
				>
					<span class="ui-icon-set --chevron-left" aria-hidden="true" style="--ui-icon-set__icon-size: 20px"></span>
				</button>
			`;
		});
	}

	getNextBtn(): HTMLButtonElement
	{
		return this.#refs.remember('next-button', () => {
			return Tag.render`
				<button
					type="button"
					class="ui-date-picker-button --right-arrow"
					data-testid="ui-date-picker-next-btn"
					aria-label="${this.getNextBtnLabel()}"
					title="${this.getNextBtnLabel()}"
					onclick="${this.handleNextBtnClick.bind(this)}"
				>
					<span class="ui-icon-set --chevron-right" aria-hidden="true" style="--ui-icon-set__icon-size: 20px"></span>
				</button>
			`;
		});
	}

	getPrevBtnLabel(): string
	{
		return '';
	}

	getNextBtnLabel(): string
	{
		return '';
	}

	// A navigation button becomes unavailable in the very render its own click causes, and the browser
	// blurs a button it disables. Keeping it focusable and refusing the navigation here keeps the focus.
	setPrevBtnDisabled(disabled: boolean): void
	{
		this.#setBtnDisabled(this.getPrevBtn(), disabled);
	}

	setNextBtnDisabled(disabled: boolean): void
	{
		this.#setBtnDisabled(this.getNextBtn(), disabled);
	}

	handlePrevBtnClick()
	{
		if (this.#isBtnDisabled(this.getPrevBtn()))
		{
			this.#announcePeriodBoundary();

			return;
		}

		this.emit('onPrevBtnClick');
	}

	handleNextBtnClick()
	{
		if (this.#isBtnDisabled(this.getNextBtn()))
		{
			this.#announcePeriodBoundary();

			return;
		}

		this.emit('onNextBtnClick');
	}

	#announcePeriodBoundary(): void
	{
		this.getDatePicker().announcePeriodBoundary();
	}

	#setBtnDisabled(button: HTMLButtonElement, disabled: boolean): void
	{
		const ariaDisabled = disabled ? 'true' : 'false';
		if (button.getAttribute('aria-disabled') !== ariaDisabled)
		{
			button.setAttribute('aria-disabled', ariaDisabled);
		}
	}

	#isBtnDisabled(button: HTMLButtonElement): boolean
	{
		return button.getAttribute('aria-disabled') === 'true';
	}

	render(): void
	{
		throw new Error('You must implement render method');
	}

	onShow(): void
	{
		// you can override this method
	}

	onHide(): void
	{
		// you can override this method
	}

	getDatePicker(): DatePicker
	{
		return this.#datePicker;
	}

	isRendered(): boolean
	{
		return this.#rendered;
	}

	renderTo(container: HTMLElement): void
	{
		Dom.append(this.getContainer(), container);

		this.#rendered = true;
	}
}
