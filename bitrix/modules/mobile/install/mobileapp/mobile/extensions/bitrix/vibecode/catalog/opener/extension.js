/**
 * @module vibecode/catalog/opener
 */
jn.define('vibecode/catalog/opener', (require, exports, module) => {
	const { Loc } = require('loc');
	const {
		VibeCodeCatalog,
		VibeCodeCatalogMarketplacePlaceholder,
	} = require('vibecode/catalog');

	const VIBECODE_TAB_ID = 'vibecode';
	const MARKETPLACE_TAB_ID = 'marketplace';
	const INIT_RETRY_DELAY_MS = 30;
	const MAX_INIT_RETRIES = 10;

	class VibeCodeCatalogOpener
	{
		static open({
			parentWidget = PageManager,
			previewUserId = null,
		} = {})
		{
			const opener = parentWidget ?? PageManager;

			return opener.openWidget('tabs', {
				objectName: 'tabs',
				titleParams: VibeCodeCatalogOpener.#createTitleParams(),
				grabTitle: false,
				tabs: {
					items: VibeCodeCatalogOpener.#createTabsItems(),
				},
			}).then((tabsWidget) => {
				VibeCodeCatalogOpener.#initTabsWidget(tabsWidget, { previewUserId });

				return tabsWidget;
			}).catch((error) => {
				console.error('[vibecode/catalog/opener] failed to open catalog', error);

				return null;
			});
		}

		static #createTitleParams()
		{
			return {
				type: 'dialog',
				text: Loc.getMessage('MOBILE_VIBECODE_CATALOG_OPENER_TITLE_TEXT'),
				isRounded: false,
			};
		}

		static #createTabsItems()
		{
			return [
				{
					id: VIBECODE_TAB_ID,
					title: Loc.getMessage('MOBILE_VIBECODE_CATALOG_TAB_VIBECODE'),
					active: true,
					widget: {
						name: 'layout',
						code: VIBECODE_TAB_ID,
						settings: {
							objectName: 'layout',
						},
					},
				},
				{
					id: MARKETPLACE_TAB_ID,
					title: Loc.getMessage('MOBILE_VIBECODE_CATALOG_TAB_MARKETPLACE'),
					active: false,
					widget: {
						name: 'layout',
						code: MARKETPLACE_TAB_ID,
						settings: {
							objectName: 'layout',
						},
					},
				},
			];
		}

		static #initTabsWidget(tabsWidget, params = {})
		{
			const runtime = {
				activeTabId: VIBECODE_TAB_ID,
				initializedTabs: new Set(),
				instances: new Map(),
				headerConfigs: new Map(),
			};

			VibeCodeCatalogOpener.#setLeftButtons(tabsWidget);
			VibeCodeCatalogOpener.#syncHeader(tabsWidget, runtime);
			tabsWidget.setActiveItem?.(VIBECODE_TAB_ID);
			VibeCodeCatalogOpener.#initTab(tabsWidget, params, runtime, VIBECODE_TAB_ID);

			tabsWidget.on('onTabSelected', (item, changed) => {
				if (!changed)
				{
					return;
				}

				runtime.activeTabId = String(item?.id ?? '');
				VibeCodeCatalogOpener.#initTab(tabsWidget, params, runtime, runtime.activeTabId);
				VibeCodeCatalogOpener.#syncHeader(tabsWidget, runtime);
			});
		}

		static #setLeftButtons(tabsWidget)
		{
			tabsWidget.setLeftButtons?.([
				{
					type: 'back',
					callback: () => {
						if (typeof tabsWidget.back === 'function')
						{
							tabsWidget.back();

							return;
						}

						tabsWidget.close?.();
					},
				},
			]);
		}

		static #initTab(tabsWidget, params, runtime, tabId, attempt = 0)
		{
			const normalizedTabId = String(tabId ?? '');
			if (!normalizedTabId || runtime.initializedTabs.has(normalizedTabId))
			{
				return;
			}

			const widget = tabsWidget.nestedWidgets?.()?.[normalizedTabId] ?? null;
			if (!widget)
			{
				if (attempt >= MAX_INIT_RETRIES)
				{
					console.error('[vibecode/catalog/opener] nested tab widget is not ready', normalizedTabId);
				}
				else
				{
					setTimeout(() => {
						VibeCodeCatalogOpener.#initTab(
							tabsWidget,
							params,
							runtime,
							normalizedTabId,
							attempt + 1,
						);
					}, INIT_RETRY_DELAY_MS);
				}

				return;
			}

			const onHeaderUpdate = (headerConfig) => {
				runtime.headerConfigs.set(normalizedTabId, headerConfig);

				if (runtime.activeTabId === normalizedTabId)
				{
					VibeCodeCatalogOpener.#syncHeader(tabsWidget, runtime);
				}
			};
			const component = VibeCodeCatalogOpener.#createTabComponent({
				tabId: normalizedTabId,
				widget,
				tabsWidget,
				params,
				onHeaderUpdate,
			});

			runtime.instances.set(normalizedTabId, component);
			runtime.headerConfigs.set(
				normalizedTabId,
				component.getHeaderConfig?.() ?? VibeCodeCatalogOpener.#getDefaultHeaderConfig(),
			);
			widget.showComponent(component);
			runtime.initializedTabs.add(normalizedTabId);

			if (runtime.activeTabId === normalizedTabId)
			{
				VibeCodeCatalogOpener.#syncHeader(tabsWidget, runtime);
			}
		}

		static #createTabComponent({ tabId, widget, tabsWidget, params, onHeaderUpdate })
		{
			if (tabId === MARKETPLACE_TAB_ID)
			{
				return VibeCodeCatalogMarketplacePlaceholder({
					layout: widget,
					testId: 'vibecode-catalog-marketplace-placeholder',
					onHeaderUpdate,
				});
			}

			return VibeCodeCatalog({
				layout: widget,
				headerLayout: tabsWidget,
				testId: 'vibecode-catalog',
				hideHeader: true,
				isNested: true,
				previewUserId: params.previewUserId ?? null,
				onHeaderUpdate,
			});
		}

		static #syncHeader(tabsWidget, runtime)
		{
			tabsWidget.setTitle?.(VibeCodeCatalogOpener.#createTitleParams());
			VibeCodeCatalogOpener.#setLeftButtons(tabsWidget);
			tabsWidget.setRightButtons?.(VibeCodeCatalogOpener.#getActiveRightButtons(runtime));
		}

		static #getActiveRightButtons(runtime)
		{
			const headerConfig = runtime.headerConfigs.get(runtime.activeTabId) ?? {};
			if (Array.isArray(headerConfig.rightButtons))
			{
				return headerConfig.rightButtons;
			}

			return runtime.instances.get(runtime.activeTabId)?.getHeaderRightButtons?.() ?? [];
		}

		static #getDefaultHeaderConfig()
		{
			return {
				title: Loc.getMessage('MOBILE_VIBECODE_CATALOG_OPENER_TITLE_TEXT'),
				rightButtons: [],
			};
		}
	}

	module.exports = {
		VibeCodeCatalogOpener,
	};
});
