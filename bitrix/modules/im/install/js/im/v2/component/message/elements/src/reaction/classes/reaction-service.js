import { Core } from 'im.v2.application.core';
import { RestMethod } from 'im.v2.const';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { Logger } from 'im.v2.lib.logger';
import { runAction } from 'im.v2.lib.rest';

export class ReactionService
{
	setReaction(messageId: number, reaction: string): void
	{
		Logger.warn('ReactionService: setReaction', messageId, reaction);
		const payload = {
			data: {
				messageId,
				reaction,
			},
		};

		const canSetMultipleReactions = FeatureManager.isFeatureAvailable(Feature.reactionsV2Available);

		void Core.getStore().dispatch('messages/reactions/setReaction', {
			messageId,
			reaction,
			userId: Core.getUserId(),
			withReplace: !canSetMultipleReactions,
		});

		runAction(RestMethod.imV2ChatMessageReactionAdd, payload)
			.catch(([error]) => {
				console.error('ReactionService: error setting reaction', error);
			});
	}

	removeReaction(messageId: number, reaction: string): void
	{
		Logger.warn('ReactionService: removeReaction', messageId, reaction);
		const payload = {
			data: {
				messageId,
				reaction,
			},
		};
		void Core.getStore().dispatch('messages/reactions/removeReaction', {
			messageId,
			reaction,
			userId: Core.getUserId(),
		});

		runAction(RestMethod.imV2ChatMessageReactionDelete, payload)
			.catch(([error]) => {
				console.error('ReactionService: error removing reaction', error);
			});
	}
}
