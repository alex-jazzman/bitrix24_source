import { Browser, Type } from 'main.core';

const COMBO_SEPARATOR = '+';
const LETTER_TOKEN_PREFIX = 'key';
const DIGIT_TOKEN_PREFIX = 'digit';
const MAC_SEPARATOR = '';

const MODIFIER_CAPTIONS = Object.freeze({
	ctrl: { mac: '⌃', other: 'Ctrl' },
	alt: { mac: '⌥', other: 'Alt' },
	shift: { mac: '⇧', other: 'Shift' },
	meta: { mac: '⌘', other: 'Meta' },
});

// Tokens whose canonical spelling is not a caption. Everything else is derived: a letter and a digit
// lose their prefix, the rest is the token with a capital first letter.
const KEY_CAPTIONS = Object.freeze({
	space: 'Space',
	escape: 'Esc',
	arrowleft: 'Left',
	arrowright: 'Right',
	arrowup: 'Up',
	arrowdown: 'Down',
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

function formatToken(token, isMac)
{
	const modifier = MODIFIER_CAPTIONS[token];

	if (!Type.isNil(modifier))
	{
		return isMac ? modifier.mac : modifier.other;
	}

	const caption = KEY_CAPTIONS[token];

	if (!Type.isNil(caption))
	{
		return caption;
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
 * Single owner of how a combo reads on screen: a canonical combo in, the caption of the current
 * platform out. macOS packs symbolic modifiers with no separator, every other platform spells them
 * out and joins with a plus.
 *
 * The canonical form never spells a key as '+', so splitting the combo by the separator is safe.
 *
 * @param {string} combo canonical combo
 * @returns {string}
 */
export function formatComboCaption(combo)
{
	if (!Type.isStringFilled(combo))
	{
		return '';
	}

	const isMac = Browser.isMac();

	return combo
		.split(COMBO_SEPARATOR)
		.map((token) => formatToken(token, isMac))
		.join(isMac ? MAC_SEPARATOR : COMBO_SEPARATOR);
}
