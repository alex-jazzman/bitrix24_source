import { Marked } from 'marked';
import { decodeHtmlEntities } from '@tiptap/core';
import { parseAllEnrichedAssets } from './attachments/enriched-asset-parser';
import {
	findNoteAssetMatches,
	isEscapedAt,
} from './attachments/note-asset-parser';

/**
 * Shared Marked instance for the note editor.
 *
 * CONTRACT: Every custom block-level tokenizer extension (e.g. EnrichedAssetTokenizer,
 * Callout) MUST be registered via the @tiptap/markdown extensions list in registry.js.
 * Registration happens automatically: MarkdownManager.registerTokenizer() calls
 * markedInstance.use() on this shared instance.
 *
 * This matters because recursive lexing (e.g. sharedMarked.lexer() inside callout body
 * parsing) only sees tokenizers that have been registered with this instance.
 *
 * If you add a new block tokenizer:
 *   1. Create the extension with a `markdownTokenizer` property
 *   2. Add it to the extensions array in registry.js (createEditorExtensions)
 *   3. Verify it works inside a callout body — that exercises recursive lexing
 *
 * The instance disables HTML tokenization (treats <tag> as plain text).
 * Assumes marked ^17.0.x (bundled via @tiptap/markdown).
 */
const _sharedMarked: Object = new Marked({
	tokenizer: {
		// Disable HTML tokenization — treat <tag> as plain text
		html() {},
		tag() {},
		escape(src: string)
		{
			if (!src.startsWith('\\'))
			{
				return undefined;
			}

			const escapeAssetLengths = this.escapeAssetLengthsStack?.at(-1);
			const assetLength = escapeAssetLengths?.get(src.length) ?? 0;
			if (assetLength === 0)
			{
				const escapedPunctuation = /^\\([!-/:-@[-`{-~])/.exec(src);
				return escapedPunctuation
					? { type: 'escape', raw: escapedPunctuation[0], text: escapedPunctuation[1] }
					: undefined
				;
			}

			return {
				type: 'escape',
				raw: src.slice(0, assetLength + 1),
				// The library decodes entities for a `text` token but not for an `escape` one, and a
				// legacy run was stored with them encoded: without decoding here `&amp;` reaches the
				// document as five characters and the reader sees it instead of `&`.
				text: decodeHtmlEntities(src.slice(1, assetLength + 1)),
			};
		},
	},
});

const OriginalLexer = _sharedMarked.Lexer;

function collectEscapedAssetLengths(src: string): Map<number, number>
{
	const assetLengths = new Map();
	if (!src.includes('\\[') && !src.includes('\\!['))
	{
		return assetLengths;
	}

	const matches = [
		...findNoteAssetMatches(src, true),
		...parseAllEnrichedAssets(src),
	];
	for (const { start, end } of matches)
	{
		if (!isEscapedAt(src, start))
		{
			continue;
		}

		const remainingLength = src.length - start + 1;
		assetLengths.set(
			remainingLength,
			Math.max(assetLengths.get(remainingLength) ?? 0, end - start),
		);
	}

	return assetLengths;
}

// Documents saved before the upgrade carry a single backslash in front of an asset run - the module
// escaped it itself back then. Reading them still needs the lengths of those runs, so the stack the
// `escape` tokenizer reads is filled here, around the inline pass that consumes it.
_sharedMarked.Lexer = class AssetAwareLexer extends OriginalLexer {
	inlineTokens(src: string, tokens?: Object[]): Object[]
	{
		this.tokenizer.escapeAssetLengthsStack ??= [];
		this.tokenizer.escapeAssetLengthsStack.push(collectEscapedAssetLengths(src));
		try
		{
			return super.inlineTokens(src, tokens);
		}
		finally
		{
			this.tokenizer.escapeAssetLengthsStack.pop();
		}
	}
};

export const sharedMarked: Object = _sharedMarked;


// The only escaping the module still does: a vertical bar typed into the plain text of a table
// cell. The library escapes ``\`` `` ` `` ``*`` ``_`` ``[`` ``]`` ``~`` on its own since
// @tiptap/markdown 3.25.0 and handles the bar inside a code span of a table row itself, but a bar
// in ordinary cell text still splits the row and swallows the next cell.
//
// Applied to the string the library has already rendered for a cell, never to its internals: code
// spans are copied through untouched, and a bar that already carries a backslash is left as it is.
//
// Not to be confused with the library's own `escapeTableCellPipes`, which covers the opposite half -
// the inside of a code span, and on the parsing side.
export function escapeTableCellPlainPipes(rendered: string): string
{
	const text = String(rendered ?? '');
	let escaped = '';
	let offset = 0;
	while (offset < text.length)
	{
		const char = text[offset];
		if (char === '\\')
		{
			escaped += text.slice(offset, offset + 2);
			offset += 2;
			continue;
		}

		if (char === '`')
		{
			let fenceEnd = offset;
			while (text[fenceEnd] === '`')
			{
				fenceEnd += 1;
			}
			const fence = text.slice(offset, fenceEnd);
			const closing = text.indexOf(fence, fenceEnd);
			if (closing === -1)
			{
				// Backticks with no pair are ordinary characters, the way marked reads them - taking
				// them for a span that runs to the end of the cell would leave every bar after them
				// unescaped, and the row would split there.
				escaped += fence;
				offset = fenceEnd;
				continue;
			}

			const end = closing + fence.length;
			escaped += text.slice(offset, end);
			offset = end;
			continue;
		}

		escaped += char === '|' ? '\\|' : char;
		offset += 1;
	}

	return escaped;
}
