import { EventEmitter } from 'main.core.events';
import 'ui.notification';

import { AvatarSize, LineLoader, ChatAvatar } from 'im.v2.component.elements';
import { ChatService } from 'im.v2.provider.service';
import { ChatType, ChatActionType, EventType, SidebarDetailBlock } from 'im.v2.const';
import { AddToChat } from 'im.v2.component.entity-selector';
import { Utils } from 'im.v2.lib.utils';
import { PermissionManager } from 'im.v2.lib.permission';
import { FadeAnimation } from 'im.v2.component.animation';

import { CallButton } from './components/call-button/call-button';
import { GroupChatTitle } from './components/title/group-chat';
import { UserTitle as UserChatTitle } from './components/title/user';
import { MultidialogChatTitle } from './components/title/multidialog';

import './css/chat-header.css';

import type { JsonObject } from 'main.core';
import type { ImModelUser, ImModelChat } from 'im.v2.model';

export const ChatTitle = Object.freeze({
	group: 'group',
	user: 'user',
	multidialog: 'multidialog',
});

// @vue/component
export const ChatHeader = {
	name: 'ChatHeader',
	components: {
		ChatAvatar,
		AddToChat,
		CallButton,
		GroupChatTitle,
		UserChatTitle,
		MultidialogChatTitle,
		LineLoader,
		FadeAnimation,
	},
	props:
	{
		dialogId: {
			type: String,
			default: '',
		},
		currentSidebarPanel: {
			type: String,
			default: '',
		},
	},
	emits: ['toggleRightPanel', 'toggleSearchPanel', 'toggleMembersPanel'],
	data(): JsonObject
	{
		return {
			showAddToChatPopup: false,
		};
	},
	computed:
	{
		AvatarSize: () => AvatarSize,
		user(): ImModelUser
		{
			return this.$store.getters['users/get'](this.dialogId, true);
		},
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		isInited(): boolean
		{
			return this.dialog.inited;
		},
		isUser(): boolean
		{
			return this.dialog.type === ChatType.user;
		},
		isBot(): boolean
		{
			if (!this.isUser)
			{
				return false;
			}

			return this.user.bot === true;
		},
		isChat(): boolean
		{
			return !this.isUser;
		},
		chatId(): number
		{
			return this.dialog.chatId;
		},
		userLink(): string
		{
			return Utils.user.getProfileLink(this.dialogId);
		},
		showCallButton(): boolean
		{
			if (this.isBot || this.isSupport)
			{
				return false;
			}

			return PermissionManager.getInstance().canPerformAction(ChatActionType.call, this.dialogId);
		},
		showInviteButton(): boolean
		{
			if (this.isBot)
			{
				return false;
			}

			return PermissionManager.getInstance().canPerformAction(ChatActionType.extend, this.dialogId);
		},
		showSidebarButton(): boolean
		{
			return PermissionManager.getInstance().canPerformAction(ChatActionType.openSidebar, this.dialogId);
		},
		canChangeAvatar(): boolean
		{
			return PermissionManager.getInstance().canPerformAction(ChatActionType.avatar, this.dialogId);
		},
		isSidebarOpened(): boolean
		{
			return this.currentSidebarPanel.length > 0;
		},
		isMessageSearchActive(): boolean
		{
			return this.currentSidebarPanel === SidebarDetailBlock.messageSearch;
		},
		headerTitleComponentName(): string
		{
			return `${this.chatTitle}ChatTitle`;
		},
		isSupport(): boolean
		{
			return this.$store.getters['sidebar/multidialog/isSupport'](this.dialogId);
		},
		chatTitle(): string
		{
			if (this.isSupport)
			{
				return ChatTitle.multidialog;
			}

			if (this.isUser)
			{
				return ChatTitle.user;
			}

			return ChatTitle.group;
		},
		hasUserLink(): boolean
		{
			return this.isUser && !this.isSupport;
		},
	},
	methods:
	{
		toggleRightPanel()
		{
			if (this.currentSidebarPanel)
			{
				EventEmitter.emit(EventType.sidebar.close, { panel: '' });

				return;
			}

			EventEmitter.emit(EventType.sidebar.open, {
				panel: SidebarDetailBlock.main,
				dialogId: this.dialogId,
			});
		},
		toggleSearchPanel()
		{
			if (this.isMessageSearchActive)
			{
				EventEmitter.emit(EventType.sidebar.close, { panel: SidebarDetailBlock.messageSearch });

				return;
			}

			EventEmitter.emit(EventType.sidebar.open, {
				panel: SidebarDetailBlock.messageSearch,
				dialogId: this.dialogId,
			});
		},
		onMembersClick()
		{
			if (!this.isInited)
			{
				return;
			}

			if (this.currentSidebarPanel === SidebarDetailBlock.members)
			{
				EventEmitter.emit(EventType.sidebar.close, { panel: SidebarDetailBlock.members });

				return;
			}

			EventEmitter.emit(EventType.sidebar.open, {
				panel: SidebarDetailBlock.members,
				dialogId: this.dialogId,
			});
		},
		onNewTitleSubmit(newTitle: string)
		{
			this.getChatService().renameChat(this.dialogId, newTitle).catch(() => {
				BX.UI.Notification.Center.notify({
					content: this.loc('IM_CONTENT_CHAT_HEADER_RENAME_ERROR'),
				});
			});
		},
		getChatService(): ChatService
		{
			if (!this.chatService)
			{
				this.chatService = new ChatService();
			}

			return this.chatService;
		},
		openInvitePopup()
		{
			this.showAddToChatPopup = true;
		},
		onAvatarClick()
		{
			if (!this.isChat || !this.canChangeAvatar)
			{
				return;
			}
			this.$refs.avatarInput.click();
		},
		async onAvatarSelect(event: Event)
		{
			const input: HTMLInputElement = event.target;
			const file: File = input.files[0];
			if (!file)
			{
				return;
			}

			const preparedAvatar = await this.getChatService().prepareAvatar(file);
			if (!preparedAvatar)
			{
				return;
			}
			void this.getChatService().changeAvatar(this.dialog.chatId, preparedAvatar);
		},
		loc(phraseCode: string, replacements: {[string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<div class="bx-im-chat-header__scope bx-im-chat-header__container">
			<div class="bx-im-chat-header__left">
				<slot name="left">
					<div class="bx-im-chat-header__avatar" :class="{'--can-change': canChangeAvatar}" @click="onAvatarClick">
						<a v-if="hasUserLink" :href="userLink" target="_blank">
							<ChatAvatar :avatarDialogId="dialogId" :contextDialogId="dialogId" :size="AvatarSize.L" />
						</a>
						<ChatAvatar v-else :avatarDialogId="dialogId" :contextDialogId="dialogId" :size="AvatarSize.L" />
					</div>
					<input 
						type="file" 
						@change="onAvatarSelect" 
						accept="image/*" 
						class="bx-im-chat-header__avatar_input" 
						ref="avatarInput"
					>
					<component
						:is="headerTitleComponentName"
						:dialogId="dialogId"
						@membersClick="onMembersClick"
						@newTitle="onNewTitleSubmit"
					/>
				</slot>
			</div>
			<LineLoader v-if="!isInited" :width="45" :height="22" />
			<FadeAnimation :duration="100">
				<div v-if="isInited" class="bx-im-chat-header__right">
					<slot name="before-actions"></slot>
					<CallButton v-if="showCallButton" :dialogId="dialogId" />
					<div
						v-if="showInviteButton"
						:title="loc('IM_CONTENT_CHAT_HEADER_OPEN_INVITE_POPUP_TITLE')"
						:class="{'--active': showAddToChatPopup}"
						class="bx-im-chat-header__icon --add-people"
						@click="openInvitePopup" 
						ref="add-members"
					></div>
					<div 
						:title="loc('IM_CONTENT_CHAT_HEADER_OPEN_SEARCH')"
						:class="{'--active': isMessageSearchActive}"
						class="bx-im-chat-header__icon --search" 
						@click="toggleSearchPanel"
					></div>
					<div
						v-if="showSidebarButton"
						class="bx-im-chat-header__icon --panel"
						:title="loc('IM_CONTENT_CHAT_HEADER_OPEN_SIDEBAR')"
						:class="{'--active': isSidebarOpened}"
						@click="toggleRightPanel" 
					></div>
				</div>
			</FadeAnimation>
			<AddToChat
				:bindElement="$refs['add-members'] || {}"
				:dialogId="dialogId"
				:showPopup="showAddToChatPopup"
				:popupConfig="{offsetTop: 15, offsetLeft: -300}"
				@close="showAddToChatPopup = false"
			/>
		</div>
	`,
};
