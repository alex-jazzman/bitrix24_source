import { Loc } from 'main.core';
import 'main.polyfill.intersectionobserver';
import { BIcon, Solid } from 'ui.icon-set.api.vue';
import { defineComponent } from 'ui.vue3';
import { Avatar } from 'ui.vue3.components.avatar';
import { Text3Xs, TextSm, TextXs } from 'ui.system.typography.vue';

import { StageType, StorageType } from '../../const/picker';
import { retrySources } from '../../feature/load-initial-stage/load-initial-stage';
import { loadNextSourcePage, retrySourcePage } from '../../feature/load-source-page/load-source-page';
import { switchSource } from '../../feature/switch-source/switch-source';
import { switchToRecent } from '../../feature/switch-to-recent/switch-to-recent';
import {
	focusCompositeItem,
	resolveCompositeNavigationIndex,
	resolveFallbackId,
	scrollOffsetForEntry,
	type CompositeNavigationKey,
} from '../../lib/composite-navigation/composite-navigation';
import { DEFAULT_METRICS, readMetrics, type PickerMetrics } from '../../lib/metrics/metrics';
import { resolveAvatarInitials, resolveAvatarTint } from '../../lib/source-avatar/source-avatar';
import { useSessionStore } from '../../model/session/session';
import { useSourceStore } from '../../model/source/source';
import { type PickerSource } from '../../model/source/types';
import { SourceRowSkeleton } from '../source-row-skeleton/source-row-skeleton';

import './source-sidebar.css';

// Row and group advances are not declared here: they are read off the layout at mount, from the
// same custom properties the stylesheet lays the rows out with (see lib/metrics).
const SOURCE_VIEWPORT_HEIGHT = 640;
const SOURCE_OVERSCAN = 200;
const SOURCE_PAGINATION_ROOT_MARGIN = '120px 0px';
const SOURCE_SKELETON_WIDTHS = Object.freeze([126, 110, 122]);
// Retry is the last stop of the vertical axis, after the rows.
const RETRY_KEY = 'retry';
const VERTICAL_KEYS = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp'];

type SourceGroup = {
	titleKey: string,
	// The collapsed rail shows the short title: the full one does not fit 56px.
	shortTitleKey: string,
	sources: PickerSource[],
};

type SourceAvatarOptions = {
	title: string,
	picPath?: string,
	size: number,
};

type SourceEntry = {
	key: string,
	type: 'group' | 'source',
	titleKey: string,
	shortTitleKey: string,
	source: PickerSource | null,
	top: number,
	height: number,
};

export function sourceWindow(entries: SourceEntry[], scrollTop: number): {
	entries: SourceEntry[],
	top: number,
	bottom: number,
}
{
	const firstOffset = Math.max(0, scrollTop - SOURCE_OVERSCAN);
	const lastOffset = scrollTop + SOURCE_VIEWPORT_HEIGHT + SOURCE_OVERSCAN;
	const first = entries.findIndex((entry) => entry.top + entry.height > firstOffset);
	const start = first < 0 ? entries.length : first;
	let end = start;
	while (end < entries.length && entries[end].top < lastOffset)
	{
		end += 1;
	}
	const totalHeight = entries.length === 0
		? 0
		: entries[entries.length - 1].top + entries[entries.length - 1].height;

	return {
		entries: entries.slice(start, end),
		top: entries[start]?.top ?? totalHeight,
		bottom: Math.max(0, totalHeight - (entries[end - 1]?.top ?? 0) - (entries[end - 1]?.height ?? 0)),
	};
}

