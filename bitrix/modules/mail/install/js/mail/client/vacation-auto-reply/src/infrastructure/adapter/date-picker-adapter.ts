import { Dom, Event } from 'main.core';
import { DatePicker, DatePickerEvent, createDate } from 'ui.date-picker';

import {
	applyBound,
	describeBoundExample,
	fromCalendarDate,
	keepSeconds,
	readBound,
	toRequestBound,
	type PeriodBound,
} from '../../period';

const LOCKED_CLASS = '--locked';

type AttributeSnapshot = {
	readonly: string | null,
	ariaDisabled: string | null,
	locked: boolean,
};

export type DatePickerAdapterOptions = {
	input: HTMLInputElement,
	onChange?: (bound: PeriodBound | null) => void,
};

export class DatePickerAdapter
{
	#input: HTMLInputElement;
	#picker: DatePicker | null = null;
	#onChange: ((bound: PeriodBound | null) => void) | null;
	#initialAttributes: AttributeSnapshot;
	#isApplyingValue: boolean = false;
	#disabled: boolean = false;
	#destroyed: boolean = false;
	#focusTimer: number | null = null;

	constructor(options: DatePickerAdapterOptions)
	{
		this.#input = options.input;
		this.#onChange = options.onChange ?? null;
		this.#initialAttributes = {
			readonly: this.#input.getAttribute('readonly'),
			ariaDisabled: this.#input.getAttribute('aria-disabled'),
			locked: Dom.hasClass(this.#input, LOCKED_CLASS),
		};

		this.#picker = new DatePicker({
			targetNode: this.#input,
			inputField: this.#input,
			selectionMode: 'single',
			enableTime: true,
			cutZeroTime: false,
			events: {
				[DatePickerEvent.SELECT_CHANGE]: () => this.#handleChange(),
				onShow: () => this.#handleShow(),
				onHide: () => this.#handleHide(),
			},
		} as unknown as ConstructorParameters<typeof DatePicker>[0]);

		Event.bind(this.#input, 'input', this.#handleInput);
	}

	setValue(bound: string | null | undefined): void
	{
		if (this.#picker === null || this.#destroyed)
		{
			return;
		}

		this.#isApplyingValue = true;
		try
		{
			applyBound(this.#picker, this.#input, readBound(bound));
		}
		finally
		{
			this.#isApplyingValue = false;
		}
	}

	getBound(loadedBound: string | null | undefined = null): PeriodBound | null
	{
		return keepSeconds(readBound(loadedBound), this.#readInputBound());
	}

	getRequestValue(loadedBound: string | null | undefined = null): string
	{
		return toRequestBound(this.getBound(loadedBound));
	}

	getFormatExample(): string
	{
		return describeBoundExample(this.#picker);
	}

	focus(): void
	{
		this.#input.focus();
	}

	setDisabled(disabled: boolean): void
	{
		if (this.#destroyed)
		{
			return;
		}

		this.#disabled = disabled;

		if (disabled)
		{
			this.#picker?.hide();
			Dom.attr(this.#input, {
				readonly: 'readonly',
				'aria-disabled': 'true',
			});
			Dom.addClass(this.#input, LOCKED_CLASS);

			return;
		}

		this.#restoreAttributes();
	}

	destroy(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		this.#destroyed = true;
		this.#clearFocusTimer();
		Event.unbind(this.#input, 'input', this.#handleInput);
		this.#picker?.hide();
		this.#picker?.destroy();
		this.#picker = null;
		Dom.attr(this.#input, 'aria-controls', null);
		this.#restoreAttributes();
	}

	#handleInput = (): void => {
		this.#handleChange();
	};

	#handleShow(): void
	{
		if (this.#picker === null || this.#destroyed)
		{
			return;
		}

		const popupContainer = this.#picker.getPopup().getPopupContainer();
		if (popupContainer.id !== '')
		{
			Dom.attr(this.#input, 'aria-controls', popupContainer.id);
		}

		this.#clearFocusTimer();
		this.#focusTimer = window.setTimeout((): void => {
			this.#focusTimer = null;
			if (this.#picker?.isOpen() === true)
			{
				this.#picker.focus();
			}
		}, 0);
	}

	#handleHide(): void
	{
		this.#clearFocusTimer();
		Dom.attr(this.#input, 'aria-controls', null);
	}

	#clearFocusTimer(): void
	{
		if (this.#focusTimer !== null)
		{
			window.clearTimeout(this.#focusTimer);
			this.#focusTimer = null;
		}
	}

	#handleChange(): void
	{
		if (this.#isApplyingValue || this.#disabled || this.#destroyed)
		{
			return;
		}

		this.#onChange?.(this.#readInputBound());
	}

	#readInputBound(): PeriodBound | null
	{
		if (this.#picker === null)
		{
			return null;
		}

		const value = this.#input.value.trim();
		if (value === '')
		{
			return null;
		}

		return fromCalendarDate(createDate(value, this.#picker.getDateFormat()));
	}

	#restoreAttributes(): void
	{
		Dom.attr(this.#input, {
			readonly: this.#initialAttributes.readonly,
			'aria-disabled': this.#initialAttributes.ariaDisabled,
		});

		if (this.#initialAttributes.locked)
		{
			Dom.addClass(this.#input, LOCKED_CLASS);
		}
		else
		{
			Dom.removeClass(this.#input, LOCKED_CLASS);
		}
	}
}
