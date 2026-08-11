// ALG-01: pure decision logic for the "start state" of the work day,
// extracted from the component so it can be unit-tested without importing
// the heavy Vue dependency chain of app.js.

// Duration of the start state window: one hour after the work day opens.
export const START_STATE_DURATION_MS = 3600 * 1000;

/**
 * Whether the work day is currently in its "start state".
 *
 * The start state is active only while the work day is OPENED and less than
 * START_STATE_DURATION_MS has elapsed since it started. The boundary is strict:
 * at exactly the duration the start state is already over. A missing/zero
 * DATE_START means the start state cannot be determined and is false.
 *
 * @param {string} workStatus current work day status (e.g. 'OPENED')
 * @param {number} dateStartTimestamp work day start time, ms epoch (0 if unknown)
 * @param {number} currentTimestamp current time, ms epoch
 * @param {number} durationMs start state window length, ms
 * @returns {boolean}
 */
export function isStartState(
	workStatus: string,
	dateStartTimestamp: number,
	currentTimestamp: number,
	durationMs: number = START_STATE_DURATION_MS,
): boolean
{
	if (workStatus !== 'OPENED')
	{
		return false;
	}

	if (!dateStartTimestamp)
	{
		return false;
	}

	return (currentTimestamp - dateStartTimestamp) < durationMs;
}
