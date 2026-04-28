import { Core } from 'im.v2.application.core';
import { ChatType, AnchorType } from 'im.v2.const';
import { CounterManager } from 'im.v2.lib.counter';

import type { ImModelChat, ImModelRecentItem, ImModelUser } from 'im.v2.model';

// @vue/component
export const ItemCounters = {
	name: 'ItemCounters',
	props:
	{
		item: {
			type: Object,
			required: true,
		},
		isChatMuted: {
			type: Boolean,
			required: true,
		},
	},
	computed:
	{
		recentItem(): ImModelRecentItem
		{
			return this.item;
		},
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.recentItem.dialogId, true);
		},
		user(): ImModelUser
		{
			return this.$store.getters['users/get'](this.recentItem.dialogId, true);
		},
		isUser(): boolean
		{
			return this.dialog.type === ChatType.user;
		},
		isSelfChat(): boolean
		{
			return this.isUser && this.user.id === Core.getUserId();
		},
		isChatMarkedUnread(): boolean
		{
			return this.$store.getters['counters/getUnreadStatus'](this.dialog.chatId);
		},
		invitation(): { isActive: boolean, originator: number, canResend: boolean }
		{
			return this.recentItem.invitation;
		},
		totalCounter(): number
		{
			return this.chatCounter + this.childrenCounter;
		},
		chatCounter(): number
		{
			return this.$store.getters['counters/getCounterByChatId'](this.dialog.chatId);
		},
		childrenCounter(): number
		{
			return this.$store.getters['counters/getChildrenTotalCounter'](this.dialog.chatId);
		},
		formattedCounter(): string
		{
			return this.formatCounter(this.totalCounter);
		},
		showCounterContainer(): boolean
		{
			return !this.invitation.isActive;
		},
		showPinnedIcon(): boolean
		{
			const noCounters = this.totalCounter === 0;

			return this.recentItem.pinned && noCounters && !this.isChatMarkedUnread;
		},
		showUnreadWithoutCounter(): boolean
		{
			return this.isChatMarkedUnread && this.totalCounter === 0;
		},
		showUnreadWithCounter(): boolean
		{
			return this.isChatMarkedUnread && this.totalCounter > 0;
		},
		showMention(): boolean
		{
			return this.$store.getters['messages/anchors/isChatHasAnchorsWithType'](this.dialog.chatId, AnchorType.mention) && !this.isSelfChat;
		},
		showCounter(): boolean
		{
			if (this.totalCounter === 0 || this.isSelfChat || this.isChatMarkedUnread)
			{
				return false;
			}

			const isSingleMessageWithMention = this.showMention && this.totalCounter === 1;
			if (isSingleMessageWithMention)
			{
				return false;
			}

			return true;
		},
		containerClasses(): { [className: string]: boolean }
		{
			const commentsOnly = this.chatCounter === 0 && this.childrenCounter > 0;
			const withComments = this.chatCounter > 0 && this.childrenCounter > 0;
			const withMentionAndCounter = this.chatCounter > 0 && this.showMention;

			return {
				'--muted': this.isChatMuted,
				'--comments-only': commentsOnly,
				'--with-comments': withComments,
				'--with-mention-and-counter': withMentionAndCounter,
			};
		},
	},
	methods:
	{
		formatCounter(counter: number): string
		{
			return CounterManager.formatCounter(counter);
		},
	},
	template: `
		<div v-if="showCounterContainer" :class="containerClasses" class="bx-im-list-recent-item__counters_wrap">
			<div class="bx-im-list-recent-item__counters_container">
				<div v-if="showPinnedIcon" class="bx-im-list-recent-item__pinned-icon"></div>
				<div v-else class="bx-im-list-recent-item__counters">
					<div v-if="showMention" class="bx-im-list-recent-item__mention">
						<div class="bx-im-list-recent-item__mention-icon"></div>
					</div>
					<div v-if="showUnreadWithoutCounter" class="bx-im-list-recent-item__counter_number --no-counter"></div>
					<div v-else-if="showUnreadWithCounter" class="bx-im-list-recent-item__counter_number --with-unread">
						{{ formattedCounter }}
					</div>
					<div v-else-if="showCounter" class="bx-im-list-recent-item__counter_number">
						{{ formattedCounter }}
					</div>
				</div>
			</div>
		</div>
	`,
};
