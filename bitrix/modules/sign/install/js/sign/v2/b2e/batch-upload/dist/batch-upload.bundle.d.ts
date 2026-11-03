/* eslint-disable */
type BatchUploadServiceOptions = {
	limitTotal: number;
	acceptedFileTypes?: string[];
	maxFileSize?: number | null;
	/**
	 * Places left in the process, read at the moment of a retry: the batch of the service is only
	 * a part of the process, so the number is known to its owner alone.
	 */
	resolveLimitLeft?: () => number;
};

type BatchFileItem = {
	id: string;
	name: string;
	/** Bytes: the weight of the file in the total progress. 0 when the uploader does not know it. */
	size: number;
	status: BatchFileStatusType;
	progress: number;
	/** Client-side failure: the message of ui.uploader.core, already localized. */
	errorMessage: string | null;
	/** Server-side failure: the outcome code, turned into a phrase by the view. */
	errorCode: string | null;
};

type BatchFileStatusType = typeof BX.Sign.V2.B2e.BatchFileStatus[keyof typeof BX.Sign.V2.B2e.BatchFileStatus];

/**
 * Per-file outcome of sign.api_v1.b2e.document.group.addDocuments.
 */
type ServerBatchItem = {
	fileId: string | number;
	success: boolean;
	uid: string | null;
	documentId: number | null;
	blankId: number | null;
	/** Whether the blank of the file was created with placeholders; false for a failed file. */
	hasPlaceholders: boolean;
	errorCode: string | null;
};

type BatchUploadPopupOptions = {
	service: BX.Sign.V2.B2e.BatchUploadService;
	limitTotal: number;
	/**
	 * The limit spans the whole process, and only the wizard step knows how much of it is left:
	 * the window shows the number instead of working it out from the batch of its own list.
	 */
	resolveLimitLeft: () => number;
};

declare namespace BX.Sign.V2.B2e {
	/**
	 * Owns the batch: uploader instance, per-file state, limit slicing and retry.
	 *
	 * The service knows nothing about the popup: the view reads its state and the wizard step owns
	 * its lifetime, so closing the popup does not stop the upload.
	 */
	class BatchUploadService extends BX.Event.EventEmitter {
		static events: Readonly<{
			itemsChange: "itemsChange";
			allUploaded: "allUploaded";
			rejected: "rejected";
		}>;
		constructor(options: BatchUploadServiceOptions);
		/**
		 * Adds a batch already filtered by selection composition and slices it by the remaining limit.
		 * The placeholder mode belongs to the selection: the tile the files came from decides it, and
		 * several selections with different modes may live in one batch.
		 */
		addFiles(files: File[], limitLeft: number, hasPlaceholders?: boolean): void;
		removeFile(id: string): void;
		/**
		 * The uploader core has no public retry, so the very same binary is added again. The retried
		 * file gets a new id and a new server file id, so it is committed as a new one.
		 *
		 * A place in the process may have been taken by another file since the failure: uploading the
		 * whole file again only to have the server refuse it says nothing, so the row is refused here.
		 */
		retryFile(id: string): void;
		getItems(): BatchFileItem[];
		/**
		 * Uploaded file ids that may still go into a commit, in the order the user selected them: this
		 * order becomes the order of documents in the group.
		 */
		getUploadedFileIds(): string[];
		/**
		 * The server outcome is the source of truth for the final status of a file.
		 *
		 * A refused file keeps its token spent: the server consumed the token before it failed, so the
		 * same file id would only fail again. Its row offers a retry, which uploads the file anew.
		 */
		applyServerItems(serverItems: ServerBatchItem[]): void;
		/**
		 * The batch endpoint creates drafts before their files are checked by the signing service.
		 * Once that check is over, a missing draft is the outcome of a rejected file.
		 */
		getVerifiedServerItems(serverItems: ServerBatchItem[], documentUids: string[]): ServerBatchItem[];
		/**
		 * The batch endpoint failed as a whole: the files of that very call are uploaded, but no
		 * document was created for them and no token was consumed, so their rows drop the uploaded look
		 * and they go into the next commit.
		 *
		 * Only the files of the failed call go back. A file refused earlier by an outcome of its own
		 * keeps its token spent - the server consumed it before refusing - so returning it here would
		 * send an already spent token again and could create a second document for it.
		 */
		applyCommitFailure(): void;
		/**
		 * The documents of these files exist on the server, but the wizard could not take them in: their
		 * rows must say so instead of keeping the uploaded look. The tokens stay spent - a document
		 * exists for every one of them.
		 */
		applyDocumentFailure(serverFileIds: string[]): void;
		/**
		 * Files of the batch no document exists for yet: a file stops being pending exactly when the
		 * server answers for it, so these files still hold their place in the document limit.
		 */
		getPendingCount(): number;
		hasPending(): boolean;
		/**
		 * Bytes of the files still on their way into documents: a new selection joins them in the same
		 * batch, so it has to fit the total size limit together with what is already here.
		 */
		getPendingSize(): number;
		getLimitTotal(): number;
		getDoneCount(): number;
		destroy(): void;
	}

	const BatchFileStatus: {
		readonly pending: "pending";
		readonly uploading: "uploading";
		/** Uploaded and sent to the server, which is creating a document out of it. */
		readonly committing: "committing";
		readonly done: "done";
		readonly error: "error";
		readonly rejected: "rejected";
	};

	/**
	 * Popup around the Vue view: it holds no batch state of its own and only mirrors the service state.
	 */
	class BatchUploadPopup extends BX.Event.EventEmitter {
		static events: Readonly<{
			addMore: "addMore";
			close: "close";
		}>;
		constructor(options: BatchUploadPopupOptions);
		show(): void;
		close(): void;
		/**
		 * Called by the owner of the limit once its count of documents has changed: the number of
		 * remaining places does not follow from the items of the batch, so no event of the service
		 * carries it.
		 */
		refreshLimitLeft(): void;
		destroy(): void;
	}
}
