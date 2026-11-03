// The rule of the hub description field, the same as the server's DescriptionNormalizer. The whitespace set is
// listed explicitly on both sides instead of relying on String.prototype.trim(), and a character is a code point.
export const HUB_DESCRIPTION_MAX_LENGTH = 1000;

const HIGH_SURROGATE_PATTERN = /^[\uD800-\uDBFF]$/;
const EDGE_WHITESPACE_PATTERN = /^[\t-\r \u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]+|([^\t-\r \u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF])[\t-\r \u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]+$/g;

export function normalizeHubDescription(value: unknown): string
{
	if (value === null || value === undefined)
	{
		return '';
	}

	return String(value)
		.replaceAll(/\r\n?/g, '\n')
		.replaceAll(EDGE_WHITESPACE_PATTERN, '$1')
	;
}

export function countHubDescriptionChars(value: string): number
{
	return [...value].length;
}

export type HubDescriptionEdit = {
	value: string,
	caret: number,
};

// Applied while typing, so edge whitespace is left as it is: trimming it here would eat the space the user has just
// typed before the next word. Only the inserted fragment is cut, never the text around it: the fragment is what
// lies between the part shared with the previous value and the caret, which the browser puts right after it.
export function limitHubDescriptionEdit(
	previous: string,
	value: string,
	caret: number = value.length,
): HubDescriptionEdit
{
	if (fitsHubDescriptionLimit(value))
	{
		return { value, caret };
	}

	const end = Math.min(Math.max(caret, 0), value.length);
	const suffix = value.slice(end);
	let start = Math.min(commonPrefixLength(previous, value), end, Math.max(previous.length - suffix.length, 0));
	if (start > 0 && HIGH_SURROGATE_PATTERN.test(value[start - 1]))
	{
		start--;
	}

	const prefix = value.slice(0, start);
	const fragment = value.slice(start, end);
	const inserted = [...fragment];
	const compose = (count: number): string => prefix + inserted.slice(0, count).join('') + suffix;

	let kept = 0;
	let over = inserted.length;
	while (over - kept > 1)
	{
		const middle = Math.floor((kept + over) / 2);
		if (fitsHubDescriptionLimit(compose(middle)))
		{
			kept = middle;
		}
		else
		{
			over = middle;
		}
	}

	const head = prefix + inserted.slice(0, kept).join('');

	return { value: head + suffix, caret: head.length };
}

export function limitHubDescriptionInput(value: string): string
{
	return limitHubDescriptionEdit('', value).value;
}

function fitsHubDescriptionLimit(value: string): boolean
{
	return countHubDescriptionChars(normalizeHubDescription(value)) <= HUB_DESCRIPTION_MAX_LENGTH;
}

function commonPrefixLength(left: string, right: string): number
{
	const limit = Math.min(left.length, right.length);
	let length = 0;
	while (length < limit && left[length] === right[length])
	{
		length++;
	}

	return length;
}
