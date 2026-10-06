/**
 * @module tasks/entry
 */
jn.define('tasks/entry', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color } = require('tokens');
	const { checkDisabledToolById } = require('settings/disabled-tools');
	const { InfoHelper } = require('layout/ui/info-helper');
	const { FeatureId, TaskStatus } = require('tasks/enum');
	const { getFeatureRestriction, tariffPlanRestrictionsReady } = require('tariff-plan-restriction');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { requireLazy } = require('require-lazy');
	const { dispatch, getState } = require('statemanager/redux/store');
	const { showToast } = require('toast');
	const {
		selectById,
		selectByTaskIdOrGuid,
		selectActions,
		updateDeadline,
		updateChecklist,
		tasksUpserted,
	} = require('tasks/statemanager/redux/slices/tasks');
	const { Type } = require('type');
	const { Notify } = require('notify');
	const { guid } = require('utils/guid');

	const MS_PER_SECOND = 1000;

	class Entry
	{
		/**
		 * @param {string} toolId
		 * @param {string} infoCode
		 * @returns {Promise<boolean>}
		 */
		static async checkToolAvailable(toolId, infoCode)
		{
			const toolDisabled = await checkDisabledToolById(toolId);
			if (toolDisabled)
			{
				const sliderUrl = await InfoHelper.getUrlByCode(infoCode);
				helpdesk.openHelp(sliderUrl);

				return false;
			}

			return true;
		}

		/**
		 * @param {OpenEfficiencyData} data
		 * @param {OpenEfficiencyParams} [params]
		 * @returns {Promise<void>}
		 */
		static async openEfficiency(data, params = {})
		{
			if (!await Entry.checkToolAvailable('effective', 'limit_tasks_off'))
			{
				return;
			}

			await tariffPlanRestrictionsReady();
			const { isRestricted, showRestriction } = getFeatureRestriction(FeatureId.EFFICIENCY);
			if (isRestricted())
			{
				showRestriction({ showInComponent: params.isBackground });

				return;
			}

			const { userId, groupId } = data;

			PageManager.openPage({
				url: `${env.siteDir}/mobile/tasks/snmrouter/?routePage=efficiency&USER_ID=${userId}&GROUP_ID=${groupId}`,
				titleParams: {
					text: Loc.getMessage('TASKSMOBILE_ENTRY_EFFICIENCY_TITLE'),
				},
				enableNavigationBarBorder: false,
				backgroundColor: Color.bgSecondary.toHex(),
				backdrop: {
					mediumPositionHeight: 530,
					navigationBarColor: Color.bgSecondary.toHex(),
				},
				cache: false,
			});
		}

		/**
		 * @public
		 * @param {OpenTaskData} data
		 * @param {OpenTaskParams} params
		 * @return {void}
		 */
		static async openTask(data, params = {})
		{
			if (!await Entry.checkToolAvailable('tasks', 'limit_tasks_off'))
			{
				return;
			}

			const {
				userId = Number(env.userId),
				parentWidget,
				analyticsLabel,
				shouldOpenComments = false,
				view,
				kanbanOwnerId,
				projectId = null,
			} = params;
			const taskId = data.id || data.taskId;
			const taskGuid = guid();
			const isFlowToolDisabled = await checkDisabledToolById('flows', false);
			const isChatFeatureEnabled = await Entry.#isChatFeatureEnabled();

			if (parentWidget)
			{
				const { TaskView } = await requireLazy('tasks:layout/task/view-new');

				TaskView.open({
					layoutWidget: parentWidget,
					userId,
					taskId,
					guid: taskGuid,
					analyticsLabel,
					shouldOpenComments,
					view,
					kanbanOwnerId,
					projectId,
					isFlowToolDisabled,
					isChatFeatureEnabled,
				});
			}
			else
			{
				PageManager.openComponent('JSStackComponent', {
					name: 'JSStackComponent',
					componentCode: 'tasks.task.view-new',
					// eslint-disable-next-line no-undef
					scriptPath: availableComponents['tasks:tasks.task.view-new'].publicUrl,
					canOpenInDefault: true,
					rootWidget: {
						name: 'layout',
						settings: {
							titleParams: {
								text: Loc.getMessage('TASKSMOBILE_ENTRY_TASK_DEFAULT_TITLE'),
								type: 'entity',
							},
							objectName: 'layout',
							swipeToClose: true,
						},
					},
					params: {
						COMPONENT_CODE: 'tasks.task.view-new',
						TASK_ID: taskId,
						USER_ID: (userId || env.userId),
						GUID: taskGuid,
						VIEW: view,
						SHOULD_OPEN_COMMENTS: shouldOpenComments,
						analyticsLabel,
						kanbanOwnerId,
						IS_FLOW_TOOL_DISABLED: isFlowToolDisabled,
						IS_CHAT_FEATURE_ENABLED: isChatFeatureEnabled,
					},
				});
			}
		}

		/**
		 * @public
		 * @param {OpenCommentsOptions} options
		 * @returns {Promise<void>}
		 */
		static async openComments(options)
		{
			if (!await Entry.checkToolAvailable('tasks', 'limit_tasks_off'))
			{
				return;
			}

			const { taskId, analyticsLabel = {} } = options || {};
			if (!taskId || taskId <= 0)
			{
				return;
			}

			const { CommentsOpener } = await requireLazy('tasks:layout/task/comments-opener');

			const opener = new CommentsOpener(analyticsLabel);
			opener.openCommentsWidget(taskId);
		}

		/**
		 * @param {OpenDeadlinePickerOptions} options
		 * @returns {Promise<void>}
		 */
		static async openDeadlinePicker(options)
		{
			const ctx = await Entry.#prepareTaskContext(options);
			if (!ctx)
			{
				return;
			}
			const { task = null } = ctx;
			if (!task)
			{
				return;
			}

			const { DeadlinePicker } = await requireLazy('tasks:deadline-picker');
			const currentDeadline = task.deadline ? (task.deadline * MS_PER_SECOND) : null;
			const { taskId, layout = PageManager } = options;

			(new DeadlinePicker({
				canSetNoDeadline: true,
				task,
				parentWidget: layout,
			}))
				.checkCanOpen()
				.then((datePicker) => datePicker.show({
					deadline: currentDeadline,
				}))
				.then(({ deadline, reason }) => {
					if (deadline !== currentDeadline)
					{
						dispatch(
							updateDeadline({
								taskId,
								deadline,
								reason,
							}),
						);
					}
				})
				.catch(console.error)
			;
		}

		/**
		 * @param {OpenChecklistOptions} options
		 * @returns {Promise<void>}
		 */
		static async openChecklist(options)
		{
			const checklistId = Number(options.entityId);
			if (!checklistId)
			{
				return;
			}

			const ctx = await Entry.#prepareTaskContext(options, { withChecklists: true });
			if (!ctx)
			{
				return;
			}

			const { task, checklist } = ctx;

			const { openChecklistWithPreparedData } = await requireLazy('tasks:checklist');

			void openChecklistWithPreparedData({
				taskId: Number(options?.taskId),
				userId: Number(options?.userId),
				checklistId,
				groupId: task.groupId,
				checklistTree: checklist?.tree,
				onChange: (checklistController) => {
					const { completed, uncompleted, checklistDetails } = checklistController.getReduxData();
					dispatch(updateChecklist({
						checklistDetails,
						taskId: Number(options?.taskId),
						checklist: { completed, uncompleted },
					}));
				},
			});
		}

		/**
		 * @param {OpenResultParams} params
		 * @returns {Promise<void>}
		 */
		static async openResult(params)
		{
			const resultId = Number(params?.entityId);

			if (!resultId)
			{
				return;
			}

			const ctx = await Entry.#prepareTaskContext(params);
			if (!ctx)
			{
				return;
			}

			const { ResultEntry } = await requireLazy('tasks:layout/fields/result-v2/entry');

			void ResultEntry.openResult(
				resultId,
				params.isFocused,
				Number(params.taskId),
				params.parentWidget,
				params.isWithAnotherResultsEmptyState,
			);
		}

		/**
		 * @param {CompleteTaskParams} params
		 * @returns {Promise<void>}
		 */
		static async completeTask(params)
		{
			const ctx = await Entry.#prepareTaskContext(params);
			if (!ctx)
			{
				return;
			}
			const { task } = ctx;

			const status = Number(task.status);

			if (status === TaskStatus.COMPLETED)
			{
				showToast({
					message: Loc.getMessage('TASKSMOBILE_ENTRY_TASK_ALREADY_COMPLETED'),
				});

				return;
			}

			const actions = selectActions({ task: selectById(getState(), Number(params.taskId)) });

			if (!actions?.complete && !actions?.approve)
			{
				showToast({
					message: Loc.getMessage('TASKSMOBILE_ENTRY_TASK_COMPLETE_NOT_ACCESSIBLE'),
				});

				return;
			}

			const { ActionId, ActionMeta } = await requireLazy('tasks:layout/action-menu/actions', false);
			const isSupposedlyCompleted = status === TaskStatus.SUPPOSEDLY_COMPLETED;
			const isTaskCreator = task.creator === Number(env.userId);
			const canApprove = actions?.approve && isSupposedlyCompleted && isTaskCreator;

			if (actions?.complete || canApprove)
			{
				await ActionMeta[ActionId.COMPLETE].handleAction({ task, layout: PageManager });
			}
			else
			{
				showToast({
					message: Loc.getMessage('TASKSMOBILE_ENTRY_TASK_COMPLETE_NOT_ACCESSIBLE'),
				});
			}
		}

		/**
		 * @param {{ taskId: number, userId?: number }} params
		 * @param {{ withChecklists?: boolean }} [extra]
		 */
		static async #prepareTaskContext(params, extra = {})
		{
			if (!await Entry.checkToolAvailable('tasks', 'limit_tasks_off'))
			{
				return null;
			}

			if (!extra?.withChecklists)
			{
				const task = selectByTaskIdOrGuid(getState(), params?.taskId);

				if (task)
				{
					return { task };
				}
			}

			const data = await Entry.#getTaskData(params?.taskId, params?.userId, extra);

			if (!data?.task)
			{
				await Entry.#showTaskAccessDeniedToast();

				return null;
			}

			return data;
		}

		static async #showTaskAccessDeniedToast()
		{
			showToast({
				message: Loc.getMessage('TASKSMOBILE_ENTRY_TASK_NOT_ACCESSIBLE'),
			});
		}

		/**
		 * @returns {Promise<boolean>}
		 */
		static async #isChatFeatureEnabled()
		{
			return new Promise((resolve) => {
				new RunActionExecutor('tasksmobile.Settings.isChatFeatureEnabled')
					.setHandler((response) => resolve(response.data))
					.call()
				;
			});
		}

		/**
		 * @param {number|string} taskId
		 * @param {number|string} userId
		 * @param {{ withChecklists?: boolean }} [extra]
		 */
		static async #getTaskData(taskId, userId, extra = {})
		{
			const taskIdNumber = Number(taskId);
			const userIdNumber = Number(userId);
			if (!taskIdNumber || taskIdNumber <= 0 || !userIdNumber || userIdNumber <= 0)
			{
				return null;
			}

			void Notify.showIndicatorLoading();

			try
			{
				const response = await BX.ajax.runAction(
					'tasksmobile.Task.get',
					{
						data: {
							taskId: taskIdNumber,
							params: {
								WITH_CHECKLIST_DATA: extra?.withChecklists ? 'Y' : 'N',
								MARKED_AS_VIEWED: 'N',
							},
						},
					},
				);

				Notify.hideCurrentIndicator();

				const { status, data } = response || {};
				if (status === 'success' && data && Type.isArrayFilled(data.tasks))
				{
					const { tasks, checklist = [] } = data;

					await dispatch(
						tasksUpserted({
							tasks,
							ownerId: userIdNumber,
						}),
					);

					return {
						checklist,
						task: selectByTaskIdOrGuid(getState(), taskIdNumber),
					};
				}
			}
			catch
			{
				Notify.hideCurrentIndicator();
			}

			return null;
		}

		/**
		 * @public
		 * @param {OpenTaskCreationData} data
		 * @return {void}
		 */
		static async openTaskCreation(data)
		{
			if (!await Entry.checkToolAvailable('tasks', 'limit_tasks_off'))
			{
				return;
			}

			const isFlowToolDisabled = await checkDisabledToolById('flows', false);

			const { CreateNew } = await requireLazy('tasks:layout/task/create-new');
			CreateNew.open({ ...data, isFlowToolDisabled });
		}

		/**
		 * @param {OpenTaskListData} data
		 * @returns {Promise<void>}
		 */
		static async openTaskList(data)
		{
			if (!await Entry.checkToolAvailable('tasks', 'limit_tasks_off'))
			{
				return;
			}

			const { siteId, siteDir, languageId, userId } = env;
			const extendedData = {
				...data,
				flowId: data.flowId || 0,
				flowName: data.flowName || null,
				flowEfficiency: data.flowEfficiency || null,
				canCreateTask: data.canCreateTask ?? true,
				groupId: data.groupId || 0,
				collabId: data.collabId || 0,
				ownerId: data.ownerId || userId,
				getProjectData: data.getProjectData || true,
				analyticsLabel: data.analyticsLabel || {},
			};

			PageManager.openComponent('JSStackComponent', {
				componentCode: 'tasks.dashboard',
				canOpenInDefault: true,
				title: (
					extendedData.collabId > 0
						? Loc.getMessage('TASKSMOBILE_ENTRY_COLLAB_TASK_LIST_TITLE')
						: (extendedData.groupName || Loc.getMessage('TASKSMOBILE_ENTRY_TASK_LIST_TITLE'))
				),
				// eslint-disable-next-line no-undef
				scriptPath: availableComponents['tasks:tasks.dashboard'].publicUrl,
				rootWidget: {
					name: 'layout',
					settings: {
						objectName: 'layout',
						useSearch: true,
						useLargeTitleMode: true,
					},
				},
				params: {
					COMPONENT_CODE: 'tasks.dashboard',
					GROUP_ID: extendedData.groupId,
					COLLAB_ID: extendedData.collabId,
					USER_ID: extendedData.ownerId,
					FLOW_ID: extendedData.flowId,
					FLOW_NAME: extendedData.flowName,
					FLOW_EFFICIENCY: extendedData.flowEfficiency,
					DATA: extendedData,
					SITE_ID: siteId,
					SITE_DIR: siteDir,
					LANGUAGE_ID: languageId,
					PATH_TO_TASK_ADD: `${siteDir}mobile/tasks/snmrouter/?routePage=#action#&TASK_ID=#taskId#`,
					ANALYTICS_LABEL: extendedData.analyticsLabel,
				},
			});
		}
	}

	setTimeout(() => requireLazy('tasks:layout/task/view-new', false), 1000);

	if (typeof jnComponent?.preload === 'function')
	{
		// eslint-disable-next-line no-undef
		const { publicUrl } = availableComponents['tasks:tasks.task.view-new'] || {};

		if (publicUrl)
		{
			setTimeout(() => jnComponent.preload(publicUrl), 3000);
		}
	}

	module.exports = { Entry };
});
