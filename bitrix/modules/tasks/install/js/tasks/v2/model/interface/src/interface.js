/* eslint-disable no-param-reassign */
import { BuilderModel } from 'ui.vue3.vuex';
import type { ActionTree, GetterTree, MutationTree } from 'ui.vue3.vuex';
import { Model } from 'tasks.v2.const';

import type {
	InterfaceModelParams,
	InterfaceModelState,
	DefaultDeadline,
} from './types';

export class Interface extends BuilderModel
{
	static createWithVariables(params: InterfaceModelParams): BuilderModel
	{
		return Interface.create().setVariables({
			currentUserId: params.currentUserId,
			defaultDeadline: params.defaultDeadline,
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
			titleFieldOffsetHeight: this.getVariable('titleFieldOffsetHeight', null),
			defaultDeadline: this.getVariable('defaultDeadline', {
				defaultDeadlineInSeconds: 0,
				defaultDeadlineDate: '',
			}),
		};
	}

	getGetters(): GetterTree<InterfaceModelState>
	{
		return {
			/** @function interface/currentUserId */
			currentUserId: (state: InterfaceModelState): number => state.currentUserId,
			/** @function interface/titleFieldOffsetHeight */
			titleFieldOffsetHeight: (state: InterfaceModelState): number => state.titleFieldOffsetHeight,
			/** @function interface/defaultDeadline */
			defaultDeadline: (state: InterfaceModelState): DefaultDeadline => state.defaultDeadline,
		};
	}

	getActions(): ActionTree<InterfaceModelState>
	{
		return {
			/** @function interface/updateTitleFieldOffsetHeight */
			updateTitleFieldOffsetHeight: (store, titleFieldOffsetHeight: number) => {
				store.commit('setTitleFieldOffsetHeight', titleFieldOffsetHeight);
			},
			/** @function interface/updateDefaultDeadline */
			updateDefaultDeadline: (store, defaultDeadline: DefaultDeadline) => {
				store.commit('setDefaultDeadline', defaultDeadline);
			},
		};
	}

	getMutations(): MutationTree<InterfaceModelState>
	{
		return {
			setTitleFieldOffsetHeight: (state: InterfaceModelState, titleFieldOffsetHeight: number) => {
				state.titleFieldOffsetHeight = titleFieldOffsetHeight;
			},
			setDefaultDeadline: (state: InterfaceModelState, defaultDeadline: DefaultDeadline) => {
				state.defaultDeadline = defaultDeadline;
			},
		};
	}
}
