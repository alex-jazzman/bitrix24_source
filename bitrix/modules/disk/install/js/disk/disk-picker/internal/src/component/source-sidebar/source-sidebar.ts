import { Loc } from 'main.core';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { defineComponent } from 'ui.vue3';
import { Avatar } from 'ui.vue3.components.avatar';
import { TextSm, TextXs } from 'ui.system.typography.vue';

import { StageType, StorageType } from '../../const/picker';
import { retrySources } from '../../feature/load-initial-stage/load-initial-stage';
import { switchSource } from '../../feature/switch-source/switch-source';
import { switchToRecent } from '../../feature/switch-to-recent/switch-to-recent';
import {
	focusCompositeItem,
	resolveCompositeNavigationIndex,
	scrollOffsetForEntry,
	type CompositeNavigationKey,
} from '../../lib/composite-navigation/composite-navigation';
import { useSessionStore } from '../../model/session/session';
import { useSourceStore } from '../../model/source/source';
import { type PickerSource } from '../../model/source/types';

import './source-sidebar.css';

const SOURCE_ROW_HEIGHT = 40;
const SOURCE_GROUP_HEIGHT = 28;
const SOURCE_VIEWPORT_HEIGHT = 640;
const SOURCE_OVERSCAN = 200;

type SourceGroup = {
	titleKey: string,
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
		TextSm,
		TextXs,
	},
	setup(): Object
	{
		return { recentIcon: Outline.RECENT_ITEMS };
	},
	data(): {
		focusHandled: boolean,
		focusedSourceKey: string | null,
		scrollTop: number,
		pendingScrollTop: number,
		scrollFrame: number | null,
		}
	{
		return {
			focusHandled: false,
			focusedSourceKey: null,
			scrollTop: 0,
			pendingScrollTop: 0,
			scrollFrame: null,
		};
	},
	mounted(): void
	{
		this.maybeFocusFirstStorage();
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
					sources: sources.filter((source) => source.storageType === StorageType.Common),
				},
				{
					titleKey: 'DISK_PICKER_SOURCE_GROUP_GROUPS',
					sources: sources.filter(
						(source) => source.storageType === StorageType.Group || source.storageType === StorageType.Project,
					),
				},
				{
					titleKey: 'DISK_PICKER_SOURCE_GROUP_COLLABS',
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
					source,
					top,
					height: SOURCE_ROW_HEIGHT,
				});
				top += SOURCE_ROW_HEIGHT;
			};
			this.personal.forEach((source) => addSource(source));
			this.groups.forEach((group) => {
				entries.push({
					key: `group-${group.titleKey}`,
					type: 'group',
					titleKey: group.titleKey,
					source: null,
					top,
					height: SOURCE_GROUP_HEIGHT,
				});
				top += SOURCE_GROUP_HEIGHT;
				group.sources.forEach((source) => addSource(source));
			});

			return entries;
		},
		visibleSourceEntries(): ReturnType<typeof sourceWindow>
		{
			return sourceWindow(this.sourceEntries, Math.max(0, this.scrollTop - SOURCE_ROW_HEIGHT));
		},
		sourceNavigationKeys(): string[]
		{
			return ['recent', ...this.sourceEntries
				.filter((entry) => entry.type === 'source')
				.map((entry) => entry.key)];
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
			this.maybeFocusFirstStorage();
			this.$nextTick(() => this.revealActiveSource());
		},
		activeStorageId(): void
		{
			this.$nextTick(() => this.revealActiveSource());
		},
	},
	methods: {
		loc(messageCode: string): string
		{
			return Loc.getMessage(messageCode) ?? '';
		},
		// Once sources arrive, focus the first storage button, but only if the user or
		// onOpen has not already moved focus off the popup container. An empty or failed
		// list keeps the container focused.
		maybeFocusFirstStorage(): void
		{
			if (this.focusHandled || this.sourceCount === 0)
			{
				return;
			}

			this.$nextTick(() => {
				const container = (this.$el as HTMLElement).closest('.disk-picker');
				const active = document.activeElement;
				const focusOnContainer = active === null || active === document.body || active === container;
				if (!focusOnContainer)
				{
					// Focus already moved intentionally; do not steal it, but stop trying.
					this.focusHandled = true;

					return;
				}

				// Recent is the first item but focus must land on the first storage.
				const first = (this.$el as HTMLElement)
					.querySelector<HTMLElement>('.disk-picker-source-sidebar__item:not(.--recent)');
				if (first)
				{
					this.focusedSourceKey = first.dataset.compositeId ?? null;
					first.focus();
					this.focusHandled = true;
				}
			});
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
				size: 24,
			};
		},
		isPersonalSource(source: PickerSource): boolean
		{
			return source.storageType === StorageType.User;
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
			const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp'];
			if (!keys.includes(event.key))
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
			const pageSize = Math.max(1, Math.floor((scroll.clientHeight || SOURCE_VIEWPORT_HEIGHT) / SOURCE_ROW_HEIGHT));
			const nextIndex = resolveCompositeNavigationIndex(
				currentIndex,
				this.sourceNavigationKeys.length,
				event.key as CompositeNavigationKey,
				pageSize,
			);
			const key = this.sourceNavigationKeys[nextIndex];
			const entry = this.sourceEntries.find((sourceEntry) => sourceEntry.key === key);
			const entryTop = key === 'recent' ? 0 : SOURCE_ROW_HEIGHT + (entry?.top ?? 0);
			const nextScrollTop = scrollOffsetForEntry(
				entryTop,
				SOURCE_ROW_HEIGHT,
				scroll.scrollTop,
				scroll.clientHeight || SOURCE_VIEWPORT_HEIGHT,
			);
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

			const activeTop = SOURCE_ROW_HEIGHT + active.top;
			if (activeTop < scroll.scrollTop || activeTop + active.height > scroll.scrollTop + scroll.clientHeight)
			{
				scroll.scrollTop = Math.max(0, activeTop - SOURCE_GROUP_HEIGHT);
				this.scrollTop = scroll.scrollTop;
				this.pendingScrollTop = scroll.scrollTop;
			}
		},
	},
	beforeUnmount(): void
	{
		if (this.scrollFrame !== null)
		{
			cancelAnimationFrame(this.scrollFrame);
			this.scrollFrame = null;
		}
	},
	template: `
		<div class="disk-picker-source-sidebar" data-testid="universal-disk-picker-sidebar">
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
					:aria-current="isRecentActive ? 'page' : null"
					:tabindex="sourceFocusKey === 'recent' ? 0 : -1"
					data-composite-id="recent"
					data-testid="universal-disk-picker-source-recent"
					@click="handleSelectRecent"
				>
					<BIcon :name="recentIcon" :size="24"/>
					<TextSm class="disk-picker-source-sidebar__name">{{ loc('DISK_PICKER_SOURCE_RECENT') }}</TextSm>
				</button>
				<div v-if="error" class="disk-picker-source-sidebar__error">
					<TextXs>{{ loc('DISK_PICKER_SOURCE_LOAD_FAILED') }}</TextXs>
					<button
						type="button"
						class="disk-picker-source-sidebar__retry"
						:disabled="loading"
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
						>{{ loc(entry.titleKey) }}</TextXs>
						<button
							v-else
							type="button"
							class="disk-picker-source-sidebar__item"
							:class="{ '--active': isActive(entry.source) }"
							:aria-current="isActive(entry.source) ? 'page' : null"
							:tabindex="sourceFocusKey === entry.key ? 0 : -1"
							:data-composite-id="entry.key"
							:data-testid="'universal-disk-picker-source-' + entry.source.storageId"
							@click="handleSelect(entry.source)"
						>
							<span
								class="disk-picker-source-sidebar__avatar"
								:data-testid="'universal-disk-picker-source-' + entry.source.storageId + '-avatar'"
								aria-hidden="true"
							>
								<span
									v-if="isPersonalSource(entry.source)"
									class="disk-picker-source-sidebar__personal-avatar"
								></span>
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
				</template>
			</div>
		</div>
	`,
});
