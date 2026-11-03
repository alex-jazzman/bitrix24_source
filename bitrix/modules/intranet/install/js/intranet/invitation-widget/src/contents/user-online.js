import { ajax, Dom, Runtime, Tag } from 'main.core';
import { Loader } from 'main.loader';

import { Content } from './content';

export class UserOnlineContent extends Content
{
	getLoader(): Loader
	{
		return this.cache.remember('loader', () => {
			return new Loader({
				size: 45,
			});
		});
	}

	getComponentContent(): HTMLElement
	{
		return this.cache.remember('component-content', () => {
			const contentContainer = Tag.render`
				<div data-role="invitation-widget-ustat-online" class="invitation-widget-ustat-online"/>
			`;

			Dom.attr(contentContainer, 'aria-busy', 'true');
			this.getLoader().show(contentContainer);
			this.#loadComponentContent(contentContainer).catch(() => Dom.clean(contentContainer));

			return contentContainer;
		});
	}

	async #loadComponentContent(contentContainer: HTMLElement): Promise<void>
	{
		try
		{
			const response = await ajax.runAction('intranet.invitationwidget.getUserOnlineComponent');
			const assets = response.data.assets;

			await new Promise((resolve) => {
				BX.load([...assets.css, ...assets.js], resolve);
			});
			await Runtime.html(null, [...assets.string].join('\n'), { useAdjacentHTML: true });
			await Runtime.html(contentContainer, response.data.html);
		}
		finally
		{
			Dom.attr(contentContainer, 'aria-busy', 'false');
			this.getLoader().hide();
			this.getLoader().destroy();
			this.cache.delete('loader');
		}
	}

	getLayout(): HTMLDivElement
	{
		return this.cache.remember('layout', () => {
			return Tag.render`
				<div class="intranet-invitation-widget-item intranet-invitation-widget-item--wide intranet-invitation-widget-item--no-padding">
					${this.getComponentContent()}
				</div>
			`;
		});
	}
}
