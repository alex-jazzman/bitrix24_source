/**
 * @module im/messenger/provider/services/chat/get
 */
jn.define('im/messenger/provider/services/chat/get', (require, exports, module) => {
	const { Type } = require('type');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { ChatDataProvider } = require('im/messenger/provider/data');
	const { ChatDataExtractor } = require('im/messenger/provider/services/lib/chat-data-extractor');
	const { RestMethod } = require('im/messenger/const');
	const { runAction } = require('im/messenger/lib/rest');

	const logger = getLoggerWithContext('chat-service--get', 'ChatGetService');

	/**
	 * @class ChatGetService
	 */
	class ChatGetService
	{
		/** @type {ChatDataProvider} */
		#chatDataProvider;

		constructor()
		{
			this.store = serviceLocator.get('core').getStore();
			this.#chatDataProvider = new ChatDataProvider();
		}

		/**
		 * @param {string} dialogId
		 * @param {object} [options]
		 * @param {boolean} [options.skipCache=false] — bypass model/database cache and fetch from server.
		 *   Use when cached entry may be incomplete (e.g. recent payload without chatId for direct user dialogs).
		 * @return {Promise<DialoguesModelState|null>}
		 * @throws {Array<{code: string, message: string}>} REST API errors (e.g. ACCESS_DENIED, CHAT_NOT_FOUND)
		 */
		async getByDialogId(dialogId, { skipCache = false } = {})
		{
			if (!skipCache)
			{
				const result = await this.#chatDataProvider.get({ dialogId });
				if (result.hasData())
				{
					return result.getData();
				}
			}

			const actionResult = await runAction(RestMethod.imV2ChatGet, {
				data: { dialogId },
			});

			const extractor = new ChatDataExtractor(actionResult);
			const dialogFromServer = extractor.getMainChat();
			const parentChat = extractor.getParentChat();

			await this.store.dispatch('dialoguesModel/set', dialogFromServer);

			if (Type.isPlainObject(parentChat))
			{
				await this.store.dispatch('dialoguesModel/setShortFormat', [parentChat]);
			}

			const dialog = this.store.getters['dialoguesModel/getById'](dialogId);

			logger.log('getByDialogId complete:', dialogId, dialog);

			return dialog;
		}
	}

	module.exports = { ChatGetService };
});
