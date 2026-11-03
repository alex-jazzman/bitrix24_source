/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports, main_core, pull_queuemanager, tasks_v2_const, tasks_v2_provider_service_taskService, tasks_v2_core, tasks_v2_provider_service_fileService, tasks_v2_provider_service_resultService, ui_vue3_vuex, main_core_events, tasks_v2_application_taskCard, tasks_v2_lib_idUtils, tasks_v2_provider_service_relationService, tasks_v2_model_groups, tasks_v2_provider_service_flowService, tasks_v2_provider_service_userService, tasks_v2_provider_service_viewersService) {
	'use strict';

	class BasePullHandler {
		constructor() {
			if (new.target === BasePullHandler) {
				throw new TypeError('BasePullHandler: An abstract class cannot be instantiated');
			}
		}
		getMap() {
			return {};
		}
		getDelayedMap() {
			return {};
		}
		isFromAi(data) {
			return data?.FROM_AI === true;
		}
	}

	class CheckListPullHandler extends BasePullHandler {
		#processing = {};
		#pending = {};
		getMap() {
			return {
				checklist_update: this.#handleCheckListUpdate
			};
		}
		#handleCheckListUpdate = data => {
			const {
				taskId
			} = data;
			if (!tasks_v2_provider_service_taskService.taskService.hasStoreTask(taskId, false)) {
				return Promise.resolve();
			}
			const inFlight = this.#processing[taskId];
			if (inFlight) {
				this.#pending[taskId] = data;
				return inFlight;
			}
			return this.#startProcessing(taskId, data);
		};
		#startProcessing(taskId, initial) {
			const run = (async () => {
				let data = initial;
				while (data !== undefined) {
					await this.#processCheckListUpdate(data);
					data = this.#pending[taskId];
					delete this.#pending[taskId];
				}
			})();
			this.#processing[taskId] = run;
			void run.finally(() => {
				if (this.#processing[taskId] === run) {
					delete this.#processing[taskId];
				}
			});
			return run;
		}
		async #processCheckListUpdate(data) {
			const {
				taskId,
				revision,
				checklist
			} = data;
			if (!tasks_v2_provider_service_taskService.taskService.hasStoreTask(taskId, false)) {
				return;
			}
			try {
				const {
					checkListService
				} = await main_core.Runtime.loadExtension('tasks.v2.provider.service.check-list-service');
				if (checkListService.getRevision(taskId) === revision && !this.isFromAi(data)) {
					return;
				}
				await checkListService.applyIncomingTree(taskId, checklist, revision);
			} catch (error) {
				console.error('tasks: checklist_update pull apply failed', taskId, error);
			}
		}
	}

	class ResultsPullHandler extends BasePullHandler {
		getMap() {
			return {
				task_result_create: this.#handleResultCreate,
				task_result_update: this.#handleResultUpdate,
				task_result_delete: this.#handleResultDelete
			};
		}
		#handleResultCreate = async data => {
			const result = data.result;
			const {
				id,
				taskId,
				messageId
			} = result;
			if (tasks_v2_provider_service_resultService.resultService.hasStoreResult(id) || !tasks_v2_provider_service_taskService.taskService.hasStoreTask(taskId)) {
				return;
			}
			const insertedResult = tasks_v2_provider_service_resultService.ResultMappers.mapDtoToModel(result);
			await tasks_v2_provider_service_resultService.resultService.insertStoreResult(insertedResult);
			tasks_v2_provider_service_resultService.resultService.addResultToTask(taskId, id, messageId);
			void tasks_v2_provider_service_resultService.resultService.get(id);
		};
		#handleResultUpdate = async data => {
			const resultDto = data.result;
			const {
				id,
				author
			} = resultDto;
			if (!tasks_v2_provider_service_resultService.resultService.hasStoreResult(id) || author.id === this.#currentUserId) {
				return;
			}
			const result = tasks_v2_provider_service_resultService.ResultMappers.mapDtoToModel(resultDto);
			const resultBefore = tasks_v2_provider_service_resultService.resultService.getStoreResult(id);
			await tasks_v2_provider_service_resultService.resultService.updateStoreResult(id, result);
			if (resultBefore.fileIds) {
				const removedFiles = resultBefore.fileIds.filter(it => !result.fileIds || !result.fileIds.includes(it));
				await tasks_v2_provider_service_fileService.fileService.get(id, tasks_v2_provider_service_fileService.EntityTypes.Result).list(result.fileIds);
				tasks_v2_provider_service_fileService.fileService.get(id, tasks_v2_provider_service_fileService.EntityTypes.Result).remove(removedFiles);
			}
		};
		#handleResultDelete = data => {
			const result = data.result;
			const {
				id,
				taskId
			} = result;
			if (!tasks_v2_provider_service_taskService.taskService.hasStoreTask(taskId) || !tasks_v2_provider_service_resultService.resultService.hasStoreResult(id)) {
				return;
			}
			tasks_v2_provider_service_resultService.resultService.deleteResultFromTask(taskId, id);
			void tasks_v2_provider_service_resultService.resultService.deleteStoreResult(id);
		};
		get #currentUserId() {
			return this.$store.getters[`${tasks_v2_const.Model.Interface}/currentUserId`];
		}
		get $store() {
			return tasks_v2_core.Core.getStore();
		}
	}

	class ScrumPullHandler extends BasePullHandler {
		getMap() {
			return {
				itemUpdated: this.#handleItemUpdated
			};
		}
		#handleItemUpdated = data => {
			const fields = {
				storyPoints: data.storyPoints
			};
			if (!main_core.Type.isUndefined(data.epic)) {
				fields.epicId = data.epic?.id ?? 0;
				if (fields.epicId > 0) {
					void tasks_v2_core.Core.getStore().dispatch(`${tasks_v2_const.Model.Epics}/upsert`, data.epic);
				}
			}
			tasks_v2_provider_service_taskService.taskService.updateStoreTask(data.sourceId, fields);
		};
	}

	class TagsPullHandler extends BasePullHandler {
		getMap() {
			return {
				tags_deleted: this.#handleTagsDeleted
			};
		}
		#handleTagsDeleted = ({
			tagNames,
			userId,
			groupId
		}) => {
			tagNames.forEach(tagName => this.#handleTagDeleted({
				tagName,
				userId,
				groupId
			}));
		};
		#handleTagDeleted = ({
			tagName,
			userId,
			groupId
		}) => {
			if (!groupId && userId !== this.#currentUserId) {
				return;
			}
			const tasks = this.$store.getters[`${tasks_v2_const.Model.Tasks}/getAll`];
			const tasksWithTag = tasks.filter(task => {
				return (task.groupId || 0) === (groupId || 0) && task.tags.includes(tagName);
			});
			tasksWithTag.forEach(task => {
				void tasks_v2_provider_service_taskService.taskService.updateStoreTask(task.id, {
					tags: task.tags.filter(it => it !== tagName)
				});
			});
			main_core_events.EventEmitter.emit(tasks_v2_const.EventName.TagDeleted, {
				tagName,
				groupId
			});
		};
		get #currentUserId() {
			return this.$store.getters[`${tasks_v2_const.Model.Interface}/currentUserId`];
		}
		get $store() {
			return tasks_v2_core.Core.getStore();
		}
	}

	function mapInstantFields(model) {
		const task = {
			id: model.id,
			deadlineTs: model.deadlineTs,
			status: model.status,
			stageId: model.stageId,
			auditorsIds: model.auditorsIds,
			canCreateEpic: model.canCreateEpic,
			canUpdateScrumFields: model.canUpdateScrumFields,
			needsControl: model.needsControl,
			requireResult: model.requireResult,
			requireDeadlineChangeReason: model.requireDeadlineChangeReason
		};
		return Object.fromEntries(Object.entries(task).filter(([, value]) => !main_core.Type.isUndefined(value)));
	}
	function mapPushToModel(id, data) {
		const storeTask = tasks_v2_provider_service_taskService.taskService.getStoreTask(id);
		const task = {
			id,
			title: data.TITLE,
			isImportant: mapValue(data.PRIORITY, data.PRIORITY === 2),
			creatorId: data.CREATED_BY,
			responsibleIds: mapValue(data.RESPONSIBLE_ID, [data.RESPONSIBLE_ID]),
			deadlineTs: mapValue(data.DEADLINE, data.DEADLINE * 1000),
			startPlanTs: mapValue(data.START_DATE_PLAN, data.START_DATE_PLAN * 1000),
			endPlanTs: mapValue(data.END_DATE_PLAN, data.END_DATE_PLAN * 1000),
			groupId: data.GROUP_ID,
			epicId: mapValue(data.GROUP_ID, data.GROUP_ID === storeTask?.groupId ? undefined : 0),
			storyPoints: mapValue(data.GROUP_ID, data.GROUP_ID === storeTask?.groupId ? undefined : ''),
			canCreateEpic: mapValue(data.GROUP_ID, data.GROUP_ID === storeTask?.groupId ? undefined : false),
			canUpdateScrumFields: mapValue(data.GROUP_ID, data.GROUP_ID === storeTask?.groupId ? undefined : false),
			stageId: mapValue(data.STAGE_INFO, data.STAGE_INFO?.id ?? 0),
			flowId: data.FLOW_ID,
			status: mapValue(data.STATUS, mapStatus(data.STATUS)),
			statusChangedTs: mapValue(data.STATUS, Date.now()),
			accomplicesIds: mapValue(data.ACCOMPLICES, mapUserIds(data.ACCOMPLICES)),
			auditorsIds: mapValue(data.AUDITORS, mapUserIds(data.AUDITORS)),
			parentId: mapValue(data.PARENT_ID, Number(data.PARENT_ID) || 0),
			tags: mapValue(data.TAGS, data.TAGS ? data.TAGS.split(',') : []),
			mark: mapValue(data.MARK, mapMark(data.MARK)),
			fileIds: mapValue(data.UF_TASK_WEBDAV_FILES, mapFileIds(data.UF_TASK_WEBDAV_FILES)),
			crmItemIds: mapCrmItemIds(storeTask?.crmItemIds, data.UF_CRM_TASK_ADDED, data.UF_CRM_TASK_DELETED),
			estimatedTime: data.TIME_ESTIMATE,
			needsControl: data.TASK_CONTROL,
			requireResult: mapValue(data.taskRequireResult, data.taskRequireResult === 'Y'),
			requireDeadlineChangeReason: data.taskRequireDeadlineChangeReason
		};
		return Object.fromEntries(Object.entries(task).filter(([field, value]) => !main_core.Type.isUndefined(value) && (field !== 'creatorId' || main_core.Type.isInteger(value) && value > 0)));
	}
	const mapStatus = status => ({
		2: tasks_v2_const.TaskStatus.Pending,
		3: tasks_v2_const.TaskStatus.InProgress,
		4: tasks_v2_const.TaskStatus.SupposedlyCompleted,
		5: tasks_v2_const.TaskStatus.Completed,
		6: tasks_v2_const.TaskStatus.Deferred
	})[status] ?? tasks_v2_const.TaskStatus.Pending;
	const mapMark = mark => ({
		P: tasks_v2_const.Mark.Positive,
		N: tasks_v2_const.Mark.Negative
	})[mark] ?? tasks_v2_const.Mark.None;
	const mapFileIds = ufFiles => {
		return ufFiles ? ufFiles.split(',').map(it => Number(it) || it) : [];
	};
	const mapCrmItemIds = (ids, ufCrmAdded, ufCrmDeleted) => {
		if (main_core.Type.isUndefined(ids) || main_core.Type.isUndefined(ufCrmAdded) && main_core.Type.isUndefined(ufCrmDeleted)) {
			return undefined;
		}
		const deletedIds = new Set(ufCrmDeleted?.split?.(',').map(id => id) ?? []);
		const addedIds = ufCrmAdded?.split?.(',').map(id => id) ?? [];
		return [...ids.filter(id => !deletedIds.has(id)), ...addedIds];
	};
	const mapUserIds = users => {
		if (!users) {
			return [];
		}
		return users.split(',').map(id => Number(id));
	};
	const mapValue = (value, mapped) => main_core.Type.isUndefined(value) ? undefined : mapped;

	const MutedOption = 1;
	class TaskPullHandler extends BasePullHandler {
		getMap() {
			return {
				task_add: this.#handleTaskAdded,
				task_update: this.#handleTaskUpdated,
				task_view: this.#handleTaskViewed,
				task_remove: this.#handleTaskDeleted,
				default_deadline_changed: this.#handleDefaultDeadlineChanged,
				task_regular_template_add: this.#handleTaskRegularTemplateAdded,
				task_timer_start: this.#handleStartOfTimer,
				task_timer_stop: this.#handleStopOfTimer,
				user_option_changed: this.#handleUserOptionChanged
			};
		}
		getDelayedMap() {
			return {
				task_update: this.#handleTaskUpdatedDelayed
			};
		}
		#handleTaskAdded = data => {
			void this.#addTaskToParentStore(data);
		};
		async #addTaskToParentStore(data) {
			const taskId = Number(data.TASK_ID) || 0;
			const hasParentId = !main_core.Type.isUndefined(data.AFTER?.PARENT_ID);
			const parentId = Number(data.AFTER?.PARENT_ID) || 0;
			if (!taskId) {
				return;
			}
			if (parentId) {
				tasks_v2_provider_service_relationService.subTasksService.addStore(parentId, [taskId]);
				return;
			}
			if (hasParentId) {
				return;
			}
			const {
				task
			} = await tasks_v2_provider_service_taskService.taskService.get(taskId);
			if (task?.parentId) {
				tasks_v2_provider_service_relationService.subTasksService.addStore(task.parentId, [taskId]);
			}
		}
		#handleTaskUpdated = data => {
			data.AFTER.UF_CRM_TASK_DELETED = data.BEFORE.UF_CRM_TASK_DELETED;
			data.AFTER.taskRequireResult = data.taskRequireResult;
			data.AFTER.taskRequireDeadlineChangeReason = data.requireDeadlineChangeReason;
			const task = mapPushToModel(data.TASK_ID, data.AFTER);
			const taskBefore = mapPushToModel(data.TASK_ID, data.BEFORE);
			if (!main_core.Type.isUndefined(task.groupId) && task.groupId !== taskBefore.groupId) {
				if (!this.#tasksWithChangedGroup.has(task.id)) {
					this.#groupIdsBeforeChangedGroup.set(task.id, tasks_v2_provider_service_taskService.taskService.getStoreTask(task.id)?.groupId ?? 0);
				}
				this.#tasksWithChangedGroup.add(task.id);
			}
			this.#upsertStage(data.AFTER.STAGE_INFO);
			if (taskBefore.parentId) {
				tasks_v2_provider_service_relationService.subTasksService.deleteStore(taskBefore.parentId, [task.id]);
			}
			if (task.parentId) {
				tasks_v2_provider_service_relationService.subTasksService.addStore(task.parentId, [task.id]);
			}
			if (taskBefore.fileIds) {
				const removedFiles = taskBefore.fileIds.filter(fileId => !task.fileIds.includes(fileId));
				tasks_v2_provider_service_fileService.fileService.get(task.id).remove(removedFiles);
			}
			const {
				id,
				...fields
			} = mapInstantFields(task);
			tasks_v2_provider_service_taskService.taskService.updateStoreTask(id, fields, 'server');
			if (task.auditorsIds && tasks_v2_provider_service_taskService.taskService.hasStoreTask(task.id)) {
				void tasks_v2_provider_service_userService.userService.list(task.auditorsIds);
			}
		};
		#pushedTasks = {};
		#taskUpdateDebouncers = new Map();
		#tasksWithChangedGroup = new Set();
		#groupIdsBeforeChangedGroup = new Map();
		#taskUpdateSequences = new Map();
		#taskUpdateVersions = new Map();
		#handleTaskUpdatedDelayed = async data => {
			if (!tasks_v2_provider_service_taskService.taskService.hasStoreTask(data.TASK_ID)) {
				this.#tasksWithChangedGroup.delete(data.TASK_ID);
				this.#groupIdsBeforeChangedGroup.delete(data.TASK_ID);
				return;
			}
			const task = mapPushToModel(data.TASK_ID, data.AFTER);
			const taskBefore = mapPushToModel(data.TASK_ID, data.BEFORE);
			const updateSequence = (this.#taskUpdateSequences.get(task.id) ?? 0) + 1;
			this.#taskUpdateSequences.set(task.id, updateSequence);
			if (!this.isFromAi(data) && data.USER_ID === this.#currentUserId) {
				const {
					TaskFullCard
				} = await main_core.Runtime.loadExtension('tasks.v2.application.task-full-card');
				if (this.#taskUpdateSequences.get(task.id) !== updateSequence) {
					return;
				}
				if (TaskFullCard.isOpened(task.id) && !this.#tasksWithChangedGroup.has(task.id)) {
					return;
				}
			}
			const updateVersion = (this.#taskUpdateVersions.get(task.id) ?? 0) + 1;
			this.#taskUpdateVersions.set(task.id, updateVersion);
			const pendingTask = this.#pushedTasks[task.id];
			const hasGroupChange = !main_core.Type.isUndefined(task.groupId) && task.groupId !== taskBefore.groupId;
			this.#pushedTasks[task.id] = {
				...pendingTask,
				...task,
				...(pendingTask?.groupId && !hasGroupChange && this.#tasksWithChangedGroup.has(task.id) ? {
					groupId: pendingTask.groupId
				} : {})
			};
			if (!this.#taskUpdateDebouncers.has(task.id)) {
				this.#taskUpdateDebouncers.set(task.id, main_core.Runtime.debounce((pushData, version) => {
					this.#taskUpdateDebouncers.delete(task.id);
					void this.#applyTaskUpdate(pushData, version);
				}, 0));
			}
			this.#taskUpdateDebouncers.get(task.id)(data, updateVersion);
		};
		async #applyTaskUpdate(data, updateVersion) {
			const task = this.#pushedTasks[data.TASK_ID];
			if (!task || this.#taskUpdateVersions.get(task.id) !== updateVersion) {
				return;
			}
			const shouldRefreshScrumInfo = this.#tasksWithChangedGroup.has(task.id);
			if (this.#needToLoadTask(data)) {
				await tasks_v2_provider_service_taskService.taskService.get(task.id);
				await this.#loadViewersQuantity(task);
			} else {
				await Promise.all([this.#loadGroup(task), this.#loadFlow(task), tasks_v2_provider_service_userService.userService.list(this.#getUsersIds(task)), tasks_v2_provider_service_taskService.taskService.getRights(task.id), this.#loadViewersQuantity(task)]);
				const {
					id,
					...fields
				} = task;
				const currentGroupId = tasks_v2_provider_service_taskService.taskService.getStoreTask(id)?.groupId;
				const groupIdBeforeChangedGroup = this.#groupIdsBeforeChangedGroup.get(task.id);
				if (task.groupId > 0 && groupIdBeforeChangedGroup > 0 && currentGroupId === 0) {
					for (const field of ['groupId', 'epicId', 'storyPoints', 'canCreateEpic', 'canUpdateScrumFields', 'stageId', 'flowId']) {
						delete fields[field];
					}
				}
				if (this.#taskUpdateVersions.get(task.id) !== updateVersion) {
					return;
				}
				tasks_v2_provider_service_taskService.taskService.updateStoreTask(id, fields, 'server');
			}
			if (this.#taskUpdateVersions.get(task.id) !== updateVersion) {
				return;
			}
			delete this.#pushedTasks[task.id];
			this.#tasksWithChangedGroup.delete(task.id);
			if (shouldRefreshScrumInfo) {
				await this.#refreshScrumInfo(task.id);
			}
			main_core_events.EventEmitter.emit(tasks_v2_const.EventName.TaskPullUpdated, {
				task: tasks_v2_provider_service_taskService.taskService.getStoreTask(task.id)
			});
		}
		#handleTaskViewed = data => {};
		#handleTaskDeleted = data => {
			const taskId = data.TASK_ID;
			void tasks_v2_provider_service_taskService.taskService.deleteStore(taskId);
			main_core_events.EventEmitter.emit(tasks_v2_const.EventName.CloseFullCard, {
				taskId
			});
			main_core_events.EventEmitter.emit(tasks_v2_const.EventName.TaskDeleted, {
				id: taskId
			});
		};
		#handleDefaultDeadlineChanged = ({
			deadlineUserOption
		}) => {
			void this.$store.dispatch(`${tasks_v2_const.Model.Interface}/updateDeadlineUserOption`, deadlineUserOption);
		};
		#handleTaskRegularTemplateAdded = data => {
			const templateId = data.templateId;
			BX.UI.Notification.Center.notify({
				id: main_core.Text.getRandom(),
				content: main_core.Loc.getMessage('TASKS_V2_NOTIFY_REPLICATE_TEMPLATE_CREATED'),
				useAirDesign: true,
				actions: [{
					title: main_core.Loc.getMessage('TASKS_V2_NOTIFY_REPLICATE_TEMPLATE_OPEN'),
					events: {
						click: (clickEvent, balloon) => {
							balloon.close();
							tasks_v2_application_taskCard.TaskCard.showFullCard({
								taskId: tasks_v2_lib_idUtils.idUtils.boxTemplate(templateId)
							});
						}
					}
				}]
			});
		};
		#handleStartOfTimer = data => {
			this.#applyTimerChange(data.taskId, task => this.#startTimerFields(task, data));
		};
		#handleStopOfTimer = data => {
			this.#applyTimerChange(data.taskId, task => this.#stopTimerFields(task, data));
		};

		// Timer freshness rides task_timer_start/task_timer_stop (CONTRACT-timer-state), never task_update:
		// the backend sends task_update before the timer side effect, so its timers are stale.
		// Every push applies a targeted store patch with the fresh timer fields; non-timer fields
		// ride the accompanying task_update, so no full task reload is needed here.
		#applyTimerChange(taskId, buildFields) {
			if (!taskId || !tasks_v2_provider_service_taskService.taskService.hasStoreTask(taskId)) {
				return;
			}
			tasks_v2_provider_service_taskService.taskService.updateStoreTask(taskId, buildFields(tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId)));
		}
		#startTimerFields(task, data) {
			const currentUserId = this.#currentUserId;
			const timers = (task.timers ?? []).filter(timer => timer.userId !== currentUserId);
			timers.push({
				userId: currentUserId,
				taskId: String(data.taskId),
				startedAtTs: data.timerStartedAtTs,
				seconds: 0
			});
			const fields = {
				timers
			};
			if (main_core.Type.isNumber(data.timeSpentInLogs)) {
				fields.timeSpent = data.timeSpentInLogs;
			}
			return fields;
		}
		#stopTimerFields(task, data) {
			const timers = (task.timers ?? []).filter(timer => timer.userId !== data.userId);
			const fields = {
				timers
			};
			const timeElapsed = data.timeElapsed?.[data.userId];
			if (data.userId === this.#currentUserId && main_core.Type.isNumber(timeElapsed)) {
				fields.timeSpent = timeElapsed;
			}
			return fields;
		}
		#handleUserOptionChanged = data => {
			if (data.OPTION !== MutedOption || data.USER_ID !== this.#currentUserId) {
				return;
			}
			tasks_v2_provider_service_taskService.taskService.updateStoreTask(data.TASK_ID, {
				isMuted: data.ADDED
			});
		};
		#upsertStage(stageDto) {
			if (stageDto) {
				const stage = tasks_v2_model_groups.mapStageDtoToModel(stageDto);
				void this.$store.dispatch(`${tasks_v2_const.Model.Stages}/upsert`, stage);
			}
		}
		#needToLoadTask(data) {
			const notPushableFields = new Set(['DESCRIPTION', 'UF_TASK_WEBDAV_FILES', 'STATUS', 'ALLOW_TIME_TRACKING']);
			return Object.keys(data.AFTER).some(field => notPushableFields.has(field));
		}
		async #loadGroup(task) {
			if (this.#needToLoadGroup(task)) {
				const {
					groupService
				} = await main_core.Runtime.loadExtension('tasks.v2.provider.service.group-service');
				await groupService.getGroupByTaskId(task.id);
			}
		}
		async #refreshScrumInfo(taskId) {
			const {
				groupService
			} = await main_core.Runtime.loadExtension('tasks.v2.provider.service.group-service');
			await groupService.getScrumInfo(taskId, {
				force: true
			});
		}
		#needToLoadGroup(task) {
			if (this.#needToLoadFlow(task)) {
				return false;
			}
			return task.groupId && !this.$store.getters[`${tasks_v2_const.Model.Groups}/getById`](task.groupId);
		}
		async #loadFlow(task) {
			if (this.#needToLoadFlow(task)) {
				await tasks_v2_provider_service_flowService.flowService.getFlow(task.flowId);
			}
		}
		#needToLoadFlow(task) {
			return task.flowId && !this.$store.getters[`${tasks_v2_const.Model.Flows}/getById`](task.flowId);
		}
		#getUsersIds(task) {
			return [task.creatorId, ...(task.responsibleIds ?? []), ...(task.accomplicesIds ?? []), ...(task.auditorsIds ?? [])].filter(id => id);
		}
		async #loadViewersQuantity(task) {
			await tasks_v2_provider_service_viewersService.viewersService.count(task.id);
		}
		get #currentUserId() {
			return this.$store.getters[`${tasks_v2_const.Model.Interface}/currentUserId`];
		}
		get $store() {
			return tasks_v2_core.Core.getStore();
		}
	}

	class PullManager {
		#params;
		#loadItemsDelay = 500;
		#handlers;
		constructor(params) {
			this.#params = params;
			this.#handlers = new Set([new CheckListPullHandler(), new ResultsPullHandler(), new ScrumPullHandler(), new TagsPullHandler(), new TaskPullHandler()]);
		}
		initQueueManager() {
			return new pull_queuemanager.QueueManager({
				moduleId: tasks_v2_const.Module.Tasks,
				userId: this.#params.currentUserId,
				config: {
					loadItemsDelay: this.#loadItemsDelay
				},
				additionalData: {},
				events: {
					onBeforePull: baseEvent => {
						this.#onBeforePull(baseEvent);
					},
					onPull: baseEvent => {
						this.#onPull(baseEvent);
					}
				},
				callbacks: {
					onBeforeQueueExecute: items => {
						return this.#onBeforeQueueExecute(items);
					},
					onQueueExecute: items => {
						return this.#onQueueExecute(items);
					},
					onReload: () => {
						this.#onReload();
					}
				}
			});
		}
		#onBeforePull(baseEvent) {
			const {
				pullData: {
					command,
					params
				}
			} = baseEvent.data;
			for (const handler of this.#handlers) {
				handler.getMap()[command]?.(params);
			}
		}
		#onPull(baseEvent) {
			const {
				pullData: {
					command,
					params
				},
				promises
			} = baseEvent.data;
			for (const handler of this.#handlers) {
				if (handler.getDelayedMap()[command]) {
					promises.push(Promise.resolve({
						data: {
							id: params.entityId ?? main_core.Text.getRandom(),
							command,
							params
						}
					}));
				}
			}
		}
		#onBeforeQueueExecute(items) {
			return Promise.resolve();
		}
		async #onQueueExecute(items) {
			await this.#executeQueue(items);
		}
		#onReload(event) {}
		#executeQueue(items) {
			return new Promise(resolve => {
				items.forEach(item => {
					const {
						data: {
							command,
							params
						}
					} = item;
					for (const handler of this.#handlers) {
						handler.getDelayedMap()[command]?.(params);
					}
				});
				resolve();
			});
		}
	}

	exports.PullManager = PullManager;

})(this.BX.Tasks.V2.Provider.Pull = this.BX.Tasks.V2.Provider.Pull || {}, BX, BX.Pull, BX.Tasks.V2.Const, BX.Tasks.V2.Provider.Service, BX.Tasks.V2, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Vue3.Vuex, BX.Event, BX.Tasks.V2.Application, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Model, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service);
//# sourceMappingURL=pull-manager.bundle.js.map
