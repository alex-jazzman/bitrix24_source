import { Outline } from 'ui.icon-set.api.core';

import { Row } from './row';

export class Apps extends Row
{
	getId(): string
	{
		return 'apps';
	}

	getTitle(): string
	{
		return 'Apps';
	}

	getIcon(): string
	{
		return Outline.ADD_PRODUCT;
	}

	getUrl(): string
	{
		return '';
	}
}
