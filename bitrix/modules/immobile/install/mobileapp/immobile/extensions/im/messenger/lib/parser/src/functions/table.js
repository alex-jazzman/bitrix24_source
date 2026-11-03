/**
 * @module im/messenger/lib/parser/functions/table
 */
jn.define('im/messenger/lib/parser/functions/table', (require, exports, module) => {
	const { Type } = require('type');
	const { escapeRegExp } = require('utils/string');
	const { parsedElements, PLACEHOLDER } = require('im/messenger/lib/parser/utils/parsed-elements');
	const { Table } = require('im/messenger/lib/parser/elements/dialog/message/table');
	const {
		MARKDOWN_TABLE_PREFIX,
		MARKDOWN_PLACEHOLDER_SUFFIX,
	} = require('im/messenger/lib/parser/const');

	// Alphabet of a finished canonical payload: the producer percent-encodes every cell, so nothing
	// but [A-Za-z0-9%] can survive there. Anything else means the token never went through the
	// producer's sealing step (markdownConverter -> table-rules.finishTables) and what stands between
	// the markers is not a payload - a cell fence with the render nonce in it, or a prefix the lazy
	// match cut at a '####' left inside. Such a token must not become an element.
	const CANONICAL_PAYLOAD_PATTERN = /^[a-z\d%]+$/i;

	const parserTable = {
		/**
		 * Turn every canonical table token (####MD_TABLE_<nonce>_<payload>####) carrying the current
		 * per-render nonce into a Table element, replacing the token with a ####REPLACEMENT_N
		 * placeholder on its own clean line. getOrderedList reads placeholders line by line and drops
		 * whatever text shares a placeholder line, so the placeholder must stand alone - the same
		 * conditional-newline dance parserQuote.decodeCode uses around its blocks.
		 *
		 * Anti-spoof: the regex is bound to the current per-render nonce, so a literal token a sender
		 * typed (no nonce, or a stale one) never matches and stays plain text.
		 *
		 * @param {string} text
		 * @param {string} tableNonce - the nonce produced for this render (parser.decodeMessageFromText)
		 * @return {string}
		 */
		decodeTable(text, tableNonce)
		{
			if (!tableNonce || !text.includes(MARKDOWN_TABLE_PREFIX))
			{
				return text;
			}

			// Payload is percent-encoded (no '#'), so `.*?` up to the first `####` is exact. The nonce is
			// interpolated into the source, so it is escaped: an unescaped metacharacter would either throw
			// (`(`) or turn the anti-spoof check into a wildcard matching any token.
			const pattern = new RegExp(
				`${MARKDOWN_TABLE_PREFIX}${escapeRegExp(tableNonce)}_(.*?)${MARKDOWN_PLACEHOLDER_SUFFIX}`,
				'g',
			);
			let prevPhraseFirstIndex = 0;

			return text.replace(pattern, (match, payload, index) => {
				// Unsealed payload - degrade exactly like a malformed one (AC-31), never parse it.
				if (!CANONICAL_PAYLOAD_PATTERN.test(payload))
				{
					return match;
				}

				let data;
				try
				{
					data = JSON.parse(decodeURIComponent(payload));
				}
				catch
				{
					// Malformed payload must never crash the render (AC-31) - leave the token untouched.
					return match;
				}

				// JSON.parse also succeeds on 'null' or '[1,2]', so the shape is checked before the
				// element is built: anything but {header: [], rows: []} counts as malformed too.
				if (!Type.isPlainObject(data) || !Type.isArray(data.header) || !Type.isArray(data.rows))
				{
					return match;
				}

				// Only the run of ASCII spaces touching the token decides the wrapping newline, so scan just
				// those neighbours instead of copying and stripping the whole message tail on every token (O(n^2)).
				let previousIndex = index - 1;
				while (previousIndex >= prevPhraseFirstIndex && text[previousIndex] === ' ')
				{
					previousIndex--;
				}
				let nextIndex = index + match.length;
				while (text[nextIndex] === ' ')
				{
					nextIndex++;
				}
				const startTag = previousIndex < prevPhraseFirstIndex || text[previousIndex] === '\n' ? '' : '\n';
				const endTag = nextIndex === text.length || text[nextIndex] === '\n' ? '' : '\n';

				const tableId = parsedElements.add(new Table(data.header, data.rows));
				prevPhraseFirstIndex = index + match.length;

				return `${startTag}${PLACEHOLDER}${tableId}${endTag}`;
			});
		},
	};

	module.exports = {
		parserTable,
	};
});
