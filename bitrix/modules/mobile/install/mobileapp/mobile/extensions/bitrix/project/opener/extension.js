/**
 * @module project/opener
 */
jn.define('project/opener', (require, exports, module) => {
	const { requireLazy } = require('require-lazy');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { showErrorToast } = require('toast');

	const TAB_NAMES = Object.freeze({
		tasks: 'tasks',
		news: 'news',
		disk: 'disk',
		calendar: 'calendar',
	});

	class ProjectOpener
	{
		/**
		 * @public
		 * @returns {{tasks: string, news: string, disk: string, calendar: string}}
		 */
		static get tabId()
		{
			return TAB_NAMES;
		}

		/**
		 * @public
		 * @param {ProjectOpenerParams} [params={}]
		 * @returns {Promise<void>}
		 */
		static async open(params = {})
		{
			const {
				item = null,
				projectId = 0,
				selectedTabId = '',
				siteId = env.siteId,
				siteDir = env.siteDir,
				openChatFirst = true,
				chatId = 0,
				onProjectAccessDenied = null,
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
				if (openChatFirst && await ProjectOpener.tryOpenChatFirst({
					projectId: resolvedProjectId,
					chatId,
					onProjectAccessDenied,
				}))
				{
					return;
				}

				const { WorkgroupUtil } = await requireLazy('project/utils');

				return WorkgroupUtil.openProject(item, openParams);
			}

			return ProjectOpener.openSelectedTab(item, {
				...openParams,
				selectedTabId,
			});
		}

		/**
		 * @private
		 * @param {Object} params
		 * @param {number} params.projectId
		 * @param {number|string} params.chatId
		 * @param {?Function} params.onProjectAccessDenied
		 * @returns {Promise<boolean>}
		 */
		static async tryOpenChatFirst({ projectId, chatId, onProjectAccessDenied })
		{
			const preloadedChatId = ProjectOpener.resolveChatId(chatId);
			if (preloadedChatId > 0 && await ProjectOpener.openChat(preloadedChatId))
			{
				return true;
			}

			const loadedChatId = await ProjectOpener.loadChatId(projectId);
			if (loadedChatId === null)
			{
				if (typeof onProjectAccessDenied === 'function')
				{
					await onProjectAccessDenied({ projectId });

					return true;
				}

				return false;
			}

			return loadedChatId > 0 && await ProjectOpener.openChat(loadedChatId);
		}

		/**
		 * @private
		 * @param {number|string} chatId
		 * @returns {number}
		 */
		static resolveChatId(chatId)
		{
			const normalizedChatId = Number(chatId || 0);

			return normalizedChatId > 0
				? normalizedChatId
				: 0;
		}

		/**
		 * @private
		 * @param {number} projectId
		 * @returns {Promise<?number>}
		 */
		static async loadChatId(projectId)
		{
			try
			{
				const response = await (new RunActionExecutor('mobile.Project.getChatId', {
					projectId,
				}))
					.enableJson()
					.call(false)
				;

				if (response.errors?.length > 0)
				{
					console.error('ProjectOpener.loadChatId', {
						projectId,
						errors: response.errors,
					});

					return null;
				}

				return ProjectOpener.resolveChatId(response.data?.chatId);
			}
			catch (error)
			{
				console.error('ProjectOpener.loadChatId', {
					projectId,
					error,
				});

				return 0;
			}
		}

		/**
		 * @private
		 * @param {number} chatId
		 * @returns {Promise<boolean>}
		 */
		static async openChat(chatId)
		{
			try
			{
				const { openNestedNavigation } = await requireLazy('im:messenger/api/navigation');
				await openNestedNavigation(chatId);

				return true;
			}
			catch (error)
			{
				console.error('ProjectOpener.openChat', {
					chatId,
					error,
				});

				return false;
			}
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
			const { WorkgroupUtil } = await requireLazy('project/utils');
			const preparedProject = await WorkgroupUtil.prepareProjectOpen(item, params);

			if (!preparedProject)
			{
				return;
			}

			if (await ProjectOpener.shouldOpenCalendarExternally(preparedProject, params.selectedTabId))
			{
				await ProjectOpener.openCalendarExternal(preparedProject);

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
		 * @returns {Promise<boolean>}
		 */
		static async shouldOpenCalendarExternally(preparedProject, selectedTabId)
		{
			if (selectedTabId !== TAB_NAMES.calendar)
			{
				return false;
			}

			const { WorkgroupUtil } = await requireLazy('project/utils');
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
		 * @returns {Promise<void>}
		 */
		static async openCalendarExternal(preparedProject)
		{
			const groupId = Number(preparedProject.item?.id || 0);
			const calendarWebPathTemplate = preparedProject.params.calendarWebPathTemplate || '';

			if (groupId <= 0)
			{
				return;
			}

			const { WorkgroupUtil } = await requireLazy('project/utils');
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
				selectedTabId: TAB_NAMES.tasks,
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
				selectedTabId: TAB_NAMES.news,
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
				selectedTabId: TAB_NAMES.disk,
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
				selectedTabId: TAB_NAMES.calendar,
			});
		}
	}

	module.exports = {
		ProjectOpener,
	};
});
