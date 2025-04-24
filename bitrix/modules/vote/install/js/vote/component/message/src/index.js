import { BaseMessage } from 'im.v2.component.message.base';
import { AuthorTitle, MessageFooter, ReactionList } from 'im.v2.component.message.elements';

import { VoteDisplay } from 'vote.component.vote';

import './style.css';

// @vue/component
export const VoteChatDisplay = {
	name: 'VoteChatDisplay',
	components: {
		BaseMessage,
		VoteDisplay,
		AuthorTitle,
		MessageFooter,
		ReactionList,
	},
	props:
	{
		/** @type {ImModelMessage} */
		item: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
		withTitle: {
			type: Boolean,
			required: true,
		},
	},
	computed:
	{
		savedMessageId(): number
		{
			return Number.parseInt(this.item.id, 10);
		},

		voteItem(): Object | null
		{
			return this.item.componentParams;
		},
	},
	template: `
		<BaseMessage
			:dialogId="dialogId"
			:item="item"
			:withContextMenu="false"
			:withBackground="true"
		>
			<div class="bx-im-chat__vote-container">
				<AuthorTitle :item="item" class="bx-im-chat-title__vote"/>
				<div class="bx-im-chat-title__vote-icon"></div>
				<VoteDisplay
					:voteItem="voteItem"
					:entityId="savedMessageId"
					:entityType="'ImMessage'"
					:contextId="dialogId"
				/>
				<ReactionList :messageId="item.id" :contextDialogId="dialogId" class="bx-im-reaction-list__vote"/>
				<MessageFooter :item="item" :dialogId="dialogId" />
			</div>
		</BaseMessage>
	`,
};
