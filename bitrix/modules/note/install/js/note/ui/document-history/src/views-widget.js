import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { Type } from 'main.core';
import { NoteAvatarStack, avatarFallbackColor } from 'note.ui.avatar-stack';
import { HistoryApi } from './history-api';
import { formatActivityTimestamp } from './format-date';
import { positionPopoverUnderTrigger, keepPopoverAnchored } from 'note.ui.popover-position';

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
let instanceCounter = 0;

// Must match note.editor's SYNTHETIC_CLIENT_ID_OFFSET (src/const.js, used by
// awareness-manager.js to encode a remote user's awareness clientId). The two extensions
// don't import each other, so this half of the shared encoding contract is duplicated here
// as a literal — it isn't expected to ever change (it only has to avoid colliding with real
// Yjs clientIDs).
const SYNTHETIC_CLIENT_ID_OFFSET = 0x40000000;

function normalizeViewer(viewer: Object): Object
{
	return {
		userId: Number(viewer.userId) || 0,
		name: String(viewer.name || ''),
		avatar: viewer.avatar || null,
		// Server identity color (matches the editor caret / avatar stack); null falls back to the
		// per-user palette in viewerRows.
		color: (typeof viewer.color === 'string' && viewer.color !== '') ? viewer.color : null,
		viewedAt: new Date(viewer.viewedAt),
	};
}

