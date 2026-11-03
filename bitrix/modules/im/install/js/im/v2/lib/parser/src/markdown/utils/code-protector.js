import { MARKDOWN_CODE_PREFIX, MARKDOWN_PLACEHOLDER_SUFFIX, NEW_LINE } from '../const.js';

const BACKTICK = '`';
const TILDE = '~';
const FENCE_MIN_LENGTH = 3;
const LOOSE_FENCE_OPENING = BACKTICK.repeat(FENCE_MIN_LENGTH);

export class CodeProtector
{
	#blocks = [];
	#nonce = '';
	#pattern: RegExp;
	#placeholderDetector: RegExp;

	// Placeholder: ####MD_CODE_<nonce>_N####. Why it carries a nonce - utils/nonce.js.
	constructor(nonce: string = '')
	{
		this.#nonce = nonce;
		const placeholder = `${MARKDOWN_CODE_PREFIX}${nonce}_(\\d+)${MARKDOWN_PLACEHOLDER_SUFFIX}`;
		this.#pattern = new RegExp(placeholder, 'g');
		this.#placeholderDetector = new RegExp(placeholder);
	}

	protect(text: string, options: { looseFence?: boolean } = {}): string
	{
		this.#blocks = [];

		// BBCode code blocks: [code]...[/code] — must be protected before markdown processing
		text = text.replaceAll(/\[code]([\s\S]*?)\[\/code]/gi, (match, code) => {
			return this.#addBlock(code);
		});

		// Fenced code blocks: ```lang\n...\n``` or ~~~lang\n...\n~~~
		text = this.#protectStrictFences(text, BACKTICK);
		text = this.#protectStrictFences(text, TILDE);

		if (options.looseFence)
		{
			text = this.#protectLooseFences(text);
		}

		// Indented code blocks: line starting with 4 spaces or tab, preceded by empty line
		text = text.replaceAll(/(^|\n)\n((?:(?: {4}|\t).+(?:\n|$))+)/g, (match, prefix, block) => {
			// The whole run is held back, not just the line carrying the placeholder: splitting it
			// would render one indented block as two code boxes around a bare line, and de-indenting
			// that line would expose it to the heading/quote/rule block rules. The indent staying
			// visible is the price of keeping both the text and the block it already holds intact.
			if (this.#holdsPlaceholder(block))
			{
				return match;
			}

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

				// Unknown index = a marker the sender typed, not one we stored (utils/nonce.js).
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

	// Both fence forms are scanned instead of matched with /^(`{3,})([^\n]*)\n([\S\s]*?)^\1/gm.
	// A backreference to a series of variable length makes the engine retry every opening length
	// over the whole text, which is quadratic: a message of 12000 backticks cost 0.3 s per render,
	// and every message of every chat goes through this method.
	#protectStrictFences(text: string, fenceChar: string): string
	{
		let result = '';
		let position = 0;
		let lineStart = 0;

		while (lineStart !== -1 && lineStart < text.length)
		{
			const openLength = CodeProtector.#fenceEnd(text, lineStart, fenceChar) - lineStart;
			if (openLength < FENCE_MIN_LENGTH)
			{
				lineStart = CodeProtector.#nextLineStart(text, lineStart);
				continue;
			}

			// The code starts on the line below the opening fence, so the rest of the opening line
			// (the language marker) is dropped together with the fence itself.
			const codeStart = CodeProtector.#nextLineStart(text, lineStart);
			if (codeStart === -1)
			{
				break;
			}

			const closing = CodeProtector.#findClosingLine(text, codeStart, openLength, fenceChar);
			if (closing === null)
			{
				// No line below opens with a fence at all, so no later opening can be closed either.
				break;
			}

			result += text.slice(position, lineStart);
			result += this.#addBlock(text.slice(codeStart, closing.start));
			position = closing.start + closing.length;
			lineStart = CodeProtector.#nextLineStart(text, position);
		}

		return result + text.slice(position);
	}

	// "Loose" fenced code, enabled by both markdown paths (#convert and decodeInline). The strict
	// pass above needs the closing fence at line start; a pasted multi-line block whose closing ```
	// sits mid-line (e.g. ```Foo\nbar\nbaz```: rest) slips past it and would otherwise fall through
	// to the single-backtick inline rule and fragment into orphaned backticks plus per-line
	// inline-code boxes. Here a 3+ backtick pair whose content spans newlines is captured whole as
	// ONE [code] block; text after the closing fence stays outside it. A single-line span has no
	// newline and keeps its inline-code rendering.
	#protectLooseFences(text: string): string
	{
		let result = '';
		let position = 0;

		while (position < text.length)
		{
			const openStart = text.indexOf(LOOSE_FENCE_OPENING, position);
			if (openStart === -1)
			{
				break;
			}

			const openEnd = CodeProtector.#fenceEnd(text, openStart, BACKTICK);
			const closing = CodeProtector.#findClosingFence(text, openEnd, openEnd - openStart);
			if (closing === null)
			{
				result += text.slice(position, openEnd);
				position = openEnd;
				continue;
			}

			// A trimmed fence leaves the extra backticks of the opening series inside the code.
			const code = text.slice(openStart + closing.length, closing.start);
			const spanEnd = closing.start + closing.length;
			const isBlock = code.includes(NEW_LINE) && !this.#holdsPlaceholder(code);

			result += text.slice(position, openStart);
			result += isBlock ? this.#addBlock(code) : text.slice(openStart, spanEnd);
			position = spanEnd;
		}

		return result + text.slice(position);
	}

	// A span that already carries a placeholder of this instance is never stored as a block:
	// restore() runs over the text once, so a placeholder kept inside a block would reach the user
	// verbatim and the code it stands for would be lost. Only the full per-render format counts —
	// a bare "####MD_CODE_" typed by the sender is ordinary code and must stay convertible.
	#holdsPlaceholder(code: string): boolean
	{
		return this.#placeholderDetector.test(code);
	}

	// The closing series must open a line and be at least as long as the opening one. When no line
	// below is that long, the opening series is trimmed to the longest one there is - the greedy
	// group of the old pattern did the same by backtracking to a shorter fence.
	static #findClosingLine(
		text: string,
		from: number,
		openLength: number,
		fenceChar: string,
	): { start: number, length: number } | null
	{
		let lineStart = from;
		let longestStart = -1;
		let longestLength = 0;

		while (lineStart !== -1 && lineStart < text.length)
		{
			const length = CodeProtector.#fenceEnd(text, lineStart, fenceChar) - lineStart;
			if (length >= openLength)
			{
				return { start: lineStart, length: openLength };
			}

			if (length > longestLength)
			{
				longestStart = lineStart;
				longestLength = length;
			}

			lineStart = CodeProtector.#nextLineStart(text, lineStart);
		}

		return longestLength < FENCE_MIN_LENGTH ? null : { start: longestStart, length: longestLength };
	}

	// Same rule for a loose fence, which may close anywhere rather than at a line start. Trimming
	// stops halfway through the opening series: a fence shorter than what it leaves behind would be
	// closed by that leftover right away and capture nothing.
	static #findClosingFence(text: string, from: number, openLength: number): { start: number, length: number } | null
	{
		let index = from;
		let longestStart = -1;
		let longestLength = 0;

		while (index < text.length)
		{
			const start = text.indexOf(BACKTICK, index);
			if (start === -1)
			{
				break;
			}

			const end = CodeProtector.#fenceEnd(text, start, BACKTICK);
			const length = end - start;
			if (length >= openLength)
			{
				return { start, length: openLength };
			}

			if (length > longestLength)
			{
				longestStart = start;
				longestLength = length;
			}

			index = end;
		}

		if (longestLength < FENCE_MIN_LENGTH || longestLength <= openLength - longestLength)
		{
			return null;
		}

		return { start: longestStart, length: longestLength };
	}

	static #fenceEnd(text: string, start: number, fenceChar: string): number
	{
		let end = start;
		while (end < text.length && text[end] === fenceChar)
		{
			end++;
		}

		return end;
	}

	static #nextLineStart(text: string, from: number): number
	{
		const lineEnd = text.indexOf(NEW_LINE, from);

		return lineEnd === -1 ? -1 : lineEnd + 1;
	}
}
