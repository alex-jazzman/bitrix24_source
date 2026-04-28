import { IBaseRecentService } from '../base/type';

declare type FilterId = 'filter-all' | 'filter-unread';

export interface IFilterService extends IBaseRecentService
{
	applyFilter(filterId: FilterId): void;
	getCurrentFilterId(): string | null;
	hasSelectedFilter(): boolean;
}

declare type CommonFilterServiceProps = {
	defaultFilterId?: string,
}
