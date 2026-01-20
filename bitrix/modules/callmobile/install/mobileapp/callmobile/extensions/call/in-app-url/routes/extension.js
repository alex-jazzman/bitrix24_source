jn.define('call/in-app-url/routes', (require, exports, module) => {
	const { Color } = require('tokens');

	const openFollowup = (callId) => {
		PageManager.openComponent('JSStackComponent', {
			scriptPath: availableComponents['call:followup'].publicUrl,
			componentCode: 'CoPilot Follow-up',
			canOpenInDefault: true,
			params: {
				callId,
			},
			rootWidget: {
				name: 'layout',
				settings: {
					objectName: 'layoutWidget',
					titleParams: {
						text: BX.message('MOBILE_CALL_COPILOT_COMPONENT_TITLE'),
						type: 'entity',
						textColor: Color.base4.toHex(),
					},
				}
			}
		})
	}

	/**
	 * @param {InAppUrl} inAppUrl
	 */
	module.exports = (inAppUrl) => {
		inAppUrl.register(
			'/call/detail/:callId',
			({ callId }) => openFollowup(callId),
		).name('call:followup');

		inAppUrl.register(
			'/call/?callId=:callId',
			({ callId }) => openFollowup(callId),
		).name('call:followup');
	};
});
