import { Event, Runtime, Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import type { Store } from 'ui.vue3.vuex';

import { Core } from 'tasks.v2.core';
import { Model, EventName, Endpoint } from 'tasks.v2.const';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { apiClient } from 'tasks.v2.lib.api-client';
import { templateService } from 'tasks.v2.provider.service.template-service';
import { fileService } from 'tasks.v2.provider.service.file-service';
import { subTasksService, relatedTasksService, ganttService } from 'tasks.v2.provider.service.relation-service';
import { checkListService } from 'tasks.v2.provider.service.check-list-service';
import { remindersService } from 'tasks.v2.provider.service.reminders-service';
import { resultService } from 'tasks.v2.provider.service.result-service';
import { userFieldsManager } from 'tasks.v2.component.fields.user-fields';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { auditorService } from './auditor-service';
import { creatorService } from './creator-service';
import { descriptionService } from './description-service';
import { crmService } from './crm-service';
import { TaskGetExtractor } from './task-get-extractor';
import { mapModelToDto } from './mappers';
import type { TaskDto, SeparateFieldsMeta, TaskSelect, UpdateResult } from './types';

const separateFields: SeparateFieldsMeta[] = [
	{
		fields: new Set(['storyPoints', 'epicId']),
		endpoint: Endpoint.ScrumUpdateTask,
	},
	{
		fields: new Set(['requireResult']),
		endpoint: 'Task.Result.require',
	},
	{
		fields: new Set(['deadlineTs', 'deadlineChangeReason']),
		endpoint: Endpoint.TaskDeadlineUpdate,
	},
	{
		fields: new Set(['startPlanTs', 'endPlanTs', 'matchesWorkTime', 'matchesSubTasksTime']),
		endpoint: Endpoint.TaskPlanUpdate,
	},
	{
		fields: new Set(['responsibleIds']),
		endpoint: Endpoint.TaskStakeholderResponsibleDelegate,
	},
	{
		fields: new Set(['accomplicesIds']),
		endpoint: 'Task.Stakeholder.Accomplice.set',
	},
	{
		fields: new Set(['creatorId']),
		service: creatorService,
	},
	{
		fields: new Set(['auditorsIds']),
		service: auditorService,
	},
	{
		fields: new Set(['description', 'forceUpdateDescription']),
		service: descriptionService,
	},
	{
		fields: new Set(['crmItemIds']),
		service: crmService,
	},
];

export const taskService = new class
{
	constructor()
	{
		Event.bind(window, 'beforeunload', () => {
			setTimeout(() => {
				const pendingIds = Object.keys(this.#updatePromises);
				pendingIds.forEach((id) => this.#updateTask(id));
			});
		});
	}

	async get(id: number | string, taskSelect: TaskSelect, ignoreContains: boolean = false): Promise<TaskModel>
	{
		if (idUtils.isTemplate(id))
		{
			await templateService.get(id);

			await this.$store.dispatch(`${Model.Tasks}/removePartiallyLoaded`, id);

			return this.getStoreTask(id);
		}

		try
		{
			const data = await apiClient.post(Endpoint.TaskGet, { task: { id }, taskSelect });

			this.extractTask(data, ignoreContains);

			await this.$store.dispatch(`${Model.Tasks}/removePartiallyLoaded`, id);
		}
		catch (error)
		{
			console.error(Endpoint.TaskGet, error);
		}

		return this.getStoreTask(id);
	}

	async getCopy(id: number, tmpId: string): Promise<void>
	{
		if (idUtils.isTemplate(tmpId))
		{
			await templateService.getCopy(idUtils.boxTemplate(id), tmpId);

			return;
		}

		const task = await this.get(id);

		if (task.checklist?.length > 0)
		{
			await checkListService.load(id, tmpId);
		}

		const fields = {
			title: task.title,
			description: task.description,
			creatorId: Core.getParams().currentUser.id,
			responsibleIds: task.responsibleIds,
			deadlineTs: task.deadlineTs,
			needsControl: task.needsControl,
			startPlanTs: task.startPlanTs,
			endPlanTs: task.endPlanTs,
			fileIds: task.fileIds,
			containsSubTasks: task.containsSubTasks,
			groupId: task.groupId,
			flowId: task.flowId,
			isImportant: task.isImportant,
			accomplicesIds: task.accomplicesIds,
			auditorsIds: task.auditorsIds,
			parentId: task.parentId,
			allowsChangeDeadline: task.allowsChangeDeadline,
			matchesWorkTime: task.matchesWorkTime,
			tags: task.tags,
			crmItemIds: task.crmItemIds,
			requireResult: task.requireResult,
			containsRelatedTasks: task.containsRelatedTasks,
			relatedTaskIds: task.relatedTaskIds,
			reminders: task.reminders,
			numberOfReminders: task.numberOfReminders,
			allowsTimeTracking: task.allowsTimeTracking,
			estimatedTime: task.estimatedTime,
			userFields: task.userFields,
			epicId: task.epicId,
			storyPoints: task.storyPoints,
		};

		if (Type.isArrayFilled(fields.userFields))
		{
			fields.userFields = userFieldsManager.prepareUserFieldsForTaskFromTemplate(
				fields.userFields,
				Core.getParams().taskUserFieldScheme,
			);
		}

		this.updateStoreTask(tmpId, fields);
	}

	async getRights(id: number): Promise<void>
	{
		try
		{
			const { rights } = await apiClient.post(Endpoint.TaskAccessGet, { task: { id } });

			this.updateStoreTask(id, { rights: { ...this.getStoreTask(id)?.rights, ...rights } });
		}
		catch (error)
		{
			console.error(Endpoint.TaskAccessGet, error);
		}
	}

	async add(task: TaskModel): Promise<[number, ?Error]>
	{
		if (idUtils.isTemplate(task.id))
		{
			return templateService.add(task);
		}

		try
		{
			const data = await apiClient.post(Endpoint.TaskAdd, { task: mapModelToDto(task) });

			await this.onAfterTaskAdded(task, data);

			return [data.id, null];
		}
		catch (error)
		{
			console.error(Endpoint.TaskAdd, error);

			return [0, new Error(error.errors?.[0]?.message)];
		}
	}

	async onAfterTaskAdded(initialTask: TaskModel, data: TaskDto): void
	{
		this.insertStoreTask({ ...initialTask, id: data.id });

		this.extractTask(data);

		if (initialTask.checklist?.length > 0)
		{
			await checkListService.save(
				data.id,
				this.$store.getters[`${Model.CheckList}/getByIds`](initialTask.checklist),
				true,
			);
		}

		const remindersIds = this.$store.getters[`${Model.Reminders}/getIds`](
			initialTask.id,
			Core.getParams().currentUser.id,
		);
		if (remindersIds.length > 0)
		{
			await remindersService.set(
				data.id,
				remindersIds.map((id) => this.$store.getters[`${Model.Reminders}/getById`](id)),
			);
		}

		if (initialTask.responsibleIds.length > 1)
		{
			const userIds = await this.addMultiTask(data.id, initialTask.responsibleIds);

			subTasksService.addStore(initialTask.id, userIds.map((id) => `userTask${id}`));
		}

		if (initialTask.results?.length > 0)
		{
			await resultService.save(
				data.id,
				this.$store.getters[`${Model.Results}/getByIds`](initialTask.results),
				true,
			);
		}

		if (initialTask.relatedToTaskId)
		{
			void relatedTasksService.add(initialTask.relatedToTaskId, [data.id]);
		}

		EventEmitter.emit(EventName.TaskAdded, {
			task: this.getStoreTask(data.id),
			initialTask,
		});

		initialTask = this.getStoreTask(initialTask.id);
		const subTaskIds = initialTask.subTaskIds;
		const relatedTaskIds = initialTask.relatedTaskIds;
		const ganttTaskIds = initialTask.ganttTaskIds;

		subTaskIds.forEach((id) => {
			if (/^tmp\..+/.test(id))
			{
				this.deleteStore(id);
			}
		});

		if (initialTask.containsSubTasks)
		{
			subTasksService.addStore(data.id, subTaskIds);
			void subTasksService.list(data.id, true);
		}

		if (initialTask.containsRelatedTasks)
		{
			relatedTasksService.addStore(data.id, relatedTaskIds);
			void relatedTasksService.list(data.id, true);
		}

		if (initialTask.containsGanttLinks)
		{
			ganttService.addStore(data.id, ganttTaskIds);
			void ganttService.list(data.id, true);
		}

		if (initialTask.parentId)
		{
			subTasksService.addStore(initialTask.parentId, [data.id]);
		}

		this.deleteStore(initialTask.id);
	}

	async copy(task: TaskModel, withSubTasks: boolean): Promise<[number, ?Error]>
	{
		if (idUtils.isTemplate(task.id))
		{
			return templateService.copy(task);
		}

		try
		{
			const checkLists = this.$store.getters[`${Model.CheckList}/getByIds`](task.checklist);

			const data = await apiClient.post(Endpoint.TaskCopy, {
				task: mapModelToDto({ ...task, id: task.copiedFromId, checklist: checkLists }),
				withSubTasks,
			});

			if (task.responsibleIds.length > 1)
			{
				const userIds = await this.addMultiTask(data.id, task.responsibleIds);

				subTasksService.addStore(task.id, userIds.map((id) => `userTask${id}`));
			}

			this.updateStoreTask(task.id, { id: data.id });

			this.extractTask(data);

			EventEmitter.emit(EventName.TaskAdded, {
				task: this.getStoreTask(data.id),
				initialTask: task,
			});

			if (task.checklist.length > 0)
			{
				void checkListService.load(data.id);
			}

			return [data.id, null];
		}
		catch (error)
		{
			console.error(Endpoint.TaskCopy, error);

			return [0, new Error(error.errors?.[0]?.message)];
		}
	}

	async addMultiTask(taskId: number, responsibleIds: number[]): Promise<number[]>
	{
		try
		{
			const userIds = responsibleIds.filter((id) => id !== Core.getParams().currentUser.id);

			await apiClient.post(Endpoint.TaskMultiTaskAdd, { taskId, userIds });

			return userIds;
		}
		catch (error)
		{
			console.error(Endpoint.TaskMultiTaskAdd, error);

			return [];
		}
	}

	async update(id: number, fields: TaskModel): Promise<UpdateResult>
	{
		if (idUtils.isTemplate(id))
		{
			return templateService.update(id, fields);
		}

		const taskBeforeUpdate = this.getStoreTask(id);

		this.updateStoreTask(id, fields);

		if (!idUtils.isReal(id))
		{
			return {};
		}

		if (this.hasChanges(taskBeforeUpdate, fields))
		{
			EventEmitter.emit(EventName.TaskBeforeUpdate, {
				task: this.getStoreTask(id),
				fields: { id, ...fields },
			});
		}

		const result = await this.#updateTaskDebounced(id, fields, taskBeforeUpdate);

		EventEmitter.emit(EventName.TaskAfterUpdate, { task: this.getStoreTask(id) });

		return result;
	}

	async setFavorite(taskId: number, isFavorite: boolean): Promise<void>
	{
		this.updateStoreTask(taskId, { isFavorite });

		const endpoint = isFavorite ? Endpoint.TaskFavoriteAdd : Endpoint.TaskFavoriteDelete;

		try
		{
			await apiClient.post(endpoint, { taskId });

			return true;
		}
		catch (error)
		{
			this.updateStoreTask(taskId, { isFavorite: !isFavorite });

			console.error(endpoint, error);

			return false;
		}
	}

	async setStage(taskId: number, stageId: number): Promise<void>
	{
		this.updateStoreTask(taskId, { stageId });

		try
		{
			await apiClient.postComponent('bitrix:tasks.task', 'moveStage', { taskId, stageId });

			return true;
		}
		catch (error)
		{
			console.error('bitrix:tasks.task.moveStage', error);

			return false;
		}
	}

	async setMark(taskId: number, mark: string): Promise<void>
	{
		this.updateStoreTask(taskId, { mark });

		try
		{
			await apiClient.post(Endpoint.TaskMarkSet, { task: { id: taskId, mark } });

			return true;
		}
		catch (error)
		{
			console.error(Endpoint.TaskMarkSet, error);

			return false;
		}
	}

	async setMute(taskId: number, isMuted: boolean): Promise<void>
	{
		this.updateStoreTask(taskId, { isMuted });

		const endpoint = isMuted ? Endpoint.TaskAttentionMute : Endpoint.TaskAttentionUnmute;

		try
		{
			await apiClient.post(endpoint, { taskId });

			return true;
		}
		catch (error)
		{
			this.updateStoreTask(taskId, { isMuted: !isMuted });

			console.error(endpoint, error);

			return false;
		}
	}

	async delete(id: number): Promise<void>
	{
		const taskBeforeDelete = this.getStoreTask(id);

		this.deleteStore(id);

		if (!idUtils.isReal(id))
		{
			return;
		}

		try
		{
			await apiClient.post(Endpoint.TaskDelete, { task: { id } });

			EventEmitter.emit(EventName.TaskDeleted, { id });

			EventEmitter.emit(EventName.LegacyTasksTaskEvent, new BaseEvent({
				data: id,
				compatData: [
					'DELETE',
					{
						task: { ID: id },
						taskUgly: { id },
						options: {},
					},
				],
			}));
		}
		catch (error)
		{
			void this.insertStoreTask(taskBeforeDelete);

			console.error(Endpoint.TaskDelete, error);
		}
	}

	extractTask(data: TaskDto, ignoreContains: boolean = true): void
	{
		if (!data)
		{
			return;
		}

		if (data?.rights?.read === false)
		{
			this.deleteStore(data.id);

			return;
		}

		const extractor = new TaskGetExtractor(data);

		const task = extractor.getTask();
		task.rights = { ...this.getStoreTask(task.id)?.rights, ...task.rights };
		if (ignoreContains)
		{
			[
				'containsSubTasks',
				'containsRelatedTasks',
				'containsGanttLinks',
				'containsPlacements',
			].forEach((prop) => delete task[prop]);
		}

		void Promise.all([
			this.$store.dispatch(`${Model.Tasks}/upsert`, task),
			this.$store.dispatch(`${Model.Flows}/upsert`, extractor.getFlow()),
			this.$store.dispatch(`${Model.Groups}/insert`, extractor.getGroup()),
			this.$store.dispatch(`${Model.Stages}/upsertMany`, extractor.getStages()),
			this.$store.dispatch(`${Model.Users}/upsertMany`, extractor.getUsers()),
		]);

		void fileService.get(data.id).list(data.fileIds);
	}

	deleteStore(id: number): void
	{
		subTasksService.unlinkStore(id);
		relatedTasksService.unlinkStore(id);
		ganttService.unlinkStore(id);
		void this.$store.dispatch(`${Model.Tasks}/delete`, id);
	}

	#silentErrorMode: boolean = false;
	#updateFields: { [taskId: number]: TaskModel } = {};
	#updateTaskBefore: { [taskId: number]: TaskModel } = {};
	#updatePromises: { [taskId: number]: Resolvable } = {};
	#updateServerTaskDebounced: { [taskId: number]: Function } = {};

	#updateTaskDebounced(id: number, fields: TaskModel, taskBeforeUpdate: TaskModel): Promise<UpdateResult>
	{
		this.#updateFields[id] = { ...this.#updateFields[id], ...fields };
		this.#updateTaskBefore[id] ??= taskBeforeUpdate;
		this.#updatePromises[id] ??= new Resolvable();
		this.#updateServerTaskDebounced[id] ??= Runtime.debounce(this.#updateTask, 500, this);
		this.#updateServerTaskDebounced[id](id);

		return this.#updatePromises[id];
	}

	async #updateTask(id: number): Promise<void>
	{
		const fields = this.#updateFields[id];
		delete this.#updateFields[id];

		const taskBefore = this.#updateTaskBefore[id];
		delete this.#updateTaskBefore[id];

		const promise = this.#updatePromises[id];
		delete this.#updatePromises[id];

		const task = { id, ...fields };

		const result = await this.#updateTaskFields(task, taskBefore);
		const results = await Promise.all(separateFields.map((meta) => this.#updateSeparateFields(
			task,
			taskBefore,
			meta,
		)));

		promise.resolve({ ...result, ...Object.assign({}, ...results) });
	}

	#updateTaskFields(task: TaskModel, taskBefore: TaskModel): Promise<UpdateResult>
	{
		const fields = this.#getTaskFields(task);
		if (!this.hasChanges(taskBefore, fields))
		{
			return {};
		}

		return this.requestUpdate(Endpoint.TaskUpdate, fields, taskBefore);
	}

	#updateSeparateFields(task: TaskModel, taskBefore: TaskModel, meta: SeparateFieldsMeta): Promise<UpdateResult>
	{
		const fields = this.#getFilteredFields(task, meta.fields);
		if (!this.hasChanges(taskBefore, fields))
		{
			return {};
		}

		if (meta.service)
		{
			return meta.service.update(task, taskBefore);
		}

		return this.requestUpdate(meta.endpoint, fields, taskBefore);
	}

	async requestUpdate(endpoint: string, fields: TaskModel, taskBefore: TaskModel): Promise<UpdateResult>
	{
		const id = taskBefore.id;
		const task = mapModelToDto({ id, ...fields });
		if (JSON.stringify(task) === JSON.stringify({ id }))
		{
			return {};
		}

		try
		{
			const data = await apiClient.post(endpoint, { task });

			this.extractTask(data);

			return {};
		}
		catch (error)
		{
			this.updateStoreTask(id, taskBefore);

			if (!this.#silentErrorMode)
			{
				console.error(endpoint, error);
			}

			return {
				[endpoint]: error.errors,
			};
		}
	}

	#getTaskFields(task: TaskModel): TaskModel
	{
		return Object.fromEntries(Object.entries(task).filter(([field]) => {
			return Object.values(separateFields).every(({ fields }) => !fields.has(field));
		}));
	}

	#getFilteredFields(fields: TaskModel, filterSet: Set): TaskModel
	{
		return Object.fromEntries(Object.entries(fields).filter(([field]) => filterSet.has(field)));
	}

	hasChanges(task: TaskModel, fields: TaskModel): boolean
	{
		return Object.entries(fields).some(([field, value]) => JSON.stringify(task[field]) !== JSON.stringify(value));
	}

	async insertStoreTask(task: TaskModel): Promise<void>
	{
		if (idUtils.isTemplate(task.id))
		{
			await templateService.insertStoreTask(task);

			return;
		}

		await this.$store.dispatch(`${Model.Tasks}/insert`, task);
	}

	updateStoreTask(id: number, fields: TaskModel): void
	{
		if (this.hasStoreTask(id))
		{
			void this.$store.dispatch(`${Model.Tasks}/update`, { id, fields });
		}
	}

	hasStoreTask(id: number, withPartiallyLoaded: number = true): boolean
	{
		const isPartiallyLoaded = this.$store.getters[`${Model.Tasks}/isPartiallyLoaded`](id);

		return this.getStoreTask(id) !== null && (withPartiallyLoaded || !isPartiallyLoaded);
	}

	getStoreTask(id: number): ?TaskModel
	{
		const task = this.$store.getters[`${Model.Tasks}/getById`](id);

		return task ? { ...task } : null;
	}

	setSilentErrorMode(silentErrorMode: boolean): void
	{
		this.#silentErrorMode = silentErrorMode;
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}();

function Resolvable(): Promise
{
	const promise = new Promise((resolve) => {
		this.resolve = resolve;
	});

	promise.resolve = this.resolve;

	return promise;
}
