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
		 * The tab to fall back to when the wanted one is gone or unknown: the first
		 * tab the server marked as available. The only place this rule lives:
		 * a literal tab id is never correct, since which tabs exist depends on the portal.
		 *
		 * @return {string|null} null when no tab is available; the caller decides what to do
		 */
		static resolveFallbackTabId()
		{
			const availableTabs = MessengerParams.get('AVAILABLE_TABS', {});

			for (const [tabId, isAvailable] of Object.entries(availableTabs))
			{
				if (isAvailable)
				{
					return tabId;
				}
			}

			return null;
		}

		/**
		 * The tab to open on start: the one the server computed, or the fallback when
		 * that value is empty or points at a tab the widget does not render.
		 *
		 * @return {string|null}
		 */
		static resolveInitialTabId()
		{
			const firstTabId = MessengerParams.get('FIRST_TAB_ID', '');
			if (NavigationHelper.isTabAvailable(firstTabId))
			{
				return firstTabId;
			}

			return NavigationHelper.resolveFallbackTabId();
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
		 * @return {Promise<boolean>}
		 */
		static async isMessengerTabsCovered()
		{
			try
			{
				const context = await PageManager.getNavigator().getNavigationContext();

				return NavigationHelper.#hasLayoutOverTabs(context);
			}
			catch (error)
			{
				return false;
			}
		}

		/**
		 * Whether anything at all stands over the messenger tabs: a widget pushed onto them,
		 * as isMessengerTabsCovered() sees it, or a modal stack presented over them, which
		 * only presentedItem of the navigation context reports. Useful to hold back a popup
		 * that would otherwise be drawn over somebody else's screen.
		 *
		 * @return {Promise<boolean>}
		 */
		static async isSomethingOverMessengerTabs()
		{
			try
			{
				const context = await PageManager.getNavigator().getNavigationContext();

				return NavigationHelper.#hasLayoutOverTabs(context) || Boolean(context.presentedItem);
			}
			catch (error)
			{
				return false;
			}
		}

		/**
		 * Children of the navigation context always start with the base tabs
		 * widget; any additional `layout` widget in the same context means
		 * something is on top.
		 *
		 * @param {object} context
		 * @return {boolean}
		 */
		static #hasLayoutOverTabs(context)
		{
			return Type.isArrayFilled(context.children)
				&& context.children.some((child) => child?.name === 'layout');
		}
	}

	module.exports = { NavigationHelper };
});
