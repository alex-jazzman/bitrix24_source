/* eslint-disable no-param-reassign */
import { localStorage } from 'main.core';
import { BuilderModel, type ActionTree, type GetterTree, type MutationTree } from 'ui.vue3.vuex';

import { Model } from 'tasks.v2.const';
import { calendar } from 'tasks.v2.lib.calendar';
import { timezone } from 'tasks.v2.lib.timezone';

import {
	type InterfaceModelParams,
	type InterfaceModelState,
	type CheckListCompletionCallback,
	type DeadlineUserOption,
	type StateFlags,
	type UserFieldScheme,
	type TaskListOptions,
} from './types';
import { type TaskModel } from 'tasks.v2.model.tasks';

export class Interface extends BuilderModel
{
	static createWithVariables(params: InterfaceModelParams): BuilderModel
	{
		updateSkeleton(params.userOptions.fullCard?.cardWidth);

		return Interface.create().setVariables({
			currentUserId: params.currentUser.id,
			stateFlags: params.stateFlags,
			templateStateFlags: params.templateStateFlags,
			deadlineUserOption: params.deadlineUserOption,
			taskUserFieldScheme: params.taskUserFieldScheme,
			templateUserFieldScheme: params.templateUserFieldScheme,
			fullCardWidth: params.userOptions.fullCard?.cardWidth,
			taskListOptions: params.userOptions.fullCard?.taskListOptions
				? JSON.parse(params.userOptions.fullCard.taskListOptions)
				: undefined
			,
		});
	}

	getName(): string
	{
		return Model.Interface;
	}

	getState(): InterfaceModelState
	{
		return {
			currentUserId: this.getVariable('currentUserId', 0),
			titleFieldOffsetHeight: null,
			stateFlags: this.getVariable('stateFlags', {
				needsControl: false,
				matchesWorkTime: false,
				defaultRequireResult: false,
				allowsTimeTracking: false,
			}),
			templateStateFlags: this.getVariable('templateStateFlags', {
				needsControl: false,
				matchesWorkTime: false,
				defaultRequireResult: false,
				allowsTimeTracking: false,
			}),
			deadlineUserOption: this.getVariable('deadlineUserOption', {
				defaultDeadlineInSeconds: 0,
				defaultDeadlineDate: '',
			}),
			fullCardWidth: this.getVariable('fullCardWidth', null),
			deletingCheckListIds: {},
			disableCheckListAnimations: false,
			checkListCompletionCallbacks: {},
			draggedCheckListId: null,
			taskUserFieldScheme: this.getVariable('taskUserFieldScheme', []),
			templateUserFieldScheme: this.getVariable('templateUserFieldScheme', []),
			taskWithActiveTimer: null,
			taskListOptions: this.getVariable('taskListOptions', {
				showCompletedSubTasks: true,
				showCompletedRelatedTasks: true,
				showCompletedGantt: true,
				showSubTasks: true,
				showSubTemplates: true,
			}),
		};
	}

