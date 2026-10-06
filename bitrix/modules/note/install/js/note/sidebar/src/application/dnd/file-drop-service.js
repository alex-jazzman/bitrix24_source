import 'ui.notification';

import type { Collection, SidebarDocument } from '../../type';

const MAX_FILE_SIZE_BYTES = 1048576;
const MARKDOWN_EXTENSION = '.md';
// One OS drop can carry an unbounded number of files, and each valid one becomes its own sequential
// create request; cap how many a single drop turns into documents. Bulk migration goes through the
// import flow, not drag-and-drop. Overflow is reported through the same "skipped" notice.
const MAX_DROP_FILES = 50;

type FileDropTarget = { collectionId: number, parentId: number | null };
type ExtractedFile = { file: File, title: string };

// Isolated from DocumentDndService/CollectionDndService: this drag originates outside the
// browser (OS file drag), so there is no startDrag on our side and the target shape differs
// from docTarget/collectionTarget ({ collectionId, parentId } instead of before/after/inside).
export class FileDropService
{
	#dragState: Object;
	#store: Object;
	#documentUseCases: Object;
	#onFail: (error: mixed) => void;
	#messages: Object;

	constructor({ dragState, store, documentUseCases, onFail, messages }: Object)
	{
		this.#dragState = dragState;
		this.#store = store;
		this.#documentUseCases = documentUseCases;
		this.#onFail = onFail;
		this.#messages = messages;
	}

	resolveCollectionTarget(collection: Collection | null): void
	{
		if (collection && Boolean(collection.canEditCollection))
		{
			this.#setFileDropTarget(Number(collection.id), null);

			return;
		}

		this.#clearFileDropTarget();
	}

	resolveDocumentTarget(doc: SidebarDocument | null): void
	{
		if (doc && this.#canDropOnDocument(doc))
		{
			this.#setFileDropTarget(Number(doc.collectionId), Number(doc.id));

			return;
		}

		this.#clearFileDropTarget();
	}

	// dragover fires continuously; only swap the reactive target when its identity actually changes,
	// so the recursive TreeNode subtree doesn't re-render (and findCollection doesn't rerun) per event.
	#setFileDropTarget(collectionId: number, parentId: number | null): void
	{
		const current = this.#dragState.fileDropTarget;
		if (current && Number(current.collectionId) === collectionId && current.parentId === parentId)
		{
			return;
		}

		this.#dragState.fileDropTarget = { collectionId, parentId };
	}

	#clearFileDropTarget(): void
	{
		if (this.#dragState.fileDropTarget !== null)
		{
			this.#dragState.fileDropTarget = null;
		}
	}

	onSidebarDragEnter(event: DragEvent): void
	{
		this.#trackFileDragIfPresent(event);
	}

	onSidebarDragOver(event: DragEvent): void
	{
		this.#trackFileDragIfPresent(event);
	}

	onSidebarDragLeave(event: DragEvent): void
	{
		const container = event.currentTarget;
		const nextTarget = event.relatedTarget;
		if (container instanceof HTMLElement && nextTarget instanceof Node && container.contains(nextTarget))
		{
			// Still inside the sidebar container (moved to a child element) — not a real leave.
			return;
		}

		this.clearFileDrag();
	}

	clearFileDrag(): void
	{
		this.#dragState.fileDragItem = false;
		this.#dragState.fileDropTarget = null;
	}

	extractMarkdownFiles(fileList: FileList): { valid: ExtractedFile[], skipped: number }
	{
		const valid = [];
		let skipped = 0;

		for (const file of Array.from(fileList || []))
		{
			const title = this.#extractMarkdownTitle(file.name);
			if (title === null || file.size > MAX_FILE_SIZE_BYTES)
			{
				skipped += 1;
				continue;
			}

			// Beyond the per-drop cap: count as skipped so the user gets the "N skipped" notice rather
			// than silently spawning an unbounded number of sequential create requests.
			if (valid.length >= MAX_DROP_FILES)
			{
				skipped += 1;
				continue;
			}

			valid.push({ file, title });
		}

		return { valid, skipped };
	}

	async handleCollectionDrop(collection: Collection | null, fileList: FileList): Promise<void>
	{
		if (!Boolean(collection?.canEditCollection))
		{
			this.clearFileDrag();

			return;
		}

		await this.#handleDrop({ collectionId: Number(collection.id), parentId: null }, fileList);
	}

	async handleDocumentDrop(doc: SidebarDocument | null, fileList: FileList): Promise<void>
	{
		if (!doc || !this.#canDropOnDocument(doc))
		{
			this.clearFileDrag();

			return;
		}

		await this.#handleDrop({ collectionId: Number(doc.collectionId), parentId: Number(doc.id) }, fileList);
	}

	async #handleDrop(target: FileDropTarget, fileList: FileList): Promise<void>
	{
		try
		{
			const { valid, skipped } = this.extractMarkdownFiles(fileList);
			if (skipped > 0)
			{
				this.#notify(this.#messages.fileDropWarningSkipped.replace('#COUNT#', String(skipped)));
			}

			if (valid.length === 0)
			{
				this.#notify(this.#messages.fileDropWarningNoMarkdown);

				return;
			}

			if (valid.length === 1)
			{
				await this.#handleSingleFile(target, valid[0]);

				return;
			}

			await this.#handleMultipleFiles(target, valid);
		}
		finally
		{
			this.clearFileDrag();
		}
	}

	async #handleSingleFile(target: FileDropTarget, entry: ExtractedFile): Promise<void>
	{
		try
		{
			const text = await entry.file.text();
			await this.#documentUseCases.createDocumentFromMarkdownFile(
				target.collectionId,
				target.parentId,
				entry.title,
				text,
				{ open: true },
			);
		}
		catch (error)
		{
			this.#onFail(error);
		}
	}

	async #handleMultipleFiles(target: FileDropTarget, entries: ExtractedFile[]): Promise<void>
	{
		let created = 0;
		for (const entry of entries)
		{
			try
			{
				const text = await entry.file.text();
				await this.#documentUseCases.createDocumentFromMarkdownFile(
					target.collectionId,
					target.parentId,
					entry.title,
					text,
					{ open: false },
				);
				created += 1;
			}
			catch
			{
				// A single file failure must not roll back documents already created — keep going.
			}
		}

		// Full success shows a clean count; the "N of M" form is kept only when some files failed,
		// where the discrepancy is the useful signal.
		this.#notify(
			created === entries.length
				? this.#messages.fileDropSummary.replace('#COUNT#', String(created))
				: this.#messages.fileDropSummaryPartial
					.replace('#CREATED#', String(created))
					.replace('#TOTAL#', String(entries.length)),
		);
	}

	#canDropOnDocument(doc: SidebarDocument): boolean
	{
		return (
			Boolean(this.#store.queries.findCollection(Number(doc.collectionId))?.canEditCollection)
			|| Boolean(doc?.canEditCollection)
		);
	}

	#extractMarkdownTitle(fileName: string): string | null
	{
		const name = String(fileName || '');
		if (name.length <= MARKDOWN_EXTENSION.length || !name.toLowerCase().endsWith(MARKDOWN_EXTENSION))
		{
			return null;
		}

		const title = name.slice(0, -MARKDOWN_EXTENSION.length);

		return title === '' ? null : title;
	}

	#trackFileDragIfPresent(event: DragEvent): void
	{
		if (!event.dataTransfer?.types?.includes('Files'))
		{
			return;
		}

		event.preventDefault();
		this.#dragState.fileDragItem = true;
	}

	#notify(content: string): void
	{
		BX.UI.Notification.Center.notify({ content, position: 'top-right' });
	}
}
