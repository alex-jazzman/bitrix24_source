import { BuilderModel } from 'ui.vue3.vuex';

import { Core } from 'im.v2.application.core';

import type { Store, GetterTree, ActionTree, MutationTree } from 'ui.vue3.vuex';
import type { ImModelReactions } from 'im.v2.model';

type ReactionPayload = {
	messageId: number,
	userId: number,
	reaction: string
};

type SetReactionPayload = ReactionPayload & { withReplace?: boolean };

type RawReactions = {
	messageId: number,
	reactionCounters: ReactionCounters,
	reactionUsers: ReactionUsers,
	ownReactions: string[],
	ownReactionsToRemove?: string[],
};
type ReactionCounters = {[reactionType: string]: number};
type ReactionUsers = {[reactionType: string]: number[]};
type RawReactionsList = RawReactions[];

type ReactionsState = {
	collection: {
		[messageId: string]: ImModelReactions
	}
};

const USERS_TO_SHOW = 5;

export class ReactionsModel extends BuilderModel
{
	getState(): ReactionsState
	{
		return {
			collection: {},
		};
	}

	getElementState(): ImModelReactions
	{
		return {
			reactionCounters: {},
			reactionUsers: {},
			ownReactions: new Set(),
		};
	}

	getGetters(): GetterTree
	{
		return {
			/** @function messages/reactions/getByMessageId */
			getByMessageId: (state: ReactionsState) => (messageId: number): ?ImModelReactions => {
				return state.collection[messageId];
			},
		};
	}

	getActions(): ActionTree
	{
		return {
			/** @function messages/reactions/set */
			set: (store: Store, payload: RawReactionsList) => {
				store.commit('set', this.prepareSetPayload(payload));
			},
			/** @function messages/reactions/setReaction */
			setReaction: (store: Store, payload: ReactionPayload & { withReplace: boolean }) => {
				store.commit('setReaction', payload);
			},
			/** @function messages/reactions/removeReaction */
			removeReaction: (store: Store, payload: ReactionPayload) => {
				if (!store.state.collection[payload.messageId])
				{
					return;
				}

				store.commit('removeReaction', payload);
			},
			/** @function messages/reactions/clearCollection */
			clearCollection: (store: Store) => {
				store.commit('clearCollection');
			},
		};
	}

	/* eslint-disable no-param-reassign */
	getMutations(): MutationTree
	{
		return {
			set: (state: ReactionsState, payload: RawReactionsList) => {
				payload.forEach((item) => {
					const currentItem = state.collection[item.messageId];
					const currentOwnReactions = currentItem ? currentItem.ownReactions : [];

					const newOwnReactions = item.ownReactions ?? [];
					const preparedOwnReactions = new Set([...newOwnReactions, ...currentOwnReactions]);

					if (item.ownReactionsToRemove)
					{
						item.ownReactionsToRemove.forEach((reactionToRemove) => {
							preparedOwnReactions.delete(reactionToRemove);
						});
					}

					state.collection[item.messageId] = {
						reactionCounters: item.reactionCounters,
						reactionUsers: item.reactionUsers,
						ownReactions: preparedOwnReactions,
					};
				});
			},
			setReaction: (state: ReactionsState, payload: SetReactionPayload) => {
				const { messageId, userId, reaction } = payload;
				if (!state.collection[messageId])
				{
					state.collection[messageId] = this.getElementState();
				}

				const reactions = state.collection[messageId];

				if (Core.getUserId() === userId)
				{
					this.handleOwnReactions(reactions, payload);
				}

				if (!reactions.reactionCounters[reaction])
				{
					reactions.reactionCounters[reaction] = 0;
				}

				const currentReactionCounter = reactions.reactionCounters[reaction];
				const newReactionCounter = currentReactionCounter + 1;
				if (newReactionCounter <= USERS_TO_SHOW)
				{
					this.addUserToReaction(reactions, payload);
				}

				reactions.reactionCounters[reaction] = newReactionCounter;
			},
			removeReaction: (state: ReactionsState, payload: ReactionPayload) => {
				const { messageId, userId, reaction } = payload;
				const reactions = state.collection[messageId];

				if (Core.getUserId() === userId)
				{
					reactions.ownReactions.delete(reaction);
				}

				reactions.reactionUsers[reaction]?.delete(userId);
				reactions.reactionCounters[reaction]--;
				if (reactions.reactionCounters[reaction] === 0)
				{
					delete reactions.reactionCounters[reaction];
				}
			},
			clearCollection: (state: ReactionsState) => {
				state.collection = {};
			},
		};
	}

	handleOwnReactions(reactions: ImModelReactions, payload: SetReactionPayload)
	{
		const { reaction, withReplace = true } = payload;
		if (withReplace)
		{
			this.removeAllCurrentUserReactions(reactions);
		}

		reactions.ownReactions.add(reaction);
	}

	addUserToReaction(reactions: ImModelReactions, payload: SetReactionPayload)
	{
		const { userId, reaction } = payload;

		if (!reactions.reactionUsers[reaction])
		{
			reactions.reactionUsers[reaction] = new Set();
		}

		reactions.reactionUsers[reaction].add(userId);
	}

	removeAllCurrentUserReactions(reactions: ImModelReactions)
	{
		reactions.ownReactions.forEach((reaction) => {
			reactions.reactionUsers[reaction]?.delete(Core.getUserId());
			reactions.reactionCounters[reaction]--;
			if (reactions.reactionCounters[reaction] === 0)
			{
				delete reactions.reactionCounters[reaction];
			}
		});

		reactions.ownReactions = new Set();
	}

	prepareSetPayload(payload: RawReactionsList): RawReactionsList
	{
		return payload.map((item) => {
			const reactionUsers = {};
			Object.entries(item.reactionUsers).forEach(([reaction, users]) => {
				reactionUsers[reaction] = new Set(users);
			});

			return {
				...item,
				reactionUsers,
			};
		});
	}
}
