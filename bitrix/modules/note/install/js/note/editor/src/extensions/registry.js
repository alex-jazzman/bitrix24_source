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
import { EnrichedAssetTokenizer, NoteAssetTokenizer } from './attachments';
import { MarkdownPasteExtension } from './markdown-paste-extension';
import { FileNodeResolverExtension } from './file-node-resolver-extension';
import { NoteMentionNode } from './mention/note-mention-node';
import { NoteMentionResolverExtension } from './mention/note-mention-resolver-extension';
import { TabIndent } from './tab-indent-extension';

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
	const hasCollaborationProvider = Boolean(provider?.document);

	const extensions = [
		...createCoreExtensions({ hasCollaborationProvider, documentId }),
		...createFormattingExtensions(),
		...createMediaExtensions(uploadService),
		...createTableExtensions(),
		createFileHandlerExtension(uploadService),
		TabIndent,
		Markdown.configure({
			marked: sharedMarked,
			markedOptions: { gfm: true },
		}),
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
	];

	if (hasCollaborationProvider)
	{
		extensions.push(...createCollaborationExtensions({ provider, user }));
	}

	return extensions;
}

export const editorExtensions = createEditorExtensions();

export { MAX_IMAGE_SIZE, MAX_FILE_SIZE };
