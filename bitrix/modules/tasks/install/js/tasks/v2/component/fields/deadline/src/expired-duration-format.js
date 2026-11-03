import { DurationFormat } from 'main.date';

const unitDurations = DurationFormat.getUnitDurations();
const taskDeadlineMonthDuration = 30 * unitDurations.d;

export function formatExpiredDuration(duration: number): string
{
	const absoluteDuration = Math.abs(duration);
	const durationFormat = new DurationFormat(absoluteDuration);

	if (absoluteDuration < taskDeadlineMonthDuration || durationFormat.years > 0)
	{
		return durationFormat.formatClosest();
	}

	const months = Math.floor(absoluteDuration / taskDeadlineMonthDuration);

	return new DurationFormat(months * unitDurations.m).format({ format: 'm' });
}
