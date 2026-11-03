import { Runtime } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { Uploader, UploaderEvent, type UploaderFile } from 'ui.uploader.core';

import {
	COMMIT_FAILED_ERROR_CODE,
	DOCUMENT_ADD_FAILED_ERROR_CODE,
	DOCUMENT_REJECTED_ERROR_CODE,
	LIMIT_EXCEEDED_ERROR_CODE,
} from './file-error-text';
import {
	BatchFileStatus,
	type BatchFileItem,
	type BatchFileStatusType,
	type BatchUploadServiceOptions,
	type ServerBatchItem,
} from './types';

const UPLOAD_CONTROLLER = 'sign.upload.blankUploadController';
const DEFAULT_ACCEPTED_FILE_TYPES = ['.pdf', '.doc', '.docx', '.rtf', '.odt'];
const DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024;
const PROGRESS_EMIT_INTERVAL = 100;
// no document exists for a file in one of these statuses yet
const PENDING_STATUSES: Set<BatchFileStatusType> = new Set([
	BatchFileStatus.pending,
	BatchFileStatus.uploading,
	BatchFileStatus.committing,
]);

/**
 * Owns the batch: uploader instance, per-file state, limit slicing and retry.
 *
 * The service knows nothing about the popup: the view reads its state and the wizard step owns
 * its lifetime, so closing the popup does not stop the upload.
 */
export class BatchUploadService extends EventEmitter
{
	static events = Object.freeze({
		itemsChange: 'itemsChange',
		allUploaded: 'allUploaded',
		rejected: 'rejected',
	});

	#uploader: Uploader;
	#limitTotal: number;
	#resolveLimitLeft: (() => number) | null;
	#items: Map<string, BatchFileItem> = new Map();
	#serverFileIds: Map<string, string> = new Map();
	// Files whose uploaded token is spent: a document exists for them, or the server answered the
	// commit that carried them. Such a file never goes into a commit again - its token is gone
	// together with its blank, so a second commit of it could only fail.
	#spentIds: Set<string> = new Set();
	// The server takes the placeholder mode for the whole call, so it is kept per file and a commit
	// carries the files of one mode only.
	#hasPlaceholdersById: Map<string, boolean> = new Map();
	// mode of the selection being added: addFiles() of the uploader gives every file of it an id
	#addedHasPlaceholders: boolean = false;
	#doneCount: number = 0;
	// a commit is in flight until its outcome is applied, and only one may run at a time
	#isCommitting: boolean = false;
	#hasDeferredCommit: boolean = false;

