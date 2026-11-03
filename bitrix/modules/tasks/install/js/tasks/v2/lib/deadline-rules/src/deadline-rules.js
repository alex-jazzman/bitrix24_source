import { Type } from 'main.core';

import { Endpoint } from 'tasks.v2.const';
import { Core } from 'tasks.v2.core';
import { idUtils, type TaskId } from 'tasks.v2.lib.id-utils';
import { deadlineService } from 'tasks.v2.provider.service.deadline-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { type TaskModel } from 'tasks.v2.model.tasks';

export const DeadlineSaveStatus = Object.freeze({
	Saved: 'saved',
	Failed: 'failed',
	Skipped: 'skipped',
	ReasonRequired: 'reasonRequired',
});

export type DeadlineSaveParams = {
	deadlineTs: ?number,
	changeReason?: string,
	// omitted (not just falsy) outside task create-flow, which is the only caller that tracks it
	deadlineManuallySet?: boolean,
};

export type DeadlineSaveResult = {
	status: 'saved' | 'failed' | 'skipped' | 'reasonRequired',
	errors: ?Object[],
};

export class DeadlineRules
{
	canChange(taskId: TaskId): boolean
	{
		const task = this.#getTask(taskId);

		if (!task?.rights.deadline)
		{
			return false;
		}

		return !this.isChangeCountExceeded(taskId);
	}

	isChangeCountExceeded(taskId: TaskId): boolean
	{
		const task = this.#getTask(taskId);

		if (
			!task
			|| idUtils.isTemplate(taskId)
			|| this.canChangeWithoutLimitation(taskId)
			|| !task.maxDeadlineChanges
		)
		{
			return false;
		}

		return task.deadlineChangeCount >= task.maxDeadlineChanges;
	}

	requiresChangeReason(taskId: TaskId): boolean
	{
		const task = this.#getTask(taskId);

		if (!task?.requireDeadlineChangeReason)
		{
			return false;
		}

		return !this.canChangeWithoutLimitation(taskId);
	}

	canChangeWithoutLimitation(taskId: TaskId): boolean
	{
		const task = this.#getTask(taskId);
		const isCreator = Core.getParams().currentUser.id === task?.creatorId;

		return !idUtils.isReal(taskId) || isCreator || task?.rights.edit || Core.getParams().rights.user.admin;
	}

	hasRepeatRule(taskId: TaskId): boolean
	{
		return idUtils.isTemplate(taskId) && Type.isObject(this.#getTask(taskId)?.replicateParams || null);
	}

	getCurrentDeadline(taskId: TaskId): ?number
	{
		const task = this.#getTask(taskId);

		if (!idUtils.isTemplate(taskId))
		{
			return task?.deadlineTs;
		}

		// The DEADLINE_AFTER column cannot hold an empty value — the ORM reads NULL back as 0 —
		// so a repeat rule keeps its own offset, where "no deadline" and "on the creation day"
		// stay distinct.
		if (this.hasRepeatRule(taskId))
		{
			const deadlineOffset = task.replicateParams.deadlineOffset;

			return Type.isNumber(deadlineOffset) ? deadlineOffset * 1000 : null;
		}

		return task?.deadlineAfter;
	}

	async saveDeadline(
		taskId: TaskId,
		{ deadlineTs, changeReason = '', deadlineManuallySet }: DeadlineSaveParams,
	): Promise<DeadlineSaveResult>
	{
		if (this.requiresChangeReason(taskId) && changeReason.trim() === '')
		{
			return { status: DeadlineSaveStatus.ReasonRequired, errors: null };
		}

		let status = DeadlineSaveStatus.Skipped;
		let errors = null;

		if (this.#hasDeadlineToSave(taskId, deadlineTs))
		{
			errors = await this.#setDeadline(taskId, deadlineTs, changeReason, deadlineManuallySet);
			status = this.#resolveSaveStatus(errors);

			if (status === DeadlineSaveStatus.Saved)
			{
				this.#spendDeadlineChange(taskId);
			}
		}

		return { status, errors };
	}

	async clearDeadline(
		taskId: TaskId,
		{ changeReason = '', deadlineManuallySet }: { changeReason?: string, deadlineManuallySet?: boolean } = {},
	): Promise<DeadlineSaveResult>
	{
		if (this.requiresChangeReason(taskId) && changeReason.trim() === '')
		{
			return { status: DeadlineSaveStatus.ReasonRequired, errors: null };
		}

		// Under a repeat rule 0 is the "on the creation day" offset, so an empty deadline
		// is null there; everywhere else it stays the legacy zero.
		const emptyDeadline = this.hasRepeatRule(taskId) ? null : 0;
		const errors = await this.#setDeadline(taskId, emptyDeadline, changeReason, deadlineManuallySet);

		return { status: this.#resolveSaveStatus(errors), errors };
	}

	// A template offset of 0 ("on the creation day") is a real value, not an empty deadline, so a
	// falsy check would drop it: for a template any actual change goes through, including a switch
	// back to "no deadline". A task keeps the legacy rule, where an empty value is saved only by
	// clearDeadline() — and an unchanged deadline is never saved, so it spends no deadline change.
	#hasDeadlineToSave(taskId: TaskId, deadlineTs: ?number): boolean
	{
		if (deadlineTs === this.getCurrentDeadline(taskId))
		{
			return false;
		}

		return idUtils.isTemplate(taskId) || Boolean(deadlineTs);
	}

	#resolveSaveStatus(errors: ?Object[]): 'saved' | 'failed'
	{
		return errors?.length ? DeadlineSaveStatus.Failed : DeadlineSaveStatus.Saved;
	}

	#spendDeadlineChange(taskId: TaskId): void
	{
		const task = this.#getTask(taskId);

		if (!idUtils.isTemplate(taskId) && !this.canChangeWithoutLimitation(taskId) && task?.maxDeadlineChanges)
		{
			void deadlineService.updateDeadlineChangeCount(task.id);
		}
	}

	async #setDeadline(
		taskId: TaskId,
		deadlineTs: ?number,
		changeReason: string,
		deadlineManuallySet: ?boolean,
	): Promise<?Object[]>
	{
		if (idUtils.isTemplate(taskId))
		{
			const fields = { deadlineAfter: deadlineTs };

			// The offset lives in the repeat rule, so it has to travel with the update —
			// otherwise the rule keeps the previous value and the field reverts on reread.
			if (this.hasRepeatRule(taskId))
			{
				fields.replicateParams = {
					...this.#getTask(taskId).replicateParams,
					deadlineOffset: Type.isNumber(deadlineTs) ? deadlineTs / 1000 : null,
				};
			}

			await taskService.update(taskId, fields);

			return null;
		}

		taskService.setSilentErrorMode(true);

		const fields = { deadlineTs, deadlineChangeReason: changeReason };
		if (deadlineManuallySet !== undefined)
		{
			fields.deadlineManuallySet = deadlineManuallySet;
		}

		const result = await taskService.update(taskId, fields);

		taskService.setSilentErrorMode(false);

		return result[Endpoint.TaskDeadlineUpdate] ?? null;
	}

	#getTask(taskId: TaskId): ?TaskModel
	{
		return taskService.getStoreTask(taskId);
	}
}

export const deadlineRules = new DeadlineRules();
