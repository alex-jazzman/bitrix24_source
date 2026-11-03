import { Event, Text, type JsonObject } from 'main.core';
import { computed } from 'ui.vue3';

import { TaskList, TaskUnreadList } from 'im.v2.component.list.items.task';
import { CreateChatButton } from 'im.v2.component.list.container.elements.create-chat-button';
import { FilterRow, FilterMode, type FilterModeItem } from 'im.v2.component.list.container.elements.filter-row';
import { ChatSearchInput, RecentSearch } from 'im.v2.component.search';
import { Layout, RecentType, type LayoutType, ParentChatScope } from 'im.v2.const';
import { Analytics, AnalyticsSection } from 'im.v2.lib.analytics';
import { EntityCreator } from 'im.v2.lib.entity-creator';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { Logger } from 'im.v2.lib.logger';
import { type ImModelLayout } from 'im.v2.model';
import { HeaderMenu } from 'im.v2.component.list.container.elements.header-menu';

import './css/task-container.css';

// @vue/component
export const TaskListContainer = {
	name: 'TaskListContainer',
	components: {
		TaskList,
		HeaderMenu,
		ChatSearchInput,
		FilterRow,
		RecentSearch,
		TaskUnreadList,
		CreateChatButton,
	},
	provide(): { avatarsOnly: boolean }
	{
		return {
			avatarsOnly: computed(() => this.avatarsOnly),
		};
	},
	props: {
		avatarsOnly: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['selectChat'],
	data(): JsonObject
	{
		return {
			searchAreaId: Text.getRandom(),
			searchMode: false,
			unreadMode: false,
			searchQuery: '',
			isSearchLoading: false,
		};
	},
	computed: {
		RecentType: () => RecentType,
		ParentChatScope: () => ParentChatScope,
		layout(): ImModelLayout
		{
			return this.$store.getters['application/getLayout'];
		},
		layoutName(): LayoutType
		{
			return this.layout.name;
		},
		isShellNavigationAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isChatShellNavigationWebAvailable);
		},
		filterMode(): FilterModeItem
		{
			return this.unreadMode ? FilterMode.unread : FilterMode.all;
		},
		unreadCounter(): number
		{
			return this.$store.getters['counters/getTotalTaskCounter'];
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
			void (new EntityCreator()).openTaskCreationFormInTaskChats();
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
			this.unreadMode = !this.unreadMode;
		},
		onChangeFilterMode(mode: FilterModeItem)
		{
			this.unreadMode = mode === FilterMode.unread;
			if (this.unreadMode)
			{
				Analytics.getInstance().recentHeaderMenu.onOpenTasksUnreadMode(AnalyticsSection.filterRow);
			}
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-list-container-task__container" data-testid="im-list-task" ref="task-container">
			<div class="bx-im-list-container-task__header_container" :class="{ '--with-filter-row': isShellNavigationAvailable }">
				<HeaderMenu
					v-if="!isShellNavigationAvailable"
					:unreadMode="unreadMode"
					:recentSection="RecentType.taskComments"
					@toggleUnreadMode="onToggleUnreadMode"
				/>
				<div class="bx-im-list-container-task__search-input_container">
					<ChatSearchInput
						:searchMode="searchMode"
						:isLoading="searchMode && isSearchLoading"
						:placeholder="loc('IM_LIST_CONTAINER_TASK_SEARCH_INPUT_PLACEHOLDER')"
						:activateOnEnter="true"
						:searchAreaId="searchAreaId"
						@openSearch="onOpenSearch"
						@closeSearch="onCloseRecentSearch"
						@updateSearch="onUpdateSearch"
					/>
				</div>
				<CreateChatButton @click="onCreateClick" />
			</div>
			<FilterRow
				v-if="isShellNavigationAvailable"
				:mode="filterMode"
				:counter="unreadCounter"
				:readAllSection="RecentType.taskComments"
				@changeMode="onChangeFilterMode"
			/>
			<div class="bx-im-list-container-task__elements_container">
				<div class="bx-im-list-container-task__elements">
					<RecentSearch
						v-show="searchMode"
						:searchMode="searchMode"
						:query="searchQuery"
						:parentChatId="ParentChatScope.all"
						:showUsersCarousel="false"
						:recentSectionType="RecentType.taskComments"
						:withKeyboardNavigation="true"
						:searchAreaId="searchAreaId"
						@loading="onLoading"
						@openItem="onOpenSearchItem"
						@closeSearch="onCloseSearch"
					/>
					<TaskList v-show="!searchMode && !unreadMode" @selectChat="onSelectChat" />
					<TaskUnreadList v-if="unreadMode" @selectChat="onSelectChat" />
				</div>
			</div>
		</div>
	`,
};
