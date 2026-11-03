/**
 * Decides which layer the record button opens and which layer it announces. Dependency-free on
 * purpose: no DOM, no viewPort, no module singletons, so the decision is reproducible in a test.
 */

/**
 * Routes the record button can take.
 * @readonly
 */
export const RecordRoute = Object.freeze({
	Menu: 'menu',
	Dialog: 'dialog',
	/** The tariff slider: cloud recording is not included in the tariff. */
	TariffArticle: 'tariffArticle',
	/** The helpdesk article: nothing can be recorded at all. */
	HelpArticle: 'helpArticle',
	/** The recording limit is used up; the layer behind it is decided by the view. */
	RecordLimit: 'recordLimit',
});

/**
 * Kinds of the popup layer a panel button can announce. The vocabulary is repeated in the view on
 * purpose: `call.core` does not depend on the extension that maps it onto ARIA attributes.
 * @readonly
 */
export const ButtonPopupKind = Object.freeze({
	Menu: 'menu',
	Dialog: 'dialog',
});

/**
 * @typedef {object} RecordRouteFlags
 * @property {boolean} [isServiceEnabled] - the cloud record service is enabled on the portal
 * @property {boolean} [canRecord] - anything can be recorded at all (local desktop or cloud)
 * @property {boolean} [tariffAvailable] - cloud recording is included in the tariff
 * @property {boolean} [isCloudRecordFeaturesEnabled] - cloud record features are enabled for the call
 * @property {boolean} [isDesktop] - the call runs in the desktop client
 * @property {boolean} [isRecordLimitReached] - the recording limit is used up
 */

/**
 * @typedef {object} RecordRouteDecision
 * @property {string} route - one of RecordRoute
 * @property {boolean} [isDesktopRecord] - menu route only: the menu offers the local desktop record
 */

/**
 * Decides the route of the record button.
 *
 * @param {RecordRouteFlags} flags
 * @return {RecordRouteDecision}
 */
export function resolveRecordRoute({
	isServiceEnabled,
	canRecord,
	tariffAvailable,
	isCloudRecordFeaturesEnabled,
	isDesktop,
	isRecordLimitReached,
})
{
	if (isRecordLimitReached)
	{
		return { route: RecordRoute.RecordLimit };
	}

	if (isServiceEnabled)
	{
		if (!tariffAvailable)
		{
			if (canRecord)
			{
				return { route: RecordRoute.Menu, isDesktopRecord: true };
			}

			return { route: RecordRoute.TariffArticle };
		}

		if (!isCloudRecordFeaturesEnabled && !isDesktop)
		{
			return { route: RecordRoute.Dialog };
		}

		return {
			route: RecordRoute.Menu,
			isDesktopRecord: Boolean(isCloudRecordFeaturesEnabled) && Boolean(isDesktop),
		};
	}

	if (!canRecord)
	{
		return { route: RecordRoute.HelpArticle };
	}

	return { route: RecordRoute.Menu, isDesktopRecord: true };
}

/**
 * Projects a route onto the kind of popup layer the button announces.
 *
 * @param {string} route - one of RecordRoute
 * @return {?string} one of ButtonPopupKind, or null when the route opens no popup layer
 */
export function popupKindOfRoute(route)
{
	if (route === RecordRoute.Menu)
	{
		return ButtonPopupKind.Menu;
	}

	if (route === RecordRoute.Dialog)
	{
		return ButtonPopupKind.Dialog;
	}

	return null;
}
