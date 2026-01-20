import { Dom, Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';

import { mapGetters } from 'ui.vue3.vuex';

import { EventName, Model } from 'tasks.v2.const';
import { highlighter } from 'tasks.v2.lib.highlighter';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { CheckListModel } from 'tasks.v2.model.check-list';

import { Context } from '../../lib/check-list-const';
import { CheckListItemDragManager } from '../../lib/check-list-item-drag-manager';
import { CheckListListDragManager } from '../../lib/check-list-list-drag-manager';
import { CheckListManager } from '../../lib/check-list-manager';

import { CheckListParentItem } from './component/check-list-parent-item';
import { CheckListChildItem } from './component/check-list-child-item';
import { CheckListAddItem } from './component/check-list-add-item';
import { CheckListDropList } from './component/check-list-drop-list';
import { CheckListDropItem } from './component/check-list-drop-item';
import { CheckListGroupCompletedList } from './component/check-list-group-completed-list';

import './check-list-widget.css';

// @vue/component
export const CheckListWidget = {
	name: 'CheckListWidget',
	components: {
		CheckListParentItem,
		CheckListChildItem,
		CheckListAddItem,
		CheckListDropList,
		CheckListDropItem,
		CheckListGroupCompletedList,
	},
	inject: {
		task: {},
		taskId: {},
	},
	props: {
		context: {
			type: String,
			required: true,
		},
		checkListId: {
			type: [Number, String],
			default: 0,
		},
		parentId: {
			type: [Number, String],
			default: 0,
		},
		isPreview: {
			type: Boolean,
			default: false,
		},
	},
	emits: [
		'show',
		'update',
		'addItem',
		'addItemFromBtn',
		'removeItem',
		'focus',
		'blur',
		'emptyBlur',
		'startGroupMode',
		'toggleGroupModeSelected',
		'openCheckList',
	],
	setup(): { task: TaskModel } {},
	data(): Object
	{
		return {
			scrollContainer: null,
		};
	},
	computed: {
		...mapGetters({
			currentUserId: `${Model.Interface}/currentUserId`,
			disableCheckListAnimations: `${Model.Interface}/disableCheckListAnimations`,
			draggedCheckListId: `${Model.Interface}/draggedCheckListId`,
		}),
		checkLists(): CheckListModel[]
		{
			return this.$store.getters[`${Model.CheckList}/getByIds`](this.task.checklist);
		},
		parentCheckLists(): CheckListModel[] {
			return this.checkLists
				.filter((checkList: CheckListModel) => {
					if (checkList.parentId !== 0 || checkList.hidden)
					{
						return false;
					}

					return !(this.isPreview && checkList.isComplete);
				})
				.sort((a: CheckListModel, b: CheckListModel) => {
					if (a.isComplete === b.isComplete)
					{
						return a.sortIndex - b.sortIndex;
					}

					return a.isComplete ? 1 : -1;
				});
		},
		totalCompletedParents(): number
		{
			return this.checkLists.filter((checkList: CheckListModel) => {
				return checkList.parentId === 0 && checkList.isComplete;
			}).length;
		},
		siblings(): CheckListModel[]
		{
			return this.checkLists
				.filter((item: CheckListModel) => item.parentId === this.parentId)
				.sort((a: CheckListModel, b: CheckListModel) => a.sortIndex - b.sortIndex);
		},
		canAddItem(): boolean
		{
			return this.task.rights.checklistAdd;
		},
		parentItemDragged(): boolean
		{
			return this.checkListManager.isParentItem(this.draggedCheckListId);
		},
	},
	created(): void
	{
		this.checkListManager = new CheckListManager({
			computed: {
				checkLists: () => this.checkLists,
			},
		});

		if (!this.isPreview)
		{
			this.listDragManager = new CheckListListDragManager({
				store: this.$store,
				checkListManager: this.checkListManager,
			});
			this.listDragManager.subscribe('update', (baseEvent: BaseEvent) => {
				const draggedItemId = baseEvent.getData();
				this.$emit('update', draggedItemId);
			});
			this.listDragManager.subscribe('end', (baseEvent: BaseEvent) => {
				const draggedItemId = baseEvent.getData();
				setTimeout(() => {
					this.scrollToTarget(draggedItemId, 0, false);
					this.handleDropException();
				}, 100);
			});

			this.itemDragManager = new CheckListItemDragManager({
				store: this.$store,
				checkListManager: this.checkListManager,
				canAddItem: this.canAddItem,
				stubItemId: 'add-item',
				currentUserId: this.currentUserId,
			});
			this.itemDragManager.subscribe('update', (baseEvent: BaseEvent) => {
				const draggedItemId = baseEvent.getData();
				this.$emit('update', draggedItemId);
			});
			this.itemDragManager.subscribe('end', () => {
				setTimeout(() => {
					this.handleDropException();
				}, 100);
			});
		}
	},
	mounted(): void
	{
		this.scrollContainer = this.$el.parentElement;

		this.subscribeToEvents();

		if (!this.isPreview)
		{
			this.initDragManager();
		}

		this.focusTo(this.checkListId);

		this.$emit('show');
	},
	beforeUnmount(): void
	{
		this.itemDragManager?.destroy();
		this.unsubscribeFromEvents();
	},
	methods: {
		subscribeToEvents(): void
		{
			EventEmitter.subscribe(EventName.ShowCheckList, this.handleShowCheckListEvent);
			EventEmitter.subscribe(EventName.ShowCheckListItems, this.handleShowCheckListItemsEvent);
		},
		unsubscribeFromEvents(): void
		{
			EventEmitter.unsubscribe(EventName.ShowCheckList, this.handleShowCheckListEvent);
			EventEmitter.unsubscribe(EventName.ShowCheckListItems, this.handleShowCheckListItemsEvent);
		},
		focusTo(checkListId: string | number): void
		{
			const focusedItem = this.checkListManager.getItem(checkListId);
			if (!focusedItem)
			{
				return;
			}

			const { targetId, offset, shouldHighlight } = this.calculateFocusTarget(focusedItem);

			this.scrollToTarget(targetId, offset, shouldHighlight);
		},
		calculateFocusTarget(focusedItem: CheckListModel): {
			targetId: string | number,
			offset: number,
			shouldHighlight: boolean,
		}
		{
			const isRootItem = focusedItem.parentId === 0;
			if (!isRootItem)
			{
				return {
					targetId: focusedItem.id,
					offset: 140,
					shouldHighlight: false,
				};
			}

			const childWithEmptyTitle = this.checkListManager.getChildWithEmptyTitle(focusedItem.id);

			return {
				targetId: childWithEmptyTitle?.id ?? focusedItem.id,
				offset: childWithEmptyTitle ? 140 : 0,
				shouldHighlight: true,
			};
		},
		scrollToTarget(targetId: string | number, offset: number, shouldHighlight: boolean): void
		{
			setTimeout(() => {
				const targetNode = this.scrollContainer.querySelector(`[data-id="${targetId}"]`);
				if (!targetNode)
				{
					return;
				}

				if (shouldHighlight)
				{
					this.highlightParentContainer(targetId);
				}

				this.scrollContainer.scrollTop = targetNode.offsetTop - offset;
			}, 0);
		},
		highlightParentContainer(targetId: string | number): void
		{
			const highlightElement = this.scrollContainer.querySelector(`[data-parent-container="${targetId}"]`);
			if (highlightElement)
			{
				void highlighter.highlight(highlightElement);
			}
		},
		getItemOffset(item: CheckListModel): string
		{
			if (item.parentId === 0)
			{
				return '0';
			}

			const level = this.checkListManager.getItemLevel(item);
			if (level === 1)
			{
				return '0';
			}

			return `${(level - 1) * 28}px`;
		},
		handleDropException(): void
		{
			const container = this.$el.closest('[data-list]');
			const allItems = container.querySelectorAll('.check-list-widget-item.--dragged_item');
			allItems.forEach((item: HTMLElement) => item.remove());
		},
		getChildren(parent: CheckListModel): CheckListModel[]
		{
			return this.checkListManager
				.getAllChildren(parent.id)
				.filter((checkList: CheckListModel) => !checkList.hidden);
		},
		isCollapsed(item: CheckListModel, positionIndex: number): boolean
		{
			if (this.checkListManager.isParentItem(this.draggedCheckListId))
			{
				return true;
			}

			return this.checkListManager.isItemCollapsed(item, this.isPreview, positionIndex);
		},
		getFirstCompletedCheckList(): ?CheckListModel
		{
			const completedCheckLists = this.checkLists
				.filter((checkList: CheckListModel) => {
					return checkList.parentId === 0 && checkList.isComplete === true;
				})
				.sort((a: CheckListModel, b: CheckListModel) => a.sortIndex - b.sortIndex);

			return completedCheckLists[0];
		},
		handleShowCheckListEvent(event: BaseEvent): void
		{
			const { checkListId } = event.getData();
			if (!checkListId)
			{
				return;
			}

			this.$emit('openCheckList', checkListId);

			this.focusTo(checkListId);
		},
		async handleShowCheckListItemsEvent(event: BaseEvent): Promise<void>
		{
			const { checkListItemIds } = event.getData();

			if (!Type.isArrayFilled(checkListItemIds))
			{
				return;
			}

			const firstItemId = checkListItemIds[0];

			this.focusTo(firstItemId);

			this.$emit('openCheckList', firstItemId);

			await this.$nextTick();

			checkListItemIds.forEach((itemId: number) => {
				EventEmitter.emit(EventName.HighlightCheckListItem + itemId);
			});
		},
		showFirstCompletedCheckList(): void
		{
			const firstCompletedCheckList = this.getFirstCompletedCheckList();

			this.$emit('openCheckList', firstCompletedCheckList.id);
		},
		initDragManager(): void
		{
			let offsetX = 0;
			if (
				this.context !== Context.Popup
				&& Type.isElementNode(this.$root.$el)
			)
			{
				const parentRect = Dom.getPosition(this.$el);
				const parentRelativeRect = Dom.getRelativePosition(
					this.$el,
					this.$root.$el,
				);

				offsetX = parentRelativeRect.left - parentRect.left;
			}

			this.listDragManager.init(this.scrollContainer, offsetX);

			const listDropzone = this.canAddItem ? this.$refs.parentComponents?.map((parent) => parent.$el) : [];

			this.itemDragManager.init(this.scrollContainer, offsetX, listDropzone);
		},
	},
	template: `
		<div class="check-list-widget-container">
			<TransitionGroup
				:css="!disableCheckListAnimations"
				name="check-list"
				tag="ul"
				class="check-list-widget --parent"
				:class="{
					'--preview': isPreview,
					'--dragged': parentItemDragged,
				}"
			>
				<li
					v-for="(parentItem, parentItemIndex) in parentCheckLists"
					:key="'parent-' + parentItem.id + parentItemIndex"
					class="check-list-widget-item --parent check-list-draggable-list"
					:class="{
						'--preview': isPreview,
						'--collapsed': isCollapsed(parentItem, parentItemIndex),
						'--hidden': parentItem.hidden,
						'--dragged_item': parentItem.id === draggedCheckListId,
					}"
					:data-id="parentItem.id"
					:data-parent-container="parentItem.id"
				>
					<template v-if="parentItem.id === draggedCheckListId">
						<CheckListDropList/>
					</template>
					<template v-else>
						<CheckListParentItem
							ref="parentComponents"
							:id="parentItem.id"
							:isPreview
							:positionIndex="parentItemIndex"
							@update="(id) => $emit('update', id)"
							@removeItem="(id) => $emit('removeItem', id)"
							@focus="(id) => $emit('focus', id)"
							@blur="(id) => $emit('blur', id)"
							@emptyBlur="(id) => $emit('emptyBlur', id)"
							@startGroupMode="(id) => $emit('startGroupMode', id)"
							@openCheckList="(id) => $emit('openCheckList', id)"
						/>
					</template>
					<TransitionGroup
						v-if="parentItem.id !== draggedCheckListId"
						:css="!disableCheckListAnimations"
						name="check-list"
						tag="ul"
						class="check-list-widget"
					>
						<li
							v-if="!isCollapsed(parentItem, parentItemIndex)"
							v-for="(childItem, childIndex) in getChildren(parentItem)"
							:key="'child-' + parentItem.id + childItem.id + childIndex"
							:data-id="childItem.id"
							class="check-list-widget-item check-list-draggable-item"
							:class="{
								'--dragged_item': childItem.id === draggedCheckListId,
							}"
						>
							<template v-if="childItem.id === draggedCheckListId">
								<CheckListDropItem :dropOffset="getItemOffset(childItem)"/>
							</template>
							<template v-else>
								<CheckListChildItem
									:id="childItem.id"
									:itemOffset="getItemOffset(childItem)"
									:isPreview
									:checkListId
									@update="(id) => $emit('update', id)"
									@addItem="(data) => $emit('addItem', data)"
									@removeItem="(id) => $emit('removeItem', id)"
									@focus="(id) => $emit('focus', id)"
									@blur="(id) => $emit('blur', id)"
									@emptyBlur="(id) => $emit('emptyBlur', id)"
									@toggleGroupModeSelected="(id) => $emit('toggleGroupModeSelected', id)"
									@openCheckList="(id) => $emit('openCheckList', id)"
								/>
							</template>
						</li>
						<li
							v-if="!isCollapsed(parentItem, parentItemIndex)"
							:key="'add-' + parentItem.id + parentItemIndex"
							data-id="add-item"
							:data-parent-id="parentItem.id"
							class="check-list-widget-item check-list-draggable-item"
						>
							<CheckListAddItem
								v-if="canAddItem"
								:isPreview
								@addItem="$emit('addItemFromBtn', parentItem.id)"
							/>
						</li>
					</TransitionGroup>
				</li>
				<li
					v-if="isPreview && totalCompletedParents > 0"
					key="completed-list"
					class="check-list-widget-item --completed-list"
				>
					<CheckListGroupCompletedList :totalCompletedParents @click="showFirstCompletedCheckList"/>
				</li>
			</TransitionGroup>
		</div>
	`,
};
