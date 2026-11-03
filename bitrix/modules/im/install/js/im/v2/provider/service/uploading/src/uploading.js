import { Type } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';
import { FileOrigin, FileStatus as UploaderFileStatus, isResizableImage, type UploaderFile, type UploaderError } from 'ui.uploader.core';
import { type Store } from 'ui.vue3.vuex';

import { type RestClient } from 'rest.client';

import { Core } from 'im.v2.application.core';
import { FileStatus, FileType, RestMethod } from 'im.v2.const';
import { Logger } from 'im.v2.lib.logger';
import { Notifier } from 'im.v2.lib.notifier';
import { runAction } from 'im.v2.lib.rest';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelChat, type ImModelUser, type ImModelMessage } from 'im.v2.model';
import { SendingService } from 'im.v2.provider.service.sending';

import { type UploaderWrapperFileOptions } from './classes/types/uploader-wrapper';
import { UploaderWrapper } from './classes/uploader-wrapper';
import {
	type CommitFileParams,
	type FileCommitParams,
	type FileParams,
	type UploadFilesParams,
	type PreviewSession,
	type PreviewSessionOrigin,
	type PreviewSessionScope,
	type CreatePreviewSessionParams,
	type AddFilesToPreviewSessionParams,
	type AddDiskFilesToPreviewSessionParams,
	type RemoveFileFromPreviewSessionParams,
	type DestroyUploaderOptions,
} from './types/uploading';
import { createDeferredPromise } from './utils/deferred-promise';

type CreateUploaderParams = {
	dialogId: number,
	autoUpload: boolean,
	sendAsFile: boolean,
	maxParallelUploads: number,
	maxParallelLoads: number,
	fileParams?: FileParams,
	// the message the batch belongs to; without it the batch becomes a new message of its own
	messageId?: ?number,
};

type UploadCompletion = {
	promise: Promise<any>,
	resolve: () => void,
	reject: (error: Error) => void,
};

const EVENT_NAMESPACE = 'BX.Messenger.v2.Service.UploadingService';

const PREVIEW_SESSION_MAX_PARALLEL_UPLOADS = 1;
const PREVIEW_SESSION_MAX_PARALLEL_LOADS = 10;
const PREVIEW_SESSION_SCOPE_SEPARATOR = '#';

const FAILED_UPLOADER_STATUSES: Set<string> = new Set([
	UploaderFileStatus.LOAD_FAILED,
	UploaderFileStatus.UPLOAD_FAILED,
]);

// a file stops moving read and ready or uploaded; before that the id a message is composed of has no value
const SETTLED_UPLOADER_STATUSES: Set<string> = new Set([
	UploaderFileStatus.PENDING,
	UploaderFileStatus.COMPLETE,
]);

/**
 * What stood in the way of a voice record reaching the chat. The record comes back to the panel it
 * was sent from whichever of them it was, but they are repaired in different places, so the panel
 * never names them with one text.
 */
export const VoiceSendFailure = Object.freeze({
	noSpace: 'noSpace',
	tooLarge: 'tooLarge',
	network: 'network',
	unknown: 'unknown',
});

// only the code that names the quota itself: a refused write (`SAVE_FILE_FAILED`) answers for the
// rights of the directory and for a rejected file just as well, and sending the user to free up disk
// space would be wrong for either
const NO_SPACE_ERROR_CODES = new Set(['QUOTA_BAD']);

// the client stage of the recording is capped higher than the default limit of the portal, so a long
// record can be refused by size alone
const TOO_LARGE_ERROR_CODES = new Set(['MAX_FILE_SIZE_EXCEEDED']);

// a request that never reached the portal is named by the uploader and by the rest client apart
const NETWORK_ERROR_CODES = new Set(['NETWORK_ERROR', 'ERROR_NETWORK', 'BLANK_ANSWER']);

export const getVoiceSendFailure = (errorCode: ?string): string => {
	if (NO_SPACE_ERROR_CODES.has(errorCode))
	{
		return VoiceSendFailure.noSpace;
	}

	if (TOO_LARGE_ERROR_CODES.has(errorCode))
	{
		return VoiceSendFailure.tooLarge;
	}

	if (NETWORK_ERROR_CODES.has(errorCode))
	{
		return VoiceSendFailure.network;
	}

	return VoiceSendFailure.unknown;
};

export class UploadingService extends EventEmitter
{
	#store: Store;
	#restClient: RestClient;
	#isRequestingDiskFolderId: boolean = false;
	#diskFolderIdRequestPromise: { [string]: Promise } = {};
	#uploaderWrappers: Map<string, UploaderWrapper> = new Map();
	// keyed by the scope of the batch (#getPreviewSessionScopeKey), not by the dialog alone
	#previewSessions: Map<string, PreviewSession> = new Map();
	// keyed the same way: the two scopes of a dialog may be composing a batch at the same time
	#previewSessionCreations: Map<string, Promise<string>> = new Map();
	#previewSessionOwners: Map<string, Set<string>> = new Map();
	// the completion of the current run, so a caller that did not create the holder can still wait for it
	#uploadCompletions: Map<string, UploadCompletion> = new Map();
	// every portion still waiting for its read, keyed by the holder that owes them the outcome
	#loadCompletions: Map<string, Set<UploadCompletion>> = new Map();
	#sendingService: SendingService;

	static event = {
		uploadStart: 'uploadStart',
		uploadComplete: 'uploadComplete',
		uploadError: 'uploadError',
		uploadCancel: 'uploadCancel',
		voiceRecordSent: 'voiceRecordSent',
		voiceRecordSendFailed: 'voiceRecordSendFailed',
	};

	#queue: Array<string> = [];
	// the holder the single queue is busy with, and the only thing that says the queue is busy at all
	#uploadingId: ?string = null;

	static instance = null;

	static getInstance(): UploadingService
	{
		if (!this.instance)
		{
			this.instance = new this();
		}

		return this.instance;
	}

	constructor()
	{
		super();
		this.setEventNamespace(EVENT_NAMESPACE);

		this.#store = Core.getStore();
		this.#restClient = Core.getRestClient();
		this.#sendingService = SendingService.getInstance();
	}

