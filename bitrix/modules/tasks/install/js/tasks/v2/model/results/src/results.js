import { BuilderEntityModel } from 'ui.vue3.vuex';
import { Model } from 'tasks.v2.const';

import type { ResultModel, ResultsModelState } from './types';

export class Results extends BuilderEntityModel<ResultsModelState, ResultModel>
{
	getName(): string
	{
		return Model.Results;
	}

	getElementState(): ResultModel
	{
		return {
			id: 0,
			taskId: 0,
			text: '',
			author: null,
			createdAtTs: 0,
			updatedAtTs: 0,
			status: 'open',
			fileIds: [],
			previewId: null,
			rights: {
				edit: true,
				remove: true,
			},
			files: [],
		};
	}
}
