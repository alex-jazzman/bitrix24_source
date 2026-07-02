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
import { EnrichedAssetTokenizer } from './attachments';
import { MarkdownPasteExtension } from './markdown-paste-extension';

import type { CurrentUser } from '../type';

export function createEditorExtensions({
	uploadService = FileUploadService,
	provider = null,
	user = null,
}: {
	uploadService?: Object,
	provider?: Object | null,
	user?: CurrentUser | null,
} = {}): Object[]
{
	const hasCollaborationProvider = Boolean(provider?.document);

	const extensions = [
		...createCoreExtensions({ hasCollaborationProvider }),
		...createFormattingExtensions(),
		...createMediaExtensions(),
		...createTableExtensions(),
		createFileHandlerExtension(uploadService),
		Markdown.configure({
			marked: sharedMarked,
			markedOptions: { gfm: true },
		}),
		MarkdownPasteExtension,
		EnrichedAssetTokenizer,
	];

	if (hasCollaborationProvider)
	{
		extensions.push(...createCollaborationExtensions({ provider, user }));
	}

	return extensions;
}

export const editorExtensions = createEditorExtensions();

export { MAX_IMAGE_SIZE, MAX_FILE_SIZE };
