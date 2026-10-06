import { Loc } from 'main.core';
import { NoteDocumentEmbedComponent } from 'note.editor';

// Mirror of NoteDocumentEmbedComponent's `state-change` payload (owned by note.editor). Declared
// locally because a cross-extension type import would have to be re-exported from the note.editor
// facade; keep this shape in sync with the emitter.
type NoteDocumentEmbedState = {
	isEditMode: boolean,
	canEdit: boolean,
	isSaving: boolean,
	isEmpty: boolean,
};

// Payload this panel reports up to the workspace top bar through `state-change`.
export type NoteAboutState = {
	ready: boolean,
	error: boolean,
	isEditMode: boolean,
	isSaving: boolean,
	isEmpty: boolean,
	canEdit: boolean,
	saveBlockedReason: ?string,
};

// Renders the collection's main document (the "About" description) inline, using the shared
// note.editor engine through NoteDocumentEmbedComponent. The edit trigger lives in the workspace
// page "..." menu and the "Done" control in its top bar - this panel owns only the
// document surface and reports its state upward via `state-change`, while the parent drives
// enterEditMode()/finishEdit() through a template ref. Autosave flows through the editor's
// collaboration provider, exactly like a regular document. The main document
// always exists (eager-created + backfilled), so an empty description is just an empty main
// document waiting to be filled.
export const AboutPanel = {
	name: 'NoteWorkspaceAboutPanel',
	components: {
		NoteDocumentEmbedComponent,
	},
	props: {
		mainDocumentId: { type: Number, default: 0 },
		hasDescription: { type: Boolean, default: false },
		canManage: { type: Boolean, default: false },
	},
	emits: ['open-internal-link', 'state-change'],
	data()
	{
		return {
			embedReady: false,
			embedError: false,
			isEditMode: false,
			isSaving: false,
			// Set true when the admin chooses to add a description for an empty (unmounted) doc: it
			// mounts the editor, then onEmbedReady enters edit on the freshly mounted surface.
			pendingEdit: false,
			// Live emptiness of the description. Seeded from hasDescription until the embed loads,
			// then driven by the editor's real content so a freshly filled/cleared description
			// switches between editor and empty state without a stale placeholder.
			contentEmpty: !this.hasDescription,
			// Document-level editability reported by the embed. Null while unknown (editor not mounted
			// or not yet reported); the collection-level `canManage` seeds the affordance until then.
			embedCanEdit: null,
			// Why saving is unavailable, or null when it is available. Reported by the embed and passed
			// on to the top bar, which owns the "Done" button this panel does not render.
			saveBlockedReason: null,
		};
	},
	computed: {
		messages(): Object
		{
			return {
				emptyReader: Loc.getMessage('NOTE_WORKSPACE_DESCRIPTION_EMPTY_READER') || '',
				emptyAdmin: Loc.getMessage('NOTE_WORKSPACE_DESCRIPTION_EMPTY_ADMIN') || '',
			};
		},
		hasMainDocument(): boolean
		{
			return Number(this.mainDocumentId) > 0;
		},
		canEdit(): boolean
		{
			// Before the embed reports its document-level right, fall back to the collection-level
			// seed so an empty (unmounted) description can still offer "Add description". Once the
			// editor is mounted and has reported, honor the real document-level editability so the
			// menu never offers "Edit" for a document the editor will not let this user edit.
			if (this.embedCanEdit === null)
			{
				return Boolean(this.canManage);
			}

			return this.embedCanEdit;
		},
		hasContent(): boolean
		{
			return !this.contentEmpty;
		},
		// Mount the collaborative editor only when there is content to render, the user is
		// entering/using edit mode, or a load error must stay visible. An empty description in view
		// mode skips the whole tiptap/yjs stack (provider.connect, PULL, compaction, idle tracker).
		shouldMountEmbed(): boolean
		{
			return this.hasMainDocument
				&& (this.hasContent || this.isEditMode || this.pendingEdit || this.embedError);
		},
		// Empty + view: nothing to load, so the panel is ready immediately and the top bar can offer
		// "Add description". When the editor is mounted, readiness follows the embed.
		isReady(): boolean
		{
			return this.shouldMountEmbed ? this.embedReady : this.hasMainDocument;
		},
		// Placeholder for an empty description with nobody editing. For the unmounted empty case it
		// is driven purely by the server seed (contentEmpty), without waiting for the editor to load.
		showEmptyState(): boolean
		{
			if (this.embedError || this.isEditMode || this.pendingEdit)
			{
				return false;
			}

			if (!this.shouldMountEmbed)
			{
				return this.hasMainDocument && this.contentEmpty;
			}

			return this.embedReady && this.contentEmpty;
		},
		emptyText(): string
		{
			return this.canEdit ? this.messages.emptyAdmin : this.messages.emptyReader;
		},
	},
	watch: {
		mainDocumentId(): void
		{
			this.resetState();
		},
		hasDescription(next): void
		{
			// Only the seed matters - once the embed reports real content, it owns contentEmpty.
			if (!this.embedReady)
			{
				this.contentEmpty = !next;
				this.emitState();
			}
		},
	},
	mounted(): void
	{
		// The top bar renders as soon as this panel mounts; hand it the initial (not-yet-ready) state.
		this.emitState();
	},
	methods: {
		resetState(): void
		{
			this.embedReady = false;
			this.embedError = false;
			this.isEditMode = false;
			this.isSaving = false;
			this.pendingEdit = false;
			this.contentEmpty = !this.hasDescription;
			this.embedCanEdit = null;
			this.saveBlockedReason = null;
			this.emitState();
		},
		emitState(): void
		{
			const payload: NoteAboutState = {
				ready: this.isReady,
				error: this.embedError,
				isEditMode: this.isEditMode,
				isSaving: this.isSaving,
				isEmpty: this.contentEmpty,
				canEdit: this.canEdit,
				saveBlockedReason: this.saveBlockedReason,
			};

			this.$emit('state-change', payload);
		},
		onEmbedReady(payload: Object): void
		{
			this.embedReady = true;
			this.embedError = false;
			this.contentEmpty = Boolean(payload?.isEmpty);

			// Deferred-edit path: the editor was mounted because the admin chose to add a
			// description; enter edit now that the freshly mounted surface is ready.
			if (this.pendingEdit)
			{
				this.pendingEdit = false;
				this.$refs.embed?.enterEditMode?.();
			}

			this.emitState();
		},
		onEmbedStateChange(payload: NoteDocumentEmbedState): void
		{
			this.isEditMode = Boolean(payload?.isEditMode);
			this.isSaving = Boolean(payload?.isSaving);
			this.saveBlockedReason = payload?.saveBlockedReason ?? null;
			// Emptiness becomes authoritative only once the embed has loaded (the `ready` event
			// delivers the first payload-based value). The embed also emits `state-change` mid-load
			// when canEdit/isEditMode settle, and at that point its `contentEmpty` is still the stale
			// mount-time default (true). Trusting it here would flip contentEmpty -> true, drop
			// shouldMountEmbed, and unmount the embed before `ready` fires - leaving the empty-state
			// placeholder over a document that actually has a description. So hold the server seed
			// (hasDescription) until ready; after that, follow the editor's live emptiness.
			if (this.embedReady)
			{
				this.contentEmpty = Boolean(payload?.isEmpty);
			}
			// The embed owns document-level editability once mounted; from here the affordance
			// follows the editor's real canEdit instead of the collection-level seed.
			this.embedCanEdit = Boolean(payload?.canEdit);
			this.emitState();
		},
		onEmbedError(): void
		{
			this.embedError = true;
			this.embedReady = false;
			// embedError keeps the surface mounted (shouldMountEmbed) so the error stays visible.
			this.pendingEdit = false;
			this.emitState();
		},
		onOpenInternalLink(payload: Object): void
		{
			this.$emit('open-internal-link', payload);
		},
		// Public API driven by the workspace page top bar (through a template ref).
		enterEditMode(): void
		{
			const embed = this.$refs.embed;
			if (embed && this.embedReady)
			{
				embed.enterEditMode?.();

				return;
			}

			// Either the editor is not mounted yet (empty description in view mode - PERF: no
			// collaborative stack for an empty doc), or it is still loading because the tab has just
			// been switched. Both cases arm the deferred entry: enterEditMode() is a no-op while the
			// document loads, so onEmbedReady performs it once the surface is live.
			this.pendingEdit = true;
		},
		finishEdit(): void
		{
			this.$refs.embed?.finishEdit?.();
		},
	},
	// language=Vue
	template: `
		<div
			class="note-workspace-about"
			:class="{ 'note-workspace-about--editing': isEditMode }"
			data-testid="note-about-panel"
		>
			<NoteDocumentEmbedComponent
				v-if="shouldMountEmbed"
				ref="embed"
				:key="mainDocumentId"
				:document-id="mainDocumentId"
				@ready="onEmbedReady"
				@state-change="onEmbedStateChange"
				@load-error="onEmbedError"
				@open-internal-link="onOpenInternalLink"
			/>

			<div
				v-if="showEmptyState"
				class="note-workspace-page__empty note-workspace-about__empty"
				:data-testid="canEdit ? 'note-about-panel-empty-admin' : 'note-about-panel-empty-reader'"
			>
				<div class="note-workspace-page__empty-image" aria-hidden="true"></div>
				<p class="note-workspace-page__empty-text">{{ emptyText }}</p>
			</div>
		</div>
	`,
};
