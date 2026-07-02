/**
 * @module im/messenger/controller/folder/lib/preload-chats
 */
jn.define('im/messenger/controller/folder/lib/preload-chats', (require, exports, module) => {
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { ChatService } = require('im/messenger/provider/services/chat');

	const logger = getLoggerWithContext('folder--preload-chats', 'preloadIncompleteChats');

	// TODO drop once recent payload includes chatId for self-chat / direct user dialogs
	/**
	 * For dialogIds whose model entry lacks a real chatId (recent payload stores
	 * self-chat / direct user dialogs without it), fetch the full dialog from the
	 * server and write it back to dialoguesModel. After the call returns, callers
	 * can resolve dialogId → chatId synchronously via dialoguesModel.
	 *
	 * @param {Array<string|number>} dialogIds
	 * @return {Promise<void>}
	 */
	const preloadIncompleteChats = async (dialogIds) => {
		const store = serviceLocator.get('core')?.getStore();
		if (!store)
		{
			return;
		}

		const incomplete = dialogIds.filter((dialogId) => {
			const dialog = store.getters['dialoguesModel/getById'](dialogId);

			return !dialog || !(dialog.chatId > 0);
		});

		if (incomplete.length === 0)
		{
			return;
		}

		logger.warn('dialogIds with incomplete chat data, fetching from server', incomplete);

		const chatService = new ChatService();
		await Promise.all(incomplete.map(
			(dialogId) => chatService.getDialogByDialogId(dialogId, { skipCache: true })
				.catch((error) => {
					logger.error(`preload chat for dialogId=${dialogId} failed`, error);
				}),
		));
	};

	module.exports = { preloadIncompleteChats };
});
