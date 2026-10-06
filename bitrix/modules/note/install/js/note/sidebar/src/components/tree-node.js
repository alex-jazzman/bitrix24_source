import { BIcon, Outline, Solid } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import 'ui.icon-set.solid';
import { NoteAnalytics } from 'note.analytics';

import type { SidebarDocument } from '../type';
import { SidebarLoader } from './sidebar-loader';
import { ExpandTransition } from './expand-transition';
import { rowNameReserve } from '../utils/row-controls';

// Geometry of a level, shared by the indent a row is drawn at and by the guides that run down through the
// levels above it. Held here in one place because the two have to agree to the pixel: a guide is only in
// true when it passes through the middle of the chevron of the row it hangs under.
const INDENT_BASE = 12;
const INDENT_STEP = 20;
// What the chevron shows: 16px of glyph. `.tree-disclosure` carries a tap target the height of the row and
// pulls it back with negative margins, so the glyph sits where the 16px footprint is and not where the
// button's own box starts.
const GLYPH_SIZE = 16;
// Distance from the end of the indent spacer to that glyph, and the gap the spacer itself gives back:
// `.tree-row__indent` is the indent less one gap (--ui-space-inline-2xs), and the chevron follows it across
// another gap of the row's own.
const GLYPH_LEAD = 6;
const ROW_GAP = 4;

// The spacer at the head of a row of this level, exactly as `.tree-row__indent` works it out from `--indent`.
function indentSpacerWidth(level: number): number
{
	return INDENT_BASE + level * INDENT_STEP - ROW_GAP;
}

