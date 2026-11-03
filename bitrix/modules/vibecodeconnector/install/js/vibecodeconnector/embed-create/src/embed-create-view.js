import { Dom, Loc, Runtime, Tag } from 'main.core';

export class EmbedCreateView
{
	#container: HTMLElement | null = null;

	getContainer(): HTMLElement
	{
		this.#container ??= Tag.render`<div class="vibecode-catalog-embed-create" style="height: 100%;"></div>`;

		return this.#container;
	}

	mountLayout(html: string): Promise<void>
	{
		return Runtime.html(this.getContainer(), html);
	}

	showLoadError(): void
	{
		const container = this.getContainer();
		Dom.clean(container);
		Dom.append(
			Tag.render`
				<div class="vibecode-catalog-embed-create__error" role="alert" data-testid="vibecode-embed-create-error">
					${Loc.getMessage('VIBECODECONNECTOR_CATALOG_EMBED_CREATE_LOAD_ERROR')}
				</div>
			`,
			container,
		);
	}
}
