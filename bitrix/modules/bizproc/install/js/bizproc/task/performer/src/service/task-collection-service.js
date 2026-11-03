import { ajax, Loc, Type } from 'main.core';

import {
	TaskOutcomeStatus,
	type TaskOutcome,
	type TaskOutcomeError,
	type TaskOutcomeStatusValue,
} from '../const/outcome';

export const TASK_COLLECTION_ACTION = 'bizproc.task.doCollection';

/**
 * How many tasks travel in one request (API-01). Kept well under the limit the server checks on its
 * own: a request that never comes back leaves the tasks it already performed done on the server while
 * every task of the portion is marked as failed here, so the smaller the portion, the less of the pass
 * a single unanswered request misreports.
 */
export const TASK_COLLECTION_PORTION_SIZE = 10;

const REQUEST_ERROR_MESSAGE_CODE = 'BIZPROC_JS_TASK_PERFORMER_REQUEST_ERROR';

export type TaskCollectionResult = {
	results: Array<TaskOutcome>,
};

/**
 * Sends one decision for a set of tasks (API-01). The service knows nothing about the queue, the
 * rules or the messages: it takes task ids, returns the outcome records the server answered with.
 */
export class TaskCollectionService
{
	#runAction: Function;

	/**
	 * @param runAction Replaces the transport in tests. Left out, the request goes through the
	 *   standard client layer, which adds the session token.
	 */
	constructor(runAction: ?Function = null)
	{
		this.#runAction = Type.isFunction(runAction) ? runAction : defaultRunAction;
	}

	/**
	 * Applies `taskRequest` to every task of the set. The set travels in portions of
	 * TASK_COLLECTION_PORTION_SIZE, one request after another, and the outcome records are glued
	 * back together in the order the tasks were passed in.
	 *
	 * How many tasks were performed is not carried alongside: the records themselves say it, and one
	 * number told twice is a number that can disagree with itself.
	 */
	async doCollection(taskIds: Array<number>, taskRequest: Object): Promise<TaskCollectionResult>
	{
		const results = [];

		for (const portion of splitIntoPortions(normalizeTaskIds(taskIds)))
		{
			// eslint-disable-next-line no-await-in-loop
			const portionResult = await this.#runPortion(portion, taskRequest);

			results.push(...portionResult.results);
		}

		return { results };
	}

	async #runPortion(taskIds: Array<number>, taskRequest: Object): Promise<TaskCollectionResult>
	{
		try
		{
			const response = await this.#runAction(TASK_COLLECTION_ACTION, {
				data: {
					taskIds,
					taskRequest,
				},
			});

			return toCollectionResult(response?.data ?? null);
		}
		catch (response)
		{
			return toFailedResult(taskIds, extractErrors(response));
		}
	}
}

function defaultRunAction(action: string, config: Object): Promise<Object>
{
	return ajax.runAction(action, config);
}

function normalizeTaskIds(taskIds: ?Array<number>): Array<number>
{
	if (!Type.isArrayFilled(taskIds))
	{
		return [];
	}

	return taskIds.map((taskId) => toTaskId(taskId)).filter((taskId) => taskId > 0);
}

function splitIntoPortions(taskIds: Array<number>): Array<Array<number>>
{
	const portions = [];

	for (let index = 0; index < taskIds.length; index += TASK_COLLECTION_PORTION_SIZE)
	{
		portions.push(taskIds.slice(index, index + TASK_COLLECTION_PORTION_SIZE));
	}

	return portions;
}

function toCollectionResult(data: ?Object): TaskCollectionResult
{
	return {
		results: Type.isArrayFilled(data?.results)
			? data.results.map((record) => toTaskOutcome(record))
			: []
		,
	};
}

/**
 * A portion whose request never came back. There is no server answer for its tasks, so each of them
 * gets an error record: an unanswered portion must not look either done or untouched.
 */
function toFailedResult(taskIds: Array<number>, errors: Array<TaskOutcomeError>): TaskCollectionResult
{
	return {
		results: taskIds.map((taskId) => ({
			taskId,
			status: TaskOutcomeStatus.Error,
			errors,
		})),
	};
}

function toTaskOutcome(record: ?Object): TaskOutcome
{
	return {
		taskId: toTaskId(record?.taskId),
		status: toOutcomeStatus(record?.status),
		errors: Type.isArrayFilled(record?.errors)
			? record.errors.map((error) => toOutcomeError(error))
			: [],
	};
}

function toTaskId(value: mixed): number
{
	const taskId = Number.parseInt(value, 10);

	return Number.isInteger(taskId) && taskId > 0 ? taskId : 0;
}

/** An unknown status counts as a failure: an unclassified outcome must not pass for a done one. */
function toOutcomeStatus(value: mixed): TaskOutcomeStatusValue
{
	return Object.values(TaskOutcomeStatus).includes(value) ? value : TaskOutcomeStatus.Error;
}

function extractErrors(response: ?Object): Array<TaskOutcomeError>
{
	if (!Type.isArrayFilled(response?.errors))
	{
		return [toOutcomeError(null)];
	}

	return response.errors.map((error) => toOutcomeError(error));
}

function toOutcomeError(error: ?Object): TaskOutcomeError
{
	return {
		message: Type.isStringFilled(error?.message)
			? error.message
			: Loc.getMessage(REQUEST_ERROR_MESSAGE_CODE),
		code: Type.isStringFilled(error?.code) ? error.code : null,
		fieldId: Type.isStringFilled(error?.fieldId) ? error.fieldId : null,
	};
}
