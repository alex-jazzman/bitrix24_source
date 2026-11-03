import { Loc, Type } from 'main.core';

import { Core } from 'im.v2.application.core';
import { Utils } from 'im.v2.lib.utils';
import { UploadingService, type AddFilesResult, type FileParams } from 'im.v2.provider.service.uploading';

import { resolveFileUploadPolicy } from './policy/policy-resolver';
import {
	getMaxParallelLoads,
	makeChunks,
	takeWithinBatchLimit,
	MAX_FILES_COUNT_IN_ONE_MESSAGE,
} from './utils/chunks';
import {
	FileValidationError,
	validateFileList,
	type AnnotatedFile,
	type FileLike,
	type FileUploadPolicy,
	type ValidationError,
} from './validator/file-validator';

import { FileStatus, type UploaderFile } from 'ui.uploader.core';
import { type MultiUploadingResult, type ValueOf } from './types/uploading';

const MAX_PARALLEL_UPLOADS = 3;
const BYTES_IN_MB = 1024 * 1024;

const SET_LEVEL_ERROR_CODES: Set<ValueOf<typeof FileValidationError>> = new Set([
	FileValidationError.DUPLICATE_FILE,
	FileValidationError.TOO_MANY_FILES,
]);

export type ResolvedValidationError = {
	code: ValueOf<typeof FileValidationError>,
	text: string,
};

type DiskFileRaw = {
	id: string,
	name: string,
	sizeInt: string | number,
	size?: string | number,
};

type AddDiskFilesParams = {
	files: DiskFileRaw[],
	dialogId: string,
	messageId?: number | null,
};

type AddDiskFilesResult = MultiUploadingResult & {
	errors: ResolvedValidationError[],
	overLimitCount: number,
};

type AddFilesToPreviewParams = {
	files: File[],
	dialogId: string,
	messageId?: number | null,
	sendAsFile?: boolean,
	// the composition as the window shows it: the count a caller with the window open knows
	compositionCount?: number | null,
};

type AddFilesToPreviewResult = {
	sessionId: string,
	addedCount: number,
	overLimitCount: number,
	errors: ResolvedValidationError[],
};

type BatchLimitScope = {
	dialogId: string,
	messageId: number | null,
	// what a portion of a draft joins; a portion that replaces the batch whole is not bounded here
	sessionCount?: number | null,
	compositionCount?: number | null,
};

type UploadParams = {
	files: Array<File | Blob | Object>,
	dialogId: string,
	autoUpload?: boolean,
	sendAsFile?: boolean,
	maxFilesCount?: number,
	fileParams?: FileParams,
};

/**
 * Single entry point for "user attaches files to a chat".
 * Owns policy validation, error annotation and file-set routing;
 * delegates chunking to utils/chunks and the actual upload to UploadingService.
 */
export class UploadManager
{
	#getUploadingService(): UploadingService
	{
		return UploadingService.getInstance();
	}

	getPolicy(dialogId: string): FileUploadPolicy | null
	{
		return resolveFileUploadPolicy(dialogId);
	}

	getAcceptAttribute(dialogId: string): string | null
	{
		const policy = resolveFileUploadPolicy(dialogId);
		if (!policy || !Type.isArrayFilled(policy.allowedExtensions))
		{
			return null;
		}

		return policy.allowedExtensions.map((ext: string) => `.${ext}`).join(',');
	}

