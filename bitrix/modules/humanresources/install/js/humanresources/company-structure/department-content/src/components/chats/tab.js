import { EntityTypes } from 'humanresources.company-structure.utils';
import { DepartmentContentActions } from '../../actions';
import { DepartmentAPI } from '../../api';
import { SearchInput } from '../base-components/search/search-input';
import { TabList } from '../base-components/list/list';
import { EmptyState } from '../base-components/empty-state/empty-state';
import { EmptyTabAddButtons } from './empty-tab-add-buttons';
import { ChatListItem } from './list-item';
import {
	ChatsMenuOption,
	ChatsMenuLinkChat,
	ChatsMenuLinkChannel,
	ChatListDataTestIds,
	ChannelListDataTestIds,
	ChatLinkDialogDataTestIds,
	ChannelLinkDialogDataTestIds,
} from './consts';
import {
	getChatDialogEntity,
	getChannelDialogEntity,
	ChatTypeDict,
	getChatRecentTabOptions,
	ManagementDialog,
} from 'humanresources.company-structure.structure-components';
import { useChartStore } from 'humanresources.company-structure.chart-store';
import { mapState } from 'ui.vue3.pinia';
import { Type } from 'main.core';
import type { TabOptions } from 'ui.entity-selector';

import './styles/tab.css';

