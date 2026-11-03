import { MARKDOWN_URL_PREFIX, MARKDOWN_PLACEHOLDER_SUFFIX } from '../const.js';

// Hides a link/image destination behind a placeholder for the span of the inline rules, then
// restores it byte-for-byte. Without it a URL carrying Markdown-significant characters
// (`*`, `_`, balanced parens, percent-escapes) is reparsed by the bold/italic/link rules that
// run after applyImage/applyLink and corrupted before it reaches the [URL=...]/[img] tag.
//
// Unlike MentionProtector.protect (one call over the whole text), protect() here is invoked
// once per matched destination and appends to the instance store; restore() expands every
// placeholder of this instance and clears it. One instance is shared across a whole converter
// call (full inline pass + table cells + list items) and restored once, after applyHtmlRules.
export class UrlProtector
{
	#urls = [];
	#nonce = '';
	#pattern: RegExp;

	// Placeholder: ####MD_URL_<nonce>_<index>####. Why it carries a nonce - utils/nonce.js.
	constructor(nonce: string = '')
	{
		this.#nonce = nonce;
		this.#pattern = new RegExp(`${MARKDOWN_URL_PREFIX}${nonce}_(\\d+)${MARKDOWN_PLACEHOLDER_SUFFIX}`, 'g');
	}

	protect(url: string): string
	{
		const index = this.#urls.length;
		this.#urls.push(url);

		return `${MARKDOWN_URL_PREFIX}${this.#nonce}_${index}${MARKDOWN_PLACEHOLDER_SUFFIX}`;
	}

	restore(text: string): string
	{
		if (this.#urls.length === 0)
		{
			return text;
		}

		const urls = this.#urls;
		const result = text.replaceAll(
			this.#pattern,
			(match, index) => {
				const url = urls[Number(index)];

				// Unknown index = a marker the sender typed, not one we stored (utils/nonce.js).
				return url === undefined ? match : url;
			},
		);

		this.#urls = [];

		return result;
	}
}
