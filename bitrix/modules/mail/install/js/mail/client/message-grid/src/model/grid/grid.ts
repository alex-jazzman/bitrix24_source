import { markRaw } from 'ui.vue3';
import { defineStore } from 'ui.vue3.pinia';

import { GridMode, type GridModeValue, type GridScreen } from '../../const';
import { protectedImageFor } from '../../infrastructure/service/sender-avatar/protected-image';
import { buildMessageHref } from '../../lib/message-href/message-href';
import {
	emptyRowHrefTemplates,
	fillActionHrefs,
	fillBindingHrefs,
	type RowHrefTemplates,
} from '../../lib/row-href/row-href';
import {
	type DraftRow,
	type FolderMenuItem,
	type GridPagePayload,
	type GridRow,
	type GridState,
	type MessageRow,
	type PageSwapperHref,
	type ProjectionRow,
} from './types';

/**
 * The walk of the slider is one element longer than the rows while a next page is left, so the
 * first message of a page repeats the last one accumulated. The pair is checked by identifier:
 * legacy compared by reference (`user-interface-manager.js:673`), which never matches for records
 * parsed out of JSON. The extra element itself stays - the slider walks to the next page by it.
 */
function appendHrefIds(accumulated: number[], incoming: number[]): number[]
{
	if (accumulated.length === 0 || incoming.length === 0)
	{
		return [...accumulated, ...incoming];
	}

	const repeats = incoming[0] === accumulated[accumulated.length - 1];

	return [...accumulated, ...(repeats ? incoming.slice(1) : incoming)];
}

/**
 * The rows of a page, with the parts the client never writes kept out of the reactive state: the
 * menu of a row and its placeholders are built by the server and only read, and two hundred rows
 * that wrapped them would carry some three thousand proxies for nothing.
 *
 * Every address a row leads to is built here as well - no page of the list carries one
 * (`message-href.ts`, `row-href.ts`).
 */
function pageRows(
	payload: GridPagePayload,
	messageHrefTemplate: string,
	hrefTemplates: RowHrefTemplates,
): GridRow[]
{
	return payload.rows.map((row: GridRow): GridRow => {
		fillActionHrefs(row.actions, hrefTemplates);
		markRaw(row.actions);

		if ('bindings' in row)
		{
			fillBindingHrefs(row.bindings, hrefTemplates);
			markRaw(row.bindings);
			row.href.url = buildMessageHref(messageHrefTemplate, row.messageId);
		}

		return row;
	});
}

