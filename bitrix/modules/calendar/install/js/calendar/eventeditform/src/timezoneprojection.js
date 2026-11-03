'use strict';

import { Util } from 'calendar.util';
import { Type } from 'main.core';

export const TimezoneProjectionSource = Object.freeze({
	compactCanonical: 'compact-canonical',
	entryDateFieldsProjected: 'entry-date-fields-projected',
	entryStringCanonical: 'entry-string-canonical',
});

const sourceModes = Object.values(TimezoneProjectionSource);

const copyDate = (date) => {
	return Type.isDate(date) ? new Date(date.getTime()) : null;
};

const getUtcWallClockTimestamp = (date) => Date.UTC(
	date.getUTCFullYear(),
	date.getUTCMonth(),
	date.getUTCDate(),
	date.getUTCHours(),
	date.getUTCMinutes(),
	date.getUTCSeconds(),
);

const getUtcWallClockOffset = (timeZone, utcContainer) => {
	const wallClockUtcTs = getUtcWallClockTimestamp(utcContainer);
	const offset = Util.getTimeZoneOffsetForInstant(timeZone, new Date(wallClockUtcTs));
	const adjusted = Util.getTimeZoneOffsetForInstant(timeZone, new Date(wallClockUtcTs + offset * 60000));
	if (adjusted === offset)
	{
		return offset;
	}

	const confirmed = Util.getTimeZoneOffsetForInstant(timeZone, new Date(wallClockUtcTs + adjusted * 60000));
	if (confirmed === adjusted)
	{
		return adjusted;
	}

	return offset;
};

// A "UTC container" stores the wall-clock in the Date's UTC fields, so a wall-clock inside the
// runner system zone's spring-forward gap survives (a local Date would normalize it forward).
export const toUtcWallClock = (date) => new Date(Date.UTC(
	date.getFullYear(),
	date.getMonth(),
	date.getDate(),
	date.getHours(),
	date.getMinutes(),
	date.getSeconds(),
));

// Inverse of toUtcWallClock: materialize a UTC container's wall-clock as a local Date for consumers
// that read local getters (planner, location preview).
export const utcContainerToLocal = (utcContainer) => new Date(
	utcContainer.getUTCFullYear(),
	utcContainer.getUTCMonth(),
	utcContainer.getUTCDate(),
	utcContainer.getUTCHours(),
	utcContainer.getUTCMinutes(),
	utcContainer.getUTCSeconds(),
);

// Express an absolute instant (ms since epoch) as the wall-clock in timeZone, stored gap-safe in a
// UTC container. Read the result via getUTC*() or formatX(..., true).
export const instantToUtcContainer = (instant, timeZone) => {
	if (!Type.isStringFilled(timeZone))
	{
		return new Date(instant);
	}

	const offsetMinutes = Util.getTimeZoneOffsetForInstant(timeZone, new Date(instant));

	return new Date(instant - offsetMinutes * 60000);
};

export const getWallClockInstant = (date, timeZone, utc = false) => {
	if (!utc)
	{
		return Util.getWallClockInstant(date, timeZone);
	}

	const wallClockUtcTs = getUtcWallClockTimestamp(date);
	if (!Type.isStringFilled(timeZone))
	{
		return wallClockUtcTs;
	}

	return wallClockUtcTs + getUtcWallClockOffset(timeZone, date) * 60000;
};

// Re-express a boundary wall-clock (read in sourceTimezone) as the wall-clock in targetTimezone that
// denotes the same absolute instant, returned as a gap-safe UTC container. DST-safe (offsets resolved
// at the true instant); a passthrough (as a UTC container) when a zone is missing or the zones match.
export const expressWallClockInTimezone = (boundary, sourceTimezone, targetTimezone, sourceUtc = false) => {
	if (!Type.isDate(boundary))
	{
		return null;
	}

	if (
		!Type.isStringFilled(sourceTimezone)
		|| !Type.isStringFilled(targetTimezone)
		|| sourceTimezone === targetTimezone
	)
	{
		return sourceUtc ? new Date(boundary.getTime()) : toUtcWallClock(boundary);
	}

	return instantToUtcContainer(getWallClockInstant(boundary, sourceTimezone, sourceUtc), targetTimezone);
};

// Project a canonical event-zone wall-clock into the user zone through the absolute instant. The
// stored per-boundary instant is preferred (fold-correct in the ambiguous autumn hour); the fallback
// resolves the wall-clock in the event zone for rows that carry no instant (recurrence, all-day, legacy).
const projectCanonicalBoundary = (wallClock, eventTimezone, userTimezone, storedInstant) => {
	const instant = Number.isFinite(storedInstant)
		? storedInstant
		: Util.getWallClockInstant(wallClock, eventTimezone);

	return instantToUtcContainer(instant, userTimezone);
};

export const createTimezoneProjection = ({
	from,
	to,
	fullDay = false,
	sourceMode,
	eventTimezoneFrom,
	eventTimezoneTo,
	userTimezone,
	fromInstant = null,
	toInstant = null,
}) => {
	const fromCopy = copyDate(from);
	const toCopy = copyDate(to);
	const projection = {
		from: fromCopy,
		to: toCopy,
		fromUtc: null,
		toUtc: null,
		fullDay: fullDay === true,
		displayTimezone: Type.isStringFilled(userTimezone) ? userTimezone : '',
		active: false,
		reason: null,
	};

	if (!fromCopy || !toCopy)
	{
		projection.reason = 'incomplete-date-range';

		return projection;
	}

	if (!sourceModes.includes(sourceMode))
	{
		projection.reason = 'unknown-source-mode';

		return projection;
	}

	if (!projection.displayTimezone)
	{
		projection.reason = 'missing-user-timezone';

		return projection;
	}

	if (projection.fullDay)
	{
		projection.fromUtc = toUtcWallClock(fromCopy);
		projection.toUtc = toUtcWallClock(toCopy);
		projection.active = true;
		projection.reason = 'full-day';

		return projection;
	}

	const canProjectFrom = Type.isStringFilled(eventTimezoneFrom);
	const canProjectTo = Type.isStringFilled(eventTimezoneTo);
	if (!canProjectFrom || !canProjectTo)
	{
		projection.reason = 'missing-event-timezone';

		return projection;
	}

	if (sourceMode === TimezoneProjectionSource.entryDateFieldsProjected)
	{
		// Entry date fields already carry the user-zone wall-clock; only add its UTC-container view.
		projection.fromUtc = toUtcWallClock(fromCopy);
		projection.toUtc = toUtcWallClock(toCopy);
		projection.active = true;
		projection.reason = 'already-projected';

		return projection;
	}

	if (userTimezone === eventTimezoneFrom && userTimezone === eventTimezoneTo)
	{
		// The event is already shown in the user's own zone: no projection is needed.
		projection.reason = 'display-zone-matches-event';

		return projection;
	}

	projection.fromUtc = projectCanonicalBoundary(fromCopy, eventTimezoneFrom, userTimezone, fromInstant);
	projection.toUtc = projectCanonicalBoundary(toCopy, eventTimezoneTo, userTimezone, toInstant);
	projection.from = utcContainerToLocal(projection.fromUtc);
	projection.to = utcContainerToLocal(projection.toUtc);
	projection.active = true;
	projection.reason = 'projected';

	return projection;
};
