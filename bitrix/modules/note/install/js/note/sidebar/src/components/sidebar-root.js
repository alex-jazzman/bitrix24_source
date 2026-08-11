import { TreeNode } from './tree-node';
import { SidebarSearchRow } from './sidebar-search-row';
import { SidebarFooter } from './sidebar-footer';
import { SidebarLoader } from './sidebar-loader';
import { ExpandTransition } from './expand-transition';
import { Dom, Event, Loc, Type } from 'main.core';
import { BIcon } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { NoteAnalytics } from 'note.analytics';
import type { Collection } from '../type';

export const SidebarRootComponent = {
	name: 'SidebarRootComponent',
	components: {
		TreeNode,
		SidebarSearchRow,
		SidebarFooter,
		SidebarLoader,
		BIcon,
		ExpandTransition,
	},
	props: {
		state: { type: Object, required: true },
		actions: { type: Object, required: true },
		messages: { type: Object, required: true },
		themeActions: { type: Object, default: null },
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
		};
	},
	mounted()
	{
		const content = this.$refs.sidebarContent;
		if (content)
		{
			this.dragOverCaptureHandler = (event) => this.onDragOverCapture(event);
			content.addEventListener('dragover', this.dragOverCaptureHandler, true);
			this.dragScrollDuringDrag = () => this.onScrollDuringDrag();
			content.addEventListener('scroll', this.dragScrollDuringDrag, { passive: true });
		}
	},
	beforeUnmount()
	{
		this.clearSidebarResizeState();
		this.stopDragAutoScroll();
		const content = this.$refs.sidebarContent;
		if (content && this.dragOverCaptureHandler)
		{
			content.removeEventListener('dragover', this.dragOverCaptureHandler, true);
		}
		if (content && this.dragScrollDuringDrag)
		{
			content.removeEventListener('scroll', this.dragScrollDuringDrag);
		}
	},
	watch: {
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
		onSidebarScroll(event: Event): void
		{
			if (!this.state.collectionsSectionExpanded)
			{
				return;
			}

			const target = event.target;
			if (!(target instanceof HTMLElement))
			{
				return;
			}

			const offsetToBottom = target.scrollHeight - (target.scrollTop + target.clientHeight);
			if (offsetToBottom <= 64)
			{
				void this.actions.loadMoreCollections();
			}

			this.tryAutoLoadDocuments(target);
		},
		tryAutoLoadDocuments(container: HTMLElement): void
		{
			const sentinels = container.querySelectorAll('.js-doc-load-more-sentinel');
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
			this.actions.onCollectionViewportDragOver(event);
			this.actions.onDocViewportDragOver(event);
		},
		onContentDrop(event: DragEvent): void
		{
			this.stopDragAutoScroll();
			this.actions.onCollectionViewportDrop(event);
			this.actions.onDocViewportDrop(event);
		},
		isAnyDragActive(): boolean
		{
			return Boolean(this.state.docDragItem) || Boolean(this.state.collectionDragItem);
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
		updateDragAutoScrollSpeed(): void
		{
			const content = this.$refs.sidebarContent;
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

				const content = this.$refs.sidebarContent;
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
			if (this.state.docDragItem)
			{
				this.actions.onDocCollectionDragOver(collection, event);

				return;
			}

			this.actions.onCollectionDragOver(collection, event);
		},
		onCollectionRowDrop(collection: Collection, event: DragEvent): void
		{
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
	},
	template: `
		<aside
			class="sidebar"
			:class="{ 'is-collapsed': state.sidebarCollapsed, 'is-dragging': isAnyDragActive() }"
			:style="{ '--note-sidebar-width': \`\${state.sidebarEffectiveWidth}px\` }"
		>
			<SidebarSearchRow
				:state="state"
				:actions="actions"
				@navigate-document="onSearchNavigateDocument"
				@navigate-search="onSearchNavigateSearch"
			/>
			<div
				class="sidebar-layout"
				@dragover="onContentDragOver($event)"
				@drop="onContentDrop($event)"
			>
				<div
					class="sidebar-content"
					ref="sidebarContent"
					@scroll.passive="onSidebarScroll"
				>
					<div class="sidebar-sections">
						<button
							type="button"
							class="sidebar-fixed-row"
							:class="{ 'is-active': state.selectedSharedView }"
							@click="actions.navigateToShared()"
						>
							<BIcon class="sidebar-fixed-row__icon" name="o-forward" :size="30" color="var(--ui-color-accent-main-primary)" />
							<span class="sidebar-fixed-row__title">{{ messages.sharedWithMe }}</span>
						</button>
						<button
							type="button"
							class="sidebar-section-header"
							:title="state.collectionsSectionExpanded ? messages.collapseCollections : messages.expandCollections"
							@click="actions.toggleCollectionsSection()"
						>
							<span class="sidebar-section-header__icon" aria-hidden="true"></span>
							<span class="sidebar-section-header__title">{{ messages.collections }}</span>
							<span
								class="sidebar-section-header__chevron"
								:class="{ 'is-expanded': state.collectionsSectionExpanded }"
							>
								<BIcon name="chevron-right-l" :size="16" color="var(--ui-color-accent-main-primary)" />
							</span>
						</button>
						<ExpandTransition :loading="state.collectionsLoading && !state.collections.length">
						<div
							v-if="state.collectionsSectionExpanded"
							class="collection-list"
							@dragover="actions.onCollectionListDragOver($event)"
							@drop="actions.onCollectionListDrop($event)"
						>
							<div v-if="state.collectionsLoading && !state.collections.length" class="sidebar-muted">
								<SidebarLoader :level="0" />
							</div>
							<template v-else>
								<div
									v-for="collection in state.collections"
									:key="collection.id"
									:class="{ 'is-collection-drop-after': isCollectionDropAfterExpanded(collection) }"
								>
									<div
										class="collection-row"
										:data-collection-id="collection.id"
										:class="[
										{ 'is-active': state.selectedCollectionId === Number(collection.id) && !state.selectedDocId },
										collectionDropClass(collection),
										{ 'is-drop-inside': isDocDropInsideCollection(collection) },
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
									<span
										class="collection-link"
										:title="isRenamingCollection(collection) ? null : getCollectionTitle(collection)"
									>
										<button
											v-if="!isRenamingCollection(collection)"
											type="button"
											class="collection-disclosure"
											:class="{ 'is-expanded': actions.isCollectionExpanded(collection.id) }"
											@click.stop="actions.toggleCollectionExpanded(collection)"
										>
											<BIcon name="chevron-right-l" :size="16" color="var(--ui-color-accent-main-primary)" />
										</button>
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
											:href="collectionHref(collection)"
											draggable="false"
											@click="onCollectionTitleClick(collection, $event)"
										>{{ collection.name }}</a>
									</span>
									<div v-if="!isRenamingCollection(collection)" class="collection-actions">
										<button
											v-if="canEditCollection(collection)"
											class="row-action-btn"
											type="button"
											:title="messages.createDocument"
											:aria-label="messages.createDocument"
											@click.stop="actions.createDocumentForCollection(collection)"
										>
											<BIcon name="plus-l" :size="24" color="var(--ui-color-accent-main-primary)" />
										</button>
									</div>
										<span v-if="isDocDropInsideCollection(collection)"
											  class="collection-drop-overlay"/>
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
											<tree-node
												v-for="doc in state.getRootDocs(collection.id)"
												:key="doc.id"
												:doc="doc"
												:level="1"
												:selected-doc-id="state.selectedDocId"
												:expanded-docs="state.expandedDocs"
												:get-children="state.getChildren"
												:is-loading-children="state.isLoadingChildren"
												:has-next-children="state.hasNextChildren"
												:can-edit-document="actions.canEditDocument"
												:can-manage-document="actions.canManageDocument"
												:messages="messages"
												:doc-drag-item="state.docDragItem"
												:doc-drop-target="state.docDropTarget"
												:renaming-doc-id="state.renamingDocId"
												@toggle="actions.toggleDoc"
												@open="actions.openDocument"
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
											/>
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
								<div v-if="!state.collections.length"
									 class="sidebar-muted">{{ messages.emptyCollections }}
								</div>
								<div v-if="state.collectionsLoading && state.collections.length" class="sidebar-muted">
									<SidebarLoader :level="0" />
								</div>
							</template>
						</div>
						</ExpandTransition>
						<button
							type="button"
							class="sidebar-fixed-row"
							:class="{ 'is-active': state.selectedArchiveView }"
							@click="actions.navigateToArchive()"
						>
							<BIcon class="sidebar-fixed-row__icon" name="o-box-with-lid" :size="30" color="var(--ui-color-accent-main-primary)" />
							<span class="sidebar-fixed-row__title">{{ messages.archive }}</span>
						</button>
					</div>
				</div>
			</div>
			<SidebarFooter
				:state="state"
				:actions="actions"
				:theme-actions="themeActions"
				@toggle-collapsed="onToggleSidebarCollapsed"
			/>
			<div
				v-if="!state.sidebarCollapsed"
				class="sidebar-resizer"
				role="separator"
				aria-orientation="vertical"
				aria-label="Resize sidebar"
				@mousedown="onSidebarResizeStart"
			></div>
		</aside>
	`,
};
