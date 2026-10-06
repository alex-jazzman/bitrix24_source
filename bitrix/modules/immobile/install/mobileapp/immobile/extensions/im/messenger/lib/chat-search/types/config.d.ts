export interface BaseSearchConfig
{
	id: string;
	context: string;
	clearUnavailableItems: boolean;
	preselectedItems: Array<any>;
	entities: Array<BaseSearchEntity>;
	setOption(options: object): void;
	getConfig(): ajaxConfig;
	getSearchRequestEndpoint(): string;
	getLoadLatestResultEndpoint(): string;
	getSaveItemEndpoint(): string;
}

export interface BaseSearchEntity
{
	id: string;
	dynamicLoad: boolean;
	dynamicSearch: boolean;
	sort?: number;
}

export type ChatSearchConfigSetOptionParams = {
	/** ['users', 'chats', 'bots'] — restrict search to these entities only. */
	includeOnly?: Array<string>;
	/** ['users', 'chats', 'bots'] — drop these entities from the search. */
	exclude?: Array<string>;
	/** Items from RecentTab. */
	recentTab?: Array<string>;
	contextChatId?: number;
	/** Drop im-guest users from server search results. */
	excludeGuests?: boolean;
};
