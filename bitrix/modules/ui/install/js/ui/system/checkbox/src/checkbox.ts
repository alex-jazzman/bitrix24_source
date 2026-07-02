import { Type, Tag, Dom, Event } from 'main.core';
import { Icon, Outline } from 'ui.icon-set.api.core';
// @ts-ignore
import 'ui.icon-set.outline';

import { CheckboxSize } from './const';
import { type CheckboxOptions } from './types';

import './checkbox.css';

const RESERVED_ATTRIBUTES: Set<string> = new Set(['type', 'class', 'checked', 'disabled', 'indeterminate']);

export class Checkbox
{
	#size: CheckboxSize;
	#checked: boolean;
	#indeterminate: boolean;
	#disabled: boolean;
	#attributes: { [key: string]: string };
	#onChange: Function | null;

	#wrapper: HTMLLabelElement | null = null;
	#input: HTMLInputElement | null = null;
	#box: HTMLElement | null = null;
	#iconElement: HTMLElement | null = null;
	#dashElement: HTMLElement | null = null;

	constructor(options: CheckboxOptions = {})
	{
		this.#size = options.size ?? CheckboxSize.Md;
		this.#checked = options.checked === true;
		this.#indeterminate = options.indeterminate === true;
		this.#disabled = options.disabled === true;
		this.#attributes = Type.isPlainObject(options.attributes) ? { ...options.attributes } : {};
		this.#onChange = Type.isFunction(options.onChange) ? options.onChange : null;
	}

	render(): HTMLLabelElement
	{
		if (this.#wrapper)
		{
			return this.#wrapper;
		}

		const input: HTMLInputElement = Tag.render`<input type="checkbox" class="ui-checkbox__input">`;
		const box: HTMLElement = Tag.render`<span class="ui-checkbox__box" aria-hidden="true"></span>`;
		const dashElement: HTMLElement = Tag.render`<span class="ui-checkbox__dash"></span>`;
		const iconElement: HTMLElement = Tag.render`<span class="ui-checkbox__icon"></span>`;

		new Icon({ icon: Outline.CHECK_M }).renderTo(iconElement);

		const wrapper: HTMLLabelElement = Tag.render`
			<label class="ui-checkbox">
				${input}
				${box}
			</label>
		`;

		this.#input = input;
		this.#box = box;
		this.#dashElement = dashElement;
		this.#iconElement = iconElement;
		this.#wrapper = wrapper;

		this.#applyUserAttributes();
		this.#applyControlledAttributes();
		this.#updateBoxContent();
		this.#updateModifierClasses();
		this.#bindEvents();

		return wrapper;
	}

	setSize(size: CheckboxSize): this
	{
		if (!(Object.values(CheckboxSize) as string[]).includes(size))
		{
			return this;
		}

		this.#size = size;
		this.#updateModifierClasses();

		return this;
	}

	getSize(): CheckboxSize
	{
		return this.#size;
	}

	setChecked(checked: boolean = true): this
	{
		this.#checked = checked === true;

		if (this.#checked)
		{
			this.#indeterminate = false;
		}

		this.#applyControlledAttributes();
		this.#updateBoxContent();
		this.#updateModifierClasses();

		return this;
	}

	isChecked(): boolean
	{
		return this.#checked;
	}

	setIndeterminate(flag: boolean = true): this
	{
		this.#indeterminate = flag === true;
		this.#applyControlledAttributes();
		this.#updateBoxContent();
		this.#updateModifierClasses();

		return this;
	}

	isIndeterminate(): boolean
	{
		return this.#indeterminate;
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
		this.#iconElement = null;
		this.#dashElement = null;
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

		this.#input.checked = this.#checked;
		this.#input.disabled = this.#disabled;
		this.#input.indeterminate = this.#indeterminate;

		Dom.attr(this.#input, 'aria-checked', this.#indeterminate ? 'mixed' : null);
	}

	#updateBoxContent(): void
	{
		if (!this.#box || !this.#iconElement || !this.#dashElement)
		{
			return;
		}

		Dom.clean(this.#box);

		if (this.#indeterminate)
		{
			Dom.append(this.#dashElement, this.#box);
		}
		else if (this.#checked)
		{
			Dom.append(this.#iconElement, this.#box);
		}
	}

	#updateModifierClasses(): void
	{
		if (!this.#wrapper)
		{
			return;
		}

		const classes: string[] = ['ui-checkbox', `--size-${this.#size}`];

		if (this.#checked && !this.#indeterminate)
		{
			classes.push('--checked');
		}

		if (this.#indeterminate)
		{
			classes.push('--indeterminate');
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

		if (this.#indeterminate)
		{
			this.#input.checked = true;
			this.#checked = true;
		}
		else
		{
			this.#checked = this.#input.checked;
		}

		this.#indeterminate = false;
		this.#input.indeterminate = false;

		this.#updateBoxContent();
		this.#updateModifierClasses();
		this.#applyControlledAttributes();

		if (Type.isFunction(this.#onChange))
		{
			this.#onChange({ checked: this.#checked, event });
		}
	}
}
