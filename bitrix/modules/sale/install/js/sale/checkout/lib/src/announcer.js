import { Runtime, Type } from 'main.core';
import { LiveAnnouncer } from 'ui.a11y';

// outlasts the price animation and typing in the quantity field: one announcement per recalculation
const recalculationDelay = 700;

function speak(message, politeness)
{
	if (!Type.isStringFilled(message))
	{
		return;
	}

	LiveAnnouncer.announce(message, politeness);
}

const speakRecalculation = Runtime.debounce((message) => speak(message, 'polite'), recalculationDelay);

/**
 * The only speaker of the checkout: its live region belongs to ui.a11y and survives focus trap isolation.
 */
class Announcer
{
	static announce(message)
	{
		speak(message, 'polite');
	}

	static announceError(message)
	{
		speak(message, 'assertive');
	}

	static announceRecalculation(message)
	{
		speakRecalculation(message);
	}
}

export { Announcer };
