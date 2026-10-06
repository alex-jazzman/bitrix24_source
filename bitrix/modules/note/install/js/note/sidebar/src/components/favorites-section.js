import { BIcon, Outline, Solid } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import 'ui.icon-set.solid';
import { NoteThemeContext } from 'note.ui.theme-context';

import { ExpandTransition } from './expand-transition';
import { FavoriteRow } from './favorite-row';
import { markSectionMotion } from '../utils/drop-motion';

// Distance from the edge of the list at which the next page is asked for.
const SENTINEL_MARGIN = 24;

// Name of the row transition group, and the name used for the one change that carries none: nothing is
// styled for it, so enter and leave are over within a frame.
const ROW_TRANSITION = 'favorite-row';
const ROW_TRANSITION_INSTANT = 'favorite-row-instant';

// A page: the rows that were there stand where they stood and more follow them. Anything else - a row
// starred, a row gone, the filter answered - reaches the head of the list or takes something out of it.
function isAppend(previous: ?Object[], next: ?Object[]): boolean
{
	const before = Array.isArray(previous) ? previous : [];
	const after = Array.isArray(next) ? next : [];
	if (before.length === 0 || after.length <= before.length)
	{
		return false;
	}

	return before.every((row, index) => (
		row.entityType === after[index]?.entityType
		&& Number(row.entityId) === Number(after[index]?.entityId)
	));
}

