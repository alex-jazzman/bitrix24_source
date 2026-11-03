/**
 * @module im/messenger/lib/parser/markdown/rules/html-rules
 */
jn.define('im/messenger/lib/parser/markdown/rules/html-rules', (require, exports, module) => {
	const { Type } = require('type');
	const { MARKDOWN_CODE_PREFIX, MARKDOWN_CODE_PATTERN } = require('im/messenger/lib/parser/const');

	const NAMED_ENTITIES = {
		amp: '&',
		lt: '<',
		gt: '>',
		quot: '"',
		apos: '\'',
		nbsp: '\u00A0',
		copy: '\u00A9',
		reg: '\u00AE',
		trade: '\u2122',
		mdash: '\u2014',
		ndash: '\u2013',
		laquo: '\u00AB',
		raquo: '\u00BB',
		bull: '\u2022',
		hellip: '\u2026',
		rarr: '\u2192',
		larr: '\u2190',
		hearts: '\u2665',
		check: '\u2713',
		times: '\u00D7',
		divide: '\u00F7',
		plusmn: '\u00B1',
		deg: '\u00B0',
		euro: '\u20AC',
		pound: '\u00A3',
		yen: '\u00A5',
		cent: '\u00A2',
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
	 * A '[' produced by decoding an HTML entity (&#91; / &#x5B;) must NOT be able to open a BB-code
	 * tag: this pass runs before the BB-code decoders and the server passes entity-encoded text
	 * through as plain text, so `&#91;URL=b24://x]tap&#91;/URL]` would otherwise be decoded into an
	 * ACTIVE tag on the recipient. A zero-width space after '[' keeps it visually a '[' but inert.
	 * This is the root defang; the per-construct guards elsewhere (inline code, table cells) no
	 * longer have to cover the entity case.
	 *
	 * @param {string} char
	 * @returns {string}
	 */
	function defangDecodedBracket(char)
	{
		return char === '[' ? '[\u200B' : char;
	}

	/**
	 * Decode HTML entities (named, decimal, hex) to their Unicode equivalents. A decoded '[' is
	 * defanged so an entity can never assemble an active BB-code tag (see above).
	 *
	 * @param {string} text
	 * @returns {string}
	 */
	function decodeHtmlEntities(text)
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

	/**
	 * Convert HTML formatting tags to BB-codes and decode HTML entities.
	 * Skips content inside code block placeholders (####MD_CODE_N####).
	 *
	 * The output is render-mode independent (tag mapping and entity decoding are identical in
	 * both modes); `options` is accepted only for signature parity with the block/inline rules,
	 * so a caller can run all three over an isolated string with one options object.
	 *
	 * @param {string} text
	 * @param {object} [options]
	 * @returns {string}
	 */
	function applyHtmlRules(text, options = {})
	{
		if (!Type.isStringFilled(text))
		{
			return '';
		}

		const MAX_NESTING_DEPTH = 10;
		let previous = '';
		let current = text;

		if (HTML_TAG_PATTERN.test(current))
		{
			HTML_TAG_PATTERN.lastIndex = 0;
			let iterations = 0;
			while (current !== previous && iterations < MAX_NESTING_DEPTH)
			{
				previous = current;
				current = current.replaceAll(HTML_TAG_PATTERN, (match, tag, attrs, content) => {
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

	module.exports = { applyHtmlRules };
});
