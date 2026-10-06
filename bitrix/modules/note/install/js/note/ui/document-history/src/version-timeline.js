import { Type } from 'main.core';
import { DateTimeFormat } from 'main.date';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { NoteAvatarStack } from 'note.ui.avatar-stack';
import { Loader } from 'note.ui.loader';
import { HistoryApi } from './history-api';
import { subscribeDocumentHistory, extendDocumentHistoryWatch } from './history-pull';
import { extractErrorMessage } from './error-message';
import { showErrorToast } from './show-error-toast';
import { formatTime } from './format-date';
import { positionPopoverUnderTrigger } from 'note.ui.popover-position';

// [P1.T5 / P2.T4] History sidebar — the right-hand 3rd column, pushes the document content
// (see note.editor's document-page.js `--note-history-width` custom property), never overlays it.
//
// [#11/#12 rework] This sidebar no longer renders a version preview itself — clicking a
// restorable tile emits `preview` with `{ versionId, item }` and the caller (note.editor's
// document-page.js) takes it from there: it fetches the version markdown and pushes it into the
// MAIN editor (read-only), not into a narrow column here. This keeps the sidebar a pure list —
// restoring, compacting and the 409 retry (SDD P1.T2) now live with the caller too. `previewVersionId`
// is handed back down only so the currently-previewed tile can be highlighted / toggled off.
//
// [P2.T4] The feed (Block 2, listFeed API-04) is fetched and paginated by this component
// itself — the parent (note.editor's document-page.js) only owns open/close state, it doesn't
// pass data in. `groups` below is an internal computed, not a prop, grouped by calendar day from
// the flat `feedEvents` list; the shape matches the P1.T5 placeholder exactly: { key, dateLabel,
// items: [{ key, type, title, subtitle, authors, restorable, versionId, createdAt }] }. `authors`
// follows NoteAvatarStack's participant shape ({ id, name, avatar }); `restorable` +
// `versionId` gate the lazy preview (only `content_changed` events with a live version are
// restorable — see EVENT_LABELS / FeedProvider::enrich()).
const FEED_PAGE_SIZE = 30;

// [client-filter] The feed is fetched UNFILTERED (all role-allowed types) and the type filter is
// applied client-side, so toggling it never triggers a reload. When the filtered result is too
// short to scroll, we auto-load more raw pages so scroll-pagination can take over — but bound that
// to a safety cap so a rare type buried under thousands of other events can't spin the loader
// indefinitely. In practice a doc's rarer events sit well within this window.
const AUTOFILL_MAX_PAGES = 20;
// Same slack as handleBodyScroll's bottom trigger — "not scrollable" means within this of fitting.
const SCROLL_THRESHOLD_PX = 120;

// [SDD API-04 / EventVisibilityPolicy] Canonical event types, gender-neutral noun labels per
// UI-requirements — no "Version" noun anywhere, no gendered "changed" verb forms.
const EVENT_LABEL_KEYS = {
	created: 'historyEventCreated',
	content_changed: 'historyEventContentChanged',
	title_changed: 'historyEventTitleChanged',
	archived: 'historyEventArchived',
	archive_restored: 'historyEventArchiveRestored',
	trashed: 'historyEventTrashed',
	trash_restored: 'historyEventTrashRestored',
	moved: 'historyEventMoved',
	access_changed: 'historyEventAccessChanged',
};

// Module-level counter for a unique filter-popover id per instance (mirrors NoteAvatarStack's
// menuId) — avoids a hardcoded id colliding if this sidebar is ever rendered more than once.
let instanceCounter = 0;

