import { Input, InputDesign } from 'ui.system.input';

export class ContactsInput
{
	#input: Input;
	#dataTestId: string;

	constructor(dataTestId: string = 'invite-page-contact-input')
	{
		this.#dataTestId = dataTestId;
	}

	getInput(): Input
	{
		this.#input ??= new Input({
			placeholder: this.getPlaceholder(),
			design: InputDesign.Grey,
			withClear: true,
			onBlur: this.#validateContactsInput.bind(this),
			onInput: this.#onInput.bind(this),
			onClear: this.#onClear.bind(this),
			dataTestId: this.#dataTestId,
		});

		return this.#input;
	}

	render(): HTMLElement
	{
		const wrapper = this.getInput().render();
		const container = wrapper.querySelector('.ui-system-input-container');
		const containerId = `${this.#dataTestId}-container`;

		container?.setAttribute('id', containerId);
		container?.setAttribute('data-test-id', containerId);

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
