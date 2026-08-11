import { type Store } from 'ui.vue3.vuex';

import { Core } from 'im.v2.application.core';
import { RestMethod } from 'im.v2.const';
import { type ImModelSidebarSharedLinkItem } from 'im.v2.model';

import { isGuestLinkCopyAllowed, isSharedLinkCopyAllowed } from '../../helpers/shared-link';

type LinkResult = {
	sharingLink: ImModelSidebarSharedLinkItem,
};

export class SharedLink
{
	store: Store;
	dialogId: string;

	constructor({ dialogId }: { dialogId: string })
	{
		this.store = Core.getStore();
		this.dialogId = dialogId;
	}

	getInitialQuery(): { [$Values<typeof RestMethod>]: { dialogId: string } }
	{
		const query = {};

		if (isSharedLinkCopyAllowed(this.dialogId))
		{
			query[RestMethod.imV2ChatSharedLinkGetIndividual] = { dialogId: this.dialogId };
		}

		if (isGuestLinkCopyAllowed(this.dialogId))
		{
			query[RestMethod.imV2GuestLinkGenerate] = { dialogId: this.dialogId };
		}

		return query;
	}

	getResponseHandler(): () => Promise<void>
	{
		return (response) => {
			const updateStorePromise = [];
			if (!response)
			{
				return Promise.all(updateStorePromise);
			}

			const individualResponse: LinkResult = response[RestMethod.imV2ChatSharedLinkGetIndividual];
			if (individualResponse)
			{
				updateStorePromise.push(this.updateModels(individualResponse));
			}

			const guestResponse: LinkResult = response[RestMethod.imV2GuestLinkGenerate];
			if (guestResponse)
			{
				updateStorePromise.push(this.updateModels(guestResponse));
			}

			return Promise.all(updateStorePromise);
		};
	}

	updateModels(resultData: LinkResult): Promise<void>
	{
		const { sharingLink } = resultData;
		if (!sharingLink)
		{
			return Promise.resolve();
		}

		return this.store.dispatch('sidebar/sharedLink/set', sharingLink);
	}
}
