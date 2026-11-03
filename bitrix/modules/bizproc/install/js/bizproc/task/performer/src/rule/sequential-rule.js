import { Type } from 'main.core';

import { type Notifier } from '../notifier/notifier';
import { type TaskQueue } from '../queue/queue';
import {
	emptyRuleResult,
	isRepeatableDecision,
	mergeRuleResult,
	toTaskIds,
	type RuleResult,
} from './batch-rule';
import {
	collectTaskPass,
	requestTaskPass,
	TaskPassStatus,
	type TaskOpener,
} from './one-by-one-rule';
import { type SimilarRule } from './similar-rule';

export type SequentialRuleOptions = {
	notifier: Notifier,
	similarRule: SimilarRule,
	openTask: ?TaskOpener,
};

/**
 * The pass over a mixed selection: tasks leave the queue one by one and the person decides each of
 * them in its own form. A performed task takes the tasks similar to it out of the queue right away,
 * so the group is handled while the decision just made is still at hand.
 */
export class SequentialRule
{
	#notifier: Notifier;
	#similarRule: SimilarRule;
	#openTask: ?TaskOpener;

	constructor(options: SequentialRuleOptions)
	{
		this.#notifier = options.notifier;
		this.#similarRule = options.similarRule;
		this.#openTask = Type.isFunction(options?.openTask) ? options.openTask : null;
	}

	async run(queue: TaskQueue): Promise<RuleResult>
	{
		if (!this.#openTask)
		{
			return this.#skipQueue(queue);
		}

		let result = emptyRuleResult();

		while (!queue.isEmpty)
		{
			const task = queue.shift();

			// eslint-disable-next-line no-await-in-loop
			const pass = await requestTaskPass(task, this.#openTask);

			result = mergeRuleResult(result, collectTaskPass(task, pass, this.#notifier));

			if (result.isInterrupted)
			{
				return result;
			}

			// The pass over a mixed selection is the longest one there is, and every task of it is a step
			// the person takes by hand: how much of the pass is still ahead is said after each of them.
			this.#notifier.notifyRemaining();

			// A task groups nothing unless the decision made on it may be repeated for the tasks like it:
			// an undecided task has no decision at all, and a decision that stayed in its form cannot be
			// sent again. Such a group is left in the queue and opened task by task - offering to apply
			// what cannot be applied would answer "skipped" the moment the offer is accepted.
			if (pass.status !== TaskPassStatus.Done || !isRepeatableDecision(pass.decision))
			{
				continue;
			}

			const group = queue.extractByHash(task.hash);
			if (group.length === 0)
			{
				continue;
			}

			// eslint-disable-next-line no-await-in-loop
			result = mergeRuleResult(result, await this.#similarRule.run(group, pass.decision));

			if (result.isInterrupted)
			{
				return result;
			}
		}

		return result;
	}

	/**
	 * A mixed selection needs a form for every task, and until the opener of P3 appears there is no
	 * surface to show one. The pass ends right away with every task of the queue left undecided: an
	 * empty pass has to be visible in the result, not silent.
	 */
	#skipQueue(queue: TaskQueue): RuleResult
	{
		const skippedTaskIds = toTaskIds(queue.items);

		while (!queue.isEmpty)
		{
			queue.shift();
		}

		this.#notifier.notifySkipped(skippedTaskIds.length);

		return {
			isInterrupted: false,
			results: [],
			skippedTaskIds,
		};
	}
}
