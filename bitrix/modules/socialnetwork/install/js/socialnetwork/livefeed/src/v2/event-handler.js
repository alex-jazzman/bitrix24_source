import { EventEmitter, type BaseEvent } from 'main.core.events';
import type { TaskModel } from 'tasks.task-model';

import { Api } from './api';
import { CardParams } from './types';

const createdTasks = new Set();

export const eventHandler = new class
{
	#inited: boolean = false;

	init(): void
	{
		if (this.#inited)
		{
			return;
		}

		EventEmitter.subscribe('tasks:card:taskAdded', this.#handleTaskAdded);
		EventEmitter.subscribe('tasks:full-card:closed', this.#handleCardClosed);
		EventEmitter.subscribe('tasks:card:closed', this.#handleCardClosed);

		this.#inited = true;
	}

	#handleTaskAdded = (event: BaseEvent): void => {
		const { task, initialTask }: { task: TaskModel, initialTask: CardParams } = event.getData();

		createdTasks.add(initialTask.id);

		void Api.createEntityComment(task.id, initialTask.createParams);
	};

	#handleCardClosed = (event: BaseEvent): void => {
		const cardParams: CardParams = event.getData();
		if (createdTasks.has(cardParams.taskId))
		{
			return;
		}

		void Api.clearNewTaskFiles(cardParams.requestData.UF_TASK_WEBDAV_FILES_SIGN);
	};
}();
