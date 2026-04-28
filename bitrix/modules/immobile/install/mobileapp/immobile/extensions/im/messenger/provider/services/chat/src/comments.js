/**
 * @module im/messenger/provider/services/chat/comments
 */
jn.define('im/messenger/provider/services/chat/comments', (require, exports, module) => {
	const { RestMethod } = require('im/messenger/const');
	const { runAction } = require('im/messenger/lib/rest');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const logger = getLoggerWithContext('dialog--chat-service', 'CommentsService');

	/**
	 * @class CommentsService
	 */
	class CommentsService
	{
		constructor()
		{
			/** @type {MessengerCoreStore} */
			this.store = serviceLocator.get('core').getStore();
		}

		subscribe(dialogId)
		{
			const dialog = this.store.getters['dialoguesModel/getById'](dialogId);

			this.store.dispatch('commentModel/subscribe', { messageId: dialog.parentMessageId });

			return runAction(RestMethod.imV2ChatCommentSubscribe, {
				data: { dialogId },
			}).catch((error) => {
				// eslint-disable-next-line no-console
				logger.error('subscribe error', error);
			});
		}

		subscribeByPostId(postId)
		{
			this.store.dispatch('commentModel/subscribe', { messageId: postId });

			return runAction(RestMethod.imV2ChatCommentSubscribe, {
				data: {
					postId,
					createIfNotExists: 'Y',
					autoJoin: 'Y',
				},
			}).catch((error) => {
				// eslint-disable-next-line no-console
				logger.error('subscribeByPostId error', error);
			});
		}

		unsubscribe(dialogId)
		{
			const dialog = this.store.getters['dialoguesModel/getById'](dialogId);
			this.store.dispatch('commentModel/unsubscribe', { messageId: dialog.parentMessageId });

			return runAction(RestMethod.imV2ChatCommentUnsubscribe, {
				data: { dialogId },
			}).catch((error) => {
				// eslint-disable-next-line no-console
				logger.error('unsubscribe error', error);
			});
		}

		unsubscribeByPostId(postId)
		{
			this.store.dispatch('commentModel/unsubscribe', { messageId: postId });

			return runAction(RestMethod.imV2ChatCommentUnsubscribe, {
				data: {
					postId,
					createIfNotExists: 'Y',
					autoJoin: 'Y',
				},
			}).catch((error) => {
				// eslint-disable-next-line no-console
				logger.error('unsubscribeByPostId error', error);
			});
		}

		readChannelComments(dialogId)
		{
			const dialog = this.store.getters['dialoguesModel/getById'](dialogId);
			if (!this.#hasCommentsCounters(dialog.chatId))
			{
				return Promise.resolve({});
			}
			this.#readChannelCommentsLocal(dialog.chatId);

			return runAction(RestMethod.imV2ChatCommentReadAll, {
				data: { dialogId },
			})
				.then(() => {
					return serviceLocator.get('counters-update-system').readChildren(dialog.chatId);
				}).catch((error) => {
					logger.error('readChannelComments error', error);
				});
		}

		// eslint-disable-next-line consistent-return
		async #readChannelCommentsLocal(chatId)
		{
			try
			{
				await this.store.dispatch('counterModel/readChildChatsCounters', {
					parentChatId: chatId,
				});
			}
			catch (error)
			{
				logger.error('readChannelCommentsLocal error', error);
			}

			const currentChannelCounter = this.store.getters['commentModel/getChannelCounters'](chatId);
			if (currentChannelCounter === 0)
			{
				return Promise.resolve();
			}

			try
			{
				await this.store.dispatch('commentModel/deleteChannelCounters', { channelId: chatId });

				serviceLocator.get('tab-counters').updateDelayed();
			}
			catch (error)
			{
				logger.error('readChannelCommentsLocal old Messenger error', error);
			}
		}

		#hasCommentsCounters(channelChatId)
		{
			const commentCounters = this.store.getters['counterModel/getNumberChildCounters'](channelChatId);

			return commentCounters > 0;
		}
	}

	module.exports = { CommentsService };
});
