import { Type } from 'main.core';

import { MARKDOWN_CODE_PREFIX, MARKDOWN_CODE_PATTERN } from '../const.js';

const NAMED_ENTITIES = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: '\'',
	nbsp: ' ',
	copy: '©',
	reg: '®',
	trade: '™',
	mdash: '—',
	ndash: '–',
	laquo: '«',
	raquo: '»',
	bull: '•',
	hellip: '…',
	rarr: '→',
	larr: '←',
	hearts: '♥',
	check: '✓',
	times: '×',
	divide: '÷',
	plusmn: '±',
	deg: '°',
	euro: '€',
	pound: '£',
	yen: '¥',
	cent: '¢',
};

const HTML_TAG_MAP = {
	u: 'u',
	b: 'b',
	strong: 'b',
	i: 'i',
	em: 'i',
	s: 's',
	del: 's',
	strike: 's',
};

const HTML_TAG_PATTERN = new RegExp(
	`<(${Object.keys(HTML_TAG_MAP).join('|')})(\\s[^>]*)?>([\\s\\S]*?)<\\/\\1>`,
	'gi',
);

/**
 * A '[' produced by decoding an HTML entity (&#91; / &#x5B; / &lbrack;) must NOT be able to
 * open a BB-code tag: the BB-code decoders run after this step and Text.encode does not
 * escape '['. Without this, entity-encoded user text like
 * `&#91;send=/cmd&#93;click&#91;/send&#93;` — which passes server-side BB sanitization as
 * plain text — would be decoded into an ACTIVE [send]/[put]/[url]/… element on the
 * recipient (CRITICAL: HTML-entity -> active BB-code injection). A zero-width space after
 * '[' keeps it visually a '[' but inert. This is the root defang; per-construct defangs
 * elsewhere (lists, table cells) no longer need to handle the entity case.
 *
 * @param {string} char
 * @returns {string}
 */
function defangDecodedBracket(char: string): string
{
	return char === '[' ? '[\u200B' : char;
}

/**
 * Decode HTML entities (named, decimal, hex) to their Unicode equivalents. A decoded '['
 * is defanged so an entity can never assemble an active BB-code tag (see above).
 *
 * @param {string} text
 * @returns {string}
 */
function decodeHtmlEntities(text: string): string
{
	return text.replaceAll(/&(#x?[\dA-Fa-f]+|[A-Za-z]+);/g, (match, entity) => {
		if (entity.startsWith('#x') || entity.startsWith('#X'))
		{
			const codePoint = parseInt(entity.slice(2), 16);
			if (codePoint === 0 || Number.isNaN(codePoint))
			{
				return match;
			}

			try
			{
				return defangDecodedBracket(String.fromCodePoint(codePoint));
			}
			catch
			{
				return match;
			}
		}

		if (entity.startsWith('#'))
		{
			const codePoint = parseInt(entity.slice(1), 10);
			if (codePoint === 0 || Number.isNaN(codePoint))
			{
				return match;
			}

			try
			{
				return defangDecodedBracket(String.fromCodePoint(codePoint));
			}
			catch
			{
				return match;
			}
		}

		const decoded = NAMED_ENTITIES[entity];

		return decoded === undefined ? match : defangDecodedBracket(decoded);
	});
}

// Cap for the backtracking-prone tag-pair regex below. The lazy `[\s\S]*?` plus the
// `\1` backreference make HTML_TAG_PATTERN quadratic on adversarial input
// (e.g. '<b>'.repeat(50000)); bound the work so it cannot freeze the render thread.
// The cheap `</` pre-check skips the regex for the common opener-only DoS shape, and
// the length cap covers the rest. decodeHtmlEntities below is linear and uncapped.
const HTML_TAG_MAX_LENGTH = 20000;
const MAX_NESTING_DEPTH = 10;

/**
 * Convert HTML formatting tags to BB-codes and decode HTML entities.
 * Skips content inside code block placeholders (####MD_CODE_N####).
 *
 * @param {string} text
 * @returns {string}
 */
export function applyHtmlRules(text: string): string
{
	if (!Type.isStringFilled(text))
	{
		return '';
	}

	let current = text;

	if (current.length <= HTML_TAG_MAX_LENGTH && current.includes('</'))
	{
		let iterations = 0;
		let changed = true;
		while (changed && iterations < MAX_NESTING_DEPTH)
		{
			changed = false;
			current = current.replaceAll(HTML_TAG_PATTERN, (match, tag, attrs, content) => {
				changed = true;
				const bbTag = HTML_TAG_MAP[tag.toLowerCase()];

				return `[${bbTag}]${content}[/${bbTag}]`;
			});
			iterations++;
		}
	}

	text = current;

	const parts = text.split(MARKDOWN_CODE_PATTERN);
	const decoded = parts.map((part) => {
		if (part.startsWith(MARKDOWN_CODE_PREFIX))
		{
			return part;
		}

		return decodeHtmlEntities(part);
	});

	return decoded.join('');
}
