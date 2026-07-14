import { IBaseRecentService } from '../base/type';

export interface ISearchService extends IBaseRecentService
{
	openSearch(): void;
}

declare type CommonSearchServiceProps = {
	recentTab: string,
	sections?: string[],
	searchUsers?: boolean,
	parentId?: number | null,
};
