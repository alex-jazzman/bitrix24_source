/**
 * @module im/messenger/api/navigation
 */
jn.define('im/messenger/api/navigation', (require, exports, module) => {
	const { EventType } = require('im/messenger/const');

	const closeAll = () => {
		return new Promise((resolve, reject) => {
			const closeAllCompleteHandler = (wasClosedAll) => {
				BX.removeCustomEvent(EventType.navigation.closeAllComplete, closeAllCompleteHandler);

				if (wasClosedAll)
				{
					resolve();
				}
				else
				{
					reject(new Error('Navigation was not closed'));
				}
			};

			BX.addCustomEvent(EventType.navigation.closeAllComplete, closeAllCompleteHandler);
			BX.postComponentEvent(EventType.navigation.closeAll, []);
		});
	};

	/**
	 * @param {number} chatId — chatId of the parent chat (e.g. collab chatId)
	 * @return {Promise<void>}
	 */
	const openNestedNavigation = (chatId) => {
		return new Promise((resolve, reject) => {
			const completeHandler = (result) => {
				BX.removeCustomEvent(EventType.navigation.openNestedNavigationComplete, completeHandler);

				if (result.isSuccess)
				{
					resolve();
				}
				else
				{
					reject(new Error(result.errorText || 'Nested navigation was not opened'));
				}
			};

			BX.addCustomEvent(EventType.navigation.openNestedNavigationComplete, completeHandler);
			BX.postComponentEvent(EventType.navigation.openNestedNavigation, [chatId]);
		});
	};

	module.exports = {
		closeAll,
		openNestedNavigation,
	};
});
