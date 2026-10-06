/**
 * @module market/app-list/tabs-preparer
 */
jn.define('market/app-list/tabs-preparer', (require, exports, module) => {
	const { MarketList } = require('market/app-list');
	const { MarketListTabs } = require('market/mobile');
	const {
		MARKET_LIST_TYPE,
		normalizeDeveloperTag,
		normalizeInstalledFilter,
		resolveListType,
	} = require('market/utils');

	const INIT_RETRY_DELAY_MS = 30;
	const MAX_INIT_RETRIES = 10;

	function getTabs(params = {})
	{
		return new MarketListTabs(params.tabs ?? {});
	}

	function getListType(params = {})
	{
		return resolveListType(params.listType ?? MARKET_LIST_TYPE.CATEGORY);
	}

	function resolveDeveloperTag(tabs, tabId, fallbackTag = '')
	{
		return normalizeDeveloperTag(tabs.getItem(tabId)?.payload?.developerTag ?? fallbackTag ?? '');
	}

	function resolveInstalledFilter(tabs, tabId, fallbackFilter = '')
	{
		return normalizeInstalledFilter(tabs.getItem(tabId)?.payload?.installedFilter ?? fallbackFilter ?? '');
	}

	function getDefaultHeaderConfig(params = {})
	{
		return {
			title: String(params.title ?? ''),
			showSortMenu: false,
		};
	}

	function getActiveListInstance(runtime = {})
	{
		return runtime.listInstances.get(runtime.activeTabId) ?? null;
	}

	function getActiveHeaderConfig(params = {}, runtime = {})
	{
		return runtime.headerConfigs.get(runtime.activeTabId) ?? getDefaultHeaderConfig(params);
	}

	function closeWidget(widget, params = {})
	{
		if (params.isNested === true && typeof widget?.back === 'function')
		{
			widget.back();

			return;
		}

		widget?.close?.();
	}

	function setBackdropLeftButtons(widget, params = {})
	{
		widget.setLeftButtons?.([
			{
				type: 'back',
				callback: () => closeWidget(widget, params),
			},
		]);
	}

	function syncWidgetHeader(tabsWidget, params = {}, runtime = {})
	{
		const headerConfig = getActiveHeaderConfig(params, runtime);

		if (typeof tabsWidget?.setTitle === 'function' && headerConfig?.title)
		{
			tabsWidget.setTitle(
				{
					text: headerConfig.title,
				},
				true,
			);
		}

		setBackdropLeftButtons(tabsWidget, params);

		if (typeof tabsWidget?.setRightButtons !== 'function')
		{
			return;
		}

		const activeListInstance = getActiveListInstance(runtime);
		if (headerConfig?.showSortMenu === true && typeof activeListInstance?.showSortMenu === 'function')
		{
			tabsWidget.setRightButtons([
				{
					id: 'market_list_tabs_more',
					type: 'more',
					callback: () => {
						activeListInstance.showSortMenu();
					},
				},
			]);

			return;
		}

		tabsWidget.setRightButtons([]);
	}

	function createMarketListProps({ params, tabs, tabId, widget, onHeaderUpdate })
	{
		const listType = getListType(params);

		const commonProps = {
			layout: widget,
			testId: `market-list-${listType}-${tabId}`,
			listType,
			hideHeader: true,
			hideTabsBar: true,
			isNested: params.isNested === true,
			onHeaderUpdate,
		};

		if (listType === MARKET_LIST_TYPE.INSTALLED)
		{
			return {
				...commonProps,
				installedFilter: resolveInstalledFilter(tabs, tabId, params.installedFilter ?? ''),
			};
		}

		return {
			...commonProps,
			categoryCode: params.categoryCode ?? '',
			developerTag: resolveDeveloperTag(tabs, tabId, params.initialTag ?? ''),
		};
	}

	function resolveNestedWidget(tabsWidget, tabId)
	{
		const nestedWidgets = tabsWidget.nestedWidgets?.() ?? {};

		return nestedWidgets[String(tabId ?? '')] ?? null;
	}

	function initTabWidget(tabsWidget, params, runtime, tabId, attempt = 0)
	{
		const normalizedTabId = String(tabId ?? '');
		if (!normalizedTabId || runtime.initializedTabs.has(normalizedTabId))
		{
			return;
		}

		const widget = resolveNestedWidget(tabsWidget, normalizedTabId);
		if (!widget)
		{
			if (attempt >= MAX_INIT_RETRIES)
			{
				console.error('market/app-list/tabs-preparer: nested widget is not ready', normalizedTabId);
			}
			else
			{
				setTimeout(() => {
					initTabWidget(tabsWidget, params, runtime, normalizedTabId, attempt + 1);
				}, INIT_RETRY_DELAY_MS);
			}

			return;
		}

		const tabs = getTabs(params);
		const marketList = MarketList(createMarketListProps({
			params,
			tabs,
			tabId: normalizedTabId,
			widget,
			onHeaderUpdate: (headerConfig) => {
				runtime.headerConfigs.set(normalizedTabId, headerConfig);

				if (runtime.activeTabId === normalizedTabId)
				{
					syncWidgetHeader(tabsWidget, params, runtime);
				}
			},
		}));

		runtime.listInstances.set(normalizedTabId, marketList);
		runtime.headerConfigs.set(normalizedTabId, marketList.getHeaderConfig?.() ?? getDefaultHeaderConfig(params));
		widget.showComponent(marketList);
		runtime.initializedTabs.add(normalizedTabId);

		if (runtime.activeTabId === normalizedTabId)
		{
			syncWidgetHeader(tabsWidget, params, runtime);
		}
	}

	function initTabNestedWidgets(tabsWidget, params = {})
	{
		const tabs = getTabs(params);
		const initialTabId = tabs.getInitialTabId();
		const runtime = {
			activeTabId: String(initialTabId ?? ''),
			initializedTabs: new Set(),
			listInstances: new Map(),
			headerConfigs: new Map(),
		};

		syncWidgetHeader(tabsWidget, params, runtime);
		if (initialTabId && typeof tabsWidget?.setActiveItem === 'function')
		{
			tabsWidget.setActiveItem(initialTabId);
		}

		initTabWidget(tabsWidget, params, runtime, initialTabId);

		tabsWidget.on('onTabSelected', (item, changed) => {
			if (!changed)
			{
				return;
			}

			runtime.activeTabId = String(item?.id ?? '');
			initTabWidget(tabsWidget, params, runtime, runtime.activeTabId);
			syncWidgetHeader(tabsWidget, params, runtime);
		});
	}

	module.exports = {
		initTabNestedWidgets,
	};
});
