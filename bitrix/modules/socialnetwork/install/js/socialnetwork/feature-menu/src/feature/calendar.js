import { Outline } from 'ui.icon-set.api.core';
import { type SectionConfig } from 'socialnetwork.v2.lib.event-sender';
import { NavigationMode, type NavigationModeType } from './feature';

import { Base } from './base';

export class Calendar extends Base
{
	getIcon(): string
	{
		return Outline.CALENDAR_WITH_SLOTS;
	}

	getId(): string
	{
		return 'calendar';
	}

	getNavigationMode(): NavigationModeType
	{
		return NavigationMode.SIDE_PANEL;
	}

	getAnalyticsConfig(): SectionConfig
	{
		return { tool: 'calendar', category: 'calendar', event: 'open_section', cElement: 'calendar_view_button' };
	}
}
