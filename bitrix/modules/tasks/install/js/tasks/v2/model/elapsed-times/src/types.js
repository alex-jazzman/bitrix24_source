export type ElapsedTimeState = {
	collection: { [reminderId: string]: ElapsedTimeModel },
};

export type ElapsedTimeModel = {
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
		remove: number
	},
};

export type ElapsedTimeSource = 'unknown' | 'system' | 'manual';
