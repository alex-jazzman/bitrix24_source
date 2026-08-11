import { type JsonObject } from 'main.core';

import { type ImModelMessage } from 'im.v2.model';

export type FormConfigType = {
	id: string;
	forms: FormEntryType[];
	presets: JsonObject;
};

export type FormEntryType = {
	zones: string[],
	id: number,
	sec: string,
	lang: string,
};

export type CopilotFormParams = {
	userCounter: number,
	message: ImModelMessage,
};

export type AiAssistantFormParams = {
	contextId: string,
	message: string,
};