export const ChatsTab = {
	name: 'chatsTab',

	components: {
		SearchInput,
		TabList,
		EmptyState,
		EmptyTabAddButtons,
		ChatListItem,
		ManagementDialog,
	},

	data(): Object
	{
		return {
			chatMenuItems: [],
			channelMenuItems: [],
			isChatLinkActive: false,
			chatLinkDialogVisible: false,
			isChannelLinkActive: false,
			channelLinkDialogVisible: false,
			isLoading: false,
			searchQuery: '',
		};
	},

	created(): void
	{
		this.loadChatAction();
		this.chatMenuItems = this.getChatListMenuItems();
		this.channelMenuItems = this.getChannelListMenuItems();
	},

	methods:
	{
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		searchChatOrChannel(searchQuery: string): void
		{
			this.searchQuery = searchQuery;
		},
		async loadChatAction(force: boolean): void
		{
			const nodeId = this.focusedNode;
			const department = this.departments.get(nodeId);
			if (!department)
			{
				return;
			}

			if (!force && Type.isArray(department.chats) && Type.isArray(department.channels))
			{
				return;
			}

			if (this.isLoading)
			{
				return;
			}
			this.isLoading = true;

			this.$emit('showDetailLoader');
			const loadedChatsAndChannels = await DepartmentAPI.getChatsAndChannels(nodeId);
			DepartmentContentActions.setChatsAndChannels(
				nodeId,
				loadedChatsAndChannels.chats ?? [],
				loadedChatsAndChannels.channels ?? [],
			);
			this.$emit('hideDetailLoader');
			this.isLoading = false;
		},
		getChatListMenuItems(): Array
		{
			return [
				ChatsMenuLinkChat,
			];
		},
		getChannelListMenuItems(): Array
		{
			return [
				ChatsMenuLinkChannel,
			];
		},
		onActionMenuItemClick(actionId: string): void
		{
			if (actionId === ChatsMenuOption.linkChat)
			{
				this.chatLinkDialogVisible = true;
			}

			if (actionId === ChatsMenuOption.linkChannel)
			{
				this.channelLinkDialogVisible = true;
			}
		},
		getAddEmptyStateList(): { text: string }[]
		{
			let stateArray = [];

			if (this.isTeamEntity)
			{
				stateArray = [
					this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_TAB_ADD_EMPTY_STATE_TEAM_LIST_ITEM_1'),
					this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_TAB_ADD_EMPTY_STATE_LIST_ITEM_2'),
					this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_TAB_ADD_EMPTY_STATE_TEAM_LIST_ITEM_3'),
				];
			}
			else
			{
				stateArray = [
					this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_TAB_ADD_EMPTY_STATE_LIST_ITEM_1'),
					this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_TAB_ADD_EMPTY_STATE_LIST_ITEM_2'),
					this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_TAB_ADD_EMPTY_STATE_LIST_ITEM_3'),
				];
			}

			return stateArray.map((item) => ({ text: item }));
		},
		getChatListDataTestIds(): Object
		{
			return ChatListDataTestIds;
		},
		getChannelListDataTestIds(): Object
		{
			return ChannelListDataTestIds;
		},
		getChatLinkDialogEntities(): Array
		{
			const entity = getChatDialogEntity();
			entity.options.excludeIds = this.chats.map((item) => item.id);

			return [entity];
		},
		getChannelLinkDialogEntities(): Array
		{
			const entity = getChannelDialogEntity();
			entity.options.excludeIds = this.channels.map((item) => item.id);

			return [entity];
		},
		getChatLinkRecentTabOptions(): TabOptions
		{
			return getChatRecentTabOptions(this.teamEntity, ChatTypeDict.chat);
		},
		getChannelLinkRecentTabOptions(): TabOptions
		{
			return getChatRecentTabOptions(this.teamEntity, ChatTypeDict.channel);
		},
		async linkChats(chatsItems: Array): void
		{
			this.isChatLinkActive = true;
			const chats = (chatsItems).map((chatItem) => Number(chatItem.id.replace('chat', '')));
			const nodeId = this.focusedNode;
			const ids = { chat: chats };
			try
			{
				await DepartmentAPI.saveChats(nodeId, ids);
			}
			catch
			{ /* empty */ }
			this.isChatLinkActive = false;
			this.chatLinkDialogVisible = false;
			this.loadChatAction(true);
		},
		async linkChannel(chatsItems: Array): void
		{
			this.isChannelLinkActive = true;
			const channels = (chatsItems).map((chatItem) => Number(chatItem.id.replace('chat', '')));
			const nodeId = this.focusedNode;
			const ids = { channel: channels };
			try
			{
				await DepartmentAPI.saveChats(nodeId, ids);
			}
			catch
			{ /* empty */ }
			this.isChannelLinkActive = false;
			this.channelLinkDialogVisible = false;
			this.loadChatAction(true);
		},
		getChatLinkDialogDataTestIds(): Object
		{
			return ChatLinkDialogDataTestIds;
		},
		getChannelLinkDialogDataTestIds(): Object
		{
			return ChannelLinkDialogDataTestIds;
		},
	},

	computed:
	{
		chats(): Array
		{
			return this.departments.get(this.focusedNode)?.chats ?? [];
		},
		channels(): Array
		{
			return this.departments.get(this.focusedNode)?.channels ?? [];
		},
		filteredChats(): Array
		{
			return this.chats.filter(
				(chat) => chat.title.toLowerCase().includes(this.searchQuery.toLowerCase()),
			);
		},
		filteredChannels(): Array
		{
			return this.channels.filter(
				(channel) => channel.title.toLowerCase().includes(this.searchQuery.toLowerCase()),
			);
		},
		showAddEmptyState(): boolean
		{
			return this.chats.length === 0 && this.channels.length === 0;
		},
		showSearchEmptyState(): boolean
		{
			return this.filteredChats.length === 0 && this.filteredChannels.length === 0;
		},
		getLinkedChatIds(): Array
		{
			return (this.chats).map((chatItem) => `chat${chatItem.id}`);
		},
		getLinkedChannelIds(): Array
		{
			return (this.channels).map((channelItem) => `chat${channelItem.id}`);
		},
		isChatsLoaded(): Boolean
		{
			const department = this.departments.get(this.focusedNode);

			return Boolean(Type.isArray(department.chats) && Type.isArray(department.channels));
		},
		teamEntity(): boolean
		{
			return this.departments.get(this.focusedNode)?.entityType;
		},
		isTeamEntity(): boolean
		{
			return this.teamEntity === EntityTypes.team;
		},
		getAddEmptyStateTitle(): string
		{
			return this.isTeamEntity
				? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_TAB_ADD_EMPTY_STATE_TEAM_TITLE')
				: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_TAB_ADD_EMPTY_STATE_TITLE')
			;
		},
		getAddChatDescription(): string
		{
			return this.isTeamEntity
				? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHAT_LINK_DIALOG_TEAM_DESC')
				: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHAT_LINK_DIALOG_DESC')
			;
		},
		getAddChannelDescription(): string
		{
			return this.isTeamEntity
				? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHANNEL_LINK_DIALOG_TEAM_DESC')
				: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHANNEL_LINK_DIALOG_DESC')
			;
		},
		...mapState(useChartStore, ['focusedNode', 'departments']),
	},

	watch: {
		isChatsLoaded(isChatsLoaded): void {
			if (isChatsLoaded === false)
			{
				this.loadChatAction();
			}
		},
	},

	template: `
		<div class="hr-department-detail-content__tab-container --chat">
			<template v-if="!showAddEmptyState">
				<SearchInput
					:placeholder="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHAT_SEARCH_INPUT_PLACEHOLDER')"
					:value="searchQuery"
					@inputChange="searchChatOrChannel"
					dataTestId="hr-department-detail-content_chats-tab__chats-and-channels-search-input"
				/>
				<div
					v-if="!showSearchEmptyState"
					class="hr-department-detail-content__lists-container"
				>
					<TabList
						id='hr-department-detail-content_chats-tab__chat-list'
						:title="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHAT_LIST_TITLE')"
						:count="chats.length"
						:menuItems="chatMenuItems"
						:listItems="filteredChats"
						:emptyItemTitle="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_CHAT_LIST_ITEM_TEXT')"
						emptyItemImageClass="hr-department-detail-content__chat-empty-tab-list-item_tab-icon"
						:hideEmptyItem="searchQuery.length > 0"
						@tabListAction="onActionMenuItemClick"
						:dataTestIds="getChatListDataTestIds()"
					>
						<template v-slot="{ item }">
							<ChatListItem :chat="item"/>
						</template>
					</TabList>
					<TabList
						id='hr-department-detail-content_chats-tab__channel-list'
						:title="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHANNEL_LIST_TITLE')"
						:count="channels.length"
						:menuItems="channelMenuItems"
						:listItems="filteredChannels"
						:emptyItemTitle="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_CHANNEL_LIST_ITEM_TEXT')"
						emptyItemImageClass="hr-department-detail-content__chat-empty-tab-list-item_tab-icon"
						:hideEmptyItem="searchQuery.length > 0"
						@tabListAction="onActionMenuItemClick"
						:dataTestIds="getChannelListDataTestIds()"
					>
						<template v-slot="{ item }">
							<ChatListItem :chat="item"/>
						</template>
					</TabList>
				</div>
				<EmptyState 
					v-else
					imageClass="hr-department-detail-content__empty-tab-search_tab-icon"
					:title="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_EMPTY_SEARCHED_EMPLOYEES_TITLE')"
					:description ="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_EMPTY_SEARCHED_EMPLOYEES_SUBTITLE')"
				/>
			</template>
			<EmptyState 
				v-else
				imageClass="hr-department-detail-content__chat-empty-tab-add_tab-icon"
				:title="getAddEmptyStateTitle"
				:list="getAddEmptyStateList()"
			>
				<template v-slot:content>
					<EmptyTabAddButtons
						@emptyStateAddAction="onActionMenuItemClick"
					/>
				</template>
			</EmptyState>
			<ManagementDialog
				v-if="chatLinkDialogVisible"
				id="hr-department-detail-content-chats-tab-chat-link-dialog"
				:entities="getChatLinkDialogEntities()"
				:recentTabOptions="getChatLinkRecentTabOptions()"
				:hiddenItemsIds="getLinkedChatIds"
				:title="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHAT_LINK_DIALOG_TITLE')"
				:description="getAddChatDescription"
				:isActive="isChatLinkActive"
				@managementDialogAction="linkChats"
				@close="chatLinkDialogVisible = false"
				:dataTestIds="getChatLinkDialogDataTestIds()"
			/>
			<ManagementDialog
				v-if="channelLinkDialogVisible"
				id="hr-department-detail-content-chats-tab-channel-link-dialog"
				:entities="getChannelLinkDialogEntities()"
				:recentTabOptions="getChannelLinkRecentTabOptions()"
				:hiddenItemsIds="getLinkedChannelIds"
				:title="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHANNEL_LINK_DIALOG_TITLE')"
				:description="getAddChannelDescription"
				:isActive="isChannelLinkActive"
				@managementDialogAction="linkChannel"
				@close="channelLinkDialogVisible = false"
				:dataTestIds="getChannelLinkDialogDataTestIds()"
			/>
		</div>
	`,
};
