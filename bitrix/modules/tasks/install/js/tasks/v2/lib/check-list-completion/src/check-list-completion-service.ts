import { Loc } from 'main.core';
import { Notifier } from 'ui.notification-manager';

import { Core } from 'tasks.v2.core';
import { Model, TaskStatus } from 'tasks.v2.const';
import { checkListService } from 'tasks.v2.provider.service.check-list-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import {
	checkListCompletionPromptRunner,
	CompletionStates,
	type CheckListCompletionSnapshot,
	type CompletionResult,
} from 'tasks.v2.lib.check-list-completion-prompt';

import { CheckListSnapshotBuilder } from './check-list-snapshot-builder';

export type CompletionRunOptions = {
	taskId: number,
	complete: () => Promise<unknown | null>,
	completeWithChecklist: () => Promise<unknown | null>,
	beforeComplete?: () => Promise<boolean>,
};

export class CheckListCompletionService
{
	#snapshotBuilder = new CheckListSnapshotBuilder();

	async run(options: CompletionRunOptions): Promise<CompletionResult>
	{
		const { taskId, complete, completeWithChecklist, beforeComplete } = options;
		let snapshot: CheckListCompletionSnapshot | null = null;
		try
		{
			await checkListService.forceSavePending(taskId, { rejectOnError: true });
			await checkListService.ensureLoaded(taskId);
			snapshot = this.#snapshotBuilder.build(taskId);
		}
		catch (error)
		{
			console.error('CheckListCompletionService: run error', error);

			return Object.freeze({ state: CompletionStates.Failed, error, snapshot: null });
		}

		return checkListCompletionPromptRunner.run(snapshot, {
			complete: () => this.#runAction(complete),
			completeWithChecklist: async () => {
				const error = await this.#runAction(completeWithChecklist);
				if (!error)
				{
					await this.#markSnapshotComplete(snapshot);
					this.#showSuccessNotification(taskId);
				}

				return error;
			},
		}, { beforeComplete });
	}

	async #runAction(action: () => Promise<unknown | null>): Promise<unknown | null>
	{
		try
		{
			return await action();
		}
		catch (error)
		{
			console.error('CheckListCompletionService: action error', error);

			return error;
		}
	}

	async #markSnapshotComplete(snapshot: CheckListCompletionSnapshot): Promise<void>
	{
		const completedItems = snapshot.incompleteIds
			.map((id) => Core.getStore().getters[`${Model.CheckList}/getById`](id))
			.filter(Boolean)
			.map((item) => ({ ...item, isComplete: true }))
		;

		if (completedItems.length > 0)
		{
			await Core.getStore().dispatch(`${Model.CheckList}/upsertMany`, completedItems);
		}
	}

	#showSuccessNotification(taskId: number): void
	{
		const task = taskService.getStoreTask(taskId);
		const message = task?.needsControl === true || task?.status === TaskStatus.SupposedlyCompleted
			? 'TASKS_V2_CHECKLIST_TASK_SENT_TO_REVIEW'
			: 'TASKS_V2_CHECKLIST_TASK_COMPLETED';

		Notifier.notifyViaBrowserProvider({
			id: `tasks-checklist-on-complete-success-${taskId}`,
			text: Loc.getMessage(message) ?? '',
		});
	}
}

export function isCompletionSuccessful(result: CompletionResult): boolean
{
	return result.state === CompletionStates.Success;
}

export const checkListCompletionService = new CheckListCompletionService();