export const TreeNode = {
	name: 'TreeNode',
	components: {
		BIcon,
		SidebarLoader,
		ExpandTransition,
	},
	props: {
		doc: { type: Object, required: true },
		level: { type: Number, default: 1 },
		selectedDocId: { type: Number, default: null },
		expandedDocs: { type: Object, required: true },
		getChildren: { type: Function, required: true },
		isLoadingChildren: { type: Function, required: true },
		hasNextChildren: { type: Function, required: true },
		canEditDocument: { type: Function, required: true },
		canManageDocument: { type: Function, required: true },
		// [TPL-02] The star of the row: state and toggle both belong to the store, the row only asks.
		isDocumentFavorite: { type: Function, required: true },
		toggleDocumentFavorite: { type: Function, required: true },
		// [P4.T5] The bell of a row drawn inside the favorites block: its coverage state (DTO-02) and
		// the one gesture it offers. Absent in the tree - the tree draws no bells at all (AC-048).
		notifyStateOf: { type: Function, default: null },
		toggleNotify: { type: Function, default: null },
		// [ERR-005] The failure of the branch THIS row opened, asked for in the block's own space. Absent
		// in the tree: there a branch that fails to arrive is reported by the section, not by the row.
		branchErrorOf: { type: Function, default: null },
		messages: { type: Object, required: true },
		docDragItem: { type: Object, default: null },
		docDropTarget: { type: Object, default: null },
		fileDropTarget: { type: Object, default: null },
		renamingDocId: { type: Number, default: null },
		// Which tree this node belongs to. Only the load-more sentinel reads it: the sidebar
		// scroll handler routes a sentinel to the matching branch loader (collection vs shared).
		treeNamespace: { type: String, default: 'collection' },
		// [P2] Where the row is drawn: the tree ('tree') or a branch of the favorites block
		// ('favorites'). In the block the row keeps its title and its star, loses the gestures that do not
		// act there - dragging rows and creating a child - and gains the bell. Everything else lays out
		// identically in both: one row component for both contexts, never a copy.
		rowContext: { type: String, default: 'tree' },
	},
	inject: {
		noteScheduleTreeMetrics: { default: null },
	},
	data()
	{
		return {
			renameCancelled: false,
		};
	},
	// A row's title is capped against the visible right edge by a measure pass in the sidebar
	// root. Only the row itself knows when it appeared or when its controls changed width.
	mounted(): void
	{
		this.noteScheduleTreeMetrics?.();
	},
	updated(): void
	{
		this.noteScheduleTreeMetrics?.();
	},
	emits: [
		'toggle',
		'open',
		'prefetch-children',
		'load-more',
		'start-drag',
		'branch-drag-enter',
		'branch-drag-over',
		'branch-drop',
		'end-drag',
		'create-child',
		'rename-doc',
		'delete-doc',
		'confirm-rename-doc',
		'cancel-rename-doc',
		'file-drag-over',
		'file-drop',
		'retry-branch',
	],
	computed: {
		Outline: (): typeof Outline => Outline,
		Solid: (): typeof Solid => Solid,
		isExpanded(): boolean
		{
			return Boolean(this.expandedDocs[this.doc.id]);
		},
		children(): SidebarDocument[]
		{
			return this.getChildren(this.doc.collectionId, this.doc.id);
		},
		dropClass(): string
		{
			const target = this.docDropTarget;
			if (!target || Number(target.targetId) !== Number(this.doc.id))
			{
				return this.isFileDropTarget ? 'is-drop-inside' : '';
			}

			if (target.placement === 'before')
			{
				return 'is-drop-before';
			}

			if (target.placement === 'after')
			{
				if (this.isExpanded && this.children.length > 0)
				{
					return '';
				}

				return 'is-drop-after';
			}

			if (target.placement === 'inside')
			{
				return 'is-drop-inside';
			}

			return '';
		},
		isFileDropTarget(): boolean
		{
			return Boolean(this.fileDropTarget) && Number(this.fileDropTarget.parentId) === Number(this.doc.id);
		},
		isDropAfterExpanded(): boolean
		{
			const target = this.docDropTarget;
			if (!target || Number(target.targetId) !== Number(this.doc.id))
			{
				return false;
			}

			return target.placement === 'after' && this.isExpanded && this.children.length > 0;
		},
		isDragSource(): boolean
		{
			return Boolean(this.docDragItem && Number(this.docDragItem.id) === Number(this.doc.id));
		},
		canExpand(): boolean
		{
			return Boolean(this.doc.hasChildren || this.children.length > 0 || this.isExpanded);
		},
		isFavoritesContext(): boolean
		{
			return this.rowContext === 'favorites';
		},
		// The branch of a row is a drop target of the tree. In the block there is nothing to drop into
		// it, and the listeners themselves have to go: they stop the drag events on their way up, and a
		// drag over the block would stop being seen by the sidebar underneath.
		branchDragHandlers(): Object
		{
			if (this.isFavoritesContext)
			{
				return {};
			}

			return {
				dragenter: this.onChildrenDragEnter,
				dragover: (event: DragEvent) => {
					event.stopPropagation();
					this.onChildrenDragOver(event);
				},
				drop: (event: DragEvent) => {
					event.stopPropagation();
					this.onChildrenDrop(event);
				},
			};
		},
		canDragCurrentDocument(): boolean
		{
			return this.canManageCurrentDocument && !this.isRenaming && !this.isFavoritesContext;
		},
		canEditCurrentDocument(): boolean
		{
			return Boolean(this.canEditDocument(this.doc));
		},
		canManageCurrentDocument(): boolean
		{
			return Boolean(this.canManageDocument(this.doc));
		},
		normalizedLevel(): number
		{
			const level = Number.isFinite(Number(this.level)) ? Number(this.level) : 1;

			return Math.max(level, 1);
		},
		rowStyle(): Object
		{
			// Depth is counted from the collection row, which sits one step above level 1.
			const indent = INDENT_BASE + this.normalizedLevel * INDENT_STEP;

			return { '--indent': `${indent}px` };
		},
		// Vertical guides under every ancestor level - the collection row plus each parent document. A guide
		// belongs to the row above it and has to run down the middle of that row's chevron: that is the line
		// the eye follows from a parent to its children, and a couple of pixels beside it read as a row that
		// is out of true rather than as a line that is.
		//
		// In the block the first ancestor is the row of the block, which stands exactly where a knowledge-base
		// row stands, so the same offsets serve both.
		guideOffsets(): number[]
		{
			// The knowledge base at the head of the list, then every parent document down to this row.
			const offsets = [INDENT_BASE + GLYPH_SIZE / 2];
			for (let level = 1; level < this.normalizedLevel; level++)
			{
				offsets.push(indentSpacerWidth(level) + GLYPH_LEAD + GLYPH_SIZE / 2);
			}

			return offsets;
		},
		isFavorite(): boolean
		{
			return this.isDocumentFavorite(this.doc) === true;
		},
		// [DTO-02] Coverage of this document, as the block read it for the whole branch at once.
		notifyState(): Object | null
		{
			if (!this.isFavoritesContext || typeof this.notifyStateOf !== 'function')
			{
				return null;
			}

			return this.notifyStateOf(this.doc);
		},
		isNotified(): boolean
		{
			return this.notifyState?.notified === true;
		},
		// A mute is a negative override of coverage from above: once that coverage is gone (the
		// subscription on the knowledge base switched off, the subtree one lifted) the row it left behind
		// suppresses nothing. Drawing a bell for it would keep a control on a document that notifications
		// no longer reach.
		isMuteInEffect(): boolean
		{
			return this.notifyState?.muted === true && this.notifyState?.inherited === true;
		},
		// [AC-048] A bell appears where it has something to say: notifications reach this document,
		// they are muted on it, or the document is in the list itself. Nowhere else.
		hasNotifyBell(): boolean
		{
			return this.notifyState !== null && (this.isNotified || this.isMuteInEffect || this.isFavorite);
		},
		// Does the bell stay on screen with the pointer away. Only then does the title have to leave room
		// for it: a bell that shows up on hover behaves like the "create child" button of the tree and is
		// allowed to cover the tail of the title, and reserving room for it shortened the title of a row
		// of the block against the same row in the tree.
		isNotifyBellPersistent(): boolean
		{
			return this.hasNotifyBell && (this.isNotified || this.isMuteInEffect);
		},
		notifyIcon(): string
		{
			if (this.isMuteInEffect)
			{
				return Outline.NOTIFICATION_OFF;
			}

			return this.isNotified ? Solid.NOTIFICATION : Outline.NOTIFICATION;
		},
		notifyLabel(): string
		{
			return this.isNotified ? this.messages.notifyOff : this.messages.notifyOn;
		},
		// Named and stateful like the chevron of a row of the favorites block, out of the same pair of
		// phrases: holding nothing but an icon, the button had no accessible name at all.
		disclosureLabel(): string
		{
			return this.isExpanded ? this.messages.favoriteCollapse : this.messages.favoriteExpand;
		},
		favoriteLabel(): string
		{
			return this.isFavorite ? this.messages.favoriteOff : this.messages.favoriteOn;
		},
		// Space kept free at the row's right edge when the title is measured against the visible
		// area. An active star stays visible without hover, so it needs room of its own; the rest
		// of the controls only show on hover and are allowed to overlap the title's tail.
		nameReserve(): string
		{
			return rowNameReserve({ isFavorite: this.isFavorite, hasBell: this.isNotifyBellPersistent });
		},
		branchError(): string | null
		{
			if (!this.isFavoritesContext || typeof this.branchErrorOf !== 'function')
			{
				return null;
			}

			return this.branchErrorOf(this.doc);
		},
		// Level of the children of this row - the notice stands with them, not with the row above.
		branchErrorStyle(): Object
		{
			return { paddingLeft: `${16 + (this.normalizedLevel + 1) * 24}px` };
		},
		isRenaming(): boolean
		{
			return this.renamingDocId === Number(this.doc.id);
		},
		docHref(): string
		{
			const id = Number(this.doc?.id);

			return Number.isFinite(id) && id > 0 ? `/note/document/${id}/` : '';
		},
	},
	watch: {
		isRenaming(value)
		{
			this.renameCancelled = false;
			if (value)
			{
				this.$nextTick(() => {
					const input = this.$refs.renameInput;
					if (input)
					{
						input.focus();
						input.select();
					}
				});
			}
		},
	},
	methods: {
		getDocumentTitle(doc: SidebarDocument): string | null
		{
			const title = String(doc?.title ?? '').trim();

			return title === '' ? null : title;
		},
		onToggle(event: Event): void
		{
			event.stopPropagation();
			this.$emit('toggle', this.doc);
		},
		onOpen(): void
		{
			NoteAnalytics.documentViewed('side_menu');
			this.$emit('open', this.doc);
			if (!this.canExpand)
			{
				return;
			}

			const isCurrent = Number(this.selectedDocId) === Number(this.doc.id);
			if (isCurrent || !this.isExpanded)
			{
				this.$emit('toggle', this.doc);
			}
		},
		onTitleClick(event: MouseEvent): void
		{
			if (this.isRenaming)
			{
				return;
			}
			// Let the browser handle modifier keys, middle/right click natively
			if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
			{
				return;
			}
			event.preventDefault();
			this.onOpen();
		},
		onPrefetchChildren(): void
		{
			this.$emit('prefetch-children', this.doc);
		},
		onCreateChild(event: Event): void
		{
			if (!this.canManageCurrentDocument || this.isFavoritesContext)
			{
				return;
			}

			event.stopPropagation();
			this.$emit('create-child', this.doc);
		},
		onToggleFavorite(event: Event): void
		{
			event.stopPropagation();
			// The namespace of the row goes with it: the block reads the branch of a starred document
			// through the tree the row was starred in (expandVia in DTO-01).
			this.toggleDocumentFavorite(this.doc, {
				expandVia: this.treeNamespace === 'shared' ? 'accessibleTree' : 'tree',
			});
		},
		onToggleNotify(event: Event): void
		{
			event.stopPropagation();
			if (typeof this.toggleNotify === 'function')
			{
				this.toggleNotify(this.doc);
			}
		},
		onDragStart(event: DragEvent): void
		{
			if (!this.canDragCurrentDocument)
			{
				event.preventDefault();

				return;
			}

			this.$emit('start-drag', { doc: this.doc, nativeEvent: event });
		},
		onDragEnd(): void
		{
			this.$emit('end-drag');
		},
		onFileDragOver(event: DragEvent): void
		{
			// A dropped file becomes a document inside the row it landed on - a tree gesture, and the
			// block is not the tree.
			if (this.isFavoritesContext || !event.dataTransfer?.types?.includes('Files'))
			{
				return;
			}

			event.preventDefault();
			this.$emit('file-drag-over', { doc: this.doc, nativeEvent: event });
		},
		onFileDrop(event: DragEvent): void
		{
			if (this.isFavoritesContext || !event.dataTransfer?.types?.includes('Files'))
			{
				return;
			}

			event.preventDefault();
			event.stopPropagation();
			this.$emit('file-drop', { doc: this.doc, nativeEvent: event });
		},
		onChildrenDragEnter(event: DragEvent): void
		{
			this.$emit('branch-drag-enter', {
				branchElement: event.currentTarget,
				collectionId: this.doc.collectionId,
				parentId: this.doc.id,
				nativeEvent: event,
			});
		},
		onChildrenDragOver(event: DragEvent): void
		{
			this.$emit('branch-drag-over', {
				branchElement: event.currentTarget,
				collectionId: this.doc.collectionId,
				parentId: this.doc.id,
				nativeEvent: event,
			});
		},
		onChildrenDrop(event: DragEvent): void
		{
			this.$emit('branch-drop', {
				branchElement: event.currentTarget,
				collectionId: this.doc.collectionId,
				parentId: this.doc.id,
				nativeEvent: event,
			});
		},
		onRenameKeyEnter(event: KeyboardEvent): void
		{
			event.target.blur();
		},
		onRenameKeyEscape(): void
		{
			this.renameCancelled = true;
			this.$refs.renameInput?.blur();
		},
		onRenameBlur(event: FocusEvent): void
		{
			if (this.renameCancelled)
			{
				this.$emit('cancel-rename-doc');

				return;
			}

			const value = event.target.value.trim();
			if (!value)
			{
				this.$emit('cancel-rename-doc');

				return;
			}

			this.$emit('confirm-rename-doc', { doc: this.doc, title: value });
		},
	},
	template: `
		<li :class="{ 'is-drop-after': isDropAfterExpanded }" :style="isDropAfterExpanded ? rowStyle : null">
			<div
				class="tree-row"
				data-tree-row
				:data-doc-id="doc.id"
				:class="[
					{ 'is-active': selectedDocId === Number(doc.id) },
					dropClass,
					{ 'is-drag-source': isDragSource },
					{ 'has-actions': canManageCurrentDocument && !isRenaming }
					]"
				:style="rowStyle"
				:draggable="canDragCurrentDocument"
				@mouseenter="onPrefetchChildren"
				@dragstart="onDragStart"
				@dragend="onDragEnd"
				@dragover="onFileDragOver($event)"
				@drop="onFileDrop($event)"
			>
				<span class="tree-row__pill" aria-hidden="true"><span class="tree-row__pill-fill"></span></span>
				<span
					v-for="offset in guideOffsets"
					:key="offset"
					class="tree-row__guide"
					:style="{ left: offset + 'px' }"
					aria-hidden="true"
				></span>
				<span class="tree-row__peek" aria-hidden="true">
					<span class="tree-row__peek-inner">
						<span class="tree-row__peek-rest">
							<button
								v-if="canExpand"
								type="button"
								class="tree-row__peek-chevron"
								:class="{ 'is-expanded': isExpanded }"
								tabindex="-1"
								@click="onToggle"
							>
								<BIcon name="chevron-right-l" :size="16" />
							</button>
							<span class="tree-row__peek-title">{{ doc.title }}</span>
						</span>
					</span>
				</span>
				<span
					class="tree-item tree-button"
					:title="isRenaming ? null : getDocumentTitle(doc)"
				>
					<span class="tree-row__indent" aria-hidden="true"></span>
					<button v-if="canExpand" type="button" class="tree-disclosure"
							:class="{ 'is-expanded': isExpanded }"
							:aria-label="disclosureLabel"
							:aria-expanded="isExpanded.toString()"
							data-testid="note-sidebar-doc-disclosure"
							@click="onToggle">
						<BIcon name="chevron-right-l" :size="16" color="var(--ui-color-base-1)" />
					</button>
					<span v-else class="tree-disclosure-spacer"></span>
					<input
						v-if="isRenaming"
						class="tree-title-input"
						type="text"
						:value="doc.title"
						@keydown.enter="onRenameKeyEnter($event)"
						@keydown.escape="onRenameKeyEscape"
						@blur="onRenameBlur($event)"
						@click.stop
						ref="renameInput"
					/>
					<a
						v-else
						class="tree-title tree-title-link"
						:data-kb-name="nameReserve"
						:href="docHref"
						draggable="false"
						@click="onTitleClick"
					>{{ doc.title }}</a>
				</span>
				<span v-if="!isRenaming" class="tree-actions-anchor">
					<span class="tree-actions">
						<!-- [P4.T5] The bell of a row of the block: filled where notifications arrive,
						     struck through where they are muted. A row with neither draws nothing and holds
						     no room - exactly like the "create child" button of the tree, so a row of the
						     block lays out identically to the same row in the tree. -->
						<button
							v-if="hasNotifyBell"
							type="button"
							class="row-action-btn row-action-btn--notify"
							:class="{ 'is-on': isNotified, 'is-muted': isMuteInEffect }"
							:title="notifyLabel"
							:aria-label="messages.notifyState"
							:aria-pressed="isNotified.toString()"
							@click="onToggleNotify($event)"
						>
							<BIcon :name="notifyIcon" :size="16" />
						</button>
						<button
							v-if="canManageCurrentDocument && !isFavoritesContext"
							class="row-action-btn row-action-btn--create"
							type="button"
							:title="messages.createChildDocument"
							:aria-label="messages.createChildDocument"
							data-testid="note-sidebar-doc-create-child"
							@click="onCreateChild"
						>
							<BIcon name="plus-l" :size="20" />
						</button>
						<button
							class="row-action-btn row-action-btn--favorite"
							:class="{ 'is-on': isFavorite }"
							type="button"
							:title="favoriteLabel"
							:aria-label="messages.favoriteState"
							:aria-pressed="isFavorite.toString()"
							data-testid="note-sidebar-doc-favorite"
							@click="onToggleFavorite($event)"
						>
							<BIcon :name="isFavorite ? Solid.FAVORITE : Outline.FAVORITE" :size="16" />
						</button>
					</span>
				</span>
			</div>
			<ExpandTransition :loading="isLoadingChildren(doc.collectionId, doc.id)">
			<ul
				v-if="isExpanded"
				class="tree-branch tree-children"
				v-on="branchDragHandlers"
			>
				<!-- Move-only group: a row dragged to another place travels there instead of jumping (the
				     same 120ms the favorites block uses). No enter or leave here - appearing and
				     disappearing branches are already animated by ExpandTransition around this list. -->
				<TransitionGroup name="sidebar-row">
				<tree-node
					v-for="child in children"
					:key="child.id"
					:doc="child"
					:level="level + 1"
					:selected-doc-id="selectedDocId"
					:expanded-docs="expandedDocs"
					:get-children="getChildren"
					:is-loading-children="isLoadingChildren"
					:has-next-children="hasNextChildren"
					:can-edit-document="canEditDocument"
					:can-manage-document="canManageDocument"
					:is-document-favorite="isDocumentFavorite"
					:toggle-document-favorite="toggleDocumentFavorite"
					:notify-state-of="notifyStateOf"
					:toggle-notify="toggleNotify"
					:branch-error-of="branchErrorOf"
					:messages="messages"
					:doc-drag-item="docDragItem"
					:doc-drop-target="docDropTarget"
					:file-drop-target="fileDropTarget"
					:renaming-doc-id="renamingDocId"
					:tree-namespace="treeNamespace"
					:row-context="rowContext"
					@toggle="$emit('toggle', $event)"
					@open="$emit('open', $event)"
					@prefetch-children="$emit('prefetch-children', $event)"
					@load-more="$emit('load-more', $event)"
					@start-drag="$emit('start-drag', $event)"
					@branch-drag-enter="$emit('branch-drag-enter', $event)"
					@branch-drag-over="$emit('branch-drag-over', $event)"
					@branch-drop="$emit('branch-drop', $event)"
					@end-drag="$emit('end-drag')"
					@create-child="$emit('create-child', $event)"
					@rename-doc="$emit('rename-doc', $event)"
					@delete-doc="$emit('delete-doc', $event)"
					@confirm-rename-doc="$emit('confirm-rename-doc', $event)"
					@cancel-rename-doc="$emit('cancel-rename-doc')"
					@file-drag-over="$emit('file-drag-over', $event)"
					@file-drop="$emit('file-drop', $event)"
					@retry-branch="$emit('retry-branch', $event)"
				/>
				</TransitionGroup>
				<li v-if="isLoadingChildren(doc.collectionId, doc.id)" class="sidebar-muted">
					<SidebarLoader :level="level + 1" />
				</li>
				<!-- [ERR-005] The failure of a nested branch stays in the row that opened it, with the same
				     second attempt a top-level row of the block offers. -->
				<li
					v-if="branchError !== null"
					class="sidebar-muted sidebar-muted--flow favorites-empty"
					:style="branchErrorStyle"
				>
					{{ branchError }}
					<button type="button" class="favorites-retry" @click="$emit('retry-branch', doc)">
						{{ messages.favoritesRetry }}
					</button>
				</li>
				<li
					v-if="hasNextChildren(doc.collectionId, doc.id)"
					class="doc-load-more-sentinel js-doc-load-more-sentinel"
					:data-collection-id="doc.collectionId"
					:data-parent-id="doc.id"
					:data-tree-namespace="treeNamespace"
					aria-hidden="true"
				/>
			</ul>
			</ExpandTransition>
		</li>
	`,
};
