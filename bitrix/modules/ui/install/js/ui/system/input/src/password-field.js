import { Input } from './input';
import { InputSize, InputDesign } from './const';

export type PasswordInputOptions = {
	value?: string,
	label?: string,
	placeholder?: string,
	error?: string,
	size?: InputSize,
	design?: InputDesign,
	copyable?: boolean,
	stretched?: boolean,
	active?: boolean,
	readonly?: boolean,
	onFocus?: Function,
	onBlur?: Function,
	onInput?: Function,
	onCopy?: Function,
};

export class PasswordInput
{
	#input: Input;

	constructor(options: PasswordInputOptions = {})
	{
		this.#input = new Input({
			...options,
			type: 'password',
		});
	}

	render(): HTMLElement
	{
		return this.#input.render();
	}

	setValue(value: string): void
	{
		this.#input.setValue(value);
	}

	getValue(): string
	{
		return this.#input.getValue();
	}

	setLabel(value: string): void
	{
		this.#input.setLabel(value);
	}

	getLabel(): string
	{
		return this.#input.getLabel();
	}

	setPlaceholder(value: string): void
	{
		this.#input.setPlaceholder(value);
	}

	getPlaceholder(): string
	{
		return this.#input.getPlaceholder();
	}

	setError(value: string): void
	{
		this.#input.setError(value);
	}

	getError(): string
	{
		return this.#input.getError();
	}

	setSize(value: string): void
	{
		this.#input.setSize(value);
	}

	getSize(): string
	{
		return this.#input.getSize();
	}

	setDesign(value: string): void
	{
		this.#input.setDesign(value);
	}

	getDesign(): string
	{
		return this.#input.getDesign();
	}

	isCopyable(): boolean
	{
		return this.#input.isCopyable();
	}

	setCopyable(value: boolean): void
	{
		this.#input.setCopyable(value);
	}

	isFocused(): boolean
	{
		return this.#input.isFocused();
	}

	focus(): void
	{
		this.#input.focus();
	}

	blur(): void
	{
		this.#input.blur();
	}

	destroy(): void
	{
		this.#input.destroy();
	}
}
