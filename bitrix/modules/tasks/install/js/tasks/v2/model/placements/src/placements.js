import { BuilderEntityModel } from 'ui.vue3.vuex';
import { Model, PlacementType } from 'tasks.v2.const';

import type { PlacementModel, PlacementsModelState } from './types';

export class Placements extends BuilderEntityModel<PlacementsModelState, PlacementModel>
{
	getName(): string
	{
		return Model.Placements;
	}

	getElementState(): PlacementModel
	{
		return {
			id: 0,
			appId: 0,
			title: '',
			description: '',
			type: PlacementType.taskViewSlider,
		};
	}
}
