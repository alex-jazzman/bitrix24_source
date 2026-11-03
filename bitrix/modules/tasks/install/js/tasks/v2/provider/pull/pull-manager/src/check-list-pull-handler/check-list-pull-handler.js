import { Runtime } from 'main.core';

import { taskService } from 'tasks.v2.provider.service.task-service';

import { BasePullHandler } from '../handler/base-pull-handler';

export class CheckListPullHandler extends BasePullHandler
{
	#processing: { [taskId: number]: Promise<void> } = {};
	#pending: { [taskId: number]: Object } = {};

	getMap(): { [command: string]: Function }
	{
		return {
			checklist_update: this.#handleCheckListUpdate,
		};
	}

	#handleCheckListUpdate = (data): Promise<void> => {
		const { taskId } = data;

		if (!taskService.hasStoreTask(taskId, false))
		{
			return Promise.resolve();
		}

		const inFlight = this.#processing[taskId];
		if (inFlight)
		{
			this.#pending[taskId] = data;

			return inFlight;
		}

		return this.#startProcessing(taskId, data);
	};

	#startProcessing(taskId: number, initial): Promise<void>
	{
		const run = (async () => {
			let data = initial;
			while (data !== undefined)
			{
				await this.#processCheckListUpdate(data);

				data = this.#pending[taskId];
				delete this.#pending[taskId];
			}
		})();

		this.#processing[taskId] = run;

		void run.finally(() => {
			if (this.#processing[taskId] === run)
			{
				delete this.#processing[taskId];
			}
		});

		return run;
	}

	async #processCheckListUpdate(data): Promise<void>
	{
		const { taskId, revision, checklist } = data;

		if (!taskService.hasStoreTask(taskId, false))
		{
			return;
		}

		try
		{
			const { checkListService } = await Runtime.loadExtension('tasks.v2.provider.service.check-list-service');

			if (checkListService.getRevision(taskId) === revision && !this.isFromAi(data))
			{
				return;
			}

			await checkListService.applyIncomingTree(taskId, checklist, revision);
		}
		catch (error)
		{
			console.error('tasks: checklist_update pull apply failed', taskId, error);
		}
	}
}
