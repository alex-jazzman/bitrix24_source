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
import { sanitizeUrl } from '../utils/url';
import { Lexer } from 'marked';

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
		Link.configure({
			openOnClick: false,
			autolink: true,
			enableClickSelection: false,
			validate: (href) => Boolean(sanitizeUrl(href)),
		}),
		TextAlign.configure({ types: ['heading', 'paragraph'] }),
	];
}
