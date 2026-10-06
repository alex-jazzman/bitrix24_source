/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
(function (exports, ui_alerts, main_core, main_core_events, ui_infoHelper, main_popup, ui_bannerDispatcher) {
	'use strict';

	const ConvertErrorCode = Object.freeze({
		TariffUnavailable: 'MAIL_LA_TARIFF_UNAVAILABLE',
		AccessDenied: 'MAIL_LA_ACCESS_DENIED',
		InvalidContext: 'MAIL_LA_INVALID_CONTEXT',
		DiskUnavailable: 'MAIL_LA_DISK_UNAVAILABLE',
		DiskFeatureUnavailable: 'MAIL_LA_DISK_FEATURE_UNAVAILABLE',
		NoSpace: 'MAIL_LA_NO_SPACE',
		UploadFailed: 'MAIL_LA_UPLOAD_FAILED'
	});
	const ACTION_CONVERT = 'mail.largeAttachment.convert';
	const ACTION_DELETE = 'mail.largeAttachment.deleteUploaded';
	const ACTION_FINALIZE_REPLACEMENT = 'mail.largeAttachment.finalizeReplacement';
	const CONTEXT_MAIL = 'mail';
	class LargeAttachmentApi {
		convert(request, context = CONTEXT_MAIL) {
			return main_core.ajax.runAction(ACTION_CONVERT, {
				data: {
					mailboxId: request.mailboxId,
					fileIds: request.fileIds,
					replacementToken: request.replacementToken ?? null,
					context
				}
			}).then(response => this.#mapResult(response?.data)).catch(response => {
				throw this.#mapError(response);
			});
		}
		deleteUploaded(request) {
			return main_core.ajax.runAction(ACTION_DELETE, {
				data: {
					token: request.token
				}
			}).then(response => ({
				deleted: Boolean(response?.data?.deleted)
			})).catch(response => {
				throw this.#mapError(response);
			});
		}
		finalizeReplacement(previousToken, currentToken) {
			return main_core.ajax.runAction(ACTION_FINALIZE_REPLACEMENT, {
				data: {
					previousToken,
					currentToken
				}
			}).then(() => {}).catch(response => {
				throw this.#mapError(response);
			});
		}
		#mapResult(data) {
			return {
				publicUrl: String(data?.publicUrl ?? ''),
				token: String(data?.token ?? ''),
				fileIds: Array.isArray(data?.fileIds) ? data.fileIds.map(Number) : [],
				folderName: String(data?.folderName ?? '')
			};
		}
		#mapError(response) {
			const error = response?.errors?.[0];
			return {
				code: error?.code ?? '',
				message: error?.message ?? ''
			};
		}
	}
	const largeAttachmentApi = new LargeAttachmentApi();

	const USER_OPTION_CATEGORY$1 = 'mail.guide';
	const POPUP_ID$1 = 'mail-large-attachment-aha-guide';
	const UPLOADER_SELECTOR = '.disk-user-field-control';
	const POPUP_WIDTH$1 = 320;
	const AUTO_DISMISS_DELAY = 12000;
	class AhaGuide {
		#formId;
		#optionName;
		#popup = null;
		#shown = false;
		#autoDismissTimer = null;
		constructor(params) {
			this.#formId = params.formId;
			this.#optionName = params.optionName;
		}
		show() {
			if (this.#shown) {
				return;
			}
			const bindElement = this.#resolveBindElement();
			if (!bindElement) {
				return;
			}
			this.#shown = true;
			ui_bannerDispatcher.BannerDispatcher.normal.toQueue(onDone => {
				this.#popup = this.#createPopup(bindElement, onDone);
				this.#popup.show();
				this.#save();
				this.#autoDismissTimer = window.setTimeout(() => this.#popup?.close(), AUTO_DISMISS_DELAY);
				return this.#popup;
			});
		}
		destroy() {
			if (this.#autoDismissTimer !== null) {
				window.clearTimeout(this.#autoDismissTimer);
				this.#autoDismissTimer = null;
			}
			this.#popup?.close();
			this.#popup = null;
		}
		#resolveBindElement() {
			const form = document.getElementById(this.#formId);
			const uploader = form?.querySelector(UPLOADER_SELECTOR) ?? null;
			return uploader instanceof HTMLElement ? uploader : null;
		}
		#createPopup(bindElement, onDone) {
			return main_popup.PopupManager.create({
				id: POPUP_ID$1,
				bindElement,
				closeIcon: true,
				autoHide: true,
				closeByEsc: true,
				width: POPUP_WIDTH$1,
				angle: {
					offset: 40,
					position: 'top'
				},
				content: this.#renderContent(),
				events: {
					onClose: () => {
						onDone();
					}
				}
			});
		}
		#renderContent() {
			const content = main_core.Tag.render`
			<div
				class="mail-large-attachment-aha"
				data-testid="mail-large-attachment-aha-guide"
			></div>
		`;
			content.textContent = main_core.Loc.getMessage('MAIL_LARGE_ATTACHMENT_AHA_TEXT') ?? '';
			return content;
		}
		#save() {
			if (!main_core.Type.isStringFilled(this.#optionName)) {
				return;
			}
			BX.userOptions.save(USER_OPTION_CATEGORY$1, this.#optionName, null, 'Y');
		}
	}

	const UploaderEvent = Object.freeze({
		ItemAdd: 'BX.Disk.Uploader.Integration:Item:onAdd',
		ItemComplete: 'BX.Disk.Uploader.Integration:Item:onComplete',
		ItemRemove: 'BX.Disk.Uploader.Integration:Item:onRemove'
	});
	const MailFormEvent = Object.freeze({
		Submit: 'MailForm:submit',
		Success: 'MailForm:submit:ajaxSuccess',
		Failure: 'MailForm:submit:ajaxFailure'
	});
	const SliderEvent = Object.freeze({
		CloseStart: 'SidePanel.Slider:onCloseStart',
		Destroy: 'SidePanel.Slider:onDestroy'
	});
	const EDITOR_INSERT_EVENT = 'OnInsertContent';
	const LIMIT_SLIDER_CODE = 'limit_v2_mail_large_attachment_disk_upload';
	const loc$1 = key => main_core.Loc.getMessage(key) ?? '';
	class MainMailFormAdapter {
		formId;
		#uploaderControlId;
		#ahaGuide;
		#indicatorNode = null;
		#destroyed = false;
		constructor(params) {
			this.formId = params.formId;
			this.#uploaderControlId = params.uploaderControlId;
			this.#ahaGuide = params.showAha ? new AhaGuide({
				formId: params.formId,
				optionName: params.ahaOptionName ?? ''
			}) : null;
		}
		getFiles() {
			return this.#resolveUploader()?.getFiles().map(file => {
				const id = Number(file.getCustomData('objectId'));
				return {
					id: Number.isInteger(id) && id > 0 ? id : null,
					size: file.getSize()
				};
			}) ?? [];
		}
		getBody() {
			const content = this.#resolveForm()?.editor?.GetContent?.();
			return main_core.Type.isString(content) ? content : '';
		}
		insertBody(text, html) {
			const editor = this.#resolveForm()?.editor;
			if (!editor) {
				return false;
			}
			main_core_events.EventEmitter.emit(editor, EDITOR_INSERT_EVENT, [text, html]);
			return true;
		}
		setBody(html) {
			const editor = this.#resolveForm()?.editor;
			if (!main_core.Type.isFunction(editor?.SetContent)) {
				return false;
			}
			editor.SetContent(html);
			return true;
		}
		serializeSendContracts(contracts) {
			const form = document.getElementById(this.formId);
			if (!(form instanceof HTMLFormElement)) {
				return false;
			}
			form.querySelectorAll('input[name^="data[__largeAttachments]"]').forEach(input => {
				main_core.Dom.remove(input);
			});
			contracts.forEach((contract, index) => {
				const tokenInput = document.createElement('input');
				tokenInput.type = 'hidden';
				tokenInput.name = `data[__largeAttachments][${index}][token]`;
				tokenInput.value = contract.token;
				form.append(tokenInput);
				contract.fileIds.forEach(fileId => {
					const fileIdInput = document.createElement('input');
					fileIdInput.type = 'hidden';
					fileIdInput.name = `data[__largeAttachments][${index}][fileIds][]`;
					fileIdInput.value = String(fileId);
					form.append(fileIdInput);
				});
			});
			return true;
		}
		syncIndicator(fileIds) {
			if (fileIds.length === 0) {
				main_core.Dom.remove(this.#indicatorNode);
				this.#indicatorNode = null;
				return;
			}
			if (this.#indicatorNode?.isConnected) {
				return;
			}
			const container = document.getElementById(this.formId)?.querySelector('.main-mail-form-editor-wrapper');
			if (!container) {
				return;
			}
			const node = document.createElement('div');
			node.className = 'ui-alert ui-alert-primary';
			node.dataset.testid = 'mail-large-attachment-indicator';
			node.setAttribute('role', 'status');
			node.setAttribute('aria-live', 'polite');
			const message = document.createElement('span');
			message.className = 'ui-alert-message';
			message.textContent = loc$1('MAIL_LARGE_ATTACHMENT_INDICATOR_LABEL');
			node.append(message);
			main_core.Dom.append(node, container);
			this.#indicatorNode = node;
		}
		showUploadError(onRetry) {
			const form = this.#resolveForm();
			if (form && main_core.Type.isFunction(form.showError)) {
				const content = main_core.Tag.render`
				<div>
					<span></span>
					<button
						type="button"
						class="ui-btn ui-btn-xs ui-btn-link mail-large-attachment-retry"
						data-testid="mail-large-attachment-retry-button"
					></button>
				</div>
			`;
				const textNode = content.querySelector('span');
				const retryButton = content.querySelector('.mail-large-attachment-retry');
				if (textNode) {
					textNode.textContent = loc$1('MAIL_LARGE_ATTACHMENT_UPLOAD_ERROR');
				}
				if (retryButton) {
					retryButton.textContent = loc$1('MAIL_LARGE_ATTACHMENT_RETRY');
				}
				form.showError(content.outerHTML);
				this.#bindRenderedRetry(onRetry);
				return;
			}
			this.#showMessagePopup('mail-large-attachment-upload-error', '', loc$1('MAIL_LARGE_ATTACHMENT_UPLOAD_ERROR'), onRetry);
		}
		showNoSpaceError(onRetry) {
			this.#showMessagePopup('mail-large-attachment-no-space', loc$1('MAIL_LARGE_ATTACHMENT_NO_SPACE_TITLE'), loc$1('MAIL_LARGE_ATTACHMENT_NO_SPACE_TEXT'), onRetry);
		}
		showTariffUnavailable() {
			ui_infoHelper.FeaturePromotersRegistry.getPromoter({
				code: LIMIT_SLIDER_CODE
			}).show();
		}
		showAha() {
			this.#ahaGuide?.show();
		}
		subscribeFileChange(handler) {
			const subscriptions = [[UploaderEvent.ItemAdd, () => handler('add')], [UploaderEvent.ItemComplete, () => handler('complete')], [UploaderEvent.ItemRemove, () => handler('remove')]];
			subscriptions.forEach(([eventName, eventHandler]) => {
				main_core_events.EventEmitter.subscribe(eventName, eventHandler);
			});
			return () => {
				subscriptions.forEach(([eventName, eventHandler]) => {
					main_core_events.EventEmitter.unsubscribe(eventName, eventHandler);
				});
			};
		}
		subscribeSubmit(handler) {
			return this.#subscribeMailFormEvent(MailFormEvent.Submit, () => handler(this.getBody()));
		}
		subscribeSendSuccess(handler) {
			return this.#subscribeMailFormEvent(MailFormEvent.Success, (_form, data) => {
				if (data?.status === 'success') {
					handler();
				}
			});
		}
		subscribeSendError(handler) {
			const unsubscribeAjaxError = this.#subscribeMailFormEvent(MailFormEvent.Failure, handler);
			const unsubscribeUnsuccessfulResponse = this.#subscribeMailFormEvent(MailFormEvent.Success, (_form, data) => {
				if (data?.status !== 'success') {
					handler();
				}
			});
			return () => {
				unsubscribeAjaxError();
				unsubscribeUnsuccessfulResponse();
			};
		}
		subscribeDestroy(handler) {
			const topBx = this.#getTopBx();
			const slider = topBx?.SidePanel?.Instance?.getSliderByWindow?.(window) ?? null;
			if (!topBx || !slider) {
				return () => {};
			}
			topBx.addCustomEvent(slider, SliderEvent.CloseStart, handler);
			topBx.addCustomEvent(slider, SliderEvent.Destroy, handler);
			return () => {
				topBx.removeCustomEvent(slider, SliderEvent.CloseStart, handler);
				topBx.removeCustomEvent(slider, SliderEvent.Destroy, handler);
			};
		}
		destroy() {
			if (this.#destroyed) {
				return;
			}
			this.#destroyed = true;
			this.#ahaGuide?.destroy();
			this.#ahaGuide = null;
			this.syncIndicator([]);
		}
		#bindRenderedRetry(onRetry) {
			if (!onRetry) {
				return;
			}
			const retryButton = document.getElementById(this.formId)?.querySelector('[data-testid="mail-large-attachment-retry-button"]');
			if (retryButton) {
				main_core.Event.bind(retryButton, 'click', onRetry);
			}
		}
		#showMessagePopup(id, title, text, onRetry) {
			const content = main_core.Tag.render`
			<div
				class="mail-large-attachment-notice"
				data-testid="mail-large-attachment-notice"
			>
				<div class="mail-large-attachment-notice__text"></div>
				<div class="mail-large-attachment-notice__buttons"></div>
			</div>
		`;
			const textNode = content.querySelector('.mail-large-attachment-notice__text');
			if (textNode) {
				textNode.textContent = text;
			}
			let popup = null;
			const buttonBar = content.querySelector('.mail-large-attachment-notice__buttons');
			if (onRetry && buttonBar) {
				const retryButton = main_core.Dom.create('button', {
					props: {
						className: 'ui-btn ui-btn-sm ui-btn-primary',
						type: 'button'
					},
					attrs: {
						'data-testid': 'mail-large-attachment-retry-button'
					},
					text: loc$1('MAIL_LARGE_ATTACHMENT_RETRY'),
					events: {
						click: () => {
							popup?.close();
							onRetry();
						}
					}
				});
				main_core.Dom.append(retryButton, buttonBar);
			}
			if (buttonBar) {
				const closeButton = main_core.Dom.create('button', {
					props: {
						className: 'ui-btn ui-btn-sm ui-btn-link',
						type: 'button'
					},
					attrs: {
						'data-testid': 'mail-large-attachment-confirm-button'
					},
					text: loc$1('MAIL_LARGE_ATTACHMENT_NO_SPACE_CLOSE'),
					events: {
						click: () => {
							popup?.close();
						}
					}
				});
				main_core.Dom.append(closeButton, buttonBar);
			}
			popup = main_popup.PopupManager.create({
				id,
				titleBar: title.length > 0 ? title : undefined,
				content,
				width: 400,
				overlay: true,
				closeIcon: true,
				closeByEsc: true
			});
			popup.show();
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
		#resolveUploader() {
			const uploaderApi = BX.Disk?.Uploader?.UserFieldControl;
			return uploaderApi?.getById(this.#uploaderControlId) ?? null;
		}
		#getTopBx() {
			try {
				return window.top?.BX ?? null;
			} catch {
				return null;
			}
		}
	}

	class LinkInserter {
		#formAdapter;
		#inserted = [];
		constructor(formAdapter) {
			this.#formAdapter = main_core.Type.isString(formAdapter) ? new MainMailFormAdapter({
				formId: formAdapter,
				uploaderControlId: ''
			}) : formAdapter;
		}
		insert(link) {
			const title = link.folderName || main_core.Loc.getMessage('MAIL_LARGE_ATTACHMENT_LINK_TITLE') || '';
			const html = LinkInserter.buildLinkHtml(link.publicUrl, title);
			if (!this.#formAdapter.insertBody(link.publicUrl, html)) {
				return false;
			}
			this.#inserted.push(link);
			return true;
		}
		getInserted() {
			return [...this.#inserted];
		}
		restore(links) {
			return links.every(link => {
				const title = link.folderName || main_core.Loc.getMessage('MAIL_LARGE_ATTACHMENT_LINK_TITLE') || '';
				const html = LinkInserter.buildLinkHtml(link.publicUrl, title);
				return this.#formAdapter.insertBody(link.publicUrl, html);
			});
		}
		replace(links, replacement) {
			const content = this.#formAdapter.getBody();
			const container = document.createElement('div');
			container.innerHTML = content;
			const replacedUrls = new Set(links.map(link => LinkInserter.#normalizeUrl(link.publicUrl)));
			const anchors = [...container.querySelectorAll('a[href]')].filter(anchor => replacedUrls.has(LinkInserter.#normalizeUrl(anchor.href)));
			if (anchors.length === 0) {
				return false;
			}
			anchors[0].setAttribute('href', replacement.publicUrl);
			anchors.slice(1).forEach(anchor => {
				anchor.remove();
			});
			return this.#formAdapter.setBody(container.innerHTML);
		}
		remove(links) {
			const content = this.#formAdapter.getBody();
			const container = document.createElement('div');
			container.innerHTML = content;
			const removedUrls = new Set(links.map(link => LinkInserter.#normalizeUrl(link.publicUrl)));
			container.querySelectorAll('a[href]').forEach(anchor => {
				if (removedUrls.has(LinkInserter.#normalizeUrl(anchor.href))) {
					anchor.remove();
				}
			});
			const updatedContent = container.innerHTML;
			if (updatedContent !== content) {
				this.#formAdapter.setBody(updatedContent);
			}
		}
		static buildLinkHtml(url, title) {
			const link = main_core.Tag.render`<a href="${main_core.Text.encode(url)}">${main_core.Text.encode(title)}</a>`;
			return link.outerHTML;
		}
		static #normalizeUrl(url) {
			const anchor = document.createElement('a');
			anchor.href = url;
			return anchor.href;
		}
	}

	class AttachmentIndicator {
		#formAdapter;
		#markedFileIds = new Set();
		constructor(formAdapter = null) {
			this.#formAdapter = main_core.Type.isObject(formAdapter) ? formAdapter : new MainMailFormAdapter({
				formId: formAdapter ?? '',
				uploaderControlId: ''
			});
		}
		mark(fileIds) {
			this.sync([...this.#markedFileIds, ...fileIds]);
		}
		sync(fileIds) {
			this.#markedFileIds = new Set(fileIds.filter(id => Number.isInteger(id) && id > 0));
			if (this.#markedFileIds.size === 0) {
				this.#formAdapter.syncIndicator([]);
				return;
			}
			this.#formAdapter.syncIndicator([...this.#markedFileIds]);
		}
		reset() {
			this.sync([]);
		}
		has(fileId) {
			return this.#markedFileIds.has(fileId);
		}
		getFileIds() {
			return [...this.#markedFileIds];
		}
		getLabel() {
			return main_core.Loc.getMessage('MAIL_LARGE_ATTACHMENT_INDICATOR_LABEL') || '';
		}
	}

	class SizeDetector {
		#formAdapter;
		#maxSize;
		#onChange;
		#isLarge = false;
		#scheduledFileIds = new Set();
		#isStarted = false;
		#isDeferredCheckScheduled = false;
		#unsubscribeFileChange = null;
		constructor(params) {
			this.#formAdapter = params.formAdapter ?? new MainMailFormAdapter({
				formId: '',
				uploaderControlId: params.uploaderControlId ?? ''
			});
			this.#maxSize = params.maxSize;
			this.#onChange = params.onChange;
		}
		start() {
			this.#isStarted = true;
			this.#unsubscribeFileChange = this.#formAdapter.subscribeFileChange(type => {
				if (type === 'remove') {
					this.#check();
					return;
				}
				this.#handleItemAddOrComplete();
			});
			this.#check();
		}
		destroy() {
			this.#isStarted = false;
			this.#unsubscribeFileChange?.();
			this.#unsubscribeFileChange = null;
		}
		isLarge() {
			return this.#isLarge;
		}
		static sumRawSize(files) {
			return files.reduce((total, file) => total + file.getSize(), 0);
		}
		static exceedsLimit(totalRawSize, maxSize) {
			return maxSize > 0 && maxSize <= Math.ceil(totalRawSize / 3) * 4;
		}
		#handleItemAddOrComplete = () => {
			if (this.#isDeferredCheckScheduled) {
				return;
			}
			this.#isDeferredCheckScheduled = true;
			queueMicrotask(() => {
				this.#isDeferredCheckScheduled = false;
				if (this.#isStarted) {
					this.#check();
				}
			});
		};
		#check() {
			const files = this.#readFiles();
			const totalRawSize = files.reduce((total, file) => total + file.size, 0);
			const isLarge = SizeDetector.exceedsLimit(totalRawSize, this.#maxSize);
			const hasThresholdStateChanged = isLarge !== this.#isLarge;
			this.#isLarge = isLarge;
			if (isLarge) {
				const fileIds = this.#readUnscheduledFileIdsWhenReady(files);
				if (fileIds && fileIds.length > 0) {
					fileIds.forEach(fileId => {
						this.#scheduledFileIds.add(fileId);
					});
					this.#onChange(true, fileIds);
					return;
				}
			}
			if (!isLarge && hasThresholdStateChanged) {
				this.#onChange(false, []);
			}
		}
		#readFiles() {
			return this.#formAdapter.getFiles();
		}
		#readUnscheduledFileIdsWhenReady(files) {
			const fileIds = new Set();
			for (const file of files) {
				if (file.id === null) {
					return null;
				}
				if (!this.#scheduledFileIds.has(file.id)) {
					fileIds.add(file.id);
				}
			}
			return [...fileIds];
		}
	}

	function isLinkPresentInBody(body, publicUrl) {
		if (publicUrl.length === 0) {
			return true;
		}
		if (body.includes(publicUrl)) {
			return true;
		}
		return body.includes(publicUrl.replaceAll('&', '&amp;'));
	}
	function findOrphanedLinks(body, inserted) {
		return inserted.filter(link => !isLinkPresentInBody(body, link.publicUrl));
	}

	const USER_OPTION_CATEGORY = 'mail.guide';
	const POPUP_ID = 'mail-large-attachment-post-send';
	const POPUP_WIDTH = 420;
	const loc = key => main_core.Loc.getMessage(key) ?? '';
	function getRootWindow() {
		try {
			const rootWindow = window.top ?? window;
			void rootWindow.document.body;
			return rootWindow;
		} catch {
			return window;
		}
	}
	function makeButton(document, text, className, testId, onClick) {
		const button = document.createElement('button');
		button.type = 'button';
		button.className = className;
		button.dataset.testid = testId;
		button.textContent = text;
		main_core.Event.bind(button, 'click', onClick);
		return button;
	}
	class PostSendPopup {
		#formAdapter;
		#getInserted;
		#optionName;
		#suppressed;
		#createPopup;
		#showPrompt;
		#capturedBody = '';
		#capturedLinks = [];
		#handledTokens = new Set();
		#destroyed = false;
		#unsubscribes = [];
		constructor(params) {
			this.#formAdapter = params.formAdapter ?? new MainMailFormAdapter({
				formId: params.formId ?? '',
				uploaderControlId: ''
			});
			this.#getInserted = params.getInserted;
			this.#suppressed = params.suppressed ?? false;
			this.#optionName = params.optionName ?? '';
			this.#createPopup = params.createPopup ?? this.#createRootPopup;
			this.#showPrompt = params.showPrompt ?? null;
		}
		start() {
			if (this.#destroyed || this.#unsubscribes.length > 0) {
				return;
			}
			this.#unsubscribes = [this.#formAdapter.subscribeSubmit(this.#handleSubmit), this.#formAdapter.subscribeSendSuccess(this.#handleAjaxSuccess)];
		}
		destroy() {
			if (this.#destroyed) {
				return;
			}
			this.#destroyed = true;
			this.#unsubscribes.forEach(unsubscribe => {
				unsubscribe();
			});
			this.#unsubscribes = [];
		}
		#handleSubmit = body => {
			if (this.#destroyed) {
				return;
			}
			this.#capturedBody = body;
			this.#capturedLinks = this.#getInserted().map(link => ({
				...link,
				fileIds: [...link.fileIds]
			}));
		};
		#handleAjaxSuccess = () => {
			if (this.#destroyed) {
				return;
			}
			this.#processOrphans();
		};
		#processOrphans() {
			const orphaned = findOrphanedLinks(this.#capturedBody, this.#capturedLinks).filter(link => link.token.length > 0 && !this.#handledTokens.has(link.token));
			if (orphaned.length === 0) {
				return;
			}
			orphaned.forEach(link => {
				this.#handledTokens.add(link.token);
			});
			if (this.#suppressed) {
				return;
			}
			this.#showPopup(orphaned);
		}
		#showPopup(orphaned) {
			if (this.#showPrompt) {
				this.#showPrompt(orphaned.map(link => ({
					...link,
					fileIds: [...link.fileIds]
				})), () => {
					this.#deleteOrphans(orphaned);
				});
				return;
			}
			const rootDocument = getRootWindow().document;
			const content = rootDocument.createElement('div');
			content.className = 'mail-large-attachment-post-send';
			content.dataset.testid = 'mail-large-attachment-post-send-popup';
			const textNode = rootDocument.createElement('div');
			textNode.className = 'mail-large-attachment-post-send__text';
			textNode.textContent = loc('MAIL_LARGE_ATTACHMENT_POST_SEND_TEXT');
			const toggle = rootDocument.createElement('label');
			toggle.className = 'mail-large-attachment-post-send__toggle';
			const checkbox = rootDocument.createElement('input');
			checkbox.type = 'checkbox';
			checkbox.className = 'mail-large-attachment-post-send__checkbox';
			checkbox.dataset.testid = 'mail-large-attachment-post-send-checkbox';
			const toggleText = rootDocument.createElement('span');
			toggleText.className = 'mail-large-attachment-post-send__toggle-text';
			toggleText.textContent = loc('MAIL_LARGE_ATTACHMENT_POST_SEND_DONT_ASK');
			toggle.append(checkbox, toggleText);
			const buttonBar = rootDocument.createElement('div');
			buttonBar.className = 'mail-large-attachment-post-send__buttons';
			content.append(textNode, toggle, buttonBar);
			let popup = null;
			const deleteButton = makeButton(rootDocument, loc('MAIL_LARGE_ATTACHMENT_POST_SEND_DELETE'), 'ui-btn ui-btn-sm ui-btn-primary', 'mail-large-attachment-post-send-delete-button', () => {
				this.#applySuppression(checkbox.checked);
				this.#deleteOrphans(orphaned);
				popup?.close();
			});
			const keepButton = makeButton(rootDocument, loc('MAIL_LARGE_ATTACHMENT_POST_SEND_KEEP'), 'ui-btn ui-btn-sm ui-btn-link', 'mail-large-attachment-post-send-keep-button', () => {
				this.#applySuppression(checkbox.checked);
				popup?.close();
			});
			buttonBar.append(deleteButton, keepButton);
			popup = this.#createPopup({
				id: `${POPUP_ID}-${main_core.Text.getRandom()}`,
				titleBar: loc('MAIL_LARGE_ATTACHMENT_POST_SEND_TITLE'),
				content,
				targetContainer: rootDocument.body,
				width: POPUP_WIDTH,
				overlay: true,
				closeIcon: true,
				closeByEsc: true,
				cacheable: false
			});
			popup.show();
		}
		#deleteOrphans(links) {
			links.forEach(link => {
				largeAttachmentApi.deleteUploaded({
					token: link.token
				}).catch(() => {});
			});
		}
		#applySuppression(checked) {
			if (!checked) {
				return;
			}
			this.#suppressed = true;
			this.#saveOption();
		}
		#saveOption() {
			if (this.#optionName.length === 0) {
				return;
			}
			const rootUserOptions = getRootWindow().BX?.userOptions;
			const localUserOptions = BX.userOptions;
			(rootUserOptions ?? localUserOptions)?.save(USER_OPTION_CATEGORY, this.#optionName, null, 'Y');
		}
		#createRootPopup = options => {
			const rootWindow = getRootWindow();
			const rootPopupManager = rootWindow.BX?.Main?.PopupManager;
			if (rootPopupManager) {
				return rootPopupManager.create(options);
			}
			return main_popup.PopupManager.create(options);
		};
	}

	const Outcome = Object.freeze({
		Converted: 'BX.Mail.Client.LargeAttachment:converted'
	});
	class LargeAttachment {
		static #instances = new Map();
		#params;
		#formAdapter;
		#detector;
		#linkInserter;
		#indicator;
		#postSendPopup;
		#convertedByToken = new Map();
		#pendingFileIds = new Set();
		#deferredFileIds = new Set();
		#hasDeferredFileChange = false;
		#pendingConversionCount = 0;
		#destroyed = false;
		#destroyScheduled = false;
		#state = 'pending';
		#unsubscribes = [];
		static init(params, formAdapter) {
			LargeAttachment.#instances.get(params.formId)?.destroy();
			const instance = new this(params, formAdapter);
			LargeAttachment.#instances.set(params.formId, instance);
			return instance;
		}
		static getDraftState(formId) {
			const instance = LargeAttachment.#instances.get(formId);
			return instance ? instance.#getDraftState() : null;
		}
		constructor(params, formAdapter) {
			this.#params = params;
			this.#formAdapter = formAdapter ?? new MainMailFormAdapter({
				formId: params.formId,
				uploaderControlId: params.uploaderControlId,
				showAha: params.showAha,
				ahaOptionName: params.ahaOptionName
			});
			this.#linkInserter = new LinkInserter(this.#formAdapter);
			this.#indicator = new AttachmentIndicator(this.#formAdapter);
			this.#postSendPopup = new PostSendPopup({
				formAdapter: this.#formAdapter,
				getInserted: () => [...this.#convertedByToken.values()],
				suppressed: params.postSendPromptSuppressed ?? false,
				optionName: params.postSendPromptOptionName ?? '',
				showPrompt: params.postSendPrompt
			});
			this.#postSendPopup.start();
			this.#detector = new SizeDetector({
				formAdapter: this.#formAdapter,
				maxSize: params.maxSize,
				onChange: this.#handleSizeChange
			});
			this.#restoreDraftState(params.draftLargeAttachments ?? []);
			this.#detector.start();
			this.#unsubscribes = [this.#formAdapter.subscribeFileChange(type => {
				if (type === 'remove') {
					this.#handleItemRemove();
				}
			}), this.#formAdapter.subscribeDestroy(this.#handleFormDestroy)];
		}
		getState() {
			return this.#state;
		}
		prepareSubmit() {
			if (this.#state === 'converting' || this.#pendingFileIds.size > 0) {
				return 'pending';
			}
			if (this.#state === 'error') {
				return 'error';
			}
			const orphaned = findOrphanedLinks(this.#formAdapter.getBody(), [...this.#convertedByToken.values()]);
			if (orphaned.length === 0) {
				return 'ready';
			}
			return this.#linkInserter.restore(orphaned) ? 'restored' : 'error';
		}
		getDraftState() {
			return this.#getDraftState();
		}
		#getDraftState() {
			return [...this.#convertedByToken.values()].map(result => ({
				...result,
				sourceFileIds: result.sourceFileIds ?? result.fileIds,
				valid: true
			}));
		}
		#restoreDraftState(largeAttachments) {
			const content = this.#formAdapter.getBody();
			if (!main_core.Type.isString(content)) {
				return;
			}
			const editorContent = String(content);
			largeAttachments.forEach(largeAttachment => {
				if (largeAttachment.valid !== false && largeAttachment.token !== '' && this.#isPublicUrlLinked(editorContent, largeAttachment.publicUrl)) {
					this.#convertedByToken.set(largeAttachment.token, {
						...largeAttachment,
						folderName: largeAttachment.folderName ?? ''
					});
					return;
				}
				this.#removePublicUrlFromEditor(largeAttachment.publicUrl);
			});
			this.#renderSendContract();
			this.#syncIndicator();
		}
		#isPublicUrlLinked(content, publicUrl) {
			if (publicUrl === '') {
				return false;
			}
			const documentNode = new DOMParser().parseFromString(content, 'text/html');
			return [...documentNode.querySelectorAll('a[href]')].some(link => link.getAttribute('href') === publicUrl || link.href === publicUrl);
		}
		destroy() {
			if (this.#destroyed) {
				return;
			}
			this.#destroyed = true;
			this.#unsubscribes.forEach(unsubscribe => {
				unsubscribe();
			});
			this.#unsubscribes = [];
			this.#detector.destroy();
			this.#postSendPopup.destroy();
			this.#indicator.reset();
			this.#formAdapter.destroy();
			if (LargeAttachment.#instances.get(this.#params.formId) === this) {
				LargeAttachment.#instances.delete(this.#params.formId);
			}
		}
		#handleSizeChange = (isLarge, fileIds) => {
			if (this.#destroyed || !isLarge) {
				return;
			}
			if (this.#params.featureAvailable) {
				this.#formAdapter.showAha();
				this.#startConversion(fileIds);
			} else {
				this.#formAdapter.showTariffUnavailable();
			}
		};
		#startConversion(fileIds, replacementResults = null) {
			if (this.#destroyed) {
				return;
			}
			const convertedFileIds = new Set([...this.#convertedByToken.values()].flatMap(result => result.fileIds));
			const candidateFileIds = replacementResults === null ? [...new Set(fileIds)].filter(fileId => !convertedFileIds.has(fileId)) : [...new Set(fileIds)];
			if (candidateFileIds.length === 0) {
				return;
			}
			if (this.#pendingConversionCount > 0) {
				candidateFileIds.forEach(fileId => {
					this.#deferredFileIds.add(fileId);
				});
				this.#hasDeferredFileChange = true;
				return;
			}
			const newFileIds = candidateFileIds.filter(fileId => !this.#pendingFileIds.has(fileId));
			if (newFileIds.length === 0) {
				return;
			}
			const replacedResults = replacementResults ?? [...this.#convertedByToken.values()];
			const requestFileIds = replacedResults.length > 0 ? [...new Set(this.#readFileObjectIds())] : newFileIds;
			requestFileIds.forEach(fileId => {
				this.#pendingFileIds.add(fileId);
			});
			this.#pendingConversionCount++;
			this.#state = 'converting';
			largeAttachmentApi.convert({
				mailboxId: this.#params.mailboxId ?? null,
				fileIds: requestFileIds,
				replacementToken: replacedResults[0]?.token
			}, this.#params.context ?? 'mail').then(async result => {
				await this.#handleConverted(result, replacedResults);
				this.#releasePendingFileIds(requestFileIds);
				this.#processDeferredConversion();
			}).catch(error => {
				this.#releasePendingFileIds(requestFileIds);
				this.#handleConvertError(error, requestFileIds, replacedResults);
				this.#processDeferredConversion();
			});
		}
		#releasePendingFileIds(fileIds) {
			fileIds.forEach(fileId => {
				this.#pendingFileIds.delete(fileId);
			});
			this.#pendingConversionCount = Math.max(0, this.#pendingConversionCount - 1);
		}
		#processDeferredConversion() {
			if (this.#state === 'error' || this.#pendingConversionCount > 0 || !this.#hasDeferredFileChange) {
				return;
			}
			const fileIds = [...this.#deferredFileIds];
			this.#deferredFileIds.clear();
			this.#hasDeferredFileChange = false;
			if (fileIds.length === 0) {
				this.#handleItemRemove();
				return;
			}
			this.#startConversion(fileIds);
		}
		#handleConverted = async (result, replacedResults) => {
			if (this.#destroyed) {
				if (result.token !== '') {
					largeAttachmentApi.deleteUploaded({
						token: result.token
					}).catch(() => {});
				}
				return;
			}
			if (result.token === '' || this.#convertedByToken.has(result.token)) {
				if (result.token !== '') {
					this.#deleteUploaded(result.token);
				}
				this.#state = 'error';
				this.#showUploadError([]);
				return;
			}
			if (!this.#isConversionCurrent(result)) {
				this.#deleteUploaded(result.token);
				this.#state = 'pending';
				if (this.#isCurrentSetLarge()) {
					this.#startConversion(this.#readFileObjectIds());
				}
				this.#restartDetector();
				return;
			}
			if (!(await this.#finalizeReplacements(replacedResults, result.token))) {
				this.#state = 'error';
				this.#formAdapter.showUploadError(() => {
					this.#handleConverted(result, replacedResults);
				});
				return;
			}
			if (!this.#commitConvertedResult(result, replacedResults)) {
				return;
			}
			main_core_events.EventEmitter.emit(Outcome.Converted, {
				formId: this.#params.formId,
				messageId: this.#params.messageId,
				fileIds: result.fileIds,
				publicUrl: result.publicUrl,
				token: result.token
			});
		};
		#commitConvertedResult(result, replacedResults) {
			const nextResults = replacedResults.length > 0 ? [result] : [...this.#convertedByToken.values(), result];
			if (!this.#updateConvertedLink(result, replacedResults, nextResults)) {
				if (replacedResults.length === 0) {
					this.#deleteUploaded(result.token);
				}
				this.#state = 'error';
				this.#formAdapter.showUploadError(() => {
					this.#handleConverted(result, replacedResults);
				});
				return false;
			}
			if (replacedResults.length > 0) {
				this.#convertedByToken.clear();
			}
			this.#convertedByToken.set(result.token, result);
			this.#syncIndicator();
			this.#state = 'converted';
			if (!this.#isConversionCurrent(result)) {
				this.#handleItemRemove();
			}
			this.#processDeferredConversion();
			return true;
		}
		async #finalizeReplacements(replacedResults, currentToken) {
			const results = await Promise.all(replacedResults.map(replacedResult => this.#finalizeReplacement(replacedResult.token, currentToken)));
			return results.every(result => result);
		}
		#finalizeReplacement(previousToken, currentToken, attemptsLeft = 3) {
			return largeAttachmentApi.finalizeReplacement(previousToken, currentToken).then(() => true).catch(() => attemptsLeft > 1 ? this.#finalizeReplacement(previousToken, currentToken, attemptsLeft - 1) : false);
		}
		#updateConvertedLink(result, replacedResults, nextResults) {
			if (replacedResults.length > 0) {
				if (!this.#renderSendContract(nextResults)) {
					return false;
				}
				if (this.#linkInserter.replace(replacedResults, result) || this.#linkInserter.insert(result)) {
					return true;
				}
				this.#renderSendContract();
				return false;
			}
			if (!this.#linkInserter.insert(result)) {
				return false;
			}
			if (!this.#renderSendContract(nextResults)) {
				this.#linkInserter.remove([result]);
				return false;
			}
			return true;
		}
		#renderSendContract(results = [...this.#convertedByToken.values()]) {
			return this.#formAdapter.serializeSendContracts(results.map(result => ({
				token: result.token,
				fileIds: [...result.fileIds]
			})));
		}
		#removePublicUrlFromEditor(publicUrl) {
			const content = this.#formAdapter.getBody();
			if (!main_core.Type.isString(content) || publicUrl === '') {
				return;
			}
			const documentNode = new DOMParser().parseFromString(String(content), 'text/html');
			let changed = false;
			documentNode.querySelectorAll('a[href]').forEach(link => {
				if (link.getAttribute('href') === publicUrl || link.href === publicUrl) {
					link.remove();
					changed = true;
				}
			});
			if (changed) {
				this.#formAdapter.setBody(documentNode.body.innerHTML);
			}
		}
		#handleItemRemove() {
			if (this.#destroyed) {
				return;
			}
			const currentFileIds = new Set(this.#readFileObjectIds());
			if (this.#pendingConversionCount > 0) {
				this.#deferredFileIds.clear();
				currentFileIds.forEach(fileId => {
					this.#deferredFileIds.add(fileId);
				});
				this.#hasDeferredFileChange = true;
				return;
			}
			const invalidated = [...this.#convertedByToken.values()].filter(result => result.fileIds.some(fileId => !currentFileIds.has(fileId)));
			if (invalidated.length > 0) {
				const remainingFileIds = [...currentFileIds];
				if (remainingFileIds.length > 0 && this.#isCurrentSetLarge()) {
					this.#startConversion(remainingFileIds, invalidated);
					return;
				}
				this.#removeConvertedState(invalidated);
				this.#linkInserter.remove(invalidated);
				invalidated.forEach(result => {
					this.#deleteUploaded(result.token);
				});
			}
			this.#restartDetector();
		}
		#removeConvertedState(links) {
			links.forEach(link => {
				this.#convertedByToken.delete(link.token);
			});
			this.#renderSendContract();
			this.#syncIndicator();
			if (this.#convertedByToken.size === 0) {
				this.#state = 'pending';
			}
		}
		#syncIndicator() {
			this.#indicator.sync([...this.#convertedByToken.values()].flatMap(result => result.fileIds));
		}
		#isConversionCurrent(result) {
			const currentFileIds = new Set(this.#readFileObjectIds());
			return result.fileIds.every(fileId => currentFileIds.has(fileId));
		}
		#restartDetector() {
			if (this.#destroyed) {
				return;
			}
			this.#detector.destroy();
			this.#detector = new SizeDetector({
				formAdapter: this.#formAdapter,
				maxSize: this.#params.maxSize,
				onChange: this.#handleSizeChange
			});
			this.#detector.start();
		}
		#isCurrentSetLarge() {
			const totalRawSize = this.#formAdapter.getFiles().reduce((total, file) => total + file.size, 0);
			return SizeDetector.exceedsLimit(totalRawSize, this.#params.maxSize);
		}
		#deleteUploaded(token) {
			largeAttachmentApi.deleteUploaded({
				token
			}).catch(() => {});
		}
		#handleConvertError = (error, fileIds, replacedResults = []) => {
			if (this.#destroyed) {
				return;
			}
			this.#state = 'error';
			if (replacedResults.length > 0 && !this.#isCurrentSetLarge()) {
				this.#removeConvertedState(replacedResults);
				this.#linkInserter.remove(replacedResults);
				replacedResults.forEach(result => this.#deleteUploaded(result.token));
				this.#restartDetector();
				return;
			}
			if (error.code === ConvertErrorCode.TariffUnavailable || error.code === ConvertErrorCode.DiskFeatureUnavailable) {
				this.#formAdapter.showTariffUnavailable();
				return;
			}
			if (error.code === ConvertErrorCode.NoSpace) {
				this.#formAdapter.showNoSpaceError(() => {
					this.#retryConversion(fileIds, replacedResults);
				});
				return;
			}
			this.#showUploadError(fileIds, replacedResults);
		};
		#showUploadError(fileIds, replacedResults = []) {
			this.#formAdapter.showUploadError(fileIds.length > 0 ? () => this.#retryConversion(fileIds, replacedResults) : undefined);
		}
		#retryConversion(fileIds, replacedResults = []) {
			if (this.#destroyed) {
				return;
			}
			const currentFileIds = new Set(this.#readFileObjectIds());
			const retryFileIds = fileIds.filter(fileId => currentFileIds.has(fileId));
			if (retryFileIds.length > 0) {
				this.#startConversion(retryFileIds, replacedResults.length > 0 ? replacedResults : null);
			}
		}
		#handleFormDestroy = () => {
			if (this.#destroyed || this.#destroyScheduled) {
				return;
			}
			this.#destroyScheduled = true;
			queueMicrotask(() => {
				this.#destroyScheduled = false;
				if (!this.#destroyed) {
					this.destroy();
				}
			});
		};
		#readFileObjectIds() {
			return this.#formAdapter.getFiles().map(file => file.id).filter(id => id !== null);
		}
	}

	exports.ConvertErrorCode = ConvertErrorCode;
	exports.LargeAttachment = LargeAttachment;
	exports.MainMailFormAdapter = MainMailFormAdapter;
	exports.largeAttachmentApi = largeAttachmentApi;

})(this.BX.Mail.Client = this.BX.Mail.Client || {}, BX.UI, BX, BX.Event, BX.UI, BX.Main, BX.UI);
//# sourceMappingURL=large-attachment.bundle.js.map
