import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { safeParseMarkdown } from '../utils/safe-parse-markdown';
import { markPastedFileIds } from './file-node-resolver-extension';

const MARKDOWN_PASTE_KEY = new PluginKey('noteMarkdownPaste');

// Last alternative: a `[text](url)` markdown link at line start, so pasted links go through
// safeParseMarkdown (link mark) instead of falling through to plain text / Link autolink on the raw URL.
const MD_PATTERN = /^#{1,6}\s+\S|^\*{2}\S|^\*\s+\S|^-\s+\S|^\+\s+\S|^\d+\.\s+\S|^-\s+\[[ Xx]]\s|^```|^>\s|^\|.+\||^:::|^\[[^[\]\n]+]\([^)\s]+\)/m;

// REST-uploaded attachment block: [[image|file|video fileId=N <opt-attrs>]] at line start. Routed
// through the markdown parser so NoteAssetTokenizer turns it into a real node (and short-circuits
// autolink), instead of falling through to the default paste handler as plain text / a link.
// Optional ` key=value` pairs (width/align/...) must be allowed, mirroring parseNoteAssetSyntax —
// otherwise [[image fileId=N width=123]] is not recognized and pastes as plain text.
const NOTE_ASSET_PATTERN = /^\[\[(?:image|file|video) fileId=\d+(?:[ \t]+[a-z]+=[^\s\]]+)*]]/m;

// Mention token @{type:id} — route through safeParseMarkdown so the inline tokenizer
// (note-mention-node.js) can convert it to a mention node. Works for standalone tokens
// and for @{...} embedded inside a larger markdown block.
const NOTE_MENTION_PATTERN = /@\{[a-z]+:\d+\}/;

const FILE_NODE_TYPES = new Set(['imageAttachment', 'fileAttachment', 'video']);

function looksLikeMarkdown(text: string): boolean
{
	const trimmed = text.trimStart();

	return MD_PATTERN.test(trimmed) || NOTE_ASSET_PATTERN.test(trimmed) || NOTE_MENTION_PATTERN.test(trimmed);
}

// A code block stores raw source, so markdown markup in the clipboard (e.g. a Python `# comment`)
// must paste verbatim, not be parsed into headings/lists. Detect the codeBlock context and bail out.
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

	// Higher than Link's priority (1000, extension-link/src/link.ts:199): its handlePaste must run
	// first, so a pasted `[text](url)` is parsed as a markdown link before Link's own paste/autolink
	// path can linkify the raw URL inside `(...)`.
	priority: 1001,

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

						if (!text || !looksLikeMarkdown(text) || isInsideCodeBlock(view.state))
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
