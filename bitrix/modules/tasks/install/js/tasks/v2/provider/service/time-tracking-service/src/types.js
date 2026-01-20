import type { ElapsedTimeSource } from 'tasks.v2.model.elapsed-times';

export type ElapsedTimeDto = {
	id: ?number,
	taskId: ?number,
	userId: ?number,
	seconds: ?number,
	source: ?ElapsedTimeSource,
	text: ?string,
	createdAtTs: ?number,
	startTs: ?number,
	stopTs: ?number,
	rights: {
		edit: boolean,
		remove: number,
	},
};
