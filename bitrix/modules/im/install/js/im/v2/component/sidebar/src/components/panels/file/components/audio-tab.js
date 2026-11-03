import { Extension, type JsonObject } from 'main.core';
import { type EventEmitter } from 'main.core.events';
import { LiveAnnouncer } from 'ui.a11y';

import { Loader } from 'im.v2.component.elements.loader';
import { SidebarDetailBlock, SidebarFileGroups } from 'im.v2.const';
import { createListFocusZone } from 'im.v2.lib.a11y';
import { type ImModelChat, type ImModelSidebarFileItem } from 'im.v2.model';

import { FileMenu } from '../../../../classes/context-menu/file/file-menu';
import { File } from '../../../../classes/panels/file';
import { FileSearch } from '../../../../classes/panels/search/file-search';
import { SidebarCollectionFormatter } from '../../../../classes/sidebar-collection-formatter';
import { DateGroup } from '../../../elements/date-group/date-group';
import { DetailEmptySearchState } from '../../../elements/detail-empty-search-state/detail-empty-search-state';
import { DetailEmptyState as StartState, DetailEmptyState } from '../../../elements/detail-empty-state/detail-empty-state';
import { AudioDetailItem } from './audio-detail-item';
import { VIDEO_NOTE_ROW_CLASS, VideoNoteDetailItem } from './video-note-detail-item';

import '../css/audio-tab.css';

const DEFAULT_MIN_TOKEN_SIZE = 3;

