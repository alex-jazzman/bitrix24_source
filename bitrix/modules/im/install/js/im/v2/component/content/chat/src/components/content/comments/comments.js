import { BaseChatContent } from 'im.v2.component.content.elements';
import { CHAT_DETAIL_FOCUS_CONTEXT, type ChatDetailFocusContext, DetailLayer } from 'im.v2.lib.a11y';

import { ChannelSubscribeBar } from '../channel/components/subscribe-bar';
import { CommentsHeader } from './components/header';
import { CommentsDialog } from './components/dialog';
import { CommentsTextarea } from './components/textarea';

import './css/comments-content.css';

export const CommentsContent = {
	name: 'CommentsContent',
	components: { BaseChatContent, CommentsHeader, CommentsDialog, CommentsTextarea, ChannelSubscribeBar },
	inject:
	{
		chatDetailFocusContext: {
			from: CHAT_DETAIL_FOCUS_CONTEXT,
			default: null,
		},
	},
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
		contextId: {
			type: Number,
			default: 0,
		},
		channelId: {
			type: String,
			required: true,
		},
	},
	// The layer over the chat is a walk of its own, and it lasts exactly as long as this content is on
	// screen: the detail belongs to the layer while it shows and goes back to the base one when it goes.
	mounted()
	{
		this.getFocusContext()?.setActiveLayer(DetailLayer.comments);
	},
	beforeUnmount()
	{
		this.getFocusContext()?.setActiveLayer(DetailLayer.base);
	},
	methods:
	{
		getFocusContext(): ChatDetailFocusContext | null
		{
			return this.chatDetailFocusContext;
		},
	},
	template: `
		<BaseChatContent :dialogId="dialogId">
			<template #header>
				<CommentsHeader :dialogId="dialogId" :channelId="channelId" :key="dialogId" />
			</template>
			<template #dialog>
				<CommentsDialog :dialogId="dialogId" :contextId="contextId" :key="dialogId" />
			</template>
			<template #join-panel>
				<ChannelSubscribeBar :dialogId="dialogId" :key="dialogId" />
			</template>
			<template #textarea>
				<CommentsTextarea :dialogId="dialogId" :key="dialogId" />
			</template>
		</BaseChatContent>
	`,
};
