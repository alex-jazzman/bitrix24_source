import { loadPromoGate } from '../promo-gate/promo-gate';

/**
 * The scenario of the restriction shown right after the object is opened. Whether it is due at all is
 * decided before the page is built - the header receives the sign with the context of the opening and
 * only anchors the scenario to the control of the transition to editing.
 */
export async function showPromo(anchor: HTMLElement | null): Promise<void>
{
	if (anchor === null)
	{
		return;
	}

	const gate = await loadPromoGate();
	if (gate === null || !gate.shouldShow())
	{
		return;
	}

	gate.show(anchor, true);
}
