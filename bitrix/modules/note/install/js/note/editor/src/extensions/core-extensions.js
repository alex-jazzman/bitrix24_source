import { Document } from '@tiptap/extension-document';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';
import { HardBreak } from '@tiptap/extension-hard-break';
import { Dropcursor } from '@tiptap/extension-dropcursor';
import { UndoRedo } from '@tiptap/extensions';
import { NoteGapcursor } from './note-gapcursor';
import { HeadingAnchor } from './heading-anchor-extension';
import { HeadingCollapseEnter } from './heading-enter-command';
import { escapeInlineText } from './shared-marked';

const MarkdownParagraph = Paragraph.extend({
	renderMarkdown(node, h, ctx): string
	{
		return this.parent?.({ ...node, content: escapeInlineText(node.content) }, h, ctx) ?? '';
	},
});

export function createCoreExtensions({ hasCollaborationProvider, documentId = null }: {
	hasCollaborationProvider: boolean,
	documentId?: number | string | null,
}): Object[]
{
	return [
		Document,
		MarkdownParagraph,
		Text,
		HardBreak,
		HeadingAnchor.configure({ levels: [1, 2, 3, 4], documentId }),
		HeadingCollapseEnter,
		Dropcursor,
		NoteGapcursor,
		...(hasCollaborationProvider ? [] : [UndoRedo]),
	];
}
