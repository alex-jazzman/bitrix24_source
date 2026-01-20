/* eslint-disable no-param-reassign */
import { BuilderEntityModel, BuilderModel, Store } from 'ui.vue3.vuex';
import type { ActionTree, GetterTree, MutationTree } from 'ui.vue3.vuex';

import { Model, TaskField } from 'tasks.v2.const';
import type { DeadlineUserOption, StateFlags } from 'tasks.v2.model.interface';

import type { FieldFilledPayload, TaskModel, TasksModelState, TaskModelParams } from './types';

const aliasFields = {
	[TaskField.DatePlan]: new Set(['startPlanTs', 'endPlanTs', 'matchesSubTasksTime', 'startDatePlanAfter', 'endDatePlanAfter']),
	[TaskField.SubTasks]: new Set(['containsSubTasks']),
	[TaskField.RelatedTasks]: new Set(['containsRelatedTasks']),
	[TaskField.Gantt]: new Set(['containsGanttLinks']),
	[TaskField.Placements]: new Set(['containsPlacements']),
	[TaskField.Results]: new Set(['containsResults']),
	[TaskField.Reminders]: new Set(['numberOfReminders']),
	[TaskField.Replication]: new Set(['replicate']),
};

export class Tasks extends BuilderEntityModel<TasksModelState, TaskModel>
{
	static createWithVariables(params: TaskModelParams): BuilderModel
	{
		return Tasks.create().setVariables({
			stateFlags: params.stateFlags,
			deadlineUserOption: params.deadlineUserOption,
		});
	}

	getName(): string
	{
		return Model.Tasks;
	}

	getState(): TasksModelState
	{
		return {
			titles: {},
			partiallyLoadedIds: new Set(),
		};
	}

	getElementState(): TaskModel
	{
		const stateFlags: StateFlags = this.getVariable('stateFlags', {
			needsControl: false,
			matchesWorkTime: false,
		});

		const deadlineUserOption: DeadlineUserOption = this.getVariable('deadlineUserOption', {
			canChangeDeadline: false,
			maxDeadlineChangeDate: null,
			maxDeadlineChanges: null,
			requireDeadlineChangeReason: false,
		});

		return {
			id: 0,
			title: '',
			isImportant: false,
			description: '',
			descriptionChecksum: '',
			forceUpdateDescription: false,
			creatorId: 0,
			createdTs: Date.now(),
			responsibleIds: [],
			isForNewUser: false,
			deadlineTs: 0,
			deadlineAfter: null,
			startPlanTs: null,
			endPlanTs: null,
			fileIds: [],
			checklist: [],
			containsChecklist: false,
			storyPoints: '',
			epicId: 0,
			accomplicesIds: [],
			auditorsIds: [],
			tags: [],
			status: 'pending',
			statusChangedTs: Date.now(),
			needsControl: stateFlags.needsControl,
			matchesWorkTime: stateFlags.matchesWorkTime,
			filledFields: {},
			parentId: 0,
			subTaskIds: [],
			containsSubTasks: false,
			relatedTaskIds: [],
			containsRelatedTasks: false,
			ganttTaskIds: [],
			containsGanttLinks: false,
			placementIds: null,
			containsPlacements: false,
			results: [],
			resultsMessageMap: {},
			containsResults: false,
			allowsChangeDeadline: deadlineUserOption.canChangeDeadline,
			requireDeadlineChangeReason: deadlineUserOption.requireDeadlineChangeReason,
			maxDeadlineChangeDate: deadlineUserOption.maxDeadlineChangeDate,
			maxDeadlineChanges: deadlineUserOption.maxDeadlineChanges,
			deadlineChangeReason: '',
			allowsChangeDatePlan: false,
			numberOfReminders: 0,
			rights: {
				edit: true,
				deadline: true,
				datePlan: true,
				delegate: true,
				addAuditors: true,
				changeAccomplices: true,
				checklistAdd: true,
				createGanttDependence: true,
				resultRead: true,
				reminder: true,
				elapsedTime: true,
			},
			isFavorite: false,
			isMuted: false,
			requireResult: false,
			userFields: [],
			permissions: null,
		};
	}

	getGetters(): GetterTree<TasksModelState>
	{
		return {
			/** @function tasks/getTitle */
			getTitle: (state: TasksModelState) => (id: number | string): ?string => state.titles[id],
			/** @function tasks/isPartiallyLoaded */
			isPartiallyLoaded: (state: TasksModelState) => (id: number | string): boolean => {
				return state.partiallyLoadedIds.has(id);
			},
		};
	}

	getActions(): ActionTree<TasksModelState>
	{
		return {
			/** @function tasks/setTitles */
			setTitles: (store: Store, titles: TaskModel[]): void => {
				titles.forEach(({ id, title }) => store.commit('setTitle', { id, title }));
			},
			/** @function tasks/setFieldFilled */
			setFieldFilled: (store: Store, fieldFilledPayload: FieldFilledPayload): void => {
				store.commit('setFieldFilled', fieldFilledPayload);
			},
			/** @function tasks/clearFieldsFilled */
			clearFieldsFilled: (store: Store, id: number | string): void => {
				store.commit('clearFieldsFilled', id);
			},
			/** @function tasks/addPartiallyLoaded */
			addPartiallyLoaded: (store: Store, id: number | string): void => {
				store.commit('addPartiallyLoaded', id);
			},
			/** @function tasks/removePartiallyLoaded */
			removePartiallyLoaded: (store: Store, id: number | string): void => {
				store.commit('removePartiallyLoaded', id);
			},
		};
	}

	getMutations(): MutationTree<TasksModelState>
	{
		return {
			upsert: (state: TasksModelState, task: ?TaskModel): void => {
				BuilderEntityModel.defaultModel.getMutations(this).upsert(state, task);

				this.#setFieldsFilled(state, task.id);
			},
			update: (state: TasksModelState, { id, fields }: { id: number | string, fields: TaskModel }): void => {
				BuilderEntityModel.defaultModel.getMutations(this).update(state, { id, fields });

				this.#setFieldsFilled(state, fields.id ?? id);
			},
			setTitle: (state: TasksModelState, { id, title }: TaskModel): void => {
				state.titles[id] = title;
			},
			setFieldFilled: (state: TasksModelState, { id, fieldName, isFilled }: FieldFilledPayload): void => {
				(state.collection[id].filledFields ??= {})[fieldName] = isFilled ?? true;
			},
			clearFieldsFilled: (state: TasksModelState, id: number | string): void => {
				if (!state.collection[id])
				{
					return;
				}

				state.collection[id].filledFields = {};

				this.#setFieldsFilled(state, id);
			},
			addPartiallyLoaded: (state: TasksModelState, id: number | string): void => {
				state.partiallyLoadedIds.add(id);
			},
			removePartiallyLoaded: (state: TasksModelState, id: number | string): void => {
				state.partiallyLoadedIds.delete(id);
			},
		};
	}

	#setFieldsFilled(state: TasksModelState, id: number | string): void
	{
		const task = state.collection[id];
		const canEdit = task?.rights?.edit;

		task.filledFields ??= {};
		Object.entries(task).forEach(([fieldName: string, value: any]) => {
			const isFilled = Boolean(value) && (!Array.isArray(value) || value.length > 0);
			if (isFilled)
			{
				task.filledFields[this.#getAliasField(fieldName) ?? fieldName] = true;
			}

			if (!isFilled && !canEdit)
			{
				task.filledFields[fieldName] = false;
			}
		});
	}

	#getAliasField(fieldName: string): string
	{
		return Object.entries(aliasFields).find(([, alias]) => alias.has(fieldName))?.[0];
	}
}
