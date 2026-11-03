/**
 * @module tariff-plan-checkout/src/const/bridge-event
 */
jn.define('tariff-plan-checkout/src/const/bridge-event', (require, exports, module) => {
	// Single source of truth for the native <-> web bridge contract, shared by the
	// tariff-plan-checkout and tariff-plan-table extensions and mirrored on the web side
	// (the production checkout and tariff table bundles): renaming any value here
	// requires updating those two files too.
	const BridgeEvent = {
		PAGE_READY: 'pageReady', // web -> native; sent once a page's bridge is up
		STEP_CHANGED: 'stepChanged', // web -> native; checkout, on init and every step
		CHECKOUT_MODE_CHANGED: 'checkoutModeChanged', // web -> native; wizard vs terminal payment mode
		CLOSE_WINDOW: 'closeWindow', // web -> native; current widget asks to close
		OPEN_CHECKOUT: 'openCheckout', // web -> native; table opens checkout
		OPEN_EXTERNAL_URL: 'openExternalUrl', // web -> native; open an external app/url (СБП → system bank-app chooser)
		GO_BACK: 'goBack', // native -> web; checkout back button
		REQUEST_CLOSE: 'requestClose', // native -> web; ask page whether checkout may close
	};
	const BridgePresentation = {
		DESKTOP_QR: 'desktopQr',
	};

	module.exports = { BridgeEvent, BridgePresentation };
});
