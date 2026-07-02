import { Event, type JsonObject } from 'main.core';

import { TaskList, TaskUnreadList } from 'im.v2.component.list.items.task';
import { CreateChatButton } from 'im.v2.component.list.container.elements.create-chat-button';
import { ChatSearchInput, RecentSearch } from 'im.v2.component.search';
import { Layout, RecentType, type LayoutType } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { EntityCreator } from 'im.v2.lib.entity-creator';
import { Logger } from 'im.v2.lib.logger';
import { type ImModelLayout } from 'im.v2.model';
import { HeaderMenu } from 'im.v2.component.list.container.elements.header-menu';

import './css/task-container.css';

// @vue/component
export const TaskListContainer = {
	name: 'TaskListContainer',
	components: { TaskList, HeaderMenu, ChatSearchInput, RecentSearch, TaskUnreadList, CreateChatButton },
	emits: ['selectChat'],
	data(): JsonObject
	{
		return {
			searchMode: false,
			unreadMode: false,
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
		onSelectChat(dialogId: string): void
		{
			this.$emit('selectChat', { layoutName: Layout.taskComments, dialogId });
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

			this.onSelectChat(dialogId);
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
		onToggleUnreadMode()
		{
			this.$store.dispatch('recent/clearUnreadCollection', { type: RecentType.taskComments });
			this.unreadMode = !this.unreadMode;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-list-container-task__container" ref="task-container">
			<div class="bx-im-list-container-task__header_container">
				<HeaderMenu
					:unreadMode="unreadMode"
					:recentSection="RecentType.taskComments"
					@toggleUnreadMode="onToggleUnreadMode"
				/>
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
				<CreateChatButton @click="onCreateClick" />
			</div>
			<div class="bx-im-list-container-task__elements_container">
				<div class="bx-im-list-container-task__elements">
					<RecentSearch
						v-show="searchMode"
						:searchMode="searchMode"
						:query="searchQuery"
						:showUsersCarousel="false"
						:recentSectionType="RecentType.taskComments"
						@loading="onLoading"
						@openItem="onOpenSearchItem"
						@closeSearch="onCloseSearch"
					/>
					<TaskList v-if="!unreadMode" @selectChat="onSelectChat" />
					<TaskUnreadList v-else @selectChat="onSelectChat" />
				</div>
			</div>
		</div>
	`,
};
