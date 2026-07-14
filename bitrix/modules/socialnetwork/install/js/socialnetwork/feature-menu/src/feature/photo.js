import { Outline } from 'ui.icon-set.api.core';
import { Feature, NavigationMode, type NavigationModeType } from './feature';

export class Photo extends Feature
{
	getIcon(): string
	{
		return Outline.CAMERA;
	}

	getId(): string
	{
		return 'photo';
	}

	getNavigationMode(): NavigationModeType
	{
		return NavigationMode.SIDE_PANEL;
	}
}
