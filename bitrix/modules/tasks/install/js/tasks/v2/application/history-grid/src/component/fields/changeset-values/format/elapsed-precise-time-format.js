import { DurationFormat } from 'main.date';

export const elapsedPreciseTimeFormat = (value: string): string => {
	const durationInSeconds = Number(JSON.parse(value));
	const durationFormat = new DurationFormat(durationInSeconds * 1000);

	if (durationInSeconds <= 0)
	{
		return durationFormat.format({
			format: 'i',
		});
	}

	const hours = Math.floor(durationInSeconds / 3600);

	if (hours > 0)
	{
		return durationFormat.format({
			format: 'H i',
		});
	}

	return durationFormat.format({
		format: 'i s',
	});
};
