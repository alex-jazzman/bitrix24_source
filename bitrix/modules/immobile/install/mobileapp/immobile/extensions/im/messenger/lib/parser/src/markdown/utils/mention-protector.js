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
		#placeholderPrefix = '';
		#pattern;
		#placeholderShape;

		constructor()
		{
			// Per-instance (a fresh protector is built per render): an unpredictable nonce in
			// the placeholder stops a sender from typing a literal placeholder copy and having
			// the stored mention replicated into it on restore (amplification DoS). Mirrors the
			// web parser's createMarkdownNonce.
			const nonce = Math.random().toString(36).slice(2, 12) || 'n';

			// Single definition of the placeholder form: the marker #addMention emits, the pattern
			// restore() reads and the shape placeholderPattern hands out are all built from it, so the
			// nonce alphabet and the separator before the index stay known to this class alone.
			this.#placeholderPrefix = `${MARKDOWN_MENTION_PREFIX}${nonce}_`;
			this.#pattern = new RegExp(`${this.#placeholderPrefix}(\\d+)${MARKDOWN_PLACEHOLDER_SUFFIX}`, 'g');
			this.#placeholderShape = new RegExp(`${this.#placeholderPrefix}\\d+${MARKDOWN_PLACEHOLDER_SUFFIX}`);
		}

		/**
		 * The shape of the placeholder protect() emits, for a consumer that has to recognize one:
		 * capture-free and not global, so it can be embedded in a pattern of its own.
		 *
		 * @returns {RegExp}
		 */
		get placeholderPattern()
		{
			return this.#placeholderShape;
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

			return `${this.#placeholderPrefix}${index}${MARKDOWN_PLACEHOLDER_SUFFIX}`;
		}
	}

	module.exports = {
		MentionProtector,
	};
});
