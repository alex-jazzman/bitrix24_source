import { BIcon } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { NoteAnalytics } from 'note.analytics';

import type { SidebarDocument } from '../type';
import { SidebarLoader } from './sidebar-loader';
import { ExpandTransition } from './expand-transition';

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
		messages: { type: Object, required: true },
		docDragItem: { type: Object, default: null },
		docDropTarget: { type: Object, default: null },
		renamingDocId: { type: Number, default: null },
	},
	data()
	{
		return {
			renameCancelled: false,
		};
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
	],
	computed: {
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
				return '';
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
		canEditCurrentDocument(): boolean
		{
			return Boolean(this.canEditDocument(this.doc));
		},
		canManageCurrentDocument(): boolean
		{
			return Boolean(this.canManageDocument(this.doc));
		},
		rowStyle(): Object
		{
			const level = Number.isFinite(Number(this.level)) ? Number(this.level) : 1;
			const indent = 16 + Math.max(level, 1) * 24;

			return { '--indent': `${indent}px` };
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
			if (!this.canManageCurrentDocument)
			{
				return;
			}

			event.stopPropagation();
			this.$emit('create-child', this.doc);
		},
		onDragStart(event: DragEvent): void
		{
			if (!this.canManageCurrentDocument)
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
				:data-doc-id="doc.id"
				:class="[
					{ 'is-active': selectedDocId === Number(doc.id) },
					dropClass,
					{ 'is-drag-source': isDragSource },
					{ 'has-actions': canManageCurrentDocument && !isRenaming }
					]"
				:style="rowStyle"
				:draggable="canManageCurrentDocument && !isRenaming"
				@mouseenter="onPrefetchChildren"
				@dragstart="onDragStart"
				@dragend="onDragEnd"
			>
				<span
					class="tree-item tree-button"
					:title="isRenaming ? null : getDocumentTitle(doc)"
				>
					<button v-if="canExpand" type="button" class="tree-disclosure"
							:class="{ 'is-expanded': isExpanded }"
							@click="onToggle">
						<BIcon name="chevron-right-l" :size="16" color="var(--ui-color-accent-main-primary)" />
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
						:href="docHref"
						draggable="false"
						@click="onTitleClick"
					>{{ doc.title }}</a>
				</span>
				<div v-if="canManageCurrentDocument && !isRenaming" class="tree-actions">
					<button class="row-action-btn" type="button" @click="onCreateChild">
						<BIcon name="plus-l" :size="24" color="var(--ui-color-accent-main-primary)" />
					</button>
				</div>
				<span v-if="dropClass === 'is-drop-inside'" class="drop-overlay"/>
			</div>
			<ExpandTransition :loading="isLoadingChildren(doc.collectionId, doc.id)">
			<ul
				v-if="isExpanded"
				class="tree-branch tree-children"
				@dragenter="onChildrenDragEnter"
				@dragover.stop="onChildrenDragOver"
				@drop.stop="onChildrenDrop"
			>
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
					:messages="messages"
					:doc-drag-item="docDragItem"
					:doc-drop-target="docDropTarget"
					:renaming-doc-id="renamingDocId"
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
				/>
				<li v-if="isLoadingChildren(doc.collectionId, doc.id)" class="sidebar-muted">
					<SidebarLoader :level="level + 1" />
				</li>
				<li
					v-if="hasNextChildren(doc.collectionId, doc.id)"
					class="doc-load-more-sentinel js-doc-load-more-sentinel"
					:data-collection-id="doc.collectionId"
					:data-parent-id="doc.id"
					aria-hidden="true"
				/>
			</ul>
			</ExpandTransition>
		</li>
	`,
};
