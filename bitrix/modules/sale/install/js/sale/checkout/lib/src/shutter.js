import { InteractivityChecker } from 'ui.a11y';

// the shutters of the checkout fade in faster than this, and a browser without transitions never ends a fade
const fadeTimeout = 250;

/**
 * Focus primitives skip a transparent node, so a layer looks for its stops once the shutter has faded in.
 * A layer closed before that drops the wait with the returned call.
 */
class Shutter
{
	static whenVisible(shutter, callback)
	{
		if (shutter === null || InteractivityChecker.isVisible(shutter))
		{
			callback();

			return () => {};
		}

		let fadeTimer = null;

		const stopWaiting = () => {
			shutter.removeEventListener('transitionend', onFade);
			clearTimeout(fadeTimer);
			fadeTimer = null;
		};

		const onFade = (event) => {
			if (event.propertyName === 'opacity' && event.target === shutter)
			{
				stopWaiting();
				callback();
			}
		};

		shutter.addEventListener('transitionend', onFade);
		fadeTimer = setTimeout(() => {
			stopWaiting();
			callback();
		}, fadeTimeout);

		return stopWaiting;
	}
}

export { Shutter };
