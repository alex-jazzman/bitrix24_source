import { Type } from 'main.core';

import { type Notifier } from '../notifier/notifier';
import { type TaskQueue } from '../queue/queue';
import { type TaskCollectionService } from '../service/task-collection-service';
import { BatchRule, type RuleResult } from './batch-rule';
import { OneByOneRule, type TaskOpener } from './one-by-one-rule';
import { SequentialRule } from './sequential-rule';
import { SimilarRule, type SimilarInformer } from './similar-rule';

export type RulesChainOptions = {
	service: TaskCollectionService,
	notifier: Notifier,
	decision?: ?Object,
	openTask?: ?TaskOpener,
	informer?: ?SimilarInformer,
};

/**
 * Chooses the rule the selection calls for and runs the pass by it: a selection where every task
 * goes without a form and carries one and the same hash is performed by a single decision, anything
 * else is walked task by task.
 *
 * The chain neither touches the list of processes nor knows what a surface looks like. Everything it
 * cannot do on its own it receives: the transport, the counters of the pass, the decision the pass
 * started with, the opener of a task (P3) and the surfaces that ask about a group (P2).
 */
export class RulesChain
{
	#notifier: Notifier;
	#batchRule: BatchRule;
	#sequentialRule: SequentialRule;
	#decision: ?Object;

	constructor(options: RulesChainOptions)
	{
		this.#notifier = options.notifier;
		this.#decision = Type.isPlainObject(options?.decision) ? options.decision : null;
		this.#batchRule = new BatchRule({
			service: options.service,
			notifier: options.notifier,
		});
		const oneByOneRule = new OneByOneRule({
			notifier: options.notifier,
			openTask: options?.openTask,
		});
		const similarRule = new SimilarRule({
			notifier: options.notifier,
			batchRule: this.#batchRule,
			oneByOneRule,
			informer: options?.informer,
		});

		this.#sequentialRule = new SequentialRule({
			notifier: options.notifier,
			similarRule,
			openTask: options?.openTask,
		});
	}

	/**
	 * @param queue The selection, in the order of the rows of the list. The order is kept as the
	 *   snapshot of the pass: the list may be refreshed while the pass goes on, and a task that is
	 *   gone by then is settled by the server, which answers `not_found` for it.
	 */
	async run(queue: TaskQueue): Promise<RuleResult>
	{
		const snapshot = queue.items;

		// A selection performed by a single operation is the whole pass, so the operation says nothing
		// of its own: the summary below reports the same number, and one of the two is a repetition.
		const result = BatchRule.isApplicable(snapshot)
			? await this.#batchRule.run(snapshot, this.#decision, false)
			: await this.#sequentialRule.run(queue)
		;

		this.#notifier.notifySummary(result.isInterrupted);

		return result;
	}
}
