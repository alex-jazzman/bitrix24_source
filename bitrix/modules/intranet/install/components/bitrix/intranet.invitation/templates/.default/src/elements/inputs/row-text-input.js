import { Type } from 'main.core';
import { Input, InputDesign } from 'ui.system.input';
import { getFieldErrorMessageId, syncFieldErrorMessage } from '../../field-error-message';

type RowTextInputOptions = {
	placeholder: string,
	dataTestId: string,
	ariaLabel: string,
	autocomplete?: string,
	required?: boolean,
};

export class RowTextInput
{
	#input: Input;
	#placeholder: string;
	#dataTestId: string;
	#ariaLabel: string;
	#autocomplete: ?string;
	#required: boolean;
	#inputElement: ?HTMLInputElement = null;
	#errorElement: ?HTMLElement = null;

	constructor(options: RowTextInputOptions)
	{
		this.#placeholder = options.placeholder;
		this.#dataTestId = options.dataTestId;
		this.#ariaLabel = options.ariaLabel;
		this.#autocomplete = options.autocomplete ?? null;
		this.#required = options.required === true;
	}

	getInput(): Input
	{
		this.#input ??= new Input({
			placeholder: this.#placeholder,
			ariaLabel: this.#ariaLabel,
			type: 'text',
			design: InputDesign.Grey,
			dataTestId: this.#dataTestId,
			onInput: () => {
				this.setError('');
			},
		});

		return this.#input;
	}

	render(): HTMLElement
	{
		const wrapper = this.getInput().render();
		const container = wrapper.querySelector('.ui-system-input-container');
		const containerId = `${this.#dataTestId}-container`;
		const inputId = this.#getTestId();

		container?.setAttribute('id', containerId);
		container?.setAttribute('data-test-id', containerId);
		container?.setAttribute('data-testid', `${inputId}-container`);

		this.#inputElement = wrapper.querySelector('input');
		this.#errorElement = wrapper.querySelector('.ui-system-input-label.--error');

		if (this.#inputElement)
		{
			this.#inputElement.id = inputId;
			this.#inputElement.dataset.testid = inputId;

			if (this.#autocomplete)
			{
				this.#inputElement.autocomplete = this.#autocomplete;
			}
			else
			{
				this.#inputElement.removeAttribute('autocomplete');
			}

			if (this.#required)
			{
				this.#inputElement.setAttribute('aria-required', 'true');
			}
			else
			{
				this.#inputElement.removeAttribute('aria-required');
			}
		}

		if (this.#errorElement)
		{
			this.#errorElement.id = `${inputId}-error`;
			this.#errorElement.dataset.testid = `${inputId}-error`;
			this.#errorElement.hidden = true;
		}

		this.#syncErrorState();

		return wrapper;
	}

	getValue(): string
	{
		return String(this.getInput().getValue() ?? '').trim();
	}

	clear(): void
	{
		this.getInput().setValue('');
		this.setError('');
	}

	focus(): void
	{
		this.getInput().focus();
	}

	setError(error: string): void
	{
		this.getInput().setError(error);
		this.#syncErrorState();
		syncFieldErrorMessage(this.#getTestId(), error);
	}

	hasError(): boolean
	{
		return Type.isStringFilled(this.getInput().getError());
	}

	restoreError(): void
	{
		this.#syncErrorState();
		syncFieldErrorMessage(this.#getTestId(), this.getInput().getError(), false);
	}

	#syncErrorState(): void
	{
		if (!this.#inputElement)
		{
			return;
		}

		if (this.hasError())
		{
			this.#inputElement.setAttribute('aria-invalid', 'true');
			this.#inputElement.setAttribute('aria-describedby', getFieldErrorMessageId(this.#getTestId()));
		}
		else
		{
			this.#inputElement.removeAttribute('aria-invalid');
			this.#inputElement.removeAttribute('aria-describedby');
		}
	}

	#getTestId(): string
	{
		return this.#dataTestId.startsWith('invite-')
			? this.#dataTestId.replace(/^invite-/, 'invitation-')
			: `invitation-${this.#dataTestId}`
		;
	}
}
