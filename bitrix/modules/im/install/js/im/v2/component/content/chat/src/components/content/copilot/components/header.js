import { Loc } from 'main.core';

import { ChatService } from 'im.v2.provider.service.chat';
import { EditableChatTitle } from 'im.v2.component.elements.chat-title';
import { AvatarSize, ChatAvatar } from 'im.v2.component.elements.avatar';
import { ChatHeader, HeaderAction, HeaderActionShape, HeaderControlKey } from 'im.v2.component.content.elements';
import { EventType, SidebarDetailBlock } from 'im.v2.const';
import { CopilotManager } from 'im.v2.lib.copilot';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

import { AddToChatButton } from './add-to-chat/add-to-chat-button';

import '../css/chat-header.css';

import type { JsonObject } from 'main.core';
import type { EventEmitter } from 'main.core.events';
import type { ImModelChat } from 'im.v2.model';

// @vue/component
export const CopilotChatHeader = {
	name: 'CopilotChatHeader',
	components: { ChatHeader, EditableChatTitle, ChatAvatar, AddToChatButton, HeaderAction },
	inject:
	{
		currentSidebarPanel: 'currentSidebarPanel',
		sidebarAreaId: { default: '' },
	},
	props: {
		dialogId: {
			type: String,
			default: '',
		},
	},
	data(): JsonObject
	{
		return {
			buttonPanelReady: false,
		};
	},
	computed: {
		AvatarSize: () => AvatarSize,
		HeaderActionShape: () => HeaderActionShape,
		HeaderControlKey: () => HeaderControlKey,
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		isInited(): boolean
		{
			return this.dialog.inited;
		},
		isGroupCopilotChat(): boolean
		{
			return (new CopilotManager()).isGroupCopilotChat(this.dialogId);
		},
		isMembersPanelActive(): boolean
		{
			return this.currentSidebarPanel === SidebarDetailBlock.members;
		},
		subtitleText(): string
		{
			const role = this.$store.getters['copilot/chats/getRole'](this.dialogId);

			if (!role)
			{
				return '';
			}

			if (
				(new CopilotManager()).isCopilotUniversalRole(this.dialogId)
				&& FeatureManager.isFeatureAvailable(Feature.isBitrixGptV2Available)
			)
			{
				const agentName = this.$store.getters['copilot/getAgentName'];

				if (agentName)
				{
					return agentName;
				}
			}

			return role.name;
		},
		formattedUserCounter(): string
		{
			return Loc.getMessagePlural('IM_CONTENT_COPILOT_HEADER_USER_COUNT', this.dialog.userCounter, {
				'#COUNT#': this.dialog.userCounter,
			});
		},
		// SC 2.5.3: the visible text of the counter opens the name of the button, and the purpose of the
		// panel it opens closes it - otherwise the count reaches nobody but the sighted user.
		membersLabel(): string
		{
			return `${this.formattedUserCounter}, ${this.loc('IM_CONTENT_CHAT_HEADER_MEMBERS_ARIA')}`;
		},
	},
	methods:
	{
		onNewTitleSubmit(newTitle: string)
		{
			void this.getChatService().renameChat(this.dialogId, newTitle);
		},
		onMembersClick()
		{
			if (!this.isInited)
			{
				return;
			}

			if (this.isMembersPanelActive)
			{
				this.getEmitter().emit(EventType.sidebar.close, { panel: SidebarDetailBlock.members });

				return;
			}

			this.getEmitter().emit(EventType.sidebar.open, {
				panel: SidebarDetailBlock.members,
				dialogId: this.dialogId,
			});
		},
		onButtonPanelReady()
		{
			this.buttonPanelReady = true;
		},
		getChatService(): ChatService
		{
			if (!this.chatService)
			{
				this.chatService = new ChatService();
			}

			return this.chatService;
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
		loc(phraseCode: string, replacements: {[string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	// The picture and, in a one-to-one chat, the role are informational: neither carries an action, so
	// neither becomes a stop. The counter is the members panel it opens, named after that panel.
	// language=Vue
	template: `
		<ChatHeader
			:dialogId="dialogId"
			:withSearchButton="false"
			class="bx-im-copilot-header__container"
			@buttonPanelReady="onButtonPanelReady"
		>
			<template #left>
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
					<HeaderAction
						v-if="isGroupCopilotChat"
						:controlKey="HeaderControlKey.members"
						:label="membersLabel"
						:expanded="isMembersPanelActive"
						:controls="sidebarAreaId"
						:shape="HeaderActionShape.text"
						:truncate="true"
						:title="loc('IM_CONTENT_COPILOT_HEADER_OPEN_MEMBERS_TITLE')"
						class="bx-im-copilot-header__subtitle --click"
						data-testid="im-copilot-header-user-counter"
						@click="onMembersClick"
					>
						{{ formattedUserCounter }}
					</HeaderAction>
					<div v-else class="bx-im-copilot-header__subtitle">
						{{ subtitleText }}
					</div>
				</div>
			</template>
			<template v-if="buttonPanelReady" #add-to-chat-button>
				<AddToChatButton :dialogId="dialogId" />
			</template>
		</ChatHeader>
	`,
};
