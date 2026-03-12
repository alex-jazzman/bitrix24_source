import { Cache, Loc } from 'main.core';
import { MemoryCache } from 'main.core.cache';
import { Button } from 'ui.buttons';

export class CreatePortalButton
{
	#cache: MemoryCache = new Cache.MemoryCache();

	renderTo(node: HTMLElement): void
	{
		this.#getButton().renderTo(node);
	}

	#getButton(): Button
	{
		return this.#cache.remember('button', () => {
			return new Button({
				text: Loc.getMessage('INTRANET_JS_CREATE_PORTAL_BUTTON_TITLE'),
				color: Button.Color.PRIMARY,
				tag: Button.Tag.LINK,
				className: 'intranet-button-create-portal',
				size: Button.Size.SMALL,
				round: true,
				noCaps: true,
				props: {
					href: 'https://www.bitrix24.net/create/',
					target: '_blank',
					id: 'intranet-button-create-portal',
				},
			});
		});
	}
}
