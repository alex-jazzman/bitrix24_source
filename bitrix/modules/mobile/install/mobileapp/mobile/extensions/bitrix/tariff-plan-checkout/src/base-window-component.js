/**
 * @module tariff-plan-checkout/src/base-window-component
 */
jn.define('tariff-plan-checkout/src/base-window-component', (require, exports, module) => {
	const { Color } = require('tokens');
	const { SpinnerLoader } = require('layout/ui/loaders/spinner');
	const { BridgeEvent } = require('tariff-plan-checkout/src/const/bridge-event');
	const { parseIncoming } = require('tariff-plan-checkout/src/bridge');
	const { createTestIdGenerator } = require('utils/test');

	// [H2] WKWebView paints white until the page's first render on real devices (the JN
	// backgroundColor style doesn't cover that window there), which flashes in the dark
	// theme. A theme-colored native cover sits on top of the WebView until the page
	// proves it has rendered by sending any bridge event. Every billing page owes that
	// event: a page whose bridge never comes up leaves the screen dead anyway, since the
	// table opens checkout over the same bridge. The cover lingers past the event because
	// the bridge can speak a frame before the first paint.
	const LOADING_COVER_LINGER_MS = 500;

	/**
	 * @typedef {import('../types').BaseTariffPlanWindowProps} BaseTariffPlanWindowProps
	 * @typedef {import('../types').BaseTariffPlanWindowState} BaseTariffPlanWindowState
	 * @extends {LayoutComponent<BaseTariffPlanWindowProps, BaseTariffPlanWindowState>}
	 *
	 * Base for a tariff plan window: a full-screen WebView with a loading cover, shared
	 * by the table screen (tariff-plan-table) and both checkout screens (checkout itself
	 * and the bare window, both here). Subclasses override getUrl() when the page's URL
	 * isn't just props.url, and handleEvent() for bridge events beyond pageReady.
	 */
	class BaseTariffPlanWindowComponent extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			if (!props.layout)
			{
				throw new Error(`${this.constructor.name}: layout property is required`);
			}

			this.layout = props.layout;
			this.webViewRef = null;
			this.getTestId = createTestIdGenerator({ prefix: props.testId || 'tariff-plan-window' });

			this.state = { pageLoaded: false };
			this.loadingCoverTimeout = null;
		}

		componentWillUnmount()
		{
			clearTimeout(this.loadingCoverTimeout);
		}

		getUrl()
		{
			return this.props.url;
		}

		// Override to react to bridge events beyond pageReady, which onReceiveEvent()
		// below already handles on its own. Receives only what parseIncoming() let through:
		// { name, payload }, both already validated against the contract.
		handleEvent()
		{
			// No-op by default.
		}

		render()
		{
			return View(
				{
					testId: this.getTestId(),
					style: {
						flex: 1,
					},
					// The keyboard is handled by the native frame resize: this wrapper
					// shrinks by the keyboard height, the WebView (flex: 1) follows it, and
					// the web page (height: 100%) fills exactly the area above the keyboard.
					// WebKit additionally scrolls the document toward the focused input —
					// that scroll is what left a strip of page background below the CTA — so
					// the page itself suppresses it by pinning the document scroll to zero.
					resizableByKeyboard: true,
				},
				WebView({
					testId: this.getTestId('webview'),
					style: {
						flex: 1,
						backgroundColor: Color.bgPrimary.toHex(),
					},
					data: {
						url: this.getUrl(),
					},
					ref: (ref) => {
						this.webViewRef = ref;
					},
					onReceiveEvent: (event, data) => this.onReceiveEvent(event, data),
				}),
				// [H2] Loading cover, see above. Rendered after the WebView so removing it
				// doesn't shift the WebView's child position on re-render.
				!this.state.pageLoaded && this.renderLoadingCover(),
			);
		}

		renderLoadingCover()
		{
			return View(
				{
					style: {
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: Color.bgPrimary.toHex(),
						alignItems: 'center',
						justifyContent: 'center',
					},
				},
				SpinnerLoader({ size: 34 }),
			);
		}

		// [H2] Any event from the page means it has rendered — hide the loading cover.
		markPageLoaded()
		{
			if (this.state.pageLoaded || this.loadingCoverTimeout)
			{
				return;
			}

			this.loadingCoverTimeout = setTimeout(
				() => this.setState({ pageLoaded: true }),
				LOADING_COVER_LINGER_MS,
			);
		}

		onReceiveEvent(event, data)
		{
			// [H2] Anything coming from the page means it has rendered — even an event outside
			// the contract, which is dropped right after.
			this.markPageLoaded();

			const incoming = parseIncoming(event, data);
			if (!incoming || incoming.name === BridgeEvent.PAGE_READY)
			{
				return;
			}

			// Part of the shared contract: every screen closes on it, so it never reaches a subclass.
			if (incoming.name === BridgeEvent.CLOSE_WINDOW)
			{
				this.layout.close();

				return;
			}

			this.handleEvent(incoming);
		}
	}

	module.exports = {
		BaseTariffPlanWindowComponent,
	};
});
