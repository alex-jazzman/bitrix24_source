import { BaseEvent, EventEmitter } from 'main.core.events';
import { PAGE_SIZE, REFRESH_DEBOUNCE_JITTER_MS, REFRESH_DEBOUNCE_MIN_MS } from '../shared/constants';
import { favoriteExpandKey, favoriteKey } from '../shared/keys';
import { NoteEvent } from '../../../services/note-events';
import type { SidebarApi } from '../../../services/sidebar-api';

type FavoriteTarget = { entityType: string, entityId: number };
type FavoriteSnapshot = { row: Object | null };
// What the pressed star knows about its own object. Only the title is required: a row without one
// cannot be drawn, and the caller that has none keeps the old behaviour (a re-read of the list).
type FavoriteHint = {
	title?: mixed,
	collectionId?: mixed,
	parentId?: mixed,
	hasChildren?: mixed,
	expandVia?: mixed,
};
// A row of the block or a document nested in a branch of it: the second one carries the expansion
// path of the row it hangs under, so both take the same route through ALG-02.
type FavoriteExpandTarget = {
	entityType: string,
	entityId: number,
	collectionId: number,
	expandVia: string,
	// Key of the top-level row this place belongs to; empty for a top-level row itself (see
	// favoriteExpandKey).
	scope: string,
};

const ENTITY_TYPES = ['document', 'collection'];
const POSITIVE_MODES = ['self', 'subtree', 'all'];
// Modes that reach further than the object they are written on: everything under it becomes covered,
// and every bell under it changes with them.
const COVERING_MODES = ['subtree', 'all'];
const MODE_MUTED = 'muted';
// [API-05] The one refusal the interface is not supposed to be able to reach: the target left the
// list between the read and the press. The state is re-read rather than guessed at.
const FAVORITE_REQUIRED_ERROR = 'FAVORITE_REQUIRED';

const EMPTY_NOTIFY = Object.freeze({
	mode: null,
	subscribed: false,
	muted: false,
	inherited: false,
	inheritedSource: null,
	notified: false,
});

