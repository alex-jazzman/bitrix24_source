import { MessageAvatar, AvatarSize } from 'im.v2.component.elements.avatar';
import { Core } from 'im.v2.application.core';
import { ActionByRole, ChatType, EventType, UserType } from 'im.v2.const';
import { CopilotManager } from 'im.v2.lib.copilot';
import { PermissionManager } from 'im.v2.lib.permission';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelChat, type ImModelUser } from 'im.v2.model';

import { type AuthorGroupItem } from '../../classes/collection-manager/collection-manager';
import { MessageSelectButton } from './message-select-button';

// @vue/component
export const AuthorGroup = {
	name: 'AuthorGroup',
	components: { MessageAvatar, MessageSelectButton },
	props:
	{
		item: {
			type: Object,
			required: true,
		},
		contextDialogId: {
			type: String,
			required: true,
		},
		withAvatarMenu: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['avatarClick'],
	computed:
	{
		AvatarSize: () => AvatarSize,
		contextDialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.contextDialogId, true);
		},
		contextUser(): ImModelUser
		{
			return this.$store.getters['users/get'](this.contextDialogId, true);
		},
		isUser(): boolean
		{
			return this.contextDialog.type === ChatType.user;
		},
		isBulkActionsMode(): boolean
		{
			return this.$store.getters['messages/select/isBulkActionsModeActive'](this.contextDialogId);
		},
		authorGroup(): AuthorGroupItem
		{
			return this.item;
		},
		authorDialogId(): string
		{
			return this.authorGroup.avatar.avatarId;
		},
		firstMessageIdInAuthorGroup(): number
		{
			// this is potentially dangerous.
			// for now, we always have the same avatar in one authorGroup
			// in future it can be different: several support answers (with different avatars) in one authorGroup
			return this.authorGroup.messages[0].id;
		},
		avatarMenuAvailable(): boolean
		{
			if (!this.withAvatarMenu)
			{
				return false;
			}

			const authorUser: ImModelUser = this.$store.getters['users/get'](this.authorDialogId);
			if (!authorUser)
			{
				return false;
			}

			const copilotManager = new CopilotManager();
			if (copilotManager.isCopilotBot(this.authorDialogId))
			{
				return false;
			}

			const isBotChat = this.isUser && this.contextUser.type === UserType.bot;
			if (isBotChat)
			{
				return false;
			}

			const isCurrentUserGuest = this.$store.getters['users/isGuest'](Core.getUserId());
			const isGuest = this.$store.getters['users/isGuest'](this.authorDialogId);
			if (isCurrentUserGuest && isGuest)
			{
				return false;
			}

			const permissionManager = PermissionManager.getInstance();

			return permissionManager.canPerformActionByRole(ActionByRole.openAvatarMenu, this.contextDialogId);
		},
		canMentionByClick(): boolean
		{
			return new CopilotManager().isMentionByClickAvailable(this.contextDialogId, this.authorDialogId);
		},
		containerClasses(): string[]
		{
			const classes = [`--${this.authorGroup.messageType}`];
			if (!this.avatarMenuAvailable)
			{
				classes.push('--no-menu');
			}

			if (this.canMentionByClick)
			{
				classes.push('--mention-clickable');
			}

			if (this.isBulkActionsMode)
			{
				classes.push('--is-bulk-actions-mode');
			}

			if (this.authorGroup.avatar.isNeeded)
			{
				classes.push('--has-avatar');
			}

			return classes;
		},
	},
	methods:
	{
		isAvatarNeeded(index: number): boolean
		{
			const lastIndexMessageInGroup = this.authorGroup.messages.length - 1;

			return this.authorGroup.avatar.isNeeded && index === lastIndexMessageInGroup;
		},
		onAvatarClick(event: PointerEvent): void
		{
			if (this.canMentionByClick)
			{
				const botUser: ImModelUser = this.$store.getters['users/get'](this.authorDialogId, true);
				this.insertMention(botUser);

				return;
			}

			if (!this.avatarMenuAvailable)
			{
				return;
			}

			this.$emit('avatarClick', {
				dialogId: this.authorGroup.avatar.avatarId,
				$event: event,
			});
		},
		insertMention(user: ImModelUser): void
		{
			this.$Bitrix.eventEmitter.emit(EventType.textarea.insertMention, {
				mentionText: user.name,
				mentionReplacement: Utils.text.getMentionBbCode(user.id, user.name),
				mentionedUserId: user.id,
				dialogId: this.contextDialogId,
				isMentionSymbol: false,
			});
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-message-list-author-group__container" :class="containerClasses">
			<template v-for="(message, index) in authorGroup.messages">
				<Transition name="bx-im-select-button-transition">
					<MessageSelectButton v-if="isBulkActionsMode" :contextDialogId="contextDialogId" :message="message" />
				</Transition>
				<div v-if="isAvatarNeeded(index)" class="bx-im-message-list-author-group__avatar" data-testid="im-message-list-author-avatar">
					<MessageAvatar
						:contextDialogId="contextDialogId"
						:messageId="firstMessageIdInAuthorGroup"
						:authorId="authorGroup.avatar.avatarId"
						:size="AvatarSize.L"
						@click="onAvatarClick"
					/>
				</div>
				<slot name="message" :message="message" :index="index"></slot>
			</template>
		</div>
	`,
};
