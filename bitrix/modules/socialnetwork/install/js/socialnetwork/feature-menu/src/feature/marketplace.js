import { Outline } from 'ui.icon-set.api.core';
import { type SectionConfig } from 'socialnetwork.v2.lib.event-sender';
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

	getAnalyticsConfig(): SectionConfig
	{
		return { tool: 'kb', category: 'kb', event: 'open_market', cElement: 'market_button' };
	}

	handleClick(event?: Event): void
	{
		this.trackOpen();
		BX.rest.Marketplace.open({ PLACEMENT: 'SONET_GROUP_DETAIL_TAB' });

		event?.stopPropagation();
		event?.preventDefault();
	}
}
