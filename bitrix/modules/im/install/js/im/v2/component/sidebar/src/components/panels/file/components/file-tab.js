import { Extension } from 'main.core';

import { Loader } from 'im.v2.component.elements.loader';
import { SidebarDetailBlock, SidebarFileGroups, FileViewerContext } from 'im.v2.const';

import { File } from '../../../../classes/panels/file';
import { FileDetailItem } from './file-detail-item';
import { DateGroup } from '../../../elements/date-group/date-group';
import { FileMenu } from '../../../../classes/context-menu/file/file-menu';
import { FileSearch } from '../../../../classes/panels/search/file-search';
import { SidebarCollectionFormatter } from '../../../../classes/sidebar-collection-formatter';
import { DetailEmptySearchState } from '../../../elements/detail-empty-search-state/detail-empty-search-state';
import { DetailEmptyState as StartState, DetailEmptyState } from '../../../elements/detail-empty-state/detail-empty-state';

import '../css/file-tab.css';

import type { JsonObject } from 'main.core';
import type { ImModelChat, ImModelSidebarFileItem } from 'im.v2.model';

const DEFAULT_MIN_TOKEN_SIZE = 3;

// @vue/component
export const FileTab = {
	name: 'FileTab',
	components: { DateGroup, FileDetailItem, DetailEmptyState, StartState, DetailEmptySearchState, Loader },
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
			isLoading: false,
			minTokenSize: DEFAULT_MIN_TOKEN_SIZE,
		};
	},
	computed:
	{
		SidebarDetailBlock: () => SidebarDetailBlock,
		FileViewerContext: () => FileViewerContext,
		files(): ImModelSidebarFileItem[]
		{
			if (this.isSearch)
			{
				return this.$store.getters['sidebar/files/getSearchResultCollection'](this.chatId, SidebarFileGroups.file);
			}

			return this.$store.getters['sidebar/files/get'](this.chatId, SidebarFileGroups.file);
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
	},
	created()
	{
		this.initSettings();
		this.service = new File({ dialogId: this.dialogId });
		this.serviceSearch = new FileSearch({ dialogId: this.dialogId });
		this.collectionFormatter = new SidebarCollectionFormatter();
		this.contextMenu = new FileMenu();
	},
	beforeUnmount()
	{
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
			const hasNextPage = this.$store.getters[nameGetter](this.chatId, SidebarFileGroups.file);

			return isAtThreshold && hasNextPage;
		},
		async onScroll(event: Event)
		{
			this.contextMenu.destroy();

			if (this.isLoading || !this.needToLoadNextPage(event))
			{
				return;
			}

			this.isLoading = true;
			if (this.isSearchQueryMinimumSize)
			{
				await this.service.loadNextPage(SidebarFileGroups.file);
			}
			else
			{
				await this.serviceSearch.loadNextPage(SidebarFileGroups.file, this.searchQuery);
			}
			this.isLoading = false;
		},
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<div class="bx-im-sidebar-file-detail__scope bx-im-sidebar-detail__container" @scroll="onScroll">
			<div v-for="dateGroup in formattedCollection" class="bx-im-sidebar-file-detail__date-group_container">
				<DateGroup :dateText="dateGroup.dateGroupTitle" />
				<FileDetailItem
					v-for="file in dateGroup.items"
					:fileItem="file"
					:searchQuery="searchQuery"
					:contextDialogId="dialogId"
					:viewerContext="FileViewerContext.sidebarTabFiles"
					@contextMenuClick="onContextMenuClick"
				/>
			</div>
			<template v-if="!isLoading && !isLoadingSearch">
				<template v-if="isSearch">
					<StartState
						v-if="searchQuery.length === 0"
						:title="loc('IM_SIDEBAR_SEARCH_RESULT_START_TITLE')"
						:iconType="SidebarDetailBlock.messageSearch"
					/>
					<DetailEmptySearchState
						v-else-if="isEmptyState"
						:title="loc('IM_SIDEBAR_MESSAGE_SEARCH_NOT_FOUND_EXTENDED')"
						:subTitle="loc('IM_SIDEBAR_MESSAGE_SEARCH_NOT_FOUND_DESCRIPTION_EXTENDED')"
					/>
				</template>
				<DetailEmptyState
					v-else-if="isEmptyState"
					:title="loc('IM_SIDEBAR_FILES_EMPTY')"
					:iconType="SidebarDetailBlock.document"
				/>
			</template>
			<Loader v-if="isLoading || isLoadingSearch" class="bx-im-sidebar-detail__loader-container" />
		</div>
	`,
};
