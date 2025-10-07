import { FadeAnimation } from 'im.v2.component.animation';
import { LineLoader } from 'im.v2.component.elements.loader';
import { EditableChatTitle } from 'im.v2.component.elements.chat-title';
import { AvatarSize, ChatAvatar } from 'im.v2.component.elements.avatar';
import { ChatHeader, UserCounter } from 'im.v2.component.content.elements';

import '../css/header.css';

import type { ImModelChat } from 'im.v2.model';

// @vue/component
export const AiAssistantChatHeader = {
	name: 'AiAssistantChatHeader',
	components: { ChatHeader, EditableChatTitle, ChatAvatar, UserCounter, FadeAnimation, LineLoader },
	inject: ['currentSidebarPanel'],
	props: {
		dialogId: {
			type: String,
			default: '',
		},
	},
	computed: {
		AvatarSize: () => AvatarSize,
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		isAiAssistantMultiUserChat(): boolean
		{
			return this.dialog.userCounter > 2;
		},
	},
	methods: {
		loc(phraseCode: string, replacements: {[string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<ChatHeader
			:dialogId="dialogId"
			:withSearchButton="false"
			:withCallButton="false"
		>
			<template #left>
				<div class="bx-im-ai-assistant-chat-header__avatar">
					<ChatAvatar
						:avatarDialogId="dialogId"
						:contextDialogId="dialogId"
						:withSpecialTypes="false"
						:size="AvatarSize.L"
					/>
				</div>
				<div class="bx-im-chat-header__info">
					<EditableChatTitle :dialogId="dialogId" @newTitleSubmit="$emit('newTitle', $event)" />
					<LineLoader v-if="!dialog.inited" :width="50" :height="16" />
					<FadeAnimation :duration="100">
						<div v-if="dialog.inited" class="bx-im-chat-header__subtitle_container">
							<UserCounter v-if="isAiAssistantMultiUserChat" :dialogId="dialogId" />
							<div v-else class="bx-im-chat-header__subtitle_content">
								{{ loc('IM_CONTENT_AI_ASSISTANT_CHAT_HEADER_TITLE') }}
							</div>
						</div>
					</FadeAnimation>
				</div>
			</template>
		</ChatHeader>
	`,
};
