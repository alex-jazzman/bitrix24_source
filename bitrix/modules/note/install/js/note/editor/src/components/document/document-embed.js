import { ajax, Type } from 'main.core';
import { Loader } from 'note.ui.loader';
import { createDocumentState } from '../../feature/create-document-state';
import { createDocumentFeature } from '../../feature/create-document-feature';

const ACTION_GET_DOCUMENT = 'note.infrastructure.DocumentController.get';

// Payload reported upward through `state-change`. Keep this shape in sync with the AboutPanel
// relay (note.workspace) and its top-bar consumer, which mirror the same named type.
export type NoteDocumentEmbedState = {
	isEditMode: boolean,
	canEdit: boolean,
	isSaving: boolean,
	isEmpty: boolean,
	saveBlockedReason: ?string,
};

// Embeddable, router-agnostic surface for editing a single document inline (used by the
// workspace "About" tab for the collection's main document). It reuses the exact editing
// engine of the full document page - createDocumentFeature + the shared DocumentEditorComponent
// mounted into #state.editorMountId - so autosave via the collaboration provider works the same.
//
// Unlike NoteDocumentPageComponent it owns no router/teleport wiring: it renders only the editor
// host, exposes enterEditMode()/finishEdit() for the parent toolbar, and surfaces state through
// events (`ready`, `state-change`, `load-error`, `open-internal-link`). The parent decides when
// to show the toolbar, the empty state, and how to navigate internal links.
export const NoteDocumentEmbedComponent = {
	name: 'NoteDocumentEmbed',
	components: {
		Loader,
	},
	props: {
		documentId: {
			type: Number,
			required: true,
		},
		// Optional pre-fetched DocumentController.get payload; when absent the component loads it itself.
		preloadedDocument: {
			type: Object,
			default: null,
		},
	},
	emits: ['ready', 'state-change', 'load-error', 'open-internal-link'],
	data()
	{
		return {
			state: createDocumentState(),
			feature: null,
			loadError: false,
			requestId: 0,
			// Reactive emptiness of the document. Seeded from the loaded payload and kept live by the
			// feature's onContentChange callback (local and remote edits), so a filled/cleared
			// document re-emits state-change via stateKey without a mode/save/ACL flip.
			contentEmpty: true,
		};
	},
	computed: {
		isLoading(): boolean
		{
			return Boolean(this.state.isLoading);
		},
		isEditMode(): boolean
		{
			return this.state.mode === 'edit';
		},
		canEditContent(): boolean
		{
			return Boolean(this.state.canEdit);
		},
		// The right to edit is intact and the body stays editable; what this reports is that the way back
		// to the server is closed. The surface that owns the Done button is elsewhere (the workspace top
		// bar), so it has to be told - the block itself is enforced in the controller either way.
		saveBlockedReason(): ?string
		{
			return this.feature?.saveBlockedReason?.() ?? null;
		},
		isSaving(): boolean
		{
			return Boolean(this.state.isSaving);
		},
		loadingLabel(): string
		{
			return this.feature?.messages?.loading ?? '';
		},
		loadErrorText(): string
		{
			return this.feature?.messages?.loadError ?? '';
		},
		// Aggregate key so a single watcher re-emits `state-change` whenever any tracked flag flips.
		// Emptiness is included so a live/remote content change updates the consumer's empty-state.
		stateKey(): string
		{
			return [
				this.isEditMode,
				this.canEditContent,
				this.isSaving,
				this.contentEmpty,
				this.saveBlockedReason,
			].join('|');
		},
	},
	watch: {
		stateKey(): void
		{
			this.emitState();
		},
		documentId(): void
		{
			void this.reload();
		},
	},
	created(): void
	{
		this.feature = createDocumentFeature({
			state: this.state,
			getDocumentId: () => Number(this.documentId),
			nextTick: () => this.$nextTick(),
			onOpenInternalLink: (payload) => this.handleOpenInternalLink(payload),
			onContentChange: (isEmpty) => this.handleContentEmptyChange(isEmpty),
			// The description is not a document page: no activity chip, views counter or bell.
			showActivityLine: false,
		});
		void this.reload();
	},
	beforeUnmount(): void
	{
		this.feature?.destroy?.();
		this.feature = null;
	},
	methods: {
		async reload(): Promise<void>
		{
			const documentId = Number(this.documentId);
			const currentRequestId = ++this.requestId;
			this.loadError = false;
			this.state.isLoading = true;

			if (documentId <= 0)
			{
				// No valid document to load: settle into the same terminal error state as a failed
				// fetch instead of hanging in `isLoading` forever (public API may be mounted with a
				// bad id even though AboutPanel never mounts the embed for documentId <= 0).
				this.loadError = true;
				this.state.isLoading = false;
				this.$emit('load-error');

				return;
			}

			let document = Type.isPlainObject(this.preloadedDocument) ? this.preloadedDocument : null;

			try
			{
				if (document === null)
				{
					const response = await ajax.runAction(ACTION_GET_DOCUMENT, {
						data: { id: documentId },
					});

					if (currentRequestId !== this.requestId)
					{
						return;
					}

					document = response?.data ?? null;
				}

				if (!Type.isPlainObject(document))
				{
					throw new Error('Empty document payload');
				}

				await this.feature.applyRouteDocumentContext({
					status: 'ready',
					document,
					autoEdit: false,
					viewMode: 'normal',
				});

				if (currentRequestId !== this.requestId)
				{
					return;
				}

				// The mount inside applyRouteDocumentContext already pushed a live emptiness value;
				// refine it from the authoritative payload (a yjs doc may not expose markdown yet).
				this.contentEmpty = this.computePayloadEmpty(document);

				this.$emit('ready', { isEmpty: this.contentEmpty });
				this.emitState();
			}
			catch (error)
			{
				if (currentRequestId !== this.requestId)
				{
					return;
				}

				this.loadError = true;
				this.state.isLoading = false;
				this.$emit('load-error');
			}
		},
		emitState(): void
		{
			const payload: NoteDocumentEmbedState = {
				isEditMode: this.isEditMode,
				canEdit: this.canEditContent,
				isSaving: this.isSaving,
				isEmpty: this.contentEmpty,
				saveBlockedReason: this.saveBlockedReason,
			};

			this.$emit('state-change', payload);
		},
		// Live emptiness pushed by the feature on every editor `update` (local or remote); keeps the
		// empty-state in sync with the mounted document without a mode/save/ACL flip.
		handleContentEmptyChange(isEmpty: boolean): void
		{
			this.contentEmpty = Boolean(isEmpty);
		},
		computePayloadEmpty(document: Object): boolean
		{
			const markdown = document?.markdown ?? null;

			if (typeof markdown === 'string')
			{
				return markdown.trim() === '';
			}

			if (Type.isPlainObject(markdown))
			{
				return this.isEmptyDocJson(markdown);
			}

			// No markdown returned: a yjs document with persisted state is treated as non-empty.
			return !Type.isStringFilled(document?.yjsState ?? '');
		},
		isEmptyDocJson(doc: Object): boolean
		{
			const content = Array.isArray(doc?.content) ? doc.content : [];
			if (content.length === 0)
			{
				return true;
			}

			if (content.length === 1)
			{
				const only = content[0];
				const onlyContent = Array.isArray(only?.content) ? only.content : [];

				return only?.type === 'paragraph' && onlyContent.length === 0;
			}

			return false;
		},
		handleOpenInternalLink(payload: Object): void
		{
			if (!payload)
			{
				return;
			}

			// In-document anchor jumps stay inside this surface - the parent has no scrollport of ours.
			if (payload.type === 'anchor')
			{
				void this.feature?.scrollToAnchor?.(payload.hash);

				return;
			}

			this.$emit('open-internal-link', payload);
		},
		// Public API for the parent toolbar (called through a template ref).
		enterEditMode(): void
		{
			void this.feature?.enterEditMode?.();
		},
		finishEdit(): void
		{
			void this.feature?.finishEdit?.();
		},
	},
	// language=Vue
	template: `
		<div class="note-document-embed" data-testid="note-document-embed">
			<div
				v-if="isLoading"
				class="note-editor-document-loading"
				role="status"
				:aria-label="loadingLabel"
			>
				<Loader :label="loadingLabel" />
			</div>
			<div v-else-if="loadError" class="note-document-embed__error" role="alert" data-testid="note-document-embed-error">
				<p class="note-document-embed__error-text">{{ loadErrorText }}</p>
			</div>
			<div
				v-show="!isLoading && !loadError"
				:id="state.editorMountId"
				class="note-document-embed__host"
			></div>
		</div>
	`,
};
