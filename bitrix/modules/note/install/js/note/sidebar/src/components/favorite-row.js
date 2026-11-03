import { BIcon, Outline, Solid } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import 'ui.icon-set.solid';
import {
	hasSubscriptionSurface,
	isShippedSubscriptionMode,
	SubscriptionBellView,
	SUBSCRIPTION_MODE_MUTED,
	SUBSCRIPTION_MODE_SUBTREE,
	SUBSCRIPTION_SCOPE_COLLECTION,
	SUBSCRIPTION_SCOPE_DOCUMENT,
} from 'note.ui.document-history';

import { favoriteKey } from '../domain/sidebar-store/shared/keys';
import { rowNameReserve } from '../utils/row-controls';
import { ExpandTransition } from './expand-transition';
import { SidebarLoader } from './sidebar-loader';
import { TreeNode } from './tree-node';

// One row of the favorites block. The row carries no URL - the address is built here,
// exactly as it is for every other tree row. A row with nested documents opens into its branch: the
// branch is read from the namespace the server named in expandVia, and drawn by the tree's own row
// component so nested rows behave like tree rows, stars included.
export const FavoriteRow = {
	name: 'FavoriteRow',
	components: {
		BIcon,
		ExpandTransition,
		SidebarLoader,
		SubscriptionBellView,
		TreeNode,
	},
	props: {
		item: { type: Object, required: true },
		state: { type: Object, required: true },
		actions: { type: Object, required: true },
		messages: { type: Object, required: true },
		isActive: { type: Boolean, default: false },
		// Design-system context for the teleported depth popover - see FavoritesSection.
		popoverClass: { type: String, default: '' },
		// The star of a nested row: one implementation, handed down from the sidebar root the same way
		// the tree hands it to TreeNode.
		isDocumentFavorite: { type: Function, required: true },
		toggleDocumentFavorite: { type: Function, required: true },
	},
	inject: {
		noteScheduleTreeMetrics: { default: null },
	},
	// The same pair of hooks a tree row keeps, and for the same reason: the title is capped against the
	// visible right edge by a measure pass in the sidebar root, and only the row knows when it appeared
	// or when its controls changed width. Rows of the block change without the root re-rendering - a
	// page loaded, the filter switched - and an uncapped title runs on under the star.
	mounted(): void
	{
		this.noteScheduleTreeMetrics?.();
	},
	updated(): void
	{
		this.noteScheduleTreeMetrics?.();
	},
	emits: ['open'],
	computed: {
		Outline: (): typeof Outline => Outline,
		Solid: (): typeof Solid => Solid,
		isCollection(): boolean
		{
			return this.item.entityType === 'collection';
		},
		href(): string
		{
			const id = Number(this.item?.entityId);
			if (!Number.isFinite(id) || id <= 0)
			{
				return '';
			}

			return this.isCollection ? `/note/workspace/${id}/` : `/note/document/${id}/`;
		},
		// Scope the row's subscription is written in: the map of shipped modes is read per scope, and
		// a knowledge base and a document are two different scopes of it.
		notifyScope(): string
		{
			return this.isCollection ? SUBSCRIPTION_SCOPE_COLLECTION : SUBSCRIPTION_SCOPE_DOCUMENT;
		},
		// MODES-01 / Q-1: a direct row in a shipped mode, and only that. A row of a mode outside the
		// shipping delivers nothing, so reading it as on would promise notifications that never arrive -
		// it reads as off instead, and one press rewrites it into the shipped mode (set() upserts).
		// Derived from the row's own fields rather than taken from the DTO's `notified`, which the
		// server now answers by this very rule: a page cached before the rule changed still draws right.
		isNotified(): boolean
		{
			return this.item?.notify?.subscribed === true
				&& isShippedSubscriptionMode(this.notifyScope, this.item?.notify?.mode)
			;
		},
		notifyLabel(): string
		{
			if (this.isMuted)
			{
				return this.messages.notifyOn;
			}

			return this.isNotified ? this.messages.notifyOff : this.messages.notifyOn;
		},
		// Coverage from above is a state of the row only while `muted` is shipped: the inherited and muted
		// layouts of the control exist to suppress that coverage, and coverage nothing can suppress has
		// nothing to offer. Read from the map, like the gate of the nested rows and the one of the bell of
		// the activity line, so returning `muted` to the shipping brings the state back by itself - same
		// rule and same terms as SubscriptionBellComponent.isCovered.
		isCovered(): boolean
		{
			return this.item?.notify?.inherited === true
				&& isShippedSubscriptionMode(this.notifyScope, SUBSCRIPTION_MODE_MUTED)
			;
		},
		// Only while there is coverage to suppress: the negative row survives the covering subscription
		// being switched off, and on its own it mutes nothing (same rule in SubscriptionBellView), so a
		// mute outside the shipping reads as plain "off" instead of drawing a third state `aria-pressed`
		// has no way to tell apart.
		isMuted(): boolean
		{
			return this.item?.notify?.muted === true && this.isCovered;
		},
		// Room the title leaves before the visible right edge, by the same rule the tree rows follow: the
		// star of a block row never hides, and a bell with something to say stays next to it. A bell that
		// only shows under the pointer gets nothing - it may cover the tail of the title.
		nameReserve(): string
		{
			// Q-2: the previous rule without the `muted` term, and only where a bell is offered at all -
			// a row that carries none holds no room for one.
			return rowNameReserve({
				isFavorite: true,
				hasBell: this.hasNotifyBell && this.isNotified,
			});
		},
		notifyIcon(): string
		{
			if (this.isMuted)
			{
				return Outline.NOTIFICATION_OFF;
			}

			return this.isNotified ? Solid.NOTIFICATION : Outline.NOTIFICATION;
		},
		// Bootstrap flag off the sidebar root state - with the notifications option off the block has
		// no bells at all, neither on its rows nor inside their branches.
		notificationsEnabled(): boolean
		{
			return this.state.notificationsEnabled === true;
		},
		// MODES-01: a bell is offered only where the shipping has a mode to write and the option
		// leaves the feature on. An article is followed with `self`, so its row carries one; a
		// knowledge base is subscribed with `all` alone and `all` is not shipped, so its row carries
		// no bell whatever the option says. Read from the policy, so widening the shipping brings the
		// bell back without touching this component.
		hasNotifyBell(): boolean
		{
			return hasSubscriptionSurface(this.notifyScope, this.notificationsEnabled);
		},
		// A row with nested documents has a depth to choose, so its bell opens the popover of
		// the editor. Everything else - a document with nothing under it, a knowledge base - is one press.
		// A depth is a `subtree` row, and while that mode is not shipped there is nothing to choose: the
		// row takes the plain toggle form the block already has.
		hasNotifyDepth(): boolean
		{
			return !this.isCollection
				&& this.item?.hasChildren === true
				&& isShippedSubscriptionMode(SUBSCRIPTION_SCOPE_DOCUMENT, SUBSCRIPTION_MODE_SUBTREE)
			;
		},
		// The state surface the control draws from. The control is presentational and normalizes nothing
		// itself, so both of its hosts owe it the same shape, already brought to the shipped modes: this
		// is SubscriptionBellComponent.bellState written over the DTO of the row instead of over the
		// component's own fields. Handing the raw `notify` over instead would let a row of an unshipped
		// mode light the bell up here while the activity line reads the very same row as off.
		bellState(): Object
		{
			const notify = this.item?.notify ?? null;
			const inherited = notify?.inherited === true;

			return {
				mode: this.isNotified ? String(notify?.mode || '') : null,
				subscribed: this.isNotified,
				muted: this.isMuted,
				inherited: this.isCovered,
				inheritedSource: inherited ? String(notify?.inheritedSource || '') : null,
				inheritedTitle: inherited ? String(notify?.inheritedTitle || '') : '',
			};
		},
		isNotifySaving(): boolean
		{
			return this.state.favorites.isNotifyPending(this.item.entityType, Number(this.item.entityId));
		},
		// hasChildren is the whole answer about the chevron of a document; a branch already read
		// keeps it after the last child left, so the row can still be closed. A knowledge base carries its
		// chevron whether it holds anything or not - the row it has in the knowledge-bases block does, and
		// one base is not to be drawn two ways in one panel.
		canExpand(): boolean
		{
			return this.isCollection || this.item?.hasChildren === true || this.children.length > 0;
		},
		isExpanded(): boolean
		{
			return this.state.favorites.isExpanded(this.item.entityType, Number(this.item.entityId));
		},
		expandLabel(): string
		{
			return this.isExpanded ? this.messages.favoriteCollapse : this.messages.favoriteExpand;
		},
		// [P2] Scope of every expansion inside this row's branch. A document starred twice - as a row of
		// its own and as a descendant of another row - must open in one place without opening in the
		// other, and the scope is what tells the two places apart (see favoriteExpandKey).
		rowScope(): string
		{
			return favoriteKey(this.item.entityType, Number(this.item.entityId));
		},
		// Expansion of the documents inside THIS branch, in the shape TreeNode reads it.
		branchExpandedDocs(): Object
		{
			return this.state.favorites.expandedDocsByRow[this.rowScope] ?? {};
		},
		// expandVia: a document seen only through a personal grant lives in the accessible-tree
		// namespace, and the regular branch action would turn its owner down.
		isSharedBranch(): boolean
		{
			return !this.isCollection && this.item?.expandVia === 'accessibleTree';
		},
		// A knowledge base opens its root branch, a document its own.
		branchCollectionId(): number
		{
			return Number(this.isCollection ? this.item.entityId : this.item.collectionId);
		},
		branchParentId(): number | null
		{
			return this.isCollection ? null : Number(this.item.entityId);
		},
		children(): Object[]
		{
			return this.getBranchChildren(this.branchCollectionId, this.branchParentId);
		},
		isBranchLoading(): boolean
		{
			return this.isBranchChildrenLoading(this.branchCollectionId, this.branchParentId);
		},
		hasNextBranchPage(): boolean
		{
			return this.hasNextBranchChildren(this.branchCollectionId, this.branchParentId);
		},
		// The top-level row of the block owns no scope: its place IS the scope of everything below it.
		branchError(): string | null
		{
			return this.state.favorites.branchError(this.item.entityType, Number(this.item.entityId));
		},
		// Routes the load-more sentinel of the branch to the loader of the matching namespace.
		treeNamespace(): string
		{
			return this.isSharedBranch ? 'shared' : 'collection';
		},
		sentinelParentId(): string
		{
			return this.branchParentId === null ? 'root' : String(this.branchParentId);
		},
		// [P3] Order is a property of the whole list, and under the notification filter part of it is
		// not on screen: a gap between two visible rows would mean something else once the filter is
		// off. So the block is reordered only when all of it is shown (ADR section 9).
		canDrag(): boolean
		{
			// A row the server has not named yet has no id to reorder by: the order is written in row ids.
			return this.state.favorites.onlyNotified !== true && this.item?.isProvisional !== true;
		},
		isDragSource(): boolean
		{
			const dragItem = this.state.favorites.dragItem;

			return Boolean(dragItem) && Number(dragItem.id) === Number(this.item.id);
		},
		isDropTarget(): boolean
		{
			const target = this.state.favorites.dropTarget;

			return Boolean(target) && Number(target.id) === Number(this.item.id);
		},
		dropClass(): string
		{
			if (!this.isDropTarget)
			{
				return '';
			}

			if (this.state.favorites.dropTarget.placement === 'before')
			{
				return 'is-drop-before';
			}

			// An open branch stands between this row and the next one: the line goes under the branch,
			// drawn on the wrapper, or it would promise a gap where there is none.
			return this.isExpanded ? '' : 'is-drop-after';
		},
		isDropAfterExpanded(): boolean
		{
			return this.isDropTarget
				&& this.state.favorites.dropTarget.placement === 'after'
				&& this.isExpanded
			;
		},
		canEditNestedDocument(): Function
		{
			return this.isSharedBranch ? this.actions.canEditSharedDocument : this.actions.canEditDocument;
		},
		canManageNestedDocument(): Function
		{
			return this.isSharedBranch ? this.actions.canManageSharedDocument : this.actions.canManageDocument;
		},
	},
	methods: {
		// One read path per namespace, shared by the row and by every level under it.
		getBranchChildren(collectionId: number, parentId: number | null): Object[]
		{
			return this.isSharedBranch
				? this.state.getSharedChildren(collectionId, parentId)
				: this.state.getChildren(collectionId, parentId)
			;
		},
		isBranchChildrenLoading(collectionId: number, parentId: number | null): boolean
		{
			return this.isSharedBranch
				? this.state.isSharedChildrenLoading(collectionId, parentId)
				: this.state.isLoadingChildren(collectionId, parentId)
			;
		},
		hasNextBranchChildren(collectionId: number, parentId: number | null): boolean
		{
			return this.isSharedBranch
				? this.state.hasNextSharedChildren(collectionId, parentId)
				: this.state.hasNextChildren(collectionId, parentId)
			;
		},
		onOpen(event: MouseEvent): void
		{
			// Modifier keys, middle and right click stay native - same rule as tree rows.
			if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
			{
				return;
			}

			event.preventDefault();
			this.$emit('open', this.item);
		},
		onDragStart(event: DragEvent): void
		{
			if (!this.canDrag)
			{
				event.preventDefault();

				return;
			}

			this.actions.startFavoriteDrag(this.item, event);
		},
		onRemove(): void
		{
			void this.actions.toggleFavorite({
				entityType: this.item.entityType,
				entityId: Number(this.item.entityId),
			});
		},
		notifyTarget(): Object
		{
			return { entityType: this.item.entityType, entityId: Number(this.item.entityId) };
		},
		onToggleNotify(): void
		{
			void this.actions.toggleFavoriteNotify(this.notifyTarget());
		},
		onSelectNotifyMode(mode: string): void
		{
			void this.actions.setFavoriteNotify(this.notifyTarget(), mode);
		},
		onClearNotify(): void
		{
			void this.actions.clearFavoriteNotify(this.notifyTarget());
		},
		// A document of the branch keeps only what it is allowed to do there: mute what
		// reaches it and lift that mute. The depth of the subscription above it is not its to change.
		nestedNotifyState(doc: Object): Object | null
		{
			// The only source of a bell for a row of the branch: no state, no bell, no room held for one.
			// Nothing else in tree-node has to know about either gate. MODES-01: what a nested row is
			// offered is a `muted` row, and while that mode is not shipped its bell would suppress
			// nothing - read from the shipped map, so returning `muted` to it brings those bells back
			// by itself.
			if (!this.notificationsEnabled
				|| !isShippedSubscriptionMode(SUBSCRIPTION_SCOPE_DOCUMENT, SUBSCRIPTION_MODE_MUTED))
			{
				return null;
			}

			return this.state.favorites.notifyOf('document', Number(doc?.id));
		},
		onToggleNestedNotify(doc: Object): void
		{
			void this.actions.toggleFavoriteNotify({ entityType: 'document', entityId: Number(doc?.id) });
		},
		onToggleExpanded(): void
		{
			void this.actions.toggleFavoriteExpanded(this.item);
		},
		onRetryBranch(): void
		{
			void this.actions.retryFavoriteBranch(this.item);
		},
		// A nested row expands in the block's space too, along the path of the row it hangs under -
		// `scope` is what keeps that path apart from the same document's other places in the block.
		nestedTarget(doc: Object): Object
		{
			return {
				entityType: 'document',
				entityId: Number(doc?.id),
				collectionId: Number(doc?.collectionId),
				expandVia: this.isSharedBranch ? 'accessibleTree' : 'tree',
				scope: this.rowScope,
			};
		},
		onToggleNested(doc: Object): void
		{
			void this.actions.toggleFavoriteExpanded(this.nestedTarget(doc));
		},
		// Read and written under one key: the branch of a nested row fails in this row's scope.
		nestedBranchError(doc: Object): string | null
		{
			return this.state.favorites.branchError('document', Number(doc?.id), this.rowScope);
		},
		onRetryNested(doc: Object): void
		{
			void this.actions.retryFavoriteBranch(this.nestedTarget(doc));
		},
		onOpenNested(doc: Object): void
		{
			void this.actions.openDocumentFromTree(doc);
		},
		onPrefetchNested(doc: Object): void
		{
			if (this.isSharedBranch)
			{
				this.actions.prefetchSharedDocumentChildren(doc);

				return;
			}

			this.actions.prefetchDocumentChildren(doc);
		},
	},
	template: `
		<div class="favorite-item" :class="{ 'is-favorite-drop-after': isDropAfterExpanded }">
			<div
				class="favorite-row"
				:class="[{ 'is-active': isActive, 'is-drag-source': isDragSource }, dropClass]"
				:data-favorite-row-id="item.id"
				:draggable="canDrag"
				@dragstart="onDragStart($event)"
				@dragend="actions.endFavoriteDrag()"
			>
				<!-- Holder of the highlight, the same one the knowledge-base and document rows carry: it
				     doubles as the row's leading inset and keeps the fill glued to the visible left edge. -->
				<span class="favorite-row__pill" aria-hidden="true"><span class="favorite-row__pill-fill"></span></span>
				<button
					v-if="canExpand"
					type="button"
					class="favorite-row__disclosure"
					:class="{ 'is-expanded': isExpanded }"
					:title="expandLabel"
					:aria-label="expandLabel"
					:aria-expanded="isExpanded.toString()"
					data-testid="note-sidebar-favorite-disclosure"
					@click.stop="onToggleExpanded"
				>
					<BIcon :name="Outline.CHEVRON_RIGHT_L" :size="16" color="var(--ui-color-base-1)" />
				</button>
				<span v-else class="favorite-row__disclosure-spacer" aria-hidden="true"></span>
				<span
					v-if="isCollection"
					class="favorite-row__icon favorite-row__icon--collection note-collection-glyph"
					aria-hidden="true"
				></span>
				<BIcon v-else class="favorite-row__icon" :name="Outline.FILE" :size="18" />
				<a
					class="favorite-row__title"
					:data-kb-name="nameReserve"
					:href="href"
					:title="item.title"
					draggable="false"
					@click="onOpen($event)"
				>{{ item.title }}</a>
				<!-- The same holder the tree rows use, so both are pinned to the visible right edge of the
				     one scroll area they share. In the flow they were pinned to the edge of the content
				     instead, and the two drifted apart by a few pixels the moment a nested row made the
				     block scroll sideways. -->
				<span class="tree-actions-anchor">
				<span class="favorite-row__actions">
					<!-- Depth to choose - the popover of the editor, one and the same control.
					     Nothing to choose - one press. -->
					<SubscriptionBellView
						v-if="hasNotifyBell && hasNotifyDepth"
						:state="bellState"
						:is-saving="isNotifySaving"
						:messages="messages.notifyPopover"
						test-id="note-sidebar-favorite-notify"
						trigger-class="favorite-row__btn favorite-row__btn--notify"
						active-class="is-on"
						muted-class="is-muted"
						teleport-to="body"
						:popover-class="popoverClass"
						icon-class="favorite-row__btn-icon"
						@select-mode="onSelectNotifyMode"
						@unsubscribe="onClearNotify"
						@mute="onSelectNotifyMode('muted')"
						@resume="onClearNotify"
					/>
					<button
						v-else-if="hasNotifyBell"
						type="button"
						class="favorite-row__btn favorite-row__btn--notify"
						:class="{ 'is-on': isNotified, 'is-muted': isMuted }"
						:title="notifyLabel"
						:aria-label="messages.notifyState"
						:aria-pressed="isNotified.toString()"
						data-testid="note-sidebar-favorite-notify"
						@click.stop="onToggleNotify"
					>
						<BIcon :name="notifyIcon" :size="16" />
					</button>
					<button
						type="button"
						class="favorite-row__btn favorite-row__btn--favorite"
						:title="messages.favoriteOff"
						:aria-label="messages.favoriteState"
						aria-pressed="true"
						@click.stop="onRemove"
					>
						<BIcon :name="Solid.FAVORITE" :size="16" />
					</button>
				</span>
				</span>
			</div>
			<ExpandTransition :loading="isBranchLoading">
			<div v-if="isExpanded" class="favorite-branch">
				<ul class="tree-branch">
					<!-- Level 1, the same level a knowledge base gives its own root documents: the row above
					     stands where a knowledge-base row stands (its chevron on the left edge of the block),
					     not where a first-level document does. Handing the children the level they have in the
					     tree put them 43px from their parent's chevron instead of 20 and left the guide line
					     running down empty space. -->
					<tree-node
						v-for="child in children"
						:key="child.id"
						:doc="child"
						:level="1"
						:selected-doc-id="state.selectedDocId"
						:expanded-docs="branchExpandedDocs"
						:get-children="getBranchChildren"
						:is-loading-children="isBranchChildrenLoading"
						:has-next-children="hasNextBranchChildren"
						:can-edit-document="canEditNestedDocument"
						:can-manage-document="canManageNestedDocument"
						:is-document-favorite="isDocumentFavorite"
						:toggle-document-favorite="toggleDocumentFavorite"
						:notify-state-of="nestedNotifyState"
						:toggle-notify="onToggleNestedNotify"
						:branch-error-of="nestedBranchError"
						:messages="messages"
						:tree-namespace="treeNamespace"
						row-context="favorites"
						@toggle="onToggleNested"
						@open="onOpenNested"
						@prefetch-children="onPrefetchNested"
						@retry-branch="onRetryNested"
					/>
					<li v-if="isBranchLoading" class="sidebar-muted">
						<SidebarLoader :level="1" />
					</li>
					<li
						v-if="hasNextBranchPage"
						class="doc-load-more-sentinel js-doc-load-more-sentinel"
						:data-collection-id="branchCollectionId"
						:data-parent-id="sentinelParentId"
						:data-tree-namespace="treeNamespace"
						aria-hidden="true"
					/>
				</ul>
				<!-- The failure of one branch stays in its own row. An empty branch is not a
				     failure: personal grants can leave a branch with nothing visible in it. -->
				<div v-if="branchError !== null" class="favorites-empty">
					{{ branchError }}
					<button type="button" class="favorites-retry" @click="onRetryBranch">
						{{ messages.favoritesRetry }}
					</button>
				</div>
			</div>
			</ExpandTransition>
		</div>
	`,
};
