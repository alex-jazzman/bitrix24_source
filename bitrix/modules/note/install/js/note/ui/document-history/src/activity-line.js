import { Type } from 'main.core';
import { NoteAvatarStack } from 'note.ui.avatar-stack';
import { ViewsWidgetComponent } from './views-widget';
import { BacklinksWidgetComponent } from 'note.ui.backlinks';
import { SubscriptionBellComponent } from './subscription-bell';
import { FavoriteStarComponent } from './favorite-star';
import { subscribeDocumentHistory } from './history-pull';
import { formatActivityTimestamp } from './format-date';

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
export const ActivityLineComponent = {
	name: 'NoteDocumentHistoryActivityLine',
	components: {
		NoteAvatarStack,
		ViewsWidgetComponent,
		BacklinksWidgetComponent,
		SubscriptionBellComponent,
		FavoriteStarComponent,
	},
	props: {
		documentId: {
			type: Number,
			required: true,
		},
		// The PushPullYjsProvider instance — passed straight through to ViewsWidgetComponent,
		// see its own prop doc for details.
		provider: {
			type: Object,
			default: null,
		},
		// Not consumed internally today — accepted for contract parity with
		// VersionTimelineComponent (both hubs render next to document content and may need it
		// for future edit-gated affordances).
		canEdit: {
			type: Boolean,
			default: false,
		},
		// Handed down to SubscriptionBellComponent — optional (the server falls back to the
		// document's own collection when it's 0/omitted), passed through when the caller
		// already has it (see note-editor.js's own `collectionId` prop). [P3.T1] Also read by
		// BacklinksWidgetComponent, which labels only the sources living in another knowledge base.
		collectionId: {
			type: Number,
			default: 0,
		},
		// [#2] Bootstrap snapshot of the last content change: `{ authors: [{id,name,avatar}],
		// time: <ISO 8601 string> } | null`. Normalized upstream in note.app's
		// route-document-resolver.js and threaded through note.editor's state/EditorMount —
		// see note-editor.js's own `lastChange` prop doc. [NEW-C] This is only the page-load
		// value; after mount a live `content_changed` push overrides it via `liveLastChange`
		// (see effectiveChipInfo), so the chip stays fresh without a reload.
		lastChange: {
			type: Object,
			default: null,
		},
		// [P8.T5] ISO-8601 creation timestamp of the document. When there is no last-change info to
		// show, the chip falls back to "Created <date>" instead of the generic "open history" label.
		createdAt: {
			type: String,
			default: null,
		},
		// [P8.T2] history_enabled UI flag. When false the chip still renders and live-updates, but it
		// is NOT interactive: no history-open click, no title/hover/cursor affordance.
		historyEnabled: {
			type: Boolean,
			default: false,
		},
		// [P8.T3] notifications_enabled UI flag — gates the subscription bell only.
		notificationsEnabled: {
			type: Boolean,
			default: false,
		},
		// [#11/#12] Same shape as `lastChange`, sourced from the version currently open in the
		// main editor's read-only preview. Non-null overrides `lastChange` for the chip and
		// hides the eye/bell (see class doc above).
		previewInfo: {
			type: Object,
			default: null,
		},
		// [#6] Initial "who viewed" snapshot bundled with the document bootstrap payload —
		// passed straight through to ViewsWidgetComponent, which uses it as a base and skips
		// its own getViews call when present. See that component's own prop doc.
		initialViews: {
			type: Object,
			default: null,
		},
		// [DTO-01] Backlinks counter bundled with the document bootstrap — passed straight through
		// to BacklinksWidgetComponent, which adopts it instead of reading the count itself. See that
		// component's own prop doc.
		initialBacklinks: {
			type: Object,
			default: null,
		},
		// Bell state bundled with the document bootstrap — passed straight through to
		// SubscriptionBellComponent, which adopts it instead of its own getState call on mount.
		initialSubscription: {
			type: Object,
			default: null,
		},
		// [TPL-01] "In favorites" flag from the document bootstrap - passed straight through to
		// FavoriteStarComponent. `null` leaves the star to the sidebar's own state (see its prop doc).
		initialFavorite: {
			type: Boolean,
			default: null,
		},
		// Title of the open document - handed to FavoriteStarComponent, which reports it with the star's
		// announcement so the sidebar can draw the row of the block at once (see its prop doc).
		documentTitle: {
			type: String,
			default: '',
		},
		// [own-view bug fix] `{ id, name, avatar, ... }` — passed straight through to
		// ViewsWidgetComponent, which uses it to add the current user to the viewers list on
		// mount when the bootstrap snapshot hasn't recorded their own view yet (see that
		// component's own prop/class doc).
		currentUser: {
			type: Object,
			default: () => ({}),
		},
		messages: {
			type: Object,
			required: true,
		},
		// [avatar profile] Optional function-prop from the caller (note.editor's note-editor.js) —
		// invoked with a user id when a chip author avatar or a views-list viewer row is clicked.
		// Threaded down to ViewsWidgetComponent as well.
		openUserProfile: {
			type: Function,
			default: null,
		},
	},
	// open-internal-link is relayed from the backlinks widget: only the host has a router.
	emits: ['open-history', 'open-internal-link'],
	data()
	{
		return {
			// [NEW-C, live chip] Latest content-change snapshot learned from the pushed history
			// stream after mount — starts null (chip shows the bootstrap `lastChange` prop) and,
			// once a `content_changed` event arrives, overrides it so the chip updates in place
			// without a reload. Same `{ authors, time }` shape as `lastChange`.
			liveLastChange: null,
			// [AC-045] Effective "in favorites" flag as the star reports it (bootstrap, sidebar store or
			// the user's own press). The bell is gated by it, so it has to be the star's value and not a
			// second reading of the same fact.
			starFavorite: null,
		};
	},
	created()
	{
		// Non-reactive pull disposer (a bare function handle, deliberately outside data()).
		this.historyPullDispose = null;
	},
	mounted()
	{
		this.subscribeHistory();
	},
	beforeUnmount()
	{
		this.unsubscribeHistory();
	},
	watch: {
		// The host editor app is remounted per document, so this rarely fires — but reset+resubscribe
		// defensively in case the caller ever reuses the instance across documents.
		documentId(): void
		{
			this.liveLastChange = null;
			this.subscribeHistory();
		},
	},
	computed: {
		isPreviewMode(): boolean
		{
			return this.previewInfo !== null;
		},
		isFavorite(): boolean
		{
			return this.starFavorite ?? Boolean(this.initialFavorite);
		},
		effectiveChipInfo(): Object | null
		{
			// A version preview wins over everything; otherwise the freshest live content-change
			// snapshot wins over the bootstrap one, so the chip tracks edits made after page load.
			const info = this.previewInfo ?? this.liveLastChange ?? this.lastChange;

			return Type.isPlainObject(info) ? info : null;
		},
		chipAuthors(): Array<Object>
		{
			const authors = this.effectiveChipInfo?.authors;

			return Array.isArray(authors) ? authors : [];
		},
		hasChipInfo(): boolean
		{
			return this.chipAuthors.length > 0 && Type.isStringFilled(this.effectiveChipInfo?.time);
		},
		// [#2, date-format fix] Shared day+time convention — see format-date.js.
		chipTimeText(): string
		{
			const ts = this.toTimestampSeconds(this.effectiveChipInfo?.time);

			return ts === null ? '' : formatActivityTimestamp(ts);
		},
		// [P8.T5] No last-change info: show "Created <date>" when we have a valid creation timestamp,
		// otherwise keep the generic "open history" label (no crash on a missing/invalid createdAt).
		chipFallbackText(): string
		{
			const ts = this.toTimestampSeconds(this.createdAt);
			if (ts === null)
			{
				return this.messages.activityOpenHistory;
			}

			return `${this.messages.activityCreated} ${formatActivityTimestamp(ts)}`;
		},
	},
	methods: {
		toTimestampSeconds(value: mixed): ?number
		{
			if (typeof value !== 'string' || value === '')
			{
				return null;
			}

			const ms = Date.parse(value);

			return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
		},
		// [NEW-C, live chip] Subscribe to the same pushed history stream the sidebar feed reads, but
		// only to keep the chip's "last change" fresh. `content_changed` is visible to every role
		// (EventVisibilityPolicy MTX-01), so reacting to it here leaks nothing the reader can't see.
		subscribeHistory(): void
		{
			this.unsubscribeHistory();
			this.historyPullDispose = subscribeDocumentHistory(
				this.documentId,
				(event) => this.handleHistoryEvent(event),
			);
		},
		unsubscribeHistory(): void
		{
			if (typeof this.historyPullDispose === 'function')
			{
				this.historyPullDispose();
			}

			this.historyPullDispose = null;
		},
		handleHistoryEvent(event: ?Object): void
		{
			if (!Type.isPlainObject(event) || String(event.type || '') !== 'content_changed')
			{
				return;
			}

			const rawAuthors = Array.isArray(event.authors) && event.authors.length > 0
				? event.authors
				: [event.actor].filter(Type.isPlainObject);
			const authors = rawAuthors.map((author) => ({
				id: Number(author?.id) || 0,
				name: String(author?.name || ''),
				avatar: author?.avatar || null,
				// Keep the server identity color (see version-timeline.js) so the chip avatar matches
				// the caret / timeline instead of falling back to the palette.
				color: author?.color || null,
			}));
			const time = typeof event.createdAt === 'string' ? event.createdAt : '';
			if (authors.length === 0 || time === '')
			{
				return;
			}

			this.liveLastChange = { authors, time };
		},
		handleChipClick(): void
		{
			// [P8.T2] history_enabled off → the chip is a passive label, no history-open.
			if (!this.historyEnabled)
			{
				return;
			}

			this.$emit('open-history');
		},
		handleAvatarClick(participant: Object): void
		{
			const id = Number(participant?.id);
			if (Number.isInteger(id) && id > 0 && typeof this.openUserProfile === 'function')
			{
				this.openUserProfile(id);
			}
		},
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
	`,
};
