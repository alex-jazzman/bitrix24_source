import { SearchService as SearchServiceIm } from 'im.v2.provider.service.search';
import { RecentType } from 'im.v2.const';

import { StoreUpdater } from 'imopenlines.v2.lib.search';

const SEARCH_CONFIG = {
	entityId: 'imol-chat',
	contextId: 'IM_OPENLINES_SEARCH',
	searchDialogId: 'im-openlines-search',
	searchRecentSection: RecentType.openlines,
};

export class SearchService extends SearchServiceIm
{
	#storeUpdater: StoreUpdater;

	constructor()
	{
		super(SEARCH_CONFIG);
		this.#storeUpdater = new StoreUpdater();
	}

	updateCustomStore(items): Promise
	{
		return this.#storeUpdater.update(items);
	}
}
