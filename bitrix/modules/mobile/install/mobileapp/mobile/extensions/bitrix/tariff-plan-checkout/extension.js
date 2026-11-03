/**
 * @module tariff-plan-checkout
 */
jn.define('tariff-plan-checkout', (require, exports, module) => {
	const AppTheme = require('apptheme');
	const { Loc } = require('loc');
	const { openQRAuth } = require('qrauth/utils');
	const { URL: parseUrl, withCurrentDomain } = require('utils/url');
	const {
		BridgeEvent,
		BridgePresentation,
	} = require('tariff-plan-checkout/src/const/bridge-event');
	const { BaseTariffPlanWindowComponent } = require('tariff-plan-checkout/src/base-window-component');
	const { TariffPlanCheckoutComponent } = require('tariff-plan-checkout/src/checkout-component');

	const WINDOW_TITLE = Loc.getMessage('TARIFF_PLAN_CHECKOUT_WINDOW_TITLE');
	const ORDER_HISTORY_PATH = '/settings/order/';

	function normalizeProductCode(product)
	{
		if (typeof product !== 'string' && typeof product !== 'number')
		{
			return null;
		}

		const productCode = String(product).trim();

		return productCode.length > 0 ? productCode : null;
	}

	function checkoutUrlFor(product)
	{
		const productCode = normalizeProductCode(product);
		if (!productCode)
		{
			return null;
		}

		let query = `mode=mobile_checkout_bridge&product=${encodeURIComponent(productCode)}`;
		if (AppTheme.id)
		{
			query += `&theme=${encodeURIComponent(AppTheme.id)}`;
		}

		return `${currentDomain}/mobile/bitrix24/index.php?${query}`;
	}

	function requestCheckoutClose(component, widget)
	{
		if (component?.canCloseImmediately?.())
		{
			widget.close();

			return;
		}

		if (!component?.webViewRef)
		{
			widget.close();

			return;
		}

		// No deadline here: the page owns the decision and answers with CLOSE_WINDOW. A blind timer
		// closed the payment window under a user who was still reading the page's own confirmation.
		component.webViewRef.sendEvent(BridgeEvent.REQUEST_CLOSE, {});
	}

	function isOrderHistoryUrl(url)
	{
		const targetUrl = parseUrl(url);
		if (!targetUrl?.href)
		{
			return false;
		}

		const portalUrl = parseUrl(withCurrentDomain(ORDER_HISTORY_PATH));
		const targetPath = targetUrl.pathname.replace(/\/+$/, '');
		const orderHistoryPath = ORDER_HISTORY_PATH.replace(/\/+$/, '');

		return ['http:', 'https:'].includes(targetUrl.protocol)
			&& targetUrl.host === portalUrl?.host
			&& targetPath === orderHistoryPath
		;
	}

	function openExternalUrl(url, presentation, parentWidget)
	{
		if (!url)
		{
			return;
		}
		if (presentation === BridgePresentation.DESKTOP_QR && isOrderHistoryUrl(url))
		{
			void openQRAuth({
				layout: parentWidget,
				redirectUrl: withCurrentDomain(ORDER_HISTORY_PATH),
				showHint: true,
				title: Loc.getMessage('TARIFF_PLAN_CHECKOUT_ORDER_HISTORY_QR_TITLE'),
				hintText: Loc.getMessage('TARIFF_PLAN_CHECKOUT_ORDER_HISTORY_QR_HINT'),
				analyticsSection: 'tariff_plan_checkout',
			}).catch(console.error);

			return;
		}

		Application.openUrl(url);
	}

	// parentWidget is required when the caller itself lives in an opened widget (e.g. the
	// table window spawning checkout); entry points calling this directly pass nothing
	// and open from PageManager.
	function openTariffPlanCheckout({ product, parentWidget } = {})
	{
		const checkoutUrl = checkoutUrlFor(product);
		if (!checkoutUrl)
		{
			return Promise.resolve();
		}

		const opener = parentWidget || PageManager;
		return opener.openWidget('layout', {
			modal: true,
			titleParams: {
				text: WINDOW_TITLE,
				type: 'wizard',
			},
		}).then((widget) => {
			const component = new TariffPlanCheckoutComponent({
				layout: widget,
				testId: 'tariff-plan-checkout',
				url: checkoutUrl,
				onOpenExternalUrl: (externalUrl, presentation) => {
					openExternalUrl(externalUrl, presentation, widget);
				},
			});

			widget.preventBottomSheetDismiss?.(true);
			widget.on?.('preventDismiss', () => requestCheckoutClose(component, widget));
			widget.setRightButtons([
				{
					type: 'cross',
					callback: () => requestCheckoutClose(component, widget),
				},
			]);

			widget.showComponent(component);
		}).catch(console.error);
	}

	module.exports = {
		// Re-exported for tariff-plan-table, which already depends on this extension —
		// its table screen is the third consumer of the shared base component, and it
		// speaks the same bridge contract. Bundle files (src/**) are private to their
		// extension and can't be required across extensions, so the public surface has to
		// go through this main module.
		BaseTariffPlanWindowComponent,
		BridgeEvent,
		openTariffPlanCheckout,
	};
});
