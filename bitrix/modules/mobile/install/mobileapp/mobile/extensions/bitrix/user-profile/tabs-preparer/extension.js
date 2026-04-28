/**
 * @module user-profile/tabs-preparer
 */
jn.define('user-profile/tabs-preparer', (require, exports, module) => {
	const {
		TabType,
		closeIcon,
	} = require('user-profile/const');
	const { fetchTabs, getTabsDataRunActionExecutorNoCache } = require('user-profile/api');
	const { CommonTab } = require('user-profile/common-tab');
	const { getState } = require('statemanager/redux/store');
	const { selectById } = require('statemanager/redux/slices/users/selector');
	const { Loc } = require('loc');
	const { UserProfileAnalytics, getInviteStatusFromTabsData } = require('user-profile/analytics');
	const { requireLazy } = require('require-lazy');

	/**
	 * @param {Array} tabs
	 * @param {string} selectedTabId
	 * @return {Array}
	 */
	function prepareTabs(tabs, selectedTabId)
	{
		return (
			tabs
				.filter((tab) => (
					tab.widget
					// eslint-disable-next-line no-undef
					|| availableComponents[tab.componentName]
					|| tab.component?.rootWidget?.name === 'web'
				))
				.map((tab) => ({
					id: tab.id,
					title: tab.title,
					active: tab.id === selectedTabId,
					component: tab.component,
					widget: tab.widget,
					params: tab.params,
				}))
		);
	}

	function getInitialTabs(ownerId)
	{
		return [{
			id: TabType.COMMON,
			title: Loc.getMessage('M_PROFILE_COMMON_TAB_TITLE'),
			active: true,
			params: {
				ownerId,
				selectedTabId: TabType.COMMON,
			},
			widget: {
				code: 'common',
				name: 'layout',
				settings: {
					objectName: 'layout',
				},
			},
		}];
	}

	function prepareParams(preparedTabs, additionalParams = {})
	{
		return {
			...Object.fromEntries(preparedTabs.map((tab) => [tab.id, tab.params])),
			closeIcon,
			...additionalParams,
		};
	}

	/**
	 * @param {Object} tabsWidget
	 * @param {number} ownerId
	 */
	function bindEvents(tabsWidget, ownerId)
	{
		tabsWidget.on('onTabSelected', (item, changed) => {
			if (!changed)
			{
				return;
			}

			let widgetTitle = Loc.getMessage('M_PROFILE_TITLE');
			if (item.id !== TabType.COMMON)
			{
				widgetTitle = selectById(getState(), ownerId)?.fullName ?? widgetTitle;
			}

			tabsWidget.setTitle({ text: widgetTitle }, true);
		});
	}

	/**
	 * @param {Object} tabsWidget
	 * @param {Object} params
	 */
	async function initTabNestedWidgets(tabsWidget, params)
	{
		const nestedWidgets = tabsWidget.nestedWidgets();
		const { ownerId, selectedTabId, analyticsSection } = params;

		const commonTabInstance = initCommonTabWidget(nestedWidgets, params, tabsWidget);
		let alreadyInitialized = false;
		const handler = (response) => handleTabsResponse({
			response,
			tabsWidget,
			params,
			fromCache: false,
			alreadyInitialized,
			commonTabInstance,
			analyticsSection,
		});
		const cacheHandler = (response) => {
			handleTabsResponse({
				response,
				tabsWidget,
				params,
				fromCache: true,
				alreadyInitialized,
				commonTabInstance,
				analyticsSection,
			});
			alreadyInitialized = true;
		};
		fetchTabs({
			ownerId,
			selectedTabId,
			handler,
			cacheHandler,
		});
	}

	async function handleTabsResponse({
		response,
		tabsWidget,
		params,
		fromCache,
		alreadyInitialized,
		commonTabInstance,
		analyticsSection,
	})
	{
		if (response.status !== 'success')
		{
			console.error(response);

			return;
		}

		const { selectedTabId, ownerId } = params;
		const {
			data: {
				canView,
				tabs = [],
			},
		} = response;

		const preparedTabs = prepareTabs(tabs, selectedTabId);

		if (!alreadyInitialized && canView)
		{
			UserProfileAnalytics.sendProfileView(
				ownerId,
				getInviteStatusFromTabsData(preparedTabs),
				analyticsSection,
			);
		}

		if (fromCache || !alreadyInitialized)
		{
			await initTabs({
				preparedTabs,
				tabsWidget,
				commonTabInstance,
				canView,
			});

			return;
		}

		updateCommonTabOnly({
			preparedTabs,
			tabsWidget,
			commonTabInstance,
			canView,
		});
	}

	async function initTabs({ preparedTabs, tabsWidget, commonTabInstance, canView })
	{
		const tabsToAdd = preparedTabs.filter((tab) => tab.id !== TabType.COMMON);
		if (tabsToAdd.length > 0 && canView)
		{
			await tabsWidget.addItems(tabsToAdd);
		}

		const {
			newNestedWidgets,
			preparedParams,
		} = updateCommonTabOnly({
			preparedTabs,
			tabsWidget,
			commonTabInstance,
			canView,
		});

		await initFilesTabWidget(newNestedWidgets, preparedParams);
	}

	function updateCommonTabOnly({ preparedTabs, tabsWidget, commonTabInstance, canView })
	{
		const newNestedWidgets = tabsWidget.nestedWidgets();
		const preparedParams = prepareParams(preparedTabs, {
			canView,
			isPending: false,
		});

		commonTabInstance?.update(prepareCommonTabProps(newNestedWidgets, preparedParams, tabsWidget));

		return { newNestedWidgets, preparedParams };
	}

	function prepareCommonTabProps(nestedWidgets, params, tabsWidget)
	{
		const widget = nestedWidgets[TabType.COMMON];
		const widgetParams = params[TabType.COMMON];
		const { canView, isPending } = params;

		return {
			...widgetParams,
			parentWidget: widget,
			tabsWidget,
			canView,
			isPending,
		};
	}

	function initCommonTabWidget(nestedWidgets, params, tabsWidget)
	{
		if (nestedWidgets[TabType.COMMON])
		{
			const widget = nestedWidgets[TabType.COMMON];
			const props = prepareCommonTabProps(nestedWidgets, params, tabsWidget);
			const commonTabInstance = CommonTab(props);

			widget.showComponent(commonTabInstance);

			return commonTabInstance;
		}

		return null;
	}

	async function initFilesTabWidget(nestedWidgets, params)
	{
		if (nestedWidgets[TabType.FILES])
		{
			const { ProfileFilesGrid } = await requireLazy('disk:file-grid/profile-files', false);

			const widget = nestedWidgets[TabType.FILES];
			const widgetParams = params[TabType.FILES];

			widget.showComponent(
				new ProfileFilesGrid({ ...widgetParams, parentWidget: widget }),
			);
		}
	}

	async function loadTabsForOpen({ ownerId, selectedTabId, analyticsSection })
	{
		try
		{
			const response = await getTabsDataRunActionExecutorNoCache({
				ownerId,
				selectedTabId,
			})
				.enableJson()
				.call(true)
			;

			if (!response || response.status !== 'success')
			{
				console.error(response);

				const fallbackTabs = getInitialTabs(ownerId);
				const fallbackParams = prepareParams(fallbackTabs, {
					ownerId,
					selectedTabId,
					analyticsSection,
					canView: false,
					isPending: false,
				});

				return {
					preparedTabs: fallbackTabs,
					preparedParams: fallbackParams,
					canView: false,
				};
			}

			const {
				data: {
					canView,
					tabs = [],
				},
			} = response;

			let preparedTabs = prepareTabs(tabs, selectedTabId);
			if (preparedTabs.length === 0)
			{
				preparedTabs = getInitialTabs(ownerId);
			}

			if (canView)
			{
				UserProfileAnalytics.sendProfileView(
					ownerId,
					getInviteStatusFromTabsData(preparedTabs),
					analyticsSection,
				);
			}

			const preparedParams = prepareParams(preparedTabs, {
				ownerId,
				selectedTabId,
				analyticsSection,
				canView,
				isPending: false,
			});

			return {
				preparedTabs,
				preparedParams,
				canView,
			};
		}
		catch (error)
		{
			console.error(error);

			const fallbackTabs = getInitialTabs(ownerId);
			const fallbackParams = prepareParams(fallbackTabs, {
				ownerId,
				selectedTabId,
				analyticsSection,
				canView: false,
				isPending: false,
			});

			return {
				preparedTabs: fallbackTabs,
				preparedParams: fallbackParams,
				canView: false,
			};
		}
	}

	async function initTabNestedWidgetsStatic(tabsWidget, params)
	{
		const nestedWidgets = tabsWidget.nestedWidgets();

		const commonTabInstance = initCommonTabWidget(nestedWidgets, params, tabsWidget);
		if (commonTabInstance)
		{
			commonTabInstance.update(prepareCommonTabProps(nestedWidgets, params, tabsWidget));
		}

		await initFilesTabWidget(nestedWidgets, params);
	}

	module.exports = {
		prepareParams,
		bindEvents,
		initTabNestedWidgets,
		initTabNestedWidgetsStatic,
		getInitialTabs,
		loadTabsForOpen,
	};
});
