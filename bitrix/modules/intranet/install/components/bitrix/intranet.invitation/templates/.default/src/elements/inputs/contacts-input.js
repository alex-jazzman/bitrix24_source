import { Dom, Event, Loc, Tag, Type } from 'main.core';
import { Icon, Outline } from 'ui.icon-set.api.core';
import { Input, InputDesign } from 'ui.system.input';
import { getFieldErrorMessageId, syncFieldErrorMessage } from '../../field-error-message';

export class ContactsInput
{
	#input: Input;
	#dataTestId: string;
	#inputElement: ?HTMLInputElement = null;
	#errorElement: ?HTMLElement = null;
	#clearButton: ?HTMLButtonElement = null;
	#errorMessageFrame: ?number = null;

	constructor(dataTestId: string = 'invite-page-contact-input')
	{
		this.#dataTestId = dataTestId;
	}

	getInput(): Input
	{
		this.#input ??= new Input({
			placeholder: this.getPlaceholder(),
			ariaLabel: this.getPlaceholder(),
			type: this.getType(),
			design: InputDesign.Grey,
			onBlur: this.#onBlur.bind(this),
			onInput: this.#onInput.bind(this),
			dataTestId: this.#dataTestId,
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

			const autocomplete = this.getAutocomplete();
			if (autocomplete)
			{
				this.#inputElement.autocomplete = autocomplete;
			}
			else
			{
				this.#inputElement.removeAttribute('autocomplete');
			}

			if (this.isRequired())
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

		this.#renderClearButton(container);
		this.#syncErrorState();

		return wrapper;
	}

	getValue(): Object
	{
		throw new Error('Not Implemented');
	}

	getPlaceholder(): string
	{
		throw new Error('Not Implemented');
	}

	getType(): string
	{
		return 'text';
	}

	getAutocomplete(): ?string
	{
		return null;
	}

	isRequired(): boolean
	{
		return false;
	}

	isValidValue(value: string): boolean
	{
		throw new Error('Not Implemented');
	}

	getValidationErrorMessage(): string
	{
		throw new Error('Not Implemented');
	}

	focus(): void
	{
		this.getInput().render().querySelector('input')?.focus();
	}

	setError(error: string, deferMessage: boolean = false): void
	{
		this.getInput().setError(error);
		this.#syncErrorState();
		this.#syncFieldErrorMessage(error, deferMessage);
	}

	hasError(): boolean
	{
		return Type.isStringFilled(this.getInput().getError());
	}

	restoreError(): void
	{
		this.#syncErrorState();
		this.#syncFieldErrorMessage(this.getInput().getError(), false, false);
	}

	validate(): boolean
	{
		this.#validateContactsInput();

		return !this.hasError();
	}

	#onInput(): void
	{
		this.setError('');
	}

	#onBlur(): void
	{
		this.#validateContactsInput(true);
	}

	#onClear(event: MouseEvent): void
	{
		event.stopPropagation();
		this.getInput().setValue('');
		this.setError('');
		this.focus();
	}

	#onInputKeydown(event: KeyboardEvent): void
	{
		const value = this.getInput().getValue();
		if (
			event.key !== 'Tab'
			|| event.shiftKey
			|| !value
			|| this.isValidValue(value)
			|| !this.#clearButton
		)
		{
			return;
		}

		event.preventDefault();
		this.#validateContactsInput();
		this.#clearButton.focus();
	}

	#validateContactsInput(deferMessage: boolean = false): void
	{
		const value = this.getInput().getValue();

		if (value && !this.isValidValue(value))
		{
			this.setError(this.getValidationErrorMessage(), deferMessage);
		}
		else
		{
			this.setError('');
		}
	}

	#syncFieldErrorMessage(error: string, deferMessage: boolean, announce: boolean = true): void
	{
		if (this.#errorMessageFrame !== null)
		{
			cancelAnimationFrame(this.#errorMessageFrame);
			this.#errorMessageFrame = null;
		}

		if (!deferMessage || !Type.isStringFilled(error))
		{
			syncFieldErrorMessage(this.#getTestId(), error, announce);

			return;
		}

		this.#errorMessageFrame = requestAnimationFrame(() => {
			this.#errorMessageFrame = null;
			if (!this.#inputElement?.isConnected)
			{
				return;
			}

			syncFieldErrorMessage(this.#getTestId(), error, announce);
		});
	}

	#renderClearButton(container: ?HTMLElement): void
	{
		if (!container || !this.#inputElement || this.#clearButton)
		{
			return;
		}

		const icon = new Icon({ icon: Outline.CROSS_L });
		this.#clearButton = Tag.render`
			<button
				type="button"
				tabindex="0"
				class="ui-system-input-action-btn ui-system-input-cross --clear"
				aria-label="${Loc.getMessage('INTRANET_INVITE_DIALOG_CLEAR_INPUT_ARIA_LABEL')}"
				data-testid="${this.#getTestId()}-clear-button"
			>
				${icon.render()}
			</button>
		`;
		Event.bind(this.#clearButton, 'click', this.#onClear.bind(this));
		Event.bind(this.#inputElement, 'keydown', this.#onInputKeydown.bind(this));
		Dom.append(this.#clearButton, container);
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
