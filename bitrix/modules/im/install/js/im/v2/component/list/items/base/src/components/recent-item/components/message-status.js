import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'im.v2.application.core';
import { ChatType, OwnMessageStatus, UserType, AnchorType } from 'im.v2.const';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { RecentManager } from 'im.v2.lib.recent';
import { type ImModelChat, type ImModelRecentItem, type ImModelUser, type ImModelMessage } from 'im.v2.model';

import '../css/message-status.css';

const StatusIcon = {
	none: '',
	like: 'like',
	sending: 'sending',
	sent: 'sent',
	viewed: 'viewed',
};

const AirIconName = {
	[StatusIcon.sending]: Outline.CLOCK,
	[StatusIcon.sent]: Outline.CHECK_M,
	[StatusIcon.viewed]: Outline.DOUBLE_CHECK,
};

// @vue/component
export const MessageStatus = {
	components: { BIcon },
	props:
	{
		item: {
			type: Object,
			required: true,
		},
		isSelected: {
			type: Boolean,
			default: false,
		},
		isDraftActive: {
			type: Boolean,
			default: false,
		},
	},
	computed:
	{
		recentItem(): ImModelRecentItem
		{
			return this.item;
		},
		user(): ImModelUser
		{
			return this.$store.getters['users/get'](this.recentItem.dialogId, true);
		},
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.recentItem.dialogId, true);
		},
		message(): ImModelMessage
		{
			return this.$store.getters['recent/getMessage'](this.recentItem.dialogId);
		},
		isChatWithReactions(): boolean
		{
			return this.$store.getters['messages/anchors/isChatHasAnchorsWithType'](this.dialog.chatId, AnchorType.reaction);
		},
		showLike(): boolean
		{
			/*
			* 'this.recent Item.liked' is left to allow work without anchors
			* */
			return this.isChatWithReactions || this.recentItem.liked;
		},
		messageStatus(): $Values<typeof OwnMessageStatus>
		{
			if (this.message.sending)
			{
				return OwnMessageStatus.sending;
			}

			if (this.message.viewedByOthers)
			{
				return OwnMessageStatus.viewed;
			}

			return OwnMessageStatus.sent;
		},
		statusIcon(): $Values<typeof StatusIcon>
		{
			if (this.isSelfChat || this.isBot)
			{
				return StatusIcon.none;
			}

			if (this.showLike)
			{
				return StatusIcon.like;
			}

			if (!this.isLastMessageAuthor || this.needsBirthdayPlaceholder || this.isDraftActive)
			{
				return StatusIcon.none;
			}

			return this.messageStatus;
		},
		isAirDesignEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAirDesignEnabled);
		},
		showAirIcon(): boolean
		{
			return this.isAirDesignEnabled && AirIconName[this.statusIcon] !== undefined;
		},
		airIconName(): string
		{
			return AirIconName[this.statusIcon] ?? '';
		},
		isLastMessageAuthor(): boolean
		{
			return this.message?.authorId === Core.getUserId();
		},
		isSelfChat(): boolean
		{
			return this.isUser && this.user.id === Core.getUserId();
		},
		isUser(): boolean
		{
			return this.dialog.type === ChatType.user;
		},
		isBot(): boolean
		{
			if (this.isUser)
			{
				return this.user.type === UserType.bot;
			}

			return false;
		},
		needsBirthdayPlaceholder(): boolean
		{
			if (!this.isUser)
			{
				return false;
			}

			return RecentManager.needsBirthdayPlaceholder(this.recentItem.dialogId);
		},
	},
	template: `
		<BIcon
			v-if="showAirIcon"
			:name="airIconName"
			class="bx-im-list-recent-item__status-icon --air"
			:class="{ '--accent': statusIcon === 'viewed', '--selected': isSelected }"
		/>
		<div v-else class="bx-im-list-recent-item__status-icon" :class="'--' + statusIcon"></div>
	`,
};
