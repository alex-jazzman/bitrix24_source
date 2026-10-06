// Pure timer math for the work-day control panel, extracted from the
// component so the elapsed/pause calculations can be unit-tested without the
// heavy Vue dependency chain of app.js.
//
// All values are in milliseconds. The anchors dateStartMs/dateStopMs are
// ABSOLUTE instants (INFO.DISPLAY_START_TIMESTAMP / DISPLAY_STOP_TIMESTAMP),
// NOT the wall-coordinate INFO.DATE_START/DATE_FINISH (absolute minus the
// employee offset). Comparing an absolute anchor against nowMs is what makes an
// OPENED day start the working-day timer at ~0 instead of +offset.

/**
 * Compute the working-day and pause timer values for the control panel.
 *
 * @param {Object} params
 * @param {string} params.workStatus current work day status (OPENED|PAUSED|CLOSED|EXPIRED)
 * @param {string} params.canOpen open action for a closed day (''|'OPEN'|'REOPEN')
 * @param {boolean} params.isCanOpen whether a brand new day can be started (canOpen === 'OPEN')
 * @param {number} params.dateStartMs absolute start instant, ms epoch (0 if unknown)
 * @param {number} params.dateStopMs absolute displayed-finish instant, ms epoch (0 if unknown)
 * @param {number} params.durationMs persisted worked time (RECORDED_DURATION), ms
 * @param {number} params.timeLeaksMs persisted accumulated break time (TIME_LEAKS), ms
 * @param {number} params.nowMs current time, ms epoch
 * @returns {{ workingDayMs: number, pauseMs: number }}
 */
export function computeWorkdayTimers(
	{
		workStatus,
		canOpen,
		isCanOpen,
		dateStartMs,
		dateStopMs,
		durationMs,
		timeLeaksMs,
		nowMs,
	}: {
		workStatus: string,
		canOpen: string,
		isCanOpen: boolean,
		dateStartMs: number,
		dateStopMs: number,
		durationMs: number,
		timeLeaksMs: number,
		nowMs: number,
	},
): { workingDayMs: number, pauseMs: number }
{
	if (workStatus === 'CLOSED')
	{
		if (isCanOpen)
		{
			return { workingDayMs: 0, pauseMs: 0 };
		}

		if (canOpen === 'REOPEN')
		{
			// A reopened closed day shows only persisted values:
			// worked time is RECORDED_DURATION, the break is accumulated leaks.
			return { workingDayMs: durationMs, pauseMs: timeLeaksMs };
		}

		// Closed and not reopenable: no live timer, values stay at zero.
		return { workingDayMs: 0, pauseMs: 0 };
	}

	if (workStatus === 'PAUSED')
	{
		// Worked time is frozen on persisted DURATION; the current
		// break grows from the absolute pause moment (dateStopMs) plus the
		// leaks accumulated before this pause.
		return {
			workingDayMs: durationMs,
			pauseMs: (nowMs - dateStopMs) + timeLeaksMs,
		};
	}

	if (workStatus === 'OPENED' || workStatus === 'EXPIRED')
	{
		return {
			workingDayMs: (nowMs - dateStartMs) - timeLeaksMs,
			pauseMs: timeLeaksMs,
		};
	}

	return { workingDayMs: 0, pauseMs: 0 };
}
