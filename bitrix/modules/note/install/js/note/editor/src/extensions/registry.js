import { Markdown } from '@tiptap/markdown';
import { MarkdownEscapeParser, sharedMarked } from './shared-marked';
import { FileUploadService } from '../services/file-upload-service';
import { MAX_IMAGE_SIZE, MAX_FILE_SIZE } from '../const';
import { createCoreExtensions } from './core-extensions';
import { createFormattingExtensions } from './formatting-extensions';
import { createTableExtensions } from './table-extensions';
import { createMediaExtensions } from './media-extensions';
import { createCollaborationExtensions } from './collaboration-extensions';
import { createFileHandlerExtension } from './file-handler-extension';
import { EnrichedAssetTokenizer, NoteAssetTokenizer } from './attachments';
import { MarkdownPasteExtension } from './markdown-paste-extension';
import { FileNodeResolverExtension } from './file-node-resolver-extension';
import { NoteMentionNode } from './mention/note-mention-node';
import { NoteMentionResolverExtension } from './mention/note-mention-resolver-extension';
import { DiffChangeMark } from './diff-change-mark';
import { TabIndent } from './tab-indent-extension';
import { NoteHotkeys } from './hotkeys-extension';

import type { CurrentUser } from '../type';

export function createEditorExtensions({
	uploadService = FileUploadService,
	provider = null,
	user = null,
	documentId = 0,
	onMentionClick = null,
}: {
	uploadService?: Object,
	provider?: Object | null,
	user?: CurrentUser | null,
	documentId?: number,
	onMentionClick?: Function | null,
} = {}): Object[]
{
	// Awareness counts as much as the document: the caret extension binds straight to it, so a provider
	// that stopped halfway through its connect is not one the collaborative extensions can run on.
	const hasCollaborationProvider = Boolean(provider?.document && provider?.awareness);

	const extensions = [
		...createCoreExtensions({ hasCollaborationProvider, documentId }),
		...createFormattingExtensions(),
		...createMediaExtensions(uploadService),
		...createTableExtensions(),
		createFileHandlerExtension(uploadService),
		TabIndent,
		NoteHotkeys,
		Markdown.configure({
			marked: sharedMarked,
			markedOptions: { gfm: true },
		}),
		MarkdownEscapeParser,
		MarkdownPasteExtension,
		NoteAssetTokenizer,
		EnrichedAssetTokenizer,
		FileNodeResolverExtension.configure({
			getDocumentId: () => Number(documentId) || 0,
		}),
		NoteMentionNode.configure({
			onMentionClick: typeof onMentionClick === 'function' ? onMentionClick : null,
		}),
		NoteMentionResolverExtension,
		// Read-only version-preview diff mark; inert everywhere else (never applied on the live editor).
		DiffChangeMark,
	];

	if (hasCollaborationProvider)
	{
		extensions.push(...createCollaborationExtensions({ provider, user }));
	}

	return extensions;
}

export const editorExtensions = createEditorExtensions();

export { MAX_IMAGE_SIZE, MAX_FILE_SIZE };
