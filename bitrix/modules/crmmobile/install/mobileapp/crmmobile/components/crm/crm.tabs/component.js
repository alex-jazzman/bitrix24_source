(() => {
	const require = (ext) => jn.require(ext);

	const AppTheme = require('apptheme');
	const { PureComponent } = require('layout/pure-component');
	const {
		clone,
		get,
		isEqual,
		merge,
		mergeImmutable,
	} = require('utils/object');
	const { Color } = require('tokens');
	const { Icon } = require('assets/icons');
	const { throttle } = require('utils/function');
	const { KanbanTab } = require('crm/entity-tab/kanban');
	const { ListTab } = require('crm/entity-tab/list');
	const { ListItemType } = require('crm/simple-list/items');
	const { ActivityCountersStoreManager } = require('crm/state-storage');
	const { Type } = require('crm/type');
	const { LoadingProgressBar } = require('crm/ui/loading-progress');
	const { getEntityMessage } = require('crm/loc');
	const { SearchBar, SearchLayout } = require('layout/ui/search-bar');
	const { SkeletonFactory } = require('layout/ui/simple-list/skeleton');
	const { Alert } = require('alert');
	const { Loc } = require('loc');
	const { ContextMenu } = require('layout/ui/context-menu');
	const { CrmNavigator } = require('crm/navigator');
	const { qrauth } = require('qrauth/utils');
	const { Money } = require('money');
	const { RunActionExecutor } = require('rest');
	const { AnalyticsEvent } = require('analytics');

	SkeletonFactory.alias('Kanban', ListItemType.CRM_ENTITY);

	const TAB_BIG_LABEL = '99+';

	let featureCounter = 0;
	const customSectionId = BX.componentParameters.get('customSectionId', null);
	const crmNavigator = new CrmNavigator({ customSectionId });
	crmNavigator.unsubscribeFromPushNotifications();
	crmNavigator.subscribeToPushNotifications();

	/**
	 * @class CrmTabs
	 */
	class CrmTabs extends PureComponent
	{
		constructor(props)
		{
			super(props);

			this.kanbanTabRef = null;
			this.listTabRef = null;

			// Bodies of the tabs of other modules, by extension name: undefined - not loaded yet,
			// null - there is nothing to load on this portal.
			this.externalTabBodies = {};
			this.loadingExternalTabBodies = new Set();

			/** @type {SearchBar|null} */
			this.searchRef = null;
			this.unifiedSearch = null;

			const tabsCacheName = `crm:crm.tabs.list.${env.userId}.v3`;
			this.tabsCacheName = (
				props.customSectionId
					? `${tabsCacheName}.customSection.${props.customSectionId}`
					: tabsCacheName
			);
			this.tabViewRef = null;
			this.pullUnsubscribe = null;

			const data = this.getTabsFromCache();
			const {
				tabs = [],
				connectors = {},
				permissions = {},
				restrictions = {},
				crmMode = null,
			} = data;

			this.prepareTabs(props, tabs);
			const activeTab = tabs.find((tab) => tab.active);

			this.onPanBySearch = this.onPanBySearchHandler.bind(this);

			this.state = {
				tabs,
				activeTabTypeName: this.resolveActiveTabTypeName(activeTab),
				activeTabId: activeTab && activeTab.id,
				permissions,
				connectors,
				restrictions,
				crmMode,
				unifiedFilters: null,
			};

			this.currentMoneyFormats = Money.formats;
			this.rightButtonsIsSet = false;

			this.userInfo = null;

			this.loadTabs();

			this.onTabsReSelected = this.onTabsReSelected.bind(this);
			this.onMoneyLoad = this.onMoneyLoad.bind(this);
			this.loadTabs = this.loadTabs.bind(this);
			this.reloadKanbanTab = this.reloadKanbanTab.bind(this);
			this.updateCounters = this.updateCounters.bind(this);
			this.setActiveTab = this.setActiveTab.bind(this);
			this.updateEntityTypeData = this.updateEntityTypeData.bind(this);
			this.updateEntityTypeViewType = this.updateEntityTypeViewType.bind(this);
			this.bindKanbanRef = this.bindKanbanRef.bind(this);
			this.bindListRef = this.bindListRef.bind(this);
			this.bindSearchRef = this.bindSearchRef.bind(this);
			this.onFilterModeChange = this.onFilterModeChange.bind(this);
			this.showUnifiedSearch = this.showUnifiedSearch.bind(this);
			this.onMoreButtonClick = this.onMoreButtonClick.bind(this);
			this.onCheckRestrictions = this.onCheckRestrictions.bind(this);
			this.onItemsLoaded = this.onItemsLoaded.bind(this);
			this.close = this.close.bind(this);

			this.scrollOnTop = throttle(this.scrollOnTop, 500, this);

			this.analyticsEvent = this.#createAnalytics();
		}

		componentDidMount()
		{
			if (env.extranet)
			{
				this.showAlertAndClose();

				return;
			}

			this.pullUnsubscribe = BX.PULL.subscribe({
				moduleId: 'main',
				callback: (data) => {
					if (data.command === 'user_counter')
					{
						this.updateTabCounters(data.params);
					}
				},
			});

			this.bindEvents();
		}

		updateTabCounters(data)
		{
			const counters = data[env.siteId] || null;
			if (!counters)
			{
				return;
			}

			const preparedCounters = {};
			// Entity tabs are keyed by entityTypeId; an external tab has no entity counters to reload.
			const activeEntityTypeId = this.isExternalTab(this.getActiveTab()) ? null : this.state.activeTabId;

			for (const counter of Object.keys(counters))
			{
				if (counters[counter] >= 0)
				{
					preparedCounters[counter] = counters[counter];
				}
				else if (counters[counter] === -1 && activeEntityTypeId)
				{
					BX.ajax.runAction('crm.counter.list', {
						data: {
							entityTypeId: activeEntityTypeId,
							extras: data.ex,
							withExcludeUsers: Boolean(this.props.withExcludeUsers),
						},
					});

					break;
				}
			}

			if (Object.keys(preparedCounters).length > 0)
			{
				ActivityCountersStoreManager.setCounters(preparedCounters);
				this.tryToShowOnboardingCases();
			}
		}

		bindEvents()
		{
			BX.addCustomEvent('onTabsReSelected', this.onTabsReSelected);
			BX.addCustomEvent('Money::onLoad', this.onMoneyLoad);
			BX.addCustomEvent('CrmTabs::loadTabs', this.loadTabs);
			BX.addCustomEvent('CrmTabs::reloadKanbanTab', this.reloadKanbanTab);
			BX.addCustomEvent('UI.SearchBar::show', this.showUnifiedSearch);

			ActivityCountersStoreManager
				.subscribe('activityCountersModel/setCounters', this.updateCounters)
			;
		}

		componentWillUnmount()
		{
			if (this.pullUnsubscribe)
			{
				this.pullUnsubscribe();
			}

			this.bindSearchRef(null);
			this.unifiedSearch = null;
			this.unbindEvents();
		}

		unbindEvents()
		{
			BX.removeCustomEvent('onTabsReSelected', this.onTabsReSelected);
			BX.removeCustomEvent('Money::onLoad', this.onMoneyLoad);
			BX.removeCustomEvent('CrmTabs::loadTabs', this.loadTabs);
			BX.removeCustomEvent('CrmTabs::reloadKanbanTab', this.reloadKanbanTab);
			BX.removeCustomEvent('UI.SearchBar::show', this.showUnifiedSearch);

			ActivityCountersStoreManager
				.unsubscribe('activityCountersModel/setCounters', this.updateCounters)
			;
		}

		onTabsReSelected(tabName)
		{
			if (tabName === 'crm')
			{
				this.scrollOnTop();
			}
		}

		onMoneyLoad()
		{
			if (!isEqual(this.currentMoneyFormats, Money.formats))
			{
				this.currentMoneyFormats = Money.formats;
				this.setState({});
			}
		}

		updateCounters()
		{
			const counters = ActivityCountersStoreManager.getCounters();
			this.updateTabs(counters);

			if (this.searchRef)
			{
				this.searchRef.updateCounters(counters);
			}
		}

		updateTabs(counters)
		{
			this.state.tabs.forEach((tab) => {
				if (this.isExternalTab(tab))
				{
					return;
				}

				const code = `crm_${tab.typeName.toLowerCase()}_all`;

				if (counters.hasOwnProperty(code) && counters[code] >= 0)
				{
					const currentValue = BX.prop.getNumber(tab, 'label', 0);
					if (
						counters[code] !== currentValue
						&& (counters[code] <= 99 || currentValue <= 99)
					)
					{
						const item = this.getTabByTypeName(tab.typeName);
						item.label = this.getPreparedLabel(counters[code]);
						const preparedItem = this.getPreparedTabItem(item);
						this.updateTabItem(preparedItem);
					}
				}
			});
		}

		updateTabItem(item)
		{
			this.tabViewRef.updateItem(item.id, item);
		}

		setActiveTab(entityTypeId)
		{
			if (Type.existsById(entityTypeId))
			{
				this.tabViewRef.setActiveItem(Type.resolveNameById(entityTypeId));
			}
		}

		getTabsFromCache()
		{
			const cache = Application.storage.getObject(this.tabsCacheName, {});

			return get(cache, 'data', []);
		}

		modifyCache(params, tabId = null)
		{
			const cacheName = this.tabsCacheName;
			const cache = Application.storage.getObject(cacheName, null);

			if (!(cache && cache.data && cache.data.tabs))
			{
				return null;
			}

			if (tabId === null)
			{
				tabId = this.state.activeTabId;
			}

			const currentTab = cache.data.tabs.find((tab) => tab.id === tabId);
			if (currentTab === null)
			{
				return;
			}

			merge(currentTab, params);
			Application.storage.setObject(cacheName, cache);
		}

		render()
		{
			const { activeTabTypeName, tabs } = this.state;
			const activeTab = this.getActiveTab();

			if (!activeTab && tabs[0])
			{
				const { hasRestrictions, title, typeName } = tabs[0];

				if (hasRestrictions)
				{
					void this.showPlanRestriction(title);
				}
				else
				{
					qrauth.open({
						title,
						redirectUrl: this.getDesktopPageLink(typeName),
						analyticsSection: 'crm',
					});
				}

				return null;
			}

			if (!activeTab)
			{
				return null;
			}

			const entityTypeName = activeTab.typeName;
			const categoryId = get(activeTab, 'data.currentCategoryId', null);

			return View(
				{
					resizableByKeyboard: true,
				},
				TabView({
					testId: 'CRM_ENTITY_TABS',
					style: {
						height: 50,
						backgroundColor: AppTheme.realColors.bgNavigation,
					},
					ref: (ref) => {
						this.tabViewRef = ref;
					},
					params: {
						styles: {
							tabTitle: {
								underlineColor: AppTheme.colors.accentExtraDarkblue,
							},
						},
						items: this.getTabItems(),
					},
					onTabSelected: (tab, changed) => this.handleTabSelected(tab, changed),
				}),
				activeTabTypeName && activeTab && this.renderTab(),
				!this.isExternalTab(activeTab) && this.state.unifiedFilters === false && new SearchBar({
					id: `${entityTypeName}_${categoryId}`,
					cacheId: `Crm.SearchBar.${entityTypeName}.${categoryId || 'all'}.${env.userId}`,
					searchDataAction: result.actions.getSearchData,
					searchDataActionParams: {
						entityTypeName,
						categoryId,
					},
					layout,
					ref: this.bindSearchRef,
					onMoreButtonClick: this.onMoreButtonClick,
					onCheckRestrictions: this.onCheckRestrictions,
				}),
				new LoadingProgressBar(),
			);
		}

		showAlertAndClose()
		{
			Alert.alert(
				Loc.getMessage('M_CRM_ENTITY_TAB_ALERT_EXTRANET_ACCESS_DENIED_TITLE'),
				Loc.getMessage('M_CRM_ENTITY_TAB_ALERT_EXTRANET_ACCESS_DENIED_TEXT'),
				this.close,
				Loc.getMessage('M_CRM_ENTITY_TAB_ALERT_CONFIRM'),
			);
		}

		close()
		{
			if (layout)
			{
				layout.back();
				layout.close();
			}
		}

		bindSearchRef(ref)
		{
			if (this.searchRef && this.searchRef !== ref)
			{
				// SearchBar does not remove its component event subscription on unmount.
				BX.removeCustomEvent('UI.SearchBar::show', this.searchRef.show);
			}

			this.searchRef = ref;
		}

		onFilterModeChange(tab)
		{
			const activeTab = this.kanbanTabRef || this.listTabRef;
			if (tab !== activeTab || this.isExternalTab(this.getActiveTab()))
			{
				return;
			}

			const unifiedFilters = tab.isUnifiedFilters();
			if (this.state.unifiedFilters === unifiedFilters)
			{
				return;
			}

			this.unifiedSearch = null;
			if (unifiedFilters)
			{
				this.bindSearchRef(null);
			}

			this.setState({ unifiedFilters });
		}

		getSearchBarId()
		{
			const tab = this.getActiveTab();

			return `${tab?.typeName}_${get(tab, 'data.currentCategoryId', null)}`;
		}

		showUnifiedSearch({ searchBarId, search: text = '' } = {})
		{
			if (
				!this.state.unifiedFilters
				|| this.isExternalTab(this.getActiveTab())
				|| searchBarId !== this.getSearchBarId()
			)
			{
				return;
			}

			let appliedText = text;
			const isCurrent = () => this.unifiedSearch === search
				&& this.state.unifiedFilters && searchBarId === this.getSearchBarId()
			;
			const applySearch = (value, isCancel = false) => {
				if (!isCurrent() || value === appliedText)
				{
					return;
				}

				appliedText = value;
				BX.postComponentEvent('UI.SearchBar::onSearch', [{
					searchBarId,
					text: value,
					isCancel,
					data: { background: value ? Color.accentMainPrimary.toHex() : null },
				}]);
			};
			const search = new SearchLayout({
				id: searchBarId,
				layout,
				disablePresets: true,
				onSearch: ({ text: value }) => applySearch(value),
				onCancel: () => applySearch('', true),
				onHide: () => {
					if (isCurrent())
					{
						BX.postComponentEvent('UI.SearchBar::onSearchHide', [{ searchBarId }]);
					}
				},
				onCheckRestrictions: () => isCurrent() && search.text.length >= 3 && this.onCheckRestrictions(),
			});

			this.unifiedSearch = search;
			search.text = text;
			search.show();
		}

		/**
		 * Without the presets strip the entity tabs stay reachable under an open search, and a search
		 * left open for the previous list would take text nobody applies.
		 */
		closeUnifiedSearch()
		{
			const search = this.unifiedSearch;
			this.unifiedSearch = null;
			search?.close();
		}

		onMoreButtonClick()
		{
			const { typeName, link } = this.getActiveTab() || {};

			this.showFilterSettings(typeName, link);
		}

		onCheckRestrictions()
		{
			const hasRestrictions = get(this.getActiveTab(), 'restrictions.search.isExceeded', false);
			if (hasRestrictions)
			{
				void this.showPlanRestriction(BX.message('M_CRM_ET_SEARCH_PLAN_RESTRICTION_TITLE'));
			}

			return hasRestrictions;
		}

		async showPlanRestriction(title)
		{
			const { PlanRestriction } = await requireLazy('layout/ui/plan-restriction');

			PlanRestriction.open({ title });
		}

		getActiveTab()
		{
			return this.getTabById(this.state.activeTabId);
		}

		getTabById(entityTypeId)
		{
			return this.state.tabs.find(({ id }) => id === entityTypeId);
		}

		getTabByTypeName(entityTypeName)
		{
			return this.state.tabs.find(({ typeName }) => typeName === entityTypeName);
		}

		isExternalTab(tab)
		{
			return Boolean(tab) && tab.type === 'external';
		}

		getExternalTabById(tabId)
		{
			const tab = this.getTabById(tabId);

			return this.isExternalTab(tab) ? tab : null;
		}

		resolveActiveTabTypeName(tab)
		{
			// External tabs have no entityType; their string id doubles as the active-tab key.
			return this.isExternalTab(tab) ? tab.id : (tab && tab.typeName);
		}

		onPanBySearchHandler()
		{
			this.unifiedSearch?.close();

			if (this.searchRef && this.searchRef.isVisible())
			{
				void this.searchRef.fadeOut();
			}
		}

		handleTabSelected(tab, changed)
		{
			BX.postComponentEvent('crm.tabs:onTabSelected', [{ tabId: tab.id, changed }]);

			if (changed)
			{
				this.closeUnifiedSearch();
				featureCounter = 0;

				this.rightButtonsIsSet = false;

				// External (non-entity) tab: no kanban/list, no entity reload, no search.
				const selectedExternalTab = this.getExternalTabById(tab.id);
				if (selectedExternalTab)
				{
					this.searchRef = null;
					this.setState({
						activeTabTypeName: selectedExternalTab.id,
						activeTabId: selectedExternalTab.id,
					});

					return;
				}

				const typeId = this.getTabByTypeName(tab.id).id;

				let promise;
				let cancelReload = false;

				const { activeTabTypeName } = this.state;
				// skip rerender at first load when data is from cache
				if (activeTabTypeName === tab.id)
				{
					promise = Promise.resolve();
				}
				else
				{
					const previousTab = this.getTabByTypeName(activeTabTypeName);
					if (
						previousTab
						&& previousTab.isStagesEnabled
						&& this.getTabByTypeName(tab.id).isStagesEnabled
					)
					{
						cancelReload = true;
					}

					promise = new Promise((resolve) => {
						this.setState({
							activeTabTypeName: tab.id,
							activeTabId: typeId,
						}, resolve);
					});
				}

				if (cancelReload)
				{
					return;
				}

				promise.then(() => {
					if (this.searchRef)
					{
						this.searchRef.setState(this.searchRef.getInitialState());
					}

					this.reloadKanbanTab();

					if (this.listTabRef)
					{
						this.listTabRef.reload(this.getLoadItemsParams());
					}
				})
					.catch(console.error);
			}
			else if (tab.selectable === false)
			{
				const desiredTab = this.getTabByTypeName(tab.id);

				if (desiredTab.hasRestrictions)
				{
					void this.showPlanRestriction(tab.title);
				}
				else
				{
					qrauth.open({
						title: tab.title,
						redirectUrl: this.getDesktopPageLink(tab.typeName),
						analyticsSection: 'crm',
					});
				}
			}
			else
			{
				this.scrollOnTop();
			}
		}

		reloadKanbanTab()
		{
			if (this.kanbanTabRef)
			{
				this.kanbanTabRef.reload(this.getLoadItemsParams());
			}
		}

		getLoadItemsParams()
		{
			return {
				clearFilter: true,
				initMenu: true,

				// @todo may be needed when changing an entityType
				// skipFillSlides: false,
				// force: true,
			};
		}

		scrollOnTop()
		{
			if (this.kanbanTabRef)
			{
				this.kanbanTabRef.scrollToTop();
			}
			else if (this.listTabRef)
			{
				this.listTabRef.scrollToTop();
			}
		}

		loadTabs(params = {})
		{
			const { customSectionId } = this.props;
			const ajaxParams = { customSectionId };
			const { crmMode } = params;
			const loadVersion = (this.tabsLoadVersion ?? 0) + 1;
			this.tabsLoadVersion = loadVersion;
			if (crmMode)
			{
				this.latestCrmMode = crmMode;
				this.setState({ crmMode });
			}
			const setTabsFromResponse = (response, useResponseMode) => {
				const responseMode = useResponseMode
					? response.data.crmMode
					: (this.latestCrmMode ?? this.state.crmMode)
				;
				if (useResponseMode)
				{
					this.latestCrmMode = responseMode;
				}

				this.setTabs({
					...response,
					...params,
					data: { ...response.data, crmMode: responseMode },
				});
			};

			new RunActionExecutor(result.actions.loadTabs, ajaxParams)
				.setCacheId(this.tabsCacheName)
				.setCacheHandler((response) => setTabsFromResponse(
					response,
					!crmMode && loadVersion === this.tabsLoadVersion,
				))
				.setHandler((response) => setTabsFromResponse(response, loadVersion === this.tabsLoadVersion))
				.call(true);
		}

		setTabs(response)
		{
			const { tabs, permissions, connectors, crmMode } = this.state;
			const { data } = response;

			if (data.tabs && !isEqual(data.tabs, tabs))
			{
				this.prepareTabs(this.props, data.tabs);
				const tab = data.tabs.find((item) => item.active);

				this.setState({
					tabs: data.tabs,
					activeTabTypeName: this.resolveActiveTabTypeName(tab),
					activeTabId: tab.id,
					permissions: data.permissions,
					connectors: data.connectors,
					restrictions: data.restrictions,
					crmMode: data.crmMode,
					remindersList: data.remindersList,
				});
			}
			else if (data.permissions && !isEqual(data.permissions, permissions))
			{
				this.setState({
					permissions: data.permissions,
					crmMode: data.crmMode,
				});
			}
			else if (data.connectors && !isEqual(data.connectors, connectors))
			{
				this.setState({
					connectors: data.connectors,
					crmMode: data.crmMode,
				});
			}
			else if (data.crmMode !== crmMode)
			{
				this.setState({ crmMode: data.crmMode });
			}

			const { user } = data;

			this.userInfo = user;
		}

		prepareTabs(props, tabs)
		{
			if (props.activeTabName)
			{
				tabs.forEach((tab) => tab.active = (tab.typeName === props.activeTabName));
			}
		}

		getDesktopPageLink(tabName)
		{
			const tab = this.getTabByTypeName(tabName);
			if (tab)
			{
				return tab.link;
			}

			return null;
		}

		renderTab()
		{
			const activeTab = this.getActiveTab();
			if (this.isExternalTab(activeTab))
			{
				return this.renderExternalTab(activeTab);
			}

			return (
				this.isUseColumns()
					? this.createKanban()
					: this.createList()
			);
		}

		renderExternalTab(tab)
		{
			this.kanbanTabRef = null;
			this.listTabRef = null;

			const { module: moduleId, component: componentName, params } = tab.externalRender || {};
			if (!moduleId || !componentName)
			{
				return null;
			}

			const tabBody = this.externalTabBodies[moduleId];
			if (tabBody === undefined)
			{
				void this.loadExternalTabBody(moduleId);

				return null;
			}

			if (tabBody === null)
			{
				// The load has already reported that this portal has no such body.
				return null;
			}

			const ExternalComponent = tabBody[componentName];
			if (!ExternalComponent)
			{
				console.error(`CRM tabs: tab body ${moduleId}::${componentName} is not available`);

				return null;
			}

			return new ExternalComponent({ layout, ...params });
		}

		/**
		 * A tab body lives in the module that contributed the tab, and that module is not necessarily on the
		 * portal. Declaring its extension in deps.php of this component would make the component unbuildable
		 * there: janative resolves the whole dependency list before it builds the script, and a missing
		 * extension breaks the panel rather than the tab. Hence on demand: a body that cannot be loaded costs
		 * an empty tab, nothing more.
		 *
		 * @param {string} moduleId extension of the body in the slash form, as the tab descriptor names it
		 */
		async loadExternalTabBody(moduleId)
		{
			if (this.loadingExternalTabBodies.has(moduleId))
			{
				return;
			}

			this.loadingExternalTabBodies.add(moduleId);

			// requireLazy takes the colon form and never rejects: an extension the portal does not have
			// resolves to undefined.
			const tabBody = await requireLazy(moduleId.replace('/', ':'));
			if (!tabBody)
			{
				// Reported once, on the load: a render of its own would repeat the same line on every frame.
				console.error(`CRM tabs: tab body ${moduleId} is not available on this portal`);
			}

			this.externalTabBodies[moduleId] = tabBody ?? null;
			this.loadingExternalTabBodies.delete(moduleId);

			this.setState({
				externalTabBodyRevision: (this.state.externalTabBodyRevision ?? 0) + 1,
			});
		}

		isUseColumns()
		{
			const { isStagesEnabled } = this.getActiveTab() ?? {};

			return isStagesEnabled;
		}

		createKanban()
		{
			this.listTabRef = null;

			return new KanbanTab({
				...this.getEntityTabConfig(this.bindKanbanRef),
				analyticsEvent: new AnalyticsEvent(this.analyticsEvent)
					.setSubSection('kanban')
					.setSection(
						this.#prepareAnalyticsSection(),
					),
			});
		}

		bindKanbanRef(ref)
		{
			this.kanbanTabRef = ref;
			if (ref)
			{
				this.onFilterModeChange(ref);
			}
		}

		createList()
		{
			this.kanbanTabRef = null;

			return new ListTab({
				...this.getEntityTabConfig(this.bindListRef),
				analyticsEvent: new AnalyticsEvent(this.analyticsEvent)
					.setSubSection('list')
					.setSection(
						this.#prepareAnalyticsSection(),
					),
			});
		}

		#prepareAnalyticsSection()
		{
			const activeTab = this.getActiveTab();
			const typeName = activeTab.typeName || '';
			const cSection = `${typeName.toLowerCase().replace(/_\d+/, '')}_section`;
			if (cSection === 'dynamic_section' && activeTab.isInCustomSection)
			{
				return 'custom_section';
			}

			return cSection;
		}

		bindListRef(ref)
		{
			this.listTabRef = ref;
			if (ref)
			{
				this.onFilterModeChange(ref);
			}
		}

		getTabItems()
		{
			return this.state.tabs.map((tab) => this.getPreparedTabItem(tab));
		}

		getPreparedTabItem(tab)
		{
			if (this.isExternalTab(tab))
			{
				// External descriptor: string id and title map straight to the tab item;
				// entity-only fields (restrictions/label/icon) degrade to absent.
				return {
					id: tab.id,
					title: tab.title,
					active: Boolean(tab?.active),
					selectable: true,
				};
			}

			let tabItem = {
				id: tab.typeName,
				title: tab.titleInPlural,
				active: Boolean(tab?.active),
				selectable: Boolean(tab.selectable),
				label: this.getPreparedLabel(tab.label, tab.id),
			};
			const { hasRestrictions } = this.getTabByTypeName(tabItem.id) ?? {};

			if (hasRestrictions)
			{
				tabItem = {
					...tabItem,
					icon: Icon.LOCK.getIconName(),
					style: {
						icon: {
							color: Color.base0.toHex(),
						},
					},
				};
			}

			return tabItem;
		}

		getPreparedLabel(label)
		{
			if (!label)
			{
				return '';
			}

			const counter = Number(label);
			if (Number.isNaN(counter))
			{
				return String(label);
			}

			return (counter > 99 ? TAB_BIG_LABEL : String(counter));
		}

		getEntityTypes()
		{
			return this.state.tabs
				.filter((tab) => !this.isExternalTab(tab))
				.map((tab) => {
					return {
						...tab,
						name: tab.title,
					};
				});
		}

		getEntityTabConfig(ref)
		{
			const rightButtonsIsSet = this.rightButtonsIsSet;
			this.rightButtonsIsSet = true;
			const { activeTabId, activeTabTypeName, remindersList } = this.state;
			const activeTab = this.getActiveTab() || {};

			const categoryId = get(activeTab, 'data.currentCategoryId', null);

			return {
				entityTypeName: activeTabTypeName,
				entityTypeId: activeTabId,
				entityTypes: this.getEntityTypes(),
				crmMode: this.state.crmMode,
				updateEntityTypeData: this.updateEntityTypeData,
				updateEntityTypeViewType: this.updateEntityTypeViewType,
				setActiveTab: this.setActiveTab,
				actions: result.actions || {},
				actionParams: {
					loadItems: {
						entityType: activeTabTypeName,
					},
					updateItemStage: {
						entityType: activeTabTypeName,
					},
					deleteItem: {
						entityType: activeTabTypeName,
					},
				},
				actionCallbacks: {
					loadItems: this.onItemsLoaded,
				},
				permissions: this.getPermissions(),
				restrictions: this.getRestrictions(),
				itemParams: this.getItemParams(),
				cacheName: `crm:crm.kanban.${env.userId}.${activeTabTypeName}`,
				layout,
				needInitMenu: !rightButtonsIsSet,
				onPanList: this.onPanBySearch,
				searchRef: this.searchRef,
				onFilterModeChange: this.onFilterModeChange,
				searchBarId: `${activeTabTypeName}_${categoryId}`,
				userInfo: this.userInfo,
				remindersList,
				ref,
			};
		}

		/**
		 * @param {object} data
		 * @param {string} renderType
		 * @param {object} config
		 */
		onItemsLoaded(data, renderType, config)
		{
			if (!this.state.unifiedFilters && data?.event === 'refreshPresets')
			{
				this.searchRef?.refreshPresets();
			}

			const filterText = config?.data?.extra?.filter?.search;
			const hasResult = Array.isArray(data?.items);
			if (hasResult)
			{
				this.tryToShowOnboardingCases(data);
			}

			this.searchRef?.updateLastSearchResultStatus?.(hasResult, filterText);
		}

		tryToShowOnboardingCases(data = {})
		{
			void requireLazy('crm:onboarding', false)
				.then((ext) => {
					const { Onboarding, CaseName } = ext;

					if (Onboarding && CaseName)
					{
						const activeTab = this.getActiveTab();
						const tabs = this.getTabItems();
						const hasCustomPresets = data?.hasCustomPresets || false;
						const canImport = data?.permissions?.import || false;

						Onboarding.tryToShowCasesBatch([
							CaseName.ON_NO_CRM_DEALS,
							CaseName.ON_ACTIVE_TAB_COUNTER,
							CaseName.ON_MORE_THAN_TWO_TUNNELS,
							CaseName.ON_CUSTOM_PRESET_APPEARED,
						], {
							items: data?.items,
							entityTypeId: activeTab?.id,
							entityType: activeTab?.typeName,
							parentWidget: layout,
							tabs,
							hasCustomPresets,
							canImport,
						});
					}
				})
				.catch((error) => {
					console.error(error);
				});
		}

		getPermissions()
		{
			const { permissions, activeTabTypeName } = this.state;
			const { permissions: tabPermissions } = this.getTabByTypeName(activeTabTypeName);

			return mergeImmutable(permissions, tabPermissions);
		}

		getRestrictions()
		{
			const { restrictions } = this.state;
			const { restrictions: tabRestrictions } = this.getActiveTab();

			return mergeImmutable(restrictions, tabRestrictions);
		}

		getItemParams()
		{
			const {
				activeTabTypeName: entityTypeName,
				activeTabId: entityTypeId,
				permissions: entityPermissions,
				connectors,
			} = this.state;

			return {
				entityTypeName,
				entityTypeId,
				entityPermissions,
				connectors,
			};
		}

		/**
		 * @param {Number} entityTypeId
		 * @param {Object} data
		 * @param {Function|null} callback
		 */
		updateEntityTypeData(entityTypeId, data, callback = null)
		{
			const tabs = clone(this.state.tabs);
			const tab = tabs.find((currentTab) => currentTab.id === entityTypeId);

			let needUpdateState = false;

			const modifyData = {};

			if (data.permissions && !isEqual(tab.permissions, data.permissions))
			{
				const { permissions } = data;
				tab.permissions = permissions;
				needUpdateState = true;

				modifyData.permissions = permissions;
			}

			if (data.link && tab.link !== data.link)
			{
				const { link } = data;
				tab.link = link;
				needUpdateState = true;

				modifyData.link = link;
			}

			if (!Number.isNaN(Number(data.categoryId)) && tab.data.currentCategoryId !== data.categoryId)
			{
				const { categoryId } = data;
				tab.data.currentCategoryId = categoryId;

				modifyData.data = modifyData.data || {};
				modifyData.data.currentCategoryId = categoryId;
			}

			if (data.counters && tab.data.counters !== data.counters)
			{
				const { counters } = data;
				tab.data.counters = counters;

				modifyData.data = modifyData.data || {};
				modifyData.data.counters = counters;
			}

			if (data.sortType && tab.data.sortType !== data.sortType)
			{
				const { sortType } = data;
				tab.data.sortType = sortType;

				modifyData.data = modifyData.data || {};
				modifyData.data.sortType = sortType;

				this.rightButtonsIsSet = false;
				needUpdateState = true;
			}

			if (data.restrictions && !isEqual(tab.restrictions, data.restrictions))
			{
				const restrictions = mergeImmutable(tab.restrictions, data.restrictions);

				tab.restrictions = restrictions;

				needUpdateState = true;
				modifyData.restrictions = restrictions;
			}

			if (Object.keys(modifyData).length > 0)
			{
				this.modifyCache(modifyData, tab.id);
			}

			if (needUpdateState)
			{
				this.setState({ tabs }, () => {
					if (callback)
					{
						callback(tabs);
					}
				});
			}
		}

		/**
		 * @param {Number} entityTypeId
		 * @param {String} viewType
		 * @param {Function|null} callback
		 */
		updateEntityTypeViewType(entityTypeId, viewType, callback = null)
		{
			const tabs = clone(this.state.tabs);
			const tab = tabs.find((currentTab) => currentTab.id === entityTypeId);

			if (!tab || tab.data.viewType === viewType)
			{
				// the tab state already matches, but the view still has to be reloaded
				if (callback)
				{
					callback(this.state.tabs);
				}

				return;
			}

			tab.data.viewType = viewType;
			this.modifyCache({ data: { viewType } }, tab.id);
			this.rightButtonsIsSet = false;

			this.setState({ tabs }, () => {
				if (callback)
				{
					callback(tabs);
				}
			});
		}

		/**
		 * @private
		 * @param {string} entityTypeName
		 * @param {string} redirectUrl
		 */
		showFilterSettings(entityTypeName, redirectUrl)
		{
			const pathToExtension = `${currentDomain}/bitrix/mobileapp/crmmobile/components/crm/crm.tabs`;
			const imagePath = `${pathToExtension}/images/settings.png`;

			const menu = new ContextMenu({
				banner: {
					featureItems: [
						BX.message('M_CRM_ENTITY_TAB_SEARCH_FILTER_SETTINGS_CREATE_FILTER'),
						BX.message('M_CRM_ENTITY_TAB_SEARCH_FILTER_SETTINGS_MORE_SETTINGS'),
						BX.message('M_CRM_ENTITY_TAB_SEARCH_FILTER_SETTINGS_RESPONSIBLE'),
						getEntityMessage(
							'M_CRM_ENTITY_TAB_SEARCH_FILTER_SETTINGS_CUSTOMIZATION',
							entityTypeName,
						),
					],
					imagePath,
					qrauth: {
						redirectUrl,
						type: 'crm',
						analyticsSection: 'crm',
					},
				},
				params: {
					title: BX.message('M_CRM_ENTITY_TAB_SEARCH_FILTER_SETTINGS_TITLE'),
				},
			});

			void menu.show(PageManager);
		}

		#createAnalytics()
		{
			return new AnalyticsEvent({
				tool: 'crm',
			});
		}
	}

	BX.onViewLoaded(() => {
		layout.enableNavigationBarBorder(false);
		layout.showComponent(new CrmTabs({
			activeTabName: BX.componentParameters.get('activeTabName', null),
			customSectionId: BX.componentParameters.get('customSectionId', null),
		}));
	});
})();
