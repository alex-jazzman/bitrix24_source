import { Outline } from 'ui.icon-set.api.core';
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
}
