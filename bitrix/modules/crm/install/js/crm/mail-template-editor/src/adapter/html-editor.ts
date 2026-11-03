import { Dom, Event, Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { type Uploader, type UploaderFile } from 'ui.uploader.core';

import { UserFieldControl } from 'disk.uploader.user-field-widget';

import { type EditorContentSnapshot, type EditorFileState } from '../model/editor-store';

type FileItem = {
	serverFileId: number | string | null;
};

type FilesListener = (state: EditorFileState) => void;

type NativeBxTag = {
	tag: string | false;
	id?: string;
	serverFileId?: number | string;
	fileId?: number | string;
	mailTemplateImageId?: string;
};

type NativeBxNode = {
	Parse(params: unknown, bxid: string): string;
};

type NativePhpParser = {
	GetBxNode(id: string): NativeBxNode | null;
	AddBxNode(id: string, node: NativeBxNode | null): void;
};

type NativeRange = {
	startContainer: Node;
	endContainer: Node;
	cloneRange(): NativeRange;
	isValid(): boolean;
	deleteContents(): void;
	collapse(toStart: boolean): void;
};

type NativeHtmlEditor = {
	id: string;
	dom: {
		textarea?: HTMLTextAreaElement;
		toolbarCont?: HTMLElement;
	};
	sandbox?: {
		inited: boolean;
		GetDocument(): Document;
	};
	iframeView?: {
		element?: HTMLElement;
		Disable(): void;
	};
	phpParser: NativePhpParser;
	selection: {
		GetRange(selection?: unknown, setFocus?: boolean): NativeRange | null;
		SetSelection(range: NativeRange): void;
	};
	synchro: {
		IsFocusedOnTextarea(): boolean;
	};
	textareaView: {
		element: HTMLTextAreaElement;
		WrapWith(before: string, after: string, content: string): void;
	};
	GetContent(): string;
	GetViewMode(): string;
	Focus(toEnd?: boolean): void;
	InsertHtml(content: string, range: NativeRange): void;
	SetContent(content: string, parse?: boolean): void;
	GetBxTag(node: HTMLElement | string): NativeBxTag;
	SetBxTag(node: HTMLElement | false, tag: NativeBxTag): string;
	OnSubmit(): void;
	CheckAndReInit(): void;
};

type SelectionSnapshot = {
	editor: NativeHtmlEditor;
	document: Document;
	body: HTMLElement;
	view: string;
	onInvalidated?: () => void;
} & ({
	kind: 'source';
	textarea: HTMLTextAreaElement;
	value: string;
	start: number;
	end: number;
	direction: 'forward' | 'backward' | 'none';
} | {
	kind: 'wysiwyg';
	range: NativeRange;
});

type NativePostForm = {
	isReady: boolean;
	getId(): string;
	getFormId(): string;
	getEventObject(): HTMLElement;
	getEditor(): NativeHtmlEditor | null;
};

type EditorWindow = Window & {
	LHEPostForm?: {
		getHandler(editorId: string): NativePostForm | undefined;
	};
	BXHtmlEditor?: {
		Get(editorId: string): NativeHtmlEditor | null;
	};
};

export type HtmlEditorAdapterOptions = {
	editorId: string;
	formId: string;
	canEdit: boolean;
	files: string[];
};

export const HtmlEditorErrorCode = {
	ContainerUnavailable: 'EDITOR_CONTAINER_UNAVAILABLE',
	InitializationFailed: 'EDITOR_INITIALIZATION_FAILED',
	NotReady: 'EDITOR_NOT_READY',
	Destroyed: 'EDITOR_DESTROYED',
	FilesPending: 'EDITOR_FILES_PENDING',
	FilesFailed: 'EDITOR_FILES_FAILED',
	Readonly: 'EDITOR_READONLY',
};

const READY_TIMEOUT = 30000;
const LOOKUP_INTERVAL = 50;
const FILE_EVENTS = ['File:onStatusChange', 'File:onComplete', 'File:onUploadComplete', 'File:onError'];
const ITEM_EVENTS = ['Item:onAdd', 'Item:onComplete'];
const DISK_PARSER_ID = 'diskfile0';
const EDITOR_EVENTS = [
	'OnEditorInitedAfter',
	'OnCreateIframeAfter',
	'OnIframeReInit',
	'OnSetViewAfter',
	'OnIframeFocus',
	'OnIframeSetValue',
];
const SELECTION_EVENTS = ['OnSetViewBefore', 'OnIframeReInit', 'OnIframeSetValue', 'OnSetContentBefore'];
const SELECTION_CAPTURE_EVENTS = ['OnIframeBlur', 'OnTextareaBlur', 'OnIframeKeyup', 'OnTextareaKeyup'];
const MUTATION_EVENTS = ['beforeinput', 'paste', 'drop', 'cut'];
const MOUSE_EVENTS = ['mousedown', 'mouseup', 'dblclick', 'contextmenu', 'click'];
const NAVIGATION_KEYS = new Set([
	'Tab', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
	'Home', 'End', 'PageUp', 'PageDown', 'Shift', 'Control', 'Alt', 'Meta', 'ContextMenu',
]);

export class HtmlEditorAdapter
{
	#options: HtmlEditorAdapterOptions;
	#postForm: NativePostForm | null = null;
	#editor: NativeHtmlEditor | null = null;
	#startPromise: Promise<void> | null = null;
	#resolveReady: (() => void) | null = null;
	#rejectReady: ((error: Error) => void) | null = null;
	#lookupTimer: number | null = null;
	#readyTimer: number | null = null;
	#ready: boolean = false;
	#reinitializing: boolean = false;
	#destroyed: boolean = false;
	#readonlyDocument: Document | null = null;
	#readonlyTextarea: HTMLTextAreaElement | null = null;
	#fileControl: UserFieldControl | null = null;
	#uploader: Uploader | null = null;
	#files: Set<string>;
	#removedFiles: Set<string> = new Set();
	#fileState: EditorFileState;
	#filesListeners: Set<FilesListener> = new Set();
	#fileLookupTimer: number | null = null;
	#fileLookupDeadline: number = 0;
	#filesTimer: number | null = null;
	#phpParser: NativePhpParser | null = null;
	#previousFileNode: NativeBxNode | null = null;
	#fileNode: NativeBxNode = { Parse: (params, bxid) => this.#parseFileNode(params, bxid) };
	#selection: SelectionSnapshot | null = null;
	#lastSelection: SelectionSnapshot | null = null;
	#hasSelectionHistory: boolean = false;

	constructor(options: HtmlEditorAdapterOptions)
	{
		this.#options = { ...options };
		this.#files = new Set(options.files);
		this.#fileState = { files: [...this.#files], pending: false, failed: false };
	}

	start(): Promise<void>
	{
		if (this.#destroyed)
		{
			return Promise.reject(new Error(HtmlEditorErrorCode.Destroyed));
		}

		if (this.#startPromise)
		{
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

	prepareToMove(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		const editor = this.#editor ?? (window as EditorWindow).BXHtmlEditor?.Get(this.#options.editorId);
		this.#invalidateSelection();
		if (editor && this.#hasReadyDocument(editor))
		{
			editor.GetContent();
		}
	}

	isReady(): boolean
	{
		return !this.#destroyed
			&& this.#ready
			&& !this.#reinitializing
			&& this.#editor !== null
			&& this.#hasReadyDocument(this.#editor)
		;
	}

	getContent(): string
	{
		const editor = this.#editor;
		if (!editor || !this.isReady())
		{
			throw new Error(HtmlEditorErrorCode.NotReady);
		}

		this.#ensureFileParser();
		editor.OnSubmit();

		return this.#serializeImages(editor.GetContent());
	}

	getSnapshot(): EditorContentSnapshot
	{
		if (!this.#options.canEdit)
		{
			throw new Error(HtmlEditorErrorCode.Readonly);
		}

		if (!this.isReady())
		{
			throw new Error(HtmlEditorErrorCode.NotReady);
		}

		this.#connectFiles();
		this.#requireFilesReady();
		const bodyHtml = this.getContent();
		this.#requireFilesReady();

		return { bodyHtml, files: [...this.#files] };
	}

	subscribeFiles(listener: FilesListener): () => void
	{
		if (this.#destroyed)
		{
			return () => {};
		}

		this.#filesListeners.add(listener);
		listener({ ...this.#fileState, files: [...this.#fileState.files] });

		return () => this.#filesListeners.delete(listener);
	}

	focus(): boolean
	{
		const editor = this.#editor;
		if (!editor || !this.#options.canEdit || !this.isReady())
		{
			return false;
		}

		editor.Focus();

		return true;
	}

	rememberSelection(onInvalidated?: () => void): boolean
	{
		this.clearSelection();
		const editor = this.#editor;
		if (!editor || !this.#options.canEdit || !this.isReady())
		{
			return false;
		}

		const previous = this.#lastSelection;
		const hasPrevious = previous && this.#isSelectionCurrent(previous);
		let selection = hasPrevious && previous.kind === 'wysiwyg' && !previous.document.hasFocus()
			? previous
			: this.#captureSelection()
		;
		if (!selection && hasPrevious)
		{
			selection = previous;
		}

		if (!selection && !this.#hasSelectionHistory)
		{
			editor.Focus(true);
			selection = this.#captureSelection();
		}

		if (!selection)
		{
			return false;
		}

		this.#selection = { ...selection, onInvalidated };
		this.#lastSelection = selection;
		this.#hasSelectionHistory = true;

		return true;
	}

	insertPlaceholder(fragment: string): boolean
	{
		const selection = this.#selection;
		if (
			!this.#options.canEdit || !Type.isStringFilled(fragment)
			|| !selection || !this.#isSelectionCurrent(selection)
		)
		{
			this.clearSelection();

			return false;
		}

		this.clearSelection();
		const { editor, kind } = selection;
		editor.Focus();
		if (kind === 'source')
		{
			const { textarea, start, end, direction } = selection;
			textarea.setSelectionRange(start, end, direction);
			editor.textareaView.WrapWith('', '', fragment);
			const cursor = start + fragment.length;
			textarea.setSelectionRange(cursor, cursor);
		}
		else
		{
			const { range } = selection;
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

	clearSelection(): void
	{
		this.#selection = null;
	}

	destroy(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		this.#destroyed = true;
		this.#invalidateSelection();
		this.#fail(new Error(HtmlEditorErrorCode.Destroyed));
		this.#disconnectFiles();
		this.#filesListeners.clear();
		this.#restoreFileParser();
		if (this.#postForm)
		{
			EventEmitter.unsubscribe(this.#postForm, 'OnEditorIsLoaded', this.#handleEditorChange);
			EventEmitter.unsubscribe(this.#postForm.getEventObject(), 'OnAfterShowLHE', this.#handleEditorChange);
		}

		const editor = this.#editor;
		if (editor)
		{
			EDITOR_EVENTS.forEach((event) => EventEmitter.unsubscribe(editor, event, this.#handleEditorChange));
			SELECTION_EVENTS.forEach((event) => EventEmitter.unsubscribe(editor, event, this.#invalidateSelection));
			SELECTION_CAPTURE_EVENTS.forEach((event) => {
				EventEmitter.unsubscribe(editor, event, this.#handleSelectionCapture);
			});
			EventEmitter.unsubscribe(editor, 'OnAfterIframeInit', this.#handleIframeInit);
		}

		this.#unbindReadonly(this.#readonlyDocument);
		this.#unbindReadonly(this.#readonlyTextarea);
		this.#readonlyDocument = null;
		this.#readonlyTextarea = null;
		this.#postForm = null;
		this.#editor = null;
	}

	#connect = (): void => {
		this.#lookupTimer = null;
		if (this.#destroyed)
		{
			return;
		}

		try
		{
			const runtime = window as EditorWindow;
			const postForm = runtime.LHEPostForm?.getHandler(this.#options.editorId);
			const editor = postForm?.getEditor() ?? runtime.BXHtmlEditor?.Get(this.#options.editorId);
			if (!postForm || !editor)
			{
				this.#lookupTimer = window.setTimeout(this.#connect, LOOKUP_INTERVAL);

				return;
			}

			if (postForm.getFormId() !== this.#options.formId || editor.id !== this.#options.editorId)
			{
				throw new Error(HtmlEditorErrorCode.InitializationFailed);
			}

			this.#postForm = postForm;
			this.#editor = editor;
			this.#connectFiles();
			EventEmitter.subscribe(postForm, 'OnEditorIsLoaded', this.#handleEditorChange);
			EventEmitter.subscribe(postForm.getEventObject(), 'OnAfterShowLHE', this.#handleEditorChange);
			EDITOR_EVENTS.forEach((event) => EventEmitter.subscribe(editor, event, this.#handleEditorChange));
			SELECTION_EVENTS.forEach((event) => EventEmitter.subscribe(editor, event, this.#invalidateSelection));
			SELECTION_CAPTURE_EVENTS.forEach((event) => {
				EventEmitter.subscribe(editor, event, this.#handleSelectionCapture);
			});
			EventEmitter.subscribe(editor, 'OnAfterIframeInit', this.#handleIframeInit);

			if (editor.sandbox?.inited)
			{
				const iframeDocument = editor.sandbox.GetDocument();
				if (iframeDocument.body !== editor.iframeView?.element || !iframeDocument.head?.innerHTML)
				{
					this.#reinitializing = true;
					editor.CheckAndReInit();
				}
			}

			EventEmitter.emit(postForm.getEventObject(), 'OnShowLHE', new BaseEvent({
				compatData: ['justShow', false],
			}));
			this.#handleEditorChange();
		}
		catch (error)
		{
			this.#fail(error instanceof Error ? error : new Error(HtmlEditorErrorCode.InitializationFailed));
		}
	};

	#handleIframeInit = (): void => {
		this.#invalidateSelection();
		this.#reinitializing = false;
		this.#handleEditorChange();
	};

	#handleEditorChange = (): void => {
		if (this.#destroyed || !this.#editor)
		{
			return;
		}

		try
		{
			this.#applyReadonly();
			this.#connectFiles();
			this.#ensureFileParser();
			this.#restoreInlineTags();
			if (this.#postForm?.isReady && !this.#reinitializing && this.#hasReadyDocument(this.#editor))
			{
				this.#ready = true;
				this.#clearTimers();
				this.#resolveReady?.();
				this.#resolveReady = null;
				this.#rejectReady = null;
			}
		}
		catch (error)
		{
			this.#fail(error instanceof Error ? error : new Error(HtmlEditorErrorCode.InitializationFailed));
		}
	};

	#hasReadyDocument(editor: NativeHtmlEditor): boolean
	{
		return editor.sandbox?.inited === true
			&& editor.dom.textarea !== undefined
			&& editor.iframeView?.element !== undefined
			&& editor.sandbox.GetDocument().body === editor.iframeView.element
		;
	}

	#invalidateSelection = (): void => {
		const onInvalidated = this.#selection?.onInvalidated;
		this.#lastSelection = null;
		this.clearSelection();
		onInvalidated?.();
	};

	#handleSelectionCapture = (): void => {
		if (this.#options.canEdit && this.isReady())
		{
			const selection = this.#captureSelection();
			if (selection)
			{
				this.#lastSelection = selection;
				this.#hasSelectionHistory = true;
			}
		}
	};

	#captureSelection(): SelectionSnapshot | null
	{
		const editor = this.#editor;
		const sandbox = editor?.sandbox;
		const body = editor?.iframeView?.element;
		if (!editor || !sandbox || !body || !this.isReady())
		{
			return null;
		}

		const context = {
			editor,
			document: sandbox.GetDocument(),
			body,
			view: editor.GetViewMode(),
		};
		if (editor.synchro.IsFocusedOnTextarea())
		{
			const textarea = editor.textareaView.element;

			return {
				...context,
				kind: 'source',
				textarea,
				value: textarea.value,
				start: textarea.selectionStart,
				end: textarea.selectionEnd,
				direction: textarea.selectionDirection,
			};
		}

		const range = editor.selection.GetRange(undefined, false);

		return range && this.#isRangeValid(range, context.body)
			? { ...context, kind: 'wysiwyg', range: range.cloneRange() }
			: null
		;
	}

	#isSelectionCurrent(selection: SelectionSnapshot): boolean
	{
		const editor = this.#editor;
		if (
			!editor || !this.isReady() || editor !== selection.editor
			|| editor.sandbox?.GetDocument() !== selection.document
			|| editor.iframeView?.element !== selection.body || editor.GetViewMode() !== selection.view
			|| editor.synchro.IsFocusedOnTextarea() !== (selection.kind === 'source')
		)
		{
			return false;
		}

		if (selection.kind === 'source')
		{
			return editor.textareaView.element === selection.textarea && selection.textarea.value === selection.value;
		}

		return this.#isRangeValid(selection.range, selection.body);
	}

	#isRangeValid(range: NativeRange, body: HTMLElement): boolean
	{
		try
		{
			return range.isValid() && body.contains(range.startContainer) && body.contains(range.endContainer);
		}
		catch
		{
			return false;
		}
	}

	#connectFiles = (): void => {
		if (this.#destroyed || this.#fileControl)
		{
			return;
		}

		if (this.#fileLookupTimer !== null)
		{
			window.clearTimeout(this.#fileLookupTimer);
			this.#fileLookupTimer = null;
		}

		const control = UserFieldControl.getById(this.#options.formId);
		if (!control)
		{
			if (Date.now() < this.#fileLookupDeadline)
			{
				this.#fileLookupTimer = window.setTimeout(this.#connectFiles, LOOKUP_INTERVAL);
			}

			return;
		}

		this.#fileControl = control;
		const uploader = control.getUploader();
		this.#uploader = uploader;
		FILE_EVENTS.forEach((event) => uploader.subscribe(event, this.#handleFilesChange));
		uploader.subscribe('File:onAdd', this.#handleFileAdd);
		uploader.subscribe('File:onRemove', this.#handleFileRemove);
		ITEM_EVENTS.forEach((event) => control.subscribe(event, this.#handleFilesChange));
		control.subscribe('Item:onRemove', this.#handleItemRemove);
		const integration = control.getMainPostForm();
		if (integration)
		{
			EventEmitter.subscribe(integration, 'onReady', this.#handleEditorChange);
		}

		this.#ensureFileParser();
		this.#restoreInlineTags();
		this.#handleFilesChange();
	};

	#disconnectFiles(): void
	{
		if (this.#fileLookupTimer !== null)
		{
			window.clearTimeout(this.#fileLookupTimer);
			this.#fileLookupTimer = null;
		}

		if (this.#filesTimer !== null)
		{
			window.clearTimeout(this.#filesTimer);
			this.#filesTimer = null;
		}

		const uploader = this.#uploader;
		if (uploader)
		{
			FILE_EVENTS.forEach((event) => uploader.unsubscribe(event, this.#handleFilesChange));
			uploader.unsubscribe('File:onAdd', this.#handleFileAdd);
			uploader.unsubscribe('File:onRemove', this.#handleFileRemove);
		}

		const control = this.#fileControl;
		if (control)
		{
			ITEM_EVENTS.forEach((event) => control.unsubscribe(event, this.#handleFilesChange));
			control.unsubscribe('Item:onRemove', this.#handleItemRemove);
			const integration = control.getMainPostForm();
			if (integration)
			{
				EventEmitter.unsubscribe(integration, 'onReady', this.#handleEditorChange);
			}
		}

		this.#uploader = null;
		this.#fileControl = null;
	}

	#handleFileAdd = (event: BaseEvent<{ file: UploaderFile }>): void => {
		const file = event.getData()?.file;
		if (this.#destroyed || !file)
		{
			return;
		}

		const id = this.#normalizeFileId(file.getServerFileId());
		if (id)
		{
			this.#removedFiles.delete(id);
		}

		this.#handleFilesChange();
	};

	#handleFileRemove = (event: BaseEvent<{ file: UploaderFile }>): void => {
		const file = event.getData()?.file;
		if (file)
		{
			this.#removeFile(file.getServerFileId());
		}
	};

	#handleItemRemove = (event: BaseEvent<{ item: FileItem }>): void => {
		const item = event.getData()?.item;
		if (item)
		{
			this.#removeFile(item.serverFileId);
		}
	};

	#removeFile(serverFileId: unknown): void
	{
		if (this.#destroyed || !this.#options.canEdit)
		{
			return;
		}

		const id = this.#normalizeFileId(serverFileId);
		if (id)
		{
			this.#files.delete(id);
			this.#removedFiles.add(id);
			this.#removeInlineImages();
		}

		this.#handleFilesChange();
	}

	#handleFilesChange = (): void => {
		if (this.#destroyed)
		{
			return;
		}

		if (this.#filesTimer !== null)
		{
			window.clearTimeout(this.#filesTimer);
		}

		this.#filesTimer = window.setTimeout(() => {
			this.#filesTimer = null;
			this.#syncFiles();
		}, 0);
		this.#syncFiles();
	};

	#syncFiles(): void
	{
		let pending = this.#filesTimer !== null;
		let failed = false;
		for (const file of this.#uploader?.getFiles() ?? [])
		{
			const id = this.#normalizeFileId(file.getServerFileId());
			if (id && this.#removedFiles.has(id))
			{
				continue;
			}

			if (file.isFailed())
			{
				failed = true;
			}
			else if (!file.isComplete() || !id)
			{
				pending = true;
			}
			else
			{
				this.#files.add(id);
			}
		}

		const files = [...this.#files];
		if (
			this.#fileState.pending === pending && this.#fileState.failed === failed
			&& files.length === this.#fileState.files.length
			&& files.every((id, index) => id === this.#fileState.files[index])
		)
		{
			return;
		}

		this.#fileState = { files, pending, failed };
		this.#filesListeners.forEach((listener) => listener({ files: [...files], pending, failed }));
	}

	#normalizeFileId(id: unknown): string | null
	{
		if ((Type.isString(id) || Type.isInteger(id)) && /^n?[1-9]\d*$/.test(String(id)))
		{
			return String(id);
		}

		return null;
	}

	#requireFilesReady(): void
	{
		this.#syncFiles();
		if (this.#fileState.failed)
		{
			throw new Error(HtmlEditorErrorCode.FilesFailed);
		}

		if (this.#fileState.pending)
		{
			throw new Error(HtmlEditorErrorCode.FilesPending);
		}
	}

	#ensureFileParser(): void
	{
		const editor = this.#editor;
		const integration = this.#fileControl?.getMainPostForm();
		if (
			!editor || !this.#hasReadyDocument(editor)
			|| integration?.getHtmlEditor() !== editor || !integration?.getParser()
			|| this.#phpParser === editor.phpParser
		)
		{
			return;
		}

		this.#restoreFileParser();
		this.#phpParser = editor.phpParser;
		this.#previousFileNode = this.#phpParser.GetBxNode(DISK_PARSER_ID);
		this.#phpParser.AddBxNode(DISK_PARSER_ID, this.#fileNode);
	}

	#restoreFileParser(): void
	{
		if (this.#phpParser?.GetBxNode(DISK_PARSER_ID) === this.#fileNode)
		{
			this.#phpParser.AddBxNode(DISK_PARSER_ID, this.#previousFileNode);
		}

		this.#phpParser = null;
		this.#previousFileNode = null;
	}

	#parseFileNode(params: unknown, bxid: string): string
	{
		const editor = this.#editor;
		const node = editor?.sandbox?.GetDocument().getElementById(bxid);
		if (!editor || !node)
		{
			return this.#previousFileNode?.Parse(params, bxid) ?? '';
		}

		const tag = editor.GetBxTag(bxid);
		const id = this.#normalizeFileId(tag.serverFileId ?? tag.fileId);
		if (node.tagName === 'IMG' && id)
		{
			return this.#removedFiles.has(id) ? '' : this.#cloneFileImage(node as HTMLImageElement, id).outerHTML;
		}

		return (node.cloneNode(true) as HTMLElement).outerHTML;
	}

	#restoreInlineTags(): void
	{
		const editor = this.#editor;
		const sandbox = editor?.sandbox;
		const body = editor?.iframeView?.element;
		if (!editor || !sandbox || !body || !this.#phpParser || !this.#hasReadyDocument(editor))
		{
			return;
		}

		const files = this.#uploader?.getFiles() ?? [];
		const iframeDocument = sandbox.GetDocument();
		body.querySelectorAll<HTMLImageElement>('img').forEach((image) => {
			const id = this.#getImageFileId(image);
			if (!id)
			{
				return;
			}

			const file = files.find((item) => this.#normalizeFileId(item.getServerFileId()) === id);
			const serverFileId = file?.getServerFileId() ?? (id.startsWith('n') ? id : Number(id));
			let tag = editor.GetBxTag(image);
			if (image.id && (!/^bxid\d{1,9}$/i.test(image.id) || iframeDocument.getElementById(image.id) !== image))
			{
				// Native surrogates require a bxid; preserve author IDs in serialized HTML.
				image.setAttribute('id', editor.SetBxTag(false, {
					...tag,
					id: undefined,
					tag: DISK_PARSER_ID,
					serverFileId,
					fileId: serverFileId,
					mailTemplateImageId: tag.mailTemplateImageId ?? image.id,
				}));
				tag = editor.GetBxTag(image);
			}

			if (tag.tag !== DISK_PARSER_ID || tag.serverFileId !== serverFileId || tag.fileId !== serverFileId)
			{
				editor.SetBxTag(image, { ...tag, tag: DISK_PARSER_ID, serverFileId, fileId: serverFileId });
			}

			const previewUrl = file?.getServerPreviewUrl();
			if (image.getAttribute('src') === `bxacid:${id}` && Type.isStringFilled(previewUrl))
			{
				image.setAttribute('src', previewUrl);
				image.setAttribute('data-bx-orig-src', previewUrl);
			}
		});
	}

	#getImageFileId(image: HTMLImageElement): string | null
	{
		const source = image.getAttribute('src') ?? '';
		const canonical = /^(?:https?:\/\/)?bxacid:(n?[1-9]\d*)$/i.exec(source);
		const preview = /[&?]__bxacid=(n?[1-9]\d*)(?:[#&]|$)/.exec(source);
		const tag = this.#editor?.GetBxTag(image);

		return canonical?.[1] ?? preview?.[1]
			?? (tag?.tag === DISK_PARSER_ID ? this.#normalizeFileId(tag.serverFileId ?? tag.fileId) : null)
		;
	}

	#cloneFileImage(image: HTMLImageElement, id: string): HTMLImageElement
	{
		const clone = image.cloneNode(true) as HTMLImageElement;
		const originalId = this.#editor?.GetBxTag(image).mailTemplateImageId;
		if (originalId)
		{
			clone.id = originalId;
		}

		const source = clone.getAttribute('src');
		if (source && !/^(?:https?:\/\/)?bxacid:/i.test(source))
		{
			clone.setAttribute('data-bx-orig-src', source);
		}

		clone.setAttribute('src', `bxacid:${id}`);

		return clone;
	}

	#serializeImages(content: string): string
	{
		const template = document.createElement('template');

		return content.replaceAll(
			/<!--[\S\s]*?-->|<(script|style|textarea|title)\b(?:[^"'<>]|"[^"]*"|'[^']*')*>[\S\s]*?<\/\1\s*>|<(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi,
			(markup: string): string => {
				if (!/^<img\b/i.test(markup))
				{
					return markup;
				}

				template.innerHTML = markup;
				const image = template.content.querySelector<HTMLImageElement>('img');
				if (!image)
				{
					return markup;
				}

				const id = this.#getImageFileId(image);
				if (!id)
				{
					return markup;
				}

				if (this.#removedFiles.has(id))
				{
					return '';
				}

				return image.getAttribute('src') === `bxacid:${id}`
					? markup
					: this.#cloneFileImage(image, id).outerHTML
				;
			},
		);
	}

	#removeInlineImages(): void
	{
		const editor = this.#editor;
		const body = editor?.iframeView?.element;
		if (!editor || !body || !this.isReady())
		{
			return;
		}

		const images = [...body.querySelectorAll<HTMLImageElement>('img')].filter((image) => {
			const id = this.#getImageFileId(image);

			return id !== null && this.#removedFiles.has(id);
		});
		if (images.length > 0)
		{
			this.#invalidateSelection();
			images.forEach((image) => image.remove());
		}

		const content = editor.GetContent();
		const nextContent = this.#serializeImages(content);
		if (content !== nextContent)
		{
			editor.SetContent(nextContent, true);
		}
	}

	#applyReadonly(): void
	{
		if (this.#options.canEdit || !this.#editor)
		{
			return;
		}

		const { dom, iframeView, sandbox } = this.#editor;
		if (dom.textarea)
		{
			dom.textarea.readOnly = true;
			if (this.#readonlyTextarea !== dom.textarea)
			{
				this.#unbindReadonly(this.#readonlyTextarea);
				this.#readonlyTextarea = dom.textarea;
				this.#bindReadonly(this.#readonlyTextarea);
			}
		}

		if (iframeView?.element && sandbox?.inited)
		{
			iframeView.Disable();
			const iframeDocument = sandbox.GetDocument();
			if (this.#readonlyDocument !== iframeDocument)
			{
				this.#unbindReadonly(this.#readonlyDocument);
				this.#readonlyDocument = iframeDocument;
			}
			this.#bindReadonly(iframeDocument);
		}

		const toolbars = this.#postForm?.getEventObject().querySelectorAll<HTMLElement>('[data-bx-role="toolbar"]');
		[dom.toolbarCont, ...(toolbars ?? [])].forEach((toolbar) => {
			if (toolbar)
			{
				Dom.attr(toolbar, 'hidden', '');
				Dom.style(toolbar, 'display', 'none');
			}
		});
	}

	#bindReadonly(target: Document | HTMLTextAreaElement): void
	{
		MUTATION_EVENTS.forEach((event) => Event.bind(target, event, this.#preventMutation, true));
		MOUSE_EVENTS.forEach((event) => Event.bind(target, event, this.#stopNativeHandler, true));
		Event.bind(target, 'keydown', this.#handleReadonlyKey, true);
		Event.bind(target, 'keyup', this.#handleReadonlyKey, true);
	}

	#unbindReadonly(target: Document | HTMLTextAreaElement | null): void
	{
		if (!target)
		{
			return;
		}

		MUTATION_EVENTS.forEach((event) => Event.unbind(target, event, this.#preventMutation, true));
		MOUSE_EVENTS.forEach((event) => Event.unbind(target, event, this.#stopNativeHandler, true));
		Event.unbind(target, 'keydown', this.#handleReadonlyKey, true);
		Event.unbind(target, 'keyup', this.#handleReadonlyKey, true);
	}

	#preventMutation = (event: globalThis.Event): void => {
		event.preventDefault();
		event.stopImmediatePropagation();
	};

	#stopNativeHandler = (event: globalThis.Event): void => {
		event.stopImmediatePropagation();
	};

	#handleReadonlyKey = (event: globalThis.Event): void => {
		event.stopImmediatePropagation();
		const { key, code, ctrlKey, metaKey, altKey, shiftKey } = event as KeyboardEvent;
		const copyOrSelect = (ctrlKey || metaKey)
			&& !altKey
			&& (['a', 'c'].includes(key.toLowerCase()) || ['KeyA', 'KeyC'].includes(code))
		;
		const copyWithInsert = ctrlKey && !shiftKey && key === 'Insert';
		const contextMenu = shiftKey && key === 'F10';
		if (!NAVIGATION_KEYS.has(key) && !copyOrSelect && !copyWithInsert && !contextMenu)
		{
			event.preventDefault();
		}
	};

	#fail(error: Error): void
	{
		this.#ready = false;
		this.#clearTimers();
		this.#rejectReady?.(error);
		this.#resolveReady = null;
		this.#rejectReady = null;
	}

	#clearTimers(): void
	{
		if (this.#lookupTimer !== null)
		{
			window.clearTimeout(this.#lookupTimer);
			this.#lookupTimer = null;
		}

		if (this.#readyTimer !== null)
		{
			window.clearTimeout(this.#readyTimer);
			this.#readyTimer = null;
		}
	}
}
