/* eslint-disable */
type OpenAppTarget = {
	id: number;
	title: string;
	viewUrl: string | null;
	externalId: string | null;
	canOpenInIframe: boolean;
	ownerId: number;
	ownerName: string | null;
	isMine: boolean;
	iconUrl?: string | null;
	color?: string | null;
};

type OpenUrl = (url: string | null) => void;

type OpenAppPresentation = {
	title?: string;
	ownerId?: number;
	ownerName?: string | null;
	isMine?: boolean;
	iconUrl?: string | null;
	color?: string | null;
};

type OpenAppLayout = {
	html: string;
	title: string;
	errorCode: string;
	iconUrl: string | null;
	color: string | null;
};

declare namespace BX.Vibecodeconnector.OpenApp {
	function openUrl(url: string | null): void;

	function hasCatalogAppOpenTarget(itemId: number, viewUrl: string | null, canOpenInIframe?: boolean, externalId?: string | null): boolean;

	function openCatalogApp(target: OpenAppTarget, openFallback?: OpenUrl): boolean;

	/**
	 * Opens the app slider by catalog item id, taking the presentation of the card
	 * from the caller. The layout carries the authoritative title and, when the app
	 * has no external id yet, sends the viewer to the app page instead.
	 */
	function openAppSlider(itemId: number, presentation?: OpenAppPresentation): boolean;

	/**
	 * Opens a catalog item known only by its id: the launch action resolves what the
	 * card actually is, and anything that is not an app falls back to the app page.
	 */
	function openCatalogAppById(catalogItemId: number, openFallback?: OpenUrl): Promise<boolean>;

	function buildAppPageUrl(itemId: number): string | null;
}