	/**
	 * Adds files to the preview session of the scope, validating them against the batch already composed.
	 * A messageId addresses the attachments of that message being edited, its absence - the draft.
	 */
	async addFilesToPreview(params: AddFilesToPreviewParams): Promise<AddFilesToPreviewResult>
	{
		const { files, dialogId, messageId = null, sendAsFile = false, compositionCount = null } = params;
		const policy = resolveFileUploadPolicy(dialogId);
		const service = this.#getUploadingService();

		let sessionId: string | null = service.getPreviewSessionId({ dialogId, messageId }) ?? null;

		// a batch never mixes sources, so a session composed from disk is replaced, not joined
		if (sessionId !== null && service.getPreviewSessionOrigin(sessionId) !== 'local')
		{
			service.destroyPreviewSession(sessionId);
			sessionId = null;
		}

		sessionId = sessionId ?? await service.createPreviewSession({ dialogId, messageId, origin: 'local' });

		const existing: FileLike[] = service.getPreviewSessionFiles(sessionId).map((file: UploaderFile) => ({
			name: file.getName(),
			size: file.getSize(),
		}));

		const { annotated, errors } = validateFileList(files, existing, policy);
		const withinLimit = this.#takeWithinScopeLimit(annotated, {
			dialogId,
			messageId,
			sessionCount: existing.length,
			compositionCount,
		});
		const accepted = withinLimit.map((item) => item.file);

		service.addFilesToPreviewSession({ sessionId, files: accepted, sendAsFile });

		this.#annotateValidationErrors([sessionId], withinLimit, policy);

		const setLevelErrors = errors.filter((error: ValidationError) => SET_LEVEL_ERROR_CODES.has(error.code));

		return {
			sessionId,
			addedCount: accepted.length,
			overLimitCount: annotated.length - withinLimit.length,
			errors: this.#resolveErrors(setLevelErrors, policy),
		};
	}

	/**
	 * Adds files picked from disk to the batch of the scope, addressed the way addFilesToPreview is. The
	 * batch of an edit holds both sources at once, so there the pick joins what was composed before.
	 */
	async addDiskFiles(params: AddDiskFilesParams): Promise<AddDiskFilesResult>
	{
		const { files, dialogId, messageId = null } = params;
		const policy = resolveFileUploadPolicy(dialogId);

		const diskFiles: DiskFileRaw[] = Object.values(files ?? {});

		const normalized = diskFiles.map((file: DiskFileRaw) => ({
			name: file.name ?? '',
			size: Number(file.sizeInt ?? file.size ?? 0),
			original: file,
		}));

		const { annotated, errors } = validateFileList(normalized, [], policy);
		const withinLimit = this.#takeWithinScopeLimit(annotated, { dialogId, messageId });
		const acceptedFiles: DiskFileRaw[] = withinLimit.map((item) => item.file.original);

		const { sessionId, uploaderFiles, uploadAllComplete } = messageId === null
			? await this.#pickDiskFilesForDraft(acceptedFiles, dialogId)
			: await this.#pickDiskFilesForEdit(acceptedFiles, dialogId, messageId);

		// the batch may die while its files are being read - the window closed, the scope changed - and a pick
		// with no batch left has nothing to mark and nothing to say to an author who is out of the edit already
		if (sessionId === null)
		{
			return {
				uploadingId: Utils.text.getUuidV4(),
				uploaderIds: [],
				sourceFilesCount: diskFiles.length,
				overLimitCount: 0,
				loadAllComplete: Promise.resolve(),
				uploadAllComplete: Promise.resolve(),
				errors: [],
			};
		}

		this.#annotateValidationErrors([sessionId], withinLimit, policy);
		this.#annotateDiskLoadErrors(uploaderFiles);

		const setLevelErrors = errors.filter((error: ValidationError) => SET_LEVEL_ERROR_CODES.has(error.code));

		return {
			uploadingId: Utils.text.getUuidV4(),
			uploaderIds: Type.isArrayFilled(uploaderFiles) ? [sessionId] : [],
			sourceFilesCount: diskFiles.length,
			overLimitCount: annotated.length - withinLimit.length,
			loadAllComplete: Promise.resolve(),
			uploadAllComplete,
			errors: this.#resolveErrors(setLevelErrors, policy),
		};
	}

	async #pickDiskFilesForDraft(files: DiskFileRaw[], dialogId: string): Promise<{
		sessionId: string,
		uploaderFiles: UploaderFile[],
		uploadAllComplete: Promise<any>,
	}>
	{
		const { uploaderId, uploaderFiles, loadAllComplete, uploadAllComplete } = await this.#getUploadingService()
			.addFilesFromDisk({ files, dialogId });

		await loadAllComplete;

		return { sessionId: uploaderId, uploaderFiles, uploadAllComplete };
	}

	async #pickDiskFilesForEdit(files: DiskFileRaw[], dialogId: string, messageId: number): Promise<{
		sessionId: string | null,
		uploaderFiles: UploaderFile[],
		uploadAllComplete: Promise<any>,
	}>
	{
		const { sessionId, uploaderFiles, loadAllComplete } = await this.#getUploadingService()
			.addDiskFilesToPreviewSession({ files, dialogId, messageId });

		// the holder refuses the read when it is destroyed under it, and then the batch of the pick is gone
		const isBatchAlive: boolean = await loadAllComplete.then(() => true, () => false);
		if (!isBatchAlive)
		{
			return { sessionId: null, uploaderFiles: [], uploadAllComplete: Promise.resolve() };
		}

		// the batch of an edit is uploaded by the save and not before it, so nothing is on its way here
		return { sessionId, uploaderFiles, uploadAllComplete: Promise.resolve() };
	}

	/**
	 * The part of the portion the scope still admits - the single limit rule of both add paths.
	 * An edit is bounded by the limit of one message counted on the composition; a draft is bounded
	 * by the batch limit counted on its session.
	 */
	#takeWithinScopeLimit<T>(portion: Array<AnnotatedFile<T>>, scope: BatchLimitScope): Array<AnnotatedFile<T>>
	{
		const { dialogId, messageId, sessionCount = null, compositionCount = null } = scope;

		if (messageId !== null)
		{
			return takeWithinBatchLimit(
				portion,
				this.#getEditedCompositionCount(dialogId, messageId, compositionCount),
				MAX_FILES_COUNT_IN_ONE_MESSAGE,
			);
		}

		return sessionCount === null ? portion : takeWithinBatchLimit(portion, sessionCount);
	}

	/**
	 * The composition of an edit the limit is counted on. The window that shows it is the only authority:
	 * a file taken out of the composition is still in the message until the save. With no window open
	 * nothing has been taken out yet, and the composition is the message plus what this edit has added.
	 */
	#getEditedCompositionCount(dialogId: string, messageId: number, shownCount: number | null): number
	{
		if (Type.isNumber(shownCount))
		{
			return shownCount;
		}

		const service = this.#getUploadingService();
		const sessionId: string | null = service.getPreviewSessionId({ dialogId, messageId }) ?? null;
		const message = Core.getStore().getters['messages/getById'](messageId);

		return (message?.files?.length ?? 0)
			+ (sessionId === null ? 0 : service.getPreviewSessionFiles(sessionId).length);
	}

	/**
	 * Raw chunked upload without policy validation.
	 * Use for re-uploading already-validated files (e.g. send from preview popup).
	 */
	async upload(params: UploadParams): Promise<MultiUploadingResult>
	{
		const { files, dialogId, autoUpload = false, sendAsFile = false, maxFilesCount, fileParams } = params;

		const chunks = makeChunks({ files, maxFilesCount });

		const addFilesResults: Array<AddFilesResult> = await Promise.all(
			chunks.map((chunk: Array<File | Blob | Object>) => {
				return this.#getUploadingService().addFiles({
					files: (chunk as File[]),
					maxParallelLoads: getMaxParallelLoads(chunks),
					maxParallelUploads: MAX_PARALLEL_UPLOADS,
					dialogId,
					autoUpload,
					sendAsFile,
					fileParams,
				});
			}),
		);

		const uploaderIds: Array<string> = [];
		const loadCompletePromises: Array<Promise<any>> = [];
		const uploadCompletePromises: Array<Promise<any>> = [];

		addFilesResults.forEach(({ uploaderId, uploaderFiles, loadAllComplete, uploadAllComplete }) => {
			if (Type.isArrayFilled(uploaderFiles))
			{
				uploaderIds.push(uploaderId);
				loadCompletePromises.push(loadAllComplete);
				uploadCompletePromises.push(uploadAllComplete);
			}
		});

		return {
			uploadingId: Utils.text.getUuidV4(),
			uploaderIds,
			sourceFilesCount: files.length,
			loadAllComplete: Promise.all(loadCompletePromises),
			uploadAllComplete: Promise.all(uploadCompletePromises),
		};
	}

	#annotateValidationErrors(
		uploaderIds: string[],
		annotated: AnnotatedFile<FileLike>[],
		policy: FileUploadPolicy | null,
	): void
	{
		const errorByKey: Record<string, ValueOf<typeof FileValidationError>> = {};
		annotated.forEach((item) => {
			if (item.code)
			{
				errorByKey[this.#getFileKey(item.file)] = item.code;
			}
		});

		if (Object.keys(errorByKey).length === 0)
		{
			return;
		}

		const uploadingService = this.#getUploadingService();
		uploaderIds.forEach((uploaderId: string) => {
			uploadingService.getFiles(uploaderId).forEach((uploaderFile: UploaderFile) => {
				const key = `${uploaderFile.getName?.() ?? ''}:${Number(uploaderFile.getSize?.() ?? 0)}`;
				const code = errorByKey[key];
				if (code)
				{
					this.#setValidationError(uploaderFile.getId(), this.#resolveErrorText(code, policy));
				}
			});
		});
	}

	// only the files of this pick: the batch of an edit may hold files of another source
	#annotateDiskLoadErrors(files: UploaderFile[]): void
	{
		files.forEach((uploaderFile: UploaderFile) => {
			const fileModel = Core.getStore().getters['files/get'](uploaderFile.getId());
			const alreadyFlagged = Boolean(fileModel?.validationError);
			if (!alreadyFlagged && uploaderFile.getStatus?.() === FileStatus.LOAD_FAILED)
			{
				this.#setValidationError(uploaderFile.getId(), Loc.getMessage('ERROR_CHAT_FILE_METADATA_UNAVAILABLE') ?? '');
			}
		});
	}

	#setValidationError(fileId: string | number, text: string): void
	{
		void Core.getStore().dispatch('files/update', {
			id: fileId,
			fields: { validationError: text },
		});
	}

	#resolveErrors(errors: ValidationError[], policy: FileUploadPolicy | null): ResolvedValidationError[]
	{
		const seenCodes: Set<ValueOf<typeof FileValidationError>> = new Set();
		const resolved: ResolvedValidationError[] = [];

		errors.forEach((error: ValidationError) => {
			if (seenCodes.has(error.code))
			{
				return;
			}

			seenCodes.add(error.code);
			resolved.push({ code: error.code, text: this.#resolveErrorText(error.code, policy) });
		});

		return resolved;
	}

	#resolveErrorText(code: ValueOf<typeof FileValidationError>, policy: FileUploadPolicy | null): string
	{
		const messageId = `ERROR_CHAT_${code}`;

		if (code === FileValidationError.FILE_TOO_LARGE)
		{
			const maxFileSize = policy?.maxFileSize ?? 0;
			const sizeMb = maxFileSize > 0 ? Math.max(1, Math.round(maxFileSize / BYTES_IN_MB)) : 0;

			return Loc.getMessage(messageId, { '#SIZE_MB#': String(sizeMb) }) ?? '';
		}

		if (code === FileValidationError.TOO_MANY_FILES)
		{
			const count = policy?.maxFilesPerMessage ?? 0;

			return Loc.getMessagePlural(messageId, count, { '#COUNT#': String(count) }) ?? '';
		}

		return Loc.getMessage(messageId) ?? '';
	}

	#getFileKey(file: FileLike): string
	{
		return `${file.name}:${Number(file.size)}`;
	}
}
