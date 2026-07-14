import { EventEmitter } from 'main.core.events';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { AvatarSize, ChatAvatar } from 'im.v2.component.elements.avatar';
import { EditableChatTitle } from 'im.v2.component.elements.chat-title';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { AiAssistantCreateChatButton } from 'im.v2.component.list.container.ai-assistant';
import { type ImModelChat } from 'im.v2.model';
import { ChatService } from 'im.v2.provider.service.chat';

import './header.css';

const MINIMIZE_EVENT_NAME = 'IM.AiAssistantWidget:minimize';

// @vue/component
export const AiAssistantWidgetChatHeader = {
	name: 'AiAssistantWidgetChatHeader',
	components: { BIcon, ChatAvatar, EditableChatTitle, AiAssistantCreateChatButton },
	props: {
		dialogId: {
			type: String,
			default: '',
		},
		withListToggle: {
			type: Boolean,
			default: false,
		},
		isCreating: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['toggleList', 'createChat'],
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
		isCopilot2026Styles(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isBitrixGptV2Available);
		},
		closeIcon(): string
		{
			return this.isCopilot2026Styles ? OutlineIcons.CHEVRON_RIGHT_L : OutlineIcons.CROSS_L;
		},
		subtitle(): string
		{
			const isBitrixGptV2Available = FeatureManager.isFeatureAvailable(Feature.isBitrixGptV2Available);
			const agentName = this.$store.getters['copilot/getAgentName'];
			if (isBitrixGptV2Available && agentName)
			{
				return agentName;
			}

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
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div :class="['bx-im-ai-assistant-chat-header__container', {'--legacy': !isCopilot2026Styles}]">
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
			<div v-if="isInited && isCopilot2026Styles" class="bx-im-ai-assistant-chat-header__create-chat">
				<AiAssistantCreateChatButton
					:isCreating="isCreating"
					@newChat="$emit('createChat')"
				/>
			</div>
			<BIcon
				v-if="isInited"
				:name="closeIcon"
				:hoverable="true"
				:title="loc('IM_AI_ASSISTANT_WIDGET_MINIMIZE')"
				class="bx-im-ai-assistant-chat-header__icon"
				@click="onMinimize"
			/>
		</div>
	`,
};
