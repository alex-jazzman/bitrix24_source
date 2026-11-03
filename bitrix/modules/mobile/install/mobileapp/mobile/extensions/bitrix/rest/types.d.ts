export type RestMethodParams = Record<string, unknown>;

export type RestMethodError = {
	code: string,
	description?: string,
};

/**
 * The answer of `BX.rest.callMethod`. `answer.next` is the offset of the following page, while
 * `next()` requests that page - the executor reads the first and calls the second.
 */
export type RestMethodAnswer = {
	answer: {
		/** A method may answer with a primitive, so the contract cannot narrow this to an object. */
		result: unknown,
		error?: string,
		error_description?: string,
		total?: number,
		next?: number,
	},
	next?: () => Promise<RestMethodAnswer>,
};

export type RestRequestResult = {
	result: unknown,
	loadMore: boolean,
	error?: RestMethodError,
};
