/**
 * @module im/messenger/application/lib/dialog-manager/src/nested-strategy/nested-navigation
 */
jn.define('im/messenger/application/lib/dialog-manager/src/nested-strategy/nested-navigation', (require, exports, module) => {
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { BaseNestedStrategy } = require('im/messenger/application/lib/dialog-manager/src/nested-strategy/base');

	/**
	 * @class NestedNavigationStrategy
	 *
	 * Opens nested tab navigation for the parent chat before opening the nested dialog.
	 * Skips if nested navigation for this parent is already open.
	 */
	class NestedNavigationStrategy extends BaseNestedStrategy
	{
		/**
		 * @param {DialogHelper} dialogHelper
		 * @return {boolean}
		 */
		shouldApply(dialogHelper)
		{
			return dialogHelper.isCollab || dialogHelper.isNested;
		}

		/**
		 * @param {DialogHelper} dialogHelper
		 * @return {Promise<void>}
		 */
		async execute(dialogHelper)
		{
			const navigationManager = serviceLocator.get('navigation-manager');
			if (!navigationManager)
			{
				return;
			}

			const chatId = dialogHelper.isCollab ? dialogHelper.chatId : dialogHelper.parentChatId;

			if (navigationManager.isTopNestedNavigationForChat(chatId))
			{
				return;
			}

			await navigationManager.openNestedNavigation(chatId);
		}
	}

	module.exports = { NestedNavigationStrategy };
});
