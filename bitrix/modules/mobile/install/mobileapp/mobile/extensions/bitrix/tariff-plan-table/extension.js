/**
 * @module tariff-plan-table
 */
jn.define('tariff-plan-table', (require, exports, module) => {
	const AppTheme = require('apptheme');
	const { Loc } = require('loc');
	const { BaseTariffPlanWindowComponent, openTariffPlanCheckout, BridgeEvent } = require('tariff-plan-checkout');

	const WINDOW_TITLE = Loc.getMessage('TARIFF_PLAN_TABLE_WINDOW_TITLE');
	const TARIFF_FOCUS_UPSELL = 'upsell';

	function tableUrlFor(tariffFocus)
	{
		let query = `theme=${encodeURIComponent(AppTheme.id || '')}`;
		if (tariffFocus === TARIFF_FOCUS_UPSELL)
		{
			query += `&tariffFocus=${TARIFF_FOCUS_UPSELL}`;
		}

		return `${currentDomain}/mobile/bitrix24/index.php?${query}`;
	}

	/**
	 * @typedef {import('./types').TariffPlanTableProps} TariffPlanTableProps
	 * @extends {BaseTariffPlanWindowComponent<TariffPlanTableProps>}
	 *
	 * Tariff plan table screen: a WebView with the tariff comparison table plus the
	 * bridge glue to open checkout. Chrome-agnostic on purpose — the caller owns the
	 * surrounding widget's title and buttons (see openTariffPlanTable() below).
	 */
	class TariffPlanTableComponent extends BaseTariffPlanWindowComponent
	{
		// The table URL is built from the allowlisted focus intent and current theme,
		// unlike checkout's URL supplied directly in props.
		getUrl()
		{
			return tableUrlFor(this.props.tariffFocus);
		}

		handleEvent({ name, payload })
		{
			if (name !== BridgeEvent.OPEN_CHECKOUT)
			{
				return;
			}

			openTariffPlanCheckout({
				product: payload.product,
				parentWidget: this.layout,
			});
		}
	}

	// parentWidget is required when the caller itself lives in an opened widget; entry
	// points calling this directly pass nothing and open from PageManager.
	function openTariffPlanTable({ parentWidget, tariffFocus } = {})
	{
		const opener = parentWidget || PageManager;
		const normalizedTariffFocus = tariffFocus === TARIFF_FOCUS_UPSELL ? TARIFF_FOCUS_UPSELL : null;

		return opener.openWidget('layout', {
			modal: true,
			titleParams: {
				text: WINDOW_TITLE,
				type: 'wizard',
			},
		}).then((widget) => {
			widget.setRightButtons([
				{
					type: 'cross',
					callback: () => widget.close(),
				},
			]);
			widget.setLeftButtons([]);
			widget.showComponent(new TariffPlanTableComponent({
				layout: widget,
				testId: 'tariff-plan-table',
				tariffFocus: normalizedTariffFocus,
			}));
		}).catch(console.error);
	}

	module.exports = {
		TariffPlanTableComponent,
		openTariffPlanTable,
	};
});