	getGetters(): GetterTree<InterfaceModelState>
	{
		return {
			/** @function interface/currentUserId */
			currentUserId: (state: InterfaceModelState): number => state.currentUserId,
			/** @function interface/fullCardWidth */
			fullCardWidth: (state: InterfaceModelState): number => state.fullCardWidth,
			/** @function interface/titleFieldOffsetHeight */
			titleFieldOffsetHeight: (state: InterfaceModelState): number => state.titleFieldOffsetHeight,
			/** @function interface/stateFlags */
			stateFlags: (state: InterfaceModelState): StateFlags => state.stateFlags,
			/** @function interface/templateStateFlags */
			templateStateFlags: (state: InterfaceModelState): StateFlags => state.templateStateFlags,
			/** @function interface/deadlineUserOption */
			deadlineUserOption: (state: InterfaceModelState): DeadlineUserOption => state.deadlineUserOption,
			/** @function interface/defaultDeadlineTs */
			defaultDeadlineTs: (state: InterfaceModelState): ?number => {
				if (state.deadlineUserOption && state.deadlineUserOption.isExactDeadlineTime)
				{
					const worktimeTs = calendar.clampWorkDateTime(Date.now());
					const durationTs = state.deadlineUserOption.defaultDeadlineInSeconds * 1000;
					const deadlineTs = calendar.calculateEndTs(worktimeTs, null, durationTs);
					const fiveMinutes = 5 * 60 * 1000;

					return Math.ceil(deadlineTs / fiveMinutes) * fiveMinutes;
				}

				if (state.deadlineUserOption && state.deadlineUserOption.defaultDeadlineDate)
				{
					const deadlineTs = new Date(state.deadlineUserOption.defaultDeadlineDate).getTime();

					return deadlineTs - timezone.getOffset(deadlineTs);
				}

				return null;
			},
			/** @function interface/deletingCheckListIds */
			deletingCheckListIds: (state: InterfaceModelState): { [id: number]: number } => state.deletingCheckListIds,
			/** @function interface/disableCheckListAnimations */
			disableCheckListAnimations: (state: InterfaceModelState): number => state.disableCheckListAnimations,
			/** @function interface/draggedCheckListId */
			draggedCheckListId: (state: InterfaceModelState): ?number | ?string => state.draggedCheckListId,
			/** @function interface/taskUserFieldScheme */
			taskUserFieldScheme: (state: InterfaceModelState): UserFieldScheme[] => state.taskUserFieldScheme,
			/** @function interface/templateUserFieldScheme */
			templateUserFieldScheme: (state: InterfaceModelState): UserFieldScheme[] => state.templateUserFieldScheme,
			/** @function interface/taskWithActiveTimer */
			taskWithActiveTimer: (state: InterfaceModelState): ?TaskModel => state.taskWithActiveTimer,
			/** @function interface/taskListOptions */
			taskListOptions: (state: InterfaceModelState): TaskListOptions => state.taskListOptions,
		};
	}

	getActions(): ActionTree<InterfaceModelState>
	{
		return {
			/** @function interface/updateFullCardWidth */
			updateFullCardWidth: (store, fullCardWidth: number) => {
				store.commit('setFullCardWidth', fullCardWidth);
				updateSkeleton(fullCardWidth);
			},
			/** @function interface/updateTitleFieldOffsetHeight */
			updateTitleFieldOffsetHeight: (store, titleFieldOffsetHeight: number) => {
				store.commit('setTitleFieldOffsetHeight', titleFieldOffsetHeight);
			},
			/** @function interface/updateStateFlags */
			updateStateFlags: (store, stateFlags: Partial<StateFlags>) => {
				store.commit('setStateFlags', stateFlags);
			},
			/** @function interface/updateTemplateStateFlags */
			updateTemplateStateFlags: (store, stateFlags: Partial<StateFlags>) => {
				store.commit('setTemplateStateFlags', stateFlags);
			},
			/** @function interface/updateDeadlineUserOption */
			updateDeadlineUserOption: (store, deadlineUserOption: Partial<DeadlineUserOption>) => {
				store.commit('setDeadlineUserOption', deadlineUserOption);
			},
			/** @function interface/addCheckListItemToDeleting */
			addCheckListItemToDeleting: (store, itemId: number | string) => {
				store.commit('addCheckListItemToDeleting', itemId);
			},
			/** @function interface/removeCheckListItemFromDeleting */
			removeCheckListItemFromDeleting: (store, itemId: number | string) => {
				store.commit('removeCheckListItemFromDeleting', itemId);
			},
			/** @function interface/addCheckListCompletionCallback */
			addCheckListCompletionCallback: (store, { id, callback }) => {
				store.commit('addCheckListCompletionCallback', { id, callback });
			},
			/** @function interface/executeCheckListCompletionCallbacks */
			executeCheckListCompletionCallbacks: (store) => {
				store.commit('executeCheckListCompletionCallbacks');
			},
			/** @function interface/setDisableCheckListAnimations */
			setDisableCheckListAnimations: (store, disableCheckListAnimations: boolean) => {
				store.commit('setDisableCheckListAnimations', disableCheckListAnimations);
			},
			/** @function interface/setDraggedCheckListId */
			setDraggedCheckListId: (store, id: ?number | ?string) => {
				store.commit('setDraggedCheckListId', id);
			},
			/** @function interface/updateTaskUserFieldScheme */
			updateTaskUserFieldScheme: (store, taskUserFieldScheme: UserFieldScheme[]) => {
				store.commit('setTaskUserFieldScheme', taskUserFieldScheme);
			},
			/** @function interface/updateTemplateUserFieldScheme */
			updateTemplateUserFieldScheme: (store, templateUserFieldScheme: UserFieldScheme[]) => {
				store.commit('setTemplateUserFieldScheme', templateUserFieldScheme);
			},
			/** @function interface/setTaskWithActiveTimer */
			setTaskWithActiveTimer: (store, task: ?TaskModel) => {
				store.commit('setTaskWithActiveTimer', task);
			},
			/** @function interface/updateTaskListOptions */
			updateTaskListOptions: (store, taskListOptions: TaskListOptions) => {
				store.commit('setTaskListOptions', taskListOptions);
			},
		};
	}

