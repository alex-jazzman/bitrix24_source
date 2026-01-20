/**
 * @module onboarding/background
 */
jn.define('onboarding/background', (require, exports, module) => {
	const { ActiveTabStore } = require('onboarding/active-tab-store');
	const { VisitCounter } = require('onboarding/visit-counter');

	const extensionData = jnExtensionData.get('onboarding/background');
	const isFeatureEnabled = extensionData?.isOnboardingEnabled;

	/**
	 * @returns {Promise<void>}
	 */
	const initOnboarding = async () => {
		if (!isFeatureEnabled)
		{
			return;
		}
		const counter = new VisitCounter();
		await counter.increaseByOne();
		ActiveTabStore.subscribeToTabChange();
	};

	module.exports = {
		initOnboarding,
	};
});
