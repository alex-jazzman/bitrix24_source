import { Outline } from 'ui.icon-set.api.core';
import { NavigationMode, type NavigationModeType } from './feature';

import { Row } from './row';

export class Knowledge extends Row
{
	getIcon(): string
	{
		if (this.isLocked())
		{
			return Outline.LOCK_L;
		}

		return Outline.KNOWLEDGE_BASE;
	}

	getId(): string
	{
		return 'landing_knowledge';
	}

	getNavigationMode(): NavigationModeType
	{
		return NavigationMode.SIDE_PANEL;
	}
}
