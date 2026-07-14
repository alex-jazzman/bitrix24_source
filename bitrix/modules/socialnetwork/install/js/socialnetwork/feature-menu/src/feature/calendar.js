import { Outline } from 'ui.icon-set.api.core';
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
}
