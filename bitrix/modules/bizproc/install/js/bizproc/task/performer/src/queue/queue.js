import { Text, Type } from 'main.core';

/**
 * What the queue reads of a task (DTO-02). Everything else in a task description travels through
 * the queue untouched.
 *
 * `workflowId` is the process the task belongs to - the address the next task of the pass is named
 * by (EVENT-01). The server description of a task carries no process: a row of the list of processes
 * is a process, so the list itself puts it into the item when it builds the queue out of a selection.
 */
export type QueueTask = {
	id: number,
	hash: ?string,
	workflowId: ?string,
};

/**
 * A snapshot of the selection. The order repeats the order of the list rows, tasks leave one by one,
 * and a group of similar ones is taken out as a whole to be handled right after the task that opened
 * it. The snapshot is never refreshed: the queue knows nothing about the grid, and a snapshot that
 * has drifted from reality is settled by the server, which answers `not_found` for a task that is gone.
 */
export class TaskQueue
{
	#items: Array<QueueTask>;

	// The task the queue last handed out - the one the pass stands on. The queue is asked what comes
	// after it (EVENT-01), and it answers by the same condition the group of similar tasks is taken out
	// by, so the rule and the answer never say different things.
	#handedOut: ?QueueTask = null;

	constructor(tasks: Array<QueueTask>)
	{
		this.#items = Type.isArrayFilled(tasks) ? tasks.filter((task) => Type.isPlainObject(task)) : [];
	}

	get size(): number
	{
		return this.#items.length;
	}

	get isEmpty(): boolean
	{
		return this.#items.length === 0;
	}

	/** The tasks still queued, in queue order. A copy: walking them must not move the queue itself. */
	get items(): Array<QueueTask>
	{
		return [...this.#items];
	}

	/** The next task of the pass, or null once the queue is empty. */
	shift(): ?QueueTask
	{
		this.#handedOut = this.#items.shift() ?? null;

		return this.#handedOut;
	}

	/**
	 * Whether the task is the one the queue last handed out - the task the pass stands on. Only about
	 * such a task does the queue have anything to say at all: `peekAfter` answers nothing both for it
	 * and for a task of no pass of ours, and whoever asks has to tell the two apart ({@see peekAfter}).
	 */
	isHandedOut(taskId: number): boolean
	{
		const handedOut = this.#handedOut;

		return handedOut !== null && Text.toInteger(handedOut.id) === Text.toInteger(taskId);
	}

	/**
	 * What the queue offers after the task it last handed out (EVENT-01). The head of the queue is only
	 * looked at - the task leaves the queue when the rule that walks it takes it, and taking it here
	 * would spend the task twice.
	 *
	 * Nothing is offered while the queue still holds a task like the one handed out: the decision about
	 * to be made on it may be repeated for the tasks like it ({@see extractByHash}), and until that
	 * question is answered which task comes next is unknown. The form would draw a task the group is
	 * about to perform, and the person would be shown a form that means nothing - closing it does
	 * nothing, deciding in it sends a decision for a task already decided.
	 *
	 * A task the queue did not hand out is answered about with nothing either - it is no task of this
	 * pass, or a task of a group being walked one by one, which the pass opens itself, the way it opens
	 * its first task. That case is not the end of the queue and is told apart by `isHandedOut`.
	 */
	peekAfter(finishedTaskId: number): ?QueueTask
	{
		const handedOut = this.#handedOut;
		if (handedOut === null || !this.isHandedOut(finishedTaskId))
		{
			return null;
		}

		if (Type.isStringFilled(handedOut.hash) && this.#items.some((task) => task.hash === handedOut.hash))
		{
			return null;
		}

		return this.#items[0] ?? null;
	}

	/**
	 * Takes every queued task with the same hash out of the queue, keeping their order.
	 *
	 * An empty hash groups nothing: the server computes the hash only for tasks that still await a
	 * decision, so a finished one arrives without it and goes through the pass on its own.
	 */
	extractByHash(hash: ?string): Array<QueueTask>
	{
		if (!Type.isStringFilled(hash))
		{
			return [];
		}

		const extracted = [];
		const rest = [];

		for (const task of this.#items)
		{
			if (task.hash === hash)
			{
				extracted.push(task);
			}
			else
			{
				rest.push(task);
			}
		}

		this.#items = rest;

		return extracted;
	}
}
