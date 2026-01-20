import { BuilderEntityModel, type GetterTree, type MutationTree } from 'ui.vue3.vuex';
import { Model } from 'tasks.v2.const';

import type { GanttLinkId, GanttLinkModel, GanttLinksModelState } from './types';

export class GanttLinks extends BuilderEntityModel<GanttLinksModelState, GanttLinkModel>
{
	getName(): string
	{
		return Model.GanttLinks;
	}

	getGetters(): GetterTree<GanttLinksModelState>
	{
		return {
			/** @function gantt-links/getLink */
			getLink: (state: GanttLinksModelState) => (ganttLinkId: GanttLinkId): GanttLinkModel => {
				return state.collection[this.#buildId(ganttLinkId)];
			},
		};
	}

	getMutations(): MutationTree<GanttLinksModelState>
	{
		return {
			upsert: (state: GanttLinksModelState, ganttLink: GanttLinkModel): void => {
				const id = this.#buildId(ganttLink);

				BuilderEntityModel.defaultModel.getMutations(this).upsert(state, { id, ...ganttLink });
			},
		};
	}

	#buildId({ taskId, dependentId }: GanttLinkId): string
	{
		return `${taskId}.${dependentId}`;
	}
}
