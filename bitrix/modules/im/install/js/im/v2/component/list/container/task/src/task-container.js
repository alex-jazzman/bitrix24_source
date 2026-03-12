import { Event } from 'main.core';

import { TaskList } from 'im.v2.component.list.items.task';
import { Layout, RecentType } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { Logger } from 'im.v2.lib.logger';
import { EntityCreator } from 'im.v2.lib.entity-creator';
import { ChatSearchInput, RecentSectionSearch } from 'im.v2.component.search';

import { HeaderMenu } from './components/header-menu';

import './css/task-container.css';

import type { JsonObject } from 'main.core';
import type { ImModelLayout } from 'im.v2.model';
import type { LayoutType } from 'im.v2.const';

// @vue/component
export const TaskListContainer = {
	name: 'TaskListContainer',
	components: { TaskList, HeaderMenu, ChatSearchInput, RecentSectionSearch },
	emits: ['selectEntity'],
	data(): JsonObject
	{
		return {
			searchMode: false,
			searchQuery: '',
			isSearchLoading: false,
		};
	},
	computed: {
		RecentType: () => RecentType,
		layout(): ImModelLayout
		{
			return this.$store.getters['application/getLayout'];
		},
		layoutName(): LayoutType
		{
			return this.layout.name;
		},
	},
	created()
	{
		Logger.warn('List: Task container created');

		Event.bind(document, 'mousedown', this.onDocumentClick);
	},
	beforeUnmount()
	{
		Event.unbind(document, 'mousedown', this.onDocumentClick);
	},
	methods: {
		onChatClick(dialogId: string): void
		{
			this.$emit('selectEntity', { layoutName: Layout.taskComments, entityId: dialogId });
		},
		onCreateClick(): void
		{
			(new EntityCreator()).openTaskCreationForm();
		},
		onOpenSearch()
		{
			if (!this.searchMode)
			{
				Analytics.getInstance().recentSearch.onOpen(this.layoutName);
			}

			this.searchMode = true;
		},
		onCloseSearch()
		{
			this.searchMode = false;
			this.searchQuery = '';
		},
		onCloseRecentSearch()
		{
			Analytics.getInstance().recentSearch.onClose(this.layoutName);

			this.onCloseSearch();
		},
		onUpdateSearch(query)
		{
			this.searchMode = true;
			this.searchQuery = query;
		},
		onLoading(value: boolean)
		{
			this.isSearchLoading = value;
		},
		onOpenSearchItem(event: { dialogId: string })
		{
			const { dialogId } = event;

			this.onChatClick(dialogId);
		},
		onDocumentClick(event: MouseEvent)
		{
			const clickOnRecentContainer = event.composedPath().includes(this.$refs['task-container']);
			if (this.searchMode && !clickOnRecentContainer)
			{
				this.onCloseSearch();
				Analytics.getInstance().recentSearch.onClose(this.layoutName);
			}
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-list-container-task__container" ref="task-container">
			<div class="bx-im-list-container-task__header_container">
				<HeaderMenu />
				<div class="bx-im-list-container-task__search-input_container">
					<ChatSearchInput
						:searchMode="searchMode"
						:isLoading="searchMode && isSearchLoading"
						:placeholder="loc('IM_LIST_CONTAINER_TASK_SEARCH_INPUT_PLACEHOLDER')"
						@openSearch="onOpenSearch"
						@closeSearch="onCloseRecentSearch"
						@updateSearch="onUpdateSearch"
					/>
				</div>
				<div @click="onCreateClick" class="bx-im-list-container-task__header_create-task"></div>
			</div>
			<div class="bx-im-list-container-task__elements_container">
				<div class="bx-im-list-container-task__elements">
					<RecentSectionSearch
						v-show="searchMode"
						:searchMode="searchMode"
						:query="searchQuery"
						:showUsersCarousel="false"
						:recentSection="RecentType.taskComments"
						@loading="onLoading"
						@openItem="onOpenSearchItem"
						@closeSearch="onCloseSearch"
					/>
					<TaskList @chatClick="onChatClick" />
				</div>
			</div>
		</div>
	`,
};
