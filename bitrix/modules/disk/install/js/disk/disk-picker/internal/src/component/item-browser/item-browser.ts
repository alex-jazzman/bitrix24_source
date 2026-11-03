import { Loc } from 'main.core';
import 'main.polyfill.intersectionobserver';
import { Outline } from 'ui.icon-set.api.vue';
import { defineComponent } from 'ui.vue3';
import { TextXs } from 'ui.system.typography.vue';

import { ObjectTypeFilter, SearchQueryLength, StageType, ViewMode } from '../../const/picker';
import { type ViewModeValue } from '../../const/types';
import { loadNextPage, retryNextPage } from '../../feature/load-next-page/load-next-page';
import { retryInitialStage } from '../../feature/load-initial-stage/load-initial-stage';
import { openParentFolder, reloadCurrentFeed } from '../../feature/open-folder/open-folder';
import { searchItems } from '../../feature/search-items/search-items';
import { compareDateGroups, resolveDateGroup, type DateGroup } from '../../lib/date-group/date-group';
import { errorMessageCode } from '../../lib/error-message/error-message';
import { DEFAULT_METRICS, readMetrics, type PickerMetrics } from '../../lib/metrics/metrics';
import {
	focusCompositeItem,
	isTextEntryTarget,
	resolveCompositeNavigationIndex,
	resolveFallbackId,
	scrollOffsetForEntry,
	takeCurrentFocus,
	type CompositeItemId,
	type CompositeNavigationKey,
	type DeferredFocus,
} from '../../lib/composite-navigation/composite-navigation';
import { useItemStore } from '../../model/item/item';
import { type PickerItem } from '../../model/item/types';
import { useSelectionStore } from '../../model/selection/selection';
import { useSessionStore } from '../../model/session/session';
import { ItemRowSkeleton } from '../item-row-skeleton/item-row-skeleton';
import { EmptyState } from '../empty-state/empty-state';
import { ItemRow } from '../item-row/item-row';
import { ItemTable } from '../item-table/item-table';

import './item-browser.css';

// Row and group advances are not declared here: they are read off the layout at mount, from the
// same custom properties the stylesheets lay the rows out with (see lib/metrics).
const VIRTUAL_VIEWPORT_HEIGHT = 640;
const VIRTUAL_OVERSCAN = 440;
const PAGINATION_ROOT_MARGIN = '120px 0px';
// The swap animation in item-browser.css: 300ms of travel plus the 210ms the last staggered
// row waits before it starts. The class has to outlive both.
const SWITCH_ANIMATION_MS = 510;
// Retry of a stalled pagination is the last stop of the vertical axis, after the rows.
const RETRY_ID = 'retry';
const VERTICAL_KEYS = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp'];

// The row as a whole, in both views. `data-composite-id` sits on the element that holds the
// tab stop, and the eye of the row is not inside it - a sibling in the list, a cell of its
// own in the table - so a lookup that starts from the eye has to climb to the row first.
const ROW_SELECTOR = '.disk-picker-item-row-wrap, .disk-picker-item-table__row';

// The item the event came from, whichever element of the row holds the focus.
function compositeIdOfEvent(event: Event): CompositeItemId | null
{
	const target = event.target as HTMLElement;
	const holder = target.closest<HTMLElement>('[data-composite-id]')
		?? target.closest<HTMLElement>(ROW_SELECTOR)?.querySelector<HTMLElement>('[data-composite-id]')
		?? null;

	if (holder === null)
	{
		return null;
	}

	const rawId = holder.dataset.compositeId ?? '';

	return rawId === RETRY_ID ? RETRY_ID : Number(rawId);
}

type ItemGroup = {
	key: string,
	label: string,
	items: PickerItem[],
};

type VirtualEntry = {
	key: string,
	type: 'group' | 'item',
	label: string,
	item: PickerItem | null,
	top: number,
	height: number,
};

type VirtualWindow<T> = {
	items: T[],
	top: number,
	bottom: number,
};

function firstEntryAfter<T extends { top: number, height: number }>(items: T[], offset: number): number
{
	let low = 0;
	let high = items.length;
	while (low < high)
	{
		const middle = Math.floor((low + high) / 2);
		if (items[middle].top + items[middle].height <= offset)
		{
			low = middle + 1;
		}
		else
		{
			high = middle;
		}
	}

	return low;
}

