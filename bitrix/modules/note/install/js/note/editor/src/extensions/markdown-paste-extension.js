import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { safeParseMarkdown } from '../utils/safe-parse-markdown';
import { markPastedFileIds } from './file-node-resolver-extension';

const MARKDOWN_PASTE_KEY = new PluginKey('noteMarkdownPaste');

const MD_PATTERN = /^#{1,6}\s+\S|^\*{2}\S|^\*\s+\S|^-\s+\S|^\+\s+\S|^\d+\.\s+\S|^-\s+\[[ Xx]]\s|^```|^>\s|^\|.+\||^:::/m;

// REST-uploaded attachment block: [[image|file|video fileId=N]] at line start. Routed through the
// markdown parser so NoteAssetTokenizer turns it into a real node (and short-circuits autolink),
// instead of falling through to the default paste handler as plain text / a link.
const NOTE_ASSET_PATTERN = /^\[\[(?:image|file|video) fileId=\d+]]/m;

const FILE_NODE_TYPES = new Set(['imageAttachment', 'fileAttachment', 'video']);

function looksLikeMarkdown(text: string): boolean
{
	const trimmed = text.trimStart();

	return MD_PATTERN.test(trimmed) || NOTE_ASSET_PATTERN.test(trimmed);
}

function collectInsertedFileIds(doc: Object, from: number, to: number): number[]
{
	const fileIds = new Set();

	doc.nodesBetween(from, to, (node) => {
		if (!FILE_NODE_TYPES.has(node.type.name))
		{
			return;
		}

		const { fileId, showUrl } = node.attrs;
		if (Number.isInteger(fileId) && fileId > 0 && !showUrl)
		{
			fileIds.add(fileId);
		}
	});

	return [...fileIds];
}

export const MarkdownPasteExtension = Extension.create({
	name: 'markdownPaste',

	addProseMirrorPlugins(): any
	{
		const { editor } = this;

		return [
			new Plugin({
				key: MARKDOWN_PASTE_KEY,
				props: {
					handlePaste(view, event): boolean
					{
						const text = event.clipboardData?.getData('text/plain') ?? '';

						if (!text || !looksLikeMarkdown(text))
						{
							return false;
						}

						const { doc } = safeParseMarkdown(editor, text);
						if (!doc.content || doc.content.length === 0)
						{
							return false;
						}

						const from = view.state.selection.from;
						try
						{
							editor.commands.insertContent(doc.content);
						}
						catch
						{
							return false;
						}

						// Flag freshly pasted attachment nodes so the resolver removes (not placeholders)
						// any whose fileId the backend can't resolve.
						const to = view.state.selection.to;
						const fileIds = collectInsertedFileIds(view.state.doc, from, to);
						if (fileIds.length > 0)
						{
							markPastedFileIds(view, fileIds);
						}

						return true;
					},
				},
			}),
		];
	},
});
