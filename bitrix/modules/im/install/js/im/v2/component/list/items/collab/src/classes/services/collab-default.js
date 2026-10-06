import { Core } from 'im.v2.application.core';
import { RecentType, type RecentTypeItem } from 'im.v2.const';
import { BaseRecentService, type RecentRestResult, type RecentFirstPageRestResult } from 'im.v2.provider.service.recent';
import { type RawRecentItem } from 'im.v2.provider.service.types';

import { saveCollabInfo } from './helpers/save-collab-info';

type ExtractItemsResult = { collectionItems: RawRecentItem[], fixedItems: RawRecentItem[] };

export class CollabDefaultService extends BaseRecentService
{
	getRecentType(): RecentTypeItem
	{
		return RecentType.collabDefault;
	}

	saveRecentItems(restResult: RecentRestResult): Promise
	{
		const { collectionItems, fixedItems } = this.#extractFixedItems(restResult);

		const setPayload = {
			type: this.getRecentType(),
			items: collectionItems,
			unread: this.getUnreadMode(),
			parentChatId: this.getParentChatId(),
		};

		return Promise.all([
			Core.getStore().dispatch('recent/set', fixedItems),
			Core.getStore().dispatch('recent/setCollection', setPayload),
		]);
	}

	saveFirstPageData(restResult: RecentFirstPageRestResult): Promise
	{
		return saveCollabInfo(restResult, this.getParentChatId());
	}

	#extractFixedItems(restResult: RecentRestResult): ExtractItemsResult
	{
		const { recentItems, sectionMeta } = restResult;
		const fixedChatIds = sectionMeta ? sectionMeta.fixedChatIds : [];

		const collectionItems = [];
		const fixedItems = [];

		recentItems.forEach((item) => {
			if (fixedChatIds.includes(item.chatId))
			{
				fixedItems.push(item);

				return;
			}

			collectionItems.push(item);
		});

		return { collectionItems, fixedItems };
	}
}
