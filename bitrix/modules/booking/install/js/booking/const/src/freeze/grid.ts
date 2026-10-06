export const Grid = Object.freeze({
	Duration: {
		Day: 1,
		Week: 7,
	},
	Mode: {
		Day: 'day',
		Week: 'week',
	},
} as const);

export type Grid = typeof Grid;
