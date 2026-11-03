import { Type } from 'main.core';

import { TaskOutcomeStatus, type TaskOutcome } from '../const/outcome';
import { askSimilar } from '../informer/similar-informer';
import { SimilarList } from '../informer/similar-list';
import { Notifier } from '../notifier/notifier';
import { NextTaskChannel } from '../queue/next-task-channel';
import { TaskQueue } from '../queue/queue';
import { type RuleResult } from '../rule/batch-rule';
import { type TaskOpener } from '../rule/one-by-one-rule';
import { RulesChain } from '../rule/rules-chain';
import { type SimilarInformer } from '../rule/similar-rule';
import { TaskCollectionService } from '../service/task-collection-service';

export type PerformerTaskButton = {
	NAME: string,
	VALUE: string,
	TEXT: string,
	TARGET_USER_STATUS: number,
};

export type PerformerTaskControls = {
	buttons: ?Array<PerformerTaskButton>,
};

/**
 * DTO-02 - a task as the process list row describes it. `name` comes decoded and `description` comes
 * raw (`~DESCRIPTION`): whoever puts them into the DOM encodes them.
 *
 * `workflowId` comes from the row itself, not from the server description of the task: a row of the
 * list is a process. It is the address the next task of the pass is named by (EVENT-01).
 */
export type PerformerTask = {
	id: number,
	name: string,
	description: string,
	isInline: boolean,
	activity: ?string,
	hash: string,
	workflowId: ?string,
	controls: ?PerformerTaskControls,
	overdueDate: ?string,
	url: string,
	userId: number,
	isRunning: boolean,
};

/** How the whole operation ended for the person who started it. */
export const PerformerOutcome = Object.freeze({
	Completed: 'completed',
	EarlyExit: 'earlyExit',
});

export type PerformerOutcomeValue = 'completed' | 'earlyExit';

export type PerformerResult = {
	outcome: PerformerOutcomeValue,
	results: Array<TaskOutcome>,
	doneCount: number,
	skippedTaskIds: Array<number>,
};

export type PerformerOptions = {
	tasks: Array<PerformerTask>,
	onFinish?: (result: PerformerResult) => void,
	decision?: ?Object,
	openTask?: ?TaskOpener,
	informer?: ?SimilarInformer,
};

/**
 * The surfaces a group of similar tasks is asked about when the caller names none of its own. The
 * option stays the point of substitution - tests and outside code put their own surfaces in - but the
 * mechanics is complete without it: the list of processes starts a pass, not a set of surfaces.
 */
const defaultInformer: SimilarInformer = {
	askSimilar,
	askList: (group) => SimilarList.ask(group),
};

/**
 * The mechanics of performing a selection of tasks: it assembles the counters of the pass, the
 * transport and the chain of rules, walks the selection by them and reports how the operation ended.
 *
 * Everything about the surfaces stays outside: the list of processes hands over the tasks it selected
 * and receives the result. The mechanics touches neither the grid nor its state.
 */
export class TasksPerformer
{
	#tasks: Array<PerformerTask>;
	#onFinish: ?Function;
	#decision: ?Object;
	#openTask: ?TaskOpener;
	#informer: ?SimilarInformer;

	/**
	 * @param options.decision The task request the pass starts with - what a homogeneous selection is
	 *   performed by and what a group of similar tasks repeats.
	 * @param options.openTask The surface that takes the person through one task (P3).
	 * @param options.informer Replaces the surfaces that ask about a group of similar tasks (P2).
	 */
	constructor(options: PerformerOptions)
	{
		this.#tasks = Type.isArray(options?.tasks) ? [...options.tasks] : [];
		this.#onFinish = Type.isFunction(options?.onFinish) ? options.onFinish : null;
		this.#decision = Type.isPlainObject(options?.decision) ? options.decision : null;
		this.#openTask = Type.isFunction(options?.openTask) ? options.openTask : null;
		this.#informer = Type.isPlainObject(options?.informer) ? options.informer : defaultInformer;
	}

	async start(): Promise<PerformerResult>
	{
		const notifier = new Notifier({ total: this.#tasks.length });
		const queue = new TaskQueue(this.#tasks);
		const rulesChain = new RulesChain({
			service: new TaskCollectionService(),
			notifier,
			decision: this.#decision,
			openTask: this.#openTask,
			informer: this.#informer,
		});

		// EVENT-01: the form of a task asks the queue of the pass itself what comes next, so the rules
		// and the answer read one and the same queue. The exchange lives as long as the pass does - a
		// listener outliving it would answer for a queue that is gone - and it covers the tasks of this
		// very queue: a form opened beside the pass gets no answer and stays on its own.
		const channel = new NextTaskChannel({
			nextTask: (finishedTaskId) => queue.peekAfter(finishedTaskId),
			isOwnTask: (finishedTaskId) => queue.isHandedOut(finishedTaskId),
		});

		channel.subscribe();

		try
		{
			return this.#finish(await rulesChain.run(queue));
		}
		finally
		{
			channel.unsubscribe();
		}
	}

	#finish(ruleResult: RuleResult): PerformerResult
	{
		const result = toPerformerResult(ruleResult);

		if (this.#onFinish)
		{
			this.#onFinish(result);
		}

		return result;
	}
}

/**
 * The result of the rules as the person who started the pass sees it. `doneCount` is counted over the
 * records the server answered with - a performed task is never a guess of the interface.
 */
function toPerformerResult(ruleResult: RuleResult): PerformerResult
{
	const { isInterrupted, results, skippedTaskIds } = ruleResult;

	return {
		outcome: isInterrupted ? PerformerOutcome.EarlyExit : PerformerOutcome.Completed,
		results,
		doneCount: results.filter((record) => record.status === TaskOutcomeStatus.Done).length,
		skippedTaskIds,
	};
}
