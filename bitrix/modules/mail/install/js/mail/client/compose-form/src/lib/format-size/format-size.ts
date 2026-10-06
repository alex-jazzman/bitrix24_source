const Step = 1024;

/** Rounding factor for one decimal place. */
const Decimals = 10;

/**
 * Repeats the output of `CFile::formatSize($size, 1)`: 1024 to a step, one decimal, no trailing zero on a
 * whole value. `units` is passed in because the words are localized; an empty one gives the number alone.
 */
export function formatSize(bytes: number, units: string[]): string
{
	let size = bytes;
	let step = 0;
	while (size >= Step && step < units.length - 1)
	{
		size /= Step;
		step += 1;
	}

	const value = Math.round(size * Decimals) / Decimals;

	return `${value} ${units[step] ?? ''}`.trim();
}
