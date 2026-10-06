/**
 * @module im/messenger/lib/parser/markdown/utils/mention-protector
 */
jn.define('im/messenger/lib/parser/markdown/utils/mention-protector', (require, exports, module) => {
	const { MARKDOWN_MENTION_PREFIX, MARKDOWN_PLACEHOLDER_SUFFIX } = require('im/messenger/lib/parser/const');

	// Container tags ([context]/[dialog]) are matched BEFORE the nested [USER]/[CHAT] they
	// may wrap, so the whole container is stored as one unit; matching a nested mention
	// first would leave its placeholder inside the stored container and single-pass restore
	// would not expand it. The `(?!\[opener)` guard bounds each lazy scan at the next
	// same-tag opener, so malformed input (many unclosed openers) stays O(n) instead of
	// rescanning the tail from every opener.
	const MENTION_PATTERNS = [
		/\[context=(?:chat\d+|\d+:\d+)\/\d+](?:(?!\[context=)[\s\S])*?\[\/context]/gi,
		/\[dialog=(?:chat\d+|\d+)(?: message=\d+)?](?:(?!\[dialog=)[\s\S])*?\[\/dialog]/gi,
		/\[USER=(?:all|\d+)(?: REPLACE)?](?:(?!\[USER=).)*?\[\/USER]/gi,
		/\[CHAT=(?:imol\|)?\d+](?:(?!\[CHAT=).)*?\[\/CHAT]/gi,
	];

	class MentionProtector
	{
		#mentions = [];
		#nonce = '';
		#pattern;

		constructor()
		{
			// Per-instance (a fresh protector is built per render): an unpredictable nonce in
			// the placeholder stops a sender from typing a literal placeholder copy and having
			// the stored mention replicated into it on restore (amplification DoS). Mirrors the
			// web parser's createMarkdownNonce.
			this.#nonce = Math.random().toString(36).slice(2, 12) || 'n';
			this.#pattern = new RegExp(`${MARKDOWN_MENTION_PREFIX}${this.#nonce}_(\\d+)${MARKDOWN_PLACEHOLDER_SUFFIX}`, 'g');
		}

		protect(text)
		{
			this.#mentions = [];

			for (const pattern of MENTION_PATTERNS)
			{
				text = text.replaceAll(pattern, (match) => this.#addMention(match));
			}

			return text;
		}

		restore(text)
		{
			if (this.#mentions.length === 0)
			{
				return text;
			}

			const mentions = this.#mentions;
			const result = text.replaceAll(
				this.#pattern,
				(match, index) => mentions[Number(index)] ?? match,
			);

			this.#mentions = [];

			return result;
		}

		#addMention(mention)
		{
			const index = this.#mentions.length;
			this.#mentions.push(mention);

			return `${MARKDOWN_MENTION_PREFIX}${this.#nonce}_${index}${MARKDOWN_PLACEHOLDER_SUFFIX}`;
		}
	}

	module.exports = {
		MentionProtector,
	};
});
