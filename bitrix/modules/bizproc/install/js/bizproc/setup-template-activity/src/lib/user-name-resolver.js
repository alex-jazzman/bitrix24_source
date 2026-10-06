import { Dialog } from 'ui.entity-selector';
import { getUserSelectorEntities } from './user-value';

// Titles resolved so far, keyed by "entityId:id". A miss is cached as null so a value that the
// provider does not know (deleted user, dropped department) is not re-requested on every redraw.
const NAME_CACHE = new Map();

let pendingItems = new Map();
let pendingWaiters = [];
let isFlushScheduled = false;

function getCacheKey(item: Array): string
{
	const [entityId, id] = item;

	return `${entityId}:${id}`;
}

function readFromCache(keys: Array<string>): Array<string>
{
	return keys.map((key) => NAME_CACHE.get(key)).filter(Boolean);
}

function settleWaiters(waiters: Array): void
{
	waiters.forEach(({ keys, resolve }) => resolve(readFromCache(keys)));
}

function createNameDialog(preselectedItems: Array, events: Object): Dialog
{
	// Headless dialog: never rendered, it only resolves id tokens to titles through the same
	// entity-selector providers the value popup uses. Its constructor starts the load itself.
	return new Dialog({
		context: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_USER_NAMES',
		preselectedItems,
		entities: getUserSelectorEntities(),
		events,
	});
}

function flushBatch(createDialog: Function): void
{
	isFlushScheduled = false;

	const items = [...pendingItems.values()];
	const waiters = pendingWaiters;
	pendingItems = new Map();
	pendingWaiters = [];

	if (items.length === 0)
	{
		settleWaiters(waiters);

		return;
	}

	const dialog = createDialog(items, {
		onLoad: () => {
			items.forEach((item) => {
				NAME_CACHE.set(getCacheKey(item), dialog.getItem(item)?.getTitle() ?? null);
			});
			dialog.destroy();
			settleWaiters(waiters);
		},
		onLoadError: () => {
			// Nothing is cached on a failed load, so the next resolve retries instead of
			// freezing an empty title for an id that does exist.
			dialog.destroy();
			settleWaiters(waiters);
		},
	});
}

/**
 * Resolves entity-selector items ([entityId, id] pairs) to human-readable titles.
 *
 * Every caller within the same tick shares one dialog load, and already known titles are served
 * from the cache - so N constant cards cost one request instead of N.
 *
 * @param {Array} items preselected items to resolve
 * @param {Function} [createDialog] dialog factory, overridden in tests
 * @return {Promise<Array<string>>} titles in the order of the requested items, unknown ones dropped
 */
export function resolveUserNames(items: Array, createDialog: Function = createNameDialog): Promise<Array<string>>
{
	const keys = items.map((item) => getCacheKey(item));
	if (keys.every((key) => NAME_CACHE.has(key)))
	{
		return Promise.resolve(readFromCache(keys));
	}

	return new Promise((resolve) => {
		items.forEach((item, index) => {
			if (!NAME_CACHE.has(keys[index]))
			{
				pendingItems.set(keys[index], item);
			}
		});
		pendingWaiters.push({ keys, resolve });

		if (!isFlushScheduled)
		{
			isFlushScheduled = true;
			// Microtask: collect every card rendered in the same tick into a single load.
			queueMicrotask(() => flushBatch(createDialog));
		}
	});
}