	// eslint-disable-next-line max-lines-per-function
	async #createUploader(params: CreateUploaderParams): Promise<{
		uploaderWrapper: UploaderWrapper,
		loadAllComplete: Promise<any>,
		uploadAllComplete: Promise<any>,
	}>
	{
		const {
			dialogId,
			autoUpload = false,
			sendAsFile = false,
			maxParallelUploads,
			maxParallelLoads,
			fileParams,
			messageId = null,
		} = params;

		const uploaderId = Utils.text.getUuidV4();
		const chatId = this.#getChatId(dialogId);
		const folderId = await this.checkDiskFolderId(dialogId);
		const isMessageEdit = messageId !== null;
		// an edit has a message already, so there is no record of its own for the batch to appear as
		const tempMessageId = isMessageEdit ? null : Utils.text.getUuidV4();

		const loadAllComplete = createDeferredPromise();
		const uploadAllComplete = createDeferredPromise();
		const uploadPreviewPromises = [];

		const uploaderWrapper = new UploaderWrapper({
			uploaderId,
			uploaderOptions: {
				autoUpload,
				maxParallelLoads,
				maxParallelUploads,
				controllerOptions: {
					folderId,
					chat: {
						chatId,
						dialogId,
					},
				},
			},
			customData: {
				chatId,
				dialogId,
				tempMessageId,
				sendAsFile,
				fileParams,
			},
			events: {
				[UploaderWrapper.Event.onFileAddStart]: (event: BaseEvent) => {
					const { file } = event.getData();
					this.#addFileToStore(file, sendAsFile, fileParams);
				},
				[UploaderWrapper.Event.onFileStatusChange]: (event: BaseEvent) => {
					const { file }: { file: UploaderFile } = event.getData();
					const target: UploaderWrapper = event.getTarget();

					// SERVER-origin files (picked from disk) settle at COMPLETE right after preload —
					// there is nothing to upload — so mirror their metadata into the store here too.
					const isLoadedFromDisk = file.getStatus() === UploaderFileStatus.COMPLETE
						&& file.getOrigin() === FileOrigin.SERVER;

					if (file.getStatus() === UploaderFileStatus.PENDING || isLoadedFromDisk)
					{
						this.#updateFileSizeInStore(file);
						this.#updateFilePreviewInStore(file, sendAsFile);

						if (this.#shouldTreatFileAsDocument(file) && !this.#isVoiceRecordUpload(target))
						{
							this.#updateFileTypeInStore(file, FileType.file);
							file.setTreatImageAsFile(true);
							file.setCustomData('sendAsFile', true);
						}
					}

					// The window of an edit reads the state of its batch from the store: the status an
					// UploaderFile keeps is outside Vue reactivity, so a change of it reaches nothing.
					if (isMessageEdit)
					{
						this.#mirrorFileStatus(file);
					}

					if (target.isAllLoadSettled())
					{
						loadAllComplete.resolve();
					}
				},
				[UploaderWrapper.Event.onFileUploadStart]: (event: BaseEvent) => {
					const { file } = event.getData();
					this.#updateFileSizeInStore(file);
					this.emit(UploadingService.event.uploadStart);
				},
				[UploaderWrapper.Event.onFileUploadProgress]: (event: BaseEvent) => {
					const { file } = event.getData();
					this.#updateFileProgress(file.getId(), file.getProgress(), FileStatus.upload);
				},
				[UploaderWrapper.Event.onFileUploadComplete]: async (event: BaseEvent) => {
					const { file } = event.getData();
					const serverFileId: number = Number(file.getServerFileId().toString().slice(1));
					const temporaryFileId: string = file.getId();
					const target: UploaderWrapper = event.getTarget();
					if (this.#isMediaFile(file) || this.#isVoiceRecordUpload(target))
					{
						this.#setFileMapping({ serverFileId, temporaryFileId });
					}

					this.#updateFileProgress(temporaryFileId, file.getProgress(), FileStatus.wait);

					uploadPreviewPromises.push(
						this.#uploadPreview(file),
					);

					this.emit(UploadingService.event.uploadComplete);
				},
				[UploaderWrapper.Event.onFileUploadError]: (event: BaseEvent) => {
					const { error, file } = event.getData();
					const target = event.getTarget();

					// a record that did not reach the chat goes back to the panel it was sent from,
					// so the message shown to the sender leaves the feed instead of standing in it
					if (this.#isVoiceRecordUpload(target))
					{
						Logger.error('UploadingService: voice record upload error', error);
						this.emit(UploadingService.event.uploadError);

						this.stop(uploaderId);
						this.#failVoiceRecordSend(target, getVoiceSendFailure(error.getCode()));

						return;
					}

					// an edit has no record of its own to fail, and one bad file does not lose the batch: only that
					// file goes to the error state, and the queue keeps going so the rest still reach the chat folder
					if (isMessageEdit)
					{
						this.#reportUploadError(error, file);

						return;
					}

					this.#setMessageError(target.getCustomData('tempMessageId'));

					target.getFiles().forEach((uploaderFile: UploaderFile) => {
						this.#updateFileProgress(uploaderFile.getId(), 0, FileStatus.error);
					});

					if (this.#isMaxFileSizeExceeded(error))
					{
						Notifier.file.handleUploadError(error);
					}

					Logger.error('UploadingService: upload error', error);
					this.emit(UploadingService.event.uploadError);

					this.#uploadingId = null;
					this.#processQueue();
					this.stop(uploaderId);
				},
				[UploaderWrapper.Event.onFileUploadCancel]: (event: BaseEvent) => {
					const { tempFileId } = event.getData();
					this.#cancelUpload(tempMessageId, tempFileId);
					this.emit(UploadingService.event.uploadCancel);
				},
				[UploaderWrapper.Event.onUploadComplete]: async (event: BaseEvent) => {
					this.#uploadingId = null;
					this.#processQueue();

					const target: UploaderWrapper = event.getTarget();
					if (!target.isAllCompleted())
					{
						// the save of an edit waits for this batch, and a queue that ended with a failure never
						// reports done again: the refusal has to reach the caller here or it would wait forever
						if (isMessageEdit)
						{
							this.#settleUploadCompletion(
								uploaderId,
								new Error('UploadingService: the batch failed to upload'),
							);
						}

						return;
					}

					await Promise.all(uploadPreviewPromises);
					// a repeat sends the batch up again, and the promises just waited for must not be waited for twice
					uploadPreviewPromises.length = 0;
					uploadAllComplete.resolve();

					// the holder of an edit outlives its upload: its file ids go into the composition of the update
					if (isMessageEdit)
					{
						this.#settleUploadCompletion(uploaderId);

						return;
					}

					// a refused publication keeps the holder: the retry button repeats the send through it
					if (await this.commitMessage(uploaderId))
					{
						this.#destroyUploader(uploaderId);
					}
				},
			},
		});

		this.#uploadCompletions.set(uploaderId, uploadAllComplete);

		return {
			uploaderWrapper,
			loadAllComplete: loadAllComplete.promise,
			uploadAllComplete: uploadAllComplete.promise,
		};
	}

	prepareFilesOptions(
		files: Array<File | Blob | UploaderFile>,
		options: { chatId: number, dialogId: number },
		sendAsFile: boolean,
	): Array<UploaderWrapperFileOptions>
	{
		return files.map((file: UploaderWrapperFileOptions | UploaderFile) => {
			const id = Utils.text.getUuidV4();

			if (Type.isFunction(file.getBinary))
			{
				const binary = file.getBinary();

				return {
					file: binary,
					options: {
						...file.toJSON(),
						clientPreview: file.getClientPreview(),
						id,
						customData: {
							sendAsFile,
							...options,
						},
						treatImageAsFile: sendAsFile,
						// an own url per copy: toJSON() hands over the source one, which dies with its session
						downloadUrl: Type.isBlob(binary) ? URL.createObjectURL(binary) : file.getDownloadUrl(),
					},
				};
			}

			return {
				file,
				options: {
					id,
					customData: {
						sendAsFile,
						...options,
					},
					downloadUrl: URL.createObjectURL(file),
				},
			};
		});
	}

	async addFiles(params: UploadFilesParams): Promise<{
		uploaderFiles: UploaderFile[],
		uploaderId: string,
		loadAllComplete: Promise<any>,
		uploadAllComplete: Promise<any>,
	}>
	{
		const {
			files,
			dialogId,
			autoUpload,
			sendAsFile = false,
			maxParallelUploads,
			maxParallelLoads,
			fileParams,
		} = params;

		const {
			uploaderWrapper,
			loadAllComplete,
			uploadAllComplete,
		} = await this.#createUploader({
			dialogId,
			autoUpload,
			sendAsFile,
			maxParallelUploads,
			maxParallelLoads,
			fileParams,
		});
		const uploaderId: string = uploaderWrapper.getId();
		const chatId = this.#getChatId(dialogId);

		this.#uploaderWrappers.set(uploaderId, uploaderWrapper);

		const filesOptions = this.prepareFilesOptions(
			files,
			{
				chatId,
				dialogId,
			},
			sendAsFile,
		);

		const uploaderFiles = uploaderWrapper.addFiles(filesOptions);

		return {
			uploaderFiles,
			uploaderId,
			loadAllComplete,
			uploadAllComplete,
		};
	}

	async addFilesFromDisk(params: {
		files: Array<{ id: string, name: string }>,
		dialogId: string,
		sendAsFile?: boolean,
	}): Promise<{
		uploaderFiles: UploaderFile[],
		uploaderId: string,
		loadAllComplete: Promise<any>,
		uploadAllComplete: Promise<any>,
	}>
	{
		const { files, dialogId, sendAsFile = false } = params;

		const {
			uploaderWrapper,
			loadAllComplete,
			uploadAllComplete,
		} = await this.#createUploader({
			dialogId,
			autoUpload: false,
			sendAsFile,
			maxParallelUploads: 1,
			maxParallelLoads: 10,
		});
		const uploaderId: string = uploaderWrapper.getId();

		this.#uploaderWrappers.set(uploaderId, uploaderWrapper);

		const uploaderFiles = uploaderWrapper.addDiskFiles(this.#prepareDiskFileItems(files, {
			dialogId,
			sendAsFile,
		}));

		if (Type.isArrayFilled(uploaderFiles))
		{
			this.#replacePreviewSession({ dialogId, messageId: null }, { uploaderId, origin: 'disk' });
		}
		else
		{
			// nothing was taken in: an empty holder must not become the session the next pick joins
			this.#destroyUploader(uploaderId);
		}

		return {
			uploaderFiles,
			uploaderId,
			loadAllComplete,
			uploadAllComplete,
		};
	}

	/**
	 * The batch of an edit holds two sources at once, so a pick from disk joins it instead of taking its
	 * place, and it keeps the local origin the window needs to accept anything else.
	 */
	async addDiskFilesToPreviewSession(params: AddDiskFilesToPreviewSessionParams): Promise<{
		sessionId: string,
		uploaderFiles: UploaderFile[],
		loadAllComplete: Promise<any>,
	}>
	{
		const { files, dialogId, messageId = null, sendAsFile = false } = params;

		const sessionId: string = await this.createPreviewSession({ dialogId, messageId, origin: 'local' });
		const uploaderWrapper: ?UploaderWrapper = this.#uploaderWrappers.get(sessionId);
		if (!uploaderWrapper)
		{
			return { sessionId, uploaderFiles: [], loadAllComplete: Promise.resolve() };
		}

		const uploaderFiles = uploaderWrapper.addDiskFiles(this.#prepareDiskFileItems(files, {
			dialogId,
			sendAsFile,
		}));

		return {
			sessionId,
			uploaderFiles,
			loadAllComplete: this.#getFilesLoadSettled(uploaderWrapper, uploaderFiles),
		};
	}

	#prepareDiskFileItems(
		files: Array<{ id: string, name: string }>,
		options: { dialogId: string, sendAsFile: boolean },
	): Array<{ id: string, name: string, customData: { [string]: any } }>
	{
		const { dialogId, sendAsFile } = options;
		const chatId = this.#getChatId(dialogId);

		return files.map((file: { id: string, name: string }) => {
			return {
				id: file.id,
				name: file.name,
				customData: {
					diskFileId: file.id,
					sendAsFile,
					chatId,
					dialogId,
				},
			};
		});
	}

	// a holder reports the load of its own batch complete once and never again, so a later portion waits here
	#getFilesLoadSettled(uploaderWrapper: UploaderWrapper, files: UploaderFile[]): Promise<void>
	{
		const isLoadSettled = (): boolean => {
			const heldFileIds: Set<string> = new Set(uploaderWrapper.getFilesIds());

			return files
				.filter((file: UploaderFile) => heldFileIds.has(file.getId()))
				.every((file: UploaderFile) => {
					const status = file.getStatus();

					return SETTLED_UPLOADER_STATUSES.has(status) || FAILED_UPLOADER_STATUSES.has(status);
				});
		};

		if (isLoadSettled())
		{
			return Promise.resolve();
		}

		const uploaderId: string = uploaderWrapper.getId();
		const completion: UploadCompletion = createDeferredPromise();
		const onFileStatusChange = () => {
			if (isLoadSettled())
			{
				completion.resolve();
			}
		};

		const completions: Set<UploadCompletion> = this.#loadCompletions.get(uploaderId) ?? new Set();
		completions.add(completion);
		this.#loadCompletions.set(uploaderId, completions);

		uploaderWrapper.subscribe(UploaderWrapper.Event.onFileStatusChange, onFileStatusChange);

		// the wait is over either way here: with the batch read or with the holder gone from under it
		const loadSettled: Promise<void> = completion.promise.finally(() => {
			uploaderWrapper.unsubscribe(UploaderWrapper.Event.onFileStatusChange, onFileStatusChange);
			this.#forgetLoadCompletion(uploaderId, completion);
		});
		// the refusal of a read nobody waits for any more must not turn into an unhandled rejection
		loadSettled.catch(() => {});

		return loadSettled;
	}

	// the read of a portion hears nothing from a holder that is gone, so its refusal is given here instead
	#settleLoadCompletions(uploaderId: string, error: Error)
	{
		const completions: ?Set<UploadCompletion> = this.#loadCompletions.get(uploaderId);
		this.#loadCompletions.delete(uploaderId);

		completions?.forEach((completion: UploadCompletion) => completion.reject(error));
	}

	#forgetLoadCompletion(uploaderId: string, completion: UploadCompletion)
	{
		const completions: ?Set<UploadCompletion> = this.#loadCompletions.get(uploaderId);
		completions?.delete(completion);

		if (completions?.size === 0)
		{
			this.#loadCompletions.delete(uploaderId);
		}
	}

	/**
	 * Preview session - the single source of truth for a batch being composed in one scope of a
	 * dialog: the draft of a new message or the attachment set of a message being edited.
	 * Its id is the id of the holder uploader, so uploader-scoped helpers accept it as is.
	 */
	async createPreviewSession(params: CreatePreviewSessionParams): Promise<string>
	{
		const { dialogId, messageId = null, origin = 'local' } = params;
		const scope: PreviewSessionScope = { dialogId, messageId };

		const currentSessionId = this.getPreviewSessionId(scope);
		if (currentSessionId)
		{
			return currentSessionId;
		}

		const scopeKey = this.#getPreviewSessionScopeKey(scope);
		const pendingSessionId = this.#previewSessionCreations.get(scopeKey);
		if (pendingSessionId)
		{
			return pendingSessionId;
		}

		const sessionIdPromise = this.#createPreviewSessionHolder(scope, origin);
		this.#previewSessionCreations.set(scopeKey, sessionIdPromise);

		try
		{
			return await sessionIdPromise;
		}
		finally
		{
			this.#previewSessionCreations.delete(scopeKey);
		}
	}

	async #createPreviewSessionHolder(scope: PreviewSessionScope, origin: PreviewSessionOrigin): Promise<string>
	{
		// The holder is never started — composing a batch must not upload anything.
		const { uploaderWrapper } = await this.#createUploader({
			dialogId: scope.dialogId,
			autoUpload: false,
			sendAsFile: false,
			maxParallelUploads: PREVIEW_SESSION_MAX_PARALLEL_UPLOADS,
			maxParallelLoads: PREVIEW_SESSION_MAX_PARALLEL_LOADS,
			messageId: scope.messageId ?? null,
		});

		const uploaderId: string = uploaderWrapper.getId();

		this.#uploaderWrappers.set(uploaderId, uploaderWrapper);
		this.#replacePreviewSession(scope, { uploaderId, origin });

		return uploaderId;
	}

	addFilesToPreviewSession(params: AddFilesToPreviewSessionParams): UploaderFile[]
	{
		const { sessionId, files, sendAsFile = false } = params;

		const session = this.#getPreviewSession(sessionId);
		if (!session)
		{
			return [];
		}

		const uploaderWrapper: UploaderWrapper = this.#uploaderWrappers.get(session.uploaderId);
		const filesOptions = this.prepareFilesOptions(
			files,
			{
				chatId: uploaderWrapper.getCustomData('chatId'),
				dialogId: uploaderWrapper.getCustomData('dialogId'),
			},
			sendAsFile,
		);

		return uploaderWrapper.addFiles(filesOptions);
	}

	getPreviewSessionFiles(sessionId: string): UploaderFile[]
	{
		const session = this.#getPreviewSession(sessionId);

		return session ? this.getFiles(session.uploaderId) : [];
	}

	/**
	 * Uploads a batch composed while editing a message and answers with the id every file of it got in the
	 * chat folder, keyed by the temporary id the batch knows it under. Nothing is published: the message
	 * exists already. The upload starts here and not while composing, so an abandoned batch leaves nothing.
	 */
	async uploadPreviewSession(sessionId: string): Promise<Map<string, string>>
	{
		const uploaderWrapper: ?UploaderWrapper = this.#uploaderWrappers.get(sessionId);
		if (!uploaderWrapper)
		{
			throw new Error('UploadingService: the batch to upload is gone');
		}

		// a batch of nothing but files already on the server is complete as it stands
		if (!uploaderWrapper.isAllCompleted())
		{
			// the promise of this run is taken before the run starts: the verdict replaces the entry
			const completion: ?UploadCompletion = this.#uploadCompletions.get(sessionId);

			this.start(sessionId);
			await completion?.promise;
		}

		return this.#getUploadedFileIds(uploaderWrapper);
	}

	// a batch is uploaded as many times as it takes, and a save must not be met with the verdict of an older run
	#settleUploadCompletion(uploaderId: string, error: ?Error = null)
	{
		const completion: ?UploadCompletion = this.#uploadCompletions.get(uploaderId);
		if (!completion)
		{
			return;
		}

		this.#uploadCompletions.set(uploaderId, createDeferredPromise());

		if (error)
		{
			completion.reject(error);

			return;
		}

		completion.resolve();
	}

	// a file carries the id of its copy in the chat folder with the letter the Disk controller puts in front
	#getUploadedFileIds(uploaderWrapper: UploaderWrapper): Map<string, string>
	{
		const uploadedFileIds: Map<string, string> = new Map();

		uploaderWrapper.getFiles().forEach((file: UploaderFile) => {
			const serverFileId: ?(string | number) = file.getServerFileId();
			if (serverFileId)
			{
				uploadedFileIds.set(file.getId(), serverFileId.toString().slice(1));
			}
		});

		return uploadedFileIds;
	}

	// a bare dialog id addresses the draft scope - the form the send flow has always used
	getPreviewSessionId(scope: PreviewSessionScope | string): ?string
	{
		return this.#previewSessions.get(this.#getPreviewSessionScopeKey(scope))?.uploaderId;
	}

	getPreviewSessionOrigin(sessionId: string): ?PreviewSessionOrigin
	{
		return this.#getPreviewSession(sessionId)?.origin;
	}

	/**
	 * The uploader core has no repeat of its own - a file that failed stays failed - so a repeat is that
	 * file added to the same batch anew, and the caller gets it to put where the failed one stood.
	 */
	retryPreviewSessionFile(params: RemoveFileFromPreviewSessionParams): ?UploaderFile
	{
		const { sessionId, fileId } = params;

		const failedFile: ?UploaderFile = this.getPreviewSessionFiles(sessionId)
			.find((file: UploaderFile) => file.getId() === fileId);
		// a file taken from disk holds no binary of ours to send again
		if (!failedFile?.getBinary())
		{
			return null;
		}

		const [repeatedFile] = this.addFilesToPreviewSession({
			sessionId,
			files: [failedFile],
			sendAsFile: failedFile.getCustomData('sendAsFile') === true,
		});

		this.removeFileFromPreviewSession({ sessionId, fileId });

		return repeatedFile ?? null;
	}

	removeFileFromPreviewSession(params: RemoveFileFromPreviewSessionParams)
	{
		const { sessionId, fileId, removeFromServer = true } = params;

		const session = this.#getPreviewSession(sessionId);
		if (!session)
		{
			return;
		}

		this.#releasePreviewFiles(
			this.getFiles(session.uploaderId).filter((file: UploaderFile) => file.getId() === fileId),
		);

		this.removeFileFromUploader({
			uploaderId: session.uploaderId,
			filesIds: [fileId],
			restartUploading: false,
			removeFromServer,
		});
	}

	/**
	 * A batch belongs to its dialog, not to the consumer that composed it: the same dialog can be open
	 * in more than one place at once, and every consumer that took the session holds a lease on it.
	 */
	leasePreviewSession(sessionId: string, ownerId: string)
	{
		if (!this.#getPreviewSession(sessionId))
		{
			return;
		}

		const owners: Set<string> = this.#previewSessionOwners.get(sessionId) ?? new Set();
		owners.add(ownerId);
		this.#previewSessionOwners.set(sessionId, owners);
	}

	releasePreviewSession(sessionId: string, ownerId: string, options: DestroyUploaderOptions = {})
	{
		const owners: ?Set<string> = this.#previewSessionOwners.get(sessionId);
		if (!owners)
		{
			return;
		}

		owners.delete(ownerId);

		if (owners.size === 0)
		{
			this.destroyPreviewSession(sessionId, options);
		}
	}

	/**
	 * Takes the session out of the registry, keeping its holder alive.
	 * The send flow needs the holder until the last file is read, but from the moment sending starts
	 * the dialog must get a new session instead of joining the batch already on its way. The leases go
	 * with the registry entry: from here on the holder belongs to the send flow alone.
	 */
	unregisterPreviewSession(sessionId: string)
	{
		this.#previewSessionOwners.delete(sessionId);

		const scopeKey = this.#findPreviewSessionScopeKey(sessionId);
		if (scopeKey)
		{
			this.#previewSessions.delete(scopeKey);
		}
	}

	/**
	 * The copies the batch got in the chat folder stay behind by default: by the time a batch is destroyed
	 * they usually belong to a message. A caller that gave the batch up before the save asks for them to go.
	 */
	destroyPreviewSession(sessionId: string, options: DestroyUploaderOptions = {})
	{
		this.unregisterPreviewSession(sessionId);

		// The holder may be gone already — sending from disk destroys it on its own.
		if (!this.#uploaderWrappers.has(sessionId))
		{
			return;
		}

		this.#releasePreviewFiles(this.getFiles(sessionId));
		this.#destroyUploader(sessionId, options);
	}

	/**
	 * Keeps the registry to one batch per scope: the batch being replaced is released here instead of
	 * relying on the caller to do it first. Only the batch of the very same scope is replaced. A batch
	 * already handed over to the send flow is not in the registry any more, so it is never touched.
	 */
	#replacePreviewSession(scope: PreviewSessionScope, session: PreviewSession)
	{
		const scopeKey = this.#getPreviewSessionScopeKey(scope);

		const previousSession: ?PreviewSession = this.#previewSessions.get(scopeKey);
		if (previousSession && previousSession.uploaderId !== session.uploaderId)
		{
			this.destroyPreviewSession(previousSession.uploaderId);
		}

		this.#previewSessions.set(scopeKey, session);
	}

	// the message id goes first: a dialog id may carry the separator itself (an open line id does) and a
	// message id cannot, so the pair and its key map onto each other unambiguously
	#getPreviewSessionScopeKey(scope: PreviewSessionScope | string): string
	{
		const { dialogId, messageId } = Type.isString(scope) ? { dialogId: scope, messageId: null } : scope;

		return `${messageId ?? ''}${PREVIEW_SESSION_SCOPE_SEPARATOR}${dialogId}`;
	}

	#findPreviewSessionScopeKey(sessionId: string): ?string
	{
		const entry = [...this.#previewSessions.entries()].find(([, session]: [string, PreviewSession]) => {
			return session.uploaderId === sessionId;
		});

		return entry?.[0];
	}

	#getPreviewSession(sessionId: string): ?PreviewSession
	{
		const scopeKey = this.#findPreviewSessionScopeKey(sessionId);

		return scopeKey ? this.#previewSessions.get(scopeKey) : undefined;
	}

	/**
	 * Frees what a file of the batch holds outside its uploader: the store record and the object urls
	 * of its previews. Neither Uploader.destroy() nor UploaderFile.remove() releases them.
	 */
	#releasePreviewFiles(files: UploaderFile[])
	{
		files.forEach((file: UploaderFile) => {
			void this.#store.dispatch('files/delete', { id: file.getId() });

			file.revokeClientPreviewUrl();

			const downloadUrl: ?string = file.getDownloadUrl();
			// a file taken from disk carries a server url, only an own object url is ours to revoke
			if (downloadUrl?.startsWith('blob:'))
			{
				URL.revokeObjectURL(downloadUrl);
			}
		});
	}

	sendDiskFilesFromPreview(params: {
		files: UploaderFile[],
		dialogId: string,
		text?: string,
		replyId?: number,
		sendAsFile?: boolean,
	})
	{
		const { files, dialogId, text = '', replyId, sendAsFile = false } = params;
		if (!Type.isArrayFilled(files))
		{
			return;
		}

		const chatId = this.#getDialog(dialogId).chatId;
		const uploaderId = this.getUploaderIdByFileId(files[0].getId());

		files.forEach((file: UploaderFile, index: number) => {
			const diskFileId: string = file.getCustomData('diskFileId');
			const realFileId: string = diskFileId.toString().slice(1); // 'n123' => '123'
			const temporaryFileId: string = file.getId();
			const tempMessageId: string = Utils.text.getUuidV4();
			// the caption belongs to the first message of the series, and the same text has to reach both
			// the record shown in the chat and the publication, otherwise it dies with the page
			const messageText: string = index === 0 ? text : '';

			const message = {
				tempMessageId,
				fileIds: [temporaryFileId],
				dialogId,
				text: messageText,
				replyId,
			};

			this.#sendingService.sendMessageWithFiles(message).then(() => {
				this.commitFile({
					chatId,
					temporaryFileId,
					tempMessageId,
					realFileId,
					fromDisk: true,
					messageText,
					sendAsFile,
					replyId,
				});
			}).catch((error) => {
				console.error('UploadingService: sendDiskFilesFromPreview error:', error);
			});
		});

		if (uploaderId)
		{
			this.#destroyUploader(uploaderId);
		}
	}

	getFiles(uploaderId): UploaderFile[]
	{
		// an id can outlive its holder: a pick that took nothing in destroys the holder and still
		// hands the id back, so reading by such an id gives an empty batch instead of throwing
		return this.#uploaderWrappers.get(uploaderId)?.getFiles() ?? [];
	}

	#addToQueue(uploaderId: string)
	{
		this.#queue.push(uploaderId);
		this.#processQueue();
	}

	#processQueue()
	{
		if (this.#uploadingId !== null)
		{
			return;
		}

		// a holder destroyed while it waited its turn must not take the single queue down with it
		while (this.#queue.length > 0)
		{
			const uploaderId: string = this.#queue.shift();
			const uploaderWrapper: ?UploaderWrapper = this.#uploaderWrappers.get(uploaderId);
			if (uploaderWrapper)
			{
				this.#uploadingId = uploaderId;
				uploaderWrapper.start();

				return;
			}
		}
	}

	start(uploaderId: string)
	{
		this.getFiles(uploaderId).forEach((file: UploaderFile) => {
			// a file already in the chat folder is not uploaded again, so nothing would take its row out of progress
			if (file.getStatus() === UploaderFileStatus.COMPLETE)
			{
				return;
			}

			this.#updateFileProgress(file.getId(), 0, FileStatus.progress);
		});

		this.#addToQueue(uploaderId);
	}

	stop(uploaderId: string)
	{
		this.#uploaderWrappers.get(uploaderId).stop();
	}

	#isMediaFile(file: UploaderFile): boolean
	{
		return (
			isResizableImage(file.getBinary())
			|| (
				file.isVideo()
				&& Type.isStringFilled(file.getPreviewUrl())
			)
		);
	}

	// a video keeps its type even when the browser took no frame from it - the QuickTime container of a
	// .mov gives none - so only what is neither an image nor a video is shown and sent as a document
	#shouldTreatFileAsDocument(file: UploaderFile): boolean
	{
		return !isResizableImage(file.getBinary()) && !file.isVideo();
	}

	#setFileMapping(options: {serverFileId: number, temporaryFileId: string})
	{
		void this.#store.dispatch('files/setTemporaryFileMapping', options);
	}

	checkDiskFolderId(dialogId: string): Promise<number>
	{
		if (this.#getDiskFolderId(dialogId) > 0)
		{
			return Promise.resolve(this.#getDiskFolderId(dialogId));
		}

		if (this.#isRequestingDiskFolderId)
		{
			return this.#diskFolderIdRequestPromise[dialogId];
		}

		this.#diskFolderIdRequestPromise[dialogId] = this.#requestDiskFolderId(dialogId);

		return this.#diskFolderIdRequestPromise[dialogId];
	}

	#requestDiskFolderId(dialogId: string): Promise
	{
		return new Promise((resolve, reject) => {
			this.#isRequestingDiskFolderId = true;

			const chatId = this.#getChatId(dialogId);
			this.#restClient.callMethod(RestMethod.imDiskFolderGet, { chat_id: chatId }).then((response) => {
				const { ID: diskFolderId } = response.data();
				this.#isRequestingDiskFolderId = false;
				void this.#store.dispatch('chats/update', {
					dialogId,
					fields: {
						diskFolderId,
					},
				});
				resolve(diskFolderId);
			}).catch((error) => {
				this.#isRequestingDiskFolderId = false;
				reject(error);
			});
		});
	}

	#appendReplyId(payload: Object, replyId: ?number): Object
	{
		if (replyId > 0)
		{
			payload.reply_id = replyId;
		}

		return payload;
	}

	commitFile(params: FileCommitParams)
	{
		const { temporaryFileId, tempMessageId, chatId, realFileId, fromDisk, messageText = '', sendAsFile = false, replyId } = params;

		const fileIdParams = {};
		if (fromDisk)
		{
			fileIdParams.disk_id = realFileId;
		}
		else
		{
			fileIdParams.upload_id = realFileId.toString().slice(1);
		}

		const payload = {
			chat_id: chatId,
			message: messageText,
			template_id: tempMessageId,
			file_template_id: temporaryFileId,
			as_file: sendAsFile ? 'Y' : 'N',
			...fileIdParams,
		};

		this.#restClient.callMethod(RestMethod.imDiskFileCommit, this.#appendReplyId(payload, replyId)).catch((result) => {
			this.#setMessageError(tempMessageId);
			this.#updateFileProgress(temporaryFileId, 0, FileStatus.error);
			this.#notifyCommitError(result);
			console.error('commitFile error', result);
		});
	}

	#notifyCommitError(result): void
	{
		const errorDescription = result?.error?.()?.ex?.error_description;
		if (errorDescription)
		{
			Notifier.file.showValidationError(errorDescription);

			return;
		}

		Notifier.onDefaultError();
	}

	/**
	 * Publishes the message of an uploaded batch. A refusal does not escape as a rejection: the message
	 * gets the error flag right here, the way the disk path does it, and the caller learns whether the
	 * batch reached the chat.
	 */
	async commitMessage(uploaderId: string): Promise<boolean>
	{
		const uploader: ?UploaderWrapper = this.#uploaderWrappers.get(uploaderId);
		// the batch was given up before the publication got here: a voice record that came back to its
		// panel takes its holder with it
		if (!uploader)
		{
			return false;
		}

		const chatId = uploader.getCustomData('chatId');
		const sendAsFile = uploader.getCustomData('sendAsFile');
		const text = uploader.getCustomData('text');
		const tempMessageId = uploader.getCustomData('tempMessageId');
		const replyId = uploader.getCustomData('replyId');

		const fileIds = uploader.getServerFilesIds();

		const payload = {
			chat_id: chatId,
			message: text,
			template_id: tempMessageId,
			as_file: sendAsFile ? 'Y' : 'N',
			upload_id: fileIds,
			...this.#getFileParamsPayload(uploader),
		};

		try
		{
			await this.#restClient.callMethod(RestMethod.imDiskFileCommit, this.#appendReplyId(payload, replyId));
		}
		catch (result)
		{
			this.#handleMessageCommitError(uploader, result);

			return false;
		}

		// the sender keeps the record until its fate is known, so the send has to report both outcomes
		if (this.#isVoiceRecordUpload(uploader))
		{
			this.emit(UploadingService.event.voiceRecordSent, { uploaderId });
		}

		return true;
	}

	/**
	 * Params the server cannot read from the file itself, keyed by the upload id the commit refers to.
	 * A batch without them adds nothing to the payload: that is every upload but a voice record, and
	 * a record is always a batch of a single file.
	 */
	#getFileParamsPayload(uploader: UploaderWrapper): { file_params?: { [string]: CommitFileParams } }
	{
		const fileParams: ?FileParams = uploader.getCustomData('fileParams');
		if (!fileParams)
		{
			return {};
		}

		const commitParams = this.#toCommitFileParams(fileParams);
		const payloadByFileId = {};
		uploader.getFiles().forEach((file: UploaderFile) => {
			payloadByFileId[file.getServerFileId().toString().slice(1)] = commitParams;
		});

		return { file_params: payloadByFileId };
	}

	#toCommitFileParams(fileParams: FileParams): CommitFileParams
	{
		const commitParams = {};

		if (fileParams.isVoiceNote)
		{
			commitParams.is_voice_note = 'Y';
		}

		if (fileParams.isTranscribable)
		{
			commitParams.is_transcribable = 'Y';
		}

		if (fileParams.durationSeconds > 0)
		{
			commitParams.duration = fileParams.durationSeconds;
		}

		return commitParams;
	}

	#handleMessageCommitError(uploader: UploaderWrapper, result): void
	{
		if (this.#isVoiceRecordUpload(uploader))
		{
			Logger.error('UploadingService: voice record commit error', result);
			this.#failVoiceRecordSend(uploader, getVoiceSendFailure(this.#getRestErrorCode(result)));

			return;
		}

		this.#setMessageError(uploader.getCustomData('tempMessageId'));

		uploader.getFiles().forEach((file: UploaderFile) => {
			this.#updateFileProgress(file.getId(), 0, FileStatus.error);
		});

		this.#notifyCommitError(result);
		console.error('commitMessage error', result);
	}

	#isVoiceRecordUpload(uploader: UploaderWrapper): boolean
	{
		const fileParams: ?FileParams = uploader.getCustomData('fileParams');

		return fileParams?.isVoiceNote === true;
	}

	#getRestErrorCode(result): ?string
	{
		return result?.error?.()?.ex?.error;
	}

	/**
	 * A voice record that did not reach the chat is not left in the feed as a failed message: the panel
	 * it was sent from takes it back with the reason of the refusal, so the record is never lost and the
	 * user is never left thinking it was sent. The batch behind the record is given up here - the send
	 * starts anew from the panel.
	 */
	#failVoiceRecordSend(uploader: UploaderWrapper, failure: string): void
	{
		const uploaderId: string = uploader.getId();

		this.#releasePreviewFiles(uploader.getFiles());
		this.#removeMessageFromFeed(uploader.getCustomData('tempMessageId'));
		this.#destroyUploader(uploaderId);

		this.emit(UploadingService.event.voiceRecordSendFailed, {
			dialogId: uploader.getCustomData('dialogId'),
			uploaderId,
			failure,
		});
	}

	async #uploadPreview(file: UploaderFile): Promise
	{
		const needPreview = this.#getFileType(file) === FileType.video || file.isAnimated();
		if (!needPreview)
		{
			return Promise.resolve();
		}

		const id = file.getServerFileId().toString().slice(1);
		const previewFile = file.getClientPreview();
		if (!previewFile)
		{
			file.setCustomData('sendAsFile', true);

			return Promise.resolve();
		}

		const formData = new FormData();
		formData.append('id', id);
		formData.append('previewFile', previewFile, `preview_${file.getName()}.jpg`);

		return runAction(RestMethod.imDiskFilePreviewUpload, { data: formData })
			.catch(([error]) => {
				console.error('imDiskFilePreviewUpload request error', error);
			});
	}

	#updateFileProgress(id: string, progress: number, status: string)
	{
		void this.#store.dispatch('files/update', {
			id,
			fields: {
				progress: (progress === 100 ? 99 : progress),
				status,
			},
		});
	}

	// the three states the save of an edit is decided by: failed, stopped moving, still on its way
	#mirrorFileStatus(file: UploaderFile)
	{
		const status: string = (() => {
			if (FAILED_UPLOADER_STATUSES.has(file.getStatus()))
			{
				return FileStatus.error;
			}

			return SETTLED_UPLOADER_STATUSES.has(file.getStatus()) ? FileStatus.wait : FileStatus.progress;
		})();

		void this.#store.dispatch('files/update', { id: file.getId(), fields: { status } });
	}

	#cancelUpload(tempMessageId: string, tempFileId)
	{
		if (!this.#store.getters['messages/getById'](tempMessageId))
		{
			return;
		}

		void this.#store.dispatch('files/delete', { id: tempFileId });
		this.#removeMessageFromFeed(tempMessageId);
	}

	/**
	 * Takes the message shown to the sender out of the feed and leaves the recent item on the message
	 * before it - or hides the item altogether, when the chat is left with no messages at all.
	 */
	#removeMessageFromFeed(tempMessageId: string)
	{
		const message: ImModelMessage = this.#store.getters['messages/getById'](tempMessageId);
		if (!message)
		{
			return;
		}

		void this.#store.dispatch('messages/delete', { id: tempMessageId });

		const chat: ImModelChat = this.#store.getters['chats/getByChatId'](message.chatId);
		const lastMessageId: string | number | null = this.#store.getters['messages/findLastChatMessageId'](
			message.chatId,
		);

		if (Type.isString(lastMessageId) || Type.isNumber(lastMessageId))
		{
			void this.#store.dispatch('recent/update', {
				dialogId: chat.dialogId,
				fields: { messageId: lastMessageId },
			});
		}
		else
		{
			void this.#store.dispatch('recent/hide', { dialogId: chat.dialogId });
		}
	}

	#getFileType(file: UploaderFile): string
	{
		if (isResizableImage(file.getBinary()))
		{
			return FileType.image;
		}

		if (file.isVideo())
		{
			return FileType.video;
		}

		if (file.getType().startsWith('audio'))
		{
			return FileType.audio;
		}

		return FileType.file;
	}

	#addFileToStore(file: UploaderFile, sendAsFile: boolean, fileParams: ?FileParams)
	{
		const fileType = this.#getFileType(file);
		const currentUser = this.#getCurrentUser();
		const isFile = ![FileType.image, FileType.video].includes(fileType);

		void this.#store.dispatch('files/add', {
			id: file.getId(),
			name: file.getName(),
			size: file.getSize(),
			type: fileType,
			extension: file.getExtension(),
			chatId: file.getCustomData('chatId'),
			authorId: currentUser.id,
			authorName: currentUser.name,
			status: file.isFailed() ? FileStatus.error : FileStatus.wait,
			progress: 0,
			urlDownload: file.getDownloadUrl(),
			...(() => {
				if (isFile || sendAsFile)
				{
					return { image: false };
				}

				return {};
			})(),
			...this.#toTemporaryVoiceFields(fileParams),
		});
	}

	/**
	 * The temporary file stands in for the record until the server confirms the upload. Everything
	 * that names the file outside the message - the chat list first of all - reads it from the model,
	 * and a record without these fields is treated there as a plain file for as long as it uploads.
	 */
	#toTemporaryVoiceFields(fileParams: ?FileParams): {
		isVoiceNote?: boolean,
		isTranscribable?: boolean,
		duration?: number,
	}
	{
		if (fileParams?.isVoiceNote !== true)
		{
			return {};
		}

		return {
			isVoiceNote: true,
			isTranscribable: fileParams.isTranscribable === true,
			duration: fileParams.durationSeconds,
		};
	}

	#updateFilePreviewInStore(file: UploaderFile, sendAsFile: boolean)
	{
		void this.#store.dispatch('files/update', {
			id: file.getId(),
			fields: {
				urlPreview: (() => {
					if (file.isImage())
					{
						return file.getPreviewUrl() || file.getDownloadUrl();
					}

					return file.getPreviewUrl();
				})(),
				image: this.#getFilePreviewSize(file, sendAsFile),
			},
		});
	}

	// `false` is how a file without a preview of its own is written down: a video the browser took no
	// frame from keeps its type and is drawn as a gallery item without one
	#getFilePreviewSize(file: UploaderFile, sendAsFile: boolean): { width: number, height: number } | false
	{
		const hasPreview = Type.isStringFilled(file.getPreviewUrl());
		if (sendAsFile || (file.isVideo() && !hasPreview))
		{
			return false;
		}

		return {
			width: file.getPreviewWidth(),
			height: file.getPreviewHeight(),
		};
	}

	#updateFileTypeInStore(file: UploaderFile, type: string)
	{
		void this.#store.dispatch('files/update', {
			id: file.getId(),
			fields: {
				type,
			},
		});
	}

	#updateFileSizeInStore(file: UploaderFile)
	{
		void this.#store.dispatch('files/update', {
			id: file.getId(),
			fields: {
				size: file.getSize(),
			},
		});
	}

	#getDiskFolderId(dialogId: string): number
	{
		return this.#getDialog(dialogId).diskFolderId;
	}

	#getDialog(dialogId: string): ImModelChat
	{
		return this.#store.getters['chats/get'](dialogId);
	}

	#getCurrentUser(): ImModelUser
	{
		const userId = Core.getUserId();

		return this.#store.getters['users/get'](userId);
	}

	#getChatId(dialogId: string): ?number
	{
		return this.#getDialog(dialogId)?.chatId;
	}

	#setMessagesText(uploaderId: string, text: string)
	{
		this.#uploaderWrappers.get(uploaderId).setCustomData('text', text);
	}

	#setMessagesReplyId(uploaderId: string, replyId: ?number)
	{
		if (replyId > 0)
		{
			this.#uploaderWrappers.get(uploaderId).setCustomData('replyId', replyId);
		}
	}

	sendMessageWithFiles(params: { uploaderId: string, text: string, replyId?: number })
	{
		const { uploaderId, text, replyId } = params;

		this.#setMessagesText(uploaderId, text);
		this.#setMessagesReplyId(uploaderId, replyId);
		this.#tryToSendMessage(uploaderId);
	}

	#createMessageFromFiles(uploaderId): {text: string, dialogId: string, tempMessageId: string, fileIds: [], replyId: ?number}
	{
		const fileIds = [];
		const files = this.getFiles(uploaderId);
		files.forEach((file) => {
			if (!file.getError())
			{
				fileIds.push(file.getId());
			}
		});

		const text = this.#uploaderWrappers.get(uploaderId).getCustomData('text');
		const dialogId = this.#uploaderWrappers.get(uploaderId).getCustomData('dialogId');
		const tempMessageId = this.#uploaderWrappers.get(uploaderId).getCustomData('tempMessageId');
		const replyId = this.#uploaderWrappers.get(uploaderId).getCustomData('replyId');

		return {
			fileIds,
			tempMessageId,
			dialogId,
			text,
			replyId,
		};
	}

	#tryToSendMessage(uploaderId: string)
	{
		const message = this.#createMessageFromFiles(uploaderId);
		void this.#sendingService.sendMessageWithFiles(message);
		this.start(uploaderId);
	}

	// What a failed file reports on its own, with no message of a batch to fail along with it.
	#reportUploadError(error: UploaderError, file: ?UploaderFile)
	{
		if (file)
		{
			this.#updateFileProgress(file.getId(), 0, FileStatus.error);
		}

		if (this.#isMaxFileSizeExceeded(error))
		{
			Notifier.file.handleUploadError(error);
		}

		Logger.error('UploadingService: upload error', error);
		this.emit(UploadingService.event.uploadError);
	}

	#isMaxFileSizeExceeded(error: UploaderError): boolean
	{
		return error.getCode() === 'MAX_FILE_SIZE_EXCEEDED';
	}

	#setMessageError(tempMessageId: string)
	{
		void this.#store.dispatch('messages/update', {
			id: tempMessageId,
			fields: {
				error: true,
			},
		});
	}

	getUploaderIdByFileId(fileId: string | number): ?string
	{
		const uploaderIds: Array<string> = [...this.#uploaderWrappers.keys()];

		return uploaderIds.find((uploaderId: string) => {
			return this.getFiles(uploaderId).some((file: UploaderFile) => {
				return file.getId() === fileId;
			});
		});
	}

	// The copy a file got in the chat folder goes with it by default - what the uploader core does when it
	// is asked without options. Only the window of an edit whose composition reached the server says otherwise.
	removeFileFromUploader(options: {
		uploaderId: string,
		filesIds: Array<string>,
		restartUploading: boolean,
		removeFromServer?: boolean,
	})
	{
		const { uploaderId, filesIds, restartUploading = false, removeFromServer = true } = options;

		const files = this.#uploaderWrappers.get(uploaderId).getFiles().filter((file: UploaderFile) => {
			return filesIds.includes(file.getId());
		});

		files.forEach((file: UploaderFile) => {
			// the key is the one UploaderFile.remove() reads, and it is not the one Uploader.destroy() reads
			file.remove({ removeFromServer });
			file.abort();
		});

		if (restartUploading)
		{
			const [firstFile] = this.getFiles(uploaderId);
			if (firstFile)
			{
				firstFile.upload();
			}
			else
			{
				this.#uploadingId = null;
				this.#processQueue();
			}
		}
	}

	#destroyUploader(uploaderId: string, options: DestroyUploaderOptions = {})
	{
		// the save of an edit waits for the verdict of the current run, and Uploader.destroy() publishes none:
		// the refusal has to be given here, before the entry goes, or the caller waits forever
		const destroyed = new Error('UploadingService: the batch was destroyed');
		this.#settleUploadCompletion(uploaderId, destroyed);
		// a portion still being read waits on the same holder, and no event of it is coming any more either
		this.#settleLoadCompletions(uploaderId, destroyed);

		this.#uploaderWrappers.get(uploaderId).destroy(options);
		this.#uploaderWrappers.delete(uploaderId);
		this.#uploadCompletions.delete(uploaderId);
		this.#queue = this.#queue.filter((queuedId: string) => queuedId !== uploaderId);

		// the verdict of the destroyed run never comes, so the single queue has to be let go of here
		if (this.#uploadingId === uploaderId)
		{
			this.#uploadingId = null;
			this.#processQueue();
		}
	}

	async retry(uploaderId: string)
	{
		const uploaderWrapper = this.#uploaderWrappers.get(uploaderId);
		if (!uploaderWrapper)
		{
			// a message of files taken from disk keeps no holder: there are no binaries of ours to send again
			Notifier.onDefaultError();
			Logger.error('UploadingService: there is no batch to repeat the send with', uploaderId);

			return;
		}

		const dialogId = uploaderWrapper.getCustomData('dialogId');
		const text = uploaderWrapper.getCustomData('text');
		const tempMessageId = uploaderWrapper.getCustomData('tempMessageId');
		const sendAsFile = uploaderWrapper.getCustomData('sendAsFile');
		const replyId = uploaderWrapper.getCustomData('replyId');
		const fileParams = uploaderWrapper.getCustomData('fileParams');

		const binaryFiles: Array<File> = uploaderWrapper.getBinaryFiles();

		const { uploaderId: newUploaderId, loadAllComplete } = await this.addFiles({
			dialogId,
			files: binaryFiles,
			sendAsFile,
			fileParams,
		});

		void this.#store.dispatch('messages/deleteLoadingMessageByMessageId', {
			messageId: tempMessageId,
		});

		await loadAllComplete;

		this.sendMessageWithFiles({
			uploaderId: newUploaderId,
			text,
			replyId,
		});

		this.#destroyUploader(uploaderId);
	}
}
