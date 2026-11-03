import { Cache, Runtime, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { type SliderOptions } from 'main.sidepanel';
import { SidePanel } from 'main.sidepanel';
import { SectionAnalytics, type SectionConfig } from 'socialnetwork.v2.lib.event-sender';

import './feature.css';

export type FeatureParams = {
	id: string,
	title: string,
	url: string,
	projectId?: number,
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
			// A click handler is synchronous, so a rejection of the asynchronous window has
			// nowhere to go: showRestriction() has already reported the failure to the console,
			// and an unhandled rejection would only report it a second time.
			void this.showRestriction(this.getRestrictionCode()).catch(() => {});
			event?.stopPropagation();
			event?.preventDefault();

			return;
		}

		const url = this.getUrl();
		if (!url)
		{
			return;
		}

		this.trackOpen();

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

	getAnalyticsConfig(): ?SectionConfig
	{
		return null;
	}

	trackOpen(): void
	{
		const config = this.getAnalyticsConfig();
		const projectId = this.params.projectId;
		if (!config || !projectId)
		{
			return;
		}

		(new SectionAnalytics()).trackOpen(config, projectId);
	}

	isLocked(): boolean
	{
		return this.params.isLocked === true;
	}

	getRestrictionCode(): ?string
	{
		return this.params.restrictionCode;
	}

	showRestriction(code: ?string): Promise<void>
	{
		if (!code)
		{
			return Promise.resolve();
		}

		// A row locked by the server is rendered locked on a page which has already got
		// ui.info-helper: show the window right away, without a round-trip to the portal.
		if (this.#hasRestrictionWindow())
		{
			return this.#showRestrictionWindow(code);
		}

		// A row may turn out to be restricted only by the server answer, so the page
		// carrying the menu has no reason to load ui.info-helper — take it on demand.
		return Runtime.loadExtension('ui.info-helper')
			.catch((error) => {
				console.error('Feature: failed to load ui.info-helper', error);

				throw error;
			})
			.then(() => {
				return this.#showRestrictionWindow(code);
			})
		;
	}

	// ui.info-helper is bundled into the BX.UI namespace, so a loaded extension is visible
	// on the page without asking the loader about it.
	#hasRestrictionWindow(): boolean
	{
		return Type.isFunction(BX.UI?.InfoHelper?.show);
	}

	#showRestrictionWindow(code: string): Promise<void>
	{
		if (!this.#hasRestrictionWindow())
		{
			const error = new Error('Feature: the restriction window (BX.UI.InfoHelper) is missing');
			console.error(error.message);

			return Promise.reject(error);
		}

		try
		{
			BX.UI.InfoHelper.show(code);
		}
		catch (error)
		{
			console.error('Feature: failed to show the restriction window', error);

			return Promise.reject(error);
		}

		return Promise.resolve();
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
