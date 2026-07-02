import { mergeAttributes, Node } from '@tiptap/core';
import { sharedMarked } from './shared-marked';
import { splitInlineAssets } from './attachments/enriched-asset-parser';
import { findCalloutStart, parseCalloutBlock } from './callout-parser';

const CALLOUT_ICON_CLASS = {
	info: '--o-info-circle',
	success: '--o-circle-check',
	warning: '--o-circle-cross',
	tip: '--o-favorite',
	zefir: null,
};

export const Callout = Node.create({
	name: 'callout',

	content: 'block+',

	group: 'block',

	defining: true,

	addAttributes()
	{
		return {
			type: {
				default: 'info',
				parseHTML: (element) => element.getAttribute('data-callout-type') || 'info',
				renderHTML: (attributes) => ({
					'data-callout-type': attributes.type,
				}),
			},
		};
	},

	parseHTML()
	{
		return [{ tag: 'div[data-type="callout"]' }];
	},

	renderHTML({ HTMLAttributes, node })
	{
		const explicitIcon = Object.prototype.hasOwnProperty.call(CALLOUT_ICON_CLASS, node.attrs.type)
			? CALLOUT_ICON_CLASS[node.attrs.type]
			: CALLOUT_ICON_CLASS.info;
		const containerAttrs = mergeAttributes(HTMLAttributes, {
			'data-type': 'callout',
			class: `note-editor-callout note-editor-callout--${node.attrs.type}`,
		});
		const children = [];
		if (explicitIcon)
		{
			children.push([
				'span',
				{ class: `note-editor-callout-icon ui-icon-set ${explicitIcon}`, contenteditable: 'false' },
			]);
		}
		children.push(['div', { class: 'note-editor-callout-content' }, 0]);

		return ['div', containerAttrs, ...children];
	},

	addCommands()
	{
		return {
			setCallout: ({ type }) => ({ commands }) => {
				return commands.wrapIn(this.name, { type });
			},
			toggleCallout: ({ type }) => ({ editor, commands }) => {
				if (editor.isActive(this.name, { type }))
				{
					return commands.lift(this.name);
				}

				if (editor.isActive(this.name))
				{
					return commands.updateAttributes(this.name, { type });
				}

				return commands.wrapIn(this.name, { type });
			},
			unsetCallout: () => ({ commands }) => {
				return commands.lift(this.name);
			},
		};
	},

	markdownTokenizer: {
		name: 'callout',
		level: 'block',
		start(src: string): number
		{
			return findCalloutStart(src);
		},
		tokenize(src: string): Object | void
		{
			const parsed = parseCalloutBlock(src);
			if (!parsed)
			{
				return undefined;
			}

			// IMPORTANT: Do NOT call sharedMarked.lexer() here.
			// Calling lexer() inside tokenize() corrupts the inline token queue
			// of the outer Lexer (they share state through the Marked instance).
			// Instead, store the raw body and lex it later in parseMarkdown().
			return {
				type: 'callout',
				raw: parsed.raw,
				calloutType: parsed.calloutType,
				calloutBody: splitInlineAssets(parsed.body),
			};
		},
		childTokens: [],
	},

	parseMarkdown(token: Object, helpers: Object): Object
	{
		// Lex the callout body here (deferred from tokenize() to avoid
		// corrupting the outer Lexer's inline processing queue).
		const bodyTokens = sharedMarked.lexer(token.calloutBody || '');
		const content = helpers.parseChildren(bodyTokens);

		return {
			type: 'callout',
			attrs: { type: token.calloutType || 'info' },
			content: content.length > 0 ? content : [{ type: 'paragraph', content: [] }],
		};
	},

	renderMarkdown(node: Object, helpers: Object): string
	{
		const calloutType = node.attrs?.type || 'info';
		const inner = helpers.renderChildren(node);

		return `:::${calloutType}\n${inner}\n:::`;
	},
});