export const FavoritesSection = {
	name: 'FavoritesSection',
	components: {
		BIcon,
		ExpandTransition,
		FavoriteRow,
	},
	props: {
		state: { type: Object, required: true },
		actions: { type: Object, required: true },
		messages: { type: Object, required: true },
		selectedDocId: { type: Number, default: null },
		selectedCollectionId: { type: Number, default: null },
		// Handed through to the nested tree rows: the star of a document has one implementation and it
		// lives in the sidebar root.
		isDocumentFavorite: { type: Function, required: true },
		toggleDocumentFavorite: { type: Function, required: true },
	},
	emits: ['open'],
	// The height floor of the section is published by a pass scheduled from appearance hooks only, and
	// a row leaving triggers none of them - so the pass is asked for once the row is out of the DOM.
	inject: {
		noteScheduleTreeMetrics: { default: null },
		// Same bridge the section transition uses, and for the same reason: the share has to stand where
		// the content stands, in the frame the content changes (see the watcher on `items`).
		noteRefreshSectionFloors: { default: null },
	},
	data(): Object
	{
		return {
			rowTransition: ROW_TRANSITION,
			scrollRaf: 0,
			// [P4.T1] The depth popover of a row is teleported out of the panel (which clips it and
			// stands in the way of viewport positioning), so it no longer inherits the design-system
			// context of the application - the block carries the class for it, one subscription for
			// every row instead of one per row.
			themeContextClass: NoteThemeContext.getDesignSystemContext(),
		};
	},
	created(): void
	{
		this.unsubscribeTheme = NoteThemeContext.subscribe((event: Object): void => {
			this.themeContextClass = NoteThemeContext.resolveDesignSystemContext(
				event?.data?.theme ?? NoteThemeContext.get(),
			);
		});
	},
	beforeUnmount(): void
	{
		this.unsubscribeTheme?.();
		this.unsubscribeTheme = null;

		if (this.scrollRaf)
		{
			cancelAnimationFrame(this.scrollRaf);
			this.scrollRaf = 0;
		}
	},
	computed: {
		Outline: (): typeof Outline => Outline,
		Solid: (): typeof Solid => Solid,
		items(): Object[]
		{
			return this.state.favorites.items;
		},
		// The row's depth popover is teleported to <body>, so it escapes the panel's stacking context.
		// Alongside the design-system context it carries a marker class that lets sidebar.css lift it
		// above the mobile nav drawer - teleported at its own z-index the popover lands behind the drawer.
		notifyPopoverClass(): string
		{
			return `${this.themeContextClass} note-sidebar-notify-popover`.trim();
		},
		// Kept in the store, not here: the rail of the collapsed panel is drawn instead of this component
		// and opens the block its entry leads to.
		isExpanded(): boolean
		{
			return this.state.favorites.sectionExpanded;
		},
		notifyFilter(): boolean
		{
			return this.state.favorites.onlyNotified;
		},
		// Hiding the filter cannot strand the list in a filtered state: onlyNotified is held in the
		// store for the life of the page, so the next load starts unfiltered.
		notificationsEnabled(): boolean
		{
			return this.state.notificationsEnabled === true;
		},
		loadError(): string | null
		{
			return this.state.favorites.error;
		},
		// The mockup has no empty favorites block: with nothing starred the section is not there.
		// "Nothing starred" means a page the server confirmed empty, not a page still on its way -
		// otherwise the block would blink on every load. A block emptied by the filter stays: the
		// filter has to remain reachable. A failed load stays too, to show its own error.
		isVisible(): boolean
		{
			if (this.loadError !== null)
			{
				return true;
			}

			if (!this.state.favorites.isLoaded)
			{
				return false;
			}

			// A filter switch flips the flag at once, its page arrives a request later: until then the
			// rows on screen still answer the PREVIOUS filter. Turning the filter off while it held
			// nothing would read as "empty and unfiltered" and collapse the whole block under the
			// pointer that is still on its button, so that one read keeps the block on screen - and only
			// that one. The composition of the block is re-read after every access push as well, and an
			// empty block held up by those appeared and went away again on every collection created,
			// archived or deleted.
			return this.items.length > 0 || this.notifyFilter || this.state.favorites.isFilterReloading;
		},
		// What the disclosure of the header points aria-controls at. One favorites block to a panel and one
		// panel to a page, so the id is a constant rather than a per-instance counter.
		listId(): string
		{
			return 'note-sidebar-favorites-list';
		},
		filterLabel(): string
		{
			return this.notifyFilter ? this.messages.favoritesShowAll : this.messages.favoritesShowNotified;
		},
		// Tinted while the filter is off, filled once it is on - the mockup's secondary button.
		filterClass(): string
		{
			const style = this.notifyFilter ? '--style-filled' : '--style-tinted';

			return `favorites-filter ui-btn --air --with-icon ui-btn-xs ${style} ui-btn-collapsed`;
		},
	},
	watch: {
		// Every composition of the block arrives in one render - a filter switch, a page, a row starred
		// elsewhere. The scheduled pass publishes the share a frame later, and in that frame the new rows
		// stood inside the box the previous composition was given: clipped, then stepped to their own
		// height. `flush: 'post'` puts this after the rows are in the DOM and before the frame is painted,
		// so the box is at the content in the same frame the content changes - and nothing is animated
		// about it, which is what makes the filter answer the press instead of playing something first.
		items: {
			flush: 'post',
			handler(next: Object[], previous: Object[]): void
			{
				// A row joins or leaves at its full height in one frame, and everything below the block - the
				// knowledge bases among it - stepped a row's worth in that same frame. Marked before the share
				// is published, so the section carries them instead: 275ms, the length every section of the
				// panel moves in. Two changes are left abrupt on purpose. A page appended to the tail arrives
				// while the reader is scrolling the list, and the glide would take the thumb from under the
				// pointer doing the scrolling (it is hidden for the length of a section's motion). And the
				// filter answers the press it was given, in the frame of the press.
				// Every row stands the same height, so the block asks for a different one only when it holds a
				// different number of rows. The answer to a press replacing the row it drew provisionally is
				// the same composition over again, and marking that would take the thumb away for nothing.
				const resized = (Array.isArray(next) ? next.length : 0) !== (Array.isArray(previous) ? previous.length : 0);
				if (resized && this.rowTransition !== ROW_TRANSITION_INSTANT && !isAppend(previous, next))
				{
					markSectionMotion(document.querySelector('.sidebar'));
				}

				this.noteRefreshSectionFloors?.();
			},
		},
	},
	methods: {
		// After the leave transition, so the composition measured no longer counts the row that left: it
		// stays in flow for the length of its fade on purpose.
		onRowLeft(): void
		{
			// The row held its place for the length of its fade, so the height the block loses is lost here,
			// a fade later - by which time the mark the removal itself set has run out. Marked again, or the
			// panel would glide the row away and then drop everything below it in one frame.
			markSectionMotion(document.querySelector('.sidebar'));
			this.noteScheduleTreeMetrics?.();
		},
		isActiveItem(item: Object): boolean
		{
			return item.entityType === 'collection'
				? Number(item.entityId) === this.selectedCollectionId && !this.selectedDocId
				: Number(item.entityId) === this.selectedDocId
			;
		},
		onToggle(): void
		{
			this.actions.toggleFavoritesSection();
		},
		onToggleFilter(): void
		{
			this.actions.setFavoritesSectionExpanded(true);
			// Rows leave without their fade for this one change: the box lands on the filtered composition
			// in the same frame, and a row still fading inside it would be a row hanging out of the box.
			this.rowTransition = ROW_TRANSITION_INSTANT;
			void this.actions.setFavoritesFilter(!this.notifyFilter);
			// Only the render the press itself causes is abrupt. The page that follows carries rows the
			// client could not know about, and those still arrive with the fade the block is drawn with.
			void this.$nextTick(() => {
				this.rowTransition = ROW_TRANSITION;
			});
		},
		onRetry(): void
		{
			void this.actions.retryFavorites();
		},
		// The list scrolls inside itself past its share of the panel, so paging is driven from here
		// rather than from the sidebar's tree areas. One measurement per frame: the sentinel check
		// forces a layout flush and the answer cannot change more often than that.
		onListScroll(event: Event): void
		{
			const container = event.currentTarget;
			if (!(container instanceof HTMLElement) || this.scrollRaf)
			{
				return;
			}

			this.scrollRaf = requestAnimationFrame(() => {
				this.scrollRaf = 0;
				this.tryAutoLoad(container);
			});
		},
		tryAutoLoad(container: HTMLElement): void
		{
			this.tryAutoLoadList(container);
			this.tryAutoLoadBranches(container);
		},
		tryAutoLoadList(container: HTMLElement): void
		{
			// A failed page is not asked for again by itself: the sentinel stays in view, so scrolling
			// would keep firing the same request. The next attempt is the user's.
			if (!this.state.favorites.hasNextPage || this.state.favorites.isLoading || this.loadError !== null)
			{
				return;
			}

			const sentinel = container.querySelector('.js-favorites-load-more-sentinel');
			if (!(sentinel instanceof HTMLElement) || !this.isSentinelInView(container, sentinel))
			{
				return;
			}

			void this.actions.loadFavoritesPage();
		},
		// Branches expanded inside the block page the same way they do in the tree, only their
		// sentinels ride this list instead of a tree area - so they are routed from here, by the
		// namespace the sentinel carries.
		tryAutoLoadBranches(container: HTMLElement): void
		{
			for (const sentinel of container.querySelectorAll('.js-doc-load-more-sentinel'))
			{
				if (!(sentinel instanceof HTMLElement) || !this.isSentinelInView(container, sentinel))
				{
					continue;
				}

				const collectionId = Number(sentinel.dataset.collectionId);
				if (!Number.isInteger(collectionId) || collectionId <= 0)
				{
					continue;
				}

				const rawParentId = sentinel.dataset.parentId || '';
				const parentId = rawParentId === 'root' ? null : Number(rawParentId);
				if (rawParentId !== 'root' && (!Number.isInteger(parentId) || parentId <= 0))
				{
					continue;
				}

				const isShared = sentinel.dataset.treeNamespace === 'shared';
				const hasNext = isShared
					? this.state.hasNextSharedChildren(collectionId, parentId)
					: this.state.hasNextChildren(collectionId, parentId)
				;
				const isLoading = isShared
					? this.state.isSharedChildrenLoading(collectionId, parentId)
					: this.state.isLoadingChildren(collectionId, parentId)
				;
				if (!hasNext || isLoading)
				{
					continue;
				}

				const doc = { collectionId, id: parentId };
				const page = isShared
					? this.actions.loadMoreSharedChildren(doc)
					: this.actions.loadMoreChildren(doc)
				;
				// [API-06] The next page of a branch arrives without notification states - one request
				// per page brings them, or the new rows would show no bell where a bell belongs.
				void Promise.resolve(page).then(() => this.actions.refreshFavoriteCoverage({
					collectionId,
					parentId,
					expandVia: isShared ? 'accessibleTree' : 'tree',
				}));

				break;
			}
		},
		isSentinelInView(container: HTMLElement, sentinel: HTMLElement): boolean
		{
			const containerRect = container.getBoundingClientRect();
			const rect = sentinel.getBoundingClientRect();

			return !(
				rect.bottom < containerRect.top - SENTINEL_MARGIN
				|| rect.top > containerRect.bottom + SENTINEL_MARGIN
			);
		},
	},
	template: `
		<template v-if="isVisible">
			<!-- The row itself is a plain box holding two controls side by side: the disclosure is a native
			     button, as in every other section header of the panel, and the notification filter stands next
			     to it instead of inside it. The click on the row is kept, so the whole width still opens and
			     closes the block. -->
			<div
				class="sidebar-section-header"
				data-testid="note-sidebar-favorites-section"
				@click="onToggle"
			>
				<button
					type="button"
					class="sidebar-section-header__toggle"
					:aria-expanded="isExpanded.toString()"
					:aria-controls="isExpanded ? listId : null"
					@click.stop="onToggle"
				>
					<BIcon
						class="sidebar-section-header__glyph"
						:name="Outline.FAVORITE"
						:size="22"
						color="var(--ui-color-accent-main-primary)"
					/>
					<span class="sidebar-section-header__title">{{ messages.favorites }}</span>
				</button>
				<span v-if="notificationsEnabled" class="sidebar-section-header__filter">
					<button
						type="button"
						:class="filterClass"
						:title="filterLabel"
						:aria-label="filterLabel"
						:aria-pressed="notifyFilter.toString()"
						data-testid="note-sidebar-favorites-filter"
						@click.stop="onToggleFilter"
					>
						<BIcon :name="notifyFilter ? Solid.NOTIFICATION : Outline.NOTIFICATION" :size="16" />
					</button>
				</span>
			</div>
			<ExpandTransition>
				<!-- Two elements, the same pair every section of the panel is built from: the outer one is
				     what the height animation owns, the inner one is what scrolls. One element in both
				     roles is what set this block apart: the animation hides the overflow of the element it
				     animates, and that took the scrolling away from under the sticky row controls for the
				     length of every open and close. -->
				<div v-if="isExpanded" :id="listId" class="collection-list favorites-list">
					<!-- The gap a dragged row would go into is resolved from the pointer against the whole
					     area, so the area, not the row, owns the drag-over and the drop. -->
					<div
						class="tree-scroll tree-scroll--favorites"
						@scroll.passive="onListScroll"
						@dragover="actions.onFavoriteListDragOver($event)"
						@drop="actions.onFavoriteListDrop($event)"
					>
					<!-- Beside the rows, not among them: the box below is as wide as its widest row, and a
					     line of prose in there set the width of the whole area - the message was cut off and
					     the area grew a horizontal bar. This is where the other sections keep theirs. -->
					<div v-if="loadError !== null" class="sidebar-muted sidebar-muted--flow favorites-empty">
						{{ loadError }}
						<button type="button" class="favorites-retry" @click="onRetry">
							{{ messages.favoritesRetry }}
						</button>
					</div>
					<div
						v-else-if="!items.length"
						class="sidebar-muted sidebar-muted--flow favorites-empty"
					>{{ messages.favoritesEmptyNotified }}</div>
					<div class="tree-scroll__inner">
					<!-- A row appearing or leaving is smoothed over, nothing more: no wrapper tag, so the
					     structure the drag, the scroll sentinel and the height floors rest on is untouched. -->
					<TransitionGroup :name="rowTransition" @after-leave="onRowLeft">
						<FavoriteRow
							v-for="item in items"
							:key="item.entityType + ':' + item.entityId"
							:item="item"
							:state="state"
							:actions="actions"
							:messages="messages"
							:is-active="isActiveItem(item)"
							:popover-class="notifyPopoverClass"
							:is-document-favorite="isDocumentFavorite"
							:toggle-document-favorite="toggleDocumentFavorite"
							@open="$emit('open', $event)"
						/>
					</TransitionGroup>
					<div
						v-if="state.favorites.hasNextPage"
						class="doc-load-more-sentinel js-favorites-load-more-sentinel"
						aria-hidden="true"
					></div>
					</div>
					</div>
				</div>
			</ExpandTransition>
			<div class="sidebar-section-divider" aria-hidden="true"></div>
		</template>
	`,
};
