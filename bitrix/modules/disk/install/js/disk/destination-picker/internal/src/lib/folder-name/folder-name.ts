// Names of a level are compared case-insensitively: the storage refuses "Reports"
// next to "reports", so a suggestion that differs only in case is not a free one.
function toLoweredSet(taken: string[]): Set<string>
{
	return new Set(taken.map((value: string) => value.toLowerCase()));
}

/**
 * The name a new folder is offered under: the base one while it is free, "... (1)",
 * "... (2)" and on while it is not (AC-023).
 *
 * Only the names of the level already at hand are looked at, so the suggestion is
 * a courtesy rather than a guarantee: the last word on a taken name belongs to the
 * server, which answers `name_taken` if the level moved on meanwhile.
 */
export function suggestFolderName(base: string, taken: string[]): string
{
	const lowered = toLoweredSet(taken);
	if (!lowered.has(base.toLowerCase()))
	{
		return base;
	}

	let index = 1;
	while (lowered.has(`${base} (${index})`.toLowerCase()))
	{
		index += 1;
	}

	return `${base} (${index})`;
}
