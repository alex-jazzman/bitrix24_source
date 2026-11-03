import { type FeatureCardAction } from '../../const/cards-section';
import { ADDRESSED_ACTION_KEYS, HANDLED_ACTION_KEYS } from '../../const/action-keys';

// Whether the secondary button of a row is drawn. A key nothing handles draws nothing, whatever its
// switch says — that gate matches the one app.ts::handleAction dispatches through. Of the keys that
// pass it, an addressed key additionally needs a live address: the page is out of this user's reach or
// is not routed on this portal at all otherwise. Every other handled key follows the row's switch alone.
export function resolveFeatureCardAction(
	action: FeatureCardAction | undefined,
	checked: boolean,
	urls: Readonly<Record<string, unknown>>,
): boolean
{
	if (!action || !checked || !HANDLED_ACTION_KEYS.has(action.actionKey))
	{
		return false;
	}

	if (!ADDRESSED_ACTION_KEYS.has(action.actionKey))
	{
		return true;
	}

	return resolveActionUrl(action.actionKey, urls) !== null;
}

// The map reaches the client through the component params, where the value type is not guaranteed, so
// a missing key and an empty string answer alike: no address.
export function resolveActionUrl(actionKey: string, urls: Readonly<Record<string, unknown>>): string | null
{
	const value = urls[actionKey];

	// Type.isStringFilled would pull main.core in, and this layer stays free of runtime imports so the
	// bare unit harness can load it.
	// eslint-disable-next-line @bitrix24/bitrix24-rules/no-typeof
	return (typeof value === 'string' && value.length > 0) ? value : null;
}
