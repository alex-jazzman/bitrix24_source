import { Event, Runtime, Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { analytics } from 'tasks.v2.lib.analytics';
import { type Store } from 'ui.vue3.vuex';

import { Core } from 'tasks.v2.core';
import { Model, EventName, Endpoint } from 'tasks.v2.const';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { calendar } from 'tasks.v2.lib.calendar';
import { apiClient } from 'tasks.v2.lib.api-client';
import { templateService } from 'tasks.v2.provider.service.template-service';
import { replicationService } from 'tasks.v2.provider.service.replication-service';
import { fileService } from 'tasks.v2.provider.service.file-service';
import { subTasksService, relatedTasksService, ganttService } from 'tasks.v2.provider.service.relation-service';
import { checkListService } from 'tasks.v2.provider.service.check-list-service';
import { remindersService } from 'tasks.v2.provider.service.reminders-service';
import { resultService } from 'tasks.v2.provider.service.result-service';
import { userFieldsManager } from 'tasks.v2.component.fields.user-fields';
import { type TaskModel } from 'tasks.v2.model.tasks';

import { auditorService } from './auditor-service';
import { creatorService } from './creator-service';
import { descriptionService } from './description-service';
import { crmService } from './crm-service';
import { TaskGetExtractor } from './task-get-extractor';
import { mapModelToDto } from './mappers';
import { type TaskDto, type SeparateFieldsMeta, type TaskSelect, type UpdateResult } from './types';

const STAGE_SYNC_FAILED_EVENT = EventName.TaskStageSyncFailed ?? 'tasks:card:taskStageSyncFailed';
const STAGE_SYNC_RESTORED_EVENT = EventName.TaskStageSyncRestored ?? 'tasks:card:taskStageSyncRestored';

type propsTaskServiceAdd = {
	task: TaskModel,
	view?: boolean,
	deadlineManuallySet?: boolean,
};

type propsTaskServiceCopy = {
	task: TaskModel,
	withSubTasks: boolean,
	view?: boolean,
};

type SetStageOptions = {
	completeWithChecklist?: boolean,
};

type StageMoveState = {
	latestStageId: number,
	latestRequestId: number,
	pendingMoves: Map<number, { stageId: number, echoed: boolean }>,
	invalidated: boolean,
	tail: Promise<void>,
};

type StageReadBarrier = {
	stageId: ?number,
	hasConfirmedMove: boolean,
	uncertain: boolean,
	reported: boolean,
	conflictGeneration: number,
	reconciliationPromise: ?Promise<?Error>,
};

type StageReadSnapshot = {
	generation: number,
	changedTaskIds: Set<number>,
	deletedTaskIds: Set<number>,
};

const stageMoveStates: Map<number, StageMoveState> = new Map();
const stageReadBarriers: Map<number, StageReadBarrier> = new Map();
const stageChangeGenerations: Map<number, number> = new Map();
const activeStageReads: Set<StageReadSnapshot> = new Set();
let stageChangeGeneration = 0;

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

	async get(
		id: number | string,
		taskSelect: TaskSelect,
		ignoreContains: boolean = false,
	): Promise<{ task: ?TaskModel, error: ?Error }>
	{
		if (idUtils.isTemplate(id))
		{
			await templateService.get(id);

			await this.$store.dispatch(`${Model.Tasks}/removePartiallyLoaded`, id);

			return {
				task: this.getStoreTask(id),
				error: null,
			};
		}

		try
		{
			await this.withStageSnapshot(async (snapshot: StageReadSnapshot): Promise<void> => {
				const data = await apiClient.post(Endpoint.TaskGet, { task: { id }, taskSelect });

				if (this.extractTask(data, ignoreContains, snapshot))
				{
					await this.$store.dispatch(`${Model.Tasks}/removePartiallyLoaded`, id);
				}
			});
		}
		catch (error)
		{
			if (!this.#silentErrorMode)
			{
				console.error(Endpoint.TaskGet, error);
			}

			return {
				task: null,
				error: new Error(error.errors?.[0]?.code),
			};
		}

		return {
			task: this.getStoreTask(id),
			error: null,
		};
	}

	async getCopy(id: number, tmpId: string): Promise<void>
	{
		if (idUtils.isTemplate(tmpId))
		{
			await templateService.getCopy(idUtils.boxTemplate(id), tmpId);

			return;
		}

		const { task } = await this.get(id);

		if (!task)
		{
			return;
		}

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
			replicate: task.replicate,
			replicateParams: task.replicateParams,
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

	async add(props: propsTaskServiceAdd): Promise<[number, ?Error]>
	{
		const {
			task,
			view,
			deadlineManuallySet,
		} = props;

		if (idUtils.isTemplate(task.id))
		{
			return templateService.add(task);
		}

		try
		{
			const data = await apiClient.post(Endpoint.TaskAdd, {
				task: mapModelToDto(task),
				view: Boolean(view),
				// SC-003 (AC-013): explicit client marker that the user set the deadline
				// themselves in the create form. The controller prefers it over the
				// server-side !empty(DEADLINE) heuristic, which cannot tell an accepted
				// default auto deadline from a manual one.
				deadlineManuallySet: Boolean(deadlineManuallySet),
			});

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
		void this.insertStoreTask({ ...initialTask, id: data.id });

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
			void resultService.save(
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

		if (initialTask.replicate && Type.isObject(initialTask.replicateParams))
		{
			void replicationService.add(data.id, initialTask);
		}

		this.deleteStore(initialTask.id);
	}

	async copy(props: propsTaskServiceCopy): Promise<[number, ?Error]>
	{
		const {
			task,
			withSubTasks,
			view,
		} = props;

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
				view: Boolean(view),
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

		this.#recalculateReplicationDeadlineOffset(taskBeforeUpdate, fields);

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

	async setStage(taskId: number, stageId: number, options: SetStageOptions = {}): Promise<?Error>
	{
		const barrier: StageReadBarrier = stageReadBarriers.get(taskId) ?? {
			stageId: this.getStoreTask(taskId)?.stageId,
			hasConfirmedMove: false,
			uncertain: false,
			reported: false,
			conflictGeneration: 0,
			reconciliationPromise: null,
		};
		if (barrier.uncertain)
		{
			return this.#buildStageSyncError();
		}

		const state: StageMoveState = stageMoveStates.get(taskId) ?? {
			latestStageId: stageId,
			latestRequestId: 0,
			pendingMoves: new Map(),
			invalidated: false,
			tail: Promise.resolve(),
		};
		const previousLatestStageId = state.latestStageId;
		state.latestStageId = stageId;
		const requestId = ++state.latestRequestId;
		state.pendingMoves.set(requestId, { stageId, echoed: false });
		stageReadBarriers.set(taskId, barrier);
		stageMoveStates.set(taskId, state);
		const isCurrent = () => (
			!state.invalidated
			&& stageMoveStates.get(taskId) === state
			&& stageReadBarriers.get(taskId) === barrier
		);
		try
		{
			this.updateStoreTask(taskId, { stageId });
		}
		catch (error)
		{
			state.latestStageId = previousLatestStageId;
			state.pendingMoves.delete(requestId);
			if (state.latestRequestId === requestId)
			{
				state.latestRequestId -= 1;
			}
			if (state.pendingMoves.size === 0)
			{
				stageMoveStates.delete(taskId);
				if (!barrier.hasConfirmedMove && !barrier.uncertain)
				{
					stageReadBarriers.delete(taskId);
				}
			}

			throw error;
		}

		const execute = async (): Promise<?Error> => {
			if (!isCurrent())
			{
				return this.#buildStageMoveStaleError();
			}

			try
			{
				const response = await apiClient.postComponent(
					'bitrix:tasks.task',
					'moveStage',
					{ taskId, stageId, ...options },
				);
				if (!isCurrent())
				{
					return this.#buildStageMoveStaleError();
				}
				if (response === false)
				{
					throw new Error('The task stage was not moved');
				}

				barrier.stageId = stageId;
				barrier.hasConfirmedMove = true;
				this.#noteStageChange(taskId);
				if (
					state.pendingMoves.size === 1
					&& barrier.stageId !== state.latestStageId
					&& this.getStoreTask(taskId)?.stageId === state.latestStageId
				)
				{
					this.updateStoreTask(taskId, { stageId: barrier.stageId });
				}

				return null;
			}
			catch (error)
			{
				if (!isCurrent())
				{
					return this.#buildStageMoveStaleError();
				}
				if (state.pendingMoves.get(requestId)?.echoed)
				{
					barrier.uncertain = true;
				}
				if (state.latestRequestId === requestId)
				{
					this.updateStoreTask(taskId, { stageId: barrier.stageId });
				}
				console.error('bitrix:tasks.task.moveStage', error);

				const moveError = new Error(error.errors?.[0]?.message ?? error.message);
				moveError.code = error.errors?.[0]?.code ?? error.code;

				return moveError;
			}
			finally
			{
				state.pendingMoves.delete(requestId);
				if (isCurrent() && state.pendingMoves.size === 0)
				{
					stageMoveStates.delete(taskId);
					if (!barrier.hasConfirmedMove && !barrier.uncertain)
					{
						stageReadBarriers.delete(taskId);
					}
				}
			}
		};

		const result = state.tail.then(execute);
		state.tail = result.then(() => undefined, () => undefined);

		return result.then(async (error): Promise<?Error> => {
			if (state.invalidated)
			{
				return this.#buildStageMoveStaleError();
			}
			if (state.pendingMoves.size === 0 && barrier.uncertain)
			{
				const reconciliationError = await this.reconcileStage(taskId);
				if (stageReadBarriers.get(taskId) !== barrier)
				{
					return this.#buildStageMoveStaleError();
				}

				if (error?.code && error.code !== 'STAGE_SYNC_UNCERTAIN')
				{
					return error;
				}

				return reconciliationError ?? error;
			}

			return error;
		});
	}

	async reconcileStage(taskId: number): Promise<?Error>
	{
		const barrier = stageReadBarriers.get(taskId);
		if (!barrier?.uncertain || !this.hasStoreTask(taskId))
		{
			return null;
		}
		if (stageMoveStates.get(taskId)?.pendingMoves.size > 0)
		{
			return this.#buildStageSyncError();
		}
		if (barrier.reconciliationPromise)
		{
			return barrier.reconciliationPromise;
		}

		let lastReadGeneration = barrier.conflictGeneration;
		let acceptedReply = false;
		const promise = (async (): Promise<?Error> => {
			while (stageReadBarriers.get(taskId) === barrier && this.hasStoreTask(taskId))
			{
				lastReadGeneration = barrier.conflictGeneration;
				try
				{
					const data = await apiClient.post(Endpoint.TaskGet, { task: { id: taskId } });
					if (stageReadBarriers.get(taskId) !== barrier || !this.hasStoreTask(taskId))
					{
						return null;
					}
					if (lastReadGeneration !== barrier.conflictGeneration)
					{
						continue;
					}
					if (
						!data
						|| Number(data.id) !== taskId
						|| data.rights?.read === false
						|| !Object.prototype.hasOwnProperty.call(data, 'stage')
					)
					{
						throw new Error('Task.get did not return the current stage');
					}

					const stageId = data.stage?.id ?? 0;
					this.updateStoreTask(taskId, { stageId });
					barrier.stageId = stageId;
					barrier.uncertain = false;
					barrier.reported = false;
					acceptedReply = true;

					return null;
				}
				catch (error)
				{
					if (stageReadBarriers.get(taskId) !== barrier || !this.hasStoreTask(taskId))
					{
						return null;
					}
					if (lastReadGeneration !== barrier.conflictGeneration)
					{
						continue;
					}
					if (!barrier.reported)
					{
						barrier.reported = true;
						EventEmitter.emit(STAGE_SYNC_FAILED_EVENT, { taskId });
					}

					return this.#buildStageSyncError();
				}
			}

			return null;
		})();
		barrier.reconciliationPromise = promise;
		try
		{
			return await promise;
		}
		finally
		{
			if (barrier.reconciliationPromise === promise)
			{
				barrier.reconciliationPromise = null;
				if (
					acceptedReply
					&& stageReadBarriers.get(taskId) === barrier
					&& this.hasStoreTask(taskId)
					&& !barrier.uncertain
				)
				{
					EventEmitter.emit(STAGE_SYNC_RESTORED_EVENT, { taskId });
				}
				if (
					barrier.uncertain
					&& barrier.conflictGeneration !== lastReadGeneration
					&& stageReadBarriers.get(taskId) === barrier
					&& !stageMoveStates.get(taskId)?.pendingMoves.size
				)
				{
					void this.reconcileStage(taskId);
				}
			}
		}
	}

	isStageSyncUncertain(taskId: number): boolean
	{
		return stageReadBarriers.get(taskId)?.uncertain === true;
	}

	#observeServerStage(taskId: number, stageId: number, barrier: StageReadBarrier): void
	{
		let isExpected = stageId === barrier.stageId;
		const state = stageMoveStates.get(taskId);
		for (const move of state?.pendingMoves.values() ?? [])
		{
			if (move.stageId === stageId)
			{
				move.echoed = true;
				isExpected = true;
			}
		}

		if (!isExpected || barrier.reconciliationPromise)
		{
			barrier.conflictGeneration += 1;
		}
		if (!isExpected)
		{
			barrier.uncertain = true;
		}
		if (barrier.uncertain && (!state || state.pendingMoves.size === 0))
		{
			void this.reconcileStage(taskId);
		}
	}

	#buildStageSyncError(): Error
	{
		const error = new Error('The task stage could not be verified');
		error.code = 'STAGE_SYNC_UNCERTAIN';

		return error;
	}

	#buildStageMoveStaleError(): Error
	{
		const error = new Error('The task was removed during a stage move');
		error.code = 'STAGE_MOVE_STALE';

		return error;
	}

	releaseStageMoveBarrier(taskId: number): void
	{
		const state = stageMoveStates.get(taskId);
		if (state)
		{
			state.invalidated = true;
		}
		stageMoveStates.delete(taskId);
		stageReadBarriers.delete(taskId);
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

	async delete(id: number, analyticsParams: Object = {}): Promise<void>
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

			analytics.sendDeleteTask(analyticsParams, {
				taskId: id,
			});

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

	async requestAccess(id: number): Promise<void>
	{
		try
		{
			const data = await apiClient.post(Endpoint.TaskAccessRequest, { task: { id } });

			return {
				accessRequest: data,
				error: null,
			};
		}
		catch (error)
		{
			if (!this.#silentErrorMode)
			{
				console.error(Endpoint.TaskAccessRequest, error);
			}

			return {
				accessRequest: null,
				error: new Error(error.errors?.[0]?.message),
			};
		}
	}

	async isAccessRequested(id: number): Promise<void>
	{
		try
		{
			return await apiClient.post(Endpoint.TaskAccessIsRequested, { task: { id } });
		}
		catch (error)
		{
			if (!this.#silentErrorMode)
			{
				console.error(Endpoint.TaskAccessIsRequested, error);
			}

			return false;
		}
	}

	async withStageSnapshot<T>(read: (snapshot: StageReadSnapshot) => Promise<T>): Promise<T>
	{
		const snapshot: StageReadSnapshot = {
			generation: stageChangeGeneration,
			changedTaskIds: new Set(),
			deletedTaskIds: new Set(),
		};
		activeStageReads.add(snapshot);

		try
		{
			return await read(snapshot);
		}
		finally
		{
			activeStageReads.delete(snapshot);
			if (activeStageReads.size === 0)
			{
				stageChangeGenerations.clear();
			}
		}
	}

	#noteStageChange(id: number): void
	{
		if (activeStageReads.size === 0)
		{
			return;
		}

		stageChangeGeneration += 1;
		stageChangeGenerations.set(id, stageChangeGeneration);
		for (const snapshot of activeStageReads)
		{
			snapshot.changedTaskIds.add(id);
		}
	}

	#rollbackStoreTask(
		id: number,
		taskBefore: TaskModel,
		updatedFields: TaskModel,
		snapshot: ?StageReadSnapshot,
	): void
	{
		const fields = Object.fromEntries(Object.keys(updatedFields)
			.filter((field) => field !== 'id')
			.map((field) => [field, taskBefore[field]]));
		if (snapshot?.changedTaskIds.has(id))
		{
			delete fields.stageId;
		}

		if (Object.keys(fields).length > 0)
		{
			this.updateStoreTask(id, fields);
		}
	}

	#preserveStoreStage(task: TaskModel, currentTask: ?TaskModel): void
	{
		if (Type.isUndefined(currentTask?.stageId))
		{
			delete task.stageId;
		}
		else
		{
			task.stageId = currentTask.stageId;
		}
	}

	extractTask(data: TaskDto, ignoreContains: boolean = true, stageSnapshot: ?StageReadSnapshot = null): boolean
	{
		if (!data)
		{
			return false;
		}

		if (stageSnapshot?.deletedTaskIds.has(data.id))
		{
			return false;
		}

		if (data?.rights?.read === false)
		{
			this.deleteStore(data.id);

			return false;
		}

		const extractor = new TaskGetExtractor(data);

		let task = extractor.getTask();
		const currentTask = this.getStoreTask(task.id);

		task = this.#mergeExtractedTaskWithStoreTask(task, currentTask);
		if (!Type.isUndefined(task.stageId))
		{
			if (stageSnapshot !== null && (stageChangeGenerations.get(task.id) ?? 0) > stageSnapshot.generation)
			{
				this.#preserveStoreStage(task, currentTask);
			}
			else
			{
				const barrier = stageReadBarriers.get(task.id);
				if (barrier)
				{
					this.#observeServerStage(task.id, task.stageId, barrier);
					this.#preserveStoreStage(task, currentTask);
				}
			}
		}

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

		if (task.numberOfReminders === 0 && (currentTask?.numberOfReminders ?? 0) > 0)
		{
			remindersService.clearForTask(task.id);
		}

		void fileService.get(data.id).list(data.fileIds);

		return true;
	}

	#mergeExtractedTaskWithStoreTask(task: TaskModel, currentTask: ?TaskModel): TaskModel
	{
		const mergedTask = { ...task };

		mergedTask.rights = { ...currentTask?.rights, ...mergedTask.rights };

		const mergedSubTaskIds = [...(currentTask?.subTaskIds ?? []), ...(mergedTask?.subTaskIds ?? [])];
		mergedTask.subTaskIds = [...new Set(mergedSubTaskIds)];

		const statusesFields = ['subTaskStatuses', 'relatedTaskStatuses', 'ganttTaskStatuses'];
		statusesFields.forEach((field) => {
			mergedTask[field] = { ...mergedTask?.[field], ...currentTask?.[field] };
		});

		const deadlineFields = ['maxDeadlineChanges', 'deadlineChangeCount'];
		deadlineFields.forEach((field: string) => {
			if (!Type.isUndefined(currentTask?.[field]))
			{
				mergedTask[field] = currentTask[field];
			}
		});

		return mergedTask;
	}

	#recalculateReplicationDeadlineOffset(taskBeforeUpdate: ?TaskModel, fields: TaskModel): void
	{
		if (
			Type.isNil(fields.matchesWorkTime)
			|| taskBeforeUpdate?.matchesWorkTime === fields.matchesWorkTime
		)
		{
			return;
		}

		const replicateParams = fields.replicateParams ?? taskBeforeUpdate?.replicateParams;
		const deadlineOffset = replicateParams?.deadlineOffset;
		if (!Type.isObject(replicateParams) || !deadlineOffset)
		{
			return;
		}

		const recalculatedOffsetMs = calendar.recalculateDurationByMatchWorkTime(
			deadlineOffset * 1000,
			taskBeforeUpdate.matchesWorkTime,
			fields.matchesWorkTime,
		);

		fields.replicateParams = {
			...replicateParams,
			deadlineOffset: Math.round(recalculatedOffsetMs / 1000),
		};
	}

	deleteStore(id: number): void
	{
		this.releaseStageMoveBarrier(id);
		for (const snapshot of activeStageReads)
		{
			snapshot.deletedTaskIds.add(id);
		}
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
		const promise = this.#updatePromises[id];
		if (!promise)
		{
			return;
		}

		delete this.#updatePromises[id];

		const fields = this.#updateFields[id];
		delete this.#updateFields[id];

		const taskBefore = this.#updateTaskBefore[id];
		delete this.#updateTaskBefore[id];

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

		let stageSnapshot: ?StageReadSnapshot = null;
		try
		{
			return await this.withStageSnapshot(async (snapshot: StageReadSnapshot): Promise<UpdateResult> => {
				stageSnapshot = snapshot;
				const data = await apiClient.post(endpoint, { task });

				this.extractTask(data, true, snapshot);

				return {};
			});
		}
		catch (error)
		{
			this.#rollbackStoreTask(id, taskBefore, fields, stageSnapshot);

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
		if (Type.isObject(task))
		{
			return Object.entries(fields).some(([field, value]) => JSON.stringify(task[field]) !== JSON.stringify(value));
		}

		return false;
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

	updateStoreTask(id: number, fields: TaskModel, source: 'local' | 'server' = 'local'): void
	{
		if (this.hasStoreTask(id))
		{
			const barrier = stageReadBarriers.get(id);
			if (source === 'server' && barrier && !Type.isUndefined(fields.stageId))
			{
				const { stageId, ...otherFields } = fields;
				this.#observeServerStage(id, stageId, barrier);
				if (Object.keys(otherFields).length > 0)
				{
					void this.$store.dispatch(`${Model.Tasks}/update`, { id, fields: otherFields });
				}

				return;
			}

			if (!Type.isUndefined(fields.stageId))
			{
				this.#noteStageChange(id);
			}

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
