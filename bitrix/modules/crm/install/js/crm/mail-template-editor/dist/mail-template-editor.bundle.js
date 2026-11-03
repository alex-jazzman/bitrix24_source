/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, ui_designTokens, ui_designTokens_air, main_core, main_core_events, main_sidepanel, ui_vue3, disk_uploader_userFieldWidget, ui_iconSet_api_vue, ui_system_typography_vue, ui_iconSet_outline, ui_vue3_components_button, ui_system_alert_vue, ui_system_alert, ui_entitySelector, ui_system_input_vue, ui_system_chip_vue, ui_system_menu_vue, ui_vue3_components_switcher, ui_mail_senderSelector) {
	'use strict';

	const HtmlEditorErrorCode = {
		ContainerUnavailable: 'EDITOR_CONTAINER_UNAVAILABLE',
		InitializationFailed: 'EDITOR_INITIALIZATION_FAILED',
		NotReady: 'EDITOR_NOT_READY',
		Destroyed: 'EDITOR_DESTROYED',
		FilesPending: 'EDITOR_FILES_PENDING',
		FilesFailed: 'EDITOR_FILES_FAILED',
		Readonly: 'EDITOR_READONLY'
	};
	const READY_TIMEOUT = 30000;
	const LOOKUP_INTERVAL = 50;
	const FILE_EVENTS = ['File:onStatusChange', 'File:onComplete', 'File:onUploadComplete', 'File:onError'];
	const ITEM_EVENTS = ['Item:onAdd', 'Item:onComplete'];
	const DISK_PARSER_ID = 'diskfile0';
	const EDITOR_EVENTS = ['OnEditorInitedAfter', 'OnCreateIframeAfter', 'OnIframeReInit', 'OnSetViewAfter', 'OnIframeFocus', 'OnIframeSetValue'];
	const SELECTION_EVENTS = ['OnSetViewBefore', 'OnIframeReInit', 'OnIframeSetValue', 'OnSetContentBefore'];
	const SELECTION_CAPTURE_EVENTS = ['OnIframeBlur', 'OnTextareaBlur', 'OnIframeKeyup', 'OnTextareaKeyup'];
	const MUTATION_EVENTS = ['beforeinput', 'paste', 'drop', 'cut'];
	const MOUSE_EVENTS = ['mousedown', 'mouseup', 'dblclick', 'contextmenu', 'click'];
	const NAVIGATION_KEYS = new Set(['Tab', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown', 'Shift', 'Control', 'Alt', 'Meta', 'ContextMenu']);
	class HtmlEditorAdapter {
		#options;
		#postForm = null;
		#editor = null;
		#startPromise = null;
		#resolveReady = null;
		#rejectReady = null;
		#lookupTimer = null;
		#readyTimer = null;
		#ready = false;
		#reinitializing = false;
		#destroyed = false;
		#readonlyDocument = null;
		#readonlyTextarea = null;
		#fileControl = null;
		#uploader = null;
		#files;
		#removedFiles = new Set();
		#fileState;
		#filesListeners = new Set();
		#fileLookupTimer = null;
		#fileLookupDeadline = 0;
		#filesTimer = null;
		#phpParser = null;
		#previousFileNode = null;
		#fileNode = {
			Parse: (params, bxid) => this.#parseFileNode(params, bxid)
		};
		#selection = null;
		#lastSelection = null;
		#hasSelectionHistory = false;
		constructor(options) {
			this.#options = {
				...options
			};
			this.#files = new Set(options.files);
			this.#fileState = {
				files: [...this.#files],
				pending: false,
				failed: false
			};
		}
		start() {
			if (this.#destroyed) {
				return Promise.reject(new Error(HtmlEditorErrorCode.Destroyed));
			}
			if (this.#startPromise) {
				return this.#startPromise;
			}
			this.#startPromise = new Promise((resolve, reject) => {
				this.#resolveReady = resolve;
				this.#rejectReady = reject;
			});
			this.#readyTimer = window.setTimeout(() => {
				this.#fail(new Error(HtmlEditorErrorCode.InitializationFailed));
			}, READY_TIMEOUT);
			this.#fileLookupDeadline = Date.now() + READY_TIMEOUT;
			this.#connect();
			return this.#startPromise;
		}
		prepareToMove() {
			if (this.#destroyed) {
				return;
			}
			const editor = this.#editor ?? window.BXHtmlEditor?.Get(this.#options.editorId);
			this.#invalidateSelection();
			if (editor && this.#hasReadyDocument(editor)) {
				editor.GetContent();
			}
		}
		isReady() {
			return !this.#destroyed && this.#ready && !this.#reinitializing && this.#editor !== null && this.#hasReadyDocument(this.#editor);
		}
		getContent() {
			const editor = this.#editor;
			if (!editor || !this.isReady()) {
				throw new Error(HtmlEditorErrorCode.NotReady);
			}
			this.#ensureFileParser();
			editor.OnSubmit();
			return this.#serializeImages(editor.GetContent());
		}
		getSnapshot() {
			if (!this.#options.canEdit) {
				throw new Error(HtmlEditorErrorCode.Readonly);
			}
			if (!this.isReady()) {
				throw new Error(HtmlEditorErrorCode.NotReady);
			}
			this.#connectFiles();
			this.#requireFilesReady();
			const bodyHtml = this.getContent();
			this.#requireFilesReady();
			return {
				bodyHtml,
				files: [...this.#files]
			};
		}
		subscribeFiles(listener) {
			if (this.#destroyed) {
				return () => {};
			}
			this.#filesListeners.add(listener);
			listener({
				...this.#fileState,
				files: [...this.#fileState.files]
			});
			return () => this.#filesListeners.delete(listener);
		}
		focus() {
			const editor = this.#editor;
			if (!editor || !this.#options.canEdit || !this.isReady()) {
				return false;
			}
			editor.Focus();
			return true;
		}
		rememberSelection(onInvalidated) {
			this.clearSelection();
			const editor = this.#editor;
			if (!editor || !this.#options.canEdit || !this.isReady()) {
				return false;
			}
			const previous = this.#lastSelection;
			const hasPrevious = previous && this.#isSelectionCurrent(previous);
			let selection = hasPrevious && previous.kind === 'wysiwyg' && !previous.document.hasFocus() ? previous : this.#captureSelection();
			if (!selection && hasPrevious) {
				selection = previous;
			}
			if (!selection && !this.#hasSelectionHistory) {
				editor.Focus(true);
				selection = this.#captureSelection();
			}
			if (!selection) {
				return false;
			}
			this.#selection = {
				...selection,
				onInvalidated
			};
			this.#lastSelection = selection;
			this.#hasSelectionHistory = true;
			return true;
		}
		insertPlaceholder(fragment) {
			const selection = this.#selection;
			if (!this.#options.canEdit || !main_core.Type.isStringFilled(fragment) || !selection || !this.#isSelectionCurrent(selection)) {
				this.clearSelection();
				return false;
			}
			this.clearSelection();
			const {
				editor,
				kind
			} = selection;
			editor.Focus();
			if (kind === 'source') {
				const {
					textarea,
					start,
					end,
					direction
				} = selection;
				textarea.setSelectionRange(start, end, direction);
				editor.textareaView.WrapWith('', '', fragment);
				const cursor = start + fragment.length;
				textarea.setSelectionRange(cursor, cursor);
			} else {
				const {
					range
				} = selection;
				editor.selection.SetSelection(range);
				range.deleteContents();
				range.collapse(true);
				editor.selection.SetSelection(range);
				editor.InsertHtml(fragment, range);
			}
			editor.Focus();
			this.#handleSelectionCapture();
			return true;
		}
		clearSelection() {
			this.#selection = null;
		}
		destroy() {
			if (this.#destroyed) {
				return;
			}
			this.#destroyed = true;
			this.#invalidateSelection();
			this.#fail(new Error(HtmlEditorErrorCode.Destroyed));
			this.#disconnectFiles();
			this.#filesListeners.clear();
			this.#restoreFileParser();
			if (this.#postForm) {
				main_core_events.EventEmitter.unsubscribe(this.#postForm, 'OnEditorIsLoaded', this.#handleEditorChange);
				main_core_events.EventEmitter.unsubscribe(this.#postForm.getEventObject(), 'OnAfterShowLHE', this.#handleEditorChange);
			}
			const editor = this.#editor;
			if (editor) {
				EDITOR_EVENTS.forEach(event => main_core_events.EventEmitter.unsubscribe(editor, event, this.#handleEditorChange));
				SELECTION_EVENTS.forEach(event => main_core_events.EventEmitter.unsubscribe(editor, event, this.#invalidateSelection));
				SELECTION_CAPTURE_EVENTS.forEach(event => {
					main_core_events.EventEmitter.unsubscribe(editor, event, this.#handleSelectionCapture);
				});
				main_core_events.EventEmitter.unsubscribe(editor, 'OnAfterIframeInit', this.#handleIframeInit);
			}
			this.#unbindReadonly(this.#readonlyDocument);
			this.#unbindReadonly(this.#readonlyTextarea);
			this.#readonlyDocument = null;
			this.#readonlyTextarea = null;
			this.#postForm = null;
			this.#editor = null;
		}
		#connect = () => {
			this.#lookupTimer = null;
			if (this.#destroyed) {
				return;
			}
			try {
				const runtime = window;
				const postForm = runtime.LHEPostForm?.getHandler(this.#options.editorId);
				const editor = postForm?.getEditor() ?? runtime.BXHtmlEditor?.Get(this.#options.editorId);
				if (!postForm || !editor) {
					this.#lookupTimer = window.setTimeout(this.#connect, LOOKUP_INTERVAL);
					return;
				}
				if (postForm.getFormId() !== this.#options.formId || editor.id !== this.#options.editorId) {
					throw new Error(HtmlEditorErrorCode.InitializationFailed);
				}
				this.#postForm = postForm;
				this.#editor = editor;
				this.#connectFiles();
				main_core_events.EventEmitter.subscribe(postForm, 'OnEditorIsLoaded', this.#handleEditorChange);
				main_core_events.EventEmitter.subscribe(postForm.getEventObject(), 'OnAfterShowLHE', this.#handleEditorChange);
				EDITOR_EVENTS.forEach(event => main_core_events.EventEmitter.subscribe(editor, event, this.#handleEditorChange));
				SELECTION_EVENTS.forEach(event => main_core_events.EventEmitter.subscribe(editor, event, this.#invalidateSelection));
				SELECTION_CAPTURE_EVENTS.forEach(event => {
					main_core_events.EventEmitter.subscribe(editor, event, this.#handleSelectionCapture);
				});
				main_core_events.EventEmitter.subscribe(editor, 'OnAfterIframeInit', this.#handleIframeInit);
				if (editor.sandbox?.inited) {
					const iframeDocument = editor.sandbox.GetDocument();
					if (iframeDocument.body !== editor.iframeView?.element || !iframeDocument.head?.innerHTML) {
						this.#reinitializing = true;
						editor.CheckAndReInit();
					}
				}
				main_core_events.EventEmitter.emit(postForm.getEventObject(), 'OnShowLHE', new main_core_events.BaseEvent({
					compatData: ['justShow', false]
				}));
				this.#handleEditorChange();
			} catch (error) {
				this.#fail(error instanceof Error ? error : new Error(HtmlEditorErrorCode.InitializationFailed));
			}
		};
		#handleIframeInit = () => {
			this.#invalidateSelection();
			this.#reinitializing = false;
			this.#handleEditorChange();
		};
		#handleEditorChange = () => {
			if (this.#destroyed || !this.#editor) {
				return;
			}
			try {
				this.#applyReadonly();
				this.#connectFiles();
				this.#ensureFileParser();
				this.#restoreInlineTags();
				if (this.#postForm?.isReady && !this.#reinitializing && this.#hasReadyDocument(this.#editor)) {
					this.#ready = true;
					this.#clearTimers();
					this.#resolveReady?.();
					this.#resolveReady = null;
					this.#rejectReady = null;
				}
			} catch (error) {
				this.#fail(error instanceof Error ? error : new Error(HtmlEditorErrorCode.InitializationFailed));
			}
		};
		#hasReadyDocument(editor) {
			return editor.sandbox?.inited === true && editor.dom.textarea !== undefined && editor.iframeView?.element !== undefined && editor.sandbox.GetDocument().body === editor.iframeView.element;
		}
		#invalidateSelection = () => {
			const onInvalidated = this.#selection?.onInvalidated;
			this.#lastSelection = null;
			this.clearSelection();
			onInvalidated?.();
		};
		#handleSelectionCapture = () => {
			if (this.#options.canEdit && this.isReady()) {
				const selection = this.#captureSelection();
				if (selection) {
					this.#lastSelection = selection;
					this.#hasSelectionHistory = true;
				}
			}
		};
		#captureSelection() {
			const editor = this.#editor;
			const sandbox = editor?.sandbox;
			const body = editor?.iframeView?.element;
			if (!editor || !sandbox || !body || !this.isReady()) {
				return null;
			}
			const context = {
				editor,
				document: sandbox.GetDocument(),
				body,
				view: editor.GetViewMode()
			};
			if (editor.synchro.IsFocusedOnTextarea()) {
				const textarea = editor.textareaView.element;
				return {
					...context,
					kind: 'source',
					textarea,
					value: textarea.value,
					start: textarea.selectionStart,
					end: textarea.selectionEnd,
					direction: textarea.selectionDirection
				};
			}
			const range = editor.selection.GetRange(undefined, false);
			return range && this.#isRangeValid(range, context.body) ? {
				...context,
				kind: 'wysiwyg',
				range: range.cloneRange()
			} : null;
		}
		#isSelectionCurrent(selection) {
			const editor = this.#editor;
			if (!editor || !this.isReady() || editor !== selection.editor || editor.sandbox?.GetDocument() !== selection.document || editor.iframeView?.element !== selection.body || editor.GetViewMode() !== selection.view || editor.synchro.IsFocusedOnTextarea() !== (selection.kind === 'source')) {
				return false;
			}
			if (selection.kind === 'source') {
				return editor.textareaView.element === selection.textarea && selection.textarea.value === selection.value;
			}
			return this.#isRangeValid(selection.range, selection.body);
		}
		#isRangeValid(range, body) {
			try {
				return range.isValid() && body.contains(range.startContainer) && body.contains(range.endContainer);
			} catch {
				return false;
			}
		}
		#connectFiles = () => {
			if (this.#destroyed || this.#fileControl) {
				return;
			}
			if (this.#fileLookupTimer !== null) {
				window.clearTimeout(this.#fileLookupTimer);
				this.#fileLookupTimer = null;
			}
			const control = disk_uploader_userFieldWidget.UserFieldControl.getById(this.#options.formId);
			if (!control) {
				if (Date.now() < this.#fileLookupDeadline) {
					this.#fileLookupTimer = window.setTimeout(this.#connectFiles, LOOKUP_INTERVAL);
				}
				return;
			}
			this.#fileControl = control;
			const uploader = control.getUploader();
			this.#uploader = uploader;
			FILE_EVENTS.forEach(event => uploader.subscribe(event, this.#handleFilesChange));
			uploader.subscribe('File:onAdd', this.#handleFileAdd);
			uploader.subscribe('File:onRemove', this.#handleFileRemove);
			ITEM_EVENTS.forEach(event => control.subscribe(event, this.#handleFilesChange));
			control.subscribe('Item:onRemove', this.#handleItemRemove);
			const integration = control.getMainPostForm();
			if (integration) {
				main_core_events.EventEmitter.subscribe(integration, 'onReady', this.#handleEditorChange);
			}
			this.#ensureFileParser();
			this.#restoreInlineTags();
			this.#handleFilesChange();
		};
		#disconnectFiles() {
			if (this.#fileLookupTimer !== null) {
				window.clearTimeout(this.#fileLookupTimer);
				this.#fileLookupTimer = null;
			}
			if (this.#filesTimer !== null) {
				window.clearTimeout(this.#filesTimer);
				this.#filesTimer = null;
			}
			const uploader = this.#uploader;
			if (uploader) {
				FILE_EVENTS.forEach(event => uploader.unsubscribe(event, this.#handleFilesChange));
				uploader.unsubscribe('File:onAdd', this.#handleFileAdd);
				uploader.unsubscribe('File:onRemove', this.#handleFileRemove);
			}
			const control = this.#fileControl;
			if (control) {
				ITEM_EVENTS.forEach(event => control.unsubscribe(event, this.#handleFilesChange));
				control.unsubscribe('Item:onRemove', this.#handleItemRemove);
				const integration = control.getMainPostForm();
				if (integration) {
					main_core_events.EventEmitter.unsubscribe(integration, 'onReady', this.#handleEditorChange);
				}
			}
			this.#uploader = null;
			this.#fileControl = null;
		}
		#handleFileAdd = event => {
			const file = event.getData()?.file;
			if (this.#destroyed || !file) {
				return;
			}
			const id = this.#normalizeFileId(file.getServerFileId());
			if (id) {
				this.#removedFiles.delete(id);
			}
			this.#handleFilesChange();
		};
		#handleFileRemove = event => {
			const file = event.getData()?.file;
			if (file) {
				this.#removeFile(file.getServerFileId());
			}
		};
		#handleItemRemove = event => {
			const item = event.getData()?.item;
			if (item) {
				this.#removeFile(item.serverFileId);
			}
		};
		#removeFile(serverFileId) {
			if (this.#destroyed || !this.#options.canEdit) {
				return;
			}
			const id = this.#normalizeFileId(serverFileId);
			if (id) {
				this.#files.delete(id);
				this.#removedFiles.add(id);
				this.#removeInlineImages();
			}
			this.#handleFilesChange();
		}
		#handleFilesChange = () => {
			if (this.#destroyed) {
				return;
			}
			if (this.#filesTimer !== null) {
				window.clearTimeout(this.#filesTimer);
			}
			this.#filesTimer = window.setTimeout(() => {
				this.#filesTimer = null;
				this.#syncFiles();
			}, 0);
			this.#syncFiles();
		};
		#syncFiles() {
			let pending = this.#filesTimer !== null;
			let failed = false;
			for (const file of this.#uploader?.getFiles() ?? []) {
				const id = this.#normalizeFileId(file.getServerFileId());
				if (id && this.#removedFiles.has(id)) {
					continue;
				}
				if (file.isFailed()) {
					failed = true;
				} else if (!file.isComplete() || !id) {
					pending = true;
				} else {
					this.#files.add(id);
				}
			}
			const files = [...this.#files];
			if (this.#fileState.pending === pending && this.#fileState.failed === failed && files.length === this.#fileState.files.length && files.every((id, index) => id === this.#fileState.files[index])) {
				return;
			}
			this.#fileState = {
				files,
				pending,
				failed
			};
			this.#filesListeners.forEach(listener => listener({
				files: [...files],
				pending,
				failed
			}));
		}
		#normalizeFileId(id) {
			if ((main_core.Type.isString(id) || main_core.Type.isInteger(id)) && /^n?[1-9]\d*$/.test(String(id))) {
				return String(id);
			}
			return null;
		}
		#requireFilesReady() {
			this.#syncFiles();
			if (this.#fileState.failed) {
				throw new Error(HtmlEditorErrorCode.FilesFailed);
			}
			if (this.#fileState.pending) {
				throw new Error(HtmlEditorErrorCode.FilesPending);
			}
		}
		#ensureFileParser() {
			const editor = this.#editor;
			const integration = this.#fileControl?.getMainPostForm();
			if (!editor || !this.#hasReadyDocument(editor) || integration?.getHtmlEditor() !== editor || !integration?.getParser() || this.#phpParser === editor.phpParser) {
				return;
			}
			this.#restoreFileParser();
			this.#phpParser = editor.phpParser;
			this.#previousFileNode = this.#phpParser.GetBxNode(DISK_PARSER_ID);
			this.#phpParser.AddBxNode(DISK_PARSER_ID, this.#fileNode);
		}
		#restoreFileParser() {
			if (this.#phpParser?.GetBxNode(DISK_PARSER_ID) === this.#fileNode) {
				this.#phpParser.AddBxNode(DISK_PARSER_ID, this.#previousFileNode);
			}
			this.#phpParser = null;
			this.#previousFileNode = null;
		}
		#parseFileNode(params, bxid) {
			const editor = this.#editor;
			const node = editor?.sandbox?.GetDocument().getElementById(bxid);
			if (!editor || !node) {
				return this.#previousFileNode?.Parse(params, bxid) ?? '';
			}
			const tag = editor.GetBxTag(bxid);
			const id = this.#normalizeFileId(tag.serverFileId ?? tag.fileId);
			if (node.tagName === 'IMG' && id) {
				return this.#removedFiles.has(id) ? '' : this.#cloneFileImage(node, id).outerHTML;
			}
			return node.cloneNode(true).outerHTML;
		}
		#restoreInlineTags() {
			const editor = this.#editor;
			const sandbox = editor?.sandbox;
			const body = editor?.iframeView?.element;
			if (!editor || !sandbox || !body || !this.#phpParser || !this.#hasReadyDocument(editor)) {
				return;
			}
			const files = this.#uploader?.getFiles() ?? [];
			const iframeDocument = sandbox.GetDocument();
			body.querySelectorAll('img').forEach(image => {
				const id = this.#getImageFileId(image);
				if (!id) {
					return;
				}
				const file = files.find(item => this.#normalizeFileId(item.getServerFileId()) === id);
				const serverFileId = file?.getServerFileId() ?? (id.startsWith('n') ? id : Number(id));
				let tag = editor.GetBxTag(image);
				if (image.id && (!/^bxid\d{1,9}$/i.test(image.id) || iframeDocument.getElementById(image.id) !== image)) {
					image.setAttribute('id', editor.SetBxTag(false, {
						...tag,
						id: undefined,
						tag: DISK_PARSER_ID,
						serverFileId,
						fileId: serverFileId,
						mailTemplateImageId: tag.mailTemplateImageId ?? image.id
					}));
					tag = editor.GetBxTag(image);
				}
				if (tag.tag !== DISK_PARSER_ID || tag.serverFileId !== serverFileId || tag.fileId !== serverFileId) {
					editor.SetBxTag(image, {
						...tag,
						tag: DISK_PARSER_ID,
						serverFileId,
						fileId: serverFileId
					});
				}
				const previewUrl = file?.getServerPreviewUrl();
				if (image.getAttribute('src') === `bxacid:${id}` && main_core.Type.isStringFilled(previewUrl)) {
					image.setAttribute('src', previewUrl);
					image.setAttribute('data-bx-orig-src', previewUrl);
				}
			});
		}
		#getImageFileId(image) {
			const source = image.getAttribute('src') ?? '';
			const canonical = /^(?:https?:\/\/)?bxacid:(n?[1-9]\d*)$/i.exec(source);
			const preview = /[&?]__bxacid=(n?[1-9]\d*)(?:[#&]|$)/.exec(source);
			const tag = this.#editor?.GetBxTag(image);
			return canonical?.[1] ?? preview?.[1] ?? (tag?.tag === DISK_PARSER_ID ? this.#normalizeFileId(tag.serverFileId ?? tag.fileId) : null);
		}
		#cloneFileImage(image, id) {
			const clone = image.cloneNode(true);
			const originalId = this.#editor?.GetBxTag(image).mailTemplateImageId;
			if (originalId) {
				clone.id = originalId;
			}
			const source = clone.getAttribute('src');
			if (source && !/^(?:https?:\/\/)?bxacid:/i.test(source)) {
				clone.setAttribute('data-bx-orig-src', source);
			}
			clone.setAttribute('src', `bxacid:${id}`);
			return clone;
		}
		#serializeImages(content) {
			const template = document.createElement('template');
			return content.replaceAll(/<!--[\S\s]*?-->|<(script|style|textarea|title)\b(?:[^"'<>]|"[^"]*"|'[^']*')*>[\S\s]*?<\/\1\s*>|<(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi, markup => {
				if (!/^<img\b/i.test(markup)) {
					return markup;
				}
				template.innerHTML = markup;
				const image = template.content.querySelector('img');
				if (!image) {
					return markup;
				}
				const id = this.#getImageFileId(image);
				if (!id) {
					return markup;
				}
				if (this.#removedFiles.has(id)) {
					return '';
				}
				return image.getAttribute('src') === `bxacid:${id}` ? markup : this.#cloneFileImage(image, id).outerHTML;
			});
		}
		#removeInlineImages() {
			const editor = this.#editor;
			const body = editor?.iframeView?.element;
			if (!editor || !body || !this.isReady()) {
				return;
			}
			const images = [...body.querySelectorAll('img')].filter(image => {
				const id = this.#getImageFileId(image);
				return id !== null && this.#removedFiles.has(id);
			});
			if (images.length > 0) {
				this.#invalidateSelection();
				images.forEach(image => image.remove());
			}
			const content = editor.GetContent();
			const nextContent = this.#serializeImages(content);
			if (content !== nextContent) {
				editor.SetContent(nextContent, true);
			}
		}
		#applyReadonly() {
			if (this.#options.canEdit || !this.#editor) {
				return;
			}
			const {
				dom,
				iframeView,
				sandbox
			} = this.#editor;
			if (dom.textarea) {
				dom.textarea.readOnly = true;
				if (this.#readonlyTextarea !== dom.textarea) {
					this.#unbindReadonly(this.#readonlyTextarea);
					this.#readonlyTextarea = dom.textarea;
					this.#bindReadonly(this.#readonlyTextarea);
				}
			}
			if (iframeView?.element && sandbox?.inited) {
				iframeView.Disable();
				const iframeDocument = sandbox.GetDocument();
				if (this.#readonlyDocument !== iframeDocument) {
					this.#unbindReadonly(this.#readonlyDocument);
					this.#readonlyDocument = iframeDocument;
				}
				this.#bindReadonly(iframeDocument);
			}
			const toolbars = this.#postForm?.getEventObject().querySelectorAll('[data-bx-role="toolbar"]');
			[dom.toolbarCont, ...(toolbars ?? [])].forEach(toolbar => {
				if (toolbar) {
					main_core.Dom.attr(toolbar, 'hidden', '');
					main_core.Dom.style(toolbar, 'display', 'none');
				}
			});
		}
		#bindReadonly(target) {
			MUTATION_EVENTS.forEach(event => main_core.Event.bind(target, event, this.#preventMutation, true));
			MOUSE_EVENTS.forEach(event => main_core.Event.bind(target, event, this.#stopNativeHandler, true));
			main_core.Event.bind(target, 'keydown', this.#handleReadonlyKey, true);
			main_core.Event.bind(target, 'keyup', this.#handleReadonlyKey, true);
		}
		#unbindReadonly(target) {
			if (!target) {
				return;
			}
			MUTATION_EVENTS.forEach(event => main_core.Event.unbind(target, event, this.#preventMutation, true));
			MOUSE_EVENTS.forEach(event => main_core.Event.unbind(target, event, this.#stopNativeHandler, true));
			main_core.Event.unbind(target, 'keydown', this.#handleReadonlyKey, true);
			main_core.Event.unbind(target, 'keyup', this.#handleReadonlyKey, true);
		}
		#preventMutation = event => {
			event.preventDefault();
			event.stopImmediatePropagation();
		};
		#stopNativeHandler = event => {
			event.stopImmediatePropagation();
		};
		#handleReadonlyKey = event => {
			event.stopImmediatePropagation();
			const {
				key,
				code,
				ctrlKey,
				metaKey,
				altKey,
				shiftKey
			} = event;
			const copyOrSelect = (ctrlKey || metaKey) && !altKey && (['a', 'c'].includes(key.toLowerCase()) || ['KeyA', 'KeyC'].includes(code));
			const copyWithInsert = ctrlKey && !shiftKey && key === 'Insert';
			const contextMenu = shiftKey && key === 'F10';
			if (!NAVIGATION_KEYS.has(key) && !copyOrSelect && !copyWithInsert && !contextMenu) {
				event.preventDefault();
			}
		};
		#fail(error) {
			this.#ready = false;
			this.#clearTimers();
			this.#rejectReady?.(error);
			this.#resolveReady = null;
			this.#rejectReady = null;
		}
		#clearTimers() {
			if (this.#lookupTimer !== null) {
				window.clearTimeout(this.#lookupTimer);
				this.#lookupTimer = null;
			}
			if (this.#readyTimer !== null) {
				window.clearTimeout(this.#readyTimer);
				this.#readyTimer = null;
			}
		}
	}

	function createEditorStore(initialData) {
		const state = ui_vue3.reactive({
			...initialData,
			access: initialData.access.map(([entityId, id]) => [entityId, id]),
			files: [...initialData.files],
			entityTypes: initialData.entityTypes.map(entityType => ({
				...entityType
			})),
			placeholderMaps: initialData.placeholderMaps.map(map => ({
				...map,
				fields: map.fields.map(field => ({
					...field
				}))
			})),
			senders: initialData.senders.map(sender => ({
				...sender
			})),
			copilotParams: {
				...initialData.copilotParams
			},
			paths: {
				...initialData.paths
			},
			ready: false,
			busy: false,
			uploadsPending: false,
			uploadsFailed: false,
			errors: []
		});
		return {
			state,
			get canSave() {
				return state.canEdit && state.ready && !state.busy && !state.uploadsPending && !state.uploadsFailed;
			},
			setField(field, value) {
				if (!state.canEdit || state.busy) {
					return;
				}
				if (field === 'access') {
					state.access = value.map(([entityId, id]) => [entityId, id]);
				} else {
					const editableFields = state;
					editableFields[field] = value;
				}
			},
			setReady(ready) {
				state.ready = ready;
			},
			setBusy(busy) {
				state.busy = busy;
			},
			setErrors(errors) {
				state.errors = errors.map(error => ({
					...error
				}));
			},
			syncBody(bodyHtml) {
				if (state.canEdit) {
					state.bodyHtml = bodyHtml;
				}
			},
			syncFiles(fileState) {
				state.uploadsPending = fileState.pending;
				state.uploadsFailed = fileState.failed;
				if (state.canEdit) {
					state.files = [...fileState.files];
				}
			},
			syncSnapshot(snapshot) {
				if (state.canEdit) {
					state.bodyHtml = snapshot.bodyHtml;
					state.files = [...snapshot.files];
				}
			}
		};
	}

	class EditorService {
		async save(id, fields) {
			let response = null;
			try {
				response = await main_core.ajax.runComponentAction('bitrix:crm.mail_template.editor', 'save', {
					mode: 'class',
					json: {
						id,
						fields
					}
				});
			} catch (error) {
				return {
					success: false,
					errors: this.#getErrors(error)
				};
			}
			const data = this.#getSavedTemplate(response, id);
			if (!data) {
				return {
					success: false,
					errors: this.#getErrors(response, 'INVALID_RESPONSE')
				};
			}
			return {
				success: true,
				data
			};
		}
		#getSavedTemplate(response, id) {
			if (!main_core.Type.isPlainObject(response) || response.status !== 'success' || !main_core.Type.isArray(response.errors) || response.errors.length > 0 || !main_core.Type.isPlainObject(response.data)) {
				return null;
			}
			const {
				reference,
				operation
			} = response.data;
			if (!main_core.Type.isPlainObject(reference) || reference.source !== 'crm' || !main_core.Type.isInteger(reference.id) || reference.id <= 0 || operation !== 'create' && operation !== 'update' || operation !== (id > 0 ? 'update' : 'create') || id > 0 && reference.id !== id) {
				return null;
			}
			return {
				reference: {
					source: 'crm',
					id: reference.id
				},
				operation
			};
		}
		#getErrors(response, fallbackCode = 'SAVE_FAILED') {
			const fallback = {
				code: fallbackCode,
				message: main_core.Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_SAVE_ERROR') ?? ''
			};
			if (!main_core.Type.isPlainObject(response) || !main_core.Type.isArray(response.errors)) {
				return [fallback];
			}
			const fields = new Set(['title', 'entityTypeId', 'access', 'isActive', 'emailFrom', 'subject', 'bodyHtml', 'files']);
			const errors = [];
			for (const error of response.errors) {
				if (!main_core.Type.isPlainObject(error)) {
					continue;
				}
				const code = main_core.Type.isString(error.code) || main_core.Type.isNumber(error.code) ? String(error.code) : fallbackCode;
				const message = this.#getErrorMessage(code, error.message, fallback.message);
				const candidate = main_core.Type.isPlainObject(error.customData) ? error.customData.field : undefined;
				const field = main_core.Type.isString(candidate) && fields.has(candidate) ? candidate : undefined;
				errors.push({
					code,
					message,
					field
				});
			}
			return errors.length > 0 ? errors : [fallback];
		}
		#getErrorMessage(code, message, fallback) {
			if (code === 'NETWORK_ERROR') {
				return main_core.Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_NETWORK_ERROR') ?? '';
			}
			const localizedCodes = new Set(['FEATURE_DISABLED', 'ACCESS_DENIED', 'NOT_FOUND', 'VALIDATION_ERROR', 'SAVE_FAILED']);
			return localizedCodes.has(code) && main_core.Type.isStringFilled(message) ? message : fallback;
		}
	}
	const editorService = new EditorService();

	const EditorActions = ui_vue3.defineComponent({
		name: 'CrmMailTemplateEditorActions',
		components: {
			UiButton: ui_vue3_components_button.Button,
			Alert: ui_system_alert_vue.Alert,
			TextSm: ui_system_typography_vue.TextSm
		},
		props: {
			store: {
				type: Object,
				required: true
			}
		},
		emits: ['save', 'cancel'],
		expose: ['focusErrors'],
		setup() {
			return {
				Loc: main_core.Loc,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				AlertDesign: ui_system_alert.AlertDesign
			};
		},
		computed: {
			errors() {
				const fields = new Set(['title', 'entityTypeId', 'access', 'isActive', 'emailFrom', 'subject']);
				return this.store.state.errors.filter(error => !fields.has(error.field ?? ''));
			}
		},
		methods: {
			focusErrors() {
				this.$refs.errors?.focus();
			},
			handleSave() {
				if (this.store.canSave) {
					this.$emit('save');
				}
			},
			handleCancel() {
				if (!this.store.state.busy) {
					this.$emit('cancel');
				}
			}
		},
		template: `
		<div class="crm-mail-template-editor__actions" data-testid="crm-mail-template-editor-actions">
			<div
				v-if="errors.length > 0"
				ref="errors"
				class="crm-mail-template-editor__errors"
				role="alert"
				tabindex="-1"
				data-testid="crm-mail-template-save-errors"
			>
				<Alert :design="AlertDesign.tintedAlert">
					<TextSm
						v-for="(error, index) in errors"
						:key="index"
						tag="div"
						class="crm-mail-template-editor__error"
						wrap="break-words"
					>{{ error.message }}</TextSm>
				</Alert>
			</div>
			<div class="crm-mail-template-editor__buttons">
				<UiButton
					:text="Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_SAVE')"
					:style="AirButtonStyle.FILLED"
					:size="ButtonSize.LARGE"
					:disabled="!store.canSave"
					:loading="store.state.busy"
					:dataset="{ testid: 'crm-mail-template-save' }"
					type="button"
					@click="handleSave"
				/>
				<UiButton
					:text="Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_CANCEL')"
					:style="AirButtonStyle.PLAIN"
					:size="ButtonSize.LARGE"
					:disabled="store.state.busy"
					:dataset="{ testid: 'crm-mail-template-cancel' }"
					type="button"
					@click="handleCancel"
				/>
			</div>
		</div>
	`
	});

	const EditorHost = ui_vue3.defineComponent({
		name: 'CrmMailTemplateEditorHost',
		components: {
			TextSm: ui_system_typography_vue.TextSm
		},
		props: {
			editorContainerId: {
				type: String,
				required: true
			},
			adapter: {
				type: Object,
				required: true
			},
			store: {
				type: Object,
				required: true
			}
		},
		emits: ['ready', 'error'],
		setup() {
			return {
				Loc: main_core.Loc,
				nativeHost: ui_vue3.markRaw({
					container: null,
					parent: null,
					nextSibling: null,
					hidden: false,
					unmounted: false,
					unsubscribeFiles: null
				})
			};
		},
		async mounted() {
			try {
				const container = document.getElementById(this.editorContainerId);
				const host = this.$refs.host;
				if (!container || !container.parentNode || container.contains(host)) {
					throw new Error(HtmlEditorErrorCode.ContainerUnavailable);
				}
				this.adapter.prepareToMove();
				this.nativeHost.container = container;
				this.nativeHost.parent = container.parentNode;
				this.nativeHost.nextSibling = container.nextSibling;
				this.nativeHost.hidden = container.hidden;
				main_core.Dom.append(container, host);
				container.hidden = false;
				this.nativeHost.unsubscribeFiles = this.adapter.subscribeFiles(fileState => {
					this.store.syncFiles(fileState);
				});
				await this.adapter.start();
				if (!this.nativeHost.unmounted) {
					this.$emit('ready');
				}
			} catch (error) {
				this.nativeHost.unsubscribeFiles?.();
				this.nativeHost.unsubscribeFiles = null;
				this.adapter.destroy();
				if (!this.nativeHost.unmounted) {
					this.$emit('error', error);
				}
			}
		},
		beforeUnmount() {
			this.nativeHost.unmounted = true;
			this.nativeHost.unsubscribeFiles?.();
			this.nativeHost.unsubscribeFiles = null;
			try {
				this.adapter.prepareToMove();
			} finally {
				this.adapter.destroy();
				const {
					container,
					parent,
					nextSibling,
					hidden
				} = this.nativeHost;
				if (container && parent?.isConnected) {
					container.hidden = hidden;
					if (nextSibling?.parentNode === parent) {
						main_core.Dom.insertBefore(container, nextSibling);
					} else {
						main_core.Dom.append(container, parent);
					}
				}
			}
		},
		template: `
		<div ref="host" class="crm-mail-template-editor__host" data-testid="crm-mail-template-editor-host"/>
		<TextSm
			v-if="store.state.uploadsPending || store.state.uploadsFailed"
			class="crm-mail-template-editor__files-status"
			tag="div"
			wrap="break-words"
			:role="store.state.uploadsFailed ? 'alert' : 'status'"
		>
			{{ Loc.getMessage(store.state.uploadsFailed
				? 'CRM_MAIL_TEMPLATE_EDITOR_FILES_UPLOAD_ERROR'
				: 'CRM_MAIL_TEMPLATE_EDITOR_FILES_UPLOADING') }}
		</TextSm>
	`
	});

	function getInput(component) {
		return component?.$el.querySelector('input') ?? null;
	}
	function getFieldError(store, field) {
		return store.state.errors.filter(error => error.field === field).map(error => error.message).join('\n');
	}
	const EditorProperties = ui_vue3.defineComponent({
		name: 'CrmMailTemplateEditorProperties',
		components: {
			BInput: ui_system_input_vue.BInput,
			Chip: ui_system_chip_vue.Chip,
			BMenu: ui_system_menu_vue.BMenu,
			TextSm: ui_system_typography_vue.TextSm,
			Switcher: ui_vue3_components_switcher.Switcher
		},
		props: {
			store: {
				type: Object,
				required: true
			}
		},
		expose: ['focusTitle', 'focusField'],
		setup() {
			const accessControl = {
				selector: null,
				dialog: null,
				initialized: false,
				disposed: false,
				openRequested: false
			};
			return {
				Loc: main_core.Loc,
				InputDesign: ui_system_input_vue.InputDesign,
				InputSize: ui_system_input_vue.InputSize,
				ChipDesign: ui_system_chip_vue.ChipDesign,
				ChipSize: ui_system_chip_vue.ChipSize,
				fieldId: `crm-mail-template-properties-${main_core.Text.getRandom()}`,
				accessControl: ui_vue3.markRaw(accessControl)
			};
		},
		data() {
			return {
				isTypeMenuShown: false,
				accessLoadFailed: false
			};
		},
		computed: {
			isDisabled() {
				return !this.store.state.canEdit || this.store.state.busy;
			},
			titleError() {
				return getFieldError(this.store, 'title');
			},
			entityTypeError() {
				return getFieldError(this.store, 'entityTypeId');
			},
			accessError() {
				const errors = [getFieldError(this.store, 'access')];
				if (this.accessLoadFailed) {
					errors.unshift(main_core.Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_ACCESS_LOAD_ERROR') ?? '');
				}
				return errors.filter(message => message !== '').join('\n');
			},
			activityError() {
				return getFieldError(this.store, 'isActive');
			},
			currentEntityType() {
				const {
					entityTypeId,
					entityTypes,
					placeholderMaps
				} = this.store.state;
				const currentType = entityTypes.find(type => type.id === entityTypeId);
				if (currentType) {
					return currentType;
				}
				const name = placeholderMaps.find(map => map.typeId === entityTypeId)?.typeName ?? main_core.Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_ENTITY_TYPE_CURRENT', {
					'#ID#': String(entityTypeId)
				}) ?? '';
				return {
					id: entityTypeId,
					name
				};
			},
			entityTypeMenuOptions() {
				const types = [...this.store.state.entityTypes];
				if (!types.some(type => type.id === this.store.state.entityTypeId)) {
					types.unshift(this.currentEntityType);
				}
				return {
					bindElement: this.$refs.entityType.$el,
					className: 'crm-mail-template-editor__choice-menu',
					maxWidth: this.$el.getBoundingClientRect().width,
					closeOnItemClick: true,
					items: types.map(type => ({
						id: `crm-mail-template-entity-type-${type.id}`,
						title: type.name,
						isSelected: type.id === this.store.state.entityTypeId,
						onClick: () => this.handleEntityTypeSelect(type.id)
					}))
				};
			},
			isPersonal() {
				return this.store.state.access.every(([entityId, id]) => this.isOwner(entityId, id));
			}
		},
		watch: {
			isDisabled() {
				this.isTypeMenuShown = false;
				this.updateAccessAvailability();
			},
			titleError() {
				this.updateTitleAccessibility();
			}
		},
		mounted() {
			this.updateTitleAccessibility();
			this.createAccessSelector();
		},
		beforeUnmount() {
			this.accessControl.disposed = true;
			if (this.accessControl.selector) {
				main_core.Event.unbind(this.accessControl.selector.getAddButtonLink(), 'click', this.handleAccessOpen, true);
			}
			this.isTypeMenuShown = false;
			this.updateAccessAvailability();
			if (!this.accessControl.dialog?.isLoading()) {
				this.destroyAccessDialog();
			}
		},
		methods: {
			focusTitle() {
				this.focusField('title');
			},
			focusField(field) {
				let target = null;
				switch (field) {
					case 'title':
						target = getInput(this.$refs.title);
						break;
					case 'entityTypeId':
						target = this.$refs.entityType?.$el ?? null;
						break;
					case 'access':
						target = this.accessControl.initialized ? this.accessControl.selector?.getAddButtonLink() ?? null : this.$refs.access;
						break;
					case 'isActive':
						target = this.$refs.active?.switcher?.getNode() ?? null;
						break;
					default:
						return false;
				}
				if (!target) {
					return false;
				}
				target.scrollIntoView({
					block: 'nearest'
				});
				target.focus({
					preventScroll: true
				});
				return true;
			},
			updateTitleAccessibility() {
				const input = getInput(this.$refs.title);
				if (input) {
					main_core.Dom.attr(input, {
						id: `${this.fieldId}-title`,
						'aria-required': 'true',
						'aria-invalid': this.titleError ? 'true' : null,
						'aria-describedby': this.titleError ? `${this.fieldId}-title-error` : null
					});
				}
			},
			handleTitleInput(value) {
				this.store.setField('title', value);
			},
			handleTypeMenu() {
				if (!this.isDisabled) {
					this.isTypeMenuShown = !this.isTypeMenuShown;
				}
			},
			handleEntityTypeSelect(id) {
				this.store.setField('entityTypeId', id);
				this.isTypeMenuShown = false;
			},
			isOwner(entityId, id) {
				return entityId === 'user' && String(id) === String(this.store.state.ownerId);
			},
			createAccessSelector() {
				const preselectedItems = this.store.state.access.filter(([entityId, id]) => !this.isOwner(entityId, id));
				const selector = new ui_entitySelector.TagSelector({
					readonly: !this.store.state.canEdit,
					locked: true,
					addButtonCaption: main_core.Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_ACCESS_SELECT') ?? '',
					addButtonCaptionMore: main_core.Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_ACCESS_ADD') ?? '',
					dialogOptions: {
						targetNode: this.$refs.access,
						context: 'PROVIDING-ACCESS-TO-TEMPLATE',
						ariaLabel: main_core.Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_ACCESS') ?? '',
						entities: [{
							id: 'user',
							options: {
								inviteEmployeeLink: false,
								'!userId': [this.store.state.ownerId]
							}
						}, {
							id: 'department',
							options: {
								selectMode: 'departmentsOnly'
							}
						}, {
							id: 'meta-user',
							options: {
								'all-users': true
							}
						}],
						preselectedItems,
						events: {
							'Item:onBeforeSelect': this.handleBeforeAccessSelect,
							'Item:onBeforeDeselect': this.handleBeforeAccessDeselect,
							'Item:onSelect': this.handleAccessChange,
							'Item:onDeselect': this.handleAccessChange,
							onLoad: this.handleAccessLoad,
							onLoadError: this.handleAccessLoadError
						}
					}
				});
				this.accessControl.selector = selector;
				this.accessControl.dialog = selector.getDialog();
				selector.renderTo(this.$refs.access);
				main_core.Dom.attr(selector.getAddButtonLink(), 'data-testid', 'crm-mail-template-access-select');
				main_core.Event.bind(selector.getAddButtonLink(), 'click', this.handleAccessOpen, true);
				main_core.Dom.attr(selector.getTextBox(), {
					'aria-label': main_core.Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_ACCESS') ?? '',
					'data-testid': 'crm-mail-template-access-search'
				});
				if (preselectedItems.length === 0 || !this.accessControl.dialog?.hasDynamicLoad()) {
					this.handleAccessLoad();
				}
			},
			handleAccessOpen(event) {
				const {
					dialog,
					disposed
				} = this.accessControl;
				if (!dialog || dialog.isLoaded() || !dialog.hasDynamicLoad()) {
					return;
				}
				event.preventDefault();
				event.stopImmediatePropagation();
				if (disposed || this.isDisabled) {
					return;
				}
				this.accessControl.openRequested = true;
				dialog.load();
			},
			handleBeforeAccessSelect(event) {
				const item = event.getData().item;
				if (this.isOwner(item.getEntityId(), item.getId())) {
					event.preventDefault();
				} else {
					this.handleBeforeAccessDeselect(event);
				}
			},
			handleBeforeAccessDeselect(event) {
				if (this.accessControl.disposed || this.accessControl.initialized && this.isDisabled) {
					event.preventDefault();
				}
			},
			handleAccessLoad() {
				if (this.accessControl.disposed) {
					this.destroyAccessDialog();
					return;
				}
				this.accessControl.initialized = true;
				this.accessLoadFailed = false;
				this.updateAccessAvailability();
				if (this.accessControl.openRequested) {
					this.accessControl.openRequested = false;
					this.accessControl.selector?.getAddButtonLink().click();
				}
			},
			handleAccessLoadError() {
				this.accessControl.openRequested = false;
				if (this.accessControl.disposed) {
					this.destroyAccessDialog();
					return;
				}
				this.accessLoadFailed = true;
				this.updateAccessAvailability();
			},
			updateAccessAvailability() {
				const {
					selector,
					dialog,
					initialized,
					disposed
				} = this.accessControl;
				if (disposed || this.isDisabled) {
					this.accessControl.openRequested = false;
				}
				selector?.setReadonly(disposed || !this.store.state.canEdit);
				selector?.setLocked(disposed || this.isDisabled || !initialized || dialog?.isLoading());
				if ((disposed || this.isDisabled) && dialog?.isOpen()) {
					dialog.hide();
				}
			},
			handleAccessChange() {
				const {
					dialog,
					initialized,
					disposed
				} = this.accessControl;
				if (disposed || !initialized || this.isDisabled || !dialog) {
					return;
				}
				const access = dialog.getSelectedItems().filter(item => !this.isOwner(item.getEntityId(), item.getId())).map(item => [item.getEntityId(), item.getId()]);
				this.store.setField('access', access);
			},
			destroyAccessDialog() {
				const {
					dialog,
					selector
				} = this.accessControl;
				this.accessControl.dialog = null;
				this.accessControl.selector = null;
				selector?.setReadonly(true);
				selector?.setLocked(true);
				dialog?.destroy();
			}
		},
		template: `
		<div class="crm-mail-template-editor__properties" data-testid="crm-mail-template-editor-properties">
			<div class="crm-mail-template-editor__field">
				<TextSm class="crm-mail-template-editor__field-label" tag="label" :for="fieldId + '-title'">
					{{ Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_TITLE') }}
					<TextSm class="crm-mail-template-editor__field-required" aria-hidden="true">*</TextSm>
				</TextSm>
				<div class="crm-mail-template-editor__field-content">
					<BInput
						ref="title"
						class="crm-mail-template-editor__input"
						:class="{ '--invalid': titleError, '--readonly': !store.state.canEdit }"
						:modelValue="store.state.title"
						:ariaLabel="Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_TITLE')"
						:design="store.state.busy ? InputDesign.Disabled : InputDesign.Naked"
						:size="InputSize.Md"
						:readonly="isDisabled"
						data-testid="crm-mail-template-title"
						stretched
						@update:modelValue="handleTitleInput"
					/>
					<TextSm
						v-if="titleError"
						:id="fieldId + '-title-error'"
						class="crm-mail-template-editor__field-error"
						wrap="break-words"
						role="alert"
					>{{ titleError }}</TextSm>
				</div>
			</div>
			<div class="crm-mail-template-editor__field">
				<TextSm :id="fieldId + '-type-label'" class="crm-mail-template-editor__field-label">
					{{ Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_ENTITY_TYPE') }}
				</TextSm>
				<div class="crm-mail-template-editor__field-content">
					<Chip
						ref="entityType"
						:id="fieldId + '-type'"
						class="crm-mail-template-editor__type-chip"
						:text="currentEntityType.name"
						:design="isDisabled ? ChipDesign.Disabled : ChipDesign.OutlineNoAccent"
						:size="ChipSize.Md"
						:dropdown="!isDisabled"
						:aria-labelledby="fieldId + '-type-label ' + fieldId + '-type'"
						:aria-disabled="isDisabled"
						aria-expanded="false"
						:tabindex="isDisabled ? -1 : 0"
						aria-haspopup="menu"
						role="button"
						data-testid="crm-mail-template-entity-type"
						@click="handleTypeMenu"
						@keydown.space.prevent="handleTypeMenu"
						@keydown.down.prevent="handleTypeMenu"
					/>
					<BMenu v-if="isTypeMenuShown" :options="entityTypeMenuOptions" @close="isTypeMenuShown = false"/>
					<TextSm v-if="entityTypeError" class="crm-mail-template-editor__field-error" wrap="break-words">
						{{ entityTypeError }}
					</TextSm>
				</div>
			</div>
			<div class="crm-mail-template-editor__field">
				<TextSm :id="fieldId + '-access-label'" class="crm-mail-template-editor__field-label">
					{{ Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_ACCESS') }}
				</TextSm>
				<div class="crm-mail-template-editor__field-content">
					<div
						ref="access"
						class="crm-mail-template-editor__access"
						:aria-labelledby="fieldId + '-access-label'"
						:aria-disabled="isDisabled"
						role="group"
						tabindex="-1"
						data-testid="crm-mail-template-access"
					/>
					<TextSm v-if="isPersonal" class="crm-mail-template-editor__field-hint" wrap="break-words">
						{{ Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_ACCESS_PERSONAL') }}
					</TextSm>
					<TextSm v-if="accessError" class="crm-mail-template-editor__field-error" wrap="break-words" role="alert">
						{{ accessError }}
					</TextSm>
				</div>
			</div>
			<div class="crm-mail-template-editor__field">
				<TextSm :id="fieldId + '-active-label'" class="crm-mail-template-editor__field-label">
					{{ Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_ACTIVE') }}
				</TextSm>
				<div class="crm-mail-template-editor__field-content">
					<Switcher
						ref="active"
						:isChecked="store.state.isActive"
						:isDisabled="isDisabled"
						:options="{
							size: 'small',
							useAirDesign: true,
							accessible: true,
							ariaLabelledBy: fieldId + '-active-label',
						}"
						data-testid="crm-mail-template-active"
						@check="store.setField('isActive', true)"
						@uncheck="store.setField('isActive', false)"
					/>
					<TextSm v-if="activityError" class="crm-mail-template-editor__field-error" wrap="break-words">
						{{ activityError }}
					</TextSm>
				</div>
			</div>
		</div>
	`
	});

	const EditorSender = ui_vue3.defineComponent({
		name: 'CrmMailTemplateEditorSender',
		components: {
			Chip: ui_system_chip_vue.Chip,
			BMenu: ui_system_menu_vue.BMenu,
			TextSm: ui_system_typography_vue.TextSm
		},
		props: {
			store: {
				type: Object,
				required: true
			}
		},
		expose: ['focus'],
		setup() {
			const senderControl = {
				selector: null,
				disposed: false
			};
			return {
				Loc: main_core.Loc,
				ChipDesign: ui_system_chip_vue.ChipDesign,
				ChipSize: ui_system_chip_vue.ChipSize,
				fieldId: `crm-mail-template-sender-${main_core.Text.getRandom()}`,
				senderControl: ui_vue3.markRaw(senderControl)
			};
		},
		data() {
			const {
				emailFrom,
				senders
			} = this.store.state;
			const savedSender = senders.some(sender => sender.value === emailFrom) ? [] : [{
				value: emailFrom,
				label: emailFrom
			}];
			return {
				isMenuShown: false,
				addedSenders: savedSender
			};
		},
		computed: {
			isDisabled() {
				return !this.store.state.canEdit || this.store.state.busy;
			},
			senders() {
				const senders = new Map();
				senders.set('', {
					value: '',
					label: main_core.Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_SENDER_DEFAULT') ?? ''
				});
				[...this.store.state.senders, ...this.addedSenders].forEach(sender => {
					if (sender.value !== '') {
						senders.set(sender.value, sender);
					}
				});
				const savedValue = this.store.state.emailFrom;
				if (!senders.has(savedValue)) {
					senders.set(savedValue, {
						value: savedValue,
						label: savedValue
					});
				}
				return [...senders.values()];
			},
			selectedLabel() {
				return this.senders.find(sender => sender.value === this.store.state.emailFrom)?.label || this.store.state.emailFrom;
			},
			error() {
				return this.store.state.errors.filter(error => error.field === 'emailFrom').map(error => error.message).join('\n');
			},
			menuOptions() {
				const items = this.senders.map((sender, index) => ({
					id: `crm-mail-template-sender-option-${index}`,
					title: sender.label || sender.value,
					isSelected: sender.value === this.store.state.emailFrom,
					onClick: () => this.handleSelect(sender.value)
				}));
				if (this.store.state.canAddSender) {
					items.push({
						id: 'crm-mail-template-sender-add',
						title: main_core.Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_SENDER_ADD') ?? '',
						onClick: this.handleAddSender
					});
				}
				return {
					bindElement: this.$refs.chip.$el,
					className: 'crm-mail-template-editor__choice-menu',
					maxWidth: this.$el.getBoundingClientRect().width,
					closeOnItemClick: true,
					items
				};
			}
		},
		watch: {
			isDisabled() {
				this.isMenuShown = false;
			}
		},
		beforeUnmount() {
			this.senderControl.disposed = true;
			this.senderControl.selector = null;
			this.isMenuShown = false;
		},
		methods: {
			focus() {
				if (this.senderControl.disposed || this.isDisabled) {
					return;
				}
				this.isMenuShown = false;
				this.$refs.chip?.$el.focus();
			},
			handleMenu() {
				if (!this.isDisabled && !this.senderControl.disposed) {
					this.isMenuShown = !this.isMenuShown;
				}
			},
			handleSelect(value) {
				if (!this.senderControl.disposed) {
					this.store.setField('emailFrom', value);
				}
				this.isMenuShown = false;
			},
			handleAddSender() {
				if (this.isDisabled || !this.store.state.canAddSender || this.senderControl.disposed) {
					return;
				}
				this.isMenuShown = false;
				this.senderControl.selector ??= new ui_mail_senderSelector.SenderSelector({
					isSenderAvailable: true
				});
				this.senderControl.selector.showProviderShowcase(this.handleSenderAdded);
			},
			handleSenderAdded(mailbox) {
				if (this.senderControl.disposed || this.isDisabled || !this.store.state.canAddSender) {
					return;
				}
				const value = `${mailbox.name} <${mailbox.email}>`;
				this.addedSenders.push({
					value,
					label: value
				});
				this.store.setField('emailFrom', value);
			}
		},
		template: `
		<div
			class="crm-mail-template-editor__field crm-mail-template-editor__sender"
			data-testid="crm-mail-template-editor-sender"
		>
			<TextSm :id="fieldId + '-label'" class="crm-mail-template-editor__field-label">
				{{ Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_SENDER') }}
			</TextSm>
			<div class="crm-mail-template-editor__field-content">
				<Chip
					ref="chip"
					:id="fieldId"
					class="crm-mail-template-editor__sender_chip"
					:text="selectedLabel"
					:design="isDisabled ? ChipDesign.Disabled : ChipDesign.Tinted"
					:size="ChipSize.Md"
					:dropdown="!isDisabled"
					:aria-labelledby="fieldId + '-label ' + fieldId"
					:aria-disabled="isDisabled"
					aria-expanded="false"
					:tabindex="isDisabled ? -1 : 0"
					aria-haspopup="menu"
					role="button"
					data-testid="crm-mail-template-sender"
					rounded
					@click="handleMenu"
					@keydown.space.prevent="handleMenu"
					@keydown.down.prevent="handleMenu"
				/>
				<BMenu v-if="isMenuShown" :options="menuOptions" @close="isMenuShown = false"/>
				<TextSm v-if="error" class="crm-mail-template-editor__field-error" wrap="break-words" role="alert">
					{{ error }}
				</TextSm>
			</div>
		</div>
	`
	});

	const ENTITY_ID = 'crm-mail-template-placeholder';
	function createGroup(id, title, children) {
		return {
			id: `group:${id}`,
			entityId: ENTITY_ID,
			title,
			children,
			locked: true,
			searchable: false,
			saveable: false,
			customData: {
				marker: null
			}
		};
	}
	function createFields(map, maps, prefix, parentLabels, includeRelations) {
		return map.fields.flatMap((field, sort) => {
			const path = `${prefix}.${field.id}`;
			const title = field.name || field.id;
			const subtitle = parentLabels.join(' / ');
			if (main_core.Type.isNumber(field.typeId)) {
				if (!includeRelations) {
					return [];
				}
				const relatedMap = maps.find(candidate => candidate.typeId === field.typeId);
				const children = relatedMap ? createFields(relatedMap, maps, path, [...parentLabels, title], false) : [];
				return [{
					...createGroup(path, title, children),
					subtitle,
					sort
				}];
			}
			const suffix = field.id.startsWith('UF_') ? `(${field.name})` : '';
			return [{
				id: `field:${path}`,
				entityId: ENTITY_ID,
				title,
				subtitle,
				sort,
				searchable: true,
				saveable: false,
				customData: {
					marker: `#${path}${suffix}#`
				}
			}];
		});
	}
	function createItems(store) {
		const {
			placeholderMaps: maps,
			entityTypeId,
			entityTypes
		} = store.state;
		const items = [];
		const sender = maps.find(map => map.typeName === 'SENDER');
		if (sender) {
			const title = main_core.Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_SENDER') ?? '';
			items.push(createGroup('SENDER', title, createFields(sender, maps, sender.typeName, [title], true)));
		}
		const currentMap = entityTypeId === 0 ? null : maps.find(map => map.typeId === entityTypeId);
		if (currentMap && currentMap !== sender) {
			const title = entityTypes.find(type => type.id === entityTypeId)?.name ?? currentMap.typeName;
			items.push(...createFields(currentMap, maps, currentMap.typeName, [title], true));
		}
		return items.map((item, sort) => ({
			...item,
			sort,
			tabs: ['recents']
		}));
	}
	const PlaceholderSelector = ui_vue3.defineComponent({
		name: 'CrmMailTemplatePlaceholderSelector',
		components: {
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			store: {
				type: Object,
				required: true
			},
			text: {
				type: String,
				required: true
			},
			testId: {
				type: String,
				required: true
			},
			rememberSelection: {
				type: Function,
				required: true
			},
			insertPlaceholder: {
				type: Function,
				required: true
			},
			clearSelection: {
				type: Function,
				required: true
			}
		},
		emits: ['error'],
		expose: ['cancel'],
		setup() {
			const control = {
				dialog: null,
				pendingMarker: null,
				entityTypeId: null,
				disposed: false
			};
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				control: ui_vue3.markRaw(control)
			};
		},
		computed: {
			isAvailable() {
				const {
					canEdit,
					ready,
					busy
				} = this.store.state;
				return canEdit && ready && !busy;
			}
		},
		watch: {
			isAvailable: {
				flush: 'sync',
				handler(available) {
					if (!available) {
						this.cancel();
					}
				}
			},
			'store.state.entityTypeId': {
				flush: 'sync',
				handler() {
					this.cancel();
				}
			}
		},
		mounted() {
			this.updateButtonAccessibility(false);
		},
		beforeUnmount() {
			this.control.disposed = true;
			this.resetSelection();
			const {
				dialog
			} = this.control;
			this.control.dialog = null;
			dialog?.destroy();
		},
		methods: {
			getButton() {
				return this.$refs.button?.button.getContainer() ?? null;
			},
			updateButtonAccessibility(expanded) {
				const button = this.getButton();
				if (button) {
					main_core.Dom.attr(button, {
						'aria-haspopup': 'dialog',
						'aria-expanded': String(expanded)
					});
				}
			},
			prepareSelection() {
				if (!this.isAvailable || this.control.disposed) {
					return false;
				}
				try {
					return this.rememberSelection(this.cancel);
				} catch (error) {
					this.resetSelection();
					this.$emit('error', error);
					return false;
				}
			},
			handlePointerDown(event) {
				if (event.button === 0 && !this.control.dialog) {
					this.prepareSelection();
				}
			},
			handleOpen() {
				if (this.control.dialog || !this.isAvailable || this.control.disposed) {
					this.cancel();
					return;
				}
				const targetNode = this.getButton();
				if (!targetNode || !this.prepareSelection()) {
					return;
				}
				try {
					this.control.entityTypeId = this.store.state.entityTypeId;
					this.control.dialog = new ui_entitySelector.Dialog({
						targetNode,
						multiple: false,
						enableSearch: true,
						dropdownMode: true,
						showAvatars: false,
						compactView: true,
						hideOnSelect: true,
						clearSearchOnSelect: false,
						addTagOnSelect: false,
						cacheable: false,
						ariaLabel: main_core.Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_PLACEHOLDER_DIALOG_ARIA') ?? '',
						entities: [{
							id: ENTITY_ID,
							dynamicLoad: false,
							dynamicSearch: false,
							searchFields: [{
								name: 'marker',
								type: 'string',
								searchable: true
							}]
						}],
						items: createItems(this.store),
						events: {
							'Item:onBeforeSelect': this.handleBeforeSelect,
							'Item:onSelect': this.handleSelect,
							onHide: this.handleHide,
							onDestroy: this.handleDestroy
						}
					});
					main_core.Dom.style(this.control.dialog.getContainer(), 'max-width', 'calc(100vw - 48px)');
					targetNode.focus({
						preventScroll: true
					});
					this.control.dialog.show();
					this.updateButtonAccessibility(true);
				} catch (error) {
					this.cancel();
					this.$emit('error', error);
				}
			},
			handleBeforeSelect(event) {
				const item = event.getData().item;
				if (!this.isAvailable || this.control.disposed || !main_core.Type.isStringFilled(item.getCustomData().get('marker'))) {
					event.preventDefault();
				}
			},
			handleSelect(event) {
				const item = event.getData().item;
				const marker = item.getCustomData().get('marker');
				if (this.isAvailable && !this.control.disposed && main_core.Type.isStringFilled(marker)) {
					this.control.pendingMarker = marker;
				}
			},
			handleHide() {
				const pendingMarker = this.control.pendingMarker;
				const entityTypeId = this.control.entityTypeId;
				this.control.pendingMarker = null;
				this.updateButtonAccessibility(false);
				try {
					if (this.isAvailable && !this.control.disposed && pendingMarker && entityTypeId === this.store.state.entityTypeId) {
						this.insertPlaceholder(pendingMarker);
					}
				} catch (error) {
					this.$emit('error', error);
				} finally {
					this.resetSelection();
				}
			},
			handleDestroy() {
				this.control.dialog = null;
				this.resetSelection();
				this.updateButtonAccessibility(false);
			},
			resetSelection() {
				this.control.pendingMarker = null;
				this.control.entityTypeId = null;
				this.clearSelection();
			},
			cancel() {
				this.resetSelection();
				this.updateButtonAccessibility(false);
				const {
					dialog
				} = this.control;
				if (dialog?.isOpen()) {
					dialog.hide();
				} else {
					this.control.dialog = null;
					dialog?.destroy();
				}
			}
		},
		template: `
		<div
			class="crm-mail-template-editor__placeholder"
			:data-testid="testId + '-container'"
			@pointerdown.capture="handlePointerDown"
		>
			<UiButton
				ref="button"
				:text="text"
				:size="ButtonSize.SMALL"
				:style="AirButtonStyle.PLAIN_NO_ACCENT"
				:disabled="!isAvailable"
				:dataset="{ testid: testId }"
				@click="handleOpen"
			/>
		</div>
	`
	});

	const EditorSubject = ui_vue3.defineComponent({
		name: 'CrmMailTemplateEditorSubject',
		components: {
			BInput: ui_system_input_vue.BInput,
			TextSm: ui_system_typography_vue.TextSm,
			PlaceholderSelector
		},
		props: {
			store: {
				type: Object,
				required: true
			}
		},
		emits: ['error'],
		expose: ['focus', 'getInput', 'cancelPlaceholder'],
		setup() {
			const control = {
				selection: null,
				disposed: false
			};
			return {
				Loc: main_core.Loc,
				InputDesign: ui_system_input_vue.InputDesign,
				InputSize: ui_system_input_vue.InputSize,
				fieldId: `crm-mail-template-subject-${main_core.Text.getRandom()}`,
				control: ui_vue3.markRaw(control)
			};
		},
		computed: {
			isDisabled() {
				return !this.store.state.canEdit || this.store.state.busy;
			},
			error() {
				return this.store.state.errors.filter(error => error.field === 'subject').map(error => error.message).join('\n');
			}
		},
		watch: {
			'store.state.subject': {
				flush: 'sync',
				handler() {
					this.control.selection?.onInvalidated();
				}
			},
			error() {
				this.updateAccessibility();
			}
		},
		mounted() {
			this.updateAccessibility();
		},
		beforeUnmount() {
			this.control.disposed = true;
			this.cancelPlaceholder();
		},
		methods: {
			getInput() {
				return this.$refs.input?.$el.querySelector('input') ?? null;
			},
			focus() {
				this.cancelPlaceholder();
				const input = this.getInput();
				input?.scrollIntoView({
					block: 'nearest'
				});
				input?.focus({
					preventScroll: true
				});
			},
			rememberSelection(onInvalidated) {
				const input = this.getInput();
				if (!input || this.control.disposed || this.isDisabled || !this.store.state.ready) {
					return false;
				}
				const start = input.selectionStart ?? input.value.length;
				this.control.selection = {
					input,
					value: input.value,
					start,
					end: input.selectionEnd ?? start,
					onInvalidated
				};
				return true;
			},
			insertPlaceholder(marker) {
				const selection = this.control.selection;
				this.clearSelection();
				if (!selection || this.control.disposed || this.isDisabled || !this.store.state.ready || selection.input !== this.getInput() || !selection.input.isConnected || selection.value !== this.store.state.subject || selection.value !== selection.input.value) {
					return false;
				}
				const {
					input,
					value,
					start,
					end
				} = selection;
				const subject = value.slice(0, start) + marker + value.slice(end);
				const cursor = start + marker.length;
				this.store.setField('subject', subject);
				void this.$nextTick(() => {
					if (!this.control.disposed && !this.isDisabled && this.store.state.ready && this.getInput() === input && input.isConnected && this.store.state.subject === subject) {
						input.focus({
							preventScroll: true
						});
						input.setSelectionRange(cursor, cursor);
					}
				});
				return true;
			},
			clearSelection() {
				this.control.selection = null;
			},
			cancelPlaceholder() {
				this.$refs.placeholder?.cancel();
				this.clearSelection();
			},
			updateAccessibility() {
				const input = this.getInput();
				if (input) {
					main_core.Dom.attr(input, {
						id: this.fieldId,
						'aria-invalid': this.error ? 'true' : null,
						'aria-describedby': this.error ? `${this.fieldId}-error` : null
					});
				}
			},
			handleInput(value) {
				this.store.setField('subject', value);
			}
		},
		template: `
		<div
			class="crm-mail-template-editor__field crm-mail-template-editor__subject"
			data-testid="crm-mail-template-editor-subject"
		>
			<TextSm class="crm-mail-template-editor__field-label" tag="label" :for="fieldId">
				{{ Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_SUBJECT') }}
			</TextSm>
			<div class="crm-mail-template-editor__field-content">
				<BInput
					ref="input"
					class="crm-mail-template-editor__input"
					:class="{ '--invalid': error, '--readonly': !store.state.canEdit }"
					:modelValue="store.state.subject"
					:ariaLabel="Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_SUBJECT')"
					:design="store.state.busy ? InputDesign.Disabled : InputDesign.Naked"
					:size="InputSize.Md"
					:readonly="isDisabled"
					data-testid="crm-mail-template-subject"
					stretched
					@update:modelValue="handleInput"
				/>
				<PlaceholderSelector
					ref="placeholder"
					:store="store"
					:text="Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_INSERT_SUBJECT_FIELD')"
					testId="crm-mail-template-subject-placeholder"
					:rememberSelection="rememberSelection"
					:insertPlaceholder="insertPlaceholder"
					:clearSelection="clearSelection"
					@error="$emit('error', $event)"
				/>
				<TextSm
					v-if="error"
					:id="fieldId + '-error'"
					class="crm-mail-template-editor__field-error"
					wrap="break-words"
					role="alert"
				>{{ error }}</TextSm>
			</div>
		</div>
	`
	});

	const App = ui_vue3.defineComponent({
		name: 'CrmMailTemplateEditorApp',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			HeadlineLg: ui_system_typography_vue.HeadlineLg,
			TextSm: ui_system_typography_vue.TextSm,
			EditorActions,
			EditorHost,
			EditorProperties,
			EditorSender,
			EditorSubject,
			PlaceholderSelector
		},
		props: {
			store: {
				type: Object,
				required: true
			},
			adapter: {
				type: Object,
				required: true
			},
			editorContainerId: {
				type: String,
				required: true
			}
		},
		emits: ['ready', 'error', 'save', 'cancel'],
		expose: ['handleSave', 'cancelPlaceholders', 'focusError'],
		setup() {
			return {
				Loc: main_core.Loc,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			title() {
				const messageId = this.store.state.id > 0 ? 'CRM_MAIL_TEMPLATE_EDITOR_EDIT_TITLE' : 'CRM_MAIL_TEMPLATE_EDITOR_CREATE_TITLE';
				return main_core.Loc.getMessage(messageId) ?? '';
			}
		},
		methods: {
			rememberBodySelection(onInvalidated) {
				return this.adapter.rememberSelection(onInvalidated);
			},
			insertBodyPlaceholder(marker) {
				return this.adapter.insertPlaceholder(main_core.Text.encode(marker).replaceAll('&#39;', '&#039;'));
			},
			clearBodySelection() {
				this.adapter.clearSelection();
			},
			cancelPlaceholders() {
				this.$refs.bodyPlaceholder?.cancel();
				this.$refs.subject?.cancelPlaceholder();
			},
			focusError(error) {
				const properties = this.$refs.properties;
				if (error.field && properties?.focusField(error.field)) {
					return;
				}
				if (error.field === 'subject') {
					this.$refs.subject?.focus();
					return;
				}
				if (error.field === 'emailFrom') {
					this.$refs.sender?.focus();
					return;
				}
				if (error.field === 'bodyHtml' && this.adapter.focus()) {
					return;
				}
				this.$refs.actions?.focusErrors();
			},
			handleSave() {
				this.$emit('save');
			}
		},
		template: `
		<div
			class="crm-mail-template-editor --ui-context-content-light"
			:aria-labelledby="editorContainerId + '-title'"
			:aria-busy="store.state.busy"
			role="region"
			data-testid="crm-mail-template-editor"
		>
			<div class="crm-mail-template-editor__header">
				<BIcon :name="Outline.MAIL" :size="20" color="var(--ui-color-accent-main-primary)" aria-hidden="true"/>
				<HeadlineLg
					:id="editorContainerId + '-title'"
					class="crm-mail-template-editor__title"
					tag="h1"
					wrap="break-words"
				>{{ title }}</HeadlineLg>
			</div>
			<div class="crm-mail-template-editor__content">
				<TextSm
					v-if="!store.state.canEdit"
					class="crm-mail-template-editor__readonly"
					tag="div"
					wrap="break-words"
					role="status"
				>{{ Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_READONLY') }}</TextSm>
				<EditorProperties ref="properties" :store="store"/>
				<EditorSender ref="sender" :store="store"/>
				<EditorSubject ref="subject" :store="store" @error="$emit('error', $event)"/>
				<PlaceholderSelector
					ref="bodyPlaceholder"
					class="crm-mail-template-editor__body-placeholder"
					:store="store"
					:text="Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_INSERT_BODY_FIELD')"
					testId="crm-mail-template-body-placeholder"
					:rememberSelection="rememberBodySelection"
					:insertPlaceholder="insertBodyPlaceholder"
					:clearSelection="clearBodySelection"
					@error="$emit('error', $event)"
				/>
				<EditorHost
					:editorContainerId="editorContainerId"
					:adapter="adapter"
					:store="store"
					@ready="$emit('ready')"
					@error="$emit('error', $event)"
				/>
			</div>
			<EditorActions ref="actions" :store="store" @save="handleSave" @cancel="$emit('cancel')"/>
		</div>
	`
	});

	class Editor {
		#options;
		#templateId;
		#store;
		#adapter;
		#application = null;
		#component = null;
		#form = null;
		#slider = null;
		#initializationError = null;
		#started = false;
		#destroyed = false;
		#closing = false;
		#saved = false;
		#failed = false;
		constructor(options) {
			this.#options = {
				...options
			};
			this.#templateId = options.initialData.id;
			this.#store = createEditorStore(options.initialData);
			this.#adapter = ui_vue3.markRaw(new HtmlEditorAdapter({
				editorId: options.editorId,
				formId: options.formId,
				canEdit: this.#store.state.canEdit,
				files: options.initialData.files
			}));
		}
		start() {
			if (this.#started || this.#destroyed) {
				return;
			}
			this.#started = true;
			main_core.Event.bind(window, 'pagehide', this.#handleDestroy);
			this.#slider = main_sidepanel.SidePanel.Instance.getSliderByWindow(window);
			if (this.#slider) {
				this.#slider.setCacheable(false);
				main_core_events.EventEmitter.subscribe(this.#slider, 'SidePanel.Slider:onCloseStart', this.#handleClosing);
				main_core_events.EventEmitter.subscribe(this.#slider, 'SidePanel.Slider:onDestroy', this.#handleDestroy);
			}
			const {
				containerId,
				editorContainerId,
				formId
			} = this.#options;
			const container = document.getElementById(containerId);
			const editorContainer = document.getElementById(editorContainerId);
			const form = document.getElementById(formId);
			if (form instanceof HTMLFormElement) {
				this.#form = form;
				main_core.Event.bind(form, 'submit', this.#handleSubmit);
			}
			if (!container || !editorContainer || !this.#form || !this.#form.contains(container) || !this.#form.contains(editorContainer) || container.contains(editorContainer) || editorContainer.contains(container)) {
				this.#handleMountError();
				return;
			}
			try {
				this.#application = ui_vue3.BitrixVue.createApp(App, {
					store: this.#store,
					adapter: this.#adapter,
					editorContainerId,
					onReady: this.#handleEditorReady,
					onError: this.#handleEditorError,
					onSave: this.#handleSave,
					onCancel: this.#handleCancel
				});
				this.#application.config.errorHandler = this.#handleMountError;
				this.#component = this.#application.mount(container);
			} catch {
				this.#handleMountError();
			}
		}
		destroy() {
			if (this.#destroyed) {
				return;
			}
			this.#destroyed = true;
			this.#store.setReady(false);
			main_core.Event.unbind(window, 'pagehide', this.#handleDestroy);
			if (this.#form) {
				main_core.Event.unbind(this.#form, 'submit', this.#handleSubmit);
				this.#form = null;
			}
			if (this.#slider) {
				main_core_events.EventEmitter.unsubscribe(this.#slider, 'SidePanel.Slider:onCloseStart', this.#handleClosing);
				main_core_events.EventEmitter.unsubscribe(this.#slider, 'SidePanel.Slider:onDestroy', this.#handleDestroy);
				this.#slider = null;
			}
			try {
				this.#application?.unmount();
			} finally {
				this.#application = null;
				this.#component = null;
				this.#adapter.destroy();
				main_core.Dom.remove(this.#initializationError);
				this.#initializationError = null;
			}
		}
		#handleSubmit = event => {
			event.preventDefault();
			if (!this.#isDisposed()) {
				this.#component?.handleSave();
			}
		};
		#handleSave = async () => {
			if (this.#isDisposed() || this.#failed || this.#saved || !this.#store.canSave) {
				return;
			}
			this.#store.setBusy(true);
			this.#store.setErrors([]);
			let errors = [];
			let saved = null;
			try {
				this.#component?.cancelPlaceholders();
				if (this.#store.state.title.trim() === '') {
					errors = [{
						code: 'TITLE_REQUIRED',
						field: 'title',
						message: main_core.Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_TITLE_REQUIRED') ?? ''
					}];
				} else {
					const fields = this.#getSaveFields();
					if (this.#isDisposed()) {
						return;
					}
					const result = await editorService.save(this.#templateId, fields);
					if (result.success) {
						saved = result.data;
					} else {
						errors = result.errors;
					}
				}
			} catch (error) {
				errors = [this.#getSnapshotError(error)];
			} finally {
				if (!this.#isDisposed()) {
					this.#store.setBusy(false);
				}
			}
			if (this.#isDisposed()) {
				return;
			}
			if (saved) {
				this.#handleSaved(saved);
				return;
			}
			this.#store.setErrors(errors);
			this.#component?.cancelPlaceholders();
			await ui_vue3.nextTick();
			this.#focusSaveError();
		};
		#focusSaveError() {
			if (!this.#isDisposed() && !this.#saved && !this.#store.state.busy) {
				const error = this.#store.state.errors[0];
				if (error) {
					this.#component?.focusError(error);
				}
			}
		}
		#getSaveFields() {
			const snapshot = this.#adapter.getSnapshot();
			this.#store.syncSnapshot(snapshot);
			const state = this.#store.state;
			return {
				title: state.title,
				entityTypeId: state.entityTypeId,
				access: state.access.map(([entityId, id]) => [entityId, id]),
				isActive: state.isActive,
				emailFrom: state.emailFrom,
				subject: state.subject,
				bodyHtml: snapshot.bodyHtml,
				files: [...snapshot.files]
			};
		}
		#getSnapshotError(error) {
			const code = main_core.Type.isObject(error) && 'message' in error && main_core.Type.isString(error.message) ? error.message : '';
			if (code === HtmlEditorErrorCode.FilesFailed || code === HtmlEditorErrorCode.FilesPending) {
				const messageId = code === HtmlEditorErrorCode.FilesFailed ? 'CRM_MAIL_TEMPLATE_EDITOR_FILES_UPLOAD_ERROR' : 'CRM_MAIL_TEMPLATE_EDITOR_SAVE_FILES_UPLOADING';
				return {
					code,
					field: 'files',
					message: main_core.Loc.getMessage(messageId) ?? ''
				};
			}
			if (code === HtmlEditorErrorCode.Readonly) {
				return {
					code,
					message: main_core.Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_SAVE_READONLY') ?? ''
				};
			}
			return {
				code: code === HtmlEditorErrorCode.NotReady ? code : 'EDITOR_SNAPSHOT_FAILED',
				field: 'bodyHtml',
				message: main_core.Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_CONTENT_ERROR') ?? ''
			};
		}
		#handleSaved(data) {
			this.#saved = true;
			this.#store.setReady(false);
			if (!this.#slider) {
				this.#close();
				return;
			}
			try {
				const topWindow = window.top;
				topWindow.BX.SidePanel.Instance.postMessage(window, 'CrmMailTemplateEdit:onSubmit', data);
			} finally {
				if (!this.#isDisposed()) {
					this.#close();
				}
			}
		}
		#handleEditorReady = () => {
			if (!this.#isDisposed() && !this.#failed && !this.#saved) {
				this.#store.setReady(true);
			}
		};
		#handleEditorError = () => {
			if (!this.#isDisposed()) {
				this.#failed = true;
				this.#store.setReady(false);
				this.#store.setErrors([{
					code: HtmlEditorErrorCode.InitializationFailed,
					message: main_core.Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_INITIALIZATION_ERROR') ?? ''
				}]);
			}
		};
		#handleMountError = () => {
			if (this.#isDisposed()) {
				return;
			}
			this.#failed = true;
			this.#store.setReady(false);
			if (!this.#initializationError) {
				this.#initializationError = main_core.Dom.create('div', {
					props: {
						className: 'crm-mail-template-editor__initialization-error --ui-context-content-light'
					},
					attrs: {
						role: 'alert'
					},
					text: main_core.Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_INITIALIZATION_ERROR') ?? ''
				});
				const container = document.getElementById(this.#options.containerId);
				const parent = this.#form ?? container?.parentElement ?? document.body;
				main_core.Dom.prepend(this.#initializationError, parent);
			}
		};
		#handleCancel = () => {
			if (this.#isDisposed() || this.#store.state.busy) {
				return;
			}
			this.#component?.cancelPlaceholders();
			this.#close();
		};
		#close() {
			if (this.#slider) {
				this.#slider.close();
			} else {
				this.#closing = true;
				main_core.Page.redirect(this.#store.state.paths.list);
			}
		}
		#isDisposed() {
			return this.#destroyed || this.#closing;
		}
		#handleClosing = () => {
			this.#closing = true;
			this.#component?.cancelPlaceholders();
		};
		#handleDestroy = () => {
			this.destroy();
		};
	}

	exports.Editor = Editor;

})(this.BX.Crm.MailTemplateEditor = this.BX.Crm.MailTemplateEditor || {}, window, window, BX, BX.Event, BX.SidePanel, BX.Vue3, BX.Disk.Uploader, BX.UI.IconSet, BX.UI.System.Typography.Vue, window, BX.Vue3.Components, BX.UI.System.Alert.Vue, BX.UI.System.Alert, BX.UI.EntitySelector, BX.UI.System.Input.Vue, BX.UI.System.Chip.Vue, BX.UI.System.Menu, BX.UI.Vue3.Components, BX.UI.Mail);
//# sourceMappingURL=mail-template-editor.bundle.js.map
