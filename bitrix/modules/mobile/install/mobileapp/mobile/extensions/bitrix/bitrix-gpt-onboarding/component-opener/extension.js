/**
 * @module bitrix-gpt-onboarding/component-opener
 */
jn.define('bitrix-gpt-onboarding/component-opener', (require, exports, module) => {
	const { ONBOARDING_COMPONENT_NAME } = require('bitrix-gpt-onboarding/const');

	function openBitrixGptOnboardingComponent()
	{
		PageManager.openComponent('JSStackComponent', {
			componentCode: ONBOARDING_COMPONENT_NAME,
			// eslint-disable-next-line no-undef
			scriptPath: availableComponents[ONBOARDING_COMPONENT_NAME].publicUrl,
			canOpenInDefault: true,
			rootWidget: {
				name: 'layout',
				componentCode: ONBOARDING_COMPONENT_NAME,
				settings: {
					objectName: 'layout',
					modal: true,
					backdrop: {
						disableTopInset: true,
						showOnTop: false,
						mediumPositionHeight: 10,
						forceDismissOnSwipeDown: true,
						horizontalSwipeAllowed: false,
						swipeContentAllowed: true,
						hideNavigationBar: true,
					},
				},
			},
		});
	}

	module.exports = {
		openBitrixGptOnboardingComponent,
	};
});
