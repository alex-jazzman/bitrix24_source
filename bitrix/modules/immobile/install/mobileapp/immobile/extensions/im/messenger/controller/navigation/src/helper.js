/**
 * @module im/messenger/controller/navigation/helper
 */
jn.define('im/messenger/controller/navigation/helper', (require, exports, module) => {
	const { Type } = require('type');
	const { MessengerParams } = require('im/messenger/lib/params');

	/**
	 * @class NavigationHelper
	 */
	class NavigationHelper
	{
		static isTabAvailable(tabId)
		{
			const availableTabs = MessengerParams.get('AVAILABLE_TABS', {});

			return Boolean(availableTabs[tabId]);
		}

		static isTabIdCorrect(tabId)
		{
			const availableTabs = MessengerParams.get('AVAILABLE_TABS', {});

			return tabId in availableTabs;
		}

		/**
		 * @return {Promise<boolean>}
		 */
		static async isMessengerTabActive()
		{
			const navigationContext = await PageManager.getNavigator().getNavigationContext();

			if (Type.isBoolean(navigationContext.isTabActive))
			{
				return navigationContext.isTabActive;
			}

			return PageManager.getNavigator().isActiveTab();
		}

		static async makeMessengerTabActive()
		{
			const isTabActive = await NavigationHelper.isMessengerTabActive();
			if (!isTabActive)
			{
				await PageManager.getNavigator().makeTabActive();
			}
		}

		/**
		 * Whether the messenger tabs widget is currently covered by another
		 * widget on top (dialog, folder list, settings, bottom sheet etc.) —
		 * i.e. the user does not see the tabs widget right now. Useful to
		 * skip analytics for tab changes that happen in background.
		 *
		 * Children of the navigation context always start with the base tabs
		 * widget; any additional `layout` widget in the same context means
		 * something is on top.
		 *
		 * @return {Promise<boolean>}
		 */
		static async isMessengerTabsCovered()
		{
			try
			{
				const context = await PageManager.getNavigator().getNavigationContext();
				if (!Type.isArrayFilled(context.children))
				{
					return false;
				}

				return context.children.some((child) => child?.name === 'layout');
			}
			catch (error)
			{
				return false;
			}
		}
	}

	module.exports = { NavigationHelper };
});
