import { IBaseRecentService } from '../base/type';

declare type FilterId = 'filter-all' | 'filter-unread';

export interface IFilterService extends IBaseRecentService
{
	applyFilter(filterId: FilterId, options?: { bySelf?: boolean }): void;
	resetFilter(options?: { bySelf?: boolean }): void;
	getCurrentFilterId(): string | null;
	hasSelectedFilter(): boolean;
	consumeChangedBySelf(): boolean;
}

declare type CommonFilterServiceProps = {
	defaultFilterId?: string,
}
