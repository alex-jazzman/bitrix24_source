import { Markdown } from '@tiptap/markdown';
import { sharedMarked } from './shared-marked';
import { FileUploadService } from '../services/file-upload-service';
import { MAX_IMAGE_SIZE, MAX_FILE_SIZE } from '../const';
import { createCoreExtensions } from './core-extensions';
import { createFormattingExtensions } from './formatting-extensions';
import { createTableExtensions } from './table-extensions';
import { createMediaExtensions } from './media-extensions';
import { createCollaborationExtensions } from './collaboration-extensions';
import { createFileHandlerExtension } from './file-handler-extension';
import { EnrichedAssetTokenizer, NoteAssetTokenizer, VideoEmbed, VideoEmbedAssetTokenizer } from './attachments';
import { MarkdownPasteExtension } from './markdown-paste-extension';
import { FileNodeResolverExtension } from './file-node-resolver-extension';
import { NoteDateNode } from './date/note-date-node';
import { NoteMentionNode } from './mention/note-mention-node';
import { NoteMentionResolverExtension } from './mention/note-mention-resolver-extension';
import { DocumentMentionLabelCache } from './mention/document-mention-label-cache';
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
	hotkeyFeatures = [],
}: {
	uploadService?: Object,
	provider?: Object | null,
	user?: CurrentUser | null,
	documentId?: number,
	onMentionClick?: Function | null,
	hotkeyFeatures?: Array<string>,
} = {}): Object[]
{
	// Awareness counts as much as the document: the caret extension binds straight to it, so a provider
	// that stopped halfway through its connect is not one the collaborative extensions can run on.
	const hasCollaborationProvider = Boolean(provider?.document && provider?.awareness);
	const currentUserId = Number(user?.id) || 0;
	const documentMentionLabelCache = new DocumentMentionLabelCache({ userId: currentUserId });

	const extensions = [
		...createCoreExtensions({ hasCollaborationProvider, documentId }),
		...createFormattingExtensions(),
		...createMediaExtensions(uploadService, documentId),
		...createTableExtensions(),
		createFileHandlerExtension(uploadService),
		TabIndent,
		// A combo whose feature the portal switched off stays with the browser, so the list travels here.
		NoteHotkeys.configure({ features: hotkeyFeatures }),
		Markdown.configure({
			marked: sharedMarked,
			markedOptions: { gfm: true },
		}),
		MarkdownPasteExtension,
		NoteAssetTokenizer,
		EnrichedAssetTokenizer,
		VideoEmbed,
		VideoEmbedAssetTokenizer,
		FileNodeResolverExtension.configure({
			getDocumentId: () => Number(documentId) || 0,
		}),
		NoteMentionNode.configure({
			onMentionClick: typeof onMentionClick === 'function' ? onMentionClick : null,
			labelCache: documentMentionLabelCache,
		}),
		NoteMentionResolverExtension.configure({
			currentUserId,
			labelCache: documentMentionLabelCache,
		}),
		// Registered unconditionally: the collaborative schema is built with no arguments at all, so a
		// node behind a flag would leave the two schemas disagreeing about the document.
		NoteDateNode,
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
