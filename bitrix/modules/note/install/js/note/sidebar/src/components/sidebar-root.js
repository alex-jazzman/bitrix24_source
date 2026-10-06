import { TreeNode } from './tree-node';
import { SidebarSearchRow } from './sidebar-search-row';
import { SidebarRail } from './sidebar-rail';
import { SidebarFooter } from './sidebar-footer';
import { SidebarLoader } from './sidebar-loader';
import { ExpandTransition } from './expand-transition';
import { FavoritesSection } from './favorites-section';
import { controlsAlwaysVisible, rowNameReserve } from '../utils/row-controls';
import { markSectionMotion } from '../utils/drop-motion';
import { Dom, Event, Loc, Type } from 'main.core';
import { markRaw } from 'ui.vue3';
import { BIcon } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { NoteAnalytics } from 'note.analytics';
import type { Collection } from '../type';

// The share of a section no other section may take from it, in rows. Five is what makes a list read as
// a list: below that the section is a hint that something is there rather than a way to get to it.
const SECTION_FLOOR_ROWS = 5;
const SECTION_ROW_HEIGHT = 32;

// How long the bar of an area stays up after the scrolling stops. Long enough to read as a fade of the
// same gesture, short enough not to sit over the rows once the list is still.
const SCROLLBAR_FLASH_MS = 900;

// The height transition of a section plus slack, so the panel is unmarked after the motion and not in
// the middle of it. Held here rather than read back from the stylesheet: the value the sections move
// over is one and the same, and a share published while unmarked lands in one step.
const SECTION_SHARE_MS = 320;

