import { Tag } from 'main.core';

export class CopilotResult
{
	#container: HTMLElement;
	#contentContainer: HTMLElement;
	#rawResult: string;

	render(): HTMLElement
	{
		this.#contentContainer = Tag.render`<div class="ai__copilot-result-content"></div>`;
		this.#container = Tag.render`<div class="ai__copilot-result">${this.#contentContainer}</div>`;
		this.#rawResult = '';

		return this.#container;
	}

	addResult(result: string, resultPreview: ?string): void
	{
		this.#rawResult = result;
		this.#contentContainer.innerHTML += resultPreview ?? result;
		this.#container.classList.toggle('--has-content', this.#contentContainer.hasChildNodes());
	}

	clearResult(): void
	{
		this.#rawResult = '';
		this.#contentContainer.innerHTML = '';
		this.#container.classList.remove('--has-content');
	}

	getResult(): string
	{
		return this.#rawResult;
	}
}
