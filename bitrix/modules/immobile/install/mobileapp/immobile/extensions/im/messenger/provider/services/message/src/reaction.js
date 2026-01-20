/* eslint-disable flowtype/require-return-type */
/* eslint-disable bitrix-rules/no-bx */
/* eslint-disable bitrix-rules/no-pseudo-private */

/**
 * @module im/messenger/provider/services/message/reaction
 */
jn.define('im/messenger/provider/services/message/reaction', (require, exports, module) => {
	const { Type } = require('type');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { Logger } = require('im/messenger/lib/logger');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { RestMethod, ErrorType } = require('im/messenger/const');
	const { UuidManager } = require('im/messenger/lib/uuid-manager');
	const { runAction } = require('im/messenger/lib/rest');

	/**
	 * @class ReactionService
	 */
	class ReactionService
	{
		constructor({ chatId })
		{
			/** @type {MessengerCoreStore} */
			this.store = serviceLocator.get('core').getStore();
			this.chatId = chatId;
		}

		/**
		 * @param {string} reaction
		 * @param {number} messageId
		 * @param {object} options
		 * @param {boolean} options.shouldAnimated
		 * @param {boolean} options.isUpdateUi
		 */
		set(reaction, messageId, options)
		{
			const reactions = this.store.getters['messagesModel/reactionsModel/getByMessageId'](messageId);

			if (reactions && reactions.ownReactions.has(reaction))
			{
				this.remove(reaction, messageId, options);
			}
			else
			{
				this.add(reaction, messageId, options);
			}
		}

		/**
		 * @param {ReactionType} reaction
		 * @param {number} messageId
		 * @param {boolean} shouldAnimated
		 * @param {boolean} isUpdateUi
		 */
		add(reaction, messageId, { shouldAnimated = false, isUpdateUi = false })
		{
			Logger.warn('ReactionService: add', reaction, messageId);

			/** @type {ReactionsModelSetReactionPayload} */
			const storeParams = {
				messageId,
				reaction,
				userId: MessengerParams.getUserId(),
			};

			if (shouldAnimated)
			{
				this.store.dispatch('messagesModel/reactionsModel/setReaction', storeParams);

				this.store.dispatch('messagesModel/updateReactionState', {
					id: messageId,
					fields: {
						reactionsViewed: false,
						lastReactionId: reaction,
					},
				});
			}
			else if (isUpdateUi)
			{
				this.store.dispatch('messagesModel/reactionsModel/setReaction', storeParams);
			}
			else
			{
				this.store.dispatch('messagesModel/reactionsModel/setReactionSilent', storeParams);
			}

			const queryParams = {
				messageId,
				reaction,
				actionUuid: UuidManager.getInstance().getActionUuid(),
			};

			runAction(RestMethod.imV2ChatMessageReactionAdd, { data: queryParams }).catch((errors) => {
				Logger.error('ReactionService.add error:', errors);

				const isAlreadySetError = Type.isArrayFilled(errors)
					&& errors.some((error) => error.code === ErrorType.reaction.reactionAlreadySet);
				if (isAlreadySetError)
				{
					return;
				}

				this.store.dispatch('messagesModel/reactionsModel/removeReaction', storeParams);
			});
		}

		/**
		 * @param {ReactionType} reaction
		 * @param {number} messageId
		 * @param {boolean} isUpdateUi
		 */
		remove(reaction, messageId, { isUpdateUi = false })
		{
			Logger.warn('ReactionService: remove', reaction, messageId);

			/** @type {ReactionsModelSetReactionPayload} */
			const storeParams = {
				messageId,
				reaction,
				userId: MessengerParams.getUserId(),
			};

			const modelAction = isUpdateUi ? 'messagesModel/reactionsModel/removeReaction' : 'messagesModel/reactionsModel/removeReactionSilent';
			this.store.dispatch(modelAction, storeParams);

			const queryParams = {
				reaction,
				messageId,
				actionUuid: UuidManager.getInstance().getActionUuid(),
			};

			runAction(RestMethod.imV2ChatMessageReactionDelete, { data: queryParams }).catch((errors) => {
				Logger.error('ReactionService.remove error:', errors);

				const isNotFoundError = Type.isArrayFilled(errors)
					&& errors.some((error) => error.code === ErrorType.reaction.reactionNotFound);
				if (isNotFoundError)
				{
					return;
				}

				this.store.dispatch('messagesModel/reactionsModel/removeReaction', storeParams);
			});
		}
	}

	module.exports = {
		ReactionService,
	};
});
