import { Outline } from 'ui.icon-set.api.core';
import { type Counter } from 'ui.cnt';

import { NavigationMode, type NavigationModeType } from './feature';

import { Base } from './base';

export class Tasks extends Base
{
	getIcon(): string
	{
		return Outline.TASK;
	}

	getCounter(): ?Counter
	{
		return this.cache.remember('counter', () => {
			if (Number(this.params.counter) < 1)
			{
				return null;
			}

			return null;
		});
	}

	getId(): string
	{
		return 'tasks';
	}

	getNavigationMode(): NavigationModeType
	{
		return NavigationMode.SIDE_PANEL;
	}
}
