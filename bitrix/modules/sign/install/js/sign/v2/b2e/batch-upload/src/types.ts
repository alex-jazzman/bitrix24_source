export const BatchFileStatus = {
	pending: 'pending',
	uploading: 'uploading',
	/** Uploaded and sent to the server, which is creating a document out of it. */
	committing: 'committing',
	done: 'done',
	error: 'error',
	rejected: 'rejected',
} as const;

export type BatchFileStatusType = typeof BatchFileStatus[keyof typeof BatchFileStatus];

export type BatchFileItem = {
	id: string,
	name: string,
	/** Bytes: the weight of the file in the total progress. 0 when the uploader does not know it. */
	size: number,
	status: BatchFileStatusType,
	progress: number,
	/** Client-side failure: the message of ui.uploader.core, already localized. */
	errorMessage: string | null,
	/** Server-side failure: the outcome code, turned into a phrase by the view. */
	errorCode: string | null,
};

/**
 * Per-file outcome of sign.api_v1.b2e.document.group.addDocuments.
 */
export type ServerBatchItem = {
	fileId: string | number,
	success: boolean,
	uid: string | null,
	documentId: number | null,
	blankId: number | null,
	/** Whether the blank of the file was created with placeholders; false for a failed file. */
	hasPlaceholders: boolean,
	errorCode: string | null,
};

export type BatchUploadServiceOptions = {
	limitTotal: number,
	acceptedFileTypes?: string[],
	maxFileSize?: number | null,
	/**
	 * Places left in the process, read at the moment of a retry: the batch of the service is only
	 * a part of the process, so the number is known to its owner alone.
	 */
	resolveLimitLeft?: () => number,
};
