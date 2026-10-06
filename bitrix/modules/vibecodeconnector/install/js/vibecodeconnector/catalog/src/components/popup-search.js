import { Loc } from 'main.core';
import { Input, InputSize } from 'ui.system.input';

type CatalogPopupSearchOptions = {
	onInput: () => void,
	onClear: () => void,
	useSearch?: boolean,
};

export class CatalogPopupSearch
{
	#input: Input;

	constructor(options: CatalogPopupSearchOptions)
	{
		const useSearch = options.useSearch !== false;

		this.#input = new Input({
			placeholder: Loc.getMessage('VIBECODECONNECTOR_CATALOG_SEARCH_PLACEHOLDER'),
			size: InputSize.Md,
			stretched: true,
			withSearch: useSearch,
			onInput: options.onInput,
			onClear: options.onClear,
		});
	}

	render(): HTMLElement
	{
		return this.#input.render();
	}

	focus(): void
	{
		this.#input.focus();
	}

	getQuery(): string
	{
		return this.#input.getValue().trim();
	}

	destroy(): void
	{
		this.#input.destroy();
	}
}
