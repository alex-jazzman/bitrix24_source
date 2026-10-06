import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { Type } from 'main.core';
import { AssetUrl } from 'note.ui.assets';
import { Loader } from 'note.ui.loader';
import { BacklinksApi } from './backlinks-api';
import { positionPopoverUnderTrigger, keepPopoverAnchored } from 'note.ui.popover-position';
import { subscribeDocumentBacklinks } from './pull';
import { createBacklinksMessages } from './messages';

// [P2.T2 / P3.T1 / TPL-01] Backlinks widget: the "link N" chip of the activity line, counting the
// documents that link to the open one, plus the popover listing those sources.
//
// Unlike the neighbouring views eye there is exactly one source of the number — the server. There is
// no awareness overlay and nothing local to fold in: a link is only ever created by someone saving
// another document, never by the reader sitting here.
//
// The number normally arrives with the document bootstrap payload as the `initialBacklinks` prop
// ([DTO-01], bundled by DocumentBacklinksSnapshotResolver), so no request is issued on mount. The
// prop is absent for an older caller and for a switched-off feature; that is not an error, the
// widget then asks for its own number through [API-02], which answers a refusal with a plain zero.
//
// [EVENT-01] The pushed `documentBacklinksChanged` signal carries no value on purpose: the count is
// personal (it only counts sources the reader may see), so the signal is nothing but a reason to
// re-read our own number.
//
// [P3.T1] The list is read once and then kept: reopening the popover costs no request, because the
// only thing that can change it — a source appearing or leaving — arrives as the same [EVENT-01]
// push. The signal marks the list stale; a closed list is simply dropped and re-read on the next
// open, an open one is refreshed in place so the reader sees the change happen. The exception is a
// reader who has already scrolled past the first window: re-reading would move the row they are
// about to press, so there the refresh waits for the next open.
const SOURCES_PAGE_SIZE = 20;
const SOURCES_SCROLL_THRESHOLD_PX = 80;
// [API-01] Rights are applied after the keyset window is read, so an answer may be short of the
// limit — or empty — while the cursor is still alive. The list then asks again instead of reporting
// the end, but never endlessly: a reader who may see almost nothing would otherwise walk the whole
// index on one scroll. Hitting the guard leaves a live cursor, so the next scroll resumes.
const MAX_PAGE_PASSES = 5;
// Module-level counter for a unique popover id per instance (mirrors views-widget.js).
let instanceCounter = 0;

function normalizeSource(item: Object): Object
{
	return {
		id: Number(item?.id) || 0,
		title: String(item?.title || ''),
		collectionId: Number(item?.collectionId) || 0,
		collectionTitle: String(item?.collectionTitle || ''),
		// The source is a knowledge base description rather than a document of the tree: it has no
		// page of its own, so the row names the base and opens it.
		isCollectionDescription: item?.isCollectionDescription === true,
	};
}

