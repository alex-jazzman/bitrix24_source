import { MARKDOWN_CODE_PREFIX, MARKDOWN_PLACEHOLDER_SUFFIX } from '../const.js';

export class CodeProtector
{
	#blocks = [];
	#nonce = '';
	#pattern: RegExp;

	// The per-render nonce makes the placeholder (####MD_CODE_<nonce>_N####) unguessable, so
	// restore() never expands a literal copy the sender typed — only the blocks this instance
	// actually stored (amplification-DoS defense; see utils/nonce.js).
	constructor(nonce: string = '')
	{
		this.#nonce = nonce;
		this.#pattern = new RegExp(`${MARKDOWN_CODE_PREFIX}${nonce}_(\\d+)${MARKDOWN_PLACEHOLDER_SUFFIX}`, 'g');
	}

	protect(text: string, options: { looseFence?: boolean } = {}): string
	{
		this.#blocks = [];

		// BBCode code blocks: [code]...[/code] — must be protected before markdown processing
		text = text.replaceAll(/\[code]([\s\S]*?)\[\/code]/gi, (match, code) => {
			return this.#addBlock(code);
		});

		// Fenced code blocks: ```lang\n...\n``` or ~~~lang\n...\n~~~
		text = text.replaceAll(/^(`{3,})([^\n]*)\n([\S\s]*?)^\1/gm, (match, fence, lang, code) => {
			return this.#addBlock(code);
		});

		text = text.replaceAll(/^(~{3,})([^\n]*)\n([\S\s]*?)^\1/gm, (match, fence, lang, code) => {
			return this.#addBlock(code);
		});

		if (options.looseFence)
		{
			// Inline-only "loose" fenced code (decodeInline path only). The strict pattern above
			// needs the closing fence at line start; a pasted multi-line block whose closing ```
			// sits mid-line (e.g. ```Foo\nbar\nbaz```: rest) slips past it and would otherwise fall
			// through to the single-backtick inline rule and fragment into orphaned backticks plus
			// per-line inline-code boxes. Here a 3+ backtick pair whose content spans newlines is
			// captured whole as ONE [code] block; text after the closing fence stays outside it.
			// Gated to inline-only so the full message path (#convert) keeps its existing behavior.
			text = text.replaceAll(/(`{3,})([\S\s]*?)\1/g, (match, fence, code) => {
				if (!code.includes('\n'))
				{
					return match;
				}

				return this.#addBlock(code);
			});
		}

		// Indented code blocks: line starting with 4 spaces or tab, preceded by empty line
		text = text.replaceAll(/(^|\n)\n((?:(?: {4}|\t).+(?:\n|$))+)/g, (match, prefix, block) => {
			const code = block.replaceAll(/^(?: {4}|\t)/gm, '');

			return `${prefix}\n${this.#addBlock(code)}`;
		});

		return text;
	}

	restore(text: string): string
	{
		if (this.#blocks.length === 0)
		{
			return text;
		}

		const blocks = this.#blocks;
		const result = text.replaceAll(
			this.#pattern,
			(match, index) => {
				const block = blocks[Number(index)];

				// A user-typed literal "####MD_CODE_N####" (or an out-of-range index)
				// has no stored block — leave the marker untouched instead of emitting
				// [code]undefined[/code] or duplicating an unrelated block.
				return block === undefined ? match : `[code]${block}[/code]`;
			},
		);

		this.#blocks = [];

		return result;
	}

	#addBlock(code: string): string
	{
		const index = this.#blocks.length;
		this.#blocks.push(code.replace(/\n$/, ''));

		return `${MARKDOWN_CODE_PREFIX}${this.#nonce}_${index}${MARKDOWN_PLACEHOLDER_SUFFIX}`;
	}
}
