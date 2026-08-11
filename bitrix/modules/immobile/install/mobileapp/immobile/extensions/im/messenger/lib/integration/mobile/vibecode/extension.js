/**
 * @module im/messenger/lib/integration/mobile/vibecode
 *
 * Integration point for the vibecodeconnector (cloud) team.
 *
 * This file is the isolated area for free modification. immobile only renders
 * the button and invokes onClick / reads isIndicatorVisible. All click
 * handling, popup opening, navigation, instrumentation, etc. is supposed to
 * live here.
 *
 * Contract:
 * - onClick(): invoked when the user taps the button.
 * - showIndicator(): turns on the indicator dot on the button.
 * - hideIndicator(): turns off the indicator dot on the button.
 * - isIndicatorVisible(): returns the current indicator state. Used by the
 *   button definition to render the dot dynamically.
 */
jn.define('im/messenger/lib/integration/mobile/vibecode', (require, exports, module) => {
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLogger } = require('im/messenger/lib/logger');
	const { requireLazy } = require('require-lazy');
	const { showErrorToast } = require('toast/error');

	const logger = getLogger('integration--vibecode');

	let indicatorVisible = true;

	/**
	 * Button tap handler.
	 * @return {Promise<void>}
	 */
	async function onClick()
	{
		await hideIndicator();

		const parentWidget = serviceLocator.get('recent-manager')?.recentGetter?.getCurrentRecent() ?? PageManager;

		try
		{
			const { VibeCodeCatalogOpener } = await requireLazy('vibecode/catalog/opener');
			const widget = await VibeCodeCatalogOpener.open({ parentWidget });

			if (!widget)
			{
				logger.error('onClick: failed to open vibecode catalog');
				showErrorToast({}, parentWidget);
			}
		}
		catch (error)
		{
			logger.error('onClick: failed to open vibecode catalog', error);
			showErrorToast({}, parentWidget);
		}
	}

	/**
	 * Shows the indicator dot on the button.
	 * @return {Promise<void>}
	 */
	async function showIndicator()
	{
		if (indicatorVisible)
		{
			return;
		}

		indicatorVisible = true;
		await redrawHeaderButton();
	}

	/**
	 * Hides the indicator dot on the button.
	 * @return {Promise<void>}
	 */
	async function hideIndicator()
	{
		if (!indicatorVisible)
		{
			return;
		}

		indicatorVisible = false;
		await redrawHeaderButton();
	}

	/**
	 * @return {boolean}
	 */
	function isIndicatorVisible()
	{
		return indicatorVisible;
	}

	/**
	 * @return {Promise<void>}
	 */
	async function redrawHeaderButton()
	{
		const navigationManager = serviceLocator.get('navigation-manager');
		const headerManager = serviceLocator.get('messenger-header-manager');
		const tabId = await navigationManager.getActiveTab();
		headerManager.redrawLeftButtonsIfNeeded(tabId);
	}

	module.exports = {
		onClick,
		showIndicator,
		hideIndicator,
		isIndicatorVisible,
	};
});
