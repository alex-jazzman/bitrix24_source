import { Type } from 'main.core';

import { type TaskOutcome } from '../const/outcome';
import { type Notifier } from '../notifier/notifier';
import {
	emptyRuleResult,
	mergeRuleResult,
	toTaskIds,
	type RuleResult,
	type RuleTask,
} from './batch-rule';

/** How one task ends for the person who was taken through it. */
export const TaskPassStatus = Object.freeze({
	Done: 'done',
	Skipped: 'skipped',
	Exit: 'exit',
});

export type TaskPassStatusValue = 'done' | 'skipped' | 'exit';

/**
 * The answer of the surface that opens a task and brings back the decision of the person
 * (EVENT-01 / EVENT-02, P3).
 *
 * `decision` is the task request that has already gone to the server - this is what a group of
 * similar tasks repeats. `outcome` is the server record for this very task (DTO-01): a performed
 * task is counted by the answer of the server, never by the fact that a form was submitted.
 */
export type TaskPass = {
	status: TaskPassStatusValue,
	decision: ?Object,
	outcome: ?TaskOutcome,
};

export type TaskOpener = (task: RuleTask) => Promise<TaskPass>;

/**
 * Reads the answer of the opener. An answer that names no known ending leaves the task undecided:
 * an unrecognized one must not pass for a performed one.
 */
export async function requestTaskPass(task: RuleTask, openTask: TaskOpener): Promise<TaskPass>
{
	const pass = await openTask(task);

	return {
		status: Object.values(TaskPassStatus).includes(pass?.status) ? pass.status : TaskPassStatus.Skipped,
		decision: Type.isPlainObject(pass?.decision) ? pass.decision : null,
		outcome: Type.isPlainObject(pass?.outcome) ? pass.outcome : null,
	};
}

/**
 * Registers how one task went. A task the person left undecided - and a task that came back
 * performed but without a server record - leaves its trace in the pass as skipped: no task
 * disappears from the result without a word.
 */
export function collectTaskPass(task: RuleTask, pass: TaskPass, notifier: Notifier): RuleResult
{
	if (pass.status === TaskPassStatus.Exit)
	{
		return {
			isInterrupted: true,
			results: [],
			skippedTaskIds: [],
		};
	}

	if (pass.status === TaskPassStatus.Done && pass.outcome)
	{
		const results = [pass.outcome];

		notifier.notifyDone(results);

		return {
			isInterrupted: false,
			results,
			skippedTaskIds: [],
		};
	}

	notifier.notifySkipped();

	return {
		isInterrupted: false,
		results: [],
		skippedTaskIds: toTaskIds([task]),
	};
}

export type OneByOneRuleOptions = {
	notifier: Notifier,
	openTask: ?TaskOpener,
};

/**
 * Takes a group of tasks through the opener, one after another. Leaving the pass on any of them ends
 * the rule at once, and the tasks behind it keep waiting for their decision.
 */
export class OneByOneRule
{
	#notifier: Notifier;
	#openTask: ?TaskOpener;

	constructor(options: OneByOneRuleOptions)
	{
		this.#notifier = options.notifier;
		this.#openTask = Type.isFunction(options?.openTask) ? options.openTask : null;
	}

	async run(tasks: Array<RuleTask>): Promise<RuleResult>
	{
		if (!Type.isArrayFilled(tasks))
		{
			return emptyRuleResult();
		}

		if (!this.#openTask)
		{
			return this.#skipTasks(tasks);
		}

		let result = emptyRuleResult();

		for (const task of tasks)
		{
			// eslint-disable-next-line no-await-in-loop
			const pass = await requestTaskPass(task, this.#openTask);

			result = mergeRuleResult(result, collectTaskPass(task, pass, this.#notifier));

			if (result.isInterrupted)
			{
				break;
			}
		}

		return result;
	}

	/**
	 * There is nothing to open a task with until the opener of P3 appears, so the group leaves the
	 * pass undecided at once instead of one silent step at a time.
	 */
	#skipTasks(tasks: Array<RuleTask>): RuleResult
	{
		const skippedTaskIds = toTaskIds(tasks);

		this.#notifier.notifySkipped(skippedTaskIds.length);

		return {
			isInterrupted: false,
			results: [],
			skippedTaskIds,
		};
	}
}
