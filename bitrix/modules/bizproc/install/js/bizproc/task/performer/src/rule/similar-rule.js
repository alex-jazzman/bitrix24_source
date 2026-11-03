import { Type } from 'main.core';

import { type Notifier } from '../notifier/notifier';
import {
	emptyRuleResult,
	mergeRuleResult,
	toTaskIds,
	type BatchRule,
	type RuleResult,
	type RuleTask,
} from './batch-rule';
import { type OneByOneRule } from './one-by-one-rule';

/** What the person answers about a group of tasks similar to the one just performed. */
export const SimilarChoice = Object.freeze({
	ApplyToAll: 'applyToAll',
	OneByOne: 'oneByOne',
	ShowList: 'showList',
	Cancel: 'cancel',
});

export type SimilarChoiceValue = 'applyToAll' | 'oneByOne' | 'showList' | 'cancel';

/** How the person split the group in the list surface: what the decision repeats for, and the rest. */
export type SimilarGroupSplit = {
	selected: Array<RuleTask>,
	rest: Array<RuleTask>,
};

/**
 * The surfaces that ask the person about a group of similar tasks (P2). Both are given the tasks of
 * the group and answer with the tasks of that same group - a surface adds nothing to the pass.
 */
export type SimilarInformer = {
	askSimilar: (group: Array<RuleTask>) => Promise<SimilarChoiceValue>,
	askList: (group: Array<RuleTask>) => Promise<SimilarGroupSplit>,
};

export type SimilarRuleOptions = {
	notifier: Notifier,
	batchRule: BatchRule,
	oneByOneRule: OneByOneRule,
	informer: ?SimilarInformer,
};

/**
 * The group of tasks a decision may be repeated for. The rule asks the person what to do with the
 * group and branches: one decision for the whole group, the group task by task, or a group split in
 * two by hand.
 */
export class SimilarRule
{
	#notifier: Notifier;
	#batchRule: BatchRule;
	#oneByOneRule: OneByOneRule;
	#informer: ?SimilarInformer;

	constructor(options: SimilarRuleOptions)
	{
		this.#notifier = options.notifier;
		this.#batchRule = options.batchRule;
		this.#oneByOneRule = options.oneByOneRule;
		this.#informer = Type.isPlainObject(options?.informer) ? options.informer : null;
	}

	/**
	 * @param group The tasks taken out of the queue as similar to the performed one.
	 * @param decision The task request of the performed task - what the group would repeat.
	 */
	async run(group: Array<RuleTask>, decision: ?Object): Promise<RuleResult>
	{
		if (!Type.isArrayFilled(group))
		{
			return emptyRuleResult();
		}

		if (!this.#informer)
		{
			return this.#skipGroup(group);
		}

		const choice = await this.#informer.askSimilar([...group]);

		if (choice === SimilarChoice.ApplyToAll)
		{
			return this.#batchRule.run(group, decision);
		}

		if (choice === SimilarChoice.OneByOne)
		{
			return this.#oneByOneRule.run(group);
		}

		if (choice === SimilarChoice.ShowList)
		{
			return this.#runByList(group, decision);
		}

		// The person walked out of the pass. An answer that names no known choice ends up here as
		// well: a decision is never repeated for a group on a guess.
		return {
			isInterrupted: true,
			results: [],
			skippedTaskIds: [],
		};
	}

	async #runByList(group: Array<RuleTask>, decision: ?Object): Promise<RuleResult>
	{
		const { selected, rest } = splitGroup(group, await this.#informer.askList([...group]));

		const result = await this.#batchRule.run(selected, decision);
		if (result.isInterrupted)
		{
			return result;
		}

		return mergeRuleResult(result, await this.#oneByOneRule.run(rest));
	}

	/**
	 * There is nobody to ask until the surfaces of P2 appear. Repeating a decision for a group is the
	 * choice of the person, so without that choice the group leaves the pass undecided - it is never
	 * performed on the strength of a matching hash alone.
	 */
	#skipGroup(group: Array<RuleTask>): RuleResult
	{
		const skippedTaskIds = toTaskIds(group);

		this.#notifier.notifySkipped(skippedTaskIds.length);

		return {
			isInterrupted: false,
			results: [],
			skippedTaskIds,
		};
	}
}

/**
 * Keeps the split honest: the decision repeats only for the tasks of the group the surface was given,
 * and whatever stayed out of the selection goes on task by task. No task of the group is lost on the
 * way, whatever the surface answered.
 */
function splitGroup(group: Array<RuleTask>, split: ?SimilarGroupSplit): SimilarGroupSplit
{
	const selectedTasks = new Set(Type.isArrayFilled(split?.selected) ? split.selected : []);

	return {
		selected: group.filter((task) => selectedTasks.has(task)),
		rest: group.filter((task) => !selectedTasks.has(task)),
	};
}
