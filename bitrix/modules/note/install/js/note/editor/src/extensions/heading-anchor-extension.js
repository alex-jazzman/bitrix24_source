import { Heading } from '@tiptap/extension-heading';
import { headingAnchorPlugin } from './heading-anchor-plugin';
import { HeadingBlockNodeView } from './heading-block-node-view';
import { escapeInlineText } from './shared-marked';

export const HeadingAnchor = Heading.extend({
	renderMarkdown(node, h, ctx): string
	{
		return this.parent?.({ ...node, content: escapeInlineText(node.content) }, h, ctx) ?? '';
	},
	addOptions()
	{
		return {
			...(this.parent?.() ?? {}),
			documentId: null,
		};
	},
	addAttributes()
	{
		return {
			...this.parent?.(),
			collapsed: {
				default: false,
				// collapsed=false is the default and is not serialized, keeping the
				// stored JSON compact and fully backward-compatible with old docs.
				parseHTML: (element) => element.getAttribute('data-collapsed') === 'true',
				renderHTML: (attributes) => (attributes.collapsed ? { 'data-collapsed': 'true' } : {}),
			},
		};
	},
	addCommands()
	{
		return {
			...this.parent?.(),
			setHeadingCollapsed: (pos, value) => ({ tr, dispatch }) => {
				const node = tr.doc.nodeAt(pos);
				if (!node || node.type.name !== this.name)
				{
					return false;
				}

				if (dispatch)
				{
					tr.setNodeMarkup(pos, undefined, { ...node.attrs, collapsed: Boolean(value) });
				}

				return true;
			},
		};
	},
	addProseMirrorPlugins()
	{
		return [
			...(this.parent?.() ?? []),
			headingAnchorPlugin(),
		];
	},
	addNodeView()
	{
		const { documentId } = this.options;

		return ({ node, editor, getPos }) => new HeadingBlockNodeView({
			node,
			editor,
			getPos,
			documentId,
		});
	},
});