// Sources are grouped by storage type: personal, company, group and project, and collab.
export const SourceSidebar = defineComponent({
	name: 'DiskPickerSourceSidebar',
	components: {
		Avatar,
		BIcon,
		Text3Xs,
		TextSm,
		TextXs,
		SourceRowSkeleton,
	},
	setup(): Object
	{
		return { recentIcon: Solid.CLOCK, personalIcon: Solid.STORAGE };
	},
	data(): {
		focusedSourceKey: string | null,
		scrollTop: number,
		pendingScrollTop: number,
		scrollFrame: number | null,
		sourcePaginationObserver: IntersectionObserver | null,
		metrics: PickerMetrics,
		}
	{
		return {
			focusedSourceKey: null,
			scrollTop: 0,
			pendingScrollTop: 0,
			scrollFrame: null,
			sourcePaginationObserver: null,
			metrics: { ...DEFAULT_METRICS },
		};
	},
	mounted(): void
	{
		this.metrics = readMetrics(this.$el as Element);
		this.sourcePaginationObserver = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting))
				{
					void loadNextSourcePage();
				}
			},
			{
				root: this.$refs.sourceScroll as HTMLElement,
				rootMargin: SOURCE_PAGINATION_ROOT_MARGIN,
			},
		);
		this.observeSourceSentinel();
	},
	computed: {
		isRecentActive(): boolean
		{
			return useSessionStore().stageType === StageType.Recent;
		},
		error(): string | null
		{
			return useSourceStore().sourcesError;
		},
		loading(): boolean
		{
			return useSourceStore().sourcesLoading;
		},
		loadingMore(): boolean
		{
			return useSourceStore().sourcesLoadingMore;
		},
		pageError(): string | null
		{
			return useSourceStore().sourcesPageError;
		},
		hasMore(): boolean
		{
			return useSourceStore().sourcesHasMore;
		},
		skeletonWidths(): readonly number[]
		{
			return SOURCE_SKELETON_WIDTHS;
		},
		sourceCount(): number
		{
			return useSourceStore().sources.length;
		},
		activeStorageId(): number | null
		{
			return useSessionStore().storageId;
		},
		personal(): PickerSource[]
		{
			return useSourceStore().sources.filter((source) => source.storageType === StorageType.User);
		},
		groups(): SourceGroup[]
		{
			const sources = useSourceStore().sources;

			return [
				{
					titleKey: 'DISK_PICKER_SOURCE_GROUP_COMPANY',
					shortTitleKey: 'DISK_PICKER_SOURCE_GROUP_COMPANY_SHORT',
					sources: sources.filter((source) => source.storageType === StorageType.Common),
				},
				{
					titleKey: 'DISK_PICKER_SOURCE_GROUP_GROUPS',
					shortTitleKey: 'DISK_PICKER_SOURCE_GROUP_GROUPS_SHORT',
					sources: sources.filter(
						(source) => source.storageType === StorageType.Group || source.storageType === StorageType.Project,
					),
				},
				{
					titleKey: 'DISK_PICKER_SOURCE_GROUP_COLLABS',
					shortTitleKey: 'DISK_PICKER_SOURCE_GROUP_COLLABS_SHORT',
					sources: sources.filter((source) => source.storageType === StorageType.Collab),
				},
			].filter((group) => group.sources.length > 0);
		},
		sourceEntries(): SourceEntry[]
		{
			const entries: SourceEntry[] = [];
			let top = 0;
			const addSource = (source: PickerSource): void => {
				entries.push({
					key: `source-${source.storageId}`,
					type: 'source',
					titleKey: '',
					shortTitleKey: '',
					source,
					top,
					height: this.metrics.sourceRow,
				});
				top += this.metrics.sourceRow;
			};
			this.personal.forEach((source) => addSource(source));
			this.groups.forEach((group) => {
				entries.push({
					key: `group-${group.titleKey}`,
					type: 'group',
					titleKey: group.titleKey,
					shortTitleKey: group.shortTitleKey,
					source: null,
					top,
					height: this.metrics.sourceGroup,
				});
				top += this.metrics.sourceGroup;
				group.sources.forEach((source) => addSource(source));
			});

			return entries;
		},
		visibleSourceEntries(): ReturnType<typeof sourceWindow>
		{
			return sourceWindow(this.sourceEntries, Math.max(0, this.scrollTop - this.metrics.sourceRow));
		},
		sourceNavigationKeys(): string[]
		{
			const keys = ['recent', ...this.sourceEntries
				.filter((entry) => entry.type === 'source')
				.map((entry) => entry.key)];
			if (this.error || this.pageError)
			{
				keys.push(RETRY_KEY);
			}

			return keys;
		},
		sourceFocusKey(): string
		{
			if (this.focusedSourceKey && this.sourceNavigationKeys.includes(this.focusedSourceKey))
			{
				return this.focusedSourceKey;
			}

			const activeKey = this.activeStorageId === null ? 'recent' : `source-${this.activeStorageId}`;

			return this.sourceNavigationKeys.includes(activeKey) ? activeKey : 'recent';
		},
	},
	watch: {
		sourceCount(): void
		{
			this.$nextTick(() => this.revealActiveSource());
			this.$nextTick(() => this.observeSourceSentinel());
		},
		hasMore(): void
		{
			this.$nextTick(() => this.observeSourceSentinel());
		},
		loadingMore(): void
		{
			this.$nextTick(() => this.observeSourceSentinel());
		},
		pageError(): void
		{
			this.$nextTick(() => this.observeSourceSentinel());
		},
		activeStorageId(): void
		{
			this.$nextTick(() => this.revealActiveSource());
		},
		// ALG-01 when the focused row leaves the axis, e.g. Retry after a load succeeded.
		sourceNavigationKeys(keys: string[], previousKeys: string[]): void
		{
			const focusedKey = this.focusedSourceKey;
			if (focusedKey === null || keys.includes(focusedKey))
			{
				return;
			}

			const root = this.$el as HTMLElement | undefined;
			const active = document.activeElement;
			if (!root || !(active === document.body || root.contains(active)))
			{
				return;
			}

			const fallbackKey = resolveFallbackId(keys, null, previousKeys.indexOf(focusedKey));
			this.$nextTick(() => this.moveFocusTo(fallbackKey as string));
		},
	},
	methods: {
		loc(messageCode: string): string
		{
			return Loc.getMessage(messageCode) ?? '';
		},
		avatarType(source: PickerSource): string
		{
			return source.storageType === StorageType.Collab ? 'hexagon-guest' : 'round';
		},
		avatarKey(source: PickerSource): string
		{
			return `${source.storageId}:${this.avatarType(source)}:${source.avatarUrl ?? ''}`;
		},
		avatarOptions(source: PickerSource): SourceAvatarOptions
		{
			return {
				title: source.title,
				picPath: source.avatarUrl ?? undefined,
				// Mirrors --ui-size-2xl used by the avatar box in source-sidebar.css:
				// the component takes a number, so both places move together.
				size: 28,
			};
		},
		isPersonalSource(source: PickerSource): boolean
		{
			return source.storageType === StorageType.User;
		},
		// A collab keeps the design-system avatar: its green hexagon carries the meaning
		// of the storage type, and a storage with a picture of its own shows the picture.
		hasLetterAvatar(source: PickerSource): boolean
		{
			return source.avatarUrl === null && source.storageType !== StorageType.Collab;
		},
		letterAvatarClass(source: PickerSource): string
		{
			return `--tint-${resolveAvatarTint(source.storageId)}`;
		},
		sourceInitials(source: PickerSource): string
		{
			return resolveAvatarInitials(source.title);
		},
		isActive(source: PickerSource): boolean
		{
			return useSessionStore().storageId === source.storageId;
		},
		handleSelect(source: PickerSource): void
		{
			void switchSource(source, useSessionStore().callbacks);
		},
		handleSelectRecent(): void
		{
			void switchToRecent(useSessionStore().callbacks);
		},
		handleScroll(event: Event): void
		{
			this.pendingScrollTop = (event.target as HTMLElement).scrollTop;
			if (this.scrollFrame !== null)
			{
				return;
			}

			this.scrollFrame = requestAnimationFrame(() => {
				this.scrollTop = this.pendingScrollTop;
				this.scrollFrame = null;
			});
		},
		handleCompositeFocus(event: FocusEvent): void
		{
			const target = (event.target as HTMLElement).closest<HTMLElement>('[data-composite-id]');
			if (target)
			{
				this.focusedSourceKey = target.dataset.compositeId ?? null;
			}
		},
		handleCompositeKeydown(event: KeyboardEvent): void
		{
			if (!VERTICAL_KEYS.includes(event.key))
			{
				return;
			}

			const target = (event.target as HTMLElement).closest<HTMLElement>('[data-composite-id]');
			const currentKey = target?.dataset.compositeId ?? '';
			const currentIndex = this.sourceNavigationKeys.indexOf(currentKey);
			if (currentIndex < 0)
			{
				return;
			}

			event.preventDefault();
			const scroll = this.$refs.sourceScroll as HTMLElement;
			const metrics = this.metrics ?? DEFAULT_METRICS;
			const pageSize = Math.max(1, Math.floor((scroll.clientHeight || SOURCE_VIEWPORT_HEIGHT) / metrics.sourceRow));
			const nextIndex = resolveCompositeNavigationIndex(
				currentIndex,
				this.sourceNavigationKeys.length,
				event.key as CompositeNavigationKey,
				pageSize,
			);
			this.moveFocusTo(this.sourceNavigationKeys[nextIndex]);
		},
		// Entry point of the storage group for Tab: the roving row.
		focusEntry(): boolean
		{
			if (!this.$refs.sourceScroll)
			{
				return false;
			}

			this.moveFocusTo(this.sourceFocusKey);

			return true;
		},
		// Scrolls a row into the virtual window and focuses it once mounted.
		moveFocusTo(key: string): void
		{
			const scroll = this.$refs.sourceScroll as HTMLElement;
			const viewportHeight = scroll.clientHeight || SOURCE_VIEWPORT_HEIGHT;
			// A method may be called on a bare object in a test, where no data is set up.
			const metrics = this.metrics ?? DEFAULT_METRICS;
			const entry = this.sourceEntries.find((sourceEntry) => sourceEntry.key === key);
			const entryTop = key === 'recent' ? 0 : metrics.sourceRow + (entry?.top ?? 0);
			const nextScrollTop = key === RETRY_KEY
				? Math.max(0, scroll.scrollHeight - viewportHeight)
				: scrollOffsetForEntry(entryTop, metrics.sourceRow, scroll.scrollTop, viewportHeight);
			this.focusedSourceKey = key;
			scroll.scrollTop = nextScrollTop;
			this.scrollTop = nextScrollTop;
			this.pendingScrollTop = nextScrollTop;
			this.$nextTick(() => focusCompositeItem(scroll, key));
		},
		handleRetrySources(): void
		{
			void retrySources();
		},
		handleRetrySourcePage(): void
		{
			void retrySourcePage();
		},
		observeSourceSentinel(): void
		{
			const sentinel = this.$refs.sourceSentinel as HTMLElement | undefined;
			this.sourcePaginationObserver?.disconnect();
			if (sentinel)
			{
				this.sourcePaginationObserver?.observe(sentinel);
			}
		},
		revealActiveSource(): void
		{
			const storageId = useSessionStore().storageId;
			if (storageId === null)
			{
				return;
			}

			const active = this.sourceEntries.find((entry) => entry.source?.storageId === storageId);
			const scroll = this.$refs.sourceScroll as HTMLElement | undefined;
			if (!active || !scroll)
			{
				return;
			}

			const metrics = this.metrics ?? DEFAULT_METRICS;
			const activeTop = metrics.sourceRow + active.top;
			if (activeTop < scroll.scrollTop || activeTop + active.height > scroll.scrollTop + scroll.clientHeight)
			{
				scroll.scrollTop = Math.max(0, activeTop - metrics.sourceGroup);
				this.scrollTop = scroll.scrollTop;
				this.pendingScrollTop = scroll.scrollTop;
			}
		},
	},
	beforeUnmount(): void
	{
		this.sourcePaginationObserver?.disconnect();
		this.sourcePaginationObserver = null;
		if (this.scrollFrame !== null)
		{
			cancelAnimationFrame(this.scrollFrame);
			this.scrollFrame = null;
		}
	},
	template: `
		<div
			class="disk-picker-source-sidebar"
			data-disk-picker-group="storage"
			data-testid="universal-disk-picker-sidebar"
		>
			<div
				ref="sourceScroll"
				class="disk-picker-source-sidebar__scroll"
				@focusin="handleCompositeFocus"
				@keydown="handleCompositeKeydown"
				@scroll.passive="handleScroll"
			>
				<button
					type="button"
					class="disk-picker-source-sidebar__item --recent"
					:class="{ '--active': isRecentActive }"
					:title="loc('DISK_PICKER_SOURCE_RECENT')"
					:aria-current="isRecentActive ? 'page' : null"
					:tabindex="sourceFocusKey === 'recent' ? 0 : -1"
					data-composite-id="recent"
					data-testid="universal-disk-picker-source-recent"
					@click="handleSelectRecent"
				>
					<span
						class="disk-picker-source-sidebar__icon-avatar --recent --ui-context-content-light"
						aria-hidden="true"
					>
						<BIcon :name="recentIcon" :size="20"/>
					</span>
					<TextSm class="disk-picker-source-sidebar__name">{{ loc('DISK_PICKER_SOURCE_RECENT') }}</TextSm>
				</button>
				<div
					v-if="loading && sourceCount === 0"
					class="disk-picker-source-sidebar__skeleton"
					data-testid="universal-disk-picker-source-skeleton"
				>
					<SourceRowSkeleton
						v-for="(width, index) in skeletonWidths"
						:key="index"
						:width="width"
					/>
				</div>
				<div v-else-if="error" class="disk-picker-source-sidebar__error">
					<TextXs>{{ loc('DISK_PICKER_SOURCE_LOAD_FAILED') }}</TextXs>
					<button
						type="button"
						class="disk-picker-source-sidebar__retry"
						:disabled="loading"
						:tabindex="sourceFocusKey === 'retry' ? 0 : -1"
						data-composite-id="retry"
						data-testid="universal-disk-picker-sources-retry"
						@click="handleRetrySources"
					>
						<TextXs>{{ loc('DISK_PICKER_RETRY') }}</TextXs>
					</button>
				</div>
				<template v-else>
					<div
						class="disk-picker-source-sidebar__spacer"
						:style="{ height: visibleSourceEntries.top + 'px' }"
						aria-hidden="true"
					></div>
					<template v-for="entry in visibleSourceEntries.entries" :key="entry.key">
						<TextXs
							v-if="entry.type === 'group'"
							class="disk-picker-source-sidebar__group-title"
						><span class="disk-picker-source-sidebar__group-title-full">{{ loc(entry.titleKey) }}</span><span
							class="disk-picker-source-sidebar__group-title-short"
						>{{ loc(entry.shortTitleKey) }}</span></TextXs>
						<button
							v-else
							type="button"
							class="disk-picker-source-sidebar__item"
							:class="{ '--active': isActive(entry.source) }"
							:title="entry.source.title"
							:aria-current="isActive(entry.source) ? 'page' : null"
							:tabindex="sourceFocusKey === entry.key ? 0 : -1"
							:data-composite-id="entry.key"
							:data-testid="'universal-disk-picker-source-' + entry.source.storageId"
							@click="handleSelect(entry.source)"
						>
							<span
								class="disk-picker-source-sidebar__avatar --ui-context-content-light"
								:data-testid="'universal-disk-picker-source-' + entry.source.storageId + '-avatar'"
								aria-hidden="true"
							>
								<span
									v-if="isPersonalSource(entry.source)"
									class="disk-picker-source-sidebar__icon-avatar --personal"
								>
									<BIcon :name="personalIcon" :size="20"/>
								</span>
								<span
									v-else-if="hasLetterAvatar(entry.source)"
									class="disk-picker-source-sidebar__icon-avatar"
									:class="letterAvatarClass(entry.source)"
								>
									<Text3Xs
										accent
										class="disk-picker-source-sidebar__initials"
									>{{ sourceInitials(entry.source) }}</Text3Xs>
								</span>
								<Avatar
									v-else
									:key="avatarKey(entry.source)"
									:type="avatarType(entry.source)"
									:options="avatarOptions(entry.source)"
								/>
							</span>
							<TextSm class="disk-picker-source-sidebar__name">{{ entry.source.title }}</TextSm>
						</button>
					</template>
					<div
						class="disk-picker-source-sidebar__spacer"
						:style="{ height: visibleSourceEntries.bottom + 'px' }"
						aria-hidden="true"
					></div>
					<div
						v-if="loadingMore"
						class="disk-picker-source-sidebar__skeleton"
						data-testid="universal-disk-picker-source-more-skeleton"
					>
						<SourceRowSkeleton
							v-for="(width, index) in skeletonWidths"
							:key="index"
							:width="width"
						/>
					</div>
					<div v-else-if="pageError" class="disk-picker-source-sidebar__error --page">
						<button
							type="button"
							class="disk-picker-source-sidebar__retry"
							:tabindex="sourceFocusKey === 'retry' ? 0 : -1"
							data-composite-id="retry"
							data-testid="universal-disk-picker-source-page-retry"
							@click="handleRetrySourcePage"
						>
							<TextXs>{{ loc('DISK_PICKER_RETRY') }}</TextXs>
						</button>
					</div>
					<div
						v-if="hasMore && !pageError"
						ref="sourceSentinel"
						class="disk-picker-source-sidebar__sentinel"
						data-testid="universal-disk-picker-source-sentinel"
						aria-hidden="true"
					></div>
				</template>
			</div>
		</div>
	`,
});
