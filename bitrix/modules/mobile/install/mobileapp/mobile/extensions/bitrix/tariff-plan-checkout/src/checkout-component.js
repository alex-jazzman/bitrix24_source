/**
 * @module tariff-plan-checkout/src/checkout-component
 */
jn.define('tariff-plan-checkout/src/checkout-component', (require, exports, module) => {
	const { BaseTariffPlanWindowComponent } = require('tariff-plan-checkout/src/base-window-component');
	const { BridgeEvent } = require('tariff-plan-checkout/src/const/bridge-event');

	/**
	 * @typedef {import('../types').TariffPlanCheckoutProps} TariffPlanCheckoutProps
	 * @extends {BaseTariffPlanWindowComponent<TariffPlanCheckoutProps>}
	 *
	 * Checkout screen: a WebView driving the checkout flow. The window's own title never
	 * changes after openTariffPlanCheckout() sets it, so this only manages the back
	 * button, which appears once the page reports a step past the first.
	 */
	class TariffPlanCheckoutComponent extends BaseTariffPlanWindowComponent
	{
		constructor(props)
		{
			super(props);

			// [G2] Sentinel, not a real state: forces the first updateLeftButton() call
			// below through regardless of its computed value — openWidget() has no
			// "already applied" left-buttons value to compare against.
			this.backButtonVisible = null;
			this.currentStep = 1;
			this.isTerminalMode = false;
			this.closeStrategy = 'close';

			this.updateLeftButton(1);
		}

		handleEvent({ name, payload })
		{
			if (name === BridgeEvent.OPEN_EXTERNAL_URL)
			{
				// Most links (including the СБП universal NSPK link) are opened as an external
				// intent. A presentation hint lets the main module route the order history to the
				// native desktop QR handoff without changing the event understood by older apps.
				this.props.onOpenExternalUrl?.(payload.url, payload.presentation);

				return;
			}

			if (name === BridgeEvent.STEP_CHANGED)
			{
				this.currentStep = payload.step;
				this.updateLeftButton(this.currentStep);

				return;
			}

			if (name === BridgeEvent.CHECKOUT_MODE_CHANGED)
			{
				this.isTerminalMode = payload.mode === 'terminal';
				this.closeStrategy = payload.closeStrategy;
				this.updateLeftButton(this.currentStep);
			}
		}

		canCloseImmediately()
		{
			return this.closeStrategy === 'close';
		}

		// [G2] setLeftButtons() repaints the whole navbar, wiping the gradient
		// background titleParams set at open — only call it when the back button's
		// visibility actually flips between steps, not on every stepChanged. Same guard
		// idiom as detail-card's checkToolbarPanel()/setHeader() for setTitle/
		// setLeftButtons/setRightButtons.
		updateLeftButton(step)
		{
			const showBack = !this.isTerminalMode && step > 1;
			if (showBack === this.backButtonVisible)
			{
				return;
			}

			this.backButtonVisible = showBack;

			if (showBack)
			{
				this.layout.setLeftButtons([
					{
						type: 'back',
						callback: () => this.webViewRef?.sendEvent(BridgeEvent.GO_BACK, {}),
					},
				]);

				return;
			}

			this.layout.setLeftButtons([]);
		}
	}

	module.exports = {
		TariffPlanCheckoutComponent,
	};
});
