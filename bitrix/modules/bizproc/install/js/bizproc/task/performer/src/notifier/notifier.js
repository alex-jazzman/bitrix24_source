import { Loc, Text, Type } from 'main.core';
import { UI } from 'ui.notification';
import { announce } from 'bizproc.a11y';

import { TaskOutcomeStatus, type TaskOutcome } from '../const/outcome';

const MESSAGE_DONE = 'BIZPROC_JS_TASK_PERFORMER_NOTIFIER_DONE';
const MESSAGE_SKIPPED = 'BIZPROC_JS_TASK_PERFORMER_NOTIFIER_SKIPPED';
const MESSAGE_REMAINING = 'BIZPROC_JS_TASK_PERFORMER_NOTIFIER_REMAINING';
const MESSAGE_SUMMARY = 'BIZPROC_JS_TASK_PERFORMER_NOTIFIER_SUMMARY';
const MESSAGE_SUMMARY_NONE = 'BIZPROC_JS_TASK_PERFORMER_NOTIFIER_SUMMARY_NONE';
const MESSAGE_SUMMARY_INTERRUPTED = 'BIZPROC_JS_TASK_PERFORMER_NOTIFIER_SUMMARY_INTERRUPTED';
const MESSAGE_SUMMARY_INTERRUPTED_NONE = 'BIZPROC_JS_TASK_PERFORMER_NOTIFIER_SUMMARY_INTERRUPTED_NONE';
const MESSAGE_REQUEST_ERROR = 'BIZPROC_JS_TASK_PERFORMER_REQUEST_ERROR';

/** The outcomes that stand for a task the server refused to perform. */
const FAILED_STATUSES = new Set([TaskOutcomeStatus.Error, TaskOutcomeStatus.AccessDenied]);

export type NotifierOptions = {
	total: number,
	notify?: (content: string) => void,
	speak?: (content: string) => void,
};

/**
 * Turns outcome records into messages about how the pass goes: done, skipped, left to do, and the
 * result of the whole operation. Keeps the counters of the pass and nothing else - it neither sends
 * requests nor knows what a task looks like.
 */
export class Notifier
{
	#total: number;
	#doneCount: number = 0;
	#processedCount: number = 0;
	#notify: Function;
	#speak: Function;

	/**
	 * @param options.total How many tasks the pass started with.
	 * @param options.notify Replaces the notification center in tests.
	 * @param options.speak Replaces the live region of the accessibility layer in tests.
	 */
	constructor(options: NotifierOptions)
	{
		this.#total = toCount(options?.total);
		this.#notify = Type.isFunction(options?.notify) ? options.notify : defaultNotify;
		this.#speak = Type.isFunction(options?.speak) ? options.speak : announce;
	}

	/** Tasks the server reported as done. Never an optimistic guess. */
	get doneCount(): number
	{
		return this.#doneCount;
	}

	get remainingCount(): number
	{
		return Math.max(this.#total - this.#processedCount, 0);
	}

	/**
	 * Registers the outcome records of one request (DTO-01) and reports the tasks that are done.
	 * Every record ends a task's part in the pass - the server has already answered for it, whether
	 * it went through, was denied or is gone. A task the server no longer finds gets no message of
	 * its own: nobody decided anything about it, it just left the list.
	 *
	 * @param isAnnounced Whether the tasks done by this request are worth a message of their own. An
	 *   operation that is the whole pass is not: the summary of the pass says the very same thing, and
	 *   the person would read one number twice. The counters are kept either way.
	 */
	notifyDone(outcomes: Array<TaskOutcome>, isAnnounced: boolean = true): void
	{
		const records = Type.isArrayFilled(outcomes) ? outcomes : [];
		const doneCount = records.filter((record) => record?.status === TaskOutcomeStatus.Done).length;

		this.#doneCount += doneCount;
		this.#processedCount += records.length;

		if (doneCount > 0 && isAnnounced)
		{
			this.#notifyPlural(MESSAGE_DONE, doneCount);
		}
	}

	/**
	 * The tasks the server refused, in one message. A refusal is not an error of the request - the
	 * request itself succeeded - so without this the whole group stays silent: nothing is performed
	 * and nothing is said, and the person is left to guess whether anything happened at all.
	 *
	 * The reason comes from the server, which names it in full (a required value of the form left
	 * empty, say). One message per request is enough: the tasks of a group are refused for one and
	 * the same reason, and a refusal per task would bury it.
	 *
	 * A task the server no longer finds is not a refusal and stays silent here as well: nobody
	 * decided anything about it.
	 */
	notifyFailed(outcomes: Array<TaskOutcome>): void
	{
		const records = Type.isArrayFilled(outcomes) ? outcomes : [];
		const failed = records.filter((record) => FAILED_STATUSES.has(record?.status));

		if (failed.length === 0)
		{
			return;
		}

		this.#report(firstErrorMessage(failed) ?? Loc.getMessage(MESSAGE_REQUEST_ERROR));
	}

	/**
	 * Tasks the person left undecided - closed the form, walked away from the task. Server outcomes
	 * `not_found` add up here too, through {@see notifyDone}.
	 */
	notifySkipped(count: number = 1): void
	{
		const skippedCount = toCount(count);
		if (skippedCount === 0)
		{
			return;
		}

		this.#processedCount += skippedCount;
		this.#notifyPlural(MESSAGE_SKIPPED, skippedCount);
	}

	/** How much of the pass is still ahead. Silent once nothing is left. */
	notifyRemaining(): void
	{
		const { remainingCount } = this;
		if (remainingCount > 0)
		{
			this.#notifyPlural(MESSAGE_REMAINING, remainingCount);
		}
	}

	/**
	 * The result of the operation. Shown in every ending, including the one where not a single task
	 * went through.
	 *
	 * @param isInterrupted The person left the pass before it reached the end of the queue.
	 */
	notifySummary(isInterrupted: boolean = false): void
	{
		if (this.#doneCount === 0)
		{
			this.#report(Loc.getMessage(isInterrupted ? MESSAGE_SUMMARY_INTERRUPTED_NONE : MESSAGE_SUMMARY_NONE));

			return;
		}

		this.#notifyPlural(isInterrupted ? MESSAGE_SUMMARY_INTERRUPTED : MESSAGE_SUMMARY, this.#doneCount, {
			'#TOTAL#': this.#total,
		});
	}

	#notifyPlural(messageCode: string, count: number, replacements: Object = {}): void
	{
		this.#report(Loc.getMessagePlural(messageCode, count, {
			...replacements,
			'#COUNT#': count,
		}));
	}

	/**
	 * Says the message both ways. The balloon of the notification center carries no live region, so how
	 * the pass goes and how it ended would otherwise reach the screen only - and every one of these
	 * messages is the whole answer of the operation to the person who started it.
	 */
	#report(content: string): void
	{
		this.#notify(content);
		this.#speak(content);
	}
}

/** The reason the server gave, taken from the first record that carries one. */
function firstErrorMessage(outcomes: Array<TaskOutcome>): ?string
{
	for (const outcome of outcomes)
	{
		const message = outcome.errors?.find((error) => Type.isStringFilled(error?.message))?.message;

		if (Type.isStringFilled(message))
		{
			return message;
		}
	}

	return null;
}

function defaultNotify(content: string): void
{
	// the balloon renders a string as HTML, and the reason of a refusal is text the server gave
	UI.Notification.Center.notify({ content: Text.encode(content) });
}

function toCount(value: mixed): number
{
	const count = Number.parseInt(value, 10);

	return Number.isInteger(count) && count > 0 ? count : 0;
}
