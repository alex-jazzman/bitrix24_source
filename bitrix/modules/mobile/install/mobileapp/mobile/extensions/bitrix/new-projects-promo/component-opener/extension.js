/**
 * @module new-projects-promo/component-opener
 */
jn.define('new-projects-promo/component-opener', (require, exports, module) => {
	const { COMPONENT_NAME } = require('new-projects-promo/const');

	/**
	 * @return {void}
	 */
	function openNewProjectsPromo()
	{
		PageManager.openComponent('JSStackComponent', {
			componentCode: COMPONENT_NAME,
			// eslint-disable-next-line no-undef
			scriptPath: availableComponents[COMPONENT_NAME].publicUrl,
			canOpenInDefault: true,
			rootWidget: {
				name: 'layout',
				componentCode: COMPONENT_NAME,
				settings: {
					objectName: 'layout',
					modal: true,
					backdrop: {
						disableTopInset: true,
						showOnTop: false,
						mediumPositionPercent: 75,
						shouldResizeContent: true,
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
		openNewProjectsPromo,
	};
});
