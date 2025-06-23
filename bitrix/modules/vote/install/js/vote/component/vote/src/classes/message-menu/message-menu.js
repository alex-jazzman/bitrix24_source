import { EventEmitter } from 'main.core.events';
import { Loc } from 'main.core';
import { type MenuItem, MessageMenu } from 'im.v2.lib.menu';

import { VoteApplication } from 'vote.application';
import { VoteAnalytics } from 'vote.analytics';
import type { VoteElementState, QuestionElementState } from 'vote.store.vote';

export class VoteMessageMenu extends MessageMenu
{
	#app: VoteApplication;

	constructor()
	{
		super();
		this.#app = VoteApplication.getInstance();
	}

	getMenuItems(): MenuItem[]
	{
		return [
			this.getReplyItem(),
			this.getShowResultsItem(),
			this.getRevokeItem(),
			this.getCopyLinkItem(),
			this.getPinItem(),
			this.getFavoriteItem(),
			this.getCompleteItem(),
			this.getDeleteItem(),
		];
	}

	getCopyLinkItem(): MenuItem
	{
		const copyLinkItem = super.getCopyLinkItem();
		const { onclick } = copyLinkItem;
		copyLinkItem.onclick = () => {
			onclick();
			VoteAnalytics.copyLink(this.context.dialogId, this.context.id, 'message_link');
		};

		return copyLinkItem;
	}

	getRevokeItem(): ?MenuItem
	{
		if (!this.#canRevokeVote())
		{
			return null;
		}

		return {
			text: Loc.getMessage('VOTE_REVOKE'),
			onclick: () => {
				EventEmitter.emit('vote:message-menu:revoke-vote', { entityId: this.context.id });
				this.close();
			},
		};
	}

	getCompleteItem(): ?MenuItem
	{
		if (!this.#canCompleteVote())
		{
			return null;
		}

		return {
			text: Loc.getMessage('VOTE_POPUP_BTN_COMPLETE'),
			onclick: () => {
				EventEmitter.emit('vote:message-menu:complete-vote', { entityId: this.context.id });
				this.close();
			},
		};
	}

	getShowResultsItem(): ?MenuItem
	{
		if (!this.#canShowResults())
		{
			return null;
		}

		return {
			text: Loc.getMessage('VOTE_SHOW_RESULTS'),
			onclick: () => {
				EventEmitter.emit('vote:message-menu:results-vote', { entityId: this.context.id });
				this.close();
			},
		};
	}

	#getCurrentVote(): VoteElementState
	{
		const voteCollection = this.#app.getStore().getters['vote/getVoteCollection'];

		return voteCollection[this.context.componentParams.id];
	}

	#canCompleteVote(): boolean
	{
		const vote = this.#getCurrentVote();
		if (!vote)
		{
			return false;
		}

		return !vote.isCompleted && vote.canEdit;
	}

	#canShowResults(): boolean
	{
		const vote = this.#getCurrentVote();
		const question = this.#getCurrentQuestion();

		if (!vote || !question)
		{
			return false;
		}

		return vote.canEdit
			&& this.#getCurrentQuestion().totalCounter > 0
		;
	}

	#canRevokeVote(): boolean
	{
		const vote = this.#getCurrentVote();
		if (!vote)
		{
			return false;
		}

		return !vote.isCompleted && vote.canRevoke && vote.isVoted;
	}

	#getCurrentQuestion(): QuestionElementState | null
	{
		const questions = this.context.componentParams.data?.questions;
		if (!questions)
		{
			return null;
		}

		const [firstQuestionId] = Object.keys(questions);
		const questionCollection = this.#app.getStore().getters['vote/getQuestionCollection'];

		return questionCollection[firstQuestionId] ?? null;
	}
}
