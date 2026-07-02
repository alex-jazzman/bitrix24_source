import type { SearchConfig, EntitySelectorRequestConfig } from './types/types';

export const EntityId = 'im-recent-v2';
const ContextId = 'IM_CHAT_SEARCH';
const SearchDialogId = 'im-chat-search';

export const getSearchConfig = (searchConfig: SearchConfig): EntitySelectorRequestConfig => {
	const {
		entityId = EntityId,
		contextId = ContextId,
		searchDialogId = SearchDialogId,
		...entityOptions
	} = searchConfig;

	const entity = {
		id: entityId,
		dynamicLoad: true,
		dynamicSearch: true,
		options: entityOptions,
	};

	return {
		dialog: {
			entities: [
				entity,
			],
			preselectedItems: [],
			clearUnavailableItems: false,
			context: contextId,
			id: searchDialogId,
		},
	};
};
