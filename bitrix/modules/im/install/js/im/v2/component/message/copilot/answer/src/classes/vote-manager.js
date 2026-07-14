import { Type } from 'main.core';
import { type Store } from 'ui.vue3.vuex';

import { Core } from 'im.v2.application.core';
import { FeedbackManager } from 'im.v2.lib.feedback';
import { Notifier } from 'im.v2.lib.notifier';

import { VoteValue, type VoteValueType } from '../const/const';

import { VoteService } from './vote-service';

type VoteContext = {
	dialogId: string,
	text: string,
};

export class VoteManager
{
	#store: Store;
	#service: VoteService;
	#feedbackManager: FeedbackManager;

	constructor()
	{
		this.#store = Core.getStore();
		this.#service = new VoteService();
		this.#feedbackManager = new FeedbackManager();
	}

	getValue(messageId: number): ?VoteValueType
	{
		return this.#store.getters['copilot/votes/getValue'](messageId);
	}

	async vote(messageId: number, value: VoteValueType, context?: VoteContext): Promise<void>
	{
		if (!VoteValue[value])
		{
			return;
		}

		const previousValue = this.getValue(messageId);
		if (previousValue === value)
		{
			return;
		}

		this.#setVote(messageId, value);

		if (value === VoteValue.dislike && context)
		{
			this.#openFeedbackForm(context);
		}

		try
		{
			await this.#service.send(messageId, value);
		}
		catch (errors)
		{
			if (Type.isNil(previousValue))
			{
				this.#deleteVote(messageId);
			}
			else
			{
				this.#setVote(messageId, previousValue);
			}
			Notifier.onDefaultError();

			console.error('VoteManager: vote failed', errors);
		}
	}

	#setVote(messageId: number, value: VoteValueType): void
	{
		void this.#store.dispatch('copilot/votes/set', { messageId, value });
	}

	#deleteVote(messageId: number): void
	{
		void this.#store.dispatch('copilot/votes/delete', messageId);
	}

	#openFeedbackForm(context: VoteContext): void
	{
		const chat = this.#store.getters['chats/get'](context.dialogId);
		const userCounter = chat?.userCounter ?? 0;

		void this.#feedbackManager.openCopilotForm({
			userCounter,
			text: context.text,
		});
	}
}
