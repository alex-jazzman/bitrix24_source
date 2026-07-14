import { Outline } from 'ui.icon-set.api.core';
import { Feature } from './feature';

export class Lists extends Feature
{
	getIcon(): string
	{
		return Outline.ACTION_REQUIRED;
	}

	getId(): string
	{
		return 'group_lists';
	}
}
