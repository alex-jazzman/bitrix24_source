import { RecorderStatus } from '../sdk/const';

/**
 * Which way this client tried to move CoPilot. Read from the state the client REQUESTED: while an
 * error is present the engine leaves the CoPilot flag untouched, so the flag still describes the
 * state before the attempt.
 */
export const CopilotAttemptDirection = Object.freeze({
	On: 'on',
	Off: 'off',
	Unknown: 'unknown',
});

/**
 * Only ENABLED, PAUSED and DESTROYED can be requested today; the rest of the enum is answered for
 * completeness. Deleting the record stays unknown rather than off on purpose: the start event
 * leaves on switching on only.
 *
 * @param {number} requestedRecorderState one of RecorderStatus
 * @returns {string} CopilotAttemptDirection
 */
export function getCopilotAttemptDirection(requestedRecorderState)
{
	if (requestedRecorderState === RecorderStatus.ENABLED)
	{
		return CopilotAttemptDirection.On;
	}

	if ([RecorderStatus.PAUSED, RecorderStatus.DISABLED].includes(requestedRecorderState))
	{
		return CopilotAttemptDirection.Off;
	}

	return CopilotAttemptDirection.Unknown;
}
