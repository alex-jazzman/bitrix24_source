import { Outline } from 'ui.icon-set.api.core';
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
}
