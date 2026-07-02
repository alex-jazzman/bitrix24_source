'use strict';

const BUTTON_CLASS = 'main-ui-filter-search-collapsed-button';

class SearchCollapsedButton
{
	constructor(search)
	{
		this.search = search;
		this.button = null;
		this.init();
	}

	init()
	{
		const container = this.search.getContainer();
		if (!container || !BX.UI || !BX.UI.ButtonManager)
		{
			return;
		}

		const node = container.querySelector(`.${BUTTON_CLASS}`);
		if (!BX.Type.isDomNode(node))
		{
			return;
		}

		try
		{
			this.button = BX.UI.ButtonManager.createFromNode(node);
		}
		catch (e)
		{
			this.button = null;

			return;
		}

		this.updateCounter();
	}

	updateCounter()
	{
		if (!this.button || !BX.Type.isFunction(this.button.hasAirDesign) || !this.button.hasAirDesign())
		{
			return;
		}

		const count = this.search.getSquares().length;

		if (count === 0)
		{
			this.button.setRightCounter(null);

			return;
		}

		this.button.setRightCounter({
			value: count,
			style: BX.UI.CounterStyle.FILLED_NO_ACCENT,
		});
	}
}

;(function() {
	BX.namespace('BX.Filter');
	BX.Filter.SearchCollapsedButton = SearchCollapsedButton;
})();
