/**
 * @module project/opener
 */
jn.define('project/opener', (require, exports, module) => {
	const { requireLazy } = require('require-lazy');
	const { showErrorToast } = require('toast');
	const { WorkgroupUtil } = require('project/utils');

	/**
	 * @typedef {Object} ProjectOpenerItem
	 * @property {number|string} id Project id.
	 * @property {string} [title] Project title.
	 * @property {'group'|'project'|'scrum'|'collab'} [type] Workgroup type.
	 * @property {Object} [params] Additional project params used by project openers.
	 */

	/**
	 * @typedef {Object} ProjectOpenerParams
	 * @property {?ProjectOpenerItem} [item=null] Project item if it is already available.
	 * @property {number|string} [projectId=0] Project id. If omitted, opener will try to use item.id.
	 * @property {string} [selectedTabId=''] Initial tab id to open.
	 * @property {?string} [siteId=env.siteId] Site id used for project opening.
	 * @property {?string} [siteDir=env.siteDir] Site dir used for project opening.
	 * @property {string} [newsPathTemplate=''] Optional news path template.
	 * @property {string} [calendarWebPathTemplate=''] Optional calendar path template.
	 * @property {number|string} [currentUserId=env.userId] Current user id.
	 * @property {Object} [analyticsLabel] Optional analytics payload.
	 */

	class ProjectOpener
	{
		/**
		 * @public
		 * @returns {{tasks: string, news: string, disk: string, calendar: string}}
		 */
		static get tabId()
		{
			return WorkgroupUtil.tabNames;
		}

		/**
		 * @public
		 * @param {ProjectOpenerParams} [params={}]
		 * @returns {Promise<void>}
		 */
		static open(params = {})
		{
			const {
				item = null,
				projectId = 0,
				selectedTabId = '',
				siteId = env.siteId,
				siteDir = env.siteDir,
				...restParams
			} = params;
			const resolvedProjectId = ProjectOpener.resolveProjectId(projectId, item);

			if (resolvedProjectId <= 0)
			{
				console.error('ProjectOpener.open: projectId must be a positive integer.', params);

				return Promise.resolve();
			}

			const openParams = {
				...restParams,
				projectId: resolvedProjectId,
				siteId,
				siteDir,
			};

			if (!selectedTabId)
			{
				return WorkgroupUtil.openProject(item, openParams);
			}

			return ProjectOpener.openSelectedTab(item, {
				...openParams,
				selectedTabId,
			});
		}

		/**
		 * @private
		 * @param {number|string} projectId
		 * @param {?ProjectOpenerItem} item
		 * @returns {number}
		 */
		static resolveProjectId(projectId, item)
		{
			const normalizedProjectId = Number(projectId || item?.id || '0');

			return normalizedProjectId > 0
				? normalizedProjectId
				: 0;
		}

		/**
		 * @private
		 * @param {?ProjectOpenerItem} item
		 * @param {ProjectOpenerParams} params
		 * @returns {Promise<void>}
		 */
		static async openSelectedTab(item, params)
		{
			const preparedProject = await WorkgroupUtil.prepareProjectOpen(item, params);

			if (!preparedProject)
			{
				return;
			}

			if (ProjectOpener.shouldOpenCalendarExternally(preparedProject, params.selectedTabId))
			{
				ProjectOpener.openCalendarExternal(preparedProject);

				return;
			}

			try
			{
				const { ProjectWidget } = await requireLazy('project/widget');

				await ProjectWidget.open(preparedProject.item, {
					...preparedProject.params,
					selectedTabId: params.selectedTabId,
				});
			}
			catch (error)
			{
				console.error(error);
				showErrorToast();
			}
		}

		/**
		 * @private
		 * @param {{item: ProjectOpenerItem, params: ProjectOpenerParams}} preparedProject
		 * @param {string} selectedTabId
		 * @returns {boolean}
		 */
		static shouldOpenCalendarExternally(preparedProject, selectedTabId)
		{
			if (selectedTabId !== WorkgroupUtil.tabNames.calendar)
			{
				return false;
			}

			const tabs = WorkgroupUtil.getTabsItems(
				{
					siteId: preparedProject.params.siteId,
					siteDir: preparedProject.params.siteDir,
					guid: WorkgroupUtil.createGuid(),
					availableFeatures: preparedProject.item.params.features,
					projectNewsPathTemplate: (preparedProject.params.newsPathTemplate || ''),
					analyticsLabel: preparedProject.params.analyticsLabel,
				},
				preparedProject.item,
			);

			return WorkgroupUtil.isExternalTab(tabs, selectedTabId);
		}

		/**
		 * @private
		 * @param {{item: ProjectOpenerItem, params: ProjectOpenerParams}} preparedProject
		 * @returns {void}
		 */
		static openCalendarExternal(preparedProject)
		{
			const groupId = Number(preparedProject.item?.id || 0);
			const calendarWebPathTemplate = preparedProject.params.calendarWebPathTemplate || '';

			if (groupId <= 0)
			{
				return;
			}

			void WorkgroupUtil.onTabSelectedCalendar(
				groupId,
				calendarWebPathTemplate.replace('#group_id#', groupId),
			);
		}

		/**
		 * @public
		 * @param {ProjectOpenerParams} [params={}]
		 * @returns {Promise<void>}
		 */
		static openTasks(params = {})
		{
			return ProjectOpener.open({
				...params,
				selectedTabId: WorkgroupUtil.tabNames.tasks,
			});
		}

		/**
		 * @public
		 * @param {ProjectOpenerParams} [params={}]
		 * @returns {Promise<void>}
		 */
		static openNews(params = {})
		{
			return ProjectOpener.open({
				...params,
				selectedTabId: WorkgroupUtil.tabNames.news,
			});
		}

		/**
		 * @public
		 * @param {ProjectOpenerParams} [params={}]
		 * @returns {Promise<void>}
		 */
		static openDisk(params = {})
		{
			return ProjectOpener.open({
				...params,
				selectedTabId: WorkgroupUtil.tabNames.disk,
			});
		}

		/**
		 * @public
		 * @param {ProjectOpenerParams} [params={}]
		 * @returns {Promise<void>}
		 */
		static openCalendar(params = {})
		{
			return ProjectOpener.open({
				...params,
				selectedTabId: WorkgroupUtil.tabNames.calendar,
			});
		}
	}

	module.exports = {
		ProjectOpener,
	};
});
