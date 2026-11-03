import { Outline } from 'ui.icon-set.api.core';
import { type SectionConfig } from 'socialnetwork.v2.lib.event-sender';
import { Feature } from './feature';

export class Wiki extends Feature
{
	getIcon(): string
	{
		return Outline.WIKI;
	}

	getId(): string
	{
		return 'wiki';
	}

	getAnalyticsConfig(): SectionConfig
	{
		return { tool: 'projects', category: 'project', event: 'open_start_page', cElement: 'wiki_button' };
	}
}
