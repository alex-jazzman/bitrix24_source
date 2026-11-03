/**
 * @module tariff-plan-checkout/src/bridge
 */
jn.define('tariff-plan-checkout/src/bridge', (require, exports, module) => {
	const { Type } = require('type');
	const {
		BridgeEvent,
		BridgePresentation,
	} = require('tariff-plan-checkout/src/const/bridge-event');

	// Only what the page is allowed to say. GO_BACK and REQUEST_CLOSE are what the app sends to
	// the page, so they are deliberately out: an event of the app coming from the web is not part
	// of the contract.
	const INCOMING_EVENTS = Object.freeze([
		BridgeEvent.PAGE_READY,
		BridgeEvent.STEP_CHANGED,
		BridgeEvent.CHECKOUT_MODE_CHANGED,
		BridgeEvent.CLOSE_WINDOW,
		BridgeEvent.OPEN_CHECKOUT,
		BridgeEvent.OPEN_EXTERNAL_URL,
	]);

	const EMPTY_PAYLOAD = Object.freeze({});
	const CLOSE_STRATEGIES = Object.freeze(['close', 'confirm']);
	const DEFAULT_CLOSE_STRATEGY = 'close';

	// Checked against the raw string on purpose: prepareLink() in utils/url prepends http:// to a
	// string that has no scheme, so URL('javascript:...').protocol comes back as 'http:'.
	const ALLOWED_URL_SCHEME = /^https?:\/\//i;

	function readNameFrom(source)
	{
		if (!Type.isPlainObject(source))
		{
			return '';
		}

		const name = source.eventType || source.type || source.name || source.eventName;

		return Type.isStringFilled(name) ? name : '';
	}

	function readEventName(event)
	{
		return readNameFrom(event) || readNameFrom(event.data) || readNameFrom(event.params);
	}

	function readEventData(event)
	{
		if (Type.isPlainObject(event.data))
		{
			return event.data;
		}

		if (Type.isPlainObject(event.params))
		{
			return event.params;
		}

		return {};
	}

	function readExternalUrl(url)
	{
		if (!Type.isStringFilled(url))
		{
			return null;
		}

		const trimmed = url.trim();

		return ALLOWED_URL_SCHEME.test(trimmed) ? trimmed : null;
	}

	function validateFor(name, data)
	{
		switch (name)
		{
			case BridgeEvent.STEP_CHANGED:
				return Type.isNumber(data.step) && data.step >= 1 ? { step: data.step } : null;

			case BridgeEvent.CHECKOUT_MODE_CHANGED:
				return {
					mode: Type.isStringFilled(data.mode) ? data.mode : '',
					closeStrategy: CLOSE_STRATEGIES.includes(data.closeStrategy)
						? data.closeStrategy
						: DEFAULT_CLOSE_STRATEGY,
				};

			case BridgeEvent.OPEN_CHECKOUT:
				return Type.isStringFilled(data.product) || Type.isNumber(data.product)
					? { product: data.product }
					: null;

			case BridgeEvent.OPEN_EXTERNAL_URL:
			{
				// The app hands this straight to the system URL handler, so anything but an http(s)
				// address — a deeplink, a custom scheme, javascript: — is dropped here. The СБП link
				// of NSPK is plain https and passes.
				const url = readExternalUrl(data.url);

				return url === null
					? null
					: {
						url,
						presentation: data.presentation === BridgePresentation.DESKTOP_QR
							? BridgePresentation.DESKTOP_QR
							: null,
					};
			}

			default:
				// The rest of the contract carries no payload, and whatever the page put next to the
				// name is dropped here.
				return EMPTY_PAYLOAD;
		}
	}

	/**
	 * @param {*} event as the web view hands it over, in any of the forms the page sends it
	 * @param {*} [data] payload when the web view passes the name and the data apart
	 * @return {?{ name: string, payload: object }} null when the event is outside the contract
	 */
	function parseIncoming(event, data)
	{
		const source = Type.isStringFilled(event)
			? { eventType: event, data: Type.isPlainObject(data) ? data : {} }
			: event;

		if (!Type.isPlainObject(source))
		{
			return null;
		}

		const name = readEventName(source);
		if (!INCOMING_EVENTS.includes(name))
		{
			return null;
		}

		const payload = validateFor(name, readEventData(source));

		return payload === null ? null : { name, payload };
	}

	module.exports = { parseIncoming };
});
