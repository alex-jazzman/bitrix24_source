/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, im_v2_application_core, im_v2_lib_utils, im_v2_provider_service_uploading, im_v2_const, ui_uploader_core) {
	'use strict';

	const DEFAULT_FILE_UPLOAD_POLICY = null;
	function getCopilotPolicy() {
		const applicationData = im_v2_application_core.Core.getApplicationData?.() ?? {};
		return applicationData.copilot?.fileUploadPolicy ?? null;
	}
	function getPolicyByChatType(chatType) {
		switch (chatType) {
			case im_v2_const.ChatType.copilot:
				return getCopilotPolicy();
			default:
				return DEFAULT_FILE_UPLOAD_POLICY;
		}
	}
	function resolveFileUploadPolicy(dialogId) {
		const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
		return getPolicyByChatType(chat?.type ?? null);
	}

	const MAX_FILES_COUNT_IN_ONE_MESSAGE = 10;
	const MAX_FILES_COUNT = 100;
	const MAX_PARALLEL_LOADS = 10;
	function makeChunks(options) {
		const {
			files,
			chunkSize = MAX_FILES_COUNT_IN_ONE_MESSAGE,
			maxFilesCount = MAX_FILES_COUNT
		} = options;
		const chunks = [];
		if (main_core.Type.isArray(files)) {
			const preparedFiles = files.slice(0, maxFilesCount);
			for (let i = 0; i < preparedFiles.length; i += chunkSize) {
				const chunk = preparedFiles.slice(i, i + chunkSize);
				chunks.push(chunk);
			}
		}
		return chunks;
	}
	function getMaxParallelLoads(chunks) {
		return Math.floor(MAX_PARALLEL_LOADS / chunks.length);
	}
	function takeWithinBatchLimit(files, existingCount, maxFilesCount = MAX_FILES_COUNT) {
		const capacity = Math.max(0, maxFilesCount - existingCount);
		return files.slice(0, capacity);
	}

	const FileValidationError = {
		INVALID_FILE_FORMAT: 'INVALID_FILE_FORMAT',
		FILE_TOO_LARGE: 'FILE_TOO_LARGE',
		TOO_MANY_FILES: 'TOO_MANY_FILES',
		DUPLICATE_FILE: 'DUPLICATE_FILE'
	};
	function matchExtension(fileName, allowedExtensions) {
		if (!main_core.Type.isStringFilled(fileName) || !main_core.Type.isArrayFilled(allowedExtensions)) {
			return false;
		}
		const dotIndex = fileName.lastIndexOf('.');
		if (dotIndex <= 0 || dotIndex === fileName.length - 1) {
			return false;
		}
		const ext = fileName.slice(dotIndex + 1).toLowerCase();
		return allowedExtensions.includes(ext);
	}
	function matchSize(size, maxFileSize) {
		if (!main_core.Type.isNumber(size) || !main_core.Type.isNumber(maxFileSize)) {
			return false;
		}
		return size <= maxFileSize;
	}
	function matchCount(currentCount, addingCount, maxFilesPerMessage) {
		return currentCount + addingCount <= maxFilesPerMessage;
	}
	function isDuplicate(file, existing) {
		return existing.some(item => item.name === file.name && item.size === file.size);
	}
	function resolveVerdict(file, policy) {
		if (!matchExtension(file.name, policy.allowedExtensions)) {
			return FileValidationError.INVALID_FILE_FORMAT;
		}
		if (!matchSize(file.size, policy.maxFileSize)) {
			return FileValidationError.FILE_TOO_LARGE;
		}
		return null;
	}
	function validateFileList(files, existing, policy) {
		const valid = [];
		const errors = [];
		const annotated = [];
		if (!policy) {
			return {
				valid: [...files],
				errors,
				annotated: files.map(file => ({
					file,
					code: null
				}))
			};
		}
		const capacity = Math.max(0, policy.maxFilesPerMessage - existing.length);
		const accepted = [];
		for (const file of files) {
			if (isDuplicate(file, [...existing, ...accepted])) {
				errors.push({
					file,
					code: FileValidationError.DUPLICATE_FILE
				});
				continue;
			}
			if (accepted.length >= capacity) {
				errors.push({
					file,
					code: FileValidationError.TOO_MANY_FILES
				});
				continue;
			}
			const code = resolveVerdict(file, policy);
			accepted.push(file);
			annotated.push({
				file,
				code
			});
			if (code) {
				errors.push({
					file,
					code
				});
			} else {
				valid.push(file);
			}
		}
		return {
			valid,
			errors,
			annotated
		};
	}

	const MAX_PARALLEL_UPLOADS = 3;
	const BYTES_IN_MB = 1024 * 1024;
	const SET_LEVEL_ERROR_CODES = new Set([FileValidationError.DUPLICATE_FILE, FileValidationError.TOO_MANY_FILES]);
	class UploadManager {
		#getUploadingService() {
			return im_v2_provider_service_uploading.UploadingService.getInstance();
		}
		getPolicy(dialogId) {
			return resolveFileUploadPolicy(dialogId);
		}
		getAcceptAttribute(dialogId) {
			const policy = resolveFileUploadPolicy(dialogId);
			if (!policy || !main_core.Type.isArrayFilled(policy.allowedExtensions)) {
				return null;
			}
			return policy.allowedExtensions.map(ext => `.${ext}`).join(',');
		}
		async addFilesToPreview(params) {
			const {
				files,
				dialogId,
				messageId = null,
				sendAsFile = false,
				compositionCount = null
			} = params;
			const policy = resolveFileUploadPolicy(dialogId);
			const service = this.#getUploadingService();
			let sessionId = service.getPreviewSessionId({
				dialogId,
				messageId
			}) ?? null;
			if (sessionId !== null && service.getPreviewSessionOrigin(sessionId) !== 'local') {
				service.destroyPreviewSession(sessionId);
				sessionId = null;
			}
			sessionId = sessionId ?? (await service.createPreviewSession({
				dialogId,
				messageId,
				origin: 'local'
			}));
			const existing = service.getPreviewSessionFiles(sessionId).map(file => ({
				name: file.getName(),
				size: file.getSize()
			}));
			const {
				annotated,
				errors
			} = validateFileList(files, existing, policy);
			const withinLimit = this.#takeWithinScopeLimit(annotated, {
				dialogId,
				messageId,
				sessionCount: existing.length,
				compositionCount
			});
			const accepted = withinLimit.map(item => item.file);
			service.addFilesToPreviewSession({
				sessionId,
				files: accepted,
				sendAsFile
			});
			this.#annotateValidationErrors([sessionId], withinLimit, policy);
			const setLevelErrors = errors.filter(error => SET_LEVEL_ERROR_CODES.has(error.code));
			return {
				sessionId,
				addedCount: accepted.length,
				overLimitCount: annotated.length - withinLimit.length,
				errors: this.#resolveErrors(setLevelErrors, policy)
			};
		}
		async addDiskFiles(params) {
			const {
				files,
				dialogId,
				messageId = null
			} = params;
			const policy = resolveFileUploadPolicy(dialogId);
			const diskFiles = Object.values(files ?? {});
			const normalized = diskFiles.map(file => ({
				name: file.name ?? '',
				size: Number(file.sizeInt ?? file.size ?? 0),
				original: file
			}));
			const {
				annotated,
				errors
			} = validateFileList(normalized, [], policy);
			const withinLimit = this.#takeWithinScopeLimit(annotated, {
				dialogId,
				messageId
			});
			const acceptedFiles = withinLimit.map(item => item.file.original);
			const {
				sessionId,
				uploaderFiles,
				uploadAllComplete
			} = messageId === null ? await this.#pickDiskFilesForDraft(acceptedFiles, dialogId) : await this.#pickDiskFilesForEdit(acceptedFiles, dialogId, messageId);
			if (sessionId === null) {
				return {
					uploadingId: im_v2_lib_utils.Utils.text.getUuidV4(),
					uploaderIds: [],
					sourceFilesCount: diskFiles.length,
					overLimitCount: 0,
					loadAllComplete: Promise.resolve(),
					uploadAllComplete: Promise.resolve(),
					errors: []
				};
			}
			this.#annotateValidationErrors([sessionId], withinLimit, policy);
			this.#annotateDiskLoadErrors(uploaderFiles);
			const setLevelErrors = errors.filter(error => SET_LEVEL_ERROR_CODES.has(error.code));
			return {
				uploadingId: im_v2_lib_utils.Utils.text.getUuidV4(),
				uploaderIds: main_core.Type.isArrayFilled(uploaderFiles) ? [sessionId] : [],
				sourceFilesCount: diskFiles.length,
				overLimitCount: annotated.length - withinLimit.length,
				loadAllComplete: Promise.resolve(),
				uploadAllComplete,
				errors: this.#resolveErrors(setLevelErrors, policy)
			};
		}
		async #pickDiskFilesForDraft(files, dialogId) {
			const {
				uploaderId,
				uploaderFiles,
				loadAllComplete,
				uploadAllComplete
			} = await this.#getUploadingService().addFilesFromDisk({
				files,
				dialogId
			});
			await loadAllComplete;
			return {
				sessionId: uploaderId,
				uploaderFiles,
				uploadAllComplete
			};
		}
		async #pickDiskFilesForEdit(files, dialogId, messageId) {
			const {
				sessionId,
				uploaderFiles,
				loadAllComplete
			} = await this.#getUploadingService().addDiskFilesToPreviewSession({
				files,
				dialogId,
				messageId
			});
			const isBatchAlive = await loadAllComplete.then(() => true, () => false);
			if (!isBatchAlive) {
				return {
					sessionId: null,
					uploaderFiles: [],
					uploadAllComplete: Promise.resolve()
				};
			}
			return {
				sessionId,
				uploaderFiles,
				uploadAllComplete: Promise.resolve()
			};
		}
		#takeWithinScopeLimit(portion, scope) {
			const {
				dialogId,
				messageId,
				sessionCount = null,
				compositionCount = null
			} = scope;
			if (messageId !== null) {
				return takeWithinBatchLimit(portion, this.#getEditedCompositionCount(dialogId, messageId, compositionCount), MAX_FILES_COUNT_IN_ONE_MESSAGE);
			}
			return sessionCount === null ? portion : takeWithinBatchLimit(portion, sessionCount);
		}
		#getEditedCompositionCount(dialogId, messageId, shownCount) {
			if (main_core.Type.isNumber(shownCount)) {
				return shownCount;
			}
			const service = this.#getUploadingService();
			const sessionId = service.getPreviewSessionId({
				dialogId,
				messageId
			}) ?? null;
			const message = im_v2_application_core.Core.getStore().getters['messages/getById'](messageId);
			return (message?.files?.length ?? 0) + (sessionId === null ? 0 : service.getPreviewSessionFiles(sessionId).length);
		}
		async upload(params) {
			const {
				files,
				dialogId,
				autoUpload = false,
				sendAsFile = false,
				maxFilesCount,
				fileParams
			} = params;
			const chunks = makeChunks({
				files,
				maxFilesCount
			});
			const addFilesResults = await Promise.all(chunks.map(chunk => {
				return this.#getUploadingService().addFiles({
					files: chunk,
					maxParallelLoads: getMaxParallelLoads(chunks),
					maxParallelUploads: MAX_PARALLEL_UPLOADS,
					dialogId,
					autoUpload,
					sendAsFile,
					fileParams
				});
			}));
			const uploaderIds = [];
			const loadCompletePromises = [];
			const uploadCompletePromises = [];
			addFilesResults.forEach(({
				uploaderId,
				uploaderFiles,
				loadAllComplete,
				uploadAllComplete
			}) => {
				if (main_core.Type.isArrayFilled(uploaderFiles)) {
					uploaderIds.push(uploaderId);
					loadCompletePromises.push(loadAllComplete);
					uploadCompletePromises.push(uploadAllComplete);
				}
			});
			return {
				uploadingId: im_v2_lib_utils.Utils.text.getUuidV4(),
				uploaderIds,
				sourceFilesCount: files.length,
				loadAllComplete: Promise.all(loadCompletePromises),
				uploadAllComplete: Promise.all(uploadCompletePromises)
			};
		}
		#annotateValidationErrors(uploaderIds, annotated, policy) {
			const errorByKey = {};
			annotated.forEach(item => {
				if (item.code) {
					errorByKey[this.#getFileKey(item.file)] = item.code;
				}
			});
			if (Object.keys(errorByKey).length === 0) {
				return;
			}
			const uploadingService = this.#getUploadingService();
			uploaderIds.forEach(uploaderId => {
				uploadingService.getFiles(uploaderId).forEach(uploaderFile => {
					const key = `${uploaderFile.getName?.() ?? ''}:${Number(uploaderFile.getSize?.() ?? 0)}`;
					const code = errorByKey[key];
					if (code) {
						this.#setValidationError(uploaderFile.getId(), this.#resolveErrorText(code, policy));
					}
				});
			});
		}
		#annotateDiskLoadErrors(files) {
			files.forEach(uploaderFile => {
				const fileModel = im_v2_application_core.Core.getStore().getters['files/get'](uploaderFile.getId());
				const alreadyFlagged = Boolean(fileModel?.validationError);
				if (!alreadyFlagged && uploaderFile.getStatus?.() === ui_uploader_core.FileStatus.LOAD_FAILED) {
					this.#setValidationError(uploaderFile.getId(), main_core.Loc.getMessage('ERROR_CHAT_FILE_METADATA_UNAVAILABLE') ?? '');
				}
			});
		}
		#setValidationError(fileId, text) {
			void im_v2_application_core.Core.getStore().dispatch('files/update', {
				id: fileId,
				fields: {
					validationError: text
				}
			});
		}
		#resolveErrors(errors, policy) {
			const seenCodes = new Set();
			const resolved = [];
			errors.forEach(error => {
				if (seenCodes.has(error.code)) {
					return;
				}
				seenCodes.add(error.code);
				resolved.push({
					code: error.code,
					text: this.#resolveErrorText(error.code, policy)
				});
			});
			return resolved;
		}
		#resolveErrorText(code, policy) {
			const messageId = `ERROR_CHAT_${code}`;
			if (code === FileValidationError.FILE_TOO_LARGE) {
				const maxFileSize = policy?.maxFileSize ?? 0;
				const sizeMb = maxFileSize > 0 ? Math.max(1, Math.round(maxFileSize / BYTES_IN_MB)) : 0;
				return main_core.Loc.getMessage(messageId, {
					'#SIZE_MB#': String(sizeMb)
				}) ?? '';
			}
			if (code === FileValidationError.TOO_MANY_FILES) {
				const count = policy?.maxFilesPerMessage ?? 0;
				return main_core.Loc.getMessagePlural(messageId, count, {
					'#COUNT#': String(count)
				}) ?? '';
			}
			return main_core.Loc.getMessage(messageId) ?? '';
		}
		#getFileKey(file) {
			return `${file.name}:${Number(file.size)}`;
		}
	}

	exports.DEFAULT_FILE_UPLOAD_POLICY = DEFAULT_FILE_UPLOAD_POLICY;
	exports.FileValidationError = FileValidationError;
	exports.UploadManager = UploadManager;
	exports.getMaxParallelLoads = getMaxParallelLoads;
	exports.getPolicyByChatType = getPolicyByChatType;
	exports.makeChunks = makeChunks;
	exports.matchCount = matchCount;
	exports.matchExtension = matchExtension;
	exports.matchSize = matchSize;
	exports.resolveFileUploadPolicy = resolveFileUploadPolicy;
	exports.validateFileList = validateFileList;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.Messenger.v2.Application, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Const, BX.UI.Uploader);
//# sourceMappingURL=uploading.bundle.js.map
