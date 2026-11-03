/**
 * @module im/messenger/provider/services/read/src/service
 */
jn.define('im/messenger/provider/services/read/src/service', (require, exports, module) => {
	const { Type } = require('type');
	const {
		RestMethod,
	} = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { runAction, callMethod } = require('im/messenger/lib/rest');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	/**
	 * @class ReadMessageService
	 */
	class ReadMessageService
	{
		#core = serviceLocator.get('core');

		constructor()
		{
			this.logger = getLoggerWithContext('counters--read-message-service', this);
		}

		async readAllMessages()
		{
			await this.#core.getStore().dispatch('anchorModel/clear').catch((error) => {
				this.logger.error('readAllMessages anchorModel/clear error: ', error);
			});

			await this.#core.getStore().dispatch('counterModel/readAllChats').catch((error) => {
				this.logger.error('readAllMessages counterModel/readAllChats error: ', error);
			});

			await this.#core.getStore().dispatch('recentModel/readAllChats').catch((error) => {
				this.logger.error('readAllMessages recentModel/readAllChats error: ', error);
			});

			await callMethod(RestMethod.imV2ChatReadAll, {}).catch((error) => {
				this.logger.error('readAllMessages imV2ChatReadAll error: ', error);
			});

			await serviceLocator.get('counters-update-system').readAllChats();
		}

		async readAllMessagesByRecentSection(recentSection, parentChatId = null)
		{
			if (!Type.isStringFilled(recentSection))
			{
				this.logger.error('readAllMessagesByRecentSection: invalid recentSection', recentSection);

				return;
			}

			const countersUpdateSystem = serviceLocator.get('counters-update-system');

			// Optimistic in-memory clear only; the local DB is updated after the backend call returns,
			// so an interrupted request keeps the original counters for the next app start (same as readAllMessages).
			const clearedChatIds = await countersUpdateSystem.readByRecentSectionInVuex(recentSection, parentChatId);

			// Anchors are a separate data zone from counters and don't always go together: a REACTION anchor
			// doesn't bump a counter, so we clear anchors for every chat of the recent section (from recentModel),
			// not just the chats whose counters changed. Cleared here optimistically, like anchorModel/clear in readAllMessages.
			const store = this.#core.getStore();
			const anchorChatIdList = store.getters['recentModel/getChatIdListByRecentSection'](recentSection, parentChatId);
			await store.dispatch('anchorModel/clearByChatIdList', { chatIdList: anchorChatIdList })
				.catch((error) => {
					this.logger.error('readAllMessagesByRecentSection anchorModel/clearByChatIdList error: ', error);
				});

			await runAction(RestMethod.imV2ChatReadByRecentSection, {
				data: {
					recentSection,
					parentId: parentChatId,
				},
			}).catch((error) => {
				this.logger.error('readAllMessagesByRecentSection imV2ChatReadByRecentSection error: ', error);
			});

			await countersUpdateSystem.persistReadByRecentSection(clearedChatIds);
		}

		/**
		 * @param {number} parentChatId
		 * @return {Promise<void>}
		 */
		async readChatWithChildren(parentChatId)
		{
			if (!Type.isNumber(parentChatId) || parentChatId <= 0)
			{
				this.logger.error('readChatWithChildren: invalid parentChatId', parentChatId);

				return;
			}

			const dialog = this.#core.getStore().getters['dialoguesModel/getByChatId'](parentChatId);
			if (!dialog?.dialogId)
			{
				this.logger.error('readChatWithChildren: dialog not found for chatId', parentChatId);

				return;
			}

			const countersUpdateSystem = serviceLocator.get('counters-update-system');
			await countersUpdateSystem.readChat(parentChatId).catch((error) => {
				this.logger.error('readChatWithChildren readChat error', error);
			});
			await countersUpdateSystem.readChildren(parentChatId).catch((error) => {
				this.logger.error('readChatWithChildren readChildren error', error);
			});

			await runAction(RestMethod.imV2ChatRead, {
				data: { dialogId: dialog.dialogId },
			}).catch((error) => {
				this.logger.error('readChatWithChildren imV2ChatRead error', error);
			});
		}
	}

	module.exports = { ReadMessageService };
});
