import { Type } from 'main.core';

const COMBO_SEPARATOR = '+';
const LETTER_TOKEN_PREFIX = 'key';
const DIGIT_TOKEN_PREFIX = 'digit';

// `aria-keyshortcuts` is spelled in the key names of UI Events, and the canonical token of the input
// layer is the physical code: the two part ways on every key that types a character, so the caption
// of `formatComboCaption` (which reads for a person) cannot stand in for this one.
const MODIFIER_KEY_NAMES = Object.freeze({
	ctrl: 'Control',
	alt: 'Alt',
	shift: 'Shift',
	meta: 'Meta',
});

const KEY_NAMES = Object.freeze({
	space: 'Space',
	escape: 'Escape',
	enter: 'Enter',
	tab: 'Tab',
	backspace: 'Backspace',
	delete: 'Delete',
	insert: 'Insert',
	arrowleft: 'ArrowLeft',
	arrowright: 'ArrowRight',
	arrowup: 'ArrowUp',
	arrowdown: 'ArrowDown',
	minus: '-',
	equal: '=',
	bracketleft: '[',
	bracketright: ']',
	comma: ',',
	period: '.',
	slash: '/',
	semicolon: ';',
	quote: '\'',
	backquote: '`',
	backslash: '\\',
});

function formatKeyName(token)
{
	const modifier = MODIFIER_KEY_NAMES[token];

	if (!Type.isNil(modifier))
	{
		return modifier;
	}

	const name = KEY_NAMES[token];

	if (!Type.isNil(name))
	{
		return name;
	}

	if (token.startsWith(LETTER_TOKEN_PREFIX))
	{
		return token.slice(LETTER_TOKEN_PREFIX.length).toUpperCase();
	}

	if (token.startsWith(DIGIT_TOKEN_PREFIX))
	{
		return token.slice(DIGIT_TOKEN_PREFIX.length);
	}

	return token.charAt(0).toUpperCase() + token.slice(1);
}

/**
 * The combo of an action as `aria-keyshortcuts` declares it. An action holding no combo announces
 * nothing at all, and null is what leaves the attribute off the element.
 *
 * @param {string | null} combo canonical combo
 * @returns {string | null}
 */
export function formatComboKeyshortcuts(combo)
{
	if (!Type.isStringFilled(combo))
	{
		return null;
	}

	return combo
		.split(COMBO_SEPARATOR)
		.map((token) => formatKeyName(token))
		.join(COMBO_SEPARATOR)
	;
}