function firstEntryAtOrAfter<T extends { top: number }>(items: T[], offset: number): number
{
	let low = 0;
	let high = items.length;
	while (low < high)
	{
		const middle = Math.floor((low + high) / 2);
		if (items[middle].top < offset)
		{
			low = middle + 1;
		}
		else
		{
			high = middle;
		}
	}

	return low;
}

export function windowByOffset<T extends { top: number, height: number }>(
	items: T[],
	scrollTop: number,
): VirtualWindow<T>
{
	const last = items[items.length - 1];
	const totalHeight = last ? last.top + last.height : 0;
	const startOffset = Math.max(0, scrollTop - VIRTUAL_OVERSCAN);
	const endOffset = scrollTop + VIRTUAL_VIEWPORT_HEIGHT + VIRTUAL_OVERSCAN;
	const start = firstEntryAfter(items, startOffset);
	const end = firstEntryAtOrAfter(items, endOffset);

	return {
		items: items.slice(start, end),
		top: items[start]?.top ?? totalHeight,
		bottom: Math.max(0, totalHeight - (items[end - 1]?.top ?? 0) - (items[end - 1]?.height ?? 0)),
	};
}

// The list and the table are two projections of the same feed. The browser owns
// the shared states - loading, the four empty states and the load error - and
// switches only the content projection by view mode. The empty marker comes from
// the backend (`emptyReason`), never re-derived from an always-empty items array.
export const ItemBrowser = defineComponent({
	name: 'DiskPickerItemBrowser',
	components: {
		ItemRowSkeleton,
		EmptyState,
		ItemRow,
		ItemTable,
		TextXs,
	},
	setup(): Object
	{
		// Uneven lengths read as a list of names rather than as a pattern; the count fills the
		// visible height of the list at its own row advance.
		return { ViewMode, skeletonWidths: [230, 180, 260, 200, 150, 240, 190] };
	},
	data(): {
		pendingNavFocus: boolean,
		preferredNavFocusId: number | null,
		pendingFocus: DeferredFocus | null,
		focusedObjectId: CompositeItemId | null,
		virtualScrollTop: number,
		paginationObserver: IntersectionObserver | null,
		scrollFrame: number | null,
		pendingScrollTop: number,
		switching: boolean,
		switchTimer: number | null,
		switchPending: boolean,
		switchDirection: 'forward' | 'back' | 'none',
		crumbCount: number,
		metrics: PickerMetrics,
		}
	{
		return {
			pendingNavFocus: false,
			preferredNavFocusId: null,
			pendingFocus: null,
			focusedObjectId: null,
			virtualScrollTop: 0,
			paginationObserver: null,
			scrollFrame: null,
			pendingScrollTop: 0,
			switching: false,
			switchTimer: null,
			switchPending: false,
			switchDirection: 'none',
			crumbCount: 0,
			metrics: { ...DEFAULT_METRICS },
		};
	},
	computed: {
		// True once the list has left its top: the sticky table head thickens then, so its
		// labels do not have to compete with the rows passing underneath.
		scrolled(): boolean
		{
			return this.virtualScrollTop > 0;
		},
		items(): PickerItem[]
		{
			return useItemStore().items;
		},
		session(): ReturnType<typeof useSessionStore>
		{
			return useSessionStore();
		},
		viewMode(): ViewModeValue
		{
			return this.session.viewMode;
		},
		// The roving point across rows and the pagination Retry: whatever last took
		// focus, as long as it is still on the axis, else the active/first row.
		focusObjectId(): CompositeItemId | null
		{
			if (this.focusedObjectId !== null && this.navigationIds.includes(this.focusedObjectId))
			{
				return this.focusedObjectId;
			}

			const activeObjectId = useSelectionStore().activeObjectId;

			return this.items.some((item) => item.objectId === activeObjectId)
				? activeObjectId
				: this.items[0]?.objectId ?? null;
		},
		// Numeric-only view of focusObjectId for the table, whose prop never accepts
		// the Retry key: while it holds focus, no row claims the table's own point.
		tableFocusObjectId(): number | null
		{
			return typeof this.focusObjectId === 'number' ? this.focusObjectId : null;
		},
		navigationIds(): CompositeItemId[]
		{
			const ids: CompositeItemId[] = this.items.map((item) => item.objectId);
			if (this.session.paginationStalled)
			{
				ids.push(RETRY_ID);
			}

			return ids;
		},
		// ALG-02: a deferred focus outlives none of these.
		focusVersion(): string
		{
			return `${this.feedKey}|${this.viewMode}|${this.session.searchQuery}`;
		},
		contentLoading(): boolean
		{
			return this.session.contentLoading;
		},
		fullContentLoading(): boolean
		{
			return this.contentLoading && !this.session.preserveContentOnLoading;
		},
		overlayContentLoading(): boolean
		{
			return this.contentLoading && this.session.preserveContentOnLoading;
		},
		navigationPending(): boolean
		{
			return this.session.navigationPending;
		},
		// Feed identity: a change means a navigation (folder, source or recent) that
		// re-renders the whole list.
		feedKey(): string
		{
			const feed = this.session.feed;

			return `${feed.stageType}:${feed.storageId}:${feed.folderId}`;
		},
		searchActive(): boolean
		{
			return [...this.session.searchQuery.trim()].length >= SearchQueryLength.Min;
		},
		filtersActive(): boolean
		{
			return this.session.objectTypeFilter !== ObjectTypeFilter.All || this.session.fileTypeFilters.length > 0;
		},
		hasError(): boolean
		{
			return this.session.contentError !== null;
		},
		isEmpty(): boolean
		{
			return !this.session.contentLoading && !this.hasError && this.session.emptyReason === 'empty';
		},
		// True only in the template's row-rendering branch. `navigationIds` can stay
		// non-empty during loading or after an error - the feed keeps the previous
		// items in the store - so a focus retry must check this before chasing an id.
		rowsRendered(): boolean
		{
			return !this.fullContentLoading && !this.hasError && !this.isEmpty;
		},
		errorTitle(): string
		{
			return this.loc(errorMessageCode(this.session.contentError));
		},
		// Exposed as a computed like `emptyIcon`: the inline template resolves names
		// against the instance, not the module scope, so `Outline` is not reachable there.
		errorIcon(): string
		{
			return Outline.ALERT;
		},
		// Empty folder, empty search/filter result and empty disk are not
		// interchangeable: the kind decides the icon, message and whether a reset is
		// offered.
		emptyIcon(): string
		{
			if (this.searchActive || this.filtersActive)
			{
				return Outline.SEARCH;
			}

			return this.session.stageType === StageType.Folder ? Outline.FOLDER : Outline.FILE;
		},
		// Every empty state carries artwork: a glyph beside a line of text read as an error where
		// the design has a picture. An empty disk or an empty recent feed has no drawing of its
		// own yet and borrows the one the preview panel shows for "no file".
		emptyGraphic(): string
		{
			if (this.searchActive || this.filtersActive)
			{
				return 'no-results';
			}

			return this.session.stageType === StageType.Folder ? 'folder' : 'no-file';
		},
		emptyTitle(): string
		{
			if (this.searchActive || this.filtersActive)
			{
				return this.loc('DISK_PICKER_NOTHING_FOUND');
			}

			if (this.session.stageType === StageType.Folder)
			{
				return this.loc('DISK_PICKER_EMPTY_FOLDER');
			}

			// The recent feed is not a disk: its empty text must not read "on this disk".
			return this.session.stageType === StageType.Recent
				? this.loc('DISK_PICKER_EMPTY_RECENT')
				: this.loc('DISK_PICKER_EMPTY_DISK');
		},
		emptyActionLabel(): string
		{
			// Adjusting the query or resetting the filters must be possible without
			// reloading the picker; only a filtered/searched empty offers the reset.
			return (this.searchActive || this.filtersActive) ? this.loc('DISK_PICKER_RESET_FILTERS') : '';
		},
		groups(): ItemGroup[]
		{
			if (!this.searchActive && this.session.stageType === StageType.Folder)
			{
				return [{ key: 'folder', label: '', items: this.items }];
			}

			const useRecentTime = !this.searchActive && this.session.stageType === StageType.Recent;
			const now = Math.floor(Date.now() / 1000);
			const buckets = new Map<string, { group: DateGroup, items: PickerItem[] }>();
			this.items.forEach((item) => {
				const group = resolveDateGroup(useRecentTime ? item.recentTime : item.updateTime, now);
				const bucket = buckets.get(group.key) ?? { group, items: [] };
				bucket.items.push(item);
				buckets.set(group.key, bucket);
			});

			return [...buckets.values()]
				.sort((left, right) => compareDateGroups(left.group, right.group))
				.map(({ group, items }) => ({
					key: group.key,
					label: group.labelCode ? this.loc(group.labelCode) : group.label ?? '',
					items,
				}));
		},
		virtualEntries(): VirtualEntry[]
		{
			const entries: VirtualEntry[] = [];
			let top = 0;
			this.groups.forEach((group) => {
				if (group.label)
				{
					entries.push({
						key: `group-${group.key}`,
						type: 'group',
						label: group.label,
						item: null,
						top,
						height: this.metrics.groupTitle,
					});
					top += this.metrics.groupTitle;
				}
				group.items.forEach((item) => {
					entries.push({
						key: `item-${item.objectId}`,
						type: 'item',
						label: '',
						item,
						top,
						height: this.metrics.listRow,
					});
					top += this.metrics.listRow;
				});
			});

			return entries;
		},
		virtualListWindow(): VirtualWindow<VirtualEntry>
		{
			return windowByOffset(this.virtualEntries, this.virtualScrollTop);
		},
		virtualTableWindow(): VirtualWindow<PickerItem>
		{
			const rowHeight = this.metrics.tableRow;
			const start = Math.max(0, Math.floor(
				(this.virtualScrollTop - VIRTUAL_OVERSCAN) / rowHeight,
			));
			const visibleCount = Math.ceil(
				(VIRTUAL_VIEWPORT_HEIGHT + 2 * VIRTUAL_OVERSCAN) / rowHeight,
			);
			const end = Math.min(this.items.length, start + visibleCount);

			return {
				items: this.items.slice(start, end),
				top: start * rowHeight,
				bottom: (this.items.length - end) * rowHeight,
			};
		},
		announcement(): string
		{
			if (this.session.contentLoading)
			{
				return this.loc('DISK_PICKER_LOADING');
			}

			if (this.hasError)
			{
				return this.errorTitle;
			}

			if (this.isEmpty)
			{
				return this.emptyTitle;
			}

			return this.loc('DISK_PICKER_ANNOUNCE_COUNT', { '#COUNT#': String(this.items.length) });
		},
	},
	watch: {
		// Keyboard navigation into a folder removes the activated row from the DOM, so
		// focus would fall to the body. When the feed changes while focus is inside the
		// list, recover it to the new feed once its content has loaded.
		feedKey(): void
		{
			const root = this.$el as HTMLElement | undefined;
			// Only arm the animation here. The rows of the previous feed are still on screen at
			// this point — running it now plays the swap on the content being left behind, and
			// then again on the content that arrives, which reads as one navigation animated
			// twice. The watcher on the loading flag below starts it when there is something new
			// to show.
			this.switchPending = true;
			this.virtualScrollTop = 0;
			// A feed served from the cache never turns the loading flag on, so the watcher below
			// would wait for a load that has already happened and hold the animation until the next
			// navigation, playing it there with the wrong direction. If the content is on screen by
			// the next tick, it is the new content and it travels now.
			this.$nextTick(() => this.runPendingSwitch());
			// ALG-01: also claim focus for a control outside this group (a breadcrumb
			// link) that armed the handoff before triggering this navigation.
			const handoff = this.session.consumeFocusHandoffToFiles();
			if (handoff || (root && root.contains(document.activeElement)))
			{
				this.pendingNavFocus = true;
			}

			if (root)
			{
				root.scrollTop = 0;
			}
		},
		// Switching the projection swaps the whole content for another shape of the same feed.
		// Nothing is fetched, so the new shape is on screen within the tick and the animation
		// starts at once.
		viewMode(): void
		{
			this.switchDirection = 'none';
			this.markSwitch();
			// The scrolling box goes back to the top together with the count of where it stands.
			// Left behind, it kept its old offset while the virtual window rendered the rows of
			// the top: the new projection came up blank and jumped into place at the first scroll
			// event. Both projections of the same feed are laid out differently — a list carries
			// group titles, a table does not — so there is no offset to carry over.
			const root = this.$el as HTMLElement | null;
			if (root)
			{
				root.scrollTop = 0;
			}

			this.virtualScrollTop = 0;
			this.pendingScrollTop = 0;
			this.$nextTick(() => this.observePaginationSentinel());
			// The keyboard is the exception to the reset above: a roving point inside the group
			// keeps its row, and the scroll follows it to where the new projection put it.
			if (root && root.contains(document.activeElement) && this.focusObjectId !== null)
			{
				this.$nextTick(() => this.moveFocusTo(this.focusObjectId as CompositeItemId));
			}
		},
		'items.length': function(): void
		{
			this.$nextTick(() => this.observePaginationSentinel());
			// Backstop for handleRetryContent/handleResetFilters on a stage that never
			// toggles contentLoading (e.g. Recent, filtered locally).
			if (this.pendingNavFocus)
			{
				this.pendingNavFocus = false;
				this.$nextTick(() => this.focusAfterNavigation());
			}
		},
		// ALG-01: the pagination Retry leaves the roving axis once its page loads.
		navigationIds(ids: CompositeItemId[], previousIds: CompositeItemId[]): void
		{
			const active = document.activeElement;
			const focusedKey = active instanceof HTMLElement ? active.dataset.compositeId ?? null : null;
			if (focusedKey === null || ids.some((id) => String(id) === focusedKey))
			{
				return;
			}

			const root = this.$el as HTMLElement | undefined;
			if (!root || !(active === document.body || root.contains(active)))
			{
				return;
			}

			// A folder just left by Backspace already armed a preferred target in the
			// `feedKey` watcher above (same flush, registered earlier). A parent page
			// served straight from cache updates `navigationIds` synchronously too, with
			// no later `items.length`/`contentLoading` change to consume the pending flag
			// - route through `focusAfterNavigation` here instead of the generic
			// positional fallback, or focus lands on a row picked by position rather than
			// the folder the user backed out of.
			if (this.pendingNavFocus)
			{
				this.pendingNavFocus = false;
				this.$nextTick(() => this.focusAfterNavigation());

				return;
			}

			const previousIndex = previousIds.findIndex((id) => String(id) === focusedKey);
			const fallbackId = resolveFallbackId(ids, null, previousIndex);
			this.$nextTick(() => this.focusRowOrStablePoint(fallbackId));
		},
		contentLoading(loading: boolean): void
		{
			if (!loading)
			{
				this.$nextTick(() => this.observePaginationSentinel());
			}

			// The animation armed by a change of feed runs the moment that feed's content stops
			// loading, so the rows that appear are the ones that travel. A page appended to the
			// same feed leaves the flag untouched and is not animated.
			if (!loading)
			{
				this.runPendingSwitch();
			}

			if (!loading && this.pendingNavFocus)
			{
				this.pendingNavFocus = false;
				this.$nextTick(() => this.focusAfterNavigation());
			}
		},
		navigationPending(pending: boolean): void
		{
			if (!pending)
			{
				this.$nextTick(() => this.observePaginationSentinel());
			}
		},
	},
	mounted(): void
	{
		this.metrics = readMetrics(this.$el as Element);
		this.crumbCount = this.session.breadcrumbs.length;
		this.paginationObserver = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting))
				{
					void loadNextPage(this.session.callbacks);
				}
			},
			{
				root: this.$el as HTMLElement,
				rootMargin: PAGINATION_ROOT_MARGIN,
			},
		);
		this.observePaginationSentinel();
	},
	beforeUnmount(): void
	{
		this.paginationObserver?.disconnect();
		this.paginationObserver = null;
		if (this.scrollFrame !== null)
		{
			cancelAnimationFrame(this.scrollFrame);
			this.scrollFrame = null;
		}

		if (this.switchTimer !== null)
		{
			clearTimeout(this.switchTimer);
			this.switchTimer = null;
		}
	},
	methods: {
		// Runs the armed animation once, whichever of the two paths gets here first: the cached
		// navigation through the next tick, or the fetched one through the end of its load.
		runPendingSwitch(): void
		{
			if (!this.switchPending || this.contentLoading)
			{
				return;
			}

			this.switchPending = false;
			this.resolveSwitchDirection();
			this.markSwitch();
		},
		// Which way the navigation went, told by the path: a step into a folder lengthens the
		// breadcrumbs, a step back shortens them, and anything else — another disk, the recent
		// feed, a search — is not a move along a path and gets no direction of its own. The path
		// is read here rather than when the feed changed: it arrives with the content, and at the
		// moment of the click it is still the one being left.
		resolveSwitchDirection(): void
		{
			const crumbCount = this.session.breadcrumbs.length;
			// Both counts have to be inside a path: arriving at a disk from the recent feed lengthens
			// the breadcrumbs from nothing, and that is a change of feed rather than a step deeper.
			if (crumbCount > this.crumbCount && this.crumbCount > 0)
			{
				this.switchDirection = 'forward';
			}
			else if (crumbCount < this.crumbCount && crumbCount > 0)
			{
				this.switchDirection = 'back';
			}
			else
			{
				this.switchDirection = 'none';
			}

			this.crumbCount = crumbCount;
		},
		// A change of feed or of projection replaces the whole content at once; the flag
		// carries the class that fades it in, and clears itself when the fade is over.
		markSwitch(): void
		{
			if (this.switchTimer !== null)
			{
				clearTimeout(this.switchTimer);
			}

			this.switching = true;
			this.switchTimer = setTimeout(() => {
				this.switching = false;
				this.switchTimer = null;
			}, SWITCH_ANIMATION_MS);
		},
		loc(messageCode: string, replacements?: { [key: string]: string }): string
		{
			return Loc.getMessage(messageCode, replacements) ?? '';
		},
		// Restore focus in the new feed: the folder Backspace just left, else the first row,
		// else the stable point. Skip it if the user moved focus elsewhere while loading.
		focusAfterNavigation(): void
		{
			const root = this.$el as HTMLElement | undefined;
			const preferredId = this.preferredNavFocusId;
			this.preferredNavFocusId = null;
			if (!root)
			{
				return;
			}

			const active = document.activeElement;
			const focusLostOrStillInList = active === document.body || root.contains(active);
			if (!focusLostOrStillInList)
			{
				return;
			}

			this.focusRowOrStablePoint(resolveFallbackId(this.navigationIds, preferredId, 0));
		},
		// Entry point of the files group for Tab: the roving row, else the state's own
		// control (Retry, Reset), else the container itself.
		focusEntry(): boolean
		{
			if (!this.$el)
			{
				return false;
			}

			this.focusRowOrStablePoint(resolveFallbackId(this.navigationIds, this.focusObjectId, 0));

			return true;
		},
		focusRowOrStablePoint(id: CompositeItemId | null): void
		{
			if (id !== null)
			{
				this.moveFocusTo(id);

				return;
			}

			const root = this.$el as HTMLElement;
			(root.querySelector<HTMLElement>('button:not([disabled])') ?? root).focus();
		},
		// ALG-01: Retry/Reset are about to be removed by the content they requested, and Vue
		// patches the DOM only on the next flush - not synchronously here. Without this, focus
		// stays on the vanishing button until that patch runs, and the browser drops it to body
		// in the gap. Claiming the group's own root now, while the button is still focused,
		// keeps focus inside the files group for that whole gap; focusAfterNavigation still
		// moves it on to the real target once the response lands.
		claimStableFocus(): void
		{
			const root = this.$el as HTMLElement | undefined;
			if (root && root.contains(document.activeElement))
			{
				root.focus();
			}
		},
		// Scrolls the target into the virtual window and focuses it once rendered. A newer
		// request replaces the pending one before the tick runs, so the last command wins.
		moveFocusTo(id: CompositeItemId): void
		{
			const root = this.$el as HTMLElement;
			const index = this.navigationIds.indexOf(id);
			if (index < 0)
			{
				return;
			}

			// A method may be called on a bare object in a test, where no data is set up.
			const metrics = this.metrics ?? DEFAULT_METRICS;
			const rowHeight = this.viewMode === ViewMode.Table ? metrics.tableRow : metrics.listRow;
			const viewportHeight = root.clientHeight || VIRTUAL_VIEWPORT_HEIGHT;
			let nextScrollTop = root.scrollHeight - viewportHeight;
			if (id !== RETRY_ID)
			{
				const entryTop = this.viewMode === ViewMode.Table
					? index * metrics.tableRow
					: this.virtualEntries.find((entry) => entry.item?.objectId === id)?.top ?? 0;
				nextScrollTop = scrollOffsetForEntry(entryTop, rowHeight, root.scrollTop, viewportHeight);
			}
			// Tracked for both rows and Retry, so the group keeps a single roving point.
			this.focusedObjectId = id;

			root.scrollTop = Math.max(0, nextScrollTop);
			this.pendingScrollTop = root.scrollTop;
			this.virtualScrollTop = root.scrollTop;
			this.pendingFocus = { id, version: this.focusVersion };
			this.$nextTick(() => this.applyPendingFocus());
		},
		applyPendingFocus(): void
		{
			const pending = takeCurrentFocus(this.pendingFocus, this.focusVersion);
			this.pendingFocus = null;
			if (pending === null)
			{
				return;
			}

			if (focusCompositeItem(this.$el as HTMLElement, pending.id))
			{
				return;
			}

			// No row exists to focus while loading/error/empty hide them, even though
			// navigationIds still lists them - retrying the same id would loop forever.
			// Fall back to the group's stable point and arm a later restore instead.
			if (!this.rowsRendered)
			{
				this.pendingNavFocus = true;
				this.focusRowOrStablePoint(null);

				return;
			}

			this.focusRowOrStablePoint(resolveFallbackId(this.navigationIds, null, 0));
		},
		handleBackspace(event: KeyboardEvent): void
		{
			if (isTextEntryTarget(event.target))
			{
				return;
			}

			event.preventDefault();
			const leavingFolderId = openParentFolder(this.session.callbacks);
			if (leavingFolderId !== null)
			{
				this.preferredNavFocusId = leavingFolderId;
			}
		},
		// The focus lands on the eye of a row as readily as on the row itself, and the tab
		// stop has to follow it there: the row is found the same way the arrows find it.
		handleCompositeFocus(event: FocusEvent): void
		{
			const compositeId = compositeIdOfEvent(event);
			if (compositeId !== null)
			{
				this.focusedObjectId = compositeId;
			}
		},
		handleCompositeKeydown(event: KeyboardEvent): void
		{
			if (event.key === 'Backspace')
			{
				this.handleBackspace(event);

				return;
			}

			if (!VERTICAL_KEYS.includes(event.key) || isTextEntryTarget(event.target))
			{
				return;
			}

			// Only the keys that walk the list are held back while the rows underneath are being
			// replaced; Tab and everything else keep working, so the dialog stays traversable.
			if (this.overlayContentLoading)
			{
				event.preventDefault();
				event.stopPropagation();

				return;
			}

			const compositeId = compositeIdOfEvent(event);
			const currentIndex = compositeId === null ? -1 : this.navigationIds.indexOf(compositeId);
			if (currentIndex < 0)
			{
				return;
			}

			event.preventDefault();
			const root = this.$el as HTMLElement;
			// A method may be called on a bare object in a test, where no data is set up.
			const metrics = this.metrics ?? DEFAULT_METRICS;
			const rowHeight = this.viewMode === ViewMode.Table ? metrics.tableRow : metrics.listRow;
			const pageSize = Math.max(1, Math.floor((root.clientHeight || VIRTUAL_VIEWPORT_HEIGHT) / rowHeight));
			const nextIndex = resolveCompositeNavigationIndex(
				currentIndex,
				this.navigationIds.length,
				event.key as CompositeNavigationKey,
				pageSize,
			);
			this.moveFocusTo(this.navigationIds[nextIndex]);
		},
		isActive(item: PickerItem): boolean
		{
			return useSelectionStore().activeObjectId === item.objectId;
		},
		isSelected(item: PickerItem): boolean
		{
			return useSelectionStore().selectedIdSet.has(item.objectId);
		},
		handleVirtualScroll(event: Event): void
		{
			this.pendingScrollTop = (event.target as HTMLElement).scrollTop;
			if (this.scrollFrame !== null)
			{
				return;
			}

			this.scrollFrame = requestAnimationFrame(() => {
				this.virtualScrollTop = this.pendingScrollTop;
				this.scrollFrame = null;
			});
		},
		observePaginationSentinel(): void
		{
			const sentinel = this.$refs.paginationSentinel as HTMLElement | undefined;
			this.paginationObserver?.disconnect();
			if (sentinel && !this.session.navigationPending)
			{
				this.paginationObserver?.observe(sentinel);
			}
		},
		// The overlay blocks the retry buttons for the pointer; Enter must not bypass it.
		handleRetryContent(): void
		{
			if (this.overlayContentLoading)
			{
				return;
			}

			// ALG-01: this button is about to be replaced by the loaded content.
			this.pendingNavFocus = true;
			this.claimStableFocus();
			if (this.searchActive)
			{
				void searchItems(this.session.searchQuery, this.session.callbacks);

				return;
			}

			if (this.session.stageType === StageType.Folder)
			{
				void reloadCurrentFeed(this.session.callbacks);

				return;
			}

			void retryInitialStage();
		},
		handleRetryNextPage(): void
		{
			if (this.overlayContentLoading)
			{
				return;
			}

			void retryNextPage(this.session.callbacks);
		},
		handleResetFilters(): void
		{
			// ALG-01: this button is about to be replaced by the loaded content.
			this.pendingNavFocus = true;
			this.claimStableFocus();
			this.session.callbacks.resetFilters();
		},
	},
	template: `
		<div
			class="disk-picker-item-browser"
			data-disk-picker-group="files"
			:class="{
				'--navigation-blocked': overlayContentLoading,
				'--scrolled': scrolled,
				'--switching': switching,
				'--switch-forward': switching && switchDirection === 'forward',
				'--switch-back': switching && switchDirection === 'back',
				'--table': viewMode === ViewMode.Table,
			}"
			tabindex="-1"
			:aria-busy="contentLoading"
			:aria-label="announcement"
			@focusin="handleCompositeFocus"
			@keydown="handleCompositeKeydown"
			@scroll.passive="handleVirtualScroll"
		>
			<div class="disk-picker-item-browser__status" role="status" aria-live="polite">{{ announcement }}</div>

			<div
				v-if="fullContentLoading"
				class="disk-picker-item-browser__skeleton"
				data-testid="universal-disk-picker-content-loader"
				aria-hidden="true"
			>
				<ItemRowSkeleton
					v-for="(width, index) in skeletonWidths"
					:key="index"
					:width="width"
				/>
			</div>

			<EmptyState
				v-else-if="hasError"
				:icon="errorIcon"
				:title="errorTitle"
				:action-label="loc('DISK_PICKER_RETRY')"
				test-id="universal-disk-picker-error-state"
				action-test-id="universal-disk-picker-error-retry"
				@action="handleRetryContent"
			/>

			<EmptyState
				v-else-if="isEmpty"
				:icon="emptyIcon"
				:graphic="emptyGraphic"
				:title="emptyTitle"
				:action-label="emptyActionLabel"
				test-id="universal-disk-picker-empty-state"
				@action="handleResetFilters"
			/>

			<template v-else>
				<ItemTable
					v-if="viewMode === ViewMode.Table"
					:items="virtualTableWindow.items"
					:top-spacer-height="virtualTableWindow.top"
					:bottom-spacer-height="virtualTableWindow.bottom"
					:focus-object-id="tableFocusObjectId"
				/>

				<template v-else>
					<div
						class="disk-picker-item-browser__spacer"
						:style="{ height: virtualListWindow.top + 'px' }"
						aria-hidden="true"
					></div>
					<template v-for="entry in virtualListWindow.items" :key="entry.key">
						<TextXs
							v-if="entry.type === 'group'"
							class="disk-picker-item-browser__group-title"
						>{{ entry.label }}</TextXs>
						<ItemRow
							v-else
							:item="entry.item"
							:active="isActive(entry.item)"
							:selected="isSelected(entry.item)"
							:tab-index="entry.item.objectId === focusObjectId ? 0 : -1"
						/>
					</template>
					<div
						class="disk-picker-item-browser__spacer"
						:style="{ height: virtualListWindow.bottom + 'px' }"
						aria-hidden="true"
					></div>
				</template>

				<div v-if="session.paginationStalled" class="disk-picker-item-browser__more">
					<button
						type="button"
						class="disk-picker-item-browser__retry"
						:tabindex="focusObjectId === 'retry' ? 0 : -1"
						data-composite-id="retry"
						data-testid="universal-disk-picker-load-more-retry"
						@click="handleRetryNextPage"
					>
						{{ loc('DISK_PICKER_RETRY') }}
					</button>
				</div>
				<div ref="paginationSentinel" class="disk-picker-item-browser__sentinel" aria-hidden="true"></div>
				<div
					v-if="overlayContentLoading"
					class="disk-picker-item-browser__loading-overlay"
					data-testid="universal-disk-picker-content-loading-overlay"
					aria-hidden="true"
					@wheel.prevent
					@touchmove.prevent
				></div>
			</template>
		</div>
	`,
});
