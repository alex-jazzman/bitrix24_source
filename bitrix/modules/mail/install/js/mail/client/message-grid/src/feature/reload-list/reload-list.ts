import { isSyncUnavailable, MessageListApi } from '../../infrastructure/service/message-list/message-list';
import { type PageRegistry } from '../load-next-page/load-next-page';

/**
 * The list from its first page again - what a neighbour asks for after it has changed something the
 * list shows (`binding.js:126`). Pages loaded on top of the first one go with it. Nothing is
 * remounted and no address changes, so the page keeps the place it was scrolled to.
 *
 * An ask that arrives while a page is on its way is kept rather than dropped: the screen hides the
 * rows it has acted on and waits for this reload to bring them back or leave them out, so a dropped
 * ask leaves the reader looking at messages that have gone. Several asks make one reload.
 */
export async function reloadList(registry: PageRegistry, announceUpdated: () => void): Promise<void>
{
	if (registry.screen === null)
	{
		return;
	}

	if (registry.loadingPage)
	{
		registry.setReloadPending(true);

		return;
	}

	const screen = registry.screen;

	// dropped before the request rather than after it, so that an ask arriving while this one is on
	// its way is kept and answered by the reload that follows
	registry.setReloadPending(false);
	registry.setPageFailed(false);
	registry.setPageLoading(true);

	try
	{
		registry.setPage(await MessageListApi.getListPage(registry.mode, screen, 1));
		announceUpdated();
	}
	catch (error)
	{
		registry.setPageFailed(true);
		registry.setPageSyncBlocked(isSyncUnavailable(error));
	}
	finally
	{
		registry.setPageLoading(false);
	}

	await drainPendingReload(registry, announceUpdated);
}

/**
 * The reload that was kept while a page was on its way, once that page has come back. Runs whatever
 * the page came back with: the ask was about the list having changed, and a page that failed changed
 * nothing about that. The two scenarios of paging never run at once, so this walks no further than
 * the one reload it was kept for.
 */
export async function drainPendingReload(registry: PageRegistry, announceUpdated: () => void): Promise<void>
{
	if (!registry.reloadPending)
	{
		return;
	}

	await reloadList(registry, announceUpdated);
}
