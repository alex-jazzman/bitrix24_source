import { Extension, Page, Text } from 'main.core';
import { type LinkOptions, type RuleOptions } from 'main.sidepanel';

import { setLoadingState } from './loading-state';
import { openAppSlider } from './open-app-slider';

const SELF_EXTENSION = 'vibecodeconnector.sidepanel-binder';

const APP_PAGE_CONDITION = '^(?:https?:)?(?://[^/]+)?/vibecode/app/(\\d+)/?(?:[?#]|$)';
const LEGACY_APP_PAGE_CONDITION = '^(?:https?:)?(?://[^/]+)?/bitrix/services/main/ajax\\.php'
	+ '\\?(?=(?:[^#]*&)?action=vibecodeconnector\\.Catalog\\.openAppPage(?:[&#]|$))'
	+ '(?:[^#]*&)?catalogItemId=(\\d+)(?:[&#]|$)';

const pendingItemIds: Set<number> = new Set();

export function createAppPageRule(): RuleOptions
{
	return {
		condition: [APP_PAGE_CONDITION, LEGACY_APP_PAGE_CONDITION],
		handler: (event: MouseEvent, link: LinkOptions): boolean => {
			if (!isOpenAppInIframeEnabled())
			{
				return false;
			}

			const catalogItemId = Text.toInteger(link?.matches?.[1]);
			if (catalogItemId <= 0)
			{
				return false;
			}

			event.preventDefault();

			if (!pendingItemIds.has(catalogItemId))
			{
				openCatalogApp(catalogItemId, link.url, link?.anchor ?? null);
			}

			return true;
		},
	};
}

function isOpenAppInIframeEnabled(): boolean
{
	return Extension.getSettings(SELF_EXTENSION).get('openAppInIframe', false) === true;
}

async function openCatalogApp(catalogItemId: number, url: string, anchor: HTMLElement | null): Promise<void>
{
	pendingItemIds.add(catalogItemId);
	setLoadingState(anchor, true);

	try
	{
		if (!await openAppSlider(catalogItemId))
		{
			Page.redirect(url);
		}
	}
	finally
	{
		pendingItemIds.delete(catalogItemId);
		setLoadingState(anchor, false);
	}
}
