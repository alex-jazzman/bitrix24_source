import { Dom, Event } from 'main.core';

const controlSelector = '[data-landing-edit-control]';
const targetAttribute = 'data-landing-edit-target';
const textSelector = '[data-landing-edit-text]';
const inputWrapperSelector = '[data-landing-edit-input]';
const inputSelector = '.ui-ctl-element';

const showNode = (node: HTMLElement) => {
	Dom.style(node, 'display', 'flex');
};

const hideNode = (node: HTMLElement) => {
	Dom.style(node, 'display', 'none');
};

// the markup hides the input wrapper with !important, restore the same declaration
const hideInputWrapper = (node: HTMLElement) => {
	Dom.attr(node, 'style', 'display: none !important');
};

type EditableFieldOptions = {
	button: HTMLElement,
	text: HTMLElement,
	inputWrapper: HTMLElement,
	input: HTMLInputElement,
};

export class EditableField
{
	#button: HTMLElement;
	#text: HTMLElement;
	#inputWrapper: HTMLElement;
	#input: HTMLInputElement;
	#active: boolean = false;
	#originalValue: string = '';
	#onKeyDown: (ev: KeyboardEvent) => void;
	#onBlur: () => void;
	#onClick: () => void;

	static bindAll(): EditableField[]
	{
		const fields = [];

		[...document.querySelectorAll(controlSelector)].forEach((button: HTMLElement) => {
			const container = document.getElementById(button.getAttribute(targetAttribute));
			if (!container)
			{
				return;
			}

			const text = container.querySelector(textSelector);
			const inputWrapper = container.querySelector(inputWrapperSelector);
			const input = inputWrapper ? inputWrapper.querySelector(inputSelector) : null;

			if (text && input)
			{
				fields.push(new EditableField({ button, text, inputWrapper, input }));
			}
		});

		return fields;
	}

	constructor(options: EditableFieldOptions)
	{
		this.#button = options.button;
		this.#text = options.text;
		this.#inputWrapper = options.inputWrapper;
		this.#input = options.input;

		this.#onKeyDown = this.#handleKeyDown.bind(this);
		this.#onBlur = this.#handleBlur.bind(this);
		this.#onClick = this.#enter.bind(this);

		Event.bind(this.#button, 'click', this.#onClick);
	}

	#enter()
	{
		if (this.#active)
		{
			return;
		}

		this.#originalValue = this.#text.innerText;
		this.#input.value = this.#originalValue;

		hideNode(this.#text);
		hideNode(this.#button);
		showNode(this.#inputWrapper);

		Event.bind(this.#input, 'keydown', this.#onKeyDown);
		Event.bind(this.#input, 'blur', this.#onBlur);

		this.#active = true;
		this.#input.focus();
	}

	// listeners go off before the focus moves: focusing the button blurs the input
	#leave(applyValue: boolean, returnFocus: boolean)
	{
		if (!this.#active)
		{
			return;
		}

		this.#active = false;

		Event.unbind(this.#input, 'keydown', this.#onKeyDown);
		Event.unbind(this.#input, 'blur', this.#onBlur);

		showNode(this.#text);
		showNode(this.#button);
		hideInputWrapper(this.#inputWrapper);

		if (applyValue)
		{
			this.#text.innerText = this.#input.value;
		}
		else
		{
			this.#input.value = this.#originalValue;
		}

		if (returnFocus)
		{
			this.#button.focus();
		}
	}

	// the keyboard has nowhere else to go, so the focus is handed back to the button; a pointer
	// leaving the field has already chosen where the focus goes and must not be pulled away
	#handleKeyDown(ev: KeyboardEvent)
	{
		if (ev.key === 'Escape')
		{
			this.#leave(false, true);
			ev.stopPropagation();

			return;
		}

		if (ev.key === 'Enter')
		{
			this.#leave(true, true);
			ev.stopPropagation();
			ev.preventDefault();
		}
	}

	#handleBlur()
	{
		this.#leave(true, false);
	}
}
