import { MARKDOWN_MENTION_PREFIX, MARKDOWN_PLACEHOLDER_SUFFIX } from '../const.js';

// Container tags ([context]) are matched BEFORE the nested [USER]/[CHAT] they may
// wrap, so the whole container is stored as one unit; matching a nested mention first
// would leave its placeholder inside the stored container and single-pass restore
// would not expand it. The `(?!\[opener)` guard bounds each lazy scan at the next
// same-tag opener, so malformed input (many unclosed openers) stays O(n) instead of
// rescanning the tail from every opener.
const MENTION_PATTERNS = [
	/\[context=(?:chat\d+|\d+:\d+)\/\d+](?:(?!\[context=)[\s\S])*?\[\/context]/gi,
	/\[USER=(?:all|\d+)(?: REPLACE)?](?:(?!\[USER=).)*?\[\/USER]/gi,
	/\[CHAT=(?:imol\|)?\d+](?:(?!\[CHAT=).)*?\[\/CHAT]/gi,
];

export class MentionProtector
{
	#mentions = [];
	#nonce = '';
	#pattern: RegExp;

	constructor(nonce: string = '')
	{
		this.#nonce = nonce;
		this.#pattern = new RegExp(`${MARKDOWN_MENTION_PREFIX}${nonce}_(\\d+)${MARKDOWN_PLACEHOLDER_SUFFIX}`, 'g');
	}

	protect(text: string): string
	{
		this.#mentions = [];

		for (const pattern of MENTION_PATTERNS)
		{
			text = text.replaceAll(pattern, (match) => {
				return this.#addMention(match);
			});
		}

		return text;
	}

	restore(text: string): string
	{
		if (this.#mentions.length === 0)
		{
			return text;
		}

		const mentions = this.#mentions;
		const result = text.replaceAll(
			this.#pattern,
			(match, index) => {
				const mention = mentions[Number(index)];

				return mention === undefined ? match : mention;
			},
		);

		this.#mentions = [];

		return result;
	}

	#addMention(mention: string): string
	{
		const index = this.#mentions.length;
		this.#mentions.push(mention);

		return `${MARKDOWN_MENTION_PREFIX}${this.#nonce}_${index}${MARKDOWN_PLACEHOLDER_SUFFIX}`;
	}
}
