import { ajax } from 'main.core';

import {
	type CatalogLinkState,
	type CatalogShareState,
	type SetCatalogLinkPayload,
} from './catalog-share-types';

type ShareResponse = {
	data: {
		share: CatalogShareState,
	},
};

type LinkResponse = {
	data: {
		linkState: CatalogLinkState,
	},
};

export class CatalogShareApi
{
	getShare(catalogItemId: number): Promise<CatalogShareState>
	{
		return ajax.runAction('vibecodeconnector.Catalog.getShare', {
			data: { catalogItemId },
		}).then((response: ShareResponse) => response.data.share);
	}

	setShare(catalogItemId: number, share: CatalogShareState): Promise<CatalogShareState>
	{
		const data = {
			catalogItemId,
			audience: share.audience,
		};

		if (share.users.length > 0)
		{
			data.users = share.users;
		}

		if (share.departments.length > 0)
		{
			data.departments = share.departments;
		}

		return ajax.runAction('vibecodeconnector.Catalog.setShare', {
			data,
		}).then((response: ShareResponse) => response.data.share);
	}

	getLink(catalogItemId: number): Promise<CatalogLinkState>
	{
		return ajax.runAction('vibecodeconnector.Catalog.getLink', {
			data: { catalogItemId },
		}).then((response: LinkResponse) => response.data.linkState);
	}

	setLink(catalogItemId: number, payload: SetCatalogLinkPayload): Promise<CatalogLinkState>
	{
		const data = {
			catalogItemId,
			enabled: payload.enabled ? 1 : 0,
		};

		if (payload.enabled)
		{
			data.requireB24Auth = payload.requireB24Auth ? 1 : 0;

			if (payload.expiresAt !== null)
			{
				data.expiresAt = payload.expiresAt;
			}
		}

		return ajax.runAction('vibecodeconnector.Catalog.setLink', {
			data,
		}).then((response: LinkResponse) => response.data.linkState);
	}
}

export const catalogShareApi = new CatalogShareApi();
