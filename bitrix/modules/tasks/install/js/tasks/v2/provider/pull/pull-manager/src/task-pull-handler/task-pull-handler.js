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
		const task = mapPushToModel(data);

		this.#upsertStage(data.AFTER.STAGE_INFO);

		if (data.BEFORE.PARENT_ID)
		{
			subTasksService.deleteStore(data.BEFORE.PARENT_ID, [task.id]);
		}

		if (task.parentId)
		{
			subTasksService.addStore(task.parentId, [task.id]);
		}

		const { id, ...fields } = mapInstantFields(task);

		void taskService.updateStoreTask(id, fields);
	};

	#handleTaskUpdatedDelayed = async (data: PushData): Promise<void> => {
		const task = mapPushToModel(data);

		const { TaskFullCard } = await Runtime.loadExtension('tasks.v2.application.task-full-card');

		if (data.USER_ID === this.#currentUserId && TaskFullCard.isCardOpened(task.id))
		{
			return;
		}

		if (!taskService.hasStoreTask(task.id))
		{
			return;
		}

		if (this.#needToLoadTask(data))
		{
			await this.#loadTask(task);
		}
		else
		{
			await Promise.all([
				this.#loadGroup(task),
				this.#loadFlow(task),
				this.#loadUsers(task),
				this.#loadRights(task),
			]);

			const { id, ...fields } = task;

			void taskService.updateStoreTask(id, fields);
		}

		EventEmitter.emit(EventName.TaskPullUpdated, { task: taskService.getStoreTask(task.id) });
	};

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

	#loadTask(task: TaskModel): void
	{
		void taskService.get(task.id);
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
			await groupService.getGroup(task.groupId);
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
		return Boolean(task.flowId) && !this.$store.getters[`${Model.Flows}/getById`](task.flowId);
	}

	async #loadUsers(task: TaskModel): Promise<void>
	{
		if (this.#needToLoadUsers(task))
		{
			await userService.list(this.#getUsersIds(task));
		}
	}

	#needToLoadUsers(task: TaskModel): boolean
	{
		return !userService.hasUsers(this.#getUsersIds(task));
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

	async #loadRights(task: TaskModel): Promise<void>
	{
		await taskService.getRights(task.id);
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
