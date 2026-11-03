/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
this.BX.Crm.Integration = this.BX.Crm.Integration || {};
this.BX.Crm.Integration.DocumentGenerator = this.BX.Crm.Integration.DocumentGenerator || {};
this.BX.Crm.Integration.DocumentGenerator.Document = this.BX.Crm.Integration.DocumentGenerator.Document || {};
(function (exports, main_core) {
	'use strict';

	class CreationOperation {
		#operationId;
		#signedParameters;
		#request;
		#location;
		#history;
		#activeRequest = null;
		#generation = 0;
		#documentUrlCommitted = false;
		constructor(options) {
			this.#operationId = options.operationId;
			this.#signedParameters = options.signedParameters;
			this.#request = options.request || (requestOptions => main_core.ajax.runComponentAction('bitrix:crm.document.view', 'createDocument', requestOptions));
			this.#location = options.location || window.location;
			this.#history = options.history || window.history;
		}
		getId() {
			return this.#operationId;
		}
		run() {
			if (this.#activeRequest) {
				return this.#activeRequest;
			}
			this.#persistInUrl();
			const generation = this.#generation;
			let request = null;
			try {
				request = this.#request({
					mode: 'class',
					data: {
						operationId: this.#operationId
					},
					signedParameters: this.#signedParameters
				});
			} catch (error) {
				request = Promise.reject(error);
			}
			this.#activeRequest = Promise.resolve(request).finally(() => {
				if (generation === this.#generation) {
					this.#activeRequest = null;
				}
			});
			return this.#activeRequest;
		}

		/**
		 * Once the document exists, the address has to survive a reload as the document and not as a creation
		 * request: the stored operation state expires, and a reload of the creation address creates a second
		 * document. That is also why the operation id is not written to the address any more.
		 */
		commitDocumentUrl(documentUrl) {
			if (this.#documentUrlCommitted || !documentUrl) {
				return;
			}
			this.#documentUrlCommitted = true;
			this.#history.replaceState({}, '', documentUrl);
		}
		reset() {
			this.#generation++;
			this.#activeRequest = null;
		}
		#persistInUrl() {
			if (!this.#operationId || this.#documentUrlCommitted) {
				return;
			}
			const url = new URL(this.#location.href);
			url.searchParams.set('operationId', this.#operationId);
			this.#history.replaceState({}, '', url.toString());
		}
	}

	const FIRST_WINDOW = 60 * 1000;
	const SECOND_WINDOW = 5 * 60 * 1000;
	const TIMEOUT = 20 * 60 * 1000;
	const MAX_REQUESTS = 74;
	class PreviewReconciliation {
		#request;
		#onReady;
		#onError;
		#onUnavailable;
		#now;
		#setTimeout;
		#clearTimeout;
		#startedAt = null;
		#requestCount = 0;
		#timer = null;
		#active = false;
		#destroyed = false;
		#generation = 0;
		constructor(options) {
			this.#request = options.request;
			this.#onReady = options.onReady || (() => {});
			this.#onError = options.onError || (() => {});
			this.#onUnavailable = options.onUnavailable || (() => {});
			this.#now = options.now || (() => Date.now());
			this.#setTimeout = options.setTimeout || ((callback, delay) => setTimeout(callback, delay));
			this.#clearTimeout = options.clearTimeout || (timer => clearTimeout(timer));
		}
		start() {
			this.stop();
			this.#destroyed = false;
			this.#active = true;
			this.#startedAt = this.#now();
			this.#requestCount = 0;
			this.#schedule();
		}
		stop() {
			this.#generation++;
			this.#active = false;
			if (this.#timer !== null) {
				this.#clearTimeout(this.#timer);
				this.#timer = null;
			}
		}
		destroy() {
			this.#destroyed = true;
			this.stop();
		}
		applyPull(snapshot) {
			if (this.#destroyed) {
				return;
			}
			this.#applyTerminalSnapshot(snapshot);
		}
		#schedule() {
			if (!this.#active) {
				return;
			}
			const elapsed = this.#now() - this.#startedAt;
			if (elapsed >= TIMEOUT || this.#requestCount >= MAX_REQUESTS) {
				this.stop();
				this.#onUnavailable();
				return;
			}
			const delay = this.#getDelay(elapsed);
			if (elapsed + delay > TIMEOUT) {
				this.stop();
				this.#onUnavailable();
				return;
			}
			const generation = this.#generation;
			this.#timer = this.#setTimeout(async () => {
				if (generation !== this.#generation || !this.#active) {
					return;
				}
				this.#timer = null;
				await this.#runRequest();
			}, delay);
		}
		async #runRequest() {
			if (!this.#active) {
				return;
			}
			const generation = this.#generation;
			this.#requestCount++;
			try {
				const snapshot = await this.#request();
				if (generation !== this.#generation || !this.#active) {
					return;
				}
				if (this.#applyTerminalSnapshot(snapshot)) {
					return;
				}
			} catch {
				// Transport failures share the same bounded schedule as empty snapshots.
			}
			if (generation === this.#generation && this.#active) {
				this.#schedule();
			}
		}
		#applyTerminalSnapshot(snapshot) {
			if (snapshot?.imageUrl || snapshot?.pdfUrl) {
				this.stop();
				this.#onReady(snapshot);
				return true;
			}
			if (snapshot?.isTransformationError) {
				this.stop();
				this.#onError(snapshot);
				return true;
			}
			return false;
		}
		#getDelay(elapsed) {
			if (elapsed < FIRST_WINDOW) {
				return 3000;
			}
			if (elapsed < SECOND_WINDOW) {
				return 10000;
			}
			return 30000;
		}
	}

	const DocumentViewState = {
		AssemblingDocx: 'assemblingDocx',
		DocxReady: 'docxReady',
		DocxReadyUntracked: 'docxReadyUntracked',
		ReconciliationRequired: 'reconciliationRequired',
		PreviewReady: 'previewReady',
		CreationError: 'creationError',
		Unknown: 'unknown',
		PreviewError: 'previewError',
		PreviewUnavailable: 'previewUnavailable'
	};
	const MESSAGE_KEYS = {
		assemblingDocx: 'CRM_DOCUMENT_VIEW_CREATE_ASSEMBLING_DOCX',
		docxReady: 'CRM_DOCUMENT_VIEW_CREATE_DOCX_READY',
		docxReadyUntracked: 'CRM_DOCUMENT_VIEW_CREATE_DOCX_READY_UNTRACKED',
		reconciliationRequired: 'CRM_DOCUMENT_VIEW_CREATE_RECONCILIATION_REQUIRED',
		creationError: 'CRM_DOCUMENT_VIEW_CREATE_ERROR',
		unknown: 'CRM_DOCUMENT_VIEW_CREATE_UNKNOWN',
		previewError: 'CRM_DOCUMENT_VIEW_CREATE_PREVIEW_ERROR',
		previewUnavailable: 'CRM_DOCUMENT_VIEW_CREATE_PREVIEW_UNAVAILABLE',
		validation: 'CRM_DOCUMENT_VIEW_CREATE_STAGE_VALIDATION',
		docxAssembly: 'CRM_DOCUMENT_VIEW_CREATE_STAGE_DOCX_ASSEMBLY',
		previewPreparation: 'CRM_DOCUMENT_VIEW_CREATE_STAGE_PREVIEW_PREPARATION',
		assemblingDocxHint: 'CRM_DOCUMENT_VIEW_CREATE_ASSEMBLING_DOCX_HINT',
		// the phrase is published by the crm.document.view template this view drives
		docxReadyHint: 'CRM_DOCUMENT_VIEW_PREVIEW_MESSAGE_READY_MSGVER_1',
		closeConfirmationTitle: 'CRM_DOCUMENT_VIEW_CREATE_CLOSE_CONFIRM_TITLE',
		closeConfirmationMessage: 'CRM_DOCUMENT_VIEW_CREATE_CLOSE_CONFIRM_MESSAGE',
		closeConfirmationOk: 'CRM_DOCUMENT_VIEW_CREATE_CLOSE_CONFIRM_OK',
		closeConfirmationCancel: 'CRM_DOCUMENT_VIEW_CREATE_CLOSE_CONFIRM_CANCEL'
	};
	const WAITING_STATES = new Set([DocumentViewState.AssemblingDocx, DocumentViewState.DocxReady]);
	const CREATION_FAILURE_STATES = new Set([DocumentViewState.CreationError, DocumentViewState.Unknown]);
	const showCloseConfirmation = ({
		title,
		message,
		okCaption,
		cancelCaption
	}) => {
		const messageBox = BX.UI?.Dialogs?.MessageBox;
		if (!messageBox) {
			return null;
		}
		return new Promise(resolve => {
			const confirmation = messageBox.confirm(message, title, dialog => {
				dialog.close();
				resolve(true);
			}, okCaption, dialog => {
				dialog.close();
				resolve(false);
			}, cancelCaption);
			main_core.Dom.attr(confirmation.getPopupWindow().getPopupContainer(), 'data-testid', 'crm-document-view-close-confirmation');
			main_core.Dom.attr(confirmation.getOkButton().getContainer(), 'data-testid', 'crm-document-view-close-confirm');
			main_core.Dom.attr(confirmation.getCancelButton().getContainer(), 'data-testid', 'crm-document-view-close-cancel');
		});
	};
	const resolveCloseDialog = override => override || showCloseConfirmation;
	class DocumentView {
		#operationData;
		#operation;
		#nodes;
		#messages;
		#processAssets;
		#insertHtml;
		#reload;
		#location;
		#ownerSlider;
		#isPullConnected;
		#createDocumentPreview;
		#onDocumentReady;
		#onDocumentUpdate;
		#onPreviewReady;
		#onPreviewChange;
		#clock;
		#state = null;
		#document = {};
		#activeRequest = null;
		#requestToken = 0;
		#previewReconciliation = null;
		#preview = null;
		#selectorInserted = false;
		#assetsProcessed = false;
		#savedDocumentId = null;
		#limitReloaded = false;
		#destroyed = false;
		#retryTimer = null;
		#unsubscribeSliderClose = null;
		#readyPreviewKey = null;
		#confirmClose;
		#closeConfirmed = false;
		#initialSpeedupHidden;
		constructor(options) {
			this.#operationData = {
				...options.operation
			};
			this.#nodes = options.nodes || {};
			this.#initialSpeedupHidden = {
				placeholder: Boolean(this.#nodes.speedupPlaceholder?.hidden),
				sidebar: Boolean(this.#nodes.speedupSidebar?.hidden)
			};
			this.#messages = this.#resolveMessages(options.messages || {});
			this.#processAssets = options.processAssets || (() => Promise.resolve());
			this.#insertHtml = options.insertHtml || ((node, content) => main_core.html(node, content));
			this.#reload = options.reload || (url => window.location.assign(url));
			this.#location = options.location || window.location;
			this.#ownerSlider = options.ownerSlider ?? this.#getOwnerSlider();
			this.#isPullConnected = options.isPullConnected || (() => this.#hasPullConnection());
			this.#createDocumentPreview = options.createDocumentPreview || (previewOptions => {
				return new BX.DocumentGenerator.DocumentPreview(previewOptions);
			});
			this.#onDocumentReady = options.onDocumentReady || (() => {});
			this.#onDocumentUpdate = options.onDocumentUpdate || (() => {});
			this.#onPreviewReady = options.onPreviewReady || (() => {});
			this.#onPreviewChange = options.onPreviewChange;
			this.#confirmClose = resolveCloseDialog(options.confirmClose);
			this.#clock = options.clock || {};
			this.#operation = new CreationOperation({
				operationId: this.#operationData.id,
				signedParameters: options.signedParameters,
				request: options.request,
				location: this.#location,
				history: options.history
			});
			if (this.#nodes.pageTitle && options.initialTitle) {
				this.#nodes.pageTitle.textContent = options.initialTitle;
			}
			this.#unsubscribeSliderClose = this.#subscribeToSliderClose(options.subscribeSliderClose);
		}
		getState() {
			return this.#state;
		}
		getDocument() {
			return {
				...this.#document
			};
		}
		getMessages() {
			return {
				...this.#messages
			};
		}
		getOwnerSlider() {
			return this.#ownerSlider;
		}
		start() {
			if (this.#activeRequest) {
				return this.#activeRequest;
			}
			this.#destroyed = false;
			const token = ++this.#requestToken;
			this.#transition(DocumentViewState.AssemblingDocx);
			this.#activeRequest = this.#operation.run().then(response => this.#handleResponse(response, token)).catch(failure => this.#handleFailure(failure, token)).finally(() => {
				if (token === this.#requestToken) {
					this.#activeRequest = null;
				}
			});
			return this.#activeRequest;
		}
		retry() {
			if (this.#limitReloaded || ![DocumentViewState.CreationError, DocumentViewState.Unknown].includes(this.#state) || this.#operationData.retryAllowed === false) {
				return Promise.resolve();
			}
			this.#clearRetryTimer();
			this.#operation.reset();
			return this.start();
		}
		reinitialize() {
			this.#requestToken++;
			this.#activeRequest = null;
			this.#stopPreview();
			this.#clearRetryTimer();
			this.#operation.reset();
			this.#selectorInserted = false;
			this.#assetsProcessed = false;
			this.#savedDocumentId = null;
			this.#readyPreviewKey = null;
			return this.start();
		}
		async applyResponse(response) {
			return this.#handleResponse(response, this.#requestToken);
		}
		prepareDocumentUpdate() {
			this.#stopPreview();
			this.#readyPreviewKey = null;
		}
		applyDocumentUpdate(documentData) {
			this.prepareDocumentUpdate();
			this.#applyDocument({
				imageUrl: '',
				pdfUrl: '',
				printUrl: '',
				...documentData
			});
			this.#applySuccessState(this.#document);
		}
		applyPull(snapshot) {
			if (this.#destroyed) {
				return;
			}
			if (this.#previewReconciliation) {
				this.#previewReconciliation.applyPull(snapshot);
				return;
			}
			this.#applyPreviewSnapshot(snapshot);
		}
		markPreviewUnavailable() {
			this.#transition(DocumentViewState.PreviewUnavailable);
		}
		destroy() {
			this.#destroyed = true;
			this.#requestToken++;
			this.#activeRequest = null;
			this.#operation.reset();
			this.#stopPreview();
			this.#clearRetryTimer();
			if (this.#unsubscribeSliderClose) {
				this.#unsubscribeSliderClose();
				this.#unsubscribeSliderClose = null;
			}
		}
		async #handleResponse(response, token) {
			if (this.#isRequestObsolete(token)) {
				return;
			}
			const responseData = response?.data;
			const additionalParams = responseData?.additionalParams;
			const documentData = additionalParams?.document;
			if (!documentData) {
				this.#transition(DocumentViewState.Unknown);
				return;
			}
			this.#clearRetryTimer();
			const responseKey = `${additionalParams.operation?.id || ''}:${documentData.id || ''}`;
			const isFirstApplication = this.#savedDocumentId !== responseKey;
			if (!(await this.#prepareComponentResponse(responseData, isFirstApplication, token))) {
				return;
			}
			this.#operationData = {
				...this.#operationData,
				...additionalParams.operation
			};
			this.#applyDocument(documentData);
			if (isFirstApplication) {
				await this.#onDocumentReady({
					...this.#document
				});
				if (this.#isRequestObsolete(token)) {
					return;
				}
				this.#savedDocumentId = responseKey;
				this.#saveDocumentToSliderData();
			}
			this.#applySuccessState(documentData);
		}
		async #prepareComponentResponse(responseData, isFirstApplication, token) {
			if (isFirstApplication && !this.#assetsProcessed) {
				await this.#processAssets(responseData.assets || {});
				if (this.#isRequestObsolete(token)) {
					return false;
				}
				this.#assetsProcessed = true;
			}
			if (isFirstApplication && !this.#selectorInserted && this.#nodes.channelSelector && responseData.html) {
				this.#insertHtml(this.#nodes.channelSelector, responseData.html);
				this.#selectorInserted = true;
			}
			return true;
		}
		#isRequestObsolete(token) {
			return token !== this.#requestToken || this.#destroyed;
		}
		#applySuccessState(documentData) {
			if (this.#operationData.state === DocumentViewState.DocxReadyUntracked) {
				this.#transition(DocumentViewState.DocxReadyUntracked);
				this.#startPreview(documentData);
				return;
			}
			if (this.#operationData.state === DocumentViewState.ReconciliationRequired) {
				this.#transition(DocumentViewState.ReconciliationRequired);
				return;
			}
			if (documentData.imageUrl || documentData.pdfUrl) {
				this.#ensurePreview(documentData, Boolean(documentData.imageUrl));
				this.#transition(DocumentViewState.PreviewReady);
				this.#notifyPreviewReady();
				return;
			}
			if (documentData.isTransformationError) {
				this.#transition(DocumentViewState.PreviewError, {
					message: documentData.transformationErrorMessage,
					customData: {
						failureStage: 'previewPreparation'
					}
				});
				return;
			}
			this.#transition(DocumentViewState.DocxReady);
			this.#startPreview(documentData);
		}
		#handleFailure(failure, token) {
			if (token !== this.#requestToken || this.#destroyed) {
				return;
			}
			const error = Array.isArray(failure?.errors) ? failure.errors[0] : null;
			if (!error?.customData?.operation) {
				this.#transition(DocumentViewState.Unknown);
				return;
			}
			this.#operationData = {
				...this.#operationData,
				...error.customData.operation
			};
			if (error.code === 'DOCGEN_LIMIT_ERROR') {
				this.#operationData.retryAllowed = false;
				this.#transition(DocumentViewState.CreationError, error);
				this.#reloadLimitPage();
				return;
			}
			if (this.#operationData.state === DocumentViewState.ReconciliationRequired) {
				this.#transition(DocumentViewState.ReconciliationRequired, error);
				return;
			}
			if (error.code === 'DOCUMENT_CREATION_BUSY' && Number(this.#operationData.retryAfter) > 0) {
				this.#transition(DocumentViewState.AssemblingDocx);
				this.#scheduleRetry(Number(this.#operationData.retryAfter) * 1000);
				return;
			}
			this.#transition(DocumentViewState.CreationError, error);
		}
		#startPreview(documentData) {
			this.#ensurePreview(documentData);
			if (this.#previewReconciliation) {
				return;
			}
			this.#previewReconciliation = new PreviewReconciliation({
				request: () => this.#requestPreviewSnapshot(),
				onReady: snapshot => this.#applyPreviewSnapshot(snapshot),
				onError: snapshot => this.#applyPreviewError(snapshot),
				onUnavailable: () => this.markPreviewUnavailable(),
				now: this.#clock.now,
				setTimeout: this.#clock.setTimeout,
				clearTimeout: this.#clock.clearTimeout
			});
			this.#previewReconciliation.start();
		}
		#ensurePreview(documentData, allowWithoutPull = false) {
			const isPullConnected = this.#isPullConnected();
			if (this.#preview) {
				if (documentData.imageUrl) {
					this.#preview.applyOptions(documentData);
					this.#preview.start();
				}
				return;
			}
			if (!allowWithoutPull && !isPullConnected) {
				return;
			}
			const previewOptions = {
				...documentData,
				previewNode: this.#nodes.preview,
				transformationErrorNode: this.#nodes.transformError,
				onReady: snapshot => this.applyPull(snapshot)
			};
			if (!isPullConnected) {
				previewOptions.id = null;
				previewOptions.pullTag = null;
			}
			this.#preview = this.#createDocumentPreview(previewOptions);
			this.#onPreviewChange?.(this.#preview);
		}
		async #requestPreviewSnapshot() {
			this.#operation.reset();
			try {
				const response = await this.#operation.run();
				return response?.data?.additionalParams?.document || {};
			} catch (failure) {
				const error = Array.isArray(failure?.errors) ? failure.errors[0] : null;
				if (error?.customData?.failureStage === 'previewPreparation') {
					return {
						isTransformationError: true,
						transformationErrorMessage: error.message
					};
				}
				throw failure;
			}
		}
		#applyPreviewSnapshot(snapshot) {
			this.#applyDocument(snapshot);
			this.#saveDocumentToSliderData();
			this.#ensurePreview(this.#document, Boolean(this.#document.imageUrl));
			this.#transition(DocumentViewState.PreviewReady);
			this.#notifyPreviewReady();
		}
		#applyPreviewError(snapshot) {
			this.#applyDocument(snapshot);
			this.#transition(DocumentViewState.PreviewError, {
				message: snapshot.transformationErrorMessage,
				customData: {
					failureStage: 'previewPreparation'
				}
			});
		}
		#applyDocument(documentData) {
			this.#document = {
				...this.#document,
				...documentData
			};
			this.#operation.commitDocumentUrl(this.#document.documentUrl);
			this.#onDocumentUpdate({
				...this.#document
			});
			if (this.#nodes.pageTitle && documentData.title) {
				this.#nodes.pageTitle.textContent = documentData.title;
			}
		}
		#saveDocumentToSliderData() {
			const documentId = Number(this.#document.id);
			if (!this.#ownerSlider || documentId <= 0) {
				return;
			}
			this.#ownerSlider.getData().set('document', {
				id: documentId,
				title: this.#nodes.pageTitle?.textContent || this.#document.title || '',
				detailUrl: this.#removeMode(this.#document.editDocumentUrl || ''),
				isWithStamps: Boolean(this.#nodes.stampCheckbox?.checked)
			});
		}
		#removeMode(url) {
			if (!url) {
				return '';
			}
			const parsedUrl = new URL(url, this.#location.href);
			parsedUrl.searchParams.delete('mode');
			return parsedUrl.origin === new URL(this.#location.href).origin ? `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}` : parsedUrl.toString();
		}
		#transition(state, error = null) {
			this.#state = state;
			const isPreviewFailure = [DocumentViewState.PreviewError, DocumentViewState.PreviewUnavailable].includes(state);
			if (this.#nodes.root) {
				this.#nodes.root.dataset.state = state;
			}
			if (this.#nodes.loader) {
				const stageHint = this.#getStageHint(state);
				this.#nodes.loader.hidden = stageHint === '';
				this.#setNodeText(this.#nodes.loader, stageHint);
			}
			if (this.#nodes.progress) {
				this.#nodes.progress.hidden = !WAITING_STATES.has(state);
			}
			this.#updateSpeedupVisibility(state);
			if (this.#nodes.retry) {
				const shouldHideRetry = !([state === DocumentViewState.CreationError, state === DocumentViewState.Unknown].some(Boolean) && this.#operationData.retryAllowed !== false);
				if (shouldHideRetry && this.#nodes.retry.contains(this.#nodes.retry.ownerDocument.activeElement)) {
					this.#nodes.sidebar?.focus();
				}
				this.#nodes.retry.hidden = shouldHideRetry;
			}
			if (this.#nodes.download) {
				this.#setNodeDisabled(this.#nodes.download, !this.#document.downloadUrl);
			}
			if (this.#nodes.pdf) {
				this.#setNodeDisabled(this.#nodes.pdf, !this.#document.pdfUrl);
			}
			if (this.#nodes.print) {
				this.#setNodeDisabled(this.#nodes.print, !this.#document.printUrl);
			}
			this.#renderPreviewState(isPreviewFailure, state, error);
			if (this.#nodes.error) {
				const errorMessage = isPreviewFailure ? '' : this.#getErrorMessage(state, error);
				this.#nodes.error.hidden = errorMessage === '';
				this.#setNodeText(this.#nodes.error, errorMessage);
			}
			if (this.#nodes.status) {
				this.#setNodeText(this.#nodes.status, this.#messages[state] || '');
			}
		}
		#updateSpeedupVisibility(state) {
			const isCreationFailure = CREATION_FAILURE_STATES.has(state);
			if (this.#nodes.speedupPlaceholder) {
				this.#nodes.speedupPlaceholder.hidden = isCreationFailure || this.#initialSpeedupHidden.placeholder;
			}
			if (this.#nodes.speedupSidebar) {
				this.#nodes.speedupSidebar.hidden = isCreationFailure || this.#initialSpeedupHidden.sidebar;
			}
		}
		#setNodeText(node, text) {
			if (node.textContent === text) {
				return;
			}
			const targetNode = node;
			targetNode.textContent = text;
		}
		#getStageHint(state) {
			if (state === DocumentViewState.AssemblingDocx) {
				return this.#messages.assemblingDocxHint;
			}
			return state === DocumentViewState.DocxReady ? this.#messages.docxReadyHint : '';
		}

		// both sheet zones carry an inline display from the shell, so visibility stays inline too
		#renderPreviewState(isPreviewFailure, state, error) {
			if (this.#nodes.preview) {
				const isStageVisible = !isPreviewFailure && state !== DocumentViewState.PreviewReady;
				main_core.Dom.style(this.#nodes.preview, 'display', isStageVisible ? 'block' : 'none');
			}
			if (this.#nodes.transformError) {
				const messageNode = this.#nodes.transformErrorMessage || this.#nodes.transformError;
				const message = isPreviewFailure ? this.#getErrorMessage(state, error) : '';
				main_core.Dom.style(this.#nodes.transformError, 'display', isPreviewFailure ? 'block' : 'none');
				this.#setNodeText(messageNode, message);
			}
			if (this.#nodes.previewDownload) {
				const downloadUrl = this.#document.downloadUrl || '';
				const canOfferDocx = isPreviewFailure && downloadUrl !== '';
				if (canOfferDocx) {
					this.#nodes.previewDownload.href = downloadUrl;
				} else {
					this.#nodes.previewDownload.removeAttribute('href');
				}
				this.#nodes.previewDownload.hidden = !canOfferDocx;
			}
			if (isPreviewFailure) {
				this.#readyPreviewKey = null;
			}
		}
		#notifyPreviewReady() {
			if (!this.#document.imageUrl && !this.#document.pdfUrl) {
				return;
			}
			const readyPreviewKey = `${this.#document.imageUrl || ''}:${this.#document.pdfUrl || ''}`;
			if (readyPreviewKey === this.#readyPreviewKey) {
				return;
			}
			this.#readyPreviewKey = readyPreviewKey;
			this.#onPreviewReady({
				...this.#document
			});
		}
		#setNodeDisabled(node, disabled) {
			if (main_core.Type.isFunction(node.setDisabled)) {
				node.setDisabled(disabled);
				return;
			}
			const buttonNode = node;
			buttonNode.disabled = disabled;
		}
		#getErrorMessage(state, error) {
			if (state === DocumentViewState.CreationError && error) {
				const stage = error.customData?.failureStage;
				return [this.#messages[stage], error.message].filter(Boolean).join(': ');
			}
			if ([DocumentViewState.Unknown, DocumentViewState.ReconciliationRequired, DocumentViewState.PreviewError, DocumentViewState.PreviewUnavailable, DocumentViewState.DocxReadyUntracked].includes(state)) {
				return error?.message || this.#messages[state] || '';
			}
			return '';
		}
		#reloadLimitPage() {
			if (this.#limitReloaded) {
				return;
			}
			this.#limitReloaded = true;
			const url = new URL(this.#location.href);
			url.searchParams.delete('analyticsLabel');
			url.searchParams.set('showLimit', 'Y');
			this.#reload(url.toString());
		}
		#stopPreview() {
			if (this.#previewReconciliation) {
				this.#previewReconciliation.destroy();
				this.#previewReconciliation = null;
			}
			const preview = this.#preview;
			if (preview?.destroy) {
				preview.destroy();
			}
			this.#preview = null;
			if (preview) {
				this.#onPreviewChange?.(null);
			}
		}
		#scheduleRetry(delay) {
			this.#clearRetryTimer();
			const schedule = this.#clock.setTimeout || ((callback, timeout) => setTimeout(callback, timeout));
			this.#retryTimer = schedule(() => {
				this.#retryTimer = null;
				if (this.#destroyed) {
					return;
				}
				this.#operation.reset();
				this.start();
			}, delay);
		}
		#clearRetryTimer() {
			if (this.#retryTimer === null) {
				return;
			}
			const clear = this.#clock.clearTimeout || (timer => clearTimeout(timer));
			clear(this.#retryTimer);
			this.#retryTimer = null;
		}
		#subscribeToSliderClose(subscribe) {
			if (!this.#ownerSlider) {
				return null;
			}
			const handleSliderClose = (slider, sliderEvent) => {
				if (slider !== this.#ownerSlider || this.#requestCloseConfirmation(sliderEvent)) {
					return;
				}
				this.destroy();
			};
			if (subscribe) {
				return subscribe(handleSliderClose);
			}

			// addCustomEvent subscribes in compat mode, so the slider event arrives unwrapped
			const eventHandler = event => {
				const sliderEvent = main_core.Type.isFunction(event?.getData) ? event.getData()[0] : event;
				handleSliderClose(sliderEvent?.getSlider?.(), sliderEvent);
			};
			main_core.addCustomEvent('SidePanel.Slider:onClose', eventHandler);
			return () => main_core.removeCustomEvent('SidePanel.Slider:onClose', eventHandler);
		}
		#requestCloseConfirmation(sliderEvent) {
			if (this.#state !== DocumentViewState.AssemblingDocx || this.#closeConfirmed || !main_core.Type.isFunction(sliderEvent?.denyAction)) {
				return false;
			}
			const confirmation = this.#confirmClose({
				title: this.#messages.closeConfirmationTitle,
				message: this.#messages.closeConfirmationMessage,
				okCaption: this.#messages.closeConfirmationOk,
				cancelCaption: this.#messages.closeConfirmationCancel
			});
			if (!confirmation) {
				return false;
			}
			sliderEvent.denyAction();
			this.#closeAfterConfirmation(confirmation);
			return true;
		}
		async #closeAfterConfirmation(confirmation) {
			if (!(await confirmation)) {
				return;
			}
			this.#closeConfirmed = true;
			this.#ownerSlider?.close();
		}
		#getOwnerSlider() {
			return BX.SidePanel?.Instance?.getSliderByWindow(window) || null;
		}
		#hasPullConnection() {
			const pull = top.BX?.PULL;
			if (!pull) {
				return false;
			}
			return pull.isConnected ? pull.isConnected() : Boolean(pull.getDebugInfoArray()?.connected);
		}
		#resolveMessages(overrides) {
			return Object.fromEntries(Object.entries(MESSAGE_KEYS).map(([name, key]) => {
				return [name, overrides[name] || main_core.Loc.getMessage(key) || ''];
			}));
		}
	}

	exports.DocumentView = DocumentView;
	exports.DocumentViewState = DocumentViewState;

})(this.BX.Crm.Integration.DocumentGenerator.Document.View = this.BX.Crm.Integration.DocumentGenerator.Document.View || {}, BX);
//# sourceMappingURL=view.bundle.js.map
