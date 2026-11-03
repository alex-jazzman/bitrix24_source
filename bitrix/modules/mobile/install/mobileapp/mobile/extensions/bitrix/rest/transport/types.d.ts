export type TransportNavigation = {
	page?: number,
	size?: number,
};

export type RunActionConfig = {
	/**
	 * A body, not a payload: the transport hands the value to BX.ajax as it is. Uploads put binary
	 * content and a bare string here with `prepareData: false`, so the contract cannot narrow it.
	 */
	data?: unknown,
	json?: object,
	getParameters?: object,
	headers?: object,
	binary?: boolean,
	prepareData?: boolean,
	analyticsLabel?: string | object,
	analytics?: object,
	mode?: string,
	navigation?: TransportNavigation,
	onCreate?: (xhr: object) => void,
	onprogressupload?: (event: object) => void,
};

export type ActionError = {
	code: string,
	message?: string,
};

export type ActionResponse = {
	status: string,
	/** An action may answer with a primitive, so the contract cannot narrow this to an object. */
	data: unknown,
	errors?: ActionError[],
};