export const VersionTimelineComponent = {
	name: 'NoteDocumentHistoryVersionTimeline',
	components: {
		NoteAvatarStack,
		Loader,
		BIcon,
	},
	props: {
		open: {
			type: Boolean,
			default: false,
		},
		documentId: {
			type: Number,
			required: true,
		},
		// [#11/#12 rework] Which version (if any) the caller currently has open in the main
		// editor's preview — used only to highlight the matching tile and let a second click on
		// the SAME tile toggle preview off (an explicit exit path alongside closing the sidebar).
		previewVersionId: {
			type: Number,
			default: 0,
		},
		// [version-diff] Timeline-owned "highlight changes" checkbox state. Owned by the caller
		// (document-page.js) so it survives the sidebar's open/close and version switches; this
		// component only renders it and emits `toggle-diff` on change.
		highlightChanges: {
			type: Boolean,
			default: false,
		},
		messages: {
			type: Object,
			required: true,
		},
		// [avatar profile] Optional function-prop from the caller (note.editor's document-page.js)
		// — invoked with a user id when an author avatar is clicked. Kept as a prop so this
		// extension stays free of note.editor's own link-opening utils.
		openUserProfile: {
			type: Function,
			default: null,
		},
	},
	emits: ['close', 'preview', 'toggle-diff'],
	data()
	{
		return {
			// [P2.T4] Feed state — a flat, de-duplicated accumulation of keyset pages.
			feedEvents: [],
			feedInitialized: false,
			feedLoading: false,
			feedLoadingMore: false,
			feedNextCursor: null,
			filterOpen: false,
			// [types filter] Event types the current role may see — server-fed via listFeed's
			// `allowedTypes`, populated once on the first response. Drives the filter checkboxes.
			allowedTypes: [],
			// Per-type on/off map (type -> bool); all true after the first response.
			filterTypes: {},
			// [#10] Roving-tabindex cursor within the open filter popover's menu rows.
			activeFilterIndex: 0,
		};
	},
	created()
	{
		// Non-reactive bookkeeping — a dedupe guard against double-fetch races (fast scroll,
		// filter toggled mid-request) and the outside-click handler for the filter popover.
		this.loadedEventIds = new Set();
		this.filterOutsideClickHandler = null;
		// [NEW-C] Pull subscription disposer, set up in mounted() regardless of `open` — pushes are
		// accumulated into the feed whether the sidebar is open or closed (see handleHistoryPushEvent),
		// so a closed-then-reopened sidebar never misses events recorded while it was closed.
		this.historyPullDispose = null;

		instanceCounter += 1;
		this.filterPopoverId = `note-version-timeline-filter-pop-${instanceCounter}`;
		this.filterTitleId = `note-version-timeline-filter-title-${instanceCounter}`;
	},
	mounted()
	{
		this.subscribeHistoryPull();
	},
	beforeUnmount()
	{
		this.detachFilterOutsideClick();
		this.unsubscribeHistoryPull();
	},
	watch: {
		open(nextOpen: boolean): void
		{
			// SDD UI-requirements: exiting preview happens by closing the sidebar — the caller
			// (document-page.js) owns that now, since the preview itself lives in the main editor.
			if (!nextOpen)
			{
				this.closeFilterPopover();

				return;
			}

			if (!this.feedInitialized)
			{
				void this.reloadFeed();
			}

			// [NEW-C] Renew the watch tag each time the sidebar opens — extendWatch only
			// prolongs an existing subscription, it doesn't create it (that already happened
			// in mounted()), so this is a cheap keepalive, not a re-subscribe.
			this.extendHistoryPullWatch();
		},
		documentId(): void
		{
			// [reactivity fix] Always invalidate the feed on navigation — the sidebar is usually
			// CLOSED while switching documents, and watch.open() only reloads when
			// `!feedInitialized`, so without resetting it here the next open would show the
			// PREVIOUS document's feed. Reset unconditionally, then reload now if open (a closed
			// sidebar's cleared feedInitialized guarantees a reload on its next open).
			this.loadedEventIds.clear();
			this.feedEvents = [];
			this.feedNextCursor = null;
			this.feedInitialized = false;
			// Role-allowed types are per-document — drop them so the next fetch re-seeds the filter
			// for the new doc (else a reader opening a doc after an owned one keeps the owner's
			// checkboxes, e.g. a "moved"/"access_changed" row they can never actually see).
			this.allowedTypes = [];
			this.filterTypes = {};
			this.closeFilterPopover();

			if (this.open)
			{
				void this.reloadFeed();
			}

			// [NEW-C] The pull tag is per-document — re-subscribe for the new one.
			this.subscribeHistoryPull();
		},
	},
	computed: {
		Outline: (): typeof Outline => Outline,
		// Mirrors the `note-mobile` signal used elsewhere in note.editor (heading-block-node-view,
		// attachments/node-view, mention-dialog) — no dedicated prop needed.
		isMobile(): boolean
		{
			return typeof document !== 'undefined' && document.documentElement.classList.contains('note-mobile');
		},
		// One checkbox row per allowed event type, labelled from EVENT_LABEL_KEYS — built
		// dynamically from the server-fed `allowedTypes` (role visibility), not a fixed list.
		filterTypeItems(): Array<Object>
		{
			return this.allowedTypes.map((type) => ({
				type,
				label: this.messages[EVENT_LABEL_KEYS[type]] || type,
			}));
		},
		selectedTypes(): Array<string>
		{
			return this.allowedTypes.filter((type) => this.filterTypes[type] === true);
		},
		isFilterAllSelected(): boolean
		{
			return this.allowedTypes.length > 0 && this.allowedTypes.every((type) => this.filterTypes[type] === true);
		},
		// True whenever the user narrowed below "all" — a proper subset OR nothing selected.
		// Both keep the "filtered" empty text (the plain empty text is for an unfiltered feed).
		isFilterNarrowed(): boolean
		{
			return this.allowedTypes.length > 0 && this.selectedTypes.length < this.allowedTypes.length;
		},
		// [#10] Menu rows in DOM order ("Select all" + one per type) — drives roving-tabindex
		// indices and Enter/Space activation in onFilterMenuKeydown().
		filterMenuItems(): Array<Object>
		{
			return [
				{ action: () => this.toggleSelectAll() },
				...this.filterTypeItems.map((item) => ({ action: () => this.toggleType(item.type) })),
			];
		},
		// [client-filter] The type filter is applied here, over the already-loaded (unfiltered)
		// feed — no server round-trip. Before allowedTypes is seeded (filterTypes still empty) the
		// raw feed passes through unfiltered, so the very first paint isn't blanked.
		visibleEvents(): Array<Object>
		{
			if (this.allowedTypes.length === 0)
			{
				return this.feedEvents;
			}

			return this.feedEvents.filter((event) => this.filterTypes[String(event?.type || '')] === true);
		},
		feedTiles(): Array<Object>
		{
			return this.visibleEvents.map((event) => this.buildTile(event));
		},
		groups(): Array<Object>
		{
			const result = [];
			let current = null;

			this.feedTiles.forEach((tile) => {
				if (!current || current.key !== tile.dayKey)
				{
					current = { key: tile.dayKey, dateLabel: tile.dayLabel, items: [] };
					result.push(current);
				}

				current.items.push(tile);
			});

			return result;
		},
	},
	methods: {
		toTimestampSeconds(value: mixed): ?number
		{
			if (typeof value !== 'string' || value === '')
			{
				return null;
			}

			const ms = Date.parse(value);

			return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
		},
		buildTile(event: Object): Object
		{
			const type = String(event?.type || '');
			const ts = this.toTimestampSeconds(event?.createdAt);
			const actor = Type.isPlainObject(event?.actor) ? event.actor : {};
			const rawAuthors = Array.isArray(event?.authors) && event.authors.length > 0 ? event.authors : [actor];
			const versionId = Number(event?.versionId);
			const authors = rawAuthors.map((author) => ({
				id: Number(author?.id) || 0,
				name: String(author?.name || ''),
				avatar: author?.avatar || null,
				// Preserve the server identity color so the avatar matches the caret / views / chip;
				// dropping it here made NoteAvatarStack fall back to the palette (wrong color).
				color: author?.color || null,
			}));

			return {
				key: String(event?.id ?? ''),
				type,
				title: this.messages[EVENT_LABEL_KEYS[type]] || this.messages.historyEventContentChanged,
				// Time-only, portal 12h/24h format — the calendar day is shown by the sticky group
				// date header above, so the tile itself doesn't repeat the date (see format-date.js).
				subtitle: ts === null ? '' : formatTime(ts),
				// dayKey is a non-displayed grouping key (stable 'Ymd'); dayLabel is the visible sticky
				// header and uses the portal's LONG_DATE_FORMAT so date ordering follows the culture
				// (culture-dependent, e.g. "July 13, 2026" vs "13 July 2026") — never hardcode 'j F Y'.
				dayKey: ts === null ? '' : DateTimeFormat.format('Ymd', ts),
				dayLabel: ts === null ? '' : DateTimeFormat.format(DateTimeFormat.getFormat('LONG_DATE_FORMAT'), ts),
				// Raw ISO timestamp (not the localized `subtitle`) — handed over as-is in the
				// `preview` payload so the caller's own chip (ActivityLineComponent) can format it
				// the same way it formats `lastChange.time` (see note-editor.js #12).
				createdAt: typeof event?.createdAt === 'string' ? event.createdAt : '',
				authors,
				// Line-1 caption: first author's name, plus an "and N more" suffix when there are more.
				authorsLabel: this.buildAuthorsLabel(authors),
				// Only a content_changed event with a still-existing version is restorable
				// (SDD P2.T3): title_changed/created/service markers stay static tiles — there's
				// no restore action wired for them yet.
				restorable: type === 'content_changed' && event?.versionAvailable === true,
				versionId: Number.isInteger(versionId) && versionId > 0 ? versionId : null,
			};
		},
		buildAuthorsLabel(authors: Array<Object>): string
		{
			if (authors.length === 0)
			{
				return '';
			}

			const firstName = String(authors[0]?.name || '');
			if (authors.length === 1)
			{
				return firstName;
			}

			const more = String(this.messages.historyAndMore || '').replace('#N#', String(authors.length - 1));

			return more === '' ? firstName : `${firstName} ${more}`;
		},
		async fetchFeed(cursor: ?Object): Promise<void>
		{
			const loadingMore = cursor !== null;

			if (loadingMore)
			{
				this.feedLoadingMore = true;
			}
			else
			{
				this.feedLoading = true;
			}

			try
			{
				const response = await HistoryApi.listFeed({
					documentId: this.documentId,
					// Always fetch the full role-allowed stream; the type filter is client-side.
					types: [],
					limit: FEED_PAGE_SIZE,
					afterCursor: cursor,
				});

				const allowed = Array.isArray(response?.data?.allowedTypes) ? response.data.allowedTypes : [];
				if (allowed.length > 0 && this.allowedTypes.length === 0)
				{
					// First response only: seed the filter with every allowed type on.
					this.allowedTypes = allowed;
					const nextFilter = {};
					allowed.forEach((type) => { nextFilter[type] = true; });
					this.filterTypes = nextFilter;
				}

				const events = Array.isArray(response?.data?.events) ? response.data.events : [];
				const freshEvents = events.filter((event) => {
					const id = Number(event?.id);
					if (!Number.isInteger(id) || this.loadedEventIds.has(id))
					{
						return false;
					}

					this.loadedEventIds.add(id);

					return true;
				});

				this.feedEvents = [...this.feedEvents, ...freshEvents];

				// nextCursor is an opaque { createdAt, id } — stored and echoed back verbatim.
				const nextCursor = response?.data?.nextCursor;
				this.feedNextCursor = Type.isPlainObject(nextCursor) ? nextCursor : null;
				this.feedInitialized = true;
			}
			catch (error)
			{
				showErrorToast(extractErrorMessage(error, this.messages.historyLoadError));
			}
			finally
			{
				if (loadingMore)
				{
					this.feedLoadingMore = false;
				}
				else
				{
					this.feedLoading = false;
				}
			}
		},
		async reloadFeed(): Promise<void>
		{
			this.loadedEventIds.clear();
			this.feedEvents = [];
			this.feedNextCursor = null;
			this.feedInitialized = false;
			await this.fetchFeed(null);
			await this.ensureFilled();
		},
		async loadMoreFeed(): Promise<void>
		{
			if (!this.feedInitialized || this.feedLoading || this.feedLoadingMore || !this.feedNextCursor)
			{
				return;
			}

			await this.fetchFeed(this.feedNextCursor);
		},
		// [client-filter] After a filter change (or the initial load), the client-filtered list can
		// be too short to scroll — and if it can't scroll, handleBodyScroll never fires to page the
		// rest in. Pull more raw pages until the body is scrollable again (then normal scroll
		// pagination resumes) or the cursor runs out. Bounded by AUTOFILL_MAX_PAGES so a rare type
		// under a long history can't loop forever. A zero selection can never match — skip entirely.
		async ensureFilled(): Promise<void>
		{
			if (this.selectedTypes.length === 0)
			{
				return;
			}

			let pages = 0;
			await this.$nextTick();
			while (
				pages < AUTOFILL_MAX_PAGES
				&& this.feedNextCursor
				&& !this.feedLoading
				&& !this.feedLoadingMore
				&& this.bodyNeedsMore()
			)
			{
				pages += 1;
				await this.loadMoreFeed();
				await this.$nextTick();
			}
		},
		// True when the feed body isn't (meaningfully) scrollable — so scroll pagination can't kick in.
		bodyNeedsMore(): boolean
		{
			const el = this.$refs.feedBody;
			if (!(el instanceof HTMLElement))
			{
				return false;
			}

			return el.scrollHeight <= el.clientHeight + SCROLL_THRESHOLD_PX;
		},
		// [SDD P2.T4] Seamless infinite scroll over the keyset cursor — no "show more" button.
		handleBodyScroll(event: Event): void
		{
			const el = event.currentTarget;
			if (!(el instanceof HTMLElement))
			{
				return;
			}

			if (el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_THRESHOLD_PX)
			{
				void this.loadMoreFeed();
			}
		},
		toggleFilterPopover(): void
		{
			if (this.filterOpen)
			{
				this.closeFilterPopover();

				return;
			}

			this.filterOpen = true;
			this.activeFilterIndex = 0;
			this.attachFilterOutsideClick();

			// [#10] Roving focus starts on the first row ("Select all"). [#5] Position
			// centered under the funnel trigger.
			this.$nextTick(() => {
				positionPopoverUnderTrigger(this.$refs.filterButton, this.$refs.filterPopover);
				this.focusFilterItem(0);
			});
		},
		closeFilterPopover(refocusTrigger: boolean = false): void
		{
			if (!this.filterOpen)
			{
				return;
			}

			this.filterOpen = false;
			this.detachFilterOutsideClick();

			if (refocusTrigger)
			{
				this.$nextTick(() => this.$refs.filterButton?.focus?.());
			}
		},
		handleFilterPopoverFocusOut(event: FocusEvent): void
		{
			const popover = this.$refs.filterPopover;
			const button = this.$refs.filterButton;
			const nextFocus = event.relatedTarget;

			// [iOS] Close via focusout ONLY when focus moved to a real element (keyboard Tab). A
			// null/non-element relatedTarget means the blur came from a tap — iOS Safari doesn't focus
			// <button>s on tap, so closing here would race the trigger's own click and reopen the
			// popover ("second tap doesn't close"). Tap-outside and trigger re-tap are owned by the
			// outside-click listener and the toggle handler respectively.
			if (!(nextFocus instanceof HTMLElement))
			{
				return;
			}

			// Focus moving onto the trigger button — let the button's own toggle handler decide.
			if (button instanceof HTMLElement && button.contains(nextFocus))
			{
				return;
			}

			if (popover instanceof HTMLElement && !popover.contains(nextFocus))
			{
				// Tab moved focus outside the popover — close without stealing focus back.
				this.closeFilterPopover();
			}
		},
		// [#10] Menu rows in DOM order — mirrors note.ui.avatar-stack's menuItemElements().
		filterItemElements(): Array<HTMLElement>
		{
			const popover = this.$refs.filterPopover;

			return popover instanceof HTMLElement
				? [...popover.querySelectorAll('.note-version-timeline__filter-option')]
				: [];
		},
		focusFilterItem(index: number): void
		{
			const items = this.filterItemElements();
			if (items.length === 0)
			{
				return;
			}

			const clamped = Math.max(0, Math.min(items.length - 1, index));
			this.activeFilterIndex = clamped;
			items[clamped]?.focus();
		},
		// [#10] Roving-tabindex menu keydown — same key set as note.ui.avatar-stack's
		// onParticipantsMenuKeydown. Unlike that menu (and the subscription-bell popover), Tab
		// here can't just fall through to the browser default: the popover renders AFTER the
		// close button in the DOM, so a plain Tab would skip over it entirely. Explicitly move
		// focus to the close button instead — "next element after the funnel trigger".
		onFilterMenuKeydown(event: KeyboardEvent): void
		{
			const lastIndex = this.filterMenuItems.length - 1;

			switch (event.key)
			{
				case 'ArrowDown':
					event.preventDefault();
					this.focusFilterItem(this.activeFilterIndex + 1);
					break;
				case 'ArrowUp':
					event.preventDefault();
					this.focusFilterItem(this.activeFilterIndex - 1);
					break;
				case 'Home':
					event.preventDefault();
					this.focusFilterItem(0);
					break;
				case 'End':
					event.preventDefault();
					this.focusFilterItem(lastIndex);
					break;
				case 'Enter':
				case ' ':
					event.preventDefault();
					this.filterMenuItems[this.activeFilterIndex]?.action();
					break;
				case 'Escape':
					event.preventDefault();
					this.closeFilterPopover(true);
					break;
				case 'Tab':
					event.preventDefault();
					this.filterOpen = false;
					this.detachFilterOutsideClick();
					this.$nextTick(() => {
						if (event.shiftKey)
						{
							this.$refs.filterButton?.focus?.();
						}
						else
						{
							this.$refs.closeButton?.focus?.();
						}
					});
					break;
				default:
					break;
			}
		},
		toggleType(type: string): void
		{
			// [client-filter] Pure client-side narrow — no reload; just top up if it left the list
			// too short to scroll.
			this.filterTypes = { ...this.filterTypes, [type]: !this.filterTypes[type] };
			void this.ensureFilled();
		},
		toggleSelectAll(): void
		{
			const next = !this.isFilterAllSelected;
			const nextFilter = { ...this.filterTypes };
			this.allowedTypes.forEach((type) => { nextFilter[type] = next; });
			this.filterTypes = nextFilter;
			void this.ensureFilled();
		},
		attachFilterOutsideClick(): void
		{
			if (this.filterOutsideClickHandler)
			{
				return;
			}

			this.filterOutsideClickHandler = (event: MouseEvent) => {
				const popover = this.$refs.filterPopover;
				const button = this.$refs.filterButton;
				const target = event.target;
				if (popover instanceof HTMLElement && target instanceof Node && popover.contains(target))
				{
					return;
				}

				if (button instanceof HTMLElement && target instanceof Node && button.contains(target))
				{
					return;
				}

				this.closeFilterPopover();
			};

			// Defer so the opening click itself doesn't immediately close the popover.
			setTimeout(() => {
				document.addEventListener('click', this.filterOutsideClickHandler, true);
			}, 0);
		},
		detachFilterOutsideClick(): void
		{
			if (this.filterOutsideClickHandler)
			{
				document.removeEventListener('click', this.filterOutsideClickHandler, true);
				this.filterOutsideClickHandler = null;
			}
		},
		// [NEW-C] Client half of the NOTE_DOC_HISTORY_{documentId} contract (server \CPullWatch::Add
		// already happened at render). Delegates the subscribe/extend/route plumbing to the shared
		// history-pull helper — the same helper the activity-line chip uses — and only owns how a
		// pushed event lands in this feed (handleHistoryPushEvent).
		subscribeHistoryPull(): void
		{
			this.unsubscribeHistoryPull();
			this.historyPullDispose = subscribeDocumentHistory(
				this.documentId,
				(event) => this.handleHistoryPushEvent(event),
			);
		},
		unsubscribeHistoryPull(): void
		{
			if (typeof this.historyPullDispose === 'function')
			{
				this.historyPullDispose();
			}

			this.historyPullDispose = null;
		},
		extendHistoryPullWatch(): void
		{
			extendDocumentHistoryWatch(this.documentId);
		},
		// [NEW-C] Inserts a freshly pushed event as a new tile at the head of the feed, whether the
		// sidebar is open or closed — a closed sidebar keeps accumulating so reopening shows events
		// recorded meanwhile (watch.open() won't reload an already-initialized feed). `event` has the
		// same shape as a listFeed row (see FeedProvider::enrichOne()), so buildTile() is reused
		// unchanged. Dedup by event id against the same loadedEventIds guard fetchFeed() uses — a push
		// racing an in-flight page fetch (or a duplicate delivery) never double-renders the same event.
		handleHistoryPushEvent(event: ?Object): void
		{
			if (!Type.isPlainObject(event))
			{
				return;
			}

			const id = Number(event.id);
			if (!Number.isInteger(id) || id <= 0 || this.loadedEventIds.has(id))
			{
				return;
			}

			// Match the pushed event against the CURRENT client-side type filter (the push is
			// broadcast unfiltered to every tag watcher). Once the filter is initialized, only
			// insert a tile for a type the user currently has on.
			const type = String(event.type || '');
			if (this.allowedTypes.length > 0 && this.filterTypes[type] !== true)
			{
				return;
			}

			this.loadedEventIds.add(id);
			this.feedEvents = [event, ...this.feedEvents];
		},
		handleClose(): void
		{
			this.$emit('close');
		},
		// [version-diff] Checkbox change — the caller owns the state, so just forward the intent.
		handleToggleDiff(event: Event): void
		{
			const target = event?.target;
			this.$emit('toggle-diff', target instanceof HTMLInputElement ? target.checked : !this.highlightChanges);
		},
		// Author-avatar click inside a tile — the caller opens the user profile (new tab / native
		// card). NoteAvatarStack already stops the DOM click from bubbling to the tile's own
		// preview handler when avatarsClickable is set.
		handleAvatarClick(participant: Object): void
		{
			const id = Number(participant?.id);
			if (Number.isInteger(id) && id > 0 && typeof this.openUserProfile === 'function')
			{
				this.openUserProfile(id);
			}
		},
		isActiveTile(item: Object): boolean
		{
			return this.previewVersionId > 0 && Number(item?.versionId) === this.previewVersionId;
		},
		tilePreviewAriaLabel(item: Object): string
		{
			return this.messages.historyTilePreviewAria.replace('#TITLE#', item?.title || '');
		},
		// [#11 rework] No local fetch/render anymore — just tell the caller which version was
		// clicked. A second click on the already-active tile is the explicit "exit preview" path
		// (mirrors closing the sidebar, which also exits — see document-page.js).
		handleTileClick(item: Object): void
		{
			if (!item?.restorable || !Number.isInteger(Number(item?.versionId)) || Number(item.versionId) <= 0)
			{
				return;
			}

			this.$emit('preview', { versionId: Number(item.versionId), item });
		},
		handleTileSpaceKey(event: KeyboardEvent, item: Object): void
		{
			// preventDefault (scroll) only for actionable tiles; static tiles must let Space scroll.
			if (!item.restorable)
			{
				return;
			}

			event.preventDefault();
			this.handleTileClick(item);
		},
	},
	// language=Vue
	template: `
		<aside class="note-version-timeline" :class="{ '--open': open }">
			<div class="note-version-timeline__inner">
				<div class="note-version-timeline__head">
					<h3 class="note-version-timeline__title">{{ messages.historyTitle }}</h3>
					<button
						ref="filterButton"
						type="button"
						class="note-version-timeline__filter"
						:class="{ '--active': filterOpen }"
						:title="messages.historyFilterButton"
						:aria-label="messages.historyFilterButton"
						:aria-expanded="filterOpen ? 'true' : 'false'"
						:aria-controls="filterPopoverId"
						@click="toggleFilterPopover"
					>
						<BIcon :name="Outline.FILTER_FUNNEL" class="note-version-timeline__icon" aria-hidden="true" />
					</button>
					<button
						ref="closeButton"
						type="button"
						class="note-version-timeline__close"
						:title="messages.historyClose"
						:aria-label="messages.historyClose"
						@click="handleClose"
					>
						<BIcon :name="Outline.CROSS_L" class="note-version-timeline__icon" aria-hidden="true" />
					</button>
					<div
						v-if="filterOpen"
						:id="filterPopoverId"
						ref="filterPopover"
						class="note-version-timeline__filter-pop"
						role="menu"
						:aria-labelledby="filterTitleId"
						@keydown="onFilterMenuKeydown"
						@focusout="handleFilterPopoverFocusOut"
					>
						<div :id="filterTitleId" class="note-version-timeline__filter-title">{{ messages.historyFilterTitle }}</div>
						<label
							class="note-version-timeline__filter-option"
							role="menuitemcheckbox"
							:aria-checked="isFilterAllSelected ? 'true' : 'false'"
							:tabindex="activeFilterIndex === 0 ? 0 : -1"
						>
							<input type="checkbox" tabindex="-1" :checked="isFilterAllSelected" @change="toggleSelectAll" />
							<span>{{ messages.historyFilterSelectAll }}</span>
						</label>
						<div class="note-version-timeline__filter-sep"></div>
						<label
							v-for="(typeItem, index) in filterTypeItems"
							:key="typeItem.type"
							class="note-version-timeline__filter-option"
							role="menuitemcheckbox"
							:aria-checked="filterTypes[typeItem.type] === true ? 'true' : 'false'"
							:tabindex="activeFilterIndex === index + 1 ? 0 : -1"
						>
							<input
								type="checkbox"
								tabindex="-1"
								:checked="filterTypes[typeItem.type] === true"
								@change="toggleType(typeItem.type)"
							/>
							<span>{{ typeItem.label }}</span>
						</label>
					</div>
				</div>
				<label class="note-version-timeline__diff-toggle">
					<span class="ui-checkbox --size-md" :class="{ '--checked': highlightChanges }">
						<input
							type="checkbox"
							class="ui-checkbox__input"
							:checked="highlightChanges"
							@change="handleToggleDiff"
						/>
						<span class="ui-checkbox__box" aria-hidden="true">
							<span v-if="highlightChanges" class="ui-checkbox__icon">
								<span class="ui-icon-set --check-m"></span>
							</span>
						</span>
					</span>
					<span class="note-version-timeline__diff-label">{{ messages.historyHighlightChanges }}</span>
				</label>
				<div ref="feedBody" class="note-version-timeline__body" @scroll="handleBodyScroll">
					<div v-if="feedLoading && feedEvents.length === 0" class="note-version-timeline__loading-more">
						<Loader :label="messages.loading" />
					</div>
					<div v-else-if="groups.length === 0 && feedLoadingMore" class="note-version-timeline__loading-more">
						<Loader :label="messages.loading" />
					</div>
					<div v-else-if="groups.length === 0" class="note-version-timeline__empty">
						{{ isFilterNarrowed ? messages.historyEmptyFiltered : messages.historyEmpty }}
					</div>
					<div v-else class="note-version-timeline__list">
						<div v-for="group in groups" :key="group.key" class="note-version-timeline__group">
							<div class="note-version-timeline__day">{{ group.dateLabel }}</div>
							<div class="note-version-timeline__track">
								<div
									v-for="item in group.items"
									:key="item.key"
									class="note-version-timeline__item"
									:class="{ '--restorable': item.restorable }"
								>
									<span class="note-version-timeline__node"></span>
									<div
										class="note-version-timeline__tile"
										:class="{ '--active': isActiveTile(item) }"
										:tabindex="item.restorable ? 0 : -1"
										:role="item.restorable ? 'button' : null"
										:aria-label="item.restorable ? tilePreviewAriaLabel(item) : null"
										:aria-pressed="item.restorable ? (isActiveTile(item) ? 'true' : 'false') : null"
										@click="handleTileClick(item)"
										@keydown.enter="handleTileClick(item)"
										@keydown.space="handleTileSpaceKey($event, item)"
									>
										<div class="note-version-timeline__tile-main">
											<div class="note-version-timeline__tile-line1">
												<span class="note-version-timeline__tile-type">{{ item.title }}</span>
												<span class="note-version-timeline__tile-date">{{ item.subtitle }}</span>
											</div>
											<div class="note-version-timeline__tile-line2">
												<NoteAvatarStack
													v-if="item.authors && item.authors.length"
													class="note-version-timeline__tile-avatars"
													:participants="item.authors"
													:avatars-clickable="true"
													:menu-aria-label="messages.historyCoAuthorsTitle"
													@avatar-click="handleAvatarClick"
												/>
												<span v-if="item.authorsLabel" class="note-version-timeline__tile-author">{{ item.authorsLabel }}</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div v-if="feedLoadingMore" class="note-version-timeline__loading-more">
							<Loader :label="messages.loading" />
						</div>
					</div>
				</div>
			</div>
		</aside>
	`,
};
