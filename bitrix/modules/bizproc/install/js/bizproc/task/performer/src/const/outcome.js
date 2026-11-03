/**
 * DTO-01 vocabulary - the outcome of a group action for a single task. Lives apart from the public
 * surface so the queue, the service and the notifier share it without importing the entry point.
 */
export const TaskOutcomeStatus = Object.freeze({
	Done: 'done',
	NotFound: 'not_found',
	AccessDenied: 'access_denied',
	Error: 'error',
});

export type TaskOutcomeStatusValue = 'done' | 'not_found' | 'access_denied' | 'error';

export type TaskOutcomeError = {
	message: string,
	code: ?string,
	fieldId: ?string,
};

/** One record per task passed to the group action. */
export type TaskOutcome = {
	taskId: number,
	status: TaskOutcomeStatusValue,
	errors: Array<TaskOutcomeError>,
};
