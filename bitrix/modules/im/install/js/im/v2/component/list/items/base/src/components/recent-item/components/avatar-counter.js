import { CounterStyle, CounterSize } from 'ui.cnt';
import { Counter as BCounter } from 'ui.vue3.components.counter';

import { CounterManager } from 'im.v2.lib.counter';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { type ImModelChat, type ImModelRecentItem } from 'im.v2.model';

import '../css/avatar-counter.css';

// @vue/component
export const AvatarCounter = {
	name: 'AvatarCounter',
	components: { BCounter },
	props: {
		item: {
			type: Object,
			required: true,
		},
		isChatMuted: {
			type: Boolean,
			default: false,
		},
		isSelected: {
			type: Boolean,
			default: false,
		},
	},
	setup(): Object
	{
		return { CounterSize };
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
		maxCounterValue(): number
		{
			return CounterManager.getCounterDisplayLimit() - 1;
		},
		isAirDesignEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAirDesignEnabled);
		},
		counterStyle(): string
		{
			if (this.isSelected)
			{
				return CounterStyle.FILLED_INVERTED;
			}

			if (this.isChatMuted)
			{
				return CounterStyle.FILLED_NO_ACCENT;
			}

			if (this.chatCounter === 0 && this.childrenCounter > 0)
			{
				return CounterStyle.FILLED_SUCCESS;
			}

			return CounterStyle.FILLED;
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
				'--air-counter': this.isAirDesignEnabled && this.totalCounter > 0,
			};
		},
	},
	template: `
		<div
			v-if="showBadge"
			:class="counterClasses"
			class="bx-im-list-recent-item__avatar_counter"
		>
			<BCounter
				v-if="isAirDesignEnabled && totalCounter > 0"
				:value="totalCounter"
				:maxValue="maxCounterValue"
				:style="counterStyle"
				:size="CounterSize.LARGE"
			/>
			<span v-else-if="totalCounter > 0">{{ formattedCounter }}</span>
		</div>
	`,
};
