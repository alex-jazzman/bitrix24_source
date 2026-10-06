/**
 * @module im/messenger/lib/parser/markdown/converter
 */
jn.define('im/messenger/lib/parser/markdown/converter', (require, exports, module) => {
	const { Type } = require('type');
	const { CodeProtector } = require('im/messenger/lib/parser/markdown/utils/code-protector');
	const { EscapeHandler } = require('im/messenger/lib/parser/markdown/utils/escape-handler');
	const { MentionProtector } = require('im/messenger/lib/parser/markdown/utils/mention-protector');
	const { applyBlockRules } = require('im/messenger/lib/parser/markdown/rules/block-rules');
	const { applyInlineRules } = require('im/messenger/lib/parser/markdown/rules/inline-rules');
	const { applyHtmlRules } = require('im/messenger/lib/parser/markdown/rules/html-rules');
	const { convertTables } = require('im/messenger/lib/parser/markdown/rules/table-rules');

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
		 * Convert Markdown to BB-codes for full message rendering. A GFM table
		 * becomes a "show table" link whose payload carries the table data inline
		 * (see table-rules), so no in-memory store is needed and it survives
		 * session reloads.
		 *
		 * @param {string} text
		 * @returns {string}
		 */
		decode(text)
		{
			return this.#convert(text, { mode: 'decode' });
		}

		/**
		 * Convert Markdown to BB-codes for preview/notification text.
		 * Tables are replaced with a localized placeholder.
		 *
		 * @param {string} text
		 * @returns {string}
		 */
		simplify(text)
		{
			return this.#convert(text, { mode: 'simplify' });
		}

		/**
		 * @param {string} text
		 * @param {object} tableOptions
		 * @returns {string}
		 */
		#convert(text, tableOptions)
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

			text = convertTables(text, tableOptions);
			text = applyBlockRules(text);
			text = applyInlineRules(text);
			text = applyHtmlRules(text);

			text = escapeHandler.restore(text);
			text = mentionProtector.restore(text);
			text = codeProtector.restore(text);

			return text;
		}
	}

	const markdownConverter = new MarkdownConverter();

	module.exports = {
		markdownConverter,
	};
});