export const SidebarRootComponent = {
	name: 'SidebarRootComponent',
	components: {
		TreeNode,
		SidebarSearchRow,
		SidebarRail,
		SidebarFooter,
		SidebarLoader,
		BIcon,
		ExpandTransition,
		FavoritesSection,
	},
	props: {
		state: { type: Object, required: true },
		actions: { type: Object, required: true },
		messages: { type: Object, required: true },
		themeActions: { type: Object, default: null },
	},
	// Tree rows live in TreeNode children. A child re-render - a row appearing, a star toggling
	// and with it the room its title has to leave - never reaches this component's updated()
	// hook, so the measure pass has to be reachable from down there.
	provide(): Object
	{
		return {
			noteScheduleTreeMetrics: () => {
				this.scheduleTreeMetrics();
				this.scheduleSectionShares();
			},
			// Synchronous on purpose: what opens and closes the sections of the panel is the transition, and
			// the shares this publishes are what it moves them by. They have to stand at their destination
			// in the frame the motion starts, not one frame later.
			noteRefreshSectionFloors: (hint) => {
				if (this.$el instanceof HTMLElement)
				{
					this.refreshSectionFloors(this.$el, hint);
				}
			},
			// Whether the panel of sections is itself being drawn for the first time - the rail giving way
			// to it. A section appearing along with the panel has no motion of its own to play: what the
			// user asked for is the panel, and it is already on its way.
			noteSectionsAppearing: () => this.sectionsAppearing,
		};
	},
	data()
	{
		return {
			isSidebarResizing: false,
			sidebarResizeStartX: 0,
			sidebarResizeStartWidth: 0,
			renameCollectionCancelled: false,
			dragAutoScrollRaf: 0,
			dragAutoScrollSpeed: 0,
			dragLastClientX: 0,
			dragLastClientY: 0,
			dragOverCaptureHandler: null,
			dragScrollDuringDrag: null,
			dispatchingSyntheticDragOver: false,
			sidebarScrollRaf: 0,
			treeMetricsRaf: 0,
			sectionSharesRaf: 0,
			sectionSharesDragging: false,
			// Set for the one render in which the rail gives way to the sections (see the watcher below).
			sectionsAppearing: false,
			sidebarResizeObserver: null,
			sharedSentinelObserver: null,
			observedSharedSentinel: null,
			sharedSentinelVisible: false,
			sharedPumpRunning: false,
			pointerScrollArea: null,
			pointerScrollHandler: null,
			pointerScrollLeaveHandler: null,
			scrollFlashHandler: null,
			// Elements as keys, so nothing here outlives the area it belongs to; plain Map because the
			// timers still have to be cleared one by one when the panel goes away.
			scrollFlashTimers: markRaw(new Map()),
			treeScrollLeft: markRaw(new WeakMap()),
		};
	},
	mounted()
	{
		const content = this.$refs.sidebarContent;
		if (content)
		{
			this.dragOverCaptureHandler = (event) => this.onDragOverCapture(event);
			content.addEventListener('dragover', this.dragOverCaptureHandler, true);
			// Scroll does not bubble, but the capture path still walks the ancestors, so one listener
			// here covers both tree areas below.
			this.dragScrollDuringDrag = () => this.onScrollDuringDrag();
			content.addEventListener('scroll', this.dragScrollDuringDrag, { passive: true, capture: true });

			// The accessible-tree section can page through windows that yield nothing showable (rows
			// the user is denied, or nodes deep inside an already-shared subtree). While that lasts
			// the section renders empty, so it never scrolls and the scroll-driven sentinel check can
			// never fire — paging would stop with a live cursor. Visibility, unlike scrolling, still
			// reports the sentinel, so an empty section keeps paging exactly while it is on screen.
			if (typeof IntersectionObserver === 'function')
			{
				this.sharedSentinelObserver = new IntersectionObserver(
					(entries) => {
						this.sharedSentinelVisible = entries.some((entry) => entry.isIntersecting);
						void this.pumpSharedSection();
					},
					// Viewport as the root, not the panel: the section scrolls inside its own tree area
					// now, and intersection already accounts for every clipping ancestor on the way.
					{ rootMargin: '24px' },
				);
				this.syncSharedSentinelObserver();
			}
		}

		if (this.$el instanceof HTMLElement)
		{
			// Whole panel, not just the list area: the width handle sits right next to a tree's
			// scrollbar, and a slow exit over it has to drop the thumb too.
			this.pointerScrollHandler = (event) => this.syncPointerScrollArea(event);
			this.pointerScrollLeaveHandler = () => this.clearPointerScrollArea();
			// Where there is no pointer to be inside anything, the bar answers to the scrolling itself:
			// one listener for every area of the panel, capture phase because scroll does not bubble.
			this.scrollFlashHandler = (event) => this.flashScrollbar(event.target);
			this.$el.addEventListener('scroll', this.scrollFlashHandler, true);
			this.$el.addEventListener('pointermove', this.pointerScrollHandler, true);
			this.$el.addEventListener('pointerleave', this.pointerScrollLeaveHandler);
		}

		// Tree title widths and the highlight pill are measured against the visible area, so a
		// change of sidebar width has to re-run the pass.
		if (typeof ResizeObserver === 'function' && this.$el instanceof HTMLElement)
		{
			this.sidebarResizeObserver = new ResizeObserver(() => {
				this.scheduleTreeMetrics();
				this.scheduleSectionShares();
			});
			this.sidebarResizeObserver.observe(this.$el);
		}

		this.scheduleTreeMetrics();
		this.scheduleSectionShares();
	},
	updated()
	{
		this.scheduleTreeMetrics();
		this.syncDragSectionShares();
		this.scheduleSectionShares();
		// The sentinel is v-if'd on sharedHasNextPage and re-created with the section, so the
		// observed node has to be re-pointed after a render. Cheap: one querySelector and an
		// identity check.
		this.syncSharedSentinelObserver();
	},
	beforeUnmount()
	{
		this.clearPointerScrollArea();
		for (const timer of this.scrollFlashTimers.values())
		{
			clearTimeout(timer);
		}
		this.scrollFlashTimers.clear();
		if (this.$el instanceof HTMLElement)
		{
			if (this.scrollFlashHandler)
			{
				this.$el.removeEventListener('scroll', this.scrollFlashHandler, true);
			}
			if (this.pointerScrollHandler)
			{
				this.$el.removeEventListener('pointermove', this.pointerScrollHandler, true);
			}
			if (this.pointerScrollLeaveHandler)
			{
				this.$el.removeEventListener('pointerleave', this.pointerScrollLeaveHandler);
			}
		}
		this.clearSidebarResizeState();
		// Not part of the drag state: a drag that ends with the pointer still on the handle leaves the
		// boundary lit on purpose, so only going away clears this one.
		this.onSidebarResizeHover(false);
		this.stopDragAutoScroll();
		if (this.sidebarScrollRaf)
		{
			cancelAnimationFrame(this.sidebarScrollRaf);
			this.sidebarScrollRaf = 0;
		}
		if (this.treeMetricsRaf)
		{
			cancelAnimationFrame(this.treeMetricsRaf);
			this.treeMetricsRaf = 0;
		}
		if (this.sectionSharesRaf)
		{
			cancelAnimationFrame(this.sectionSharesRaf);
			this.sectionSharesRaf = 0;
		}
		if (this.sidebarResizeObserver)
		{
			this.sidebarResizeObserver.disconnect();
			this.sidebarResizeObserver = null;
		}
		if (this.sharedSentinelObserver)
		{
			this.sharedSentinelObserver.disconnect();
			this.sharedSentinelObserver = null;
			this.observedSharedSentinel = null;
			this.sharedSentinelVisible = false;
		}
		const content = this.$refs.sidebarContent;
		if (content && this.dragOverCaptureHandler)
		{
			content.removeEventListener('dragover', this.dragOverCaptureHandler, true);
		}
		if (content && this.dragScrollDuringDrag)
		{
			content.removeEventListener('scroll', this.dragScrollDuringDrag, true);
		}
	},
	computed: {
		displayedCollections(): Object[]
		{
			return this.state.collections;
		},
		displayedLoading(): boolean
		{
			return this.state.collectionsLoading;
		},
		childrenGetter(): Function
		{
			return this.state.getChildren;
		},
		// Empty-state prose lives beside the scrolling tree, not inside it, so it wraps against
		// the panel width. Inside it would depend on the measured visible width and reflow to a
		// different line count right after the expand animation had already sized itself.
		isCollectionsEmpty(): boolean
		{
			return !this.displayedLoading && this.displayedCollections.length === 0;
		},
		isSharedEmpty(): boolean
		{
			return !this.state.sharedLoading
				&& !this.state.sharedHasNextPage
				&& this.state.sharedContainers.length === 0
			;
		},
	},
	watch: {
		// The handle is drawn only in the expanded panel, so collapsing takes it out from under the
		// pointer and no leave event follows: the boundary would stay lit with nothing to grab.
		'state.sidebarCollapsed': function(collapsed)
		{
			if (collapsed)
			{
				this.onSidebarResizeHover(false);
			}
		},
		'state.renamingCollectionId': function(value)
		{
			this.renameCollectionCancelled = false;
			if (value !== null)
			{
				this.$nextTick(() => {
					const input = this.$refs[`renameCollectionInput-${value}`];
					const el = Array.isArray(input) ? input[0] : input;
					if (el)
					{
						el.focus();
						el.select();
					}
				});
			}
		},
		// The panel of sections replaces the rail whole, so every section in it is drawn anew - and Vue
		// runs the enter transition of each, because the transition itself is new too. There is nothing
		// to open here: the sections were left as they stand, and one of them opening marks the panel, at
		// which point every section still finding its share is carried to it over 275ms instead of being
		// drawn at it. Set before the render (a watcher runs ahead of it) and cleared once it is over.
		'state.sidebarCollapsed': function(collapsed)
		{
			if (collapsed)
			{
				return;
			}

			this.sectionsAppearing = true;
			this.$nextTick(() => {
				this.sectionsAppearing = false;
				// The shares of a panel just drawn are published by a pass a frame away, and until it runs
				// every section stands at the height its own content gives it. Here instead, in the tick the
				// sections are in the document and before the frame is painted, so the panel is drawn at its
				// shares rather than stepping to them.
				if (this.$el instanceof HTMLElement)
				{
					this.refreshSectionFloors(this.$el);
				}
			});
		},
		// A load already in flight makes the pump a no-op, and the sentinel stays visible without
		// changing state, so nothing would re-arm it. Its completion is that re-arm.
		'state.sharedLoading': function(value)
		{
			if (!value)
			{
				void this.pumpSharedSection();
			}
		},
	},
	methods: {
		onSearchNavigateDocument(payload): void
		{
			const documentId = Number(payload?.documentId);
			if (documentId > 0)
			{
				// Direct click on a quick-search result.
				NoteAnalytics.documentViewed('search');
				this.actions.openDocument({ id: documentId });
			}
		},
		onSearchNavigateSearch(payload): void
		{
			const query = String(payload?.query || '');
			if (query.length > 0)
			{
				// "Show all results" gesture navigating to the full search page.
				NoteAnalytics.searchResult(true);
				this.actions.navigateToSearch(query);
			}
		},
		onSidebarResizeStart(event: MouseEvent): void
		{
			if (!(event instanceof MouseEvent) || event.button !== 0)
			{
				return;
			}

			if (!Type.isFunction(this.actions.setSidebarWidth))
			{
				return;
			}

			if (this.state.sidebarCollapsed)
			{
				return;
			}

			event.preventDefault();
			this.isSidebarResizing = true;
			this.sidebarResizeStartX = event.clientX;
			this.sidebarResizeStartWidth = Number(this.state.sidebarWidth) || 280;

			Dom.addClass(document.body, 'note-sidebar-resizing');
			Event.bind(document, 'mousemove', this.onSidebarResizeMove);
			Event.bind(document, 'mouseup', this.onSidebarResizeEnd);
			Event.bind(window, 'blur', this.onSidebarResizeCancel);
		},
		// Hover of the handle, published for the header: while a drag is on, the pointer may leave the
		// handle and the boundary must stay lit, so the drag class is the one that decides then.
		onSidebarResizeHover(over: boolean): void
		{
			if (over)
			{
				Dom.addClass(document.body, 'note-sidebar-resize-hover');

				return;
			}

			Dom.removeClass(document.body, 'note-sidebar-resize-hover');
		},
		onSidebarResizeMove(event: MouseEvent): void
		{
			if (!this.isSidebarResizing || !Type.isFunction(this.actions.setSidebarWidth))
			{
				return;
			}

			const deltaX = event.clientX - this.sidebarResizeStartX;
			const nextWidth = this.sidebarResizeStartWidth + deltaX;
			this.actions.setSidebarWidth(nextWidth);
		},
		onSidebarResizeEnd(): void
		{
			if (!this.isSidebarResizing)
			{
				return;
			}

			if (Type.isFunction(this.actions.saveSidebarWidth))
			{
				this.actions.saveSidebarWidth(this.state.sidebarWidth);
			}

			this.clearSidebarResizeState();
		},
		onSidebarResizeCancel(): void
		{
			if (!this.isSidebarResizing)
			{
				return;
			}

			this.clearSidebarResizeState();
		},
		clearSidebarResizeState(): void
		{
			this.isSidebarResizing = false;
			Dom.removeClass(document.body, 'note-sidebar-resizing');
			Event.unbind(document, 'mousemove', this.onSidebarResizeMove);
			Event.unbind(document, 'mouseup', this.onSidebarResizeEnd);
			Event.unbind(window, 'blur', this.onSidebarResizeCancel);
		},
		// The rail's search entry expands the panel and asks for the caret: with the field only
		// rendered in the expanded panel, focus has to wait for that render.
		onRailExpand(payload: ?Object): void
		{
			this.onToggleSidebarCollapsed();
			if (!payload?.focusSearch || this.state.sidebarCollapsed)
			{
				return;
			}

			this.$nextTick(() => {
				this.$refs.searchRow?.focusInput();
			});
		},
		onToggleSidebarCollapsed(): void
		{
			if (!Type.isFunction(this.actions.toggleSidebarCollapsed))
			{
				return;
			}

			this.clearSidebarResizeState();
			const isCollapsed = Boolean(this.actions.toggleSidebarCollapsed());
			if (Type.isFunction(this.actions.saveSidebarState))
			{
				this.actions.saveSidebarState({
					width: this.state.sidebarWidth,
					collapsed: isCollapsed,
				});
			}
		},
		getSidebarToggleLabel(): string
		{
			return this.state.sidebarCollapsed
				? Loc.getMessage('NOTE_SIDEBAR_TOGGLE_EXPAND')
				: Loc.getMessage('NOTE_SIDEBAR_TOGGLE_COLLAPSE')
			;
		},
		// Room the row's controls need at the right edge, so the measure pass stops the title
		// short of them instead of letting it slide underneath.
		collectionNameReserve(collection: Collection): string
		{
			return rowNameReserve({ isFavorite: this.isCollectionFavorite(collection) });
		},
		isCollectionFavorite(collection: Collection): boolean
		{
			return this.state.favorites.isFavorite('collection', Number(collection?.id));
		},
		collectionFavoriteLabel(collection: Collection): string
		{
			return this.isCollectionFavorite(collection)
				? this.messages.favoriteOff
				: this.messages.favoriteOn
			;
		},
		onToggleCollectionFavorite(collection: Collection, event: Event): void
		{
			event.stopPropagation();
			void this.actions.toggleFavorite(
				{ entityType: 'collection', entityId: Number(collection?.id) },
				// What the row already knows, so the block draws it at once instead of after a read.
				{ title: String(collection?.name ?? '') },
			);
		},
		// Star of a tree row - passed down the recursive TreeNode instead of read there, so the store
		// stays the only owner of the state.
		isDocumentFavorite(doc: Object): boolean
		{
			return this.state.favorites.isFavorite('document', Number(doc?.id));
		},
		toggleDocumentFavorite(doc: Object, hint: Object | null = null): void
		{
			void this.actions.toggleFavorite(
				{ entityType: 'document', entityId: Number(doc?.id) },
				// The row of the tree carries everything a row of the block needs except the values the
				// server assigns, so the block draws it at once instead of after a read.
				{
					...hint,
					title: String(doc?.title ?? ''),
					collectionId: Number(doc?.collectionId),
					parentId: doc?.parentId ?? null,
					hasChildren: doc?.hasChildren === true,
				},
			);
		},
		onOpenFavorite(item): void
		{
			if (item?.entityType === 'collection')
			{
				this.onCollectionPlateClick({ id: Number(item.entityId), name: String(item.title ?? '') });

				return;
			}

			NoteAnalytics.documentViewed('side_menu');
			this.actions.openDocument({ id: Number(item.entityId) });
		},
		// The scrollbar thumbs are shown for one area at a time - the one the pointer is over.
		// Sitting on the area's own scrollbar counts: a hit there reports the area itself.
		syncPointerScrollArea(event: Event): void
		{
			const target = event.target instanceof Element ? event.target : null;
			const area = target ? target.closest('.tree-scroll') : null;
			const next = area instanceof HTMLElement ? area : null;
			if (next === this.pointerScrollArea)
			{
				return;
			}

			this.clearPointerScrollArea();
			this.pointerScrollArea = next;
			if (next)
			{
				next.classList.add('is-pointer-inside');
			}
		},
		// Shows the bar of the area being scrolled and takes it away once the scrolling stops. This is what
		// a touch screen has instead of the pointer condition above: a finger reports its position only
		// while it is down, so a bar tied to the pointer showed up under a finger resting on the list and
		// was gone the moment it lifted - the one time the bar has something to say is while the list moves.
		flashScrollbar(target: EventTarget): void
		{
			const area = target instanceof Element ? target.closest('.tree-scroll') : null;
			if (!(area instanceof HTMLElement))
			{
				return;
			}

			area.classList.add('is-scrolling');
			clearTimeout(this.scrollFlashTimers.get(area));
			this.scrollFlashTimers.set(area, setTimeout(() => {
				area.classList.remove('is-scrolling');
				this.scrollFlashTimers.delete(area);
			}, SCROLLBAR_FLASH_MS));
		},
		clearPointerScrollArea(): void
		{
			if (this.pointerScrollArea)
			{
				this.pointerScrollArea.classList.remove('is-pointer-inside');
				this.pointerScrollArea = null;
			}
		},
		// Both axes of a tree area come through here: the panel itself no longer scrolls, so this is
		// also where paging on approach to the end of a list is decided.
		onTreeAreaScroll(event: Event): void
		{
			const target = event.target;
			// What the measure pass writes answers to the horizontal offset alone, so scrolling a list
			// down changes nothing in it. Run on every frame of every scroll it re-measured every row
			// of every area of the panel for nothing.
			if (target instanceof HTMLElement && this.hasAreaScrolledSideways(target))
			{
				this.scheduleTreeMetrics();
			}

			this.onScrollDuringDrag();

			if (!(target instanceof HTMLElement))
			{
				return;
			}

			// Scroll fires several times per frame, and the sentinel walk below measures every
			// sentinel — each measurement forces a layout flush. One pass per frame is as often as
			// the answer can change, so extra events are dropped rather than queued.
			if (this.sidebarScrollRaf)
			{
				return;
			}

			this.sidebarScrollRaf = requestAnimationFrame(() => {
				this.sidebarScrollRaf = 0;
				this.processSidebarScroll(target);
			});
		},
		// Horizontal offset of an area as the measure pass last saw it. Areas as keys in a weak map, so
		// an area that goes away with its section takes its entry with it.
		hasAreaScrolledSideways(area: HTMLElement): boolean
		{
			const offset = area.scrollLeft;
			if (this.treeScrollLeft.get(area) === offset)
			{
				return false;
			}

			this.treeScrollLeft.set(area, offset);

			return true;
		},
		scheduleTreeMetrics(): void
		{
			if (this.treeMetricsRaf)
			{
				return;
			}

			this.treeMetricsRaf = requestAnimationFrame(() => {
				this.treeMetricsRaf = 0;
				this.refreshTreeMetrics();
			});
		},
		// Kept apart from the pass above, which runs on every scroll frame: the shares answer to WHAT the
		// panel holds, not to where a list is scrolled. Recounted on a scroll they moved the section under
		// the finger every time scrolling brought in another page of rows.
		//
		// Once per change, never per frame. What a section opening or closing changes is known the moment
		// it starts - the shares of the layout it ends in - and the stylesheet carries the sections there
		// over the time the motion takes. Counted every frame instead, the arithmetic itself became the
		// animation: rounding, a guard against rewriting a share by a hair, and a section measured while
		// in motion each turned what should be one glide into steps of their own size.
		// The shares are frozen for as long as a row is being dragged (see refreshSectionFloors), so the
		// layout the drop ends in is published here, once, when the drag is over - and published with the
		// panel marked, so the sections move to it over the same transition they open with instead of
		// stepping there in one frame.
		syncDragSectionShares(): void
		{
			const dragging = this.isAnyDragActive();
			if (dragging === this.sectionSharesDragging)
			{
				return;
			}

			this.sectionSharesDragging = dragging;
			if (dragging)
			{
				return;
			}

			const root = this.$el;
			if (!(root instanceof HTMLElement))
			{
				return;
			}

			const panel = root.querySelector('.sidebar-sections');
			if (!(panel instanceof HTMLElement))
			{
				return;
			}

			// Marked first, so the sections move to the shares published below over the transition they
			// open with; the mark lasts the length of the motion, so the passes that follow - a branch
			// rendered, a page of a list loaded - land through it too and not beside it.
			markSectionMotion(panel, SECTION_SHARE_MS);
			this.refreshSectionFloors(root);
		},
		scheduleSectionShares(): void
		{
			if (this.sectionSharesRaf)
			{
				return;
			}

			this.sectionSharesRaf = requestAnimationFrame(() => {
				this.sectionSharesRaf = 0;
				if (this.$el instanceof HTMLElement)
				{
					this.refreshSectionFloors(this.$el);
				}
			});
		},
		// Room the controls of this row take at the visible edge, for a device that shows them all at once.
		// Their box reaches further left than the buttons do - that overhang is where the fade is painted,
		// and a title is welcome to run under it, which is what the fade is for. The box ends at the edge
		// the cap is measured to, so the reserve is the whole of it less that overhang.
		// One measurement per shape of row, not per row: every document row with a bell has controls of
		// the same width, and the pass may walk hundreds of them.
		measureControlsReserve(name: HTMLElement, cache: Map<string, number>): number
		{
			const row = name.closest('.tree-row, .collection-row, .favorite-row');
			const box = row?.querySelector('.tree-actions, .collection-actions, .favorite-row__actions');
			if (!(box instanceof HTMLElement))
			{
				return 0;
			}

			const shape = `${box.className}:${box.childElementCount}`;
			const known = cache.get(shape);
			if (known !== undefined)
			{
				return known;
			}

			const overhang = Number.parseFloat(getComputedStyle(box).paddingLeft) || 0;
			const reserve = Math.max(0, box.getBoundingClientRect().width - overhang);
			cache.set(shape, reserve);

			return reserve;
		},
		// One pass per frame over every tree area: publishes the visible width for the highlight
		// pill, caps each title at the visible right edge (minus the room its controls need) and
		// marks rows whose title has scrolled out of sight for the level hint to take over.
		// Every measurement is taken before anything is written, so the pass costs one layout flush
		// instead of one per row: a write between two reads makes the browser lay the panel out again
		// before the second read can answer. Nothing written here moves a title - the highlight pill is
		// out of flow, the travelling copy sits in a zero-width sticky box and the gutter reaches
		// section headers only - so the measurements stay true across the writes that follow.
		refreshTreeMetrics(): void
		{
			const root = this.$el;
			if (!(root instanceof HTMLElement) || !root.isConnected)
			{
				return;
			}

			// The title ends before the visible right edge on every device. Without hover it used not to:
			// the controls rode with the row back then, nothing stood over the title and it could keep its
			// natural width. Held to the edge as they are now, an uncapped title runs under them - and past
			// them, into the inset they keep from the edge, where it shows up outside the row's own pill.
			const capTitles = true;
			// How much of that edge the controls need. On a hover device it is what the row declares, which
			// is little - the buttons show under the pointer and the fade dissolves the tail beneath them.
			// Without hover they are all on screen at all times, so the answer is the width of the box they
			// stand in. Measured once per shape - a row with a bell holds one button more than one without -
			// and reused for every row of that shape.
			const touchReserves = controlsAlwaysVisible() ? new Map() : null;

			// Every section scrolls in an area of the same kind, the block included, so one selector
			// reaches them all: without its own --kb-vw the highlight pill of a row falls back to the
			// width of its zero-width holder and the row hovers differently from section to section.
			const areas = [];
			for (const area of root.querySelectorAll('.tree-scroll'))
			{
				if (!(area instanceof HTMLElement))
				{
					continue;
				}

				// One lane at the right is kept clear for the scroll bar. Where the bar is an overlay painted
				// over the content - a touch device - it would otherwise lie across the last tile, so the
				// pill, the fade and the row controls are all measured to end this much short of the
				// scrollport and the bar is left that strip to itself. Zero on a device whose bar takes its
				// own width beside the content, where `scrollbar-gutter` reserves the room instead.
				const lane = Number.parseFloat(getComputedStyle(area).getPropertyValue('--note-scroll-lane')) || 0;
				const visibleWidth = area.clientWidth - lane;

				// A collapsed section measures zero wide (less the lane). Publishing that would cap every
				// title and every line of prose inside it at nothing, so the section would open at the
				// height of text broken letter by letter.
				if (visibleWidth <= 0)
				{
					continue;
				}

				const areaRect = area.getBoundingClientRect();
				const rightLimit = areaRect.left + visibleWidth;

				const names = [];
				for (const name of area.querySelectorAll('[data-kb-name]'))
				{
					if (!(name instanceof HTMLElement))
					{
						continue;
					}

					const rect = name.getBoundingClientRect();
					const row = name.closest('.tree-row, .collection-row, .favorite-row');
					const reserve = touchReserves === null
						? Number.parseFloat(name.dataset.kbName) || 0
						: this.measureControlsReserve(name, touchReserves)
					;
					// One pixel of slack under the visible right edge. Capped exactly at the edge, the
					// row's content came out the width of the area to the pixel, and then rounding alone
					// decided whether the horizontal bar shows up - it appeared and vanished on a hair's
					// breadth of panel width. Overflow now comes only from the row's own floor (indent
					// plus the title slot), which is what makes deep levels reachable by panning.
					// Measured at the title's place in the list, not where the panning has carried it:
					// `rect.left` moves in by whatever the area is scrolled, so `+ scrollLeft` puts the
					// measurement back where the row sits. Without it the cap grew with every pixel panned,
					// the title widened as it was scrolled to and the row with it - the scrollable width
					// climbed in step with the scroll, so the end kept receding and, worse, the content
					// resized on every frame of the gesture. Resizing a scroller mid-scroll stalls momentum
					// in the iOS app WebView: the list froze under the finger. Fixed to its slot the title
					// ellipsises instead of unfurling as it is panned, and the width holds still.
					const edgeCap = Math.floor(rightLimit - reserve - rect.left - area.scrollLeft - 1);
					// The slot the row's own level was promised, which is the whole point of the row
					// standing wider than the area: a level deep enough to start past the visible edge got
					// an edge cap of nothing and wore its title down to one letter, with the room it was
					// promised sitting unused to the right of it and panning to it changing nothing. The
					// floor states that promise (`min-width`: indent plus the title slot), so it is read
					// off the row instead of counted here again, and the title's place inside the row -
					// `offsetLeft`, against the row it is positioned by, the same box the stretched link
					// answers to - is taken off it along with the room the controls keep at the end.
					// Both terms belong to the row rather than to the scrollport, so the cap holds still
					// while the list is panned, exactly as the one above it does.
					// The room the controls keep comes off the slot only where they lie over the title: on a
					// hover device they are out of the row's flow and hold to the visible edge, so the tail of
					// a title reaching the end of the row would run under them. Where they never leave they
					// stand in the flow after the title instead, and the row grows by their width - taking it
					// off the slot as well would charge the title for them twice.
					const floor = row instanceof HTMLElement
						? Number.parseFloat(getComputedStyle(row).minWidth) || 0
						: 0;
					const slotCap = Math.floor(floor - name.offsetLeft - (touchReserves === null ? reserve : 0));
					const cap = Math.max(16, slotCap, edgeCap);
					// The cap moves the right edge of the title and nothing else, so where the title
					// ends up is arithmetic on what has just been read - the mark needs no second walk
					// over the rows with the layout recomputed for it.
					const right = capTitles ? Math.min(rect.right, rect.left + cap) : rect.right;

					names.push({
						element: name,
						// The level hint belongs to document rows alone, so only those carry the mark.
						row: row instanceof HTMLElement && row.hasAttribute('data-tree-row') ? row : null,
						maxWidth: capTitles ? `${cap}px` : '',
						isOff: right <= areaRect.left + 1 || rect.left >= rightLimit - 1,
					});
				}

				areas.push({
					area,
					visibleWidth,
					// The strip the bar wants off the right edge - the width a classic bar reserves beside the
					// content, or the lane kept clear for an overlay one. The rows inside end before it; the
					// section headers above them run the full width, so a control in a header would stand
					// that much further right than the controls of every row under it unless it is inset by
					// the same amount. Measured as the box less the width just published, read back by the
					// header in the stylesheet.
					gutter: Math.max(0, area.offsetWidth - visibleWidth),
					names,
				});
			}

			// Writes only, and only where the value actually moved: a title whose cap has not changed is
			// left alone rather than restyled every frame.
			for (const { area, visibleWidth, gutter, names } of areas)
			{
				const areaWidth = `${visibleWidth}px`;
				if (area.style.getPropertyValue('--kb-vw') !== areaWidth)
				{
					area.style.setProperty('--kb-vw', areaWidth);
				}

				const gutterWidth = `${gutter}px`;
				if (root.style.getPropertyValue('--note-area-gutter') !== gutterWidth)
				{
					root.style.setProperty('--note-area-gutter', gutterWidth);
				}

				for (const { element, row, maxWidth, isOff } of names)
				{
					if (element.style.maxWidth !== maxWidth)
					{
						element.style.maxWidth = maxWidth;
					}

					const mark = isOff ? '1' : '0';
					if (row instanceof HTMLElement && row.dataset.kbNameOff !== mark)
					{
						row.dataset.kbNameOff = mark;
					}
				}
			}
		},
		// How much of the panel each open section keeps. Flex alone cannot answer this: shrink is shared
		// out in proportion to how much a section HOLDS, so the longest list always wins and every other
		// section is squeezed to nothing - whichever section carries the outsized factor, the one across
		// from it is the one that loses. The share is fair instead: a section gets its content or an even
		// slice of the room, whichever is smaller, and what a short section does not need goes to the
		// others (largest-remainder fill, shortest section served first). Below SECTION_FLOOR_ROWS rows
		// nothing is served at all - the panel scrolls instead, which is what `.sidebar-sections` is for.
		// `hint` is what a branch opening or closing inside a section is about to add to it or take from it,
		// in pixels, before it has: a section only makes room for a branch in step with the branch if the
		// share it is heading for already counts what the branch will hold.
		refreshSectionFloors(root: HTMLElement, hint: ?Object = null): void
		{
			const container = root.querySelector('.sidebar-sections');
			if (!(container instanceof HTMLElement))
			{
				return;
			}

			// While a row is being dragged the shares stand still. A drag changes what the panel holds - a
			// branch opens under the pointer, a row is counted out of the branch it is leaving - and a share
			// published then carries no transition, so the section stepped 30px down the moment the row was
			// picked up and 30px back when it was dropped, both in a single frame. The layout the drop ends
			// in is published once the drag is over, through the same transition the sections open with.
			if (root.classList.contains('is-dragging'))
			{
				return;
			}

			const items = [];
			for (const section of root.querySelectorAll('.collection-list'))
			{
				const rows = section.querySelector('.tree-scroll__inner');
				if (!(section instanceof HTMLElement) || !(rows instanceof HTMLElement))
				{
					continue;
				}

				// A section on its way out is counted out of the panel from the moment it starts leaving: the
				// room it still holds is room the others are about to get, and they may as well be on their way
				// into it while it empties. Counted by what it holds until it was gone, it handed the room over
				// in one step at the very end.
				if (section.dataset.expandLeaving)
				{
					continue;
				}

				// Measured from the row box, never from the area's own scrollHeight: that one reports the
				// height of the AREA once the area is the taller of the two, and a short list would hold
				// a band of empty space open under it. A line of prose - an empty section, a failed load -
				// sits beside the rows and is content of the section just the same.
				// Fractional heights, not `offsetHeight`: that one rounds, and a row box measured a
				// fraction short of what it holds leaves the area a pixel to scroll - a section with
				// nothing to scroll could be nudged up and down by it.
				let content = rows.getBoundingClientRect().height;
				for (const prose of section.querySelectorAll('.sidebar-muted--flow'))
				{
					content += prose instanceof HTMLElement ? prose.getBoundingClientRect().height : 0;
				}

				// The padding of the scrolling area belongs to the height the section needs. Without it a
				// list with room to spare still ended a few pixels short of its own contents, and a
				// section with nothing to scroll could be nudged up and down by exactly that much.
				const area = rows.closest('.tree-scroll');
				if (area instanceof HTMLElement)
				{
					const areaStyle = getComputedStyle(area);
					content += (Number.parseFloat(areaStyle.paddingTop) || 0)
						+ (Number.parseFloat(areaStyle.paddingBottom) || 0)
					;

					// The horizontal scrollbar stands INSIDE the area and takes its height off the room the rows
					// have - unlike the vertical one, whose width `scrollbar-gutter: stable` reserves whether it
					// is there or not. Counted out, a section was served exactly its content and the bar then ate
					// the last few pixels of it: every section with a title too long to fit ended up scrollable
					// down by the height of the bar, and a hover that nudged a row into view bounced it.
					content += area.offsetHeight - area.clientHeight;
				}

				const hinted = hint?.section === section && Type.isNumber(hint.growth);
				if (hinted)
				{
					content += hint.growth;
				}

				// A branch opening or closing inside the section was measured half-way there by any pass that
				// happened to run - a row rendered, a page of the list loaded - and the share the section was
				// already heading for was overwritten with one counted from a branch at no height at all. Then
				// the branch stood at its own height and the share came back in one step. While something in
				// there moves, the section keeps the share it was given when the motion started: it is the
				// share of the layout the motion ends in, which is where the section is on its way to anyway.
				const frozen = !hinted && section.querySelector('.is-expand-animating') !== null;

				items.push({
					section,
					frozen,
					content: frozen
						? (Number.parseFloat(section.style.getPropertyValue('--note-section-floor')) || content)
						: Math.max(0, content),
				});
			}

			if (items.length === 0)
			{
				return;
			}

			// The room the lists share: the panel less its section headers, dividers and everything else in
			// the column. Fractional heights and rounded UP, both on purpose: `offsetHeight` rounds each
			// child to the nearest pixel, and half a pixel under-counted per child - eight of them in this
			// column - came back as a panel overflowing by a few pixels. Too little to see, enough to be
			// scrollable, and on a screen with a fractional pixel ratio there is such a remainder on every
			// row. Margins count too: the dividers carry them and the box does not, and flex items never
			// collapse margins, so summing them is exact.
			let fixed = 0;
			for (const child of container.children)
			{
				if (!(child instanceof HTMLElement) || child.classList.contains('collection-list'))
				{
					continue;
				}

				const style = getComputedStyle(child);
				fixed += child.getBoundingClientRect().height
					+ (Number.parseFloat(style.marginTop) || 0)
					+ (Number.parseFloat(style.marginBottom) || 0)
				;
			}

			const style = getComputedStyle(container);
			fixed += (Number.parseFloat(style.paddingTop) || 0) + (Number.parseFloat(style.paddingBottom) || 0);

			// Two pixels per section are spoken for below, where each share is rounded UP (one) and then
			// given a spare pixel (two). Left in the pot, they come back as a panel overflowing by a hair -
			// too little to see, enough to be scrollable, and it was scrollable by exactly one pixel.
			let remaining = Math.max(0, container.clientHeight - Math.ceil(fixed) - (items.length * 2));
			let unserved = items.length;
			const minimum = SECTION_FLOOR_ROWS * SECTION_ROW_HEIGHT;
			for (const item of [...items].sort((a, b) => a.content - b.content))
			{
				item.floor = Math.min(item.content, Math.max(remaining / unserved, minimum));
				remaining = Math.max(0, remaining - item.floor);
				unserved -= 1;
			}

			// Written in one go, after every read: the share of one section moves the others.
			for (const { section, floor, frozen } of items)
			{
				// Held at what it was given when the motion inside it started, and counted at that same
				// value above, so the sections around it are shared out against the room it really keeps.
				if (frozen)
				{
					continue;
				}

				// Inherited by the scrolling area inside, which carries the same floor. Rounded up and then
				// one pixel over: half a pixel short of the content is still something to scroll, and a
				// section with nothing to scroll that can be nudged up and down by a pixel reads as broken.
				// The spare pixel is under the last row, where nothing shows it.
				const value = floor > 0 ? Math.ceil(floor) + 1 : 0;
				const current = Number.parseFloat(section.style.getPropertyValue('--note-section-floor'));
				if (current === value || (value === 0 && !Number.isFinite(current)))
				{
					continue;
				}

				// Nothing to serve is published as no share at all, not as a share of zero: the section is
				// sized by what it holds then, both at rest and while the panel is in motion, where the share
				// is the height itself and a zero would collapse a section whose content could not be
				// measured - one still loading, for instance.
				if (value === 0)
				{
					section.style.removeProperty('--note-section-floor');

					continue;
				}

				section.style.setProperty('--note-section-floor', `${value}px`);
			}
		},
		processSidebarScroll(target: HTMLElement): void
		{
			if (!target.isConnected)
			{
				return;
			}

			const offsetToBottom = target.scrollHeight - (target.scrollTop + target.clientHeight);
			// The next window of root collections belongs to the collections tree: the accessible-tree
			// area reaching its own end says nothing about it.
			if (
				offsetToBottom <= 64
				&& this.state.collectionsSectionExpanded
				&& target.classList.contains('tree-scroll--collections')
			)
			{
				void this.actions.loadMoreCollections();
			}

			this.tryAutoLoadDocuments(target);
			this.tryAutoLoadShared(target);
			this.tryAutoLoadSharedChildren(target);
		},
		tryAutoLoadDocuments(container: HTMLElement): void
		{
			const sentinels = container.querySelectorAll('.js-doc-load-more-sentinel:not([data-tree-namespace="shared"])');
			if (sentinels.length === 0)
			{
				return;
			}

			const containerRect = container.getBoundingClientRect();
			for (const sentinel of sentinels)
			{
				if (!(sentinel instanceof HTMLElement))
				{
					continue;
				}

				const rect = sentinel.getBoundingClientRect();
				if (rect.bottom < containerRect.top - 24 || rect.top > containerRect.bottom + 24)
				{
					continue;
				}

				const collectionId = Number(sentinel.dataset.collectionId);
				if (!Number.isFinite(collectionId) || collectionId <= 0)
				{
					continue;
				}

				const rawParentId = sentinel.dataset.parentId || '';
				const parentId = rawParentId === 'root' ? null : Number(rawParentId);
				if (rawParentId !== 'root' && (!Number.isFinite(parentId) || parentId <= 0))
				{
					continue;
				}

				const hasNext = parentId === null
					? this.state.hasRootNextPage(collectionId)
					: this.state.hasNextChildren(collectionId, parentId);
				if (!hasNext)
				{
					continue;
				}

				const isLoading = parentId === null
					? this.state.isRootLoading(collectionId)
					: this.state.isLoadingChildren(collectionId, parentId);
				if (isLoading)
				{
					continue;
				}

				void this.actions.loadMoreChildren({
					collectionId,
					id: parentId,
				});

				break;
			}
		},
		collectionDropClass(collection: Collection): string
		{
			const target = this.state.collectionDropTarget;
			if (!target || Number(target.id) !== Number(collection.id))
			{
				return '';
			}

			if (target.placement === 'before')
			{
				return 'is-drop-before';
			}

			if (this.actions.isCollectionExpanded(collection.id))
			{
				return '';
			}

			return 'is-drop-after';
		},
		isCollectionDropAfterExpanded(collection: Collection): boolean
		{
			const target = this.state.collectionDropTarget;
			if (!target || Number(target.id) !== Number(collection.id))
			{
				return false;
			}

			return target.placement === 'after' && this.actions.isCollectionExpanded(collection.id);
		},
		onContentDragOver(event: DragEvent): void
		{
			this.actions.onSidebarFileDragOver(event);
			this.actions.onCollectionViewportDragOver(event);
			this.actions.onDocViewportDragOver(event);
		},
		onContentDrop(event: DragEvent): void
		{
			this.stopDragAutoScroll();
			// Unconditional: a drop on background/between rows must not leave fileDragItem stuck.
			this.actions.clearFileDrag();
			this.actions.onCollectionViewportDrop(event);
			this.actions.onDocViewportDrop(event);
		},
		isAnyDragActive(): boolean
		{
			return (
				Boolean(this.state.docDragItem)
				|| Boolean(this.state.collectionDragItem)
				|| Boolean(this.state.fileDragItem)
				// [P3] A row of the favorites block is dragged inside the block, whose list scrolls on
				// its own - without this the auto-scroll never starts and a row cannot be carried past
				// the visible part of the block.
				|| Boolean(this.state.favorites.dragItem)
			);
		},
		isFileDropInsideCollection(collection: Collection): boolean
		{
			const target = this.state.fileDropTarget;

			return Boolean(
				target
				&& Number(target.collectionId) === Number(collection.id)
				&& target.parentId === null,
			);
		},
		onDragOverCapture(event: DragEvent): void
		{
			if (this.dispatchingSyntheticDragOver)
			{
				return;
			}

			if (!this.isAnyDragActive())
			{
				this.stopDragAutoScroll();

				return;
			}

			this.dragLastClientX = event.clientX;
			this.dragLastClientY = event.clientY;
			this.updateDragAutoScrollSpeed();
		},
		onScrollDuringDrag(): void
		{
			if (!this.isAnyDragActive())
			{
				return;
			}

			if (typeof this.actions.invalidateDndRectCache === 'function')
			{
				this.actions.invalidateDndRectCache();
			}
		},
		// The scroller is no longer the panel but the tree area the pointer is over. Past its bottom
		// edge - over "Archive", say - there is nothing under the pointer to resolve, and the tree the
		// drag is heading out of is the one that has to keep scrolling.
		getDragScrollContainer(): ?HTMLElement
		{
			const root = this.$el;
			if (!(root instanceof HTMLElement))
			{
				return null;
			}

			// A row of the block never leaves the block, so the block's own list is the only scroller
			// then: scrolling the tree of knowledge bases underneath would move a surface the drag
			// cannot drop on anyway.
			if (this.state.favorites.dragItem)
			{
				const list = root.querySelector('.tree-scroll--favorites');

				return list instanceof HTMLElement ? list : null;
			}

			const under = document.elementFromPoint(this.dragLastClientX, this.dragLastClientY);
			const area = under instanceof Element ? under.closest('.tree-scroll') : null;
			if (area instanceof HTMLElement && root.contains(area))
			{
				return area;
			}

			const collections = root.querySelector('.tree-scroll--collections');

			return collections instanceof HTMLElement ? collections : null;
		},
		updateDragAutoScrollSpeed(): void
		{
			const content = this.getDragScrollContainer();
			if (!content)
			{
				return;
			}

			const rect = content.getBoundingClientRect();
			const EDGE = 56;
			const MAX_SPEED = 2;
			let speed = 0;

			if (this.dragLastClientY < rect.top + EDGE && content.scrollTop > 0)
			{
				const ratio = Math.min(1, (rect.top + EDGE - this.dragLastClientY) / EDGE);
				speed = -Math.max(1, Math.ceil(ratio * MAX_SPEED));
			}
			else if (
				this.dragLastClientY > rect.bottom - EDGE
				&& content.scrollTop + content.clientHeight < content.scrollHeight
			)
			{
				const ratio = Math.min(1, (this.dragLastClientY - (rect.bottom - EDGE)) / EDGE);
				speed = Math.max(1, Math.ceil(ratio * MAX_SPEED));
			}

			this.dragAutoScrollSpeed = speed;
			if (speed !== 0)
			{
				this.runDragAutoScrollFrame();
			}
		},
		runDragAutoScrollFrame(): void
		{
			if (this.dragAutoScrollRaf !== 0)
			{
				return;
			}

			this.dragAutoScrollRaf = requestAnimationFrame(() => {
				this.dragAutoScrollRaf = 0;
				if (!this.isAnyDragActive() || this.dragAutoScrollSpeed === 0)
				{
					return;
				}

				const content = this.getDragScrollContainer();
				if (!content)
				{
					return;
				}

				const before = content.scrollTop;
				content.scrollTop = before + this.dragAutoScrollSpeed;
				if (content.scrollTop !== before)
				{
					this.refireDragOverAtLastPos();
				}

				this.updateDragAutoScrollSpeed();
			});
		},
		refireDragOverAtLastPos(): void
		{
			const el = document.elementFromPoint(this.dragLastClientX, this.dragLastClientY);
			if (!el)
			{
				return;
			}

			const evt = new DragEvent('dragover', {
				bubbles: true,
				cancelable: true,
				clientX: this.dragLastClientX,
				clientY: this.dragLastClientY,
			});
			this.dispatchingSyntheticDragOver = true;
			try
			{
				el.dispatchEvent(evt);
			}
			finally
			{
				this.dispatchingSyntheticDragOver = false;
			}
		},
		stopDragAutoScroll(): void
		{
			this.dragAutoScrollSpeed = 0;
			if (this.dragAutoScrollRaf !== 0)
			{
				cancelAnimationFrame(this.dragAutoScrollRaf);
				this.dragAutoScrollRaf = 0;
			}
		},
		onCollectionRowDragOver(collection: Collection, event: DragEvent): void
		{
			if (event.dataTransfer?.types?.includes('Files'))
			{
				event.preventDefault();
				this.actions.onFileDragOverCollection(collection);

				return;
			}

			if (this.state.docDragItem)
			{
				this.actions.onDocCollectionDragOver(collection, event);

				return;
			}

			this.actions.onCollectionDragOver(collection, event);
		},
		async onCollectionRowDrop(collection: Collection, event: DragEvent): Promise<void>
		{
			if (event.dataTransfer?.types?.includes('Files'))
			{
				event.preventDefault();
				await this.actions.onFileDropOnCollection(collection, event);

				return;
			}

			if (this.state.docDragItem)
			{
				this.actions.onDocCollectionDrop(collection, event);

				return;
			}

			this.actions.onCollectionDrop(collection, event);
		},
		onRootBranchDragEnter(collection: Collection, event: DragEvent): void
		{
			if (!this.state.docDragItem)
			{
				return;
			}

			this.actions.onDocBranchDragEnter({
				branchElement: event.currentTarget,
				collectionId: collection.id,
				parentId: null,
				nativeEvent: event,
			});
		},
		onRootBranchDragOver(collection: Collection, event: DragEvent): void
		{
			if (!this.state.docDragItem)
			{
				return;
			}

			this.actions.onDocBranchDragOver({
				branchElement: event.currentTarget,
				collectionId: collection.id,
				parentId: null,
				nativeEvent: event,
			});
		},
		onRootBranchDrop(collection: Collection, event: DragEvent): void
		{
			if (!this.state.docDragItem)
			{
				return;
			}

			this.actions.onDocBranchDrop({
				branchElement: event.currentTarget,
				collectionId: collection.id,
				parentId: null,
				nativeEvent: event,
			});
		},
		onNestedBranchDragEnter(payload: Object): void
		{
			if (!this.state.docDragItem)
			{
				return;
			}

			this.actions.onDocBranchDragEnter(payload);
		},
		onNestedBranchDragOver(payload: Object): void
		{
			if (!this.state.docDragItem)
			{
				return;
			}

			this.actions.onDocBranchDragOver(payload);
		},
		onNestedBranchDrop(payload: Object): void
		{
			if (!this.state.docDragItem)
			{
				return;
			}

			this.actions.onDocBranchDrop(payload);
		},
		isDocDropInsideCollection(collection: Collection): boolean
		{
			const target = this.state.docDropTarget;
			if (!target)
			{
				return false;
			}

			return (
				target.placement === 'inside'
				&& Number(target.collectionId) === Number(collection.id)
				&& (target.targetId === null || target.targetId === undefined)
			);
		},
		canEditCollection(collection: Collection): boolean
		{
			return this.actions.canEditCollection(collection);
		},
		getCollectionTitle(collection: Collection): string | null
		{
			const title = String(collection?.name ?? '').trim();

			return title === '' ? null : title;
		},
		onCollectionDragStart(collection: Collection, event: DragEvent): void
		{
			if (!this.canEditCollection(collection))
			{
				event.preventDefault();

				return;
			}

			this.actions.startCollectionDrag(collection, event);
		},
		isRenamingCollection(collection: Collection): boolean
		{
			return this.state.renamingCollectionId === Number(collection.id);
		},
		onRenameCollectionKeyEnter(event: KeyboardEvent): void
		{
			event.target.blur();
		},
		onRenameCollectionKeyEscape(collection: Collection): void
		{
			this.renameCollectionCancelled = true;
			const input = this.$refs[`renameCollectionInput-${collection.id}`];
			const el = Array.isArray(input) ? input[0] : input;
			if (el)
			{
				el.blur();
			}
		},
		onRenameCollectionBlur(collection: Collection, event: FocusEvent): void
		{
			if (this.renameCollectionCancelled)
			{
				this.actions.cancelRenameCollection();

				return;
			}

			const value = event.target.value.trim();
			if (!value)
			{
				this.actions.cancelRenameCollection();

				return;
			}

			this.actions.confirmRenameCollection(Number(collection.id), value);
		},
		onCollectionPlateClick(collection: Collection): void
		{
			const id = Number(collection?.id);
			if (!Number.isInteger(id) || id <= 0)
			{
				return;
			}

			const isExpanded = typeof this.actions.isCollectionExpanded === 'function'
				? Boolean(this.actions.isCollectionExpanded(id))
				: false
			;
			const isCurrent = Number(this.state.selectedCollectionId) === id && !this.state.selectedDocId;
			if (isCurrent || !isExpanded)
			{
				this.actions.toggleCollectionExpanded(collection);
			}
			NoteAnalytics.collectionViewed('side_menu');
			this.actions.openCollection(collection);
			if (typeof this.actions.navigateToWorkspace === 'function')
			{
				this.actions.navigateToWorkspace(id);
			}
		},
		collectionHref(collection: Collection): string
		{
			const id = Number(collection?.id);

			return Number.isFinite(id) && id > 0 ? `/note/workspace/${id}/` : '';
		},
		onCollectionTitleClick(collection: Collection, event: MouseEvent): void
		{
			if (this.isRenamingCollection(collection))
			{
				return;
			}
			// Let the browser handle modifier keys, middle/right click natively
			if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
			{
				return;
			}
			event.preventDefault();
			this.onCollectionPlateClick(collection);
		},
		rootDocsFor(collection: Object): Object[]
		{
			return this.state.getRootDocs(Number(collection?.id));
		},
		onToggleSharedSection(): void
		{
			void this.actions.toggleSharedSection();
		},
		sharedRootDocsFor(container: Object): Object[]
		{
			return this.state.getSharedRootDocs(Number(container?.collectionId));
		},
		// Global flat pagination of the accessible tree: pull the next page when the section
		// sentinel scrolls into view (the section can sit above the collections list, so the
		// bottom-of-scroll trigger used for collections would never reach it).
		tryAutoLoadShared(container: HTMLElement): void
		{
			if (
				!this.state.sharedTreeEnabled
				|| !this.state.sharedSectionExpanded
				|| !this.state.sharedHasNextPage
				|| this.state.sharedLoading
			)
			{
				return;
			}

			const sentinel = container.querySelector('.js-shared-load-more-sentinel');
			if (!(sentinel instanceof HTMLElement))
			{
				return;
			}

			const containerRect = container.getBoundingClientRect();
			const rect = sentinel.getBoundingClientRect();
			if (rect.bottom < containerRect.top - 24 || rect.top > containerRect.bottom + 24)
			{
				return;
			}

			void this.actions.loadMoreSharedTree();
		},
		syncSharedSentinelObserver(): void
		{
			const observer = this.sharedSentinelObserver;
			if (!observer)
			{
				return;
			}

			// updated() runs on every render of a busy sidebar; skip the DOM query outright whenever
			// the sentinel provably cannot be there.
			const content = this.$refs.sidebarContent;
			const mayExist = content && this.state.sharedTreeEnabled && this.state.sharedHasNextPage;
			const sentinel = mayExist ? content.querySelector('.js-shared-load-more-sentinel') : null;
			if (sentinel === this.observedSharedSentinel)
			{
				return;
			}

			if (this.observedSharedSentinel)
			{
				observer.unobserve(this.observedSharedSentinel);
			}
			this.observedSharedSentinel = sentinel instanceof HTMLElement ? sentinel : null;
			if (this.observedSharedSentinel)
			{
				observer.observe(this.observedSharedSentinel);
			}
			else
			{
				this.sharedSentinelVisible = false;
			}
		},
		// Keeps paging the section while its sentinel stays on screen and nothing showable has
		// arrived yet. One request at a time, and it stops the moment the section shows something,
		// runs out of cursor, gets collapsed, or is scrolled out of view — so an empty section
		// reaches its first visible branch without ever putting a burst on the wire.
		async pumpSharedSection(): Promise<void>
		{
			if (this.sharedPumpRunning)
			{
				return;
			}

			this.sharedPumpRunning = true;
			try
			{
				while (
					this.sharedSentinelVisible
					&& this.state.sharedTreeEnabled
					&& this.state.sharedSectionExpanded
					&& this.state.sharedHasNextPage
					&& this.state.sharedContainers.length === 0
				)
				{
					const cursorBefore = this.state.sharedCursor;
					// eslint-disable-next-line no-await-in-loop
					await this.actions.loadMoreSharedTree();
					// eslint-disable-next-line no-await-in-loop
					await this.$nextTick();
					this.syncSharedSentinelObserver();

					// No movement means the call declined to run — a load was already in flight. Its
					// completion re-arms the pump through the sharedLoading watcher; spinning here
					// would just burn frames.
					if (this.state.sharedCursor === cursorBefore)
					{
						break;
					}
				}
			}
			finally
			{
				this.sharedPumpRunning = false;
			}
		},
		// Per-branch pagination inside the accessible tree. Root branches paginate through the
		// section sentinel above, so only nested (data-parent-id numeric) sentinels are handled.
		tryAutoLoadSharedChildren(container: HTMLElement): void
		{
			if (!this.state.sharedTreeEnabled || !this.state.sharedSectionExpanded)
			{
				return;
			}

			const sentinels = container.querySelectorAll('.js-doc-load-more-sentinel[data-tree-namespace="shared"]');
			if (sentinels.length === 0)
			{
				return;
			}

			const containerRect = container.getBoundingClientRect();
			for (const sentinel of sentinels)
			{
				if (!(sentinel instanceof HTMLElement))
				{
					continue;
				}

				const rect = sentinel.getBoundingClientRect();
				if (rect.bottom < containerRect.top - 24 || rect.top > containerRect.bottom + 24)
				{
					continue;
				}

				const collectionId = Number(sentinel.dataset.collectionId);
				const parentId = Number(sentinel.dataset.parentId);
				if (
					!Number.isFinite(collectionId) || collectionId <= 0
					|| !Number.isFinite(parentId) || parentId <= 0
				)
				{
					continue;
				}

				if (
					!this.state.hasNextSharedChildren(collectionId, parentId)
					|| this.state.isSharedChildrenLoading(collectionId, parentId)
				)
				{
					continue;
				}

				void this.actions.loadMoreSharedChildren({ collectionId, id: parentId });

				break;
			}
		},
	},
	template: `
		<aside
			class="sidebar"
			:class="{ 'is-collapsed': state.sidebarCollapsed, 'is-dragging': isAnyDragActive() }"
			:style="{ '--note-sidebar-width': \`\${state.sidebarEffectiveWidth}px\` }"
		>
			<SidebarRail
				v-if="state.sidebarCollapsed"
				:state="state"
				:actions="actions"
				:messages="messages"
				@expand="onRailExpand"
			/>
			<SidebarSearchRow
				ref="searchRow"
				:state="state"
				:actions="actions"
				@navigate-document="onSearchNavigateDocument"
				@navigate-search="onSearchNavigateSearch"
			/>
			<div
				class="sidebar-layout"
				@dragenter="actions.onSidebarFileDragEnter($event)"
				@dragleave="actions.onSidebarFileDragLeave($event)"
				@dragover="onContentDragOver($event)"
				@drop="onContentDrop($event)"
			>
				<div
					class="sidebar-content"
					ref="sidebarContent"
				>
					<div class="sidebar-sections">
						<FavoritesSection
							:state="state"
							:actions="actions"
							:messages="messages"
							:selected-doc-id="state.selectedDocId"
							:selected-collection-id="state.selectedCollectionId"
							:is-document-favorite="isDocumentFavorite"
							:toggle-document-favorite="toggleDocumentFavorite"
							@open="onOpenFavorite"
						/>
						<template v-if="state.sharedTreeEnabled">
							<button
								type="button"
								class="sidebar-section-header"
								:title="state.sharedSectionExpanded ? messages.collapseShared : messages.expandShared"
								:aria-expanded="String(state.sharedSectionExpanded)"
								data-testid="note-sidebar-shared-section"
								@click="onToggleSharedSection()"
							>
								<span class="sidebar-section-header__icon sidebar-section-header__icon--shared" aria-hidden="true">
									<BIcon name="o-forward" :size="22" color="var(--ui-color-accent-main-primary)" />
								</span>
								<span class="sidebar-section-header__title">{{ messages.sharedWithMe }}</span>
							</button>
							<ExpandTransition :loading="state.sharedLoading && !state.sharedContainers.length">
							<div
								v-if="state.sharedSectionExpanded"
								class="collection-list shared-list"
							>
							<div class="tree-scroll tree-scroll--shared" @scroll.passive="onTreeAreaScroll">
							<div
								v-if="isSharedEmpty"
								class="sidebar-muted sidebar-muted--flow"
							>{{ messages.emptyShared }}</div>
							<div class="tree-scroll__inner">
								<div v-if="state.sharedLoading && !state.sharedContainers.length" class="sidebar-muted">
									<SidebarLoader :level="0" />
								</div>
								<div v-if="state.sharedContainers.length">
									<div
										v-for="container in state.sharedContainers"
										:key="container.collectionId"
									>
										<div
											class="collection-row is-shared-group"
											@click="actions.toggleSharedContainer(container.collectionId)"
										>
										<span class="collection-row__pill" aria-hidden="true"><span class="collection-row__pill-fill"></span></span>
											<span class="collection-link" :title="container.title">
												<button
													type="button"
													class="collection-disclosure"
													:class="{ 'is-expanded': state.isSharedContainerExpanded(container.collectionId) }"
													:title="state.isSharedContainerExpanded(container.collectionId) ? messages.collapseSharedContainer : messages.expandSharedContainer"
													:aria-expanded="state.isSharedContainerExpanded(container.collectionId)"
													@click.stop="actions.toggleSharedContainer(container.collectionId)"
												>
													<BIcon name="chevron-right-l" :size="16" color="var(--ui-color-base-1)" />
												</button>
												<span class="collection-row__icon note-collection-glyph" aria-hidden="true"></span>
												<span class="collection-title">{{ container.title }}</span>
											</span>
										</div>
										<ExpandTransition>
										<div v-if="state.isSharedContainerExpanded(container.collectionId)" class="collection-tree">
											<ul class="tree-branch">
												<tree-node
													v-for="doc in sharedRootDocsFor(container)"
													:key="doc.id"
													:doc="doc"
													:level="1"
													:selected-doc-id="state.selectedDocId"
													:expanded-docs="state.expandedDocs"
													:get-children="state.getSharedChildren"
													:is-loading-children="state.isSharedChildrenLoading"
													:has-next-children="state.hasNextSharedChildren"
													:can-edit-document="actions.canEditSharedDocument"
													:can-manage-document="actions.canManageSharedDocument"
													:is-document-favorite="isDocumentFavorite"
													:toggle-document-favorite="toggleDocumentFavorite"
													:messages="messages"
													tree-namespace="shared"
													@toggle="actions.toggleSharedDoc"
													@open="actions.openDocumentFromTree"
													@prefetch-children="actions.prefetchSharedDocumentChildren"
													@load-more="actions.loadMoreSharedChildren"
												/>
											</ul>
										</div>
										</ExpandTransition>
									</div>
								</div>
								<div
									v-if="state.sharedHasNextPage"
									class="doc-load-more-sentinel js-shared-load-more-sentinel"
									aria-hidden="true"
								/>
							</div>
							</div>
							</div>
							</ExpandTransition>
						</template>
						<button
							v-else
							type="button"
							class="sidebar-fixed-row"
							:class="{ 'is-active': state.selectedSharedView }"
							data-testid="note-sidebar-shared"
							@click="actions.navigateToShared()"
						>
							<BIcon class="sidebar-fixed-row__icon" name="o-forward" :size="22" color="var(--ui-color-accent-main-primary)" />
							<span class="sidebar-fixed-row__title">{{ messages.sharedWithMe }}</span>
						</button>
						<div class="sidebar-section-divider" aria-hidden="true"></div>
						<button
							type="button"
							class="sidebar-section-header"
							:title="state.collectionsSectionExpanded ? messages.collapseCollections : messages.expandCollections"
							:aria-expanded="String(state.collectionsSectionExpanded)"
							data-testid="note-sidebar-collections-section"
							@click="actions.toggleCollectionsSection()"
						>
							<span class="sidebar-section-header__icon note-collection-glyph" aria-hidden="true"></span>
							<span class="sidebar-section-header__title">{{ messages.collections }}</span>
						</button>
						<ExpandTransition :loading="displayedLoading && !displayedCollections.length">
						<div
							v-if="state.collectionsSectionExpanded"
							class="collection-list"
							@dragover="actions.onCollectionListDragOver($event)"
							@drop="actions.onCollectionListDrop($event)"
						>
						<div class="tree-scroll tree-scroll--collections" @scroll.passive="onTreeAreaScroll">
						<div
							v-if="isCollectionsEmpty"
							class="sidebar-muted sidebar-muted--flow"
						>{{ messages.emptyCollections }}</div>
						<div class="tree-scroll__inner">
							<div v-if="displayedLoading && !displayedCollections.length" class="sidebar-muted">
								<SidebarLoader :level="0" />
							</div>
							<div v-else>
								<!-- Move-only group: a knowledge base dragged to another place travels there, the
								     same as a document row and a row of the favorites block. -->
								<TransitionGroup name="sidebar-row">
								<div
									v-for="collection in displayedCollections"
									:key="collection.id"
									:class="{ 'is-collection-drop-after': isCollectionDropAfterExpanded(collection) }"
								>
									<div
										class="collection-row"
										:data-collection-id="collection.id"
										:class="[
										{ 'is-active': state.selectedCollectionId === Number(collection.id) && !state.selectedDocId },
										collectionDropClass(collection),
										{ 'is-drop-inside': isDocDropInsideCollection(collection) || isFileDropInsideCollection(collection) },
										{ 'is-drag-source': state.collectionDragItem && state.collectionDragItem.id === Number(collection.id) },
										{ 'has-actions': canEditCollection(collection) && !isRenamingCollection(collection) }
										]"
										:draggable="canEditCollection(collection)"
										@mouseenter="actions.prefetchCollectionChildren(collection)"
										@dragstart="onCollectionDragStart(collection, $event)"
										@dragover="onCollectionRowDragOver(collection, $event)"
										@drop="onCollectionRowDrop(collection, $event)"
										@dragend="actions.endCollectionDrag"
									>
									<span class="collection-row__pill" aria-hidden="true"><span class="collection-row__pill-fill"></span></span>
									<span
										class="collection-link"
										:title="isRenamingCollection(collection) ? null : getCollectionTitle(collection)"
									>
										<button
											v-if="!isRenamingCollection(collection)"
											type="button"
											class="collection-disclosure"
											:class="{ 'is-expanded': actions.isCollectionExpanded(collection.id) }"
											:aria-label="actions.isCollectionExpanded(collection.id) ? messages.collapseSharedContainer : messages.expandSharedContainer"
											:aria-expanded="String(actions.isCollectionExpanded(collection.id))"
											@click.stop="actions.toggleCollectionExpanded(collection)"
										>
											<BIcon name="chevron-right-l" :size="16" color="var(--ui-color-base-1)" />
										</button>
										<span class="collection-row__icon note-collection-glyph" aria-hidden="true"></span>
										<input
											v-if="isRenamingCollection(collection)"
											class="collection-title-input"
											type="text"
											:value="collection.name"
											@keydown.enter="onRenameCollectionKeyEnter($event)"
											@keydown.escape="onRenameCollectionKeyEscape(collection)"
											@blur="onRenameCollectionBlur(collection, $event)"
											@click.stop
											:ref="'renameCollectionInput-' + collection.id"
										/>
										<a
											v-else
											class="collection-title collection-title-link"
											:data-kb-name="collectionNameReserve(collection)"
											:href="collectionHref(collection)"
											draggable="false"
											@click="onCollectionTitleClick(collection, $event)"
										>{{ collection.name }}</a>
									</span>
									<div v-if="!isRenamingCollection(collection)" class="collection-actions-anchor">
									<div class="collection-actions">
										<button
											v-if="canEditCollection(collection)"
											class="row-action-btn"
											type="button"
											:title="messages.createDocument"
											:aria-label="messages.createDocument"
											@click.stop="actions.createDocumentForCollection(collection)"
										>
											<BIcon name="plus-l" :size="20" />
										</button>
										<button
											class="row-action-btn row-action-btn--favorite"
											:class="{ 'is-on': isCollectionFavorite(collection) }"
											type="button"
											:title="collectionFavoriteLabel(collection)"
											:aria-label="collectionFavoriteLabel(collection)"
											:aria-pressed="isCollectionFavorite(collection).toString()"
											@click="onToggleCollectionFavorite(collection, $event)"
										>
											<BIcon :name="isCollectionFavorite(collection) ? 's-favorite' : 'o-favorite'" :size="16" />
										</button>
									</div>
									</div>
									</div>
									<ExpandTransition :loading="state.isRootLoading(collection.id)">
									<div
										v-if="actions.isCollectionExpanded(collection.id)"
										class="collection-tree"
									>
										<ul
											class="tree-branch"
											@dragenter="onRootBranchDragEnter(collection, $event)"
											@dragover.stop="onRootBranchDragOver(collection, $event)"
											@drop.stop="onRootBranchDrop(collection, $event)"
										>
											<!-- Move-only group: see the branch of TreeNode. -->
											<TransitionGroup name="sidebar-row">
											<tree-node
												v-for="doc in rootDocsFor(collection)"
												:key="doc.id"
												:doc="doc"
												:level="1"
												:selected-doc-id="state.selectedDocId"
												:expanded-docs="state.expandedDocs"
												:get-children="childrenGetter"
												:is-loading-children="state.isLoadingChildren"
												:has-next-children="state.hasNextChildren"
												:can-edit-document="actions.canEditDocument"
												:can-manage-document="actions.canManageDocument"
												:is-document-favorite="isDocumentFavorite"
												:toggle-document-favorite="toggleDocumentFavorite"
												:messages="messages"
												:doc-drag-item="state.docDragItem"
												:doc-drop-target="state.docDropTarget"
												:file-drop-target="state.fileDropTarget"
												:renaming-doc-id="state.renamingDocId"
												@toggle="actions.toggleDoc"
												@open="actions.openDocumentFromTree"
												@prefetch-children="actions.prefetchDocumentChildren"
												@load-more="actions.loadMoreChildren"
												@create-child="actions.createChildDocument"
												@rename-doc="actions.renameDocument"
												@delete-doc="actions.deleteDocument"
												@start-drag="actions.startDocDrag($event.doc, $event.nativeEvent)"
												@branch-drag-enter="onNestedBranchDragEnter($event)"
												@branch-drag-over="onNestedBranchDragOver($event)"
												@branch-drop="onNestedBranchDrop($event)"
												@end-drag="actions.endDocDrag"
												@confirm-rename-doc="actions.confirmRenameDocument($event.doc.id, $event.title, $event.doc.collectionId)"
												@cancel-rename-doc="actions.cancelRenameDocument()"
												@file-drag-over="actions.onFileDragOverDocument($event.doc)"
												@file-drop="actions.onFileDropOnDocument($event.doc, $event.nativeEvent)"
											/>
											</TransitionGroup>
											<li v-if="state.isRootLoading(collection.id)" class="sidebar-muted">
												<SidebarLoader :level="1" />
											</li>
											<li
												v-if="state.hasRootNextPage(collection.id)"
												class="doc-load-more-sentinel js-doc-load-more-sentinel"
												:data-collection-id="collection.id"
												data-parent-id="root"
												aria-hidden="true"
											/>
										</ul>
									</div>
									</ExpandTransition>
								</div>
								</TransitionGroup>
								<div v-if="displayedLoading && displayedCollections.length" class="sidebar-muted">
									<SidebarLoader :level="0" />
								</div>
							</div>
						</div>
						</div>
						</div>
						</ExpandTransition>
				</div>
				</div>
			</div>
			<!-- "Archive" and "Recycle bin" stand together right above the footer, outside the scrolling
				 sections: pinned to the bottom edge of the sections, "Archive" left a band of empty panel
				 between itself and "Recycle bin" whenever the lists were shorter than the panel. On a phone
				 they are icons in the footer instead - see SidebarFooter - where they cost no rows. -->
			<div v-if="!state.isMobile" class="sidebar-pinned">
				<div class="sidebar-section-divider" aria-hidden="true"></div>
				<button
					type="button"
					class="sidebar-fixed-row"
					:class="{ 'is-active': state.selectedArchiveView }"
					:title="messages.archive"
					data-testid="note-sidebar-archive"
					@click="actions.navigateToArchive()"
				>
					<BIcon class="sidebar-fixed-row__icon" name="o-box-with-lid" :size="22" color="var(--ui-color-accent-main-primary)" />
					<span class="sidebar-fixed-row__title">{{ messages.archive }}</span>
				</button>
				<button
					type="button"
					class="sidebar-fixed-row"
					:class="{ 'is-active': state.selectedRecycleBinView }"
					:title="messages.recycleBin"
					data-testid="note-sidebar-recyclebin"
					@click="actions.navigateToRecycleBin()"
				>
					<BIcon class="sidebar-fixed-row__icon" name="o-trashcan" :size="22" color="var(--ui-color-accent-main-primary)" />
					<span class="sidebar-fixed-row__title">{{ messages.recycleBin }}</span>
				</button>
			</div>
			<SidebarFooter
				:state="state"
				:actions="actions"
				:theme-actions="themeActions"
				@toggle-collapsed="onToggleSidebarCollapsed"
			/>
			<!-- The pointer being over the handle is published on the body, because the line it lights up
			     runs higher than this panel: the header draws its own half of the same boundary and cannot
			     be reached from inside here by a selector. -->
			<div
				v-if="!state.sidebarCollapsed"
				class="sidebar-resizer"
				role="separator"
				aria-orientation="vertical"
				aria-label="Resize sidebar"
				@mousedown="onSidebarResizeStart"
				@mouseenter="onSidebarResizeHover(true)"
				@mouseleave="onSidebarResizeHover(false)"
			></div>
		</aside>
	`,
};
