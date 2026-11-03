import { Bold } from '@tiptap/extension-bold';
import { Italic } from '@tiptap/extension-italic';
import { Strike } from '@tiptap/extension-strike';
import { Underline } from '@tiptap/extension-underline';
import { Code } from '@tiptap/extension-code';
import { CodeBlock } from './code-block/code-block-extension';
import { Blockquote } from '@tiptap/extension-blockquote';
import { Callout, CalloutInputEnter } from './callout-extension';
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

const COLOR_MARK_TOKEN = 'colorMark';
const COLOR_OPEN = '{color:';
const COLOR_CLOSE = '{/color}';

/**
 * Whitelists CSS color values so a `{color:VALUE}` markdown token can only ever become a safe inline
 * `color:` style: hex (#rgb / #rgba / #rrggbb / #rrggbbaa), rgb()/rgba(), hsl()/hsla(), or a bare CSS
 * named color. Anything else (url(), expression(), CSS keywords, over-long input) is rejected.
 * Mirrors HtmlToMarkdown::normalizeColor() on the import side so both ends agree on what survives.
 * Legibility is decided there, not here: the import converter drops white because the foreign markup
 * rendered it against its own background, while a white the user picked in the editor round-trips -
 * the document canvas follows the theme.
 */
function isSafeColor(value): boolean
{
	if (typeof value !== 'string')
	{
		return false;
	}

	const v = value.trim();
	if (v === '' || v.length > 32)
	{
		return false;
	}

	if (/^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v))
	{
		return true;
	}

	if (/^rgba?\(\s*[0-9.,%\s]+\)$/i.test(v) || /^hsla?\(\s*[0-9.,%\s]+\)$/i.test(v))
	{
		return true;
	}

	if (/^[a-z]{3,20}$/i.test(v))
	{
		const reserved = ['inherit', 'initial', 'unset', 'revert', 'currentcolor', 'transparent', 'none', 'auto'];

		return !reserved.includes(v.toLowerCase());
	}

	return false;
}

/**
 * Scans a `{color:VALUE}...{/color}` token at the start of `src`, matching the closing marker with
 * nesting support (a colored run may contain another colored run). Returns the color value, the raw
 * matched text and the inner markdown, or null when `src` does not start a balanced color token.
 */
function scanColorToken(src): ?Object
{
	if (!src.startsWith(COLOR_OPEN))
	{
		return null;
	}

	const closeBrace = src.indexOf('}', COLOR_OPEN.length);
	if (closeBrace === -1)
	{
		return null;
	}

	const color = src.slice(COLOR_OPEN.length, closeBrace).trim();
	if (color === '' || color.length > 32)
	{
		return null;
	}

	const innerStart = closeBrace + 1;
	let depth = 1;
	let i = innerStart;
	while (i < src.length)
	{
		if (src.startsWith(COLOR_CLOSE, i))
		{
			depth -= 1;
			if (depth === 0)
			{
				return {
					color,
					inner: src.slice(innerStart, i),
					raw: src.slice(0, i + COLOR_CLOSE.length),
				};
			}
			i += COLOR_CLOSE.length;
			continue;
		}

		if (src.startsWith(COLOR_OPEN, i))
		{
			depth += 1;
			i += COLOR_OPEN.length;
			continue;
		}

		i += 1;
	}

	return null;
}

/**
 * Adds a `textStyle` color mark to every text node that does not already carry one, recursing into
 * child content. Used on parse so an outer `{color:...}` never overrides a nested inner color (inner
 * wins), matching ProseMirror's single-textStyle-per-node model. Mutates and returns `nodes`.
 */
function applyColorToUnmarked(nodes, color)
{
	(nodes || []).forEach((node) => {
		if (node.type === 'text')
		{
			const marks = node.marks || [];
			if (!marks.some((mark) => mark.type === 'textStyle'))
			{
				node.marks = [...marks, { type: 'textStyle', attrs: { color } }];
			}
		}
		else if (node.content)
		{
			applyColorToUnmarked(node.content, color);
		}
	});

	return nodes;
}

/**
 * Adds a markdown round-trip to the textStyle mark for the `{color:VALUE}...{/color}` token that
 * HtmlToMarkdown emits (and the editor's own color picker sets). Without this the color attribute is
 * silently dropped on serialise. The mark stays `textStyle` (so the Color extension's `color`
 * attribute still applies); only the token type differs (`colorMark`).
 */
const ColorTextStyle = TextStyle.extend({
	markdownTokenName: COLOR_MARK_TOKEN,

	markdownTokenizer: {
		name: COLOR_MARK_TOKEN,
		level: 'inline',

		start(src)
		{
			return src.indexOf(COLOR_OPEN);
		},

		tokenize(src, tokens, helpers)
		{
			const parsed = scanColorToken(src);
			if (!parsed)
			{
				return null;
			}

			return {
				type: COLOR_MARK_TOKEN,
				raw: parsed.raw,
				color: parsed.color,
				tokens: helpers.inlineTokens(parsed.inner),
			};
		},

		childTokens: [],
	},

	parseMarkdown(token, helpers)
	{
		const content = helpers.parseInline(token.tokens || []);
		// An unsafe/unknown color is stripped to its inner text - never applied as a style attribute.
		if (!isSafeColor(token.color))
		{
			return content;
		}

		// Apply this color only where a nested run has not already set one. ProseMirror allows a single
		// textStyle mark per text node (the color picker's setColor replaces, never stacks), so on a
		// nested `{color:A}...{color:B}x{/color}...{/color}` the inner color B must win for `x`. Returning
		// the already-marked node array (not applyMark) avoids the manager stacking a second textStyle.
		return applyColorToUnmarked(content, token.color);
	},

	renderMarkdown(node, helpers)
	{
		const inner = helpers.renderChildren(node.content ?? []);
		const color = node?.attrs?.color;
		// Only a safe color round-trips; any other textStyle attribute serialises to just its text.
		if (!isSafeColor(color))
		{
			return inner;
		}

		return `${COLOR_OPEN}${color}}${inner}${COLOR_CLOSE}`;
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
		CalloutInputEnter,
		BulletList,
		CleanOrderedList,
		SafeListItem,
		TaskList,
		TaskItem.configure({ nested: true }),
		CustomHorizontalRule,
		ColorTextStyle,
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
