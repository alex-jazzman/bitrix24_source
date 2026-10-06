/**
 * @module im/messenger/controller/attach-chat/chat-selector
 */
jn.define('im/messenger/controller/attach-chat/chat-selector', (require, exports, module) => {
	const { openChatSelector } = require('im/messenger/controller/attach-chat/chat-selector/src/opener');

	/**
	 * @class ChatSelector
	 */
	class ChatSelector
	{
		/**
		 * Opens the chat selector and returns the selected chat or null if dismissed.
		 *
		 * @param {Object} options
		 * @param {string|number} options.parentChatId - the project chat id (excluded from list)
		 * @param {PageManager} [options.parentWidget=PageManager]
		 * @return {Promise<{dialogId: string, chatId: number, name: string}|null>}
		 */
		static open({ parentChatId, parentWidget = PageManager })
		{
			return new Promise((resolve) => {
				let resolved = false;
				let selectedChat = null;

				// Resolve only once the selector is fully gone — onWidgetClosed after a selection,
				// onViewRemoved after a swipe-dismiss.
				const finish = () => {
					if (resolved)
					{
						return;
					}
					resolved = true;
					resolve(selectedChat);
				};

				openChatSelector(
					{
						parentChatId,
						onItemSelected: ({ item }) => {
							selectedChat = {
								dialogId: String(item.id),
								chatId: item.params?.chatId,
								name: item.title || item.params?.title || '',
							};
						},
						onWidgetClosed: finish,
						onViewRemoved: finish,
					},
					parentWidget,
				).catch((error) => {
					console.error('ChatSelector.open', error);
					finish();
				});
			});
		}
	}

	module.exports = { ChatSelector };
});
