import { Runtime } from 'main.core';
import { GroupType } from 'tasks.v2.const';

type Params = {
	taskId: number,
	parentId: number,
	groupId: number,
};

type TaskStatusInstance = {
	isParentScrumTask: (taskId: number) => Promise<boolean>,
	showDod: (taskId: number) => Promise<void>,
	update: () => Promise<void>,
};

export class ScrumManager
{
	#params: Params;

	#taskStatus: TaskStatusInstance;
	#isParentScrumTask: boolean;

	constructor(params: Params)
	{
		this.#params = params;
	}

	isScrum(groupType: ?string): boolean
	{
		return groupType === GroupType.Scrum;
	}

	async handleDodDisplay(): Promise<boolean>
	{
		const { TaskStatus } = await Runtime.loadExtension('tasks.scrum.task-status');

		this.#taskStatus ??= new TaskStatus({
			groupId: this.#params.groupId,
			parentTaskId: this.#params.parentId,
			taskId: this.#params.taskId,
			action: 'complete',
			performActionOnParentTask: true,
			completeWithChecklist: true,
		});

		this.#isParentScrumTask ??= await this.#taskStatus.isParentScrumTask(this.#params.parentId);
		if (!this.#isParentScrumTask)
		{
			try
			{
				await this.#taskStatus.showDod(this.#params.taskId);

				return true;
			}
			catch
			{
				return false;
			}
		}

		return true;
	}

	async handleParentState(): Promise<void>
	{
		const { TaskStatus } = await Runtime.loadExtension('tasks.scrum.task-status');

		this.#taskStatus ??= new TaskStatus({
			groupId: this.#params.groupId,
			parentTaskId: this.#params.parentId,
			taskId: this.#params.taskId,
			action: 'complete',
			performActionOnParentTask: true,
			completeWithChecklist: true,
		});

		this.#isParentScrumTask ??= await this.#taskStatus.isParentScrumTask(this.#params.parentId);
		if (this.#isParentScrumTask)
		{
			void this.#taskStatus.update();
		}
	}
}
