import { Event, Runtime, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import type { Store } from 'ui.vue3.vuex';

import { Core } from 'tasks.v2.core';
import { EventName, Model, Endpoint } from 'tasks.v2.const';
import { apiClient } from 'tasks.v2.lib.api-client';
import { taskService, TaskMappers } from 'tasks.v2.provider.service.task-service';
import { idUtils, type TaskId } from 'tasks.v2.lib.id-utils';
import { checkListService } from 'tasks.v2.provider.service.check-list-service';
import { subTasksService } from 'tasks.v2.provider.service.relation-service';
import { userFieldsManager } from 'tasks.v2.component.fields.user-fields';
import type { TagDto, TaskDto } from 'tasks.v2.provider.service.task-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { mapRights } from './mappers';

export const templateService = new class
{
	constructor()
	{
		Event.bind(window, 'beforeunload', () => {
			setTimeout(() => {
				const pendingIds = Object.keys(this.#updatePromises);
				pendingIds.forEach((id) => this.#requestUpdate(id));
			});
		});
	}

	async get(id: number): Promise<TaskModel>
	{
		try
		{
			const data = await apiClient.post(Endpoint.TemplateGet, { templateId: idUtils.unbox(id) });

			data.id = id;

			taskService.extractTask({ ...data, rights: mapRights(data.rights) }, false);
		}
		catch (error)
		{
			console.error(Endpoint.TemplateGet, error);
		}

		return taskService.getStoreTask(id);
	}

	async getCopy(id: number, tmpId: string): Promise<void>
	{
		const template = await this.get(id);

		if (template.checklist?.length > 0)
		{
			await checkListService.load(id, tmpId);
		}

		taskService.updateStoreTask(tmpId, {
			title: template.title,
			description: template.description,
			creatorId: Core.getParams().currentUser.id,
			responsibleIds: template.responsibleIds,
			deadlineAfter: template.deadlineAfter,
			needsControl: template.needsControl,
			startDatePlanAfter: template.startDatePlanAfter,
			endDatePlanAfter: template.endDatePlanAfter,
			fileIds: template.fileIds,
			groupId: template.groupId,
			isImportant: template.isImportant,
			accomplicesIds: template.accomplicesIds,
			auditorsIds: template.auditorsIds,
			parentId: template.parentId,
			allowsChangeDeadline: template.allowsChangeDeadline,
			matchesWorkTime: template.matchesWorkTime,
			tags: template.tags,
			crmItemIds: template.crmItemIds,
			containsRelatedTasks: template.containsRelatedTasks,
			relatedTaskIds: template.relatedTaskIds,
			allowsTimeTracking: template.allowsTimeTracking,
			estimatedTime: template.estimatedTime,
			permissions: template.estimatedTime,
		});
	}

	async add(template: TaskModel): Promise<[number, ?Error]>
	{
		try
		{
			const data = await apiClient.post(Endpoint.TemplateAdd, {
				template: TaskMappers.mapModelToDto(template),
			});

			data.id = idUtils.boxTemplate(data.id);

			taskService.updateStoreTask(template.id, { id: data.id });

			taskService.extractTask({ ...data, rights: mapRights(data.rights) });

			EventEmitter.emit(EventName.TemplateAdded, {
				template: taskService.getStoreTask(data.id),
				initialTemplate: template,
			});

			if (template.parentId)
			{
				subTasksService.addStore(template.parentId, [data.id]);
			}

			if (template.checklist?.length > 0)
			{
				void checkListService.save(
					data.id,
					this.$store.getters[`${Model.CheckList}/getByIds`](template.checklist),
				);
			}

			return [data.id, null];
		}
		catch (error)
		{
			console.error(Endpoint.TemplateAdd, error);

			return [0, new Error(error.errors?.[0]?.message)];
		}
	}

	async copy(template: TaskModel): Promise<void>
	{
		try
		{
			const data = await apiClient.post(Endpoint.TemplateAdd, {
				template: TaskMappers.mapModelToDto({ ...template, id: template.copiedFromId }),
			});

			data.id = idUtils.boxTemplate(data.id);

			taskService.updateStoreTask(template.id, { id: data.id });

			taskService.extractTask({ ...data, rights: mapRights(data.rights) });

			EventEmitter.emit(EventName.TemplateAdded, {
				template: taskService.getStoreTask(data.id),
				initialTemplate: template,
			});

			if (template.checklist.length > 0)
			{
				void checkListService.load(data.id);
			}

			return [data.id, null];
		}
		catch (error)
		{
			console.error(Endpoint.TemplateCopy, error);

			return [0, new Error(error.errors?.[0]?.message)];
		}
	}

	async getTask(templateId: number, taskId: TaskId): Promise<void>
	{
		try
		{
			const data: TaskDto = await apiClient.post(Endpoint.TaskFromTemplateGet, { templateId });

			data.id = taskId;
			data.templateId = templateId;

			const isAdmin = Core.getParams().rights.user.admin;

			if (
				!isAdmin
				&& (
					data.responsible?.id !== Core.getParams().currentUser.id
					|| Type.isArrayFilled(data.multiResponsibles)
				)
			)
			{
				data.creator = Core.getParams().currentUser;
			}

			data.group ??= { id: 0 };
			data.stage ??= { id: 0 };

			const tmpTask = taskService.getStoreTask(taskId);
			if (tmpTask.flowId)
			{
				data.creator = Core.getParams().currentUser;
				data.responsible = Core.getParams().currentUser;
				data.description = tmpTask.description + data.description;
				delete data.multiResponsibles;
				delete data.deadlineTs;
				delete data.group;
			}

			if (Type.isArrayFilled(tmpTask.crmItemIds))
			{
				const uniqueCrmItemIds: Set<number> = new Set(
					[...(tmpTask.crmItemIds || []), ...(data.crmItemIds || [])],
				);
				data.crmItemIds = [...uniqueCrmItemIds];

				const uniqueTags: Set<string> = new Set();
				[...(tmpTask.tags || []), ...(data.tags || [])].forEach((tag: TagDto | string): void => {
					if (Type.isString(tag))
					{
						uniqueTags.add(tag);

						return;
					}

					uniqueTags.add(tag.name);
				});

				data.tags = [...uniqueTags].map((tag: string): TagDto => ({ name: tag }));
			}

			if (Type.isArrayFilled(data.userFields))
			{
				data.userFields = userFieldsManager.prepareUserFieldsForTaskFromTemplate(
					data.userFields,
					Core.getParams().taskUserFieldScheme,
				);
			}

			taskService.extractTask(data, false);

			if (data.checklist?.length > 0)
			{
				await checkListService.load(taskId);
			}
		}
		catch (error)
		{
			console.error(Endpoint.TaskFromTemplateGet, error);
		}
	}

	async addTask(templateId: number, task: TaskModel, withSubTasks: boolean): Promise<[number, ?Error]>
	{
		try
		{
			const data = await apiClient.post(Endpoint.TaskFromTemplateAdd, {
				template: { id: templateId },
				task: TaskMappers.mapModelToDto(task),
				withSubTasks,
			});

			data.templateId = 0;

			if (task.responsibleIds.length > 1)
			{
				const multiResponsibleIds = task.responsibleIds.filter(
					(id) => id !== Core.getParams().currentUser.id,
				);

				await apiClient.post(Endpoint.TaskMultiTaskAdd, {
					taskId: data.id,
					userIds: multiResponsibleIds,
				});

				subTasksService.addStore(task.id, multiResponsibleIds.map((id) => `userTask${id}`));
			}

			taskService.onAfterTaskAdded(task, data);

			return [data.id, null];
		}
		catch (error)
		{
			console.error(Endpoint.TaskFromTemplateAdd, error);

			return [0, new Error(error.errors?.[0]?.message)];
		}
	}

	async update(id: string, fields: TaskModel): Promise<void>
	{
		const templateBefore = taskService.getStoreTask(id);

		if (!taskService.hasChanges(templateBefore, fields))
		{
			return;
		}

		taskService.updateStoreTask(id, fields);

		if (!idUtils.isReal(id))
		{
			return;
		}

		EventEmitter.emit(EventName.TemplateBeforeUpdate, {
			template: taskService.getStoreTask(id),
			fields: { id, ...fields },
		});

		await this.#updateDebounced(id, fields, templateBefore);
	}

	async delete(id: string): Promise<void>
	{
		const templateBeforeDelete = taskService.getStoreTask(id);

		await taskService.deleteStore(id);

		if (!idUtils.isReal(id))
		{
			return;
		}

		const templateId = idUtils.unbox(id);

		try
		{
			await apiClient.post(Endpoint.TemplateDelete, { templateId });

			EventEmitter.emit(EventName.TemplateDeleted, { id: templateId });
		}
		catch (error)
		{
			await taskService.insertStoreTask(templateBeforeDelete);

			console.error(Endpoint.TemplateDelete, error);
		}
	}

	async insertStoreTask(task: TaskModel): Promise<void>
	{
		await this.$store.dispatch(`${Model.Tasks}/insert`, {
			...task,
			permissions: [],
		});
	}

	#updateFields: { [id: string]: TaskModel } = {};
	#updateTaskBefore: { [id: string]: TaskModel } = {};
	#updatePromises: { [id: string]: Resolvable } = {};
	#updateServerTaskDebounced: { [id: string]: Function } = {};

	#updateDebounced(id: string, fields: TaskModel, templateBefore: TaskModel): Promise<void>
	{
		this.#updateFields[id] = { ...this.#updateFields[id], ...fields };
		this.#updateTaskBefore[id] ??= templateBefore;
		this.#updatePromises[id] ??= new Resolvable();
		this.#updateServerTaskDebounced[id] ??= Runtime.debounce(this.#requestUpdate, 500, this);
		this.#updateServerTaskDebounced[id](id);

		return this.#updatePromises[id];
	}

	async #requestUpdate(id: string): Promise<void>
	{
		const fields = this.#updateFields[id];
		delete this.#updateFields[id];

		const templateBefore = this.#updateTaskBefore[id];
		delete this.#updateTaskBefore[id];

		const promise = this.#updatePromises[id];
		delete this.#updatePromises[id];

		const templateId = idUtils.unbox(id);

		try
		{
			await apiClient.post(
				Endpoint.TemplateUpdate,
				{ template: TaskMappers.mapModelToDto({ id: templateId, ...fields }) },
			);
		}
		catch (error)
		{
			taskService.updateStoreTask(id, templateBefore);

			console.error(Endpoint.TemplateUpdate, error);
		}

		promise.resolve();
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