	getMutations(): MutationTree<InterfaceModelState>
	{
		return {
			setFullCardWidth: (state: InterfaceModelState, fullCardWidth: number) => {
				state.fullCardWidth = fullCardWidth;
			},
			setTitleFieldOffsetHeight: (state: InterfaceModelState, titleFieldOffsetHeight: number) => {
				state.titleFieldOffsetHeight = titleFieldOffsetHeight;
			},
			setStateFlags: (state: InterfaceModelState, stateFlags: Partial<StateFlags>) => {
				state.stateFlags = {
					...state.stateFlags,
					...stateFlags,
				};
			},
			setTemplateStateFlags: (state: InterfaceModelState, stateFlags: Partial<StateFlags>) => {
				state.templateStateFlags = {
					...state.templateStateFlags,
					...stateFlags,
				};
			},
			setDeadlineUserOption: (state: InterfaceModelState, deadlineUserOption: Partial<DeadlineUserOption>) => {
				state.deadlineUserOption = {
					...state.deadlineUserOption,
					...deadlineUserOption,
				};
			},
			addCheckListItemToDeleting: (state: InterfaceModelState, itemId: number | string) => {
				state.deletingCheckListIds[itemId] = itemId;
			},
			removeCheckListItemFromDeleting: (state: InterfaceModelState, itemId: number) => {
				delete state.deletingCheckListIds[itemId];
			},
			addCheckListCompletionCallback: (state: InterfaceModelState, { id, callback }) => {
				state.checkListCompletionCallbacks[id] = callback;
			},
			executeCheckListCompletionCallbacks: (state: InterfaceModelState) => {
				Object.values(state.checkListCompletionCallbacks).forEach((cb: CheckListCompletionCallback) => cb());
				state.checkListCompletionCallbacks = {};
			},
			setDisableCheckListAnimations: (state: InterfaceModelState, disableCheckListAnimations: boolean) => {
				state.disableCheckListAnimations = disableCheckListAnimations === true;
			},
			setDraggedCheckListId: (state: InterfaceModelState, id: ?number | ?string) => {
				state.draggedCheckListId = id;
			},
			setTaskUserFieldScheme: (state: InterfaceModelState, taskUserFieldScheme: UserFieldScheme[]) => {
				state.taskUserFieldScheme = taskUserFieldScheme;
			},
			setTemplateUserFieldScheme: (state: InterfaceModelState, templateUserFieldScheme: UserFieldScheme[]) => {
				state.templateUserFieldScheme = templateUserFieldScheme;
			},
			setTaskWithActiveTimer: (state: InterfaceModelState, task: ?TaskModel) => {
				state.taskWithActiveTimer = task;
			},
			setTaskListOptions: (state: InterfaceModelState, taskListOptions: TaskListOptions) => {
				state.taskListOptions = taskListOptions;
			},
		};
	}
}

const updateSkeleton = (width: number) => {
	const style = width ? `style="width: ${width}px;"` : '';

	localStorage.set('tasks-skeleton-width', style, 315_360_000);
};
