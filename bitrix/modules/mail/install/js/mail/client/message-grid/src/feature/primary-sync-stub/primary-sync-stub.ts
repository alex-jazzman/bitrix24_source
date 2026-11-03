/** How long the list waits behind the loader before it shows whatever it has. */
export const StubLifetime = 15000;

type SyncLoaderRegistry = {
	setSyncing(syncing: boolean): void,
};

type SyncStubRegistry = SyncLoaderRegistry & {
	isEmpty: boolean,
	armStub(): void,
};

/**
 * The cap of the wait of every list that stands behind a loader right now, kept per list: one grid
 * ending its wait is no reason for the other to end its own.
 */
const lifetimeTimers: WeakMap<SyncLoaderRegistry, ReturnType<typeof setTimeout>> = new WeakMap();

function dropLifetimeCap(registry: SyncLoaderRegistry): void
{
	const timer = lifetimeTimers.get(registry);
	if (timer !== undefined)
	{
		clearTimeout(timer);
		lifetimeTimers.delete(registry);
	}
}

/**
 * Said where the screen is about to be taken from under the reader - a mailbox that has just
 * finished being moved reloads the page (`mailer.js:160`). The wait is capped, so a reload that
 * never comes leaves the list showing what it has rather than a loader forever.
 */
export function showSyncLoader(registry: SyncLoaderRegistry): void
{
	// the page that ended the previous wait took the flag off and said nothing about the timer
	// (`grid.ts:setPage()`), so a timer left over from it would end this show too early
	dropLifetimeCap(registry);

	registry.setSyncing(true);
	lifetimeTimers.set(registry, setTimeout((): void => {
		lifetimeTimers.delete(registry);
		registry.setSyncing(false);
	}, StubLifetime));
}

/**
 * A mailbox synchronized for the first time has nothing to show yet, so the screen asks the grid to
 * wait behind a loader instead of declaring the folder empty. The wait is capped.
 *
 * The same branch is what lets the grid answer an empty list with a stub of its own afterwards: the
 * old grid armed both at once and only here (`template.php:1383`).
 */
export function armPrimarySyncStub(registry: SyncStubRegistry): void
{
	if (!registry.isEmpty)
	{
		return;
	}

	registry.armStub();
	showSyncLoader(registry);
}
