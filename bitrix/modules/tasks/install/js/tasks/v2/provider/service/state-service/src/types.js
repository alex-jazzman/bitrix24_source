import type { DeadlineUserOption } from 'tasks.v2.model.interface';

export type State = {
	userId?: number,
	needsControl: boolean,
	matchesWorkTime: boolean,
	defaultRequireResult: boolean,
	defaultDeadline: DeadlineUserOption,
};
