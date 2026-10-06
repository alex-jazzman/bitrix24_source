/* eslint-disable */
this.BX = this.BX || {};
this.BX.Note = this.BX.Note || {};
(function (exports, ui_system_checkbox, ui_iconSet_outline, main_core, note_ui_avatarStack, ui_iconSet_api_vue, main_date, note_ui_popoverPosition, note_ui_backlinks, main_core_events, ui_iconSet_solid, pull_client, ui_notification, note_ui_loader) {
	'use strict';

	// Server rejects restoreVersion with 409 when the patch window is non-empty (SDD P1.T2):
	// the client is expected to compact() and retry once — see VersionTimelineComponent.
	const RESTORE_DIRTY_WINDOW_ERROR_CODE = 'NOTE_RESTORE_DIRTY_WINDOW';
	function isRestoreDirtyWindowError(error) {
		const errors = Array.isArray(error?.errors) ? error.errors : [];
		return errors.some(item => String(item?.code || '') === RESTORE_DIRTY_WINDOW_ERROR_CODE);
	}
	class HistoryApi {
		// [API-02] Lazy body fetch — only called on click (version-preview), never in a list.
		static async getVersion({
			documentId,
			versionId
		}) {
			return main_core.ajax.runAction('note.infrastructure.DocumentController.getVersion', {
				data: {
					documentId: Number(documentId),
					versionId: Number(versionId)
				}
			});
		}

		// [API-03] Requires a prior compact() of the patch window — see the 409 retry flow in
		// VersionTimelineComponent.restoreCurrentVersion().
		//
		// `operationId` is the caller's name for this restore. The server does not store it - it echoes the
		// value in the documentContentOverwritten push, which is how the tab that asked for the restore tells
		// the answer to its own request from a rewrite somebody else made in the meantime. Optional, and a
		// caller that has no use for the distinction sends nothing, exactly as before.
		static async restoreVersion({
			documentId,
			versionId,
			operationId = null
		}) {
			const data = {
				documentId: Number(documentId),
				versionId: Number(versionId)
			};
			if (main_core.Type.isStringFilled(operationId)) {
				data.operationId = operationId;
			}
			return main_core.ajax.runAction('note.infrastructure.DocumentController.restoreVersion', {
				data
			});
		}

		// [API-04, P2.T4] Keyset feed page — role visibility is applied server-side before the
		// `types` filter, the filter can only narrow it further (see FeedProvider). An empty
		// `types` list is the server's own "select all"; the caller must NOT send [] when the user
		// deselected everything (that reads as "all") — it short-circuits locally instead.
		// `afterCursor` is an opaque `{ createdAt, id }` handed back from a prior nextCursor — pass
		// it through verbatim, never reconstruct it.
		static async listFeed({
			documentId,
			types = [],
			limit = 30,
			afterCursor = null
		}) {
			const data = {
				documentId: Number(documentId),
				types: Array.isArray(types) ? types : [],
				limit: Number(limit)
			};
			if (main_core.Type.isPlainObject(afterCursor)) {
				data.afterCursor = afterCursor;
			}
			return main_core.ajax.runAction('note.infrastructure.DocumentController.listFeed', {
				data
			});
		}

		// [API-06, P3.T3/T4] Server snapshot of "who viewed the document" — the views widget uses
		// this as its base and overlays live awareness join/heartbeat events on top (see
		// views-widget.js). No separate track call exists here on purpose: a view is recorded
		// server-side as a side effect of the awareness `join` message (P3.T2), not by this read.
		static async getViews({
			documentId,
			limit = 50,
			afterCursor = null
		}) {
			const data = {
				documentId: Number(documentId),
				limit: Number(limit)
			};
			if (afterCursor !== null && main_core.Type.isPlainObject(afterCursor)) {
				data.afterCursor = {
					viewedAt: String(afterCursor.viewedAt || ''),
					userId: Number(afterCursor.userId) || 0
				};
			}
			return main_core.ajax.runAction('note.infrastructure.DocumentController.getViews', {
				data
			});
		}
	}

	// [Date format fix] Shared day+time convention across the whole hub (views popover, activity
	// chip, history tiles) — same helper as tasks.v2's own "who viewed" control:
	// tasks/install/js/tasks/v2/component/tasks-user-actions-demonstrator/src/tasks-user-actions-demonstrator.js:123-144.
	//
	// The previous convention here, DateTimeFormat.format('x', ts), resolves through the 'sago'/
	// 'iago' branches for anything under an hour old and prints a "N seconds ago" label for a just-now
	// timestamp — a real bug for a hub whose whole point is showing fresh activity. This format
	// buckets by calendar day instead (localized "today, HH:MM" / "yesterday, HH:MM" / "Jul 7, HH:MM"), so a
	// fresh event never renders as "0 ...".
	function formatActivityTimestamp(ts) {
		const date = new Date(ts * 1000);
		const isCurrentYear = date.getFullYear() === new Date().getFullYear();
		const dayDefault = isCurrentYear ? main_date.DateTimeFormat.getFormat('DAY_SHORT_MONTH_FORMAT') : main_date.DateTimeFormat.getFormat('MEDIUM_DATE_FORMAT');
		const dayFormats = [['today', 'today'], ['yesterday', 'yesterday'], ['', dayDefault]];
		const dayFormatted = main_date.DateTimeFormat.format(dayFormats, date);
		// Time is rendered with the portal's SHORT_TIME_FORMAT so the hub honours the 12h/24h setting
		// (regional/culture format) exactly like tasks.v2's viewer control — a 24h portal gives "22:38",
		// a 12h portal gives "10:38 pm". Do NOT hardcode 'H:i' here: that forced 24h and ignored the
		// portal setting.
		const timeFormatted = main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT'), date);
		return `${dayFormatted} ${timeFormatted}`;
	}

	// Time-only, in the portal's SHORT_TIME_FORMAT (12h/24h per the portal setting). Used by the
	// history tile, whose calendar day is already shown by the sticky group date header — so the tile
	// itself only needs the time. Same portal-format rule as above: never hardcode 'H:i'.
	function formatTime(ts) {
		return main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT'), new Date(ts * 1000));
	}

	// [P3.T4] Views widget: "eye N" control in the activity line + a popover listing viewers
	// (avatar + name + viewed-at time), styled as in Tasks per the mockup (#eyeCtl / #popViews).
	//
	// Data has two layers:
	// - Base snapshot — source of truth on open and for viewers who already left (awareness only
	//   knows currently-connected peers). [#6] Normally handed down by the caller as the
	//   `initialViews` prop (bundled into the document bootstrap payload by
	//   DocumentViewsSnapshotResolver — see note.editor's create-document-feature.js), so this
	//   widget does NOT issue its own request on mount in that case. When the prop is absent
	//   (e.g. an older caller, or a future standalone use of this widget) it falls back to its own
	//   `HistoryApi.getViews` call — that endpoint is also the one used for pagination/refresh, so
	//   it stays in place regardless.
	// - Live overlay from the SAME Yjs Awareness instance note.editor's AwarenessManager already
	//   maintains (Block 5) — no new realtime channel is created here, this widget only adds an
	//   extra listener to the existing `awareness.on('update', ...)` bus (a plain multi-listener
	//   emitter) and reads the same `states` map AwarenessManager itself populates from remote
	//   join/heartbeat/presence messages. The `provider` prop is note.editor's PushPullYjsProvider,
	//   handed down explicitly by the caller — this widget never reaches for a host component.
	//
	// No track call is made from the client: a view is recorded server-side as a side effect of
	// the awareness `join` message sent on connect (P3.T2) — this widget only reads.
	//
	// [#1/#13, date-format fix] Viewed-at time is rendered via the shared formatActivityTimestamp()
	// helper (see format-date.js) — same "today/yesterday/date HH:MM" convention used by the activity
	// chip and the history tiles. The previous convention here, DateTimeFormat.format('x', ts),
	// prints a "N seconds ago" label for a just-viewed document; formatActivityTimestamp() never does.
	//
	// [own-view bug fix] A user opening the document doesn't get their own eye/count updated until
	// reload: the bootstrap snapshot (initialViews) is built server-side before the awareness `join`
	// message for THIS session is processed (view tracking happens as a side effect of that join),
	// and the live awareness overlay above only reacts to remote-origin updates — our own join is
	// local-origin and is ignored by design (see handleAwarenessUpdate). ensureSelfViewer() below
	// closes that gap: right after the initial data settles (snapshot or own fetch), it adds the
	// current user to the list with "now" if they aren't already there, and folds them into
	// uniqueCount only when they weren't already counted.

	const AWARENESS_ATTACH_RETRY_MS = 500;
	const AWARENESS_ATTACH_MAX_ATTEMPTS = 20; // ~10 s — provider may still be connecting on mount.
	// [pagination] Page size matches the base snapshot limit (both the bootstrap prop and loadSnapshot
	// use 50) so the first paged fetch on open re-covers exactly the already-shown rows. Same scroll
	// slack as the timeline's handleBodyScroll bottom trigger.
	const VIEWS_PAGE_SIZE = 50;
	const VIEWS_SCROLL_THRESHOLD_PX = 80;
	// Module-level counter for a unique popover id per instance (mirrors NoteAvatarStack's menuId).
	let instanceCounter$2 = 0;

	// Must match note.editor's SYNTHETIC_CLIENT_ID_OFFSET (src/const.js, used by
	// awareness-manager.js to encode a remote user's awareness clientId). The two extensions
	// don't import each other, so this half of the shared encoding contract is duplicated here
	// as a literal — it isn't expected to ever change (it only has to avoid colliding with real
	// Yjs clientIDs).
	const SYNTHETIC_CLIENT_ID_OFFSET = 0x40000000;
	function normalizeViewer(viewer) {
		return {
			userId: Number(viewer.userId) || 0,
			name: String(viewer.name || ''),
			avatar: viewer.avatar || null,
			// Server identity color (matches the editor caret / avatar stack); null falls back to the
			// per-user palette in viewerRows.
			color: typeof viewer.color === 'string' && viewer.color !== '' ? viewer.color : null,
			viewedAt: new Date(viewer.viewedAt)
		};
	}
	const ViewsWidgetComponent = {
		name: 'NoteDocumentHistoryViewsWidget',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			NoteAvatarStack: note_ui_avatarStack.NoteAvatarStack
		},
		props: {
			documentId: {
				type: Number,
				default: 0
			},
			// The PushPullYjsProvider instance (see note.editor's push-pull-provider.js) — read-only
			// reuse of its public `awareness` field for the live overlay; nothing is written back to it.
			provider: {
				type: Object,
				default: null
			},
			// [#6] Base snapshot bundled into the document bootstrap payload (see
			// DocumentViewsSnapshotResolver / create-document-feature.js's applyLoadedDocument).
			// When present, mounted() adopts it directly instead of issuing its own getViews call.
			// Shape: { uniqueCount: number, viewers: Array<{userId, name, avatar, viewedAt}> }.
			initialViews: {
				type: Object,
				default: null
			},
			// [own-view bug fix] `{ id, name, avatar, ... }` (note-editor.js's normalizedCurrentUser) —
			// used only by ensureSelfViewer() to add the current user to the list on mount when the
			// server-side snapshot/own fetch hasn't recorded their view yet (see class doc above).
			currentUser: {
				type: Object,
				default: () => ({})
			},
			messages: {
				type: Object,
				required: true
			},
			// [avatar profile] Same optional function-prop the activity line hands to the chip avatars
			// (note.editor's openUserProfile → openLinkNative): opens the user profile natively on mobile
			// and in a new tab on desktop. When absent, viewer rows render as plain, non-clickable text.
			openUserProfile: {
				type: Function,
				default: null
			}
		},
		data() {
			return {
				viewers: [],
				uniqueCount: null,
				isLoading: false,
				isLoadingMore: false,
				isOpen: false
			};
		},
		computed: {
			Outline: () => ui_iconSet_api_vue.Outline,
			hasCount() {
				return Number.isInteger(this.uniqueCount);
			},
			isViewerClickable() {
				return typeof this.openUserProfile === 'function';
			},
			// Avatars are drawn by note.ui.avatar-stack (one participant per row) so a viewer looks
			// exactly like the same person in the activity chip or the history tiles. The single-element
			// arrays are built here rather than in the template: a fresh array on every re-render would
			// retrigger the stack's participants watcher for every row in the list.
			viewerRows() {
				return this.viewers.map(viewer => ({
					viewer,
					participants: [{
						id: viewer.userId,
						name: this.viewerDisplayName(viewer),
						avatar: viewer.avatar,
						color: viewer.color || note_ui_avatarStack.avatarFallbackColor(viewer.userId)
					}]
				}));
			}
		},
		created() {
			this.awarenessInstance = null;
			this.awarenessHandler = null;
			this.awarenessAttachTimer = null;
			this.awarenessAttachAttempts = 0;
			this.outsideClickHandler = null;

			// [pagination] Keyset cursor state — see loadMoreViews / ensureFirstPageLoaded. The cursor is
			// server-only ({viewedAt, userId} in the server-local 'Y-m-d H:i:s' format), so it can't be
			// rebuilt from a viewer row (those carry ISO 'c' timestamps): the bootstrap prop drops the
			// cursor, so the first open issues one getViews to establish it. loadedViewerIds dedups paged
			// rows against everything already shown (base snapshot + live overlay + self injection).
			this.viewsNextCursor = null;
			this.cursorInitialized = false;
			this.loadedViewerIds = new Set();
			instanceCounter$2 += 1;
			this.viewsPopoverId = `note-views-widget-popover-${instanceCounter$2}`;
			this.viewsTitleId = `note-views-widget-title-${instanceCounter$2}`;
		},
		mounted() {
			void this.loadInitialData();
			this.attachAwareness();
		},
		beforeUnmount() {
			this.detachAwareness();
			this.detachOutsideClick();
			this.detachPopoverAnchor();
			if (this.awarenessAttachTimer !== null) {
				clearTimeout(this.awarenessAttachTimer);
				this.awarenessAttachTimer = null;
			}
		},
		watch: {
			// [#1] Guards freshness on re-entry: if this instance is ever reused across documents
			// without a full unmount/remount (note.editor currently always remounts, but this keeps
			// the widget correct independent of that caller detail), reset local state and re-adopt
			// whatever base data is available for the new document instead of showing the previous
			// document's stale viewers.
			documentId() {
				this.resetLocalState();
				void this.loadInitialData();
			},
			// The caller may reactively replace the prop (e.g. a fresher bootstrap snapshot arriving
			// for the same document) — re-adopt it rather than keeping the one captured at mount.
			initialViews(nextValue) {
				if (main_core.Type.isPlainObject(nextValue) && Array.isArray(nextValue.viewers)) {
					this.applyViewsSnapshot(nextValue);
					this.ensureSelfViewer();
				}
			}
		},
		methods: {
			resetLocalState() {
				this.viewers = [];
				this.uniqueCount = null;
				this.isOpen = false;
				this.isLoadingMore = false;
				this.viewsNextCursor = null;
				this.cursorInitialized = false;
				this.loadedViewerIds = new Set();
			},
			applyViewsSnapshot(snapshot) {
				const viewers = Array.isArray(snapshot?.viewers) ? snapshot.viewers : [];
				this.viewers = viewers.map(normalizeViewer);
				this.uniqueCount = Number.isInteger(snapshot?.uniqueCount) ? snapshot.uniqueCount : this.viewers.length;
				this.loadedViewerIds = new Set(this.viewers.map(viewer => viewer.userId));
			},
			// [#6] Prefers the bootstrap snapshot handed down via `initialViews` — only falls back to
			// this widget's own getViews request when the caller didn't supply one. Either branch is
			// followed by ensureSelfViewer() (own-view bug fix — see class doc above).
			async loadInitialData() {
				if (main_core.Type.isPlainObject(this.initialViews) && Array.isArray(this.initialViews.viewers)) {
					this.applyViewsSnapshot(this.initialViews);
				} else {
					await this.loadSnapshot();
				}
				this.ensureSelfViewer();
			},
			// [own-view bug fix] Adds the current user to the viewers list with "now" if a snapshot
			// (server or own fetch) doesn't already carry them — see class doc above for why the
			// snapshot can lag behind the user's own join. Idempotent: a later, fresher snapshot that
			// already includes self (e.g. after reload) is left untouched, no duplicate row.
			ensureSelfViewer() {
				const selfId = Number(this.currentUser?.id) || 0;
				if (!(selfId > 0) || this.viewers.some(viewer => viewer.userId === selfId)) {
					return;
				}
				const name = String(this.currentUser?.name || '');
				const avatar = main_core.Type.isStringFilled(this.currentUser?.avatar) ? this.currentUser.avatar : null;
				const color = main_core.Type.isStringFilled(this.currentUser?.color) ? this.currentUser.color : null;
				this.viewers.unshift({
					userId: selfId,
					name,
					avatar,
					color,
					viewedAt: new Date()
				});
				this.loadedViewerIds.add(selfId);
				this.uniqueCount = (Number.isInteger(this.uniqueCount) ? this.uniqueCount : this.viewers.length - 1) + 1;
			},
			async loadSnapshot() {
				const documentId = Number(this.documentId);
				if (!(documentId > 0)) {
					return;
				}
				this.isLoading = true;
				try {
					const response = await HistoryApi.getViews({
						documentId,
						limit: VIEWS_PAGE_SIZE
					});
					const data = response?.data ?? {};
					this.applyViewsSnapshot(data);
					// Own-fetch path already carries the keyset cursor — no separate fetch needed on open.
					this.viewsNextCursor = main_core.Type.isPlainObject(data.nextCursor) ? data.nextCursor : null;
					this.cursorInitialized = true;
				} catch {
					// Leave the eye control without a count rather than showing a misleading 0.
				} finally {
					this.isLoading = false;
				}
			},
			// [pagination] The bootstrap prop path (initialViews) drops the server cursor, so the first
			// popover open issues one getViews to establish it — that page re-covers the already-shown
			// rows, so it's merged (live/self rows the server doesn't yet know are kept on top). The
			// loadSnapshot path already has a cursor and skips this. Failure leaves cursorInitialized
			// false so a later open retries; the base list stays visible meanwhile.
			async ensureFirstPageLoaded() {
				if (this.cursorInitialized || this.isLoadingMore) {
					return;
				}
				const documentId = Number(this.documentId);
				if (!(documentId > 0)) {
					this.cursorInitialized = true;
					return;
				}

				// Everyone already fits in the base snapshot (uniqueCount <= shown rows) — there's nothing
				// to page, so skip the cursor-establishing fetch entirely. Without this the first open
				// always flashed a redundant "Loading" state even for a fully-loaded short list.
				const shown = this.viewers.length;
				const total = Number.isInteger(this.uniqueCount) ? this.uniqueCount : shown;
				if (total <= shown) {
					this.cursorInitialized = true;
					return;
				}
				this.isLoadingMore = true;
				try {
					const response = await HistoryApi.getViews({
						documentId,
						limit: VIEWS_PAGE_SIZE
					});
					const data = response?.data ?? {};
					this.mergeFirstPage(data);
					this.viewsNextCursor = main_core.Type.isPlainObject(data.nextCursor) ? data.nextCursor : null;
					this.cursorInitialized = true;
				} catch {
					// Keep showing base data; a later open retries.
				} finally {
					this.isLoadingMore = false;
				}
			},
			// Adopts the server's first page as the authoritative base (order + avatars), keeping any
			// current rows the page doesn't include (live-only / not-yet-persisted self) on top.
			mergeFirstPage(data) {
				const serverViewers = Array.isArray(data?.viewers) ? data.viewers.map(normalizeViewer) : [];
				const serverIds = new Set(serverViewers.map(viewer => viewer.userId));
				const liveExtras = this.viewers.filter(viewer => !serverIds.has(viewer.userId));
				this.viewers = [...liveExtras, ...serverViewers];
				this.loadedViewerIds = new Set(this.viewers.map(viewer => viewer.userId));
				const serverUnique = Number.isInteger(data?.uniqueCount) ? data.uniqueCount : serverViewers.length;
				// liveExtras aren't in the server's count yet (unpersisted) — add them on top.
				this.uniqueCount = serverUnique + liveExtras.length;
			},
			// [SDD P3, pagination] Seamless infinite scroll over the keyset cursor — no "show more".
			async loadMoreViews() {
				if (this.isLoadingMore || !this.cursorInitialized || !this.viewsNextCursor) {
					return;
				}
				const documentId = Number(this.documentId);
				if (!(documentId > 0)) {
					return;
				}
				this.isLoadingMore = true;
				try {
					const response = await HistoryApi.getViews({
						documentId,
						limit: VIEWS_PAGE_SIZE,
						afterCursor: this.viewsNextCursor
					});
					const data = response?.data ?? {};
					const serverViewers = Array.isArray(data?.viewers) ? data.viewers.map(normalizeViewer) : [];
					const fresh = serverViewers.filter(viewer => !this.loadedViewerIds.has(viewer.userId));
					fresh.forEach(viewer => this.loadedViewerIds.add(viewer.userId));
					this.viewers = [...this.viewers, ...fresh];
					this.viewsNextCursor = main_core.Type.isPlainObject(data.nextCursor) ? data.nextCursor : null;
				} catch {
					// Stop paginating silently — the already-loaded rows stay visible.
				} finally {
					this.isLoadingMore = false;
				}
			},
			handleViewsScroll(event) {
				const el = event.currentTarget;
				if (!(el instanceof HTMLElement)) {
					return;
				}
				if (el.scrollTop + el.clientHeight >= el.scrollHeight - VIEWS_SCROLL_THRESHOLD_PX) {
					void this.loadMoreViews();
				}
			},
			attachAwareness() {
				const awareness = this.provider?.awareness;
				if (awareness) {
					this.awarenessInstance = awareness;
					this.awarenessHandler = (changes, origin) => this.handleAwarenessUpdate(changes, origin);
					awareness.on('update', this.awarenessHandler);
					return;
				}

				// Provider may still be connecting (async `connect()`) when this widget mounts —
				// poll briefly for `provider.awareness` to appear instead of requiring a new callback
				// slot on the provider (its single `onParticipants` slot is already owned elsewhere).
				this.awarenessAttachAttempts += 1;
				if (this.awarenessAttachAttempts > AWARENESS_ATTACH_MAX_ATTEMPTS) {
					return;
				}
				this.awarenessAttachTimer = setTimeout(() => this.attachAwareness(), AWARENESS_ATTACH_RETRY_MS);
			},
			detachAwareness() {
				if (this.awarenessInstance && this.awarenessHandler) {
					this.awarenessInstance.off('update', this.awarenessHandler);
				}
				this.awarenessInstance = null;
				this.awarenessHandler = null;
			},
			handleAwarenessUpdate(changes, origin) {
				// Only remote-origin events describe other participants (local-origin fires on our
				// own cursor/mode changes and isn't relevant here). Leavers are intentionally ignored:
				// a viewer row stays after the peer disconnects (historicity comes from the snapshot).
				if (origin !== 'remote') {
					return;
				}
				const changedClientIds = [...(changes?.added || []), ...(changes?.updated || [])];
				if (changedClientIds.length === 0) {
					return;
				}
				changedClientIds.forEach(clientId => {
					const rawClientId = Number(clientId);
					if (!Number.isFinite(rawClientId) || rawClientId < SYNTHETIC_CLIENT_ID_OFFSET) {
						return;
					}
					const userId = rawClientId - SYNTHETIC_CLIENT_ID_OFFSET;
					if (!(userId > 0)) {
						return;
					}
					const state = this.awarenessInstance?.states?.get(clientId);
					const name = String(state?.user?.name || '');
					// Awareness carries the user's identity color (same md5-derived value the server stamps
					// on historical viewers) — pass it so a live row matches the caret/avatar elsewhere.
					const color = String(state?.user?.color || '');
					this.registerLivePresence(userId, name, color);
				});
			},
			registerLivePresence(userId, name, color = '') {
				const now = new Date();
				const normalizedColor = color !== '' ? color : null;
				const existingIndex = this.viewers.findIndex(viewer => viewer.userId === userId);
				if (existingIndex === -1) {
					// Awareness carries a name + identity color but never an avatar — live-added rows fall
					// back to the initial-avatar rendering until the next snapshot reload replaces them.
					this.viewers.unshift({
						userId,
						name,
						avatar: null,
						color: normalizedColor,
						viewedAt: now
					});
					this.loadedViewerIds.add(userId);
					this.uniqueCount = (Number.isInteger(this.uniqueCount) ? this.uniqueCount : this.viewers.length - 1) + 1;
					return;
				}
				const [viewer] = this.viewers.splice(existingIndex, 1);
				viewer.viewedAt = now;
				if (name !== '') {
					viewer.name = name;
				}
				if (normalizedColor !== null) {
					viewer.color = normalizedColor;
				}
				this.viewers.unshift(viewer);
			},
			toggleOpen() {
				if (this.isOpen) {
					this.closePopover();
					return;
				}
				this.isOpen = true;
				this.attachOutsideClick();
				// [pagination] Establish the keyset cursor on first open (bootstrap prop path has none).
				void this.ensureFirstPageLoaded();

				// Disclosure pattern: the popover itself takes focus (its rows aren't interactive).
				// [#5] Centered-under-trigger positioning must run after the popover is in the DOM
				// (needs its rendered offsetWidth/offsetHeight) — same tick as the focus move.
				this.$nextTick(() => {
					note_ui_popoverPosition.positionPopoverUnderTrigger(this.$refs.viewsTrigger, this.$refs.viewsPopover);
					this.$refs.viewsPopover?.focus?.();
					this.popoverAnchorDispose = note_ui_popoverPosition.keepPopoverAnchored(this.$refs.viewsTrigger, this.$refs.viewsPopover, () => this.closePopover());
				});
			},
			closePopover(refocusTrigger = false) {
				this.isOpen = false;
				this.detachOutsideClick();
				this.detachPopoverAnchor();
				if (refocusTrigger) {
					this.$nextTick(() => this.$refs.viewsTrigger?.focus?.());
				}
			},
			handleViewsPopoverFocusOut(event) {
				const popover = this.$refs.viewsPopover;
				const trigger = this.$refs.viewsTrigger;
				const nextFocus = event.relatedTarget;

				// [iOS] Close via focusout ONLY when focus moved to a real element (keyboard Tab). A
				// null/non-element relatedTarget means the blur came from a tap — iOS Safari doesn't focus
				// <button>s on tap, so closing here would race the trigger's own click and reopen the
				// popover ("second tap doesn't close"). Tap-outside and trigger re-tap are owned by the
				// outside-click listener and the toggle handler respectively.
				if (!(nextFocus instanceof HTMLElement)) {
					return;
				}

				// Focus moving onto the trigger button — let the button's own toggle handler decide.
				if (trigger instanceof HTMLElement && trigger.contains(nextFocus)) {
					return;
				}
				if (popover instanceof HTMLElement && !popover.contains(nextFocus)) {
					// Tab moved focus outside the popover — close without stealing focus back.
					this.closePopover();
				}
			},
			attachOutsideClick() {
				if (this.outsideClickHandler) {
					return;
				}
				this.outsideClickHandler = event => {
					if (this.$refs.root && !this.$refs.root.contains(event.target)) {
						this.closePopover();
					}
				};

				// Deferred so the opening click itself doesn't immediately close the popover.
				setTimeout(() => {
					document.addEventListener('click', this.outsideClickHandler, true);
				}, 0);
			},
			detachOutsideClick() {
				if (this.outsideClickHandler) {
					document.removeEventListener('click', this.outsideClickHandler, true);
					this.outsideClickHandler = null;
				}
			},
			detachPopoverAnchor() {
				if (typeof this.popoverAnchorDispose === 'function') {
					this.popoverAnchorDispose();
					this.popoverAnchorDispose = null;
				}
			},
			viewerDisplayName(viewer) {
				return viewer.name !== '' ? viewer.name : `#${viewer.userId}`;
			},
			viewerProfileHref(viewer) {
				const id = Number(viewer?.userId);
				return Number.isInteger(id) && id > 0 ? `/company/personal/user/${id}/` : '';
			},
			// [avatar profile] Mirrors the chip avatar's contract: modifier / non-primary clicks fall
			// through to the browser (native new tab from the href), a plain click routes via
			// openUserProfile (mobile-native card / desktop new tab).
			onViewerClick(viewer, event) {
				if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
					return;
				}
				const id = Number(viewer?.userId);
				if (!Number.isInteger(id) || id <= 0 || typeof this.openUserProfile !== 'function') {
					return;
				}
				event.preventDefault();
				this.openUserProfile(id);
			},
			toTimestampSeconds(viewedAt) {
				if (!(viewedAt instanceof Date) || Number.isNaN(viewedAt.getTime())) {
					return null;
				}
				return Math.floor(viewedAt.getTime() / 1000);
			},
			// [#1/#13, date-format fix] Shared day+time convention — see format-date.js.
			formatViewedAt(viewedAt) {
				const ts = this.toTimestampSeconds(viewedAt);
				return ts === null ? '' : formatActivityTimestamp(ts);
			}
		},
		// language=Vue
		template: `
		<div ref="root" class="note-views-widget">
			<button
				ref="viewsTrigger"
				type="button"
				class="note-activity-line__control --interactive"
				:title="messages.activityViews"
				:aria-label="messages.activityViews"
				:aria-expanded="isOpen ? 'true' : 'false'"
				:aria-controls="viewsPopoverId"
				@click="toggleOpen"
			>
				<BIcon :name="Outline.OBSERVER" class="note-activity-line__control-icon" aria-hidden="true" />
				<span v-if="hasCount" class="note-activity-line__control-count">{{ uniqueCount }}</span>
			</button>
			<div
				v-if="isOpen"
				:id="viewsPopoverId"
				ref="viewsPopover"
				class="note-views-widget__popover"
				role="group"
				:aria-labelledby="viewsTitleId"
				tabindex="-1"
				@keydown.esc="closePopover(true)"
				@focusout="handleViewsPopoverFocusOut"
			>
				<div :id="viewsTitleId" class="note-views-widget__popover-title">{{ messages.activityViews }}</div>
				<div v-if="isLoading && viewers.length === 0" class="note-views-widget__popover-empty">{{ messages.loading }}</div>
				<div v-else-if="viewers.length === 0" class="note-views-widget__popover-empty">{{ messages.activityViewsEmpty }}</div>
				<template v-else>
					<ul class="note-views-widget__list" @scroll="handleViewsScroll">
						<li v-for="row in viewerRows" :key="row.viewer.userId" class="note-views-widget__row">
							<component
								:is="isViewerClickable ? 'a' : 'span'"
								class="note-views-widget__user"
								:class="{ '--clickable': isViewerClickable }"
								:href="isViewerClickable ? viewerProfileHref(row.viewer) : null"
								:title="viewerDisplayName(row.viewer)"
								@click="isViewerClickable ? onViewerClick(row.viewer, $event) : null"
							>
								<NoteAvatarStack
									class="note-views-widget__avatar"
									:participants="row.participants"
									:inline="true"
									:show-hints="false"
								/>
								<span class="note-views-widget__name">{{ viewerDisplayName(row.viewer) }}</span>
							</component>
							<span class="note-views-widget__time">{{ formatViewedAt(row.viewer.viewedAt) }}</span>
						</li>
					</ul>
					<div v-if="isLoadingMore" class="note-views-widget__popover-empty">{{ messages.loading }}</div>
				</template>
			</div>
		</div>
	`
	};

	// [P6.T4 / API-07..09] Thin ajax wrapper around SubscriptionController — mirrors
	// history-api.js's shape (one static method per action, plain data objects in/out).
	const SUBSCRIPTION_SCOPE_DOCUMENT$1 = 'document';
	const SUBSCRIPTION_SCOPE_COLLECTION = 'collection';
	const SUBSCRIPTION_MODE_SELF$1 = 'self';
	const SUBSCRIPTION_MODE_SUBTREE = 'subtree';
	const SUBSCRIPTION_MODE_ALL = 'all';
	// Negative override for a document covered by an ancestor subtree / collection subscription —
	// suppresses this document's notifications without touching the inherited subscription.
	const SUBSCRIPTION_MODE_MUTED = 'muted';

	// [API-05] Refusal of a positive subscription on an object that is not in the favorites list.
	const SUBSCRIPTION_ERROR_FAVORITE_REQUIRED = 'FAVORITE_REQUIRED';
	function isFavoriteRequiredError(error) {
		return String(error?.errors?.[0]?.code || '') === SUBSCRIPTION_ERROR_FAVORITE_REQUIRED;
	}
	class SubscriptionApi {
		// [API-07] Subscribe / change scope — idempotent upsert. `mode` is `self`/`subtree`
		// for a document target, `all` for a collection target.
		static async set({
			scope,
			entityId,
			mode
		}) {
			return main_core.ajax.runAction('note.infrastructure.SubscriptionController.set', {
				data: {
					scope,
					entityId: Number(entityId),
					mode
				}
			});
		}

		// [API-08] Unsubscribe — removes the caller's own subscription.
		static async remove({
			scope,
			entityId
		}) {
			return main_core.ajax.runAction('note.infrastructure.SubscriptionController.remove', {
				data: {
					scope,
					entityId: Number(entityId)
				}
			});
		}

		// [API-09] State for the bell control. `collectionId` is optional — the server
		// falls back to the document's own collection when it's omitted.
		static async getState({
			documentId,
			collectionId = null
		}) {
			const data = {
				documentId: Number(documentId)
			};
			if (Number.isInteger(collectionId) && collectionId > 0) {
				data.collectionId = collectionId;
			}
			return main_core.ajax.runAction('note.infrastructure.SubscriptionController.getState', {
				data
			});
		}
	}

	// [P4.T1] Presentation half of the subscription bell: the trigger, the scope popover
	// (self / subtree / off), the inherited/muted layouts and the keyboard model. It owns no
	// transport and no loading - the state arrives as a prop (DTO-02 plus `inheritedTitle`) and the
	// chosen action leaves as an event. Two hosts share it: the editor's own container
	// (subscription-bell.js, which loads the state itself) and the row of the favorites block, whose
	// state comes from the sidebar store. There is deliberately no second copy of this choice.
	//
	// [#10 rework] `role="menu"` with `menuitemradio`/`menuitem` rows and roving tabindex -
	// same pattern as note.ui.avatar-stack's co-authors menu (onParticipantsMenuKeydown):
	// Arrow Up/Down move the roving focus, Home/End jump to the ends, Enter/Space activate the
	// focused row, Esc closes and returns focus to the bell, Tab closes and lets focus continue
	// naturally (in place; teleported the popover is the last child of body, so there Tab hands
	// focus back to the trigger and the browser's own move continues from it). A row is the menu
	// item itself and holds no interactive descendant: the scope rows keep the native radio for
	// what it draws, inert, and act on their own click, while "off"/"mute"/"resume" are native
	// buttons.
	//
	// [#9] Selecting a mode still closes the popover (mirrors the mockup's showPop/closePop flow -
	// see mockup lines 719-726) - that's a deliberate exception to "row click doesn't close" (#4 in
	// the filter popover): here the click IS the completed action, not just a toggle.

	// Module-level counter for a unique popover id + radio group name per instance
	// (mirrors ViewsWidgetComponent / NoteAvatarStack).
	let instanceCounter$1 = 0;
	const MODE_SELF = 'self';
	const MODE_SUBTREE = 'subtree';
	const SubscriptionBellView = {
		name: 'NoteDocumentHistorySubscriptionBellView',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			// [DTO-02] `{ mode, subscribed, muted, inherited, inheritedSource }` plus the optional
			// `inheritedTitle` that names the covering source. An absent state reads as "nothing arrives".
			state: {
				type: Object,
				default: null
			},
			// A write is on the wire: the rows are disabled so a second press cannot race the first.
			isSaving: {
				type: Boolean,
				default: false
			},
			// The trigger looks like a control of its host, so its classes come from the host. The active
			// modifier is separate because the host's design system names it (`--on` in the activity line,
			// `is-on` in a sidebar row) while the state behind it is known only here.
			triggerClass: {
				type: String,
				default: 'note-activity-line__control --interactive'
			},
			activeClass: {
				type: String,
				default: '--on'
			},
			// Muting is a state of its own for a host that keeps the control on screen by class (a sidebar
			// row shows a bell only while it has something to say). Empty where the host does not need it.
			mutedClass: {
				type: String,
				default: ''
			},
			iconClass: {
				type: String,
				default: 'note-activity-line__control-icon'
			},
			// Where the popover is rendered. Empty - in place, right after the trigger (the activity line,
			// where nothing clips it). A selector - teleported there, which is what a host inside a
			// transformed and clipping subtree needs: a sidebar panel would otherwise cut the popover off
			// and place it against the panel instead of the viewport.
			teleportTo: {
				type: String,
				default: ''
			},
			// Classes for the teleported popover - the design-system context of the host, which the popover
			// no longer inherits once it renders outside the application subtree.
			popoverClass: {
				type: String,
				default: ''
			},
			messages: {
				type: Object,
				required: true
			}
		},
		emits: ['select-mode', 'unsubscribe', 'mute', 'resume'],
		data() {
			return {
				isOpen: false,
				// [#10] Roving-tabindex cursor within the open popover's menu rows.
				activeIndex: 0
			};
		},
		computed: {
			Outline: () => ui_iconSet_api_vue.Outline,
			Solid: () => ui_iconSet_api_vue.Solid,
			subscribed() {
				return this.state?.subscribed === true;
			},
			mode() {
				return this.subscribed ? String(this.state?.mode || '') : null;
			},
			// [inherited] Covered by an ancestor subtree / collection subscription (no direct row) -
			// the bell reads as active and the popover explains the source instead of offering a
			// redundant scope choice. `muted` is the per-document negative override of that coverage.
			inherited() {
				return this.state?.inherited === true;
			},
			inheritedSource() {
				return this.inherited ? String(this.state?.inheritedSource || '') : null;
			},
			// Title of the covering source (nearest subtree-subscribed ancestor, or the collection) -
			// names it in the info line ("within the "..." section") so the coverage isn't a vague "parent".
			inheritedTitle() {
				return this.inherited ? String(this.state?.inheritedTitle || '') : '';
			},
			// A mute is the negative override of coverage from above, so it only means anything while that
			// coverage is there. The row survives the covering subscription being switched off, and reading it
			// on its own would show a bell that suppresses nothing and a popover naming a source that is gone.
			muted() {
				return this.state?.muted === true && this.inherited;
			},
			// Four mutually exclusive popover layouts (see template):
			//   'direct'    - a direct self/subtree subscription on this document (scope chooser + off)
			//   'inherited' - covered by an ancestor subtree / collection, no direct row (info + "mute")
			//   'muted'     - this document is muted despite inherited coverage (info + "resume")
			//   'none'      - no subscription and no coverage (scope chooser to subscribe)
			popoverState() {
				if (this.muted) {
					return 'muted';
				}
				if (this.subscribed) {
					return 'direct';
				}
				return this.inherited ? 'inherited' : 'none';
			},
			// The bell is filled whenever the user effectively gets this document's notifications -
			// direct OR inherited - and not muted.
			effectiveOn() {
				return (this.subscribed || this.inherited) && !this.muted;
			},
			triggerClasses() {
				const classes = [this.triggerClass];
				if (this.effectiveOn) {
					classes.push(this.activeClass);
				} else if (this.muted && this.mutedClass !== '') {
					classes.push(this.mutedClass);
				}
				return classes;
			},
			iconName() {
				if (this.muted) {
					return ui_iconSet_api_vue.Outline.NOTIFICATION_OFF;
				}
				return this.effectiveOn ? ui_iconSet_api_vue.Solid.NOTIFICATION : ui_iconSet_api_vue.Outline.NOTIFICATION;
			},
			inheritedInfoText() {
				const isCollection = this.inheritedSource === 'collection';
				const named = isCollection ? this.messages.subscriptionInheritedCollection : this.messages.subscriptionInheritedSubtree;
				const generic = isCollection ? this.messages.subscriptionInheritedCollectionGeneric : this.messages.subscriptionInheritedSubtreeGeneric;

				// Fall back to the source-less phrasing when the title is unknown (e.g. covering entity gone).
				if (!main_core.Type.isStringFilled(this.inheritedTitle) || !main_core.Type.isStringFilled(named)) {
					return generic || named || '';
				}
				return named.replace('#TITLE#', this.inheritedTitle);
			},
			bellTitle() {
				switch (this.popoverState) {
					case 'muted':
						return this.messages.activityMuted;
					case 'direct':
						return this.mode === MODE_SUBTREE ? this.messages.activitySubscribedSubtree : this.messages.activitySubscribedSelf;
					case 'inherited':
						return this.inheritedSource === 'collection' ? this.messages.activitySubscribedInheritedCollection : this.messages.activitySubscribedInheritedSubtree;
					default:
						return this.messages.activitySubscribe;
				}
			},
			radioGroupName() {
				return `note-subscription-bell-scope-${this.instanceId}`;
			},
			// [#10] Actionable menu rows in DOM order - drives roving-tabindex indices and Enter/Space
			// activation. Differs per popoverState: the inherited/muted layouts expose a single action.
			menuOptionKeys() {
				switch (this.popoverState) {
					case 'direct':
						return [MODE_SELF, MODE_SUBTREE, 'off'];
					case 'inherited':
						return ['mute'];
					case 'muted':
						return ['resume'];
					default:
						return [MODE_SELF, MODE_SUBTREE];
				}
			}
		},
		created() {
			this.outsideClickHandler = null;
			this.popoverAnchorDispose = null;
			instanceCounter$1 += 1;
			this.instanceId = instanceCounter$1;
			this.bellPopoverId = `note-subscription-bell-popover-${this.instanceId}`;
			this.bellTitleId = `note-subscription-bell-title-${this.instanceId}`;
		},
		beforeUnmount() {
			this.detachOutsideClick();
			this.detachPopoverAnchor();
		},
		methods: {
			toggleOpen() {
				if (this.isOpen) {
					this.closePopover();
					return;
				}
				this.isOpen = true;
				this.attachOutsideClick();

				// [#10] Roving focus starts on the checked option (or the first row when
				// unsubscribed) - mirrors the previous "focus the checked radio" behaviour, now
				// expressed as a menu row index. [#5] Position centered under the trigger.
				const startIndex = this.popoverState === 'direct' && this.mode === MODE_SUBTREE ? 1 : 0;
				this.activeIndex = startIndex;
				this.$nextTick(() => {
					note_ui_popoverPosition.positionPopoverUnderTrigger(this.$refs.bellTrigger, this.$refs.bellPopover);
					this.focusMenuItem(startIndex);
					this.popoverAnchorDispose = note_ui_popoverPosition.keepPopoverAnchored(this.$refs.bellTrigger, this.$refs.bellPopover, () => this.closePopover());
				});
			},
			// [#10] Menu rows in DOM order - mirrors note.ui.avatar-stack's menuItemElements().
			menuItemElements() {
				const popover = this.$refs.bellPopover;
				return popover instanceof HTMLElement ? [...popover.querySelectorAll('[role^="menuitem"]')] : [];
			},
			focusMenuItem(index) {
				const items = this.menuItemElements();
				if (items.length === 0) {
					return;
				}
				const clamped = Math.max(0, Math.min(items.length - 1, index));
				this.activeIndex = clamped;
				items[clamped]?.focus();
			},
			activateMenuItem(key) {
				if (key === 'off') {
					this.unsubscribe();
					return;
				}
				if (key === 'mute') {
					this.mute();
					return;
				}
				if (key === 'resume') {
					this.resume();
					return;
				}
				this.selectMode(key);
			},
			// [#10] Roving-tabindex menu keydown - same key set as note.ui.avatar-stack's
			// onParticipantsMenuKeydown, adapted to this popover's own row activation.
			onMenuKeydown(event) {
				const lastIndex = this.menuOptionKeys.length - 1;
				switch (event.key) {
					case 'ArrowDown':
						event.preventDefault();
						this.focusMenuItem(this.activeIndex + 1);
						break;
					case 'ArrowUp':
						event.preventDefault();
						this.focusMenuItem(this.activeIndex - 1);
						break;
					case 'Home':
						event.preventDefault();
						this.focusMenuItem(0);
						break;
					case 'End':
						event.preventDefault();
						this.focusMenuItem(lastIndex);
						break;
					case 'Enter':
					case ' ':
						event.preventDefault();
						this.activateMenuItem(this.menuOptionKeys[this.activeIndex]);
						break;
					case 'Escape':
						event.preventDefault();
						this.closePopover(true);
						break;
					case 'Tab':
						// In place the popover sits right after the trigger, so focus may leave naturally.
						// Teleported it is the last child of body, and leaving from there would land on the first
						// control of the page: focus goes back to the trigger first - synchronously, before the
						// browser acts on this Tab - so the move it makes continues from the bell.
						this.closePopover(this.teleportTo !== '');
						break;
				}
			},
			closePopover(refocusTrigger = false) {
				// Focus first, close second: a host that only shows the trigger while its row holds the focus
				// (a row of the sidebar) hides it the moment the focus leaves the popover, and a hidden element
				// cannot take the focus back. While the popover is still open the trigger is on screen.
				if (refocusTrigger) {
					this.$refs.bellTrigger?.focus?.();
				}
				this.isOpen = false;
				this.detachOutsideClick();
				this.detachPopoverAnchor();
			},
			// The popover may be teleported out of the component's own root, so "inside the control" is
			// the two nodes together, not the root alone.
			containsNode(node) {
				const root = this.$refs.root;
				const popover = this.$refs.bellPopover;
				return root instanceof HTMLElement && root.contains(node) || popover instanceof HTMLElement && popover.contains(node);
			},
			handleFocusOut(event) {
				const nextFocus = event.relatedTarget;

				// [iOS] Close via focusout ONLY when focus moved to a real element (keyboard Tab). A
				// null/non-element relatedTarget is a tap-induced blur - iOS Safari doesn't focus <button>s
				// on tap, so closing here would race the trigger's own click and reopen the popover
				// ("second tap doesn't close"). Tap-outside/trigger re-tap are owned by the outside-click
				// listener and the toggle handler.
				if (!(nextFocus instanceof HTMLElement)) {
					return;
				}
				if (!this.containsNode(nextFocus)) {
					this.closePopover();
				}
			},
			attachOutsideClick() {
				if (this.outsideClickHandler) {
					return;
				}
				this.outsideClickHandler = event => {
					if (!this.containsNode(event.target)) {
						this.closePopover();
					}
				};

				// Deferred so the opening click itself doesn't immediately close the popover.
				setTimeout(() => {
					document.addEventListener('click', this.outsideClickHandler, true);
				}, 0);
			},
			detachPopoverAnchor() {
				if (typeof this.popoverAnchorDispose === 'function') {
					this.popoverAnchorDispose();
					this.popoverAnchorDispose = null;
				}
			},
			detachOutsideClick() {
				if (this.outsideClickHandler) {
					document.removeEventListener('click', this.outsideClickHandler, true);
					this.outsideClickHandler = null;
				}
			},
			selectMode(mode) {
				if (this.isSaving) {
					return;
				}
				this.closePopover(true);
				if (this.subscribed && this.mode === mode) {
					// [AC-043] The mode already in force is not re-sent: the press only closes the popover.
					return;
				}
				this.$emit('select-mode', mode);
			},
			unsubscribe() {
				if (this.isSaving) {
					return;
				}
				this.closePopover(true);
				this.$emit('unsubscribe');
			},
			mute() {
				if (this.isSaving) {
					return;
				}
				this.closePopover(true);
				this.$emit('mute');
			},
			resume() {
				if (this.isSaving) {
					return;
				}
				this.closePopover(true);
				this.$emit('resume');
			}
		},
		// language=Vue
		template: `
		<div ref="root" class="note-subscription-bell">
			<button
				ref="bellTrigger"
				type="button"
				:class="triggerClasses"
				:title="bellTitle"
				:aria-label="bellTitle"
				aria-haspopup="menu"
				:aria-expanded="isOpen ? 'true' : 'false'"
				:aria-controls="isOpen ? bellPopoverId : null"
				@click.stop="toggleOpen"
			>
				<BIcon :name="iconName" :class="iconClass" aria-hidden="true" />
			</button>
			<Teleport :to="teleportTo || 'body'" :disabled="teleportTo === ''">
			<div
				v-if="isOpen"
				:id="bellPopoverId"
				ref="bellPopover"
				class="note-subscription-bell__popover"
				:class="popoverClass"
				role="menu"
				:aria-labelledby="bellTitleId"
				@keydown="onMenuKeydown"
				@focusout="handleFocusOut"
			>
				<template v-if="popoverState === 'direct' || popoverState === 'none'">
					<div :id="bellTitleId" class="note-subscription-bell__popover-title">{{ messages.subscriptionTitle }}</div>
					<!-- [#10 a11y] The row is the menu item and nothing inside it is: a menuitemradio may hold no
							 interactive descendant, and the role itself is not allowed on a label. The native radio stays
							 for what it draws and is inert, so it takes neither focus nor pointer, and the choice is made
							 by the row (children of this role are presentational, so nothing is announced twice). -->
					<div
						class="note-subscription-bell__option"
						role="menuitemradio"
						:aria-checked="subscribed && mode === 'self' ? 'true' : 'false'"
						:aria-disabled="isSaving ? 'true' : null"
						:tabindex="activeIndex === 0 ? 0 : -1"
						@click="selectMode('self')"
					>
						<input
							type="radio"
							inert
							tabindex="-1"
							:name="radioGroupName"
							value="self"
							:checked="subscribed && mode === 'self'"
							:disabled="isSaving"
						/>
						<span class="note-subscription-bell__option-text">
							<span class="note-subscription-bell__option-title">{{ messages.subscriptionScopeSelf }}</span>
							<span class="note-subscription-bell__option-desc">{{ messages.subscriptionScopeSelfDesc }}</span>
						</span>
					</div>
					<div
						class="note-subscription-bell__option"
						role="menuitemradio"
						:aria-checked="subscribed && mode === 'subtree' ? 'true' : 'false'"
						:aria-disabled="isSaving ? 'true' : null"
						:tabindex="activeIndex === 1 ? 0 : -1"
						@click="selectMode('subtree')"
					>
						<input
							type="radio"
							inert
							tabindex="-1"
							:name="radioGroupName"
							value="subtree"
							:checked="subscribed && mode === 'subtree'"
							:disabled="isSaving"
						/>
						<span class="note-subscription-bell__option-text">
							<span class="note-subscription-bell__option-title">{{ messages.subscriptionScopeSubtree }}</span>
							<span class="note-subscription-bell__option-desc">{{ messages.subscriptionScopeSubtreeDesc }}</span>
						</span>
					</div>
					<template v-if="popoverState === 'direct'">
						<div class="note-subscription-bell__sep"></div>
						<button
							type="button"
							class="note-subscription-bell__off"
							role="menuitem"
							:tabindex="activeIndex === 2 ? 0 : -1"
							:disabled="isSaving"
							@click="unsubscribe"
						>
							<span class="note-subscription-bell__off-icon-col">
								<BIcon :name="Outline.NOTIFICATION_OFF" class="note-subscription-bell__off-icon" aria-hidden="true" />
							</span>
							{{ messages.subscriptionOff }}
						</button>
					</template>
				</template>
				<template v-else-if="popoverState === 'inherited'">
					<div :id="bellTitleId" class="note-subscription-bell__info">{{ inheritedInfoText }}</div>
					<div class="note-subscription-bell__sep"></div>
					<button
						type="button"
						class="note-subscription-bell__off"
						role="menuitem"
						:tabindex="activeIndex === 0 ? 0 : -1"
						:disabled="isSaving"
						@click="mute"
					>
						<span class="note-subscription-bell__off-icon-col">
							<BIcon :name="Outline.NOTIFICATION_OFF" class="note-subscription-bell__off-icon" aria-hidden="true" />
						</span>
						{{ messages.subscriptionMute }}
					</button>
				</template>
				<template v-else-if="popoverState === 'muted'">
					<div :id="bellTitleId" class="note-subscription-bell__info">{{ messages.subscriptionMutedInfo }}</div>
					<div class="note-subscription-bell__sep"></div>
					<button
						type="button"
						class="note-subscription-bell__off"
						role="menuitem"
						:tabindex="activeIndex === 0 ? 0 : -1"
						:disabled="isSaving"
						@click="resume"
					>
						<span class="note-subscription-bell__off-icon-col">
							<BIcon :name="Outline.NOTIFICATION" class="note-subscription-bell__off-icon" aria-hidden="true" />
						</span>
						{{ messages.subscriptionResume }}
					</button>
				</template>
			</div>
			</Teleport>
		</div>
	`
	};

	// [NEW-C] Shared client half of the document-history push contract. The server registers the
	// NOTE_DOC_HISTORY_{documentId} tag in CollaborationProvider::subscribeUserToDocumentTag and
	// broadcasts freshly recorded b_note_event rows on it via HistoryPullGateway; FE extendWatch only
	// renews an existing tag, it never subscribes a new one. Both the sidebar feed (version-timeline)
	// and the activity-line chip consume this same stream — hence a single helper instead of two
	// copies of the subscribe/extend/route plumbing.
	const HISTORY_PUSH_COMMAND = 'documentHistoryEvent';
	const HISTORY_PULL_TAG_PREFIX = 'NOTE_DOC_HISTORY_';

	// [EVENT-02] Subscription lifecycle of the current user, pushed on their personal channel. Only
	// these two commands are routed; anything else is dropped before a consumer sees it.
	const SUBSCRIPTION_PUSH_COMMANDS = Object.freeze(['subscriptionSet', 'subscriptionRemove']);
	const SUBSCRIPTION_SCOPE_DOCUMENT = 'document';
	// The one depth that reaches nobody but the object it is written on. Everything else - a subscription
	// on the knowledge base, a subtree subscription on an ancestor, and any removal (which carries no
	// depth at all) - can change what reaches a document that is not named in the payload.
	const SUBSCRIPTION_MODE_SELF = 'self';

	// Subscribes to the pushed history-event stream for one document. `onEvent(event)` gets each pushed
	// tile (a listFeed row shape, see HistoryPullGateway::emit/FeedProvider::enrichOne). Returns a
	// disposer; calling it detaches the subscription. Safe to call before BX.PULL exists (no-op disposer).
	function subscribeDocumentHistory(documentId, onEvent) {
		const id = Number(documentId);
		if (!main_core.Type.isFunction(BX?.PULL?.subscribe) || !(id > 0) || !main_core.Type.isFunction(onEvent)) {
			return () => {};
		}
		const handler = data => {
			if (data?.command !== HISTORY_PUSH_COMMAND) {
				return;
			}
			const params = data?.params;
			if (Number(params?.documentId) !== id || !main_core.Type.isPlainObject(params?.event)) {
				return;
			}
			onEvent(params.event);
		};
		const unsubscribe = BX.PULL.subscribe({
			type: pull_client.PullClient.SubscriptionType.Server,
			moduleId: 'note',
			callback: handler
		});
		extendDocumentHistoryWatch(id);
		return () => {
			if (typeof unsubscribe === 'function') {
				unsubscribe();
			}
		};
	}

	// [EVENT-02] Subscribes to the subscription commands that can concern one document - its own row and
	// anything that may cover it from above (AC-052). `onChange({ command, mode })` carries the direct mode
	// of the change; the effective state of the document also depends on coverage, so a consumer re-reads
	// rather than adopting it blindly - which is why the filter errs towards passing a change through.
	// Returns a disposer. Safe to call before BX.PULL exists (no-op disposer). No per-document tag here:
	// these commands travel on the user's personal channel.
	function subscribeDocumentSubscription(documentId, onChange) {
		const id = Number(documentId);
		if (!main_core.Type.isFunction(BX?.PULL?.subscribe) || !(id > 0) || !main_core.Type.isFunction(onChange)) {
			return () => {};
		}
		const handler = data => {
			const command = String(data?.command || '');
			if (!SUBSCRIPTION_PUSH_COMMANDS.includes(command)) {
				return;
			}
			const params = data?.params;
			const mode = params?.mode ?? null;
			// Another document's own-depth row is the only change that provably cannot reach this document.
			const isForeignSelfRow = params?.scope === SUBSCRIPTION_SCOPE_DOCUMENT && Number(params?.entityId) !== id && mode === SUBSCRIPTION_MODE_SELF;
			if (isForeignSelfRow) {
				return;
			}
			onChange({
				command,
				mode
			});
		};
		const unsubscribe = BX.PULL.subscribe({
			type: pull_client.PullClient.SubscriptionType.Server,
			moduleId: 'note',
			callback: handler
		});
		return () => {
			if (typeof unsubscribe === 'function') {
				unsubscribe();
			}
		};
	}

	// Cheap keepalive for the per-document tag — extendWatch prolongs an already-registered tag, it
	// does not create one (that happened server-side). Call it when a consumer becomes visible again.
	function extendDocumentHistoryWatch(documentId) {
		if (!main_core.Type.isFunction(BX?.PULL?.extendWatch)) {
			return;
		}
		const id = Number(documentId);
		if (id > 0) {
			BX.PULL.extendWatch(`${HISTORY_PULL_TAG_PREFIX}${id}`);
		}
	}

	// Small, generic helper duplicated from note.editor's utils/error-message.js on purpose:
	// it has no dependency on editor internals, and duplicating it here keeps this extension
	// free of a cross-bundle import back into note.editor.
	function extractErrorMessage(error, fallback) {
		if (main_core.Type.isStringFilled(error)) {
			return error;
		}
		if (main_core.Type.isPlainObject(error)) {
			const firstError = error?.errors?.[0]?.message;
			if (main_core.Type.isStringFilled(firstError)) {
				return firstError;
			}
			if (main_core.Type.isStringFilled(error.message)) {
				return error.message;
			}
		}
		return fallback;
	}

	// Duplicated from note.editor's utils/show-error-toast.js on purpose — see error-message.js.
	function showErrorToast(message) {
		const content = String(message || '').trim();
		if (!content) {
			return;
		}
		BX.UI.Notification.Center.notify({
			content,
			position: 'top-right',
			autoHideDelay: 4000
		});
	}

	// [P6.T4] Subscription bell of the activity line: the "#bellLine" control plus the scope popover
	// per mockup-activity-line.html's #popSub. This half owns the state and the transport - it adopts
	// the bootstrap snapshot (or loads it from SubscriptionController.getState), writes through
	// SubscriptionApi and reconciles the effective state afterwards. The control itself, the popover
	// and its keyboard model live in SubscriptionBellView, shared with the row of the favorites block.
	//
	// [P4.T4] EVENT-02: a subscription changed in another session (or by the same user in another tab)
	// re-reads the state, so the bell of an open document stops relying on the page being reloaded.
	const SubscriptionBellComponent = {
		name: 'NoteDocumentHistorySubscriptionBell',
		components: {
			SubscriptionBellView
		},
		props: {
			documentId: {
				type: Number,
				required: true
			},
			// Not required by the document-scope set()/getState() contract (the server
			// resolves the document's own collection when it's omitted) — accepted so the
			// caller can pass it through explicitly when it already has it at hand.
			collectionId: {
				type: Number,
				default: 0
			},
			// Bell state bundled with the document bootstrap (see DocumentSubscriptionStateResolver):
			// `{ subscribed, mode, muted, inherited, inheritedSource }`. When present the bell adopts it
			// on mount instead of issuing its own getState request; absent → it falls back to getState.
			// Shape matches getState's `document` block, so both paths reuse applyState().
			initialState: {
				type: Object,
				default: null
			},
			// [AC-045] Is the document in the caller's favorites list. Owned by the star next to the bell,
			// which is the only place that knows the optimistic frame as well as the store.
			isFavorite: {
				type: Boolean,
				default: false
			},
			messages: {
				type: Object,
				required: true
			}
		},
		data() {
			return {
				subscribed: false,
				mode: null,
				// [inherited] Covered by an ancestor subtree / collection subscription (no direct row) —
				// the bell reads as active and the popover explains the source instead of offering a
				// redundant scope choice. `muted` is the per-document negative override of that coverage.
				inherited: false,
				inheritedSource: null,
				// Title of the covering source (nearest subtree-subscribed ancestor, or the collection) —
				// names it in the info line ("within the «…» section") so the coverage isn't a vague "parent".
				inheritedTitle: '',
				muted: false,
				isLoading: false,
				isSaving: false
			};
		},
		computed: {
			// [AC-045] Notifications live on favorites: the bell is offered for a document in the list, and
			// for one that is still covered after the star came off - otherwise there would be no way to
			// switch that coverage off or to mute what an ancestor imposes.
			isVisible() {
				// `muted` is deliberately not a reason of its own: a mute suppresses coverage from above, so it
				// only ever appears together with `inherited`. Once that coverage is gone (the subscription on
				// the knowledge base switched off) the row it left behind suppresses nothing, and a bell for it
				// would sit on a document notifications no longer reach. Same rule in the rows of the block.
				return this.isFavorite || this.subscribed || this.inherited;
			},
			// [DTO-02] The state surface the view draws from.
			bellState() {
				return {
					mode: this.mode,
					subscribed: this.subscribed,
					muted: this.muted,
					inherited: this.inherited,
					inheritedSource: this.inheritedSource,
					inheritedTitle: this.inheritedTitle
				};
			}
		},
		created() {
			this.subscriptionPullDispose = null;
			// Own announcements come back through the same bus; adopting them would cost a second settle
			// request for a state this component already holds. Delivery is synchronous, so a flag set right
			// before the emit is enough to recognise the echo.
			this.skipOwnSubscriptionEcho = false;
			this.localSubscriptionHandler = event => {
				if (this.skipOwnSubscriptionEcho) {
					this.skipOwnSubscriptionEcho = false;
					return;
				}
				const data = event?.getData?.() ?? {};
				const scope = String(data.scope || SUBSCRIPTION_SCOPE_DOCUMENT$1);
				if (scope !== SUBSCRIPTION_SCOPE_DOCUMENT$1 || Number(data.entityId) !== Number(this.documentId)) {
					// [AC-052] Not this document's own row - but a subscription on the knowledge base or on the
					// subtree of an ancestor changes what reaches this document, and the payload does not say
					// whether it does. Only the server can tell, so the read waits for the announcement that
					// has the server's answer behind it; an unconfirmed one would be read before the write.
					if (data.confirmed === true) {
						void this.loadState();
					}
					return;
				}

				// The state travels with the announcement, so the bell lights up in the frame of the press with
				// no read of its own. A read here would race the sender: the sidebar announces the change
				// optimistically, before its write reaches the server, and getState would answer with the state
				// from before it - the bell would flip back and then forward again on the push. Coverage from
				// above is not touched by a write on this document's own row, so what is held stays valid, and
				// the push that follows settles the rest.
				if (data.state) {
					this.subscribed = Boolean(data.state.subscribed);
					this.mode = this.subscribed ? String(data.state.mode || '') : null;
					this.muted = Boolean(data.state.muted);
					return;
				}
				void this.loadState();
			};
			main_core_events.EventEmitter.subscribe('Note:subscriptionChanged', this.localSubscriptionHandler);
		},
		mounted() {
			// Adopt the bootstrap snapshot when the caller supplied it (see initialState prop) — no
			// getState round-trip on document open. Fall back to a fetch only when it's absent.
			if (main_core.Type.isPlainObject(this.initialState)) {
				this.applyState(this.initialState);
			} else {
				void this.loadState();
			}
			this.subscribeSubscriptionEvents();
		},
		beforeUnmount() {
			this.unsubscribeSubscriptionEvents();
			main_core_events.EventEmitter.unsubscribe('Note:subscriptionChanged', this.localSubscriptionHandler);
			this.localSubscriptionHandler = null;
		},
		watch: {
			// The editor remounts per document, so this rarely fires — but re-adopt the fresh bootstrap
			// snapshot (or refetch) defensively if the caller ever reuses the instance across documents.
			documentId() {
				if (main_core.Type.isPlainObject(this.initialState)) {
					this.applyState(this.initialState);
				} else {
					void this.loadState();
				}
				this.subscribeSubscriptionEvents();
			}
		},
		methods: {
			// Broadcasts a subscription change on this document over the local bus of the page. The state
			// travels with it: every other bell of the same object (the row of the favorites block) can then
			// light up in this frame instead of waiting for the pull round-trip.
			// `confirmed` distinguishes the announcement of the optimistic flip from the one backed by the
			// server's answer: a listener that has to re-read coverage from above can only trust the latter.
			emitSubscriptionChanged(confirmed = true) {
				this.skipOwnSubscriptionEcho = true;
				main_core_events.EventEmitter.emit('Note:subscriptionChanged', new main_core_events.BaseEvent({
					data: {
						scope: SUBSCRIPTION_SCOPE_DOCUMENT$1,
						entityId: Number(this.documentId),
						state: this.bellState,
						confirmed
					}
				}));
			},
			// Shared by the bootstrap-adopt and getState paths — both carry the same `document` shape.
			applyState(state) {
				this.subscribed = Boolean(state?.subscribed);
				this.mode = this.subscribed ? String(state?.mode || '') : null;
				this.inherited = Boolean(state?.inherited);
				this.inheritedSource = this.inherited ? String(state?.inheritedSource || '') : null;
				this.inheritedTitle = this.inherited ? String(state?.inheritedTitle || '') : '';
				this.muted = Boolean(state?.muted);
			},
			// [EVENT-02] The payload carries the direct mode only; the effective state also depends on
			// coverage from above, so the event is a signal to re-read rather than a state to adopt.
			subscribeSubscriptionEvents() {
				this.unsubscribeSubscriptionEvents();
				this.subscriptionPullDispose = subscribeDocumentSubscription(this.documentId, () => {
					void this.loadState();
				});
			},
			unsubscribeSubscriptionEvents() {
				if (typeof this.subscriptionPullDispose === 'function') {
					this.subscriptionPullDispose();
				}
				this.subscriptionPullDispose = null;
			},
			async loadState() {
				const documentId = Number(this.documentId);
				if (!(documentId > 0)) {
					return;
				}
				this.isLoading = true;
				try {
					const response = await SubscriptionApi.getState({
						documentId,
						collectionId: Number(this.collectionId) || null
					});
					this.applyState(response?.data?.document ?? null);
				} catch {
					// Leave the bell in its default "not subscribed" state rather than showing
					// a misleading toggle — same reasoning as ViewsWidgetComponent.loadSnapshot().
				} finally {
					this.isLoading = false;
				}
			},
			async selectMode(mode) {
				if (this.isSaving) {
					return;
				}

				// Optimistic: flip colour this frame, reconcile against the server afterwards. set() is
				// idempotent, so the only reason to touch state again is a failure - then roll back to the
				// captured previous state and surface a toast.
				const previous = {
					subscribed: this.subscribed,
					mode: this.mode
				};
				this.subscribed = true;
				this.mode = mode;
				// The row of the sidebar lights up in the frame of the press, like the star does.
				this.emitSubscriptionChanged(false);
				this.isSaving = true;
				try {
					await SubscriptionApi.set({
						scope: SUBSCRIPTION_SCOPE_DOCUMENT$1,
						entityId: this.documentId,
						mode
					});
					// Reconcile: a direct subscription may sit atop inherited coverage — reload the true
					// effective state rather than trusting the optimistic flip.
					await this.loadState();
					this.emitSubscriptionChanged();
				} catch (error) {
					this.subscribed = previous.subscribed;
					this.mode = previous.mode;
					// The optimistic announcement has already been adopted elsewhere - take it back.
					this.emitSubscriptionChanged(false);
					// [API-05] The document left the favorites list between the render and the press. The
					// roll-back above is already the server's answer about the subscription, and EVENT-01 has
					// the list covered, so this is a stale view rather than a technical failure.
					if (isFavoriteRequiredError(error)) {
						void this.loadState();
						return;
					}
					showErrorToast(extractErrorMessage(error, this.messages.subscriptionSetError));
				} finally {
					this.isSaving = false;
				}
			},
			async unsubscribe() {
				if (this.isSaving) {
					return;
				}

				// Optimistic (see selectMode) — remove() is idempotent, so mirror the same flow.
				const previous = {
					subscribed: this.subscribed,
					mode: this.mode
				};
				this.subscribed = false;
				this.mode = null;
				this.emitSubscriptionChanged(false);
				this.isSaving = true;
				try {
					await SubscriptionApi.remove({
						scope: SUBSCRIPTION_SCOPE_DOCUMENT$1,
						entityId: this.documentId
					});
					// Removing the direct row can leave inherited coverage in place (ancestor subtree /
					// collection) — reload so the bell settles to the real effective state.
					await this.loadState();
					this.emitSubscriptionChanged();
				} catch (error) {
					this.subscribed = previous.subscribed;
					this.mode = previous.mode;
					// The optimistic announcement has already been adopted elsewhere - take it back.
					this.emitSubscriptionChanged(false);
					showErrorToast(extractErrorMessage(error, this.messages.subscriptionRemoveError));
				} finally {
					this.isSaving = false;
				}
			},
			// [inherited] Suppress this document's notifications despite an ancestor subtree / collection
			// subscription — writes a MODE_MUTED row (negative override). remove() later lifts it (resume).
			async mute() {
				if (this.isSaving) {
					return;
				}
				const previousMuted = this.muted;
				this.muted = true; // optimistic: bell off this frame
				this.emitSubscriptionChanged(false);
				this.isSaving = true;
				try {
					await SubscriptionApi.set({
						scope: SUBSCRIPTION_SCOPE_DOCUMENT$1,
						entityId: this.documentId,
						mode: SUBSCRIPTION_MODE_MUTED
					});
					await this.loadState();
					this.emitSubscriptionChanged();
				} catch (error) {
					this.muted = previousMuted;
					this.emitSubscriptionChanged(false);
					showErrorToast(extractErrorMessage(error, this.messages.subscriptionSetError));
				} finally {
					this.isSaving = false;
				}
			},
			// [inherited] Lift the mute (delete the MODE_MUTED row) — coverage falls back to the ancestor
			// subtree / collection subscription that was there before.
			async resume() {
				if (this.isSaving) {
					return;
				}
				const previousMuted = this.muted;
				this.muted = false; // optimistic: back to inherited coverage
				this.emitSubscriptionChanged(false);
				this.isSaving = true;
				try {
					await SubscriptionApi.remove({
						scope: SUBSCRIPTION_SCOPE_DOCUMENT$1,
						entityId: this.documentId
					});
					await this.loadState();
					this.emitSubscriptionChanged();
				} catch (error) {
					this.muted = previousMuted;
					this.emitSubscriptionChanged(false);
					showErrorToast(extractErrorMessage(error, this.messages.subscriptionRemoveError));
				} finally {
					this.isSaving = false;
				}
			}
		},
		// language=Vue
		template: `
		<SubscriptionBellView
			v-if="isVisible"
			:state="bellState"
			:is-saving="isSaving"
			:messages="messages"
			@select-mode="selectMode"
			@unsubscribe="unsubscribe"
			@mute="mute"
			@resume="resume"
		/>
	`
	};

	// [API-01 / API-02] Thin ajax wrapper around FavoriteController for the star of the activity line -
	// same shape as subscription-api.js (one static method per action, plain data objects in/out). Only
	// the document scope is here: the star of a knowledge base lives in the sidebar row, not in a document.
	const ENTITY_TYPE_DOCUMENT = 'document';
	class FavoriteApi {
		// [API-01] Adds the document to the personal list; without a position it goes in first.
		static add({
			documentId
		}) {
			return main_core.ajax.runAction('note.infrastructure.FavoriteController.add', {
				data: {
					entityType: ENTITY_TYPE_DOCUMENT,
					entityId: Number(documentId),
					position: null
				}
			});
		}

		// [API-02] Removes the row. Idempotent: a missing row is not an error.
		static remove({
			documentId
		}) {
			return main_core.ajax.runAction('note.infrastructure.FavoriteController.remove', {
				data: {
					entityType: ENTITY_TYPE_DOCUMENT,
					entityId: Number(documentId)
				}
			});
		}
	}

	// Local bus of the page, shared with the sidebar (NoteEvent.FAVORITE_CHANGED there). A literal here on
	// purpose: note.sidebar already depends on this extension for the bell popover, so it cannot be
	// imported back.
	const FAVORITE_CHANGED_EVENT = 'Note:favoriteChanged';

	// [P4.T3] Star of the activity line: adds the open document to the personal favorites list and takes
	// it back out. Unlike the bell it is NOT gated by the notifications setting - the list exists on its
	// own - and it needs document VIEW, not edit (AC-001), the same right the bell needs.
	//
	// State is one and the same as the sidebar's: when the sidebar is on the page its store is the owner
	// of the flag (optimistic toggles, EVENT-01 pushes, the loaded pages of the block all land there), so
	// a change made in a row of the sidebar shows up here without a reload. `initialFavorite` is the
	// bootstrap value (TPL-01) for the case where the store has never heard of this document; the local
	// flag on top of both is what the user's own press flips this frame.
	const FavoriteStarComponent = {
		name: 'NoteDocumentHistoryFavoriteStar',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			documentId: {
				type: Number,
				required: true
			},
			// Bootstrap value of the flag; `null` means the caller has not reported one.
			initialFavorite: {
				type: Boolean,
				default: null
			},
			// What the sidebar needs to draw the row of the favorites block within the frame of the press
			// instead of after a read of the list: it travels with the announcement below. An empty title
			// reports nothing - a nameless row is worse than the wait it saves.
			documentTitle: {
				type: String,
				default: ''
			},
			collectionId: {
				type: Number,
				default: 0
			},
			messages: {
				type: Object,
				required: true
			}
		},
		// The bell next to the star is gated by the same flag (notifications live on favorites), and the
		// star is its owner here - including the optimistic frame, which no store reports on a page
		// without a sidebar.
		emits: ['favorite-change'],
		inject: {
			// The sidebar of the page, when there is one. Optional by design: the activity line also
			// renders where no sidebar is mounted.
			noteSidebarState: {
				default: null
			}
		},
		data() {
			return {
				localFavorite: null,
				isSaving: false
			};
		},
		computed: {
			starIcon() {
				return this.isFavorite ? ui_iconSet_api_vue.Solid.FAVORITE : ui_iconSet_api_vue.Outline.FAVORITE;
			},
			sharedFavorite() {
				const favorites = this.noteSidebarState?.favorites;
				if (!favorites || typeof favorites.isFavorite !== 'function') {
					return null;
				}
				return favorites.isFavorite('document', Number(this.documentId));
			},
			isFavorite() {
				return this.localFavorite ?? this.initialFavorite ?? this.sharedFavorite ?? false;
			},
			starTitle() {
				return this.isFavorite ? this.messages.activityFavoriteOff : this.messages.activityFavoriteOn;
			}
		},
		created() {
			this.favoriteEventHandler = event => {
				const data = event?.getData?.() ?? {};
				if (String(data.entityType) !== 'document' || Number(data.entityId) !== Number(this.documentId)) {
					return;
				}
				this.localFavorite = data.isFavorite === true;
			};
			main_core_events.EventEmitter.subscribe(FAVORITE_CHANGED_EVENT, this.favoriteEventHandler);
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe(FAVORITE_CHANGED_EVENT, this.favoriteEventHandler);
			this.favoriteEventHandler = null;
		},
		watch: {
			isFavorite: {
				immediate: true,
				handler(value) {
					this.$emit('favorite-change', value);
				}
			},
			// A change in the store is a change of the shared state - adopt it. Only changes are followed:
			// the store answers "not in the list" for a document it has never loaded, and that answer must
			// not overrule the bootstrap value on mount.
			sharedFavorite(value) {
				if (typeof value === 'boolean') {
					this.localFavorite = value;
				}
			},
			documentId() {
				this.localFavorite = null;
			}
		},
		methods: {
			emitFavoriteChanged(isFavorite) {
				main_core_events.EventEmitter.emit(FAVORITE_CHANGED_EVENT, new main_core_events.BaseEvent({
					data: {
						entityType: 'document',
						entityId: Number(this.documentId),
						isFavorite,
						hint: this.favoriteHint()
					}
				}));
			},
			// [DTO-01] Second announcement of the same press, this one with the server's answer behind it -
			// including the refusal that rolls the press back, which settles the state just as well. Until it
			// arrives the sidebar holds the press against a page read of its own; `confirmed` is what releases
			// it, the same convention the bell of the line follows. `item` is the finished row of the block: it
			// is the only thing that can name the row drawn on the press (id, position, coverage), and a null
			// one (an older server, an object the list does not hand out) leaves the block to re-read.
			emitFavoriteConfirmed(isFavorite, item) {
				main_core_events.EventEmitter.emit(FAVORITE_CHANGED_EVENT, new main_core_events.BaseEvent({
					data: {
						entityType: 'document',
						entityId: Number(this.documentId),
						isFavorite,
						confirmed: true,
						item
					}
				}));
			},
			// The open document as the sidebar's block would draw it. Nesting is left out: this page knows
			// nothing about the children of the document, and the push of the add reports them.
			favoriteHint() {
				const title = String(this.documentTitle ?? '').trim();
				if (title === '') {
					return null;
				}
				return {
					title,
					collectionId: Number(this.collectionId) || 0
				};
			},
			async toggle() {
				const documentId = Number(this.documentId);
				if (this.isSaving || !(documentId > 0)) {
					return;
				}

				// Optimistic: the star fills in this frame and falls back on failure. The announcement goes out
				// with the optimistic flip, not after the answer - the row of the sidebar has to light up in
				// the same frame as the star that was pressed.
				const previous = this.isFavorite;
				this.localFavorite = !previous;
				this.emitFavoriteChanged(!previous);
				this.isSaving = true;
				try {
					if (previous) {
						await FavoriteApi.remove({
							documentId
						});
						this.emitFavoriteConfirmed(false, null);
					} else {
						const response = await FavoriteApi.add({
							documentId
						});
						this.emitFavoriteConfirmed(true, response?.data?.item ?? null);
					}
				} catch (error) {
					this.localFavorite = previous;
					// A refused write leaves the server holding the state from before the press, so the
					// roll-back is as settled as an answer: it releases the press instead of opening a new one.
					this.emitFavoriteConfirmed(previous, null);
					showErrorToast(extractErrorMessage(error, previous ? this.messages.favoriteRemoveError : this.messages.favoriteAddError));
				} finally {
					this.isSaving = false;
				}
			}
		},
		// language=Vue
		template: `
		<button
			type="button"
			class="note-activity-line__control --interactive"
			:class="{ '--on': isFavorite }"
			:title="starTitle"
			:aria-label="messages.activityFavoriteState"
			:aria-pressed="isFavorite ? 'true' : 'false'"
			data-testid="note-activity-favorite"
			@click="toggle"
		>
			<BIcon :name="starIcon" class="note-activity-line__control-icon" aria-hidden="true" />
		</button>
	`
	};

	// [P1.T5] Activity line hub under the document title: three slots — last-change chip
	// (opens the history sidebar), views eye and subscription bell. The chip's payload is `lastChange`
	// (`{ authors, time }`, bundled into the document bootstrap payload by the backend) — `null` falls
	// back to a generic "open history" label instead of inventing an author/time.
	//
	// [#11/#12 rework] While a version preview is open (note.editor's DocumentEditorComponent — see
	// its `contentOnly`/preview state), the caller feeds `previewInfo` instead: same `{ authors, time }`
	// shape, but sourced from the previewed version rather than the live document. `previewInfo` wins
	// over `lastChange` for the chip, and also hides the eye/bell (mockup's `pvActions="meta"`:
	// `#eyeCtl,#bellLine{display:none}`) — those read live-document state that doesn't apply to a
	// past version.
	//
	// [P3.T4] The eye slot is the working ViewsWidgetComponent. It needs `documentId` and the
	// live-collaboration `provider` (for the real-time overlay, reusing AwarenessManager per Block
	// 5 — see views-widget.js) — both are explicit props on this component now, handed down by the
	// caller (note.editor's DocumentEditorComponent). Previously read via `this.$parent` back when
	// this component still lived inside note.editor itself; that coupling is gone now that this
	// component is its own extension.
	//
	// [P6.T4] The bell slot is the working SubscriptionBellComponent (self-contained — it loads its
	// own subscribed/mode state from SubscriptionController.getState, same pattern as the eye).
	// Subscribing only requires document VIEW rights (see SubscriptionController::assertTargetViewAccess),
	// not edit — the bell is NOT gated by `canEdit`.
	const ActivityLineComponent = {
		name: 'NoteDocumentHistoryActivityLine',
		components: {
			NoteAvatarStack: note_ui_avatarStack.NoteAvatarStack,
			ViewsWidgetComponent,
			BacklinksWidgetComponent: note_ui_backlinks.BacklinksWidgetComponent,
			SubscriptionBellComponent,
			FavoriteStarComponent
		},
		props: {
			documentId: {
				type: Number,
				required: true
			},
			// The PushPullYjsProvider instance — passed straight through to ViewsWidgetComponent,
			// see its own prop doc for details.
			provider: {
				type: Object,
				default: null
			},
			// Not consumed internally today — accepted for contract parity with
			// VersionTimelineComponent (both hubs render next to document content and may need it
			// for future edit-gated affordances).
			canEdit: {
				type: Boolean,
				default: false
			},
			// Handed down to SubscriptionBellComponent — optional (the server falls back to the
			// document's own collection when it's 0/omitted), passed through when the caller
			// already has it (see note-editor.js's own `collectionId` prop). [P3.T1] Also read by
			// BacklinksWidgetComponent, which labels only the sources living in another knowledge base.
			collectionId: {
				type: Number,
				default: 0
			},
			// [#2] Bootstrap snapshot of the last content change: `{ authors: [{id,name,avatar}],
			// time: <ISO 8601 string> } | null`. Normalized upstream in note.app's
			// route-document-resolver.js and threaded through note.editor's state/EditorMount —
			// see note-editor.js's own `lastChange` prop doc. [NEW-C] This is only the page-load
			// value; after mount a live `content_changed` push overrides it via `liveLastChange`
			// (see effectiveChipInfo), so the chip stays fresh without a reload.
			lastChange: {
				type: Object,
				default: null
			},
			// [P8.T5] ISO-8601 creation timestamp of the document. When there is no last-change info to
			// show, the chip falls back to "Created <date>" instead of the generic "open history" label.
			createdAt: {
				type: String,
				default: null
			},
			// [P8.T2] history_enabled UI flag. When false the chip still renders and live-updates, but it
			// is NOT interactive: no history-open click, no title/hover/cursor affordance.
			historyEnabled: {
				type: Boolean,
				default: false
			},
			// [P8.T3] notifications_enabled UI flag — gates the subscription bell only.
			notificationsEnabled: {
				type: Boolean,
				default: false
			},
			// [#11/#12] Same shape as `lastChange`, sourced from the version currently open in the
			// main editor's read-only preview. Non-null overrides `lastChange` for the chip and
			// hides the eye/bell (see class doc above).
			previewInfo: {
				type: Object,
				default: null
			},
			// [#6] Initial "who viewed" snapshot bundled with the document bootstrap payload —
			// passed straight through to ViewsWidgetComponent, which uses it as a base and skips
			// its own getViews call when present. See that component's own prop doc.
			initialViews: {
				type: Object,
				default: null
			},
			// [DTO-01] Backlinks counter bundled with the document bootstrap — passed straight through
			// to BacklinksWidgetComponent, which adopts it instead of reading the count itself. See that
			// component's own prop doc.
			initialBacklinks: {
				type: Object,
				default: null
			},
			// Bell state bundled with the document bootstrap — passed straight through to
			// SubscriptionBellComponent, which adopts it instead of its own getState call on mount.
			initialSubscription: {
				type: Object,
				default: null
			},
			// [TPL-01] "In favorites" flag from the document bootstrap - passed straight through to
			// FavoriteStarComponent. `null` leaves the star to the sidebar's own state (see its prop doc).
			initialFavorite: {
				type: Boolean,
				default: null
			},
			// Title of the open document - handed to FavoriteStarComponent, which reports it with the star's
			// announcement so the sidebar can draw the row of the block at once (see its prop doc).
			documentTitle: {
				type: String,
				default: ''
			},
			// [own-view bug fix] `{ id, name, avatar, ... }` — passed straight through to
			// ViewsWidgetComponent, which uses it to add the current user to the viewers list on
			// mount when the bootstrap snapshot hasn't recorded their own view yet (see that
			// component's own prop/class doc).
			currentUser: {
				type: Object,
				default: () => ({})
			},
			messages: {
				type: Object,
				required: true
			},
			// [avatar profile] Optional function-prop from the caller (note.editor's note-editor.js) —
			// invoked with a user id when a chip author avatar or a views-list viewer row is clicked.
			// Threaded down to ViewsWidgetComponent as well.
			openUserProfile: {
				type: Function,
				default: null
			}
		},
		// open-internal-link is relayed from the backlinks widget: only the host has a router.
		emits: ['open-history', 'open-internal-link'],
		data() {
			return {
				// [NEW-C, live chip] Latest content-change snapshot learned from the pushed history
				// stream after mount — starts null (chip shows the bootstrap `lastChange` prop) and,
				// once a `content_changed` event arrives, overrides it so the chip updates in place
				// without a reload. Same `{ authors, time }` shape as `lastChange`.
				liveLastChange: null,
				// [AC-045] Effective "in favorites" flag as the star reports it (bootstrap, sidebar store or
				// the user's own press). The bell is gated by it, so it has to be the star's value and not a
				// second reading of the same fact.
				starFavorite: null
			};
		},
		created() {
			// Non-reactive pull disposer (a bare function handle, deliberately outside data()).
			this.historyPullDispose = null;
		},
		mounted() {
			this.subscribeHistory();
		},
		beforeUnmount() {
			this.unsubscribeHistory();
		},
		watch: {
			// The host editor app is remounted per document, so this rarely fires — but reset+resubscribe
			// defensively in case the caller ever reuses the instance across documents.
			documentId() {
				this.liveLastChange = null;
				this.subscribeHistory();
			}
		},
		computed: {
			isPreviewMode() {
				return this.previewInfo !== null;
			},
			isFavorite() {
				return this.starFavorite ?? Boolean(this.initialFavorite);
			},
			effectiveChipInfo() {
				// A version preview wins over everything; otherwise the freshest live content-change
				// snapshot wins over the bootstrap one, so the chip tracks edits made after page load.
				const info = this.previewInfo ?? this.liveLastChange ?? this.lastChange;
				return main_core.Type.isPlainObject(info) ? info : null;
			},
			chipAuthors() {
				const authors = this.effectiveChipInfo?.authors;
				return Array.isArray(authors) ? authors : [];
			},
			hasChipInfo() {
				return this.chipAuthors.length > 0 && main_core.Type.isStringFilled(this.effectiveChipInfo?.time);
			},
			// [#2, date-format fix] Shared day+time convention — see format-date.js.
			chipTimeText() {
				const ts = this.toTimestampSeconds(this.effectiveChipInfo?.time);
				return ts === null ? '' : formatActivityTimestamp(ts);
			},
			// [P8.T5] No last-change info: show "Created <date>" when we have a valid creation timestamp,
			// otherwise keep the generic "open history" label (no crash on a missing/invalid createdAt).
			chipFallbackText() {
				const ts = this.toTimestampSeconds(this.createdAt);
				if (ts === null) {
					return this.messages.activityOpenHistory;
				}
				return `${this.messages.activityCreated} ${formatActivityTimestamp(ts)}`;
			}
		},
		methods: {
			toTimestampSeconds(value) {
				if (typeof value !== 'string' || value === '') {
					return null;
				}
				const ms = Date.parse(value);
				return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
			},
			// [NEW-C, live chip] Subscribe to the same pushed history stream the sidebar feed reads, but
			// only to keep the chip's "last change" fresh. `content_changed` is visible to every role
			// (EventVisibilityPolicy MTX-01), so reacting to it here leaks nothing the reader can't see.
			subscribeHistory() {
				this.unsubscribeHistory();
				this.historyPullDispose = subscribeDocumentHistory(this.documentId, event => this.handleHistoryEvent(event));
			},
			unsubscribeHistory() {
				if (typeof this.historyPullDispose === 'function') {
					this.historyPullDispose();
				}
				this.historyPullDispose = null;
			},
			handleHistoryEvent(event) {
				if (!main_core.Type.isPlainObject(event) || String(event.type || '') !== 'content_changed') {
					return;
				}
				const rawAuthors = Array.isArray(event.authors) && event.authors.length > 0 ? event.authors : [event.actor].filter(main_core.Type.isPlainObject);
				const authors = rawAuthors.map(author => ({
					id: Number(author?.id) || 0,
					name: String(author?.name || ''),
					avatar: author?.avatar || null,
					// Keep the server identity color (see version-timeline.js) so the chip avatar matches
					// the caret / timeline instead of falling back to the palette.
					color: author?.color || null
				}));
				const time = typeof event.createdAt === 'string' ? event.createdAt : '';
				if (authors.length === 0 || time === '') {
					return;
				}
				this.liveLastChange = {
					authors,
					time
				};
			},
			handleChipClick() {
				// [P8.T2] history_enabled off → the chip is a passive label, no history-open.
				if (!this.historyEnabled) {
					return;
				}
				this.$emit('open-history');
			},
			handleAvatarClick(participant) {
				const id = Number(participant?.id);
				if (Number.isInteger(id) && id > 0 && typeof this.openUserProfile === 'function') {
					this.openUserProfile(id);
				}
			}
		},
		// language=Vue
		template: `
		<div class="note-activity-line">
			<button
				v-if="historyEnabled"
				type="button"
				class="note-activity-line__chip"
				:title="messages.activityOpenHistory"
				@click="handleChipClick"
			>
				<span v-if="hasChipInfo" class="note-activity-line__chip-text">{{ messages.activityChanged }} {{ chipTimeText }}</span>
				<span v-else class="note-activity-line__chip-text">{{ chipFallbackText }}</span>
			</button>
			<span v-else class="note-activity-line__chip note-activity-line__chip--static">
				<span v-if="hasChipInfo" class="note-activity-line__chip-text">{{ messages.activityChanged }} {{ chipTimeText }}</span>
				<span v-else class="note-activity-line__chip-text">{{ chipFallbackText }}</span>
			</span>
			<template v-if="hasChipInfo">
				<span class="note-activity-line__chip-sep" aria-hidden="true">·</span>
				<NoteAvatarStack
					class="note-activity-line__chip-avatars"
					:participants="chipAuthors"
					:avatars-clickable="true"
					:menu-aria-label="messages.historyCoAuthorsTitle"
					@avatar-click="handleAvatarClick"
				/>
			</template>
			<span v-if="!isPreviewMode" class="note-activity-line__actions">
				<ViewsWidgetComponent
					:document-id="documentId"
					:provider="provider"
					:initial-views="initialViews"
					:current-user="currentUser"
					:messages="messages"
					:open-user-profile="openUserProfile"
				/>
				<!-- [P2.T3] Slot order is fixed by the product: last change, views, incoming links,
						 favorites, subscription. -->
				<BacklinksWidgetComponent
					:document-id="documentId"
					:initial-backlinks="initialBacklinks"
					@open-internal-link="$emit('open-internal-link', $event)"
				/>
				<!-- [P4.T3] The star is not gated by notificationsEnabled: the favorites list exists
						 independently of the bell. In "meta" mode (a version preview) it is hidden along
						 with the eye and the bell - see the wrapper above. -->
				<FavoriteStarComponent
					:document-id="documentId"
					:initial-favorite="initialFavorite"
					:document-title="documentTitle"
					:collection-id="collectionId"
					:messages="messages"
					@favorite-change="starFavorite = $event"
				/>
				<SubscriptionBellComponent
					v-if="notificationsEnabled"
					:document-id="documentId"
					:collection-id="collectionId"
					:initial-state="initialSubscription"
					:is-favorite="isFavorite"
					:messages="messages"
				/>
			</span>
		</div>
	`
	};

	// [P1.T5 / P2.T4] History sidebar — the right-hand 3rd column, pushes the document content
	// (see note.editor's document-page.js `--note-history-width` custom property), never overlays it.
	//
	// [#11/#12 rework] This sidebar no longer renders a version preview itself — clicking a
	// restorable tile emits `preview` with `{ versionId, item }` and the caller (note.editor's
	// document-page.js) takes it from there: it fetches the version markdown and pushes it into the
	// MAIN editor (read-only), not into a narrow column here. This keeps the sidebar a pure list —
	// restoring, compacting and the 409 retry (SDD P1.T2) now live with the caller too. `previewVersionId`
	// is handed back down only so the currently-previewed tile can be highlighted / toggled off.
	//
	// [P2.T4] The feed (Block 2, listFeed API-04) is fetched and paginated by this component
	// itself — the parent (note.editor's document-page.js) only owns open/close state, it doesn't
	// pass data in. `groups` below is an internal computed, not a prop, grouped by calendar day from
	// the flat `feedEvents` list; the shape matches the P1.T5 placeholder exactly: { key, dateLabel,
	// items: [{ key, type, title, subtitle, authors, restorable, versionId, createdAt }] }. `authors`
	// follows NoteAvatarStack's participant shape ({ id, name, avatar }); `restorable` +
	// `versionId` gate the lazy preview (only `content_changed` events with a live version are
	// restorable — see EVENT_LABELS / FeedProvider::enrich()).
	const FEED_PAGE_SIZE = 30;

	// [client-filter] The feed is fetched UNFILTERED (all role-allowed types) and the type filter is
	// applied client-side, so toggling it never triggers a reload. When the filtered result is too
	// short to scroll, we auto-load more raw pages so scroll-pagination can take over — but bound that
	// to a safety cap so a rare type buried under thousands of other events can't spin the loader
	// indefinitely. In practice a doc's rarer events sit well within this window.
	const AUTOFILL_MAX_PAGES = 20;
	// Same slack as handleBodyScroll's bottom trigger — "not scrollable" means within this of fitting.
	const SCROLL_THRESHOLD_PX = 120;

	// [SDD API-04 / EventVisibilityPolicy] Canonical event types, gender-neutral noun labels per
	// UI-requirements — no "Version" noun anywhere, no gendered "changed" verb forms.
	const EVENT_LABEL_KEYS = {
		created: 'historyEventCreated',
		content_changed: 'historyEventContentChanged',
		title_changed: 'historyEventTitleChanged',
		archived: 'historyEventArchived',
		archive_restored: 'historyEventArchiveRestored',
		trashed: 'historyEventTrashed',
		trash_restored: 'historyEventTrashRestored',
		moved: 'historyEventMoved',
		access_changed: 'historyEventAccessChanged'
	};

	// Module-level counter for a unique filter-popover id per instance (mirrors NoteAvatarStack's
	// menuId) — avoids a hardcoded id colliding if this sidebar is ever rendered more than once.
	let instanceCounter = 0;
	const VersionTimelineComponent = {
		name: 'NoteDocumentHistoryVersionTimeline',
		components: {
			NoteAvatarStack: note_ui_avatarStack.NoteAvatarStack,
			Loader: note_ui_loader.Loader,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			open: {
				type: Boolean,
				default: false
			},
			documentId: {
				type: Number,
				required: true
			},
			// [#11/#12 rework] Which version (if any) the caller currently has open in the main
			// editor's preview — used only to highlight the matching tile and let a second click on
			// the SAME tile toggle preview off (an explicit exit path alongside closing the sidebar).
			previewVersionId: {
				type: Number,
				default: 0
			},
			// [version-diff] Timeline-owned "highlight changes" checkbox state. Owned by the caller
			// (document-page.js) so it survives the sidebar's open/close and version switches; this
			// component only renders it and emits `toggle-diff` on change.
			highlightChanges: {
				type: Boolean,
				default: false
			},
			messages: {
				type: Object,
				required: true
			},
			// [avatar profile] Optional function-prop from the caller (note.editor's document-page.js)
			// — invoked with a user id when an author avatar is clicked. Kept as a prop so this
			// extension stays free of note.editor's own link-opening utils.
			openUserProfile: {
				type: Function,
				default: null
			}
		},
		emits: ['close', 'preview', 'toggle-diff'],
		data() {
			return {
				// [P2.T4] Feed state — a flat, de-duplicated accumulation of keyset pages.
				feedEvents: [],
				feedInitialized: false,
				feedLoading: false,
				feedLoadingMore: false,
				feedNextCursor: null,
				filterOpen: false,
				// [types filter] Event types the current role may see — server-fed via listFeed's
				// `allowedTypes`, populated once on the first response. Drives the filter checkboxes.
				allowedTypes: [],
				// Per-type on/off map (type -> bool); all true after the first response.
				filterTypes: {},
				// [#10] Roving-tabindex cursor within the open filter popover's menu rows.
				activeFilterIndex: 0
			};
		},
		created() {
			// Non-reactive bookkeeping — a dedupe guard against double-fetch races (fast scroll,
			// filter toggled mid-request) and the outside-click handler for the filter popover.
			this.loadedEventIds = new Set();
			this.filterOutsideClickHandler = null;
			// [NEW-C] Pull subscription disposer, set up in mounted() regardless of `open` — pushes are
			// accumulated into the feed whether the sidebar is open or closed (see handleHistoryPushEvent),
			// so a closed-then-reopened sidebar never misses events recorded while it was closed.
			this.historyPullDispose = null;
			instanceCounter += 1;
			this.filterPopoverId = `note-version-timeline-filter-pop-${instanceCounter}`;
			this.filterTitleId = `note-version-timeline-filter-title-${instanceCounter}`;
		},
		mounted() {
			this.subscribeHistoryPull();
		},
		beforeUnmount() {
			this.detachFilterOutsideClick();
			this.unsubscribeHistoryPull();
		},
		watch: {
			open(nextOpen) {
				// SDD UI-requirements: exiting preview happens by closing the sidebar — the caller
				// (document-page.js) owns that now, since the preview itself lives in the main editor.
				if (!nextOpen) {
					this.closeFilterPopover();
					return;
				}
				if (!this.feedInitialized) {
					void this.reloadFeed();
				}

				// [NEW-C] Renew the watch tag each time the sidebar opens — extendWatch only
				// prolongs an existing subscription, it doesn't create it (that already happened
				// in mounted()), so this is a cheap keepalive, not a re-subscribe.
				this.extendHistoryPullWatch();
			},
			documentId() {
				// [reactivity fix] Always invalidate the feed on navigation — the sidebar is usually
				// CLOSED while switching documents, and watch.open() only reloads when
				// `!feedInitialized`, so without resetting it here the next open would show the
				// PREVIOUS document's feed. Reset unconditionally, then reload now if open (a closed
				// sidebar's cleared feedInitialized guarantees a reload on its next open).
				this.loadedEventIds.clear();
				this.feedEvents = [];
				this.feedNextCursor = null;
				this.feedInitialized = false;
				// Role-allowed types are per-document — drop them so the next fetch re-seeds the filter
				// for the new doc (else a reader opening a doc after an owned one keeps the owner's
				// checkboxes, e.g. a "moved"/"access_changed" row they can never actually see).
				this.allowedTypes = [];
				this.filterTypes = {};
				this.closeFilterPopover();
				if (this.open) {
					void this.reloadFeed();
				}

				// [NEW-C] The pull tag is per-document — re-subscribe for the new one.
				this.subscribeHistoryPull();
			}
		},
		computed: {
			Outline: () => ui_iconSet_api_vue.Outline,
			// Mirrors the `note-mobile` signal used elsewhere in note.editor (heading-block-node-view,
			// attachments/node-view, mention-dialog) — no dedicated prop needed.
			isMobile() {
				return typeof document !== 'undefined' && document.documentElement.classList.contains('note-mobile');
			},
			// One checkbox row per allowed event type, labelled from EVENT_LABEL_KEYS — built
			// dynamically from the server-fed `allowedTypes` (role visibility), not a fixed list.
			filterTypeItems() {
				return this.allowedTypes.map(type => ({
					type,
					label: this.messages[EVENT_LABEL_KEYS[type]] || type
				}));
			},
			selectedTypes() {
				return this.allowedTypes.filter(type => this.filterTypes[type] === true);
			},
			isFilterAllSelected() {
				return this.allowedTypes.length > 0 && this.allowedTypes.every(type => this.filterTypes[type] === true);
			},
			// True whenever the user narrowed below "all" — a proper subset OR nothing selected.
			// Both keep the "filtered" empty text (the plain empty text is for an unfiltered feed).
			isFilterNarrowed() {
				return this.allowedTypes.length > 0 && this.selectedTypes.length < this.allowedTypes.length;
			},
			// [#10] Menu rows in DOM order ("Select all" + one per type) — drives roving-tabindex
			// indices and Enter/Space activation in onFilterMenuKeydown().
			filterMenuItems() {
				return [{
					action: () => this.toggleSelectAll()
				}, ...this.filterTypeItems.map(item => ({
					action: () => this.toggleType(item.type)
				}))];
			},
			// [client-filter] The type filter is applied here, over the already-loaded (unfiltered)
			// feed — no server round-trip. Before allowedTypes is seeded (filterTypes still empty) the
			// raw feed passes through unfiltered, so the very first paint isn't blanked.
			visibleEvents() {
				if (this.allowedTypes.length === 0) {
					return this.feedEvents;
				}
				return this.feedEvents.filter(event => this.filterTypes[String(event?.type || '')] === true);
			},
			feedTiles() {
				return this.visibleEvents.map(event => this.buildTile(event));
			},
			groups() {
				const result = [];
				let current = null;
				this.feedTiles.forEach(tile => {
					if (!current || current.key !== tile.dayKey) {
						current = {
							key: tile.dayKey,
							dateLabel: tile.dayLabel,
							items: []
						};
						result.push(current);
					}
					current.items.push(tile);
				});
				return result;
			}
		},
		methods: {
			toTimestampSeconds(value) {
				if (typeof value !== 'string' || value === '') {
					return null;
				}
				const ms = Date.parse(value);
				return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
			},
			buildTile(event) {
				const type = String(event?.type || '');
				const ts = this.toTimestampSeconds(event?.createdAt);
				const actor = main_core.Type.isPlainObject(event?.actor) ? event.actor : {};
				const rawAuthors = Array.isArray(event?.authors) && event.authors.length > 0 ? event.authors : [actor];
				const versionId = Number(event?.versionId);
				const authors = rawAuthors.map(author => ({
					id: Number(author?.id) || 0,
					name: String(author?.name || ''),
					avatar: author?.avatar || null,
					// Preserve the server identity color so the avatar matches the caret / views / chip;
					// dropping it here made NoteAvatarStack fall back to the palette (wrong color).
					color: author?.color || null
				}));
				return {
					key: String(event?.id ?? ''),
					type,
					title: this.messages[EVENT_LABEL_KEYS[type]] || this.messages.historyEventContentChanged,
					// Time-only, portal 12h/24h format — the calendar day is shown by the sticky group
					// date header above, so the tile itself doesn't repeat the date (see format-date.js).
					subtitle: ts === null ? '' : formatTime(ts),
					// dayKey is a non-displayed grouping key (stable 'Ymd'); dayLabel is the visible sticky
					// header and uses the portal's LONG_DATE_FORMAT so date ordering follows the culture
					// (culture-dependent, e.g. "July 13, 2026" vs "13 July 2026") — never hardcode 'j F Y'.
					dayKey: ts === null ? '' : main_date.DateTimeFormat.format('Ymd', ts),
					dayLabel: ts === null ? '' : main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('LONG_DATE_FORMAT'), ts),
					// Raw ISO timestamp (not the localized `subtitle`) — handed over as-is in the
					// `preview` payload so the caller's own chip (ActivityLineComponent) can format it
					// the same way it formats `lastChange.time` (see note-editor.js #12).
					createdAt: typeof event?.createdAt === 'string' ? event.createdAt : '',
					authors,
					// Line-1 caption: first author's name, plus an "and N more" suffix when there are more.
					authorsLabel: this.buildAuthorsLabel(authors),
					// Only a content_changed event with a still-existing version is restorable
					// (SDD P2.T3): title_changed/created/service markers stay static tiles — there's
					// no restore action wired for them yet.
					restorable: type === 'content_changed' && event?.versionAvailable === true,
					versionId: Number.isInteger(versionId) && versionId > 0 ? versionId : null
				};
			},
			buildAuthorsLabel(authors) {
				if (authors.length === 0) {
					return '';
				}
				const firstName = String(authors[0]?.name || '');
				if (authors.length === 1) {
					return firstName;
				}
				const more = String(this.messages.historyAndMore || '').replace('#N#', String(authors.length - 1));
				return more === '' ? firstName : `${firstName} ${more}`;
			},
			async fetchFeed(cursor) {
				const loadingMore = cursor !== null;
				if (loadingMore) {
					this.feedLoadingMore = true;
				} else {
					this.feedLoading = true;
				}
				try {
					const response = await HistoryApi.listFeed({
						documentId: this.documentId,
						// Always fetch the full role-allowed stream; the type filter is client-side.
						types: [],
						limit: FEED_PAGE_SIZE,
						afterCursor: cursor
					});
					const allowed = Array.isArray(response?.data?.allowedTypes) ? response.data.allowedTypes : [];
					if (allowed.length > 0 && this.allowedTypes.length === 0) {
						// First response only: seed the filter with every allowed type on.
						this.allowedTypes = allowed;
						const nextFilter = {};
						allowed.forEach(type => {
							nextFilter[type] = true;
						});
						this.filterTypes = nextFilter;
					}
					const events = Array.isArray(response?.data?.events) ? response.data.events : [];
					const freshEvents = events.filter(event => {
						const id = Number(event?.id);
						if (!Number.isInteger(id) || this.loadedEventIds.has(id)) {
							return false;
						}
						this.loadedEventIds.add(id);
						return true;
					});
					this.feedEvents = [...this.feedEvents, ...freshEvents];

					// nextCursor is an opaque { createdAt, id } — stored and echoed back verbatim.
					const nextCursor = response?.data?.nextCursor;
					this.feedNextCursor = main_core.Type.isPlainObject(nextCursor) ? nextCursor : null;
					this.feedInitialized = true;
				} catch (error) {
					showErrorToast(extractErrorMessage(error, this.messages.historyLoadError));
				} finally {
					if (loadingMore) {
						this.feedLoadingMore = false;
					} else {
						this.feedLoading = false;
					}
				}
			},
			async reloadFeed() {
				this.loadedEventIds.clear();
				this.feedEvents = [];
				this.feedNextCursor = null;
				this.feedInitialized = false;
				await this.fetchFeed(null);
				await this.ensureFilled();
			},
			async loadMoreFeed() {
				if (!this.feedInitialized || this.feedLoading || this.feedLoadingMore || !this.feedNextCursor) {
					return;
				}
				await this.fetchFeed(this.feedNextCursor);
			},
			// [client-filter] After a filter change (or the initial load), the client-filtered list can
			// be too short to scroll — and if it can't scroll, handleBodyScroll never fires to page the
			// rest in. Pull more raw pages until the body is scrollable again (then normal scroll
			// pagination resumes) or the cursor runs out. Bounded by AUTOFILL_MAX_PAGES so a rare type
			// under a long history can't loop forever. A zero selection can never match — skip entirely.
			async ensureFilled() {
				if (this.selectedTypes.length === 0) {
					return;
				}
				let pages = 0;
				await this.$nextTick();
				while (pages < AUTOFILL_MAX_PAGES && this.feedNextCursor && !this.feedLoading && !this.feedLoadingMore && this.bodyNeedsMore()) {
					pages += 1;
					await this.loadMoreFeed();
					await this.$nextTick();
				}
			},
			// True when the feed body isn't (meaningfully) scrollable — so scroll pagination can't kick in.
			bodyNeedsMore() {
				const el = this.$refs.feedBody;
				if (!(el instanceof HTMLElement)) {
					return false;
				}
				return el.scrollHeight <= el.clientHeight + SCROLL_THRESHOLD_PX;
			},
			// [SDD P2.T4] Seamless infinite scroll over the keyset cursor — no "show more" button.
			handleBodyScroll(event) {
				const el = event.currentTarget;
				if (!(el instanceof HTMLElement)) {
					return;
				}
				if (el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_THRESHOLD_PX) {
					void this.loadMoreFeed();
				}
			},
			toggleFilterPopover() {
				if (this.filterOpen) {
					this.closeFilterPopover();
					return;
				}
				this.filterOpen = true;
				this.activeFilterIndex = 0;
				this.attachFilterOutsideClick();

				// [#10] Roving focus starts on the first row ("Select all"). [#5] Position
				// centered under the funnel trigger.
				this.$nextTick(() => {
					note_ui_popoverPosition.positionPopoverUnderTrigger(this.$refs.filterButton, this.$refs.filterPopover);
					this.focusFilterItem(0);
				});
			},
			closeFilterPopover(refocusTrigger = false) {
				if (!this.filterOpen) {
					return;
				}
				this.filterOpen = false;
				this.detachFilterOutsideClick();
				if (refocusTrigger) {
					this.$nextTick(() => this.$refs.filterButton?.focus?.());
				}
			},
			handleFilterPopoverFocusOut(event) {
				const popover = this.$refs.filterPopover;
				const button = this.$refs.filterButton;
				const nextFocus = event.relatedTarget;

				// [iOS] Close via focusout ONLY when focus moved to a real element (keyboard Tab). A
				// null/non-element relatedTarget means the blur came from a tap — iOS Safari doesn't focus
				// <button>s on tap, so closing here would race the trigger's own click and reopen the
				// popover ("second tap doesn't close"). Tap-outside and trigger re-tap are owned by the
				// outside-click listener and the toggle handler respectively.
				if (!(nextFocus instanceof HTMLElement)) {
					return;
				}

				// Focus moving onto the trigger button — let the button's own toggle handler decide.
				if (button instanceof HTMLElement && button.contains(nextFocus)) {
					return;
				}
				if (popover instanceof HTMLElement && !popover.contains(nextFocus)) {
					// Tab moved focus outside the popover — close without stealing focus back.
					this.closeFilterPopover();
				}
			},
			// [#10] Menu rows in DOM order — mirrors note.ui.avatar-stack's menuItemElements().
			filterItemElements() {
				const popover = this.$refs.filterPopover;
				return popover instanceof HTMLElement ? [...popover.querySelectorAll('.note-version-timeline__filter-option')] : [];
			},
			focusFilterItem(index) {
				const items = this.filterItemElements();
				if (items.length === 0) {
					return;
				}
				const clamped = Math.max(0, Math.min(items.length - 1, index));
				this.activeFilterIndex = clamped;
				items[clamped]?.focus();
			},
			// [#10] Roving-tabindex menu keydown — same key set as note.ui.avatar-stack's
			// onParticipantsMenuKeydown. Unlike that menu (and the subscription-bell popover), Tab
			// here can't just fall through to the browser default: the popover renders AFTER the
			// close button in the DOM, so a plain Tab would skip over it entirely. Explicitly move
			// focus to the close button instead — "next element after the funnel trigger".
			onFilterMenuKeydown(event) {
				const lastIndex = this.filterMenuItems.length - 1;
				switch (event.key) {
					case 'ArrowDown':
						event.preventDefault();
						this.focusFilterItem(this.activeFilterIndex + 1);
						break;
					case 'ArrowUp':
						event.preventDefault();
						this.focusFilterItem(this.activeFilterIndex - 1);
						break;
					case 'Home':
						event.preventDefault();
						this.focusFilterItem(0);
						break;
					case 'End':
						event.preventDefault();
						this.focusFilterItem(lastIndex);
						break;
					case 'Enter':
					case ' ':
						event.preventDefault();
						this.filterMenuItems[this.activeFilterIndex]?.action();
						break;
					case 'Escape':
						event.preventDefault();
						this.closeFilterPopover(true);
						break;
					case 'Tab':
						event.preventDefault();
						this.filterOpen = false;
						this.detachFilterOutsideClick();
						this.$nextTick(() => {
							if (event.shiftKey) {
								this.$refs.filterButton?.focus?.();
							} else {
								this.$refs.closeButton?.focus?.();
							}
						});
						break;
				}
			},
			toggleType(type) {
				// [client-filter] Pure client-side narrow — no reload; just top up if it left the list
				// too short to scroll.
				this.filterTypes = {
					...this.filterTypes,
					[type]: !this.filterTypes[type]
				};
				void this.ensureFilled();
			},
			toggleSelectAll() {
				const next = !this.isFilterAllSelected;
				const nextFilter = {
					...this.filterTypes
				};
				this.allowedTypes.forEach(type => {
					nextFilter[type] = next;
				});
				this.filterTypes = nextFilter;
				void this.ensureFilled();
			},
			attachFilterOutsideClick() {
				if (this.filterOutsideClickHandler) {
					return;
				}
				this.filterOutsideClickHandler = event => {
					const popover = this.$refs.filterPopover;
					const button = this.$refs.filterButton;
					const target = event.target;
					if (popover instanceof HTMLElement && target instanceof Node && popover.contains(target)) {
						return;
					}
					if (button instanceof HTMLElement && target instanceof Node && button.contains(target)) {
						return;
					}
					this.closeFilterPopover();
				};

				// Defer so the opening click itself doesn't immediately close the popover.
				setTimeout(() => {
					document.addEventListener('click', this.filterOutsideClickHandler, true);
				}, 0);
			},
			detachFilterOutsideClick() {
				if (this.filterOutsideClickHandler) {
					document.removeEventListener('click', this.filterOutsideClickHandler, true);
					this.filterOutsideClickHandler = null;
				}
			},
			// [NEW-C] Client half of the NOTE_DOC_HISTORY_{documentId} contract (server \CPullWatch::Add
			// already happened at render). Delegates the subscribe/extend/route plumbing to the shared
			// history-pull helper — the same helper the activity-line chip uses — and only owns how a
			// pushed event lands in this feed (handleHistoryPushEvent).
			subscribeHistoryPull() {
				this.unsubscribeHistoryPull();
				this.historyPullDispose = subscribeDocumentHistory(this.documentId, event => this.handleHistoryPushEvent(event));
			},
			unsubscribeHistoryPull() {
				if (typeof this.historyPullDispose === 'function') {
					this.historyPullDispose();
				}
				this.historyPullDispose = null;
			},
			extendHistoryPullWatch() {
				extendDocumentHistoryWatch(this.documentId);
			},
			// [NEW-C] Inserts a freshly pushed event as a new tile at the head of the feed, whether the
			// sidebar is open or closed — a closed sidebar keeps accumulating so reopening shows events
			// recorded meanwhile (watch.open() won't reload an already-initialized feed). `event` has the
			// same shape as a listFeed row (see FeedProvider::enrichOne()), so buildTile() is reused
			// unchanged. Dedup by event id against the same loadedEventIds guard fetchFeed() uses — a push
			// racing an in-flight page fetch (or a duplicate delivery) never double-renders the same event.
			handleHistoryPushEvent(event) {
				if (!main_core.Type.isPlainObject(event)) {
					return;
				}
				const id = Number(event.id);
				if (!Number.isInteger(id) || id <= 0 || this.loadedEventIds.has(id)) {
					return;
				}

				// Match the pushed event against the CURRENT client-side type filter (the push is
				// broadcast unfiltered to every tag watcher). Once the filter is initialized, only
				// insert a tile for a type the user currently has on.
				const type = String(event.type || '');
				if (this.allowedTypes.length > 0 && this.filterTypes[type] !== true) {
					return;
				}
				this.loadedEventIds.add(id);
				this.feedEvents = [event, ...this.feedEvents];
			},
			handleClose() {
				this.$emit('close');
			},
			// [version-diff] Checkbox change — the caller owns the state, so just forward the intent.
			handleToggleDiff(event) {
				const target = event?.target;
				this.$emit('toggle-diff', target instanceof HTMLInputElement ? target.checked : !this.highlightChanges);
			},
			// Author-avatar click inside a tile — the caller opens the user profile (new tab / native
			// card). NoteAvatarStack already stops the DOM click from bubbling to the tile's own
			// preview handler when avatarsClickable is set.
			handleAvatarClick(participant) {
				const id = Number(participant?.id);
				if (Number.isInteger(id) && id > 0 && typeof this.openUserProfile === 'function') {
					this.openUserProfile(id);
				}
			},
			isActiveTile(item) {
				return this.previewVersionId > 0 && Number(item?.versionId) === this.previewVersionId;
			},
			tilePreviewAriaLabel(item) {
				return this.messages.historyTilePreviewAria.replace('#TITLE#', item?.title || '');
			},
			// [#11 rework] No local fetch/render anymore — just tell the caller which version was
			// clicked. A second click on the already-active tile is the explicit "exit preview" path
			// (mirrors closing the sidebar, which also exits — see document-page.js).
			handleTileClick(item) {
				if (!item?.restorable || !Number.isInteger(Number(item?.versionId)) || Number(item.versionId) <= 0) {
					return;
				}
				this.$emit('preview', {
					versionId: Number(item.versionId),
					item
				});
			},
			handleTileSpaceKey(event, item) {
				// preventDefault (scroll) only for actionable tiles; static tiles must let Space scroll.
				if (!item.restorable) {
					return;
				}
				event.preventDefault();
				this.handleTileClick(item);
			}
		},
		// language=Vue
		template: `
		<aside class="note-version-timeline" :class="{ '--open': open }">
			<div class="note-version-timeline__inner">
				<div class="note-version-timeline__head">
					<h3 class="note-version-timeline__title">{{ messages.historyTitle }}</h3>
					<button
						ref="filterButton"
						type="button"
						class="note-version-timeline__filter"
						:class="{ '--active': filterOpen }"
						:title="messages.historyFilterButton"
						:aria-label="messages.historyFilterButton"
						:aria-expanded="filterOpen ? 'true' : 'false'"
						:aria-controls="filterPopoverId"
						@click="toggleFilterPopover"
					>
						<BIcon :name="Outline.FILTER_FUNNEL" class="note-version-timeline__icon" aria-hidden="true" />
					</button>
					<button
						ref="closeButton"
						type="button"
						class="note-version-timeline__close"
						:title="messages.historyClose"
						:aria-label="messages.historyClose"
						@click="handleClose"
					>
						<BIcon :name="Outline.CROSS_L" class="note-version-timeline__icon" aria-hidden="true" />
					</button>
					<div
						v-if="filterOpen"
						:id="filterPopoverId"
						ref="filterPopover"
						class="note-version-timeline__filter-pop"
						role="menu"
						:aria-labelledby="filterTitleId"
						@keydown="onFilterMenuKeydown"
						@focusout="handleFilterPopoverFocusOut"
					>
						<div :id="filterTitleId" class="note-version-timeline__filter-title">{{ messages.historyFilterTitle }}</div>
						<label
							class="note-version-timeline__filter-option"
							role="menuitemcheckbox"
							:aria-checked="isFilterAllSelected ? 'true' : 'false'"
							:tabindex="activeFilterIndex === 0 ? 0 : -1"
						>
							<input type="checkbox" tabindex="-1" :checked="isFilterAllSelected" @change="toggleSelectAll" />
							<span>{{ messages.historyFilterSelectAll }}</span>
						</label>
						<div class="note-version-timeline__filter-sep"></div>
						<label
							v-for="(typeItem, index) in filterTypeItems"
							:key="typeItem.type"
							class="note-version-timeline__filter-option"
							role="menuitemcheckbox"
							:aria-checked="filterTypes[typeItem.type] === true ? 'true' : 'false'"
							:tabindex="activeFilterIndex === index + 1 ? 0 : -1"
						>
							<input
								type="checkbox"
								tabindex="-1"
								:checked="filterTypes[typeItem.type] === true"
								@change="toggleType(typeItem.type)"
							/>
							<span>{{ typeItem.label }}</span>
						</label>
					</div>
				</div>
				<label class="note-version-timeline__diff-toggle">
					<span class="ui-checkbox --size-md" :class="{ '--checked': highlightChanges }">
						<input
							type="checkbox"
							class="ui-checkbox__input"
							:checked="highlightChanges"
							@change="handleToggleDiff"
						/>
						<span class="ui-checkbox__box" aria-hidden="true">
							<span v-if="highlightChanges" class="ui-checkbox__icon">
								<span class="ui-icon-set --check-m"></span>
							</span>
						</span>
					</span>
					<span class="note-version-timeline__diff-label">{{ messages.historyHighlightChanges }}</span>
				</label>
				<div ref="feedBody" class="note-version-timeline__body" @scroll="handleBodyScroll">
					<div v-if="feedLoading && feedEvents.length === 0" class="note-version-timeline__loading-more">
						<Loader :label="messages.loading" />
					</div>
					<div v-else-if="groups.length === 0 && feedLoadingMore" class="note-version-timeline__loading-more">
						<Loader :label="messages.loading" />
					</div>
					<div v-else-if="groups.length === 0" class="note-version-timeline__empty">
						{{ isFilterNarrowed ? messages.historyEmptyFiltered : messages.historyEmpty }}
					</div>
					<div v-else class="note-version-timeline__list">
						<div v-for="group in groups" :key="group.key" class="note-version-timeline__group">
							<div class="note-version-timeline__day">{{ group.dateLabel }}</div>
							<div class="note-version-timeline__track">
								<div
									v-for="item in group.items"
									:key="item.key"
									class="note-version-timeline__item"
									:class="{ '--restorable': item.restorable }"
								>
									<span class="note-version-timeline__node"></span>
									<div
										class="note-version-timeline__tile"
										:class="{ '--active': isActiveTile(item) }"
										:tabindex="item.restorable ? 0 : -1"
										:role="item.restorable ? 'button' : null"
										:aria-label="item.restorable ? tilePreviewAriaLabel(item) : null"
										:aria-pressed="item.restorable ? (isActiveTile(item) ? 'true' : 'false') : null"
										@click="handleTileClick(item)"
										@keydown.enter="handleTileClick(item)"
										@keydown.space="handleTileSpaceKey($event, item)"
									>
										<div class="note-version-timeline__tile-main">
											<div class="note-version-timeline__tile-line1">
												<span class="note-version-timeline__tile-type">{{ item.title }}</span>
												<span class="note-version-timeline__tile-date">{{ item.subtitle }}</span>
											</div>
											<div class="note-version-timeline__tile-line2">
												<NoteAvatarStack
													v-if="item.authors && item.authors.length"
													class="note-version-timeline__tile-avatars"
													:participants="item.authors"
													:avatars-clickable="true"
													:menu-aria-label="messages.historyCoAuthorsTitle"
													@avatar-click="handleAvatarClick"
												/>
												<span v-if="item.authorsLabel" class="note-version-timeline__tile-author">{{ item.authorsLabel }}</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div v-if="feedLoadingMore" class="note-version-timeline__loading-more">
							<Loader :label="messages.loading" />
						</div>
					</div>
				</div>
			</div>
		</aside>
	`
	};

	// Owned by this extension: activity-line / views-widget / version-timeline read their strings
	// from this single dictionary (see their `messages` prop) — callers (note.editor) only need
	// to build it once and hand it down, they no longer own these lang keys themselves.
	function createHistoryMessages() {
		return {
			loading: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_LOADING'),
			historyCoAuthorsTitle: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_CO_AUTHORS_TITLE'),
			activityOpenHistory: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_ACTIVITY_OPEN_HISTORY'),
			activityChanged: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_ACTIVITY_CHANGED'),
			activityCreated: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_ACTIVITY_CREATED'),
			activityViews: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_ACTIVITY_VIEWS'),
			activitySubscribe: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_ACTIVITY_SUBSCRIBE'),
			activitySubscribedSelf: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_ACTIVITY_SUBSCRIBED_SELF'),
			activitySubscribedSubtree: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_ACTIVITY_SUBSCRIBED_SUBTREE'),
			activitySubscribedInheritedSubtree: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_ACTIVITY_SUBSCRIBED_INHERITED_SUBTREE'),
			activitySubscribedInheritedCollection: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_ACTIVITY_SUBSCRIBED_INHERITED_COLLECTION'),
			activityMuted: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_ACTIVITY_MUTED'),
			activityFavoriteOn: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_ACTIVITY_FAVORITE_ON'),
			activityFavoriteOff: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_ACTIVITY_FAVORITE_OFF'),
			activityFavoriteState: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_ACTIVITY_FAVORITE_STATE'),
			favoriteAddError: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_FAVORITE_ADD_ERROR'),
			favoriteRemoveError: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_FAVORITE_REMOVE_ERROR'),
			subscriptionTitle: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_SUBSCRIPTION_TITLE'),
			subscriptionScopeSelf: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_SUBSCRIPTION_SCOPE_SELF'),
			subscriptionScopeSelfDesc: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_SUBSCRIPTION_SCOPE_SELF_DESC'),
			subscriptionScopeSubtree: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_SUBSCRIPTION_SCOPE_SUBTREE'),
			subscriptionScopeSubtreeDesc: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_SUBSCRIPTION_SCOPE_SUBTREE_DESC'),
			subscriptionOff: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_SUBSCRIPTION_OFF'),
			subscriptionInheritedSubtree: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_SUBSCRIPTION_INHERITED_SUBTREE'),
			subscriptionInheritedCollection: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_SUBSCRIPTION_INHERITED_COLLECTION'),
			subscriptionInheritedSubtreeGeneric: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_SUBSCRIPTION_INHERITED_SUBTREE_GENERIC'),
			subscriptionInheritedCollectionGeneric: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_SUBSCRIPTION_INHERITED_COLLECTION_GENERIC'),
			subscriptionMute: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_SUBSCRIPTION_MUTE'),
			subscriptionMutedInfo: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_SUBSCRIPTION_MUTED_INFO'),
			subscriptionResume: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_SUBSCRIPTION_RESUME'),
			subscriptionSetError: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_SUBSCRIPTION_SET_ERROR'),
			subscriptionRemoveError: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_SUBSCRIPTION_REMOVE_ERROR'),
			activityViewsEmpty: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_ACTIVITY_VIEWS_EMPTY'),
			historyTitle: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_TITLE'),
			historyClose: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_CLOSE'),
			historyEmpty: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_EMPTY'),
			historyHighlightChanges: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_HIGHLIGHT_CHANGES'),
			historyLoadError: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_LOAD_ERROR'),
			historyEmptyFiltered: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_EMPTY_FILTERED'),
			historyAndMore: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_AND_MORE'),
			historyTilePreviewAria: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_TILE_PREVIEW_ARIA'),
			historyFilterButton: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_FILTER_BUTTON'),
			historyFilterTitle: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_FILTER_TITLE'),
			historyFilterSelectAll: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_FILTER_SELECT_ALL'),
			historyEventCreated: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_EVENT_CREATED'),
			historyEventContentChanged: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_EVENT_CONTENT_CHANGED'),
			historyEventTitleChanged: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_EVENT_TITLE_CHANGED'),
			historyEventArchived: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_EVENT_ARCHIVED'),
			historyEventArchiveRestored: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_EVENT_ARCHIVE_RESTORED'),
			historyEventTrashed: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_EVENT_TRASHED'),
			historyEventTrashRestored: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_EVENT_TRASH_RESTORED'),
			historyEventMoved: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_EVENT_MOVED'),
			historyEventAccessChanged: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_EVENT_ACCESS_CHANGED'),
			historyPreviewLoadError: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_PREVIEW_LOAD_ERROR'),
			historyRestoreError: main_core.Loc.getMessage('NOTE_UI_DOCUMENT_HISTORY_RESTORE_ERROR')
		};
	}

	exports.ActivityLineComponent = ActivityLineComponent;
	exports.FavoriteApi = FavoriteApi;
	exports.FavoriteStarComponent = FavoriteStarComponent;
	exports.HistoryApi = HistoryApi;
	exports.RESTORE_DIRTY_WINDOW_ERROR_CODE = RESTORE_DIRTY_WINDOW_ERROR_CODE;
	exports.SUBSCRIPTION_MODE_ALL = SUBSCRIPTION_MODE_ALL;
	exports.SUBSCRIPTION_MODE_MUTED = SUBSCRIPTION_MODE_MUTED;
	exports.SUBSCRIPTION_MODE_SELF = SUBSCRIPTION_MODE_SELF$1;
	exports.SUBSCRIPTION_MODE_SUBTREE = SUBSCRIPTION_MODE_SUBTREE;
	exports.SUBSCRIPTION_SCOPE_COLLECTION = SUBSCRIPTION_SCOPE_COLLECTION;
	exports.SUBSCRIPTION_SCOPE_DOCUMENT = SUBSCRIPTION_SCOPE_DOCUMENT$1;
	exports.SubscriptionApi = SubscriptionApi;
	exports.SubscriptionBellComponent = SubscriptionBellComponent;
	exports.SubscriptionBellView = SubscriptionBellView;
	exports.VersionTimelineComponent = VersionTimelineComponent;
	exports.ViewsWidgetComponent = ViewsWidgetComponent;
	exports.createHistoryMessages = createHistoryMessages;
	exports.isRestoreDirtyWindowError = isRestoreDirtyWindowError;

})(this.BX.Note.Ui = this.BX.Note.Ui || {}, BX.UI.System.Checkbox, window, BX, BX.Note.Ui, BX.UI.IconSet, BX.Main, BX.Note.Ui, BX.Note.Ui, BX.Event, window, BX, BX.UI.Notification, BX.Note.Ui);
//# sourceMappingURL=document-history.bundle.js.map
