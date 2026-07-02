export type CallBatchError = {
	method: string,
	code: string,
	description: string,
};

export type BatchQuery = {
	[method: string]: {[param: string]: any}
};
