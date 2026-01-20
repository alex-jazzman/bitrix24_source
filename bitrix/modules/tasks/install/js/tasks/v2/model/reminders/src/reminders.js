import { BuilderEntityModel } from 'ui.vue3.vuex';
import { Model } from 'tasks.v2.const';

import type { ReminderModel, ReminderModelState } from './types';

export class Reminders extends BuilderEntityModel<ReminderModelState, ReminderModel>
{
	getName(): string
	{
		return Model.Reminders;
	}

	getGetters(): Object
	{
		return {
			/** @function reminders/getIds */
			getIds: (state: ReminderModelState, { getAll }) => (taskId: number, userId: number): number[] => getAll
				.filter((item: ReminderModel) => item.taskId === taskId && item.userId === userId)
				.map((item: ReminderModel) => item.id),
		};
	}
}
