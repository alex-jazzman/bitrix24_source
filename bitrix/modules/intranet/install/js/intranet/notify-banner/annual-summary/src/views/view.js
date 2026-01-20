import { Tag, Dom } from 'main.core';

export class View
{
	#content: ?HTMLElement;

	content(): HTMLElement
	{
		return Tag.render``;
	}

	cachedContent(): HTMLElement
	{
		if (!this.#content)
		{
			this.#content = this.content();
		}

		return this.#content;
	}

	destroy(): void
	{
		Dom.remove(this.#content);
		this.#content = null;
	}

	addClassToContent(className: string): void
	{
		Dom.addClass(this.cachedContent(), className);
	}

	removeClassFromContent(className: string | []): void
	{
		Dom.removeClass(this.cachedContent(), className);
	}

	featureType(): ?string
	{
		return null;
	}

	index(): ?number
	{
		return null;
	}
}
