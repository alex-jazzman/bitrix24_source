import { Bold } from '@tiptap/extension-bold';
import { Italic } from '@tiptap/extension-italic';
import { Strike } from '@tiptap/extension-strike';
import { Underline } from '@tiptap/extension-underline';
import { Code } from '@tiptap/extension-code';
import { CodeBlock } from './code-block/code-block-extension';
import { Blockquote } from '@tiptap/extension-blockquote';
import { Callout } from './callout-extension';
import { BulletList } from '@tiptap/extension-bullet-list';
import { OrderedList } from '@tiptap/extension-ordered-list';
import { ListItem } from '@tiptap/extension-list-item';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import { Highlight } from '@tiptap/extension-highlight';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Typography } from '@tiptap/extension-typography';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle, Color } from '@tiptap/extension-text-style';
import { Link } from '@tiptap/extension-link';
import { InputRule } from '@tiptap/core';
import { sanitizeUrl } from '../utils/url';
import { Lexer } from 'marked';

// Single `[text](url)` markdown link, not the `[[image ...]]` asset syntax (double bracket) —
// the lookbehind rejects a `[` immediately before ours without consuming it (range.from must stay
// exactly at the opening `[`, see @tiptap/core InputRule.ts `range.from = from - (match[0].length - text.length)`).
// URL group stops at the first ')' or whitespace — full parenthesized URLs are handled on paste (P3.T2).
const LINK_MD_INPUT_RULE = /(?<!\[)\[([^[\]\n]+)\]\(([^)\s]+)\)$/;

function isInsideCodeBlock(state: Object): boolean
{
	const { $from } = state.selection;
	for (let depth = $from.depth; depth >= 0; depth--)
	{
		if ($from.node(depth).type.name === 'codeBlock')
		{
			return true;
		}
	}

	return false;
}

function rangeHasLinkMark(state: Object, from: number, to: number): boolean
{
	const linkMarkType = state.schema.marks.link;

	return state.doc.rangeHasMark(from, to, linkMarkType);
}

function rangeHasCodeMark(state: Object, from: number, to: number): boolean
{
	const codeMarkType = state.schema.marks.code;

	return state.doc.rangeHasMark(from, to, codeMarkType);
}

const LinkWithInputRule = Link.extend({
	// Base Link is inclusive when autolink is on, which makes typing at a link's end grow the link
	// and traps the caret. Force non-inclusive: autolink still works via appendTransaction on whitespace.
	inclusive()
	{
		return false;
	},
	// One-shot handoff to the floating popup: the range of a link just created by the markdown
	// input rule. The popup consumes and clears it to suppress its own auto-open (see
	// link-floating-popup.js syncVisibilityWithCaret) — a typing conversion is not an explicit
	// "edit this link" interaction, so the popup must stay closed until the user clicks/re-enters.
	addStorage()
	{
		return { suppressPopupRange: null };
	},
	addInputRules()
	{
		const extension = this;

		return [
			new InputRule({
				find: LINK_MD_INPUT_RULE,
				handler: ({ state, range, match }) => {
					const text = match[1];
					const raw = match[2];
					if (!text)
					{
						return null;
					}

					const href = sanitizeUrl(raw);
					if (!href)
					{
						return null;
					}

					// Code excludes 'link' in the schema (excludes: 'code link'), so letting this rule fire
					// inside inline code would silently replace the code mark with a link.
					if (
						isInsideCodeBlock(state)
						|| rangeHasLinkMark(state, range.from, range.to)
						|| rangeHasCodeMark(state, range.from, range.to)
					)
					{
						return null;
					}

					const { tr } = state;
					const linkMarkType = state.schema.marks.link;
					tr.insertText(text, range.from, range.to);
					tr.addMark(range.from, range.from + text.length, linkMarkType.create({ href }));
					tr.removeStoredMark(linkMarkType);
					extension.storage.suppressPopupRange = { from: range.from, to: range.from + text.length };
				},
			}),
		];
	},
});

