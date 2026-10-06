import { Loc } from 'main.core';
import 'main.polyfill.intersectionobserver';
import { Outline } from 'ui.icon-set.api.vue';
import { defineComponent } from 'ui.vue3';
import { TextXs } from 'ui.system.typography.vue';

import { ObjectTypeFilter, SearchQueryLength, StageType, ViewMode } from '../../const/picker';
import { type ViewModeValue } from '../../const/types';
import { loadNextPage, retryNextPage } from '../../feature/load-next-page/load-next-page';
import { retryInitialStage } from '../../feature/load-initial-stage/load-initial-stage';
import { reloadCurrentFeed } from '../../feature/open-folder/open-folder';
import { searchItems } from '../../feature/search-items/search-items';
import { compareDateGroups, resolveDateGroup, type DateGroup } from '../../lib/date-group/date-group';
import { errorMessageCode } from '../../lib/error-message/error-message';
import {
	focusCompositeItem,
	resolveCompositeNavigationIndex,
	scrollOffsetForEntry,
	type CompositeNavigationKey,
} from '../../lib/composite-navigation/composite-navigation';
import { useItemStore } from '../../model/item/item';
import { type PickerItem } from '../../model/item/types';
import { useSelectionStore } from '../../model/selection/selection';
import { useSessionStore } from '../../model/session/session';
import { EmptyState } from '../empty-state/empty-state';
import { ItemRow } from '../item-row/item-row';
import { ItemTable } from '../item-table/item-table';

import './item-browser.css';

