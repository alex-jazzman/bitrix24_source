export { getSearchConfig, EntityId } from './get-search-config';
export { StoreUpdater } from './store-updater';
export { LocalSearch } from './local-search';
export { getUsersFromRecentItems } from './helpers/get-users-from-recent-items';
export { getRecentListItems } from './helpers/get-recent-items';
export { sortByDate } from './helpers/sort-items-by-date';
export { EntitySearch, MAX_ENTITIES_IN_SEARCH_LIST } from './const/const';

export type {
	ImRecentProviderItem,
	SearchResultItem,
	SearchConfig,
	EntitySearchConfigType,
	MentionSearchConfigType,
} from './types/types';
