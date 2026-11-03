export { getSearchConfig, EntityId } from './get-search-config';
export { StoreUpdater } from './store-updater';
export { LocalSearch, SearchItemOrigin } from './local-search';
export { MentionStateStore } from './mention-state-store';
export { getUsersFromRecentItems } from './helpers/get-users-from-recent-items';
export { getRecentListItems } from './helpers/get-recent-items';
export { sortByDate } from './helpers/sort-items-by-date';
export { mergeSearchItems } from './helpers/merge-search-items';
export { EntitySearch, MAX_ENTITIES_IN_SEARCH_LIST } from './const/const';

export type {
	ImRecentProviderItem,
	SearchResultItem,
	LocalSearchItemOrigin,
	SearchConfig,
	EntitySearchConfigType,
	MentionSearchConfigType,
} from './types/types';
