import { Type } from 'main.core';

import { ChannelManager } from 'im.v2.lib.channel';

import { CommentsPanel } from './comments-panel';

import './css/compact-comments-panel.css';

import type { ImModelChat, ImModelMessage } from 'im.v2.model';

// @vue/component
export const CompactCommentsPanel = {
	name: 'CompactCommentsPanel',
	components: { CommentsPanel },
	props: {
		item: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed: {
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId);
		},
		message(): ImModelMessage
		{
			return this.item;
		},
		isChannelPost(): boolean
		{
			return ChannelManager.isChannel(this.dialogId);
		},
		isSystemMessage(): boolean
		{
			return this.message.authorId === 0;
		},
		showCommentsPanel(): boolean
		{
			return this.isChannelPost && !this.isSystemMessage;
		},
	},
	methods: {
		hasComments(totalCount: number): boolean
		{
			return totalCount > 0;
		},
		hasUnreadComments(unreadCount: string): boolean
		{
			return Type.isStringFilled(unreadCount);
		},
	},
	template: `
		<CommentsPanel 
			v-if="showCommentsPanel"
			v-slot="{ onCommentsClick, totalCount, unreadCount }"
			:item="item"
			:dialogId="dialogId"
		>
			<div 
				:class="{'--has-comments': hasComments(totalCount)}"
				class="bx-im-message-compact-comments-panel__container"
				@click="onCommentsClick"
			>
				<div class="bx-im-message-compact-comments-panel__icon"></div>
				<div v-if="hasComments(totalCount)" class="bx-im-message-compact-comments-panel__counter-container">
					<div class="bx-im-message-compact-comments-panel__total-counter">
						{{ totalCount }}
					</div>
					<div v-if="hasUnreadComments(unreadCount)" class="bx-im-message-compact-comments-panel__unread-counter">
						{{ unreadCount }}
					</div>
				</div>
			</div>
		</CommentsPanel>
	`,
};
