import { Input, InputDesign } from 'ui.system.input';

type RowTextInputOptions = {
	placeholder: string,
	dataTestId: string,
	ariaLabel: string,
};

export class RowTextInput
{
	#input: Input;
	#placeholder: string;
	#dataTestId: string;
	#ariaLabel: string;

	constructor(options: RowTextInputOptions)
	{
		this.#placeholder = options.placeholder;
		this.#dataTestId = options.dataTestId;
		this.#ariaLabel = options.ariaLabel;
	}

	getInput(): Input
	{
		this.#input ??= new Input({
			placeholder: this.#placeholder,
			design: InputDesign.Grey,
			dataTestId: this.#dataTestId,
		});

		return this.#input;
	}

	render(): HTMLElement
	{
		const wrapper = this.getInput().render();
		const container = wrapper.querySelector('.ui-system-input-container');
		const input = wrapper.querySelector('input');
		const containerId = `${this.#dataTestId}-container`;

		container?.setAttribute('id', containerId);
		container?.setAttribute('data-test-id', containerId);
		input?.setAttribute('aria-label', this.#ariaLabel);
		input?.setAttribute('autocomplete', 'off');

		return wrapper;
	}

	getValue(): string
	{
		return String(this.getInput().getValue() ?? '').trim();
	}

	clear(): void
	{
		this.getInput().setValue('');
	}
}
