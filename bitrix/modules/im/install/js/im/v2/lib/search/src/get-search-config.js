import type { SearchConfig, EntitySelectorRequestConfig } from './types/types';

export const EntityId = 'im-recent-v2';
const ContextId = 'IM_CHAT_SEARCH';
const SearchDialogId = 'im-chat-search';

export const getSearchConfig = (searchConfig: SearchConfig): EntitySelectorRequestConfig => {
	const entity = {
		id: EntityId,
		dynamicLoad: true,
		dynamicSearch: true,
		options: searchConfig,
	};

	return {
		dialog: {
			entities: [
				entity,
			],
			preselectedItems: [],
			clearUnavailableItems: false,
			context: ContextId,
			id: SearchDialogId,
		},
	};
};
