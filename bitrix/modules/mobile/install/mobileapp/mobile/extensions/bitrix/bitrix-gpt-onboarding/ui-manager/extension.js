/**
 * @module bitrix-gpt-onboarding/ui-manager
 */
jn.define('bitrix-gpt-onboarding/ui-manager', (require, exports, module) => {
	const { isModuleInstalled } = require('module');
	const { feature: nativeFeature } = require('native/feature') ?? {};
	const { Tourist } = require('tourist');
	const { BackgroundUIManager } = require('background/ui-manager');
	const {
		ONBOARDING_COMPONENT_NAME,
		ONBOARDING_TOURIST_EVENT,
	} = require('bitrix-gpt-onboarding/const');
	const { shouldShowBanner } = require('bitrix-gpt-onboarding/api');
	const { openBitrixGptOnboardingComponent } = require('bitrix-gpt-onboarding/component-opener');

	const ONBOARDING_PRIORITY = 300;

	/**
	 * @class BitrixGptOnboardingUIManager
	 */
	class BitrixGptOnboardingUIManager
	{
		/**
		 * @public
		 */
		static openComponent()
		{
			openBitrixGptOnboardingComponent();
		}

		/**
		 * @public
		 */
		static openComponentInBackground()
		{
			BackgroundUIManager.openComponent(
				ONBOARDING_COMPONENT_NAME,
				BitrixGptOnboardingUIManager.openComponent,
				ONBOARDING_PRIORITY,
			);
		}

		/**
		 * @public
		 * @return {Promise<void>}
		 */
		static async openInBackgroundIfNeeded()
		{
			if (!isModuleInstalled('im'))
			{
				return;
			}

			if (!(nativeFeature?.isFeatureEnabled?.('bitrix_gpt_brand_v1') ?? false))
			{
				return;
			}

			await Tourist.ready();

			if (!Tourist.firstTime(ONBOARDING_TOURIST_EVENT))
			{
				return;
			}

			let shouldShow = false;
			try
			{
				shouldShow = await shouldShowBanner();
			}
			catch (error)
			{
				console.error('BitrixGptOnboardingUIManager.openInBackgroundIfNeeded:', error);

				return;
			}

			if (!shouldShow)
			{
				return;
			}

			BitrixGptOnboardingUIManager.openComponentInBackground();
		}
	}

	module.exports = {
		BitrixGptOnboardingUIManager,
	};
});
