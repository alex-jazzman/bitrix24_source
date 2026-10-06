const getTopBx = () => {
	try
	{
		return top?.BX || BX;
	}
	catch (error)
	{
		return BX;
	}
};

const log = (...args) => {
	if (typeof console !== 'undefined' && typeof console.info === 'function')
	{
		console.info('[LandingSiteListRealtime]', ...args);
	}
};

export const refreshSiteList = (): void => {
	const bx = getTopBx();
	if (bx && typeof bx.onCustomEvent === 'function')
	{
		log('Calling BX.Landing.Filter:apply');
		bx.onCustomEvent('BX.Landing.Filter:apply');

		return;
	}

	log('Cannot refresh: BX.onCustomEvent is unavailable', {
		hasBx: Boolean(bx),
		onCustomEventType: typeof bx?.onCustomEvent,
	});
};
