/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
this.BX.Mail.Signature = this.BX.Mail.Signature || {};
(function (exports, main_core, ui_alerts, ui_notification, ui_system_alert, ui_system_menu, main_popup, ui_loader, ui_uploader_core, disk_diskPicker, ui_buttons, ui_entitySelector, ui_system_radiobutton, ui_switcher, mail_lib_entitySelector) {
	'use strict';

	const ASSIGNMENTS_PROVIDED = 'Y';
	function pickPanelData(panels) {
		if (panels.scopeCard?.isSharedScope() === true) {
			return panels.scopeCard.getSaveData();
		}
		return panels.panel ? panels.panel.getSaveData() : null;
	}
	function buildUserSignatureSaveRequest(payload) {
		const fields = {
			signature: payload.signature
		};
		if (payload.signatureId <= 0 || payload.panelData?.preserveAssignment !== true) {
			fields.sender = payload.panelData?.sender ?? '';
			if (payload.signatureId > 0 && payload.panelData?.senderChanged === true) {
				fields.senderBindingChanged = 'Y';
			}
		}
		if (payload.signatureId > 0) {
			return {
				action: 'mail.api.usersignature.update',
				data: {
					userSignatureId: payload.signatureId,
					fields
				}
			};
		}
		return {
			action: 'mail.api.usersignature.add',
			data: {
				fields
			}
		};
	}
	function buildSharedSignatureSaveRequest(payload) {
		const assignments = payload.panelData?.assignments;
		const data = payload.signatureId > 0 ? {
			id: payload.signatureId,
			signature: payload.signature
		} : {
			signature: payload.signature
		};
		if (assignments) {
			data.assignments = assignments;
			data.assignmentsProvided = ASSIGNMENTS_PROVIDED;
		}
		return {
			action: payload.signatureId > 0 ? 'mail.api.sharedsignature.update' : 'mail.api.sharedsignature.add',
			data
		};
	}
	function buildUnifiedSignatureUpdateRequest(payload) {
		const shared = payload.panelData?.kind === 'shared';
		const preserveAssignment = !shared && (payload.panelData?.preserveAssignment === true || payload.scopeChanged !== true && payload.panelData?.senderChanged !== true);
		const sender = payload.panelData?.sender ?? '';
		const assignments = shared ? payload.panelData?.assignments ?? [] : sender === '' ? [] : [{
			targetType: 'sender',
			targetId: 0,
			targetValue: sender,
			isFlat: false
		}];
		const data = {
			id: payload.signatureId,
			signature: payload.signature,
			scope: shared ? 'shared' : 'owner'
		};
		if (!preserveAssignment) {
			data.assignments = assignments;
			data.assignmentsProvided = ASSIGNMENTS_PROVIDED;
		}
		return {
			action: 'mail.api.signature.update',
			data
		};
	}
	function extractUserSignatureId(responseData) {
		return Number(responseData?.userSignature?.id ?? 0);
	}
	function extractSharedSignatureId(responseData) {
		return Number(responseData?.item?.id ?? 0);
	}

	const SIGNATURE_IMAGE_SIZES = new Set(['small', 'medium', 'original']);
	const SIGNATURE_IMAGE_SRC_PATTERN = new RegExp('^/bitrix/services/main/ajax\\.php\\?action=mail\\.api\\.signatureimage\\.view&id=' + '([\\da-f]{8}-[\\da-f]{4}-[1-8][\\da-f]{3}-[89ab][\\da-f]{3}-[\\da-f]{12})$', 'i');
	class HtmlEditorAdapter {
		#editorInstanceId;
		#bookmarks = new WeakMap();
		#signatureImages;
		#markerObserver = null;
		#observedDocument = null;
		#lastVisualSelection = null;
		#visualFocusLost = false;
		#restoreFrame = null;
		#destroyed = false;
		#rememberSelection = () => {
			const editor = this.#resolveEditor();
			const selection = editor?.selection.GetBookmark();
			if (editor && selection) {
				this.#lastVisualSelection = {
					editor,
					selection
				};
			}
			this.#visualFocusLost = true;
		};
		#markVisualFocus = () => {
			this.#visualFocusLost = false;
		};
		constructor(editorInstanceId, initialContent = '') {
			this.#editorInstanceId = editorInstanceId;
			this.#signatureImages = this.#readSignatureImages(initialContent);
			this.#scheduleSignatureImageMarkerRestore();
		}
		destroy() {
			this.#destroyed = true;
			this.#unbindSelectionEvents();
			this.#markerObserver?.disconnect();
			this.#markerObserver = null;
			this.#observedDocument = null;
			this.#lastVisualSelection = null;
			if (this.#restoreFrame !== null) {
				cancelAnimationFrame(this.#restoreFrame);
				this.#restoreFrame = null;
			}
		}
		getContent() {
			const editor = this.#requireEditor();
			this.#captureSignatureImageMarkers(editor);
			const content = this.#serializeSignatureImageMarkers(editor.GetContent());
			this.#restoreSignatureImageMarkers(editor);
			return content;
		}
		insertHtml(html) {
			this.#requireEditor().InsertHtml(html);
		}
		focus() {
			this.#requireEditor().Focus();
		}
		saveBookmark() {
			const editor = this.#resolveEditor();
			if (!editor) {
				return null;
			}
			const selection = this.#visualFocusLost && this.#lastVisualSelection?.editor === editor ? this.#lastVisualSelection.selection : editor.selection.GetBookmark();
			if (!selection) {
				return null;
			}
			const bookmark = {};
			this.#bookmarks.set(bookmark, {
				editor,
				selection
			});
			return bookmark;
		}
		restoreBookmark(bookmark) {
			const savedBookmark = this.#resolveBookmark(bookmark);
			if (!savedBookmark) {
				return false;
			}
			savedBookmark.editor.selection.SetBookmark(savedBookmark.selection);
			savedBookmark.editor.Focus();
			return true;
		}
		insertNodeAtBookmark(bookmark, node) {
			const savedBookmark = this.#resolveBookmark(bookmark);
			if (!savedBookmark) {
				return false;
			}
			const {
				editor,
				selection
			} = savedBookmark;
			this.#registerSignatureImage(node);
			editor.selection.InsertNode(node, selection);
			editor.selection.SetAfter(node);
			this.#restoreSignatureImageMarkers(editor);
			return true;
		}
		#resolveBookmark(bookmark) {
			const savedBookmark = this.#bookmarks.get(bookmark);
			if (!savedBookmark || this.#resolveEditor() !== savedBookmark.editor) {
				return null;
			}
			return savedBookmark;
		}
		#resolveEditor() {
			const manager = main_core.Reflection.getClass('BXHtmlEditor');
			return manager?.Get(this.#editorInstanceId) || null;
		}
		#readSignatureImages(content) {
			const registry = new Map();
			const template = document.createElement('template');
			template.innerHTML = content;
			for (const image of template.content.querySelectorAll('img')) {
				const marker = this.#readSignatureImage(image);
				if (marker) {
					registry.set(marker.id, [...(registry.get(marker.id) ?? []), marker.size]);
				}
			}
			return registry;
		}
		#registerSignatureImage(image) {
			const marker = this.#readSignatureImage(image);
			if (marker) {
				this.#signatureImages.set(marker.id, [...(this.#signatureImages.get(marker.id) ?? []), marker.size]);
			}
		}
		#captureSignatureImageMarkers(editor) {
			if (!main_core.Type.isFunction(editor.GetIframeDoc)) {
				return;
			}
			const registry = new Map();
			for (const image of editor.GetIframeDoc().querySelectorAll('img')) {
				const marker = this.#readSignatureImage(image);
				if (marker) {
					registry.set(marker.id, [...(registry.get(marker.id) ?? []), marker.size]);
				}
			}
			this.#signatureImages = registry;
		}
		#readSignatureImage(image) {
			const id = this.#idFromSrc(image.getAttribute('src'));
			const markerId = image.getAttribute('data-bx-mail-signature-image');
			const size = image.getAttribute('data-bx-mail-signature-image-size');
			if (id === null || markerId?.toLowerCase() !== id || !SIGNATURE_IMAGE_SIZES.has(size)) {
				return null;
			}
			return {
				id,
				size: size
			};
		}
		#idFromSrc(src) {
			const match = SIGNATURE_IMAGE_SRC_PATTERN.exec(src ?? '');
			return match?.[1]?.toLowerCase() ?? null;
		}
		#restoreSignatureImageMarkers(editor = this.#resolveEditor()) {
			if (!editor || !main_core.Type.isFunction(editor.GetIframeDoc)) {
				return;
			}
			const occurrences = new Map();
			for (const image of editor.GetIframeDoc().querySelectorAll('img')) {
				const id = this.#idFromSrc(image.getAttribute('src'));
				const occurrence = id === null ? 0 : occurrences.get(id) ?? 0;
				if (id !== null) {
					occurrences.set(id, occurrence + 1);
				}
				const size = this.#readSignatureImage(image)?.size ?? (id === null ? null : this.#signatureImages.get(id)?.[occurrence]);
				if (id !== null && size && (image.getAttribute('data-bx-mail-signature-image') !== id || image.getAttribute('data-bx-mail-signature-image-size') !== size)) {
					image.setAttribute('data-bx-mail-signature-image', id);
					image.setAttribute('data-bx-mail-signature-image-size', size);
				}
			}
		}
		#scheduleSignatureImageMarkerRestore() {
			let retryAllowed = true;
			const restore = () => {
				this.#restoreFrame = null;
				if (this.#destroyed) {
					return;
				}
				const editor = this.#resolveEditor();
				const iframeDocument = editor && main_core.Type.isFunction(editor.GetIframeDoc) ? editor.GetIframeDoc() : null;
				if (!iframeDocument?.body) {
					if (retryAllowed) {
						retryAllowed = false;
						this.#restoreFrame = requestAnimationFrame(restore);
					}
					return;
				}
				this.#observeSignatureImageMarkers(iframeDocument);
				this.#restoreSignatureImageMarkers(editor);
			};
			restore();
		}
		#observeSignatureImageMarkers(iframeDocument) {
			if (this.#observedDocument === iframeDocument) {
				return;
			}
			this.#markerObserver?.disconnect();
			this.#unbindSelectionEvents();
			this.#observedDocument = iframeDocument;
			this.#lastVisualSelection = null;
			this.#visualFocusLost = false;
			main_core.Event.bind(iframeDocument, 'focusin', this.#markVisualFocus);
			main_core.Event.bind(iframeDocument, 'focusout', this.#rememberSelection);
			this.#markerObserver = new MutationObserver(() => {
				this.#restoreSignatureImageMarkers();
			});
			this.#markerObserver.observe(iframeDocument.body, {
				attributes: true,
				attributeFilter: ['src', 'data-bx-mail-signature-image', 'data-bx-mail-signature-image-size'],
				childList: true,
				subtree: true
			});
		}
		#unbindSelectionEvents() {
			if (!this.#observedDocument) {
				return;
			}
			main_core.Event.unbind(this.#observedDocument, 'focusin', this.#markVisualFocus);
			main_core.Event.unbind(this.#observedDocument, 'focusout', this.#rememberSelection);
		}
		#serializeSignatureImageMarkers(content) {
			const template = document.createElement('template');
			template.innerHTML = content;
			const occurrences = new Map();
			for (const image of template.content.querySelectorAll('img')) {
				const id = this.#idFromSrc(image.getAttribute('src'));
				const occurrence = id === null ? 0 : occurrences.get(id) ?? 0;
				if (id !== null) {
					occurrences.set(id, occurrence + 1);
				}
				const size = id === null ? null : this.#signatureImages.get(id)?.[occurrence];
				if (id === null || !size) {
					continue;
				}
				const marker = document.createElement('img');
				marker.setAttribute('src', image.getAttribute('src'));
				marker.setAttribute('data-bx-mail-signature-image', id);
				marker.setAttribute('data-bx-mail-signature-image-size', size);
				image.replaceWith(marker);
			}
			return template.innerHTML;
		}
		syncToolbar() {
			const editor = this.#resolveEditor();
			if (!editor) {
				return;
			}
			editor.toolbar.DisableWysiwygButtons(editor.GetViewMode() === 'code');
		}
		subscribeToViewModeChanges() {
			const editor = this.#resolveEditor();
			if (editor) {
				main_core.addCustomEvent(editor, 'OnSetViewAfter', () => this.syncToolbar());
			}
		}
		#requireEditor() {
			const editor = this.#resolveEditor();
			if (!editor) {
				throw new Error(`HTML editor ${this.#editorInstanceId} is not initialized`);
			}
			return editor;
		}
	}

	class SignatureEditor {
		#options;
		#editor;
		#connectedCapabilities = [];
		#saveInProgress = false;
		#destroyed = false;
		constructor(options) {
			this.#options = options;
			this.#editor = new HtmlEditorAdapter(options.editorInstanceId, options.initialContent);
			this.#editor.syncToolbar();
			this.#editor.subscribeToViewModeChanges();
			main_core.Dom.attr(options.alertContainer, {
				role: 'alert',
				'aria-live': 'assertive',
				'aria-atomic': 'true'
			});
			if (options.panel && options.panelContainer) {
				options.panel.renderTo(options.panelContainer);
			}
			if (options.scopeCard && options.scopeCardContainer) {
				options.scopeCard.subscribeToScope(shared => {
					this.#applyScope(shared);
				});
				options.scopeCard.renderTo(options.scopeCardContainer);
				this.#applyScope(options.scopeCard.isSharedScope());
			}
			for (const capability of options.capabilities ?? []) {
				capability.connect({
					editor: this.#editor,
					showError: text => this.showError(text),
					clearError: () => this.clearError()
				});
				this.#connectedCapabilities.push(capability);
			}
		}
		save(closeAfter = false) {
			void this.#save(closeAfter);
		}
		destroy() {
			if (this.#destroyed) {
				return;
			}
			this.#destroyed = true;
			this.#editor.destroy();
			for (const capability of this.#connectedCapabilities) {
				capability.disconnect?.();
			}
			this.#connectedCapabilities = [];
		}
		async #save(closeAfter) {
			if (this.#saveInProgress || this.#destroyed) {
				return;
			}
			const {
				signatureId,
				scopeCard,
				transport
			} = this.#options;
			if (scopeCard && !scopeCard.validate()) {
				return;
			}
			this.#saveInProgress = true;
			const isNew = signatureId <= 0;
			try {
				if (this.#connectedCapabilities.length > 0 && !(await this.#runBeforeSave())) {
					return;
				}
				const savedId = await transport.save({
					signatureId,
					signature: this.#editor.getContent(),
					panelData: pickPanelData(this.#options)
				});
				if (isNew || closeAfter) {
					this.closeSlider(savedId);
				} else {
					ui_notification.Center.notify({
						content: transport.getUpdateSuccessText()
					});
				}
			} catch (response) {
				this.showError(this.#getErrorMessage(response));
			} finally {
				this.#saveInProgress = false;
			}
		}
		showError(text) {
			const alert = new ui_alerts.Alert({
				color: ui_alerts.AlertColor.DANGER,
				icon: ui_alerts.AlertIcon.DANGER,
				text
			});
			main_core.Dom.clean(this.#options.alertContainer);
			main_core.Dom.append(alert.getContainer(), this.#options.alertContainer);
		}
		clearError() {
			main_core.Dom.clean(this.#options.alertContainer);
		}
		closeSlider(signatureId) {
			const {
				eventId,
				idKey
			} = this.#options.sliderMessage;
			const sidePanel = main_core.Reflection.getClass('BX.SidePanel');
			if (sidePanel) {
				const slider = sidePanel.Instance.getTopSlider();
				if (slider) {
					sidePanel.Instance.postMessage(slider, eventId, {
						[idKey]: signatureId
					});
				}
			}
			document.getElementById('ui-button-panel-close')?.click();
		}
		#applyScope(shared) {
			const {
				panelContainer
			} = this.#options;
			if (panelContainer) {
				main_core.Dom.style(panelContainer, 'display', shared ? 'none' : '');
			}
		}
		#getErrorMessage(response) {
			if (response instanceof Error) {
				return response.message;
			}
			const ajaxResponse = response;
			const errors = ajaxResponse.errors ?? [];
			return errors[errors.length - 1]?.message ?? '';
		}
		async #runBeforeSave(index = 0) {
			const capability = this.#connectedCapabilities[index];
			if (!capability) {
				return true;
			}
			if (!(await capability.beforeSave())) {
				return false;
			}
			if (this.#destroyed) {
				return false;
			}
			return this.#runBeforeSave(index + 1);
		}
	}

	const SignatureImageAction = Object.freeze({
		Upload: 'mail.api.signatureimage.upload',
		Copy: 'mail.api.signatureimage.copy'
	});
	const SignatureImageError = Object.freeze({
		NotFound: 'SIGNATURE_IMAGE_NOT_FOUND',
		DiskUnavailable: 'SIGNATURE_IMAGE_DISK_UNAVAILABLE',
		UploadInvalid: 'SIGNATURE_IMAGE_UPLOAD_INVALID',
		UnsupportedFormat: 'SIGNATURE_IMAGE_UNSUPPORTED_FORMAT',
		ExtensionMismatch: 'SIGNATURE_IMAGE_EXTENSION_MISMATCH',
		InvalidDimensions: 'SIGNATURE_IMAGE_INVALID_DIMENSIONS',
		TooLarge: 'SIGNATURE_IMAGE_TOO_LARGE',
		PixelLimitExceeded: 'SIGNATURE_IMAGE_PIXEL_LIMIT_EXCEEDED',
		CountLimitExceeded: 'SIGNATURE_IMAGE_COUNT_LIMIT_EXCEEDED',
		TotalSizeLimitExceeded: 'SIGNATURE_IMAGE_TOTAL_SIZE_LIMIT_EXCEEDED',
		CopyFailed: 'SIGNATURE_IMAGE_COPY_FAILED',
		StorageFailed: 'SIGNATURE_IMAGE_STORAGE_FAILED',
		CreationLimitExceeded: 'SIGNATURE_IMAGE_CREATION_LIMIT_EXCEEDED',
		ResolveFailed: 'SIGNATURE_IMAGE_RESOLVE_FAILED'
	});
	const SignatureImageClientLimit = Object.freeze({
		MaxFileSize: 2 * 1024 * 1024,
		MaxResourceCount: 10,
		MaxTotalSize: 5 * 1024 * 1024,
		MaxPixelCount: 20_000_000
	});
	const SignatureImageVariant = Object.freeze({
		Small: 'small',
		Medium: 'medium',
		Original: 'original'
	});

	class SignatureImageService {
		#runAction;
		constructor(runAction = (action, config) => main_core.ajax.runAction(action, config)) {
			this.#runAction = runAction;
		}
		upload(uploadId) {
			return this.#create(SignatureImageAction.Upload, {
				uploadId
			});
		}
		copy(objectId) {
			return this.#create(SignatureImageAction.Copy, {
				objectId
			});
		}
		async #create(action, data) {
			try {
				const response = await this.#runAction(action, {
					data
				});
				return response.data.image;
			} catch (response) {
				throw this.#mapError(response);
			}
		}
		#mapError(response) {
			const error = response?.errors?.[0];
			const rawCode = error?.code;
			const rawMessage = error?.message;
			const code = main_core.Type.isString(rawCode) && Object.values(SignatureImageError).includes(rawCode) ? rawCode : null;
			return {
				code,
				message: main_core.Type.isString(rawMessage) ? rawMessage : ''
			};
		}
	}
	const signatureImageService = new SignatureImageService();

	const UUID_PATTERN = /^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;
	const SIGNATURE_IMAGE_VIEW_PATH = '/bitrix/services/main/ajax.php';
	const SIGNATURE_IMAGE_VIEW_ACTION = 'mail.api.signatureimage.view';
	function buildSignatureImageMarker(image, variant = SignatureImageVariant.Original) {
		if (!UUID_PATTERN.test(image.id) || !Object.values(SignatureImageVariant).includes(variant)) {
			throw new TypeError('Invalid signature image marker data.');
		}
		const expectedSrc = `${SIGNATURE_IMAGE_VIEW_PATH}?action=${SIGNATURE_IMAGE_VIEW_ACTION}&id=${image.id}`;
		if (image.src !== expectedSrc) {
			throw new TypeError('Invalid signature image marker source.');
		}
		const variantWidth = image.variants[variant];
		if (!Number.isInteger(image.width) || image.width <= 0 || !Number.isInteger(variantWidth) || variantWidth <= 0) {
			throw new TypeError('Invalid signature image marker dimensions.');
		}
		const marker = document.createElement('img');
		marker.setAttribute('src', image.src);
		marker.setAttribute('data-bx-mail-signature-image', image.id);
		marker.setAttribute('data-bx-mail-signature-image-size', variant);
		marker.setAttribute('width', String(Math.min(image.width, variantWidth)));
		return marker;
	}

	class ImageSizeMenu {
		#menuFactory;
		#alertFactory;
		#menu = null;
		#alert = null;
		#resolve = null;
		#selection = null;
		constructor(options = {}) {
			this.#menuFactory = options.menuFactory ?? (menuOptions => {
				return new ui_system_menu.Menu(menuOptions);
			});
			this.#alertFactory = options.alertFactory ?? (content => {
				return new ui_system_alert.Alert({
					design: ui_system_alert.AlertDesign.tintedWarning,
					content
				});
			});
		}
		choose(image, anchor) {
			this.destroy();
			const bindElement = this.#resolveBindElement(anchor);
			if (!bindElement) {
				return Promise.resolve(null);
			}
			return new Promise(resolve => {
				this.#resolve = resolve;
				this.#selection = null;
				this.#menu = this.#menuFactory({
					ariaLabel: main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_IMAGE_SIZE_MENU') || '',
					items: this.#buildItems(image),
					events: {
						onShow: () => this.#showGifAlert(image),
						onClose: () => this.#finish(this.#selection),
						onDestroy: () => this.#finish(null)
					}
				});
				this.#menu.show(bindElement);
			});
		}
		destroy() {
			const menu = this.#menu;
			this.#menu = null;
			this.#destroyAlert();
			this.#resolveSelection(null);
			menu?.destroy();
		}
		#buildItems(image) {
			return [this.#buildItem(image, SignatureImageVariant.Small, 'MAIL_SIGNATURE_EDITOR_IMAGE_SIZE_SMALL'), this.#buildItem(image, SignatureImageVariant.Medium, 'MAIL_SIGNATURE_EDITOR_IMAGE_SIZE_MEDIUM'), this.#buildItem(image, SignatureImageVariant.Original, 'MAIL_SIGNATURE_EDITOR_IMAGE_SIZE_ORIGINAL')];
		}
		#buildItem(image, variant, messageCode) {
			const width = this.#resolveWidth(image, variant);
			return {
				id: `mail-signature-editor-image-size-${variant}`,
				title: main_core.Loc.getMessage(messageCode) || '',
				subtitle: main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_IMAGE_SIZE_WIDTH', {
					'#WIDTH#': String(width)
				}) || '',
				onClick: () => {
					this.#selection = variant;
					this.#menu?.close();
				}
			};
		}
		#resolveWidth(image, variant) {
			const width = image.variants[variant];
			if (!main_core.Type.isInteger(width) || width <= 0) {
				return image.width;
			}
			return Math.min(width, image.width);
		}
		#showGifAlert(image) {
			if (!image.animated || this.#alert || !this.#menu) {
				return;
			}
			this.#alert = this.#alertFactory(main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_IMAGE_GIF_WARNING') || '');
			const container = this.#alert.render();
			container.setAttribute('role', 'status');
			container.setAttribute('aria-live', 'polite');
			container.setAttribute('aria-atomic', 'true');
			main_core.Dom.addClass(container, 'mail-signature-image-size-menu__gif-alert');
			main_core.Dom.prepend(container, this.#menu.getPopupContainer());
		}
		#finish(selection) {
			const menu = this.#menu;
			this.#menu = null;
			this.#destroyAlert();
			this.#resolveSelection(selection);
			menu?.destroy();
		}
		#destroyAlert() {
			this.#alert?.destroy();
			this.#alert = null;
		}
		#resolveSelection(selection) {
			const resolve = this.#resolve;
			this.#resolve = null;
			this.#selection = null;
			resolve?.(selection);
		}
		#resolveBindElement(anchor) {
			const sourceMenu = anchor?.closest('[role="menu"]');
			const labelledBy = sourceMenu?.getAttribute('aria-labelledby')?.split(/\s+/) ?? [];
			for (const id of labelledBy) {
				const trigger = document.getElementById(id);
				if (trigger instanceof HTMLElement && trigger.isConnected) {
					return trigger;
				}
			}
			if (anchor?.isConnected) {
				return anchor;
			}
			const activeElement = document.activeElement;
			return activeElement instanceof HTMLElement && activeElement !== document.body && activeElement.isConnected ? activeElement : null;
		}
	}

	class ImageUploadProgress {
		#popupFactory;
		#loaderFactory;
		#popup = null;
		#container = null;
		constructor(options = {}) {
			this.#popupFactory = options.popupFactory ?? (popupOptions => new main_popup.Popup(popupOptions));
			this.#loaderFactory = options.loaderFactory ?? (target => new ui_loader.Loader({
				target,
				type: 'BULLET',
				size: 'S'
			}));
		}
		show(anchor) {
			this.destroy();
			if (!anchor?.isConnected) {
				return;
			}
			const loaderTarget = main_core.Tag.render`<span class="mail-signature-image-upload-progress__loader"></span>`;
			const container = main_core.Tag.render`
			<div
				class="mail-signature-image-upload-progress"
				role="status"
				aria-live="polite"
				aria-busy="true"
				data-testid="mail-signature-editor-image-upload-progress"
			>
				${loaderTarget}
				<span>${main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_IMAGE_UPLOADING') || ''}</span>
			</div>
		`;
			this.#container = container;
			const loader = this.#loaderFactory(loaderTarget);
			loader.render();
			loader.show();
			this.#popup = this.#popupFactory({
				bindElement: anchor,
				content: container,
				className: 'mail-signature-image-upload-progress-popup',
				closeIcon: false,
				closeByEsc: false,
				autoHide: false,
				overlay: false,
				focusTrap: false,
				cacheable: false,
				angle: true,
				padding: 0,
				contentPadding: 0
			});
			this.#popup.show();
		}
		destroy() {
			this.#container?.setAttribute('aria-busy', 'false');
			this.#container = null;
			this.#popup?.destroy();
			this.#popup = null;
		}
	}

	class ImageCapability {
		#localUploader;
		#diskPicker;
		#service;
		#markerBuilder;
		#sizeMenu;
		#uploadProgress;
		#context = null;
		#state = 'idle';
		#bookmark = null;
		#activePromise = null;
		#requestVersion = 0;
		#menuAnchor = null;
		constructor(options) {
			this.#localUploader = options.localUploader;
			this.#diskPicker = options.diskPicker;
			this.#service = options.service ?? signatureImageService;
			this.#markerBuilder = options.markerBuilder ?? buildSignatureImageMarker;
			this.#sizeMenu = options.sizeMenu ?? new ImageSizeMenu();
			this.#uploadProgress = options.uploadProgress ?? new ImageUploadProgress();
		}
		connect(context) {
			if (this.#state !== 'destroyed') {
				this.#context = context;
			}
		}
		getState() {
			return this.#state;
		}
		prepareInsertion(anchor = null) {
			if (!this.#context || this.#state === 'destroyed' || this.#activePromise) {
				return;
			}
			let menuAnchor = anchor;
			if (!menuAnchor?.isConnected) {
				menuAnchor = document.activeElement instanceof HTMLElement ? document.activeElement : null;
			}
			this.#bookmark ??= this.#context.editor.saveBookmark();
			this.#menuAnchor = menuAnchor;
			menuAnchor?.focus({
				preventScroll: true
			});
		}
		chooseLocal() {
			return this.#start(() => this.#localUploader.choose(() => this.#markUploading()), uploadId => this.#service.upload(uploadId));
		}
		chooseDisk() {
			return this.#start(() => this.#diskPicker.choose(), objectId => this.#service.copy(objectId));
		}
		async beforeSave() {
			const activePromise = this.#activePromise;
			if (activePromise) {
				await activePromise;
			}
			return this.#state !== 'destroyed';
		}
		disconnect() {
			if (this.#state === 'destroyed') {
				return;
			}
			this.#requestVersion++;
			this.#state = 'destroyed';
			this.#context = null;
			this.#bookmark = null;
			this.#menuAnchor = null;
			this.#activePromise = null;
			this.#localUploader.cancel();
			this.#diskPicker.cancel();
			this.#sizeMenu.destroy();
			this.#uploadProgress.destroy();
		}
		#start(choose, create) {
			if (this.#activePromise) {
				return this.#activePromise;
			}
			const context = this.#context;
			if (!context || this.#state === 'destroyed') {
				return Promise.resolve();
			}
			this.#menuAnchor ??= document.activeElement instanceof HTMLElement ? document.activeElement : null;
			this.#bookmark ??= context.editor.saveBookmark();
			if (!this.#bookmark) {
				this.#menuAnchor = null;
				return Promise.resolve();
			}
			this.#state = 'choosing';
			const requestVersion = ++this.#requestVersion;
			const request = this.#perform(requestVersion, choose, create);
			this.#activePromise = request;
			void request.then(() => {
				if (this.#activePromise === request) {
					this.#activePromise = null;
				}
			});
			return request;
		}
		async #perform(requestVersion, choose, create) {
			try {
				const value = await choose();
				if (!this.#isCurrent(requestVersion)) {
					return;
				}
				if (value === null) {
					this.#state = 'idle';
					this.#restoreFocus();
					return;
				}
				this.#markUploading();
				const image = await create(value);
				if (!this.#isCurrent(requestVersion)) {
					return;
				}
				this.#uploadProgress.destroy();
				this.#state = 'sizing';
				const variant = await this.#sizeMenu.choose(image, this.#menuAnchor);
				if (!this.#isCurrent(requestVersion)) {
					return;
				}
				if (variant === null) {
					this.#state = 'idle';
					this.#restoreFocus();
					return;
				}
				const marker = this.#markerBuilder(image, variant);
				const inserted = this.#bookmark ? this.#context?.editor.insertNodeAtBookmark(this.#bookmark, marker) === true : false;
				this.#state = inserted ? 'ready' : 'idle';
				if (!inserted) {
					this.#restoreFocus();
				}
			} catch (error) {
				if (this.#isCurrent(requestVersion)) {
					this.#state = 'idle';
					const message = error?.message;
					if (main_core.Type.isStringFilled(message)) {
						this.#context?.showError(message);
					}
					this.#restoreFocus();
				}
			} finally {
				this.#uploadProgress.destroy();
				if (this.#isCurrent(requestVersion)) {
					this.#bookmark = null;
					this.#menuAnchor = null;
				}
			}
		}
		#markUploading() {
			if (this.#state === 'choosing') {
				this.#state = 'uploading';
				this.#uploadProgress.show(this.#menuAnchor);
			}
		}
		#restoreFocus() {
			if (!this.#context) {
				return;
			}
			if (!this.#bookmark || !this.#context.editor.restoreBookmark(this.#bookmark)) {
				this.#context.editor.focus();
			}
		}
		#isCurrent(requestVersion) {
			return this.#state !== 'destroyed' && this.#context !== null && requestVersion === this.#requestVersion;
		}
	}

	const FILE_UPLOAD_START_EVENT = 'File:onUploadStart';
	const FILE_UPLOAD_COMPLETE_EVENT = 'File:onUploadComplete';
	const FILE_ERROR_EVENT = 'File:onError';
	const SIGNATURE_IMAGE_UPLOADER_CONTROLLER = 'mail.fileUploader.signatureImageUploaderController';
	const FILE_UPLOAD_ERROR_MESSAGE = 'File upload failed.';
	const SAFE_ERROR_CODE_PATTERN = /^[\dA-Z_]+$/;
	class LocalImageUploader {
		#uploaderFactory;
		#active = null;
		constructor(options) {
			this.#uploaderFactory = options.uploaderFactory ?? (uploaderOptions => new ui_uploader_core.Uploader(uploaderOptions));
		}
		choose(onUploadStart = () => {}) {
			if (this.#active) {
				return Promise.reject(new Error('A local image selection is already active.'));
			}
			return new Promise((resolve, reject) => {
				const input = document.createElement('input');
				input.type = 'file';
				const uploader = this.#uploaderFactory({
					controller: SIGNATURE_IMAGE_UPLOADER_CONTROLLER,
					browseElement: input,
					autoUpload: true,
					multiple: false,
					acceptOnlyImages: true,
					acceptedFileTypes: ['image/jpeg', 'image/png', 'image/gif'],
					maxFileSize: SignatureImageClientLimit.MaxFileSize,
					events: {
						[FILE_UPLOAD_START_EVENT]: onUploadStart,
						[FILE_UPLOAD_COMPLETE_EVENT]: event => {
							const file = event.getData().file;
							const serverFileId = file.getServerFileId();
							if (main_core.Type.isStringFilled(serverFileId) || main_core.Type.isNumber(serverFileId)) {
								this.#settleAfterEvent(String(serverFileId), null, true);
								return;
							}
							this.#settleAfterEvent(null, new Error('The upload did not return a file id.'));
						},
						[FILE_ERROR_EVENT]: event => {
							this.#settleAfterEvent(null, this.#toError(event.getData().error));
						}
					}
				});
				this.#active = {
					uploader,
					input,
					resolve,
					reject,
					settled: false
				};
				main_core.Event.bind(input, 'cancel', this.#handleCancel);
				input.click();
			});
		}
		cancel() {
			this.#settle(null);
		}
		#handleCancel = () => {
			this.#settle(null);
		};
		#settleAfterEvent(uploadId, error = null, keepServerFile = false) {
			void Promise.resolve().then(() => this.#settle(uploadId, error, keepServerFile));
		}
		#settle(uploadId, error = null, keepServerFile = false) {
			const active = this.#active;
			if (!active || active.settled) {
				return;
			}
			active.settled = true;
			main_core.Event.unbind(active.input, 'cancel', this.#handleCancel);
			active.uploader.destroy({
				removeFilesFromServer: !keepServerFile
			});
			this.#active = null;
			if (error) {
				active.reject(error);
			} else {
				active.resolve(uploadId);
			}
		}
		#toError(error) {
			if (error instanceof Error && main_core.Type.isStringFilled(error.message)) {
				return error;
			}
			const uploaderError = error;
			const getMessage = uploaderError?.getMessage;
			const message = main_core.Type.isFunction(getMessage) ? getMessage.call(error) : '';
			if (main_core.Type.isStringFilled(message)) {
				return new Error(message);
			}
			const getCode = uploaderError?.getCode;
			const code = main_core.Type.isFunction(getCode) ? getCode.call(error) : '';
			if (main_core.Type.isStringFilled(code) && SAFE_ERROR_CODE_PATTERN.test(code)) {
				return new Error(code);
			}
			return new Error(FILE_UPLOAD_ERROR_MESSAGE);
		}
	}

	class DiskImagePicker {
		#pickerFactory;
		#active = null;
		constructor(options = {}) {
			this.#pickerFactory = options.pickerFactory ?? (() => new disk_diskPicker.DiskPicker());
		}
		choose() {
			if (this.#active) {
				return Promise.reject(new Error('A Disk image selection is already active.'));
			}
			return new Promise((resolve, reject) => {
				const picker = this.#pickerFactory();
				this.#active = {
					picker,
					resolve,
					reject,
					settled: false
				};
				picker.open(this.#buildParams());
			});
		}
		cancel() {
			this.#active?.picker.close();
			this.#settle(null);
		}
		#buildParams() {
			return {
				selectionMode: 'single',
				maxItems: 1,
				allowedFileTypes: ['image'],
				onSelect: result => {
					this.#settle(result.items[0]?.objectId ?? null);
				},
				onCancel: () => this.#settle(null),
				onClose: () => this.#settle(null),
				onError: error => {
					this.#settle(null, new Error(error.code));
				}
			};
		}
		#settle(objectId, error = null) {
			const active = this.#active;
			if (!active || active.settled) {
				return;
			}
			active.settled = true;
			this.#active = null;
			if (error) {
				active.reject(error);
			} else {
				active.resolve(objectId);
			}
		}
	}

	class ImageSourceMenu {
		#options;
		#button = null;
		#control = null;
		#originalContainer = null;
		#originalDisable = null;
		#prepareInsertion = null;
		constructor(options) {
			this.#options = options;
		}
		attach() {
			if (this.#button) {
				return true;
			}
			const control = this.#resolveControl();
			const originalContainer = control?.GetCont();
			if (!control || !(originalContainer instanceof HTMLElement)) {
				return false;
			}
			const label = main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_IMAGE_INSERT') || control.title || '';
			const button = new ui_buttons.Button({
				baseClass: control.className || originalContainer.className,
				className: 'mail-signature-editor-image-button',
				collapsedIcon: '',
				dropdown: false,
				props: {
					type: 'button',
					title: label,
					'aria-label': label,
					'aria-haspopup': 'menu',
					'aria-expanded': 'false'
				},
				systemMenu: {
					items: [{
						id: 'mail-signature-editor-image-local',
						title: main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_IMAGE_SOURCE_LOCAL') || '',
						onClick: () => {
							void this.#options.capability.chooseLocal();
						}
					}, {
						id: 'mail-signature-editor-image-disk',
						title: main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_IMAGE_SOURCE_DISK') || '',
						onClick: () => {
							void this.#options.capability.chooseDisk();
						}
					}]
				}
			});
			const buttonContainer = button.render();
			this.#prepareInsertion = () => this.#options.capability.prepareInsertion(buttonContainer);
			main_core.Event.bind(buttonContainer, 'focusin', this.#prepareInsertion);
			main_core.Event.bind(buttonContainer, 'click', this.#prepareInsertion);
			const icon = document.createElement('i');
			icon.setAttribute('aria-hidden', 'true');
			main_core.Dom.append(icon, buttonContainer);
			this.#control = control;
			this.#button = button;
			this.#originalContainer = originalContainer;
			this.#originalDisable = control.Disable;
			control.pCont = buttonContainer;
			control.Disable = disabled => {
				this.#originalDisable?.call(control, disabled);
				button.setDisabled(disabled);
			};
			button.setDisabled(control.disabled === true);
			main_core.Dom.replace(originalContainer, buttonContainer);
			return true;
		}
		destroy() {
			if (!this.#button || !this.#control || !this.#originalContainer || !this.#originalDisable) {
				return;
			}
			const buttonContainer = this.#button.getContainer();
			if (this.#prepareInsertion) {
				main_core.Event.unbind(buttonContainer, 'focusin', this.#prepareInsertion);
				main_core.Event.unbind(buttonContainer, 'click', this.#prepareInsertion);
			}
			this.#button.setSystemMenu(false);
			this.#control.pCont = this.#originalContainer;
			this.#control.Disable = this.#originalDisable;
			if (buttonContainer.parentNode) {
				main_core.Dom.replace(buttonContainer, this.#originalContainer);
			}
			this.#button = null;
			this.#control = null;
			this.#originalContainer = null;
			this.#originalDisable = null;
			this.#prepareInsertion = null;
		}
		#resolveControl() {
			const manager = main_core.Reflection.getClass('BXHtmlEditor');
			const editor = manager?.Get(this.#options.editorInstanceId);
			return editor ? editor.toolbar?.controls?.InsertImage ?? null : null;
		}
	}

	const SUPPORTED_VERSION = 1;
	class SignatureMacroCatalog {
		#groups;
		#tokens;
		constructor(groups) {
			this.#groups = groups;
			this.#tokens = new Set(groups.flatMap(group => {
				return group.items.map(item => item.token);
			}));
		}
		static fromDto(dto) {
			if (!main_core.Type.isPlainObject(dto)) {
				return null;
			}
			const catalogDto = dto;
			if (String(catalogDto.version) !== String(SUPPORTED_VERSION) || !main_core.Type.isArrayFilled(catalogDto.groups)) {
				return null;
			}
			const tokens = new Set();
			const groups = [];
			for (const groupDto of catalogDto.groups) {
				if (!main_core.Type.isPlainObject(groupDto) || !main_core.Type.isStringFilled(groupDto.id) || !main_core.Type.isArrayFilled(groupDto.items)) {
					return null;
				}
				const items = [];
				for (const itemDto of groupDto.items) {
					if (!main_core.Type.isPlainObject(itemDto) || !main_core.Type.isStringFilled(itemDto.id) || !main_core.Type.isStringFilled(itemDto.token) || !main_core.Type.isStringFilled(itemDto.labelKey) || tokens.has(itemDto.token)) {
						return null;
					}
					tokens.add(itemDto.token);
					items.push({
						id: itemDto.id,
						token: itemDto.token,
						labelKey: itemDto.labelKey,
						label: main_core.Loc.getMessage(itemDto.labelKey) ?? ''
					});
				}
				groups.push({
					id: groupDto.id,
					label: main_core.Loc.getMessage(`MAIL_SIGNATURE_MACRO_GROUP_${groupDto.id.toUpperCase()}`) ?? '',
					items
				});
			}
			return new SignatureMacroCatalog(groups);
		}
		getGroups() {
			return this.#groups;
		}
		getTokens() {
			return new Set(this.#tokens);
		}
	}

	function buildSignatureMacroMenuOptions(groups, onSelect) {
		return {
			sections: groups.map(group => ({
				code: group.id,
				title: group.label
			})),
			items: groups.flatMap(group => {
				return group.items.map(item => ({
					id: item.id,
					title: item.label,
					sectionCode: group.id,
					onClick: () => onSelect(item)
				}));
			}),
			closeOnItemClick: true
		};
	}
	function findFirstUnknownMacro(template, knownTokens) {
		let offset = 0;
		while (offset < template.length) {
			const start = template.indexOf('{{', offset);
			if (start === -1) {
				return null;
			}
			const end = template.indexOf('}}', start + 2);
			if (end === -1) {
				return template.slice(start);
			}
			const construction = template.slice(start, end + 2);
			if (!knownTokens.has(construction)) {
				return construction;
			}
			offset = end + 2;
		}
		return null;
	}
	class SignatureMacroCapability {
		#options;
		#context = null;
		#button = null;
		constructor(options) {
			this.#options = options;
		}
		connect(context) {
			this.disconnect();
			this.#context = context;
			this.#button = new ui_buttons.Button({
				text: main_core.Loc.getMessage('MAIL_SIGNATURE_MACRO_ADD') ?? '',
				color: ui_buttons.ButtonColor.LIGHT_BORDER,
				noCaps: true,
				systemMenu: buildSignatureMacroMenuOptions(this.#options.catalog.getGroups(), item => this.#insert(item))
			});
			this.#button.renderTo(this.#options.actionContainer);
		}
		beforeSave() {
			if (!this.#context) {
				return true;
			}
			const unknown = findFirstUnknownMacro(this.#context.editor.getContent(), this.#options.catalog.getTokens());
			if (unknown !== null) {
				this.#context.showError(main_core.Loc.getMessage('MAIL_SIGNATURE_MACRO_UNKNOWN', {
					'#TOKEN#': main_core.Text.encode(unknown)
				}) ?? '');
				return false;
			}
			this.#context.clearError();
			return true;
		}
		disconnect() {
			if (this.#button) {
				this.#button.setSystemMenu(false);
				main_core.Dom.remove(this.#button.getContainer());
			}
			this.#button = null;
			this.#context = null;
		}
		#insert(item) {
			if (!this.#context) {
				return;
			}
			this.#context.editor.insertHtml(item.token);
			this.#context.editor.focus();
		}
	}

	const SENDER_OPTION_ENTITY_ID = 'mail-signature-sender';
	const SENDER_OPTION_TAB_ID = 'recents';
	function getInitialSenderOptionId(options) {
		const selected = options.find(option => option.selected === true);
		return (selected ?? options[0])?.id ?? null;
	}
	function buildSenderSelectorItems(options) {
		const initialId = getInitialSenderOptionId(options);
		return options.map((option, index) => ({
			id: option.id,
			entityId: SENDER_OPTION_ENTITY_ID,
			title: option.title,
			tabs: SENDER_OPTION_TAB_ID,
			sort: index,
			selected: option.id === initialId,
			deselectable: false
		}));
	}
	function getSenderValueById(options, id) {
		return options.find(option => option.id === id)?.value ?? '';
	}

	class SenderBindingPanel {
		#senderOptions;
		#initialOptionId;
		#selector = null;
		constructor(options) {
			this.#senderOptions = options.senderOptions ?? [];
			this.#initialOptionId = getInitialSenderOptionId(this.#senderOptions);
		}
		renderTo(container) {
			const selectorContainer = main_core.Tag.render`
			<div
				class="mail-signature-sender-binding__selector"
				data-role="sender-selector"
				data-testid="mail-signature-sender-selector"
			></div>
		`;
			const block = main_core.Tag.render`
			<div class="mail-signature-sender-binding" data-testid="mail-signature-sender-binding">
				<div class="mail-signature-sender-binding__label">
					${main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_SENDER_BINDING_LABEL') ?? ''}
				</div>
				${selectorContainer}
			</div>
		`;
			main_core.Dom.append(block, container);
			const caption = main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_SENDER_BINDING_CHANGE') ?? '';
			this.#selector = new ui_entitySelector.TagSelector({
				multiple: false,
				addButtonCaption: caption,
				addButtonCaptionMore: caption,
				dialogOptions: {
					targetNode: selectorContainer,
					context: 'MAIL_SIGNATURE_SENDER_BINDING',
					items: buildSenderSelectorItems(this.#senderOptions),
					dropdownMode: true,
					enableSearch: false,
					showAvatars: false,
					compactView: true
				}
			});
			this.#selector.renderTo(selectorContainer);
		}
		getSaveData() {
			const selectedOptionId = this.#getSelectedOptionId();
			const selectedOption = this.#senderOptions.find(option => option.id === selectedOptionId);
			return {
				kind: 'user',
				sender: getSenderValueById(this.#senderOptions, selectedOptionId),
				preserveAssignment: selectedOption?.preserveAssignment === true,
				senderChanged: selectedOptionId !== this.#initialOptionId
			};
		}
		#getSelectedOptionId() {
			const tag = this.#selector?.getTags()[0];
			return tag ? String(tag.getId()) : this.#initialOptionId;
		}
	}

	function needsUnifiedTransport(condition) {
		return (condition.unifiedSignatureId ?? 0) > 0 || condition.hasSharedScopeCard === true;
	}
	class CompositeTransport {
		#userTransport;
		#sharedTransport;
		#unifiedTransport;
		#sharedSignatureId;
		#unifiedSignatureId;
		#initialKind;
		#continueInUnifiedModel = false;
		constructor(userTransport, sharedTransport, options = {}) {
			this.#userTransport = userTransport;
			this.#sharedTransport = sharedTransport;
			this.#unifiedTransport = options.unifiedTransport ?? sharedTransport;
			this.#sharedSignatureId = options.sharedSignatureId ?? 0;
			this.#unifiedSignatureId = options.unifiedSignatureId ?? 0;
			this.#initialKind = options.initialKind ?? 'user';
		}
		save(payload) {
			const kind = payload.panelData?.kind ?? 'user';
			if (this.#unifiedSignatureId > 0 && (this.#continueInUnifiedModel || kind !== this.#initialKind || kind === 'user' && payload.signatureId <= 0)) {
				return this.#unifiedTransport.save({
					...payload,
					signatureId: this.#unifiedSignatureId,
					scopeChanged: kind !== this.#initialKind
				}).then(savedId => {
					this.#unifiedSignatureId = savedId;
					this.#sharedSignatureId = kind === 'shared' ? savedId : 0;
					this.#initialKind = kind;
					this.#continueInUnifiedModel = true;
					return savedId;
				});
			}
			if (kind === 'shared') {
				return this.#sharedTransport.save({
					...payload,
					signatureId: this.#sharedSignatureId
				});
			}
			return this.#userTransport.save(payload);
		}
		getUpdateSuccessText() {
			return this.#userTransport.getUpdateSuccessText();
		}
	}

	const ASSIGNMENT_MODES = ['all', 'mailbox', 'department', 'draft'];
	const MODES_WITH_TARGETS = new Set(['mailbox', 'department']);
	const DEFAULT_ASSIGNMENT_MODE = 'draft';
	function detectAssignmentMode(assignments) {
		if (!assignments || assignments.length === 0) {
			return 'draft';
		}
		if (assignments.some(assignment => assignment.targetType === 'all')) {
			return 'all';
		}
		const byDepartment = assignments.some(assignment => assignment.targetType === 'department' || assignment.targetType === 'user');
		if (byDepartment) {
			return 'department';
		}
		return assignments.every(assignment => assignment.targetType === 'mailbox') ? 'mailbox' : DEFAULT_ASSIGNMENT_MODE;
	}
	function modeRequiresTargets(mode) {
		return MODES_WITH_TARGETS.has(mode);
	}

	class AssignmentBlock {
		#content = null;
		#mode = DEFAULT_ASSIGNMENT_MODE;
		#mailboxSelector = null;
		#departmentSelector = null;
		#initialAssignments;
		#onTargetAdd;
		constructor(options = {}) {
			this.#initialAssignments = options.assignments ?? [];
			this.#onTargetAdd = options.onTargetAdd ?? (() => {});
		}
		renderTo(container) {
			if (!container) {
				return;
			}
			this.#content = main_core.Tag.render`
			<div
				class="mail-signature-assignment-block"
				data-testid="mail-signature-assignment-container"
			></div>
		`;
			main_core.Dom.append(this.#content, container);
		}
		getSaveData() {
			return {
				kind: 'shared',
				assignments: this.getAssignments()
			};
		}
		getAssignments() {
			if (this.#mode === 'all') {
				return [{
					targetType: 'all',
					targetId: 0,
					isFlat: false
				}];
			}
			if (this.#mode === 'mailbox') {
				return this.#getMailboxAssignments();
			}
			if (this.#mode === 'department') {
				return this.#getDepartmentAssignments();
			}
			return [];
		}
		setMode(mode) {
			if (!ASSIGNMENT_MODES.includes(mode)) {
				return;
			}
			this.#mode = mode;
			if (!this.#content) {
				return;
			}
			main_core.Dom.clean(this.#content);
			if (mode === 'mailbox') {
				this.#renderMailboxSelector(this.#content);
			} else if (mode === 'department') {
				this.#renderDepartmentSelector(this.#content);
			}
		}
		#renderMailboxSelector(content) {
			const selectorContainer = main_core.Tag.render`
			<div
				class="mail-signature-assignment-block__selector"
				data-role="mailbox-selector"
				data-testid="mail-signature-mailbox-selector"
			></div>
		`;
			main_core.Dom.append(selectorContainer, content);
			this.#mailboxSelector = new ui_entitySelector.TagSelector({
				multiple: true,
				events: {
					onAfterTagAdd: () => {
						this.#onTargetAdd();
					}
				},
				dialogOptions: {
					targetNode: selectorContainer,
					context: 'MAIL_CORP_SIGNATURE_MAILBOXES',
					selectedItems: this.#getMailboxSelectorItems(),
					preselectedItems: this.#getMailboxSelectorPreselected(),
					entities: [{
						id: 'mail_mailbox',
						dynamicLoad: true,
						dynamicSearch: true
					}]
				}
			});
			this.#mailboxSelector.renderTo(selectorContainer);
		}
		#getMailboxAssignments() {
			if (!this.#mailboxSelector) {
				return [];
			}
			const result = [];
			this.#mailboxSelector.getTags().forEach(tag => {
				const parsed = mail_lib_entitySelector.parseSelectorTag(tag);
				if (parsed && parsed.entity === 'mail_mailbox') {
					result.push({
						targetType: 'mailbox',
						targetId: parsed.id,
						isFlat: false
					});
				}
			});
			return result;
		}
		#getMailboxSelectorPreselected() {
			return this.#initialAssignments.filter(assignment => assignment.targetType === 'mailbox' && assignment.targetId > 0).map(assignment => ['mail_mailbox', Number(assignment.targetId)]);
		}
		#getMailboxSelectorItems() {
			const items = [];
			this.#initialAssignments.forEach(assignment => {
				const title = assignment.title ?? '';
				if (assignment.targetType === 'mailbox' && assignment.targetId > 0 && title !== '') {
					items.push({
						entityId: 'mail_mailbox',
						id: Number(assignment.targetId),
						title
					});
				}
			});
			return items;
		}
		#renderDepartmentSelector(content) {
			const selectorContainer = main_core.Tag.render`
			<div
				class="mail-signature-assignment-block__selector"
				data-role="dept-selector"
				data-testid="mail-signature-department-selector"
			></div>
		`;
			main_core.Dom.append(selectorContainer, content);
			this.#departmentSelector = new ui_entitySelector.TagSelector({
				multiple: true,
				events: {
					onAfterTagAdd: () => {
						this.#onTargetAdd();
					}
				},
				dialogOptions: {
					targetNode: selectorContainer,
					context: 'MAIL_CORP_SIGNATURE_ASSIGNMENT',
					selectedItems: this.#getDepartmentSelectorItems(),
					preselectedItems: this.#getDepartmentSelectorPreselected(),
					entities: mail_lib_entitySelector.getUserDepartmentEntities(),
					preload: true,
					events: {
						onLoad: event => {
							const dialog = event.getTarget();
							if (dialog && !dialog.getRecentTab().getRootNode().hasChildren()) {
								dialog.selectTab('departments');
							}
						}
					}
				}
			});
			this.#departmentSelector.renderTo(selectorContainer);
		}
		#getDepartmentAssignments() {
			if (!this.#departmentSelector) {
				return [];
			}
			const result = [];
			this.#departmentSelector.getTags().forEach(tag => {
				const parsed = mail_lib_entitySelector.parseSelectorTag(tag);
				if (!parsed) {
					return;
				}
				if (parsed.entity === 'department') {
					result.push({
						targetType: 'department',
						targetId: parsed.id,
						isFlat: parsed.isFlat
					});
				} else if (parsed.entity === 'user') {
					result.push({
						targetType: 'user',
						targetId: parsed.id,
						isFlat: false
					});
				}
			});
			return result;
		}
		#getDepartmentSelectorPreselected() {
			const items = [];
			this.#initialAssignments.forEach(assignment => {
				if (assignment.targetType === 'department') {
					items.push(['department', mail_lib_entitySelector.buildDepartmentItemId(assignment.targetId, assignment.isFlat)]);
				} else if (assignment.targetType === 'user' && assignment.targetId > 0) {
					items.push(['user', assignment.targetId]);
				}
			});
			return items;
		}
		#getDepartmentSelectorItems() {
			const items = [];
			this.#initialAssignments.forEach(assignment => {
				const title = assignment.title ?? '';
				if (title === '') {
					return;
				}
				if (assignment.targetType === 'department') {
					items.push({
						entityId: 'department',
						id: mail_lib_entitySelector.buildDepartmentItemId(assignment.targetId, assignment.isFlat),
						title
					});
				} else if (assignment.targetType === 'user' && assignment.targetId > 0) {
					items.push({
						entityId: 'user',
						id: assignment.targetId,
						title
					});
				}
			});
			return items;
		}
	}

	const RADIO_GROUP = 'mail-signature-assignment-type';
	class AssignmentTypeSelector {
		#shared;
		#mode;
		#assignmentBlock;
		#switcher = null;
		#contentContainer = null;
		#errorContainer = null;
		#radios = new Map();
		#scopeHandlers = [];
		constructor(options = {}) {
			const assignments = options.assignments ?? [];
			this.#shared = options.shared === true;
			this.#mode = options.mode ?? detectAssignmentMode(assignments);
			this.#assignmentBlock = new AssignmentBlock({
				assignments,
				onTargetAdd: () => {
					this.#hideError();
				}
			});
		}
		renderTo(container) {
			const label = main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_ASSIGN_TYPE_LABEL') ?? '';
			const switcherNode = main_core.Tag.render`
			<button
				type="button"
				class="mail-signature-shared-scope__switcher"
				data-testid="mail-signature-shared-switcher"
				role="switch"
				aria-checked="${this.#shared}"
				aria-label="${main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_SHARED_SCOPE_TITLE') ?? ''}"
			></button>
		`;
			const card = main_core.Tag.render`
			<div class="mail-signature-shared-scope" data-testid="mail-signature-shared-scope">
				<div class="mail-signature-shared-scope__header">
					<div class="mail-signature-shared-scope__title-block">
						<div class="mail-signature-shared-scope__title">
							${main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_SHARED_SCOPE_TITLE') ?? ''}
						</div>
						<div class="mail-signature-shared-scope__subtitle">
							${main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_SHARED_SCOPE_HINT') ?? ''}
						</div>
					</div>
					${switcherNode}
				</div>
				<div class="mail-signature-shared-scope__content" data-role="shared-scope-content">
					<div class="mail-signature-assignment-type__label">${label}</div>
					<div
						class="mail-signature-assignment-type__options"
						role="radiogroup"
						aria-label="${label}"
					>
						${ASSIGNMENT_MODES.map(mode => this.#renderOption(mode))}
					</div>
					<div class="mail-signature-assignment-type__panel" data-role="shared-panel"></div>
					<div
						class="mail-signature-assignment-type__error"
						data-role="shared-error"
						data-testid="mail-signature-assignment-error"
						role="status"
						aria-live="polite"
					></div>
				</div>
			</div>
		`;
			main_core.Dom.append(card, container);
			this.#switcher = new ui_switcher.Switcher({
				node: switcherNode,
				size: ui_switcher.SwitcherSize.large,
				useAirDesign: true,
				showStateTitle: false,
				checked: this.#shared,
				handlers: {
					toggled: () => {
						const shared = this.#switcher?.isChecked() === true;
						switcherNode.setAttribute('aria-checked', String(shared));
						this.#setShared(shared);
					}
				}
			});
			this.#contentContainer = card.querySelector('[data-role="shared-scope-content"]');
			this.#errorContainer = card.querySelector('[data-role="shared-error"]');
			const panelContainer = card.querySelector('[data-role="shared-panel"]');
			if (panelContainer) {
				this.#assignmentBlock.renderTo(panelContainer);
				this.#assignmentBlock.setMode(this.#mode);
			}
			this.#updateVisibility();
		}
		isSharedScope() {
			return this.#shared;
		}
		subscribeToScope(handler) {
			this.#scopeHandlers.push(handler);
		}
		getSaveData() {
			const data = this.#assignmentBlock.getSaveData();
			return {
				...data,
				kind: 'shared',
				assignments: data.assignments?.length ? data.assignments : this.#fallbackAssignments()
			};
		}
		validate() {
			if (this.#shared && modeRequiresTargets(this.#mode) && this.#assignmentBlock.getAssignments().length === 0) {
				this.#showError();
				return false;
			}
			this.#hideError();
			return true;
		}
		#showError() {
			if (this.#errorContainer) {
				this.#errorContainer.textContent = main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_ASSIGN_TARGETS_REQUIRED') ?? '';
			}
		}
		#hideError() {
			if (this.#errorContainer) {
				this.#errorContainer.textContent = '';
			}
		}
		#renderOption(mode) {
			const title = main_core.Loc.getMessage(`MAIL_SIGNATURE_EDITOR_ASSIGN_TYPE_${mode.toUpperCase()}`) ?? mode;
			const radio = new ui_system_radiobutton.RadioButton({
				group: RADIO_GROUP,
				size: ui_system_radiobutton.RadioButtonSize.Md,
				checked: mode === this.#mode,
				attributes: {
					value: mode,
					'aria-label': title,
					'data-testid': `mail-signature-assignment-${mode}`
				},
				onChange: ({
					checked
				}) => {
					if (checked) {
						this.#selectMode(mode);
					}
				}
			});
			this.#radios.set(mode, radio);
			const option = main_core.Tag.render`
			<div class="mail-signature-assignment-type__option">
				${radio.render()}
				<span class="mail-signature-assignment-type__option-text">${title}</span>
			</div>
		`;
			main_core.Event.bind(option, 'click', event => {
				if (event.target instanceof HTMLElement && event.target.closest('label')) {
					return;
				}
				this.#selectMode(mode);
			});
			return option;
		}
		#selectMode(mode) {
			this.#mode = mode;
			this.#hideError();
			this.#syncRadios();
			this.#assignmentBlock.setMode(mode);
		}
		#syncRadios() {
			this.#radios.forEach((radio, mode) => {
				radio.setChecked(mode === this.#mode);
			});
		}
		#setShared(shared) {
			if (shared === this.#shared) {
				return;
			}
			this.#shared = shared;
			this.#updateVisibility();
			this.#scopeHandlers.forEach(handler => {
				handler(shared);
			});
		}
		#updateVisibility() {
			if (this.#contentContainer) {
				main_core.Dom.style(this.#contentContainer, 'display', this.#shared ? '' : 'none');
			}
		}
		#fallbackAssignments() {
			if (this.#mode === 'all') {
				return [{
					targetType: 'all',
					targetId: 0,
					isFlat: false
				}];
			}
			return [];
		}
	}

	class UserSignatureTransport {
		save(payload) {
			const {
				action,
				data
			} = buildUserSignatureSaveRequest(payload);
			return main_core.ajax.runAction(action, {
				data
			}).then(response => payload.signatureId > 0 ? payload.signatureId : extractUserSignatureId(response.data));
		}
		getUpdateSuccessText() {
			return main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_UPDATE_SUCCESS') ?? '';
		}
	}

	class SharedSignatureTransport {
		save(payload) {
			const {
				action,
				data
			} = buildSharedSignatureSaveRequest(payload);
			return main_core.ajax.runAction(action, {
				data
			}).then(response => payload.signatureId > 0 ? payload.signatureId : extractSharedSignatureId(response.data));
		}
		getUpdateSuccessText() {
			return main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_SHARED_UPDATE_SUCCESS') ?? '';
		}
	}

	class UnifiedSignatureTransport {
		save(payload) {
			const {
				action,
				data
			} = buildUnifiedSignatureUpdateRequest(payload);
			return main_core.ajax.runAction(action, {
				data
			}).then(() => payload.signatureId);
		}
		getUpdateSuccessText() {
			return main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_UPDATE_SUCCESS') ?? '';
		}
	}

	exports.ASSIGNMENTS_PROVIDED = ASSIGNMENTS_PROVIDED;
	exports.ASSIGNMENT_MODES = ASSIGNMENT_MODES;
	exports.AssignmentBlock = AssignmentBlock;
	exports.AssignmentTypeSelector = AssignmentTypeSelector;
	exports.CompositeTransport = CompositeTransport;
	exports.DEFAULT_ASSIGNMENT_MODE = DEFAULT_ASSIGNMENT_MODE;
	exports.DiskImagePicker = DiskImagePicker;
	exports.ImageCapability = ImageCapability;
	exports.ImageSourceMenu = ImageSourceMenu;
	exports.LocalImageUploader = LocalImageUploader;
	exports.SENDER_OPTION_ENTITY_ID = SENDER_OPTION_ENTITY_ID;
	exports.SenderBindingPanel = SenderBindingPanel;
	exports.SharedSignatureTransport = SharedSignatureTransport;
	exports.SignatureEditor = SignatureEditor;
	exports.SignatureMacroCapability = SignatureMacroCapability;
	exports.SignatureMacroCatalog = SignatureMacroCatalog;
	exports.UnifiedSignatureTransport = UnifiedSignatureTransport;
	exports.UserSignatureTransport = UserSignatureTransport;
	exports.buildSenderSelectorItems = buildSenderSelectorItems;
	exports.buildSharedSignatureSaveRequest = buildSharedSignatureSaveRequest;
	exports.buildSignatureImageMarker = buildSignatureImageMarker;
	exports.buildSignatureMacroMenuOptions = buildSignatureMacroMenuOptions;
	exports.buildUnifiedSignatureUpdateRequest = buildUnifiedSignatureUpdateRequest;
	exports.buildUserSignatureSaveRequest = buildUserSignatureSaveRequest;
	exports.detectAssignmentMode = detectAssignmentMode;
	exports.extractSharedSignatureId = extractSharedSignatureId;
	exports.extractUserSignatureId = extractUserSignatureId;
	exports.findFirstUnknownMacro = findFirstUnknownMacro;
	exports.getInitialSenderOptionId = getInitialSenderOptionId;
	exports.getSenderValueById = getSenderValueById;
	exports.modeRequiresTargets = modeRequiresTargets;
	exports.needsUnifiedTransport = needsUnifiedTransport;
	exports.pickPanelData = pickPanelData;

})(this.BX.Mail.Signature.Editor = this.BX.Mail.Signature.Editor || {}, BX, BX.UI, BX.UI.Notification, BX.UI.System.Alert, BX.UI.System, BX.Main, BX.UI, BX.UI.Uploader, BX.Disk, BX.UI, BX.UI.EntitySelector, BX.UI.System.RadioButton, BX.UI, BX.Mail.Lib.EntitySelector);
//# sourceMappingURL=editor.bundle.js.map
