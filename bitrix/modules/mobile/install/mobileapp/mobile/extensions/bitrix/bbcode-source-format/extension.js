/**
 * @module bbcode-source-format
 *
 * Hand-written mobile utility for source-safe inline BBCode editing.
 *
 * The native `TextInput` element exposes no getter for its BBCode source and does not emit
 * `onChangeText` for formatting-only actions, so applying a BIUS style to an existing selection
 * has to be reflected in the source string in JS. `toggleFormatting` does exactly that around a
 * plain-text selection while preserving URL spans.
 *
 * Reusable by any consumer that edits BBCode through the native `TextInput` (checklist titles,
 * task description editor, etc.). Candidate for promotion into `ui.bbcode` (generated web + mobile).
 */
jn.define('bbcode-source-format', (require, exports, module) => {
	const { BBCodeEncoder } = require('bbcode/encoder');

	const bbCodeEncoder = new BBCodeEncoder();

	const FORMATTING_TAGS = ['b', 'i', 'u', 's'];

	/**
	 * Toggle a BIUS tag around the plain-text selection inside a BBCode source string.
	 *
	 * @param {string} source - raw BBCode source (e.g. `[s]text[/s]`)
	 * @param {number} plainStart - selection start in plain-text coordinates
	 * @param {number} plainEnd - selection end in plain-text coordinates
	 * @param {'b' | 'i' | 'u' | 's'} tagName
	 * @return {string | null} new source, or null when nothing can be toggled (no selection or unsupported markup)
	 */
	const toggleFormatting = (source, plainStart, plainEnd, tagName) => {
		if (!FORMATTING_TAGS.includes(tagName))
		{
			return null;
		}

		const cells = parseSourceCells(source);
		if (cells === null)
		{
			return null;
		}

		const start = Math.max(0, Math.min(plainStart, cells.length));
		const end = Math.max(0, Math.min(plainEnd, cells.length));

		if (end <= start)
		{
			return null;
		}

		const isActiveInWholeRange = cells
			.slice(start, end)
			.every((cell) => cell.styles[tagName]);

		for (let index = start; index < end; index++)
		{
			cells[index].styles[tagName] = !isActiveInWholeRange;
		}

		return serializeSourceCells(cells);
	};

	/**
	 * Build a per-plain-character model of the source, preserving URL spans.
	 * Returns null when the source contains unsupported markup.
	 *
	 * @param {string} source
	 * @return {Array<{ char: string, styles: Object, inUrl: boolean, url: string | null }> | null}
	 */
	const parseSourceCells = (source) => {
		const cells = [];
		let index = 0;
		const active = { b: 0, i: 0, u: 0, s: 0 };
		const urlStack = [];

		while (index < source.length)
		{
			const tag = readSourceTag(source, index);
			if (tag)
			{
				if (FORMATTING_TAGS.includes(tag.name))
				{
					if (tag.closing)
					{
						active[tag.name] = Math.max(0, active[tag.name] - 1);
					}
					else
					{
						active[tag.name] += 1;
					}
					index = tag.end;
					continue;
				}

				if (tag.name === 'url')
				{
					if (tag.closing)
					{
						urlStack.pop();
					}
					else
					{
						urlStack.push(tag.attr);
					}
					index = tag.end;
					continue;
				}

				// Unsupported markup — bail to avoid corrupting the source.
				return null;
			}

			const encoded = readEncodedSquareBracket(source, index);
			const char = encoded ? encoded.value : source[index];
			index = encoded ? encoded.end : index + 1;

			cells.push({
				char,
				styles: {
					b: active.b > 0,
					i: active.i > 0,
					u: active.u > 0,
					s: active.s > 0,
				},
				inUrl: urlStack.length > 0,
				url: urlStack.length > 0 ? urlStack[urlStack.length - 1] : null,
			});
		}

		return cells;
	};

	/**
	 * @param {Array<Object>} cells
	 * @return {string}
	 */
	const serializeSourceCells = (cells) => {
		let result = '';
		let index = 0;

		while (index < cells.length)
		{
			const { inUrl, url } = cells[index];
			let end = index;
			while (end < cells.length && cells[end].inUrl === inUrl && cells[end].url === url)
			{
				end += 1;
			}

			const inner = serializeStyleRuns(cells.slice(index, end));
			if (inUrl)
			{
				result += (url ? `[url=${url}]` : '[url]') + inner + '[/url]';
			}
			else
			{
				result += inner;
			}

			index = end;
		}

		return result;
	};

	/**
	 * @param {Array<Object>} cells
	 * @return {string}
	 */
	const serializeStyleRuns = (cells) => {
		let result = '';
		let index = 0;

		while (index < cells.length)
		{
			const { styles } = cells[index];
			let end = index;
			while (end < cells.length && sameStyles(cells[end].styles, styles))
			{
				end += 1;
			}

			const text = bbCodeEncoder.encodeText(
				cells.slice(index, end).map((cell) => cell.char).join(''),
			);

			let open = '';
			let close = '';
			FORMATTING_TAGS.forEach((tag) => {
				if (styles[tag])
				{
					open += `[${tag}]`;
				}
			});
			[...FORMATTING_TAGS].reverse().forEach((tag) => {
				if (styles[tag])
				{
					close += `[/${tag}]`;
				}
			});

			result += open + text + close;
			index = end;
		}

		return result;
	};

	/**
	 * @param {Object} a
	 * @param {Object} b
	 * @return {boolean}
	 */
	const sameStyles = (a, b) => a.b === b.b && a.i === b.i && a.u === b.u && a.s === b.s;

	/**
	 * @param {string} source
	 * @param {number} index
	 * @return {{ end: number, closing: boolean, name: string, attr: string | null } | null}
	 */
	const readSourceTag = (source, index) => {
		if (source[index] !== '[')
		{
			return null;
		}

		const end = source.indexOf(']', index + 1);
		if (end === -1)
		{
			return null;
		}

		const raw = source.slice(index + 1, end).trim();
		const match = raw.match(/^(\/?)(\w+|\*)(?:=(.*))?$/);
		if (!match)
		{
			return null;
		}

		return {
			end: end + 1,
			closing: match[1] === '/',
			name: match[2].toLowerCase(),
			attr: match[3] === undefined ? null : match[3].trim(),
		};
	};

	/**
	 * @param {string} source
	 * @param {number} index
	 * @return {{ end: number, value: string } | null}
	 */
	const readEncodedSquareBracket = (source, index) => {
		if (source.startsWith('&#91;', index))
		{
			return { end: index + 5, value: '[' };
		}

		if (source.startsWith('&#93;', index))
		{
			return { end: index + 5, value: ']' };
		}

		return null;
	};

	module.exports = { toggleFormatting };
});
