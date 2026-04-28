import { ChatDialog, ScrollManager } from 'im.v2.component.dialog.chat';
import { Layout, UserRole } from 'im.v2.const';
import { CommentsService } from 'im.v2.provider.service.comments';

import { CommentsButton } from './comments-button';

import type { JsonObject } from 'main.core';
import type { ImModelChat, ImModelLayout } from 'im.v2.model';

// @vue/component
export const ChannelDialog = {
	name: 'ChannelDialog',
	components: { ChatDialog, CommentsButton },
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
	},
	data(): JsonObject
	{
		return {
			lastScrolledChatId: 0,
		};
	},
	computed:
	{
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		layout(): ImModelLayout
		{
			return this.$store.getters['application/getLayout'];
		},
		isGuest(): boolean
		{
			return this.dialog.role === UserRole.guest;
		},
		isChatLayout(): boolean
		{
			return this.layout.name === Layout.chat;
		},
		commentIdsWithCounter(): number[]
		{
			return this.$store.getters['counters/getChildrenIdsWithCounter'](this.dialog.chatId);
		},
		totalChannelCommentsCounter(): number
		{
			return this.$store.getters['counters/getChildrenTotalCounter'](this.dialog.chatId);
		},
		showCommentsButton(): boolean
		{
			return this.isChatLayout && this.totalChannelCommentsCounter > 0;
		},
	},
	beforeUnmount()
	{
		this.readAllChannelComments();
	},
	methods:
	{
		async onCommentsButtonClick()
		{
			const chatIdToJump = this.getNextChatIdToJump();
			this.lastScrolledChatId = chatIdToJump;

			const messageIdToJump: ?number = this.$store.getters['messages/comments/getMessageIdByChatId'](chatIdToJump);

			if (messageIdToJump)
			{
				this.$refs.dialog.goToMessageContext(messageIdToJump, {
					position: ScrollManager.scrollPosition.messageBottom,
				});

				return;
			}

			await this.goToMessageContextByCommentsChatId(chatIdToJump);
		},
		async goToMessageContextByCommentsChatId(chatId: string)
		{
			this.$refs.dialog.showLoadingBar();
			const messageId = await this.$refs.dialog.getMessageService().loadContextByChatId(chatId);
			this.$refs.dialog.hideLoadingBar();

			if (!messageId)
			{
				// eslint-disable-next-line no-console
				console.error('ChannelDialog: no messageId after loading context');
			}

			await this.$nextTick();
			this.$refs.dialog.getScrollManager().scrollToMessage(messageId, {
				position: ScrollManager.scrollPosition.messageBottom,
			});
			await this.$nextTick();
			this.$refs.dialog.highlightMessage(messageId);
		},
		getNextChatIdToJump(): number
		{
			const commentChatIds = [...this.commentIdsWithCounter];
			commentChatIds.sort((a, z) => a - z);
			if (this.lastScrolledChatId === 0)
			{
				return commentChatIds[0];
			}

			const filteredChatIds = commentChatIds.filter((chatId) => chatId > this.lastScrolledChatId);
			if (filteredChatIds.length === 0)
			{
				return commentChatIds[0];
			}

			return filteredChatIds[0];
		},
		readAllChannelComments()
		{
			void CommentsService.readAllChannelComments(this.dialogId);
		},
	},
	template: `
		<ChatDialog ref="dialog" :dialogId="dialogId" :clearOnExit="isGuest">
			<template #additional-float-button>
				<CommentsButton
					v-if="showCommentsButton"
					:dialogId="dialogId"
					:counter="totalChannelCommentsCounter"
					@click="onCommentsButtonClick"
				/>
			</template>
		</ChatDialog>
	`,
};
