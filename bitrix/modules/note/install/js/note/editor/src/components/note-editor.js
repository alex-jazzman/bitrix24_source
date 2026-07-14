import { Type } from 'main.core';
import { EditorToolbarComponent } from './editor-toolbar';
import { TableContextMenuComponent } from './table-context-menu';
import { LinkFloatingPopupComponent } from './link-floating-popup';
import { createEditorExtensions, MAX_FILE_SIZE, MAX_IMAGE_SIZE } from '../extensions/registry';
import { FileUploadService } from '../services/file-upload-service';
import { createEditorInstance } from '../utils/create-editor-instance';
import { resolveCanRedo, resolveCanUndo, resolveHeadingLevel } from '../utils/editor-state';
import { ToolbarPositionTracker } from '../utils/toolbar-tracking';
import { normalizeCurrentUser } from '../utils/normalize';
import { safeParseMarkdown } from '../utils/safe-parse-markdown';
import type { CurrentUser } from '../type';
import { createLinkSelectionDecorationPlugin } from '../extensions/link-selection-decoration';
import { parseInternalNoteLink } from '../utils/internal-link';
import { createScopedUploadService, insertUploadAssetNode } from '../services/upload-orchestration';
import '../styles/editor.css';
import '../styles/editor.mobile.css';

const DEFAULT_CONTENT = {
	type: 'doc',
	content: [
		{
			type: 'paragraph',
		},
	],
};

