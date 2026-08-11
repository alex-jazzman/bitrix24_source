/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports, tasks_v2_lib_taskNotification, main_core, main_core_events, ui_notificationManager, tasks_v2_core, tasks_v2_const, tasks_v2_lib_apiClient, tasks_v2_lib_idUtils, tasks_v2_provider_service_taskService, tasks_v2_provider_service_checkListService, tasks_v2_provider_service_remindersService, tasks_v2_provider_service_templateService, tasks_v2_component_fields_replication) {
	'use strict';

	function mapModelToDto(task) {
		const user = tasks_v2_core.Core.getParams().currentUser;
		const parentId = task.parentId;
		const responsibleIds = task.responsibleIds;
		return {
			id: task.id,
			title: task.title,
			description: mapValue(task.description, mapDescription(task.description)),
			descriptionChecksum: task.descriptionChecksum,
			creator: mapValue(task.creatorId, {
				id: task.creatorId
			}),
			createdTs: mapValue(task.createdTs, Math.floor(task.createdTs / 1000)),
			responsible: mapValue(responsibleIds, responsibleIds?.length < 2 ? {
				id: responsibleIds?.[0] ?? 0
			} : user),
			responsibleCollection: mapValue(responsibleIds, responsibleIds?.map(id => ({
				id
			}))),
			isMultitask: mapValue(responsibleIds, responsibleIds?.length > 1),
			deadlineTs: mapValue(task.deadlineTs, Math.floor(task.deadlineTs / 1000)),
			deadlineAfter: mapValue(task.deadlineAfter, Math.floor(task.deadlineAfter / 1000)),
			needsControl: tasks_v2_core.Core.getParams().restrictions.control.available ? task.needsControl : false,
			startPlanTs: mapValue(task.startPlanTs, Math.floor(task.startPlanTs / 1000)),
			endPlanTs: mapValue(task.endPlanTs, Math.floor(task.endPlanTs / 1000)),
			startDatePlanAfter: mapValue(task.startDatePlanAfter, Math.floor(task.startDatePlanAfter / 1000)),
			endDatePlanAfter: mapValue(task.endDatePlanAfter, Math.floor(task.endDatePlanAfter / 1000)),
			fileIds: task.fileIds,
			checklist: task.checklist,
			parent: mapValue(parentId, tasks_v2_lib_idUtils.idUtils.isTemplate(parentId) ? null : {
				id: parentId
			}),
			base: mapValue(parentId, tasks_v2_lib_idUtils.idUtils.isTemplate(parentId) ? {
				id: tasks_v2_lib_idUtils.idUtils.unbox(parentId)
			} : null),
			dependsOn: task.relatedTaskIds,
			ganttLinks: mapValue(task.ganttTaskIds, mapGanttLinks(task.id, task.ganttTaskIds)),
			group: mapValue(task.groupId, {
				id: task.groupId
			}),
			stage: mapValue(task.stageId, {
				id: task.stageId
			}),
			epicId: task.epicId,
			storyPoints: task.storyPoints,
			flow: mapValue(task.flowId, {
				id: task.flowId
			}),
			priority: mapValue(task.isImportant, task.isImportant ? 'high' : 'average'),
			status: task.status,
			statusChangedTs: mapValue(task.statusChangedTs, Math.floor(task.statusChangedTs / 1000)),
			accomplices: mapValue(task.accomplicesIds, task.accomplicesIds?.map(id => ({
				id
			}))),
			auditors: mapValue(task.auditorsIds, task.auditorsIds?.map(id => ({
				id
			}))),
			tags: mapValue(task.tags, task.tags?.map(name => ({
				name
			}))),
			chatId: task.chatId,
			crmItemIds: task.crmItemIds,
			email: task.email,
			allowsChangeDeadline: task.allowsChangeDeadline,
			allowsChangeDatePlan: task.allowsChangeDatePlan,
			allowsTimeTracking: task.allowsTimeTracking,
			estimatedTime: task.estimatedTime,
			matchesWorkTime: tasks_v2_core.Core.getParams().restrictions.skipWeekends.available ? task.matchesWorkTime : false,
			matchesSubTasksTime: tasks_v2_core.Core.getParams().restrictions.relatedSubtaskDeadlines.available ? task.matchesSubTasksTime : false,
			autocompleteSubTasks: tasks_v2_core.Core.getParams().restrictions.relatedSubtaskDeadlines.available ? task.autocompleteSubTasks : false,
			source: task.source,
			templateId: task.templateId,
			requireResult: task.requireResult,
			reminders: mapValue(task.reminders, task.reminders?.map(it => tasks_v2_provider_service_remindersService.RemindersMappers.mapModelToDto(it))),
			maxDeadlineChangeDate: task.maxDeadlineChangeDate,
			maxDeadlineChanges: task.maxDeadlineChanges,
			requireDeadlineChangeReason: task.requireDeadlineChangeReason,
			deadlineChangeReason: task.deadlineChangeReason,
			containsSubTasks: task.containsSubTasks,
			userFields: task.userFields,
			type: mapValue(task.isForNewUser, task.isForNewUser ? tasks_v2_const.TemplateType.NewUsers : tasks_v2_const.TemplateType.Usual),
			permissions: mapValue(task.permissions, task.permissions?.map(it => tasks_v2_provider_service_templateService.TemplateMappers.mapPermissionModelToDto(it))),
			mark: task.mark,
			replicate: task.replicate && main_core.Type.isObject(task.replicateParams),
			replicateParams: mapReplicateParamsToDto(task)
		};
	}
	function mapDtoToModel(taskDto) {
		const allowedNullFields = new Set(['requireDeadlineChangeReason', 'maxDeadlineChangeDate', 'maxDeadlineChanges']);
		const task = {
			id: taskDto.id,
			title: taskDto.title,
			isImportant: mapValue(taskDto.priority, taskDto.priority === 'high'),
			description: mapValue(taskDto.description, main_core.Text.decode(taskDto.description)),
			descriptionChecksum: taskDto.descriptionChecksum,
			creatorId: taskDto.creator?.id,
			createdTs: mapValue(taskDto.createdTs, taskDto.createdTs * 1000),
			changedTs: mapValue(taskDto.changedTs, taskDto.changedTs * 1000),
			activityTs: mapValue(taskDto.activityTs, taskDto.activityTs * 1000),
			responsibleIds: mapTaskDtoToResponsibleIds(taskDto),
			deadlineTs: mapValue(taskDto.deadlineTs, taskDto.deadlineTs * 1000),
			deadlineAfter: mapValue(taskDto.deadlineAfter, taskDto.deadlineAfter * 1000),
			needsControl: taskDto.needsControl,
			startPlanTs: mapValue(taskDto.startPlanTs, taskDto.startPlanTs * 1000),
			endPlanTs: mapValue(taskDto.endPlanTs, taskDto.endPlanTs * 1000),
			startDatePlanAfter: mapValue(taskDto.startDatePlanAfter, taskDto.startDatePlanAfter * 1000),
			endDatePlanAfter: mapValue(taskDto.endDatePlanAfter, taskDto.endDatePlanAfter * 1000),
			fileIds: taskDto.fileIds,
			checklist: taskDto.checklist,
			containsChecklist: taskDto.containsChecklist,
			parentId: taskDto.parent?.id ?? mapValue(taskDto.base, tasks_v2_lib_idUtils.idUtils.boxTemplate(taskDto.base?.id)),
			subTaskIds: taskDto.subTaskIds,
			containsSubTasks: taskDto.containsSubTasks ?? taskDto.containsSubTemplates,
			containsRelatedTasks: taskDto.containsRelatedTasks,
			containsGanttLinks: taskDto.containsGanttLinks,
			containsPlacements: taskDto.containsPlacements,
			containsCommentFiles: taskDto.containsCommentFiles,
			requireResult: taskDto.requireResult,
			containsResults: taskDto.containsResults,
			numberOfReminders: taskDto.numberOfReminders,
			groupId: taskDto.group?.id,
			stageId: taskDto.stage?.id,
			flowId: taskDto.flow?.id,
			status: taskDto.status,
			statusChangedTs: mapValue(taskDto.statusChangedTs, taskDto.statusChangedTs * 1000),
			accomplicesIds: mapValue(taskDto.accomplices, taskDto.accomplices?.map(({
				id
			}) => id)),
			auditorsIds: mapValue(taskDto.auditors, taskDto.auditors?.map(({
				id
			}) => id)),
			chatId: taskDto.chatId,
			crmItemIds: taskDto.crmItemIds,
			allowsChangeDeadline: taskDto.allowsChangeDeadline,
			allowsChangeDatePlan: taskDto.allowsChangeDatePlan,
			allowsTimeTracking: taskDto.allowsTimeTracking,
			timers: taskDto.timers,
			timeSpent: taskDto.timeSpent,
			estimatedTime: taskDto.estimatedTime,
			numberOfElapsedTimes: taskDto.numberOfElapsedTimes,
			matchesWorkTime: taskDto.matchesWorkTime,
			matchesSubTasksTime: taskDto.matchesSubTasksTime,
			autocompleteSubTasks: taskDto.autocompleteSubTasks,
			templateId: taskDto.templateId,
			rights: taskDto.rights,
			tags: mapValue(taskDto.tags, taskDto.tags?.map(({
				name
			}) => name)),
			isFavorite: mapValue(taskDto.inFavorite, taskDto.inFavorite?.includes(tasks_v2_core.Core.getParams().currentUser.id)),
			isMuted: mapValue(taskDto.inMute, taskDto.inMute?.includes(tasks_v2_core.Core.getParams().currentUser.id)),
			archiveLink: taskDto.archiveLink,
			maxDeadlineChangeDate: taskDto.maxDeadlineChangeDate,
			maxDeadlineChanges: taskDto.maxDeadlineChanges,
			deadlineChangeCount: taskDto.deadlineChangeCount,
			requireDeadlineChangeReason: taskDto.requireDeadlineChangeReason,
			deadlineChangeReason: taskDto.deadlineChangeReason,
			email: mapValue(taskDto.email, taskDto.email ? {
				...taskDto.email,
				dateTs: taskDto.email.dateTs * 1000
			} : null),
			userFields: mapValue(taskDto.userFields, mapUserFields(taskDto.id, taskDto.userFields ?? [])),
			isForNewUser: mapValue(taskDto.type, taskDto.type === tasks_v2_const.TemplateType.NewUsers),
			permissions: mapValue(taskDto.permissions, taskDto.permissions?.map(it => tasks_v2_provider_service_templateService.TemplateMappers.mapPermissionDtoToModel(it))),
			replicate: taskDto.replicate,
			mark: taskDto.mark,
			replicateParams: mapReplicateParamsToModel(taskDto),
			replicateTemplate: taskDto.replicateTemplate,
			forkedByTemplate: taskDto.forkedByTemplate
		};
		return Object.fromEntries(Object.entries(task).filter(([key, value]) => {
			if (allowedNullFields.has(key)) {
				return !main_core.Type.isUndefined(value);
			}
			return !main_core.Type.isNil(value);
		}));
	}
	function mapValue(value, mappedValue) {
		return main_core.Type.isNil(value) ? value : mappedValue;
	}

	// TODO: Temporary. Remove when removing old full card
	function mapDescription(description) {
		return description?.replaceAll(/\[p]\n|\[p]\[\/p]|\[\/p]/gi, '').trim();
	}
	function mapGanttLinks(taskId, taskIds) {
		if (!taskIds) {
			return null;
		}
		return Object.fromEntries(taskIds.map(dependentId => [dependentId, tasks_v2_core.Core.getStore().getters[`${tasks_v2_const.Model.GanttLinks}/getLink`]({
			taskId,
			dependentId
		}).type]));
	}
	function mapUserFields(taskId, userFields) {
		if (main_core.Type.isArrayFilled(userFields)) {
			return userFields;
		}
		const task = tasks_v2_core.Core.getStore().getters[`${tasks_v2_const.Model.Tasks}/getById`](taskId);
		return task && main_core.Type.isArray(task.userFields) ? task.userFields : [];
	}
	function mapTaskDtoToResponsibleIds(taskDto) {
		const responsibleIds = new Set();
		if (main_core.Type.isArray(taskDto.responsibleCollection)) {
			taskDto.responsibleCollection.forEach(({
				id
			}) => responsibleIds.add(id));
		}
		if (main_core.Type.isArray(taskDto.multiResponsibles)) {
			taskDto.multiResponsibles.forEach(({
				id
			}) => responsibleIds.add(id));
		}
		if (main_core.Type.isNumber(taskDto.responsible?.id)) {
			responsibleIds.add(taskDto.responsible.id);
		}
		if (responsibleIds.size > 0) {
			return [...responsibleIds];
		}
		return undefined;
	}
	function mapReplicateParamsToModel({
		replicateParams
	}) {
		if (!main_core.Type.isObject(replicateParams)) {
			return null;
		}
		const startDate = tasks_v2_component_fields_replication.DateStringConverter.parseServerDate(replicateParams.startDate);
		const startTime = tasks_v2_component_fields_replication.TimeStringConverter.parseServerTime(replicateParams.time);
		const startTs = tasks_v2_component_fields_replication.DateStringConverter.convertServerDateToTs(startDate, startTime);
		let endTs = null;
		if (!main_core.Type.isNil(replicateParams.endDate)) {
			const endDate = tasks_v2_component_fields_replication.DateStringConverter.parseServerDate(replicateParams.endDate);
			endTs = tasks_v2_component_fields_replication.DateStringConverter.convertServerDateToTs(endDate);
		}
		return {
			...replicateParams,
			startTs,
			endTs,
			yearlyMonth1: mapValue(replicateParams.yearlyMonth1, replicateParams.yearlyMonth1 + 1),
			yearlyMonth2: mapValue(replicateParams.yearlyMonth2, replicateParams.yearlyMonth2 + 1),
			yearlyWeekDay: mapValue(replicateParams.yearlyWeekDay, replicateParams.yearlyWeekDay + 1)
		};
	}
	function mapReplicateParamsToDto({
		replicateParams
	}) {
		if (!main_core.Type.isObject(replicateParams)) {
			return undefined;
		}
		const startDate = tasks_v2_component_fields_replication.DateStringConverter.convertTsToServerDateString(replicateParams.startTs);
		const time = tasks_v2_component_fields_replication.TimeStringConverter.convertTsToServerTimeString(replicateParams.startTs);
		const endDate = main_core.Type.isNil(replicateParams.endTs) ? null : tasks_v2_component_fields_replication.DateStringConverter.convertTsToServerDateString(replicateParams.endTs);
		return {
			...replicateParams,
			startDate,
			time,
			endDate,
			yearlyMonth1: mapValue(replicateParams.yearlyMonth1, replicateParams.yearlyMonth1 - 1),
			yearlyMonth2: mapValue(replicateParams.yearlyMonth2, replicateParams.yearlyMonth2 - 1),
			yearlyWeekDay: mapValue(replicateParams.yearlyWeekDay, replicateParams.yearlyWeekDay - 1)
		};
	}

	class ReplicationService {
		constructor() {
			this.#subscribeToEvents();
		}
		async add(taskId, task) {
			try {
				const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskReplicationAdd, {
					task: mapModelToDto({
						...task,
						id: taskId
					})
				});
				const {
					id
				} = mapDtoToModel(data);
				tasks_v2_provider_service_taskService.taskService.updateStoreTask(taskId, {
					replicate: true,
					replicateParams: task.replicateParams,
					replicateTemplate: {
						id,
						rights: {
							edit: true
						}
					}
				});
			} catch (error) {
				ui_notificationManager.Notifier.notifyViaBrowserProvider({
					id: 'task-notify-replication-add-error',
					text: error?.errors?.[0]?.message
				});
				tasks_v2_provider_service_taskService.taskService.updateStoreTask(taskId, {
					replicateParams: null
				});
				console.error(tasks_v2_const.Endpoint.TaskReplicationAdd, error);
			}
		}
		async update(task, payload) {
			const isTemplate = tasks_v2_lib_idUtils.idUtils.isTemplate(task.id);
			try {
				if (isTemplate) {
					await this.#update(task.id, payload);
					const templateId = tasks_v2_lib_idUtils.idUtils.unbox(task.id);
					main_core_events.EventEmitter.emit(tasks_v2_const.EventName.UpdateReplicateParams, {
						...payload,
						templateId
					});
				} else {
					const templateId = task?.replicateTemplate?.id ?? task?.forkedByTemplate?.id;
					if (main_core.Type.isUndefined(templateId)) {
						return;
					}
					await this.#update(tasks_v2_lib_idUtils.idUtils.boxTemplate(templateId), payload);
					tasks_v2_provider_service_taskService.taskService.updateStoreTask(task.id, payload);
					const deadlineOffset = payload.replicateParams?.deadlineOffset;
					tasks_v2_provider_service_taskService.taskService.updateStoreTask(tasks_v2_lib_idUtils.idUtils.boxTemplate(templateId), {
						deadlineAfter: main_core.Type.isNumber(deadlineOffset) ? deadlineOffset * 1000 : null
					});
					main_core_events.EventEmitter.emit(tasks_v2_const.EventName.NotifyTaskTemplateUpdated, {
						templateId
					});
					main_core_events.EventEmitter.emit(tasks_v2_const.EventName.UpdateReplicateParams);
				}
			} catch (error) {
				const updateError = error?.[tasks_v2_const.Endpoint.TemplateUpdate]?.[0];
				ui_notificationManager.Notifier.notifyViaBrowserProvider({
					id: 'task-notify-replication-update-error',
					text: updateError?.message
				});
			}
		}
		async setReplicationState(taskId, task) {
			const isTemplate = tasks_v2_lib_idUtils.idUtils.isTemplate(taskId);
			const endpoint = isTemplate ? tasks_v2_const.Endpoint.TemplateReplicationSetState : tasks_v2_const.Endpoint.TaskReplicationSetState;
			try {
				const id = isTemplate ? tasks_v2_lib_idUtils.idUtils.unbox(taskId) : taskId;
				await tasks_v2_lib_apiClient.apiClient.post(endpoint, {
					[isTemplate ? 'template' : 'task']: {
						id,
						replicate: task.replicate,
						forkedByTemplate: task.forkedByTemplate
					}
				});
				tasks_v2_provider_service_taskService.taskService.updateStoreTask(taskId, {
					replicate: task.replicate
				});
				if (isTemplate) {
					main_core_events.EventEmitter.emit(tasks_v2_const.EventName.UpdateReplicateParams, {
						replicate: task.replicate,
						templateId: id
					});
				} else {
					const templateId = task.forkedByTemplate?.id ?? task.replicateTemplate?.id;
					tasks_v2_provider_service_taskService.taskService.updateStoreTask(tasks_v2_lib_idUtils.idUtils.boxTemplate(templateId), {
						replicate: task.replicate
					});
				}
			} catch (error) {
				ui_notificationManager.Notifier.notifyViaBrowserProvider({
					id: 'task-notify-replication-set-state-error',
					text: error.errors?.[0]?.message
				});
				console.error(endpoint, error);
			}
		}
		#subscribeToEvents() {
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.TemplateDeleted, this.#handleReplicateTemplateDeleted);
		}
		#handleReplicateTemplateDeleted(event) {
			const {
				id: templateId
			} = event.getData();
			const store = tasks_v2_core.Core.getStore();
			const tasks = store.state[tasks_v2_const.Model.Tasks]?.collection ?? {};
			Object.values(tasks).forEach(task => {
				const replicateTemplateId = task.replicateTemplate?.id;
				const forkedByTemplateId = task.forkedByTemplate?.id;
				if (replicateTemplateId !== templateId && forkedByTemplateId !== templateId) {
					return;
				}
				const fieldsToDrop = {
					replicate: false,
					replicateParams: null
				};
				if (!main_core.Type.isUndefined(replicateTemplateId)) {
					tasks_v2_provider_service_taskService.taskService.updateStoreTask(task.id, {
						...fieldsToDrop,
						replicateTemplate: null
					});
				} else if (!main_core.Type.isUndefined(forkedByTemplateId)) {
					tasks_v2_provider_service_taskService.taskService.updateStoreTask(task.id, {
						...fieldsToDrop,
						forkedByTemplate: null
					});
				}
			});
		}
		#hasUpdateError(result) {
			return result?.[tasks_v2_const.Endpoint.TemplateUpdate]?.[0];
		}
		async #update(id, payload) {
			const result = await tasks_v2_provider_service_taskService.taskService.update(id, payload);
			if (this.#hasUpdateError(result)) {
				throw result;
			}
		}
	}

	const replicationService = new ReplicationService();

	exports.replicationService = replicationService;

})(this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}, BX.Tasks.V2.Lib, BX, BX.Event, BX.UI.NotificationManager, BX.Tasks.V2, BX.Tasks.V2.Const, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Component.Fields);
//# sourceMappingURL=replication-service.bundle.js.map
