/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
(function (exports, ui_designTokens_air, ui_buttons, main_core, main_core_events, ui_uploader_core, main_popup, ui_vue3) {
	'use strict';

	const COMMIT_FAILED_ERROR_CODE = 'CLIENT_COMMIT_FAILED';
	const DOCUMENT_ADD_FAILED_ERROR_CODE = 'CLIENT_DOCUMENT_ADD_FAILED';
	const DOCUMENT_REJECTED_ERROR_CODE = 'CLIENT_DOCUMENT_REJECTED';
	const LIMIT_EXCEEDED_ERROR_CODE = 'MAX_DOCUMENT_COUNT_EXCEEDED';
	const PHRASE_BY_ERROR_CODE = new Map([[LIMIT_EXCEEDED_ERROR_CODE, 'SIGN_B2E_BATCH_UPLOAD_FILE_ERROR_LIMIT'], ['TARIFF_RESTRICTED', 'SIGN_B2E_BATCH_UPLOAD_FILE_ERROR_TARIFF'], ['BLANK_CREATE_FAILED', 'SIGN_B2E_BATCH_UPLOAD_FILE_ERROR_BLANK'], ['DOCUMENT_REGISTER_FAILED', 'SIGN_B2E_BATCH_UPLOAD_FILE_ERROR_REGISTER'], ['GROUP_CREATE_FAILED', 'SIGN_B2E_BATCH_UPLOAD_FILE_ERROR_GROUP'], ['ATTACH_FAILED', 'SIGN_B2E_BATCH_UPLOAD_FILE_ERROR_ATTACH'], ['B2E_NOT_AVAILABLE', 'SIGN_B2E_BATCH_UPLOAD_FILE_ERROR_B2E_UNAVAILABLE'], [COMMIT_FAILED_ERROR_CODE, 'SIGN_B2E_BATCH_UPLOAD_FILE_ERROR_COMMIT'], [DOCUMENT_ADD_FAILED_ERROR_CODE, 'SIGN_B2E_BATCH_UPLOAD_FILE_ERROR_ADD'], [DOCUMENT_REJECTED_ERROR_CODE, 'SIGN_B2E_BATCH_UPLOAD_FILE_ERROR']]);
	function getFileErrorText(item) {
		const phraseCode = item.errorCode === null ? undefined : PHRASE_BY_ERROR_CODE.get(item.errorCode);
		const text = phraseCode === undefined ? item.errorMessage : main_core.Loc.getMessage(phraseCode);
		return text ?? main_core.Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_FILE_ERROR') ?? '';
	}

	const BatchFileStatus = {
		pending: 'pending',
		uploading: 'uploading',
		committing: 'committing',
		done: 'done',
		error: 'error',
		rejected: 'rejected'
	};

	const UPLOAD_CONTROLLER = 'sign.upload.blankUploadController';
	const DEFAULT_ACCEPTED_FILE_TYPES = ['.pdf', '.doc', '.docx', '.rtf', '.odt'];
	const DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024;
	const PROGRESS_EMIT_INTERVAL = 100;
	const PENDING_STATUSES = new Set([BatchFileStatus.pending, BatchFileStatus.uploading, BatchFileStatus.committing]);
	class BatchUploadService extends main_core_events.EventEmitter {
		static events = Object.freeze({
			itemsChange: 'itemsChange',
			allUploaded: 'allUploaded',
			rejected: 'rejected'
		});
		#uploader;
		#limitTotal;
		#resolveLimitLeft;
		#items = new Map();
		#serverFileIds = new Map();
		#spentIds = new Set();
		#hasPlaceholdersById = new Map();
		#addedHasPlaceholders = false;
		#doneCount = 0;
		#isCommitting = false;
		#hasDeferredCommit = false;
		#emitProgressChange = main_core.Runtime.throttle(() => this.#emitItemsChange(), PROGRESS_EMIT_INTERVAL);
		constructor(options) {
			super();
			this.setEventNamespace('BX.Sign.V2.B2e.BatchUploadService');
			this.#limitTotal = options.limitTotal;
			this.#resolveLimitLeft = options.resolveLimitLeft ?? null;
			this.#uploader = new ui_uploader_core.Uploader({
				id: 'sign-b2e-batch-upload',
				controller: UPLOAD_CONTROLLER,
				acceptedFileTypes: options.acceptedFileTypes ?? DEFAULT_ACCEPTED_FILE_TYPES,
				multiple: true,
				autoUpload: true,
				maxFileSize: options.maxFileSize ?? DEFAULT_MAX_FILE_SIZE,
				events: {
					[ui_uploader_core.UploaderEvent.FILE_ADD_START]: event => this.#onFileAddStart(event),
					[ui_uploader_core.UploaderEvent.FILE_UPLOAD_START]: event => this.#onFileUploadStart(event),
					[ui_uploader_core.UploaderEvent.FILE_UPLOAD_PROGRESS]: event => this.#onFileUploadProgress(event),
					[ui_uploader_core.UploaderEvent.FILE_UPLOAD_COMPLETE]: event => this.#onFileUploadComplete(event),
					[ui_uploader_core.UploaderEvent.FILE_ERROR]: event => this.#onFileError(event),
					[ui_uploader_core.UploaderEvent.UPLOAD_COMPLETE]: () => this.#onUploadComplete()
				}
			});
		}
		addFiles(files, limitLeft, hasPlaceholders = false) {
			const accepted = files.slice(0, Math.max(limitLeft, 0));
			const rejected = files.slice(Math.max(limitLeft, 0));
			if (accepted.length > 0) {
				this.#addToUploader(accepted, hasPlaceholders);
			}
			if (rejected.length > 0) {
				this.emit(BatchUploadService.events.rejected, {
					names: rejected.map(file => file.name)
				});
			}
		}
		removeFile(id) {
			const file = this.#uploader.getFile(id);
			if (file !== null) {
				this.#uploader.removeFile(file, {
					removeFromServer: false
				});
			}
			this.#deleteItem(id);
			this.#emitItemsChange();
		}
		retryFile(id) {
			const file = this.#uploader.getFile(id);
			const binary = file === null ? null : file.getBinary();
			if (file === null || binary === null) {
				return;
			}
			if (this.#resolveLimitLeft !== null && this.#resolveLimitLeft() <= 0) {
				this.#failByLimit(id);
				return;
			}
			const hasPlaceholders = this.#hasPlaceholders(id);
			this.#uploader.removeFile(file, {
				removeFromServer: false
			});
			this.#deleteItem(id);
			this.#addToUploader([binary], hasPlaceholders);
		}
		getItems() {
			return [...this.#items.values()];
		}
		getUploadedFileIds() {
			return this.#getCommitCandidateIds().map(id => String(this.#serverFileIds.get(id)));
		}
		applyServerItems(serverItems) {
			const outcomeByServerFileId = new Map();
			serverItems.forEach(serverItem => {
				outcomeByServerFileId.set(String(serverItem.fileId), serverItem);
			});
			this.#items.forEach((item, id) => {
				const serverFileId = this.#serverFileIds.get(id);
				const outcome = serverFileId === undefined ? null : outcomeByServerFileId.get(serverFileId);
				if (!outcome) {
					return;
				}
				this.#setItem({
					...item,
					status: outcome.success ? BatchFileStatus.done : BatchFileStatus.error,
					progress: outcome.success ? 100 : item.progress,
					errorMessage: null,
					errorCode: outcome.success ? null : outcome.errorCode
				});
			});
			this.#emitItemsChange();
			this.#finishCommit();
		}
		getVerifiedServerItems(serverItems, documentUids) {
			const existingUids = new Set(documentUids);
			return serverItems.map(item => {
				if (item.success !== true || item.uid !== null && existingUids.has(item.uid)) {
					return item;
				}
				return {
					...item,
					success: false,
					errorCode: DOCUMENT_REJECTED_ERROR_CODE
				};
			});
		}
		applyCommitFailure() {
			[...this.#spentIds].forEach(id => {
				const item = this.#items.get(id);
				if (item === undefined || item.status !== BatchFileStatus.committing) {
					return;
				}
				this.#spentIds.delete(id);
				this.#setItem({
					...item,
					status: BatchFileStatus.error,
					errorMessage: null,
					errorCode: COMMIT_FAILED_ERROR_CODE
				});
			});
			this.#emitItemsChange();
			this.#finishCommit();
		}
		applyDocumentFailure(serverFileIds) {
			const failedIds = new Set(serverFileIds.map(fileId => String(fileId)));
			let hasFailed = false;
			this.#items.forEach((item, id) => {
				const serverFileId = this.#serverFileIds.get(id);
				if (serverFileId === undefined || !failedIds.has(serverFileId)) {
					return;
				}
				hasFailed = true;
				this.#setItem({
					...item,
					status: BatchFileStatus.error,
					errorMessage: null,
					errorCode: DOCUMENT_ADD_FAILED_ERROR_CODE
				});
			});
			if (hasFailed) {
				this.#emitItemsChange();
			}
		}
		getPendingCount() {
			return this.getItems().filter(item => PENDING_STATUSES.has(item.status)).length;
		}
		hasPending() {
			return this.getPendingCount() > 0;
		}
		getPendingSize() {
			return this.getItems().filter(item => PENDING_STATUSES.has(item.status)).reduce((totalSize, item) => totalSize + item.size, 0);
		}
		getLimitTotal() {
			return this.#limitTotal;
		}
		getDoneCount() {
			return this.#doneCount;
		}
		destroy() {
			this.#uploader.destroy();
			this.#items.clear();
			this.#serverFileIds.clear();
			this.#spentIds.clear();
			this.#hasPlaceholdersById.clear();
			this.#doneCount = 0;
			this.#isCommitting = false;
			this.#hasDeferredCommit = false;
		}
		#setItem(item) {
			const wasDone = this.#items.get(item.id)?.status === BatchFileStatus.done;
			const isDone = item.status === BatchFileStatus.done;
			if (wasDone !== isDone) {
				this.#doneCount += isDone ? 1 : -1;
			}
			this.#items.set(item.id, item);
		}
		#deleteItem(id) {
			if (this.#items.get(id)?.status === BatchFileStatus.done) {
				this.#doneCount--;
			}
			this.#items.delete(id);
			this.#serverFileIds.delete(id);
			this.#spentIds.delete(id);
			this.#hasPlaceholdersById.delete(id);
		}
		#addToUploader(files, hasPlaceholders) {
			this.#addedHasPlaceholders = hasPlaceholders;
			try {
				this.#uploader.addFiles(files);
			} finally {
				this.#addedHasPlaceholders = false;
			}
		}
		#onFileAddStart(event) {
			const file = event.getData().file;
			this.#hasPlaceholdersById.set(file.getId(), this.#addedHasPlaceholders);
		}
		#hasPlaceholders(id) {
			return this.#hasPlaceholdersById.get(id) === true;
		}
		#getCommitCandidateIds() {
			const candidateIds = [];
			this.#items.forEach((item, id) => {
				if (this.#serverFileIds.has(id) && !this.#spentIds.has(id)) {
					candidateIds.push(id);
				}
			});
			return candidateIds;
		}
		#failByLimit(id) {
			const item = this.#items.get(id);
			if (item === undefined) {
				return;
			}
			this.#setItem({
				...item,
				status: BatchFileStatus.error,
				errorMessage: null,
				errorCode: LIMIT_EXCEEDED_ERROR_CODE
			});
			this.#emitItemsChange();
		}
		#onFileUploadStart(event) {
			const file = event.getData().file;
			this.#setItem({
				id: file.getId(),
				name: file.getName(),
				size: file.getSize(),
				status: BatchFileStatus.uploading,
				progress: file.getProgress(),
				errorMessage: null,
				errorCode: null
			});
			this.#emitItemsChange();
		}
		#onFileUploadProgress(event) {
			const file = event.getData().file;
			const item = this.#items.get(file.getId());
			if (!item) {
				return;
			}
			this.#setItem({
				...item,
				status: BatchFileStatus.uploading,
				progress: file.getProgress()
			});
			this.#emitProgressChange();
		}
		#onFileUploadComplete(event) {
			const file = event.getData().file;
			const item = this.#items.get(file.getId());
			if (!item) {
				return;
			}
			const serverFileId = file.getServerFileId();
			if (serverFileId !== null) {
				this.#serverFileIds.set(file.getId(), String(serverFileId));
			}
			this.#setItem({
				...item,
				progress: 100
			});
			this.#emitItemsChange();
		}
		#onFileError(event) {
			const file = event.getData().file;
			const item = this.#items.get(file.getId());
			this.#setItem({
				id: file.getId(),
				name: file.getName(),
				size: file.getSize(),
				status: BatchFileStatus.error,
				progress: item?.progress ?? 0,
				errorMessage: file.getErrors()[0]?.getMessage() ?? null,
				errorCode: null
			});
			this.#emitItemsChange();
		}
		#onUploadComplete() {
			if (this.#isCommitting) {
				this.#hasDeferredCommit = true;
				return;
			}
			this.#startCommit();
		}
		#startCommit() {
			const candidateIds = this.#getCommitCandidateIds();
			if (candidateIds.length === 0) {
				return;
			}
			const hasPlaceholders = this.#hasPlaceholders(candidateIds[0]);
			const commitIds = candidateIds.filter(id => this.#hasPlaceholders(id) === hasPlaceholders);
			if (commitIds.length < candidateIds.length) {
				this.#hasDeferredCommit = true;
			}
			const fileIds = [];
			commitIds.forEach(id => {
				const item = this.#items.get(id);
				const serverFileId = this.#serverFileIds.get(id);
				if (item === undefined || serverFileId === undefined) {
					return;
				}
				this.#spentIds.add(id);
				fileIds.push(serverFileId);
				this.#setItem({
					...item,
					status: BatchFileStatus.committing,
					progress: 100,
					errorMessage: null,
					errorCode: null
				});
			});
			this.#isCommitting = true;
			this.#emitItemsChange();
			this.emit(BatchUploadService.events.allUploaded, {
				fileIds,
				hasPlaceholders
			});
		}
		#finishCommit() {
			this.#isCommitting = false;
			if (this.#failLeftoverCommitting()) {
				this.#emitItemsChange();
			}
			if (!this.#hasDeferredCommit) {
				return;
			}
			this.#hasDeferredCommit = false;
			this.#startCommit();
		}
		#failLeftoverCommitting() {
			let hasLeftover = false;
			this.#items.forEach((item, id) => {
				if (item.status !== BatchFileStatus.committing) {
					return;
				}
				hasLeftover = true;
				this.#setItem({
					...item,
					status: BatchFileStatus.error,
					errorMessage: null,
					errorCode: COMMIT_FAILED_ERROR_CODE
				});
			});
			return hasLeftover;
		}
		#emitItemsChange() {
			this.emit(BatchUploadService.events.itemsChange, {
				items: this.getItems()
			});
		}
	}

	const FileRow = {
		name: 'BatchUploadFileRow',
		props: {
			item: {
				type: Object,
				required: true
			}
		},
		emits: ['remove', 'retry'],
		computed: {
			isFailed() {
				return this.item.status === BatchFileStatus.error;
			},
			isDone() {
				return this.item.status === BatchFileStatus.done;
			},
			isRejected() {
				return this.item.status === BatchFileStatus.rejected;
			},
			isCommitting() {
				return this.item.status === BatchFileStatus.committing;
			},
			isFinished() {
				return this.isDone || this.isFailed || this.isRejected;
			},
			statusModifier() {
				return `--${this.item.status}`;
			},
			isRemoveHidden() {
				return this.isCommitting || this.isDone;
			},
			removeModifier() {
				return this.isRemoveHidden ? '--hidden' : '';
			},
			progressPercent() {
				return Math.min(Math.max(Math.round(this.item.progress), 0), 100);
			},
			fillStyle() {
				const fillPercent = this.isFinished || this.isCommitting ? 100 : this.progressPercent;
				return {
					'--sign-b2e-batch-upload-row-fill': String(fillPercent / 100)
				};
			},
			statusText() {
				if (this.isFailed) {
					return getFileErrorText(this.item);
				}
				if (this.isRejected) {
					return main_core.Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_REJECTED_BY_LIMIT') ?? '';
				}
				if (this.isDone) {
					return '';
				}
				if (this.isCommitting) {
					return main_core.Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_COMMITTING_FILE') ?? '';
				}
				return `${this.progressPercent}%`;
			},
			retryText() {
				return main_core.Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_RETRY') ?? '';
			},
			retryLabel() {
				return main_core.Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_RETRY_FILE', {
					'#NAME#': this.item.name
				}) ?? '';
			},
			removeLabel() {
				return main_core.Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_REMOVE_FILE', {
					'#NAME#': this.item.name
				}) ?? '';
			},
			progressAttributes() {
				if (this.isFinished || this.isCommitting) {
					return {};
				}
				return {
					role: 'progressbar',
					'aria-label': main_core.Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_PROGRESS', {
						'#NAME#': this.item.name
					}) ?? '',
					'aria-valuemin': 0,
					'aria-valuemax': 100,
					'aria-valuenow': this.progressPercent
				};
			},
			markAttributes() {
				if (!this.isDone) {
					return {};
				}
				return {
					role: 'img',
					'aria-label': main_core.Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_DONE_MARK') ?? ''
				};
			}
		},
		template: `
		<div
			class="sign-b2e-batch-upload__row"
			:class="statusModifier"
			role="listitem"
			data-testid="sign-batch-upload-row"
		>
			<div class="sign-b2e-batch-upload__row-bar">
				<div
					class="sign-b2e-batch-upload__row-fill"
					:style="fillStyle"
					v-bind="progressAttributes"
					data-testid="sign-batch-upload-row-progress"
				></div>
				<div class="sign-b2e-batch-upload__row-body">
					<span
						v-if="isFinished"
						class="sign-b2e-batch-upload__row-mark"
						v-bind="markAttributes"
						data-testid="sign-batch-upload-row-mark"
					></span>
					<span class="sign-b2e-batch-upload__row-text">
						<span
							class="sign-b2e-batch-upload__row-name"
							:title="item.name"
							data-testid="sign-batch-upload-row-name"
						>{{ item.name }}</span>
						<span
							v-if="statusText"
							class="sign-b2e-batch-upload__row-status"
							data-testid="sign-batch-upload-row-status"
						>{{ statusText }}</span>
					</span>
				</div>
			</div>
			<button
				v-if="isFailed"
				type="button"
				class="ui-btn ui-btn-link sign-b2e-batch-upload__row-retry"
				:aria-label="retryLabel"
				data-testid="sign-batch-upload-retry-btn"
				@click="$emit('retry', item.id)"
			>{{ retryText }}</button>
			<button
				type="button"
				class="sign-b2e-batch-upload__row-remove --ui-hoverable"
				:class="removeModifier"
				:disabled="isRemoveHidden"
				:aria-label="removeLabel"
				data-testid="sign-batch-upload-remove-btn"
				@click="$emit('remove', item.id)"
			></button>
		</div>
	`
	};

	const TotalProgressMode = {
		none: 'none',
		uploading: 'uploading',
		committing: 'committing',
		done: 'done',
		partial: 'partial'
	};
	const COUNT_WEIGHT = 1;
	const RUNNING_STATUSES = new Set([BatchFileStatus.pending, BatchFileStatus.uploading]);
	function getTotalProgress(items) {
		const batch = items.filter(item => item.status !== BatchFileStatus.rejected);
		if (batch.length === 0) {
			return {
				mode: TotalProgressMode.none,
				percent: 0
			};
		}
		const useSizes = batch.every(item => item.size > 0);
		let weightTotal = 0;
		let weightUploaded = 0;
		let hasCommitting = false;
		let hasRunning = false;
		let hasFailed = false;
		batch.forEach(item => {
			const weight = useSizes ? item.size : COUNT_WEIGHT;
			weightTotal += weight;
			weightUploaded += weight * getUploadedFraction(item);
			hasCommitting = hasCommitting || item.status === BatchFileStatus.committing;
			hasRunning = hasRunning || RUNNING_STATUSES.has(item.status);
			hasFailed = hasFailed || item.status === BatchFileStatus.error;
		});
		return {
			mode: resolveMode(hasCommitting, hasRunning, hasFailed),
			percent: Math.round(weightUploaded / weightTotal * 100)
		};
	}
	function getUploadedFraction(item) {
		if (!RUNNING_STATUSES.has(item.status)) {
			return 1;
		}
		return Math.min(Math.max(item.progress, 0), 100) / 100;
	}
	function resolveMode(hasCommitting, hasRunning, hasFailed) {
		if (hasCommitting) {
			return TotalProgressMode.committing;
		}
		if (hasRunning) {
			return TotalProgressMode.uploading;
		}
		return hasFailed ? TotalProgressMode.partial : TotalProgressMode.done;
	}

	const LIMIT_NOTICE_ID_PREFIX = 'sign-b2e-batch-upload-limit-notice';
	const TOTAL_BAR_MODIFIER = new Map([[TotalProgressMode.committing, '--indeterminate'], [TotalProgressMode.done, '--done'], [TotalProgressMode.partial, '--partial']]);
	let appCount = 0;
	const BatchUploadApp = {
		name: 'BatchUploadApp',
		components: {
			FileRow
		},
		props: {
			onRemoveFile: {
				type: Function,
				required: true
			},
			onRetryFile: {
				type: Function,
				required: true
			},
			onAddMore: {
				type: Function,
				required: true
			},
			onClose: {
				type: Function,
				required: true
			},
			initialLimitTotal: {
				type: Number,
				required: true
			},
			initialLimitLeft: {
				type: Number,
				required: true
			}
		},
		setup() {
			return {
				limitNoticeId: `${LIMIT_NOTICE_ID_PREFIX}-${++appCount}`
			};
		},
		data() {
			return {
				items: [],
				doneCount: 0,
				rejectedNames: [],
				limitTotal: this.initialLimitTotal,
				limitLeft: this.initialLimitLeft
			};
		},
		computed: {
			committingCount() {
				return this.items.filter(item => {
					return item.status === BatchFileStatus.committing;
				}).length;
			},
			isCommitting() {
				return this.committingCount > 0;
			},
			counterText() {
				if (this.isCommitting) {
					return main_core.Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_COMMITTING_COUNTER', {
						'#COUNT#': String(this.committingCount)
					}) ?? '';
				}
				return main_core.Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_COUNTER', {
					'#DONE#': String(this.doneCount),
					'#TOTAL#': String(this.items.length)
				}) ?? '';
			},
			totalProgress() {
				return getTotalProgress(this.items);
			},
			hasTotalBar() {
				return this.totalProgress.mode !== TotalProgressMode.none;
			},
			isTotalIndeterminate() {
				return this.totalProgress.mode === TotalProgressMode.committing;
			},
			totalBarModifier() {
				return TOTAL_BAR_MODIFIER.get(this.totalProgress.mode) ?? '';
			},
			totalFillStyle() {
				return {
					'--sign-b2e-batch-upload-total-fill': String(this.totalProgress.percent / 100)
				};
			},
			totalPercentText() {
				if (this.totalProgress.mode !== TotalProgressMode.uploading) {
					return '';
				}
				return `${this.totalProgress.percent}%`;
			},
			totalProgressAttributes() {
				if (this.isTotalIndeterminate) {
					return {
						role: 'progressbar',
						'aria-label': main_core.Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_TOTAL_COMMITTING') ?? ''
					};
				}
				if (this.totalProgress.mode !== TotalProgressMode.uploading) {
					return {};
				}
				return {
					role: 'progressbar',
					'aria-label': main_core.Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_TOTAL_PROGRESS') ?? '',
					'aria-valuemin': 0,
					'aria-valuemax': 100,
					'aria-valuenow': this.totalProgress.percent
				};
			},
			limitHintText() {
				return main_core.Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_LIMIT_HINT', {
					'#LIMIT#': String(this.limitTotal)
				}) ?? '';
			},
			rejectedText() {
				if (this.rejectedNames.length === 0) {
					return '';
				}
				return main_core.Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_REJECTED_NOTICE', {
					'#COUNT#': String(this.rejectedNames.length),
					'#NAMES#': this.rejectedNames.join(', ')
				}) ?? '';
			},
			isLimitReached() {
				return this.limitLeft <= 0;
			},
			isAddMoreDisabled() {
				return this.isCommitting || this.isLimitReached;
			},
			limitReachedText() {
				return main_core.Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_LIMIT_REACHED') ?? '';
			},
			addMoreText() {
				return main_core.Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_ADD_MORE') ?? '';
			},
			closeText() {
				return main_core.Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_CLOSE') ?? '';
			}
		},
		template: `
		<div class="sign-b2e-batch-upload" data-testid="sign-batch-upload">
			<div class="sign-b2e-batch-upload__header">
				<div class="sign-b2e-batch-upload__header-line">
					<span
						class="sign-b2e-batch-upload__counter"
						role="status"
						data-testid="sign-batch-upload-counter"
					>
						{{ counterText }}
					</span>
					<span
						v-if="totalPercentText"
						class="sign-b2e-batch-upload__total-percent"
						data-testid="sign-batch-upload-total-percent"
					>{{ totalPercentText }}</span>
				</div>
				<div
					v-if="hasTotalBar"
					class="sign-b2e-batch-upload__total-bar"
					:class="totalBarModifier"
					v-bind="totalProgressAttributes"
					data-testid="sign-batch-upload-total-progress"
				>
					<div
						class="sign-b2e-batch-upload__total-fill"
						:style="totalFillStyle"
					></div>
				</div>
				<span
					class="sign-b2e-batch-upload__limit-hint"
					data-testid="sign-batch-upload-limit-hint"
				>{{ limitHintText }}</span>
			</div>
			<div
				v-if="rejectedText"
				class="sign-b2e-batch-upload__rejected-notice"
				role="alert"
				data-testid="sign-batch-upload-rejected-notice"
			>{{ rejectedText }}</div>
			<!-- A long list scrolls, and a scrollable region has to be reachable by keyboard:
				 without a tab stop of its own its content cannot be scrolled without a mouse. -->
			<div
				class="sign-b2e-batch-upload__list"
				role="list"
				tabindex="0"
				data-testid="sign-batch-upload-list"
			>
				<FileRow
					v-for="item in items"
					:key="item.id"
					:item="item"
					@remove="onRemoveFile"
					@retry="onRetryFile"
				/>
			</div>
			<div
				v-if="isLimitReached"
				class="sign-b2e-batch-upload__limit-notice"
				:id="limitNoticeId"
				role="status"
				data-testid="sign-batch-upload-limit-notice"
			>{{ limitReachedText }}</div>
			<div class="sign-b2e-batch-upload__footer">
				<button
					type="button"
					class="ui-btn ui-btn-light-border"
					:disabled="isAddMoreDisabled"
					:aria-describedby="isLimitReached ? limitNoticeId : null"
					data-testid="sign-batch-upload-add-more-btn"
					@click="onAddMore()"
				>{{ addMoreText }}</button>
				<button
					type="button"
					class="ui-btn ui-btn-primary"
					data-testid="sign-batch-upload-close-btn"
					@click="onClose()"
				>{{ closeText }}</button>
			</div>
		</div>
	`
	};

	const POPUP_WIDTH = 560;
	const POPUP_ID_PREFIX = 'sign-b2e-batch-upload-popup';
	let popupCount = 0;
	class BatchUploadPopup extends main_core_events.EventEmitter {
		static events = Object.freeze({
			addMore: 'addMore',
			close: 'close'
		});
		#service;
		#limitTotal;
		#resolveLimitLeft;
		#popup = null;
		#app = null;
		#appInstance = null;
		#container;
		#rejectedNames = [];
		#isVisible = false;
		#resizeObserver = null;
		#contentHeight = 0;
		#itemsChangeHandler;
		#rejectedHandler;
		constructor(options) {
			super();
			this.setEventNamespace('BX.Sign.V2.B2e.BatchUploadPopup');
			this.#service = options.service;
			this.#limitTotal = options.limitTotal;
			this.#resolveLimitLeft = options.resolveLimitLeft;
			this.#container = main_core.Tag.render`<div></div>`;
			this.#itemsChangeHandler = event => this.#syncFromService(event.getData().items);
			this.#rejectedHandler = event => this.#onRejected(event);
			this.#service.subscribe(BatchUploadService.events.itemsChange, this.#itemsChangeHandler);
			this.#service.subscribe(BatchUploadService.events.rejected, this.#rejectedHandler);
		}
		show() {
			if (this.#popup === null) {
				this.#mountApp();
				this.#popup = new main_popup.Popup({
					id: `${POPUP_ID_PREFIX}-${++popupCount}`,
					content: this.#container,
					titleBar: main_core.Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_TITLE') ?? '',
					width: POPUP_WIDTH,
					closeIcon: true,
					closeByEsc: true,
					overlay: true,
					focusTrap: true,
					events: {
						onPopupClose: () => {
							this.#isVisible = false;
							this.emit(BatchUploadPopup.events.close);
						}
					}
				});
				this.#observeContentHeight();
			}
			this.#isVisible = true;
			this.#syncFromService();
			this.#popup.show();
		}
		close() {
			this.#popup?.close();
		}
		refreshLimitLeft() {
			if (this.#appInstance === null || !this.#isVisible) {
				return;
			}
			this.#appInstance.limitLeft = this.#resolveLimitLeft();
		}
		destroy() {
			this.#service.unsubscribe(BatchUploadService.events.itemsChange, this.#itemsChangeHandler);
			this.#service.unsubscribe(BatchUploadService.events.rejected, this.#rejectedHandler);
			this.#isVisible = false;
			this.#resizeObserver?.disconnect();
			this.#resizeObserver = null;
			this.#app?.unmount();
			this.#app = null;
			this.#appInstance = null;
			this.#popup?.destroy();
			this.#popup = null;
		}
		#observeContentHeight() {
			this.#resizeObserver = new ResizeObserver(entries => {
				const height = Math.round(entries[0].contentRect.height);
				if (!this.#isVisible || height === this.#contentHeight) {
					return;
				}
				this.#contentHeight = height;
				this.#popup?.adjustPosition();
			});
			this.#resizeObserver.observe(this.#container);
		}
		#mountApp() {
			const service = this.#service;
			this.#app = ui_vue3.BitrixVue.createApp(BatchUploadApp, {
				initialLimitTotal: this.#limitTotal,
				initialLimitLeft: this.#resolveLimitLeft(),
				onRemoveFile: id => service.removeFile(id),
				onRetryFile: id => service.retryFile(id),
				onAddMore: () => this.emit(BatchUploadPopup.events.addMore),
				onClose: () => this.close()
			});
			this.#appInstance = this.#app.mount(this.#container);
		}
		#syncFromService(items = null) {
			if (this.#appInstance === null || !this.#isVisible) {
				return;
			}
			this.#appInstance.items = items ?? this.#service.getItems();
			this.#appInstance.doneCount = this.#service.getDoneCount();
			this.#appInstance.rejectedNames = this.#rejectedNames;
			this.#appInstance.limitLeft = this.#resolveLimitLeft();
		}
		#onRejected(event) {
			this.#rejectedNames = event.getData().names ?? [];
			this.#syncFromService();
		}
	}

	exports.BatchFileStatus = BatchFileStatus;
	exports.BatchUploadPopup = BatchUploadPopup;
	exports.BatchUploadService = BatchUploadService;

})(this.BX.Sign.V2.B2e = this.BX.Sign.V2.B2e || {}, window, BX.UI, BX, BX.Event, BX.UI.Uploader, BX.Main, BX.Vue3);
//# sourceMappingURL=batch-upload.bundle.js.map
