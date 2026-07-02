/**
 * @module im/messenger/lib/parser/markdown/converter
 */
jn.define('im/messenger/lib/parser/markdown/converter', (require, exports, module) => {
	const { Type } = require('type');
	const { CodeProtector } = require('im/messenger/lib/parser/markdown/utils/code-protector');
	const { EscapeHandler } = require('im/messenger/lib/parser/markdown/utils/escape-handler');
	const { applyBlockRules } = require('im/messenger/lib/parser/markdown/rules/block-rules');
	const { applyInlineRules } = require('im/messenger/lib/parser/markdown/rules/inline-rules');
	const { applyHtmlRules } = require('im/messenger/lib/parser/markdown/rules/html-rules');
	const { convertTables } = require('im/messenger/lib/parser/markdown/rules/table-rules');

	// Every Markdown construct requires at least one of these characters.
	// Safe to skip the entire pipeline when none are present.
	const MARKDOWN_TRIGGER = /[\t!#&*+<=>[\\_`|~-]/;

	class MarkdownConverter
	{
		/** @type {Map<string, Map<string, { headers: string[], rows: string[][] }>>} */
		#tableDataStore = new Map();

		/**
		 * Convert Markdown to BB-codes for full message rendering.
		 * Tables are stored in memory and replaced with clickable links.
		 *
		 * @param {string} text
		 * @param {number|string} [messageId=0]
		 * @param {string} [dialogCode='']
		 * @returns {string}
		 */
		decode(text, messageId = 0, dialogCode = '')
		{
			return this.#convert(text, {
				mode: 'decode',
				messageId,
				storeTableData: (messageIdToStore, tableIndex, data) => {
					return this.#storeTableData(dialogCode, messageIdToStore, tableIndex, data);
				},
			});
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

			text = codeProtector.protect(text);
			text = escapeHandler.protect(text);

			text = convertTables(text, tableOptions);
			text = applyBlockRules(text);
			text = applyInlineRules(text);
			text = applyHtmlRules(text);

			text = escapeHandler.restore(text);
			text = codeProtector.restore(text);

			return text;
		}

		/**
		 * @param {string} dialogCode
		 * @param {number|string} messageId
		 * @param {number} tableIndex
		 * @param {{ headers: string[], rows: string[][] }} data
		 * @returns {string}
		 */
		#storeTableData(dialogCode, messageId, tableIndex, data)
		{
			if (!messageId)
			{
				return '';
			}

			const tableId = `${messageId}:${tableIndex}`;

			if (!this.#tableDataStore.has(dialogCode))
			{
				this.#tableDataStore.set(dialogCode, new Map());
			}

			this.#tableDataStore.get(dialogCode).set(tableId, data);

			return tableId;
		}

		/**
		 * @param {string} dialogCode
		 * @param {string} tableId
		 * @returns {{ headers: string[], rows: string[][] } | null}
		 */
		getTableData(dialogCode, tableId)
		{
			return this.#tableDataStore.get(dialogCode)?.get(tableId) || null;
		}

		/**
		 * @param {string} dialogCode
		 */
		clearTableData(dialogCode)
		{
			this.#tableDataStore.delete(dialogCode);
		}
	}

	const markdownConverter = new MarkdownConverter();

	module.exports = {
		markdownConverter,
		getMarkdownTableData: (dialogCode, tableId) => markdownConverter.getTableData(dialogCode, tableId),
		clearTableData: (dialogCode) => markdownConverter.clearTableData(dialogCode),
	};
});
