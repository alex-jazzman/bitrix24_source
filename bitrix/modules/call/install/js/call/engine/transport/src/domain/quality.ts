/**
 * Quality level of remote media. The transport reports the level a media plane observes and takes
 * no decision on it - what to do about a drop belongs to the layers above.
 */
export const Quality: {
	readonly VeryHigh: 'very_high',
	readonly High: 'high',
	readonly Medium: 'medium',
	readonly Low: 'low',
	readonly VeryLow: 'very_low',
} = Object.freeze({
	VeryHigh: 'very_high',
	High: 'high',
	Medium: 'medium',
	Low: 'low',
	VeryLow: 'very_low',
});

export type Quality = typeof Quality[keyof typeof Quality];
