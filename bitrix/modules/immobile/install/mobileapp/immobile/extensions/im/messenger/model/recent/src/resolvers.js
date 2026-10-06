/**
 * @module im/messenger/model/recent/resolvers
 */
jn.define('im/messenger/model/recent/resolvers', (require, exports, module) => {
	const {
		RecentFilterId,
		RecentTabByNavigationTab,
		ROOT_PARENT_CHAT_ID,
	} = require('im/messenger/const');

	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const logger = getLoggerWithContext('model--recent', 'filterResolvers');

	/**
	 * @param {string} tabId
	 * @param {Set<DialogId>} baseIds
	 * @param {MessengerStore<RecentMessengerModel>['rootGetters']} rootGetters
	 * @param {number} [parentChatId]
	 * @returns {Set<DialogId>}
	 */
	function resolveUnreadFilter(tabId, baseIds, rootGetters, parentChatId = ROOT_PARENT_CHAT_ID)
	{
		const result = new Set();
		const getByChatId = rootGetters['counterModel/getByChatId'];
		const getCounterByChatId = rootGetters['counterModel/getCounterByChatId'];
		const getNumberChildCounters = rootGetters['counterModel/getNumberChildCounters'];
		const isNested = parentChatId !== ROOT_PARENT_CHAT_ID;

		for (const dialogId of baseIds)
		{
			const dialog = rootGetters['dialoguesModel/getById'](dialogId);
			if (!dialog || !dialog.chatId)
			{
				continue;
			}

			const counterModel = getByChatId(dialog.chatId);
			if (counterModel?.isMuted)
			{
				continue;
			}

			const mainCounter = getCounterByChatId(dialog.chatId);
			const childCounters = getNumberChildCounters(dialog.chatId);
			const totalCounter = mainCounter + childCounters;
			if (totalCounter > 0)
			{
				result.add(String(dialogId));
			}
		}

		const counterMarkedAsUnread = rootGetters['counterModel/getCounterMarkedAsUnread']();
		for (const counterModel of counterMarkedAsUnread)
		{
			if (counterModel?.isMuted)
			{
				continue;
			}

			if (!counterModel?.recentSections.includes(RecentTabByNavigationTab[tabId]))
			{
				continue;
			}

			if (isNested && counterModel.parentChatId !== parentChatId)
			{
				continue;
			}

			const dialog = rootGetters['dialoguesModel/getByChatId'](counterModel.chatId);
			if (dialog && baseIds.has(String(dialog.dialogId)))
			{
				result.add(String(dialog.dialogId));
			}
		}

		logger.log('resolveUnreadFilter', { baseIds, result, parentChatId });

		return result;
	}

	const filterResolvers = {
		[RecentFilterId.unread]: resolveUnreadFilter,
	};

	module.exports = { filterResolvers };
});
