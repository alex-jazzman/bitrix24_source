// @flow

// Pure grammar of the inline date token `[[date YYYY-MM-DD]]` - the only place that knows the written
// form. The node, the clipboard sniffer, the export pass and the server-side mirror all go through
// here, so the form cannot drift between them.
//
// The token carries a calendar date and nothing else: no keys, no `|`, no newline. A `|` inside it
// would split a table row and drop the neighbouring cell (the table serializer never escapes it), so
// the strict pattern below is what keeps such a token from ever being written.

type DateTokenMatch = {
	raw: string,
	length: number,
	value: string,
};

// The grammar, unanchored: asks whether a fragment carries a token anywhere. Kept flagless so that
// `.test()` stays stateless for the clipboard sniffer that shares this instance.
export const DATE_TOKEN_PATTERN: RegExp = /\[\[date (\d{4})-(\d{2})-(\d{2})]]/;

// The same grammar anchored at the fragment start - the inline tokenizer is only ever offered a slice
// that has to begin with the token.
const DATE_TOKEN_RE: RegExp = /^\[\[date (\d{4})-(\d{2})-(\d{2})]]/;

// Shape of an already written value, re-validated when it arrives as an attribute (collaborative
// state, pasted HTML) instead of through a token.
const DATE_VALUE_RE: RegExp = /^(\d{4})-(\d{2})-(\d{2})$/;

const TOKEN_PREFIX = '[[date';

/**
 * Index of the first `[[date` at or after `from`, or -1. Used as the inline tokenizer's start() hint.
 */
export function findDateTokenStart(text: string, from: number = 0): number
{
	return text.indexOf(TOKEN_PREFIX, from);
}

/**
 * Matches a token at the very start of `text`.
 *
 * @return {DateTokenMatch | null} null for anything that is not the canonical form, or that spells a
 * date the calendar does not have.
 */
export function matchDateToken(text: string): DateTokenMatch | null
{
	const match = DATE_TOKEN_RE.exec(text);
	if (!match)
	{
		return null;
	}

	const value = normalizeDateValue(match[1], match[2], match[3]);

	return value === null ? null : { raw: match[0], length: match[0].length, value };
}

/**
 * Normalizes calendar parts to `YYYY-MM-DD`, or refuses. There is no partial trust: parts that do not
 * normalize never become a node.
 */
export function normalizeDateValue(year: mixed, month: mixed, day: mixed): string | null
{
	const yearNumber = Number(year);
	const monthNumber = Number(month);
	const dayNumber = Number(day);

	if (!Number.isInteger(yearNumber) || !Number.isInteger(monthNumber) || !Number.isInteger(dayNumber))
	{
		return null;
	}

	// Round-trip through the UTC fields: it refuses both a day the calendar does not have (2026-02-31
	// rolls over into March) and Date.UTC's two-digit-year remap (0026 would silently become 1926).
	const date = new Date(Date.UTC(yearNumber, monthNumber - 1, dayNumber));
	if (
		date.getUTCFullYear() !== yearNumber
		|| date.getUTCMonth() !== monthNumber - 1
		|| date.getUTCDate() !== dayNumber
	)
	{
		return null;
	}

	return [
		String(yearNumber).padStart(4, '0'),
		String(monthNumber).padStart(2, '0'),
		String(dayNumber).padStart(2, '0'),
	].join('-');
}

/**
 * Re-validates an already written value through the same normalization, so a value that reached the
 * node past the tokenizer is trusted no more than one that came through it.
 */
export function normalizeDateString(value: mixed): string | null
{
	const match = DATE_VALUE_RE.exec(String(value ?? ''));

	return match === null ? null : normalizeDateValue(match[1], match[2], match[3]);
}

/**
 * Builds the canonical token: writes exactly what matchDateToken() accepts.
 */
export function buildDateToken(value: string): string
{
	return `${TOKEN_PREFIX} ${value}]]`;
}
