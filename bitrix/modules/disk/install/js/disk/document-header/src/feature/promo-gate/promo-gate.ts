import { Runtime } from 'main.core';
import type { AnalyticsOptions } from 'ui.analytics';

/**
 * The gate of the restrictions of editing: the tariff and the limit of simultaneous sessions. It knows
 * on its own whether a scenario of the restriction is due and which one, so the header only asks it and
 * points at the control the scenario binds itself to.
 */
export type PromoGate = {
	shouldShow: () => boolean,
	show: (target: HTMLElement | null, needOverlay: boolean) => void,
};

type PromoActionsExtension = {
	OnlyOfficePromoActions: new (isCreate: boolean, analytics: Partial<AnalyticsOptions> | null) => PromoGate,
};

/**
 * How long a transition waits for the gate. The loader of the core retries a refused load with pauses
 * of one, three and five seconds, and with no network at all it waits for the network to come back, so
 * the control which asked would stay silent far longer than a person reads as an answer. The wait ends
 * well before those retries do, while a slow network still fits into it.
 */
export const PromoGateLoadLimit = 3000;

/**
 * The gate is loaded on demand. A refused load leaves the object open: the limit is kept by the server
 * as well, so the editor answers with the scenario of the restriction itself instead of the promo.
 * A caller holding a person waiting hands a limit of its own; without it the load is awaited for as
 * long as it takes, because a scenario shown late is still a scenario shown.
 */
export async function loadPromoGate(
	analytics: Partial<AnalyticsOptions> | null = null,
	limitMs: number | null = null,
): Promise<PromoGate | null>
{
	try
	{
		const extension = await (limitMs === null ? loadPackage() : loadPackageWithin(limitMs));

		return extension === null ? null : new extension.OnlyOfficePromoActions(false, analytics);
	}
	catch
	{
		return null;
	}
}

/** A load outlasting the limit counts as a refused one, and a package arriving after it builds no gate. */
async function loadPackageWithin(limitMs: number): Promise<PromoActionsExtension | null>
{
	let giveUp: ReturnType<typeof setTimeout> | null = null;
	const expiration = new Promise<null>((resolve) => {
		giveUp = setTimeout(() => resolve(null), limitMs);
	});

	try
	{
		return await Promise.race([loadPackage(), expiration]);
	}
	finally
	{
		if (giveUp !== null)
		{
			clearTimeout(giveUp);
		}
	}
}

function loadPackage(): Promise<PromoActionsExtension>
{
	return Runtime.loadExtension('disk.onlyoffice-promo-actions') as unknown as Promise<PromoActionsExtension>;
}