/** Pages of one list of the screen; every grid builds a registry of its own. */
export const useGridStore = defineStore('mailMessageGrid', {
	state: (): GridState => ({
		mode: GridMode.Message,
		// nothing to ask a page by until the screen seeds it, and a made-up screen would ask for
		// someone else's page
		screen: null,
		folders: [],
		rows: [],
		projections: [],
		selectedIds: [],
		hiddenIds: [],
		stickyAll: false,
		restoreIds: [],
		page: 1,
		enableNextPage: false,
		hrefIds: [],
		filterApplied: false,
		// A grid the screen gave no template draws the drafts, and no row of those opens a message.
		messageHrefTemplate: '',
		hrefTemplates: emptyRowHrefTemplates(),
		total: null,
		loadingPage: false,
		pageFailed: false,
		pageSyncBlocked: false,
		pageLimitReached: false,
		reloadPending: false,
		syncing: false,
		stubArmed: false,
		faded: false,
		migrationLockedMailboxIds: [],
	}),

	getters: {
		/** The name of this grid: what is kept outside its registry - the menus of its rows - is kept apart by it. */
		gridId(state): string
		{
			return state.screen?.gridId ?? '';
		},

		/**
		 * A row the screen put in front of the loaded ones counts as something - the old grid hid the
		 * word of an empty table the moment one was added (`realtime.js:50`).
		 */
		isEmpty(state): boolean
		{
			return state.rows.length === 0 && state.projections.length === 0;
		},

		/** An empty list keeps no button, and neither does one that reached the end it answers for. */
		nextPageOffered(state): boolean
		{
			return state.enableNextPage && !state.pageLimitReached && state.rows.length > 0;
		},

		/**
		 * A word instead of a button: about a page that did not come back, or about the letters the
		 * ceiling of the list leaves behind it. The ordinary end of a folder is neither.
		 */
		pageNoteDrawn(state): boolean
		{
			return state.pageFailed || state.pageLimitReached;
		},

		/**
		 * A foot that draws nothing leaves the table as the bottom of the grid, and the rounding of the
		 * bottom belongs there instead.
		 */
		footDrawn(state): boolean
		{
			return this.nextPageOffered || this.pageNoteDrawn;
		},

		/**
		 * Derived rather than kept beside the list of identifiers: one click is answered by every row of
		 * the list, and a second copy in the state is a second copy to keep true.
		 */
		selectedIdSet(state): Set<string>
		{
			return new Set(state.selectedIds);
		},

		/** Derived for the same reason as the selection: every row asks it as it is drawn. */
		migrationLockedMailboxIdSet(state): Set<number>
		{
			return new Set(state.migrationLockedMailboxIds);
		},

		/** The marked rows, in the order the list shows them rather than the order they were marked in. */
		selectedRows(state): GridRow[]
		{
			const marked = this.selectedIdSet;

			return state.rows.filter((row: GridRow): boolean => marked.has(row.id));
		},

		messageRows(state): MessageRow[]
		{
			return state.mode === GridMode.Message ? state.rows as MessageRow[] : [];
		},

		draftRows(state): DraftRow[]
		{
			return state.mode === GridMode.Draft ? state.rows as DraftRow[] : [];
		},

		/**
		 * The one place the addresses of the walk are built, out of the same template every row of the
		 * list is addressed by.
		 */
		pageSwapperHrefList(state): PageSwapperHref[]
		{
			return state.hrefIds.map((id: number) => ({
				ID: id,
				HREF: buildMessageHref(state.messageHrefTemplate, id),
			}));
		},
	},

	actions: {
		/** Called once, before the application is mounted: the screen ships the first page with its markup. */
		initialize(
			mode: GridModeValue,
			screen: GridScreen,
			page: GridPagePayload,
			/** A grid the screen gave no tree of folders draws no submenu of them, and asks for none. */
			folders: FolderMenuItem[] = [],
			/**
			 * Said once and kept: every page after the first one is built away from the screen and has no
			 * way of saying it again.
			 */
			messageHrefTemplate: string = '',
			/** Said once for the same reason: where a row leads outside the mail section. */
			hrefTemplates: RowHrefTemplates = emptyRowHrefTemplates(),
		): void
		{
			this.mode = mode;
			// copied rather than kept: the section is written here as the reader walks in and out of it
			this.screen = { ...screen };
			this.folders = [...folders];
			this.messageHrefTemplate = messageHrefTemplate;
			this.hrefTemplates = { ...hrefTemplates };
			this.setPage(page);
		},

		/** Replaces everything loaded so far - the first page of the list, or the list reloaded. */
		setPage(payload: GridPagePayload): void
		{
			const rows = pageRows(payload, this.messageHrefTemplate, this.hrefTemplates);
			const retainedIdentities = new Set<string>();
			if (this.mode === GridMode.Message)
			{
				for (const row of rows as MessageRow[])
				{
					const avatar = row.sender.avatar;
					if (avatar.protected && avatar.src && avatar.cacheIdentity)
					{
						retainedIdentities.add(avatar.cacheIdentity);
					}
				}
			}
			protectedImageFor(this).retain(retainedIdentities);
			this.rows = rows;
			// the page answers about every letter of the folder, the ones on their way included, so a row
			// the screen added before it came back is found again in the page under the same name
			this.projections = [...(payload.projections ?? [])];
			// the rows are other rows now; what the reader had marked is put back from `restoreIds`
			this.selectedIds = [];
			// The answer of the server has arrived: a row it still holds is a row the reader may see.
			this.hiddenIds = [];
			// The dimmed rows are gone with the page they belonged to, so the list answers again.
			this.faded = false;
			// The loader of a first synchronization ends only with a page that brought something to put in
			// its place: the filter stays live behind the loader (`message-grid.ts:88`), and a list narrowed
			// to nothing while the mailbox is still being fetched would answer that it holds no letters at
			// all. The wait is capped either way (`primary-sync-stub.ts`).
			//
			// Taken off here rather than on the word about the rows: that word is said a tick later
			// (`grid-facade.ts`) and is read by walking the document, which a list behind the loader has
			// no table in.
			if (!this.isEmpty)
			{
				this.syncing = false;
			}
			this.page = payload.page;
			this.enableNextPage = payload.enableNextPage;
			this.pageLimitReached = payload.pageLimitReached ?? false;
			this.hrefIds = [...(payload.hrefIds ?? [])];
			// the word of an empty table travels with the page rather than with the screen: applying a
			// filter and dropping it reload the list and leave the screen where it stands
			this.filterApplied = payload.filterApplied ?? false;
			this.total = payload.total ?? null;
		},

		/** The star of one row: written before the server is asked, and written back when it refuses. */
		setFavorite(rowId: string, isFavorite: boolean): void
		{
			const row = this.rows.find((candidate) => candidate.id === rowId) as MessageRow | undefined;
			if (row)
			{
				row.isFavorite = isFavorite;
			}
		},

		appendPage(payload: GridPagePayload): void
		{
			this.rows = [...this.rows, ...pageRows(payload, this.messageHrefTemplate, this.hrefTemplates)];
			this.page = payload.page;
			this.enableNextPage = payload.enableNextPage;
			this.pageLimitReached = payload.pageLimitReached ?? false;
			this.hrefIds = appendHrefIds(this.hrefIds, payload.hrefIds ?? []);
			this.filterApplied = payload.filterApplied ?? this.filterApplied;
			this.total = payload.total ?? this.total;
		},

		clearProtectedImages(): void
		{
			protectedImageFor(this).clear();
		},

		/**
		 * A send already named here is replaced rather than doubled: the screen and the page both name
		 * it `undo-send-{id}`.
		 */
		addProjection(row: ProjectionRow, prepend: boolean): void
		{
			const kept = this.projections.filter((stored) => stored.id !== row.id);

			this.projections = prepend ? [row, ...kept] : [...kept, row];
		},

		dropProjection(id: string): void
		{
			this.projections = this.projections.filter((kept) => kept.id !== id);
		},

		setSelection(ids: string[]): void
		{
			this.selectedIds = [...ids];
		},

		setHiddenIds(ids: string[]): void
		{
			this.hiddenIds = [...ids];
		},

		setStickyAll(on: boolean): void
		{
			this.stickyAll = on;
		},

		setRestoreIds(ids: string[]): void
		{
			this.restoreIds = [...ids];
		},

		setPageLoading(loading: boolean): void
		{
			this.loadingPage = loading;
		},

		/**
		 * A failure and the kind of it travel together: a list that is loading again knows of neither,
		 * and neither does it know yet where it ends.
		 */
		setPageFailed(failed: boolean): void
		{
			this.pageFailed = failed;

			if (!failed)
			{
				this.pageSyncBlocked = false;
				this.pageLimitReached = false;
			}
		},

		setPageSyncBlocked(blocked: boolean): void
		{
			this.pageSyncBlocked = blocked;
		},

		setPageLimitReached(reached: boolean): void
		{
			this.pageLimitReached = reached;
		},

		setReloadPending(pending: boolean): void
		{
			this.reloadPending = pending;
		},

		setSyncing(syncing: boolean): void
		{
			this.syncing = syncing;
		},

		setMigrationLockedMailboxIds(ids: number[]): void
		{
			this.migrationLockedMailboxIds = [...ids];
		},

		/**
		 * A folder is no section, and neither is the all mail mode: both leave it empty, and only then
		 * does the server narrow the list by a folder.
		 */
		setListSection(section: string | null): void
		{
			if (this.screen)
			{
				this.screen.listSection = section;
			}
		},

		setFaded(faded: boolean): void
		{
			this.faded = faded;
		},

		/** Lets the grid answer an empty list with the stub of its own instead of the plain empty row. */
		armStub(): void
		{
			this.stubArmed = true;
		},
	},
});