const LIST_ROW_HEIGHT = 44;
const GROUP_TITLE_HEIGHT = 28;
const TABLE_ROW_HEIGHT = 45;
const VIRTUAL_VIEWPORT_HEIGHT = 640;
const VIRTUAL_OVERSCAN = 440;
const PAGINATION_ROOT_MARGIN = '120px 0px';

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
		EmptyState,
		ItemRow,
		ItemTable,
		TextXs,
	},
	setup(): Object
	{
		return { ViewMode };
	},
	data(): {
		pendingNavFocus: boolean,
		focusedObjectId: number | null,
		virtualScrollTop: number,
		paginationObserver: IntersectionObserver | null,
		scrollFrame: number | null,
		pendingScrollTop: number,
		}
	{
		return {
			pendingNavFocus: false,
			focusedObjectId: null,
			virtualScrollTop: 0,
			paginationObserver: null,
			scrollFrame: null,
			pendingScrollTop: 0,
		};
	},
	computed: {
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
		focusObjectId(): number | null
		{
			const focusedExists = this.items.some((item) => item.objectId === this.focusedObjectId);
			if (focusedExists)
			{
				return this.focusedObjectId;
			}

			const activeObjectId = useSelectionStore().activeObjectId;

			return this.items.some((item) => item.objectId === activeObjectId)
				? activeObjectId
				: this.items[0]?.objectId ?? null;
		},
		contentLoading(): boolean
		{
			return this.session.contentLoading;
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
						height: GROUP_TITLE_HEIGHT,
					});
					top += GROUP_TITLE_HEIGHT;
				}
				group.items.forEach((item) => {
					entries.push({
						key: `item-${item.objectId}`,
						type: 'item',
						label: '',
						item,
						top,
						height: LIST_ROW_HEIGHT,
					});
					top += LIST_ROW_HEIGHT;
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
			const start = Math.max(0, Math.floor(
				(this.virtualScrollTop - VIRTUAL_OVERSCAN) / TABLE_ROW_HEIGHT,
			));
			const visibleCount = Math.ceil(
				(VIRTUAL_VIEWPORT_HEIGHT + 2 * VIRTUAL_OVERSCAN) / TABLE_ROW_HEIGHT,
			);
			const end = Math.min(this.items.length, start + visibleCount);

			return {
				items: this.items.slice(start, end),
				top: start * TABLE_ROW_HEIGHT,
				bottom: (this.items.length - end) * TABLE_ROW_HEIGHT,
			};
		},
		announcement(): string
		{
			if (this.session.contentLoading)
			{
				return '';
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
			this.virtualScrollTop = 0;
			if (root && root.contains(document.activeElement))
			{
				this.pendingNavFocus = true;
			}

			if (root)
			{
				root.scrollTop = 0;
			}
		},
		viewMode(): void
		{
			this.virtualScrollTop = 0;
			this.$nextTick(() => this.observePaginationSentinel());
		},
		'items.length': function(): void
		{
			this.$nextTick(() => this.observePaginationSentinel());
		},
		contentLoading(loading: boolean): void
		{
			if (!loading)
			{
				this.$nextTick(() => this.observePaginationSentinel());
			}

			if (!loading && this.pendingNavFocus)
			{
				this.pendingNavFocus = false;
				this.$nextTick(() => this.focusAfterNavigation());
			}
		},
	},
	mounted(): void
	{
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
	},
	methods: {
		loc(messageCode: string, replacements?: { [key: string]: string }): string
		{
			return Loc.getMessage(messageCode, replacements) ?? '';
		},
		// Focus the first row of the new feed, or the list container itself for an empty
		// feed, so keyboard focus is never lost after a navigation. Skip it if the user
		// moved focus elsewhere while the feed was loading.
		focusAfterNavigation(): void
		{
			const root = this.$el as HTMLElement | undefined;
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

			const first = root.querySelector<HTMLElement>('[data-composite-id]');
			(first ?? root).focus();
		},
		handleCompositeFocus(event: FocusEvent): void
		{
			const target = (event.target as HTMLElement).closest<HTMLElement>('[data-composite-id]');
			if (target)
			{
				this.focusedObjectId = Number(target.dataset.compositeId);
			}
		},
		handleCompositeKeydown(event: KeyboardEvent): void
		{
			const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp'];
			if (!keys.includes(event.key))
			{
				return;
			}

			const target = (event.target as HTMLElement).closest<HTMLElement>('[data-composite-id]');
			const currentIndex = this.items.findIndex((item) => item.objectId === Number(target?.dataset.compositeId));
			if (currentIndex < 0)
			{
				return;
			}

			event.preventDefault();
			const root = this.$el as HTMLElement;
			const rowHeight = this.viewMode === ViewMode.Table ? TABLE_ROW_HEIGHT : LIST_ROW_HEIGHT;
			const pageSize = Math.max(1, Math.floor((root.clientHeight || VIRTUAL_VIEWPORT_HEIGHT) / rowHeight));
			const nextIndex = resolveCompositeNavigationIndex(
				currentIndex,
				this.items.length,
				event.key as CompositeNavigationKey,
				pageSize,
			);
			const item = this.items[nextIndex];
			if (!item)
			{
				return;
			}

			const entryTop = this.viewMode === ViewMode.Table
				? nextIndex * TABLE_ROW_HEIGHT
				: this.virtualEntries.find((entry) => entry.item?.objectId === item.objectId)?.top ?? 0;
			const nextScrollTop = scrollOffsetForEntry(
				entryTop,
				rowHeight,
				root.scrollTop,
				root.clientHeight || VIRTUAL_VIEWPORT_HEIGHT,
			);
			this.focusedObjectId = item.objectId;
			root.scrollTop = nextScrollTop;
			this.pendingScrollTop = nextScrollTop;
			this.virtualScrollTop = nextScrollTop;
			this.$nextTick(() => focusCompositeItem(root, item.objectId));
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
			if (sentinel)
			{
				this.paginationObserver?.observe(sentinel);
			}
		},
		handleRetryContent(): void
		{
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
			void retryNextPage(this.session.callbacks);
		},
		handleResetFilters(): void
		{
			this.session.callbacks.resetFilters();
		},
	},
	template: `
		<div
			class="disk-picker-item-browser"
			tabindex="-1"
			@focusin="handleCompositeFocus"
			@keydown="handleCompositeKeydown"
			@scroll.passive="handleVirtualScroll"
		>
			<div class="disk-picker-item-browser__status" role="status" aria-live="polite">{{ announcement }}</div>

			<EmptyState
				v-if="hasError"
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
					:focus-object-id="focusObjectId"
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
						data-testid="universal-disk-picker-load-more-retry"
						@click="handleRetryNextPage"
					>
						{{ loc('DISK_PICKER_RETRY') }}
					</button>
				</div>
				<div ref="paginationSentinel" class="disk-picker-item-browser__sentinel" aria-hidden="true"></div>
			</template>
		</div>
	`,
});
