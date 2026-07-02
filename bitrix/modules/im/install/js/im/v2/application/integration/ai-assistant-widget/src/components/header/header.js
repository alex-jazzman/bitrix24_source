import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import { EventEmitter } from 'main.core.events';

import { AvatarSize, ChatAvatar } from 'im.v2.component.elements.avatar';
import { EditableChatTitle } from 'im.v2.component.elements.chat-title';
import { ChatService } from 'im.v2.provider.service.chat';

import './header.css';

import type { ImModelChat } from 'im.v2.model';

const MINIMIZE_EVENT_NAME = 'IM.AiAssistantWidget:minimize';

// @vue/component
export const AiAssistantWidgetChatHeader = {
	name: 'AiAssistantWidgetChatHeader',
	components: { BIcon, ChatAvatar, EditableChatTitle },
	props: {
		dialogId: {
			type: String,
			default: '',
		},
		withListToggle: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['toggleList'],
	computed: {
		AvatarSize: () => AvatarSize,
		OutlineIcons: () => OutlineIcons,
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		isInited(): boolean
		{
			return this.dialog.inited;
		},
		subtitle(): string
		{
			return this.loc('IM_CONTENT_AI_ASSISTANT_CHAT_HEADER_TITLE');
		},
	},
	methods: {
		onNewTitleSubmit(newTitle: string)
		{
			if (!this.chatService)
			{
				this.chatService = new ChatService();
			}

			void this.chatService.renameChat(this.dialogId, newTitle);
		},
		onMinimize()
		{
			EventEmitter.emit(MINIMIZE_EVENT_NAME);
		},
		loc(phrase: string): string
		{
			return this.$Bitrix.Loc.getMessage(phrase);
		},
	},
	template: `
		<div class="bx-im-ai-assistant-chat-header__container">
			<BIcon
				v-if="withListToggle"
				:name="OutlineIcons.RECENT_ITEMS"
				:hoverable="true"
				class="bx-im-ai-assistant-chat-header__back"
				@click="$emit('toggleList')"
			/>
			<div class="bx-im-ai-assistant-chat-header__avatar">
				<ChatAvatar
					:avatarDialogId="dialogId"
					:contextDialogId="dialogId"
					:size="AvatarSize.L"
				/>
			</div>
			<div class="bx-im-ai-assistant-chat-header__info">
				<EditableChatTitle :dialogId="dialogId" @newTitleSubmit="onNewTitleSubmit"/>
				<div class="bx-im-ai-assistant-chat-header__subtitle">
					{{ subtitle }}
				</div>
			</div>
			<BIcon
				v-if="isInited"
				:name="OutlineIcons.CROSS_L"
				:hoverable="true"
				:title="loc('IM_AI_ASSISTANT_WIDGET_MINIMIZE')"
				class="bx-im-ai-assistant-chat-header__icon"
				@click="onMinimize"
			/>
		</div>
	`,
};