import { Runtime, Loc, Text, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { TaskCard } from 'tasks.v2.application.task-card';
import type { Store } from 'ui.vue3.vuex';

import { EventName, Model } from 'tasks.v2.const';
import { Core } from 'tasks.v2.core';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { subTasksService } from 'tasks.v2.provider.service.relation-service';
import { mapStageDtoToModel, type StageDto } from 'tasks.v2.model.groups';
import { flowService } from 'tasks.v2.provider.service.flow-service';
import { userService } from 'tasks.v2.provider.service.user-service';
import { fileService } from 'tasks.v2.provider.service.file-service';
import { viewersService } from 'tasks.v2.provider.service.viewers-service';
import type { TaskModel, TimerModel } from 'tasks.v2.model.tasks';
import type { StageModel } from 'tasks.v2.model.stages';

import { BasePullHandler } from '../handler/base-pull-handler';
import { mapInstantFields, mapPushToModel } from './mappers';
import type { PushData, StartTimerPush, StopTimerPush, TaskAddPush, UserOptionPush } from './types';

const MutedOption = 1;

export class TaskPullHandler extends BasePullHandler
{
	getMap(): { [command: string]: Function }
	{
		return {
			task_add: this.#handleTaskAdded,
			task_update: this.#handleTaskUpdated,
			task_view: this.#handleTaskViewed,
			task_remove: this.#handleTaskDeleted,
			default_deadline_changed: this.#handleDefaultDeadlineChanged,
			task_regular_template_add: this.#handleTaskRegularTemplateAdded,
			task_timer_start: this.#handleStartOfTimer,
			task_timer_stop: this.#handleStopOfTimer,
			user_option_changed: this.#handleUserOptionChanged,
		};
	}

	getDelayedMap(): { [command: string]: Function }
	{
		return {
			task_update: this.#handleTaskUpdatedDelayed,
		};
	}

	#handleTaskAdded = (data: TaskAddPush): void => {
		void this.#addTaskToParentStore(data);
	};

	async #addTaskToParentStore(data: TaskAddPush): Promise<void>
	{
		const taskId = Number(data.TASK_ID) || 0;
		const hasParentId = !Type.isUndefined(data.AFTER?.PARENT_ID);
		const parentId = Number(data.AFTER?.PARENT_ID) || 0;

		if (!taskId)
		{
			return;
		}

		if (parentId)
		{
			subTasksService.addStore(parentId, [taskId]);

			return;
		}

		if (hasParentId)
		{
			return;
		}

		const { task } = await taskService.get(taskId);

		if (task?.parentId)
		{
			subTasksService.addStore(task.parentId, [taskId]);
		}
	}

	#handleTaskUpdated = (data: PushData): void => {
		data.AFTER.UF_CRM_TASK_DELETED = data.BEFORE.UF_CRM_TASK_DELETED;
		data.AFTER.taskRequireResult = data.taskRequireResult;
		data.AFTER.taskRequireDeadlineChangeReason = data.requireDeadlineChangeReason;

		const task = mapPushToModel(data.TASK_ID, data.AFTER);
		const taskBefore = mapPushToModel(data.TASK_ID, data.BEFORE);
		if (!Type.isUndefined(task.groupId) && task.groupId !== taskBefore.groupId)
		{
			if (!this.#tasksWithChangedGroup.has(task.id))
			{
				this.#groupIdsBeforeChangedGroup.set(task.id, taskService.getStoreTask(task.id)?.groupId ?? 0);
			}
			this.#tasksWithChangedGroup.add(task.id);
		}

		this.#upsertStage(data.AFTER.STAGE_INFO);

		if (taskBefore.parentId)
		{
			subTasksService.deleteStore(taskBefore.parentId, [task.id]);
		}

		if (task.parentId)
		{
			subTasksService.addStore(task.parentId, [task.id]);
		}

		if (taskBefore.fileIds)
		{
			const removedFiles = taskBefore.fileIds.filter((fileId) => !task.fileIds.includes(fileId));

			fileService.get(task.id).remove(removedFiles);
		}

		const { id, ...fields } = mapInstantFields(task);

		taskService.updateStoreTask(id, fields, 'server');

		if (task.auditorsIds && taskService.hasStoreTask(task.id))
		{
			void userService.list(task.auditorsIds);
		}
	};

	#pushedTasks: { [taskId: number]: TaskModel } = {};
	#taskUpdateDebouncers: Map<number, (data: PushData) => void> = new Map();
	#tasksWithChangedGroup: Set<number> = new Set();
	#groupIdsBeforeChangedGroup: Map<number, number> = new Map();
	#taskUpdateSequences: Map<number, number> = new Map();
	#taskUpdateVersions: Map<number, number> = new Map();

	#handleTaskUpdatedDelayed = async (data: PushData): Promise<void> => {
		if (!taskService.hasStoreTask(data.TASK_ID))
		{
			this.#tasksWithChangedGroup.delete(data.TASK_ID);
			this.#groupIdsBeforeChangedGroup.delete(data.TASK_ID);

			return;
		}

		const task = mapPushToModel(data.TASK_ID, data.AFTER);
		const taskBefore = mapPushToModel(data.TASK_ID, data.BEFORE);
		const updateSequence = (this.#taskUpdateSequences.get(task.id) ?? 0) + 1;
		this.#taskUpdateSequences.set(task.id, updateSequence);

		if (!this.isFromAi(data) && data.USER_ID === this.#currentUserId)
		{
			const { TaskFullCard } = await Runtime.loadExtension('tasks.v2.application.task-full-card');
			if (this.#taskUpdateSequences.get(task.id) !== updateSequence)
			{
				return;
			}

			if (TaskFullCard.isOpened(task.id) && !this.#tasksWithChangedGroup.has(task.id))
			{
				return;
			}
		}

		const updateVersion = (this.#taskUpdateVersions.get(task.id) ?? 0) + 1;
		this.#taskUpdateVersions.set(task.id, updateVersion);

		const pendingTask = this.#pushedTasks[task.id];
		const hasGroupChange = !Type.isUndefined(task.groupId) && task.groupId !== taskBefore.groupId;
		this.#pushedTasks[task.id] = {
			...pendingTask,
			...task,
			...(pendingTask?.groupId && !hasGroupChange && this.#tasksWithChangedGroup.has(task.id)
				? { groupId: pendingTask.groupId }
				: {}),
		};

		if (!this.#taskUpdateDebouncers.has(task.id))
		{
			this.#taskUpdateDebouncers.set(task.id, Runtime.debounce((pushData: PushData, version: number) => {
				this.#taskUpdateDebouncers.delete(task.id);
				void this.#applyTaskUpdate(pushData, version);
			}, 0));
		}

		this.#taskUpdateDebouncers.get(task.id)(data, updateVersion);
	};

	async #applyTaskUpdate(data: PushData, updateVersion: number): Promise<void>
	{
		const task = this.#pushedTasks[data.TASK_ID];
		if (!task || this.#taskUpdateVersions.get(task.id) !== updateVersion)
		{
			return;
		}

		const shouldRefreshScrumInfo = this.#tasksWithChangedGroup.has(task.id);

		if (this.#needToLoadTask(data))
		{
			await taskService.get(task.id);
			await this.#loadViewersQuantity(task);
		}
		else
		{
			await Promise.all([
				this.#loadGroup(task),
				this.#loadFlow(task),
				userService.list(this.#getUsersIds(task)),
				taskService.getRights(task.id),
				this.#loadViewersQuantity(task),
			]);

			const { id, ...fields } = task;
			const currentGroupId = taskService.getStoreTask(id)?.groupId;
			const groupIdBeforeChangedGroup = this.#groupIdsBeforeChangedGroup.get(task.id);
			if (task.groupId > 0 && groupIdBeforeChangedGroup > 0 && currentGroupId === 0)
			{
				for (const field of [
					'groupId', 'epicId', 'storyPoints', 'canCreateEpic', 'canUpdateScrumFields', 'stageId', 'flowId',
				])
				{
					delete fields[field];
				}
			}

			if (this.#taskUpdateVersions.get(task.id) !== updateVersion)
			{
				return;
			}

			taskService.updateStoreTask(id, fields, 'server');
		}

		if (this.#taskUpdateVersions.get(task.id) !== updateVersion)
		{
			return;
		}

		delete this.#pushedTasks[task.id];
		this.#tasksWithChangedGroup.delete(task.id);
		if (shouldRefreshScrumInfo)
		{
			await this.#refreshScrumInfo(task.id);
		}

		EventEmitter.emit(EventName.TaskPullUpdated, { task: taskService.getStoreTask(task.id) });
	}

	#handleTaskViewed = (data): void => {};

	#handleTaskDeleted = (data: PushData): void => {
		const taskId = data.TASK_ID;
		void taskService.deleteStore(taskId);
		EventEmitter.emit(EventName.CloseFullCard, { taskId });
		EventEmitter.emit(EventName.TaskDeleted, { id: taskId });
	};

	#handleDefaultDeadlineChanged = ({ deadlineUserOption }): void => {
		void this.$store.dispatch(`${Model.Interface}/updateDeadlineUserOption`, deadlineUserOption);
	};

	#handleTaskRegularTemplateAdded = (data): void => {
		const templateId = data.templateId;

		BX.UI.Notification.Center.notify({
			id: Text.getRandom(),
			content: Loc.getMessage('TASKS_V2_NOTIFY_REPLICATE_TEMPLATE_CREATED'),
			useAirDesign: true,
			actions: [
				{
					title: Loc.getMessage('TASKS_V2_NOTIFY_REPLICATE_TEMPLATE_OPEN'),
					events: {
						click: (clickEvent, balloon) => {
							balloon.close();

							TaskCard.showFullCard({ taskId: idUtils.boxTemplate(templateId) });
						},
					},
				},
			],
		});
	};

	#handleStartOfTimer = (data: StartTimerPush): void => {
		this.#applyTimerChange(data.taskId, (task: TaskModel) => this.#startTimerFields(task, data));
	};

	#handleStopOfTimer = (data: StopTimerPush): void => {
		this.#applyTimerChange(data.taskId, (task: TaskModel) => this.#stopTimerFields(task, data));
	};

	// Timer freshness rides task_timer_start/task_timer_stop (CONTRACT-timer-state), never task_update:
	// the backend sends task_update before the timer side effect, so its timers are stale.
	// Every push applies a targeted store patch with the fresh timer fields; non-timer fields
	// ride the accompanying task_update, so no full task reload is needed here.
	#applyTimerChange(taskId: number, buildFields: (task: TaskModel) => TaskModel): void
	{
		if (!taskId || !taskService.hasStoreTask(taskId))
		{
			return;
		}

		taskService.updateStoreTask(taskId, buildFields(taskService.getStoreTask(taskId)));
	}

	#startTimerFields(task: TaskModel, data: StartTimerPush): TaskModel
	{
		const currentUserId = this.#currentUserId;
		const timers: TimerModel[] = (task.timers ?? []).filter((timer: TimerModel) => timer.userId !== currentUserId);

		timers.push({
			userId: currentUserId,
			taskId: String(data.taskId),
			startedAtTs: data.timerStartedAtTs,
			seconds: 0,
		});

		const fields: TaskModel = { timers };

		if (Type.isNumber(data.timeSpentInLogs))
		{
			fields.timeSpent = data.timeSpentInLogs;
		}

		return fields;
	}

	#stopTimerFields(task: TaskModel, data: StopTimerPush): TaskModel
	{
		const timers: TimerModel[] = (task.timers ?? []).filter((timer: TimerModel) => timer.userId !== data.userId);

		const fields: TaskModel = { timers };

		const timeElapsed = data.timeElapsed?.[data.userId];
		if (data.userId === this.#currentUserId && Type.isNumber(timeElapsed))
		{
			fields.timeSpent = timeElapsed;
		}

		return fields;
	}

	#handleUserOptionChanged = (data: UserOptionPush): void => {
		if (data.OPTION !== MutedOption || data.USER_ID !== this.#currentUserId)
		{
			return;
		}

		taskService.updateStoreTask(data.TASK_ID, { isMuted: data.ADDED });
	};

	#upsertStage(stageDto: StageDto): void
	{
		if (stageDto)
		{
			const stage: StageModel = mapStageDtoToModel(stageDto);

			void this.$store.dispatch(`${Model.Stages}/upsert`, stage);
		}
	}

	#needToLoadTask(data: PushData): boolean
	{
		const notPushableFields = new Set([
			'DESCRIPTION',
			'UF_TASK_WEBDAV_FILES',
			'STATUS',
			'ALLOW_TIME_TRACKING',
		]);

		return Object.keys(data.AFTER).some((field: string) => notPushableFields.has(field));
	}

	async #loadGroup(task: TaskModel): Promise<void>
	{
		if (this.#needToLoadGroup(task))
		{
			const { groupService } = await Runtime.loadExtension('tasks.v2.provider.service.group-service');

			await groupService.getGroupByTaskId(task.id);
		}
	}

	async #refreshScrumInfo(taskId: number): Promise<void>
	{
		const { groupService } = await Runtime.loadExtension('tasks.v2.provider.service.group-service');

		await groupService.getScrumInfo(taskId, { force: true });
	}

	#needToLoadGroup(task: TaskModel): boolean
	{
		if (this.#needToLoadFlow(task))
		{
			return false;
		}

		return task.groupId && !this.$store.getters[`${Model.Groups}/getById`](task.groupId);
	}

	async #loadFlow(task: TaskModel): Promise<void>
	{
		if (this.#needToLoadFlow(task))
		{
			await flowService.getFlow(task.flowId);
		}
	}

	#needToLoadFlow(task: TaskModel): boolean
	{
		return task.flowId && !this.$store.getters[`${Model.Flows}/getById`](task.flowId);
	}

	#getUsersIds(task: TaskModel): number[]
	{
		return [
			task.creatorId,
			...(task.responsibleIds ?? []),
			...(task.accomplicesIds ?? []),
			...(task.auditorsIds ?? []),
		].filter((id: ?number) => id);
	}

	async #loadViewersQuantity(task: TaskModel): Promise<void>
	{
		await viewersService.count(task.id);
	}

	get #currentUserId(): number
	{
		return this.$store.getters[`${Model.Interface}/currentUserId`];
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}
