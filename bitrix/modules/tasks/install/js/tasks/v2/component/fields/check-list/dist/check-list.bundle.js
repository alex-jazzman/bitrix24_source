/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, main_core, main_core_events, ui_vue3_vuex, ui_vue3_components_button, ui_vue3_components_menu, ui_iconSet_api_vue, ui_iconSet_outline, tasks_v2_const, tasks_v2_provider_service_taskService, tasks_v2_provider_service_checkListService, tasks_v2_provider_service_fileService, tasks_v2_lib_highlighter, ui_vue3_components_popup, tasks_v2_component_elements_bottomSheet, ui_vue3_directives_hint, ui_iconSet_animated, tasks_v2_component_elements_hint, ui_draganddrop_draggable, ui_iconSet_actions, tasks_v2_component_elements_growingTextArea, tasks_v2_component_elements_userAvatarList, tasks_v2_component_elements_userCheckbox, tasks_v2_component_elements_progressBar, tasks_v2_core, tasks_v2_lib_userSelectorDialog, ui_system_skeleton_vue, tasks_v2_component_elements_userFieldWidgetComponent, tasks_v2_component_elements_checkbox, ui_notification, ui_system_chip_vue, tasks_v2_lib_fieldHighlighter) {
	'use strict';

	const checkListMeta = Object.freeze({
		id: tasks_v2_const.TaskField.CheckList,
		title: main_core.Loc.getMessage('TASKS_V2_CHECK_LIST_TITLE')
	});

	// @vue/component
	const CheckListStub = {
		name: 'CheckListStub',
		components: {
			UiButton: ui_vue3_components_button.Button
		},
		emits: ['click'],
		setup() {
			return {
				ButtonSize: ui_vue3_components_button.ButtonSize,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		template: `
		<div class="check-list-stub">
			<div class="check-list-stub-icon"/>
			<div class="check-list-stub-title">
				{{ loc('TASKS_V2_CHECK_LIST_STUB_TITLE') }}
			</div>
			<div class="check-list-stub-btn">
				<UiButton
					:text="loc('TASKS_V2_CHECK_LIST_STUB_BTN')"
					:size="ButtonSize.MEDIUM"
					:leftIcon="Outline.PLUS_L"
					@click="$emit('click')"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const CheckListPopup = {
		name: 'TaskCheckListPopup',
		components: {
			Popup: ui_vue3_components_popup.Popup
		},
		inject: {
			taskId: {}
		},
		inheritAttrs: false,
		emits: ['show', 'close', 'resize'],
		setup() {
			return {
				resizeObserver: null
			};
		},
		computed: {
			popupId() {
				return `tasks-check-list-popup-${this.taskId}`;
			},
			options() {
				return {
					className: 'tasks-check-list-popup',
					width: 580,
					height: 500,
					borderRadius: '18px',
					offsetTop: 0,
					padding: 0,
					autoHide: true,
					closeByEsc: true,
					overlay: {
						backgroundColor: 'transparent'
					},
					animation: {
						showClassName: 'tasks-check-list-popup-show',
						closeClassName: 'tasks-check-list-popup-close',
						closeAnimationType: 'animation'
					},
					events: {
						onClose: this.handleClose
					}
				};
			},
			...ui_vue3_vuex.mapGetters({
				titleFieldOffsetHeight: `${tasks_v2_const.Model.Interface}/titleFieldOffsetHeight`
			})
		},
		watch: {
			async titleFieldOffsetHeight() {
				if (!this.$refs.childComponent) {
					return;
				}
				await this.$nextTick();
				this.resize();
			}
		},
		created() {
			this.resizeObserver = new ResizeObserver(entries => {
				for (const entry of entries) {
					if (entry.target === this.$refs.wrapper) {
						this.resize();
					}
				}
			});
		},
		mounted() {
			main_core.Event.bind(window, 'resize', this.resize);
		},
		beforeUnmount() {
			main_core.Event.unbind(window, 'resize', this.resize);
		},
		methods: {
			resize() {
				const popupInstance = this.$refs.childComponent?.getPopupInstance();
				if (popupInstance) {
					this.$emit('resize');
					popupInstance.adjustPosition();
				}
			},
			handleShow() {
				this.$emit('show', {
					popupInstance: this.$refs.childComponent.getPopupInstance()
				});
				this.$refs.childComponent?.getPopupInstance().adjustPosition();
				setTimeout(() => this.resizeObserver.observe(this.$parent.$refs.wrapper), 300);
			},
			handleClose() {
				this.resizeObserver.disconnect();
				this.$bitrix.eventEmitter.emit(tasks_v2_const.EventName.CloseCheckList);
				this.$emit('close');
			}
		},
		template: `
		<Popup :options ref="childComponent">
			<slot :handleShow="handleShow" :handleClose="handleClose"/>
		</Popup>
	`
	};

	// @vue/component
	const CheckListSheet = {
		name: 'TaskCheckListSheet',
		components: {
			BottomSheet: tasks_v2_component_elements_bottomSheet.BottomSheet
		},
		props: {
			isEmpty: {
				type: Boolean,
				default: false
			},
			isShown: {
				type: Boolean,
				required: true
			},
			sheetBindProps: {
				type: Object,
				required: true
			}
		},
		emits: ['show', 'close', 'isShown', 'addFastCheckList', 'resize'],
		watch: {
			async isShown(value) {
				await this.$nextTick();
				this.$emit('isShown', value);
			}
		},
		methods: {
			handleClose() {
				this.$emit('close');
			}
		},
		template: `
		<BottomSheet
			v-if="isShown"
			:sheetBindProps
			:padding="0"
			:popupPadding="0"
			@close="handleClose"
		>
			<slot :handleShow="$emit('show')" :handleClose="handleClose"/>
		</BottomSheet>
	`
	};

	class CheckListManager {
		#params;
		constructor(params) {
			this.#params = params;
		}
		getItem(itemId) {
			return this.#getCheckLists().find(item => item.id === this.prepareItemId(itemId));
		}
		getItems(itemIds) {
			const itemIdsSet = new Set(itemIds);
			return this.#getCheckLists().filter(item => itemIdsSet.has(item.id));
		}
		getItemsOnLevel(parentId) {
			return this.#getCheckLists().filter(item => item.parentId === parentId).sort((a, b) => a.sortIndex - b.sortIndex);
		}
		getItemLevel(checkListItem) {
			let level = 0;
			let current = checkListItem;
			const visitedIds = new Set();
			const findParent = parentId => this.#getCheckLists().find(item => item.id === parentId);
			while (current.parentId !== 0) {
				if (visitedIds.has(current.id)) {
					break;
				}
				visitedIds.add(current.id);
				current = findParent(current.parentId);
				if (!current) {
					break;
				}
				level++;
			}
			return level;
		}
		isParentItem(itemId) {
			const item = this.getItem(itemId);
			return item && item.parentId === 0;
		}
		isItemDescendant(potentialAncestor, item) {
			if (item?.parentId === potentialAncestor?.id) {
				return true;
			}
			if (item?.parentId === 0) {
				return false;
			}
			const parent = this.#getCheckLists().find(i => i.id === item?.parentId);
			if (!parent) {
				return false;
			}
			return this.isItemDescendant(potentialAncestor, parent);
		}
		showItems(itemIds, updateFn) {
			const updates = [];
			itemIds.forEach(itemId => this.#setItemsVisibility(itemId, false, updates));
			if (updates.length > 0) {
				updateFn(updates);
			}
		}
		hideItems(itemIds, updateFn) {
			const updates = [];
			itemIds.forEach(itemId => this.#setItemsVisibility(itemId, true, updates));
			if (updates.length > 0) {
				updateFn(updates);
			}
		}
		syncParentCompletionState(itemId, updateFn, parentItemId) {
			const changedItem = this.#getCheckLists().find(item => item.id === itemId);
			if ((!changedItem || !changedItem.parentId) && !parentItemId) {
				return;
			}
			const parentId = parentItemId || changedItem.parentId;
			const parentItem = this.#getCheckLists().find(item => item.id === parentId);
			if (!parentItem) {
				return;
			}
			const childrenItems = this.#getCheckLists().filter(item => item.parentId === parentItem.id);
			const isEmptyParent = childrenItems.length === 0;
			const allChildrenCompleted = childrenItems.every(child => {
				return child.localCompleteState ?? child.isComplete;
			});
			const someChildrenIncomplete = !allChildrenCompleted;
			const parentCompleted = parentItem.localCompleteState ?? parentItem.isComplete;
			const shouldUpdateParent = isEmptyParent || allChildrenCompleted && !parentCompleted || someChildrenIncomplete && parentCompleted;
			if (!shouldUpdateParent) {
				return;
			}
			updateFn(parentItem.id, {
				isComplete: allChildrenCompleted && !isEmptyParent
			});
			if (parentItem.parentId) {
				this.syncParentCompletionState(parentItem.id, updateFn);
			}
		}
		getAllGroupModeItems() {
			return this.#getCheckLists().filter(item => item.groupMode?.active === true);
		}
		getAllSelectedItems() {
			return this.#getCheckLists().filter(item => {
				return item.parentId !== 0 && item.groupMode?.selected === true;
			});
		}
		getAllSelectedItemsWithChildren() {
			const result = new Map();
			const selectedItems = this.getAllSelectedItems();
			const allItems = this.#getCheckLists();
			selectedItems.forEach(item => result.set(item.id, item));
			const getChildren = parentIds => {
				const children = allItems.filter(item => {
					return parentIds.includes(item.parentId) && !result.has(item.id);
				});
				children.forEach(child => result.set(child.id, child));
				if (children.length > 0) {
					getChildren(children.map(child => child.id));
				}
			};
			getChildren(selectedItems.map(item => item.id));
			return [...result.values()];
		}
		getAllChildren(itemId) {
			const visited = new Set();
			const result = [];
			const collectChildren = currentId => {
				if (visited.has(currentId)) {
					return;
				}
				visited.add(currentId);
				const children = this.#getCheckLists().filter(item => item.parentId === currentId).sort((a, b) => a.sortIndex - b.sortIndex);
				children.forEach(child => {
					if (!visited.has(child.id)) {
						result.push(child);
						collectChildren(child.id);
					}
				});
			};
			collectChildren(itemId);
			return result;
		}
		getAllCompletedChildren(itemId) {
			return this.getAllChildren(itemId).filter(item => {
				return (item.localCompleteState ?? item.isComplete) === true;
			});
		}
		getChildren(itemId) {
			return this.#getCheckLists().filter(item => {
				return item.parentId === itemId;
			});
		}
		getSiblings(itemId, parentId) {
			return this.#getCheckLists().filter(sibling => sibling.parentId === parentId && sibling.id !== itemId).sort((a, b) => a.sortIndex - b.sortIndex);
		}
		resortItemsOnLevel(parentId, updateFn) {
			const allItems = this.#getCheckLists().filter(item => item.parentId === parentId);
			const sortedItems = [...allItems].sort((a, b) => a.sortIndex - b.sortIndex);
			const updates = sortedItems.map((item, newIndex) => ({
				...item,
				sortIndex: newIndex
			}));
			if (updates.length > 0) {
				updateFn(updates);
			}
		}
		resortItemsBeforeIndex(parentId, sortIndex, updateFn) {
			const allItems = this.#getCheckLists().filter(item => item.parentId === parentId);
			const itemsToResort = allItems.filter(item => item.sortIndex <= sortIndex).sort((a, b) => a.sortIndex - b.sortIndex);
			const updates = itemsToResort.map((item, index) => ({
				...item,
				sortIndex: index
			}));
			updateFn(updates);
		}
		resortItemsAfterIndex(parentId, sortIndex, updateFn) {
			const allItems = this.#getCheckLists().filter(item => item.parentId === parentId);
			const itemsToResort = allItems.filter(item => item.sortIndex >= sortIndex).sort((a, b) => a.sortIndex - b.sortIndex);
			const updates = itemsToResort.map((item, index) => ({
				...item,
				sortIndex: sortIndex + 1 + index
			}));
			updateFn(updates);
		}
		moveRight(item, updateFn) {
			if (item.parentId === 0 || this.getItemLevel(item) > 5) {
				return;
			}
			const itemsOnLevel = this.getItemsOnLevel(item.parentId);
			const currentIndex = itemsOnLevel.findIndex(sibling => sibling.id === item.id);
			if (currentIndex <= 0) {
				return;
			}
			let newParent = null;
			for (let i = currentIndex - 1; i >= 0; i--) {
				const candidate = itemsOnLevel[i];
				if (!this.isItemDescendant(candidate, item)) {
					newParent = candidate;
					break;
				}
			}
			if (!newParent) {
				return;
			}
			const newParentChildren = this.#getCheckLists().filter(child => child.parentId === newParent.id).sort((a, b) => a.sortIndex - b.sortIndex);
			const updates = itemsOnLevel.filter((sibling, index) => index > currentIndex).map(sibling => ({
				...sibling,
				sortIndex: sibling.sortIndex - 1
			}));
			updates.push({
				...item,
				parentId: newParent.id,
				parentNodeId: newParent.nodeId,
				sortIndex: newParentChildren.length > 0 ? newParentChildren[newParentChildren.length - 1].sortIndex + 1 : 0
			});
			updateFn(updates);
		}
		moveLeft(item, updateFn) {
			if (item.parentId === 0 || this.getItemLevel(item) <= 1) {
				return;
			}
			const currentParent = this.#getCheckLists().find(parent => parent.id === item.parentId);
			if (!currentParent) {
				return;
			}
			const itemsOnLevel = this.getItemsOnLevel(currentParent.parentId);
			const parentInNewListIndex = itemsOnLevel.findIndex(sibling => sibling.id === currentParent.id);
			const currentSiblingsUpdates = this.#getCheckLists().filter(sibling => sibling.parentId === item.parentId && sibling.sortIndex > item.sortIndex).map(sibling => ({
				...sibling,
				sortIndex: sibling.sortIndex - 1
			}));
			let newSortIndex = 0;
			if (parentInNewListIndex === -1 || parentInNewListIndex === itemsOnLevel.length - 1) {
				newSortIndex = itemsOnLevel.length > 0 ? itemsOnLevel[itemsOnLevel.length - 1].sortIndex + 1 : 0;
			} else {
				newSortIndex = itemsOnLevel[parentInNewListIndex].sortIndex + 1;
				const shiftUpdates = itemsOnLevel.filter(sibling => sibling.sortIndex >= newSortIndex).map(sibling => ({
					...sibling,
					sortIndex: sibling.sortIndex + 1
				}));
				currentSiblingsUpdates.push(...shiftUpdates);
			}
			const movedItemUpdate = {
				...item,
				parentId: currentParent.parentId,
				parentNodeId: currentParent.parentNodeId || null,
				sortIndex: newSortIndex
			};
			updateFn([...currentSiblingsUpdates, movedItemUpdate]);
		}
		findNearestItem(initialItem, selected, excludeChildrenOf = []) {
			if (!initialItem) {
				return null;
			}
			const rootParent = this.#getRootParent(initialItem);
			if (!rootParent) {
				return null;
			}
			const currentSortIndex = initialItem.sortIndex;
			const excludedParentIds = new Set(excludeChildrenOf.map(item => item.id));
			const eligibleItems = this.#getCheckLists().sort((a, b) => a.sortIndex - b.sortIndex).filter(item => {
				const isChildOfExcluded = excludedParentIds.has(item.parentId);
				return item.id !== initialItem.id && item.parentId !== 0 && item.groupMode?.selected === selected && this.#getRootParent(item)?.id === rootParent.id && !isChildOfExcluded;
			});
			if (eligibleItems.length === 0) {
				return null;
			}
			return eligibleItems.reduce((nearest, item) => {
				return item.sortIndex > currentSortIndex && (item.sortIndex < nearest.sortIndex || nearest.sortIndex <= currentSortIndex) ? item : nearest;
			});
		}
		getFirstVisibleChild(itemId) {
			const children = this.#getCheckLists().filter(item => item.parentId === itemId && !item.hidden).sort((a, b) => a.sortIndex - b.sortIndex);
			return children[0] || null;
		}
		getEmptiesItem() {
			return this.#getCheckLists().filter(item => {
				return item.title === '';
			});
		}
		hasEmptyItemWithFiles(hasItemFiles) {
			return this.#getCheckLists().some(item => {
				return item.title === '' && hasItemFiles(item);
			});
		}
		hasEmptyParentItem() {
			return this.#getCheckLists().some(item => {
				return item.parentId === 0 && item.title === '';
			});
		}
		getFirstEmptyItem() {
			const items = this.#getCheckLists().filter(item => item.title === '').sort((a, b) => a.sortIndex - b.sortIndex);
			return items[0] || null;
		}
		getChildWithEmptyTitle(itemId) {
			const children = this.#getCheckLists().filter(item => item.parentId === itemId).sort((a, b) => b.sortIndex - a.sortIndex).find(item => item.title === '');
			return children || null;
		}
		isItemCollapsed(item, isPreview, positionIndex) {
			if (!main_core.Type.isNull(item.localCollapsedState) && !main_core.Type.isUndefined(item.localCollapsedState)) {
				return item.localCollapsedState;
			}
			if (!isPreview) {
				return false;
			}
			if (item.collapsed && !item.expanded) {
				return true;
			}
			if (item.expanded) {
				return false;
			}
			return positionIndex !== 0;
		}
		getRootParentByChildId(itemId) {
			const childItem = this.getItem(itemId);
			if (!childItem) {
				return null;
			}
			if (childItem.parentId === 0) {
				return childItem;
			}
			let currentItem = childItem;
			const visitedIds = new Set();
			while (currentItem && currentItem.parentId !== 0) {
				if (visitedIds.has(currentItem.id)) {
					break;
				}
				visitedIds.add(currentItem.id);
				const parent = this.getItem(currentItem.parentId);
				if (!parent) {
					break;
				}
				currentItem = parent;
			}
			return currentItem?.parentId === 0 ? currentItem : null;
		}
		expandIdsWithChildren(itemIds) {
			const fullSet = new Set(itemIds);
			if (itemIds.size === 0 || this.#getCheckLists().length === 0) {
				return fullSet;
			}
			const checkListMap = new Map(this.#getCheckLists().map(item => [item.id, item]));
			const processedIds = new Set();
			itemIds.forEach(id => {
				if (!processedIds.has(id)) {
					this.#findNestedChildren(id, checkListMap, fullSet, processedIds);
				}
			});
			return fullSet;
		}
		findItemIdsWithUser(rootId, userId) {
			const allItems = this.getAllChildren(rootId);
			const rootItem = this.getItem(rootId);
			if (rootItem) {
				allItems.unshift(rootItem);
			}
			const result = new Set();
			allItems.forEach(item => {
				const hasUser = item.accomplices?.some(user => user.id === userId) || item.auditors?.some(user => user.id === userId);
				if (hasUser && item.parentId !== 0) {
					result.add(item.id);
				}
			});
			return result;
		}
		prepareItemId(itemId) {
			const num = parseInt(itemId, 10);
			const isStringExactlyAnInteger = !Number.isNaN(num) && num.toString() === itemId;
			return isStringExactlyAnInteger ? parseInt(itemId, 10) : itemId;
		}
		isFirstItemHigherLevelThan(firstItem, secondItem) {
			const firstItemLevel = this.getItemLevel(firstItem);
			const secondItemLevel = this.getItemLevel(secondItem);
			return firstItemLevel < secondItemLevel;
		}
		hasItemChildren(item) {
			return this.#getCheckLists().some(child => child.parentId === item.id);
		}
		isItemCompleted(item) {
			return item.localCompleteState ?? item.isComplete;
		}
		scrollToCheckList(container, checkListId, behavior = 'instant') {
			let scrollContainer = container.closest('[data-task-card-scroll]');
			if (!scrollContainer) {
				scrollContainer = container.querySelector('[data-task-card-scroll]');
			}
			const checkListNode = container.querySelector([`[data-id="${checkListId}"]`]);
			if (scrollContainer && checkListNode) {
				const checkListRect = main_core.Dom.getPosition(checkListNode);
				const containerRect = main_core.Dom.getPosition(scrollContainer);
				const offsetTopInsideContainer = checkListRect.top - containerRect.top + scrollContainer.scrollTop;
				scrollContainer.scrollTo({
					top: offsetTopInsideContainer - 200,
					behavior
				});
			}
		}
		handleTargetParentFilter(movedItem, currentUserId, updateFn) {
			const itemIdsToUpdateInNewParent = new Map();
			const targetParentItem = this.getRootParentByChildId(movedItem.id);
			const draggedChildren = this.#getDraggedChildren(movedItem);
			this.#processCompletedFilter(movedItem, targetParentItem, itemIdsToUpdateInNewParent);
			draggedChildren.forEach(child => {
				this.#processCompletedFilter(child, targetParentItem, itemIdsToUpdateInNewParent);
			});
			const myItemIds = this.findItemIdsWithUser(targetParentItem.id, currentUserId);
			this.#processUserFilter(movedItem, targetParentItem, myItemIds, itemIdsToUpdateInNewParent);
			draggedChildren.forEach(child => {
				this.#processUserFilter(child, targetParentItem, myItemIds, itemIdsToUpdateInNewParent);
			});
			this.#applyVisibilityChanges(itemIdsToUpdateInNewParent, updateFn);
			return true;
		}
		#getDraggedChildren(movedItem) {
			return this.getAllChildren(movedItem.id);
		}
		#processCompletedFilter(item, targetParentItem, itemIdsMap) {
			if (targetParentItem.areCompletedCollapsed && this.isItemCompleted(item)) {
				itemIdsMap.set(item.id, 'hide');
			}
			if (!targetParentItem.areCompletedCollapsed && this.isItemCompleted(item)) {
				itemIdsMap.set(item.id, 'show');
			}
		}
		#processUserFilter(item, targetParentItem, myItemIds, itemIdsMap) {
			if (targetParentItem.myFilterActive && !myItemIds.has(item.id)) {
				itemIdsMap.set(item.id, 'hide');
			}
			if (!targetParentItem.myFilterActive && myItemIds.has(item.id) && !itemIdsMap.has(item.id)) {
				itemIdsMap.set(item.id, 'show');
			}
		}
		#applyVisibilityChanges(itemIdsToUpdateInNewParent, updateFn) {
			const {
				hideIds,
				showIds
			} = this.#splitIdsByAction(itemIdsToUpdateInNewParent);
			const updates = this.#createVisibilityUpdates(hideIds, showIds);
			if (updates.length > 0) {
				updateFn(updates);
			}
		}
		#splitIdsByAction(itemIdsMap) {
			const hideIds = [];
			const showIds = [];
			for (const [id, action] of itemIdsMap) {
				if (action === 'hide') {
					hideIds.push(id);
				} else if (action === 'show') {
					showIds.push(id);
				}
			}
			return {
				hideIds,
				showIds
			};
		}
		#createVisibilityUpdates(hideIds, showIds) {
			const updates = [];
			this.getItems(showIds).forEach(item => {
				updates.push({
					...item,
					hidden: false
				});
			});
			this.getItems(hideIds).forEach(item => {
				updates.push({
					...item,
					hidden: true
				});
			});
			return updates;
		}
		#setItemsVisibility(itemId, hidden, updates) {
			const item = this.getItem(itemId);
			if (!item || item.hidden === hidden) {
				return;
			}
			const updatedItem = {
				...item,
				hidden
			};
			updates.push(updatedItem);
			const children = this.getChildren(itemId);
			children.forEach(child => {
				this.#setItemsVisibility(child.id, hidden, updates);
			});
		}
		#findNestedChildren(parentId, checkListMap, resultSet, processedIds) {
			if (processedIds.has(parentId)) {
				return;
			}
			processedIds.add(parentId);
			checkListMap.forEach(item => {
				if (item.parentId === parentId && !resultSet.has(item.id)) {
					resultSet.add(item.id);
					this.#findNestedChildren(item.id, checkListMap, resultSet, processedIds);
				}
			});
		}
		#getRootParent(item) {
			if (!item || item.parentId === 0) {
				return item || null;
			}
			const parentItem = this.#getCheckLists().find(parent => parent.id === item.parentId);
			if (!parentItem) {
				return null;
			}
			return this.#getRootParent(parentItem);
		}
		#getCheckLists() {
			return this.#params?.computed?.checkLists() ?? [];
		}
	}

	// @vue/component
	const CheckListList = {
		name: 'TaskCheckListList',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		inject: {
			task: {},
			taskId: {},
			isEdit: {}
		},
		props: {
			isEmpty: {
				type: Boolean,
				default: false
			}
		},
		emits: ['open', 'addFastCheckList'],
		setup() {
			return {
				Animated: ui_iconSet_api_vue.Animated,
				Outline: ui_iconSet_api_vue.Outline,
				checkListMeta
			};
		},
		data() {
			return {
				isLoading: null
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				deletingCheckListIds: `${tasks_v2_const.Model.Interface}/deletingCheckListIds`,
				disableCheckListAnimations: `${tasks_v2_const.Model.Interface}/disableCheckListAnimations`
			}),
			checkLists() {
				return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getByIds`](this.task.checklist);
			},
			isFilledEmpty() {
				return this.checkListLength === 0 && this.task.filledFields[checkListMeta.id];
			},
			checkListLength() {
				const deletingRootIds = Object.values(this.deletingCheckListIds);
				const deletingIds = new Set();
				deletingRootIds.forEach(rootId => {
					deletingIds.add(rootId);
					this.checkListManager.getAllChildren(rootId).forEach(child => {
						deletingIds.add(child.id);
					});
				});
				return this.checkLists.filter(({
					id
				}) => !deletingIds.has(id)).length;
			},
			containsChecklist() {
				return this.task.containsChecklist;
			},
			loading() {
				return this.isLoading === true;
			},
			canCheckListAdd() {
				if (!this.isEdit) {
					return true;
				}
				return this.task.rights.checklistAdd;
			},
			addTooltip() {
				return () => tasks_v2_component_elements_hint.tooltip({
					text: this.loc('TASKS_V2_CHECK_LIST_STUB_BTN'),
					popupOptions: {
						offsetLeft: this.$refs.stubAddIcon.$el.offsetWidth / 2
					}
				});
			}
		},
		async created() {
			this.checkListManager = new CheckListManager({
				computed: {
					checkLists: () => this.checkLists
				}
			});
			if (this.containsChecklist && this.checkLists.length === 0) {
				this.isLoading = true;
				await this.loadData();
				this.isLoading = false;
			}
		},
		methods: {
			async loadData() {
				await tasks_v2_provider_service_checkListService.checkListService.load(this.taskId);
			}
		},
		template: `
		<div
			class="tasks-check-list-list"
			:class="{ '--default': loading || isFilledEmpty }"
			data-field-container
			:data-task-field-id="checkListMeta.id"
		>
			<div
				class="tasks-check-list-list-content"
				:class="{ '--default': loading || isFilledEmpty }"
			>
				<div v-if="loading" class="tasks-check-list-list-transition-content">
					<div class="tasks-check-list-list-content-row">
						<BIcon :name="Animated.LOADER_WAIT"/>
						<div class="tasks-check-list-list-content-text">
							{{ loc('TASKS_V2_CHECK_LIST_LOADING') }}
						</div>
					</div>
				</div>
				<Transition name="check-list-fade" mode="in-out" :css="!disableCheckListAnimations">
					<div
						v-if="!loading && isFilledEmpty"
						key="empty"
						class="tasks-check-list-list-transition-content"
					>
						<div
							class="tasks-check-list-list-content-row --stub"
							@click="() => canCheckListAdd && $emit('addFastCheckList')"
						>
							<div class="tasks-check-list-list-content-row-main">
								<BIcon :name="Outline.CHECK_LIST"/>
								<div class="tasks-check-list-list-content-text">
									{{ loc('TASKS_V2_CHECK_LIST_CHIP_TITLE') }}
								</div>
							</div>
							<div class="tasks-check-list-list-content-row-icon">
								<BIcon
									v-if="canCheckListAdd"
									class="tasks-check-list-list-add"
									v-hint="addTooltip"
									:name="Outline.PLUS_L"
									hoverable
									ref="stubAddIcon"
								/>
							</div>
						</div>
					</div>
				</Transition>
				<div
					v-if="!loading && !isFilledEmpty"
					key="content"
					class="tasks-check-list-list-transition-content"
				>
					<slot/>
					<div
						v-if="canCheckListAdd"
						class="tasks-check-list-list-content-row --footer print-ignore"
						@click="$emit('addFastCheckList')"
					>
						<div
							class="tasks-check-list-list-content-btn"
							:class="{ '--empty': isEmpty }"
						>
							<BIcon :name="Outline.PLUS_L"/>
							<div class="tasks-check-list-list-content-btn-text">
								{{ loc('TASKS_V2_CHECK_LIST_ADD_LABEL') }}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`
	};

	const Context = Object.freeze({
		Sheet: 'sheet',
		Popup: 'popup',
		Preview: 'preview'
	});

	class CheckListDragManager extends main_core_events.EventEmitter {
		#store;
		#checkListManager;
		#stubItemId;
		constructor(params) {
			super();
			this.setEventNamespace('Tasks.V2.CheckList.CheckListDragManager');
			this.#store = params.store;
			this.#checkListManager = params.checkListManager;
			this.#stubItemId = params.stubItemId;
		}
		moveDropPreview(draggedItem, overedItem, directionFromBottom, isSameLevelMove) {
			let tmpDraggedIndex = directionFromBottom ? this.#calculateAfterSortIndex(overedItem) - 0.5 : this.#calculateBeforeSortIndex(overedItem) + 0.5;
			if (!isSameLevelMove) {
				const isDraggedItemHigher = this.#checkListManager.isFirstItemHigherLevelThan(draggedItem, overedItem);
				const isOverStubItem = overedItem.id === this.#stubItemId;
				if (!isDraggedItemHigher && !isOverStubItem) {
					tmpDraggedIndex = this.#calculateBeforeSortIndex(overedItem) + 0.5;
					void this.#store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
						id: overedItem.id,
						fields: {
							sortIndex: tmpDraggedIndex + 1
						}
					});
				}
			}
			void this.#store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
				id: draggedItem.id,
				fields: {
					sortIndex: tmpDraggedIndex,
					parentId: overedItem.parentId
				}
			});
		}
		resortLevelDependingOnPosition(draggedItem, overedItem, directionFromBottom, isSameLevelMove) {
			let newDraggedSortIndex = directionFromBottom ? this.#calculateAfterSortIndex(overedItem) : this.#calculateBeforeSortIndex(overedItem);
			let levelResort = false;
			if (!isSameLevelMove) {
				const isDraggedItemHigher = this.#checkListManager.isFirstItemHigherLevelThan(draggedItem, overedItem);
				if (!isDraggedItemHigher) {
					newDraggedSortIndex = this.#calculateBeforeSortIndex(overedItem);
					levelResort = true;
				}
			}
			if (levelResort) {
				this.resortLevel(overedItem.parentId);
				return;
			}
			const updates = [{
				...draggedItem,
				sortIndex: newDraggedSortIndex,
				parentId: overedItem.parentId
			}];
			if (directionFromBottom) {
				this.#checkListManager.resortItemsAfterIndex(overedItem.parentId, newDraggedSortIndex, resortUpdates => {
					this.#store.dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, [...updates, ...resortUpdates]);
				});
			} else {
				this.#checkListManager.resortItemsBeforeIndex(overedItem.parentId, newDraggedSortIndex, resortUpdates => {
					this.#store.dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, [...updates, ...resortUpdates]);
				});
			}
		}
		resortLevel(parentId) {
			this.#checkListManager.resortItemsOnLevel(parentId, updates => {
				this.#store.dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, updates);
			});
		}
		#calculateAfterSortIndex(item) {
			return item.sortIndex + 1;
		}
		#calculateBeforeSortIndex(item) {
			return item.sortIndex - 1;
		}
	}

	class CheckListItemDragManager extends CheckListDragManager {
		#store;
		#checkListManager;
		#draggable;
		#draggedItem = {
			item: null,
			childrenIds: [],
			enterDropzone: false
		};
		#canAddItem;
		#stubItemId;
		#currentUserId;
		#isSameLevelMove = false;
		constructor(params) {
			super(params);
			this.#store = params.store;
			this.#checkListManager = params.checkListManager;
			this.#canAddItem = params.canAddItem;
			this.#stubItemId = params.stubItemId;
			this.#currentUserId = params.currentUserId;
		}
		init(container, offsetX = 0, listDropzone = []) {
			this.#draggable = new ui_draganddrop_draggable.Draggable({
				container,
				draggable: '.check-list-draggable-item',
				dragElement: '.check-list-drag-item',
				delay: 0,
				type: ui_draganddrop_draggable.Draggable.MOVE,
				offset: {
					x: offsetX
				},
				dropzone: listDropzone
			});
			this.#draggable.subscribe('beforeStart', this.#handleBeforeDragStart.bind(this));
			this.#draggable.subscribe('start', this.#handleDragStart.bind(this));
			this.#draggable.subscribe('over', this.#handleDragOver.bind(this));
			this.#draggable.subscribe('end', this.#handleDragEnd.bind(this));
			this.#draggable.subscribe('drop', this.#handleDropEnd.bind(this));
			this.#draggable.subscribe('dropzone:enter', this.#handleDropZoneEnter.bind(this));
			this.#draggable.subscribe('dropzone:out', this.#handleDropZoneOut.bind(this));
		}
		destroy() {
			this.#draggable?.destroy();
		}
		#handleBeforeDragStart(event) {
			const data = event.getData();
			const source = data?.source;
			const dataset = source?.dataset;
			if (!dataset) {
				event.preventDefault();
				return;
			}
			const draggedItemId = this.#checkListManager.prepareItemId(dataset.id);
			const draggedItem = this.#checkListManager.getItem(draggedItemId);
			if (!draggedItem) {
				event.preventDefault();
				return;
			}
			this.#store.dispatch(`${tasks_v2_const.Model.Interface}/setDisableCheckListAnimations`, true);
			this.#store.dispatch(`${tasks_v2_const.Model.Interface}/setDraggedCheckListId`, draggedItem.id);
			this.#draggedItem = {
				item: draggedItem,
				childrenIds: [],
				enterDropzone: false
			};
			if (this.#checkListManager.hasItemChildren(draggedItem)) {
				main_core.Dom.addClass(source, '--multiple-drag');
			}
		}
		#handleDragStart() {
			const draggedItem = this.#draggedItem.item;
			if (this.#checkListManager.hasItemChildren(draggedItem)) {
				const children = this.#checkListManager.getAllChildren(draggedItem.id);
				this.#draggedItem.childrenIds = children.map(child => child.id);
				this.#checkListManager.hideItems(this.#draggedItem.childrenIds, updates => {
					this.#store.dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, updates);
				});
			}
		}
		#handleDragOver(event) {
			const {
				source: {
					dataset
				},
				over,
				clientY
			} = event.getData();
			const overedItem = this.#getItemByNode(over);
			if (overedItem) {
				const isOverStubItem = overedItem.id === this.#stubItemId;
				const draggedItemId = this.#checkListManager.prepareItemId(dataset.id);
				const draggedItem = this.#checkListManager.getItem(draggedItemId);
				this.#draggedItem.item = draggedItem;
				const overedRootParent = this.#checkListManager.getRootParentByChildId(overedItem.id);
				const draggedRootParent = this.#checkListManager.getRootParentByChildId(draggedItem.id);
				const overedRootParentId = isOverStubItem ? overedItem.parentId : overedRootParent.id;
				if (!this.#canAddItem && overedRootParentId !== draggedRootParent.id) {
					event.preventDefault();
					return;
				}
				const overMiddlePoint = this.#draggable.getElementMiddlePoint(over);
				const direction = clientY > overMiddlePoint.y ? 1 : -1;
				let directionFromBottom = direction === 1;
				if (isOverStubItem) {
					directionFromBottom = false;
				}
				this.#isSameLevelMove = draggedItem.parentId === overedItem.parentId;
				if (this.#isSameLevelMove) {
					void this.#handleItemMovingOnSameLevel(draggedItem, overedItem, directionFromBottom);
				} else {
					this.#handleItemMovingOnBetweenLevel(draggedItem, overedItem, directionFromBottom);
				}
			}
		}
		#handleDragEnd(event) {
			const {
				source,
				source: {
					dataset
				}
			} = event.getData();
			const draggedItemId = this.#checkListManager.prepareItemId(dataset.id);
			const draggedItem = this.#checkListManager.getItem(draggedItemId);
			main_core.Dom.removeClass(source, '--multiple-drag');
			if (this.#draggedItem.enterDropzone) {
				return;
			}
			this.resortLevel(draggedItem.parentId);
			this.#handleDrop(draggedItem);
		}
		#handleDropEnd(event) {
			const {
				dropzone,
				source: {
					dataset
				}
			} = event.getData();
			const draggedItemId = this.#checkListManager.prepareItemId(dataset.id);
			const draggedItem = this.#checkListManager.getItem(draggedItemId);
			const newParentId = this.#checkListManager.prepareItemId(dropzone.dataset.id);
			if (draggedItem.parentId !== newParentId) {
				this.resortLevel(draggedItem.parentId);
			}
			void this.#store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
				id: draggedItem.id,
				fields: {
					sortIndex: this.#checkListManager.getChildren(newParentId).length + 1,
					parentId: newParentId,
					hidden: false
				}
			});
			this.resortLevel(newParentId);
			this.#handleDrop(draggedItem);
			main_core.Dom.removeClass(dropzone, '--dropzone');
		}
		#handleDropZoneEnter(event) {
			const {
				dropzone,
				source: {
					dataset
				}
			} = event.getData();
			const draggedItemId = this.#checkListManager.prepareItemId(dataset.id);
			const draggedItem = this.#checkListManager.getItem(draggedItemId);
			if (!draggedItem) {
				event.preventDefault();
				return;
			}
			this.#draggedItem.enterDropzone = true;
			this.#checkListManager.hideItems([draggedItemId], updates => {
				this.#store.dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, updates);
			});
			main_core.Dom.addClass(dropzone, '--dropzone');
		}
		#handleDropZoneOut(event) {
			const {
				dropzone,
				source: {
					dataset
				}
			} = event.getData();
			const draggedItemId = this.#checkListManager.prepareItemId(dataset.id);
			const draggedItem = this.#checkListManager.getItem(draggedItemId);
			if (!draggedItem) {
				event.preventDefault();
				return;
			}
			this.#draggedItem.enterDropzone = false;
			this.#checkListManager.showItems([draggedItemId], updates => {
				this.#store.dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, updates);
			});
			main_core.Dom.removeClass(dropzone, '--dropzone');
		}
		#handleDrop(draggedItem) {
			const draggedItemChanged = draggedItem.parentId !== this.#draggedItem.item.parentId || draggedItem.sortIndex !== this.#draggedItem.item.sortIndex;
			if (draggedItemChanged) {
				this.emit('update', draggedItem.id);
			}
			if (this.#draggedItem.childrenIds.length > 0) {
				this.#checkListManager.showItems(this.#draggedItem.childrenIds, updates => {
					this.#store.dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, updates);
				});
			}
			this.#draggedItem = {
				item: null,
				childrenIds: [],
				enterDropzone: false
			};
			this.#store.dispatch(`${tasks_v2_const.Model.Interface}/setDraggedCheckListId`, null);
			this.#store.dispatch(`${tasks_v2_const.Model.Interface}/setDisableCheckListAnimations`, false);
			if (!this.#isSameLevelMove) {
				this.#checkListManager.handleTargetParentFilter(draggedItem, this.#currentUserId, updates => {
					setTimeout(() => {
						this.#store.dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, updates);
					}, 1000);
				});
			}
			this.emit('end', draggedItem.id);
		}
		async #handleItemMovingOnSameLevel(draggedItem, overedItem, directionFromBottom) {
			const isFirstOnLevel = overedItem.sortIndex === 0;
			const numberOfItemPerLevel = this.#checkListManager.getChildren(overedItem.parentId).length;
			const isSimpleAndLastOnLevel = overedItem.sortIndex === numberOfItemPerLevel - 1 && !this.#checkListManager.hasItemChildren(overedItem);
			const shouldSkip = Math.abs(draggedItem.sortIndex - overedItem.sortIndex) === 1 && !isFirstOnLevel && !isSimpleAndLastOnLevel;
			if (shouldSkip) {
				return;
			}
			this.moveDropPreview(draggedItem, overedItem, directionFromBottom, true);
			this.resortLevelDependingOnPosition(draggedItem, overedItem, directionFromBottom, true);
		}
		async #handleItemMovingOnBetweenLevel(draggedItem, overedItem, directionFromBottom) {
			const previousParentId = draggedItem.parentId;
			this.moveDropPreview(draggedItem, overedItem, directionFromBottom, false);
			this.resortLevelDependingOnPosition(draggedItem, overedItem, directionFromBottom, false);
			this.resortLevel(previousParentId);
		}
		#getItemByNode(node) {
			const itemId = this.#checkListManager.prepareItemId(node.dataset.id);
			const isStubItem = itemId === this.#stubItemId;
			if (isStubItem) {
				const parentId = this.#checkListManager.prepareItemId(node.dataset.parentId);
				const sortIndex = this.#checkListManager.getChildren(parentId).length;
				return {
					id: this.#stubItemId,
					parentId,
					sortIndex
				};
			}
			return this.#checkListManager.getItem(itemId);
		}
	}

	class CheckListListDragManager extends CheckListDragManager {
		#store;
		#checkListManager;
		#draggable;
		#draggedItem = null;
		#container;
		constructor(params) {
			super(params);
			this.#store = params.store;
			this.#checkListManager = params.checkListManager;
		}
		init(container, offsetX = 0) {
			this.#container = container;
			this.#draggable = new ui_draganddrop_draggable.Draggable({
				container: this.#container,
				draggable: '.check-list-draggable-list',
				dragElement: '.check-list-drag-list',
				delay: 0,
				type: ui_draganddrop_draggable.Draggable.MOVE,
				offset: {
					x: offsetX
				}
			});
			this.#draggable.subscribe('beforeStart', this.#handleBeforeDragStart.bind(this));
			this.#draggable.subscribe('start', this.#handleDragStart.bind(this));
			this.#draggable.subscribe('over', this.#handleDragOver.bind(this));
			this.#draggable.subscribe('end', this.#handleDragEnd.bind(this));
		}
		destroy() {
			this.#draggable?.destroy();
		}
		#handleBeforeDragStart(event) {
			const data = event.getData();
			const source = data?.source;
			const dataset = source?.dataset;
			if (!dataset) {
				event.preventDefault();
				return;
			}
			const draggedItemId = this.#checkListManager.prepareItemId(dataset.id);
			const draggedItem = this.#checkListManager.getItem(draggedItemId);
			if (!draggedItem) {
				event.preventDefault();
				return;
			}
			this.#draggedItem = draggedItem;
			this.#setYOffset(source);
		}
		#handleDragStart(event) {
			this.#store.dispatch(`${tasks_v2_const.Model.Interface}/setDisableCheckListAnimations`, true);
			this.#store.dispatch(`${tasks_v2_const.Model.Interface}/setDraggedCheckListId`, this.#draggedItem.id);
		}
		#handleDragOver(event) {
			const {
				over,
				clientY
			} = event.getData();
			const overedItemId = this.#checkListManager.prepareItemId(over.dataset.id);
			const overedItem = this.#checkListManager.getItem(overedItemId);
			if (overedItem) {
				const overMiddlePoint = this.#draggable.getElementMiddlePoint(over);
				const direction = clientY > overMiddlePoint.y ? 1 : -1;
				const directionFromBottom = direction === 1;
				void this.#handleItemMoving(this.#draggedItem, overedItem, directionFromBottom);
			}
		}
		#handleDragEnd(event) {
			const {
				source: {
					dataset
				}
			} = event.getData();
			const draggedItemId = this.#checkListManager.prepareItemId(dataset.id);
			const draggedItem = this.#checkListManager.getItem(draggedItemId);
			this.resortLevel(draggedItem.parentId);
			const draggedItemChanged = draggedItem.sortIndex !== this.#draggedItem.sortIndex;
			if (draggedItemChanged) {
				this.emit('update', draggedItem.id);
			}
			this.#store.dispatch(`${tasks_v2_const.Model.Interface}/setDraggedCheckListId`, null);
			this.#store.dispatch(`${tasks_v2_const.Model.Interface}/setDisableCheckListAnimations`, false);
			this.#draggedItem = null;
			this.emit('end', draggedItem.id);
		}
		#handleItemMoving(draggedItem, overedItem, directionFromBottom) {
			const isFirstOnLevel = overedItem.sortIndex === 0;
			const numberOfItemPerLevel = this.#checkListManager.getChildren(overedItem.parentId).length;
			const isLastOnLevel = overedItem.sortIndex === numberOfItemPerLevel - 1;
			const shouldSkip = Math.abs(draggedItem.sortIndex - overedItem.sortIndex) === 1 && !isFirstOnLevel && !isLastOnLevel;
			if (shouldSkip) {
				return;
			}
			this.moveDropPreview(draggedItem, overedItem, directionFromBottom, true);
			this.resortLevelDependingOnPosition(draggedItem, overedItem, directionFromBottom, true);
		}
		#setYOffset(draggedItemElement) {
			const relativePosition = main_core.Dom.getRelativePosition(draggedItemElement, this.#container);
			const relativeTop = relativePosition.top;
			const isTopItem = relativeTop <= 0;
			const offsetY = isTopItem ? relativeTop : 0;
			const options = this.#draggable.getOptions();
			options.offset.y = -offsetY;
			this.#draggable.setOptions(options);
		}
	}

	const MENTION_REGEX = /^([+@])(\p{L}+)?$/u;
	class MentionMatcher {
		static match(text, startMatchPosition, currentPosition) {
			const afterPositionText = text.slice(startMatchPosition, currentPosition);
			const match = MENTION_REGEX.exec(afterPositionText);
			return match ? match[0] : '';
		}
	}

	class CheckListParticipantService {
		#taskId;
		#dialog;
		constructor(taskId) {
			this.#taskId = taskId;
		}
		showParticipantDialog(params) {
			if (!params.items?.length) {
				console.error('CheckListParticipantService: items cannot be empty');
				return;
			}
			const participants = params.items[0][params.type];
			const selectedUserIds = main_core.Type.isArrayFilled(participants) ? participants.map(user => user.id) : [];
			const handleClose = userIds => {
				void this.#saveParticipants(params.items, params.type, userIds);
				params.onClose?.(userIds);
			};
			void tasks_v2_lib_userSelectorDialog.usersDialog.show({
				targetNode: params.targetNode,
				ids: selectedUserIds,
				onSelect: params.onSelect,
				onDeselect: params.onDeselect,
				onClose: handleClose,
				isMultiple: params.isMultiple ?? true,
				withAngle: params.withAngle ?? true,
				enableSearch: params.enableSearch ?? true
			});
			this.#dialog = tasks_v2_lib_userSelectorDialog.usersDialog.getDialog();
		}
		async #saveParticipants(checkListItems, type, userIds) {
			const users = this.$store.getters[`${tasks_v2_const.Model.Users}/getByIds`](userIds);
			await this.#updateCheckListItems(checkListItems, type, users);
			await this.#mergeTaskParticipants(type, userIds);
		}
		async #updateCheckListItems(checkListItems, type, users) {
			if (checkListItems.length > 1) {
				const updatedItems = checkListItems.map(item => ({
					...item,
					[type]: users
				}));
				await this.#upsertCheckLists(updatedItems);
			} else {
				await this.#updateCheckList(checkListItems[0].id, {
					[type]: users
				});
			}
		}
		async #mergeTaskParticipants(type, newUserIds) {
			const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(this.#taskId);
			const participantIdsKey = `${type}Ids`;
			const existingUserIds = task[participantIdsKey] || [];
			const mergedUserIds = [...new Set([...existingUserIds, ...newUserIds])];
			await this.#updateTask({
				[participantIdsKey]: mergedUserIds
			});
		}
		updateSearch(searchQuery) {
			this.#dialog?.search(searchQuery);
		}
		isDialogOpen() {
			if (!this.#dialog) {
				return false;
			}
			return this.#dialog.isOpen();
		}
		closeDialog() {
			if (!this.#dialog) {
				return;
			}
			this.#dialog.hide();
			this.#dialog = null;
		}
		async #updateTask(fields) {
			return tasks_v2_provider_service_taskService.taskService.updateStoreTask(this.#taskId, fields);
		}
		async #updateCheckList(id, fields) {
			return this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
				id,
				fields
			});
		}
		async #upsertCheckLists(items) {
			return this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, items);
		}
		get $store() {
			return tasks_v2_core.Core.getStore();
		}
	}

	class MentionManager {
		#itemId;
		#participantService;
		#currentItem;
		#currentMention;
		constructor(params) {
			this.#itemId = params.itemId;
			this.#participantService = new CheckListParticipantService(params.taskId);
		}
		async handleInput(params) {
			if (this.#itemId !== params.item.id) {
				return;
			}
			this.#currentItem = params.item;
			const mention = this.#extractMention(params);
			if (!mention) {
				this.#closeParticipantDialog();
				return;
			}
			this.#currentMention = mention;
			if (this.#participantService.isDialogOpen()) {
				this.#updateParticipantSearch(mention);
			} else if (params.isEntered) {
				this.#openParticipantDialog(params.targetNode);
			}
		}
		#extractMention(params) {
			const startPosition = this.#currentMention?.startPosition ?? params.cursorPosition - 1;
			const matchedText = MentionMatcher.match(params.item.title, startPosition, params.cursorPosition);
			if (!main_core.Type.isStringFilled(matchedText)) {
				return null;
			}
			return {
				text: matchedText,
				startPosition
			};
		}
		#updateParticipantSearch(mention) {
			const searchText = mention.text.slice(1); // remove trigger character (@, +)
			this.#participantService.updateSearch(searchText);
		}
		#openParticipantDialog(targetNode) {
			this.#participantService.showParticipantDialog({
				targetNode,
				type: 'auditors',
				items: [this.#currentItem],
				isMultiple: true,
				withAngle: false,
				enableSearch: false,
				onSelect: () => this.#handleMentionSelected(),
				onDeselect: () => this.#handleMentionSelected(),
				onClose: () => this.#resetMentionState()
			});
		}
		#handleMentionSelected() {
			void this.#removeMentionFromTitle();
			this.#closeParticipantDialog();
		}
		#closeParticipantDialog() {
			this.#participantService.closeDialog();
			this.#resetMentionState();
		}
		#resetMentionState() {
			this.#participantService.updateSearch('');
			this.#currentMention = null;
		}
		async #removeMentionFromTitle() {
			if (!this.#currentMention) {
				return;
			}
			const newTitle = this.#buildTitleWithoutMention(this.#currentItem.title, this.#currentMention);
			await this.#updateCheckList(this.#currentItem.id, {
				title: newTitle
			});
		}
		#buildTitleWithoutMention(currentTitle, mention) {
			const beforeMention = currentTitle.slice(0, mention.startPosition);
			const afterMention = currentTitle.slice(mention.startPosition + mention.text.length);
			return beforeMention + afterMention;
		}
		async #updateCheckList(id, fields) {
			return this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
				id,
				fields
			});
		}
		get $store() {
			return tasks_v2_core.Core.getStore();
		}
	}

	// @vue/component
	const CheckListItemMixin = {
		inject: {
			task: {},
			taskId: {},
			isEdit: {}
		},
		props: {
			id: {
				type: [Number, String],
				required: true
			},
			isPreview: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update', 'addItem', 'removeItem', 'focus', 'blur', 'emptyBlur', 'show', 'hide'],
		setup() {},
		data() {
			return {
				isHovered: false,
				scrollContainer: null,
				isDragEnabled: false
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				currentUserId: `${tasks_v2_const.Model.Interface}/currentUserId`,
				draggedCheckListId: `${tasks_v2_const.Model.Interface}/draggedCheckListId`
			}),
			checkLists() {
				return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getByIds`](this.task.checklist);
			},
			item() {
				return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getById`](this.id);
			},
			isItemEdit() {
				return main_core.Type.isNumber(this.item.id);
			},
			canAdd() {
				if (!this.isEdit) {
					return true;
				}
				return this.task.rights.checklistAdd;
			},
			canEdit() {
				if (!this.isEdit) {
					return true;
				}
				const checkListItem = this.checkListManager.getRootParentByChildId(this.item?.id);
				return this.task.rights.checklistEdit || checkListItem?.creator?.id === this.currentUserId;
			},
			canModify() {
				return this.item?.actions.modify === true;
			},
			canRemove() {
				return this.item?.actions.remove === true;
			},
			canToggle() {
				if (this.readOnly && !this.isItemEdit && this.isEdit) {
					return false;
				}
				return this.item?.actions.toggle === true;
			},
			hasAttachments() {
				return this.hasUsers;
			},
			hasUsers() {
				return this.hasAccomplices || this.hasAuditors;
			},
			hasAccomplices() {
				return this.accomplices?.length > 0;
			},
			hasAuditors() {
				return this.auditors?.length > 0;
			},
			accomplices() {
				return this.item.accomplices;
			},
			auditors() {
				return this.item.auditors;
			},
			files() {
				return this.item.attachments;
			},
			textColor() {
				return this.completed ? 'var(--ui-color-base-4)' : 'var(--ui-color-base-1)';
			},
			linkColor() {
				return this.completed ? 'var(--ui-color-base-4)' : 'var(--ui-color-accent-main-link)';
			},
			groupMode() {
				return this.item.groupMode?.active === true;
			},
			groupModeSelected() {
				return this.item.groupMode?.selected === true;
			},
			completed() {
				return this.checkListManager.isItemCompleted(this.item);
			},
			canDragItem() {
				if (!this.isDragEnabled) {
					return false;
				}
				return this.isHovered && this.canModify && !this.readOnly && !this.groupMode;
			},
			readOnly() {
				return this.isPreview;
			},
			textReadOnly() {
				return this.groupMode || this.isPreview || !this.canModify;
			}
		},
		created() {
			this.checkListManager = new CheckListManager({
				computed: {
					checkLists: () => this.checkLists
				}
			});
			this.mentionManager = new MentionManager({
				taskId: this.taskId,
				itemId: this.item.id
			});
		},
		mounted() {
			setTimeout(() => {
				this.isDragEnabled = true;
			}, 1000);
		},
		methods: {
			...ui_vue3_vuex.mapActions(tasks_v2_const.Model.Interface, ['addCheckListCompletionCallback']),
			handleFocus() {
				this.$emit('focus', this.id);
			},
			handleBlur() {
				this.$emit('blur', this.id);
			},
			handleEmptyBlur() {
				this.$emit('emptyBlur', this.id);
			},
			handleLinkClick(event) {
				event.stopPropagation();
			},
			updateCheckList(id, fields) {
				this.$emit('update', this.id);
				return this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
					id,
					fields
				});
			},
			upsertCheckLists(items) {
				this.$emit('update', this.id);
				return this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, items);
			},
			updateTitle(title = '') {
				this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
					id: this.id,
					fields: {
						title
					}
				});
				this.$emit('update', this.id);
			},
			addItem(sort) {
				if (!this.canAdd) {
					return;
				}
				this.$emit('addItem', {
					id: this.id,
					sort: main_core.Type.isNumber(sort) ? sort : null
				});
			},
			removeItem() {
				this.$emit('removeItem', this.id);
			},
			async complete(isComplete, persist = true) {
				if (this.canToggle === false) {
					return;
				}
				await this.updateCheckList(this.id, {
					localCompleteState: isComplete
				});
				const listParents = new Map();
				this.checkListManager.syncParentCompletionState(this.id, (id, fields) => {
					listParents.set(id, fields);
					this.updateCheckList(id, {
						localCompleteState: fields.isComplete
					});
				});
				this.$emit('update', this.id);
				const completionCallback = () => {
					this.updateCheckList(this.id, {
						isComplete
					});
					listParents.forEach((fields, id) => {
						this.updateCheckList(id, fields);
						if (persist && this.isPreview && this.isEdit) {
							this.saveCompleteState(id, fields.isComplete);
						}
					});
				};
				this.addCheckListCompletionCallback({
					id: this.id,
					callback: completionCallback
				});
				if (persist && this.isPreview && this.isEdit) {
					this.saveCompleteState(this.id, isComplete);
				}
			},
			saveCompleteState(itemId, isComplete) {
				if (isComplete) {
					void tasks_v2_provider_service_checkListService.checkListService.complete(this.taskId, itemId);
				} else {
					void tasks_v2_provider_service_checkListService.checkListService.renew(this.taskId, itemId);
				}
			},
			async scrollToItem() {
				await new Promise(resolve => {
					setTimeout(() => resolve(), 300);
				});
				const item = this.$refs.item;
				const scrollContainer = this.$parent.$el?.closest('[data-list]');
				const itemRect = main_core.Dom.getPosition(item);
				const containerRect = main_core.Dom.getPosition(scrollContainer);
				const offsetTopInsideContainer = itemRect.top - containerRect.top + scrollContainer.scrollTop;
				scrollContainer.scrollTo({
					top: offsetTopInsideContainer - 200,
					behavior: 'smooth'
				});
			},
			handleInput(value) {
				const currentTitle = this.item.title;
				this.updateTitle(value);
				const textareaContainer = this.$refs.growingTextArea.$el;
				const textarea = textareaContainer?.querySelector('textarea');
				const cursorPosition = textarea?.selectionStart || 0;
				void this.mentionManager.handleInput({
					item: this.item,
					isEntered: currentTitle.length < value.length,
					cursorPosition,
					targetNode: textareaContainer
				});
			}
		}
	};

	// @vue/component
	const CheckListParentItem = {
		name: 'CheckListParentItem',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			BMenu: ui_vue3_components_menu.BMenu,
			GrowingTextArea: tasks_v2_component_elements_growingTextArea.GrowingTextArea,
			UserAvatarList: tasks_v2_component_elements_userAvatarList.UserAvatarList,
			UserCheckbox: tasks_v2_component_elements_userCheckbox.UserCheckbox,
			ProgressBar: tasks_v2_component_elements_progressBar.ProgressBar
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		mixins: [CheckListItemMixin],
		inject: ['setItemsRef'],
		props: {
			positionIndex: {
				type: Number,
				required: true
			}
		},
		emits: ['startGroupMode', 'openCheckList'],
		setup() {
			return {
				Actions: ui_iconSet_api_vue.Actions,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		data() {
			return {
				isSticky: false,
				isMenuShown: false,
				menuRemoveSectionCode: 'removeSection'
			};
		},
		computed: {
			menuOptions() {
				return {
					id: `check-list-parent-item-action-menu-${main_core.Text.getRandom()}`,
					bindElement: this.$refs.more.$el,
					minWidth: 250,
					offsetLeft: -100,
					sections: [{
						code: this.menuRemoveSectionCode
					}],
					items: this.menuItems,
					targetContainer: document.body,
					closeByEsc: true
				};
			},
			menuItems() {
				const collapseItem = {
					title: this.item.areCompletedCollapsed ? this.loc('TASKS_V2_CHECK_LIST_ITEM_MENU_SHOW') : this.loc('TASKS_V2_CHECK_LIST_ITEM_MENU_HIDE'),
					icon: this.item.areCompletedCollapsed ? ui_iconSet_api_vue.Outline.OBSERVER : ui_iconSet_api_vue.Outline.CROSSED_EYE,
					dataset: {
						id: `MenuProfileHide-${this.id}`
					},
					onClick: () => {
						const newValue = !this.item.areCompletedCollapsed;
						void this.updateCheckList(this.id, {
							areCompletedCollapsed: newValue
						});
						this.toggleCompleted(this.id, newValue);
					}
				};
				const groupActionsItem = {
					title: this.loc('TASKS_V2_CHECK_LIST_ITEM_MENU_GROUP'),
					icon: ui_iconSet_api_vue.Outline.MULTICHOICE_ON,
					dataset: {
						id: `MenuProfileGroup-${this.id}`
					},
					onClick: () => {
						if (this.collapsed) {
							this.toggleCollapse();
						}
						this.$emit('startGroupMode', this.id);
					}
				};
				const editItem = {
					sectionCode: this.menuRemoveSectionCode,
					title: this.loc('TASKS_V2_CHECK_LIST_ITEM_MENU_EDIT'),
					icon: ui_iconSet_api_vue.Outline.EDIT_L,
					dataset: {
						id: `MenuProfileEdit-${this.id}`
					},
					onClick: () => {
						if (this.canModify) {
							this.$emit('openCheckList', this.id);
						}
					}
				};
				const removeItem = {
					sectionCode: this.menuRemoveSectionCode,
					design: 'alert',
					title: this.loc('TASKS_V2_CHECK_LIST_ITEM_MENU_REMOVE'),
					icon: ui_iconSet_api_vue.Outline.TRASHCAN,
					dataset: {
						id: `MenuProfileRemove-${this.id}`
					},
					onClick: this.removeItem.bind(this)
				};
				if (this.isPreview) {
					return [collapseItem, this.canModify ? editItem : null, this.canRemove ? removeItem : null];
				}
				return [collapseItem, this.canModify ? groupActionsItem : null, this.canRemove ? removeItem : null];
			},
			itemIcon() {
				return this.completed ? ui_iconSet_api_vue.Outline.CHECK_L : ui_iconSet_api_vue.Outline.CHECK_LIST;
			},
			checkListStatus() {
				const label = this.loc('TASKS_V2_CHECK_LIST_STATUS_LABEL_NEW');
				return label.replace('#completed#', this.completedCount).replace('#total#', this.totalCount);
			},
			completedCount() {
				return this.checkLists.filter(checklist => {
					if (checklist.parentId !== this.id) {
						return false;
					}
					return checklist.localCompleteState ?? checklist.isComplete;
				}).length;
			},
			totalCount() {
				return this.checkLists.filter(checklist => {
					return checklist.parentId === this.id;
				}).length;
			},
			currentUserResponsible() {
				return this.task.responsibleIds.includes(this.currentUserId);
			},
			currentUser() {
				return this.$store.getters[`${tasks_v2_const.Model.Users}/getById`](this.currentUserId);
			},
			numberMyItems() {
				return this.checkListManager.findItemIdsWithUser(this.id, this.currentUserId).size;
			},
			myFilterTooltip() {
				return () => tasks_v2_component_elements_hint.tooltip({
					text: this.myFilterActive ? this.loc('TASKS_V2_CHECK_LIST_MY_FILTER_HINT_ALL') : this.loc('TASKS_V2_CHECK_LIST_MY_FILTER_HINT_MY'),
					popupOptions: {
						offsetLeft: this.$refs.myFilter.offsetWidth / 2
					}
				});
			},
			myFilterActive() {
				return this.item.myFilterActive;
			},
			fontSize() {
				return this.isPreview ? 15 : 17;
			},
			collapsed() {
				if (this.checkListManager.isParentItem(this.draggedCheckListId)) {
					return true;
				}
				return this.checkListManager.isItemCollapsed(this.item, this.isPreview, this.positionIndex);
			}
		},
		watch: {
			myFilterActive(value) {
				this.handleMyFilter(value);
			},
			totalCount() {
				this.handleCompleteState();
				if (!this.numberMyItems && this.myFilterActive) {
					this.handleMyFilter(false);
				}
			}
		},
		mounted() {
			this.scrollContainer = this.$parent.$el?.closest('[data-list]');
			if (this.setItemsRef) {
				this.setItemsRef(this.id, this);
			}
			if (this.scrollContainer) {
				main_core.Event.bind(this.scrollContainer, 'scroll', this.handleScroll);
				void this.$nextTick(this.checkSticky);
				this.mutationObserver = new MutationObserver(() => {
					this.checkSticky();
				});
				this.mutationObserver.observe(this.scrollContainer, {
					childList: true,
					subtree: true
				});
			}
			if (!this.isPreview) {
				this.handleCompleteState();
			}
		},
		beforeUnmount() {
			if (this.scrollContainer) {
				main_core.Event.unbind(this.scrollContainer, 'scroll', this.handleScroll);
			}
			if (this.mutationObserver) {
				this.mutationObserver.disconnect();
			}
			if (this.setItemsRef) {
				this.setItemsRef(this.id, null);
			}
		},
		methods: {
			handleScroll() {
				this.checkSticky();
			},
			handleTextClick() {
				if (this.isPreview && this.canModify) {
					this.$emit('openCheckList', this.id);
				}
			},
			handleMyFilter(checked) {
				const myItemIds = this.checkListManager.findItemIdsWithUser(this.id, this.currentUserId);
				this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
					id: this.id,
					fields: {
						myFilterActive: checked
					}
				});
				if (checked === true) {
					const idsToHide = this.checkListManager.getAllChildren(this.id).filter(item => !myItemIds.has(item.id)).map(item => item.id);
					this.checkListManager.hideItems(idsToHide, updates => this.upsertCheckLists(updates));
				} else {
					const childrenIds = this.checkListManager.getAllChildren(this.id).filter(item => {
						const completed = item.localCompleteState ?? item.isComplete;
						return !this.item.areCompletedCollapsed || !completed;
					}).map(item => item.id);
					this.checkListManager.showItems(childrenIds, updates => this.upsertCheckLists(updates));
				}
			},
			handleCompleteState() {
				if (this.totalCount > 0) {
					this.complete(this.totalCount === this.completedCount, false);
				} else if (this.completed) {
					this.complete(false, false);
				}
			},
			checkSticky() {
				if (!this.scrollContainer || !this.$refs.item) {
					return;
				}
				const stickyRect = this.$refs.item.getBoundingClientRect();
				const containerRect = this.scrollContainer.getBoundingClientRect();
				this.isSticky = stickyRect.top <= containerRect.top + stickyRect.height / 2;
			},
			showMenu() {
				this.isMenuShown = true;
			},
			toggleCollapse() {
				const localCollapsedState = !this.collapsed;
				if (this.isPreview && this.isEdit) {
					if (localCollapsedState === true) {
						void tasks_v2_provider_service_checkListService.checkListService.collapse(this.taskId, this.id);
					} else {
						void tasks_v2_provider_service_checkListService.checkListService.expand(this.taskId, this.id);
					}
				}
				this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
					id: this.id,
					fields: {
						localCollapsedState
					}
				});
			},
			collapse() {
				this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
					id: this.id,
					fields: {
						localCollapsedState: true
					}
				});
			},
			toggleCompleted(itemId, collapsed) {
				const myItemIds = this.checkListManager.findItemIdsWithUser(this.id, this.currentUserId);
				this.checkListManager.getAllCompletedChildren(itemId).filter(item => {
					return !this.myFilterActive || myItemIds.has(item.id);
				}).forEach(item => {
					if (collapsed === false) {
						this.checkListManager.showItems([item.id], updates => this.upsertCheckLists(updates));
					} else {
						this.checkListManager.hideItems([item.id], updates => this.upsertCheckLists(updates));
					}
				});
			}
		},
		template: `
		<div
			ref="item"
			class="check-list-widget-parent-item print-no-before"
			:class="{
				'--complete': completed,
				'--collapsed': collapsed,
				'--preview': isPreview,
				'--editable': canModify,
			}"
			:data-id="id"
			:data-parent="id"
			@mouseover="isHovered = true"
			@mouseleave="isHovered = false"
		>
			<div class="check-list-widget-parent-item-label-container">
				<div
					v-if="!readOnly"
					class="check-list-widget-item-drag"
					:class="{
						'check-list-drag-list': canDragItem,
					}"
				>
					<BIcon v-if="canDragItem" :name="Outline.DRAG_L"/>
				</div>
				<div class="check-list-widget-item-icon">
					<BIcon :name="itemIcon"/>
				</div>
			</div>
			<div class="check-list-widget-parent-item-title-container">
				<GrowingTextArea
					ref="growingTextArea"
					class="check-list-widget-parent-item-title"
					:data-check-list-id="'check-list-parent-item-title-' + id"
					:modelValue="item.title"
					:placeholder="loc('TASKS_V2_CHECK_LIST_LIST_PLACEHOLDER')"
					:readonly="textReadOnly"
					:fontColor="textColor"
					:linkColor
					:fontSize
					:lineHeight="20"
					:fontWeight="500"
					@click="handleTextClick"
					@linkClick="handleLinkClick"
					@update:modelValue="updateTitle"
					@input="handleInput"
					@focus="handleFocus"
					@emptyFocus="scrollToItem"
					@blur="handleBlur"
					@emptyBlur="handleEmptyBlur"
				/>
				<template v-if="hasAttachments">
					<div class="check-list-widget-item-attach --parent">
						<div v-if="hasUsers" class="check-list-widget-item-attach-users">
							<div v-if="hasAccomplices" class="check-list-widget-item-attach-users-list">
								<BIcon :name="Outline.GROUP"/>
								<UserAvatarList :users="accomplices"/>
							</div>
							<div v-if="hasAuditors" class="check-list-widget-item-attach-users-list">
								<BIcon :name="Outline.OBSERVER"/>
								<UserAvatarList :users="auditors"/>
							</div>
						</div>
					</div>
				</template>
				<div class="check-list-widget-parent-item-title-status">
					<div class="check-list-widget-parent-item-title-status-label">
						{{ checkListStatus }}
					</div>
					<ProgressBar
						:totalValue="totalCount"
						:completedValue="completedCount"
						:width="56"
						:height="5"
						color="var(--ui-color-accent-main-primary-alt)"
						bgColor="var(--ui-color-base-7)"
						:borderRadius="30"
					/>
				</div>
			</div>
			<div class="check-list-widget-parent-item-action">
				<div class="check-list-widget-parent-item-main-action">
					<div
						ref="myFilter"
						class="check-list-widget-parent-item-main-action-filter"
						v-hint="myFilterTooltip"
					>
						<UserCheckbox
							v-if="!currentUserResponsible && numberMyItems > 0"
							:init-user="currentUser"
							:number="numberMyItems"
							v-model:checked="item.myFilterActive"
						/>
					</div>
					<div class="check-list-widget-parent-item-main-action-actions print-ignore">
						<BIcon 
							:name="Outline.MORE_L"
							:size="isPreview ? 20 : 24"
							@click="showMenu"
							ref="more"
						/>
						<BIcon
							:name="collapsed ? Outline.CHEVRON_DOWN_L : Outline.CHEVRON_TOP_L"
							:size="isPreview ? 20 : 24"
							@click="toggleCollapse()"
						/>
					</div>
				</div>
				<div v-if="isSticky && !isPreview" class="check-list-widget-parent-item-empty print-ignore"/>
			</div>
			<BMenu v-if="isMenuShown" :options="menuOptions" @close="isMenuShown = false"/>
		</div>
	`
	};

	// @vue/component
	const CheckListCheckbox = {
		name: 'CheckListCheckbox',
		components: {
			UiCheckbox: tasks_v2_component_elements_checkbox.Checkbox
		},
		props: {
			important: {
				type: Boolean,
				default: false
			},
			disabled: {
				type: Boolean,
				default: false
			},
			checked: {
				type: Boolean,
				default: false
			},
			highlight: {
				type: Boolean,
				default: false
			}
		},
		emits: ['click'],
		template: `
		<UiCheckbox
			:checked
			:important
			:disabled
			:highlight
			class="check-list-widget-checkbox"
			@click="$emit('click', $event)"
		/>
	`
	};

	// @vue/component
	const CheckListChildItem = {
		name: 'CheckListChildItem',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			BLine: ui_system_skeleton_vue.BLine,
			GrowingTextArea: tasks_v2_component_elements_growingTextArea.GrowingTextArea,
			UserAvatarList: tasks_v2_component_elements_userAvatarList.UserAvatarList,
			CheckListCheckbox,
			UserFieldWidgetComponent: tasks_v2_component_elements_userFieldWidgetComponent.DiskUserFieldWidgetComponent
		},
		mixins: [CheckListItemMixin],
		inject: ['setItemsRef'],
		props: {
			itemOffset: {
				type: String,
				default: '0'
			},
			checkListId: {
				type: [Number, String],
				default: 0
			}
		},
		emits: ['toggleGroupModeSelected', 'openCheckList'],
		setup(props) {
			const fileServiceInstance = tasks_v2_provider_service_fileService.fileService.get(props.id, tasks_v2_provider_service_fileService.EntityTypes.CheckListItem, {
				parentEntityId: props.taskId
			});
			return {
				Outline: ui_iconSet_api_vue.Outline,
				fileService: fileServiceInstance,
				uploaderAdapter: fileServiceInstance.getAdapter()
			};
		},
		data() {
			return {
				uploadingFiles: this.fileService.getFiles(),
				filesLoading: false
			};
		},
		computed: {
			widgetOptions() {
				return {
					isEmbedded: true,
					withControlPanel: false,
					canCreateDocuments: false,
					tileWidgetOptions: {
						compact: true,
						hideDropArea: true,
						enableDropzone: false,
						readonly: this.isPreview,
						autoCollapse: false,
						removeFromServer: !this.isEdit
					}
				};
			},
			hasAttachments() {
				return this.hasUsers || this.hasFilesAttach;
			},
			hasFilesAttach() {
				return this.hasFiles || this.fileService.isUploading() || this.fileService.hasUploadingError();
			},
			hasFiles() {
				return this.filesNumber > 0;
			},
			filesNumber() {
				if (!this.files) {
					return 0;
				}
				return this.files.length;
			},
			hasTrashcanIcon() {
				return this.isHovered && this.canModify && !this.item.panelIsShown && !this.groupMode && !this.readOnly;
			},
			toggleable() {
				if (this.isPreview) {
					return this.canModify;
				}
				return this.canToggle;
			}
		},
		created() {
			if (this.hasFilesAttach) {
				void this.loadFiles();
			}
		},
		mounted() {
			if (this.setItemsRef) {
				this.setItemsRef(this.id, this);
			}
			if (this.checkListId === this.id) {
				setTimeout(() => {
					this.$refs.growingTextArea?.focusTextarea();
				}, 500);
			}
			this.subscribeToEvents();
		},
		beforeUnmount() {
			if (this.setItemsRef) {
				this.setItemsRef(this.id, null);
			}
			this.unsubscribeToEvents();
		},
		methods: {
			subscribeToEvents() {
				main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.HighlightCheckListItem + this.id, this.handleHighlightItemEvent);
			},
			unsubscribeToEvents() {
				main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.HighlightCheckListItem + this.id, this.handleHighlightItemEvent);
			},
			toggleGroupModeSelected() {
				this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
					id: this.id,
					fields: {
						groupMode: {
							active: true,
							selected: !this.groupModeSelected
						}
					}
				});
				this.$emit('toggleGroupModeSelected', this.id);
			},
			async loadFiles() {
				this.filesLoading = true;
				const ids = this.files?.map(file => file?.id ?? file);
				await this.fileService.list(ids ?? []);
				this.filesLoading = false;
			},
			handleEnter() {
				if (!this.item) {
					return;
				}
				this.addItem(this.item.sortIndex + 1);
			},
			handleClick(event) {
				const filesWidget = this.$refs['files-widget'];
				if (this.isClickInsideFilesWidget(filesWidget?.$el, event.target)) {
					return;
				}
				if (this.groupMode) {
					this.toggleGroupModeSelected();
				}
				if (this.isPreview && this.canModify) {
					this.$emit('openCheckList', this.id);
				}
			},
			isClickInsideFilesWidget(filesNode, target) {
				if (!filesNode || !target) {
					return false;
				}
				const excludedClasses = ['ui-tile-uploader-items'];
				const isInsideWidget = filesNode.contains(target);
				if (!isInsideWidget) {
					return false;
				}
				const hasExcludedClass = excludedClasses.some(className => main_core.Dom.hasClass(target, className));
				return !hasExcludedClass;
			},
			handleHighlightItemEvent() {
				void tasks_v2_lib_highlighter.highlighter.highlight(this.$el);
			}
		},
		template: `
		<div
			ref="item"
			class="check-list-widget-child-item print-no-before"
			:class="{
				'--complete': completed,
				'--group-mode': groupMode,
				'--group-mode-selected': groupModeSelected,
				'--preview': isPreview,
				'--toggleable': toggleable,
			}"
			:style="{ marginLeft: itemOffset }"
			@mouseover="isHovered = true"
			@mouseleave="isHovered = false"
			@click="handleClick"
		>
			<div class="check-list-widget-child-item-base">
				<div
					v-if="!readOnly"
					class="check-list-widget-item-drag"
					:class="{
						'check-list-drag-item': canDragItem,
					}"
				>
					<BIcon v-if="canDragItem" :name="Outline.DRAG_L"/>
				</div>
				<CheckListCheckbox
					:important="!item.isImportant"
					:disabled="!canToggle || groupMode"
					:checked="completed"
					@click="complete(!completed)"
				/>
				<div
					v-if="item.isImportant"
					class="check-list-widget-child-item-important"
				>
					<BIcon :name="Outline.FIRE_SOLID"/>
				</div>
				<GrowingTextArea
					ref="growingTextArea"
					class="check-list-widget-child-item-title"
					:data-check-list-id="'check-list-child-item-title-' + item.id"
					:modelValue="item.title"
					:placeholder="loc('TASKS_V2_CHECK_LIST_ITEM_PLACEHOLDER')"
					:readonly="textReadOnly"
					:fontColor="textColor"
					:linkColor
					:fontSize="15"
					:lineHeight="20"
					@update:modelValue="updateTitle"
					@linkClick="handleLinkClick"
					@input="handleInput"
					@focus="handleFocus"
					@blur="handleBlur"
					@emptyBlur="handleEmptyBlur"
					@emptyFocus="scrollToItem"
					@enterBlur="handleEnter"
				/>
				<div
					v-if="hasTrashcanIcon"
					class="check-list-widget-child-item-action"
					@click="removeItem"
				>
					<BIcon :name="Outline.TRASHCAN"/>
				</div>
				<template v-else-if="groupMode">
					<CheckListCheckbox :checked="groupModeSelected" highlight @click="toggleGroupModeSelected"/>
				</template>
				<div v-else class="check-list-widget-child-item-action-stub"/>
			</div>
			<template v-if="hasAttachments">
				<div class="check-list-widget-item-attach print-ignore">
					<div v-if="hasUsers" class="check-list-widget-item-attach-users">
						<div v-if="hasAccomplices" class="check-list-widget-item-attach-users-list">
							<BIcon :name="Outline.GROUP"/>
							<UserAvatarList :users="accomplices"/>
						</div>
						<div v-if="hasAuditors" class="check-list-widget-item-attach-users-list">
							<BIcon :name="Outline.OBSERVER"/>
							<UserAvatarList :users="auditors"/>
						</div>
					</div>
					<div v-if="hasFilesAttach" class="check-list-widget-item-attach-files">
						<div class="check-list-widget-item-attach-files-list">
							<template v-if="filesLoading">
								<div class="check-list-widget-item-attach-files-list-skeleton">
									<BLine v-for="key in filesNumber" :key :height="90"/>
								</div>
							</template>
							<template v-else>
								<UserFieldWidgetComponent :uploaderAdapter :widgetOptions ref="files-widget"/>
							</template>
						</div>
					</div>
				</div>
			</template>
		</div>
	`
	};

	// @vue/component
	const CheckListAddItem = {
		name: 'CheckListAddItem',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			isPreview: {
				type: Boolean,
				default: false
			}
		},
		emits: ['addItem'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		template: `
		<div
			class="check-list-widget-add-item print-ignore"
			:class="{'--preview': isPreview}"
			@mousedown="$emit('addItem')"
		>
			<div class="check-list-widget-add-item-icon">
				<BIcon :name="Outline.PLUS_L"/>
			</div>
			<div class="check-list-widget-add-item-title">{{ loc('TASKS_V2_CHECK_LIST_ITEM_ADD_BTN') }}</div>
		</div>
	`
	};

	// @vue/component
	const CheckListDropList = {
		name: 'CheckListDropList',
		template: `
		<div class="check-list-widget-drop-list"/>
	`
	};

	// @vue/component
	const CheckListDropItem = {
		name: 'CheckListDropItem',
		props: {
			dropOffset: {
				type: String,
				default: '0'
			}
		},
		template: `
		<div class="check-list-widget-drop-item" :style="{ marginLeft: dropOffset }"/>
	`
	};

	// @vue/component
	const CheckListGroupCompletedList = {
		name: 'CheckListGroupCompletedList',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			totalCompletedParents: {
				type: Number,
				required: true
			}
		},
		setup() {
			return {
				Actions: ui_iconSet_api_vue.Actions,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			completedParentsLabel() {
				return this.loc('TASKS_V2_CHECK_LIST_PREVIEW_COMPLETED', {
					'#number#': this.totalCompletedParents
				});
			}
		},
		template: `
		<div class="check-list-widget-group-completed-list">
			<div class="check-list-widget-group-completed-list-icon">
				<BIcon :name="Outline.CHECK_L"/>
			</div>
			<div class="check-list-widget-group-completed-list-title">
				{{ completedParentsLabel }}
			</div>
			<div class="check-list-widget-group-completed-list-action print-ignore">
				<BIcon :name="Actions.CHEVRON_RIGHT"/>
			</div>
		</div>
	`
	};

	// @vue/component
	const CheckListWidget = {
		name: 'CheckListWidget',
		components: {
			CheckListParentItem,
			CheckListChildItem,
			CheckListAddItem,
			CheckListDropList,
			CheckListDropItem,
			CheckListGroupCompletedList
		},
		inject: {
			task: {},
			taskId: {}
		},
		props: {
			context: {
				type: String,
				required: true
			},
			checkListId: {
				type: [Number, String],
				default: 0
			},
			parentId: {
				type: [Number, String],
				default: 0
			},
			isPreview: {
				type: Boolean,
				default: false
			}
		},
		emits: ['show', 'update', 'addItem', 'addItemFromBtn', 'removeItem', 'focus', 'blur', 'emptyBlur', 'startGroupMode', 'toggleGroupModeSelected', 'openCheckList'],
		setup() {},
		data() {
			return {
				scrollContainer: null
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				currentUserId: `${tasks_v2_const.Model.Interface}/currentUserId`,
				disableCheckListAnimations: `${tasks_v2_const.Model.Interface}/disableCheckListAnimations`,
				draggedCheckListId: `${tasks_v2_const.Model.Interface}/draggedCheckListId`
			}),
			checkLists() {
				return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getByIds`](this.task.checklist);
			},
			parentCheckLists() {
				return this.checkLists.filter(checkList => {
					if (checkList.parentId !== 0 || checkList.hidden) {
						return false;
					}
					return !(this.isPreview && checkList.isComplete);
				}).sort((a, b) => {
					if (a.isComplete === b.isComplete) {
						return a.sortIndex - b.sortIndex;
					}
					return a.isComplete ? 1 : -1;
				});
			},
			totalCompletedParents() {
				return this.checkLists.filter(checkList => {
					return checkList.parentId === 0 && checkList.isComplete;
				}).length;
			},
			siblings() {
				return this.checkLists.filter(item => item.parentId === this.parentId).sort((a, b) => a.sortIndex - b.sortIndex);
			},
			canAddItem() {
				return this.task.rights.checklistAdd;
			},
			parentItemDragged() {
				return this.checkListManager.isParentItem(this.draggedCheckListId);
			}
		},
		created() {
			this.checkListManager = new CheckListManager({
				computed: {
					checkLists: () => this.checkLists
				}
			});
			if (!this.isPreview) {
				this.listDragManager = new CheckListListDragManager({
					store: this.$store,
					checkListManager: this.checkListManager
				});
				this.listDragManager.subscribe('update', baseEvent => {
					const draggedItemId = baseEvent.getData();
					this.$emit('update', draggedItemId);
				});
				this.listDragManager.subscribe('end', baseEvent => {
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
					currentUserId: this.currentUserId
				});
				this.itemDragManager.subscribe('update', baseEvent => {
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
		mounted() {
			this.scrollContainer = this.$el.parentElement;
			this.subscribeToEvents();
			if (!this.isPreview) {
				this.initDragManager();
			}
			this.focusTo(this.checkListId);
			this.$emit('show');
		},
		beforeUnmount() {
			this.itemDragManager?.destroy();
			this.unsubscribeFromEvents();
		},
		methods: {
			subscribeToEvents() {
				main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.ShowCheckList, this.handleShowCheckListEvent);
				main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.ShowCheckListItems, this.handleShowCheckListItemsEvent);
			},
			unsubscribeFromEvents() {
				main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.ShowCheckList, this.handleShowCheckListEvent);
				main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.ShowCheckListItems, this.handleShowCheckListItemsEvent);
			},
			focusTo(checkListId) {
				const focusedItem = this.checkListManager.getItem(checkListId);
				if (!focusedItem) {
					return;
				}
				const {
					targetId,
					offset,
					shouldHighlight
				} = this.calculateFocusTarget(focusedItem);
				this.scrollToTarget(targetId, offset, shouldHighlight);
			},
			calculateFocusTarget(focusedItem) {
				const isRootItem = focusedItem.parentId === 0;
				if (!isRootItem) {
					return {
						targetId: focusedItem.id,
						offset: 140,
						shouldHighlight: false
					};
				}
				const childWithEmptyTitle = this.checkListManager.getChildWithEmptyTitle(focusedItem.id);
				return {
					targetId: childWithEmptyTitle?.id ?? focusedItem.id,
					offset: childWithEmptyTitle ? 140 : 0,
					shouldHighlight: true
				};
			},
			scrollToTarget(targetId, offset, shouldHighlight) {
				setTimeout(() => {
					const targetNode = this.scrollContainer.querySelector(`[data-id="${targetId}"]`);
					if (!targetNode) {
						return;
					}
					if (shouldHighlight) {
						this.highlightParentContainer(targetId);
					}
					this.scrollContainer.scrollTop = targetNode.offsetTop - offset;
				}, 0);
			},
			highlightParentContainer(targetId) {
				const highlightElement = this.scrollContainer.querySelector(`[data-parent-container="${targetId}"]`);
				if (highlightElement) {
					void tasks_v2_lib_highlighter.highlighter.highlight(highlightElement);
				}
			},
			getItemOffset(item) {
				if (item.parentId === 0) {
					return '0';
				}
				const level = this.checkListManager.getItemLevel(item);
				if (level === 1) {
					return '0';
				}
				return `${(level - 1) * 28}px`;
			},
			handleDropException() {
				const container = this.$el.closest('[data-list]');
				const allItems = container.querySelectorAll('.check-list-widget-item.--dragged_item');
				allItems.forEach(item => item.remove());
			},
			getChildren(parent) {
				return this.checkListManager.getAllChildren(parent.id).filter(checkList => !checkList.hidden);
			},
			isCollapsed(item, positionIndex) {
				if (this.checkListManager.isParentItem(this.draggedCheckListId)) {
					return true;
				}
				return this.checkListManager.isItemCollapsed(item, this.isPreview, positionIndex);
			},
			getFirstCompletedCheckList() {
				const completedCheckLists = this.checkLists.filter(checkList => {
					return checkList.parentId === 0 && checkList.isComplete === true;
				}).sort((a, b) => a.sortIndex - b.sortIndex);
				return completedCheckLists[0];
			},
			handleShowCheckListEvent(event) {
				const {
					checkListId
				} = event.getData();
				if (!checkListId) {
					return;
				}
				this.$emit('openCheckList', checkListId);
				this.focusTo(checkListId);
			},
			async handleShowCheckListItemsEvent(event) {
				const {
					checkListItemIds
				} = event.getData();
				if (!main_core.Type.isArrayFilled(checkListItemIds)) {
					return;
				}
				const firstItemId = checkListItemIds[0];
				this.focusTo(firstItemId);
				this.$emit('openCheckList', firstItemId);
				await this.$nextTick();
				checkListItemIds.forEach(itemId => {
					main_core_events.EventEmitter.emit(tasks_v2_const.EventName.HighlightCheckListItem + itemId);
				});
			},
			showFirstCompletedCheckList() {
				const firstCompletedCheckList = this.getFirstCompletedCheckList();
				this.$emit('openCheckList', firstCompletedCheckList.id);
			},
			initDragManager() {
				let offsetX = 0;
				if (this.context !== Context.Popup && main_core.Type.isElementNode(this.$root.$el)) {
					const parentRect = main_core.Dom.getPosition(this.$el);
					const parentRelativeRect = main_core.Dom.getRelativePosition(this.$el, this.$root.$el);
					offsetX = parentRelativeRect.left - parentRect.left;
				}
				this.listDragManager.init(this.scrollContainer, offsetX);
				const listDropzone = this.canAddItem ? this.$refs.parentComponents?.map(parent => parent.$el) : [];
				this.itemDragManager.init(this.scrollContainer, offsetX, listDropzone);
			}
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
					class="check-list-widget-item --parent check-list-draggable-list print-no-page-break print-no-box-shadow print-font-color-base-1-recursive"
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
					class="check-list-widget-item --completed-list print-no-box-shadow"
				>
					<CheckListGroupCompletedList :totalCompletedParents @click="showFirstCompletedCheckList"/>
				</li>
			</TransitionGroup>
		</div>
	`
	};

	const PanelSection = Object.freeze({
		Important: 'important',
		Attachments: 'attachments',
		Movement: 'movement',
		Accomplice: 'accomplice',
		Auditor: 'auditor',
		Forward: 'forward',
		Delete: 'delete',
		Cancel: 'cancel'
	});
	const PanelAction = Object.freeze({
		SetImportant: 'setImportant',
		AttachFile: 'attachFile',
		MoveRight: 'moveRight',
		MoveLeft: 'moveLeft',
		AssignAccomplice: 'assignAccomplice',
		AssignAuditor: 'assignAuditor',
		Forward: 'forward',
		Delete: 'delete',
		Cancel: 'cancel'
	});
	const PanelMeta = Object.freeze({
		defaultSections: [{
			name: PanelSection.Important,
			items: [{
				icon: ui_iconSet_api_vue.Outline.FIRE,
				activeIcon: ui_iconSet_api_vue.Outline.FIRE_SOLID,
				action: PanelAction.SetImportant,
				hint: 'TASKS_V2_CHECK_LIST_ITEM_IMPORTANT_HINT',
				className: '--important',
				hoverable: false
			}]
		}, {
			name: PanelSection.Attachments,
			items: [{
				icon: ui_iconSet_api_vue.Outline.ATTACH,
				action: PanelAction.AttachFile,
				hint: 'TASKS_V2_CHECK_LIST_ITEM_ATTACH_HINT'
			}]
		}, {
			name: PanelSection.Movement,
			items: [{
				icon: ui_iconSet_api_vue.Outline.POINT_RIGHT,
				action: PanelAction.MoveRight,
				hint: 'TASKS_V2_CHECK_LIST_ITEM_MOVE_RIGHT_HINT'
			}, {
				icon: ui_iconSet_api_vue.Outline.POINT_LEFT,
				action: PanelAction.MoveLeft,
				hint: 'TASKS_V2_CHECK_LIST_ITEM_MOVE_LEFT_HINT'
			}]
		}, {
			name: PanelSection.Accomplice,
			items: [{
				icon: ui_iconSet_api_vue.Outline.PERSON,
				action: PanelAction.AssignAccomplice,
				hint: 'TASKS_V2_CHECK_LIST_ITEM_ACCOMPLICE_HINT'
			}]
		}, {
			name: PanelSection.Auditor,
			items: [{
				icon: ui_iconSet_api_vue.Outline.OBSERVER,
				action: PanelAction.AssignAuditor,
				hint: 'TASKS_V2_CHECK_LIST_ITEM_AUDITOR_HINT'
			}]
		}, {
			name: PanelSection.Forward,
			items: [{
				icon: ui_iconSet_api_vue.Outline.FORWARD,
				action: PanelAction.Forward,
				hint: 'TASKS_V2_CHECK_LIST_ITEM_FORWARD_HINT'
			}]
		}, {
			name: PanelSection.Delete,
			items: [{
				icon: ui_iconSet_api_vue.Outline.TRASHCAN,
				action: PanelAction.Delete,
				hint: 'TASKS_V2_CHECK_LIST_ITEM_REMOVE_HINT'
			}]
		}, {
			name: PanelSection.Cancel,
			items: [{
				icon: ui_iconSet_api_vue.Outline.CROSS_L,
				action: PanelAction.Cancel,
				hint: 'TASKS_V2_CHECK_LIST_ITEM_CANCEL_HINT'
			}]
		}].filter(Boolean)
	});

	// @vue/component
	const CheckListItemPanel = {
		name: 'CheckListItemPanel',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		inject: {
			task: {},
			taskId: {},
			isEdit: {}
		},
		props: {
			currentItem: {
				type: Object,
				default: () => null
			}
		},
		emits: ['action'],
		setup() {},
		data() {
			return {
				currentHintElement: null,
				currentHintText: ''
			};
		},
		computed: {
			checkLists() {
				return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getByIds`](this.task.checklist);
			},
			isStakeholdersRestricted() {
				return !tasks_v2_core.Core.getParams().restrictions.stakeholder.available;
			},
			sections() {
				return PanelMeta.defaultSections.filter(section => this.visibleSections.includes(section.name) && this.canShowPanelSection(section.name)).map(section => ({
					...section,
					items: section.items.filter(item => this.visibleActions.includes(item.action)).map(item => ({
						...item,
						disabled: this.isItemDisabled(item),
						active: this.isItemActive(item),
						hoverable: item.hoverable ?? true
					}))
				})).filter(section => section.items.length > 0);
			},
			tooltip() {
				return () => ({
					text: this.currentHintText,
					timeout: 500,
					popupOptions: {
						className: 'tasks-hint',
						background: 'var(--ui-color-bg-content-inapp)',
						darkMode: false,
						offsetLeft: Math.round((this.currentHintElement?.offsetWidth ?? 0) / 3),
						padding: 6,
						bindOptions: {
							forceBindPosition: true,
							forceTop: true,
							position: 'top'
						},
						targetContainer: document.body
					}
				});
			},
			visibleSections() {
				return PanelMeta.defaultSections.map(section => section.name);
			},
			visibleActions() {
				if (!this.currentItem) {
					return [];
				}
				let actions = [PanelAction.SetImportant, PanelAction.MoveRight, PanelAction.MoveLeft, PanelAction.AssignAccomplice, PanelAction.AssignAuditor, PanelAction.Forward, PanelAction.Delete];
				if (this.itemGroupModeSelected) {
					actions.push(PanelAction.Cancel);
				} else {
					actions.push(PanelAction.AttachFile);
				}
				if (this.currentItem.parentId === 0) {
					actions = [PanelAction.AssignAccomplice, PanelAction.AssignAuditor];
				}
				const stakeholdersActions = new Set([PanelAction.AssignAccomplice, PanelAction.AssignAuditor]);
				return actions.filter(action => {
					const isDisabledStakeholders = stakeholdersActions.has(action) && this.isStakeholdersRestricted;
					return !isDisabledStakeholders;
				});
			},
			disabledActions() {
				if (!this.currentItem) {
					return [];
				}
				const disabledActions = [];
				const itemLevel = this.checkListManager.getItemLevel(this.currentItem);
				const canModify = this.currentItem.actions.modify === true;
				const canRemove = this.currentItem.actions.remove === true;
				const conditionHandlers = {
					[PanelAction.SetImportant]: () => {
						return canModify === false;
					},
					[PanelAction.AttachFile]: () => {
						return canModify === false;
					},
					[PanelAction.MoveLeft]: () => {
						return itemLevel === 1 || canModify === false;
					},
					[PanelAction.MoveRight]: () => {
						return itemLevel === 5 || this.currentItem.sortIndex === 0 || canModify === false;
					},
					[PanelAction.AssignAccomplice]: () => {
						return canModify === false || this.canChangeAccomplices === false;
					},
					[PanelAction.AssignAuditor]: () => {
						return canModify === false || this.canAuditorsAdd === false;
					},
					[PanelAction.Forward]: () => {
						return canModify === false || this.currentItem.title === '' || !this.canCheckListAdd;
					},
					[PanelAction.Delete]: () => {
						return canRemove === false;
					}
				};
				Object.entries(conditionHandlers).forEach(([action, condition]) => {
					if (condition()) {
						disabledActions.push(action);
					}
				});
				return disabledActions;
			},
			activeActions() {
				if (!this.currentItem) {
					return [];
				}
				const actions = [];
				if (this.currentItem.isImportant) {
					actions.push(PanelAction.SetImportant);
				}
				return actions;
			},
			itemGroupModeSelected() {
				if (!this.currentItem) {
					return false;
				}
				return this.currentItem.groupMode?.selected === true;
			},
			canCheckListAdd() {
				if (!this.isEdit) {
					return true;
				}
				return this.task.rights.checklistAdd;
			},
			canAuditorsAdd() {
				if (!this.isEdit) {
					return true;
				}
				return this.task.rights.addAuditors;
			},
			canChangeAccomplices() {
				if (!this.isEdit) {
					return true;
				}
				return this.task.rights.changeAccomplices;
			}
		},
		created() {
			this.checkListManager = new CheckListManager({
				computed: {
					checkLists: () => this.checkLists
				}
			});
		},
		methods: {
			isItemDisabled(item) {
				return item.disabled ?? this.disabledActions.includes(item.action);
			},
			isItemActive(item) {
				return item.active ?? this.activeActions.includes(item.action);
			},
			getItemIcon(item) {
				return item.active && item.activeIcon ? item.activeIcon : item.icon;
			},
			handleItemClick(event, item) {
				if (!item.disabled) {
					this.$emit('action', {
						action: item.action,
						node: event.currentTarget
					});
				}
			},
			handleItemMouseEnter(event, item) {
				this.currentHintElement = event.currentTarget;
				this.currentHintText = item.hint ? this.loc(item.hint) : null;
			},
			canShowPanelSection(sectionName) {
				return !(sectionName === PanelSection.Attachments && !tasks_v2_core.Core.getParams().features.disk);
			}
		},
		template: `
		<div v-if="sections.length > 0" class="check-list-widget-item-panel" @mousedown.prevent>
			<template v-for="section in sections" :key="section.name">
				<div class="check-list-widget-item-panel-section" :class="'--' + section.name">
					<template v-for="item in section.items" :key="item.action" >
						<div
							v-hint="tooltip"
							class="check-list-widget-item-panel-section-item"
							:class="{
								'--disabled': item.disabled,
								'--active': item.active,
								[item.className]: Boolean(item.className),
							}"
							@click="handleItemClick($event, item)"
							@mouseenter="handleItemMouseEnter($event, item)"
						>
							<BIcon :name="getItemIcon(item)" :hoverable="item.hoverable"/>
							<span v-if="item.label">{{ loc(item.label) }}</span>
						</div>
					</template>
				</div>
			</template>
		</div>
	`
	};

	class CheckListNotifier extends main_core_events.EventEmitter {
		#interval = null;
		#timerValue = 5;
		#counter = 5;
		#content = '';
		#balloonWithTimer;
		constructor(params) {
			super();
			this.setEventNamespace('Tasks.V2.CheckList.CheckListNotifier');
			this.#content = params.content;
			this.#timerValue = main_core.Type.isUndefined(params.timerValue) ? this.#timerValue : params.timerValue;
		}
		showBalloonWithTimer() {
			this.#counter = this.#timerValue;
			const balloonId = `check-list-balloon-${main_core.Text.getRandom()}`;
			this.#balloonWithTimer = ui_notification.UI.Notification.Center.notify({
				id: balloonId,
				content: this.#getBalloonContent(),
				actions: [{
					title: main_core.Loc.getMessage('TASKS_V2_CHECK_LIST_BALLOON_CANCEL'),
					events: {
						mouseup: this.#handleCancelClick.bind(this)
					}
				}]
			});
			const handler = baseEvent => {
				const closingBalloon = baseEvent.getTarget();
				if (closingBalloon.getId() === balloonId) {
					this.#handleClosingBalloon();
					main_core_events.EventEmitter.unsubscribe('UI.Notification.Balloon:onClose', handler);
				}
			};
			main_core_events.EventEmitter.subscribe('UI.Notification.Balloon:onClose', handler);
			this.#startTimer();
		}
		stopTimer() {
			this.#balloonWithTimer.close();
		}
		#startTimer() {
			this.#interval = setInterval(() => {
				this.#counter--;
				this.#balloonWithTimer.update({
					content: this.#getBalloonContent()
				});
				if (this.#counter <= 0) {
					this.stopTimer();
				}
			}, 1000);
		}
		#handleCancelClick() {
			this.emit('complete', false);
			this.#balloonWithTimer.close();
		}
		#handleClosingBalloon() {
			clearInterval(this.#interval);
			this.emit('complete', true);
		}
		#getBalloonContent() {
			return this.#content.replace('#countdown#', this.#counter);
		}
	}

	class CheckListChangeTracker {
		#params;
		#initialSnapshot = new Map();
		#isInitialized = false;
		constructor(params) {
			this.#params = params;
		}
		createSnapshot() {
			this.#initialSnapshot.clear();
			const checkLists = this.#getCheckLists();
			checkLists.forEach(item => {
				const children = this.#getCheckLists().filter(child => child.parentId === item.id).map(child => child.id);
				this.#initialSnapshot.set(item.id, {
					id: item.id,
					title: item.title || '',
					parentId: item.parentId || 0,
					sortIndex: item.sortIndex || 0,
					isImportant: item.isImportant || false,
					isComplete: item.isComplete || false,
					accomplices: [...(item.accomplices || [])],
					auditors: [...(item.auditors || [])],
					attachments: [...(item.attachments || [])],
					childrenIds: children
				});
			});
			this.#isInitialized = true;
		}
		hasChanges() {
			if (!this.#isInitialized) {
				return false;
			}
			const currentCheckLists = this.#getCheckLists();
			const currentIds = new Set(currentCheckLists.map(item => item.id));
			const initialIds = new Set(this.#initialSnapshot.keys());
			if (currentIds.size !== initialIds.size) {
				return true;
			}
			for (const id of initialIds) {
				if (!currentIds.has(id)) {
					return true;
				}
			}
			for (const currentItem of currentCheckLists) {
				const initialItem = this.#initialSnapshot.get(currentItem.id);
				if (!initialItem) {
					return true;
				}
				if (this.#hasItemChanged(currentItem, initialItem)) {
					return true;
				}
			}
			return false;
		}
		getLastUpdatedCheckListId(getRootParentByChildId) {
			if (!this.hasChanges()) {
				return 0;
			}
			const changedItemId = this.#findFirstChangedItemId();
			if (!changedItemId) {
				return 0;
			}
			const rootParent = getRootParentByChildId(changedItemId);
			return rootParent ? rootParent.id : 0;
		}
		reset() {
			this.createSnapshot();
		}
		isInitialized() {
			return this.#isInitialized;
		}
		#hasItemChanged(currentItem, initialItem) {
			if (currentItem.title !== initialItem.title || currentItem.parentId !== initialItem.parentId || currentItem.sortIndex !== initialItem.sortIndex || currentItem.isImportant !== initialItem.isImportant || currentItem.isComplete !== initialItem.isComplete) {
				return true;
			}
			if (this.#arraysChanged(currentItem.accomplices || [], initialItem.accomplices)) {
				return true;
			}
			if (this.#arraysChanged(currentItem.auditors || [], initialItem.auditors)) {
				return true;
			}
			if (this.#arraysChanged(currentItem.attachments || [], initialItem.attachments)) {
				return true;
			}
			const currentChildren = this.#getCheckLists().filter(child => child.parentId === currentItem.id).map(child => child.id);
			return this.#arraysChanged(currentChildren, initialItem.childrenIds);
		}

		// eslint-disable-next-line sonarjs/cognitive-complexity
		#arraysChanged(current, initial) {
			if (current.length !== initial.length) {
				return true;
			}
			if (current.length > 0 && main_core.Type.isObjectLike(current[0]) && !main_core.Type.isUndefined(current[0].id)) {
				const currentIds = new Set(current.map(item => item.id));
				const initialIds = new Set(initial.map(item => item.id));
				if (currentIds.size !== initialIds.size) {
					return true;
				}
				for (const id of currentIds) {
					if (!initialIds.has(id)) {
						return true;
					}
				}
			} else {
				for (const [i, element] of current.entries()) {
					if (element !== initial[i]) {
						return true;
					}
				}
			}
			return false;
		}
		#findFirstChangedItemId() {
			const currentCheckLists = this.#getCheckLists();
			for (const currentItem of currentCheckLists) {
				const initialItem = this.#initialSnapshot.get(currentItem.id);
				if (!initialItem || this.#hasItemChanged(currentItem, initialItem)) {
					return currentItem.id;
				}
			}
			return null;
		}
		#getCheckLists() {
			return this.#params?.computed?.checkLists() ?? [];
		}
	}

	// @vue/component
	const CheckList = {
		name: 'TaskCheckList',
		components: {
			CheckListWidget,
			CheckListItemPanel,
			CheckListStub,
			UiButton: ui_vue3_components_button.Button,
			BIcon: ui_iconSet_api_vue.BIcon,
			BMenu: ui_vue3_components_menu.BMenu
		},
		provide() {
			return {
				setItemsRef: this.setItemsRef,
				getItemsRef: this.getItemsRef
			};
		},
		inject: {
			task: {},
			taskId: {},
			isEdit: {}
		},
		props: {
			isAutonomous: {
				type: Boolean,
				default: false
			},
			isPreview: {
				type: Boolean,
				default: false
			},
			isComponentShown: {
				type: Boolean,
				default: true
			},
			checkListId: {
				type: [Number, String],
				default: 0
			},
			isShown: {
				type: Boolean,
				default: false
			},
			sheetBindProps: {
				type: Object,
				default: null
			}
		},
		emits: ['show', 'close', 'resize', 'open'],
		setup() {
			return {
				shownPopups: new Set(),
				resizeObserver: null,
				notifiers: new Map(),
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				ButtonIcon: ui_vue3_components_button.ButtonIcon,
				Outline: ui_iconSet_api_vue.Outline,
				checkListMeta
			};
		},
		data() {
			return {
				itemPanelIsShown: false,
				itemId: null,
				itemPanelStyles: {
					top: '0',
					display: 'flex'
				},
				isItemPanelFreeze: false,
				itemsRefs: {},
				isForwardMenuShown: false,
				forwardMenuSectionCode: 'createSection',
				forwardBindElement: null,
				isFreeze: false,
				closing: false
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				currentUserId: `${tasks_v2_const.Model.Interface}/currentUserId`,
				deletingCheckListIds: `${tasks_v2_const.Model.Interface}/deletingCheckListIds`,
				checkListCompletionCallback: `${tasks_v2_const.Model.Interface}/checkListCompletionCallback`,
				draggedCheckListId: `${tasks_v2_const.Model.Interface}/draggedCheckListId`
			}),
			componentName() {
				return {
					[Context.Sheet]: CheckListSheet,
					[Context.Popup]: CheckListPopup,
					[Context.Preview]: CheckListList
				}[this.context];
			},
			context() {
				return {
					[true]: Context.Sheet,
					[this.isAutonomous]: Context.Popup,
					[this.isPreview]: Context.Preview
				}.true;
			},
			contextClass() {
				return `--${this.context}`;
			},
			componentShown() {
				if (this.isPreview) {
					return this.isComponentShown;
				}
				return true;
			},
			checkLists() {
				if (!this.task) {
					return [];
				}
				return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getByIds`](this.task.checklist);
			},
			parentCheckLists() {
				return this.checkLists.filter(checkList => checkList.parentId === 0);
			},
			hasFewParentCheckLists() {
				return this.parentCheckLists.length > 1;
			},
			currentItem() {
				return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getById`](this.itemId);
			},
			itemGroupModeSelected() {
				if (!this.currentItem) {
					return false;
				}
				return this.currentItem.groupMode?.selected === true;
			},
			forwardMenuOptions() {
				return {
					id: `check-list-item-forward-menu-${this.currentItem.id}`,
					bindElement: this.forwardBindElement,
					maxWidth: 400,
					maxHeight: 300,
					offsetLeft: -110,
					sections: [{
						code: this.forwardMenuSectionCode
					}],
					items: this.forwardMenuItems,
					targetContainer: document.body
				};
			},
			forwardMenuItems() {
				const checklistItems = this.parentCheckLists.filter(checkList => checkList.id !== this.currentItem.parentId).map(checkList => ({
					title: checkList.title,
					dataset: {
						id: `ForwardMenuCheckList-${checkList.id}`
					},
					onClick: () => {
						this.hideItemPanel();
						if (this.itemGroupModeSelected) {
							void this.forwardGroupItemsToChecklist(this.currentItem.id, checkList.id);
						} else {
							this.forwardToChecklist(this.currentItem.id, checkList.id);
						}
					}
				}));
				return [...checklistItems, {
					sectionCode: this.forwardMenuSectionCode,
					title: this.loc('TASKS_V2_CHECK_LIST_ITEM_FORWARD_MENU_CREATE'),
					dataset: {
						id: `ForwardMenuCreateNew-${this.currentItem.id}`
					},
					onClick: this.forwardToNewChecklist.bind(this, this.currentItem.id)
				}];
			},
			stub() {
				return this.checkLists.length === 0 || this.emptyList === true;
			},
			emptyList() {
				const siblings = this.parentCheckLists.filter(item => !this.deletingCheckListIds[item.id]);
				return siblings.length === 0;
			},
			parentItemDragged() {
				return this.checkListManager.isParentItem(this.draggedCheckListId);
			},
			canCheckListAdd() {
				if (!this.isEdit) {
					return true;
				}
				return this.task.rights.checklistAdd;
			}
		},
		watch: {
			async titleFieldOffsetHeight() {
				if (!this.$refs.popupComponent) {
					return;
				}
				await this.$nextTick();
				this.resize();
			},
			componentShown(value) {
				if (!this.isPreview) {
					return;
				}
				this.executeCheckListCompletionCallbacks();
				void this.$nextTick(() => {
					if (value) {
						this.subscribeToEvents();
						if (this.checkListId && this.checkListManager.getItem(this.checkListId) && this.$refs.list) {
							this.scrollToCheckList(this.checkListId);
						}
					} else {
						this.unsubscribeFromEvents();
					}
				});
			},
			checkLists: {
				handler() {
					if (this.checkListChangeTracker && !this.checkListChangeTracker.isInitialized()) {
						void this.$nextTick(() => {
							this.checkListChangeTracker.createSnapshot();
						});
					}
				},
				immediate: true
			}
		},
		created() {
			this.checkListManager = new CheckListManager({
				computed: {
					checkLists: () => this.checkLists
				}
			});
			this.checkListChangeTracker = new CheckListChangeTracker({
				computed: {
					checkLists: () => this.checkLists.filter(item => {
						return !this.deletingCheckListIds[item.id];
					})
				}
			});
			this.shownPopups = new Set();
			this.checkListParticipantService = new CheckListParticipantService(this.taskId);
		},
		mounted() {
			if (this.isAutonomous || this.isPreview) {
				this.subscribeToEvents();
			}
		},
		async beforeUnmount() {
			if (this.isAutonomous || this.isPreview) {
				this.unsubscribeFromEvents();
			}
			if (this.isPreview) {
				this.executeCheckListCompletionCallbacks();
				if (this.isEdit) {
					await tasks_v2_provider_service_checkListService.checkListService.forceSavePending(this.taskId);
				}
			}
		},
		methods: {
			...ui_vue3_vuex.mapActions(tasks_v2_const.Model.Interface, ['addCheckListItemToDeleting', 'removeCheckListItemFromDeleting', 'executeCheckListCompletionCallbacks']),
			subscribeToEvents() {
				main_core.Event.bind(this.$refs.list, 'scroll', this.handleScroll);
				main_core_events.EventEmitter.subscribe('BX.Main.Popup:onShow', this.handleShowPopup);
				main_core_events.EventEmitter.subscribe('BX.Main.Popup:onClose', this.handleClosePopup);
				main_core_events.EventEmitter.subscribe('BX.Main.Popup:onDestroy', this.handleClosePopup);
			},
			unsubscribeFromEvents() {
				main_core.Event.unbind(this.$refs.list, 'scroll', this.handleScroll);
				main_core_events.EventEmitter.unsubscribe('BX.Main.Popup:onShow', this.handleShowPopup);
				main_core_events.EventEmitter.unsubscribe('BX.Main.Popup:onClose', this.handleClosePopup);
				main_core_events.EventEmitter.unsubscribe('BX.Main.Popup:onDestroy', this.handleClosePopup);
			},
			scrollToCheckList(checkListId) {
				this.checkListManager.scrollToCheckList(this.$refs.list, checkListId);
			},
			handleUpdate(itemId) {
				this.itemId = itemId;
				this.handleUpdatingFreezeState();
			},
			handleUpdatingFreezeState() {
				if (!this.isFreeze && (this.hasEmptyItem() || this.getItemIdWithUploadingFiles())) {
					this.freeze();
				}
				if (this.isFreeze) {
					this.unfreeze();
				}
			},
			handleRemove(itemId) {
				this.itemId = itemId;
				this.freeze();
				this.addItemToDelete(itemId);
				this.checkListManager.hideItems([itemId], updates => this.upsertCheckLists(updates));
				const messageKey = this.currentItem.parentId === 0 ? 'TASKS_V2_CHECK_LIST_ITEM_REMOVE_BALLOON_PARENT' : 'TASKS_V2_CHECK_LIST_ITEM_REMOVE_BALLOON_CHILD';
				const notifier = new CheckListNotifier({
					content: this.loc(messageKey)
				});
				notifier.subscribeOnce('complete', baseEvent => {
					const timerHasEnded = baseEvent.getData();
					if (timerHasEnded) {
						this.removeItem(itemId);
					} else {
						this.checkListManager.showItems([itemId], updates => this.upsertCheckLists(updates));
					}
					this.removeItemFromDelete(itemId);
					this.unfreeze();
					this.notifiers.delete(itemId);
				});
				this.notifiers.set(itemId, notifier);
				notifier.showBalloonWithTimer();
				if (this.isCurrentItemEmpty()) {
					notifier.stopTimer();
				}
			},
			handleScroll() {
				this.isForwardMenuShown = false;
				this.updatePanelPosition();
			},
			handleShow(data) {
				this.$emit('show', data);
			},
			async handleClose() {
				if (this.closing) {
					return;
				}
				this.closing = true;
				this.cleanNotifiers();
				this.cancelGroupMode();
				this.cleanCollapsedState();
				this.executeCheckListCompletionCallbacks();
				if (this.hasEmptyItem()) {
					const firstEmptyItem = this.checkListManager.getFirstEmptyItem();
					this.focusToItem(firstEmptyItem.id, true);
					this.closing = false;
					return;
				}
				const itemIdWithUploadingFiles = this.getItemIdWithUploadingFiles();
				if (itemIdWithUploadingFiles) {
					this.focusToItem(itemIdWithUploadingFiles, true);
					this.closing = false;
					return;
				}
				this.cleanEmptyItems();
				const lastUpdatedId = this.checkListChangeTracker.hasChanges() ? this.checkListChangeTracker.getLastUpdatedCheckListId(id => this.checkListManager.getRootParentByChildId(id)) : 0;
				const checkListId = lastUpdatedId === 0 ? this.checkListId : lastUpdatedId;
				this.$emit('close', this.deletingCheckListIds[checkListId] ? 0 : checkListId);
				await this.saveCheckList();
				this.closing = false;
			},
			handleIsShown(isShown) {
				if (isShown) {
					this.subscribeToEvents();
				} else {
					this.unsubscribeFromEvents();
				}
			},
			handleShowPopup(baseEvent) {
				const [popup] = baseEvent.getCompatData();
				const isHintPopup = popup.getId().startsWith('bx-vue-hint-');
				if (isHintPopup) {
					return;
				}
				this.shownPopups.add(popup);
				this.freeze();
			},
			handleClosePopup(baseEvent) {
				const [popup] = baseEvent.getCompatData();
				const isHintPopup = popup.getId().startsWith('bx-vue-hint-');
				if (isHintPopup) {
					return;
				}
				this.shownPopups.delete(popup);
				this.unfreeze();
			},
			async handleGroupRemove(itemId) {
				this.itemId = itemId;
				this.freeze();
				this.addItemToDelete(itemId);
				this.hideItemPanel(itemId);
				const allSelectedItems = this.checkListManager.getAllSelectedItems();
				const nearestItem = this.checkListManager.findNearestItem(this.currentItem, false);
				if (nearestItem) {
					await this.updateCheckList(nearestItem.id, {
						groupMode: {
							active: true,
							selected: true
						}
					});
					setTimeout(() => {
						this.showItemPanel(nearestItem.id);
					}, 0);
				}
				const allSelectedItemIds = allSelectedItems.map(item => item.id);
				this.checkListManager.hideItems(allSelectedItemIds, updates => this.upsertCheckLists(updates));
				const messageKey = allSelectedItems.length > 1 ? 'TASKS_V2_CHECK_LIST_ITEM_REMOVE_BALLOON_CHILDREN' : 'TASKS_V2_CHECK_LIST_ITEM_REMOVE_BALLOON_CHILD';
				const notifier = new CheckListNotifier({
					content: this.loc(messageKey)
				});
				notifier.subscribeOnce('complete', baseEvent => {
					const timerHasEnded = baseEvent.getData();
					const idsToShow = [];
					allSelectedItems.forEach(item => {
						if (timerHasEnded) {
							this.removeItem(item.id);
						} else {
							idsToShow.push(item.id);
						}
						this.removeItemFromDelete(item.id);
					});
					this.checkListManager.showItems(idsToShow, updates => this.upsertCheckLists(updates));
					if (timerHasEnded) {
						if (nearestItem && !this.deletingCheckListIds[nearestItem.id]) {
							this.showItemPanel(nearestItem.id);
						} else {
							this.cancelGroupMode();
						}
					} else {
						this.showItemPanel(this.currentItem.id);
					}
					this.unfreeze();
					this.notifiers.delete(itemId);
				});
				this.notifiers.set(itemId, notifier);
				notifier.showBalloonWithTimer();
			},
			handleFocus(itemId) {
				this.isItemPanelFreeze = false;
				this.showItemPanel(itemId);
			},
			handleBlur(itemId) {
				this.itemId = itemId;
				if (this.isCurrentItemEmpty() && this.hasItemFiles(this.currentItem)) {
					return;
				}
				if (this.isItemPanelFreeze === false) {
					this.hideItemPanel(itemId);
				}
			},
			handleEmptyBlur(itemId) {
				this.itemId = itemId;
				if (this.currentItem.parentId === 0) {
					this.setDefaultCheckListTitle(itemId);
					return;
				}
				if (this.hasItemFiles(this.currentItem)) {
					return;
				}
				if (this.isItemPanelFreeze === false) {
					this.removeItem(itemId);
				}
			},
			handleGroupMode(itemId) {
				this.itemId = itemId;
				this.cancelGroupMode();
				const firstChild = this.checkListManager.getFirstVisibleChild(itemId);
				if (!firstChild) {
					return;
				}
				this.activateGroupMode(itemId);
				this.showItemPanel(firstChild.id);
			},
			handleGroupModeSelect(itemId) {
				this.itemId = itemId;
				if (this.itemGroupModeSelected) {
					this.showItemPanel(itemId);
				} else {
					this.showItemPanelOnNearestSelectedItem(itemId);
				}
			},
			handlePanelAction({
				action,
				node
			}) {
				const actionHandlers = {
					[PanelAction.SetImportant]: n => this.setImportant(n),
					[PanelAction.AttachFile]: n => this.attachFile(n),
					[PanelAction.MoveRight]: n => this.moveGroupToRight(n),
					[PanelAction.MoveLeft]: n => this.moveGroupToLeft(n),
					[PanelAction.AssignAccomplice]: n => {
						if (!this.isItemPanelFreeze) {
							this.showParticipantDialog(n, 'accomplices');
						}
					},
					[PanelAction.AssignAuditor]: n => {
						if (!this.isItemPanelFreeze) {
							this.showParticipantDialog(n, 'auditors');
						}
					},
					[PanelAction.Forward]: n => this.forward(n),
					[PanelAction.Delete]: n => this.delete(n),
					[PanelAction.Cancel]: n => this.cancelGroupMode(n)
				};
				actionHandlers[action]?.(node);
			},
			handleOpenCheckList(checkListId) {
				this.cleanNotifiers();
				this.cleanCollapsedState();
				this.$emit('open', checkListId);
			},
			updateCheckList(id, fields) {
				return this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
					id,
					fields
				});
			},
			async updateTask(fields) {
				return tasks_v2_provider_service_taskService.taskService.updateStoreTask(this.taskId, fields);
			},
			upsertCheckLists(items) {
				return this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, items);
			},
			insertCheckList(item) {
				return this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/insert`, item);
			},
			insertManyCheckLists(items) {
				return this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/insertMany`, items);
			},
			deleteCheckList(id) {
				return this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/delete`, id);
			},
			async saveCheckList() {
				if (!this.isDemoCheckListModified()) {
					this.removeChecklists();
				}
				if (this.checkListChangeTracker.hasChanges() && this.isEdit) {
					const deletingIds = new Set(Object.values(this.deletingCheckListIds));
					const fullListDeletingIds = this.checkListManager.expandIdsWithChildren(deletingIds);
					const checkListsToSave = this.checkLists.filter(checkList => {
						return !fullListDeletingIds.has(checkList.id);
					});
					await tasks_v2_provider_service_checkListService.checkListService.save(this.taskId, checkListsToSave);
				}
				this.checkListChangeTracker.reset();
			},
			isDemoCheckListModified() {
				if (this.getCheckListsNumber() > 1) {
					return true;
				}
				const [checkList] = this.checkLists;
				if (!checkList) {
					return true;
				}
				const demoTitle = this.loc('TASKS_V2_CHECK_LIST_TITLE_NUMBER', {
					'#number#': 1
				});
				return checkList.title !== demoTitle || this.checkListManager.getChildren(checkList.id).length > 0 || this.hasItemUsers(checkList) || this.hasItemFiles(checkList);
			},
			removeChecklists() {
				this.checkLists.filter(checklist => checklist.parentId === 0).forEach(item => {
					this.removeItem(item.id);
				});
			},
			async addCheckList(empty = false) {
				const parentId = main_core.Text.getRandom();
				const childId = main_core.Text.getRandom();
				const checklist = [...this.task.checklist, parentId];
				const items = [this.getDataForNewCheckList(parentId)];
				if (!empty) {
					items.push({
						id: childId,
						nodeId: childId,
						parentId,
						parentNodeId: parentId,
						sortIndex: 0
					});
					checklist.push(childId);
				}
				await this.insertManyCheckLists(items);
				void this.updateTask({
					checklist
				});
				return parentId;
			},
			async addFastCheckList() {
				const checkListId = await this.addCheckList();
				this.handleOpenCheckList(checkListId);
			},
			showForwardMenu(node) {
				this.forwardBindElement = node;
				this.isForwardMenuShown = true;
			},
			getCheckListsNumber() {
				return this.checkLists.filter(checklist => {
					return checklist.parentId === 0 && !this.deletingCheckListIds[checklist.id];
				}).length;
			},
			getDataForNewCheckList(parentId) {
				return {
					id: parentId,
					nodeId: parentId,
					parentId: 0,
					title: this.loc('TASKS_V2_CHECK_LIST_TITLE_NUMBER', {
						'#number#': this.getCountForNewCheckList()
					}),
					sortIndex: this.getSortForNewCheckList()
				};
			},
			getSortForNewCheckList() {
				return this.getCheckListsNumber();
			},
			getCountForNewCheckList() {
				return this.getCheckListsNumber() + 1;
			},
			setItemsRef(id, ref) {
				this.itemsRefs[id] = ref;
			},
			getItemsRef(id) {
				return this.itemsRefs[id];
			},
			focusToItem(itemId, highlight = false) {
				void this.$nextTick(() => {
					const itemRef = this.getItemsRef(itemId);
					itemRef?.$refs.growingTextArea?.focusTextarea();
					if (highlight) {
						void tasks_v2_lib_highlighter.highlighter.highlight(itemRef?.$refs.item);
					}
				});
			},
			addItem({
				id,
				sort
			}) {
				if (this.hasActiveGroupMode()) {
					return;
				}
				this.itemId = id;
				const childId = main_core.Text.getRandom();
				const parentId = this.currentItem.parentId;
				this.resortItemsAfterIndex(parentId, sort);
				this.insertItem(parentId, childId, sort);
			},
			addItemFromBtn(checkListId) {
				if (this.hasActiveGroupMode()) {
					return;
				}
				if (this.isPreview) {
					this.handleOpenCheckList(checkListId);
				}
				const childId = main_core.Text.getRandom();
				const sortIndex = this.checkListManager.getChildren(checkListId).length;
				this.insertItem(checkListId, childId, sortIndex);
			},
			insertItem(parentId, childId, sortIndex) {
				const parentItem = parentId ? this.checkListManager.getItem(parentId) : null;
				void this.insertCheckList({
					id: childId,
					nodeId: childId,
					parentId,
					parentNodeId: parentItem ? parentItem.nodeId : null,
					sortIndex
				});
				void this.updateTask({
					checklist: [...this.task.checklist, childId]
				});
			},
			removeItem(id, isRootCall = true) {
				if (!this.task) {
					return;
				}
				const item = this.checkListManager.getItem(id);
				if (!item) {
					return;
				}
				const children = this.checkListManager.getChildren(item.id);
				if (children.length > 0) {
					children.forEach(child => {
						this.removeItem(child.id, false);
					});
				}
				const checkListIds = this.task.checklist.filter(itemId => itemId !== item.id);
				void this.updateTask({
					containsChecklist: checkListIds.length > 0,
					checklist: checkListIds
				});
				void this.deleteCheckList(item.id);
				if (isRootCall) {
					this.resortItemsOnLevel(item.parentId);
				}
				tasks_v2_provider_service_fileService.fileService.delete(item.id, tasks_v2_provider_service_fileService.EntityTypes.CheckListItem);
			},
			addItemToDelete(itemId) {
				this.addCheckListItemToDeleting(itemId);
			},
			removeItemFromDelete(itemId) {
				this.removeCheckListItemFromDeleting(itemId);
				if (this.isPreview && this.isEdit && main_core.Type.isNumber(itemId)) {
					void tasks_v2_provider_service_checkListService.checkListService.delete(this.taskId, itemId);
				}
			},
			resortItemsAfterIndex(parentId, sortIndex) {
				this.checkListManager.resortItemsAfterIndex(parentId, sortIndex, updates => {
					if (updates.length > 0) {
						void this.upsertCheckLists(updates);
					}
				});
			},
			resortItemsOnLevel(parentId) {
				this.checkListManager.resortItemsOnLevel(parentId, updates => this.upsertCheckLists(updates));
			},
			showItemPanel(itemId) {
				if (this.isPreview) {
					return;
				}
				this.itemId = itemId;
				this.itemPanelIsShown = true;
				void this.updateCheckList(itemId, {
					panelIsShown: true
				});
				void this.$nextTick(() => this.updatePanelPosition());
			},
			hideItemPanel(itemId) {
				if (this.isPreview) {
					return;
				}
				this.itemPanelIsShown = false;
				if (this.hasActiveGroupMode() && this.checkListManager.getAllSelectedItems().length === 0) {
					this.deactivateGroupMode();
				}
				const item = this.checkListManager.getItem(itemId);
				if (item) {
					void this.updateCheckList(itemId, {
						panelIsShown: false
					});
				}
				this.isItemPanelFreeze = false;
			},
			showItemPanelOnNearestSelectedItem(itemId) {
				// eslint-disable-next-line no-lonely-if
				const nearestSelectedItem = this.checkListManager.findNearestItem(this.currentItem, true);
				if (nearestSelectedItem) {
					this.showItemPanel(nearestSelectedItem.id);
				} else {
					this.hideItemPanel(itemId);
				}
			},
			updatePanelPosition() {
				if (this.itemPanelIsShown === false || !this.currentItem) {
					return;
				}
				const list = this.$refs.list;
				const panel = this.$refs.panel?.$el;
				if (!list || !panel) {
					return;
				}
				const itemRef = list.querySelector([`[data-id="${this.currentItem.id}"]`]);
				if (!itemRef) {
					return;
				}
				const panelRect = main_core.Dom.getPosition(panel);
				const listRect = main_core.Dom.getPosition(list);
				const itemRect = main_core.Dom.getRelativePosition(itemRef, list);
				const isParentItem = this.currentItem.parentId === 0;
				const paddingOffset = 18;
				const listScrollTop = list.scrollTop;
				const listVisibleBottom = listScrollTop + list.clientHeight;
				const panelWidth = panelRect.width === 0 ? 304 : panelRect.width;
				const panelHeight = panelRect.height === 0 ? 40 : panelRect.height;
				const top = itemRect.top - 28;
				const topLimitValue = isParentItem ? -30 : 40;
				const panelTopLimit = listVisibleBottom - panelHeight;
				const panelVisible = top > topLimitValue && top < panelTopLimit;
				const topPopupLimitValue = isParentItem ? 0 : 70;
				const popupVisible = top > topPopupLimitValue && top < listVisibleBottom;
				if (!popupVisible) {
					// Clear the set before closing: popup.close() emits onClose synchronously,
					// which can re-enter updatePanelPosition (e.g. via participant dialog handleClose)
					// and otherwise iterate the same popup again, causing infinite recursion.
					const popupsToClose = [...this.shownPopups];
					this.shownPopups.clear();
					popupsToClose.forEach(popup => {
						popup.close();
					});
				}
				const display = panelVisible ? 'flex' : 'none';
				if (isParentItem) {
					const left = listRect.width - panelWidth - paddingOffset * 2 - 80;
					this.itemPanelStyles = {
						top: `${top}px`,
						left: `${left}px`,
						display
					};
				} else {
					const left = listRect.width - panelWidth - paddingOffset;
					this.itemPanelStyles = {
						top: `${top}px`,
						left: `${left}px`,
						display
					};
				}
			},
			setImportant() {
				if (this.itemGroupModeSelected) {
					const updates = this.checkListManager.getAllSelectedItems().map(item => ({
						...item,
						isImportant: !item.isImportant
					}));
					void this.upsertCheckLists(updates);
				} else {
					void this.updateCheckList(this.currentItem.id, {
						isImportant: !this.currentItem.isImportant
					});
				}
			},
			attachFile(node) {
				this.fileServiceInstances ??= new Map();
				const fileServiceInstance = this.getCurrentFileService();
				this.fileServiceInstances.set(this.currentItem.id, fileServiceInstance);
				const handleFreeze = freeze => {
					if (freeze) {
						this.freeze();
					} else {
						this.unfreeze();
					}
				};
				handleFreeze(true);
				fileServiceInstance.browse({
					bindElement: node,
					onShowCallback: () => {
						this.isItemPanelFreeze = true;
					},
					onHideCallback: () => {
						this.isItemPanelFreeze = false;
					}
				});
				fileServiceInstance.subscribe('onFileAdd', () => {
					handleFreeze(true);
				});
				fileServiceInstance.subscribe('onFileComplete', () => {
					this.isItemPanelFreeze = fileServiceInstance.isUploading();
					handleFreeze(this.isItemPanelFreeze || this.hasEmptyItem());
					this.focusToItem(this.currentItem.id);
				});
			},
			getCurrentFileService() {
				if (!this.currentItem) {
					return null;
				}
				return tasks_v2_provider_service_fileService.fileService.get(this.currentItem.id, tasks_v2_provider_service_fileService.EntityTypes.CheckListItem, {
					parentEntityId: this.taskId
				});
			},
			hasItemFiles(item) {
				if (!item) {
					return false;
				}
				const fileServiceInstance = this.getCurrentFileService();
				const files = item.attachments;
				return files.length > 0 || fileServiceInstance?.isUploading() || fileServiceInstance?.hasUploadingError();
			},
			hasItemUsers(item) {
				return item.accomplices.length > 0 || item.auditors.length > 0;
			},
			getItemIdWithUploadingFiles() {
				if (!this.fileServiceInstances) {
					return null;
				}
				return [...this.fileServiceInstances.values()].find(fileServiceInstance => fileServiceInstance.isUploading())?.getEntityId();
			},
			isCurrentItemEmpty() {
				if (!this.currentItem) {
					return true;
				}
				return this.currentItem.title === '';
			},
			moveGroupToRight() {
				if (this.itemGroupModeSelected) {
					this.checkListManager.getAllSelectedItems().sort((a, b) => a.sortIndex - b.sortIndex).forEach(item => {
						this.moveRight(item);
					});
				} else {
					this.moveRight(this.currentItem);
				}
			},
			moveRight(item) {
				this.checkListManager.moveRight(item, updates => {
					void this.upsertCheckLists(updates);
					if (!item.groupMode?.active) {
						this.focusToItem(item.id);
					}
				});
			},
			moveGroupToLeft() {
				if (this.itemGroupModeSelected) {
					this.checkListManager.getAllSelectedItems().sort((a, b) => b.sortIndex - a.sortIndex).forEach(item => {
						this.moveLeft(item);
					});
				} else {
					this.moveLeft(this.currentItem);
				}
			},
			moveLeft(item) {
				this.checkListManager.moveLeft(item, updates => {
					void this.upsertCheckLists(updates);
					if (!item.groupMode?.active) {
						this.focusToItem(item.id);
					}
				});
			},
			async forward(node) {
				if (this.hasFewParentCheckLists) {
					this.showForwardMenu(node);
				} else {
					this.hideItemPanel();
					void this.forwardToNewChecklist(this.currentItem.id);
				}
			},
			async forwardToNewChecklist(itemId) {
				const newParentId = await this.addCheckList(true);
				if (this.itemGroupModeSelected) {
					void this.forwardGroupItemsToChecklist(itemId, newParentId);
				} else {
					this.forwardToChecklist(itemId, newParentId);
				}
			},
			forwardToChecklist(itemId, checkListId) {
				const finalSortIndex = this.checkListManager.getChildren(checkListId).length;
				const movingItem = this.checkListManager.getItem(itemId);
				void this.updateCheckList(movingItem.id, {
					parentId: checkListId,
					sortIndex: finalSortIndex
				});
				this.resortItemsOnLevel(checkListId);
				this.resortItemsOnLevel(movingItem.parentId);
				this.handleTargetParentFilter(movingItem);
			},
			async forwardGroupItemsToChecklist(itemId, checkListId) {
				const finalSortIndex = this.checkListManager.getChildren(checkListId).length;
				const movingItem = this.checkListManager.getItem(itemId);
				const checkListIdsFromWhichWereForwarded = new Set();
				const allSelectedItems = this.checkListManager.getAllSelectedItems();
				const nearestItem = this.checkListManager.findNearestItem(movingItem, false, allSelectedItems);
				if (nearestItem) {
					this.showItemPanel(nearestItem.id);
				} else {
					this.cancelGroupMode();
				}
				const allSelectedWithChildren = this.checkListManager.getAllSelectedItemsWithChildren();
				const selectedItemsIds = new Set(allSelectedItems.map(item => item.id));
				const updates = [];
				allSelectedItems.forEach(item => {
					const shouldUpdateParentId = !selectedItemsIds.has(item.parentId);
					checkListIdsFromWhichWereForwarded.add(item.parentId);
					updates.push({
						...item,
						parentId: shouldUpdateParentId ? checkListId : item.parentId,
						groupMode: {
							active: false,
							selected: false
						},
						sortIndex: shouldUpdateParentId ? finalSortIndex : item.sortIndex
					});
				});
				allSelectedWithChildren.forEach(item => {
					if (!selectedItemsIds.has(item.id)) {
						updates.push({
							...item,
							groupMode: {
								active: false,
								selected: false
							}
						});
					}
				});
				await this.upsertCheckLists(updates);
				if (nearestItem) {
					void this.updateCheckList(nearestItem.id, {
						groupMode: {
							active: true,
							selected: true
						}
					});
				}
				this.resortItemsOnLevel(checkListId);
				checkListIdsFromWhichWereForwarded.forEach(id => {
					this.resortItemsOnLevel(id);
				});
				allSelectedWithChildren.forEach(item => {
					this.handleTargetParentFilter(item);
				});
			},
			handleTargetParentFilter(movedItem) {
				this.checkListManager.handleTargetParentFilter(movedItem, this.currentUserId, updates => {
					setTimeout(() => {
						void this.upsertCheckLists(updates);
					}, 1000);
				});
			},
			delete() {
				if (this.itemGroupModeSelected) {
					void this.handleGroupRemove(this.currentItem.id);
				} else {
					this.hideItemPanel();
					this.handleRemove(this.currentItem.id);
				}
			},
			cancelGroupMode() {
				this.deactivateGroupMode();
				this.hideItemPanel();
			},
			cleanCollapsedState() {
				const updates = this.parentCheckLists.map(item => ({
					...item,
					localCollapsedState: null
				}));
				void this.upsertCheckLists(updates);
			},
			cleanEmptyItems() {
				this.checkListManager.getEmptiesItem().forEach(item => {
					this.removeItem(item.id);
				});
			},
			showParticipantDialog(targetNode, type) {
				const handleClose = () => {
					this.isItemPanelFreeze = false;
					if (!this.itemGroupModeSelected) {
						this.focusToItem(this.currentItem.id);
					}
					this.updatePanelPosition();
				};
				this.checkListParticipantService.showParticipantDialog({
					targetNode,
					type,
					items: this.itemGroupModeSelected ? this.checkListManager.getAllSelectedItems() : [this.currentItem],
					onClose: handleClose
				});
				this.isItemPanelFreeze = true;
			},
			activateGroupMode(parentItemId) {
				this.itemId = parentItemId;
				const visibleItems = this.checkListManager.getAllChildren(parentItemId).filter(item => !item.hidden);
				const updates = visibleItems.map((item, index) => ({
					...item,
					groupMode: {
						active: true,
						selected: index === 0
					}
				}));
				updates.push({
					...this.currentItem,
					groupMode: {
						active: true,
						selected: false
					}
				});
				void this.upsertCheckLists(updates);
			},
			deactivateGroupMode() {
				const updates = this.checkListManager.getAllGroupModeItems().map(item => ({
					...item,
					groupMode: {
						active: false,
						selected: false
					}
				}));
				void this.upsertCheckLists(updates);
			},
			hasActiveGroupMode() {
				return this.checkListManager.getAllGroupModeItems().length > 0;
			},
			freeze() {
				this.isFreeze = true;
				this.$refs.childComponent?.$refs?.childComponent?.freeze();
			},
			unfreeze() {
				if (this.hasEmptyItem() || this.getItemIdWithUploadingFiles()) {
					return;
				}
				this.isFreeze = false;
				this.$refs.childComponent?.$refs?.childComponent?.unfreeze();
			},
			hasEmptyItem() {
				return this.checkListManager.hasEmptyItemWithFiles(this.hasItemFiles) || this.checkListManager.hasEmptyParentItem();
			},
			setDefaultCheckListTitle(itemId) {
				void this.updateCheckList(itemId, {
					title: this.loc('TASKS_V2_CHECK_LIST_TITLE_NUMBER', {
						'#number#': this.getCheckListsNumber()
					})
				});
			},
			cleanNotifiers() {
				this.notifiers.forEach(notifier => notifier.stopTimer());
				this.notifiers.clear();
			}
		},
		template: `
		<component
			v-if="componentShown"
			ref="childComponent"
			:is="componentName"
			:isShown
			:sheetBindProps
			:isEmpty="emptyList"
			@show="handleShow"
			@close="handleClose"
			@isShown="handleIsShown"
			@addFastCheckList="addFastCheckList"
			@resize="$emit('resize')"
		>
			<template v-slot:default="{ handleShow, handleClose }">
				<div
					ref="wrapper"
					class="tasks-check-list-wrapper"
					:class="contextClass"
					data-field-container
					:data-task-field-id="checkListMeta.id"
				>
					<div
						v-if="!isPreview && !parentItemDragged"
						class="tasks-check-list-close-icon"
						:class="contextClass"
					>
						<BIcon :name="Outline.CROSS_L" @click="$emit('close')"/>
					</div>
					<div ref="list" data-list class="tasks-check-list-content" :class="contextClass">
						<CheckListWidget
							v-show="!stub"
							:context
							:checkListId
							:isPreview
							@update="handleUpdate"
							@show="handleShow"
							@addItem="addItem"
							@addItemFromBtn="addItemFromBtn"
							@removeItem="handleRemove"
							@focus="handleFocus"
							@blur="handleBlur"
							@emptyBlur="handleEmptyBlur"
							@startGroupMode="handleGroupMode"
							@toggleGroupModeSelected="handleGroupModeSelect"
							@openCheckList="handleOpenCheckList"
						/>
						<CheckListStub v-if="stub && !isPreview" @click="addCheckList"/>
					</div>
					<div v-show="!stub && !isPreview" class="tasks-check-list-footer print-ignore" :class="contextClass">
						<UiButton
							v-if="canCheckListAdd"
							:text="loc('TASKS_V2_CHECK_LIST_NEW_BTN')"
							:size="ButtonSize.MEDIUM"
							:leftIcon="ButtonIcon.ADD"
							:style="AirButtonStyle.PLAIN_NO_ACCENT"
							@click="addCheckList"
						/>
						<UiButton
							:text="loc('TASKS_V2_CHECK_LIST_SAVE_BTN')"
							:size="ButtonSize.MEDIUM"
							@click="$emit('close')"
						/>
					</div>
					<CheckListItemPanel
						v-if="itemPanelIsShown && !isPreview"
						ref="panel"
						:currentItem
						:style="itemPanelStyles"
						@action="handlePanelAction"
					/>
					<BMenu
						v-if="isForwardMenuShown"
						:options="forwardMenuOptions"
						@close="isForwardMenuShown = false"
					/>
				</div>
			</template>
		</component>
	`
	};

	// @vue/component
	const CheckListChip = {
		components: {
			Chip: ui_system_chip_vue.Chip
		},
		inject: {
			task: {},
			taskId: {},
			isEdit: {}
		},
		props: {
			isAutonomous: {
				type: Boolean,
				default: false
			}
		},
		emits: ['showCheckList'],
		setup() {
			return {
				checkListMeta
			};
		},
		computed: {
			checkLists() {
				return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getByIds`](this.task.checklist);
			},
			isUploading() {
				return this.task.checklist?.some(itemId => {
					return tasks_v2_provider_service_fileService.fileService.get(itemId, tasks_v2_provider_service_fileService.EntityTypes.CheckListItem, {
						parentEntityId: this.taskId
					}).isUploading();
				});
			},
			design() {
				return {
					[!this.isAutonomous && !this.isSelected]: ui_system_chip_vue.ChipDesign.ShadowNoAccent,
					[!this.isAutonomous && this.isSelected]: ui_system_chip_vue.ChipDesign.ShadowAccent,
					[this.isAutonomous && !this.isSelected]: ui_system_chip_vue.ChipDesign.OutlineNoAccent,
					[this.isAutonomous && this.isSelected]: ui_system_chip_vue.ChipDesign.OutlineAccent
				}.true;
			},
			isSelected() {
				if (this.isAutonomous) {
					return this.checkLists.length > 0;
				}
				return this.wasFilled || this.checkLists.length > 0;
			},
			wasFilled() {
				return this.task.filledFields[checkListMeta.id];
			},
			checkListItemCount() {
				return this.checkLists.filter(checkList => checkList.parentId !== 0).length;
			},
			text() {
				if (this.isAutonomous && this.checkListItemCount > 0) {
					const completedCount = this.getCompletedCount();
					return this.loc('TASKS_V2_CHECK_LIST_COUNT_TITLE', {
						'#count#': completedCount,
						'#total#': this.checkListItemCount
					});
				}
				return this.loc('TASKS_V2_CHECK_LIST_CHIP_TITLE');
			},
			icon() {
				if (this.isUploading && !this.wasFilled) {
					return ui_iconSet_api_vue.Animated.LOADER_WAIT;
				}
				return ui_iconSet_api_vue.Outline.CHECK_LIST;
			}
		},
		created() {
			this.checkListManager = new CheckListManager({
				computed: {
					checkLists: () => this.checkLists
				}
			});
		},
		mounted() {
			this.$bitrix.eventEmitter.subscribe(tasks_v2_const.EventName.AddCheckListFromText, this.handleAddFromText);
			this.$bitrix.eventEmitter.subscribe(tasks_v2_const.EventName.CloseCheckList, this.handleFieldClose);
		},
		beforeUnmount() {
			this.$bitrix.eventEmitter.unsubscribe(tasks_v2_const.EventName.AddCheckListFromText, this.handleAddFromText);
			this.$bitrix.eventEmitter.unsubscribe(tasks_v2_const.EventName.CloseCheckList, this.handleFieldClose);
		},
		methods: {
			handleClick() {
				if (this.isAutonomous) {
					void this.showCheckList();
				} else {
					// eslint-disable-next-line no-lonely-if
					if (this.isSelected) {
						void this.highlightField();
					} else {
						void this.showCheckList();
					}
				}
			},
			async handleAddFromText(baseEvent) {
				const checkListId = await this.buildCheckList(baseEvent.getData());
				await this.highlightField();
				this.checkListManager.scrollToCheckList(this.$root.$el, checkListId, 'smooth');
				if (this.isEdit) {
					void tasks_v2_provider_service_checkListService.checkListService.save(this.taskId, this.checkLists);
				}
			},
			handleFieldClose() {
				if (this.isAutonomous) {
					this.$el.focus();
				}
			},
			async showCheckList() {
				if (!this.isSelected) {
					await this.buildEmptyCheckList();
				}
				this.$emit('showCheckList');
			},
			async buildEmptyCheckList() {
				const parentId = main_core.Text.getRandom();
				const childId = main_core.Text.getRandom();
				await this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/insertMany`, [{
					id: parentId,
					nodeId: parentId,
					title: this.loc('TASKS_V2_CHECK_LIST_TITLE_NUMBER', {
						'#number#': 1
					})
				}, {
					id: childId,
					nodeId: childId,
					parentId
				}]);
				await tasks_v2_provider_service_taskService.taskService.updateStoreTask(this.taskId, {
					checklist: [parentId, childId]
				});
			},
			async buildCheckList(baseText) {
				if (!main_core.Type.isString(baseText) || baseText === '') {
					return '';
				}
				const titles = baseText.split(/\r\n|\r|\n/g).map(line => line.trim()).filter(line => line !== '');
				if (titles.length === 0) {
					return '';
				}
				const items = [];
				const parentId = main_core.Text.getRandom();
				const checkListsNumber = this.getCheckListsNumber();
				const taskChecklist = [...this.task.checklist, parentId];
				items.push({
					id: parentId,
					nodeId: parentId,
					parentId: 0,
					title: this.loc('TASKS_V2_CHECK_LIST_TITLE_NUMBER', {
						'#number#': checkListsNumber + 1
					}),
					sortIndex: checkListsNumber
				});
				titles.forEach((title, index) => {
					const childId = main_core.Text.getRandom();
					items.push({
						id: childId,
						nodeId: childId,
						parentId,
						title,
						sortIndex: index
					});
					taskChecklist.push(childId);
				});
				await this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/insertMany`, items);
				await tasks_v2_provider_service_taskService.taskService.updateStoreTask(this.taskId, {
					checklist: taskChecklist
				});
				return parentId;
			},
			highlightField() {
				return tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(checkListMeta.id);
			},
			getCheckListsNumber() {
				return this.checkLists.filter(checklist => checklist.parentId === 0).length;
			},
			getCompletedCount() {
				return this.checkLists.filter(checklist => {
					return checklist.isComplete && checklist.parentId !== 0;
				}).length;
			}
		},
		template: `
		<Chip
			:design
			:icon
			:text
			:data-task-id="taskId"
			:data-task-chip-id="checkListMeta.id"
			@click="handleClick"
		/>
	`
	};

	exports.CheckList = CheckList;
	exports.CheckListChip = CheckListChip;
	exports.CheckListList = CheckListList;
	exports.checkListMeta = checkListMeta;

})(this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}, BX, BX.Event, BX.Vue3.Vuex, BX.Vue3.Components, BX.UI.Vue3.Components, BX.UI.IconSet, window, BX.Tasks.V2.Const, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Lib, BX.UI.Vue3.Components, BX.Tasks.V2.Component.Elements, BX.Vue3.Directives, window, BX.Tasks.V2.Component.Elements, BX.UI.DragAndDrop, window, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Tasks.V2, BX.Tasks.V2.Lib, BX.UI.System.Skeleton.Vue, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.UI.Notification, BX.UI.System.Chip.Vue, BX.Tasks.V2.Lib);
//# sourceMappingURL=check-list.bundle.js.map
