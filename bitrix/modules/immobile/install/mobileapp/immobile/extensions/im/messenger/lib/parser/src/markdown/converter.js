/**
 * @module im/messenger/lib/parser/markdown/converter
 */
jn.define('im/messenger/lib/parser/markdown/converter', (require, exports, module) => {
	const { Type } = require('type');
	const { CodeProtector } = require('im/messenger/lib/parser/markdown/utils/code-protector');
	const { EscapeHandler } = require('im/messenger/lib/parser/markdown/utils/escape-handler');
	const { MentionProtector } = require('im/messenger/lib/parser/markdown/utils/mention-protector');
	const { ListTagProtector } = require('im/messenger/lib/parser/markdown/utils/list-tag-protector');
	const { applyBlockRules } = require('im/messenger/lib/parser/markdown/rules/block-rules');
	const { applyInlineRules } = require('im/messenger/lib/parser/markdown/rules/inline-rules');
	const { applyHtmlRules } = require('im/messenger/lib/parser/markdown/rules/html-rules');
	const { finishTables } = require('im/messenger/lib/parser/markdown/rules/table-rules');

	// Fast-path: skip the whole pipeline when the text has no Markdown-significant shape.
	// Deliberately NOT triggered by a bare "[" or "=" — those appear in ordinary BB-code
	// ([USER=…], [URL=…], [DISK=…]) with no Markdown to convert; on mobile recent/dialog
	// open this fast-path runs in bulk, so the narrower trigger matters. Each real shape is
	// matched precisely: link/image via "](", setext-H1 via "={3}", list bullets/ordered
	// markers via the line-anchored alternation, rules/setext-H2/separators via "-{3}".
	const MARKDOWN_TRIGGER = /[\t!#&*+<>\\_`|~]|\]\(|^[ \t]*(?:-|\d+\.)[ \t]|-{3}|={3}/m;

	class MarkdownConverter
	{
		/**
		 * Convert Markdown to BB-codes for full message rendering.
		 *
		 * The render mode selects the output contract: 'canonical' emits the native contract
		 * ([icode], [h1]/[h2], [hr], structural [list]) while 'fallback' keeps the interim
		 * BB-codes. In fallback a GFM table becomes a "show table" link whose payload carries
		 * the table data inline (see table-rules), so it survives session reloads.
		 *
		 * @param {string} text
		 * @param {object} [options]
		 * @param {string} [options.renderMode] - 'canonical' | 'fallback' (default 'fallback')
		 * @param {string} [options.tableNonce] - per-render nonce for the canonical table token
		 * @returns {string}
		 */
		decode(text, options = {})
		{
			return this.#convert(text, {
				mode: 'decode',
				renderMode: options.renderMode,
				tableNonce: options.tableNonce,
			});
		}

		/**
		 * Convert Markdown to BB-codes for preview/notification text.
		 * Tables are replaced with a localized placeholder in either render mode: simplify never
		 * produces the structural table token, so its output stays a flat string.
		 *
		 * @param {string} text
		 * @param {object} [options]
		 * @param {string} [options.renderMode] - 'canonical' | 'fallback' (default 'fallback')
		 * @returns {string}
		 */
		simplify(text, options = {})
		{
			const { renderMode = 'fallback' } = options;

			return this.#convert(text, { mode: 'simplify', renderMode });
		}

		/**
		 * @param {string} text
		 * @param {object} options
		 * @param {string} options.mode - 'decode' | 'simplify'
		 * @param {string} [options.renderMode] - 'canonical' | 'fallback'
		 * @param {string} [options.tableNonce] - per-render nonce for the canonical table token
		 * @returns {string}
		 */
		#convert(text, options)
		{
			if (!Type.isStringFilled(text))
			{
				return '';
			}

			if (!MARKDOWN_TRIGGER.test(text))
			{
				return text;
			}

			// Per-call instances to avoid shared mutable state between concurrent calls
			const escapeHandler = new EscapeHandler();
			const codeProtector = new CodeProtector();
			const mentionProtector = new MentionProtector();

			text = codeProtector.protect(text);
			text = mentionProtector.protect(text);
			text = escapeHandler.protect(text);

			// A canonical table token is built before the restores below, so its cells keep the protector
			// placeholders literal and the restores reach inside the payload; what they put back is raw
			// text and has to be encoded into the payload alphabet right after the last restore, before
			// anything else can read the token. finishTables owns both ends of that window, so the passes
			// that run in between are handed to it (see table-rules.finishTables), and so is the shape
			// each protector emits - the producer has to leave literal exactly what the restores read.
			const tableOptions = {
				mode: options.mode,
				renderMode: options.renderMode,
				tableNonce: options.tableNonce,
				// A cell is built inside the first phase, so its URL rules need the same resolver the
				// inline pass below gets: the escape restore has not run yet there either.
				resolveEscapes: (value) => escapeHandler.resolve(value),
				protectorPatterns: [
					escapeHandler.placeholderPattern,
					codeProtector.placeholderPattern,
					mentionProtector.placeholderPattern,
				],
			};

			return finishTables(text, tableOptions, (converted) => {
				let result = applyBlockRules(converted, options);

				// Canonical lists emit structural [list]/[*] tags whose '*' would otherwise be eaten
				// by the inline italic rule; hide them across the inline/html passes and restore
				// afterwards. Fallback emits no such tags, so the protector is canonical-only.
				const listTagProtector = options.renderMode === 'canonical' ? new ListTagProtector() : null;
				if (listTagProtector)
				{
					result = listTagProtector.protect(result);
				}

				// The URL rules decide on a value the escape restore has not reached yet, so they get a
				// resolver: a character the sender escaped inside an address belongs to the address
				// (CommonMark processes escapes in a link destination), and the scheme check and the
				// bracket encoding both have to see it before the tag is written.
				result = applyInlineRules(result, {
					...options,
					resolveEscapes: (value) => escapeHandler.resolve(value),
				});
				result = applyHtmlRules(result, options);

				result = escapeHandler.restore(result);
				result = mentionProtector.restore(result);
				result = codeProtector.restore(result);

				// The structural tags come back last, once every protector has put its content back: a
				// tag arriving with that content (an escaped [*], a [/list] inside a mention or a [code]
				// block) is the sender's text, not structure, and only while the emitted tags are still
				// placeholders can the two be told apart - so the protector defangs what it finds inside
				// a block and restores its own tags in one pass.
				return listTagProtector ? listTagProtector.restore(result) : result;
			});
		}
	}

	const markdownConverter = new MarkdownConverter();

	module.exports = {
		markdownConverter,
	};
});
