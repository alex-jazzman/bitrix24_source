import { Loc, Runtime, Text } from 'main.core';
import { EventEmitter } from 'main.core.events';
import type { Store } from 'ui.vue3.vuex';

import { EventName, Model } from 'tasks.v2.const';
import { Core } from 'tasks.v2.core';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { subTasksService } from 'tasks.v2.provider.service.relation-service';
import { GroupMappers, groupService, type StageDto } from 'tasks.v2.provider.service.group-service';
import { flowService } from 'tasks.v2.provider.service.flow-service';
import { userService } from 'tasks.v2.provider.service.user-service';
import { fileService } from 'tasks.v2.provider.service.file-service';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { StageModel } from 'tasks.v2.model.stages';

import { BasePullHandler } from '../handler/base-pull-handler';
import { mapInstantFields, mapPushToModel } from './mappers';
import type { PushData } from './types';

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
		};
	}

	getDelayedMap(): { [command: string]: Function }
	{
		return {
			task_update: this.#handleTaskUpdatedDelayed,
		};
	}

	#handleTaskAdded = (data): void => {
		const features = Core.getParams().features;

		// show task created balloon if miniform feature is enabled
		const showTaskAddedBalloon = (data.AFTER.USER_ID === this.#currentUserId)
			&& (features.isMiniformEnabled && !features.isV2Enabled)
		;

		if (showTaskAddedBalloon)
		{
			const url = data.AFTER.URL ?? '';

			BX.UI.Notification.Center.notify({
				id: Text.getRandom(),
				content: Loc.getMessage('TASKS_V2_NOTIFY_TASK_CREATED'),
				actions: [
					{
						title: Loc.getMessage('TASKS_V2_NOTIFY_TASK_DO_VIEW'),
						events: {
							click: (event, balloon) => {
								balloon.close();
								BX.SidePanel.Instance.open(url);
							},
						},
					},
				],
			});
		}
	};

	#handleTaskUpdated = (data: PushData): void => {
		data.AFTER.UF_CRM_TASK_DELETED = data.BEFORE.UF_CRM_TASK_DELETED;
		data.AFTER.taskRequireResult = data.taskRequireResult;

		const task = mapPushToModel(data.TASK_ID, data.AFTER);
		const taskBefore = mapPushToModel(data.TASK_ID, data.BEFORE);

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

		taskService.updateStoreTask(id, fields);
	};

	#pushedTasks: { [taskId: number]: TaskModel } = {};

	#handleTaskUpdatedDelayed = async (data: PushData): Promise<void> => {
		const task = mapPushToModel(data.TASK_ID, data.AFTER);

		const { TaskFullCard } = await Runtime.loadExtension('tasks.v2.application.task-full-card');

		if (data.USER_ID === this.#currentUserId && TaskFullCard.isOpened(task.id))
		{
			return;
		}

		if (!taskService.hasStoreTask(task.id))
		{
			return;
		}

		this.#pushedTasks[task.id] = { ...this.#pushedTasks[task.id], ...task };

		this.#handleTaskUpdatedDebounced(data);
	};

	#handleTaskUpdatedDebounced = Runtime.debounce(async (data: PushData) => {
		const task = this.#pushedTasks[data.TASK_ID];
		delete this.#pushedTasks[task.id];

		if (this.#needToLoadTask(data))
		{
			await taskService.get(task.id);
		}
		else
		{
			await Promise.all([
				this.#loadGroup(task),
				this.#loadFlow(task),
				userService.list(this.#getUsersIds(task)),
				taskService.getRights(task.id),
			]);

			const { id, ...fields } = task;

			taskService.updateStoreTask(id, fields);
		}

		EventEmitter.emit(EventName.TaskPullUpdated, { task: taskService.getStoreTask(task.id) });
	}, 0);

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

	#upsertStage(stageDto: StageDto): void
	{
		if (stageDto)
		{
			const stage: StageModel = GroupMappers.mapStageDtoToModel(stageDto);

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
			await groupService.getGroupByTaskId(task.id);
		}
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

	get #currentUserId(): number
	{
		return this.$store.getters[`${Model.Interface}/currentUserId`];
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}