export const BacklinksWidgetComponent = {
	name: 'NoteDocumentHistoryBacklinksWidget',
	components: {
		BIcon,
		Loader,
	},
	// Bridged out to the host, which owns the router — see onSourceClick().
	emits: ['open-internal-link'],
	props: {
		documentId: {
			type: Number,
			required: true,
		},
		// [DTO-01] `{ count: number, isCapped: boolean } | null` from the document bootstrap payload.
		// `null` (older answer, feature off) makes the widget read the count itself.
		initialBacklinks: {
			type: Object,
			default: null,
		},
		// Strings of the widget itself — the extension owns them, so a host that just places the chip
		// in its line passes nothing. Overridable for tests and for a caller with its own dictionary.
		messages: {
			type: Object,
			default: () => createBacklinksMessages(),
		},
	},
	data()
	{
		return {
			count: 0,
			isCapped: false,
			isOpen: false,
			sources: [],
			isSourcesLoading: false,
			isSourcesLoadingMore: false,
			hasSourcesError: false,
			// Reactive mirror of the (non-reactive) cursor: the template can't read the cursor handle
			// itself, but it has to tell a real end of the index (cursor null) from a window that just
			// held no visible rows (cursor alive) — see the "load more" prompt vs the terminal empty.
			hasMoreSources: false,
			// [P4.T2] Gate for the chip's grow/shrink transition — see settleInitialCount().
			canAnimateChip: false,
			// Roving focus of the sources menu: the row that currently owns tabindex=0. -1 while the
			// keyboard has not entered the list, so the first arrow starts at the top instead of
			// resuming a position the reader never chose.
			activeIndex: -1,
		};
	},
	computed: {
		Outline: (): typeof Outline => Outline,
		// The knowledge base glyph is note's own asset, not an icon-set name: it is drawn as a mask so
		// it takes the row's colour. The URL is injected inline because CSS cannot import it.
		collectionIconStyle(): Object
		{
			return {
				'-webkit-mask-image': `url('${AssetUrl.collectionIcon}')`,
				maskImage: `url('${AssetUrl.collectionIcon}')`,
			};
		},
		hasBacklinks(): boolean
		{
			// [FE-A1] A capped result may report count 0 while accessible sources exist past the counting
			// window (the first ones were all filtered out by ACL) — keep the chip so the reader can open
			// the panel and reach them through the full paginated read.
			return this.count > 0 || this.isCapped;
		},
		// The server stops counting at BacklinkProvider::COUNT_CAP and reports `isCapped` instead of
		// paying for an exact total — rendered as "99+" off the count it did report, so a change of
		// the cap needs nothing here. A capped count of 0 has no number to grow, so it shows a neutral
		// marker: the chip is still there only to open the panel.
		countText(): string
		{
			if (!this.isCapped)
			{
				return String(this.count);
			}

			return this.count > 0 ? `${this.count}+` : '…';
		},
		// A bare number read out on its own says nothing — name what it counts.
		chipAriaLabel(): string
		{
			return `${this.messages.backlinksChipTitle}: ${this.countText}`;
		},
	},
	created()
	{
		// Non-reactive handles, deliberately outside data(): a disposer is not rendered, and the keyset
		// cursor of the sources list belongs to the list popover, which pages through it without the
		// chip re-rendering on every page.
		this.backlinksPullDispose = null;
		this.sourcesNextCursor = null;
		this.loadedSourceIds = new Set();
		// Bumped whenever the list is thrown away (popover reopened, document switched) — an answer
		// that names an older session describes rows nobody is looking at any more.
		this.sourcesSessionToken = 0;
		// Same idea for the count: two quick pushes fire two reads, and the slower answer must not
		// overwrite the fresher one — each read carries the token it was issued under (see refreshCount).
		this.countRequestToken = 0;
		// The list is cached between opens; the push marks it stale (see invalidateSources).
		this.isSourcesStale = true;
		this.outsideClickHandler = null;
		this.popoverAnchorDispose = null;

		instanceCounter += 1;
		this.sourcesPopoverId = `note-backlinks-widget-popover-${instanceCounter}`;
		this.sourcesTitleId = `note-backlinks-widget-title-${instanceCounter}`;
	},
	mounted()
	{
		this.loadInitialCount();
		this.subscribeBacklinks();
	},
	beforeUnmount()
	{
		this.unsubscribeBacklinks();
		this.detachOutsideClick();
		this.detachPopoverAnchor();
	},
	watch: {
		// The host editor app is remounted per document, so this rarely fires — but a reused instance
		// must not keep showing the previous document's number, nor stay on its push channel.
		documentId(): void
		{
			this.resetLocalState();
			this.loadInitialCount();
			this.subscribeBacklinks();
		},
		// The caller may replace the bootstrap slice reactively — adopt the fresher one.
		initialBacklinks(nextValue: mixed): void
		{
			if (Type.isPlainObject(nextValue))
			{
				this.applySnapshot(nextValue);
			}
		},
		// The count falling to zero takes the whole chip out of the template, popover included — the
		// document-level listeners of an open popover would outlive the markup they belong to.
		hasBacklinks(nextValue: boolean): void
		{
			if (!nextValue)
			{
				this.closePopover();
			}
		},
	},
	methods: {
		resetLocalState(): void
		{
			// Before the count is dropped: a document switch replaces the whole line, so the old
			// chip must go at once instead of shrinking away next to the new document's title.
			this.canAnimateChip = false;
			this.count = 0;
			this.isCapped = false;
			this.closePopover();
			this.resetSourcesSession();
		},
		loadInitialCount(): void
		{
			if (Type.isPlainObject(this.initialBacklinks))
			{
				this.applySnapshot(this.initialBacklinks);

				return;
			}

			void this.refreshCount();
		},
		applySnapshot(snapshot: Object): void
		{
			this.count = Number(snapshot?.count) || 0;
			this.isCapped = snapshot?.isCapped === true;
			this.settleInitialCount();
		},
		// [P4.T2] The first number the widget ever shows is not an appearance — it is the activity
		// line arriving with the document. Only a count that changes while the reader is looking
		// deserves the grow/shrink motion, so the transition stays switched off (`:css="false"`,
		// which makes Vue skip the classes altogether) until one render has carried a real count.
		settleInitialCount(): void
		{
			if (this.canAnimateChip)
			{
				return;
			}

			this.$nextTick(() => {
				this.canAnimateChip = true;
			});
		},
		// [API-02] Never rejects — a refusal reaches us as a neutral zero, which is exactly what the
		// chip should show for sources the reader may not know about.
		async refreshCount(): Promise<void>
		{
			const documentId = Number(this.documentId);
			if (!(documentId > 0))
			{
				return;
			}

			this.countRequestToken += 1;
			const token = this.countRequestToken;
			const { count, isCapped } = await BacklinksApi.getBacklinksCount({ documentId });
			if (token !== this.countRequestToken || Number(this.documentId) !== documentId)
			{
				// A newer read has been issued since (two quick pushes), or the reader moved on while the
				// answer was in flight — either way this reply describes a state nobody is looking at.
				return;
			}

			this.count = count;
			this.isCapped = isCapped;
			this.settleInitialCount();
		},
		subscribeBacklinks(): void
		{
			this.unsubscribeBacklinks();
			this.backlinksPullDispose = subscribeDocumentBacklinks(
				this.documentId,
				() => {
					void this.refreshCount();
					this.invalidateSources();
				},
			);
		},
		unsubscribeBacklinks(): void
		{
			if (typeof this.backlinksPullDispose === 'function')
			{
				this.backlinksPullDispose();
			}

			this.backlinksPullDispose = null;
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
			// Only a list that was never read, was thrown away or has been marked stale by the push
			// costs a request — reopening an intact one shows the rows straight away.
			if (this.isSourcesStale || this.sources.length === 0)
			{
				this.resetSourcesSession();
				void this.loadSources(true);
			}

			// Centered-under-trigger positioning must run after the popover is in the DOM (it needs the
			// rendered offsetWidth/offsetHeight) — same tick as the focus move.
			this.$nextTick(() => {
				positionPopoverUnderTrigger(this.$refs.backlinksTrigger, this.$refs.backlinksPopover);
				this.$refs.backlinksPopover?.focus?.();
				this.popoverAnchorDispose = keepPopoverAnchored(
					this.$refs.backlinksTrigger,
					this.$refs.backlinksPopover,
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
				this.$nextTick(() => this.$refs.backlinksTrigger?.focus?.());
			}
		},
		// [EVENT-01] The signal carries no payload, so "something changed" is all it says — the list has
		// to be read again. Which moment that happens in depends on where the reader is: see the class
		// comment above.
		invalidateSources(): void
		{
			this.isSourcesStale = true;
			const isReaderDeepInTheList = this.sources.length > SOURCES_PAGE_SIZE || this.isSourcesLoadingMore;
			if (!this.isOpen || isReaderDeepInTheList)
			{
				return;
			}

			// The rows are about to be dropped from the DOM. If the keyboard reader stands on one of
			// them, focus has to be moved onto the popover FIRST: taken out from under it, focus falls
			// to the body — the reader loses the list, and the focusout that follows reads as "left the
			// popover" and closes it.
			if (this.isFocusInsideSourceList())
			{
				this.$refs.backlinksPopover?.focus?.();
			}

			this.resetSourcesSession();
			void this.loadSources(true);
		},
		isFocusInsideSourceList(): boolean
		{
			const links = this.$refs.sourceLinks;
			if (!Array.isArray(links))
			{
				return false;
			}

			const focused = document.activeElement;

			return links.some((link) => link === focused);
		},
		resetSourcesSession(): void
		{
			this.isSourcesStale = false;
			this.sourcesSessionToken += 1;
			// The rows the roving focus pointed at are going away with the list.
			this.activeIndex = -1;
			this.sources = [];
			this.sourcesNextCursor = null;
			this.hasMoreSources = false;
			this.loadedSourceIds = new Set();
			this.hasSourcesError = false;
			this.isSourcesLoading = false;
			this.isSourcesLoadingMore = false;
		},
		// [API-01] One visible page, possibly several requests: see MAX_PAGE_PASSES above for why an
		// answer that adds no row is not the end of the list.
		async loadSources(isFirstPage: boolean): Promise<void>
		{
			const documentId = Number(this.documentId);
			if (!(documentId > 0))
			{
				return;
			}

			const token = this.sourcesSessionToken;
			this.hasSourcesError = false;
			if (isFirstPage)
			{
				this.isSourcesLoading = true;
			}
			else
			{
				this.isSourcesLoadingMore = true;
			}

			try
			{
				// [API-01] Keep pulling windows until a full page is gathered, the cursor is spent or the
				// pass budget runs out — a short page (say 3 visible of 20 read) with a live cursor is not
				// enough to scroll, so stopping there would strand the accessible sources still ahead of it.
				let passes = 0;
				let added = 0;
				while (passes < MAX_PAGE_PASSES && added < SOURCES_PAGE_SIZE)
				{
					passes += 1;
					const response = await BacklinksApi.getBacklinks({
						documentId,
						limit: SOURCES_PAGE_SIZE,
						afterCursor: this.sourcesNextCursor,
					});
					if (token !== this.sourcesSessionToken)
					{
						return;
					}

					added += this.appendSources(response?.data);
					if (this.sourcesNextCursor === null)
					{
						break;
					}
				}
			}
			catch
			{
				if (token === this.sourcesSessionToken)
				{
					this.hasSourcesError = true;
				}
			}
			finally
			{
				if (token === this.sourcesSessionToken)
				{
					this.isSourcesLoading = false;
					this.isSourcesLoadingMore = false;
				}
			}
		},
		// Returns how many rows the answer actually added. The cursor is stored exactly as it came:
		// [API-01] it is an opaque value (a raw SOURCE_ID), never parsed or rebuilt from a row. A
		// missing cursor (null/undefined) is the one and only end-of-index signal — test on PRESENCE,
		// not on a filled string, or a numeric cursor would read as "the end" and paging would stop.
		appendSources(data: mixed): number
		{
			const payload = Type.isPlainObject(data) ? data : {};
			const items = Array.isArray(payload.items) ? payload.items : [];
			const fresh = items
				.map(normalizeSource)
				.filter((source) => source.id > 0 && !this.loadedSourceIds.has(source.id));

			fresh.forEach((source) => this.loadedSourceIds.add(source.id));
			if (fresh.length > 0)
			{
				this.sources = [...this.sources, ...fresh];
			}

			const nextCursor = payload.nextCursor;
			this.sourcesNextCursor = (nextCursor !== null && nextCursor !== undefined) ? nextCursor : null;
			this.hasMoreSources = this.sourcesNextCursor !== null;

			return fresh.length;
		},
		loadMoreSources(): void
		{
			if (
				!this.isOpen
				|| this.isSourcesLoading
				|| this.isSourcesLoadingMore
				|| this.hasSourcesError
				|| this.sourcesNextCursor === null
			)
			{
				return;
			}

			void this.loadSources(false);
		},
		handleSourcesScroll(event: Event): void
		{
			const el = event.currentTarget;
			if (!(el instanceof HTMLElement))
			{
				return;
			}

			if (el.scrollTop + el.clientHeight >= el.scrollHeight - SOURCES_SCROLL_THRESHOLD_PX)
			{
				this.loadMoreSources();
			}
		},
		// The failed request is the one to repeat: nothing read yet means the first page, otherwise the
		// page that was being appended.
		retrySources(): void
		{
			void this.loadSources(this.sources.length === 0);
		},
		// [API-01] The auto-pass budget ran out with nothing visible yet, but the cursor is alive — the
		// index is not exhausted, the first sources just happen to sit past what the passes covered
		// (they were all filtered out by ACL). Rather than stranding the reader on a false "no
		// backlinks", let them spend another budget by hand. Each click is a fresh MAX_PAGE_PASSES run.
		continueLoading(): void
		{
			if (this.sourcesNextCursor === null || this.isSourcesLoading || this.isSourcesLoadingMore)
			{
				return;
			}

			void this.loadSources(this.sources.length === 0);
		},
		// A description carries the base's own name: its document title is an internal one the reader
		// has never seen and would not recognise.
		sourceTitle(source: Object): string
		{
			if (source.isCollectionDescription)
			{
				return source.collectionTitle === '' ? `#${source.collectionId}` : source.collectionTitle;
			}

			return source.title === '' ? `#${source.id}` : source.title;
		},
		sourceHref(source: Object): string
		{
			if (source.isCollectionDescription)
			{
				const collectionId = Number(source?.collectionId);

				return collectionId > 0 ? `/note/workspace/${collectionId}/` : '';
			}

			const id = Number(source?.id);

			return id > 0 ? `/note/document/${id}/` : '';
		},
		// A source opens as an ordinary document route, but the widget never routes itself: the meta
		// line always lives inside the editor's own createApp() instance (EditorMount), which carries
		// no router even when the page around it is routed. So the click is bridged out the same way a
		// mention click is and the host turns it into a router push. Modifier / non-primary clicks are
		// left to the browser, same contract as the viewer rows of the views list.
		onSourceClick(source: Object, event: MouseEvent): void
		{
			if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
			{
				return;
			}

			// A description has no document page of its own: the row opens the base it describes.
			const isCollection = source.isCollectionDescription === true;
			const id = Number(isCollection ? source?.collectionId : source?.id);
			if (!(id > 0))
			{
				return;
			}

			event.preventDefault();
			this.closePopover();
			this.$emit('open-internal-link', { type: isCollection ? 'collection' : 'document', id });
		},
		// Keyboard contract of ui.menu, on the whole widget so the arrows work from the chip itself:
		// the popover is a sibling of the trigger, and a keydown on the trigger never reaches it.
		onKeydown(event: KeyboardEvent): void
		{
			if (!this.isOpen || this.sources.length === 0)
			{
				return;
			}

			const lastIndex = this.sources.length - 1;
			let nextIndex = null;

			if (event.key === 'ArrowDown')
			{
				nextIndex = this.activeIndex >= lastIndex ? lastIndex : this.activeIndex + 1;
			}
			else if (event.key === 'ArrowUp')
			{
				// Up from the top leaves the list rather than wrapping around to the bottom: the chip
				// is what sits above the first row, so that is where the focus belongs.
				if (this.activeIndex <= 0)
				{
					this.activeIndex = -1;
					event.preventDefault();
					this.$refs.backlinksTrigger?.focus();

					return;
				}

				nextIndex = this.activeIndex - 1;
			}
			else if (event.key === 'Home')
			{
				nextIndex = 0;
			}
			else if (event.key === 'End')
			{
				nextIndex = lastIndex;
			}

			if (nextIndex === null)
			{
				return;
			}

			// Arrow keys scroll the popover by default, which would fight the focus moving the row into
			// view on its own.
			event.preventDefault();
			this.focusSource(nextIndex);

			// Reaching the bottom by keyboard has to extend the list the same way reaching it by scroll
			// does — the scroll handler never fires for a focus-driven move.
			if (nextIndex === lastIndex)
			{
				void this.loadMoreSources();
			}
		},
		focusSource(index: number): void
		{
			this.activeIndex = index;

			// After the tabindex swap has landed, otherwise focus() targets a row still holding -1.
			this.$nextTick(() => {
				const links = this.$refs.sourceLinks;
				const link = Array.isArray(links) ? links[index] : null;
				link?.focus();
			});
		},
		handlePopoverFocusOut(event: FocusEvent): void
		{
			const popover = this.$refs.backlinksPopover;
			const trigger = this.$refs.backlinksTrigger;
			const nextFocus = event.relatedTarget;

			// [iOS] Close via focusout ONLY when focus moved to a real element (keyboard Tab). A
			// null/non-element relatedTarget means the blur came from a tap — iOS Safari doesn't focus
			// buttons on tap, so closing here would race the trigger's own click and reopen the popover.
			if (!(nextFocus instanceof HTMLElement))
			{
				return;
			}

			if (trigger instanceof HTMLElement && trigger.contains(nextFocus))
			{
				return;
			}

			if (popover instanceof HTMLElement && !popover.contains(nextFocus))
			{
				this.closePopover();
			}
		},
		attachOutsideClick(): void
		{
			if (this.outsideClickHandler)
			{
				return;
			}

			const handler = (event) => {
				if (this.$refs.root && !this.$refs.root.contains(event.target))
				{
					this.closePopover();
				}
			};

			this.outsideClickHandler = handler;
			// Deferred so the opening click itself doesn't immediately close the popover. The handler is
			// captured here rather than read on the timer: a close between the two would otherwise
			// attach whatever the next open had put in its place.
			setTimeout(() => {
				if (this.outsideClickHandler === handler)
				{
					document.addEventListener('click', handler, true);
				}
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
	},
	// The whole wrapper is dropped for a zero count, the chip is not merely hidden: an empty flex item
	// would still take a slot gap of the activity line and reserve room for a chip that isn't there.
	//
	// [P4.T2] Which is why coming and going is a transition and not a step: the first incoming link
	// arrives by push while the reader sits on the page, and a chip popping into the line would jump
	// the star and the bell sideways. See the .note-backlinks-chip-* rules in style.css.
	//
	// The end of the list is told by what is NOT there: once the cursor is spent no loader row follows
	// the last source, and no further request is made.
	// language=Vue
	template: `
		<Transition name="note-backlinks-chip" :css="canAnimateChip">
			<div v-if="hasBacklinks" ref="root" class="note-backlinks-widget" @keydown="onKeydown">
				<button
					ref="backlinksTrigger"
					type="button"
					class="note-activity-line__control --interactive"
					:title="messages.backlinksChipTitle"
					:aria-label="chipAriaLabel"
					:aria-expanded="isOpen ? 'true' : 'false'"
					:aria-controls="sourcesPopoverId"
					@click="toggleOpen"
				>
					<BIcon :name="Outline.LINK" class="note-activity-line__control-icon" aria-hidden="true" />
					<span class="note-activity-line__control-count">{{ countText }}</span>
				</button>
				<div
					v-if="isOpen"
					:id="sourcesPopoverId"
					ref="backlinksPopover"
					class="note-backlinks-widget__popover"
					role="group"
					:aria-labelledby="sourcesTitleId"
					tabindex="-1"
					@keydown.esc="closePopover(true)"
					@focusout="handlePopoverFocusOut"
				>
					<div :id="sourcesTitleId" class="note-backlinks-widget__popover-title">{{ messages.backlinksTitle }}</div>
					<ul v-if="sources.length > 0" class="note-backlinks-widget__list" role="menu" @scroll="handleSourcesScroll">
						<li v-for="(source, index) in sources" :key="source.id" class="note-backlinks-widget__row" role="none">
							<a
								ref="sourceLinks"
								class="note-backlinks-widget__source"
								role="menuitem"
								:href="sourceHref(source)"
								:title="sourceTitle(source)"
								:tabindex="index === activeIndex ? 0 : -1"
								@click="onSourceClick(source, $event)"
								@focus="activeIndex = index"
							>
									<span
										v-if="source.isCollectionDescription"
										class="note-backlinks-widget__source-icon note-backlinks-widget__source-icon--collection"
										:style="collectionIconStyle"
										aria-hidden="true"
									></span>
									<BIcon v-else :name="Outline.FILE" class="note-backlinks-widget__source-icon" aria-hidden="true" />
								<span class="note-backlinks-widget__source-title">{{ sourceTitle(source) }}</span>
							</a>
						</li>
					</ul>
					<div v-if="isSourcesLoading || isSourcesLoadingMore" class="note-backlinks-widget__state">
						<Loader :label="messages.loading" />
					</div>
					<!-- The read fails while the reader is waiting on the spinner: role="alert" is what makes
					     the failure reach a screen reader, which would otherwise sit in silence. -->
					<div v-else-if="hasSourcesError" class="note-backlinks-widget__state" role="alert">
						<span class="note-backlinks-widget__error">{{ messages.backlinksLoadError }}</span>
						<button type="button" class="note-backlinks-widget__retry" @click="retrySources">
							{{ messages.backlinksRetry }}
						</button>
					</div>
					<!-- Nothing visible yet, but the cursor is still alive: the index is not exhausted, so
					     this is not the end of the list. Offer a manual pull instead of the terminal empty,
					     otherwise a reader whose first sources are all ACL-hidden can never reach the rest. -->
					<div v-else-if="sources.length === 0 && hasMoreSources" class="note-backlinks-widget__state">
						<span>{{ messages.backlinksMoreHint }}</span>
						<button type="button" class="note-backlinks-widget__load-more" @click="continueLoading">
							{{ messages.backlinksLoadMore }}
						</button>
					</div>
					<div v-else-if="sources.length === 0" class="note-backlinks-widget__state">{{ messages.backlinksEmpty }}</div>
				</div>
			</div>
		</Transition>
	`,
};
