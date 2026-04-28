import { MessengerModel, PayloadData } from '../../../base';

export type FilterId = 'filter-all' | 'filter-unread';

export type RecentFilterElement = {
	currentFilterId: FilterId;
	idCollection: Set<string>;
};

export type RecentFilteredModelCollection = {
	collection: Record<string, RecentFilterElement>;
};

export type RecentFilteredMessengerModel = MessengerModel<RecentFilteredModelCollection>;

export type RecentFilteredModelActions =
	| 'recentModel/recentFilteredModel/setCurrentFilter'
	| 'recentModel/recentFilteredModel/setIdCollection'
	| 'recentModel/recentFilteredModel/clearIdCollection';

export type RecentFilteredModelMutation =
	| 'recentModel/recentFilteredModel/setCurrentFilter'
	| 'recentModel/recentFilteredModel/setIdCollection'
	| 'recentModel/recentFilteredModel/clearIdCollection';

export interface RecentFilteredSetCurrentFilterData extends PayloadData
{
	tabId: string;
	filterId: FilterId;
}

export interface RecentFilteredSetIdCollectionData extends PayloadData
{
	tabId: string;
	itemIds: Array<string>;
}

export interface RecentFilteredClearIdCollectionData extends PayloadData
{
	tabId: string;
}

export type RecentFilteredModelActionParams = {
	'recentModel/recentFilteredModel/setCurrentFilter': RecentFilteredSetIdCollectionData;
	'recentModel/recentFilteredModel/setIdCollection': RecentFilteredSetIdCollectionData;
	'recentModel/recentFilteredModel/clearIdCollection': RecentFilteredClearIdCollectionData;
};

export type RecentFilteredModelSetIdCollectionActions = 'setIdCollection';

export type RecentFilteredModelSetCurrentFilterActions = 'setCurrentFilter';

export type RecentFilteredModelClearIdCollectionActions = 'clearIdCollection';
