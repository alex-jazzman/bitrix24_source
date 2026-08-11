export type Record = {
	id: number,
	userId: number,
	startTime: ?number,
	endTime: ?number,
	duration: ?number,
	breakLength: ?number,
	state: ?Object,
	isApproved: boolean,
	shift: ?Object,
	schedule: ?Object,
};
