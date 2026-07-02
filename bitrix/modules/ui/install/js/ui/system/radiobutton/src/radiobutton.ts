import { Type, Tag, Dom, Event } from 'main.core';

import { RadioButtonSize } from './const';
import { type RadioButtonOptions } from './types';

import './radiobutton.css';

const RESERVED_ATTRIBUTES: Set<string> = new Set(['type', 'class', 'name', 'checked', 'disabled']);

export class RadioButton
{
	#size: RadioButtonSize;
	#checked: boolean;
	#disabled: boolean;
	#group: string;
	#attributes: { [key: string]: string };
	#onChange: Function | null;

	#wrapper: HTMLLabelElement | null = null;
	#input: HTMLInputElement | null = null;
	#box: HTMLElement | null = null;
	#dotElement: HTMLElement | null = null;

	constructor(options: RadioButtonOptions)
	{
		if (!Type.isPlainObject(options) || !Type.isStringFilled(options.group))
		{
			throw new Error('RadioButton: "group" option is required');
		}

		this.#size = options.size ?? RadioButtonSize.Md;
		this.#checked = options.checked === true;
		this.#disabled = options.disabled === true;
		this.#group = options.group;
		this.#attributes = Type.isPlainObject(options.attributes) ? { ...options.attributes } : {};
		this.#onChange = Type.isFunction(options.onChange) ? options.onChange : null;
	}

	render(): HTMLLabelElement
	{
		if (this.#wrapper)
		{
			return this.#wrapper;
		}

		const input: HTMLInputElement = Tag.render`<input type="radio" class="ui-radio-button__input">`;
		const box: HTMLElement = Tag.render`<span class="ui-radio-button__box" aria-hidden="true"></span>`;
		const dotElement: HTMLElement = Tag.render`<span class="ui-radio-button__dot"></span>`;

		const wrapper: HTMLLabelElement = Tag.render`
			<label class="ui-radio-button">
				${input}
				${box}
			</label>
		`;

		this.#input = input;
		this.#box = box;
		this.#dotElement = dotElement;
		this.#wrapper = wrapper;

		this.#applyUserAttributes();
		this.#applyControlledAttributes();
		this.#updateBoxContent();
		this.#updateModifierClasses();
		this.#bindEvents();

		return wrapper;
	}

	setSize(size: RadioButtonSize): this
	{
		if (!(Object.values(RadioButtonSize) as string[]).includes(size))
		{
			return this;
		}

		this.#size = size;
		this.#updateModifierClasses();

		return this;
	}

	getSize(): RadioButtonSize
	{
		return this.#size;
	}

	setChecked(checked: boolean = true): this
	{
		this.#checked = checked === true;
		this.#applyControlledAttributes();
		this.#updateBoxContent();
		this.#updateModifierClasses();

		return this;
	}

	isChecked(): boolean
	{
		return this.#checked;
	}

	setDisabled(disabled: boolean = true): this
	{
		this.#disabled = disabled === true;
		this.#applyControlledAttributes();
		this.#updateModifierClasses();

		return this;
	}

	isDisabled(): boolean
	{
		return this.#disabled;
	}

	setOnChange(callback: Function | null): this
	{
		this.#onChange = Type.isFunction(callback) ? callback : null;

		return this;
	}

	destroy(): void
	{
		if (this.#input)
		{
			Event.unbindAll(this.#input);
		}

		if (this.#wrapper)
		{
			Dom.remove(this.#wrapper);
		}

		this.#wrapper = null;
		this.#input = null;
		this.#box = null;
		this.#dotElement = null;
	}

	#applyUserAttributes(): void
	{
		if (!this.#input)
		{
			return;
		}

		for (const [key, rawValue] of Object.entries(this.#attributes))
		{
			if (RESERVED_ATTRIBUTES.has(key))
			{
				continue;
			}

			Dom.attr(this.#input, key, String(rawValue));
		}
	}

	#applyControlledAttributes(): void
	{
		if (!this.#input)
		{
			return;
		}

		Dom.attr(this.#input, 'name', this.#group);
		this.#input.checked = this.#checked;
		this.#input.disabled = this.#disabled;
	}

	#updateBoxContent(): void
	{
		if (!this.#box || !this.#dotElement)
		{
			return;
		}

		Dom.clean(this.#box);

		if (this.#checked)
		{
			Dom.append(this.#dotElement, this.#box);
		}
	}

	#updateModifierClasses(): void
	{
		if (!this.#wrapper)
		{
			return;
		}

		const classes: string[] = ['ui-radio-button', `--size-${this.#size}`];

		if (this.#checked)
		{
			classes.push('--checked');
		}

		if (this.#disabled)
		{
			classes.push('--disabled');
		}

		this.#wrapper.className = classes.join(' ');
	}

	#bindEvents(): void
	{
		if (!this.#input)
		{
			return;
		}

		Event.bind(this.#input, 'change', this.#handleChange.bind(this));
	}

	#handleChange(event: Event): void
	{
		if (!this.#input)
		{
			return;
		}

		this.#checked = this.#input.checked;

		this.#updateBoxContent();
		this.#updateModifierClasses();
		this.#applyControlledAttributes();

		if (Type.isFunction(this.#onChange))
		{
			this.#onChange({ checked: this.#checked, event });
		}
	}
}
