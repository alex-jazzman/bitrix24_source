import { DurationFormat } from 'main.date';

export const durationPlanFormat = (value: string): string => {
	const durationInSeconds = Number(JSON.parse(value)) * 1000;

	if (durationInSeconds <= 0)
	{
		return '';
	}

	return new DurationFormat(durationInSeconds).format({
		format: 'd H',
	});
};
