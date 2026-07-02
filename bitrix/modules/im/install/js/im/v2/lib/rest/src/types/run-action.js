import { type JsonObject } from 'main.core';

export type RunActionConfig = {
	data?: JsonObject,
	analyticsLabel?: JsonObject
};

type RunActionResultData = any;

export type RunActionResult = {
	status: 'success' | 'error',
	data: RunActionResultData,
	errors: RunActionError[]
};

export type RunActionResponse = RunActionResultData | RunActionError[];

export type RunActionError = {
	code: number | string,
	customData: any,
	message: string
};
