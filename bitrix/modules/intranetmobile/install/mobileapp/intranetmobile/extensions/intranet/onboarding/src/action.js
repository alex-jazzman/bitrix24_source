/**
 * @module intranet/onboarding/src/action
 */
jn.define('intranet/onboarding/src/action', (require, exports, module) => {
	const { ActionBase } = require('onboarding/action');

	class Action extends ActionBase
	{
		static openInviteBox()
		{
			return async (context, onComplete) => {
				const { openIntranetInviteWidget } = require('intranet/invite-opener-new');

				openIntranetInviteWidget?.({
					analyticsSection: 'onboarding',
					openAsComponent: true,
					onHidden: onComplete,
				});
			};
		}
	}

	module.exports = {
		Action,
	};
});