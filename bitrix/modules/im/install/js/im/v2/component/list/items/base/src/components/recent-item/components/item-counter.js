import { CounterStyle, CounterSize } from 'ui.cnt';
import { Counter as BCounter } from 'ui.vue3.components.counter';

import { Core } from 'im.v2.application.core';
import { ChatType, AnchorType } from 'im.v2.const';
import { CounterManager } from 'im.v2.lib.counter';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { type ImModelChat, type ImModelRecentItem, type ImModelUser } from 'im.v2.model';

import '../css/item-counter.css';

// @vue/component
export const ItemCounters = {
	name: 'ItemCounters',
	components: { BCounter },
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
		isSelected: {
			type: Boolean,
			default: false,
		},
		withPinStatus: {
			type: Boolean,
			default: true,
		},
		withChildrenCounter: {
			type: Boolean,
			default: true,
		},
		withCounter: {
			type: Boolean,
			default: true,
		},
		compactMode: {
			type: Boolean,
			default: false,
		},
	},
	setup(): Object
	{
		return { CounterSize };
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
			if (!this.withChildrenCounter)
			{
				return 0;
			}

			return this.$store.getters['counters/getChildrenTotalCounter'](this.dialog.chatId);
		},
		formattedCounter(): string
		{
			return this.formatCounter(this.totalCounter);
		},
		maxCounterValue(): number
		{
			return CounterManager.getCounterDisplayLimit() - 1;
		},
		isAirDesignEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAirDesignEnabled);
		},
		isChildrenOnly(): boolean
		{
			return this.chatCounter === 0 && this.childrenCounter > 0;
		},
		hasChildrenLayer(): boolean
		{
			return this.chatCounter > 0 && this.childrenCounter > 0;
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

			if (this.isChildrenOnly)
			{
				return CounterStyle.FILLED_SUCCESS;
			}

			return CounterStyle.FILLED;
		},
		canShowCounters(): boolean
		{
			return this.withCounter && !this.invitation.isActive;
		},
		showCounterContainer(): boolean
		{
			const hasVisibleCounter = this.showMention || this.isChatMarkedUnread || this.showCounter;

			return this.canShowCounters && (!this.compactMode || hasVisibleCounter);
		},
		showPinnedIcon(): boolean
		{
			if (!this.withPinStatus)
			{
				return false;
			}

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
			// eslint-disable-next-line sonarjs/prefer-single-boolean-return
			if (isSingleMessageWithMention)
			{
				return false;
			}

			return true;
		},
		containerClasses(): { [className: string]: boolean }
		{
			const withMentionAndCounter = this.chatCounter > 0 && this.showMention;

			return {
				'--muted': this.isChatMuted,
				'--children-only': this.isChildrenOnly,
				'--with-children': this.hasChildrenLayer,
				'--with-mention-and-counter': withMentionAndCounter,
				'--compact': this.compactMode,
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
		<div
			v-if="showCounterContainer || compactMode"
			:class="containerClasses"
			class="bx-im-list-recent-item__counters_wrap"
		>
			<div v-if="showCounterContainer" class="bx-im-list-recent-item__counters_container">
				<div v-if="showPinnedIcon" class="bx-im-list-recent-item__pinned-icon"></div>
				<div v-else class="bx-im-list-recent-item__counters">
					<div v-if="showMention" class="bx-im-list-recent-item__mention">
						<div class="bx-im-list-recent-item__mention-icon"></div>
					</div>
					<div v-if="showUnreadWithoutCounter" class="bx-im-list-recent-item__counter_number --no-counter"></div>
					<div
						v-else-if="showUnreadWithCounter || showCounter"
						class="bx-im-list-recent-item__counter_number"
						:class="{ '--with-unread': showUnreadWithCounter, '--air-counter': isAirDesignEnabled }"
					>
						<BCounter
							v-if="isAirDesignEnabled"
							:value="totalCounter"
							:maxValue="maxCounterValue"
							:style="counterStyle"
							:size="CounterSize.LARGE"
						/>
						<template v-else>{{ formattedCounter }}</template>
					</div>
				</div>
			</div>
			<slot/>
		</div>
	`,
};
