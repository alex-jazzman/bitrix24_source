import { Outline } from 'ui.icon-set.api.core';
// eslint-disable-next-line @bitrix24/bitrix24-rules/need-alias
import 'marketplace';

import { Row } from './row';

export class Marketplace extends Row
{
	getIcon(): string
	{
		return Outline.MARKET;
	}

	getId(): string
	{
		return 'marketplace';
	}

	handleClick(event?: Event): void
	{
		BX.rest.Marketplace.open({ PLACEMENT: 'SONET_GROUP_DETAIL_TAB' });

		event?.stopPropagation();
		event?.preventDefault();
	}
}
