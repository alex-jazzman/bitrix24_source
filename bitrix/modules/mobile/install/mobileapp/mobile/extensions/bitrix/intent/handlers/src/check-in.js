/**
 * @module intent/handlers/src/check-in
 */
jn.define('intent/handlers/src/check-in', (require, exports, module) => {
	const { requireLazy } = require('require-lazy');

	const openCheckIn = (openSettings) => {
		requireLazy('stafftrack:entry')
			.then(({ Entry }) => {
				if (Entry)
				{
					Entry.openCheckIn({
						dialogName: null,
						dialogId: null,
						openSettings,
					});
				}
			})
			.catch(console.error);
	};

	/**
	 * @type {IntentActionEntry[]}
	 */
	const intentActions = [
		{ codes: 'check-in', action: () => openCheckIn(false) },
		{ codes: 'check-in-settings', action: () => openCheckIn(true) },
	];

	module.exports = { intentActions };
});
