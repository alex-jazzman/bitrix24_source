/**
 * @module im/messenger/controller/recent/locator
 */
jn.define('im/messenger/controller/recent/locator', (require, exports, module) => {
	const { ServiceLocator } = require('im/messenger/lib/di/service-locator');
	const { RecentTabByNavigationTab } = require('im/messenger/const');
	/**
	 * @param {string}          id
	 * @param {Promise<object>} ui
	 * @param {number}          [parentChatId=0]
	 * @return {RecentLocator}
	 */
	function createLocator(id, ui, parentChatId = 0)
	{
		const locator = new ServiceLocator();
		locator.add('id', id);
		locator.add('recentSection', RecentTabByNavigationTab[id]);
		locator.add('ui', ui);
		locator.add('parentChatId', parentChatId);
		locator.add('emitter', new JNEventEmitter());

		return locator;
	}

	module.exports = { createLocator };
});
