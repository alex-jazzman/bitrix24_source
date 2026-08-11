import { Tag, Type, Uri, Event, Loc, Dom, Text } from 'main.core';
import { Loader } from 'main.loader';
import { Headline, Text as TextElement } from 'ui.system.typography';

import './deferred-doc-load.css';

export class DeferredDocLoad
{
	private static loaded: boolean = false;
	private static timeoutId: number = 0;
	private static immediateLoadLinkId: string = 'immediate-open-link';

	static render(selector: string): void
	{
		if (document.visibilityState === 'visible')
		{
			this.loaded = true;
			this.loadDocument();

			return;
		}

		this.showStub(selector);
		Event.bind(document, 'visibilitychange', () => this.maybeLoadDocument());
	}

	static maybeLoadDocument(): void
	{
		if (this.loaded)
		{
			return;
		}

		if (document.visibilityState === 'visible')
		{
			this.timeoutId = setTimeout(() => {
				this.loaded = true;
				this.loadDocument();
			}, 1000);
		}

		if (document.visibilityState === 'hidden')
		{
			clearTimeout(this.timeoutId);
		}
	}

	static loadDocument(): void
	{
		window.location.replace(this.getUriToLoad());
	}

	static showStub(selector: string): void
	{
		const container = document.querySelector<HTMLElement>(selector);
		if (!Type.isDomNode(container))
		{
			return;
		}

		container.innerHTML = '';
		Dom.append(this.renderStub(), container);
		this.initLoadLink();
	}

	private static renderStub(): HTMLElement
	{
		const url = this.getUriToLoad();

		const loaderHolder = Tag.render`<div class="disk-deferred-doc-load__loader"></div>`;
		const loader = new Loader({
			target: loaderHolder,
			size: 140,
			color: 'var(--ui-color-accent-main-primary)',
			strokeWidth: 3,
			mode: 'inline',
		});
		loader.show();

		const title = Headline.render(
			Loc.getMessage('JS_DISK_DEFERRED_DOC_LOAD_TITLE') ?? '',
			{ size: 'lg', tag: 'h2' },
		);
		Dom.addClass(title, 'disk-deferred-doc-load__title');

		const hint = TextElement.render('', { size: 'lg', tag: 'p' });
		Dom.addClass(hint, 'disk-deferred-doc-load__hint');
		hint.innerHTML = Loc.getMessage('JS_DISK_DEFERRED_DOC_LOAD_HINT', {
			'[immediate_load_link]': `<a class="disk-deferred-doc-load__link" id="${this.immediateLoadLinkId}" href="${Text.encode(url)}">`,
			'[/immediate_load_link]': '</a>',
		}) ?? '';

		return Tag.render`
			<div class="disk-deferred-doc-load">
				${loaderHolder}
				${title}
				${hint}
			</div>
		`;
	}

	private static initLoadLink(): void
	{
		const link = document.getElementById(this.immediateLoadLinkId);

		if (link !== null)
		{
			Event.bind(link, 'click', (e) => {
				e.preventDefault();

				this.loadDocument();
			});
		}
	}

	static getUriToLoad(): string
	{
		const uri = new Uri(document.location.href);
		uri.setQueryParam('immediate_load', 'Y');

		return uri.toString();
	}
}
