import { Cache } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { type SliderOptions } from 'main.sidepanel';
import { SidePanel } from 'main.sidepanel';

import './feature.css';

export type FeatureParams = {
	id: string,
	title: string,
	url: string,
	isLocked?: boolean,
	restrictionCode?: string,
	counter?: number,
	[key: string]: any,
};

export const NavigationMode = Object.freeze({
	REDIRECT: 'redirect',
	SIDE_PANEL: 'side-panel',
});

export type NavigationModeType = 'redirect' | 'side-panel';

export class Feature extends EventEmitter
{
	cache = new Cache.MemoryCache();

	constructor(params: FeatureParams = {})
	{
		super();

		this.setEventNamespace(`BX.Socialnetwork.FeatureMenu.Feature-${params.id}`);

		this.params = params;
	}

	getId(): string
	{
		return this.params.id;
	}

	getLayout(): ?HTMLElement
	{
		return null;
	}

	getIcon(): string
	{
		throw new Error('Must be implemented in a child class');
	}

	getIconClass(): string
	{
		return `--${this.getIcon()}`;
	}

	handleClick(event?: Event): void
	{
		this.emit('click');

		if (this.isLocked())
		{
			this.#showRestriction();
			event?.stopPropagation();
			event?.preventDefault();

			return;
		}

		const url = this.getUrl();
		if (!url)
		{
			return;
		}

		if (this.getNavigationMode() === NavigationMode.SIDE_PANEL)
		{
			this.#openSidePanel(url, this.getSliderOptions());
		}
		else
		{
			this.#redirect(url);
		}

		event?.stopPropagation();
		event?.preventDefault();
	}

	isLocked(): boolean
	{
		return this.params.isLocked === true;
	}

	getRestrictionCode(): ?string
	{
		return this.params.restrictionCode;
	}

	#showRestriction(): void
	{
		const code = this.getRestrictionCode();
		if (!code)
		{
			return;
		}

		BX.UI.InfoHelper.show(code);
	}

	getNavigationMode(): NavigationModeType
	{
		return NavigationMode.REDIRECT;
	}

	getSliderOptions(): SliderOptions
	{
		return {};
	}

	#redirect(url: string): void
	{
		window.location.href = url;
	}

	#openSidePanel(url: string, options: SliderOptions = {}): void
	{
		SidePanel.Instance.open(url, options);
	}

	getIconElement(): HTMLElement
	{
		throw new Error('Must be implemented in a child class');
	}

	getActionElement(): ?HTMLElement
	{
		return null;
	}

	getTitle(): string
	{
		return this.params.title;
	}

	getUrl(): string
	{
		return this.params.url;
	}
}
