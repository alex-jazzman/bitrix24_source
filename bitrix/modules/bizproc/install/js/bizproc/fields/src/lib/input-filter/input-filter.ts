/**
 * A rule that reduces an arbitrary string to what the type accepts. Pure: the same input
 * always yields the same output, so it can be applied twice to compute the caret.
 */
export type InputSanitizer = (raw: string) => string;

export type FilteredInput = {
	value: string,
	caret: number,
};

/**
 * Applies a sanitizing rule to a typed-in value and says where the caret has to land.
 * Answers `null` when the rule changes nothing - there is then no reason to touch the node,
 * and rewriting `.value` would move the caret to the end for no gain.
 */
export function filterInput(raw: string, caret: number, sanitize: InputSanitizer): FilteredInput | null
{
	const value = sanitize(raw);

	if (value === raw)
	{
		return null;
	}

	// The caret keeps its place among the surviving characters: count how many of them
	// the rule leaves to the left of where it was.
	return {value, caret: sanitize(raw.slice(0, caret)).length};
}
