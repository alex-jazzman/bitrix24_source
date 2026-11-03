import { type JsonObject } from 'main.core';
import { defineComponent, type PropType } from 'ui.vue3';

import { ChannelManager } from 'im.v2.lib.channel';
import { type ImModelChat, type ImModelMessage } from 'im.v2.model';

import { CommentsPanel } from '../comments-panel/comments-panel';

// @vue/component
export const MessageFooter = defineComponent({
	name: 'MessageFooter',
	components: { CommentsPanel } as { CommentsPanel: typeof CommentsPanel },
	props: {
		item: {
			type: Object as PropType<ImModelMessage>,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	data(): JsonObject
	{
		return {};
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
	template: `
		<CommentsPanel v-if="showCommentsPanel" :dialogId="dialogId" :item="item" />
	`,
});
