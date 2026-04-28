/**
 * @module im/messenger/model/recent/resolvers
 */
jn.define('im/messenger/model/recent/resolvers', (require, exports, module) => {
	const {
		RecentFilterId,
		RecentTab,
		NavigationTabId,
	} = require('im/messenger/const');

	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const logger = getLoggerWithContext('model--recent', 'filterResolvers');

	const RecentTabByNavigationTab = {
		[NavigationTabId.chats]: RecentTab.chat,
		[NavigationTabId.copilot]: RecentTab.copilot,
		[NavigationTabId.collab]: RecentTab.collab,
		[NavigationTabId.channel]: RecentTab.openChannel,
		[NavigationTabId.task]: RecentTab.tasksTask,
		[NavigationTabId.openlines]: RecentTab.openlines,
	};

	/**
	 * @param {string} tabId
	 * @param {Set<DialogId>} baseIds
	 * @param {MessengerStore<RecentMessengerModel>['rootGetters']} rootGetters
	 * @returns {Set<DialogId>}
	 */
	function resolveUnreadFilter(tabId, baseIds, rootGetters)
	{
		const result = new Set();
		const getCounterByChatId = rootGetters['counterModel/getCounterByChatId'];
		const getNumberChildCounters = rootGetters['counterModel/getNumberChildCounters'];

		for (const dialogId of baseIds)
		{
			const dialog = rootGetters['dialoguesModel/getById'](dialogId);
			if (!dialog || !dialog.chatId)
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
			if (!counterModel?.recentSections.includes(RecentTabByNavigationTab[tabId]))
			{
				continue;
			}

			const dialog = rootGetters['dialoguesModel/getByChatId'](counterModel.chatId);
			if (dialog)
			{
				result.add(String(dialog.dialogId));
			}
		}

		logger.log('resolveUnreadFilter', { baseIds, result });

		return result;
	}

	const filterResolvers = {
		[RecentFilterId.unread]: resolveUnreadFilter,
	};

	module.exports = { filterResolvers };
});
