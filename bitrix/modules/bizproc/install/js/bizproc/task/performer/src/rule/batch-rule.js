import { Type } from 'main.core';

import { type TaskOutcome } from '../const/outcome';
import { type Notifier } from '../notifier/notifier';
import { type TaskCollectionService } from '../service/task-collection-service';

/**
 * The part of a task description (DTO-02) the rules read: which task it is, whether it is performed
 * without a form, and the hash that tells apart the tasks one decision may be repeated for. The rest
 * of a description travels through the rules untouched.
 */
export type RuleTask = {
	id: number,
	hash: ?string,
	isInline: boolean,
};

/**
 * What a rule leaves behind: the outcome records the server answered with (DTO-01), the tasks that
 * left the pass undecided, and whether the person walked out of the pass before its end.
 */
export type RuleResult = {
	isInterrupted: boolean,
	results: Array<TaskOutcome>,
	skippedTaskIds: Array<number>,
};

export function emptyRuleResult(): RuleResult
{
	return {
		isInterrupted: false,
		results: [],
		skippedTaskIds: [],
	};
}

/** Glues what a nested rule did onto what the calling rule has collected so far. */
export function mergeRuleResult(collected: RuleResult, added: RuleResult): RuleResult
{
	return {
		isInterrupted: collected.isInterrupted || added.isInterrupted,
		results: [...collected.results, ...added.results],
		skippedTaskIds: [...collected.skippedTaskIds, ...added.skippedTaskIds],
	};
}

/** Identifiers of the tasks as the group action expects them. A task without one is not a task. */
export function toTaskIds(tasks: ?Array<RuleTask>): Array<number>
{
	if (!Type.isArrayFilled(tasks))
	{
		return [];
	}

	return tasks
		.map((task) => Number.parseInt(task?.id, 10))
		.filter((taskId) => Number.isInteger(taskId) && taskId > 0)
	;
}

/**
 * Whether a decision may be repeated for a set of tasks. A task performed without one - and a decision
 * that stayed in the form it was made in, as one carrying files does - leaves nothing for a set to
 * repeat, and a set is never performed blindly.
 */
export function isRepeatableDecision(decision: ?Object): boolean
{
	return Type.isPlainObject(decision) && Object.keys(decision).length > 0;
}

export type BatchRuleOptions = {
	service: TaskCollectionService,
	notifier: Notifier,
};

/**
 * One decision applied to a set of tasks: the whole set travels in a single group call (API-01) and
 * the counters follow the answer of the server. The rule decides nothing on its own - the decision
 * comes from whoever made it: the panel item that started the pass, or the task the person has just
 * gone through.
 */
export class BatchRule
{
	#service: TaskCollectionService;
	#notifier: Notifier;

	constructor(options: BatchRuleOptions)
	{
		this.#service = options.service;
		this.#notifier = options.notifier;
	}

	/**
	 * A set is performed in one call when every task of it goes without a form and they all carry one
	 * and the same hash. Nothing else needs comparing: the name of the activity is already part of
	 * the hash.
	 *
	 * A task without a hash never joins a set. The server computes the hash only for tasks that still
	 * await a decision, so a missing one says nothing about similarity.
	 */
	static isApplicable(tasks: ?Array<RuleTask>): boolean
	{
		if (!Type.isArrayFilled(tasks))
		{
			return false;
		}

		const hash = tasks[0]?.hash;

		return Type.isStringFilled(hash) && tasks.every((task) => task?.isInline === true && task.hash === hash);
	}

	/**
	 * @param tasks The set the decision applies to.
	 * @param decision The task request to repeat: the button of the decision (`{ [NAME]: VALUE }`)
	 *   together with the field values sent with it. Sending a set of identifiers grants no rights of
	 *   its own - grouping is a hint of the interface, and the server checks every task on its own.
	 * @param isAnnounced Whether this operation reports its own outcome. An operation that is the
	 *   whole pass leaves the reporting to the summary of the pass - see {@see Notifier.notifyDone}.
	 */
	async run(tasks: Array<RuleTask>, decision: ?Object, isAnnounced: boolean = true): Promise<RuleResult>
	{
		const taskIds = toTaskIds(tasks);
		if (taskIds.length === 0)
		{
			return emptyRuleResult();
		}

		if (!isRepeatableDecision(decision))
		{
			this.#notifier.notifySkipped(taskIds.length);

			return {
				isInterrupted: false,
				results: [],
				skippedTaskIds: taskIds,
			};
		}

		const { results } = await this.#service.doCollection(taskIds, decision);

		this.#notifier.notifyDone(results, isAnnounced);
		// a refusal is announced whatever the operation is: an operation that performed nothing has
		// no number for the summary to report, so silence here is silence altogether
		this.#notifier.notifyFailed(results);
		this.#notifier.notifyRemaining();

		return {
			isInterrupted: false,
			results,
			skippedTaskIds: [],
		};
	}
}
