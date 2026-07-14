import { DialogId } from '../../../types/common';
import { RecentSearchResult } from './server-search-service';

declare global
{
	interface LocalSearchStrategy
	{
		search(opts: Partial<SearchOptions>): Promise<Array<string>>;
		/** Optional, used for pre-warming sub-flows like mention membership. */
		preload?(payload: object): Promise<Array<string>>;
	}

	interface ServerSearchStrategy
	{
		search(words: Array<string>, query: string): Promise<RecentSearchResult>;
		loadRecent(): Promise<Array<string>>;
		saveItemToRecent(dialogId: DialogId): Promise<unknown>;
	}
}

export {};
