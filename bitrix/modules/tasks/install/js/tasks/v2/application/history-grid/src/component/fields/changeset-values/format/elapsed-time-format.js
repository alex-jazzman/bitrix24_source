import { DurationFormat } from 'main.date';

export const elapsedTimeFormat = (value: string): string => {
	const durationInMinutes = Number(JSON.parse(value));
	const durationInMilliseconds = durationInMinutes * 60 * 1000;

	return new DurationFormat(durationInMilliseconds).format({
		format: 'H i',
	});
};
