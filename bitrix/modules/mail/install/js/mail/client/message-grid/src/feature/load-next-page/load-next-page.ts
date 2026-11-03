import { type GridModeValue, type GridScreen } from '../../const';
import {
	isPageOutOfRange,
	isSyncUnavailable,
	MessageListApi,
} from '../../infrastructure/service/message-list/message-list';
import { type GridPagePayload } from '../../model/grid/types';

/**
 * The registry arrives as an argument: the grid that started last owns the global resolution, so a
 * scenario that asked for one by itself would write the next page of the messages into the drafts.
 */
export type PageRegistry = {
	mode: GridModeValue,
	screen: GridScreen | null,
	page: number,
	enableNextPage: boolean,
	loadingPage: boolean,
	reloadPending: boolean,
	setPageLoading(loading: boolean): void,
	setPageFailed(failed: boolean): void,
	setPageSyncBlocked(blocked: boolean): void,
	setPageLimitReached(reached: boolean): void,
	setReloadPending(pending: boolean): void,
	setPage(payload: GridPagePayload): void,
	appendPage(payload: GridPagePayload): void,
};

/**
 * The grid is announced updated once the page stands in the state: the window of the files closes on
 * that event and would otherwise be left hanging by a button that has moved.
 */
export async function loadNextPage(registry: PageRegistry, announceUpdated: () => void): Promise<void>
{
	if (registry.loadingPage || !registry.enableNextPage || registry.screen === null)
	{
		return;
	}

	const screen = registry.screen;
	const nextPage = registry.page + 1;

	registry.setPageFailed(false);
	registry.setPageLoading(true);

	try
	{
		registry.appendPage(await MessageListApi.getListPage(registry.mode, screen, nextPage));
		announceUpdated();
	}
	catch (error)
	{
		// the rows stay as they were; the button offers another try unless the failure is one no try
		// gets past - the plan holding the mailbox, or the end of what the list answers for
		registry.setPageFailed(true);
		registry.setPageSyncBlocked(isSyncUnavailable(error));
		registry.setPageLimitReached(isPageOutOfRange(error));
	}
	finally
	{
		registry.setPageLoading(false);
	}
}
