import { Loc } from 'main.core';
import { Outline } from 'ui.icon-set.api.vue';
import { defineComponent } from 'ui.vue3';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { HeadlineSm } from 'ui.system.typography.vue';

import { StageType, ViewMode } from '../../const/picker';
import { type ViewModeValue } from '../../const/types';
import {
	isTextEntryTarget,
	listFocusableControls,
	moveHorizontalFocus,
} from '../../lib/composite-navigation/composite-navigation';
import { useSessionStore } from '../../model/session/session';
import { useSourceStore } from '../../model/source/source';
import { Breadcrumbs } from '../breadcrumbs/breadcrumbs';

import './picker-toolbar.css';

// Single header row per the BXML layout: breadcrumbs or the current disk name on
// the left, the collapsible search control and the list/table view toggle on the
// right. The view mode is a presentation parameter and does not change the feed,
// the query or the filters. The search itself is owned by the standard filter; the
// button only toggles the shared `searchOpen` state the App reacts to.
// For the keyboard the row is one group: Tab enters at one point, Left/Right walk the
// controls without wrapping; with the search open its input, hosted by the App, is that point.
export const PickerToolbar = defineComponent({
	name: 'DiskPickerToolbar',
	components: {
		Breadcrumbs,
		HeadlineSm,
		UiButton,
	},
	setup(): Object
	{
		return { ViewMode, Outline, AirButtonStyle, ButtonSize };
	},
	data(): { lastFocused: HTMLElement | null }
	{
		return { lastFocused: null };
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
		// The two design system styles are what tell the modes apart: the accented one paints
		// the current mode, the plain one leaves the other grey. Nothing is repainted here.
		viewButtonStyle(mode: ViewModeValue): string
		{
			return this.viewMode === mode ? AirButtonStyle.PLAIN_ACCENT : AirButtonStyle.PLAIN_NO_ACCENT;
		},
		openSearch(): void
		{
			useSessionStore().setSearchOpen(true);
		},
		handleCompositeFocus(event: FocusEvent): void
		{
			this.lastFocused = event.target instanceof HTMLElement ? event.target : null;
		},
		handleCompositeKeydown(event: KeyboardEvent): void
		{
			if ((event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') || isTextEntryTarget(event.target))
			{
				return;
			}

			if (moveHorizontalFocus(this.$el as HTMLElement, event.key))
			{
				event.preventDefault();
			}
		},
		// Entry point for Tab: the control focused last if still there, else the first one.
		focusEntry(): boolean
		{
			const root = this.$el as HTMLElement | undefined;
			if (!root || this.searchOpen)
			{
				return false;
			}

			const controls = listFocusableControls(root);
			const target = this.lastFocused !== null && controls.includes(this.lastFocused)
				? this.lastFocused
				: controls[0];
			target?.focus();

			return target !== undefined;
		},
	},
	template: `
		<div
			class="disk-picker-toolbar"
			data-disk-picker-group="header"
			data-testid="universal-disk-picker-header"
			@focusin="handleCompositeFocus"
			@keydown="handleCompositeKeydown"
		>
			<div class="disk-picker-toolbar__title" :class="{ '--search-open': searchOpen }">
				<Breadcrumbs v-if="hasBreadcrumbs"/>
				<HeadlineSm
					v-else
					class="disk-picker-toolbar__title-text"
					:title="fallbackTitle"
				>{{ fallbackTitle }}</HeadlineSm>
			</div>
			<span v-if="!searchOpen" class="disk-picker-toolbar__search">
				<UiButton
					class="disk-picker-toolbar__button"
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.PLAIN_NO_ACCENT"
					:leftIcon="Outline.SEARCH"
					:aria-label="loc('DISK_PICKER_SEARCH_OPEN')"
					:dataset="{ testid: 'universal-disk-picker-search-btn' }"
					@click="openSearch"
				/>
			</span>
			<div
				v-else
				class="disk-picker-toolbar__search-slot"
				data-disk-picker-search-slot
			></div>
			<div class="disk-picker-toolbar__view-toggle" role="group" :aria-label="loc('DISK_PICKER_VIEW_TOGGLE')">
				<UiButton
					class="disk-picker-toolbar__button"
					:class="{ '--view-active': viewMode === ViewMode.List }"
					:size="ButtonSize.MEDIUM"
					:style="viewButtonStyle(ViewMode.List)"
					:leftIcon="Outline.LIST_VIEWER"
					removeRightCorners
					:aria-pressed="viewMode === ViewMode.List"
					:aria-label="loc('DISK_PICKER_VIEW_LIST')"
					:dataset="{ testid: 'universal-disk-picker-view-list' }"
					@click="setViewMode(ViewMode.List)"
				/>
				<span class="disk-picker-toolbar__view-divider" aria-hidden="true"></span>
				<UiButton
					class="disk-picker-toolbar__button"
					:class="{ '--view-active': viewMode === ViewMode.Table }"
					:size="ButtonSize.MEDIUM"
					:style="viewButtonStyle(ViewMode.Table)"
					:leftIcon="Outline.BULLETED_LIST"
					removeLeftCorners
					:aria-pressed="viewMode === ViewMode.Table"
					:aria-label="loc('DISK_PICKER_VIEW_TABLE')"
					:dataset="{ testid: 'universal-disk-picker-view-table' }"
					@click="setViewMode(ViewMode.Table)"
				/>
			</div>
		</div>
	`,
});
