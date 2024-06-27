import 'ui.notification';

import { Messenger } from 'im.public';
import { ChatType, Layout, UserRole } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { LayoutManager } from 'im.v2.lib.layout';
import { Logger } from 'im.v2.lib.logger';
import { Utils } from 'im.v2.lib.utils';
import { ChannelManager } from 'im.v2.lib.channel';
import { ChatService } from 'im.v2.provider.service';

import { BaseChatContent } from '../../content/base/base';
import { ChannelContent } from '../../content/channel/channel';
import { EmptyState } from './components/empty-state';
import { UserService } from './classes/user-service';

import './css/default-chat-content.css';

import type { JsonObject } from 'main.core';
import type { ImModelChat, ImModelLayout } from 'im.v2.model';

// @vue/component
export const ChatOpener = {
	name: 'ChatOpener',
	components: { BaseChatContent, ChannelContent, EmptyState },
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
	},
	emits: ['close'],
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
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		isUser(): boolean
		{
			return this.dialog.type === ChatType.user;
		},
		isChannel(): boolean
		{
			return ChannelManager.isChannel(this.dialogId);
		},
		isGuest(): boolean
		{
			return this.dialog.role === UserRole.guest;
		},
	},
	watch:
	{
		dialogId(newValue, oldValue)
		{
			Logger.warn(`ChatContent: switching from ${oldValue || 'empty'} to ${newValue}`);
			this.onChatChange();
		},
	},
	created()
	{
		if (!this.dialogId)
		{
			return;
		}

		this.onChatChange();
	},
	methods:
	{
		async onChatChange()
		{
			if (this.dialogId === '')
			{
				return;
			}

			if (Utils.dialog.isExternalId(this.dialogId))
			{
				const realDialogId = await this.getChatService().prepareDialogId(this.dialogId);

				void LayoutManager.getInstance().setLayout({
					name: Layout.chat.name,
					entityId: realDialogId,
					contextId: this.layout.contextId,
				});

				return;
			}

			if (this.dialog.inited)
			{
				Logger.warn(`ChatContent: chat ${this.dialogId} is already loaded`);
				if (this.isUser)
				{
					const userId = parseInt(this.dialog.dialogId, 10);
					void this.getUserService().updateLastActivityDate(userId);
				}
				else if (this.isChannel && !this.isGuest)
				{
					Logger.warn(`ChatContent: channel ${this.dialogId} is loaded, loading comments metadata`);
					void this.getChatService().loadCommentInfo(this.dialogId);
				}
				Analytics.getInstance().onOpenChat(this.dialog);

				return;
			}

			if (this.dialog.loading)
			{
				Logger.warn(`ChatContent: chat ${this.dialogId} is loading`);

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
			Logger.warn(`ChatContent: loading chat ${this.dialogId} with context - ${this.layout.contextId}`);

			await this.getChatService().loadChatWithContext(this.dialogId, this.layout.contextId)
				.catch((error) => {
					this.handleChatLoadError(error);
					Logger.error(error);
					Messenger.openChat();
				});

			Logger.warn(`ChatContent: chat ${this.dialogId} is loaded with context of ${this.layout.contextId}`);
		},
		async loadChat(): Promise
		{
			Logger.warn(`ChatContent: loading chat ${this.dialogId}`);

			await this.getChatService().loadChatWithMessages(this.dialogId)
				.catch((error) => {
					this.handleChatLoadError(error);
					Logger.error(error);
					Messenger.openChat();
				});

			Logger.warn(`ChatContent: chat ${this.dialogId} is loaded`);
		},
		handleChatLoadError(error: Error[]): void
		{
			const [firstError] = error;
			if (firstError.code === 'ACCESS_DENIED')
			{
				this.showNotification(this.loc('IM_CONTENT_CHAT_ACCESS_ERROR'));
			}
			else if (firstError.code === 'MESSAGE_NOT_FOUND')
			{
				this.showNotification(this.loc('IM_CONTENT_CHAT_CONTEXT_MESSAGE_NOT_FOUND'));
			}
		},
		showNotification(text: string)
		{
			BX.UI.Notification.Center.notify({ content: text });
		},
		getChatService(): ChatService
		{
			if (!this.chatService)
			{
				this.chatService = new ChatService();
			}

			return this.chatService;
		},
		getUserService(): UserService
		{
			if (!this.userService)
			{
				this.userService = new UserService();
			}

			return this.userService;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-content-default-chat__container">
			<EmptyState v-if="!dialogId" />
			<ChannelContent v-else-if="isChannel" :dialogId="dialogId" />
			<BaseChatContent
				v-else
				:dialogId="dialogId"
				class="bx-im-content-comments__container"
			/>
		</div>
	`,
};
