import { Core } from 'tasks.v2.core';
import { Model } from 'tasks.v2.const';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { type CheckListModel } from 'tasks.v2.model.check-list';
import { type TaskModel } from 'tasks.v2.model.tasks';
import {
	buildCompletionSnapshot,
	type CheckListCompletionSnapshot,
} from 'tasks.v2.lib.check-list-completion-prompt';

type Dependencies = {
	getTask?: (taskId: number) => TaskModel | null,
	getItems?: (ids: Array<number>) => Array<CheckListModel>,
};

export class CheckListSnapshotBuilder
{
	#getTask: (taskId: number) => TaskModel | null;
	#getItems: (ids: Array<number>) => Array<CheckListModel>;

	constructor(dependencies: Dependencies = {})
	{
		this.#getTask = dependencies.getTask ?? ((taskId) => taskService.getStoreTask(taskId));
		this.#getItems = dependencies.getItems ?? ((ids) => Core.getStore().getters[`${Model.CheckList}/getByIds`](ids));
	}

	build(taskId: number): CheckListCompletionSnapshot
	{
		const task = this.#getTask(taskId);

		return buildCompletionSnapshot(this.#getItems(task?.checklist ?? []) ?? []);
	}
}
