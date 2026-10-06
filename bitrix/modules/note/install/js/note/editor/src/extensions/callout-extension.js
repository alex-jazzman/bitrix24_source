import { Extension, mergeAttributes, Node, wrappingInputRule } from '@tiptap/core';
import { sharedMarked } from './shared-marked';
import { splitInlineAssets } from './attachments/enriched-asset-parser';
import { findCalloutStart, parseCalloutBlock } from './callout-parser';
import { CALLOUT_INPUT_REGEX, resolveCalloutInputType, matchCalloutEnterType, hasCalloutAncestor } from './callout-input-rule';

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

	// `:::info ` and friends wrap the current block into a callout as you type (see
	// callout-input-rule.js). The only live-typed note markdown token — mentions/assets can't be.
	addInputRules()
	{
		const rule = wrappingInputRule({
			find: CALLOUT_INPUT_REGEX,
			type: this.type,
			getAttributes: (match) => ({ type: resolveCalloutInputType(match) }),
			// Never merge into the callout above: wrappingInputRule joins a same-type previous sibling
			// without comparing attributes, so `:::warning ` typed right after an info callout would be
			// swallowed by it and keep the info type. Each typed token makes its own callout.
			joinPredicate: () => false,
		});

		// Refuse to nest: skip the wrap when the caret already sits inside a callout, so `:::info ` typed
		// inside a callout stays literal text instead of producing callout-in-callout (which the toolbar
		// can't create). Wrapping the handler keeps wrappingInputRule's wrap logic intact.
		const wrap = rule.handler.bind(rule);
		rule.handler = (props) => {
			if (hasCalloutAncestor(props.state.selection.$from))
			{
				return null;
			}

			return wrap(props);
		};

		return [rule];
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
		// Block separator (blank line) between children — callout holds `block+`, so a block child
		// like an image must land on its own line, not glued to the next paragraph (which would make
		// the image unparseable on re-paste). Without an explicit separator renderChildren joins with ''.
		const inner = helpers.renderChildren(node, '\n\n');

		return `:::${calloutType}\n${inner}\n:::`;
	},
});

// Enter counterpart to the `:::info ` input rule. Input rules only fire on text input, never on
// Enter, so a `:::info` line finished with Enter wouldn't convert without this. A standalone
// high-priority Extension (not the Node) keeps the schema's node order untouched — same reasoning
// as HeadingCollapseEnter. Returns false unless the caret sits in an empty-selection paragraph whose
// entire text is a bare `:::type`, so any other Enter falls through to the default split.
export const CalloutInputEnter = Extension.create({
	name: 'calloutInputEnter',
	priority: 1000,
	addKeyboardShortcuts()
	{
		return {
			Enter: ({ editor }) => {
				const { selection } = editor.state;
				if (!selection.empty)
				{
					return false;
				}

				const { $from } = selection;
				if ($from.parent.type.name !== 'paragraph')
				{
					return false;
				}

				// Refuse to nest: a `:::type` line finished with Enter inside a callout must not wrap a
				// second callout — let the default Enter split the paragraph instead.
				if (hasCalloutAncestor($from))
				{
					return false;
				}

				const type = matchCalloutEnterType($from.parent.textContent);
				if (!type)
				{
					return false;
				}

				// Clear the `:::type` text, then wrap the now-empty paragraph into a callout — the
				// caret lands inside it, ready for the body.
				return editor
					.chain()
					.deleteRange({ from: $from.start(), to: $from.end() })
					.wrapIn('callout', { type })
					.run();
			},
		};
	},
});
