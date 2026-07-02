import { Tag } from 'main.core';

export class CopilotResult
{
	#container: HTMLElement;
	#rawResult: string;

	render(): HTMLElement
	{
		this.#container = Tag.render`<div class="ai__copilot-result"></div>`;
		this.#rawResult = '';

		return this.#container;
	}

	addResult(result: string, resultPreview: ?string): void
	{
		this.#rawResult = result;
		this.#container.innerHTML += resultPreview ?? result;
	}

	clearResult(): void
	{
		this.#rawResult = '';
		this.#container.innerHTML = '';
	}

	getResult(): string
	{
		return this.#rawResult;
	}
}
