import { Logger } from 'im.v2.lib.logger';
import { ChatService } from 'im.v2.provider.service';
import { BaseChatContent } from 'im.v2.component.content.elements';
import { ChatTextarea } from 'im.v2.component.textarea';

import type { ImModelChat } from 'im.v2.model';

import './css/task-chat-opener.css';

// @vue/component
export const TaskChatOpener = {
	name: 'TaskChatOpener',
	components: { BaseChatContent, ChatTextarea },
	props: {
		chatId: {
			type: Number,
			required: true,
		},
	},
	computed: {
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/getByChatId'](this.chatId, true);
		},
		dialogId(): string
		{
			return this.dialog.dialogId;
		},
	},
	created()
	{
		void this.onChatOpen();
	},
	methods: {
		async onChatOpen()
		{
			if (this.dialog.inited)
			{
				Logger.warn(`TaskChatOpener: chat ${this.chatId} is already loaded`);
				// Analytics.getInstance().onOpenChat(this.dialog);

				return;
			}

			await this.loadChat();
			// Analytics.getInstance().onOpenChat(this.dialog);
		},
		async loadChat(): Promise
		{
			Logger.warn(`TaskChatOpener: loading chat ${this.chatId}`);
			await this.getChatService().loadChatByChatId(this.chatId);
			Logger.warn(`TaskChatOpener: chat ${this.chatId} is loaded`);
		},
		getChatService(): ChatService
		{
			if (!this.chatService)
			{
				this.chatService = new ChatService();
			}

			return this.chatService;
		},
	},
	template: `
		<div class="bx-im-messenger__scope bx-im-task-chat-opener__container">
			<div v-if="!dialog.inited">...</div>
			<BaseChatContent v-else :dialogId="dialogId" :withHeader="false" :withSidebar="false">
				<template #textarea="{ onTextareaMount }">
					<ChatTextarea
						:dialogId="dialogId"
						:key="dialogId"
						:withMarket="false"
						:withAudioInput="false"
						@mounted="onTextareaMount"
					/>
				</template>
			</BaseChatContent>
		</div>
	`,
};