export const DocumentEditorComponent = {
	name: 'NoteDocumentEditor',
	components: {
		EditorToolbarComponent,
		TableContextMenuComponent,
		LinkFloatingPopupComponent,
	},
	props: {
		editable: {
			type: Boolean,
			default: true,
		},
		showToolbar: {
			type: Boolean,
			default: true,
		},
		modelValue: {
			type: [Object, String],
			default: null,
		},
		content: {
			type: [Object, String],
			default: null,
		},
		extraExtensions: {
			type: Array,
			default: () => [],
		},
		uploadAdapter: {
			type: Object,
			default: null,
		},
		documentId: {
			type: [Number, String],
			default: null,
		},
		collectionId: {
			type: [Number, String],
			default: null,
		},
		provider: {
			type: Object,
			default: null,
		},
		currentUser: {
			type: Object,
			default: () => ({}),
		},
		readOnly: {
			type: Boolean,
			default: false,
		},
		title: {
			type: String,
			default: '',
		},
	},
	emits: ['ready', 'update:modelValue', 'update:content', 'rename-title', 'open-internal-link'],
	data()
	{
		return {
			editor: null,
			editorTick: 0,
			lastEmittedModelValue: null,
			internalUpdateDepth: 0,
			toolbarFixed: false,
			toolbarLeft: 0,
			toolbarMaxWidth: 0,
			toolbarTop: 10,
			internalTitle: this.title,
			isTitleEditing: false,
			titleBeforeEdit: '',
			editableLocal: this.editable,
			showToolbarLocal: this.showToolbar,
		};
	},
	computed: {
		displayTitle(): string
		{
			if (this.internalTitle)
			{
				return this.internalTitle;
			}

			const id = Number(this.documentId);

			return id > 0 ? `Документ #${id}` : '';
		},
		headingLevel(): number
		{
			const current = this.editor;
			const editorTick = this.editorTick;

			void editorTick;

			return resolveHeadingLevel(current);
		},
		canUndo(): boolean
		{
			const current = this.editor;
			const editorTick = this.editorTick;

			void editorTick;

			return resolveCanUndo(current);
		},
		canRedo(): boolean
		{
			const current = this.editor;
			const editorTick = this.editorTick;

			void editorTick;

			return resolveCanRedo(current);
		},
		normalizedCurrentUser(): CurrentUser
		{
			return normalizeCurrentUser(this.currentUser);
		},
		isReadOnly(): boolean
		{
			return Boolean(this.readOnly);
		},
		effectiveEditable(): boolean
		{
			return Boolean(this.editableLocal) && !this.isReadOnly;
		},
	},
	watch: {
		editable(nextEditable)
		{
			this.editableLocal = Boolean(nextEditable);
		},
		showToolbar(nextShowToolbar)
		{
			this.showToolbarLocal = Boolean(nextShowToolbar);
		},
		editableLocal()
		{
			this.editor?.setEditable(this.effectiveEditable);
		},
		readOnly(nextReadOnly)
		{
			void nextReadOnly;
			this.editor?.setEditable(this.effectiveEditable);
		},
		modelValue(nextValue)
		{
			this.syncIncomingContent(nextValue);
		},
		content(nextValue)
		{
			this.syncIncomingContent(nextValue);
		},
		title(nextValue)
		{
			if (this.isTitleEditing)
			{
				return;
			}

			this.internalTitle = nextValue;
		},
	},
	mounted()
	{
		this.createEditor();
		this.toolbarTracker = new ToolbarPositionTracker({
			state: this,
			getRoot: () => this.$refs.root,
			getAnchor: () => this.$refs.toolbarAnchor,
		});
		this.toolbarTracker.start();
	},
	beforeUnmount()
	{
		this.toolbarTracker?.stop();
		this.editor?.destroy();
		this.editor = null;
	},
	methods: {
		handleEditorAnchorClick(event: MouseEvent): boolean
		{
			if (event.defaultPrevented)
			{
				return false;
			}

			if (
				this.editor?.isEditable
				|| event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
			)
			{
				return false;
			}

			const target = event.target instanceof Element ? event.target : null;
			const anchor = target?.closest('a[href]');
			if (!(anchor instanceof HTMLAnchorElement))
			{
				return false;
			}

			const parsed = parseInternalNoteLink(anchor.getAttribute('href'));
			if (!parsed)
			{
				return false;
			}

			event.preventDefault();
			this.$emit('open-internal-link', parsed);

			return true;
		},
		updateTitle(newTitle: string): void
		{
			this.internalTitle = newTitle;
		},
		setEditable(value: boolean): void
		{
			this.editableLocal = Boolean(value);
		},
		setShowToolbar(value: boolean): void
		{
			this.showToolbarLocal = Boolean(value);
		},
		onTitleFocus(): void
		{
			this.titleBeforeEdit = this.internalTitle;
			this.isTitleEditing = true;
		},
		focusTitleAndSelectAll(): void
		{
			const el = this.$refs.titleEl;
			if (!(el instanceof HTMLElement))
			{
				return;
			}

			el.focus();
			const range = document.createRange();
			range.selectNodeContents(el);
			const selection = window.getSelection();
			if (selection)
			{
				selection.removeAllRanges();
				selection.addRange(range);
			}
		},
		onTitleBlur(): void
		{
			const el = this.$refs.titleEl;
			const newTitle = (el.textContent || '').trim();
			if (newTitle && newTitle !== this.titleBeforeEdit)
			{
				this.internalTitle = newTitle;
				this.$emit('rename-title', newTitle);
			}
			else
			{
				el.textContent = this.titleBeforeEdit;
			}

			this.isTitleEditing = false;
		},
		onTitleKeydown(event: KeyboardEvent): void
		{
			const el = this.$refs.titleEl;
			if (event.key === 'Enter')
			{
				event.preventDefault();
				el.blur();
				this.editor?.commands.focus('start');
			}
			else if (event.key === 'Escape')
			{
				el.textContent = this.titleBeforeEdit;
				el.blur();
			}
		},
		onTitlePaste(event: ClipboardEvent): void
		{
			event.preventDefault();
			const text = event.clipboardData?.getData('text/plain') || '';
			document.execCommand('insertText', false, text);
		},
		createEditor(content?: Object): void
		{
			if (!(this.$refs.content instanceof HTMLElement))
			{
				return;
			}

			const uploadService = this.resolveUploadService();
			const extraExtensions = Array.isArray(this.extraExtensions) ? this.extraExtensions.filter(Boolean) : [];
			const extensions = [
				...createEditorExtensions({
					uploadService,
					provider: this.provider,
					user: this.normalizedCurrentUser,
					documentId: this.documentId,
				}),
				...extraExtensions,
			];

			const resolvedContent = content ?? (this.provider ? undefined : this.resolveInitialContent());
			const isMarkdownContent = Type.isString(resolvedContent);
			this.editor = createEditorInstance({
				element: this.$refs.content,
				editable: this.effectiveEditable,
				extensions,
				editorProps: {
					attributes: {
						class: 'note-editor-prose',
						autocomplete: 'off',
						autocorrect: 'off',
						autocapitalize: 'off',
						'aria-label': 'Document editor',
					},
					handleDOMEvents: {
						click: (_view, event) => this.handleEditorAnchorClick(event),
					},
				},
				content: isMarkdownContent ? undefined : resolvedContent,
				onUpdate: ({ editor }) => {
					const json = editor.getJSON();
					this.lastEmittedModelValue = JSON.stringify(json);
					this.internalUpdateDepth += 1;
					this.$emit('update:modelValue', json);
					this.$emit('update:content', json);
					setTimeout(() => {
						this.internalUpdateDepth = Math.max(0, this.internalUpdateDepth - 1);
					}, 0);
					this.editorTick += 1;
				},
				onSelectionUpdate: () => {
					this.editorTick += 1;
				},
				onTransaction: () => {
					this.editorTick += 1;
				},
				onCreate: ({ editor }) => {
					this.$emit('ready', editor);
				},
			});
			if (isMarkdownContent)
			{
				const { doc } = safeParseMarkdown(this.editor, resolvedContent);
				this.editor.commands.setContent(doc, false);
			}
			this.editor.registerPlugin(createLinkSelectionDecorationPlugin());
		},
		resolveInitialContent(): Object
		{
			return this.modelValue ?? this.content ?? DEFAULT_CONTENT;
		},
		resolveUploadService(): Object
		{
			const uploadAdapter = this.uploadAdapter ?? FileUploadService;

			return createScopedUploadService(uploadAdapter, this.collectionId, this.documentId);
		},
		serializeContent(value: Object | string): string
		{
			if (Type.isString(value))
			{
				return value;
			}

			return JSON.stringify(value);
		},
		syncIncomingContent(nextValue: mixed): void
		{
			if (this.provider)
			{
				return;
			}

			if (!this.editor || nextValue === null || nextValue === undefined)
			{
				return;
			}

			const incomingSerialized = this.serializeContent(nextValue);
			if (this.internalUpdateDepth > 0 && incomingSerialized === this.lastEmittedModelValue)
			{
				return;
			}

			const currentValue = this.editor.getJSON();
			const currentSerialized = this.serializeContent(currentValue);
			if (currentSerialized === incomingSerialized)
			{
				return;
			}

			if (Type.isString(nextValue))
			{
				const { doc } = safeParseMarkdown(this.editor, nextValue);
				this.editor.commands.setContent(doc, false);
			}
			else
			{
				this.editor.commands.setContent(nextValue, false);
			}
			this.editorTick += 1;
		},
		handleInsertFileStub(): void
		{
			if (!this.editor?.isEditable)
			{
				return;
			}

			insertUploadAssetNode(this.editor, 'file', {
				documentId: this.documentId,
				collectionId: this.collectionId,
			});
		},
		handleInsertImageStub(): void
		{
			if (!this.editor?.isEditable)
			{
				return;
			}

			insertUploadAssetNode(this.editor, 'image', {
				documentId: this.documentId,
				collectionId: this.collectionId,
			});
		},
		handleInsertVideoStub(): void
		{
			if (!this.editor?.isEditable)
			{
				return;
			}

			insertUploadAssetNode(this.editor, 'video', {
				documentId: this.documentId,
				collectionId: this.collectionId,
			});
		},
	},
	// language=Vue
	template: `
		<div ref="root" class="note-editor-root" :style="{ '--note-editor-toolbar-sticky-top': toolbarTop + 'px' }">
			<div ref="toolbarAnchor"></div>
			<EditorToolbarComponent
				v-if="showToolbarLocal"
				:editor="editor"
				:heading-level="headingLevel"
				:editor-tick="editorTick"
				:can-undo="canUndo"
				:can-redo="canRedo"
				:max-image-size="${MAX_IMAGE_SIZE}"
				:max-file-size="${MAX_FILE_SIZE}"
				:fixed="toolbarFixed"
				:fixed-top="toolbarTop"
				:fixed-left="toolbarLeft"
				:fixed-max-width="toolbarMaxWidth"
				@insertFileStub="handleInsertFileStub"
				@insertImageStub="handleInsertImageStub"
				@insertVideoStub="handleInsertVideoStub"
			/>
			<div v-if="showToolbarLocal && toolbarFixed" class="note-editor-toolbar-placeholder"></div>
			<div v-if="displayTitle || effectiveEditable" class="note-editor-title-block">
				<h1
					ref="titleEl"
					class="note-editor-title"
					:contenteditable="effectiveEditable"
					@focus="onTitleFocus"
					@blur="onTitleBlur"
					@keydown="onTitleKeydown"
					@paste="onTitlePaste"
				>{{ displayTitle }}</h1>
			</div>
			<div ref="contentWrapper" class="note-editor-content-wrapper">
				<div ref="content" class="note-editor-content"></div>
			</div>
			<TableContextMenuComponent :editor="editor" :editor-tick="editorTick" />
			<LinkFloatingPopupComponent :editor="editor" :editor-tick="editorTick" />
		</div>
	`,
};
