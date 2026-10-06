import { Type, Loc } from 'main.core';
import { EditorToolbarComponent } from './editor-toolbar';
import { TableContextMenuComponent } from './table-context-menu';
import { LinkFloatingPopupComponent } from './link-floating-popup';
import { ActivityLineComponent, createHistoryMessages } from 'note.ui.document-history';
import { Loader } from 'note.ui.loader';
import { createEditorExtensions, MAX_FILE_SIZE, MAX_IMAGE_SIZE } from '../extensions/registry';
import { FileUploadService } from '../services/file-upload-service';
import { createEditorInstance } from '../utils/create-editor-instance';
import { resolveCanRedo, resolveCanUndo, resolveHeadingLevel } from '../utils/editor-state';
import { ToolbarPositionTracker } from '../utils/toolbar-tracking';
import { normalizeCurrentUser } from '../utils/normalize';
import { safeParseMarkdown } from '../utils/safe-parse-markdown';
import type { CurrentUser } from '../type';
import { createLinkSelectionDecorationPlugin } from '../extensions/link-selection-decoration';
import { createAttachmentSelectionDecorationPlugin } from '../extensions/attachment-selection-decoration';
import { buildVersionDiffDoc } from '../extensions/version-diff';
import { parseInternalNoteLink } from '../utils/internal-link';
import { isAllowedUrl, openViaMobileApp, openLinkNative } from '../utils/open-link';
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
		ActivityLineComponent,
		Loader,
		// [#11 rework] NoteDocumentEditor (self) is registered right after this object literal —
		// see the self-registration statement at the end of the file and the `contentOnly` prop doc.
	},
	props: {
		// [#11 rework] True only for the nested read-only instance this component mounts for
		// itself while previewing a version (see `isPreviewMode`/`setPreview` below): suppresses
		// the title block and the activity line, which the OUTER instance already renders (the
		// preview only replaces the document body, not the whole page chrome).
		contentOnly: {
			type: Boolean,
			default: false,
		},
		// [version-diff] Preview-only props (set on the nested content-only instance): when
		// `diffHighlight` is on and `diffBaseMarkdown` holds the live document's markdown, the
		// preview overlays a diff of the rendered version against that base (see applyVersionDiff).
		diffHighlight: {
			type: Boolean,
			default: false,
		},
		diffBaseMarkdown: {
			type: String,
			default: null,
		},
		editable: {
			type: Boolean,
			default: true,
		},
		showToolbar: {
			type: Boolean,
			default: true,
		},
		// Off for embedded surfaces that are not a document page (the collection description):
		// the activity line's chip/views/bell belong to a document the user navigated to, and
		// skipping the component also skips its own views/subscription requests.
		showActivityLine: {
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
		onMentionClick: {
			type: Function,
			default: null,
		},
		// [P1.T5 relocation, #2] Activity line hub (chip / eye / bell), rendered right under the
		// <h1> title — that DOM lives in this component, not in note-document-page.js.
		// ActivityLineComponent now lives in the note.ui.document-history extension and owns its
		// own lang (see historyMessages below). `lastChange` is `{ authors, time } | null`,
		// normalized upstream in note.app's route-document-resolver.js and threaded through
		// create-document-state.js/EditorMount (the bell is self-contained since P6.T4 — no
		// `subscribed` prop needed).
		lastChange: {
			type: Object,
			default: null,
		},
		// [P8.T5] ISO creation timestamp — passed through to ActivityLineComponent for the chip's
		// "Created <date>" fallback when there is no last-change info.
		createdAt: {
			type: String,
			default: null,
		},
		// [P8.T2/T3] Bootstrap UI flags. historyEnabled gates the chip's history-open affordance;
		// notificationsEnabled gates the subscription bell. Both default off (hidden).
		historyEnabled: {
			type: Boolean,
			default: false,
		},
		notificationsEnabled: {
			type: Boolean,
			default: false,
		},
		// [#6] Initial "who viewed" snapshot bundled with the document bootstrap payload —
		// passed straight through to ActivityLineComponent/ViewsWidgetComponent, which uses it
		// as a base and skips its own getViews call when present (see note.editor's type.js).
		initialViews: {
			type: Object,
			default: null,
		},
		// [DTO-01] Backlinks counter bundled with the document bootstrap payload — passed through to
		// ActivityLineComponent/BacklinksWidgetComponent, which adopts it instead of reading the count
		// itself (see note.editor's type.js). `null` = nothing reported, the widget asks on its own.
		initialBacklinks: {
			type: Object,
			default: null,
		},
		// Bell state bundled with the document bootstrap — passed through to ActivityLineComponent/
		// SubscriptionBellComponent so the bell skips its own getState call on mount.
		initialSubscription: {
			type: Object,
			default: null,
		},
		// [TPL-01] "In favorites" flag bundled with the document bootstrap - passed through to
		// ActivityLineComponent/FavoriteStarComponent so the star is right on the first frame of a
		// document opened by a direct link. `null` = nothing reported, the star reads the sidebar only.
		initialFavorite: {
			type: Boolean,
			default: null,
		},
	},
	emits: ['ready', 'update:modelValue', 'update:content', 'rename-title', 'open-internal-link', 'open-history'],
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
			// Toolbar enter/leave animation state. `toolbarInDom` keeps the node mounted
			// through the leave transition; `toolbarShown` toggles the `.is-visible` class
			// the CSS transition animates. Driven by a rAF (not Vue <Transition>, which
			// force-reflows on every toggle).
			toolbarInDom: this.showToolbar,
			toolbarShown: this.showToolbar,
			// [#11/#12 rework] Version-preview state — driven imperatively by EditorMount's
			// setPreview()/clearPreview() (see create-document-feature.js's showVersionPreview/
			// hideVersionPreview), not by props: this instance is mounted once via
			// BitrixVue.createApp and its props don't re-flow reactively from outside afterwards
			// (the same reason `title` is pushed via `updateTitle()` instead of a prop watcher).
			previewActive: false,
			previewLoading: false,
			previewMarkdown: null,
			previewMeta: null,
			previewError: false,
			// [version-diff] Diff state pushed down to the nested preview instance as reactive props
			// (unlike the imperative preview-body state above, this crosses an ordinary Vue child
			// boundary, so a plain data->prop binding is enough).
			previewDiffHighlight: false,
			previewDiffBaseMarkdown: null,
		};
	},
	computed: {
		isPreviewMode(): boolean
		{
			return this.previewActive;
		},
		displayTitle(): string
		{
			if (this.internalTitle)
			{
				return this.internalTitle;
			}

			const id = Number(this.documentId);

			return id > 0 ? `${Loc.getMessage('NOTE_EDITOR_DOCUMENT_TITLE')} #${id}` : '';
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
		// Static per-request lang strings for the history hub (note.ui.document-history owns
		// its own lang now — see that extension's src/messages.js).
		historyMessages(): Object
		{
			return createHistoryMessages();
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
		showToolbarLocal(nextShow)
		{
			this.animateToolbar(Boolean(nextShow));
		},
		editableLocal()
		{
			this.applyEditableState();
		},
		readOnly(nextReadOnly)
		{
			void nextReadOnly;
			this.applyEditableState();
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
		// [version-diff] The highlight toggle is NOT watched here: the diff is baked into the doc once
		// per version, and showing/hiding it is a pure CSS class flip on the preview wrapper (driven by
		// the parent's previewDiffHighlight) — no content reload, no re-resolve. Only a change of the
		// base document (i.e. a version switch) rebuilds the merged doc. The version body itself is
		// handled by the content watcher → syncIncomingContent → renderPreviewDoc.
		diffBaseMarkdown()
		{
			this.renderPreviewDoc();
		},
	},
	created()
	{
		// Non-reactive handles for the toolbar enter/leave animation.
		this.toolbarEnterRaf = 0;
		this.toolbarLeaveTimer = 0;
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
		this.clearToolbarAnim();
		this.toolbarTracker?.stop();
		this.editor?.off?.('note:hotkey', this.handleEditorHotkeyIntent);
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
			if (parsed)
			{
				event.preventDefault();
				this.$emit('open-internal-link', parsed);

				return true;
			}

			// External / non-note link: inside the mobile app route it through the
			// native bridge instead of escaping to the OS browser. Desktop keeps
			// the browser's default anchor navigation.
			// Same scheme allowlist as the mention path — disallowed schemes fall through to default anchor behaviour.
			if (isAllowedUrl(anchor.href) && openViaMobileApp(anchor.href))
			{
				event.preventDefault();

				return true;
			}

			return false;
		},
		updateTitle(newTitle: string): void
		{
			this.internalTitle = newTitle;
		},
		handleOpenHistory(): void
		{
			this.$emit('open-history');
		},
		// Reuses the mention-chip navigation contract (open-link.js): native user card in the
		// mobile app, a new tab on desktop. Handed down to the activity line's avatar stack.
		openUserProfile(userId: number): void
		{
			const id = Number(userId);
			if (!Number.isInteger(id) || id <= 0)
			{
				return;
			}

			openLinkNative(`/company/personal/user/${id}/`);
		},
		// [#11/NEW-A rework] Called imperatively by EditorMount (see create-document-feature.js's
		// showVersionPreview) — merges partial state so the caller can call it once with
		// `{ loading: true, meta }` to show the loader immediately, then again with just
		// `{ loading: false, markdown }` once the version body has loaded, without re-sending
		// `meta`. Never touches `this.editor` (the live, collaboration-bound instance) — the
		// preview body renders in a separate nested instance of this same component instead
		// (see `contentOnly` prop and the template's `isPreviewMode` branch).
		setPreview({ loading = false, markdown = null, meta = null, error = false, highlight = null, baseMarkdown = null }: {
			loading?: boolean,
			markdown?: string | null,
			meta?: Object | null,
			error?: boolean,
			highlight?: boolean | null,
			baseMarkdown?: string | null,
		} = {}): void
		{
			this.previewActive = true;
			this.previewLoading = loading;
			this.previewError = error;

			if (markdown !== null)
			{
				this.previewMarkdown = markdown;
			}

			if (meta !== null)
			{
				this.previewMeta = meta;
			}

			// [version-diff] Merge-updatable like the fields above: a highlight toggle re-calls
			// setPreview with only `highlight`/`baseMarkdown`, leaving the loaded body untouched.
			if (highlight !== null)
			{
				this.previewDiffHighlight = Boolean(highlight);
			}

			if (baseMarkdown !== null)
			{
				this.previewDiffBaseMarkdown = baseMarkdown;
			}
		},
		clearPreview(): void
		{
			this.previewActive = false;
			this.previewLoading = false;
			this.previewMarkdown = null;
			this.previewMeta = null;
			this.previewError = false;
			this.previewDiffHighlight = false;
			this.previewDiffBaseMarkdown = null;
		},
		// [version-diff] Renders the preview body for the content-only instance, baking the diff into
		// the document ONCE per version. When a base (previous) version is present it builds the merged
		// doc (version N + spliced-in removed N-1 slices, every change tagged by the diffChange mark /
		// diffState attr); otherwise it renders the plain version. Called on create and on a version
		// switch (content / base change) — NOT on the highlight toggle, which is a pure CSS flip. A
		// signature guard skips redundant rebuilds so the two watchers firing on one switch cost one
		// setContent. setContent(doc, false) emits no update and there is no provider — fully inert.
		renderPreviewDoc(): void
		{
			const editor = this.editor;
			if (!editor || !this.contentOnly)
			{
				return;
			}

			const markdown = Type.isString(this.content) ? this.content : '';
			const hasBase = Type.isString(this.diffBaseMarkdown);
			const signature = `${markdown}\0${hasBase ? `1:${this.diffBaseMarkdown}` : `0`}`;
			if (signature === this.previewDocSignature)
			{
				return;
			}
			this.previewDocSignature = signature;

			const versionDocJson = safeParseMarkdown(editor, markdown).doc;
			const doc = hasBase
				? buildVersionDiffDoc(editor.schema, versionDocJson, safeParseMarkdown(editor, this.diffBaseMarkdown).doc)
				: versionDocJson;

			editor.commands.setContent(doc, false);
			this.editorTick += 1;
		},
		setEditable(value: boolean): void
		{
			this.editableLocal = Boolean(value);
		},
		applyEditableState(): void
		{
			const editor = this.editor;
			if (!editor)
			{
				return;
			}

			editor.setEditable(this.effectiveEditable);

			// Leaving edit mode: drop the lingering selection so the attachment outline doesn't
			// stay drawn (and handles don't re-surface) once back in view mode.
			if (!this.effectiveEditable && !editor.state.selection.empty)
			{
				editor.commands.setTextSelection(editor.state.selection.from);
				editor.commands.blur();
			}
		},
		setShowToolbar(value: boolean): void
		{
			this.showToolbarLocal = Boolean(value);
		},
		animateToolbar(show: boolean): void
		{
			this.clearToolbarAnim();

			if (show)
			{
				// Mount at the "from" state (no .is-visible), let the browser paint it, then
				// flip to visible so the transition has a committed start value. Double rAF
				// (paint the from-state on frame 1, animate on frame 2) does what Vue's
				// forceReflow() does, but without the synchronous document.body.offsetHeight
				// read that was causing the jank.
				this.toolbarInDom = true;
				this.$nextTick(() => {
					this.toolbarEnterRaf = requestAnimationFrame(() => {
						this.toolbarEnterRaf = requestAnimationFrame(() => {
							this.toolbarShown = true;
						});
					});
				});
			}
			else
			{
				// Play the leave transition, then unmount once it has finished (see
				// --note-editor-toolbar-anim duration mirrored in editor.css).
				this.toolbarShown = false;
				this.toolbarLeaveTimer = setTimeout(() => {
					this.toolbarInDom = false;
				}, 200);
			}
		},
		clearToolbarAnim(): void
		{
			if (this.toolbarEnterRaf)
			{
				cancelAnimationFrame(this.toolbarEnterRaf);
				this.toolbarEnterRaf = 0;
			}

			if (this.toolbarLeaveTimer)
			{
				clearTimeout(this.toolbarLeaveTimer);
				this.toolbarLeaveTimer = 0;
			}
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
					onMentionClick: typeof this.onMentionClick === 'function' ? this.onMentionClick : null,
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
			// The preview instance sets its own body via renderPreviewDoc (baking the diff) below —
			// skip the plain initial setContent for it to avoid a throwaway render + double resolve.
			if (isMarkdownContent && !this.contentOnly)
			{
				const { doc } = safeParseMarkdown(this.editor, resolvedContent);
				this.editor.commands.setContent(doc, false);
			}
			this.editor.registerPlugin(createLinkSelectionDecorationPlugin());
			this.editor.registerPlugin(createAttachmentSelectionDecorationPlugin());
			// The attachments hotkey can't insert an upload node from the keymap (no document/collection
			// context there), so it emits an intent the live editor turns into the same file tile the
			// `+` menu inserts — see handleEditorHotkeyIntent. Preview instances don't edit, so skip.
			if (!this.contentOnly)
			{
				this.editor.on('note:hotkey', this.handleEditorHotkeyIntent);
			}
			// [version-diff] The preview instance bakes the diff into its body here; the live instance
			// (no base markdown) just renders the plain content. Nothing to do for the live editor.
			if (this.contentOnly)
			{
				this.renderPreviewDoc();
			}
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

			// [version-diff] The preview instance owns its body via renderPreviewDoc, which bakes the
			// diff and dedups by (version + base) signature — bypass the plain-content sync entirely.
			if (this.contentOnly)
			{
				this.renderPreviewDoc();

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
		// Attachments hotkey (see hotkeys-bindings.js `insertFileNode`): drop a file tile at the caret
		// and select it, so a click browses-and-uploads while an arrow key / click-away just moves on.
		handleEditorHotkeyIntent(payload: Object): void
		{
			if (payload?.action !== 'insertFileNode' || !this.editor?.isEditable)
			{
				return;
			}

			insertUploadAssetNode(this.editor, 'file', {
				documentId: this.documentId,
				collectionId: this.collectionId,
				select: true,
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
				v-if="toolbarInDom && !isPreviewMode"
				:class="{ 'is-visible': toolbarShown }"
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
			<div v-if="toolbarInDom && toolbarFixed && !isPreviewMode" class="note-editor-toolbar-placeholder" :class="{ 'is-visible': toolbarShown }"></div>
			<div v-if="!contentOnly && (displayTitle || effectiveEditable)" class="note-editor-title-block">
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
			<ActivityLineComponent
				v-if="!contentOnly && showActivityLine"
				:document-id="Number(documentId)"
				:collection-id="Number(collectionId) || 0"
				:provider="provider"
				:can-edit="effectiveEditable"
				:messages="historyMessages"
				:last-change="lastChange"
				:created-at="createdAt"
				:history-enabled="historyEnabled"
				:notifications-enabled="notificationsEnabled"
				:preview-info="isPreviewMode ? previewMeta : null"
				:initial-views="initialViews"
				:initial-backlinks="initialBacklinks"
				:initial-subscription="initialSubscription"
				:initial-favorite="initialFavorite"
				:document-title="displayTitle"
				:current-user="normalizedCurrentUser"
				:open-user-profile="openUserProfile"
				@open-history="handleOpenHistory"
				@open-internal-link="$emit('open-internal-link', $event)"
			/>
			<div v-if="isPreviewMode" class="note-editor-content-wrapper note-editor-content-wrapper--preview" :class="{ 'note-editor-content-wrapper--diff': previewDiffHighlight }" role="region" :aria-label="historyMessages.historyPreviewLabel">
				<div v-if="previewLoading" class="note-editor-document-loading" role="status" :aria-label="historyMessages.historyPreviewLabel">
					<Loader :label="historyMessages.historyPreviewLabel" />
				</div>
				<div v-else-if="previewError" class="note-editor-preview-error">{{ historyMessages.historyPreviewLoadError }}</div>
				<NoteDocumentEditor
					v-else
					key="version-preview"
					:document-id="documentId"
					:content="previewMarkdown"
					:read-only="true"
					:editable="false"
					:show-toolbar="false"
					:content-only="true"
					:diff-highlight="previewDiffHighlight"
					:diff-base-markdown="previewDiffBaseMarkdown"
				/>
			</div>
			<div v-show="!isPreviewMode" ref="contentWrapper" class="note-editor-content-wrapper">
				<div ref="content" class="note-editor-content"></div>
			</div>
			<TableContextMenuComponent :editor="editor" :editor-tick="editorTick" />
			<LinkFloatingPopupComponent :editor="editor" :editor-tick="editorTick" />
		</div>
	`,
};

// [#11 rework] Self-registration for the nested read-only preview instance (see `contentOnly`
// prop + template above) — added after the object literal so the reference exists by the time
// Vue resolves `<NoteDocumentEditor>` at render time (component resolution is lazy).
DocumentEditorComponent.components.NoteDocumentEditor = DocumentEditorComponent;
