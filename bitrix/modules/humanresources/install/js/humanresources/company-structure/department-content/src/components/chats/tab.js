import {
	PermissionActions,
	PermissionChecker,
	PermissionLevels,
} from 'humanresources.company-structure.permission-checker';
import { EntityTypes, type ChatListResponse } from 'humanresources.company-structure.utils';
import { DepartmentContentActions } from '../../actions';
import { DepartmentAPI } from '../../api';
import { SearchInput } from '../base-components/search/search-input';
import { TabList } from '../base-components/list/list';
import { EmptyState } from '../base-components/empty-state/empty-state';
import { ChildrenModeSelector } from './children-mode-selector';
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
	CommunicationsTypeDict,
	getCommunicationsRecentTabOptions,
	ManagementDialog,
	type ManagementDialogDataTestIds,
} from 'humanresources.company-structure.structure-components';
import { useChartStore } from 'humanresources.company-structure.chart-store';
import { mapState } from 'ui.vue3.pinia';
import { Loc, Type } from 'main.core';
import type { TabOptions } from 'ui.entity-selector';
import type { ChatOrChannelDetailed } from 'humanresources.company-structure.utils';

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
		ChildrenModeSelector,
	},

	data(): Object
	{
		return {
			isChatLinkActive: false,
			chatLinkDialogVisible: false,
			isChannelLinkActive: false,
			channelLinkDialogVisible: false,
			isLoading: false,
			searchQuery: '',
			addChatsWithChildren: false,
			addChannelsWithChildren: false,
		};
	},

	created(): void
	{
		this.loadChatAction();
	},

	methods:
	{
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		locPlural(phraseCode: string, count: number): string
		{
			return Loc.getMessagePlural(phraseCode, count, { '#COUNT#': count });
		},
		searchChatOrChannel(searchQuery: string): void
		{
			this.searchQuery = searchQuery;
		},
		async loadChatAction(force: boolean): ?Promise<ChatListResponse>
		{
			if (this.isLoading)
			{
				return null;
			}

			const nodeId = this.focusedNode;
			const department = this.departments.get(nodeId);

			if (!department)
			{
				return null;
			}

			if (!force && Type.isArray(department.chatsDetailed) && Type.isArray(department.channelsDetailed))
			{
				return {
					chats: department.chatsDetailed,
					channels: department.channelsDetailed,
					chatsNoAccess: department.chatsNoAccess,
					channelsNoAccess: department.channelsNoAccess,
				};
			}

			this.isLoading = true;

			this.$emit('showDetailLoader');
			const loadedChatsAndChannels = await DepartmentAPI.getChatsAndChannels(nodeId);
			DepartmentContentActions.setChatsAndChannels(
				nodeId,
				loadedChatsAndChannels.chats ?? [],
				loadedChatsAndChannels.channels ?? [],
				loadedChatsAndChannels.chatsNoAccess ?? 0,
				loadedChatsAndChannels.channelsNoAccess ?? 0,
			);
			this.$emit('hideDetailLoader');
			this.isLoading = false;

			return loadedChatsAndChannels;
		},
		getChatListMenuItems(): Array
		{
			return this.canEdit ? [ChatsMenuLinkChat] : [];
		},
		getChannelListMenuItems(): Array
		{
			return this.canEdit ? [ChatsMenuLinkChannel] : [];
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
					this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_TAB_ADD_EMPTY_STATE_TEAM_LIST_ITEM_1_MSGVER_1'),
					this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_TAB_ADD_EMPTY_STATE_LIST_ITEM_2'),
					this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_TAB_ADD_EMPTY_STATE_TEAM_LIST_ITEM_3'),
				];
			}
			else
			{
				stateArray = [
					this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_TAB_ADD_EMPTY_STATE_LIST_ITEM_1_MSGVER_1'),
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
			return getCommunicationsRecentTabOptions(this.teamEntity, CommunicationsTypeDict.chat);
		},
		getChannelLinkRecentTabOptions(): TabOptions
		{
			return getCommunicationsRecentTabOptions(this.teamEntity, CommunicationsTypeDict.channel);
		},
		async linkChats(chatsItems: Array): void
		{
			this.isChatLinkActive = true;
			const chats = (chatsItems).map((chatItem) => Number(chatItem.id.replace('chat', '')));
			const nodeId = this.focusedNode;
			const ids = { chat: chats, withChildren: this.addChatsWithChildren };
			try
			{
				await DepartmentAPI.saveChats(nodeId, ids);
				const loadedChatsAndChannels = await this.loadChatAction(true);

				if (this.addChatsWithChildren && loadedChatsAndChannels)
				{
					const newChats = loadedChatsAndChannels.chats.filter((chat) => chats.includes(chat.id));

					if (newChats.length > 0)
					{
						DepartmentContentActions.updateChatsInChildrenNodes(nodeId);
					}
				}
			}
			catch
			{ /* empty */ }
			this.isChatLinkActive = false;
			this.chatLinkDialogVisible = false;
			this.addChatsWithChildren = false;
		},
		async linkChannel(chatsItems: Array): void
		{
			this.isChannelLinkActive = true;
			const channels = (chatsItems).map((chatItem) => Number(chatItem.id.replace('chat', '')));
			const nodeId = this.focusedNode;
			const ids = { channel: channels, withChildren: this.addChannelsWithChildren };
			try
			{
				await DepartmentAPI.saveChats(nodeId, ids);
				const loadedChatsAndChannels = await this.loadChatAction(true);

				if (this.addChannelsWithChildren && loadedChatsAndChannels)
				{
					const newChannels = loadedChatsAndChannels.channels.filter((channel) => channels.includes(channel.id));

					if (newChannels.length > 0)
					{
						DepartmentContentActions.updateChatsInChildrenNodes(
							nodeId,
						);
					}
				}
			}
			catch
			{ /* empty */ }
			this.isChannelLinkActive = false;
			this.channelLinkDialogVisible = false;
			this.addChannelsWithChildren = false;
		},
		getChatLinkDialogDataTestIds(): { ...ManagementDialogDataTestIds, addWithChildrenDataTestId: string }
		{
			return ChatLinkDialogDataTestIds;
		},
		getChannelLinkDialogDataTestIds(): { ...ManagementDialogDataTestIds, addWithChildrenDataTestId: string }
		{
			return ChannelLinkDialogDataTestIds;
		},
	},

	computed:
	{
		chats(): Array<ChatOrChannelDetailed>
		{
			return this.departments.get(this.focusedNode)?.chatsDetailed ?? [];
		},
		channels(): Array<ChatOrChannelDetailed>
		{
			return this.departments.get(this.focusedNode)?.channelsDetailed ?? [];
		},
		chatsNoAccess(): number
		{
			return this.departments.get(this.focusedNode)?.chatsNoAccess ?? 0;
		},
		channelsNoAccess(): number
		{
			return this.departments.get(this.focusedNode)?.channelsNoAccess ?? 0;
		},
		chatsNoAccessText(): string
		{
			const phrase = this.chats.length > 0
				? 'HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_CHAT_LIST_ITEM_MORE_HIDDEN_TEXT'
				: 'HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_CHAT_LIST_ITEM_EMPTY_HIDDEN_TEXT'
			;

			return this.locPlural(phrase, this.chatsNoAccess);
		},
		channelsNoAccessText(): string
		{
			const phrase = this.channels.length > 0
				? 'HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_CHANNEL_LIST_ITEM_MORE_HIDDEN_TEXT'
				: 'HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_CHANNEL_LIST_ITEM_EMPTY_HIDDEN_TEXT'
			;

			return this.locPlural(phrase, this.channelsNoAccess);
		},
		filteredChats(): Array<ChatOrChannelDetailed>
		{
			return this.chats.filter(
				(chat) => chat.title.toLowerCase().includes(this.searchQuery.toLowerCase()),
			);
		},
		filteredChannels(): Array<ChatOrChannelDetailed>
		{
			return this.channels.filter(
				(channel) => channel.title.toLowerCase().includes(this.searchQuery.toLowerCase()),
			);
		},
		showAddEmptyState(): boolean
		{
			return this.chats.length === 0
				&& this.channels.length === 0
				&& this.chatsNoAccess === 0
				&& this.channelsNoAccess === 0
			;
		},
		showSearchEmptyState(): boolean
		{
			return (this.chats.length > 0 || this.channels.length > 0)
				&& this.filteredChats.length === 0
				&& this.filteredChannels.length === 0
			;
		},
		getLinkedChatIds(): Array<string>
		{
			return (this.chats).map((chatItem) => `chat${chatItem.id}`);
		},
		getLinkedChannelIds(): Array<string>
		{
			return (this.channels).map((channelItem) => `chat${channelItem.id}`);
		},
		isChatsLoaded(): Boolean
		{
			const department = this.departments.get(this.focusedNode);

			return Boolean(Type.isArray(department.chatsDetailed) && Type.isArray(department.channelsDetailed));
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
		chatMenuItems(): boolean
		{
			return this.getChatListMenuItems();
		},
		channelMenuItems(): boolean
		{
			return this.getChannelListMenuItems();
		},
		emptyChatTitle(): string
		{
			if (this.canEdit)
			{
				return this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_CHAT_LIST_ITEM_TEXT_MSGVER_1');
			}

			return this.isTeamEntity
				? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_CHAT_LIST_ITEM_NO_TEAM_TEXT_MSGVER_1')
				: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_CHAT_LIST_ITEM_NO_DEPARTMENT_TEXT_MSGVER_1')
			;
		},
		emptyChannelTitle(): string
		{
			if (this.canEdit)
			{
				return this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_CHANNEL_LIST_ITEM_TEXT_MSGVER_1');
			}

			return this.isTeamEntity
				? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_CHANNEL_LIST_ITEM_NO_TEAM_TEXT_MSGVER_1')
				: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_CHANNEL_LIST_ITEM_NO_DEPARTMENT_TEXT_MSGVER_1')
			;
		},
		canEdit(): boolean
		{
			const permissionChecker = PermissionChecker.getInstance();

			return this.isTeamEntity
				? permissionChecker.hasPermission(PermissionActions.teamCommunicationEdit, this.focusedNode)
				: permissionChecker.hasPermission(PermissionActions.departmentCommunicationEdit, this.focusedNode)
			;
		},
		getDialogExtraSubtitleLabel(): string
		{
			return this.isTeamEntity
				? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_WITH_SUBTEAMS_LABEL')
				: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_WITH_SUBDEPARTMENTS_LABEL')
			;
		},
		canAddWithChildren(): boolean
		{
			const permissionChecker = PermissionChecker.getInstance();
			if (this.isTeamEntity)
			{
				const teamTeamMinValue = { TEAM: PermissionLevels.selfAndSub };
				const teamDepartmentMinValue = { DEPARTMENT: PermissionLevels.selfAndSub };
				const teamAction = PermissionActions.teamCommunicationEdit;

				return permissionChecker.hasPermission(teamAction, this.focusedNode, teamTeamMinValue)
					|| permissionChecker.hasPermission(teamAction, this.focusedNode, teamDepartmentMinValue)
				;
			}

			const departmentAction = PermissionActions.departmentCommunicationEdit;

			return permissionChecker.hasPermission(departmentAction, this.focusedNode, PermissionLevels.selfAndSub);
		},
		hideEmptyChatItem(): boolean
		{
			return this.searchQuery.length > 0 || this.chatsNoAccess > 0;
		},
		hideEmptyChannelItem(): boolean
		{
			return this.searchQuery.length > 0 || this.channelsNoAccess > 0;
		},
		...mapState(useChartStore, ['focusedNode', 'departments']),
	},

	watch:
	{
		isChatsLoaded(isChatsLoaded): void
		{
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
						:count="chats.length + chatsNoAccess"
						:menuItems="chatMenuItems"
						:listItems="filteredChats"
						:emptyItemTitle="emptyChatTitle"
						emptyItemImageClass="hr-department-detail-content__chat-empty-tab-list-item_tab-icon"
						:hideEmptyItem="hideEmptyChatItem"
						:withAddPermission="canEdit"
						@tabListAction="onActionMenuItemClick"
						:dataTestIds="getChatListDataTestIds()"
					>
						<template v-slot="{ item }">
							<ChatListItem :chat="item" :nodeId="focusedNode"/>
						</template>
						<template v-if="chatsNoAccess > 0" v-slot:footer>
							<div 
								class="hr-department-detail-content__tab-list_communications-hidden"
								data-test-id="hr-department-content_chats-tab__list_chat-hidden-text"
							>
								{{ chatsNoAccessText }}
							</div>
						</template>
					</TabList>
					<TabList
						id='hr-department-detail-content_chats-tab__channel-list'
						:title="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHANNEL_LIST_TITLE')"
						:count="channels.length + channelsNoAccess"
						:menuItems="channelMenuItems"
						:listItems="filteredChannels"
						:emptyItemTitle="emptyChannelTitle"
						emptyItemImageClass="hr-department-detail-content__chat-empty-tab-list-item_tab-icon"
						:hideEmptyItem="hideEmptyChannelItem"
						:withAddPermission="canEdit"
						@tabListAction="onActionMenuItemClick"
						:dataTestIds="getChannelListDataTestIds()"
					>
						<template v-slot="{ item }">
							<ChatListItem :chat="item" :nodeId="focusedNode"/>
						</template>
						<template v-if="channelsNoAccess > 0" v-slot:footer>
							<div
								class="hr-department-detail-content__tab-list_communications-hidden"
								data-test-id="hr-department-content_chats-tab__list_channel-hidden-text"
							>
								{{ channelsNoAccessText }}
							</div>
						</template>
					</TabList>
				</div>
				<EmptyState 
					v-else
					imageClass="hr-department-detail-content__chat-empty-tab-search_tab-icon"
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
			>
				<template v-slot:extra-subtitle>
					<ChildrenModeSelector
						:isTeamEntity="isTeamEntity"
						:data-test-id="getChatLinkDialogDataTestIds().addWithChildrenDataTestId"
						:hasPermission="canAddWithChildren"
						:text="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_MODE_CHATS_TEXT')"
						@saveChildrenMode="addChatsWithChildren = $event"
					/>
				</template>
			</ManagementDialog>
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
			>
				<template v-slot:extra-subtitle>
					<ChildrenModeSelector
						:isTeamEntity="isTeamEntity"
						:data-test-id="getChatLinkDialogDataTestIds().addWithChildrenDataTestId"
						:hasPermission="canAddWithChildren"
						:text="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_MODE_CHANNELS_TEXT')"
						@saveChildrenMode="addChannelsWithChildren = $event"
					/>
				</template>
			</ManagementDialog>
		</div>
	`,
};
