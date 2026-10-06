import { createDocumentFeature } from '../../feature/create-document-feature';
import { createDocumentState } from '../../feature/create-document-state';
import { DocumentActionMenuService } from '../../services/document-action-menu-service';
import { DownloadService } from '../../application/download-service';
import { DocumentHeaderComponent } from './document-header';
import { DocumentContentComponent } from './document-content';
import { DocumentChildrenComponent } from './document-children';
import { VersionTimelineComponent, createHistoryMessages, HistoryApi, isRestoreDirtyWindowError } from 'note.ui.document-history';
import { HotkeysPanelComponent } from 'note.ui.hotkeys';
import { Browser, Loc, Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { NoteEvent, NoteRailOwner } from 'note.sidebar';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import 'ui.notification';
import { markRaw } from 'ui.vue3';
import { NoteAnalytics } from 'note.analytics';
import { copyTextToClipboard } from '../../utils/clipboard';
import { openLinkNative } from '../../utils/open-link';
import { CollaborationStatus } from '../../collaboration/collaboration-status';
import { extractErrorMessage } from '../../utils/error-message';
import { showErrorToast } from '../../utils/show-error-toast';
import { ImportMdErrorCode } from '../../feature/import/import-md-service';
import { FileUploadService } from '../../services/file-upload-service';

export const NoteDocumentPageComponent = {
	name: 'NoteDocumentPage',
	components: {
		DocumentHeaderComponent,
		DocumentContentComponent,
		DocumentChildrenComponent,
		VersionTimelineComponent,
		HotkeysPanelComponent,
		BIcon,
	},
	props: {
		documentId: {
			type: Number,
			required: true,
		},
		routeDocumentContext: {
			type: Object,
			required: true,
		},
		children: {
			type: Array,
			default: () => [],
		},
		childrenLoading: {
			type: Boolean,
			default: false,
		},
		childrenHasMore: {
			type: Boolean,
			default: false,
		},
		loadMoreChildren: {
			type: Function,
			default: () => {},
		},
		documentActions: {
			type: Object,
			default: () => ({}),
		},
	},
	// One inject block per component: a second one silently replaces the first (plain object
	// literal semantics), which is exactly how markdownIoEnabled stopped being injected and
	// the download/upload .md items disappeared from the menu even with the flag on.
	inject: {
		sidebarState: {
			from: 'noteSidebarState',
			default: () => ({}),
		},
		// Feature flag (provided by note.app): gates the download/upload .md menu items.
		markdownIoEnabled: { default: false },
		// Gates every way to reach the shortcuts help: button, `?`/`Cmd+/` listener, panel.
		hotkeysEnabled: { default: false },
	},
	data()
	{
		return {
			state: createDocumentState(),
			feature: null,
			actionMenuService: null,
			Outline,
			// [P1.T5] History sidebar open/closed — purely local UI state, not persisted.
			historyOpen: false,
			// Hotkeys help panel open/closed. Mutually exclusive with the history sidebar — both are
			// the single right-hand rail (see openHotkeys / openHistory). Purely local UI state.
			hotkeysOpen: false,
			// [EVENT-02] Last seen occupant of the right rail, including our own announcements. Two
			// jobs: deciding whether an `owner: null` of ours would clobber someone else's claim, and
			// driving the shift of the floating hotkeys button.
			railOwner: null,
			// [#11 rework] Which version (if any) the main editor currently shows a read-only
			// preview of — 0 means "no preview". Drives VersionTimelineComponent's active-tile
			// highlight, DocumentHeaderComponent's Edit→Restore morph, and the actual preview
			// content pushed across the EditorMount boundary (see handleVersionPreview below).
			previewVersionId: 0,
			previewRestoring: false,
			// [version-diff] Timeline "highlight changes" toggle — when on, an opened version
			// preview overlays its diff against the PREVIOUS version N-1 (see handleVersionPreview /
			// handleToggleDiff). A UI preference, persisted across version switches, not per-open.
			highlightChanges: false,
			// Markdown of the previous version (N-1), delivered by getVersion alongside the opened
			// version's own body — the diff base. Kept so a highlight toggle re-overlays without a
			// second fetch. Empty when the opened version is the document's first.
			previewBaseMarkdown: '',
		};
	},
	created()
	{
		// Plain instance field on purpose: a DOM node in data() would be wrapped in a reactive proxy,
		// and the proxy no longer compares equal to activeElement.
		this.hotkeysFocusOrigin = null;
		this.onRailOccupancyChanged = null;
		this.feature = createDocumentFeature({
			state: this.state,
			getDocumentId: () => this.documentId,
			nextTick: () => this.$nextTick(),
			onOpenInternalLink: (payload) => this.handleOpenInternalLink(payload),
			onHardDelete: ({ mode }) => this.handleRemoteHardDelete(mode),
			onAccessRevoked: () => this.handleAccessRevoked(),
			// [P1.T5 relocation] The activity line's chip now lives inside the editor's own
			// Vue app (see note-editor.js) — bridge its click back to this component's local
			// historyOpen state, same as it did when ActivityLineComponent was mounted here.
			// [#3] A repeat click toggles the sidebar closed instead of always (re-)opening it.
			onOpenHistory: () => this.toggleHistory(),
			// [P8.T2/T3] Bootstrap UI flags threaded to the isolated editor app (chip + bell).
			historyEnabled: Boolean(this.sidebarState?.historyEnabled),
			notificationsEnabled: Boolean(this.sidebarState?.notificationsEnabled),
		});
		this.actionMenuService = markRaw(new DocumentActionMenuService(this.feature?.messages ?? {}));
	},
	computed: {
		routeContextSyncKey(): Object
		{
			const context = this.routeDocumentContext ?? {};

			return {
				status: String(context.status || ''),
				docId: Number(context.docId || 0),
				errorMessage: String(context.errorMessage || ''),
				document: Type.isPlainObject(context.document)
					? context.document
					: null,
			};
		},
		messages(): Object
		{
			return this.feature?.messages ?? {};
		},
		// note.ui.document-history owns its own lang now (see that extension's src/messages.js) —
		// VersionTimelineComponent no longer reads from this page's own `messages`.
		historyMessages(): Object
		{
			return createHistoryMessages();
		},
		// [#11 rework] Whether the main editor currently shows a read-only version preview —
		// gates VersionTimelineComponent's active-tile highlight and DocumentHeaderComponent's
		// Edit→Restore morph.
		isPreviewing(): boolean
		{
			return this.previewVersionId > 0;
		},
		isEditMode(): boolean
		{
			return this.feature?.isEditMode?.() ?? false;
		},
		canEdit(): boolean
		{
			return this.feature?.canEdit?.() ?? false;
		},
		// Why finishing the edit session is unavailable while the right to edit is still there - null when
		// it is available. Editing stays open in that state; saving does not.
		saveBlockedReason(): ?string
		{
			return this.feature?.saveBlockedReason?.() ?? null;
		},
		isMobile(): boolean
		{
			return Boolean(this.sidebarState?.isMobile);
		},
		// [P8.T2] history_enabled bootstrap flag (from the injected sidebar root state). Gates the
		// version-timeline panel and the chip's history-open path.
		historyEnabled(): boolean
		{
			return Boolean(this.sidebarState?.historyEnabled);
		},
		// [P8.T3] notifications_enabled bootstrap flag — gates the subscription bell.
		notificationsEnabled(): boolean
		{
			return Boolean(this.sidebarState?.notificationsEnabled);
		},
		canEditCollection(): boolean
		{
			return Boolean(this.state.canEditCollection);
		},
		canManagePermissions(): boolean
		{
			return Boolean(this.state.canManagePermissions);
		},
		collectionId(): number
		{
			return Number(this.state.collectionId || 0);
		},
		sharedAccess(): boolean
		{
			return Boolean(this.state.sharedAccess);
		},
		isArchived(): boolean
		{
			return Boolean(this.state.isArchived);
		},
		isTrashed(): boolean
		{
			return Boolean(this.state.isTrashed);
		},
		trashedAt(): string | null
		{
			return this.state.trashedAt ?? null;
		},
		isOrphan(): boolean
		{
			return Boolean(this.state.isOrphan);
		},
		canRestore(): boolean
		{
			return Boolean(this.state.canRestore);
		},
		canHardDelete(): boolean
		{
			return Boolean(this.state.canHardDelete);
		},
		headerDocumentTitle(): string
		{
			return this.feature?.headerDocumentTitle?.() ?? '';
		},
		collectionLabel(): string
		{
			return this.feature?.collectionLabel?.() ?? '';
		},
		ancestors(): Array
		{
			return Array.isArray(this.state.ancestors) ? this.state.ancestors : [];
		},
		viewMode(): string
		{
			const mode = String(this.routeDocumentContext?.viewMode || '');

			return mode === '' ? 'normal' : mode;
		},
		collaborationParticipants(): Array
		{
			// While disconnected (idle timeout, offline) presence goes stale — we no longer receive
			// updates, so peers may have left without us knowing. Collapse to just self until we
			// reconnect; sync() re-broadcasts join and active peers repopulate the list.
			const remote = (
				Array.isArray(this.state.participants)
				&& this.state.collaborationStatus !== CollaborationStatus.DISCONNECTED
			)
				? this.state.participants
				: [];

			const self = this.state.currentUser || {};
			const selfId = Number(self.id) || 0;

			// Show the current user's own avatar as soon as the document is loaded — even alone,
			// so presence is visible from entry. Without a resolved self, fall back to remote peers.
			if (selfId <= 0)
			{
				return remote;
			}

			// Self is listed first, but rendered beneath peers in the stack (see header z-index).
			return [
				{
					id: selfId,
					name: String(self.name || ''),
					color: String(self.color || '#999999'),
					avatar: (typeof self.avatar === 'string' && self.avatar !== '') ? self.avatar : null,
					mode: this.state.mode === 'edit' ? 'edit' : 'view',
					hasCursor: false,
					isSelf: true,
				},
				...remote,
			];
		},
		hasChildrenBlock(): boolean
		{
			return this.children.length > 0;
		},
		hotkeysButtonLabel(): string
		{
			return Loc.getMessage('NOTE_HOTKEYS_ACTION_HELP_OPEN') || '';
		},
	},
	watch: {
		routeContextSyncKey: {
			async handler()
			{
				if (!this.feature)
				{
					return;
				}

				// [#11 rework] This component instance persists across document-to-document
				// navigation (the router reuses it for the same route, only `documentId` changes)
				// — local preview state from the PREVIOUS document must not leak into the next
				// one. The editor's own preview state is destroyed for free (applyRouteDocumentContext
				// unmounts/remounts EditorMount), but this page's own bookkeeping needs an explicit reset.
				this.previewVersionId = 0;
				this.previewRestoring = false;
				this.previewBaseMarkdown = '';

				await this.feature.applyRouteDocumentContext(this.routeDocumentContext);

				if (String(this.routeDocumentContext?.status || '') === 'ready' && this.$route?.hash)
				{
					void this.feature.scrollToAnchor(this.$route.hash);
				}
			},
			immediate: true,
		},
		'$route.hash'(nextHash)
		{
			if (this.feature && !this.state.isLoading && Type.isStringFilled(nextHash))
			{
				void this.feature.scrollToAnchor(nextHash);
			}
		},
	},
	mounted()
	{
		// Global hotkey listener lives with the panel's owning component (the panel is editor-only),
		// so it binds/unbinds with the document page. Capture phase mirrors the toolbar's own combo
		// handling and lets the input/popup guard run before the editor consumes the key.
		if (this.hotkeysEnabled)
		{
			document.addEventListener('keydown', this.handleHelpKeydown, true);
		}

		// [EVENT-02] The event only carries CHANGES, and the chat can already be open before this page
		// exists: opened on the workspace root, then a document is opened from the tree. Without this
		// initial read the floating button would come up unshifted, right on top of the open panel.
		this.railOwner = this.sidebarState?.aiChatOpen === true ? NoteRailOwner.AI_CHAT : null;
		this.onRailOccupancyChanged = (event) => this.handleRailOccupancyChanged(event);
		EventEmitter.subscribe(NoteEvent.RAIL_OCCUPANCY_CHANGED, this.onRailOccupancyChanged);
	},
	beforeUnmount()
	{
		document.removeEventListener('keydown', this.handleHelpKeydown, true);
		if (this.onRailOccupancyChanged)
		{
			EventEmitter.unsubscribe(NoteEvent.RAIL_OCCUPANCY_CHANGED, this.onRailOccupancyChanged);
			this.onRailOccupancyChanged = null;
		}
		this.actionMenuService?.destroy?.();
		this.actionMenuService = null;
		this.feature?.destroy?.();
	},
	methods: {
		enterEditMode(): void
		{
			if (this.feature)
			{
				void this.feature.enterEditMode();
			}
		},
		finishEdit(): void
		{
			if (this.feature)
			{
				void this.feature.finishEdit();
			}
		},
		scrollToParticipant(userId: number): void
		{
			this.feature?.scrollToParticipant?.(userId);
		},
		// [EVENT-02] Claim the rail for one of our two panels.
		announceRail(owner: string): void
		{
			EventEmitter.emit(NoteEvent.RAIL_OCCUPANCY_CHANGED, new BaseEvent({ data: { owner } }));
		},
		/**
		 * Announce the rail as free — but only if we are still its owner. A panel that closed because
		 * someone else walked in must stay silent: its `null` would erase the claim just made, and the
		 * new occupant would be left with the shift of the floating button reset under it.
		 */
		releaseRail(owner: string): void
		{
			if (this.railOwner !== owner)
			{
				return;
			}

			this.announceRail(null);
		},
		handleRailOccupancyChanged(event: Object): void
		{
			const owner = event?.getData()?.owner ?? null;
			this.railOwner = owner;

			if (owner !== NoteRailOwner.AI_CHAT)
			{
				return;
			}

			// Yield the rail without announcing anything: the chat has already claimed it. Closing
			// happens through the fields directly rather than through closeHistory/closeHotkeys — those
			// two also move focus, which belongs to an explicit close by the user, not to being
			// displaced.
			if (this.historyOpen)
			{
				this.historyOpen = false;
				this.exitPreview();
			}
			this.hotkeysOpen = false;
			this.hotkeysFocusOrigin = null;
		},
		openHistory(): void
		{
			// [P8.T2] history_enabled off — the timeline entry point is closed; keep it a no-op.
			if (!this.historyEnabled)
			{
				return;
			}

			// The history sidebar and the hotkeys panel share the single right-hand rail — opening
			// one closes the other.
			this.hotkeysOpen = false;
			this.historyOpen = true;
			// [EVENT-02] Claim the rail: the chat, the third resident, collapses on this.
			this.announceRail(NoteRailOwner.HISTORY);
		},
		// Reuses the mention-chip navigation contract (open-link.js): native user card in the
		// mobile app, a new tab on desktop. Handed down to the history sidebar's avatar stacks.
		openUserProfile(userId: number): void
		{
			const id = Number(userId);
			if (!Number.isInteger(id) || id <= 0)
			{
				return;
			}

			openLinkNative(`/company/personal/user/${id}/`);
		},
		closeHistory(): void
		{
			this.historyOpen = false;
			// [#11 rework, mockup closeHist→setPreview(false)] Closing the sidebar exits preview too.
			this.exitPreview();
			this.releaseRail(NoteRailOwner.HISTORY);
		},
		// [#3] The chip's own toggle: open when closed, close (same as the X button) when already open.
		toggleHistory(): void
		{
			// [P8.T2] history_enabled off — no timeline at all.
			if (!this.historyEnabled)
			{
				return;
			}

			if (this.historyOpen)
			{
				this.closeHistory();

				return;
			}

			this.openHistory();
		},
		// SC-002/SC-003: the hotkeys help panel. Opening it closes the history sidebar (shared rail).
		openHotkeys(): void
		{
			this.historyOpen = false;
			this.exitPreview();
			this.hotkeysOpen = true;
			// [EVENT-02] The hotkeys panel is a rail resident too — without this claim it and the chat
			// could be expanded at the same time, squeezing the document with two columns.
			this.announceRail(NoteRailOwner.HOTKEYS);
			// Remember where focus came from: the global shortcut can fire from anywhere on the page, and
			// the FAB is not always the right place to come back to (it is absent on mobile entirely).
			const active = this.$el?.ownerDocument?.activeElement;
			this.hotkeysFocusOrigin = active?.closest?.('.note-hotkeys-panel') ? null : (active ?? null);
			// The FAB turns visibility:hidden while the panel is open, so keyboard focus would land on
			// body. Move it into the panel (the close button is the first stop) — a keyboard anchor from
			// which Escape and Tab work naturally. openHistory() clears hotkeysOpen directly, not via
			// closeHotkeys(), so this focus dance only runs on a genuine open of the hotkeys panel.
			this.$nextTick(() => {
				this.$el?.ownerDocument?.querySelector?.('.note-hotkeys-panel__close')?.focus?.();
			});
		},
		closeHotkeys(): void
		{
			this.hotkeysOpen = false;
			this.releaseRail(NoteRailOwner.HOTKEYS);
			// Give focus back so a keyboard user isn't dropped on body while the close button they were
			// standing on turns inert: the element that opened the panel first, the FAB as a fallback.
			// Only reached on an explicit close (Escape, the close button, or toggling the FAB), never
			// when history takes over the rail.
			const origin = this.hotkeysFocusOrigin;
			this.hotkeysFocusOrigin = null;
			this.$nextTick(() => {
				if (origin?.isConnected && Type.isFunction(origin.focus))
				{
					origin.focus();

					return;
				}

				this.$refs.hotkeysFab?.focus?.();
			});
		},
		toggleHotkeys(): void
		{
			if (this.hotkeysOpen)
			{
				this.closeHotkeys();

				return;
			}

			this.openHotkeys();
		},
		// ALG-01: open the hotkeys panel on ?/Cmd+/ (Ctrl+/ off macOS), and close it (or the history
		// sidebar) on Escape. Skip while typing (input/textarea/contenteditable) or inside an open
		// popup so the combo never swallows a form/editor keystroke.
		handleHelpKeydown(event: KeyboardEvent): void
		{
			if (event.key === 'Escape' && this.hotkeysOpen)
			{
				event.preventDefault();
				this.closeHotkeys();

				return;
			}

			if (!this.isHelpCombo(event))
			{
				return;
			}

			const target = event.target;
			if (
				target
				&& (
					target.tagName === 'INPUT'
					|| target.tagName === 'TEXTAREA'
					|| target.isContentEditable === true
					|| (Type.isFunction(target.closest) && target.closest('.popup-window'))
				)
			)
			{
				return;
			}

			event.preventDefault();
			this.toggleHotkeys();
		},
		isHelpCombo(event: KeyboardEvent): boolean
		{
			const bare = event.key === '?' && !(event.ctrlKey || event.metaKey || event.altKey);
			const slash = event.key === '/'
				&& (Browser.isMac() ? event.metaKey : event.ctrlKey)
				&& !event.altKey;

			return bare || slash;
		},
		// [#11/#12/NEW-A rework] Clicking a restorable tile in VersionTimelineComponent lands
		// here (see version-timeline.js's `preview` emit). A second click on the SAME tile is the
		// explicit "exit preview" path handled by VersionTimelineComponent's own highlight — it
		// keeps emitting `preview` for that tile, so toggle off here when the id repeats.
		async handleVersionPreview({ versionId, item }: { versionId: number, item: Object }): Promise<void>
		{
			const id = Number(versionId);
			if (!Number.isInteger(id) || id <= 0)
			{
				return;
			}

			// [mobile two-screen swap] The history overlay is full-screen on mobile, covering the
			// editor preview and the header Restore button. Tapping a version leaves the list for the
			// preview screen (hide overlay, keep preview alive → editor shows it, header shows
			// Restore). Re-tapping the currently-previewed tile just re-reveals it; NO toggle-off
			// here (that would strand the user with the preview gone and no way back to the tile).
			if (this.isMobile)
			{
				this.historyOpen = false;
				if (this.previewVersionId === id)
				{
					return;
				}
			}
			else if (this.previewVersionId === id)
			{
				this.exitPreview();

				return;
			}

			this.previewVersionId = id;
			const meta = {
				authors: Array.isArray(item?.authors) ? item.authors : [],
				time: typeof item?.createdAt === 'string' ? item.createdAt : '',
			};
			this.feature?.showVersionPreview({ loading: true, meta });

			try
			{
				const response = await HistoryApi.getVersion({ documentId: this.documentId, versionId: id });
				// Stale-response guard: the user may have exited or switched to another version
				// while this request was in flight.
				if (this.previewVersionId !== id)
				{
					return;
				}

				const markdown = String(response?.data?.markdown ?? '');
				// N-1 snapshot for the diff base, delivered with the version body.
				this.previewBaseMarkdown = String(response?.data?.previousMarkdown ?? '');
				this.feature?.showVersionPreview({
					loading: false,
					markdown,
					highlight: this.highlightChanges,
					baseMarkdown: this.previewBaseMarkdown,
				});
			}
			catch (error)
			{
				if (this.previewVersionId !== id)
				{
					return;
				}

				this.feature?.showVersionPreview({ loading: false, error: true });
				showErrorToast(extractErrorMessage(error, this.historyMessages.historyPreviewLoadError));
			}
		},
		// [mobile two-screen swap] The X on the mobile preview screen is a BACK action: return to
		// the history list (reopen the overlay), keeping the preview alive so the originating tile
		// stays highlighted. Full exit to the live document happens from the list's own close button
		// (closeHistory → exitPreview). On desktop the timeline is a side column, so X stays a plain
		// exit-preview.
		handleExitPreview(): void
		{
			if (this.isMobile)
			{
				this.openHistory();

				return;
			}

			this.exitPreview();
		},
		// [#11 rework] Explicit exit path — closing the sidebar (closeHistory) and a repeat click
		// on the active tile (handleVersionPreview) both funnel here.
		exitPreview(): void
		{
			if (this.previewVersionId === 0)
			{
				return;
			}

			this.previewVersionId = 0;
			this.previewBaseMarkdown = '';
			this.feature?.hideVersionPreview();
		},
		// [version-diff] Timeline checkbox flip. Re-pushes only the diff fields to the preview
		// (merge-updatable — the loaded body stays put); the N-1 base was already fetched with
		// the version, so no second request is needed.
		handleToggleDiff(value: boolean): void
		{
			this.highlightChanges = Boolean(value);

			if (!this.isPreviewing)
			{
				return;
			}

			this.feature?.showVersionPreview({
				highlight: this.highlightChanges,
				baseMarkdown: this.previewBaseMarkdown,
			});
		},
		// [P1.T2 client flow, SDD 455-468] Relocated from VersionTimelineComponent (see that
		// extension's history — this used to live in the sidebar's own restore button). Always
		// compact the pending patch window before restoring; a 409 NOTE_RESTORE_DIRTY_WINDOW means
		// a patch landed in the gap, so compact once more and retry exactly once.
		// `operationId` is the claim this tab made before asking (restorePreviewedVersion): the same value
		// on the retry, because both attempts are the same operation as far as the tab is concerned - the
		// first one wrote nothing.
		async attemptRestore(versionId: number, operationId: ?string = null): Promise<void>
		{
			const compactBeforeRestore = this.feature?.compactBeforeRestore;
			if (typeof compactBeforeRestore === 'function')
			{
				await compactBeforeRestore();
			}

			try
			{
				await HistoryApi.restoreVersion({ documentId: this.documentId, versionId, operationId });
			}
			catch (error)
			{
				if (!isRestoreDirtyWindowError(error))
				{
					throw error;
				}

				if (typeof compactBeforeRestore === 'function')
				{
					await compactBeforeRestore();
				}
				await HistoryApi.restoreVersion({ documentId: this.documentId, versionId, operationId });
			}
		},
		async restorePreviewedVersion(): Promise<void>
		{
			if (!this.canEdit || this.previewVersionId === 0 || this.previewRestoring)
			{
				return;
			}

			const versionId = this.previewVersionId;
			this.previewRestoring = true;

			// The restore comes back as a documentContentOverwritten push, which an open edit session
			// otherwise treats as a rewrite from outside and refuses to apply over the local text. Here
			// the replacement is exactly what the user asked for, so the tab says so in advance - and
			// names the operation, so only the push reporting THIS restore is taken for the answer.
			const operationId = this.feature?.expectContentOverwrite?.() ?? null;

			try
			{
				await this.attemptRestore(versionId, operationId);
				// The restore push (documentContentOverwritten) refreshes the live editor content —
				// NEW-B suppresses the "changed by another user" toast for this, our own, restore.
				this.exitPreview();
			}
			catch (error)
			{
				// No push is coming, so the claim has to go - left behind it would let the next rewrite
				// from outside overwrite an open edit session's text.
				this.feature?.cancelExpectedContentOverwrite?.();
				showErrorToast(extractErrorMessage(error, this.historyMessages.historyRestoreError));
			}
			finally
			{
				this.previewRestoring = false;
			}
		},
		openChildDocument(child: Object): void
		{
			// Navigation to another document from within the editor.
			NoteAnalytics.documentViewed('document');
			this.$router.push({ name: 'document', params: { id: child.id } });
		},
		openAncestorDocument(documentId: number): void
		{
			const id = Number(documentId);
			if (!Number.isInteger(id) || id <= 0 || id === Number(this.documentId))
			{
				return;
			}

			// Breadcrumb navigation to another (ancestor) document from within the editor.
			NoteAnalytics.documentViewed('document');
			this.$router.push({ name: 'document', params: { id } });
		},
		openCollection(collectionId: number): void
		{
			const id = Number(collectionId);
			if (!Number.isInteger(id) || id <= 0)
			{
				return;
			}

			NoteAnalytics.collectionViewed('context_menu');
			this.$router.push({ name: 'workspace', params: { id } });
		},
		openRoot(routeName: string): void
		{
			if (typeof routeName !== 'string' || routeName === '')
			{
				return;
			}

			this.$router.push({ name: routeName });
		},
		handleRemoteHardDelete(mode: string): void
		{
			const allowedModes = ['recyclebin', 'archive', 'home'];
			const target = allowedModes.includes(mode) ? mode : 'home';
			this.$router.replace({ name: target });
		},
		handleAccessRevoked(): void
		{
			this.$router.replace({ name: 'home' });
		},
		handleOpenInternalLink(payload: Object): void
		{
			if (!payload)
			{
				return;
			}

			if (payload.type === 'anchor')
			{
				const anchorHash = String(payload.hash || '').trim();
				if (anchorHash === '')
				{
					return;
				}

				// When the hash actually changes, the `$route.hash` watcher runs
				// scrollToAnchor - calling it here too would double every jump
				// (two DOM passes, two pinning sessions). Scroll directly only
				// when the hash is unchanged and the watcher won't fire.
				const nextHash = `#${anchorHash}`;
				this.$router.replace({ hash: nextHash }).catch(() => {});
				if (this.$route.hash === nextHash)
				{
					void this.feature?.scrollToAnchor(anchorHash);
				}

				return;
			}

			if (payload.type === 'collection')
			{
				// Same in-place navigation as openCollection() (child-document collection links):
				// workspace is a flat list page, no heading-anchor scroll semantics, so hash is ignored.
				const id = Number(payload.id);
				if (!Number.isInteger(id) || id <= 0)
				{
					return;
				}

				this.$router.push({ name: 'workspace', params: { id } });

				return;
			}

			if (payload.type !== 'document')
			{
				return;
			}

			const id = Number(payload.id);
			if (!Number.isInteger(id) || id <= 0)
			{
				return;
			}

			const hash = String(payload.hash || '').trim();

			if (Number(this.documentId) === id)
			{
				if (hash !== '')
				{
					const nextHash = `#${hash}`;
					this.$router.replace({ hash: nextHash }).catch(() => {});
					if (this.$route.hash === nextHash)
					{
						void this.feature?.scrollToAnchor(hash);
					}
				}

				return;
			}

			const target = { name: 'document', params: { id } };
			if (hash !== '')
			{
				target.hash = `#${hash}`;
			}

			// Navigation to another document via internal link / mention.
			NoteAnalytics.documentViewed('document');

			this.$router.push(target);
		},
		buildDocumentLink(): string
		{
			const id = Number(this.documentId);
			if (!Number.isInteger(id) || id <= 0)
			{
				return '';
			}

			const { origin } = window.location;

			return `${origin}/note/document/${id}/`;
		},
		async copyDocumentLink(): Promise<void>
		{
			const url = this.buildDocumentLink();
			if (!url)
			{
				return;
			}

			const success = await copyTextToClipboard(url);
			NoteAnalytics.documentLinkCopied(Boolean(success));
			if (success)
			{
				BX.UI.Notification.Center.notify({
					content: this.messages.copyLinkDone,
					position: 'top-right',
				});
			}
		},
		async copyDocumentMarkdown(): Promise<void>
		{
			const markdown = this.feature?.getEditorMarkdown?.();
			if (!Type.isStringFilled(markdown))
			{
				BX.UI.Notification.Center.notify({
					content: this.messages.unavailable,
					position: 'top-right',
				});

				return;
			}

			if (await copyTextToClipboard(markdown))
			{
				BX.UI.Notification.Center.notify({
					content: this.messages.copyMarkdownDone,
					position: 'top-right',
				});
			}
		},
		resolveImportMarkdownErrorMessage(error: Object): string
		{
			switch (error?.code)
			{
				case ImportMdErrorCode.INVALID_EXTENSION:
					return this.messages.importMdErrExtension;
				case ImportMdErrorCode.FILE_TOO_LARGE:
					return this.messages.importMdErrTooLarge;
				case ImportMdErrorCode.UNREADABLE:
					return this.messages.importMdErrUnreadable;
				default:
					return this.messages.importMdErrGeneric;
			}
		},
		async importDocumentMarkdown(): Promise<void>
		{
			// Said before the file picker, and with the reason rather than the generic import error: an
			// import replaces the whole body at once, so on a document that no longer saves it would
			// destroy the very text the open session exists to let the user copy out.
			if (this.saveBlockedReason)
			{
				BX.UI.Notification.Center.notify({
					content: this.saveBlockedReason,
					position: 'top-right',
				});

				return;
			}

			const file = await FileUploadService.pickFile({ accept: '.md' });
			if (!file)
			{
				return;
			}

			try
			{
				const { degraded } = await this.feature.importMarkdown(file);
				if (degraded)
				{
					BX.UI.Notification.Center.notify({
						content: this.messages.importMdDegraded,
						position: 'top-right',
					});
				}
			}
			catch (error)
			{
				BX.UI.Notification.Center.notify({
					content: this.resolveImportMarkdownErrorMessage(error),
					position: 'top-right',
				});
			}
		},
		openMoreMenu(target: HTMLElement): void
		{
			if (!this.actionMenuService || !target)
			{
				return;
			}

			const actions = this.documentActions ?? {};
			this.actionMenuService.open(this.documentId, target, {
				isMain: Boolean(this.state.isMain),
				isArchived: this.isArchived,
				isTrashed: this.isTrashed,
				isOrphan: this.isOrphan,
				canRestore: this.canRestore,
				canHardDelete: this.canHardDelete,
				canEditCollection: this.canEditCollection,
				canManagePermissions: this.canManagePermissions,
				canEdit: this.canEdit,
				documentTitle: this.headerDocumentTitle,
				// On mobile the standalone copy-link icon is dropped from the header row;
				// surface it inside the more menu instead. Desktop keeps its own button.
				onCopyLink: this.isMobile ? () => this.copyDocumentLink() : null,
				onCopyMarkdown: () => this.copyDocumentMarkdown(),
				// Download / upload .md are behind the markdown_io_enabled feature flag; passing null
				// keeps the menu item out of the list entirely (see DocumentActionMenuService).
				onDownload: this.markdownIoEnabled
					? () => {
						void DownloadService.download({
							feature: this.feature,
							documentId: this.documentId,
							documentTitle: this.headerDocumentTitle,
						});
					}
					: null,
				onImportMarkdown: this.markdownIoEnabled ? () => this.importDocumentMarkdown() : null,
				onArchive: typeof actions.archive === 'function' ? () => actions.archive(this.documentId) : null,
				onRestore: typeof actions.restore === 'function' ? () => actions.restore(this.documentId) : null,
				onDelete: typeof actions.delete === 'function' ? () => actions.delete(this.documentId) : null,
				// Editor owns the freshest recycleBinId/isOrphan (synced via getMyAccess after
				// a push-driven mode flip). The app-level handler doesn't share state with the
				// editor, so we hand the values over at click time instead of having it read
				// from a stale routeDocumentContext.document.
				onRestoreFromTrash: typeof actions.restoreFromTrash === 'function'
					? () => actions.restoreFromTrash(this.documentId, {
						recycleBinId: Number(this.state.recycleBinId) || 0,
						isOrphan: this.isOrphan,
					})
					: null,
				onHardDelete: typeof actions.hardDelete === 'function'
					? () => actions.hardDelete(this.documentId, {
						recycleBinId: Number(this.state.recycleBinId) || 0,
					})
					: null,
			});
		},
	},
	// language=Vue
	template: `
		<div class="note-editor-document-shell">
			<div class="note-editor-document-main">
				<teleport to="#note-page-header-slot">
					<DocumentHeaderComponent
						:collection-label="collectionLabel"
						:collection-id="collectionId"
						:ancestors="ancestors"
						:header-document-title="headerDocumentTitle"
						:is-loading="state.isLoading"
						:is-archived="isArchived"
						:is-trashed="isTrashed"
						:is-edit-mode="isEditMode"
						:is-previewing="isPreviewing"
						:is-restoring-version="previewRestoring"
						:can-edit="canEdit"
						:save-blocked-reason="saveBlockedReason"
						:is-saving="state.isSaving"
						:is-mobile="isMobile"
						:shared-access="sharedAccess"
						:view-mode="viewMode"
						:collaboration-status="state.collaborationStatus"
						:participants="collaborationParticipants"
						:messages="messages"
						@open-collection="openCollection"
						@open-root="openRoot"
						@open-document="openAncestorDocument"
						@enter-edit-mode="enterEditMode"
						@finish-edit="finishEdit"
						@copy-link="copyDocumentLink"
						@open-more="openMoreMenu"
						@scroll-to-participant="scrollToParticipant"
						@restore-version="restorePreviewedVersion"
						@exit-preview="handleExitPreview"
					/>
				</teleport>
				<DocumentContentComponent
					:is-loading="state.isLoading"
					:loading-label="messages.loading"
					:editor-mount-id="state.editorMountId"
					:has-children-block="hasChildrenBlock"
					:is-edit-mode="isEditMode"
					:can-edit="canEdit"
					:is-archived="isArchived"
					:is-trashed="isTrashed"
					:trashed-at="trashedAt"
					:is-orphan="isOrphan"
					:can-restore="canRestore"
					:is-saving="state.isSaving"
					:messages="messages"
				>
					<DocumentChildrenComponent
						v-if="!state.isLoading"
						:children="children"
						:children-loading="childrenLoading"
						:children-has-more="childrenHasMore"
						:load-more-children="loadMoreChildren"
						:documents-label="messages.documents"
						@open-child="openChildDocument"
					/>
				</DocumentContentComponent>
			</div>
			<button
				v-if="!isMobile && hotkeysEnabled"
				ref="hotkeysFab"
				type="button"
				class="note-hotkeys-fab"
				:class="{ 'is-hidden': hotkeysOpen, 'is-shifted': railOwner !== null }"
				:title="hotkeysButtonLabel"
				:aria-label="hotkeysButtonLabel"
				:aria-pressed="hotkeysOpen.toString()"
				@click="toggleHotkeys"
			>
				<BIcon class="note-hotkeys-fab__icon" :name="Outline.KEYBOARD" :size="24" />
			</button>
			<teleport to="#note-page-history-slot">
				<VersionTimelineComponent
					v-if="historyEnabled"
					:open="historyOpen"
					:document-id="documentId"
					:preview-version-id="previewVersionId"
					:highlight-changes="highlightChanges"
					:messages="historyMessages"
					:open-user-profile="openUserProfile"
					@close="closeHistory"
					@preview="handleVersionPreview"
					@toggle-diff="handleToggleDiff"
				/>
				<HotkeysPanelComponent
					v-if="hotkeysEnabled"
					:open="hotkeysOpen"
					@close="closeHotkeys"
				/>
			</teleport>
		</div>
	`,
};