export const ViewsWidgetComponent = {
	name: 'NoteDocumentHistoryViewsWidget',
	components: {
		BIcon,
		NoteAvatarStack,
	},
	props: {
		documentId: {
			type: Number,
			default: 0,
		},
		// The PushPullYjsProvider instance (see note.editor's push-pull-provider.js) — read-only
		// reuse of its public `awareness` field for the live overlay; nothing is written back to it.
		provider: {
			type: Object,
			default: null,
		},
		// [#6] Base snapshot bundled into the document bootstrap payload (see
		// DocumentViewsSnapshotResolver / create-document-feature.js's applyLoadedDocument).
		// When present, mounted() adopts it directly instead of issuing its own getViews call.
		// Shape: { uniqueCount: number, viewers: Array<{userId, name, avatar, viewedAt}> }.
		initialViews: {
			type: Object,
			default: null,
		},
		// [own-view bug fix] `{ id, name, avatar, ... }` (note-editor.js's normalizedCurrentUser) —
		// used only by ensureSelfViewer() to add the current user to the list on mount when the
		// server-side snapshot/own fetch hasn't recorded their view yet (see class doc above).
		currentUser: {
			type: Object,
			default: () => ({}),
		},
		messages: {
			type: Object,
			required: true,
		},
		// [avatar profile] Same optional function-prop the activity line hands to the chip avatars
		// (note.editor's openUserProfile → openLinkNative): opens the user profile natively on mobile
		// and in a new tab on desktop. When absent, viewer rows render as plain, non-clickable text.
		openUserProfile: {
			type: Function,
			default: null,
		},
	},
	data()
	{
		return {
			viewers: [],
			uniqueCount: null,
			isLoading: false,
			isLoadingMore: false,
			isOpen: false,
		};
	},
	computed: {
		Outline: (): typeof Outline => Outline,
		hasCount(): boolean
		{
			return Number.isInteger(this.uniqueCount);
		},
		isViewerClickable(): boolean
		{
			return typeof this.openUserProfile === 'function';
		},
		// Avatars are drawn by note.ui.avatar-stack (one participant per row) so a viewer looks
		// exactly like the same person in the activity chip or the history tiles. The single-element
		// arrays are built here rather than in the template: a fresh array on every re-render would
		// retrigger the stack's participants watcher for every row in the list.
		viewerRows(): Array
		{
			return this.viewers.map((viewer) => ({
				viewer,
				participants: [{
					id: viewer.userId,
					name: this.viewerDisplayName(viewer),
					avatar: viewer.avatar,
					color: viewer.color || avatarFallbackColor(viewer.userId),
				}],
			}));
		},
	},
	created()
	{
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

		instanceCounter += 1;
		this.viewsPopoverId = `note-views-widget-popover-${instanceCounter}`;
		this.viewsTitleId = `note-views-widget-title-${instanceCounter}`;
	},
	mounted()
	{
		void this.loadInitialData();
		this.attachAwareness();
	},
	beforeUnmount()
	{
		this.detachAwareness();
		this.detachOutsideClick();
		this.detachPopoverAnchor();

		if (this.awarenessAttachTimer !== null)
		{
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
		documentId(): void
		{
			this.resetLocalState();
			void this.loadInitialData();
		},
		// The caller may reactively replace the prop (e.g. a fresher bootstrap snapshot arriving
		// for the same document) — re-adopt it rather than keeping the one captured at mount.
		initialViews(nextValue: mixed): void
		{
			if (Type.isPlainObject(nextValue) && Array.isArray(nextValue.viewers))
			{
				this.applyViewsSnapshot(nextValue);
				this.ensureSelfViewer();
			}
		},
	},
	methods: {
		resetLocalState(): void
		{
			this.viewers = [];
			this.uniqueCount = null;
			this.isOpen = false;
			this.isLoadingMore = false;
			this.viewsNextCursor = null;
			this.cursorInitialized = false;
			this.loadedViewerIds = new Set();
		},
		applyViewsSnapshot(snapshot: Object): void
		{
			const viewers = Array.isArray(snapshot?.viewers) ? snapshot.viewers : [];
			this.viewers = viewers.map(normalizeViewer);
			this.uniqueCount = Number.isInteger(snapshot?.uniqueCount) ? snapshot.uniqueCount : this.viewers.length;
			this.loadedViewerIds = new Set(this.viewers.map((viewer) => viewer.userId));
		},
		// [#6] Prefers the bootstrap snapshot handed down via `initialViews` — only falls back to
		// this widget's own getViews request when the caller didn't supply one. Either branch is
		// followed by ensureSelfViewer() (own-view bug fix — see class doc above).
		async loadInitialData(): Promise<void>
		{
			if (Type.isPlainObject(this.initialViews) && Array.isArray(this.initialViews.viewers))
			{
				this.applyViewsSnapshot(this.initialViews);
			}
			else
			{
				await this.loadSnapshot();
			}

			this.ensureSelfViewer();
		},
		// [own-view bug fix] Adds the current user to the viewers list with "now" if a snapshot
		// (server or own fetch) doesn't already carry them — see class doc above for why the
		// snapshot can lag behind the user's own join. Idempotent: a later, fresher snapshot that
		// already includes self (e.g. after reload) is left untouched, no duplicate row.
		ensureSelfViewer(): void
		{
			const selfId = Number(this.currentUser?.id) || 0;
			if (!(selfId > 0) || this.viewers.some((viewer) => viewer.userId === selfId))
			{
				return;
			}

			const name = String(this.currentUser?.name || '');
			const avatar = Type.isStringFilled(this.currentUser?.avatar) ? this.currentUser.avatar : null;
			const color = Type.isStringFilled(this.currentUser?.color) ? this.currentUser.color : null;
			this.viewers.unshift({ userId: selfId, name, avatar, color, viewedAt: new Date() });
			this.loadedViewerIds.add(selfId);
			this.uniqueCount = (Number.isInteger(this.uniqueCount) ? this.uniqueCount : this.viewers.length - 1) + 1;
		},
		async loadSnapshot(): Promise<void>
		{
			const documentId = Number(this.documentId);
			if (!(documentId > 0))
			{
				return;
			}

			this.isLoading = true;
			try
			{
				const response = await HistoryApi.getViews({ documentId, limit: VIEWS_PAGE_SIZE });
				const data = response?.data ?? {};
				this.applyViewsSnapshot(data);
				// Own-fetch path already carries the keyset cursor — no separate fetch needed on open.
				this.viewsNextCursor = Type.isPlainObject(data.nextCursor) ? data.nextCursor : null;
				this.cursorInitialized = true;
			}
			catch
			{
				// Leave the eye control without a count rather than showing a misleading 0.
			}
			finally
			{
				this.isLoading = false;
			}
		},
		// [pagination] The bootstrap prop path (initialViews) drops the server cursor, so the first
		// popover open issues one getViews to establish it — that page re-covers the already-shown
		// rows, so it's merged (live/self rows the server doesn't yet know are kept on top). The
		// loadSnapshot path already has a cursor and skips this. Failure leaves cursorInitialized
		// false so a later open retries; the base list stays visible meanwhile.
		async ensureFirstPageLoaded(): Promise<void>
		{
			if (this.cursorInitialized || this.isLoadingMore)
			{
				return;
			}

			const documentId = Number(this.documentId);
			if (!(documentId > 0))
			{
				this.cursorInitialized = true;

				return;
			}

			// Everyone already fits in the base snapshot (uniqueCount <= shown rows) — there's nothing
			// to page, so skip the cursor-establishing fetch entirely. Without this the first open
			// always flashed a redundant "Loading" state even for a fully-loaded short list.
			const shown = this.viewers.length;
			const total = Number.isInteger(this.uniqueCount) ? this.uniqueCount : shown;
			if (total <= shown)
			{
				this.cursorInitialized = true;

				return;
			}

			this.isLoadingMore = true;
			try
			{
				const response = await HistoryApi.getViews({ documentId, limit: VIEWS_PAGE_SIZE });
				const data = response?.data ?? {};
				this.mergeFirstPage(data);
				this.viewsNextCursor = Type.isPlainObject(data.nextCursor) ? data.nextCursor : null;
				this.cursorInitialized = true;
			}
			catch
			{
				// Keep showing base data; a later open retries.
			}
			finally
			{
				this.isLoadingMore = false;
			}
		},
		// Adopts the server's first page as the authoritative base (order + avatars), keeping any
		// current rows the page doesn't include (live-only / not-yet-persisted self) on top.
		mergeFirstPage(data: Object): void
		{
			const serverViewers = Array.isArray(data?.viewers) ? data.viewers.map(normalizeViewer) : [];
			const serverIds = new Set(serverViewers.map((viewer) => viewer.userId));
			const liveExtras = this.viewers.filter((viewer) => !serverIds.has(viewer.userId));

			this.viewers = [...liveExtras, ...serverViewers];
			this.loadedViewerIds = new Set(this.viewers.map((viewer) => viewer.userId));

			const serverUnique = Number.isInteger(data?.uniqueCount) ? data.uniqueCount : serverViewers.length;
			// liveExtras aren't in the server's count yet (unpersisted) — add them on top.
			this.uniqueCount = serverUnique + liveExtras.length;
		},
		// [SDD P3, pagination] Seamless infinite scroll over the keyset cursor — no "show more".
		async loadMoreViews(): Promise<void>
		{
			if (this.isLoadingMore || !this.cursorInitialized || !this.viewsNextCursor)
			{
				return;
			}

			const documentId = Number(this.documentId);
			if (!(documentId > 0))
			{
				return;
			}

			this.isLoadingMore = true;
			try
			{
				const response = await HistoryApi.getViews({
					documentId,
					limit: VIEWS_PAGE_SIZE,
					afterCursor: this.viewsNextCursor,
				});
				const data = response?.data ?? {};
				const serverViewers = Array.isArray(data?.viewers) ? data.viewers.map(normalizeViewer) : [];
				const fresh = serverViewers.filter((viewer) => !this.loadedViewerIds.has(viewer.userId));
				fresh.forEach((viewer) => this.loadedViewerIds.add(viewer.userId));
				this.viewers = [...this.viewers, ...fresh];
				this.viewsNextCursor = Type.isPlainObject(data.nextCursor) ? data.nextCursor : null;
			}
			catch
			{
				// Stop paginating silently — the already-loaded rows stay visible.
			}
			finally
			{
				this.isLoadingMore = false;
			}
		},
		handleViewsScroll(event: Event): void
		{
			const el = event.currentTarget;
			if (!(el instanceof HTMLElement))
			{
				return;
			}

			if (el.scrollTop + el.clientHeight >= el.scrollHeight - VIEWS_SCROLL_THRESHOLD_PX)
			{
				void this.loadMoreViews();
			}
		},
		attachAwareness(): void
		{
			const awareness = this.provider?.awareness;
			if (awareness)
			{
				this.awarenessInstance = awareness;
				this.awarenessHandler = (changes, origin) => this.handleAwarenessUpdate(changes, origin);
				awareness.on('update', this.awarenessHandler);

				return;
			}

			// Provider may still be connecting (async `connect()`) when this widget mounts —
			// poll briefly for `provider.awareness` to appear instead of requiring a new callback
			// slot on the provider (its single `onParticipants` slot is already owned elsewhere).
			this.awarenessAttachAttempts += 1;
			if (this.awarenessAttachAttempts > AWARENESS_ATTACH_MAX_ATTEMPTS)
			{
				return;
			}

			this.awarenessAttachTimer = setTimeout(() => this.attachAwareness(), AWARENESS_ATTACH_RETRY_MS);
		},
		detachAwareness(): void
		{
			if (this.awarenessInstance && this.awarenessHandler)
			{
				this.awarenessInstance.off('update', this.awarenessHandler);
			}

			this.awarenessInstance = null;
			this.awarenessHandler = null;
		},
		handleAwarenessUpdate(changes: { added: number[], updated: number[], removed: number[] }, origin: mixed): void
		{
			// Only remote-origin events describe other participants (local-origin fires on our
			// own cursor/mode changes and isn't relevant here). Leavers are intentionally ignored:
			// a viewer row stays after the peer disconnects (historicity comes from the snapshot).
			if (origin !== 'remote')
			{
				return;
			}

			const changedClientIds = [...(changes?.added || []), ...(changes?.updated || [])];
			if (changedClientIds.length === 0)
			{
				return;
			}

			changedClientIds.forEach((clientId) => {
				const rawClientId = Number(clientId);
				if (!Number.isFinite(rawClientId) || rawClientId < SYNTHETIC_CLIENT_ID_OFFSET)
				{
					return;
				}

				const userId = rawClientId - SYNTHETIC_CLIENT_ID_OFFSET;
				if (!(userId > 0))
				{
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
		registerLivePresence(userId: number, name: string, color: string = ''): void
		{
			const now = new Date();
			const normalizedColor = color !== '' ? color : null;
			const existingIndex = this.viewers.findIndex((viewer) => viewer.userId === userId);

			if (existingIndex === -1)
			{
				// Awareness carries a name + identity color but never an avatar — live-added rows fall
				// back to the initial-avatar rendering until the next snapshot reload replaces them.
				this.viewers.unshift({ userId, name, avatar: null, color: normalizedColor, viewedAt: now });
				this.loadedViewerIds.add(userId);
				this.uniqueCount = (Number.isInteger(this.uniqueCount) ? this.uniqueCount : this.viewers.length - 1) + 1;

				return;
			}

			const [viewer] = this.viewers.splice(existingIndex, 1);
			viewer.viewedAt = now;
			if (name !== '')
			{
				viewer.name = name;
			}
			if (normalizedColor !== null)
			{
				viewer.color = normalizedColor;
			}
			this.viewers.unshift(viewer);
		},
		toggleOpen(): void
		{
			if (this.isOpen)
			{
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
				positionPopoverUnderTrigger(this.$refs.viewsTrigger, this.$refs.viewsPopover);
				this.$refs.viewsPopover?.focus?.();
				this.popoverAnchorDispose = keepPopoverAnchored(
					this.$refs.viewsTrigger,
					this.$refs.viewsPopover,
					() => this.closePopover(),
				);
			});
		},
		closePopover(refocusTrigger: boolean = false): void
		{
			this.isOpen = false;
			this.detachOutsideClick();
			this.detachPopoverAnchor();

			if (refocusTrigger)
			{
				this.$nextTick(() => this.$refs.viewsTrigger?.focus?.());
			}
		},
		handleViewsPopoverFocusOut(event: FocusEvent): void
		{
			const popover = this.$refs.viewsPopover;
			const trigger = this.$refs.viewsTrigger;
			const nextFocus = event.relatedTarget;

			// [iOS] Close via focusout ONLY when focus moved to a real element (keyboard Tab). A
			// null/non-element relatedTarget means the blur came from a tap — iOS Safari doesn't focus
			// <button>s on tap, so closing here would race the trigger's own click and reopen the
			// popover ("second tap doesn't close"). Tap-outside and trigger re-tap are owned by the
			// outside-click listener and the toggle handler respectively.
			if (!(nextFocus instanceof HTMLElement))
			{
				return;
			}

			// Focus moving onto the trigger button — let the button's own toggle handler decide.
			if (trigger instanceof HTMLElement && trigger.contains(nextFocus))
			{
				return;
			}

			if (popover instanceof HTMLElement && !popover.contains(nextFocus))
			{
				// Tab moved focus outside the popover — close without stealing focus back.
				this.closePopover();
			}
		},
		attachOutsideClick(): void
		{
			if (this.outsideClickHandler)
			{
				return;
			}

			this.outsideClickHandler = (event) => {
				if (this.$refs.root && !this.$refs.root.contains(event.target))
				{
					this.closePopover();
				}
			};

			// Deferred so the opening click itself doesn't immediately close the popover.
			setTimeout(() => {
				document.addEventListener('click', this.outsideClickHandler, true);
			}, 0);
		},
		detachOutsideClick(): void
		{
			if (this.outsideClickHandler)
			{
				document.removeEventListener('click', this.outsideClickHandler, true);
				this.outsideClickHandler = null;
			}
		},
		detachPopoverAnchor(): void
		{
			if (typeof this.popoverAnchorDispose === 'function')
			{
				this.popoverAnchorDispose();
				this.popoverAnchorDispose = null;
			}
		},
		viewerDisplayName(viewer: Object): string
		{
			return viewer.name !== '' ? viewer.name : `#${viewer.userId}`;
		},
		viewerProfileHref(viewer: Object): string
		{
			const id = Number(viewer?.userId);

			return Number.isInteger(id) && id > 0 ? `/company/personal/user/${id}/` : '';
		},
		// [avatar profile] Mirrors the chip avatar's contract: modifier / non-primary clicks fall
		// through to the browser (native new tab from the href), a plain click routes via
		// openUserProfile (mobile-native card / desktop new tab).
		onViewerClick(viewer: Object, event: MouseEvent): void
		{
			if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
			{
				return;
			}

			const id = Number(viewer?.userId);
			if (!Number.isInteger(id) || id <= 0 || typeof this.openUserProfile !== 'function')
			{
				return;
			}

			event.preventDefault();
			this.openUserProfile(id);
		},
		toTimestampSeconds(viewedAt: mixed): ?number
		{
			if (!(viewedAt instanceof Date) || Number.isNaN(viewedAt.getTime()))
			{
				return null;
			}

			return Math.floor(viewedAt.getTime() / 1000);
		},
		// [#1/#13, date-format fix] Shared day+time convention — see format-date.js.
		formatViewedAt(viewedAt: Date): string
		{
			const ts = this.toTimestampSeconds(viewedAt);

			return ts === null ? '' : formatActivityTimestamp(ts);
		},
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
	`,
};