function ensureParagraphInlineTokens(tokens)
{
	const lexer = new Lexer();

	return tokens.map((t) => {
		if (t.type === 'paragraph' && t.text && (!t.tokens || t.tokens.length === 0))
		{
			return { ...t, tokens: lexer.inlineTokens(t.text) };
		}

		return t;
	});
}

const SafeListItem = ListItem.extend({
	parseMarkdown: (token, helpers) => {
		if (token.type !== 'list_item')
		{
			return [];
		}

		let content = [];

		if (token.tokens && token.tokens.length > 0)
		{
			const normalizedTokens = token.tokens.map((t) => {
				if (t.type === 'heading')
				{
					return { ...t, type: 'paragraph' };
				}

				if (t.type === 'text')
				{
					return { ...t, type: 'paragraph' };
				}

				return t;
			});

			const hasParagraphTokens = normalizedTokens.some((t) => t.type === 'paragraph');

			if (hasParagraphTokens)
			{
				content = helpers.parseChildren(ensureParagraphInlineTokens(normalizedTokens));
			}
			else
			{
				const firstToken = normalizedTokens[0];
				if (firstToken && firstToken.type === 'text')
				{
					let inlineTokens = firstToken.tokens;
					if (!inlineTokens || inlineTokens.length === 0)
					{
						const lexer = new Lexer();
						inlineTokens = lexer.inlineTokens(firstToken.text || '');
					}
					const inlineContent = inlineTokens.length > 0
						? helpers.parseInline(inlineTokens)
						: [{ type: 'text', text: firstToken.text || '' }];

					content = [
						{ type: 'paragraph', content: inlineContent },
					];

					if (normalizedTokens.length > 1)
					{
						const additionalContent = helpers.parseChildren(normalizedTokens.slice(1));
						content.push(...additionalContent);
					}
				}
				else
				{
					content = helpers.parseChildren(normalizedTokens);
				}
			}
		}

		if (content.length === 0)
		{
			content = [{ type: 'paragraph', content: [] }];
		}

		return { type: 'listItem', content };
	},
});

const CleanOrderedList = OrderedList.extend({
	markdownTokenizer: null,
	parseMarkdown: (token, helpers) => {
		if (token.type !== 'list' || !token.ordered)
		{
			return [];
		}

		const content = token.items ? helpers.parseChildren(token.items) : [];
		const startValue = token.start || 1;

		if (startValue !== 1)
		{
			return {
				type: 'orderedList',
				attrs: { start: startValue },
				content,
			};
		}

		return {
			type: 'orderedList',
			content,
		};
	},
});

const CustomHorizontalRule = HorizontalRule.extend({
	renderHTML({ HTMLAttributes })
	{
		return ['div', { ...HTMLAttributes, 'data-type': 'horizontalRule' }, ['hr']];
	},
});

export function createFormattingExtensions(): Object[]
{
	return [
		Bold,
		Italic,
		Strike,
		Underline,
		Code.extend({
			// Allow bold, italic, strike etc. to coexist with code mark (like GitHub).
			// Default '_' excludes ALL marks; 'code link' only prevents code-in-code
			// and link inside code (autolink would otherwise linkify URLs in code spans).
			excludes: 'code link',
		}),
		CodeBlock,
		Blockquote,
		Callout,
		BulletList,
		CleanOrderedList,
		SafeListItem,
		TaskList,
		TaskItem.configure({ nested: true }),
		CustomHorizontalRule,
		TextStyle,
		Color.configure({ types: ['textStyle'] }),
		Highlight.configure({ multicolor: true }),
		Subscript,
		Superscript,
		Typography,
		LinkWithInputRule.configure({
			openOnClick: false,
			autolink: true,
			enableClickSelection: false,
			validate: (href) => Boolean(sanitizeUrl(href)),
		}),
		TextAlign.configure({ types: ['heading', 'paragraph'] }),
	];
}
