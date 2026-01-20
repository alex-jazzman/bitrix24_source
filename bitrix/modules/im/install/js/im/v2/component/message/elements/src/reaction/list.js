import { EventEmitter, type BaseEvent } from 'main.core.events';
import { ReactionName } from 'ui.reaction.item';

import { DialogScrollThreshold, EventType, ActionByRole } from 'im.v2.const';
import { PermissionManager } from 'im.v2.lib.permission';
import { ChannelManager } from 'im.v2.lib.channel';

import { ReactionItem } from './components/item';
import { ReactionService } from './classes/reaction-service';

import './list.css';

import type { JsonObject } from 'main.core';
import type { ImModelReactions, ImModelMessage, ImModelChat } from 'im.v2.model';

// @vue/component
export const ReactionList = {
	name: 'ReactionList',
	components: { ReactionItem },
	props:
	{
		messageId: {
			type: [String, Number],
			required: true,
		},
	},
	data(): JsonObject
	{
		return {
			reactionsToAnimate: new Set(),
		};
	},
	computed:
	{
		message(): ImModelMessage
		{
			return this.$store.getters['messages/getById'](this.messageId);
		},
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/getByChatId'](this.message.chatId);
		},
		reactionsData(): ImModelReactions
		{
			return this.$store.getters['messages/reactions/getByMessageId'](this.messageId);
		},
		reactionCounters(): {[string]: number}
		{
			return this.reactionsData?.reactionCounters ?? {};
		},
		ownReactions(): Set<string>
		{
			return this.reactionsData?.ownReactions ?? new Set();
		},
		reactionListToShow(): string[]
		{
			return Object.keys(ReactionName)
				.filter((reaction) => {
					return Boolean(this.reactionCounters[reaction]);
				});
		},
		needToShowReactionsContainer(): boolean
		{
			return Object.keys(this.reactionCounters).length > 0;
		},
		isChannel(): boolean
		{
			return ChannelManager.isChannel(this.dialog.dialogId);
		},
		showAvatars(): boolean
		{
			return !this.isChannel;
		},
	},
	watch:
	{
		reactionCounters(newCounters: {[string]: number}, oldCounters: {[string]: number})
		{
			const newReactions = Object.keys(newCounters);
			const oldReactions = Object.keys(oldCounters);

			for (const reaction of newReactions)
			{
				if (!oldReactions.includes(reaction))
				{
					this.reactionsToAnimate.add(reaction);
				}
			}
		},
		needToShowReactionsContainer(newValue, oldValue)
		{
			if (!oldValue && newValue)
			{
				EventEmitter.emit(EventType.dialog.scrollToBottom, {
					chatId: this.message.chatId,
					threshold: DialogScrollThreshold.nearTheBottom,
					animation: false,
				});
			}
		},
	},
	mounted()
	{
		const MAX_LISTENERS = 500;
		this.getEmitter().setMaxListeners(EventType.reaction.onReactionSelected, MAX_LISTENERS);
		this.getEmitter().subscribe(EventType.reaction.onReactionSelected, this.onPickerReactionSelected);
	},
	beforeUnmount()
	{
		this.getEmitter().unsubscribe(EventType.reaction.onReactionSelected, this.onPickerReactionSelected);
	},
	methods:
	{
		onReactionClick(reaction: string)
		{
			const permissionManager = PermissionManager.getInstance();
			if (!permissionManager.canPerformActionByRole(ActionByRole.setReaction, this.dialog.dialogId))
			{
				return;
			}

			if (this.ownReactions.has(reaction))
			{
				this.getReactionService().removeReaction(this.messageId, reaction);

				return;
			}

			this.reactionsToAnimate.add(reaction);
			this.getReactionService().setReaction(this.messageId, reaction);
		},
		async onPickerReactionSelected(event: BaseEvent<{ messageId: number, reaction: string }>)
		{
			const { messageId, reaction } = event.getData();
			if (this.messageId !== messageId)
			{
				return;
			}

			this.onReactionClick(reaction);
		},
		getReactionUsers(reaction: string): number[]
		{
			const users = this.reactionsData.reactionUsers[reaction];
			if (!users)
			{
				return [];
			}

			return [...users];
		},
		getReactionService(): ReactionService
		{
			if (!this.reactionService)
			{
				this.reactionService = new ReactionService();
			}

			return this.reactionService;
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
	},
	template: `
		<div v-if="needToShowReactionsContainer" class="bx-im-reaction-list__container bx-im-reaction-list__scope">
			<ReactionItem
				v-for="reactionType in reactionListToShow"
				:key="reactionType + messageId"
				:messageId="messageId"
				:type="reactionType"
				:counter="reactionCounters[reactionType]"
				:users="getReactionUsers(reactionType)"
				:selected="ownReactions.has(reactionType)"
				:animate="reactionsToAnimate.has(reactionType)"
				:showAvatars="showAvatars"
				@click="onReactionClick(reactionType)"
				@animationFinish="reactionsToAnimate.delete(reactionType)"
			/>
		</div>
	`,
};
