import { Loc } from 'main.core';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { defineComponent } from 'ui.vue3';
import { TextSm } from 'ui.system.typography.vue';

import { StageType, ViewMode } from '../../const/picker';
import { type ViewModeValue } from '../../const/types';
import { useSessionStore } from '../../model/session/session';
import { useSourceStore } from '../../model/source/source';
import { Breadcrumbs } from '../breadcrumbs/breadcrumbs';

import './picker-toolbar.css';

// Single header row per the BXML layout: breadcrumbs or the current disk name on
// the left, the collapsible search control and the list/table view toggle on the
// right. The view mode is a presentation parameter and does not change the feed,
// the query or the filters. The search itself is owned by the standard filter; the
// button only toggles the shared `searchOpen` state the App reacts to.
export const PickerToolbar = defineComponent({
	name: 'DiskPickerToolbar',
	components: {
		Breadcrumbs,
		BIcon,
		TextSm,
	},
	setup(): Object
	{
		return { ViewMode, Outline };
	},
	computed: {
		viewMode(): ViewModeValue
		{
			return useSessionStore().viewMode;
		},
		searchOpen(): boolean
		{
			return useSessionStore().searchOpen;
		},
		hasBreadcrumbs(): boolean
		{
			return useSessionStore().breadcrumbs.length > 0;
		},
		// Fallback title shown when there are no breadcrumbs: the recent-feed label for
		// the recent feed, otherwise the name of the current disk source.
		fallbackTitle(): string
		{
			const session = useSessionStore();
			if (session.stageType === StageType.Recent)
			{
				return this.loc('DISK_PICKER_SOURCE_RECENT');
			}

			const source = useSourceStore().sources.find((entry) => entry.storageId === session.storageId);

			return source?.title ?? '';
		},
	},
	methods: {
		loc(messageCode: string): string
		{
			return Loc.getMessage(messageCode) ?? '';
		},
		setViewMode(mode: ViewModeValue): void
		{
			useSessionStore().setViewMode(mode);
		},
		openSearch(): void
		{
			useSessionStore().setSearchOpen(true);
		},
	},
	template: `
		<div class="disk-picker-toolbar" data-testid="universal-disk-picker-header">
			<div class="disk-picker-toolbar__title" :class="{ '--search-open': searchOpen }">
				<Breadcrumbs v-if="hasBreadcrumbs"/>
				<TextSm v-else class="disk-picker-toolbar__title-text" :title="fallbackTitle">{{ fallbackTitle }}</TextSm>
			</div>
			<button
				v-if="!searchOpen"
				type="button"
				class="disk-picker-toolbar__search-button"
				:aria-label="loc('DISK_PICKER_SEARCH_OPEN')"
				data-testid="universal-disk-picker-search-btn"
				@click="openSearch"
			>
				<BIcon :name="Outline.SEARCH" :size="20"/>
			</button>
			<div
				v-else
				class="disk-picker-toolbar__search-slot"
				data-disk-picker-search-slot
			></div>
			<div class="disk-picker-toolbar__view-toggle" role="group" :aria-label="loc('DISK_PICKER_VIEW_TOGGLE')">
				<button
					type="button"
					class="disk-picker-toolbar__view-button"
					:class="{ '--active': viewMode === ViewMode.List }"
					:aria-pressed="viewMode === ViewMode.List"
					:aria-label="loc('DISK_PICKER_VIEW_LIST')"
					data-testid="universal-disk-picker-view-list"
					@click="setViewMode(ViewMode.List)"
				>
					<BIcon :name="Outline.LIST_VIEWER" :size="22"/>
				</button>
				<button
					type="button"
					class="disk-picker-toolbar__view-button"
					:class="{ '--active': viewMode === ViewMode.Table }"
					:aria-pressed="viewMode === ViewMode.Table"
					:aria-label="loc('DISK_PICKER_VIEW_TABLE')"
					data-testid="universal-disk-picker-view-table"
					@click="setViewMode(ViewMode.Table)"
				>
					<BIcon :name="Outline.BULLETED_LIST" :size="22"/>
				</button>
			</div>
		</div>
	`,
});