// [P1] Favorites block: the whole list lives on the server, so every gesture goes through here -
// the components own no state of their own. Reads come back through the store (state + queries).
export class SidebarFavoriteActions
{
	#api: SidebarApi;
	#state;
	#messages: Object;
	#notify: (content: string) => void;
	#isFavorite: (entityType: string, entityId: number) => boolean;
	#ensureChildrenLoaded: (collectionId: number, parentId: number | null) => Promise<void>;
	#ensureAccessibleChildrenLoaded: (collectionId: number, parentId: number) => Promise<void>;
	#isBranchLoaded: (collectionId: number, parentId: number | null) => boolean;
	#isAccessibleBranchLoaded: (collectionId: number, parentId: number) => boolean;
	#getBranchDocs: (collectionId: number, parentId: number | null, isShared: boolean) => Object[];
	#notifyStateOf: (entityType: string, entityId: number) => Object | null;
	#applyingExternalFavorite: boolean = false;
	#applyingExternalNotify: boolean = false;
	#refreshingInheritance: boolean = false;
	#inheritanceRefreshQueued: boolean = false;
	#announcingNotify: boolean = false;
	#announcingFavorite: boolean = false;
	// [TPL-02] Rows the notification filter took off the screen, held on to so that switching it back
	// off can put them back within the frame of the press instead of after a round trip. Kept level with
	// the block while it is on (see #putRow, #dropRow), and the server page that follows the switch
	// replaces the list outright anyway - so anything that went stale out of our sight is corrected a
	// moment later, and until then a list that is right about the rows we know of beats an empty wait.
	#hiddenByFilter: Object[] = [];
	// Presses still waiting for their answer, by key. A page read dispatched before the press was
	// built from state older than it, so its response must not be allowed to undo the press. `row` is
	// the provisional row the press put in the block, if it could build one, and `hadRow` whether a
	// removal took a loaded row out (the page it leaves short is closed once the removal is answered).
	#unanswered: Map<string, {
		target: FavoriteTarget,
		value: boolean,
		row: Object | null,
		hadRow?: boolean,
	}> = new Map();
	// Debounce of the re-read a change of composition asks for (see invalidateComposition).
	#accessRefreshTimer: TimeoutID | null = null;

	constructor({
		api,
		state,
		messages,
		notify,
		isFavorite,
		ensureChildrenLoaded,
		ensureAccessibleChildrenLoaded,
		isBranchLoaded,
		isAccessibleBranchLoaded,
		getBranchDocs,
		notifyStateOf,
	}: {
		api: SidebarApi,
		state: Object,
		messages: Object,
		notify: (content: string) => void,
		isFavorite: (entityType: string, entityId: number) => boolean,
		ensureChildrenLoaded: (collectionId: number, parentId: number | null) => Promise<void>,
		ensureAccessibleChildrenLoaded: (collectionId: number, parentId: number) => Promise<void>,
		isBranchLoaded: (collectionId: number, parentId: number | null) => boolean,
		isAccessibleBranchLoaded: (collectionId: number, parentId: number) => boolean,
		getBranchDocs: (collectionId: number, parentId: number | null, isShared: boolean) => Object[],
		notifyStateOf: (entityType: string, entityId: number) => Object | null,
	})
	{
		this.#api = api;
		this.#state = state;
		this.#messages = messages || {};
		this.#notify = notify;
		this.#isFavorite = isFavorite;
		this.#ensureChildrenLoaded = ensureChildrenLoaded;
		this.#ensureAccessibleChildrenLoaded = ensureAccessibleChildrenLoaded;
		this.#isBranchLoaded = isBranchLoaded;
		this.#isAccessibleBranchLoaded = isAccessibleBranchLoaded;
		this.#getBranchDocs = getBranchDocs;
		this.#notifyStateOf = notifyStateOf;
	}

	// A row of the block carries its own copy of the title (the list is its own read, not a view over
	// the tree), so a rename has to reach it as well - including for an object no loaded branch holds.
	// Called from the local patchers of documents and collections: one gesture, one place to change.
	patchFavoriteTitle(entityType: string, entityId: number, title: mixed): boolean
	{
		const target = this.#normalizeTarget({ entityType, entityId });
		if (target === null || typeof title !== 'string' || title === '')
		{
			return false;
		}

		const row = this.#findRow(target);
		if (row === null || row.title === title)
		{
			return false;
		}

		this.#patchRow(target, { title });

		return true;
	}

	// [TPL-02] First page taken from the payload the page was rendered with, instead of a request of
	// its own - the block is painted together with the knowledge bases, which arrive the same way.
	// Answers whether it had anything to take: without a payload the caller reads the page itself.
	hydrateFavorites(payload: mixed): boolean
	{
		if (payload === null || payload === undefined)
		{
			return false;
		}

		const page = this.#api.normalizeFavoritePage(payload);

		this.#state.favorites.value = this.#sort(page.items);
		this.#state.favoritesCursor.value = page.nextCursor;
		this.#state.favoritesHasNextPage.value = page.hasNextPage;
		this.#state.favoritesHydrated.value = true;
		this.#state.favoritesStale.value = false;
		this.#state.favoritesError.value = null;
		this.#state.favoritesErrorOnAppend.value = false;

		// Same index the loaded pages feed: the stars of objects on this page must not wait for the row
		// they belong to to be looked up.
		for (const row of page.items)
		{
			this.#state.favoriteIndex[favoriteKey(row.entityType, row.entityId)] = true;
		}

		return true;
	}

	// [TPL-02] First read and every following page: which of the two it is follows from the state,
	// so the caller (a scroll sentinel, the block on mount) never has to decide.
	async loadFavoritesPage(): Promise<void>
	{
		if (this.#state.favoritesStale.value || !this.#state.favoritesHydrated.value)
		{
			await this.#load(false);

			return;
		}

		if (this.#state.favoritesHasNextPage.value)
		{
			await this.#load(true);
		}
	}

	// [ERR-006] Second attempt at whatever failed: the next page keeps the rows already loaded, the
	// first page is re-read from scratch.
	async retryFavorites(): Promise<void>
	{
		if (this.#state.favoritesErrorOnAppend.value)
		{
			await this.#load(true);

			return;
		}

		await this.reloadFavorites();
	}

	async reloadFavorites(): Promise<void>
	{
		this.#state.favoritesStale.value = true;
		this.#state.favoritesStaleToken++;

		await this.#load(false);
	}

	// Which rows the block holds is the server's answer, and it is decided by things the block never
	// sees: access taken away or handed out, and the life of the object itself. A row whose object the
	// user has just lost stays on screen with nothing behind it, one they have just been given never
	// appears, a document moved to the bin is hidden from the list while its row keeps standing here,
	// and a physically deleted object takes its row with it. None of that is derivable on this side -
	// the list is re-read.
	//
	// The membership row itself is deliberately left alone by the server when access changes (a
	// favorite outlives the access), so a returned grant brings the row back where it stood.
	//
	// Debounced like the other readers of the same pushes: a cascade names every document it touched
	// and arrives as a burst, and one read after it answers the whole burst.
	invalidateComposition(): void
	{
		if (!this.#state.favoritesHydrated.value)
		{
			// Nothing has been read yet, so there is nothing on screen to correct: the first read of the
			// block carries the change on its own.
			return;
		}

		if (this.#accessRefreshTimer !== null)
		{
			clearTimeout(this.#accessRefreshTimer);
		}

		const delay = REFRESH_DEBOUNCE_MIN_MS + Math.floor(Math.random() * REFRESH_DEBOUNCE_JITTER_MS);
		this.#accessRefreshTimer = setTimeout(() => {
			this.#accessRefreshTimer = null;
			void this.reloadFavorites();
		}, delay);
	}

	setFavoritesSectionExpanded(expanded: boolean): void
	{
		this.#state.favoritesSectionExpanded.value = expanded === true;
	}

	toggleFavoritesSection(): void
	{
		this.#state.favoritesSectionExpanded.value = !this.#state.favoritesSectionExpanded.value;
	}

	// [TPL-02] The filter is a request parameter, not a client-side sieve: filtering on the client would
	// hand out pages with holes in them and break the cursor. Both directions of the press are answered
	// here all the same, in the frame of the press: the rows on screen carry the same `notified` the
	// server filters by, so switching it on drops what it excludes, and what was dropped is kept, so
	// switching it off puts it back. The page still comes from the server - it alone knows what lies
	// past the rows already read, and it is what makes either answer exact.
	async setFavoritesFilter(onlyNotified: boolean): Promise<void>
	{
		const next = onlyNotified === true;
		if (this.#state.favoritesOnlyNotified.value === next)
		{
			return;
		}

		this.#state.favoritesOnlyNotified.value = next;
		if (next)
		{
			const rows = this.#state.favorites.value;
			this.#hiddenByFilter = rows.filter((row) => !this.#passesFilter(row));
			this.#state.favorites.value = rows.filter((row) => this.#passesFilter(row));
		}
		else
		{
			this.#state.favorites.value = this.#restoreHidden();
		}

		// Marked for the length of this read alone: switching the filter off with nothing to restore
		// leaves the block empty and unfiltered until the page lands, and the block is not allowed to
		// collapse under the pointer that is still on its button. Every other read of the list leaves the
		// visibility of the block to its contents.
		this.#state.favoritesFilterReloading.value = true;
		try
		{
			await this.reloadFavorites();
		}
		finally
		{
			this.#state.favoritesFilterReloading.value = false;
		}
	}

	// [TPL-02] The single path in and out of the list, shared by all three stars. `hint` is what the
	// caller knows about the object it starred, so the row can be drawn within the frame of the press
	// instead of after a re-read (see #provisionalRow).
	async toggleFavorite(target: mixed, hint: FavoriteHint | null = null): Promise<boolean>
	{
		const normalized = this.#normalizeTarget(target);
		if (normalized === null)
		{
			return false;
		}

		const key = favoriteKey(normalized.entityType, normalized.entityId);
		if (this.#state.favoritesPending[key] === true)
		{
			// A press while the previous one is unanswered is dropped rather than queued: the server
			// state is not known yet, so the only thing a second request could do is race the first.
			return this.#isFavorite(normalized.entityType, normalized.entityId);
		}

		const wasFavorite = this.#isFavorite(normalized.entityType, normalized.entityId);
		this.#state.favoritesPending[key] = true;
		this.#unanswered.set(key, { target: normalized, value: !wasFavorite, row: null });
		try
		{
			return wasFavorite
				? await this.#removeFavorite(normalized)
				: await this.#addFavorite(normalized, hint)
			;
		}
		finally
		{
			delete this.#state.favoritesPending[key];
			this.#unanswered.delete(key);
		}
	}

	// [ALG-02] (NORMATIVE) Expansion of a block row. The flag goes into the block's own space, the
	// branch comes from the namespace the server named in expandVia: the regular branch action would
	// turn a user down for a document they see only through a personal grant.
	async toggleFavoriteExpanded(item: mixed): Promise<void>
	{
		const target = this.#normalizeExpandTarget(item);
		if (target === null)
		{
			return;
		}

		const key = this.#expandKeyOf(target);
		const next = this.#state.favoritesExpanded[key] !== true;
		this.#state.favoritesExpanded[key] = next;
		if (!next)
		{
			// The branch data are shared with the tree and stay where they are: collapsing here must
			// not collapse the same nodes in the tree, and re-expanding must not cost a request.
			// The coverage map is ours alone though, and re-expanding always re-reads it, so it is
			// dropped here instead of growing with every branch opened during the session.
			this.#forgetBranchCoverage(target);

			return;
		}

		await this.#loadFavoriteBranch(target, key);
	}

	// [ERR-005] Second attempt at a branch, offered inside the row that failed.
	async retryFavoriteBranch(item: mixed): Promise<void>
	{
		const target = this.#normalizeExpandTarget(item);
		if (target === null)
		{
			return;
		}

		await this.#loadFavoriteBranch(target, this.#expandKeyOf(target));
	}

	async #loadFavoriteBranch(target: FavoriteExpandTarget, key: string): Promise<void>
	{
		delete this.#state.favoritesBranchError[key];

		const branch = this.#branchOf(target);
		// Remembered before the read: a re-read of the coverage of an opened branch (see
		// #refreshInheritance) needs these coordinates, and the row alone does not carry them.
		this.#state.favoritesBranchContext[key] = branch;

		// A knowledge base opens its root branch, a document its own.
		if (target.entityType === 'collection')
		{
			await this.#ensureChildrenLoaded(branch.collectionId, null);
			this.#reportBranchResult(key, this.#isBranchLoaded(branch.collectionId, null));
			await this.refreshFavoriteCoverage(branch);

			return;
		}

		if (target.expandVia === 'tree')
		{
			await this.#ensureChildrenLoaded(target.collectionId, target.entityId);
			this.#reportBranchResult(key, this.#isBranchLoaded(target.collectionId, target.entityId));
		}
		else
		{
			await this.#ensureAccessibleChildrenLoaded(target.collectionId, target.entityId);
			this.#reportBranchResult(key, this.#isAccessibleBranchLoaded(target.collectionId, target.entityId));
		}

		await this.refreshFavoriteCoverage(branch);
	}

	// [ALG-02] The branches of the block are not its own copies - they are read from the two document
	// namespaces of the panel. When one of those namespaces drops a branch (the accessible-tree section
	// re-reading its first page, an access cascade), every row of the block standing open on it reads it
	// again. Without this the row kept its chevron open over nothing until the same branch happened to
	// be opened somewhere else.
	reloadOpenBranches(branches: Object[]): void
	{
		if (!Array.isArray(branches) || branches.length === 0)
		{
			return;
		}

		const dropped = new Set(branches.map((branch) => this.#branchId(branch)));
		for (const [key, branch] of Object.entries(this.#state.favoritesBranchContext))
		{
			if (branch?.expandVia === 'tree' || !dropped.has(this.#branchId(branch)))
			{
				continue;
			}

			void this.#reloadBranch(key, branch);
		}
	}

	#branchId(branch: Object): string
	{
		const parentId = branch?.parentId ?? null;

		return `${Number(branch?.collectionId)}:${parentId === null ? 'root' : Number(parentId)}`;
	}

	async #reloadBranch(key: string, branch: Object): Promise<void>
	{
		await this.#ensureAccessibleChildrenLoaded(branch.collectionId, branch.parentId);
		this.#reportBranchResult(key, this.#isAccessibleBranchLoaded(branch.collectionId, branch.parentId));
		await this.refreshFavoriteCoverage(branch);
	}

	// Branch a row opens, in the coordinates refreshFavoriteCoverage speaks: a knowledge base opens the
	// roots of its own tree, a document the children of itself.
	#branchOf(target: FavoriteExpandTarget): Object
	{
		return target.entityType === 'collection'
			? { collectionId: target.entityId, parentId: null, expandVia: 'tree' }
			: { collectionId: target.collectionId, parentId: target.entityId, expandVia: target.expandVia };
	}

	#expandKeyOf(target: FavoriteExpandTarget): string
	{
		return favoriteExpandKey(target.entityType, target.entityId, target.scope);
	}

	// Mirror of refreshFavoriteCoverage: the states of the branch that has just been collapsed.
	#forgetBranchCoverage(target: FavoriteExpandTarget): void
	{
		const branch = this.#branchOf(target);
		delete this.#state.favoritesBranchContext[this.#expandKeyOf(target)];

		for (const doc of this.#branchDocsOf(branch))
		{
			delete this.#state.favoritesCoverage[String(Number(doc?.id))];
		}
	}

	// [AC-052] A subscription on a knowledge base covers every document in it, and a subtree subscription
	// everything below itself - so a write of that kind changes the state of rows it never touched. Their
	// coverage is the server's answer, not something derivable here: the list is re-read and every opened
	// branch re-reads its states. Without this the bells of the descendants keep the coverage that has
	// just been switched off, and a press on one of them acts on a state that no longer exists.
	async #refreshInheritance(): Promise<void>
	{
		if (this.#refreshingInheritance)
		{
			// A second change while the re-read is in flight would read the state of the first one. One
			// more pass after the current one covers it, however many changes arrived meanwhile.
			this.#inheritanceRefreshQueued = true;

			return;
		}

		this.#refreshingInheritance = true;
		try
		{
			do
			{
				this.#inheritanceRefreshQueued = false;
				// eslint-disable-next-line no-await-in-loop
				await this.reloadFavorites();
				// Every opened branch at once, not a request per branch: one press on a knowledge base with
				// a dozen rows expanded would otherwise open a dozen parallel connections, and the whole
				// set again if another change arrived while they were in flight.
				// eslint-disable-next-line no-await-in-loop
				await this.#refreshCoverageOf(Object.values(this.#state.favoritesBranchContext));
			}
			while (this.#inheritanceRefreshQueued);
		}
		finally
		{
			this.#refreshingInheritance = false;
		}
	}

	// Does the change of this object's own row reach other rows: a knowledge base always does, a document
	// only through a covering mode - on the way in or on the way out.
	#coversOtherRows(target: FavoriteTarget, previousMode: mixed, nextMode: mixed): boolean
	{
		if (target.entityType === 'collection')
		{
			return true;
		}

		return COVERING_MODES.includes(previousMode) || COVERING_MODES.includes(nextMode);
	}

	// [API-06] Coverage of the documents of one branch: one request per branch, never one per row.
	// Called on expansion and on every following page of the branch - a page that arrives without
	// states would draw rows with no bell where a bell belongs.
	async refreshFavoriteCoverage(params: mixed): Promise<void>
	{
		await this.#refreshCoverageOf([params]);
	}

	// The same read for any number of branches. Branches of one knowledge base share a request - the
	// endpoint answers per knowledge base, not per branch - and a document reachable from two of them
	// is asked about once.
	async #refreshCoverageOf(branches: mixed[]): Promise<void>
	{
		const idsByCollection: Map<number, Set<number>> = new Map();
		for (const branch of branches)
		{
			const collectionId = Number(branch?.collectionId);
			if (!Number.isInteger(collectionId) || collectionId <= 0)
			{
				continue;
			}

			let ids = idsByCollection.get(collectionId);
			if (ids === undefined)
			{
				ids = new Set();
				idsByCollection.set(collectionId, ids);
			}

			for (const doc of this.#branchDocsOf(branch))
			{
				const id = Number(doc?.id);
				if (Number.isInteger(id) && id > 0)
				{
					ids.add(id);
				}
			}
		}

		await Promise.all(
			[...idsByCollection.entries()]
				.filter(([, ids]) => ids.size > 0)
				.map(([collectionId, ids]) => this.#loadCoverage(collectionId, [...ids])),
		);
	}

	async #loadCoverage(collectionId: number, ids: number[]): Promise<void>
	{
		let states = null;
		try
		{
			states = await this.#api.getSubscriptionStates(collectionId, ids);
		}
		catch
		{
			// A bell that cannot be drawn is not a failure of the branch: the rows are there and
			// readable, so the row keeps quiet instead of reporting an error it cannot act on.
			return;
		}

		for (const [id, state] of Object.entries(states))
		{
			this.#state.favoritesCoverage[id] = state;
		}
	}

	// Documents of one branch, in the namespace the row expands through.
	#branchDocsOf(branch: mixed): Object[]
	{
		const collectionId = Number(branch?.collectionId);
		if (!Number.isInteger(collectionId) || collectionId <= 0)
		{
			return [];
		}

		const rawParentId = branch?.parentId ?? null;
		const docs = this.#getBranchDocs(
			collectionId,
			rawParentId === null ? null : Number(rawParentId),
			branch?.expandVia === 'accessibleTree',
		);

		return Array.isArray(docs) ? docs : [];
	}

	// [API-05] One press of a bell that has no depth to choose: a covered object is muted, a muted one
	// resumes, a subscribed one goes silent, and an object in the list with nothing arriving subscribes.
	// The same rule the bell of the editor follows.
	async toggleFavoriteNotify(target: mixed): Promise<void>
	{
		const normalized = this.#normalizeTarget(target);
		if (normalized === null)
		{
			return;
		}

		const current = this.#notifyStateOf(normalized.entityType, normalized.entityId);
		// A mute counts only while there is coverage to suppress. The negative row survives the covering
		// subscription being switched off, and treating that leftover as "muted" would spend the press on
		// deleting a row nothing depends on - the bell would look unresponsive.
		const isMuted = current?.muted === true && current?.inherited === true;
		if (isMuted || current?.subscribed === true)
		{
			await this.clearFavoriteNotify(normalized);

			return;
		}

		if (current?.inherited === true)
		{
			// [AC-045] Outside the list only muting is on offer, and muting is what a covered object
			// gets here too: the depth of the covering subscription is not this row's to change (AC-052).
			await this.setFavoriteNotify(normalized, MODE_MUTED);

			return;
		}

		await this.setFavoriteNotify(normalized, normalized.entityType === 'collection' ? 'all' : 'self');
	}

	// [API-05] Explicit depth, chosen in the popover of a row with nested documents.
	async setFavoriteNotify(target: mixed, mode: string): Promise<void>
	{
		await this.#writeNotify(target, mode);
	}

	// [API-05] "Off" for a direct subscription and "resume" for a muted object are the same call.
	async clearFavoriteNotify(target: mixed): Promise<void>
	{
		await this.#writeNotify(target, null);
	}

	// [EVENT-02] subscriptionSet. Idempotent: the initiator is not excluded from the broadcast, so
	// this lands on top of the change it describes. Objects the sidebar knows nothing about are
	// skipped - inventing a state for them would light a bell on a row nobody asked about.
	applySubscriptionSet(params: Object): void
	{
		this.#applyRemoteMode(params, this.#normalizeMode(params?.mode));
	}

	// [EVENT-02] subscriptionRemove. Also arrives from the cascade of a star being taken off, and the
	// handler makes no distinction: the row is gone either way.
	applySubscriptionRemove(params: Object): void
	{
		this.#applyRemoteMode(params, null);
	}

	#applyRemoteMode(params: Object, mode: string | null): void
	{
		const target = this.#normalizeTarget({
			entityType: params?.scope,
			entityId: Number(params?.entityId),
		});
		if (target === null)
		{
			return;
		}

		const current = this.#notifyStateOf(target.entityType, target.entityId);
		// A covering change is worth following even for an object the block draws no row for: what it
		// covers may well be on screen. Anything else concerns a row that is not here.
		const covers = this.#coversOtherRows(target, current?.mode ?? null, mode);
		if (current === null)
		{
			if (covers)
			{
				void this.#refreshInheritance();
			}

			return;
		}

		// Our own write comes back through this channel too (the initiator is not excluded), and by then
		// the block already holds the mode being announced - re-reading everything again would cost a
		// second reload of the list per press. A mode that differs is news, and news is followed.
		const isKnown = (current.mode ?? null) === mode;
		this.#patchNotify(target, this.#nextNotifyState(current, mode));
		if (covers && !isKnown)
		{
			void this.#refreshInheritance();
		}
	}

	async #writeNotify(target: mixed, mode: string | null): Promise<void>
	{
		const normalized = this.#normalizeTarget(target);
		if (normalized === null)
		{
			return;
		}

		const key = favoriteKey(normalized.entityType, normalized.entityId);
		if (this.#state.favoritesNotifyPending[key] === true)
		{
			return;
		}

		// Optimistic: the state a successful call leads to follows from DTO-02 alone - a direct row
		// never changes the coverage an object gets from above - so nothing has to be re-read.
		const previous = this.#notifyStateOf(normalized.entityType, normalized.entityId);
		this.#patchNotify(normalized, this.#nextNotifyState(previous, mode));

		this.#state.favoritesNotifyPending[key] = true;
		try
		{
			await (mode === null
				? this.#api.removeSubscription(normalized)
				: this.#api.setSubscription(normalized, mode));

			if (this.#coversOtherRows(normalized, previous?.mode ?? null, mode))
			{
				await this.#refreshInheritance();
			}

			// Second announcement, this one with the server's answer behind it: a listener that cannot
			// derive coverage on its own (the bell of the editor under a subscribed knowledge base) waits
			// for exactly this one instead of the push.
			this.#announceNotify(
				normalized,
				this.#notifyStateOf(normalized.entityType, normalized.entityId),
				true,
			);
		}
		catch (error)
		{
			// [ERR-003] The failed change goes back to what it was and the composition of the list is
			// untouched: notifications and membership are separate things.
			this.#patchNotify(normalized, previous);
			if (String(error?.code || '') === FAVORITE_REQUIRED_ERROR)
			{
				// The target is not in the list any more. Which rows are is the server's answer.
				await this.reloadFavorites();

				return;
			}

			this.#notify(this.#messages.favoriteNotifyFailed || error?.message || '');
		}
		finally
		{
			delete this.#state.favoritesNotifyPending[key];
		}
	}

	// [DTO-02] Where a write of the direct row leads. `notified` is the predicate of the filter, and
	// coverage from above is not touched by a row of one's own - so it carries over as it was.
	#nextNotifyState(current: Object | null, mode: string | null): Object
	{
		const base = current ?? EMPTY_NOTIFY;
		const subscribed = POSITIVE_MODES.includes(mode);
		const muted = mode === MODE_MUTED;

		return {
			...base,
			mode: mode ?? null,
			subscribed,
			muted,
			notified: (subscribed || base.inherited === true) && !muted,
		};
	}

	// Both surfaces of the same state: the row of the block and the coverage map its branch reads.
	#patchNotify(target: FavoriteTarget, notify: Object | null): void
	{
		if (notify === null)
		{
			return;
		}

		if (this.#findRow(target) !== null)
		{
			this.#patchRow(target, { notify });
		}

		if (target.entityType === 'document' && this.#state.favoritesCoverage[String(target.entityId)] !== undefined)
		{
			this.#state.favoritesCoverage[String(target.entityId)] = notify;
		}

		// Same reasoning as the star: the bell of the open document has to follow the bell of the row
		// within the frame of the press, and pull only confirms it a moment later.
		if (!this.#applyingExternalNotify)
		{
			this.#announceNotify(target, notify, false);
		}
	}

	// [DTO-02] One announcement of a notification state over the local bus. `confirmed` says whether the
	// server has already accepted the change: a listener that has to re-read something (coverage from
	// above) can only trust the confirmed one.
	#announceNotify(target: FavoriteTarget, notify: Object | null, confirmed: boolean): void
	{
		if (notify === null)
		{
			return;
		}

		// Delivery is synchronous and the bus carries no sender, so the flag is what tells our own echo
		// (see applyExternalNotify) apart from a foreign announcement.
		this.#announcingNotify = true;
		try
		{
			EventEmitter.emit(NoteEvent.SUBSCRIPTION_CHANGED, new BaseEvent({
				data: {
					scope: target.entityType,
					entityId: target.entityId,
					state: notify,
					confirmed,
				},
			}));
		}
		finally
		{
			this.#announcingNotify = false;
		}
	}

	// The other side of SUBSCRIPTION_CHANGED: the bell of the editor or of the knowledge base page was
	// pressed, so the row adopts the state without waiting for pull.
	applyExternalNotify(params: mixed): void
	{
		if (this.#announcingNotify)
		{
			// Our own announcement, delivered back to us because the bus has one channel for everyone.
			return;
		}

		const target = this.#normalizeTarget({
			entityType: params?.scope,
			entityId: Number(params?.entityId),
		});
		if (target === null)
		{
			return;
		}

		const state = params?.state ?? null;
		const previous = this.#notifyStateOf(target.entityType, target.entityId);
		this.#applyingExternalNotify = true;
		try
		{
			if (state === null)
			{
				// A sender that reports no state (the plain "something changed" signal) leaves the row to the
				// server: coverage from above cannot be derived from that, and the page carries notify per row.
				void this.reloadFavorites();

				return;
			}

			this.#patchNotify(target, state);
		}
		finally
		{
			this.#applyingExternalNotify = false;
		}

		// Only once the sender has the server's answer: re-reading on the optimistic announcement would
		// read the state from before the write and put it back on screen (`confirmed` in the payload).
		if (params?.confirmed === true && this.#coversOtherRows(target, previous?.mode ?? null, state.mode ?? null))
		{
			void this.#refreshInheritance();
		}
	}

	#normalizeMode(mode: mixed): string | null
	{
		return [...POSITIVE_MODES, MODE_MUTED].includes(mode) ? mode : null;
	}

	// The branch loaders answer with state rather than by throwing: a branch that is still not there
	// after the read is the failure, and an empty one that did arrive is a valid answer (AC-035).
	#reportBranchResult(key: string, isLoaded: boolean): void
	{
		if (isLoaded)
		{
			return;
		}

		this.#state.favoritesBranchError[key] = this.#messages.favoritesBranchError || '';
	}

	#normalizeExpandTarget(item: mixed): FavoriteExpandTarget | null
	{
		const target = this.#normalizeTarget(item);
		const collectionId = Number(item?.collectionId);
		if (target === null || !Number.isInteger(collectionId) || collectionId <= 0)
		{
			return null;
		}

		return {
			...target,
			collectionId,
			expandVia: item?.expandVia === 'accessibleTree' ? 'accessibleTree' : 'tree',
			scope: typeof item?.scope === 'string' ? item.scope : '',
		};
	}

	// [EVENT-01] favoriteAdd. Idempotent by contract: the initiator is not excluded from the
	// broadcast, so this lands on top of the optimistic change it describes.
	async applyFavoriteAdd(params: Object): Promise<void>
	{
		const target = this.#normalizeTarget(params);
		if (target === null)
		{
			return;
		}

		this.#setIndex(target, true);
		this.#applyPositions(params?.affectedPositions);

		// [EVENT-01] The push carries the finished row, in the same shape a page of the list does - so a
		// row the block has never seen goes in from here, and one it holds (the provisional row of a press
		// of our own) is replaced by it.
		const item = this.#api.normalizeFavoriteItem(params?.item);
		if (item !== null)
		{
			this.#putRow(item);

			return;
		}

		const row = this.#findRow(target);
		if (row === null)
		{
			// No row in the payload and none on screen: only a page of the list can put a complete one in
			// the block, and the new row is on the first one (it goes in on top).
			await this.reloadFavorites();

			return;
		}

		const position = Number(params?.position);
		if (Number.isFinite(position))
		{
			this.#patchRow(target, { position });
		}
	}

	// [EVENT-01] favoriteRemove.
	applyFavoriteRemove(params: Object): void
	{
		const target = this.#normalizeTarget(params);
		if (target === null)
		{
			return;
		}

		this.#setIndex(target, false);
		this.#dropRow(target);
	}

	// [EVENT-01] favoriteMove. Mass renumbering arrives as requestRefetch instead of positions.
	async applyFavoriteMove(params: Object): Promise<void>
	{
		if (params?.requestRefetch === true)
		{
			await this.reloadFavorites();

			return;
		}

		const target = this.#normalizeTarget(params);
		if (target === null)
		{
			return;
		}

		if (this.#findRow(target) === null)
		{
			// A row carried in from beyond the loaded pages can land inside the visible range, and
			// patching only touches rows already loaded - it would stay invisible until a reload. Same
			// answer favoriteAdd gives for a row it has never seen.
			await this.reloadFavorites();

			return;
		}

		// The same code as a move of our own: an event of another session differs only in where the
		// numbers came from.
		this.#applyServerPosition(target, params);
	}

	// [API-03] Manual order. The gap comes from the drag as a pair of row ids; the order moves at once
	// and is then overwritten by what the server confirmed - two sessions reordering the same list can
	// only converge on the server's answer (AC-072).
	async moveFavoriteRow(dragId: number, targetId: number, placement: string): Promise<void>
	{
		const rows = this.#state.favorites.value;
		const dragRow = rows.find((row) => Number(row.id) === Number(dragId)) ?? null;
		const targetRow = rows.find((row) => Number(row.id) === Number(targetId)) ?? null;
		if (dragRow === null || targetRow === null || dragRow === targetRow)
		{
			return;
		}

		const target = this.#normalizeTarget(dragRow);
		if (target === null)
		{
			return;
		}

		// [ERR-007] The position the server last confirmed for this row. Putting that one value back is
		// what returns the order - and unlike a snapshot of the whole list it cannot resurrect a row
		// that left the block while the request was in flight.
		const confirmedPosition = Number(dragRow.position);
		const position = this.#insertPositionOf(dragRow, targetRow, placement);
		this.#reorderLocal(dragRow, targetRow, placement);

		let response = null;
		try
		{
			response = await this.#api.moveFavorite(target, position);
		}
		catch (error)
		{
			if (Number.isFinite(confirmedPosition))
			{
				this.#patchRow(target, { position: confirmedPosition });
			}
			this.#notify(this.#messages.favoriteMoveFailed || error?.message || '');

			return;
		}

		this.#applyServerPosition(target, response);
	}

	// The moved row is patched last: the renumbering carries a value for it too, and the one the
	// server assigned to the move itself is the newer of the two.
	#applyServerPosition(target: FavoriteTarget, response: Object): void
	{
		this.#applyPositions(response?.affectedPositions);
		const position = Number(response?.position);
		if (Number.isFinite(position))
		{
			this.#patchRow(target, { position });
		}

		this.#refreshCursorFromTail();
	}

	// [API-04] The cursor is the position of the last loaded row, and reordering moves it: left as it
	// was, the next page would be asked for from a place no row stands in any more.
	#refreshCursorFromTail(): void
	{
		if (this.#state.favoritesCursor.value === null)
		{
			return;
		}

		// A row the server has not named yet (a provisional row of a press in flight) is no cursor: the
		// next page would be asked for from a position and an id the list does not have.
		const rows = this.#state.favorites.value;
		const tail = [...rows].reverse().find((row) => Number(row.id) > 0) ?? null;
		if (tail === null)
		{
			return;
		}

		this.#state.favoritesCursor.value = { position: Number(tail.position), id: Number(tail.id) };
	}

	// [API-03] The ordinal number of the insertion point in the list, counted without the row being
	// moved: 1 is the first row. The client never computes a POSITION of its own.
	#insertPositionOf(dragRow: Object, targetRow: Object, placement: string): number | null
	{
		const ids = this.#state.favorites.value
			.map((row) => Number(row.id))
			.filter((id) => id !== Number(dragRow.id))
		;
		const targetIndex = ids.indexOf(Number(targetRow.id));
		if (targetIndex < 0)
		{
			return null;
		}

		return (placement === 'before' ? targetIndex : targetIndex + 1) + 1;
	}

	// Optimistic order. A position between the two neighbours of the gap is synthesised so the row
	// sorts where it was dropped; the authoritative values arrive with the response.
	#reorderLocal(dragRow: Object, targetRow: Object, placement: string): void
	{
		const list = this.#state.favorites.value.filter((row) => Number(row.id) !== Number(dragRow.id));
		const targetIndex = list.findIndex((row) => Number(row.id) === Number(targetRow.id));
		if (targetIndex < 0)
		{
			return;
		}

		const insertIndex = placement === 'before' ? targetIndex : targetIndex + 1;
		// Order is POSITION DESC: the row above the gap holds the higher value.
		const above = insertIndex > 0 ? Number(list[insertIndex - 1].position) : null;
		const below = insertIndex < list.length ? Number(list[insertIndex].position) : null;

		let position = Number(dragRow.position) || 0;
		if (above !== null && below !== null)
		{
			position = Math.floor((above + below) / 2);
		}
		else if (above !== null)
		{
			position = above - 1;
		}
		else if (below !== null)
		{
			position = below + 1;
		}

		list.splice(insertIndex, 0, { ...dragRow, position });
		this.#state.favorites.value = list;
	}

	async #addFavorite(target: FavoriteTarget, hint: FavoriteHint | null): Promise<boolean>
	{
		// Optimistic: the star fills in and the row goes into the block before the round trip, both
		// falling back on failure. The provisional row carries the key of the real one, so the answer
		// replaces it where it stands instead of remounting a row the user is already looking at.
		this.#setIndex(target, true);
		const hasProvisional = this.#insertProvisionalRow(target, hint);
		let response = null;
		try
		{
			response = await this.#api.addFavorite(target, null);
		}
		catch (error)
		{
			this.#setIndex(target, false);
			if (hasProvisional)
			{
				this.#dropRow(target);
			}
			this.#notify(this.#messages.favoriteAddFailed || error?.message || '');

			return false;
		}

		this.#applyPositions(response.affectedPositions);
		if (response.item !== null)
		{
			this.#putRow(response.item);

			return true;
		}

		// No row in the answer: the object is not in the list the server would hand out (rights, trash),
		// or an older server answered. Which rows the block holds is its answer either way.
		await this.reloadFavorites();

		return true;
	}

	// A row built from what the pressed star knows, standing in until the server's own row arrives.
	// Everything but the values only the server assigns; an empty title is no row at all - a nameless
	// row would be worse than the wait it saves.
	#provisionalRow(target: FavoriteTarget, hint: FavoriteHint | null): Object | null
	{
		const title = typeof hint?.title === 'string' ? hint.title.trim() : '';
		if (title === '')
		{
			return null;
		}

		const collectionId = target.entityType === 'collection'
			? target.entityId
			: Number(hint?.collectionId)
		;
		const parentId = Number(hint?.parentId);

		return {
			// The server names the row (id) and where it stands (position). Until then the row sorts to
			// the top, which is where an added row goes.
			id: null,
			entityType: target.entityType,
			entityId: target.entityId,
			title,
			position: this.#topPosition() + 1,
			collectionId: Number.isInteger(collectionId) && collectionId > 0 ? collectionId : 0,
			parentId: Number.isInteger(parentId) && parentId > 0 ? parentId : null,
			// A chevron is only offered for a branch the row knows how to read.
			hasChildren: hint?.hasChildren === true && Number.isInteger(collectionId) && collectionId > 0,
			expandVia: hint?.expandVia === 'accessibleTree' ? 'accessibleTree' : 'tree',
			notify: { ...EMPTY_NOTIFY },
			isProvisional: true,
		};
	}

	// Answers whether the block took a provisional row: the caller has to know whether there is one to
	// take back if the write fails.
	#insertProvisionalRow(target: FavoriteTarget, hint: FavoriteHint | null): boolean
	{
		if (this.#findRow(target) !== null)
		{
			return false;
		}

		const row = this.#provisionalRow(target, hint);
		if (row === null || !this.#passesFilter(row))
		{
			return false;
		}

		this.#putRow(row);
		// Kept with the press: a page read landing before the answer rebuilds the list from the server's
		// rows, and the provisional row is on none of them yet (see #reapplyUnanswered).
		const pending = this.#unanswered.get(favoriteKey(target.entityType, target.entityId));
		if (pending !== undefined)
		{
			pending.row = row;
		}

		return true;
	}

	// [DTO-01] One finished row into the block, in place of whatever stood under its key. Under the
	// notification filter a row that nothing reaches has no place on screen.
	#putRow(row: Object): void
	{
		const target = this.#normalizeTarget(row);
		if (target === null)
		{
			return;
		}

		const rest = this.#state.favorites.value.filter((item) => !(
			item.entityType === target.entityType && Number(item.entityId) === target.entityId
		));
		if (this.#passesFilter(row))
		{
			this.#forgetHidden(target);
			this.#state.favorites.value = this.#sort([...rest, row]);

			return;
		}

		// Off the screen, but into the snapshot the filter is switched off from: kept out of it, the row
		// would come back as it was before this update.
		this.#rememberHidden(row);
		this.#state.favorites.value = rest;
	}

	// The snapshot only holds rows the filter itself excluded, so it is written to and read from nowhere
	// but here, #dropRow and setFavoritesFilter.
	#rememberHidden(row: Object): void
	{
		const target = this.#normalizeTarget(row);
		if (target === null)
		{
			return;
		}

		this.#forgetHidden(target);
		this.#hiddenByFilter = [...this.#hiddenByFilter, row];
	}

	#forgetHidden(target: FavoriteTarget): void
	{
		if (this.#hiddenByFilter.length === 0)
		{
			return;
		}

		this.#hiddenByFilter = this.#hiddenByFilter.filter((row) => !(
			row.entityType === target.entityType && Number(row.entityId) === target.entityId
		));
	}

	// Rows back onto the screen, in the order the server keeps them. A row on both sides is taken from
	// the screen: that copy is the one the block has been keeping level with the server.
	#restoreHidden(): Object[]
	{
		const visible = this.#state.favorites.value;
		if (this.#hiddenByFilter.length === 0)
		{
			return visible;
		}

		const shown = new Set(visible.map((row) => favoriteKey(row.entityType, Number(row.entityId))));
		const restored = this.#hiddenByFilter.filter(
			(row) => !shown.has(favoriteKey(row.entityType, Number(row.entityId))),
		);
		this.#hiddenByFilter = [];

		return this.#sort([...visible, ...restored]);
	}

	// [TPL-02] The filter is a request parameter, so a row that arrives from anywhere but a page of the
	// list has to be held to it here.
	#passesFilter(row: Object): boolean
	{
		return this.#state.favoritesOnlyNotified.value !== true || row?.notify?.notified === true;
	}

	// Position of the first row of the block; order is POSITION DESC.
	#topPosition(): number
	{
		const rows = this.#state.favorites.value;

		return rows.length > 0 ? Number(rows[0].position) || 0 : 0;
	}

	// [ALG-01] Removal.
	async #removeFavorite(target: FavoriteTarget): Promise<boolean>
	{
		const snapshot = this.#snapshotOf(target);
		this.#setIndex(target, false);
		this.#dropRow(target);

		try
		{
			await this.#api.removeFavorite(target);
		}
		catch (error)
		{
			this.#rollback(target, snapshot);
			this.#notify(this.#messages.favoriteRemoveFailed || error?.message || '');

			return true;
		}

		// Taking a row out reports nothing: the star itself is the feedback, and a toast for every press
		// is noise. There is no undo offer - the row goes back by pressing the star again, so the
		// removal response is not read here.
		return false;
	}

	async #load(append: boolean): Promise<void>
	{
		// Concurrent first reads collapse into one, the same way the accessible tree does it.
		while (!append && this.#state.favoritesRequest)
		{
			// eslint-disable-next-line no-await-in-loop
			await this.#state.favoritesRequest;
			if (!this.#state.favoritesStale.value)
			{
				return;
			}
		}

		const request = this.#loadRequest(append);
		if (append)
		{
			await request;

			return;
		}

		this.#state.favoritesRequest = request;
		try
		{
			await request;
		}
		finally
		{
			if (this.#state.favoritesRequest === request)
			{
				this.#state.favoritesRequest = null;
			}
		}
	}

	async #loadRequest(append: boolean): Promise<void>
	{
		this.#state.favoritesLoading.value = true;
		const staleToken = this.#state.favoritesStaleToken;
		try
		{
			const response = await this.#api.listFavorites({
				limit: PAGE_SIZE,
				afterCursor: append ? this.#state.favoritesCursor.value : null,
				onlyNotified: this.#state.favoritesOnlyNotified.value,
			});

			this.#state.favorites.value = append
				? this.#merge(this.#state.favorites.value, response.items)
				: this.#sort(response.items)
			;
			this.#state.favoritesCursor.value = response.nextCursor;
			this.#state.favoritesHasNextPage.value = response.hasNextPage;
			this.#state.favoritesHydrated.value = true;
			this.#state.favoritesError.value = null;
			this.#state.favoritesErrorOnAppend.value = false;
			if (this.#state.favoritesStaleToken === staleToken)
			{
				this.#state.favoritesStale.value = false;
			}

			for (const row of response.items)
			{
				this.#state.favoriteIndex[favoriteKey(row.entityType, row.entityId)] = true;
			}

			this.#reapplyUnanswered();
		}
		catch (error)
		{
			// [ERR-004] The failure stays inside the block: the rest of the sidebar is untouched and
			// the block itself offers a retry.
			this.#state.favoritesError.value = this.#messages.favoritesLoadError || error?.message || '';
			this.#state.favoritesErrorOnAppend.value = append;
		}
		finally
		{
			this.#state.favoritesLoading.value = false;
		}
	}

	// A page read that set out before the press was built from state older than it, so returning it
	// verbatim would light a star back up that the user has just put out - and put it out again a moment
	// later, when the answer to the press arrives. The press wins until it is answered.
	#reapplyUnanswered(): void
	{
		for (const { target, value, row } of this.#unanswered.values())
		{
			this.#setIndex(target, value);
			if (!value)
			{
				this.#dropRow(target);

				continue;
			}

			// The row the press put in the block belongs to the press as well: the page that has just
			// landed was read before it and knows nothing of it yet.
			if (row !== null && this.#findRow(target) === null)
			{
				this.#putRow(row);
			}
		}
	}

	#snapshotOf(target: FavoriteTarget): FavoriteSnapshot
	{
		const row = this.#findRow(target);

		return { row: row === null ? null : { ...row } };
	}

	#rollback(target: FavoriteTarget, snapshot: FavoriteSnapshot): void
	{
		this.#setIndex(target, true);
		if (snapshot.row !== null)
		{
			this.#state.favorites.value = this.#sort([...this.#state.favorites.value, snapshot.row]);
		}
	}

	#setIndex(target: FavoriteTarget, value: boolean): void
	{
		const key = favoriteKey(target.entityType, target.entityId);
		const previous = this.#state.favoriteIndex[key];
		this.#state.favoriteIndex[key] = value;

		// Every star of the object on this page has to agree within the frame of the press, and the pull
		// event only arrives a moment later - so the flag is announced locally from the one place that
		// writes it. Announcing an adopted value back would bounce it, hence the guard.
		if (previous !== value && !this.#applyingExternalFavorite)
		{
			// Guarded the same way as the bell: the announcement comes back through the bus, and adopting
			// our own would cost a re-read of the list on every press (see applyExternalFavorite).
			this.#announcingFavorite = true;
			try
			{
				EventEmitter.emit(NoteEvent.FAVORITE_CHANGED, new BaseEvent({
					data: {
						entityType: target.entityType,
						entityId: target.entityId,
						isFavorite: value,
					},
				}));
			}
			finally
			{
				this.#announcingFavorite = false;
			}
		}
	}

	// The other side of FAVORITE_CHANGED: a star pressed outside the sidebar (the activity line of the
	// editor, the knowledge base page) lands here, so the row lights up without waiting for pull.
	applyExternalFavorite(params: mixed): void
	{
		if (this.#announcingFavorite)
		{
			return;
		}

		const target = this.#normalizeTarget(params);
		if (target === null)
		{
			return;
		}

		const value = params?.isFavorite === true;
		// `confirmed` says the sender has the server's answer behind it - the answer to the write, or the
		// refusal that rolled it back. Until then the press of another surface is as unanswered as one of
		// our own, and is protected the same way (see #reapplyUnanswered).
		const confirmed = params?.confirmed === true;
		const key = favoriteKey(target.entityType, target.entityId);
		this.#applyingExternalFavorite = true;
		try
		{
			this.#setIndex(target, value);
		}
		finally
		{
			this.#applyingExternalFavorite = false;
		}

		const pending = this.#unanswered.get(key) ?? null;
		if (confirmed)
		{
			this.#unanswered.delete(key);
		}

		const row = this.#findRow(target);
		if (!value)
		{
			// A provisional row is not a loaded one: taking it back leaves no hole in the page behind it.
			const droppedLoadedRow = row !== null && row.isProvisional !== true;
			if (row !== null)
			{
				this.#dropRow(target);
			}

			if (!confirmed)
			{
				// Nothing is re-read while the removal is unanswered: a page read racing it can be built
				// from state older than the press and would hand the row straight back.
				this.#unanswered.set(key, { target, value: false, row: null, hadRow: droppedLoadedRow });

				return;
			}

			// A loaded row that left the block leaves the page one row short, and only a read closes it -
			// but there is nothing to close it with unless the server still holds a next page.
			if ((droppedLoadedRow || pending?.hadRow === true) && this.#state.favoritesHasNextPage.value)
			{
				void this.reloadFavorites();
			}

			return;
		}

		// [DTO-01] The sender that has the server's answer reports the finished row with it, so the block
		// completes the row it drew on the press without a read of its own and without waiting for pull.
		const item = this.#api.normalizeFavoriteItem(params?.item);
		if (item !== null)
		{
			this.#putRow(item);

			return;
		}

		if (confirmed)
		{
			// Answered, and the answer carried no row: an older server, or an object the list does not
			// hand out. A provisional row cannot be left standing on that.
			if (row === null || row.isProvisional === true)
			{
				void this.reloadFavorites();
			}

			return;
		}

		// The optimistic announcement of the press: the star reports what it knows about its object, so the
		// row appears within the frame of the press. A star with no title to report keeps the read.
		if (row === null && !this.#insertProvisionalRow(target, params?.hint))
		{
			void this.reloadFavorites();

			return;
		}

		this.#unanswered.set(key, { target, value: true, row: this.#findRow(target) });
	}

	#findRow(target: FavoriteTarget): Object | null
	{
		return this.#state.favorites.value.find((row) => (
			row.entityType === target.entityType && Number(row.entityId) === target.entityId
		)) ?? null;
	}

	#dropRow(target: FavoriteTarget): void
	{
		this.#state.favorites.value = this.#state.favorites.value.filter((row) => !(
			row.entityType === target.entityType && Number(row.entityId) === target.entityId
		));
		// An object unstarred while the filter is on leaves the block whether it was on screen or waiting
		// out of it.
		this.#forgetHidden(target);
		// A row that leaves the block takes its expansion with it - its own and that of everything opened
		// inside its branch, whose keys carry the row's key as their scope. Starred again, it comes back
		// closed rather than with the branches it had before it was removed.
		const key = favoriteKey(target.entityType, target.entityId);
		const scopePrefix = `${key}/`;
		for (const map of [this.#state.favoritesExpanded, this.#state.favoritesBranchError, this.#state.favoritesBranchContext])
		{
			for (const stored of Object.keys(map))
			{
				if (stored === key || stored.startsWith(scopePrefix))
				{
					delete map[stored];
				}
			}
		}
	}

	#patchRow(target: FavoriteTarget, patch: Object): void
	{
		const next = this.#state.favorites.value.map((row) => (
			row.entityType === target.entityType && Number(row.entityId) === target.entityId
				? { ...row, ...patch }
				: row
		));
		this.#state.favorites.value = this.#sort(next);
	}

	#applyPositions(rawEntries: mixed): void
	{
		const positionByRowId = new Map();
		for (const entry of Array.isArray(rawEntries) ? rawEntries : [])
		{
			const id = Number(entry?.id);
			const position = Number(entry?.position);
			if (Number.isInteger(id) && id > 0 && Number.isFinite(position))
			{
				positionByRowId.set(id, position);
			}
		}

		if (positionByRowId.size === 0)
		{
			return;
		}

		const next = this.#state.favorites.value.map((row) => (
			positionByRowId.has(Number(row.id))
				? { ...row, position: positionByRowId.get(Number(row.id)) }
				: row
		));
		this.#state.favorites.value = this.#sort(next);
	}

	#merge(current: Object[], incoming: Object[]): Object[]
	{
		const merged = [...current];
		for (const row of incoming)
		{
			const index = merged.findIndex((item) => Number(item.id) === Number(row.id));
			if (index >= 0)
			{
				merged[index] = { ...merged[index], ...row };

				continue;
			}

			merged.push(row);
		}

		return this.#sort(merged);
	}

	// [API-04] Server order: POSITION DESC, ID DESC.
	#sort(rows: Object[]): Object[]
	{
		return [...rows].sort((left, right) => {
			const leftPosition = Number(left?.position || 0);
			const rightPosition = Number(right?.position || 0);
			if (leftPosition !== rightPosition)
			{
				return rightPosition - leftPosition;
			}

			return Number(right?.id || 0) - Number(left?.id || 0);
		});
	}

	#normalizeTarget(target: mixed): FavoriteTarget | null
	{
		const entityType = target?.entityType;
		const entityId = Number(target?.entityId);
		if (!ENTITY_TYPES.includes(entityType) || !Number.isInteger(entityId) || entityId <= 0)
		{
			return null;
		}

		return { entityType, entityId };
	}
}