	// Progress arrives from xhr.upload.onprogress without any pacing of its own.
	#emitProgressChange: () => void = Runtime.throttle(
		() => this.#emitItemsChange(),
		PROGRESS_EMIT_INTERVAL,
	) as () => void;

	constructor(options: BatchUploadServiceOptions)
	{
		super();
		this.setEventNamespace('BX.Sign.V2.B2e.BatchUploadService');

		this.#limitTotal = options.limitTotal;
		this.#resolveLimitLeft = options.resolveLimitLeft ?? null;
		this.#uploader = new Uploader({
			id: 'sign-b2e-batch-upload',
			controller: UPLOAD_CONTROLLER,
			acceptedFileTypes: options.acceptedFileTypes ?? DEFAULT_ACCEPTED_FILE_TYPES,
			multiple: true,
			autoUpload: true,
			maxFileSize: options.maxFileSize ?? DEFAULT_MAX_FILE_SIZE,
			events: {
				[UploaderEvent.FILE_ADD_START]: (event: BaseEvent) => this.#onFileAddStart(event),
				[UploaderEvent.FILE_UPLOAD_START]: (event: BaseEvent) => this.#onFileUploadStart(event),
				[UploaderEvent.FILE_UPLOAD_PROGRESS]: (event: BaseEvent) => this.#onFileUploadProgress(event),
				[UploaderEvent.FILE_UPLOAD_COMPLETE]: (event: BaseEvent) => this.#onFileUploadComplete(event),
				[UploaderEvent.FILE_ERROR]: (event: BaseEvent) => this.#onFileError(event),
				[UploaderEvent.UPLOAD_COMPLETE]: () => this.#onUploadComplete(),
			},
		});
	}

	/**
	 * Adds a batch already filtered by selection composition and slices it by the remaining limit.
	 * The placeholder mode belongs to the selection: the tile the files came from decides it, and
	 * several selections with different modes may live in one batch.
	 */
	addFiles(files: File[], limitLeft: number, hasPlaceholders: boolean = false): void
	{
		const accepted = files.slice(0, Math.max(limitLeft, 0));
		const rejected = files.slice(Math.max(limitLeft, 0));

		if (accepted.length > 0)
		{
			this.#addToUploader(accepted, hasPlaceholders);
		}

		if (rejected.length > 0)
		{
			this.emit(BatchUploadService.events.rejected, {
				names: rejected.map((file: File) => file.name),
			});
		}
	}

	removeFile(id: string): void
	{
		const file = this.#uploader.getFile(id);
		if (file !== null)
		{
			this.#uploader.removeFile(file, { removeFromServer: false });
		}

		this.#deleteItem(id);
		this.#emitItemsChange();
	}

	/**
	 * The uploader core has no public retry, so the very same binary is added again. The retried
	 * file gets a new id and a new server file id, so it is committed as a new one.
	 *
	 * A place in the process may have been taken by another file since the failure: uploading the
	 * whole file again only to have the server refuse it says nothing, so the row is refused here.
	 */
	retryFile(id: string): void
	{
		const file = this.#uploader.getFile(id);
		const binary = file === null ? null : file.getBinary();
		if (file === null || binary === null)
		{
			return;
		}

		if (this.#resolveLimitLeft !== null && this.#resolveLimitLeft() <= 0)
		{
			this.#failByLimit(id);

			return;
		}

		const hasPlaceholders = this.#hasPlaceholders(id);
		this.#uploader.removeFile(file, { removeFromServer: false });
		this.#deleteItem(id);
		this.#addToUploader([binary], hasPlaceholders);
	}

	getItems(): BatchFileItem[]
	{
		return [...this.#items.values()];
	}

	/**
	 * Uploaded file ids that may still go into a commit, in the order the user selected them: this
	 * order becomes the order of documents in the group.
	 */
	getUploadedFileIds(): string[]
	{
		return this.#getCommitCandidateIds().map((id: string) => String(this.#serverFileIds.get(id)));
	}

	/**
	 * The server outcome is the source of truth for the final status of a file.
	 *
	 * A refused file keeps its token spent: the server consumed the token before it failed, so the
	 * same file id would only fail again. Its row offers a retry, which uploads the file anew.
	 */
	applyServerItems(serverItems: ServerBatchItem[]): void
	{
		const outcomeByServerFileId: Map<string, ServerBatchItem> = new Map();
		serverItems.forEach((serverItem: ServerBatchItem) => {
			outcomeByServerFileId.set(String(serverItem.fileId), serverItem);
		});

		this.#items.forEach((item: BatchFileItem, id: string) => {
			const serverFileId = this.#serverFileIds.get(id);
			const outcome = serverFileId === undefined ? null : outcomeByServerFileId.get(serverFileId);
			if (!outcome)
			{
				return;
			}

			this.#setItem({
				...item,
				status: outcome.success ? BatchFileStatus.done : BatchFileStatus.error,
				progress: outcome.success ? 100 : item.progress,
				// the failure is shown by its code: an upload message of an earlier try is stale
				errorMessage: null,
				errorCode: outcome.success ? null : outcome.errorCode,
			});
		});

		this.#emitItemsChange();
		this.#finishCommit();
	}

	/**
	 * The batch endpoint creates drafts before their files are checked by the signing service.
	 * Once that check is over, a missing draft is the outcome of a rejected file.
	 */
	getVerifiedServerItems(serverItems: ServerBatchItem[], documentUids: string[]): ServerBatchItem[]
	{
		const existingUids = new Set(documentUids);

		return serverItems.map((item: ServerBatchItem): ServerBatchItem => {
			if (item.success !== true || (item.uid !== null && existingUids.has(item.uid)))
			{
				return item;
			}

			return {
				...item,
				success: false,
				errorCode: DOCUMENT_REJECTED_ERROR_CODE,
			};
		});
	}

	/**
	 * The batch endpoint failed as a whole: the files of that very call are uploaded, but no
	 * document was created for them and no token was consumed, so their rows drop the uploaded look
	 * and they go into the next commit.
	 *
	 * Only the files of the failed call go back. A file refused earlier by an outcome of its own
	 * keeps its token spent - the server consumed it before refusing - so returning it here would
	 * send an already spent token again and could create a second document for it.
	 */
	applyCommitFailure(): void
	{
		[...this.#spentIds].forEach((id: string) => {
			const item = this.#items.get(id);
			if (item === undefined || item.status !== BatchFileStatus.committing)
			{
				return;
			}

			this.#spentIds.delete(id);
			this.#setItem({
				...item,
				status: BatchFileStatus.error,
				errorMessage: null,
				errorCode: COMMIT_FAILED_ERROR_CODE,
			});
		});

		this.#emitItemsChange();
		this.#finishCommit();
	}

	/**
	 * The documents of these files exist on the server, but the wizard could not take them in: their
	 * rows must say so instead of keeping the uploaded look. The tokens stay spent - a document
	 * exists for every one of them.
	 */
	applyDocumentFailure(serverFileIds: string[]): void
	{
		const failedIds: Set<string> = new Set(serverFileIds.map((fileId: string) => String(fileId)));
		let hasFailed = false;
		this.#items.forEach((item: BatchFileItem, id: string) => {
			const serverFileId = this.#serverFileIds.get(id);
			if (serverFileId === undefined || !failedIds.has(serverFileId))
			{
				return;
			}

			hasFailed = true;
			this.#setItem({
				...item,
				status: BatchFileStatus.error,
				errorMessage: null,
				errorCode: DOCUMENT_ADD_FAILED_ERROR_CODE,
			});
		});

		if (hasFailed)
		{
			this.#emitItemsChange();
		}
	}

	/**
	 * Files of the batch no document exists for yet: a file stops being pending exactly when the
	 * server answers for it, so these files still hold their place in the document limit.
	 */
	getPendingCount(): number
	{
		return this.getItems().filter((item: BatchFileItem) => PENDING_STATUSES.has(item.status)).length;
	}

	hasPending(): boolean
	{
		return this.getPendingCount() > 0;
	}

	/**
	 * Bytes of the files still on their way into documents: a new selection joins them in the same
	 * batch, so it has to fit the total size limit together with what is already here.
	 */
	getPendingSize(): number
	{
		return this.getItems()
			.filter((item: BatchFileItem) => PENDING_STATUSES.has(item.status))
			.reduce((totalSize: number, item: BatchFileItem) => totalSize + item.size, 0)
		;
	}

	getLimitTotal(): number
	{
		return this.#limitTotal;
	}

	getDoneCount(): number
	{
		return this.#doneCount;
	}

	destroy(): void
	{
		this.#uploader.destroy();
		this.#items.clear();
		this.#serverFileIds.clear();
		this.#spentIds.clear();
		this.#hasPlaceholdersById.clear();
		this.#doneCount = 0;
		this.#isCommitting = false;
		this.#hasDeferredCommit = false;
	}

	/**
	 * The only place items are written: an item is replaced, never changed in place, so the view
	 * re-renders only the rows that really changed, and the done counter stays in step.
	 */
	#setItem(item: BatchFileItem): void
	{
		const wasDone = this.#items.get(item.id)?.status === BatchFileStatus.done;
		const isDone = item.status === BatchFileStatus.done;
		if (wasDone !== isDone)
		{
			this.#doneCount += isDone ? 1 : -1;
		}

		this.#items.set(item.id, item);
	}

	#deleteItem(id: string): void
	{
		if (this.#items.get(id)?.status === BatchFileStatus.done)
		{
			this.#doneCount--;
		}

		this.#items.delete(id);
		this.#serverFileIds.delete(id);
		this.#spentIds.delete(id);
		this.#hasPlaceholdersById.delete(id);
	}

	/**
	 * The uploader raises this synchronously for every file of the selection being added, which is
	 * the only moment the mode of that selection and the id of the file are known together.
	 */
	#addToUploader(files: File[], hasPlaceholders: boolean): void
	{
		this.#addedHasPlaceholders = hasPlaceholders;
		try
		{
			this.#uploader.addFiles(files);
		}
		finally
		{
			this.#addedHasPlaceholders = false;
		}
	}

	#onFileAddStart(event: BaseEvent): void
	{
		const file: UploaderFile = event.getData().file;
		this.#hasPlaceholdersById.set(file.getId(), this.#addedHasPlaceholders);
	}

	#hasPlaceholders(id: string): boolean
	{
		return this.#hasPlaceholdersById.get(id) === true;
	}

	/**
	 * Uploaded files that may still go into a commit, in the order the user selected them.
	 */
	#getCommitCandidateIds(): string[]
	{
		const candidateIds: string[] = [];
		this.#items.forEach((item: BatchFileItem, id: string) => {
			if (this.#serverFileIds.has(id) && !this.#spentIds.has(id))
			{
				candidateIds.push(id);
			}
		});

		return candidateIds;
	}

	#failByLimit(id: string): void
	{
		const item = this.#items.get(id);
		if (item === undefined)
		{
			return;
		}

		this.#setItem({
			...item,
			status: BatchFileStatus.error,
			errorMessage: null,
			errorCode: LIMIT_EXCEEDED_ERROR_CODE,
		});
		this.#emitItemsChange();
	}

	#onFileUploadStart(event: BaseEvent): void
	{
		const file: UploaderFile = event.getData().file;
		this.#setItem({
			id: file.getId(),
			name: file.getName(),
			size: file.getSize(),
			status: BatchFileStatus.uploading,
			progress: file.getProgress(),
			errorMessage: null,
			errorCode: null,
		});
		this.#emitItemsChange();
	}

	#onFileUploadProgress(event: BaseEvent): void
	{
		const file: UploaderFile = event.getData().file;
		const item = this.#items.get(file.getId());
		if (!item)
		{
			return;
		}

		this.#setItem({
			...item,
			status: BatchFileStatus.uploading,
			progress: file.getProgress(),
		});
		this.#emitProgressChange();
	}

	#onFileUploadComplete(event: BaseEvent): void
	{
		const file: UploaderFile = event.getData().file;
		const item = this.#items.get(file.getId());
		if (!item)
		{
			return;
		}

		const serverFileId = file.getServerFileId();
		if (serverFileId !== null)
		{
			this.#serverFileIds.set(file.getId(), String(serverFileId));
		}

		this.#setItem({ ...item, progress: 100 });
		this.#emitItemsChange();
	}

	#onFileError(event: BaseEvent): void
	{
		const file: UploaderFile = event.getData().file;
		const item = this.#items.get(file.getId());

		this.#setItem({
			id: file.getId(),
			name: file.getName(),
			size: file.getSize(),
			status: BatchFileStatus.error,
			progress: item?.progress ?? 0,
			errorMessage: file.getErrors()[0]?.getMessage() ?? null,
			errorCode: null,
		});
		this.#emitItemsChange();
	}

	/**
	 * The uploader raises this every time its queue runs dry, so only the files no document exists
	 * for go to the commit: otherwise a retry would create the whole batch a second time.
	 *
	 * A queue that ran dry while a commit is in flight waits for its outcome: the group is created
	 * by the first commit, and a second one started before that would create a second group.
	 */
	#onUploadComplete(): void
	{
		if (this.#isCommitting)
		{
			this.#hasDeferredCommit = true;

			return;
		}

		this.#startCommit();
	}

	/**
	 * The files of the commit take the committing status: the upload of every one of them is over,
	 * so their rows must stop looking like an upload until the outcome arrives.
	 *
	 * The placeholder mode is taken by the server for the whole call, so one commit carries the
	 * files of a single mode - the mode of the first file waiting to be committed. The files of the
	 * other modes go out as a deferred commit, one mode at a time.
	 */
	#startCommit(): void
	{
		const candidateIds = this.#getCommitCandidateIds();
		if (candidateIds.length === 0)
		{
			return;
		}

		const hasPlaceholders = this.#hasPlaceholders(candidateIds[0]);
		const commitIds = candidateIds.filter((id: string) => this.#hasPlaceholders(id) === hasPlaceholders);
		if (commitIds.length < candidateIds.length)
		{
			this.#hasDeferredCommit = true;
		}

		const fileIds: string[] = [];
		commitIds.forEach((id: string) => {
			const item = this.#items.get(id);
			const serverFileId = this.#serverFileIds.get(id);
			if (item === undefined || serverFileId === undefined)
			{
				return;
			}

			this.#spentIds.add(id);
			fileIds.push(serverFileId);
			this.#setItem({
				...item,
				status: BatchFileStatus.committing,
				progress: 100,
				errorMessage: null,
				errorCode: null,
			});
		});

		this.#isCommitting = true;
		this.#emitItemsChange();
		this.emit(BatchUploadService.events.allUploaded, { fileIds, hasPlaceholders });
	}

	/**
	 * Called once the outcome of the commit is already in the items, so a deferred commit picks up
	 * the files the finished one did not create a document for.
	 */
	#finishCommit(): void
	{
		this.#isCommitting = false;
		if (this.#failLeftoverCommitting())
		{
			this.#emitItemsChange();
		}

		if (!this.#hasDeferredCommit)
		{
			return;
		}

		this.#hasDeferredCommit = false;
		this.#startCommit();
	}

	/**
	 * A file the outcome said nothing about would keep the committing look for good, and its row
	 * would stay unremovable: it is failed instead, so the user can retry or remove it. Its token
	 * stays spent - the server did answer the commit that carried it.
	 */
	#failLeftoverCommitting(): boolean
	{
		let hasLeftover = false;
		this.#items.forEach((item: BatchFileItem, id: string) => {
			if (item.status !== BatchFileStatus.committing)
			{
				return;
			}

			hasLeftover = true;
			this.#setItem({
				...item,
				status: BatchFileStatus.error,
				errorMessage: null,
				errorCode: COMMIT_FAILED_ERROR_CODE,
			});
		});

		return hasLeftover;
	}

	#emitItemsChange(): void
	{
		this.emit(BatchUploadService.events.itemsChange, { items: this.getItems() });
	}
}
