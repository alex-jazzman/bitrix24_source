import { Outline } from 'ui.icon-set.api.core';
import { type SectionConfig } from 'socialnetwork.v2.lib.event-sender';
import { NavigationMode, type NavigationModeType } from './feature';

import { Base } from './base';

export class Files extends Base
{
	getIcon(): string
	{
		return Outline.ATTACH;
	}

	getId(): string
	{
		return 'files';
	}

	getNavigationMode(): NavigationModeType
	{
		return NavigationMode.SIDE_PANEL;
	}

	getAnalyticsConfig(): SectionConfig
	{
		return { tool: 'files', category: 'files_operations', event: 'open_section', cElement: 'files_button' };
	}
}
