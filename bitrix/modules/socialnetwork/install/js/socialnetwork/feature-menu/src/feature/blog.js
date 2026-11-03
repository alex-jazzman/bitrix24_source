import { type SliderOptions } from 'main.sidepanel';
import { Outline } from 'ui.icon-set.api.core';
import { type SectionConfig } from 'socialnetwork.v2.lib.event-sender';
import { Feature, NavigationMode, type NavigationModeType } from './feature';

export class Blog extends Feature
{
	getIcon(): string
	{
		return Outline.NEWSFEED;
	}

	getId(): string
	{
		return 'blog';
	}

	getAnalyticsConfig(): SectionConfig
	{
		return { tool: 'feed', category: 'feed', event: 'open_section', cElement: 'feed_button' };
	}

	getNavigationMode(): NavigationModeType
	{
		return NavigationMode.SIDE_PANEL;
	}

	getSliderOptions(): SliderOptions
	{
		return {
			contentClassName: 'bitrix24-group-slider-content',
			loader: 'intranet:slider-livefeed',
			cacheable: false,
			customLeftBoundary: 0,
			newWindowLabel: true,
			copyLinkLabel: true,
			width: Math.round(window.innerWidth * 0.8),
		};
	}
}
