import { Type } from 'main.core';

export function hide(element: any): void
{
	if (Type.isElementNode(element))
	{
		BX.hide(element);
	}
}

export function show(element: any): void
{
	if (Type.isElementNode(element))
	{
		BX.show(element);
	}
}

type GoskeyLitePromoParams = {
	providers?: ?Array<{ code: string, ... }>,
	goskeyLiteAvailable?: ?boolean,
	region?: ?string,
	documentInitiatedType?: ?string,
	goskeyCode: string,
	goskeyLiteCode: string,
	employeeInitiatedType: string,
};

/**
 * Decides whether the "connect the new (simplified) Goskey" promo should be shown.
 *
 * The promo targets clients that already rely on the legacy Goskey but have not connected the
 * simplified one yet. It is shown once per user — the caller persists the visit through sign.tour
 * the moment the promo appears, exactly like the legacy Goskey promo, so this predicate only
 * decides the audience, not the frequency. It is limited to
 * the same audience as the base provider tour (Russian region, not employee-initiated). It is gated
 * by the real goskey-lite availability signal (global switch + allowlist) that the backend derives
 * from the manual-connect provider codes and exposes on the company payload: the CTA would lead
 * nowhere if the simplified Goskey cannot be connected by this client.
 */
export function isGoskeyLitePromoAllowed(params: GoskeyLitePromoParams): boolean
{
	const {
		providers,
		goskeyLiteAvailable,
		region,
		documentInitiatedType,
		goskeyCode,
		goskeyLiteCode,
		employeeInitiatedType,
	} = params;

	if (region !== 'ru' || documentInitiatedType === employeeInitiatedType)
	{
		return false;
	}

	if (goskeyLiteAvailable !== true)
	{
		return false;
	}

	const codes = (Type.isArray(providers) ? providers : []).map((provider) => provider?.code);
	const hasConnectedGoskey = codes.includes(goskeyCode);
	const hasConnectedGoskeyLite = codes.includes(goskeyLiteCode);

	return hasConnectedGoskey && !hasConnectedGoskeyLite;
}
