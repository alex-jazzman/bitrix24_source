import { Core } from 'im.v2.application.core';
import { RestMethod } from 'im.v2.const';

import { isSharedLinkCopyAllowed } from '../../helpers/shared-link';

import type { Store } from 'ui.vue3.vuex';
import type { ImModelSidebarSharedLinkItem } from 'im.v2.model';

type GetIndividualLinkResult = {
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

	getInitialQuery(): ?{ [$Values<typeof RestMethod>]: { dialogId: string } }
	{
		if (!isSharedLinkCopyAllowed(this.dialogId))
		{
			return null;
		}

		return {
			[RestMethod.imV2ChatSharedLinkGetIndividual]: { dialogId: this.dialogId },
		};
	}

	getResponseHandler(): () => Promise
	{
		return (response) => {
			if (!this.getInitialQuery())
			{
				return Promise.resolve();
			}

			if (!response[RestMethod.imV2ChatSharedLinkGetIndividual])
			{
				return Promise.reject(new Error('SidebarChat service error: no response'));
			}

			return this.updateModels(response[RestMethod.imV2ChatSharedLinkGetIndividual]);
		};
	}

	updateModels(resultData: GetIndividualLinkResult): Promise
	{
		const { sharingLink } = resultData;

		if (!sharingLink)
		{
			return Promise.resolve();
		}

		return this.store.dispatch('sidebar/sharedLink/set', sharingLink);
	}
}
