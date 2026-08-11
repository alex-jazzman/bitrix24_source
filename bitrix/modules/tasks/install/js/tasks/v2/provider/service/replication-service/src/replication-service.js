import { Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import type { BaseEvent } from 'main.core.events';

import { Notifier } from 'ui.notification-manager';

import { Core } from 'tasks.v2.core';
import { Endpoint, EventName, Model } from 'tasks.v2.const';
import { apiClient } from 'tasks.v2.lib.api-client';
import { idUtils } from 'tasks.v2.lib.id-utils';
import type { TaskModel } from 'tasks.v2.model.tasks';
import { taskService } from 'tasks.v2.provider.service.task-service';

import { mapModelToDto, mapDtoToModel } from '../../task-service/src/mappers';

export class ReplicationService
{
	constructor()
	{
		this.#subscribeToEvents();
	}

	async add(taskId: number, task: TaskModel): Promise<void>
	{
		try
		{
			const data = await apiClient.post(Endpoint.TaskReplicationAdd, { task: mapModelToDto({ ...task, id: taskId }) });

			const { id } = mapDtoToModel(data);

			taskService.updateStoreTask(taskId, {
				replicate: true,
				replicateParams: task.replicateParams,
				replicateTemplate: { id, rights: { edit: true } },
			});
		}
		catch (error)
		{
			Notifier.notifyViaBrowserProvider({
				id: 'task-notify-replication-add-error',
				text: error?.errors?.[0]?.message,
			});

			taskService.updateStoreTask(taskId, {
				replicateParams: null,
			});

			console.error(Endpoint.TaskReplicationAdd, error);
		}
	}

	async update(task: TaskModel, payload: Object): Promise<void>
	{
		const isTemplate = idUtils.isTemplate(task.id);

		try
		{
			if (isTemplate)
			{
				await this.#update(task.id, payload);

				const templateId = idUtils.unbox(task.id);

				EventEmitter.emit(EventName.UpdateReplicateParams, { ...payload, templateId });
			}
			else
			{
				const templateId = task?.replicateTemplate?.id ?? task?.forkedByTemplate?.id;

				if (Type.isUndefined(templateId))
				{
					return;
				}

				await this.#update(idUtils.boxTemplate(templateId), payload);

				taskService.updateStoreTask(task.id, payload);

				const deadlineOffset = payload.replicateParams?.deadlineOffset;
				taskService.updateStoreTask(idUtils.boxTemplate(templateId), {
					deadlineAfter: Type.isNumber(deadlineOffset) ? deadlineOffset * 1000 : null,
				});

				EventEmitter.emit(EventName.NotifyTaskTemplateUpdated, { templateId });

				EventEmitter.emit(EventName.UpdateReplicateParams);
			}
		}
		catch (error)
		{
			const updateError = error?.[Endpoint.TemplateUpdate]?.[0];

			Notifier.notifyViaBrowserProvider({
				id: 'task-notify-replication-update-error',
				text: updateError?.message,
			});
		}
	}

	async setReplicationState(taskId: number, task: TaskModel): Promise<void>
	{
		const isTemplate = idUtils.isTemplate(taskId);
		const endpoint = isTemplate ? Endpoint.TemplateReplicationSetState : Endpoint.TaskReplicationSetState;

		try
		{
			const id = isTemplate ? idUtils.unbox(taskId) : taskId;

			await apiClient.post(endpoint, {
				[isTemplate ? 'template' : 'task']: {
					id,
					replicate: task.replicate,
					forkedByTemplate: task.forkedByTemplate,
				},
			});

			taskService.updateStoreTask(taskId, { replicate: task.replicate });

			if (isTemplate)
			{
				EventEmitter.emit(EventName.UpdateReplicateParams, {
					replicate: task.replicate,
					templateId: id,
				});
			}
			else
			{
				const templateId = task.forkedByTemplate?.id ?? task.replicateTemplate?.id;

				taskService.updateStoreTask(idUtils.boxTemplate(templateId), { replicate: task.replicate });
			}
		}
		catch (error)
		{
			Notifier.notifyViaBrowserProvider({
				id: 'task-notify-replication-set-state-error',
				text: error.errors?.[0]?.message,
			});

			console.error(endpoint, error);
		}
	}

	#subscribeToEvents(): void
	{
		EventEmitter.subscribe(EventName.TemplateDeleted, this.#handleReplicateTemplateDeleted);
	}

	#handleReplicateTemplateDeleted(event: BaseEvent): void
	{
		const { id: templateId } = event.getData();
		const store = Core.getStore();
		const tasks = store.state[Model.Tasks]?.collection ?? {};

		Object.values(tasks).forEach((task: TaskModel) => {
			const replicateTemplateId = task.replicateTemplate?.id;
			const forkedByTemplateId = task.forkedByTemplate?.id;

			if (replicateTemplateId !== templateId && forkedByTemplateId !== templateId)
			{
				return;
			}

			const fieldsToDrop = {
				replicate: false,
				replicateParams: null,
			};

			if (!Type.isUndefined(replicateTemplateId))
			{
				taskService.updateStoreTask(task.id, {
					...fieldsToDrop,
					replicateTemplate: null,
				});
			}
			else if (!Type.isUndefined(forkedByTemplateId))
			{
				taskService.updateStoreTask(task.id, {
					...fieldsToDrop,
					forkedByTemplate: null,
				});
			}
		});
	}

	#hasUpdateError(result: Object): boolean
	{
		return result?.[Endpoint.TemplateUpdate]?.[0];
	}

	async #update(id: number, payload: Object): Promise<void>
	{
		const result = await taskService.update(id, payload);

		if (this.#hasUpdateError(result))
		{
			throw result;
		}
	}
}
