/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports, main_core, pull_queuemanager, tasks_v2_const, tasks_v2_core, tasks_v2_provider_service_fileService, tasks_v2_provider_service_taskService, tasks_v2_provider_service_resultService, ui_vue3_vuex, main_core_events, tasks_v2_application_taskCard, tasks_v2_lib_idUtils, tasks_v2_provider_service_relationService, tasks_v2_provider_service_groupService, tasks_v2_provider_service_flowService, tasks_v2_provider_service_userService, tasks_v2_provider_service_viewersService) {
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
			epicId: mapValue(data.GROUP_ID, data.GROUP_ID === storeTask.groupId ? undefined : 0),
			storyPoints: mapValue(data.GROUP_ID, data.GROUP_ID === storeTask.groupId ? undefined : ''),
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
			crmItemIds: mapCrmItemIds(storeTask.crmItemIds, data.UF_CRM_TASK_ADDED, data.UF_CRM_TASK_DELETED),
			estimatedTime: data.TIME_ESTIMATE,
			needsControl: data.TASK_CONTROL,
			requireResult: mapValue(data.taskRequireResult, data.taskRequireResult === 'Y'),
			requireDeadlineChangeReason: data.taskRequireDeadlineChangeReason
		};
		return Object.fromEntries(Object.entries(task).filter(([, value]) => !main_core.Type.isUndefined(value)));
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

	class TaskPullHandler extends BasePullHandler {
		getMap() {
			return {
				task_update: this.#handleTaskUpdated,
				task_view: this.#handleTaskViewed,
				task_remove: this.#handleTaskDeleted,
				default_deadline_changed: this.#handleDefaultDeadlineChanged,
				task_regular_template_add: this.#handleTaskRegularTemplateAdded,
				task_timer_stop: this.#handleStopOfTimer
			};
		}
		getDelayedMap() {
			return {
				task_update: this.#handleTaskUpdatedDelayed
			};
		}
		#handleTaskUpdated = data => {
			data.AFTER.UF_CRM_TASK_DELETED = data.BEFORE.UF_CRM_TASK_DELETED;
			data.AFTER.taskRequireResult = data.taskRequireResult;
			data.AFTER.taskRequireDeadlineChangeReason = data.requireDeadlineChangeReason;
			const task = mapPushToModel(data.TASK_ID, data.AFTER);
			const taskBefore = mapPushToModel(data.TASK_ID, data.BEFORE);
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
			tasks_v2_provider_service_taskService.taskService.updateStoreTask(id, fields);
		};
		#pushedTasks = {};
		#handleTaskUpdatedDelayed = async data => {
			if (!tasks_v2_provider_service_taskService.taskService.hasStoreTask(data.TASK_ID)) {
				return;
			}
			const task = mapPushToModel(data.TASK_ID, data.AFTER);
			if (!this.isFromAi(data) && data.USER_ID === this.#currentUserId) {
				const {
					TaskFullCard
				} = await main_core.Runtime.loadExtension('tasks.v2.application.task-full-card');
				if (TaskFullCard.isOpened(task.id)) {
					return;
				}
			}
			this.#pushedTasks[task.id] = {
				...this.#pushedTasks[task.id],
				...task
			};
			this.#handleTaskUpdatedDebounced(data);
		};
		#handleTaskUpdatedDebounced = main_core.Runtime.debounce(async data => {
			const task = this.#pushedTasks[data.TASK_ID];
			delete this.#pushedTasks[task.id];
			if (this.#needToLoadTask(data)) {
				await tasks_v2_provider_service_taskService.taskService.get(task.id);
				await this.#loadViewersQuantity(task);
			} else {
				await Promise.all([this.#loadGroup(task), this.#loadFlow(task), tasks_v2_provider_service_userService.userService.list(this.#getUsersIds(task)), tasks_v2_provider_service_taskService.taskService.getRights(task.id), this.#loadViewersQuantity(task)]);
				const {
					id,
					...fields
				} = task;
				tasks_v2_provider_service_taskService.taskService.updateStoreTask(id, fields);
			}
			main_core_events.EventEmitter.emit(tasks_v2_const.EventName.TaskPullUpdated, {
				task: tasks_v2_provider_service_taskService.taskService.getStoreTask(task.id)
			});
		}, 0);
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
		#handleStopOfTimer = async data => {
			if (!data.taskId || !tasks_v2_provider_service_taskService.taskService.hasStoreTask(data.taskId)) {
				return;
			}
			const {
				TaskFullCard
			} = await main_core.Runtime.loadExtension('tasks.v2.application.task-full-card');
			if (!TaskFullCard.isOpened(data.taskId)) {
				void tasks_v2_provider_service_taskService.taskService.get(data.taskId);
			}
		};
		#upsertStage(stageDto) {
			if (stageDto) {
				const stage = tasks_v2_provider_service_groupService.GroupMappers.mapStageDtoToModel(stageDto);
				void this.$store.dispatch(`${tasks_v2_const.Model.Stages}/upsert`, stage);
			}
		}
		#needToLoadTask(data) {
			const notPushableFields = new Set(['DESCRIPTION', 'UF_TASK_WEBDAV_FILES', 'STATUS', 'ALLOW_TIME_TRACKING']);
			return Object.keys(data.AFTER).some(field => notPushableFields.has(field));
		}
		async #loadGroup(task) {
			if (this.#needToLoadGroup(task)) {
				await tasks_v2_provider_service_groupService.groupService.getGroupByTaskId(task.id);
			}
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
			this.#handlers = new Set([new ResultsPullHandler(), new ScrumPullHandler(), new TagsPullHandler(), new TaskPullHandler()]);
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

})(this.BX.Tasks.V2.Provider.Pull = this.BX.Tasks.V2.Provider.Pull || {}, BX, BX.Pull, BX.Tasks.V2.Const, BX.Tasks.V2, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Vue3.Vuex, BX.Event, BX.Tasks.V2.Application, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service);
//# sourceMappingURL=pull-manager.bundle.js.map
