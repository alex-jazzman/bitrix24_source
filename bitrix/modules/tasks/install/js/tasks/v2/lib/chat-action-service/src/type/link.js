import { ActionPayload } from './action-payload.js';

export type Link = {
	url: string,
	matches: Array<string>,
	anchor: HTMLElement,
}

export type ParsedLink = {
	actionName: string,
	payload: ActionPayload,
}
