/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, ui_alerts, mail_client_largeAttachment, main_core) {
	'use strict';

	function serializeMainMailSendContracts(formId, contracts) {
		const form = document.getElementById(formId);
		if (!(form instanceof HTMLFormElement)) {
			return false;
		}
		form.querySelectorAll('input[name^="DATA[__largeAttachments]"]').forEach(input => {
			main_core.Dom.remove(input);
		});
		contracts.forEach((contract, index) => {
			const tokenInput = document.createElement('input');
			tokenInput.type = 'hidden';
			tokenInput.name = `DATA[__largeAttachments][${index}][token]`;
			tokenInput.value = contract.token;
			form.append(tokenInput);
			contract.fileIds.forEach(fileId => {
				const fileIdInput = document.createElement('input');
				fileIdInput.type = 'hidden';
				fileIdInput.name = `DATA[__largeAttachments][${index}][fileIds][]`;
				fileIdInput.value = String(fileId);
				form.append(fileIdInput);
			});
		});
		return true;
	}

	function isSuccessfulSendResponse(response) {
		if (!main_core.Type.isObjectLike(response)) {
			return false;
		}
		const data = response;
		const hasErrorValue = value => Array.isArray(value) ? value.length > 0 : Boolean(value);
		return data.status === 'success' || data.status !== 'error' && !hasErrorValue(data.ERROR) && !hasErrorValue(data.ERROR_HTML) && !hasErrorValue(data.ERROR_CODE) && !hasErrorValue(data.errors);
	}

	const LIMIT_SLIDER_CODE = 'limit_v2_mail_large_attachment_disk_upload';
	const CrmLargeAttachmentErrorCode = Object.freeze({
		NoSpace: 'MAIL_LA_NO_SPACE',
		DiskUnavailable: 'MAIL_LA_DISK_UNAVAILABLE',
		LinkUnavailable: 'MAIL_LA_LINK_UNAVAILABLE',
		AccessDenied: 'MAIL_LA_ACCESS_DENIED',
		InvalidContext: 'MAIL_LA_INVALID_CONTEXT',
		InvalidSendContract: 'MAIL_LA_INVALID_SEND_CONTRACT',
		InvalidSendResult: 'MAIL_LA_INVALID_SEND_RESULT',
		InvalidToken: 'MAIL_LA_INVALID_TOKEN',
		LinkMissing: 'MAIL_LA_LINK_MISSING',
		UploadFailed: 'MAIL_LA_UPLOAD_FAILED',
		TariffUnavailable: 'MAIL_LA_TARIFF_UNAVAILABLE'
	});
	const loc = key => main_core.Loc.getMessage(key) ?? '';
	function extractErrorCode(response) {
		if (!main_core.Type.isObjectLike(response)) {
			return '';
		}
		const errorResponse = response;
		const directCode = errorResponse.ERROR_CODE ?? errorResponse.errorCode;
		if (main_core.Type.isString(directCode)) {
			return directCode;
		}
		const collectionCode = errorResponse.errors?.[0]?.code;
		if (main_core.Type.isString(collectionCode)) {
			return collectionCode;
		}
		return errorResponse.data ? extractErrorCode(errorResponse.data) : '';
	}
	function isLargeAttachmentErrorCode(code) {
		return code.startsWith('MAIL_LA_');
	}
	function getErrorMessageKey(code) {
		switch (code) {
			case CrmLargeAttachmentErrorCode.NoSpace:
				return 'CRM_LARGE_ATTACHMENT_ERROR_NO_SPACE';
			case CrmLargeAttachmentErrorCode.LinkMissing:
				return 'CRM_LARGE_ATTACHMENT_ERROR_LINK_MISSING';
			case CrmLargeAttachmentErrorCode.InvalidContext:
			case CrmLargeAttachmentErrorCode.InvalidSendContract:
			case CrmLargeAttachmentErrorCode.InvalidSendResult:
			case CrmLargeAttachmentErrorCode.InvalidToken:
				return 'CRM_LARGE_ATTACHMENT_ERROR_INVALID_CONTRACT';
			case CrmLargeAttachmentErrorCode.DiskUnavailable:
			case CrmLargeAttachmentErrorCode.LinkUnavailable:
			case CrmLargeAttachmentErrorCode.AccessDenied:
				return 'CRM_LARGE_ATTACHMENT_ERROR_UNAVAILABLE';
			default:
				return 'CRM_LARGE_ATTACHMENT_ERROR_UPLOAD';
		}
	}
	class CrmLargeAttachmentNotification {
		#getContainer;
		#getIndicatorContainer;
		#indicator = null;
		#alert = null;
		constructor(params) {
			this.#getContainer = params.getContainer;
			this.#getIndicatorContainer = params.getIndicatorContainer ?? params.getContainer;
		}
		syncIndicator(fileIds) {
			if (fileIds.length === 0) {
				main_core.Dom.remove(this.#indicator);
				this.#indicator = null;
				return;
			}
			if (this.#indicator?.isConnected) {
				return;
			}
			const container = this.#getIndicatorContainer();
			if (!container) {
				return;
			}
			const indicator = document.createElement('div');
			indicator.className = 'ui-alert ui-alert-primary';
			indicator.dataset.testid = 'crm-large-attachment-indicator';
			indicator.setAttribute('role', 'status');
			indicator.setAttribute('aria-live', 'polite');
			const message = document.createElement('span');
			message.className = 'ui-alert-message';
			message.textContent = loc('CRM_LARGE_ATTACHMENT_INDICATOR');
			indicator.append(message);
			main_core.Dom.append(indicator, container);
			this.#indicator = indicator;
		}
		showStatus(messageKey) {
			this.#showAlert(messageKey, false);
		}
		showError(code, onRetry) {
			if (code === CrmLargeAttachmentErrorCode.TariffUnavailable) {
				this.showTariffUnavailable();
				return;
			}
			this.#showAlert(getErrorMessageKey(code), true, onRetry);
		}
		showNetworkError() {
			this.#showAlert('CRM_LARGE_ATTACHMENT_ERROR_NETWORK', true);
		}
		showTariffUnavailable() {
			void main_core.Runtime.loadExtension('ui.info-helper').then(extension => {
				extension.FeaturePromotersRegistry.getPromoter({
					code: LIMIT_SLIDER_CODE
				}).show();
			});
		}
		confirmDelete(onDelete) {
			const content = document.createElement('div');
			content.dataset.testid = 'crm-large-attachment-delete-confirmation';
			content.textContent = loc('CRM_LARGE_ATTACHMENT_DELETE_TEXT');
			return main_core.Runtime.loadExtension('ui.dialogs.messagebox').then(extension => {
				const messageBox = extension.MessageBox.create({
					title: loc('CRM_LARGE_ATTACHMENT_DELETE_TITLE'),
					message: content,
					okCaption: loc('CRM_LARGE_ATTACHMENT_DELETE_CONFIRM'),
					cancelCaption: loc('CRM_LARGE_ATTACHMENT_DELETE_CANCEL'),
					buttons: extension.MessageBoxButtons.OK_CANCEL,
					popupOptions: {
						closeByEsc: true
					},
					onOk: () => {
						messageBox.close();
						onDelete();
					},
					onCancel: () => {
						messageBox.close();
					}
				});
				messageBox.getOkButton().getContainer().dataset.testid = 'crm-large-attachment-delete-button';
				messageBox.getCancelButton().getContainer().dataset.testid = 'crm-large-attachment-keep-button';
				messageBox.show();
			});
		}
		destroy() {
			main_core.Dom.remove(this.#indicator);
			main_core.Dom.remove(this.#alert);
			this.#indicator = null;
			this.#alert = null;
		}
		#showAlert(messageKey, critical, onRetry) {
			const container = this.#getContainer();
			if (!container) {
				return;
			}
			main_core.Dom.remove(this.#alert);
			const alert = document.createElement('div');
			alert.className = `ui-alert crm-large-attachment-notification ${critical ? 'ui-alert-danger' : 'ui-alert-primary'}`;
			alert.dataset.testid = 'crm-large-attachment-notification';
			alert.setAttribute('role', critical ? 'alert' : 'status');
			if (!critical) {
				alert.setAttribute('aria-live', 'polite');
			}
			const message = document.createElement('span');
			message.className = 'ui-alert-message';
			message.textContent = loc(messageKey);
			alert.append(message);
			if (onRetry) {
				const retryButton = document.createElement('button');
				retryButton.type = 'button';
				retryButton.className = 'ui-btn ui-btn-xs ui-btn-link';
				retryButton.dataset.testid = 'crm-large-attachment-retry-button';
				retryButton.textContent = loc('CRM_LARGE_ATTACHMENT_RETRY');
				main_core.Event.bind(retryButton, 'click', () => {
					main_core.Dom.remove(alert);
					if (this.#alert === alert) {
						this.#alert = null;
					}
					onRetry();
				});
				alert.append(retryButton);
			}
			main_core.Dom.prepend(alert, container);
			this.#alert = alert;
		}
	}

	const MailFormEvent = Object.freeze({
		Submit: 'MailForm:submit',
		Success: 'MailForm:submit:ajaxSuccess',
		Failure: 'MailForm:submit:ajaxFailure'
	});
	class MainMailFormAdapter extends mail_client_largeAttachment.MainMailFormAdapter {
		#notification;
		#errorRoutingUnsubscribes = [];
		#destroyed = false;
		constructor(params) {
			super(params);
			this.#notification = new CrmLargeAttachmentNotification({
				getContainer: () => document.getElementById(params.formId)?.querySelector('.main-mail-form-editor-wrapper') ?? null,
				getIndicatorContainer: () => {
					const form = document.getElementById(params.formId);
					return form?.querySelector('.diskuf-selectdialog') ?? form?.querySelector('.main-mail-form-editor-wrapper') ?? null;
				}
			});
		}
		serializeSendContracts(contracts) {
			return serializeMainMailSendContracts(this.formId, contracts);
		}
		syncIndicator(fileIds) {
			this.#notification.syncIndicator(fileIds);
		}
		showUploadError(onRetry) {
			this.#notification.showError('', onRetry);
		}
		showNoSpaceError(onRetry) {
			this.#notification.showError('MAIL_LA_NO_SPACE', onRetry);
		}
		showTariffUnavailable() {
			this.#notification.showTariffUnavailable();
		}
		subscribeSendSuccess(handler) {
			return this.#subscribeMailFormEvent(MailFormEvent.Success, (_form, response) => {
				if (isSuccessfulSendResponse(response)) {
					handler();
				}
			});
		}
		subscribeSendError(handler) {
			const unsubscribeFailure = this.#subscribeMailFormEvent(MailFormEvent.Failure, handler);
			const unsubscribeErrorResponse = this.#subscribeMailFormEvent(MailFormEvent.Success, (_form, response) => {
				if (!isSuccessfulSendResponse(response)) {
					handler();
				}
			});
			return () => {
				unsubscribeFailure();
				unsubscribeErrorResponse();
			};
		}
		startErrorRouting() {
			if (this.#errorRoutingUnsubscribes.length > 0) {
				return;
			}
			this.#errorRoutingUnsubscribes = [this.#subscribeMailFormEvent(MailFormEvent.Success, (_form, response) => {
				const code = extractErrorCode(response);
				if (!isSuccessfulSendResponse(response) && isLargeAttachmentErrorCode(code)) {
					this.#notification.showError(code);
				}
			}), this.#subscribeMailFormEvent(MailFormEvent.Failure, () => {
				this.#notification.showNetworkError();
			})];
		}
		startSubmitGuard(prepareSubmit) {
			this.#errorRoutingUnsubscribes.push(this.#subscribeMailFormEvent(MailFormEvent.Submit, (_form, event) => {
				const submitState = prepareSubmit();
				if (submitState === 'ready') {
					return;
				}
				BX.PreventDefault(event);
				if (submitState === 'pending') {
					this.#notification.showStatus('CRM_LARGE_ATTACHMENT_WAIT_UPLOAD');
				} else if (submitState === 'restored') {
					this.#notification.showStatus('CRM_LARGE_ATTACHMENT_LINK_RESTORED');
				} else {
					this.#notification.showError('MAIL_LA_LINK_MISSING');
				}
			}));
		}
		confirmDelete(onDelete) {
			void this.#notification.confirmDelete(onDelete);
		}
		destroy() {
			if (this.#destroyed) {
				return;
			}
			this.#destroyed = true;
			this.#errorRoutingUnsubscribes.forEach(unsubscribe => {
				unsubscribe();
			});
			this.#errorRoutingUnsubscribes = [];
			this.#notification.destroy();
			super.destroy();
		}
		#subscribeMailFormEvent(eventName, handler) {
			const form = this.#resolveForm();
			if (!form) {
				return () => {};
			}
			const bus = BX;
			bus.addCustomEvent(form, eventName, handler);
			return () => {
				bus.removeCustomEvent(form, eventName, handler);
			};
		}
		#resolveForm() {
			const registry = window.BXMainMailForm;
			return registry?.getForm(this.formId) ?? null;
		}
	}

	const UploaderEvent = Object.freeze({
		Add: 'addItem',
		Remove: 'removeItem',
		AgentFileInit: 'onFileIsInited',
		UploadDone: 'onUploadDone'
	});
	class LegacyEmailAdapter {
		formId;
		#uploaderControlId;
		#lheJsName;
		#notification;
		#contracts = [];
		#fileChangeHandlers = new Set();
		#submitHandlers = new Set();
		#successHandlers = new Set();
		#errorHandlers = new Set();
		#destroyHandlers = new Set();
		#queueUnsubscribes = new Map();
		#uploaderSubscribed = false;
		#destroyed = false;
		constructor(params) {
			this.formId = params.formId;
			this.#uploaderControlId = params.uploaderControlId;
			this.#lheJsName = params.lheJsName;
			this.#notification = new CrmLargeAttachmentNotification({
				getContainer: params.getContainer,
				getIndicatorContainer: () => this.#resolveUploader()?.getPlaceHolder()?.parentElement ?? params.getContainer()
			});
		}
		getFiles() {
			const uploader = this.#resolveUploader();
			return uploader?.getItems().map(item => {
				const id = Number(item.getFileId());
				return {
					id: Number.isInteger(id) && id > 0 ? id : null,
					size: this.#getRawSize(item, uploader)
				};
			}) ?? [];
		}
		getBody() {
			const content = this.#resolveEditor()?.GetContent();
			return main_core.Type.isString(content) ? content : '';
		}
		insertBody(_text, html) {
			const editor = this.#resolveEditor();
			if (!editor) {
				return false;
			}
			editor.InsertHTML(html);
			return true;
		}
		setBody(html) {
			const editor = this.#resolveEditor();
			if (!editor) {
				return false;
			}
			editor.SetContent(html);
			return true;
		}
		serializeSendContracts(contracts) {
			this.#contracts = contracts.map(contract => ({
				token: contract.token,
				fileIds: [...contract.fileIds]
			}));
			return true;
		}
		getSendContracts() {
			return this.#contracts.map(contract => ({
				token: contract.token,
				fileIds: [...contract.fileIds]
			}));
		}
		hasPendingUploads() {
			return this.#resolveUploader()?.getItems().some(item => item.getProgress() < 100 || item.getFileId() <= 0) ?? false;
		}
		syncIndicator(fileIds) {
			this.#notification.syncIndicator(fileIds);
		}
		showUploadError(onRetry) {
			this.#notification.showError('', onRetry);
		}
		showNoSpaceError(onRetry) {
			this.#notification.showError('MAIL_LA_NO_SPACE', onRetry);
		}
		showTariffUnavailable() {
			this.#notification.showTariffUnavailable();
		}
		showAha() {
		}
		showSubmitPending() {
			this.#notification.showStatus('CRM_LARGE_ATTACHMENT_WAIT_UPLOAD');
		}
		showLinkRestored() {
			this.#notification.showStatus('CRM_LARGE_ATTACHMENT_LINK_RESTORED');
		}
		showLinkMissing() {
			this.#notification.showError('MAIL_LA_LINK_MISSING');
		}
		routeSendError(response) {
			const code = extractErrorCode(response);
			if (code === '') {
				this.#notification.showNetworkError();
			} else {
				this.#notification.showError(code);
			}
		}
		confirmDelete(onDelete) {
			void this.#notification.confirmDelete(onDelete);
		}
		subscribeFileChange(handler) {
			this.#fileChangeHandlers.add(handler);
			this.#startUploaderSubscriptions();
			return () => {
				this.#fileChangeHandlers.delete(handler);
				if (this.#fileChangeHandlers.size === 0) {
					this.#stopUploaderSubscriptions();
				}
			};
		}
		subscribeSubmit(handler) {
			this.#submitHandlers.add(handler);
			return () => {
				this.#submitHandlers.delete(handler);
			};
		}
		subscribeSendSuccess(handler) {
			this.#successHandlers.add(handler);
			return () => {
				this.#successHandlers.delete(handler);
			};
		}
		subscribeSendError(handler) {
			this.#errorHandlers.add(handler);
			return () => {
				this.#errorHandlers.delete(handler);
			};
		}
		subscribeDestroy(handler) {
			this.#destroyHandlers.add(handler);
			return () => {
				this.#destroyHandlers.delete(handler);
			};
		}
		notifySubmit() {
			const body = this.getBody();
			this.#submitHandlers.forEach(handler => {
				handler(body);
			});
		}
		notifySendSuccess() {
			this.#successHandlers.forEach(handler => {
				handler();
			});
		}
		notifySendError() {
			this.#errorHandlers.forEach(handler => {
				handler();
			});
		}
		destroy() {
			if (this.#destroyed) {
				return;
			}
			this.#destroyed = true;
			this.#stopUploaderSubscriptions();
			this.#notification.destroy();
			this.#contracts = [];
			this.#fileChangeHandlers.clear();
			this.#submitHandlers.clear();
			this.#successHandlers.clear();
			this.#errorHandlers.clear();
			this.#destroyHandlers.clear();
		}
		#startUploaderSubscriptions() {
			const uploader = this.#resolveUploader();
			if (!uploader || this.#uploaderSubscribed) {
				return;
			}
			uploader.subscribe(UploaderEvent.Add, this.#handleItemAdd);
			uploader.subscribe(UploaderEvent.Remove, this.#handleItemRemove);
			const agent = uploader.getAgent();
			if (agent) {
				const bx = this.#getBx();
				bx.addCustomEvent(agent, UploaderEvent.AgentFileInit, this.#handleAgentFileInit);
				uploader.getItems().forEach(item => {
					const queueItem = agent.queue?.items?.getItem(item.getId());
					if (item.getProgress() < 100 && queueItem) {
						this.#handleAgentFileInit(item.getId(), queueItem);
					}
				});
			}
			this.#uploaderSubscribed = true;
		}
		#stopUploaderSubscriptions() {
			const uploader = this.#resolveUploader();
			if (uploader && this.#uploaderSubscribed) {
				uploader.unsubscribe(UploaderEvent.Add, this.#handleItemAdd);
				uploader.unsubscribe(UploaderEvent.Remove, this.#handleItemRemove);
				const agent = uploader.getAgent();
				if (agent) {
					this.#getBx().removeCustomEvent(agent, UploaderEvent.AgentFileInit, this.#handleAgentFileInit);
				}
			}
			this.#queueUnsubscribes.forEach(unsubscribe => {
				unsubscribe();
			});
			this.#queueUnsubscribes.clear();
			this.#uploaderSubscribed = false;
		}
		#handleItemAdd = () => {
			this.#emitFileChange('add');
		};
		#handleItemRemove = () => {
			this.#emitFileChange('remove');
		};
		#handleAgentFileInit = (_id, queueItem) => {
			if (!main_core.Type.isObjectLike(queueItem) || this.#queueUnsubscribes.has(queueItem)) {
				return;
			}
			const handleDone = () => {
				this.#queueUnsubscribes.get(queueItem)?.();
				queueMicrotask(() => {
					this.#emitFileChange('complete');
				});
			};
			const bx = this.#getBx();
			bx.addCustomEvent(queueItem, UploaderEvent.UploadDone, handleDone);
			this.#queueUnsubscribes.set(queueItem, () => {
				bx.removeCustomEvent(queueItem, UploaderEvent.UploadDone, handleDone);
				this.#queueUnsubscribes.delete(queueItem);
			});
		};
		#emitFileChange(type) {
			this.#fileChangeHandlers.forEach(handler => {
				handler(type);
			});
		}
		#getRawSize(item, uploader) {
			const size = Number(item.getSize());
			if (Number.isFinite(size) && size > 0) {
				return size;
			}
			const queueSize = uploader.getAgent()?.queue?.items?.getItem(item.getId())?.size;
			return Number.isFinite(queueSize) ? Number(queueSize) : 0;
		}
		#resolveEditor() {
			const registry = window.BXHtmlEditor;
			return registry?.Get(this.#lheJsName) ?? null;
		}
		#resolveUploader() {
			return this.#getBx().CrmDiskUploader?.items?.[this.#uploaderControlId] ?? null;
		}
		#getBx() {
			return BX;
		}
	}

	class LegacySubmitGuard {
		#submitting = false;
		tryStart(state, hasPendingUploads) {
			if (this.#submitting || hasPendingUploads || state === 'converting') {
				return false;
			}
			this.#submitting = true;
			return true;
		}
		finish() {
			this.#submitting = false;
		}
	}

	function handleLegacySubmitPreparation(state, handler) {
		if (state === 'ready') {
			return true;
		}
		if (state === 'pending') {
			handler.showSubmitPending();
		} else if (state === 'restored') {
			handler.showLinkRestored();
		} else {
			handler.showLinkMissing();
		}
		return false;
	}

	const SEND_CONTRACT_FIELD = '__largeAttachments';
	class LegacyEmailLargeAttachment {
		#core;
		#adapter;
		#submitGuard = new LegacySubmitGuard();
		#destroyed = false;
		constructor(params) {
			this.#adapter = new LegacyEmailAdapter(params);
			this.#core = mail_client_largeAttachment.LargeAttachment.init({
				formId: params.formId,
				uploaderControlId: params.uploaderControlId,
				messageId: params.messageId,
				featureAvailable: params.featureAvailable,
				folderName: params.folderName,
				maxSize: params.maxSize,
				context: 'crm',
				postSendPrompt: (_links, onDelete) => {
					this.#adapter.confirmDelete(onDelete);
				}
			}, this.#adapter);
		}
		beforeSubmit() {
			if (this.#destroyed) {
				return false;
			}
			const submitState = this.#core.prepareSubmit();
			if (!handleLegacySubmitPreparation(submitState, this.#adapter)) {
				return false;
			}
			if (!this.#submitGuard.tryStart(this.#core.getState(), this.#adapter.hasPendingUploads())) {
				this.#adapter.showSubmitPending();
				return false;
			}
			this.#adapter.notifySubmit();
			return true;
		}
		applySendContract(data) {
			return {
				...data,
				[SEND_CONTRACT_FIELD]: this.#adapter.getSendContracts()
			};
		}
		handleSendSuccess() {
			this.#submitGuard.finish();
			this.#adapter.notifySendSuccess();
		}
		handleSendError(response) {
			this.#submitGuard.finish();
			const isLargeAttachmentError = extractErrorCode(response).startsWith('MAIL_LA_');
			if (!isLargeAttachmentError) {
				return false;
			}
			this.#adapter.routeSendError(response);
			this.#adapter.notifySendError();
			return true;
		}
		getState() {
			return this.#core.getState();
		}
		destroy() {
			if (this.#destroyed) {
				return;
			}
			this.#destroyed = true;
			this.#submitGuard.finish();
			this.#core.destroy();
		}
	}

	class LargeAttachment {
		static init(params) {
			const adapter = new MainMailFormAdapter(params);
			adapter.startErrorRouting();
			const largeAttachment = mail_client_largeAttachment.LargeAttachment.init({
				...params,
				context: 'crm',
				postSendPrompt: (_links, onDelete) => {
					adapter.confirmDelete(onDelete);
				}
			}, adapter);
			adapter.startSubmitGuard(() => largeAttachment.prepareSubmit());
			return largeAttachment;
		}
		static initLegacy(params) {
			return new LegacyEmailLargeAttachment(params);
		}
	}

	exports.CrmLargeAttachmentErrorCode = CrmLargeAttachmentErrorCode;
	exports.CrmLargeAttachmentNotification = CrmLargeAttachmentNotification;
	exports.LargeAttachment = LargeAttachment;
	exports.LegacyEmailAdapter = LegacyEmailAdapter;
	exports.LegacyEmailLargeAttachment = LegacyEmailLargeAttachment;
	exports.LegacySubmitGuard = LegacySubmitGuard;
	exports.MainMailFormAdapter = MainMailFormAdapter;
	exports.extractErrorCode = extractErrorCode;
	exports.getErrorMessageKey = getErrorMessageKey;

})(this.BX.Crm.Mail = this.BX.Crm.Mail || {}, BX.UI, BX.Mail.Client, BX);
//# sourceMappingURL=large-attachment.bundle.js.map
