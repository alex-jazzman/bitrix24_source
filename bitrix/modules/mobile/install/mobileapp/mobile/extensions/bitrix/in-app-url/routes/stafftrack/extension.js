/**
 * @module in-app-url/routes/stafftrack
 */
jn.define('in-app-url/routes/stafftrack', (require, exports, module) => {
	const { isModuleInstalled } = require('module');
	const { requireLazy } = require('require-lazy');

	let checkInOpeningPromise = null;

	module.exports = function(inAppUrl) {
		inAppUrl.register('/check-in', (params, { context } = {}) => {
			if (!isModuleInstalled('stafftrack'))
			{
				return null;
			}

			if (checkInOpeningPromise)
			{
				return checkInOpeningPromise;
			}

			// the entry point that opened the link; a link opened without one leaves the source to the form
			const { analyticsElement } = context ?? {};

			checkInOpeningPromise = requireLazy('stafftrack:entry')
				.then(({ Entry }) => Entry.openCheckIn(analyticsElement ? { analyticsElement } : {}))
				.finally(() => {
					checkInOpeningPromise = null;
				});

			return checkInOpeningPromise;
		}).name('stafftrack:check-in');
	};
});
