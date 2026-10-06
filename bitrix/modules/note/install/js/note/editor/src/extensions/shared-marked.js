import { Marked } from 'marked';
import { decodeHtmlEntities, Extension } from '@tiptap/core';
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
				text: src.slice(1, assetLength + 1),
			};
		},
	},
});

// Workaround for @tiptap/markdown bug: MarkdownManager.createLexer() calls
// `new this.markedInstance.Lexer()` without passing instance defaults, so
// custom block tokenizers (callout, enrichedAsset) registered via .use()
// are lost in the created Lexer. Override .Lexer to auto-inject current
// defaults when no options are provided.
const OriginalLexer = _sharedMarked.Lexer;
const markedRef = _sharedMarked;

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

_sharedMarked.Lexer = class PatchedLexer extends OriginalLexer {
	constructor(options?: Object)
	{
		super(options ?? markedRef.defaults);
	}

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

export const MarkdownEscapeParser: Object = Extension.create({
	name: 'markdownEscapeParser',
	markdownTokenName: 'escape',
	parseMarkdown(token, h)
	{
		return h.createTextNode(decodeHtmlEntities(String(token.text ?? '')));
	},
});

const escapedTextNodes: WeakSet<Object> = new WeakSet();
const MARKDOWN_PUNCTUATION_RE = /[!-/:-@[-`{-~]/;

function buildEscapedText(
	text: string,
	offsets: Set<number>,
): { escaped: string, originalOffsets: Array<number | null> }
{
	const escaped = [];
	const originalOffsets = [];
	for (let offset = 0; offset < text.length; offset++)
	{
		if (offsets.has(offset))
		{
			escaped.push('\\');
			originalOffsets.push(null);
		}
		escaped.push(text[offset]);
		originalOffsets.push(offset);
	}

	return { escaped: escaped.join(''), originalOffsets };
}

function collectMarkdownEscapeOffsets(text: string): Set<number>
{
	const offsets: Set<number> = new Set();
	const assetRanges = [
		...findNoteAssetMatches(text, true),
		...parseAllEnrichedAssets(text),
	];

	for (let offset = 0; offset < text.length; offset++)
	{
		if (text[offset] === '\\' || text[offset] === '|')
		{
			offsets.add(offset);
		}
	}

	for (const { start } of assetRanges)
	{
		offsets.add(start);
	}

	const baseline = buildEscapedText(text, offsets);
	let tokenOffset = 0;
	for (const token of new sharedMarked.Lexer().inlineTokens(baseline.escaped))
	{
		const raw = String(token?.raw ?? '');
		if (!['text', 'escape'].includes(token?.type))
		{
			for (let rawOffset = 0; rawOffset < raw.length; rawOffset++)
			{
				if (!MARKDOWN_PUNCTUATION_RE.test(raw[rawOffset]))
				{
					break;
				}

				const originalOffset = baseline.originalOffsets[tokenOffset + rawOffset];
				if (originalOffset !== null && originalOffset !== undefined)
				{
					offsets.add(originalOffset);
				}
			}
		}
		tokenOffset += raw.length;
	}

	return offsets;
}

function escapeMarkdownText(text: string): string
{
	const offsets = collectMarkdownEscapeOffsets(text);
	const escaped = [];
	for (let offset = 0; offset < text.length; offset++)
	{
		if (offsets.has(offset))
		{
			escaped.push('\\');
		}
		escaped.push(text[offset]);
	}

	return escaped.join('');
}

function haveSameMarks(left, right): boolean
{
	return JSON.stringify(left?.marks ?? []) === JSON.stringify(right?.marks ?? []);
}

export function escapeInlineText(nodes: ?Object[]): Object[]
{
	const escapedNodes = [];
	for (const sourceNode of nodes ?? [])
	{
		const node = escapedTextNodes.has(sourceNode)
			? sourceNode
			: sourceNode?.type === 'text'
			? { ...sourceNode }
			: Array.isArray(sourceNode?.content) && sourceNode.type !== 'codeBlock'
			? { ...sourceNode, content: escapeInlineText(sourceNode.content) }
			: sourceNode
		;
		const previous = escapedNodes.at(-1);
		if (
			node?.type === 'text'
			&& previous?.type === 'text'
			&& haveSameMarks(previous, node)
			&& !escapedTextNodes.has(previous)
			&& !escapedTextNodes.has(node)
		)
		{
			previous.text = `${previous.text ?? ''}${node.text ?? ''}`;
			continue;
		}

		escapedNodes.push(node);
	}

	return escapedNodes.map((node) => {
		if (
			node?.type !== 'text'
			|| escapedTextNodes.has(node)
			|| node.marks?.some(({ type }) => type === 'code')
		)
		{
			return node;
		}

		const escapedNode = {
			...node,
			text: escapeMarkdownText(String(node.text ?? '')),
		};
		escapedTextNodes.add(escapedNode);

		return escapedNode;
	});
}
