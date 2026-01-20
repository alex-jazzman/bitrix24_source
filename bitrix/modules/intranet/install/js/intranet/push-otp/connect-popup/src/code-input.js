import { Dom, Event, Type } from 'main.core';

export type CodeInputOptions = {
	codeLength?: number,
	name?: string,
	complete?: () => void,
	className?: string,
	containerClassName?: string,
	mask?: RegExp,
	autoFocus?: boolean,
	allowPaste?: boolean,
}

export class CodeInput
{
	#className: string;
	#containerClassName: string;
	#name: string;
	#mask: RegExp;
	#codeLength: number;
	#autoFocus: boolean;
	#allowPaste: boolean;
	#container: HTMLElement;
	#complete: () => void;
	#input: () => void;

	constructor(options: CodeInputOptions = {})
	{
		this.#codeLength = Type.isNumber(options.codeLength) ? options.codeLength : 6;
		this.#name = Type.isString(options.name) ? options.name : 'confirm_code';
		this.#mask = options.mask instanceof RegExp ? options.mask : /\D/g;
		this.#className = Type.isString(options.className) ? options.className : '';
		this.#containerClassName = Type.isString(options.containerClassName) ? options.containerClassName : '';
		this.#autoFocus = Type.isBoolean(options.autoFocus) ? options.autoFocus : true;
		this.#allowPaste = Type.isBoolean(options.allowPaste) ? options.allowPaste : true;
		this.#complete = Type.isFunction(options.complete) ? options.complete : () => {};

		this.#input = Type.isFunction(options.input) ? options.input : () => {};
	}

	#createInput(): HTMLElement
	{
		return Dom.create({
			tag: 'input',
			attrs: {
				className: this.#className,
				name: `${this.#name}[]`,
				type: 'text',
				autocomplete: 'one-time-code',
				maxlength: '1',
			},
			events: {
				input: this.#inputHandler.bind(this),
				keydown: this.#keydownHandler.bind(this),
				focus: this.#focusHandler.bind(this),
			},
		});
	}

	#inputHandler(event): void
	{
		const target = event.target;
		this.#input(target);
		target.value = target.value.replace(this.#mask, '').slice(0, 1);

		if (target.value.length > 0)
		{
			this.#moveToNext(target);
		}
	}

	#keydownHandler(event): void
	{
		const input = event.target;
		this.#input(input);
		if (
			(event.key === 'Backspace' && input.value === '')
			|| event.key === 'ArrowLeft'
		)
		{
			const prevInput = input.previousElementSibling;
			if (prevInput && prevInput.tagName === 'INPUT')
			{
				prevInput.focus();
				if (event.key === 'Backspace')
				{
					prevInput.value = '';
				}
			}
			event.preventDefault();
		}
		else if (event.key === 'ArrowRight')
		{
			this.#moveToNext(input);
			event.preventDefault();
		}
	}

	#focusHandler(event): void
	{
		event.target.select();
	}

	#pasteHandler(event): void
	{
		if (!this.#allowPaste)
		{
			return;
		}

		const paste = (event.clipboardData || window.clipboardData).getData('text');
		const digits = [...paste.replace(this.#mask, '')];
		const inputs = this.#container.querySelectorAll('input');

		digits.forEach((digit, idx) => {
			if (inputs[idx])
			{
				inputs[idx].value = digit;
			}
		});

		if (digits.length > 0)
		{
			const lastFilledIndex = Math.min(digits.length - 1, inputs.length - 1);
			const nextInput = inputs[lastFilledIndex + 1];

			if (nextInput)
			{
				nextInput.focus();
			}
			else
			{
				inputs[lastFilledIndex].blur();
				this.#checkComplete();
			}
		}

		event.preventDefault();
	}

	#moveToNext(currentInput): void
	{
		const nextInput = currentInput.nextElementSibling;
		if (nextInput && nextInput.tagName === 'INPUT')
		{
			nextInput.focus();
		}
		else
		{
			currentInput.blur();
			this.#checkComplete();
		}
	}

	#moveToPrevious(currentInput): void
	{
		const prevInput = currentInput.previousElementSibling;
		if (prevInput && prevInput.tagName === 'INPUT')
		{
			prevInput.focus();
		}
	}

	#checkComplete(): void
	{
		if (this.getValue().length === this.#codeLength)
		{
			this.#complete();
		}
	}

	getValue(): string
	{
		const inputs = this.#container.querySelectorAll('input');

		return [...inputs].map((input) => input.value).join('');
	}

	setInputClass(className: string): string
	{
		const inputs = this.#container?.querySelectorAll('input') ?? [];

		return [...inputs].forEach((input: HTMLInputElement) => {
			input.className = className;
		});
	}

	setValue(value: string): void
	{
		const inputs = this.#container.querySelectorAll('input');
		const digits = [...value.replace(this.#mask, '')];

		inputs.forEach((input: HTMLInputElement, idx) => {
			// eslint-disable-next-line no-param-reassign
			input.value = digits[idx] || '';
		});
	}

	clear(): void
	{
		const inputs = this.#container.querySelectorAll('input');
		inputs.forEach((input) => {
			// eslint-disable-next-line no-param-reassign
			input.value = '';
		});
		if (this.#autoFocus && inputs[0])
		{
			inputs[0].focus();
		}
	}

	focus(): void
	{
		const firstEmpty = this.#container.querySelector('input:not([value]), input[value=""]');
		const target = firstEmpty || this.#container.querySelector('input');
		if (target)
		{
			target.focus();
		}
	}

	render(): HTMLElement
	{
		this.#container = Dom.create('div', {
			attrs: {
				className: this.#containerClassName,
			},
		});

		for (let i = 0; i < this.#codeLength; i++)
		{
			Dom.append(this.#createInput(), this.#container);
		}

		if (this.#allowPaste)
		{
			const firstInput = this.#container.querySelector('input');
			if (firstInput)
			{
				Event.bind(firstInput, 'paste', this.#pasteHandler.bind(this));
			}
		}

		if (this.#autoFocus)
		{
			setTimeout(() => this.focus(), 0);
		}

		return this.#container;
	}
}
