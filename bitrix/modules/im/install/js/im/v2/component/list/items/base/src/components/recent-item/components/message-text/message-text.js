import { Loc } from 'main.core';

import { Core } from 'im.v2.application.core';
import { ChatType, Settings } from 'im.v2.const';
import { Utils } from 'im.v2.lib.utils';
import { Parser } from 'im.v2.lib.parser';
import { RecentManager } from 'im.v2.lib.recent';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { MessageAvatar, ChatAvatar, AvatarSize } from 'im.v2.component.elements.avatar';
import { type ImModelUser, type ImModelChat, type ImModelRecentItem, type ImModelMessage } from 'im.v2.model';

import { MessageDraft } from './components/draft';
import { InvitationPlaceholder } from './components/invitation';
import { BirthdayPlaceholder } from './components/birthday';
import { VacationPlaceholder } from './components/vacation';

import './css/message-text.css';

const HiddenTitleByChatType = {
	[ChatType.openChannel]: Loc.getMessage('IM_LIST_ITEMS_CHAT_TYPE_OPEN_CHANNEL'),
	[ChatType.channel]: Loc.getMessage('IM_LIST_ITEMS_CHAT_TYPE_PRIVATE_CHANNEL'),
	[ChatType.generalChannel]: Loc.getMessage('IM_LIST_ITEMS_CHAT_TYPE_OPEN_CHANNEL'),
	[ChatType.taskComments]: Loc.getMessage('IM_LIST_ITEMS_CHAT_TYPE_TASK_COMMENTS'),
	default: Loc.getMessage('IM_LIST_ITEMS_CHAT_TYPE_GROUP_V2'),
};

// @vue/component
export const MessageText = {
	name: 'MessageText',
	components: {
		MessageAvatar,
		ChatAvatar,
		MessageDraft,
		InvitationPlaceholder,
		BirthdayPlaceholder,
		VacationPlaceholder,
	},
	props: {
		item: {
			type: Object,
			required: true,
		},
		withDraft: {
			type: Boolean,
			default: true,
		},
		forceOwnMessage: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		AvatarSize: () => AvatarSize,
		recentItem(): ImModelRecentItem
		{
			return this.item;
		},
		recentItemForPreview(): ImModelRecentItem
		{
			if (this.message?.id && this.message.id !== this.recentItem.messageId)
			{
				return { ...this.recentItem, messageId: this.message.id };
			}

			return this.recentItem;
		},
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.recentItem.dialogId, true);
		},
		user(): ImModelUser
		{
			return this.$store.getters['users/get'](this.recentItem.dialogId, true);
		},
		message(): ?ImModelMessage
		{
			if (this.forceOwnMessage && this.recentItem.ownMessageId > 0)
			{
				const ownMessage = this.$store.getters['recent/getOwnMessage'](this.recentItem.dialogId);
				if (ownMessage)
				{
					return ownMessage;
				}
			}

			return this.$store.getters['recent/getMessage'](this.recentItem.dialogId);
		},
		isNestedPreviewSource(): boolean
		{
			if (this.forceOwnMessage || !this.isNestedPreviewAvailable)
			{
				return false;
			}

			const messageChatId = this.message?.chatId;
			if (!messageChatId || !this.dialog.chatId)
			{
				return false;
			}

			return messageChatId !== this.dialog.chatId;
		},
		previewSourceChat(): ?ImModelChat
		{
			if (!this.isNestedPreviewSource)
			{
				return null;
			}

			return this.$store.getters['chats/getByChatId'](this.message?.chatId) ?? null;
		},
		needsInvitationPlaceholder(): boolean
		{
			return this.recentItem.invitation.isActive;
		},
		needsBirthdayPlaceholder(): boolean
		{
			return RecentManager.needsBirthdayPlaceholder(this.recentItem.dialogId);
		},
		needsVacationPlaceholder(): boolean
		{
			return RecentManager.needsVacationPlaceholder(this.recentItem.dialogId);
		},
		showLastMessage(): boolean
		{
			return this.$store.getters['application/settings/get'](Settings.recent.showLastMessage);
		},
		hiddenMessageText(): string
		{
			if (this.isSelfChat)
			{
				return this.loc('IM_LIST_RECENT_CHAT_SELF_SUBTITLE');
			}

			if (this.isUser)
			{
				return this.$store.getters['users/getPosition'](this.recentItem.dialogId);
			}

			return HiddenTitleByChatType[this.dialog.type] ?? HiddenTitleByChatType.default;
		},
		isNestedPreviewAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isCollabPreviewSourceEnabled);
		},
		isLastMessageAuthor(): boolean
		{
			return this.showLastMessage && this.message.authorId === Core.getUserId();
		},
		canShowAuthorAvatar(): boolean
		{
			return Boolean(this.message);
		},
		messageText(): string
		{
			if (!this.message)
			{
				return this.hiddenMessageText;
			}

			if (this.message?.isDeleted)
			{
				return this.loc('IM_LIST_RECENT_DELETED_MESSAGE');
			}

			const formattedText = Parser.purifyRecent(this.recentItemForPreview);
			if (!this.showLastMessage || !formattedText)
			{
				return this.hiddenMessageText;
			}

			return formattedText;
		},
		formattedMessageText(): string
		{
			const SPLIT_INDEX = 27;

			return Utils.text.insertUnseenWhitespace(this.messageText, SPLIT_INDEX);
		},
		showDraft(): boolean
		{
			return this.withDraft && this.recentItem.draft.text;
		},
		isUser(): boolean
		{
			return this.dialog.type === ChatType.user;
		},
		isChat(): boolean
		{
			return !this.isUser;
		},
		isSelfChat(): boolean
		{
			return this.$store.getters['chats/isSelfChat'](this.recentItem.dialogId);
		},
	},
	methods: {
		loc(phraseCode: string, replacements: {[string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<div class="bx-im-list-recent-item__message_container">
			<span class="bx-im-list-recent-item__message_text">
				<MessageDraft v-if="showDraft" :draftText="recentItem.draft.text" />
				<InvitationPlaceholder v-else-if="needsInvitationPlaceholder" />
				<BirthdayPlaceholder v-else-if="needsBirthdayPlaceholder" />
				<VacationPlaceholder v-else-if="needsVacationPlaceholder" :vacationDate="user.absent" />
				<template v-else>
					<template v-if="isNestedPreviewSource && previewSourceChat">
						<ChatAvatar
							:avatarDialogId="previewSourceChat.dialogId"
							:contextDialogId="previewSourceChat.dialogId"
							:size="AvatarSize.XXS"
							:withTooltip="false"
							class="bx-im-list-recent-item__author-avatar"
							data-testid="recent-item-preview-source-avatar"
						/>
						<span
							class="bx-im-list-recent-item__preview-source-name"
							data-testid="recent-item-preview-source-name"
						>
							{{ previewSourceChat.name }}:
						</span>
					</template>
					<template v-else-if="canShowAuthorAvatar">
						<span v-if="isLastMessageAuthor" class="bx-im-list-recent-item__self_author-icon"></span>
						<MessageAvatar
							v-else-if="isChat && message.authorId"
							:messageId="message.id"
							:authorId="message.authorId"
							:size="AvatarSize.XXS"
							class="bx-im-list-recent-item__author-avatar"
						/>
					</template>
					<span>{{ formattedMessageText }}</span>
				</template>
			</span>
		</div>
	`,
};
