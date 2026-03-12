import { Type } from 'main.core';

import { Model } from 'tasks.v2.const';
import { Core } from 'tasks.v2.core';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { BasePullHandler } from '../handler/base-pull-handler';

export class ScrumPullHandler extends BasePullHandler
{
	getMap(): { [command: string]: Function }
	{
		return {
			itemUpdated: this.#handleItemUpdated,
		};
	}

	#handleItemUpdated = (data): void => {
		const fields: TaskModel = {
			storyPoints: data.storyPoints,
		};

		if (!Type.isUndefined(data.epic))
		{
			fields.epicId = data.epic?.id ?? 0;

			if (fields.epicId > 0)
			{
				void Core.getStore().dispatch(`${Model.Epics}/upsert`, data.epic);
			}
		}

		taskService.updateStoreTask(data.sourceId, fields);
	};
}
