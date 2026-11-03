import { Outline } from 'ui.icon-set.api.core';
import { type SectionConfig } from 'socialnetwork.v2.lib.event-sender';
import { Feature, NavigationMode, type NavigationModeType } from './feature';

export class Photo extends Feature
{
	getIcon(): string
	{
		return Outline.CAMERA;
	}

	getId(): string
	{
		return 'photo';
	}

	getAnalyticsConfig(): SectionConfig
	{
		return { tool: 'projects', category: 'project', event: 'open_section', cElement: 'photos_button' };
	}

	getNavigationMode(): NavigationModeType
	{
		return NavigationMode.SIDE_PANEL;
	}
}
