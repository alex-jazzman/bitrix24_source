import { Outline } from 'ui.icon-set.api.core';
import { Feature } from './feature';

export class Forum extends Feature
{
	getIcon(): string
	{
		return Outline.CONTACT;
	}

	getId(): string
	{
		return 'forum';
	}
}