// @vue/component
export const AudioTab = {
	name: 'AudioTab',
	components: {
		DetailEmptyState,
		AudioDetailItem,
		VideoNoteDetailItem,
		DateGroup,
		StartState,
		DetailEmptySearchState,
		Loader,
	},
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
		searchResult: {
			type: Array,
			required: false,
			default: () => [],
		},
		isSearch: {
			type: Boolean,
			required: false,
		},
		isLoadingSearch: {
			type: Boolean,
			required: false,
		},
		searchQuery: {
			type: String,
			default: '',
		},
	},
	data(): JsonObject
	{
		return {
			isLoadingFirstPage: false,
			isLoadingNextPage: false,
			minTokenSize: DEFAULT_MIN_TOKEN_SIZE,
			isActive: true,
		};
	},
	computed:
	{
		SidebarDetailBlock: () => SidebarDetailBlock,
		files(): ImModelSidebarFileItem[]
		{
			const nameGetter = this.isSearch ? 'sidebar/files/getSearchResultCollection' : 'sidebar/files/get';
			const collection = this.$store.getters[nameGetter](this.chatId, SidebarFileGroups.audio);

			// the record of the panel outlives the Disk object it points at, and both kinds of row read
			// the file itself: the shape of the row comes from there, and so does the url it plays
			return collection.filter((fileItem) => {
				return this.$store.getters['files/isInCollection']({ fileId: fileItem.fileId });
			});
		},
		formattedCollection(): Array
		{
			return this.collectionFormatter.format(this.files);
		},
		isEmptyState(): boolean
		{
			return this.formattedCollection.length === 0;
		},
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		chatId(): number
		{
			return this.dialog.chatId;
		},
		isSearchQueryMinimumSize(): boolean
		{
			return this.searchQuery.length < this.minTokenSize;
		},
		// the first page and the next one are asked for by different entry points and can be in flight
		// together: on a single flag the one finishing first takes the indicator away from the other
		isLoading(): boolean
		{
			return this.isLoadingFirstPage || this.isLoadingNextPage;
		},
	},
	watch:
	{
		// the tab lives under KeepAlive and is mounted once, so the first page skipped with the search
		// open has nothing else left to ask for it
		isSearch(isSearch: boolean)
		{
			if (isSearch)
			{
				return;
			}

			void this.loadFirstPage();
		},
	},
	created()
	{
		this.initSettings();
		this.service = new File({ dialogId: this.dialogId });
		this.serviceSearch = new FileSearch({ dialogId: this.dialogId });
		this.collectionFormatter = new SidebarCollectionFormatter();
		this.contextMenu = new FileMenu({ emitter: this.getEmitter() });
		this.focusZone = null;
	},
	mounted()
	{
		this.enableFocusZone();

		// with the search open the list comes from the results of the search, so the main collection
		// the first page would land in is not on the screen
		if (this.isSearch)
		{
			return;
		}

		void this.loadFirstPage();
	},
	// the panel keeps its tabs alive: a tab left for another one is not unmounted, so it has to give
	// up its tab stop and take it back itself
	activated()
	{
		this.isActive = true;
		this.enableFocusZone();
	},
	deactivated()
	{
		this.isActive = false;
		this.disableFocusZone();
	},
	beforeUnmount()
	{
		this.destroyFocusZone();
		this.collectionFormatter.destroy();
		this.contextMenu.destroy();
	},
	methods:
	{
		initSettings()
		{
			const settings = Extension.getSettings('im.v2.component.sidebar');
			this.minTokenSize = settings.get('minSearchTokenSize', DEFAULT_MIN_TOKEN_SIZE);
		},
		onContextMenuClick(event, target)
		{
			const item = {
				...event,
				dialogId: this.dialogId,
			};

			this.contextMenu.openMenu(item, target);
		},
		needToLoadNextPage(event: Event): boolean
		{
			const target = event.target;
			const isAtThreshold = target.scrollTop + target.clientHeight >= target.scrollHeight - target.clientHeight;
			const nameGetter = this.searchQuery.length > 0 ? 'sidebar/files/hasNextPageSearch' : 'sidebar/files/hasNextPage';
			const hasNextPage = this.$store.getters[nameGetter](this.chatId, SidebarFileGroups.audio);

			return isAtThreshold && hasNextPage;
		},
		// A list of video note rows holds nothing focusable, which leaves the scrolling container, and
		// the loading of the next page with it, unreachable by keyboard (axe: scrollable-region-focusable).
		// The filter leaves the play button of a voice row and the menu button of a row out of the
		// roving set: both are tab stops of their own.
		enableFocusZone()
		{
			const container = this.$refs.scrollContainer;
			if (!container)
			{
				return;
			}

			if (!this.focusZone)
			{
				this.focusZone = createListFocusZone(container, {
					focusableElementFilter: (element) => {
						return element.classList.contains(VIDEO_NOTE_ROW_CLASS);
					},
				});
			}

			this.focusZone.activate();
		},
		disableFocusZone()
		{
			this.focusZone?.deactivate();
		},
		destroyFocusZone()
		{
			this.disableFocusZone();
			this.focusZone = null;
		},
		// the tab asks the service for its own page: the boundary written by the initial load of the
		// sidebar was counted in another order
		async loadFirstPage()
		{
			// mounting and the closing of the search both ask for the first page: a second request would
			// go with the cursor of the one still in flight and replace the list twice
			if (this.isLoadingFirstPage)
			{
				return;
			}

			this.isLoadingFirstPage = true;
			await this.service.loadFirstPage(SidebarFileGroups.audio);
			this.isLoadingFirstPage = false;

			// the tab is opened by a click and loads its first page right away, so the answer arrives
			// while the user is waiting for it: an empty tab has to say so, not just draw itself
			if (this.isEmptyState)
			{
				LiveAnnouncer.announce(this.loc('IM_SIDEBAR_AUDIO_EMPTY_MSGVER_1'));
			}
		},
		async onScroll(event: Event)
		{
			this.contextMenu.destroy();

			if (this.isLoading || !this.needToLoadNextPage(event))
			{
				return;
			}

			this.isLoadingNextPage = true;
			if (this.isSearchQueryMinimumSize)
			{
				await this.service.loadNextPage(SidebarFileGroups.audio);
			}
			else
			{
				await this.serviceSearch.loadNextPage(SidebarFileGroups.audio, this.searchQuery);
			}
			this.isLoadingNextPage = false;
		},
		isVideoNote(fileItem: ImModelSidebarFileItem): boolean
		{
			// the shape of the preview follows the file, not the server-side subtype of the record
			return this.$store.getters['files/get'](fileItem.fileId, true).isVideoNote;
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div
			ref="scrollContainer"
			class="bx-im-sidebar-file-audio-detail__scope bx-im-sidebar-detail__container"
			data-testid="im-sidebar-audio-tab"
			@scroll="onScroll"
		>
			<div
				v-for="dateGroup in formattedCollection"
				:key="dateGroup.dateGroupTitle"
				class="bx-im-sidebar-file-audio-detail__date-group_container"
				data-testid="im-sidebar-audio-tab-date-group"
			>
				<DateGroup :dateText="dateGroup.dateGroupTitle" />
				<template v-for="file in dateGroup.items" :key="file.id">
					<VideoNoteDetailItem
						v-if="isVideoNote(file)"
						:fileItem="file"
						:dialogId="dialogId"
						:dateText="dateGroup.dateGroupTitle"
						:isTabActive="isActive"
						@contextMenuClick="onContextMenuClick"
					/>
					<AudioDetailItem
						v-else
						:fileItem="file"
						@contextMenuClick="onContextMenuClick"
					/>
				</template>
			</div>
			<template v-if="!isLoading && !isLoadingSearch">
				<template v-if="isSearch">
					<StartState
						v-if="searchQuery.length === 0"
						:title="loc('IM_SIDEBAR_SEARCH_RESULT_START_TITLE')"
						:iconType="SidebarDetailBlock.messageSearch"
						data-testid="im-sidebar-audio-tab-search-start"
					/>
					<DetailEmptySearchState
						v-else-if="isEmptyState"
						:title="loc('IM_SIDEBAR_MESSAGE_SEARCH_NOT_FOUND_EXTENDED')"
						:subTitle="loc('IM_SIDEBAR_MESSAGE_SEARCH_NOT_FOUND_DESCRIPTION_EXTENDED')"
						data-testid="im-sidebar-audio-tab-search-empty"
					/>
				</template>
				<DetailEmptyState
					v-else-if="isEmptyState"
					:title="loc('IM_SIDEBAR_AUDIO_EMPTY_MSGVER_1')"
					:iconType="SidebarDetailBlock.audio"
					data-testid="im-sidebar-audio-tab-empty"
				/>
			</template>
			<Loader
				v-if="isLoading || isLoadingSearch"
				class="bx-im-sidebar-detail__loader-container"
				data-testid="im-sidebar-audio-tab-loader"
			/>
		</div>
	`,
};
