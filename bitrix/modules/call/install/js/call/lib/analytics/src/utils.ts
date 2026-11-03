import { Extension, Type } from 'main.core';

import { AnalyticsElement, AnalyticsTool, type AnalyticsElementValue } from './const';

const PRESET_TOOL_MAP: Record<string, string> = {
	sync: AnalyticsTool.sync,
};

const ERROR_STATUS_PREFIX = 'error_';
const UNKNOWN_ERROR_CODE = 'UNKNOWN_ERROR';

// the boundary of the accident log, which keeps the code itself - so the limit is applied
// before the prefix, not to the resulting status
const ERROR_CODE_MAX_LENGTH = 90;

export type ToggleMicrophoneCommand = {
	source?: AnalyticsElementValue;
	muted: boolean;
	applied: boolean;
};

export function getCallTool(): string
{
	const presetCode = Extension.getSettings('call.core').get('activePresetCode', '');

	return PRESET_TOOL_MAP[presetCode] ?? AnalyticsTool.im;
}

/**
 * A command that did not reach the device library is not reported at all. The microphone push-to-talk
 * closes is not reported either - only the one it opens is.
 */
export function shouldSendToggleMicrophone(command: ToggleMicrophoneCommand): boolean
{
	if (!command.applied)
	{
		return false;
	}

	return !(command.source === AnalyticsElement.pushToTalk && command.muted);
}

/**
 * Names a failure code for the status field. There is no dictionary of codes: the recording service
 * is external and sends whatever it has.
 */
export function toAnalyticsErrorStatus(errorCode?: unknown): string
{
	if (!Type.isStringFilled(errorCode))
	{
		return `${ERROR_STATUS_PREFIX}${UNKNOWN_ERROR_CODE}`;
	}

	// A camelCase code carries its word boundaries in the case alone, and upper-casing destroys them:
	// NotAllowedError would come out NOTALLOWEDERROR. Making the boundaries explicit first keeps them.
	// The second rule separates an acronym from the word after it, so HTTPError becomes HTTP_ERROR.
	// Both rules stay linear on purpose: the code is free text of any length from an external service,
	// and a rule matching the whole run of capitals (`[A-Z]+`) backtracks once per starting position,
	// so a long run of capitals would hold the main thread for seconds. Matching the single letter
	// before the word gives the same insertion point. The head is cut before rewriting for the same
	// reason - a separator only lengthens the string, so twice the limit already decides the result.
	const normalized = errorCode
		.slice(0, ERROR_CODE_MAX_LENGTH * 2)
		.replaceAll(/([\da-z])([A-Z])/g, '$1_$2')
		.replaceAll(/([A-Z])([A-Z][a-z])/g, '$1_$2')
		.toUpperCase()
		.replaceAll(/[^\dA-Z]/g, '_')
		.slice(0, ERROR_CODE_MAX_LENGTH);

	return `${ERROR_STATUS_PREFIX}${normalized}`;
}
