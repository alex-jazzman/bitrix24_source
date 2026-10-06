import { CounterManager } from 'im.v2.lib.counter';
import { type ImModelChat, type ImModelRecentItem } from 'im.v2.model';

import '../css/avatar-counter.css';

// @vue/component
export const AvatarCounter = {
	name: 'AvatarCounter',
	props: {
		item: {
			type: Object,
			required: true,
		},
		isChatMuted: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		recentItem(): ImModelRecentItem
		{
			return this.item;
		},
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.recentItem.dialogId, true);
		},
		chatCounter(): number
		{
			return this.$store.getters['counters/getCounterByChatId'](this.dialog.chatId);
		},
		childrenCounter(): number
		{
			return this.$store.getters['counters/getChildrenTotalCounter'](this.dialog.chatId);
		},
		totalCounter(): number
		{
			return this.chatCounter + this.childrenCounter;
		},
		formattedCounter(): string
		{
			return CounterManager.formatCounter(this.totalCounter);
		},
		isChatMarkedUnread(): boolean
		{
			return this.$store.getters['counters/getUnreadStatus'](this.dialog.chatId);
		},
		showBadge(): boolean
		{
			return this.totalCounter > 0 || this.isChatMarkedUnread;
		},
		showUnreadWithoutCounter(): boolean
		{
			return this.isChatMarkedUnread && this.totalCounter === 0;
		},
		showUnreadWithCounter(): boolean
		{
			return this.isChatMarkedUnread && this.totalCounter > 0;
		},
		counterClasses(): { [className: string]: boolean }
		{
			return {
				'--muted': this.isChatMuted,
				'--no-counter': this.showUnreadWithoutCounter,
				'--with-unread': this.showUnreadWithCounter,
			};
		},
	},
	template: `
		<div
			v-if="showBadge"
			:class="counterClasses"
			class="bx-im-list-recent-item__avatar_counter"
		>
			<span v-if="totalCounter > 0">{{ formattedCounter }}</span>
		</div>
	`,
};
