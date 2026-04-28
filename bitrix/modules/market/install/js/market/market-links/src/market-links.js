import { Type } from 'main.core';

const MAIN_DIR = '/market/';

export class MarketLinks
{
	static siteTemplateUri = '';
	static siteCurrentType = null;

	static mainLink()
	{
		return MAIN_DIR;
	}

	static favoritesLink()
	{
		return MAIN_DIR + 'favorites/';
	}

	static installedLink()
	{
		return MAIN_DIR + 'installed/';
	}

	static categoryLink(categoryCode)
	{
		return MAIN_DIR + 'category/' + categoryCode + '/';
	}

	static collectionLink(collectionId, showOnPage)
	{
		if (showOnPage === 'Y')
		{
			return MarketLinks.collectionPageLink(collectionId);
		}

		return MAIN_DIR + 'collection/' + collectionId + '/';
	}

	static collectionPageLink(collectionId)
	{
		return MAIN_DIR + 'collection/page/' + collectionId + '/';
	}

	static appDetail(appItem, queryParams = {})
	{
		const appCode = appItem.CODE ?? appItem.APP_CODE;

		if (appItem.IS_SITE_TEMPLATE === 'Y')
		{
			const landingType = Type.isString(appItem.LANDING_TYPE) ? appItem.LANDING_TYPE : 'LANDING';

			return MarketLinks.getSiteDetailLink(appCode, landingType, queryParams);
		}

		const params = (new URLSearchParams(queryParams)).toString();
		const query = (params.length) ? '?' + params : '';

		return MAIN_DIR + 'detail/' + appCode + '/' + query;
	}

	static getSiteDetailLink(appCode, landingType, queryParams)
	{
		const from = queryParams.from ?? '';
		const baseUri = MarketLinks.getSiteTemplateUri(landingType);

		const uri = new URL(baseUri, window.location.href);
		uri.searchParams.set('IS_FRAME', 'Y');
		uri.searchParams.set('tpl', 'market/' + appCode);

		if (from.length > 0)
		{
			uri.searchParams.set('from', from);
		}

		return uri.pathname + uri.search;
	}

	static getSiteTemplateUri(landingType): string
	{
		if (MarketLinks.siteCurrentType === null)
		{
			MarketLinks.siteCurrentType = landingType;

			const uri = (new URLSearchParams(document.location.search)).get('create_uri');
			MarketLinks.siteTemplateUri = (Type.isString(uri) && uri.startsWith('/')) ? uri : '';
		}

		if (
			landingType !== MarketLinks.siteCurrentType
			|| MarketLinks.siteTemplateUri.length <= 0
		)
		{
			return MarketLinks.getSiteTemplateDefaultUri(landingType);
		}

		return MarketLinks.siteTemplateUri;
	}

	static getSiteTemplateDefaultUri(landingType)
	{
		if (landingType === 'VIBE')
		{
			return '/welcome/new/';
		}

		return '/sites/site/edit/0/';
	}

	static openSiteTemplate(event, isSiteTemplate)
	{
		if (isSiteTemplate)
		{
			event.preventDefault();
			BX.SidePanel.Instance.open(event.currentTarget.href, {
				customLeftBoundary: 60,
			});
		}
	}
}