import { Messenger } from 'im.public';
import { ChatService } from 'im.v2.provider.service.chat';
import { Logger } from 'im.v2.lib.logger';
import { Analytics } from 'im.v2.lib.analytics';

import { CopilotInternalContent } from './components/content';
import { EmptyState } from './components/empty-state';

import type { ImModelChat, ImModelLayout } from 'im.v2.model';
import type { JsonObject } from 'main.core';

export { CopilotChatHeader } from './components/chat-header';
export { CopilotTextarea } from './components/textarea';

// @vue/component
export const CopilotContent = {
	name: 'CopilotContent',
	components: { EmptyState, CopilotInternalContent },
	props:
	{
		entityId: {
			type: String,
			default: '',
		},
		contextMessageId: {
			type: Number,
			default: 0,
		},
	},
	data(): JsonObject
	{
		return {};
	},
	computed:
	{
		layout(): ImModelLayout
		{
			return this.$store.getters['application/getLayout'];
		},
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.entityId, true);
		},
	},
	watch:
	{
		entityId(newValue, oldValue)
		{
			Logger.warn(`CopilotContent: switching from ${oldValue || 'empty'} to ${newValue}`);
			this.onChatChange();
		},
	},
	created()
	{
		if (!this.entityId)
		{
			return;
		}

		this.onChatChange();
	},
	methods:
	{
		async onChatChange()
		{
			if (this.entityId === '')
			{
				return;
			}

			if (this.dialog.inited)
			{
				Logger.warn(`CopilotContent: chat ${this.entityId} is already loaded`);

				Analytics.getInstance().onOpenChat(this.dialog);

				return;
			}

			if (this.dialog.loading)
			{
				Logger.warn(`CopilotContent: chat ${this.entityId} is loading`);

				return;
			}

			if (this.layout.contextId)
			{
				await this.loadChatWithContext();
				Analytics.getInstance().onOpenChat(this.dialog);

				return;
			}

			await this.loadChat();
			Analytics.getInstance().onOpenChat(this.dialog);
		},
		async loadChatWithContext(): Promise
		{
			Logger.warn(`CopilotContent: loading chat ${this.entityId} with context - ${this.layout.contextId}`);

			await this.getChatService().loadChatWithContext(this.entityId, this.layout.contextId)
				.catch(() => {
					Messenger.openCopilot();
				});

			Logger.warn(`CopilotContent: chat ${this.entityId} is loaded with context of ${this.layout.contextId}`);

			return Promise.resolve();
		},
		async loadChat(): Promise
		{
			Logger.warn(`CopilotContent: loading chat ${this.entityId}`);

			await this.getChatService().loadChatWithMessages(this.entityId)
				.catch(() => {
					Messenger.openCopilot();
				});

			Logger.warn(`CopilotContent: chat ${this.entityId} is loaded`);

			return Promise.resolve();
		},
		getChatService(): ChatService
		{
			if (!this.chatService)
			{
				this.chatService = new ChatService();
			}

			return this.chatService;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<EmptyState v-if="!entityId" />
		<CopilotInternalContent v-else :dialogId="entityId" />
	`,
};
