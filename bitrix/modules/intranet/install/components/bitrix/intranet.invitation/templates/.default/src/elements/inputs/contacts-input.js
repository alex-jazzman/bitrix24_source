import { Input, InputDesign } from 'ui.system.input';

export class ContactsInput
{
	#input: Input;

	getInput(): Input
	{
		this.#input ??= new Input({
			placeholder: this.getPlaceholder(),
			design: InputDesign.Grey,
			withClear: true,
			onBlur: this.#validateContactsInput.bind(this),
			onInput: this.#onInput.bind(this),
			onClear: this.#onClear.bind(this),
			dataTestId: 'invite-page-contact-input',
		});

		return this.#input;
	}

	getValue(): Object
	{
		throw new Error('Not Implemented');
	}

	getPlaceholder(): string
	{
		throw new Error('Not Implemented');
	}

	isValidValue(value: string): boolean
	{
		throw new Error('Not Implemented');
	}

	getValidationErrorMessage(): string
	{
		throw new Error('Not Implemented');
	}

	#onInput(): void
	{
		this.getInput().setError('');
	}

	#onClear(): void
	{
		this.getInput().setError('');
	}

	#validateContactsInput(): void
	{
		const value = this.getInput().getValue();

		if (value && !this.isValidValue(value))
		{
			this.getInput().setError(this.getValidationErrorMessage());
		}
		else
		{
			this.getInput().setError('');
		}
	}
}
