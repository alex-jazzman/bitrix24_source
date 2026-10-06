/**
 * @module project/widget
 */
jn.define('project/widget', (require, exports, module) => {
	const { ProjectTabsManager } = require('project/tabs-manager');
	const { WorkgroupUtil } = require('project/utils');

	class ProjectWidget
	{
		static async open(item, params)
		{
			const subtitle = WorkgroupUtil.getSubtitle(item.params.membersCount);
			const guid = WorkgroupUtil.createGuid();
			const tabs = WorkgroupUtil.getTabsItems(
				{
					siteId: params.siteId,
					siteDir: params.siteDir,
					guid,
					availableFeatures: item.params.features,
					projectNewsPathTemplate: (params.newsPathTemplate || ''),
					analyticsLabel: params.analyticsLabel,
				},
				item,
			);
			const isCalendarTabExternal = WorkgroupUtil.isCalendarTabExternal(tabs);
			const initialTabId = ProjectWidget.resolveInitialTabId(tabs, params.selectedTabId);

			const tabsWidget = await PageManager.openWidget('tabs', {
				objectName: 'tabs',
				titleParams: WorkgroupUtil.getProjectTitleParams(item, subtitle),
				grabTitle: false,
				tabs: {
					items: ProjectWidget.markActiveTab(tabs, initialTabId),
				},
			});

			ProjectWidget.activateInitialTab(tabsWidget, initialTabId);

			return new ProjectTabsManager({
				groupId: item.id,
				subtitle,
				item,
				guid,
				tabs: tabsWidget,
				calendarWebPathTemplate: (params.calendarWebPathTemplate || ''),
				currentUserId: (params.currentUserId || env.userId),
				isCalendarTabExternal,
			});
		}

		static activateInitialTab(widget, tabId)
		{
			if (!tabId || typeof widget?.setActiveItem !== 'function')
			{
				return;
			}

			try
			{
				widget.setActiveItem(tabId);
			}
			catch (error)
			{
				console.error(error);
			}
		}

		/**
		 * Marks the tab matching activeTabId as active in widget tabs data before opening.
		 * Returns a new array without mutating the input; if activeTabId is empty, returns the original array.
		 *
		 * @param {Array<object>} tabs
		 * @param {string} activeTabId
		 * @return {Array<object>}
		 */
		static markActiveTab(tabs, activeTabId)
		{
			if (!activeTabId)
			{
				return tabs;
			}

			return tabs.map((tab) => ({ ...tab, active: tab.id === activeTabId }));
		}

		static resolveInitialTabId(tabs, selectedTabId = '')
		{
			if (selectedTabId)
			{
				const selectedTab = tabs.find((tab) => tab.id === selectedTabId && tab.selectable !== false);
				if (selectedTab)
				{
					return selectedTab.id;
				}
			}

			return tabs.find((tab) => tab.active || tab.selectable !== false)?.id || '';
		}
	}

	module.exports = {
		ProjectWidget,
	};
});
