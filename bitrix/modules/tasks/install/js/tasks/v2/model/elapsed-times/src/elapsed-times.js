import { Type } from 'main.core';
import { BuilderEntityModel } from 'ui.vue3.vuex';
import { Model } from 'tasks.v2.const';

import type { ElapsedTimeModel, ElapsedTimeState } from './types';

export class ElapsedTimes extends BuilderEntityModel<ElapsedTimeState, ElapsedTimeModel>
{
	getName(): string
	{
		return Model.ElapsedTimes;
	}

	getGetters(): Object
	{
		return {
			/** @function elapsed-times/getIds */
			getIds: (state: ElapsedTimeState, { getAll }) => (taskId: number): number[] => getAll
				.filter((item: ElapsedTimeModel) => item.taskId === taskId)
				.sort((a: ElapsedTimeModel, b: ElapsedTimeModel) => {
					const aIsString = !Type.isNumber(a.id);
					const bIsString = !Type.isNumber(b.id);

					if (aIsString && !bIsString)
					{
						return -1;
					}

					if (!aIsString && bIsString)
					{
						return 1;
					}

					if (aIsString && bIsString)
					{
						return b.id.localeCompare(a.id);
					}

					return b.id - a.id;
				})
				.map((item: ElapsedTimeModel) => item.id),
		};
	}
}
