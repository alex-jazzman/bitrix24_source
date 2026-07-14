import { Outline } from 'ui.icon-set.api.core';
import { NavigationMode, type NavigationModeType } from './feature';

import { Row } from './row';

export class Flows extends Row
{
	getIcon(): string
	{
		return Outline.BOTTLENECK;
	}

	getId(): string
	{
		return 'flows';
	}

	getNavigationMode(): NavigationModeType
	{
		return NavigationMode.SIDE_PANEL;
	}
}
