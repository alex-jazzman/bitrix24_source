import { Outline } from 'ui.icon-set.api.core';
import { Feature } from './feature';

export class Placement extends Feature
{
	getIcon(): string
	{
		return Outline.FOLDER;
	}
}
