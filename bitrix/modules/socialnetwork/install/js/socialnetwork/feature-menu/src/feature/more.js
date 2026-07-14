import { Outline } from 'ui.icon-set.api.core';

import { Row } from './row';

export class More extends Row
{
	getId(): string
	{
		return 'more';
	}

	getTitle(): string
	{
		return 'More';
	}

	getIcon(): string
	{
		return Outline.MORE_L;
	}

	getUrl(): string
	{
		return '';
	}
}
