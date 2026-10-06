/**
 * @module market/app-list/opener
 */
jn.define('market/app-list/opener', (require, exports, module) => {
	const { MarketList } = require('market/app-list');
	const { initTabNestedWidgets } = require('market/app-list/tabs-preparer');
	const { MarketListOpenerLoadingScreen } = require('market/app-list/opener/src/loading-screen');
	const { Loc } = require('loc');
	const {
		getActionErrors,
		MARKET_LIST_TYPE,
		normalizeDeveloperTag,
		normalizeInstalledFilter,
		resolveListType,
	} = require('market/utils');
	const { MarketListTabs } = require('market/mobile');

	const LOADING_TAB_ID = '__all__';
	const INSTALLED_FILTER_UPDATES = 'updates';
	const INIT_RETRY_DELAY_MS = 30;
	const MAX_INIT_RETRIES = 10;
	const loadingComponentStates = new WeakMap();
	const COMMON_BACKDROP = {
		showOnTop: true,
		onlyMediumPosition: true,
		mediumPositionPercent: 90,
		horizontalSwipeAllowed: false,
	};

	/**
	 * @typedef {object} MarketListOpenParams
	 * @property {string} [listType]
	 * @property {string} [categoryCode]
	 * @property {string} [initialTag]
	 * @property {string} [installedFilter]
	 * @property {string} [title]
	 * @property {PageManager|LayoutWidget} [parentWidget]
	 */

	/**
	 * @typedef {MarketListOpenParams & {
	 *   useBackdrop?: boolean,
	 *   isNested?: boolean,
	 * }} MarketListOpenInternalParams
	 */

	function getLayoutBackdropParams()
	{
		return {
			...COMMON_BACKDROP,
			hideNavigationBar: false,
			swipeContentAllowed: true,
		};
	}

	function getTabsBackdropParams()
	{
		return {
			...COMMON_BACKDROP,
			hideNavigationBar: false,
			swipeContentAllowed: false,
		};
	}

	class MarketListOpener
	{
		/**
		 * @param {MarketListOpenParams} openParams
		 * @return {Promise<void>}
		 */
		static async open(openParams = {})
		{
			const {
				listType = MARKET_LIST_TYPE.CATEGORY,
				categoryCode = '',
				initialTag = '',
				installedFilter = '',
				title = '',
				parentWidget = PageManager,
			} = openParams;

			await MarketListOpener.#open({
				listType,
				categoryCode,
				initialTag,
				installedFilter,
				title,
				parentWidget,
				useBackdrop: true,
				isNested: false,
			});
		}

		/**
		 * @param {MarketListOpenParams} openParams
		 * @return {Promise<void>}
		 */
		static async openNested(openParams = {})
		{
			const {
				listType = MARKET_LIST_TYPE.CATEGORY,
				categoryCode = '',
				initialTag = '',
				installedFilter = '',
				title = '',
				parentWidget = PageManager,
			} = openParams;

			await MarketListOpener.#open({
				listType,
				categoryCode,
				initialTag,
				installedFilter,
				title,
				parentWidget,
				useBackdrop: false,
				isNested: true,
			});
		}

		/**
		 * @param {MarketListOpenInternalParams} openParams
		 * @return {Promise<void>}
		 */
		static async #open(openParams = {})
		{
			const {
				listType = MARKET_LIST_TYPE.CATEGORY,
				categoryCode = '',
				initialTag = '',
				installedFilter = '',
				title = '',
				parentWidget = PageManager,
				useBackdrop = true,
				isNested = false,
			} = openParams;

			const normalizedListType = resolveListType(listType);

			if (normalizedListType === MARKET_LIST_TYPE.CATEGORY && !categoryCode)
			{
				return;
			}

			const normalizedInitialTag = normalizeDeveloperTag(initialTag);
			const normalizedInstalledFilter = normalizeInstalledFilter(installedFilter);
			const initialTitle = String(title ?? '').trim();

			if (normalizedListType === MARKET_LIST_TYPE.INSTALLED)
			{
				MarketListOpener.#openInstalledTabsComponent({
					installedFilter: normalizedInstalledFilter,
					parentWidget,
					useBackdrop,
					isNested,
				});

				return;
			}

			const shouldOpenLoadingTabs = isNested || normalizedInitialTag !== '';

			if (shouldOpenLoadingTabs)
			{
				await MarketListOpener.#openWithLoadingTabs({
					listType: normalizedListType,
					categoryCode,
					initialTag: normalizedInitialTag,
					installedFilter: normalizedInstalledFilter,
					title: initialTitle,
					parentWidget,
					useBackdrop,
					isNested,
				});

				return;
			}

			const loadingLayoutWidget = await MarketListOpener.#openLoadingComponent({
				title: initialTitle || Loc.getMessage('MOBILE_MARKET_LIST_OPENER_TITLE'),
				parentWidget,
				useBackdrop,
			});

			if (!loadingLayoutWidget)
			{
				return;
			}

			const bootstrapData = await MarketListOpener.#loadListData({
				listType: normalizedListType,
				categoryCode,
				developerTag: normalizedInitialTag,
				installedFilter: normalizedInstalledFilter,
			});

			if (MarketListOpener.#isLoadingComponentClosed(loadingLayoutWidget))
			{
				return;
			}

			const tabs = new MarketListTabs(bootstrapData?.tabs ?? {});

			if (bootstrapData && tabs.isSwitchMode() && tabs.hasItems())
			{
				MarketListOpener.#replaceLoadingWithTabsComponent({
					loadingLayoutWidget,
					listType: normalizedListType,
					categoryCode,
					initialTag: normalizedInitialTag,
					installedFilter: normalizedInstalledFilter,
					title: initialTitle || bootstrapData?.title || '',
					tabsData: bootstrapData?.tabs ?? {},
					parentWidget,
					tabs,
					useBackdrop,
					isNested,
				});

				return;
			}

			MarketListOpener.#showLayoutComponent({
				layoutWidget: loadingLayoutWidget,
				listType: normalizedListType,
				categoryCode,
				initialTag: normalizedInitialTag,
				installedFilter: normalizedInstalledFilter,
				title: initialTitle || bootstrapData?.title || '',
				isNested,
				initialData: bootstrapData,
			});
		}

		static async #openWithLoadingTabs({
			listType,
			categoryCode,
			initialTag,
			installedFilter,
			title = '',
			parentWidget = PageManager,
			useBackdrop = true,
			isNested = false,
		})
		{
			const initialTitle = String(title ?? '').trim();
			const tabsWidget = await MarketListOpener.#openLoadingTabsComponent({
				title: initialTitle || Loc.getMessage('MOBILE_MARKET_LIST_OPENER_TITLE'),
				parentWidget,
				useBackdrop,
			});
			if (!tabsWidget)
			{
				return;
			}

			const bootstrapData = await MarketListOpener.#loadListData({
				listType,
				categoryCode,
				developerTag: initialTag,
				installedFilter,
			});
			if (MarketListOpener.#isLoadingComponentClosed(tabsWidget))
			{
				return;
			}

			const tabs = new MarketListTabs(bootstrapData?.tabs ?? {});
			if (bootstrapData && tabs.isSwitchMode() && tabs.hasItems())
			{
				await MarketListOpener.#showSwitchTabsComponent({
					tabsWidget,
					listType,
					categoryCode,
					initialTag,
					installedFilter,
					title: initialTitle || bootstrapData?.title || '',
					tabsData: bootstrapData?.tabs ?? {},
					tabs,
					isNested,
				});

				return;
			}

			MarketListOpener.#showLayoutComponentInTabs({
				tabsWidget,
				listType,
				categoryCode,
				initialTag,
				installedFilter,
				title: initialTitle || bootstrapData?.title || '',
				isNested,
				initialData: bootstrapData,
			});
		}

		static async #loadListData({ listType, categoryCode, developerTag, installedFilter })
		{
			const normalizedListType = resolveListType(listType);
			const actionName = (
				normalizedListType === MARKET_LIST_TYPE.INSTALLED
					? 'mobile.Market.getInstalledListData'
					: 'mobile.Market.getCategoryListData'
			);
			const json = (
				normalizedListType === MARKET_LIST_TYPE.INSTALLED
					? {
						installedFilter,
					}
					: {
						categoryCode,
						developerTag,
					}
			);
			const response = await BX.ajax.runAction(actionName, { json }).catch((errorResponse) => errorResponse);
			const errors = getActionErrors(response);

			if (errors.length > 0)
			{
				console.error(errors);

				return null;
			}

			return response?.data ?? null;
		}

		static #openLoadingComponent({
			title,
			parentWidget = PageManager,
			useBackdrop = true,
		})
		{
			const widgetParams = {
				grabTitle: false,
				titleParams: {
					type: 'dialog',
					text: title || Loc.getMessage('MOBILE_MARKET_LIST_OPENER_TITLE'),
				},
			};

			if (useBackdrop)
			{
				widgetParams.backdrop = getLayoutBackdropParams();
			}

			return parentWidget.openWidget('layout', widgetParams).then((layoutWidget) => {
				MarketListOpener.#bindLoadingComponentCloseState(layoutWidget);
				layoutWidget.showComponent(new MarketListOpenerLoadingScreen());

				return layoutWidget;
			}).catch((error) => {
				console.error(error);

				return null;
			});
		}

		static #openLoadingTabsComponent({
			title,
			parentWidget = PageManager,
			useBackdrop = true,
		})
		{
			const widgetParams = {
				objectName: 'tabs',
				titleParams: {
					type: 'dialog',
					text: title || Loc.getMessage('MOBILE_MARKET_LIST_OPENER_TITLE'),
				},
				grabTitle: false,
				tabs: {
					items: [MarketListOpener.#createLoadingTabItem()],
				},
			};

			if (useBackdrop)
			{
				widgetParams.backdrop = getTabsBackdropParams();
			}

			return parentWidget.openWidget('tabs', widgetParams).then((tabsWidget) => {
				MarketListOpener.#bindLoadingComponentCloseState(tabsWidget);
				MarketListOpener.#showLoadingInTabsWidget(tabsWidget);

				return tabsWidget;
			}).catch((error) => {
				console.error(error);

				return null;
			});
		}

		static #createLoadingTabItem()
		{
			return {
				id: LOADING_TAB_ID,
				title: Loc.getMessage('MOBILE_MARKET_LIST_TAB_ALL'),
				active: true,
				widget: {
					name: 'layout',
					code: LOADING_TAB_ID,
					settings: {
						objectName: 'layout',
					},
				},
			};
		}

		static #showLoadingInTabsWidget(tabsWidget, attempt = 0)
		{
			if (loadingComponentStates.get(tabsWidget)?.loaded === true)
			{
				return;
			}

			const loadingWidget = tabsWidget.nestedWidgets?.()?.[LOADING_TAB_ID] ?? null;
			if (!loadingWidget)
			{
				if (attempt >= MAX_INIT_RETRIES)
				{
					console.error('market/app-list/opener: loading tab widget is not ready');
				}
				else
				{
					setTimeout(() => {
						MarketListOpener.#showLoadingInTabsWidget(tabsWidget, attempt + 1);
					}, INIT_RETRY_DELAY_MS);
				}

				return;
			}

			loadingWidget.showComponent(new MarketListOpenerLoadingScreen());
		}

		static #bindLoadingComponentCloseState(layoutWidget)
		{
			const state = {
				closed: false,
				replacing: false,
				loaded: false,
			};
			loadingComponentStates.set(layoutWidget, state);

			const markClosed = () => {
				if (state.replacing === true)
				{
					return;
				}

				state.closed = true;
			};

			layoutWidget.on?.('onViewHidden', markClosed);
			layoutWidget.on?.('onViewRemoved', markClosed);
		}

		static #isLoadingComponentClosed(layoutWidget)
		{
			return loadingComponentStates.get(layoutWidget)?.closed === true;
		}

		static #markLoadingComponentLoaded(widget)
		{
			const state = loadingComponentStates.get(widget);
			if (state)
			{
				state.loaded = true;
			}
		}

		static #showLayoutComponent({
			layoutWidget,
			listType,
			categoryCode,
			initialTag,
			installedFilter,
			title,
			isNested = false,
			initialData = null,
		})
		{
			if (!layoutWidget)
			{
				return;
			}

			layoutWidget.setTitle?.({
				type: 'dialog',
				text: title || Loc.getMessage('MOBILE_MARKET_LIST_OPENER_TITLE'),
			});
			layoutWidget.showComponent(
				MarketList({
					layout: layoutWidget,
					listType,
					categoryCode,
					initialTag,
					installedFilter,
					isNested,
					initialData,
				}),
			);
		}

		static #showLayoutComponentInTabs({
			tabsWidget,
			listType,
			categoryCode,
			initialTag,
			installedFilter,
			title,
			isNested = false,
			initialData = null,
		})
		{
			MarketListOpener.#markLoadingComponentLoaded(tabsWidget);
			const layoutWidget = tabsWidget.nestedWidgets?.()?.[LOADING_TAB_ID] ?? null;
			if (!layoutWidget)
			{
				return;
			}

			tabsWidget.setTitle?.({
				type: 'dialog',
				text: title || Loc.getMessage('MOBILE_MARKET_LIST_OPENER_TITLE'),
			});
			layoutWidget.showComponent(
				MarketList({
					layout: layoutWidget,
					listType,
					categoryCode,
					initialTag,
					installedFilter,
					isNested,
					initialData,
				}),
			);
		}

		static #replaceLoadingWithTabsComponent({ loadingLayoutWidget, ...params })
		{
			if (typeof loadingLayoutWidget?.close === 'function')
			{
				const state = loadingComponentStates.get(loadingLayoutWidget);
				if (state)
				{
					state.replacing = true;
				}

				loadingLayoutWidget.close(() => {
					MarketListOpener.#openTabsComponent(params);
				});

				return;
			}

			MarketListOpener.#openTabsComponent(params);
		}

		static #openInstalledTabsComponent({
			installedFilter,
			parentWidget = PageManager,
			useBackdrop = true,
			isNested = false,
		})
		{
			const tabsData = MarketListOpener.#createInstalledTabsData(installedFilter);
			const tabs = new MarketListTabs(tabsData);

			MarketListOpener.#openTabsComponent({
				listType: MARKET_LIST_TYPE.INSTALLED,
				installedFilter,
				title: Loc.getMessage('MOBILE_MARKET_LIST_OPENER_TITLE'),
				tabsData,
				parentWidget,
				tabs,
				useBackdrop,
				isNested,
			});
		}

		static #createInstalledTabsData(installedFilter = '')
		{
			const hasUpdatesSelected = installedFilter === INSTALLED_FILTER_UPDATES;

			return {
				mode: 'switch',
				initialTabId: hasUpdatesSelected ? INSTALLED_FILTER_UPDATES : LOADING_TAB_ID,
				items: [
					{
						id: LOADING_TAB_ID,
						title: Loc.getMessage('MOBILE_MARKET_LIST_TAB_ALL'),
						active: !hasUpdatesSelected,
						payload: {
							installedFilter: '',
						},
					},
					{
						id: INSTALLED_FILTER_UPDATES,
						title: Loc.getMessage('MOBILE_MARKET_INSTALLED_TAB_UPDATES'),
						active: hasUpdatesSelected,
						payload: {
							installedFilter: INSTALLED_FILTER_UPDATES,
						},
					},
				],
			};
		}

		static async #showSwitchTabsComponent({
			tabsWidget,
			listType,
			categoryCode,
			initialTag,
			installedFilter,
			title,
			tabsData,
			tabs,
			isNested = false,
		})
		{
			MarketListOpener.#markLoadingComponentLoaded(tabsWidget);
			tabsWidget.setTitle?.({
				type: 'dialog',
				text: title || Loc.getMessage('MOBILE_MARKET_LIST_OPENER_TITLE'),
			});

			const items = tabs.toSwitchWidgetItems();
			const firstItem = items.find((item) => item.id === LOADING_TAB_ID);
			if (firstItem && typeof tabsWidget.updateItem === 'function')
			{
				tabsWidget.updateItem(LOADING_TAB_ID, {
					title: firstItem.title,
					counter: firstItem.counter,
					label: firstItem.label,
					selectable: firstItem.selectable,
				});
			}

			const itemsToAdd = items.filter((item) => item.id !== LOADING_TAB_ID);
			if (itemsToAdd.length > 0 && typeof tabsWidget.addItems === 'function')
			{
				await tabsWidget.addItems(itemsToAdd);
			}

			initTabNestedWidgets(tabsWidget, {
				listType,
				categoryCode,
				initialTag,
				installedFilter,
				title,
				tabs: tabsData,
				isNested,
			});
		}

		static #openTabsComponent({
			listType,
			categoryCode,
			initialTag,
			installedFilter,
			title,
			tabsData,
			tabs,
			parentWidget = PageManager,
			useBackdrop = true,
			isNested = false,
		})
		{
			const widgetParams = {
				objectName: 'tabs',
				titleParams: {
					type: 'dialog',
					text: title || Loc.getMessage('MOBILE_MARKET_LIST_OPENER_TITLE'),
				},
				grabTitle: false,
				tabs: {
					items: tabs.toSwitchWidgetItems(),
				},
			};

			if (useBackdrop)
			{
				widgetParams.backdrop = getTabsBackdropParams();
			}

			parentWidget.openWidget('tabs', widgetParams).then((tabsWidget) => {
				initTabNestedWidgets(tabsWidget, {
					listType,
					categoryCode,
					initialTag,
					installedFilter,
					title,
					tabs: tabsData,
					isNested,
				});
			}).catch(console.error);
		}
	}

	module.exports = {
		MarketListOpener,
	};
});
