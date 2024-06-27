import 'ui.notification';
import { Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { PromoManager } from 'im.v2.lib.promo';
import { ChatService } from 'im.v2.provider.service';
import { AddToChat } from 'im.v2.component.entity-selector';
import { EditableChatTitle, AvatarSize, ChatAvatar } from 'im.v2.component.elements';
import { EventType, PromoId, SidebarDetailBlock } from 'im.v2.const';

import { AddToChatHint } from './add-to-chat-hint';

import '../css/chat-header.css';

import type { JsonObject } from 'main.core';
import type { ImModelChat } from 'im.v2.model';

// @vue/component
export const ChatHeader = {
	name: 'ChatHeader',
	components: { EditableChatTitle, AddToChat, ChatAvatar, AddToChatHint },
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
	data(): JsonObject
	{
		return {
			showAddToChatPopup: false,
			showAddToChatHint: false,
		};
	},
	computed:
	{
		AvatarSize: () => AvatarSize,
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		chatId(): number
		{
			return this.dialog.chatId;
		},
		userCounter(): string
		{
			return Loc.getMessagePlural('IM_CONTENT_COPILOT_HEADER_USER_COUNT', this.dialog.userCounter, {
				'#COUNT#': this.dialog.userCounter,
			});
		},
		isInited(): boolean
		{
			return this.dialog.inited;
		},
		isGroupCopilotChat(): boolean
		{
			return this.dialog.userCounter > 2;
		},
		isSidebarOpened(): boolean
		{
			return this.currentSidebarPanel.length > 0;
		},
		copilotRole(): string
		{
			const role = this.$store.getters['copilot/chats/getRole'](this.dialogId);
			if (!role)
			{
				return '';
			}

			return role.name;
		},
	},
	mounted()
	{
		this.showAddToChatHint = PromoManager.getInstance().needToShow(PromoId.addUsersToCopilotChat);
	},
	methods:
	{
		onNewTitleSubmit(newTitle: string)
		{
			this.getChatService().renameChat(this.dialogId, newTitle).catch(() => {
				BX.UI.Notification.Center.notify({
					content: this.loc('IM_CONTENT_COPILOT_HEADER_RENAME_ERROR'),
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
		loc(phraseCode: string, replacements: {[string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		openAddToChatPopup()
		{
			this.showAddToChatPopup = true;
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
		onHintHide()
		{
			void PromoManager.getInstance().markAsWatched(PromoId.addUsersToCopilotChat);
			this.showAddToChatHint = false;
		},
	},
	template: `
		<div class="bx-im-copilot-header__container">
			<div class="bx-im-copilot-header__left">
				<div class="bx-im-copilot-header__avatar">
					<ChatAvatar
						:avatarDialogId="dialogId"
						:contextDialogId="dialogId"
						:withSpecialTypes="false"
						:size="AvatarSize.L"
					/>
				</div>
				<div class="bx-im-copilot-header__info">
					<EditableChatTitle :dialogId="dialogId" @newTitleSubmit="onNewTitleSubmit" />
					<div 
						v-if="isGroupCopilotChat"
						:title="loc('IM_CONTENT_COPILOT_HEADER_OPEN_MEMBERS_TITLE')"
						@click="onMembersClick"
						class="bx-im-copilot-header__subtitle --click"
					>
						{{ userCounter }}
					</div>
					<div v-else class="bx-im-copilot-header__subtitle">
						{{ copilotRole }}
					</div>
				</div>
			</div>
			<div class="bx-im-copilot-header__right">
				<div
					:title="loc('IM_CONTENT_COPILOT_HEADER_OPEN_INVITE_POPUP_TITLE')"
					:class="{'--active': showAddToChatPopup}"
					class="bx-im-copilot-header__icon --add-users"
					@click="openAddToChatPopup"
					ref="add-users"
				>
					<AddToChatHint
						v-if="showAddToChatHint"
						:bindElement="$refs['add-users']"
						@close="showAddToChatHint = false"
						@hide="onHintHide"
					/>
				</div>
				<div
					class="bx-im-copilot-header__icon --panel"
					:title="loc('IM_CONTENT_CHAT_HEADER_OPEN_SIDEBAR')"
					:class="{'--active': isSidebarOpened}"
					@click="toggleRightPanel"
				></div>
			</div>
			<AddToChat
				:bindElement="$refs['add-users'] || {}"
				:dialogId="dialogId"
				:showPopup="showAddToChatPopup"
				:popupConfig="{offsetTop: 15, offsetLeft: -300}"
				@close="showAddToChatPopup = false"
			/>
		</div>
	`,
};
