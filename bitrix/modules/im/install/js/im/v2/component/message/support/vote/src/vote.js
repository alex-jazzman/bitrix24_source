import { Type } from 'main.core';

import { BaseMessage } from 'im.v2.component.message.base';
import { Notifier } from 'im.v2.lib.notifier';

import { VoteService } from './classes/vote-service';
import { VoteType } from './const/vote-type';
import { VoteParamKey as ParamKey } from './const/vote-params-keys';

import './css/vote.css';

import type { ImModelMessage } from 'im.v2.model';

// @vue/component
export const SupportVoteMessage = {
	name: 'SupportVote',
	components: { BaseMessage },
	props:
	{
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
			default: true,
		},
	},
	computed:
	{
		message(): ImModelMessage
		{
			return this.item;
		},
		currentVote(): $Values<typeof VoteType>
		{
			return this.message.componentParams[ParamKey.currentVote] || VoteType.none;
		},
		voteText(): string
		{
			if (this.currentVote === VoteType.none)
			{
				return this.message.componentParams[ParamKey.voteText];
			}

			if (this.currentVote === VoteType.like)
			{
				return this.message.componentParams[ParamKey.likeText];
			}

			return this.message.componentParams[ParamKey.dislikeText];
		},
		voteClosed(): boolean
		{
			const closeDate = this.message.componentParams[ParamKey.voteCloseDate];
			if (!Type.isStringFilled(closeDate))
			{
				return false;
			}

			return new Date(closeDate).getTime() < Date.now();
		},
		likeClasses(): { [className: string]: boolean }
		{
			return {
				'--active': this.currentVote === VoteType.like,
				'--disabled': this.currentVote === VoteType.dislike,
			};
		},
		dislikeClasses(): { [className: string]: boolean }
		{
			return {
				'--active': this.currentVote === VoteType.dislike,
				'--disabled': this.currentVote === VoteType.like,
			};
		},
	},
	methods:
	{
		onLike()
		{
			if (this.currentVote === VoteType.like)
			{
				return;
			}

			if (this.voteClosed)
			{
				this.showVoteClosedNotification();

				return;
			}
			this.getVoteService().like();
		},
		onDislike()
		{
			if (this.currentVote === VoteType.dislike)
			{
				return;
			}

			if (this.voteClosed)
			{
				this.showVoteClosedNotification();

				return;
			}
			this.getVoteService().dislike();
		},
		showVoteClosedNotification()
		{
			Notifier.support.onVoteClosedError();
		},
		getVoteService(): VoteService
		{
			if (!this.voteService)
			{
				this.voteService = new VoteService(this.message.id, this.dialogId);
			}

			return this.voteService;
		},
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<BaseMessage
			:item="item"
			:dialogId="dialogId"
			:withTitle="withTitle"
			:withContextMenu="false"
			:withReactions="false"
		>
			<div class="bx-im-message-support-vote__container">
				<div class="bx-im-message-support-vote__title">{{ loc('IM_MESSAGE_SUPPORT_VOTE_TITLE') }}</div>
				<div class="bx-im-message-support-vote__subtitle">{{ voteText }}</div>
				<div class="bx-im-message-support-vote__actions">
					<div class="bx-im-message-support-vote__action_item --like" :class="likeClasses" @click="onLike"></div>
					<div class="bx-im-message-support-vote__action_item --dislike" :class="dislikeClasses" @click="onDislike"></div>
				</div>
			</div>
		</BaseMessage>
	`,
};
