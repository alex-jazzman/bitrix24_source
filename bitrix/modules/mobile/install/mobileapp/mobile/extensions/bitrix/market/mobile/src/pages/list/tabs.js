/**
 * @module market/mobile/src/pages/list/tabs
 */
jn.define('market/mobile/src/pages/list/tabs', (require, exports, module) => {
	const { MarketListTabMode } = require('market/mobile/src/pages/list/tab-mode');

	class MarketListTabs
	{
		#mode = MarketListTabMode.NAVIGATE;
		#items = [];
		#initialTabId = '';

		constructor(props = {})
		{
			this.#mode = MarketListTabMode.resolve(props.mode);
			this.#items = MarketListTabs.normalizeItems(props.items);
			this.#initialTabId = this.#resolveInitialTabId(props.initialTabId);
		}

		static normalizeItems(items = [])
		{
			if (!Array.isArray(items))
			{
				return [];
			}

			return items
				.map((item, index) => MarketListTabs.normalizeItem(item, index))
				.filter(Boolean)
			;
		}

		static normalizeItem(item, index)
		{
			const id = String(item?.id ?? item?.code ?? index);
			const title = String(item?.title ?? item?.name ?? '');

			if (!id || !title)
			{
				return null;
			}

			const counter = MarketListTabs.normalizeCounter(item?.counter ?? item?.badgeValue);
			const label = String(item?.label ?? (counter > 0 ? counter : ''));

			return {
				id,
				title,
				active: item?.active === true,
				counter,
				label,
				selectable: item?.selectable !== false,
				url: String(item?.url ?? ''),
				payload: item?.payload ?? {},
			};
		}

		static normalizeCounter(counter)
		{
			const normalizedCounter = Number(counter);

			if (!Number.isFinite(normalizedCounter) || normalizedCounter <= 0)
			{
				return 0;
			}

			return normalizedCounter;
		}

		#resolveInitialTabId(initialTabId = '')
		{
			const normalizedInitialTabId = String(initialTabId);
			if (normalizedInitialTabId && this.getItem(normalizedInitialTabId))
			{
				return normalizedInitialTabId;
			}

			const activeItem = this.#items.find((item) => item.active === true);
			if (activeItem)
			{
				return activeItem.id;
			}

			if (this.isNavigateMode())
			{
				return '';
			}

			return this.#items[0]?.id ?? '';
		}

		isNavigateMode()
		{
			return this.#mode === MarketListTabMode.NAVIGATE;
		}

		isSwitchMode()
		{
			return this.#mode === MarketListTabMode.SWITCH;
		}

		getMode()
		{
			return this.#mode;
		}

		hasItems()
		{
			return this.#items.length > 0;
		}

		getItems()
		{
			return [...this.#items];
		}

		getInitialTabId()
		{
			return this.#initialTabId;
		}

		getItem(tabId)
		{
			const normalizedTabId = String(tabId);

			return this.#items.find((item) => item.id === normalizedTabId) ?? null;
		}

		getActionForTab(tabId)
		{
			const item = this.getItem(tabId);
			if (!item)
			{
				return null;
			}

			return {
				type: this.isSwitchMode() ? MarketListTabMode.SWITCH : MarketListTabMode.NAVIGATE,
				tabId: item.id,
				item,
			};
		}

		toSwitchWidgetItems()
		{
			if (!this.isSwitchMode())
			{
				return [];
			}

		return this.#items.map((item) => ({
			id: item.id,
			title: item.title,
			active: item.id === this.#initialTabId,
			counter: item.counter,
			label: item.label,
			selectable: item.selectable,
			widget: {
				name: 'layout',
				code: item.id,
				settings: {
					objectName: 'layout',
				},
			},
		}));
	}

		toNavigateItems()
		{
			if (!this.isNavigateMode())
			{
				return [];
			}

			return this.#items.map((item) => ({
				...item,
				active: item.id === this.#initialTabId,
			}));
		}
	}

	module.exports = {
		MarketListTabs,
	};
});
