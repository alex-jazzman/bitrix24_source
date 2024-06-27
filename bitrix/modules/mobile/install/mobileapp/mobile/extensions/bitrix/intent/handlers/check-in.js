BX.addCustomEvent('onIntentHandle', (intent) => {
	const require = (ext) => jn.require(ext);
	const { Feature } = require('feature');

	/** @var {MobileIntent} intent */
	intent.addHandler(() => {
		const value = intent.check(['check-in']);
		if (value === 'check-in' && Feature.isAirStyleSupported())
		{
			requireLazy('stafftrack:entry')
				.then(({ Entry }) => {
					if (Entry)
					{
						Entry.openCheckIn({
							dialogName: null,
							dialogId: null,
						});
					}
				})
				.catch(console.error);
		}
	});
});
