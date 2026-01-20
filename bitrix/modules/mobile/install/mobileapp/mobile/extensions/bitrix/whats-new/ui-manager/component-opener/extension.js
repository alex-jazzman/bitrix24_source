/**
 * @module whats-new/ui-manager/component-opener
 */
jn.define('whats-new/ui-manager/component-opener', (require, exports, module) => {
	const { Color } = require('tokens');

	const WHATS_NEW_COMPONENT_NAME = 'whats.new';

	class ComponentOpener
	{
		/**
		 * @public
		 * @return {void}
		 */
		static open()
		{
			// prevent open background component
			BX.postComponentEvent(
				'BackgroundUIManagerEvents::tryToOpenComponentFromAnotherContext',
				[
					{
						componentName: 'whats-new',
						priority: 99999,
						debounceMs: 0,
					},
				],
			);

			PageManager.openComponent('JSStackComponent', {
				componentCode: WHATS_NEW_COMPONENT_NAME,
				// eslint-disable-next-line no-undef
				scriptPath: availableComponents[WHATS_NEW_COMPONENT_NAME].publicUrl,
				canOpenInDefault: true,
				rootWidget: {
					name: 'layout',
					componentCode: WHATS_NEW_COMPONENT_NAME,
					settings: {
						objectName: 'layout',
						modal: true,
						backgroundColor: Color.accentSoftBlue3.toHex(),
						backdrop: {
							disableTopInset: true,
							showOnTop: true,
							forceDismissOnSwipeDown: true,
							horizontalSwipeAllowed: false,
							swipeContentAllowed: true,
							hideNavigationBar: true,
						},
					},
				},
			});
		}
	}

	module.exports = {
		ComponentOpener,
		WHATS_NEW_COMPONENT_NAME,
	};
});
