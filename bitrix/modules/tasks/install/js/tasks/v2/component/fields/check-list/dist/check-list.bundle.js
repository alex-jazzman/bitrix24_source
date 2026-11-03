/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, main_core, main_core_events, ui_a11y, ui_vue3_vuex, ui_vue3, ui_vue3_components_button, ui_system_menu_vue, ui_iconSet_api_vue, ui_iconSet_outline, tasks_v2_const, tasks_v2_core, tasks_v2_provider_service_taskService, tasks_v2_provider_service_checkListService, tasks_v2_provider_service_fileService, tasks_v2_lib_highlighter, tasks_v2_lib_checkListBbCode, ui_vue3_components_popup, tasks_v2_component_elements_bottomSheet, tasks_v2_lib_bottomSheetAria, ui_vue3_directives_hint, ui_iconSet_animated, tasks_v2_component_elements_hint, ui_draganddrop_draggable, ui_iconSet_actions, tasks_v2_component_elements_userAvatarList, tasks_v2_component_elements_userCheckbox, tasks_v2_component_elements_progressBar, tasks_v2_component_elements_growingTextArea, tasks_v2_lib_userSelectorDialog, ui_system_skeleton_vue, tasks_v2_component_elements_userFieldWidgetComponent, tasks_v2_component_elements_checkbox, ui_forms, ui_notification, tasks_v2_lib_pluralPhrase, ui_textEditor, ui_lexical_core, ui_lexical_link, ui_lexical_selection, ui_lexical_utils, ui_system_chip_vue, tasks_v2_lib_fieldHighlighter) {
	'use strict';

	const checkListMeta = Object.freeze({
		id: tasks_v2_const.TaskField.CheckList,
		title: main_core.Loc.getMessage('TASKS_V2_CHECK_LIST_TITLE')
	});

	/**
	 * Builds picker menu items: one per checklist (minus the excluded one) plus a "create new" item.
	 */
	function buildCheckListPickerMenuItems(params) {
		const {
			checkLists,
			excludedCheckListId = null,
			existingItemIdPrefix,
			onSelectCheckList,
			createNewItem
		} = params;
		const existingItems = checkLists.filter(checkList => checkList.id !== excludedCheckListId).map(checkList => ({
			title: tasks_v2_lib_checkListBbCode.CheckListBbCode.toPlainText(checkList.title),
			dataset: {
				id: `${existingItemIdPrefix}-${checkList.id}`
			},
			onClick: () => onSelectCheckList(checkList)
		}));
		const createNewMenuItem = {
			title: createNewItem.title,
			dataset: {
				id: createNewItem.id
			},
			onClick: createNewItem.onClick
		};
		if (createNewItem.sectionCode) {
			createNewMenuItem.sectionCode = createNewItem.sectionCode;
		}
		return [...existingItems, createNewMenuItem];
	}

	/**
	 * Parent checklists (parentId === 0) the user may add items to, gated by task.rights.checklistAdd.
	 * Per-item actions.modify is a different right (rename/delete the list), so it isn't used here.
	 */
	function selectEditableParentCheckLists(checkLists, canAddItems) {
		if (!canAddItems) {
			return [];
		}
		return checkLists.filter(checkList => checkList.parentId === 0);
	}

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
		<div class="check-list-stub" data-testid="tasks-check-list-stub">
			<div class="check-list-stub-icon" aria-hidden="true"/>
			<div class="check-list-stub-title">
				{{ loc('TASKS_V2_CHECK_LIST_STUB_TITLE') }}
			</div>
			<div class="check-list-stub-btn">
				<UiButton
					:text="loc('TASKS_V2_CHECK_LIST_STUB_BTN')"
					:dataset="{ testid: 'tasks-check-list-stub-btn' }"
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
					focusTrap: true,
					ariaLabel: this.loc('TASKS_V2_CHECK_LIST_POPUP_LABEL'),
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
			setClosingByEsc(enabled) {
				this.$refs.childComponent?.getPopupInstance()?.setClosingByEsc(enabled);
			},
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
				if (value) {
					this.syncSheetModality();
				}
				this.$emit('isShown', value);
			}
		},
		methods: {
			setClosingByEsc(enabled) {
				this.$refs.bottomSheet?.$refs.popup?.getPopupInstance()?.setClosingByEsc(enabled);
			},
			handleClose() {
				this.$emit('close');
			},
			syncSheetModality() {
				tasks_v2_lib_bottomSheetAria.syncBottomSheetModality(this.$refs.bottomSheet);
			}
		},
		template: `
		<BottomSheet
			v-if="isShown"
			ref="bottomSheet"
			:sheetBindProps
			:padding="0"
			:popupPadding="0"
			:ariaLabel="loc('TASKS_V2_CHECK_LIST_SHEET_LABEL')"
			@close="handleClose"
		>
			<slot :handleShow="$emit('show')" :handleClose="handleClose"/>
		</BottomSheet>
	`
	};

	/* global Partial */

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
			const newParent = this.getIndentTarget(item);
			if (!newParent) {
				return;
			}
			const itemsOnLevel = this.getItemsOnLevel(item.parentId);
			const currentIndex = itemsOnLevel.findIndex(sibling => sibling.id === item.id);
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
			if (!this.canMoveLeft(item)) {
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
		canMoveRight(item) {
			if (!item || item.parentId === 0 || this.getItemLevel(item) >= 5) {
				return false;
			}
			const itemsOnLevel = this.getItemsOnLevel(item.parentId);
			const currentIndex = itemsOnLevel.findIndex(sibling => sibling.id === item.id);
			if (currentIndex <= 0) {
				return false;
			}
			return this.getIndentTarget(item) !== null;
		}
		getIndentTarget(item) {
			if (!item || item.parentId === 0 || this.getItemLevel(item) >= 5) {
				return null;
			}
			const itemsOnLevel = this.getItemsOnLevel(item.parentId);
			const currentIndex = itemsOnLevel.findIndex(sibling => sibling.id === item.id);
			for (let i = currentIndex - 1; i >= 0; i--) {
				const candidate = itemsOnLevel[i];
				if (!candidate.hidden && !this.isItemDescendant(candidate, item)) {
					return candidate;
				}
			}
			return null;
		}
		canMoveLeft(item) {
			if (!item || item.parentId === 0 || this.getItemLevel(item) <= 1) {
				return false;
			}
			return this.#getCheckLists().some(parent => parent.id === item.parentId);
		}
		canMoveItemUp(item) {
			return this.#getVisibleSiblingIndex(item) > 0;
		}
		canMoveItemDown(item) {
			const visibleSiblings = this.#getVisibleSiblings(item);
			const currentIndex = visibleSiblings.findIndex(sibling => sibling.id === item?.id);
			return currentIndex >= 0 && currentIndex < visibleSiblings.length - 1;
		}
		moveItemUp(item, updateFn) {
			return this.#reorderSibling(item, -1, updateFn);
		}
		moveItemDown(item, updateFn) {
			return this.#reorderSibling(item, 1, updateFn);
		}
		#reorderSibling(item, offset, updateFn) {
			const visibleSiblings = this.#getVisibleSiblings(item);
			const currentIndex = visibleSiblings.findIndex(sibling => sibling.id === item?.id);
			const targetIndex = currentIndex + offset;
			if (currentIndex < 0 || targetIndex < 0 || targetIndex >= visibleSiblings.length) {
				return null;
			}
			const target = visibleSiblings[targetIndex];
			updateFn([{
				...item,
				sortIndex: target.sortIndex
			}, {
				...target,
				sortIndex: item.sortIndex
			}]);
			return {
				position: targetIndex + 1,
				total: visibleSiblings.length
			};
		}
		#getVisibleSiblingIndex(item) {
			return this.#getVisibleSiblings(item).findIndex(sibling => sibling.id === item?.id);
		}
		#getVisibleSiblings(item) {
			if (!item) {
				return [];
			}
			return this.getItemsOnLevel(item.parentId).filter(sibling => !sibling.hidden);
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
			const checkLists = this.checkLists;
			if (checkLists.length === this.task.checklist.length && (checkLists.length > 0 || !this.containsChecklist)) {
				tasks_v2_provider_service_checkListService.checkListService.initializeFromStore(this.taskId, checkLists);
			}
			if (this.containsChecklist && !tasks_v2_provider_service_checkListService.checkListService.hasServerTree(this.taskId)) {
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
			data-testid="tasks-check-list-list"
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
						<button
							type="button"
							class="tasks-check-list-list-content-row --stub"
							data-testid="tasks-check-list-list-add-stub-btn"
							:disabled="!canCheckListAdd"
							@click="$emit('addFastCheckList')"
						>
							<div class="tasks-check-list-list-content-row-main">
								<BIcon :name="Outline.CHECK_LIST" aria-hidden="true"/>
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
									aria-hidden="true"
									ref="stubAddIcon"
								/>
							</div>
						</button>
					</div>
				</Transition>
				<div
					v-if="!loading && !isFilledEmpty"
					key="content"
					class="tasks-check-list-list-transition-content"
				>
					<slot/>
					<button
						v-if="canCheckListAdd"
						type="button"
						class="tasks-check-list-list-content-row --footer print-ignore"
						data-testid="tasks-check-list-list-add-btn"
						@click="$emit('addFastCheckList')"
					>
						<div
							class="tasks-check-list-list-content-btn"
							:class="{ '--empty': isEmpty }"
						>
							<BIcon :name="Outline.PLUS_L" aria-hidden="true"/>
							<div class="tasks-check-list-list-content-btn-text">
								{{ loc('TASKS_V2_CHECK_LIST_ADD_LABEL') }}
							</div>
						</div>
					</button>
				</div>
			</div>
		</div>
	`
	};

	const ProbeStyle = {
		all: 'initial',
		position: 'fixed',
		top: '0',
		left: '0',
		width: '0',
		height: '0'
	};
	function getFixedContainingBlockOffset(element) {
		const probe = main_core.Dom.create('div', {
			style: ProbeStyle
		});
		main_core.Dom.append(probe, element);
		const {
			left,
			top
		} = probe.getBoundingClientRect();
		main_core.Dom.remove(probe);
		return {
			x: -left,
			y: -top
		};
	}

	class CheckListDragManager extends main_core_events.EventEmitter {
		#store;
		#checkListManager;
		#stubItemId;
		#draggable = null;
		#container = null;
		#ghost = null;
		#offsetFrameId = null;
		#offsetCompensationY = 0;
		#handleScroll = () => {
			if (this.#offsetFrameId !== null) {
				return;
			}
			this.#offsetFrameId = requestAnimationFrame(() => {
				this.#offsetFrameId = null;
				this.updateGhostOffset();
			});
		};
		#handleDragStart = event => {
			const {
				type
			} = this.#draggable.getOptions();
			this.#ghost = type === ui_draganddrop_draggable.Draggable.HEADLESS ? null : event.getData().draggable;
			main_core.Event.bind(document, 'scroll', this.#handleScroll, {
				capture: true
			});
		};
		#handleDragEnd = () => {
			this.stopGhostOffsetTracking();
			this.#offsetCompensationY = 0;
		};
		constructor(params) {
			super();
			this.setEventNamespace('Tasks.V2.CheckList.CheckListDragManager');
			this.#store = params.store;
			this.#checkListManager = params.checkListManager;
			this.#stubItemId = params.stubItemId;
		}
		initGhostOffsetTracking(draggable, container) {
			this.#draggable = draggable;
			this.#container = container;
			draggable.subscribe('start', this.#handleDragStart);
			draggable.subscribe('end', this.#handleDragEnd);
		}
		stopGhostOffsetTracking() {
			main_core.Event.unbind(document, 'scroll', this.#handleScroll, {
				capture: true
			});
			if (this.#offsetFrameId !== null) {
				cancelAnimationFrame(this.#offsetFrameId);
				this.#offsetFrameId = null;
			}
			this.#ghost = null;
		}
		setGhostOffsetCompensationY(compensationY) {
			this.#offsetCompensationY = compensationY;
		}
		updateGhostOffset() {
			const {
				x,
				y
			} = getFixedContainingBlockOffset(this.#container);
			const offsetY = y + this.#offsetCompensationY;
			const {
				offset
			} = this.#draggable.getOptions();
			this.#shiftGhost(x - offset.x, offsetY - offset.y);
			offset.x = x;
			offset.y = offsetY;
		}
		#shiftGhost(x, y) {
			if (!this.#ghost || x === 0 && y === 0) {
				return;
			}
			const {
				top,
				left
			} = this.#ghost.style;
			const shiftedTop = Number.parseFloat(top) + y;
			const shiftedLeft = Number.parseFloat(left) + x;
			if (Number.isNaN(shiftedTop) || Number.isNaN(shiftedLeft)) {
				return;
			}
			main_core.Dom.style(this.#ghost, {
				top: `${shiftedTop}px`,
				left: `${shiftedLeft}px`
			});
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
		init(container, listDropzone = []) {
			this.#draggable = new ui_draganddrop_draggable.Draggable({
				container,
				draggable: '.check-list-draggable-item',
				dragElement: '.check-list-drag-item',
				delay: 0,
				type: ui_draganddrop_draggable.Draggable.MOVE,
				dropzone: listDropzone
			});
			this.#draggable.subscribe('beforeStart', this.#handleBeforeDragStart.bind(this));
			this.#draggable.subscribe('start', this.#handleDragStart.bind(this));
			this.#draggable.subscribe('over', this.#handleDragOver.bind(this));
			this.#draggable.subscribe('end', this.#handleDragEnd.bind(this));
			this.#draggable.subscribe('drop', this.#handleDropEnd.bind(this));
			this.#draggable.subscribe('dropzone:enter', this.#handleDropZoneEnter.bind(this));
			this.#draggable.subscribe('dropzone:out', this.#handleDropZoneOut.bind(this));
			this.initGhostOffsetTracking(this.#draggable, container);
		}
		destroy() {
			this.stopGhostOffsetTracking();
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
			this.updateGhostOffset();
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
		init(container) {
			this.#container = container;
			this.#draggable = new ui_draganddrop_draggable.Draggable({
				container: this.#container,
				draggable: '.check-list-draggable-list',
				dragElement: '.check-list-drag-list',
				delay: 0,
				type: ui_draganddrop_draggable.Draggable.MOVE
			});
			this.#draggable.subscribe('beforeStart', this.#handleBeforeDragStart.bind(this));
			this.#draggable.subscribe('start', this.#handleDragStart.bind(this));
			this.#draggable.subscribe('over', this.#handleDragOver.bind(this));
			this.#draggable.subscribe('end', this.#handleDragEnd.bind(this));
			this.initGhostOffsetTracking(this.#draggable, this.#container);
		}
		destroy() {
			this.stopGhostOffsetTracking();
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
			this.setGhostOffsetCompensationY(this.#getTopItemCompensation(source));
			this.updateGhostOffset();
		}
		#handleDragStart() {
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
		#getTopItemCompensation(draggedItemElement) {
			const {
				top
			} = main_core.Dom.getRelativePosition(draggedItemElement, this.#container);
			const isTopItem = top <= 0;
			return isTopItem ? -top : 0;
		}
	}

	const FORMATTING_SHORTCUT_ACTION_BY_CODE = Object.freeze({
		KeyB: tasks_v2_lib_checkListBbCode.ChecklistFormattingAction.Bold,
		KeyI: tasks_v2_lib_checkListBbCode.ChecklistFormattingAction.Italic,
		KeyU: tasks_v2_lib_checkListBbCode.ChecklistFormattingAction.Underline,
		KeyS: tasks_v2_lib_checkListBbCode.ChecklistFormattingAction.Strikethrough
	});
	function getTextarea(growingTextArea) {
		return growingTextArea?.$el?.querySelector('textarea') ?? null;
	}

	// @vue/component
	const CheckListFormattingLayer = {
		name: 'CheckListFormattingLayer',
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		components: {
			GrowingTextArea: tasks_v2_component_elements_growingTextArea.GrowingTextArea
		},
		inject: {
			checkListEditor: {
				default: null
			},
			checkListEditorItem: {
				default: null
			},
			checkListKeyboardRouter: {
				default: null
			}
		},
		props: {
			preserveShiftTab: {
				type: Boolean,
				default: false
			},
			modelValue: {
				type: String,
				default: ''
			},
			placeholder: {
				type: String,
				default: ''
			},
			fontColor: {
				type: String,
				default: 'var(--ui-color-base-0)'
			},
			linkColor: {
				type: String,
				default: 'var(--ui-color-accent-main-link)'
			},
			fontSize: {
				type: Number,
				default: 21
			},
			fontWeight: {
				type: [Number, String],
				default: 'inherit'
			},
			lineHeight: {
				type: Number,
				default: 29
			},
			maxLines: {
				type: Number,
				default: 3
			},
			readonly: {
				type: Boolean,
				default: false
			},
			keyboardInstructions: {
				type: String,
				default: ''
			}
		},
		emits: ['update:modelValue', 'input', 'focus', 'blur', 'emptyFocus', 'emptyBlur', 'enterBlur', 'escapeBlur', 'linkClick', 'click', 'selectionChange', 'indent', 'outdent', 'panelTab'],
		data() {
			return {
				isEditorActive: false,
				readonlyOverflowing: false,
				readonlyResizeObserver: null,
				keyboardInstructionsId: `tasks-check-list-item-keyboard-instructions-${main_core.Text.getRandom()}`
			};
		},
		computed: {
			editorDescribedby() {
				if (this.readonly || !main_core.Type.isStringFilled(this.keyboardInstructions)) {
					return null;
				}
				return this.keyboardInstructionsId;
			},
			editorAria() {
				return {
					label: this.placeholder,
					describedby: this.editorDescribedby
				};
			},
			hasTitle() {
				return this.modelValue.trim() !== '';
			},
			isReadonlyRender() {
				return this.readonly && this.hasTitle;
			},
			isEditableDisplay() {
				return !this.readonly && !this.isEditorActive;
			},
			safeDisplayHtml() {
				return tasks_v2_lib_checkListBbCode.CheckListBbCode.formatHtml(this.modelValue, this.linkColor);
			},
			displayStyle() {
				return {
					maxHeight: `${this.lineHeight * this.maxLines}px`,
					'--check-list-editor-max-height': `${this.lineHeight * this.maxLines}px`,
					lineHeight: `${this.lineHeight}px`,
					color: this.fontColor,
					fontSize: `${this.fontSize}px`,
					fontWeight: this.fontWeight,
					'-webkit-line-clamp': this.maxLines
				};
			},
			readonlyTooltip() {
				if (!this.readonlyOverflowing) {
					return null;
				}
				return () => ({
					html: this.safeDisplayHtml,
					interactivity: true,
					popupOptions: {
						className: 'b24-growing-text-area-popup',
						bindElement: this.$refs.readonlyDisplay,
						offsetLeft: 40,
						maxWidth: 440,
						maxHeight: 360,
						angle: {
							offset: 40
						},
						darkMode: false,
						targetContainer: this.$refs.readonlyDisplay.closest('.tasks-full-card-content') ?? document.body
					}
				});
			}
		},
		created() {
			this.activationPoint = null;
		},
		mounted() {
			requestAnimationFrame(() => {
				this.updateReadonlyOverflowing();
			});
			this.observeReadonlyOverflow();
		},
		unmounted() {
			if (this.checkListEditor?.isActive(this.checkListEditorItem?.getId())) {
				const session = this.checkListEditor.deactivate?.('layer-unmount');
				this.commitEditorSession(session);
			}
			this.unobserveReadonlyOverflow();
		},
		watch: {
			readonly(value) {
				if (!value || !this.isEditorActive) {
					return;
				}
				const session = this.checkListEditor?.deactivate?.('readonly');
				this.isEditorActive = false;
				this.commitEditorSession(session);
			},
			isReadonlyRender() {
				this.scheduleReadonlyOverflowCheck();
				void this.$nextTick(() => {
					this.observeReadonlyOverflow();
				});
			},
			modelValue() {
				if (this.isReadonlyRender) {
					this.scheduleReadonlyOverflowCheck();
				}
			},
			maxLines() {
				if (this.isReadonlyRender) {
					this.scheduleReadonlyOverflowCheck();
				}
			}
		},
		methods: {
			updateReadonlyOverflowing() {
				if (!this.isReadonlyRender) {
					this.readonlyOverflowing = false;
					return;
				}
				const display = this.$refs.readonlyDisplay;
				if (!display) {
					this.readonlyOverflowing = false;
					return;
				}
				this.readonlyOverflowing = display.scrollHeight > this.lineHeight * this.maxLines;
			},
			scheduleReadonlyOverflowCheck() {
				void this.$nextTick(() => {
					requestAnimationFrame(() => {
						this.updateReadonlyOverflowing();
					});
				});
			},
			observeReadonlyOverflow() {
				this.unobserveReadonlyOverflow();
				const display = this.$refs.readonlyDisplay;
				if (!this.isReadonlyRender || !display) {
					return;
				}
				this.readonlyResizeObserver = new ResizeObserver(() => {
					this.updateReadonlyOverflowing();
				});
				this.readonlyResizeObserver.observe(display);
			},
			unobserveReadonlyOverflow() {
				this.readonlyResizeObserver?.disconnect();
				this.readonlyResizeObserver = null;
			},
			focusTextarea() {
				if (this.readonly || !this.checkListEditor) {
					this.$refs.growingTextArea?.focusTextarea();
					return;
				}
				if (this.checkListEditor.isActive(this.checkListEditorItem?.getId())) {
					this.checkListEditor.focus();
					return;
				}
				this.activateEditor(true);
			},
			async selectAllText() {
				if (this.checkListEditor) {
					this.focusTextarea();
					await this.$nextTick();
					await this.$nextTick();
					this.checkListEditor.selectAll();
					return;
				}
				const textarea = getTextarea(this.$refs.growingTextArea);
				if (!textarea) {
					return;
				}
				this.focusTextarea();
				await this.$nextTick();
				await this.$nextTick();
				textarea.setSelectionRange(0, textarea.value.length);
			},
			getActiveFormattingActions() {
				if (!this.checkListEditor) {
					const textarea = getTextarea(this.$refs.growingTextArea);
					return textarea ? tasks_v2_lib_checkListBbCode.CheckListBbCode.getActiveFormattingActions(this.modelValue, {
						start: textarea.selectionStart,
						end: textarea.selectionEnd
					}) : [];
				}
				if (!this.isEditorActive) {
					return [];
				}
				return this.checkListEditor.getActiveFormattingActions();
			},
			getSelectedFormattingActions() {
				return this.getActiveFormattingActions();
			},
			getTextareaSelectionRange() {
				if (this.checkListEditor) {
					return this.checkListEditor.captureSelection();
				}
				const textarea = getTextarea(this.$refs.growingTextArea);
				return textarea ? {
					start: textarea.selectionStart,
					end: textarea.selectionEnd
				} : null;
			},
			setTextareaSelectionRange(selection, legacyEnd = null) {
				if (this.checkListEditor) {
					this.checkListEditor.restoreSelection(selection);
					return;
				}
				const start = typeof selection === 'object' ? selection.start : selection;
				const end = typeof selection === 'object' ? selection.end : legacyEnd;
				getTextarea(this.$refs.growingTextArea)?.setSelectionRange(start, end);
			},
			applyFormatting(action, url = '') {
				if (this.readonly) {
					return;
				}
				if (!this.checkListEditor) {
					const textarea = getTextarea(this.$refs.growingTextArea);
					if (!textarea) {
						return;
					}
					const result = action === tasks_v2_lib_checkListBbCode.ChecklistFormattingAction.Link ? tasks_v2_lib_checkListBbCode.CheckListBbCode.addUrlTag(this.modelValue, textarea, url) : tasks_v2_lib_checkListBbCode.CheckListBbCode.handleDecorationTag(this.modelValue, textarea, action);
					this.$emit('update:modelValue', result.source);
					void this.$nextTick(() => this.setTextareaSelectionRange({
						start: result.selectionStart,
						end: result.selectionEnd
					}));
					return;
				}
				if (!this.isEditorActive) {
					return;
				}
				this.checkListEditor.dispatchFormatting(action, url);
				this.emitSelectionChange();
			},
			restoreTextareaSelection(selection) {
				this.setTextareaSelectionRange(selection);
				this.emitSelectionChange();
			},
			activateEditor(focus = false, point = null) {
				if (this.readonly || !this.checkListEditor || !this.checkListEditorItem) {
					return;
				}
				this.isEditorActive = true;
				void this.$nextTick(() => {
					this.checkListEditor.activate({
						itemId: this.checkListEditorItem.getId(),
						source: this.modelValue,
						container: this.$refs.editorHost,
						aria: this.editorAria,
						layer: this,
						handlers: {
							onEnter: event => {
								this.$emit('enterBlur', event);
								event.target?.blur?.();
								return true;
							},
							onEscape: event => this.handleEditorEscape(event),
							onTab: event => this.handleEditorTab(event)
						}
					});
					if (focus) {
						this.checkListEditor.focus(point);
					}
				});
			},
			activateEditorView() {
				this.isEditorActive = true;
			},
			deactivateEditorView() {
				this.isEditorActive = false;
			},
			handleActivationPointerDown(event) {
				this.activationPoint = {
					x: event.clientX,
					y: event.clientY
				};
			},
			handleActivationFocus(event) {
				// A focus event carries no coordinates, and only the press right before it may have some:
				// a title focused by Tab or by the component keeps the caret at the end of the text.
				const point = this.activationPoint;
				this.activationPoint = null;
				this.activateEditor(true, point);
				if (!this.hasTitle) {
					this.$emit('emptyFocus');
				}
			},
			handleEditorFocus(event) {
				if (event.target !== this.$refs.editorHost && !this.$refs.editorHost?.contains(event.target)) {
					return;
				}
				this.handleFocus(event);
			},
			handleEditorBlur(event) {
				if (this.$refs.editorHost?.contains(event.relatedTarget)) {
					return;
				}
				const session = this.checkListEditor.finalizeBlur(this.checkListEditorItem.getId(), event);
				this.commitEditorSession(session, event);
			},
			commitEditorSession(session, event = null) {
				if (!session) {
					return;
				}
				const value = session.source.trim();
				if (value !== this.modelValue) {
					this.$emit('update:modelValue', value);
				}
				if (!value) {
					this.$emit('emptyBlur');
				}
				this.$emit('blur', event);
			},
			handleEditorTab(event) {
				return this.routeKeyboardEvent('routeTab', event);
			},
			handleEditorEscape(event) {
				if (event.isComposing) {
					event.stopPropagation();
					return false;
				}
				return this.routeKeyboardEvent('routeEscape', event);
			},
			handleTextareaEscapeCapture(event) {
				if (event.target !== getTextarea(this.$refs.growingTextArea)) {
					return;
				}
				if (event.isComposing) {
					event.stopPropagation();
					return;
				}
				this.routeKeyboardEvent('routeEscape', event);
			},
			routeKeyboardEvent(method, event) {
				const route = this.checkListKeyboardRouter?.[method];
				const handled = main_core.Type.isFunction(route) && route.call(this.checkListKeyboardRouter, this.checkListEditorItem?.getId(), event) === true;
				if (handled) {
					event.preventDefault();
					event.stopPropagation();
				}
				return handled;
			},
			handleLayerClick(event) {
				if (event.target && event.target.closest && event.target.closest('.tasks-check-list-formatting-layer-link')) {
					this.$emit('linkClick', event);
					return;
				}
				this.$emit('click', event);
				this.emitSelectionChange();
			},
			handleFocus(event) {
				this.$emit('focus', event);
				this.emitSelectionChange();
			},
			handleInput(value) {
				this.$emit('input', value);
				this.emitSelectionChange();
			},
			handleUpdateModelValue(value) {
				this.$emit('update:modelValue', value);
				this.emitSelectionChange();
			},
			handleKeyDown(event) {
				if (this.isEditorActive) {
					return;
				}
				if (this.handleIndentationShortcut(event)) {
					return;
				}
				const action = this.getFormattingShortcutAction(event);
				if (!action) {
					return;
				}
				event.preventDefault();
				event.stopPropagation();
				this.applyFormatting(action);
			},
			handleIndentationShortcut(event) {
				if (event.key !== 'Tab' || event.target !== getTextarea(this.$refs.growingTextArea)) {
					return false;
				}
				return this.routeKeyboardEvent('routeTab', event);
			},
			getFormattingShortcutAction(event) {
				if (event.target !== getTextarea(this.$refs.growingTextArea)) {
					return null;
				}
				const isModifierPressed = event.ctrlKey || event.metaKey;
				if (!isModifierPressed || event.altKey || event.shiftKey) {
					return null;
				}
				return FORMATTING_SHORTCUT_ACTION_BY_CODE[event.code] ?? null;
			},
			emitSelectionChange() {
				void this.$nextTick(() => {
					this.$emit('selectionChange', this.getActiveFormattingActions());
				});
			},
			getVisibleState() {
				return this.checkListEditor?.getVisibleState() ?? null;
			},
			captureVisibleRange(start, end) {
				return this.checkListEditor?.captureVisibleRange(start, end) ?? null;
			},
			removeVisibleRange(range) {
				return this.checkListEditor?.removeVisibleRange(range) ?? false;
			},
			setEditorAria(aria) {
				this.checkListEditor?.setAria(main_core.Type.isPlainObject(aria) ? {
					...this.editorAria,
					...aria
				} : aria);
			}
		},
		template: `
		<div
			class="tasks-check-list-formatting-layer"
			:class="{ '--readonly': isReadonlyRender, '--active': isEditorActive }"
			data-testid="tasks-check-list-formatting-layer"
			@click="handleLayerClick"
			@keydown.esc.capture="handleTextareaEscapeCapture"
			@keydown="handleKeyDown"
			@keyup="emitSelectionChange"
			@mouseup="emitSelectionChange"
		>
			<span v-if="editorDescribedby" :id="editorDescribedby" hidden>
				{{ keyboardInstructions }}
			</span>
			<div
				v-if="isReadonlyRender"
				ref="readonlyDisplay"
				v-hint="readonlyTooltip"
				class="tasks-check-list-formatting-layer-display print-display-block"
				data-testid="tasks-check-list-formatting-layer-display"
				:style="displayStyle"
				v-html="safeDisplayHtml"
			></div>
			<GrowingTextArea
				v-else-if="readonly || !checkListEditor"
				ref="growingTextArea"
				:modelValue="modelValue"
				:placeholder
				:readonly
				:ariaDescribedby="editorDescribedby"
				:fontColor
				:linkColor
				:fontSize
				:fontWeight
				:lineHeight
				:maxLines
				@update:modelValue="handleUpdateModelValue"
				@input="handleInput"
				@focus="handleFocus"
				@blur="$emit('blur', $event)"
				@emptyBlur="$emit('emptyBlur')"
				@emptyFocus="$emit('emptyFocus')"
				@enterBlur="$emit('enterBlur', $event)"
				@linkClick="$emit('linkClick', $event)"
			/>
			<div
				v-else-if="isEditorActive"
				ref="editorHost"
				class="tasks-check-list-formatting-layer-editor"
				:class="{ '--empty': !hasTitle }"
				:data-placeholder="placeholder"
				:style="displayStyle"
				@focusin="handleEditorFocus"
				@focusout="handleEditorBlur"
			></div>
			<div
				v-else
				ref="editableDisplay"
				class="tasks-check-list-formatting-layer-display --editable"
				:class="{ '--empty': !hasTitle }"
				data-testid="tasks-check-list-formatting-layer-display"
				:data-placeholder="placeholder"
				:style="displayStyle"
				:aria-label="placeholder"
				:aria-describedby="editorDescribedby"
				aria-multiline="true"
				role="textbox"
				tabindex="0"
				v-html="safeDisplayHtml"
				@pointerdown="handleActivationPointerDown"
				@focus="handleActivationFocus"
			></div>
		</div>
	`
	};

	const MENTION_REGEX = /^([+@])(\p{L}+)?$/u;
	class MentionMatcher {
		static match(text, startMatchPosition, currentPosition) {
			const afterPositionText = text.slice(startMatchPosition, currentPosition);
			const match = MENTION_REGEX.exec(afterPositionText);
			return match ? match[0] : '';
		}
	}

	/* global Partial */

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

			// The dialog fires this callback without awaiting or catching it, and the callback is what
			// unfreezes the item panel, so a failed save must neither skip the cleanup nor escape here.
			const handleClose = async userIds => {
				try {
					await this.#saveParticipants(params.items, params.type, userIds);
				} catch (error) {
					console.error('tasks: check-list participants save failed', error);
				}
				try {
					await params.onClose?.(userIds);
				} catch (error) {
					console.error('tasks: check-list participants dialog close failed', error);
				}
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
		getActiveListBoxId() {
			return this.#dialog?.getActiveTab?.()?.getListBoxId?.() ?? null;
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
		#hostContainer;
		#dialogExpanded = false;
		#removeVisibleRange;
		#setAria;
		#onDialogStateChange;
		constructor(params) {
			this.#itemId = params.itemId;
			this.#participantService = new CheckListParticipantService(params.taskId);
			this.#onDialogStateChange = main_core.Type.isFunction(params.onDialogStateChange) ? params.onDialogStateChange : () => {};
		}
		attachHost(container) {
			if (!container) {
				return;
			}
			this.#hostContainer = container;
			this.#syncComboboxState();
		}
		async handleInput(params) {
			if (String(this.#itemId) !== String(params.item.id)) {
				return;
			}
			this.#currentItem = params.item;
			this.#removeVisibleRange = params.removeVisibleRange;
			this.#setAria = params.setAria;
			if (params.targetNode) {
				this.#hostContainer = params.targetNode;
			}
			this.#syncComboboxState();
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
		isOpen() {
			return this.#participantService.isDialogOpen();
		}
		closeIfOpen() {
			if (!this.isOpen()) {
				return false;
			}
			this.#closeParticipantDialog();
			return true;
		}
		destroy() {
			this.#closeParticipantDialog();
			this.#hostContainer = null;
			this.#currentItem = null;
			this.#removeVisibleRange = null;
			this.#setAria = null;
		}
		#extractMention(params) {
			const startPosition = this.#currentMention?.startPosition ?? params.cursorPosition - 1;
			const matchedText = MentionMatcher.match(params.visibleText ?? params.item.title, startPosition, params.cursorPosition);
			if (!main_core.Type.isStringFilled(matchedText)) {
				return null;
			}
			return {
				text: matchedText,
				startPosition,
				range: params.captureVisibleRange?.(startPosition, params.cursorPosition) ?? null
			};
		}
		#updateParticipantSearch(mention) {
			this.#participantService.updateSearch(mention.text.slice(1));
			this.#syncComboboxState();
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
			this.#dialogExpanded = true;
			this.#onDialogStateChange(true);
			this.#syncComboboxState();
			ui_a11y.LiveAnnouncer.announce(main_core.Loc.getMessage('TASKS_V2_CHECK_LIST_MENTION_LIST_OPENED'), 'polite');
		}
		#handleMentionSelected() {
			if (this.#currentMention?.range && main_core.Type.isFunction(this.#removeVisibleRange)) {
				this.#removeVisibleRange(this.#currentMention.range);
			}
			this.#closeParticipantDialog();
		}
		#closeParticipantDialog() {
			this.#participantService.closeDialog();
			this.#resetMentionState();
		}
		#resetMentionState() {
			this.#participantService.updateSearch('');
			this.#currentMention = null;
			this.#dialogExpanded = false;
			this.#onDialogStateChange(false);
			this.#syncComboboxState();
		}
		#syncComboboxState() {
			const listBoxId = this.#dialogExpanded ? this.#participantService.getActiveListBoxId() : null;
			const activeOptionId = main_core.Type.isStringFilled(listBoxId) ? document.getElementById(listBoxId)?.querySelector('[aria-selected="true"]')?.id ?? null : null;
			const aria = this.#dialogExpanded ? {
				role: 'combobox',
				autocomplete: 'list',
				expanded: 'true',
				controls: listBoxId,
				activedescendant: activeOptionId
			} : {
				role: 'textbox'
			};
			if (main_core.Type.isFunction(this.#setAria)) {
				this.#setAria(aria);
				return;
			}
			const input = this.#hostContainer?.querySelector('[contenteditable="true"], textarea');
			if (input) {
				main_core.Dom.attr(input, {
					role: this.#dialogExpanded ? 'combobox' : 'textbox',
					'aria-autocomplete': this.#dialogExpanded ? 'list' : null,
					'aria-expanded': this.#dialogExpanded ? 'true' : null,
					'aria-controls': main_core.Type.isStringFilled(listBoxId) ? listBoxId : null,
					'aria-activedescendant': main_core.Type.isStringFilled(activeOptionId) ? activeOptionId : null
				});
			}
		}
	}

	/* global Partial */


	// @vue/component
	const CheckListItemMixin = {
		inject: {
			task: {},
			taskId: {},
			isEdit: {},
			checkListEditor: {
				default: null
			}
		},
		provide() {
			return {
				checkListEditorItem: {
					getId: () => this.id
				}
			};
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
		emits: ['update', 'addItem', 'removeItem', 'focus', 'blur', 'emptyBlur', 'show', 'hide', 'formattingSelectionChange', 'itemPointerEnter', 'itemPointerLeave', 'panelTab'],
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
			plainTitle() {
				return tasks_v2_lib_checkListBbCode.CheckListBbCode.toPlainText(this.item.title);
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
				return this.item?.actions?.modify === true;
			},
			canRemove() {
				return this.item?.actions?.remove === true;
			},
			canToggle() {
				if (this.readOnly && !this.isItemEdit && this.isEdit) {
					return false;
				}
				return this.item?.actions?.toggle === true;
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
			accomplicesLabel() {
				return this.loc('TASKS_V2_CHECK_LIST_ITEM_PRINT_ACCOMPLICES', {
					'#USERS#': this.getUserNames(this.accomplices)
				});
			},
			auditorsLabel() {
				return this.loc('TASKS_V2_CHECK_LIST_ITEM_PRINT_AUDITORS', {
					'#USERS#': this.getUserNames(this.auditors)
				});
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
				itemId: this.item.id,
				onDialogStateChange: open => this.checkListEditor?.setParticipantSelectorOpen(open)
			});
			this.registeredActiveFields = new Set();
		},
		mounted() {
			setTimeout(() => {
				this.isDragEnabled = true;
			}, 1000);
			void this.$nextTick(() => {
				this.mentionManager.attachHost(this.$refs.growingTextArea?.$el);
			});
		},
		beforeUnmount() {
			this.mentionManager.destroy();
			this.registeredActiveFields.forEach(field => {
				tasks_v2_provider_service_checkListService.activeFieldRegistry.release(this.id, field);
			});
			this.registeredActiveFields.clear();
		},
		methods: {
			...ui_vue3_vuex.mapActions(tasks_v2_const.Model.Interface, ['addCheckListCompletionCallback']),
			registerActiveField(field) {
				if (this.registeredActiveFields.has(field)) {
					return;
				}
				tasks_v2_provider_service_checkListService.activeFieldRegistry.register(this.id, field);
				this.registeredActiveFields.add(field);
			},
			releaseActiveField(field) {
				if (!this.registeredActiveFields.has(field)) {
					return;
				}
				tasks_v2_provider_service_checkListService.activeFieldRegistry.release(this.id, field);
				this.registeredActiveFields.delete(field);
			},
			handleFocus() {
				this.registerActiveField('title');
				this.$emit('focus', this.id);
			},
			handleBlur() {
				this.releaseActiveField('title');
				this.$emit('blur', this.id);
			},
			handleEmptyBlur() {
				this.$emit('emptyBlur', this.id);
			},
			handleLinkClick(event) {
				event.stopPropagation();
			},
			handleFormattingSelectionChange(actions) {
				this.$emit('formattingSelectionChange', this.id, actions);
			},
			getUserNames(users) {
				return (users ?? []).map(user => user.name).join(', ');
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
			applyFormatting(action, node = null, url = '') {
				if (this.textReadOnly) {
					return;
				}
				this.$refs.growingTextArea?.applyFormatting(action, url);
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
				this.registerActiveField('isComplete');
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
					this.releaseActiveField('isComplete');
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
				const currentPlainTitle = tasks_v2_lib_checkListBbCode.CheckListBbCode.toPlainText(currentTitle);
				const nextPlainTitle = tasks_v2_lib_checkListBbCode.CheckListBbCode.toPlainText(value);
				const formattingLayer = this.$refs.growingTextArea;
				const visibleState = formattingLayer.getVisibleState();
				void this.mentionManager.handleInput({
					item: {
						...this.item,
						title: value
					},
					isEntered: currentPlainTitle.length < nextPlainTitle.length,
					visibleText: visibleState?.text ?? '',
					cursorPosition: visibleState?.end ?? 0,
					targetNode: formattingLayer.$el,
					captureVisibleRange: (start, end) => formattingLayer.captureVisibleRange(start, end),
					removeVisibleRange: range => formattingLayer.removeVisibleRange(range),
					setAria: aria => formattingLayer.setEditorAria(aria)
				});
			},
			handleEditorInput(value) {
				this.handleInput(value);
			}
		}
	};

	// @vue/component
	const CheckListParentItem = {
		name: 'CheckListParentItem',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			BMenu: ui_system_menu_vue.BMenu,
			CheckListFormattingLayer,
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
			},
			showCloseButton: {
				type: Boolean,
				default: false
			}
		},
		emits: ['startGroupMode', 'openCheckList', 'panelTab', 'close', 'stickinessChange'],
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
					bindElement: this.$refs.more,
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
			this.$emit('stickinessChange', {
				id: this.id,
				isSticky: false
			});
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
			handleIndent() {
				this.$emit('indent', this.id);
			},
			handleOutdent() {
				this.$emit('outdent', this.id);
			},
			handlePanelTab({
				shiftKey
			}) {
				if (shiftKey) {
					this.handleOutdent();
				} else {
					this.handleIndent();
				}
			},
			handlePanelEntryTab(event) {
				if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey || event.target !== this.$refs.item) {
					return;
				}
				this.$emit('panelTab', {
					itemId: this.id,
					shiftKey: false,
					event
				});
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
					this.complete(this.totalCount === this.completedCount, /* persist */false);
				} else if (this.completed) {
					this.complete(false, /* persist */false);
				}
			},
			checkSticky() {
				if (!this.scrollContainer || !this.$refs.item) {
					return;
				}
				const stickyRect = this.$refs.item.getBoundingClientRect();
				const containerRect = this.scrollContainer.getBoundingClientRect();
				const isSticky = stickyRect.top <= containerRect.top + stickyRect.height / 2;
				if (this.isSticky === isSticky) {
					return;
				}
				this.isSticky = isSticky;
				this.$emit('stickinessChange', {
					id: this.id,
					isSticky
				});
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
			tabindex="-1"
			class="check-list-widget-parent-item print-no-before"
			data-testid="tasks-check-list-parent-item"
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
			@keydown.tab="handlePanelEntryTab"
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
					<BIcon :name="itemIcon" aria-hidden="true"/>
				</div>
			</div>
			<div class="check-list-widget-parent-item-title-container">
				<CheckListFormattingLayer
					preserveShiftTab
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
					:maxLines="6"
					:fontWeight="500"
					@click="handleTextClick"
					@linkClick="handleLinkClick"
					@update:modelValue="updateTitle"
					@input="handleInput"
					@focus="handleFocus"
					@emptyFocus="scrollToItem"
					@blur="handleBlur"
					@emptyBlur="handleEmptyBlur"
					@indent="handleIndent"
					@outdent="handleOutdent"
					@panelTab="handlePanelTab"
					@selectionChange="handleFormattingSelectionChange"
				/>
				<template v-if="hasAttachments">
					<div class="check-list-widget-item-attach --parent">
						<div v-if="hasUsers" class="check-list-widget-item-attach-users">
							<div v-if="hasAccomplices" class="check-list-widget-item-attach-users-list">
								<BIcon :name="Outline.GROUP" aria-hidden="true"/>
								<UserAvatarList :users="accomplices"/>
							</div>
							<div v-if="hasAuditors" class="check-list-widget-item-attach-users-list">
								<BIcon :name="Outline.OBSERVER" aria-hidden="true"/>
								<UserAvatarList :users="auditors"/>
							</div>
						</div>
						<div v-if="hasUsers" class="check-list-widget-item-attach-users-print">
							<div v-if="hasAccomplices" class="check-list-widget-item-attach-users-print-group">{{ accomplicesLabel }}</div>
							<div v-if="hasAuditors" class="check-list-widget-item-attach-users-print-group">{{ auditorsLabel }}</div>
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
						aria-hidden="true"
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
							data-testid="tasks-check-list-parent-item-my-filter"
							:aria-label="loc('TASKS_V2_CHECK_LIST_MY_FILTER_LABEL')"
							v-model:checked="item.myFilterActive"
						/>
					</div>
					<div class="check-list-widget-parent-item-main-action-actions print-ignore">
						<button
							ref="more"
							type="button"
							class="check-list-widget-parent-item-action-btn"
							aria-haspopup="menu"
							data-testid="tasks-check-list-parent-item-menu-btn"
							:aria-expanded="isMenuShown ? 'true' : 'false'"
							:aria-label="loc('TASKS_V2_CHECK_LIST_ACTIONS_MENU_LABEL')"
							@click="showMenu"
						>
							<BIcon
								:name="Outline.MORE_L"
								:size="isPreview ? 20 : 24"
								aria-hidden="true"
							/>
						</button>
						<button
							type="button"
							class="check-list-widget-parent-item-action-btn"
							:aria-expanded="collapsed ? 'false' : 'true'"
							:aria-label="collapsed
								? loc('TASKS_V2_CHECK_LIST_EXPAND_LABEL')
								: loc('TASKS_V2_CHECK_LIST_COLLAPSE_LABEL')"
							data-testid="tasks-check-list-parent-item-collapse-btn"
							@click="toggleCollapse()"
						>
							<BIcon
								:name="collapsed ? Outline.CHEVRON_DOWN_L : Outline.CHEVRON_TOP_L"
								:size="isPreview ? 20 : 24"
								aria-hidden="true"
							/>
						</button>
						<button
							v-if="showCloseButton"
							type="button"
							class="check-list-widget-parent-item-action-btn --close"
							data-testid="task-check-list-close-btn"
							:aria-label="loc('TASKS_V2_CHECK_LIST_CLOSE_LABEL')"
							@click="$emit('close')"
						>
							<BIcon
								:name="Outline.CROSS_L"
								:size="isPreview ? 20 : 24"
								data-testid="tasks-check-list-close-btn"
								aria-hidden="true"
							/>
						</button>
					</div>
				</div>
				<div
					v-if="isSticky && !isPreview && !showCloseButton"
					class="check-list-widget-parent-item-empty print-ignore"
				/>
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
			},
			ariaLabel: {
				type: String,
				default: ''
			}
		},
		emits: ['click'],
		template: `
		<UiCheckbox
			:checked
			:important
			:disabled
			:highlight
			:ariaLabel
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
			CheckListFormattingLayer,
			UserAvatarList: tasks_v2_component_elements_userAvatarList.UserAvatarList,
			CheckListCheckbox,
			UserFieldWidgetComponent: tasks_v2_component_elements_userFieldWidgetComponent.DiskUserFieldWidgetComponent
		},
		mixins: [CheckListItemMixin],
		inject: ['setItemsRef', 'getItemsRef'],
		props: {
			itemOffset: {
				type: String,
				default: '0'
			},
			checkListId: {
				type: [Number, String],
				default: 0
			},
			entityPanelActive: {
				type: Boolean,
				default: false
			}
		},
		emits: ['toggleGroupModeSelected', 'openCheckList', 'indent', 'outdent', 'itemPointerEnter', 'itemPointerLeave', 'panelTab'],
		setup(props) {
			// eslint-disable-next-line vue/no-setup-props-reactivity-loss
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
			toggleable() {
				if (this.isPreview) {
					return this.canModify;
				}
				return this.canToggle;
			},
			// Preview opens the panel by Tab from the completion checkbox, and an item that cannot be
			// toggled keeps that checkbox out of the Tab order. Such a row has no stop of its own --
			// a title without links carries none either -- so the row itself becomes the one stop the
			// panel can be reached from.
			isPanelRowTabStop() {
				return this.isPreview && this.isEdit && !this.groupMode && !this.canToggle && (this.canModify || this.canRemove);
			}
		},
		watch: {
			async files(next, prev) {
				const prevIds = (prev ?? []).map(file => file?.id ?? file);
				const nextIds = (next ?? []).map(file => file?.id ?? file);
				const prevIdSet = new Set(prevIds);
				const nextIdSet = new Set(nextIds);
				const newIds = nextIds.filter(id => !prevIdSet.has(id));
				if (newIds.length > 0) {
					await this.fileService.list(newIds);
				}
				const removedIds = prevIds.filter(id => !nextIdSet.has(id));
				if (removedIds.length > 0) {
					this.fileService.remove(removedIds);
				}
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
			this.subscribeToEvents();
		},
		beforeUnmount() {
			if (this.setItemsRef && this.getItemsRef?.(this.id) === this) {
				this.setItemsRef(this.id, null);
			}
			this.unsubscribeToEvents();
		},
		methods: {
			handlePointerEnter() {
				this.isHovered = true;
				this.$emit('itemPointerEnter', {
					itemId: this.id,
					anchor: this.$refs.base
				});
			},
			handlePointerLeave(event) {
				this.isHovered = false;
				this.$emit('itemPointerLeave', {
					itemId: this.id,
					anchor: this.$el,
					relatedTarget: event.relatedTarget
				});
			},
			handlePanelTab({
				shiftKey,
				event = null
			}) {
				this.$emit('panelTab', {
					itemId: this.id,
					shiftKey,
					event
				});
			},
			handlePanelEntryTab(event) {
				if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey || !(event.target instanceof Element)) {
					return;
				}
				const fromRow = event.target === this.$refs.item;
				const fromPreviewCheckbox = this.isPreview && event.target.closest('[data-testid="tasks-check-list-child-item-checkbox"]') !== null;
				if (!fromRow && !fromPreviewCheckbox) {
					return;
				}
				this.$emit('panelTab', {
					itemId: this.id,
					shiftKey: false,
					event
				});
			},
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
				if (!this.item) {
					return;
				}
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
			:tabindex="isPanelRowTabStop ? 0 : -1"
			class="check-list-widget-child-item print-no-before"
			data-testid="tasks-check-list-child-item"
			:class="{
				'--complete': completed,
				'--group-mode': groupMode,
				'--group-mode-selected': groupModeSelected,
				'--preview': isPreview,
				'--toggleable': toggleable,
				'--hovered': isHovered,
				'--entity-panel-active': entityPanelActive,
			}"
			:style="{ marginLeft: itemOffset }"
			@pointerenter="handlePointerEnter"
			@pointerleave="handlePointerLeave"
			@keydown.tab="handlePanelEntryTab"
			@click="handleClick"
		>
			<div
				ref="base"
				class="check-list-widget-child-item-base"
				data-testid="tasks-check-list-child-item-base"
			>
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
					data-testid="tasks-check-list-child-item-checkbox"
					:disabled="!canToggle || groupMode"
					:checked="completed"
					:ariaLabel="plainTitle"
					@click="complete(!completed)"
				/>
				<div
					v-if="item.isImportant"
					class="check-list-widget-child-item-important"
				>
					<BIcon :name="Outline.FIRE_SOLID" aria-hidden="true"/>
				</div>
				<CheckListFormattingLayer
					ref="growingTextArea"
					class="check-list-widget-child-item-title"
					:data-check-list-id="'check-list-child-item-title-' + item.id"
					:modelValue="item.title"
					:placeholder="loc('TASKS_V2_CHECK_LIST_ITEM_PLACEHOLDER')"
					:keyboardInstructions="loc('TASKS_V2_CHECK_LIST_ITEM_KEYBOARD_INSTRUCTIONS')"
					:readonly="textReadOnly"
					:fontColor="textColor"
					:linkColor
					:fontSize="15"
					:lineHeight="20"
					:maxLines="6"
					@update:modelValue="updateTitle"
					@linkClick="handleLinkClick"
					@input="handleInput"
					@focus="handleFocus"
					@blur="handleBlur"
					@emptyBlur="handleEmptyBlur"
					@emptyFocus="scrollToItem"
					@enterBlur="handleEnter"
					@selectionChange="handleFormattingSelectionChange"
					@panelTab="handlePanelTab"
				/>
				<template v-if="groupMode">
					<CheckListCheckbox
						:checked="groupModeSelected"
						highlight
						data-testid="tasks-check-list-child-item-group-checkbox"
						:ariaLabel="loc('TASKS_V2_CHECK_LIST_ITEM_SELECT_LABEL', { '#title#': plainTitle })"
						@click="toggleGroupModeSelected"
						@keydown.tab="(event) => handlePanelTab({ shiftKey: event.shiftKey, event })"
					/>
				</template>
				<div v-else class="check-list-widget-child-item-action-stub"/>
			</div>
			<template v-if="hasAttachments">
				<div class="check-list-widget-item-attach">
					<div v-if="hasUsers" class="check-list-widget-item-attach-users">
						<div v-if="hasAccomplices" class="check-list-widget-item-attach-users-list">
							<BIcon :name="Outline.GROUP" aria-hidden="true"/>
							<UserAvatarList :users="accomplices"/>
						</div>
						<div v-if="hasAuditors" class="check-list-widget-item-attach-users-list">
							<BIcon :name="Outline.OBSERVER" aria-hidden="true"/>
							<UserAvatarList :users="auditors"/>
						</div>
					</div>
					<div v-if="hasUsers" class="check-list-widget-item-attach-users-print">
						<div v-if="hasAccomplices" class="check-list-widget-item-attach-users-print-group">{{ accomplicesLabel }}</div>
						<div v-if="hasAuditors" class="check-list-widget-item-attach-users-print-group">{{ auditorsLabel }}</div>
					</div>
					<div v-if="hasFilesAttach" class="check-list-widget-item-attach-files print-ignore">
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
		<button
			type="button"
			class="check-list-widget-add-item print-ignore"
			:class="{'--preview': isPreview}"
			data-testid="tasks-check-list-add-item-btn"
			@mousedown.prevent
			@click="$emit('addItem')"
		>
			<div class="check-list-widget-add-item-icon">
				<BIcon :name="Outline.PLUS_L" aria-hidden="true"/>
			</div>
			<div class="check-list-widget-add-item-title">{{ loc('TASKS_V2_CHECK_LIST_ITEM_ADD_BTN') }}</div>
		</button>
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
		<button type="button" class="check-list-widget-group-completed-list" data-testid="tasks-check-list-group-completed-btn">
			<div class="check-list-widget-group-completed-list-icon">
				<BIcon :name="Outline.CHECK_L" aria-hidden="true"/>
			</div>
			<div class="check-list-widget-group-completed-list-title">
				{{ completedParentsLabel }}
			</div>
			<div class="check-list-widget-group-completed-list-action print-ignore">
				<BIcon :name="Actions.CHEVRON_RIGHT" aria-hidden="true"/>
			</div>
		</button>
	`
	};

	const closeButtonSelector = '[data-testid="task-check-list-close-btn"]';

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
			},
			entityPanelItemId: {
				type: [Number, String],
				default: null
			},
			showCloseButton: {
				type: Boolean,
				default: false
			}
		},
		emits: ['show', 'update', 'addItem', 'addItemFromBtn', 'removeItem', 'focus', 'blur', 'emptyBlur', 'formattingSelectionChange', 'startGroupMode', 'toggleGroupModeSelected', 'openCheckList', 'itemPointerEnter', 'itemPointerLeave', 'panelTab', 'close'],
		setup() {},
		data() {
			return {
				scrollContainer: null,
				stickyParentItemIds: []
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
			},
			closeButtonParentItemId() {
				if (!this.showCloseButton || this.parentCheckLists.length === 0) {
					return null;
				}
				const stickyParentItemIds = new Set(this.stickyParentItemIds.map(id => String(id)));
				const stickyParentCheckLists = this.parentCheckLists.filter(checkList => {
					return stickyParentItemIds.has(String(checkList.id));
				});
				return stickyParentCheckLists[stickyParentCheckLists.length - 1]?.id ?? this.parentCheckLists[0].id;
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
			this.listDragManager?.destroy();
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
			getItemLevel(item) {
				return this.checkListManager.getItemLevel(item);
			},
			getChildItemKey(rootItemId, itemId) {
				return JSON.stringify(['child', rootItemId, itemId]);
			},
			getListName(parentItem) {
				return tasks_v2_lib_checkListBbCode.CheckListBbCode.toPlainText(parentItem.title) || this.loc('TASKS_V2_CHECK_LIST_TITLE');
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
			isEntityPanelActive(itemId) {
				return this.entityPanelItemId !== null && String(this.entityPanelItemId) === String(itemId);
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
			handleParentStickinessChange({
				id,
				isSticky
			}) {
				const shouldRestoreCloseButtonFocus = this.showCloseButton && document.activeElement?.matches(closeButtonSelector) && this.$el.contains(document.activeElement);
				this.stickyParentItemIds = this.stickyParentItemIds.filter(stickyId => {
					return String(stickyId) !== String(id);
				});
				if (isSticky) {
					this.stickyParentItemIds = [...this.stickyParentItemIds, id];
				}
				if (shouldRestoreCloseButtonFocus) {
					this.restoreCloseButtonFocus();
				}
			},
			restoreCloseButtonFocus() {
				void this.$nextTick(() => {
					this.$el.querySelector(closeButtonSelector)?.focus({
						preventScroll: true
					});
				});
			},
			initDragManager() {
				this.listDragManager.init(this.scrollContainer);
				const listDropzone = this.canAddItem ? this.$refs.parentComponents?.map(parent => parent.$el) : [];
				this.itemDragManager.init(this.scrollContainer, listDropzone);
			}
		},
		template: `
		<div class="check-list-widget-container" data-testid="tasks-check-list-widget">
			<TransitionGroup
				:css="!disableCheckListAnimations"
				name="check-list"
				tag="ul"
				role="list"
				class="check-list-widget --parent"
				:class="{
					'--preview': isPreview,
					'--dragged': parentItemDragged,
				}"
			>
				<li
					v-for="(parentItem, parentItemIndex) in parentCheckLists"
					:key="'parent-' + parentItem.id + parentItemIndex"
					role="listitem"
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
							:showCloseButton="String(parentItem.id) === String(closeButtonParentItemId)"
							@update="(id) => $emit('update', id)"
							@removeItem="(id) => $emit('removeItem', id)"
							@focus="(id) => $emit('focus', id)"
							@blur="(id) => $emit('blur', id)"
							@emptyBlur="(id) => $emit('emptyBlur', id)"
							@formattingSelectionChange="(itemId, actions) => $emit('formattingSelectionChange', itemId, actions)"
							@startGroupMode="(id) => $emit('startGroupMode', id)"
							@openCheckList="(id) => $emit('openCheckList', id)"
							@panelTab="(data) => $emit('panelTab', data)"
							@close="$emit('close')"
							@stickinessChange="handleParentStickinessChange"
						/>
					</template>
					<TransitionGroup
						v-if="parentItem.id !== draggedCheckListId"
						:css="!disableCheckListAnimations"
						name="check-list"
						tag="ul"
						role="list"
						:aria-label="getListName(parentItem)"
						class="check-list-widget"
					>
					<li
						v-if="!isCollapsed(parentItem, parentItemIndex)"
						v-for="childItem in getChildren(parentItem)"
						:key="getChildItemKey(parentItem.id, childItem.id)"
							:data-id="childItem.id"
							role="listitem"
							:aria-level="getItemLevel(childItem)"
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
									:entityPanelActive="isEntityPanelActive(childItem.id)"
									@update="(id) => $emit('update', id)"
									@addItem="(data) => $emit('addItem', data)"
									@removeItem="(id) => $emit('removeItem', id)"
									@focus="(id) => $emit('focus', id)"
									@blur="(id) => $emit('blur', id)"
									@emptyBlur="(id) => $emit('emptyBlur', id)"
									@formattingSelectionChange="(itemId, actions) => $emit('formattingSelectionChange', itemId, actions)"
									@toggleGroupModeSelected="(id) => $emit('toggleGroupModeSelected', id)"
									@openCheckList="(id) => $emit('openCheckList', id)"
									@itemPointerEnter="(data) => $emit('itemPointerEnter', data)"
									@itemPointerLeave="(data) => $emit('itemPointerLeave', data)"
									@panelTab="(data) => $emit('panelTab', data)"
								/>
							</template>
						</li>
						<li
							v-if="!isCollapsed(parentItem, parentItemIndex)"
							:key="'add-' + parentItem.id + parentItemIndex"
							data-id="add-item"
							:data-parent-id="parentItem.id"
							role="listitem"
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
					role="listitem"
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
		Formatting: 'formatting',
		Movement: 'movement',
		Accomplice: 'accomplice',
		Auditor: 'auditor',
		Forward: 'forward',
		Delete: 'delete',
		Cancel: 'cancel'
	});
	const PanelAction = Object.freeze({
		Bold: 'bold',
		Italic: 'italic',
		Underline: 'underline',
		Strikethrough: 'strikethrough',
		Link: 'link',
		SetImportant: 'setImportant',
		AttachFile: 'attachFile',
		MoveRight: 'moveRight',
		MoveLeft: 'moveLeft',
		MoveItemUp: 'moveItemUp',
		MoveItemDown: 'moveItemDown',
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
				activeIconColor: 'var(--tasks-check-list-important-icon-color)',
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
			name: PanelSection.Formatting,
			items: [{
				icon: ui_iconSet_api_vue.Outline.BOLD,
				iconSize: 20,
				action: PanelAction.Bold,
				hint: 'TASKS_V2_CHECK_LIST_ITEM_FORMAT_BOLD_HINT'
			}, {
				icon: ui_iconSet_api_vue.Outline.ITALIC,
				iconSize: 20,
				action: PanelAction.Italic,
				hint: 'TASKS_V2_CHECK_LIST_ITEM_FORMAT_ITALIC_HINT'
			}, {
				icon: ui_iconSet_api_vue.Outline.UNDERLINE,
				iconSize: 20,
				action: PanelAction.Underline,
				hint: 'TASKS_V2_CHECK_LIST_ITEM_FORMAT_UNDERLINE_HINT'
			}, {
				icon: ui_iconSet_api_vue.Outline.STRIKETHROUGH,
				iconSize: 20,
				action: PanelAction.Strikethrough,
				hint: 'TASKS_V2_CHECK_LIST_ITEM_FORMAT_STRIKETHROUGH_HINT'
			}, {
				icon: ui_iconSet_api_vue.Outline.LINK,
				iconSize: 20,
				action: PanelAction.Link,
				hint: 'TASKS_V2_CHECK_LIST_ITEM_FORMAT_LINK_HINT',
				separatorBefore: true
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
				iconSize: 20,
				action: PanelAction.AssignAccomplice,
				hint: 'TASKS_V2_CHECK_LIST_ITEM_ACCOMPLICE_HINT'
			}]
		}, {
			name: PanelSection.Auditor,
			items: [{
				icon: ui_iconSet_api_vue.Outline.OBSERVER,
				iconSize: 20,
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
				iconColor: 'var(--ui-color-accent-main-alert)',
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

	const FormattingActions = Object.freeze([PanelAction.Bold, PanelAction.Italic, PanelAction.Underline, PanelAction.Strikethrough, PanelAction.Link]);
	const DefaultActions = Object.freeze([PanelAction.SetImportant, PanelAction.MoveRight, PanelAction.MoveLeft, PanelAction.AssignAccomplice, PanelAction.AssignAuditor, PanelAction.Forward, PanelAction.Delete]);
	const RootItemActions = Object.freeze([PanelAction.AssignAccomplice, PanelAction.AssignAuditor]);
	const StakeholderActions = Object.freeze([PanelAction.AssignAccomplice, PanelAction.AssignAuditor]);

	// The panel keeps the icon color in a CSS variable so hover can darken it: BIcon writes the color prop inline.
	const DefaultIconColor = 'var(--tasks-check-list-panel-icon-color, var(--ui-color-design-plain-content-icon))';

	const ActionPlacement = Object.freeze({
		Text: 'text',
		Entity: 'entity',
		Keyboard: 'keyboard'
	});
	const EntityActionOrder = Object.freeze({
		Important: 10,
		Accomplice: 20,
		Auditor: 30,
		CreateTask: 40,
		AttachFile: 45,
		Forward: 50,
		Copy: 60,
		MoveRight: 65,
		MoveLeft: 66,
		Delete: 70,
		Cancel: 80
	});
	const canModify = ({
		item
	}) => item.actions?.modify === true;
	const canRemove = ({
		item
	}) => item.actions?.remove === true;
	const neverSelected = () => false;
	const keepTriggerFocus = Object.freeze({
		holdPanel: false,
		returnFocus: 'trigger'
	});
	const popupInteraction = Object.freeze({
		holdPanel: true,
		returnFocus: 'trigger'
	});
	function dispatchRegisteredAction(action) {
		return ({
			item,
			trigger,
			dispatch
		}) => dispatch(action, item, trigger);
	}
	const descriptors = [{
		id: PanelAction.AttachFile,
		placement: ActionPlacement.Text,
		order: 10,
		section: PanelSection.Attachments,
		icon: ui_iconSet_api_vue.Outline.ATTACH,
		hint: 'TASKS_V2_CHECK_LIST_ITEM_ATTACH_HINT',
		isAvailable: context => canModify(context) && !context.isGroupMode && context.isDiskAvailable,
		isSelected: neverSelected,
		handle: dispatchRegisteredAction(PanelAction.AttachFile),
		interaction: popupInteraction
	}, ...[[PanelAction.Bold, ui_iconSet_api_vue.Outline.BOLD, 'TASKS_V2_CHECK_LIST_ITEM_FORMAT_BOLD_HINT'], [PanelAction.Italic, ui_iconSet_api_vue.Outline.ITALIC, 'TASKS_V2_CHECK_LIST_ITEM_FORMAT_ITALIC_HINT'], [PanelAction.Underline, ui_iconSet_api_vue.Outline.UNDERLINE, 'TASKS_V2_CHECK_LIST_ITEM_FORMAT_UNDERLINE_HINT'], [PanelAction.Strikethrough, ui_iconSet_api_vue.Outline.STRIKETHROUGH, 'TASKS_V2_CHECK_LIST_ITEM_FORMAT_STRIKETHROUGH_HINT'], [PanelAction.Link, ui_iconSet_api_vue.Outline.LINK, 'TASKS_V2_CHECK_LIST_ITEM_FORMAT_LINK_HINT']].map(([id, icon, hint], index) => ({
		id,
		placement: ActionPlacement.Text,
		rootVisible: true,
		order: 20 + index * 10,
		section: PanelSection.Formatting,
		icon,
		iconSize: 20,
		hint,
		separatorBefore: id === PanelAction.Link,
		isToggle: id !== PanelAction.Link,
		isAvailable: context => canModify(context) && !context.isGroupMode,
		isSelected: ({
			selectedFormattingActions
		}) => selectedFormattingActions.includes(id),
		handle: dispatchRegisteredAction(id),
		interaction: id === PanelAction.Link ? popupInteraction : keepTriggerFocus
	})), {
		id: PanelAction.MoveRight,
		placement: ActionPlacement.Text,
		groupPlacement: ActionPlacement.Entity,
		groupOrder: EntityActionOrder.MoveRight,
		order: 70,
		section: PanelSection.Movement,
		icon: ui_iconSet_api_vue.Outline.POINT_RIGHT,
		hint: 'TASKS_V2_CHECK_LIST_ITEM_MOVE_RIGHT_HINT',
		isAvailable: context => canModify(context) && context.canMoveRight,
		isSelected: neverSelected,
		handle: dispatchRegisteredAction(PanelAction.MoveRight),
		interaction: {
			holdPanel: false,
			returnFocus: 'item'
		}
	}, {
		id: PanelAction.MoveLeft,
		placement: ActionPlacement.Text,
		groupPlacement: ActionPlacement.Entity,
		groupOrder: EntityActionOrder.MoveLeft,
		order: 80,
		section: PanelSection.Movement,
		icon: ui_iconSet_api_vue.Outline.POINT_LEFT,
		hint: 'TASKS_V2_CHECK_LIST_ITEM_MOVE_LEFT_HINT',
		isAvailable: context => canModify(context) && context.canMoveLeft,
		isSelected: neverSelected,
		handle: dispatchRegisteredAction(PanelAction.MoveLeft),
		interaction: {
			holdPanel: false,
			returnFocus: 'item'
		}
	}, ...[[PanelAction.MoveItemUp, 10], [PanelAction.MoveItemDown, 20]].map(([id, order]) => ({
		id,
		placement: ActionPlacement.Keyboard,
		order,
		section: PanelSection.Movement,
		isAvailable: context => canModify(context) && !context.isGroupMode,
		isSelected: neverSelected,
		handle: dispatchRegisteredAction(id),
		interaction: {
			holdPanel: false,
			returnFocus: 'trigger'
		}
	})), {
		id: PanelAction.SetImportant,
		placement: ActionPlacement.Entity,
		order: EntityActionOrder.Important,
		section: PanelSection.Important,
		icon: ui_iconSet_api_vue.Outline.FIRE,
		activeIcon: ui_iconSet_api_vue.Outline.FIRE_SOLID,
		activeIconColor: 'var(--tasks-check-list-important-icon-color)',
		hint: 'TASKS_V2_CHECK_LIST_ITEM_IMPORTANT_HINT',
		className: '--important',
		hoverable: false,
		isToggle: true,
		isAvailable: canModify,
		isSelected: ({
			item
		}) => item.isImportant === true,
		handle: dispatchRegisteredAction(PanelAction.SetImportant),
		interaction: keepTriggerFocus
	}, {
		id: PanelAction.AssignAccomplice,
		placement: ActionPlacement.Entity,
		rootPlacement: ActionPlacement.Text,
		rootOrder: 100,
		order: EntityActionOrder.Accomplice,
		section: PanelSection.Accomplice,
		icon: ui_iconSet_api_vue.Outline.PERSON,
		iconSize: 20,
		hint: 'TASKS_V2_CHECK_LIST_ITEM_ACCOMPLICE_HINT',
		isAvailable: context => canModify(context) && context.isStakeholdersAvailable && context.canChangeAccomplices,
		isSelected: neverSelected,
		handle: dispatchRegisteredAction(PanelAction.AssignAccomplice),
		interaction: popupInteraction
	}, {
		id: PanelAction.AssignAuditor,
		placement: ActionPlacement.Entity,
		rootPlacement: ActionPlacement.Text,
		rootOrder: 110,
		order: EntityActionOrder.Auditor,
		section: PanelSection.Auditor,
		icon: ui_iconSet_api_vue.Outline.OBSERVER,
		iconSize: 20,
		hint: 'TASKS_V2_CHECK_LIST_ITEM_AUDITOR_HINT',
		isAvailable: context => canModify(context) && context.isStakeholdersAvailable && context.canAuditorsAdd,
		isSelected: neverSelected,
		handle: dispatchRegisteredAction(PanelAction.AssignAuditor),
		interaction: popupInteraction
	}, {
		id: PanelAction.Forward,
		placement: ActionPlacement.Entity,
		order: EntityActionOrder.Forward,
		section: PanelSection.Forward,
		icon: ui_iconSet_api_vue.Outline.FORWARD,
		hint: 'TASKS_V2_CHECK_LIST_ITEM_FORWARD_HINT',
		isAvailable: context => canModify(context) && context.item.title !== '' && context.canCheckListAdd,
		isSelected: neverSelected,
		handle: dispatchRegisteredAction(PanelAction.Forward),
		interaction: popupInteraction
	}, {
		id: PanelAction.Delete,
		placement: ActionPlacement.Entity,
		order: EntityActionOrder.Delete,
		section: PanelSection.Delete,
		icon: ui_iconSet_api_vue.Outline.TRASHCAN,
		iconColor: 'var(--ui-color-accent-main-alert)',
		hint: 'TASKS_V2_CHECK_LIST_ITEM_REMOVE_HINT',
		isAvailable: canRemove,
		isSelected: neverSelected,
		handle: dispatchRegisteredAction(PanelAction.Delete),
		interaction: {
			holdPanel: false,
			returnFocus: 'nearest'
		}
	}, {
		id: PanelAction.Cancel,
		placement: ActionPlacement.Entity,
		order: EntityActionOrder.Cancel,
		section: PanelSection.Cancel,
		icon: ui_iconSet_api_vue.Outline.CROSS_L,
		hint: 'TASKS_V2_CHECK_LIST_ITEM_CANCEL_HINT',
		isAvailable: ({
			isGroupMode
		}) => isGroupMode,
		isSelected: neverSelected,
		handle: dispatchRegisteredAction(PanelAction.Cancel),
		interaction: {
			holdPanel: false,
			returnFocus: 'item'
		}
	}];
	const registry = new Map();
	function registerAction(descriptor) {
		if (registry.has(descriptor.id)) {
			throw new Error(`Checklist action "${descriptor.id}" is already registered.`);
		}
		const registeredDescriptor = Object.freeze({
			...descriptor
		});
		registry.set(descriptor.id, registeredDescriptor);
		return () => {
			if (registry.get(descriptor.id) === registeredDescriptor) {
				registry.delete(descriptor.id);
			}
		};
	}
	function getActionDescriptors() {
		return [...registry.values()];
	}
	function getActionDescriptor(actionId) {
		return registry.get(actionId) ?? null;
	}
	descriptors.forEach(descriptor => registerAction(descriptor));

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
			placement: {
				type: String,
				default: ActionPlacement.Text
			},
			ariaLabel: {
				type: String,
				default: ''
			},
			testId: {
				type: String,
				default: 'task-check-list-item-panel'
			},
			currentItem: {
				type: Object,
				default: () => null
			},
			actionPopupShown: {
				type: Boolean,
				default: false
			},
			preserveFocusOnMouseDown: {
				type: Boolean,
				default: false
			},
			hasIndentTarget: {
				type: Boolean,
				default: false
			},
			selectedFormattingActions: {
				type: Array,
				default: () => []
			},
			actions: {
				type: Array,
				default: () => []
			},
			keyboardActions: {
				type: Array,
				default: () => []
			}
		},
		emits: ['action', 'returnFocus', 'focusForward', 'focusLeave', 'pointerEnter', 'pointerLeave', 'focusEnter', 'navigate', 'escape'],
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
			isEntityPlacement() {
				return this.placement === ActionPlacement.Entity;
			},
			sections() {
				if (this.ariaLabel || (this.actions?.length ?? 0) > 0) {
					return this.actions.reduce((sections, action) => {
						let section = sections.find(({
							name
						}) => name === action.section);
						if (!section) {
							section = {
								name: action.section,
								items: []
							};
							sections.push(section);
						}
						section.items.push({
							...action,
							action: action.id,
							hoverable: action.hoverable ?? true
						});
						return sections;
					}, []);
				}
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
				const canFormatCurrentTitle = this.currentItem.actions?.modify === true && !this.itemGroupModeSelected;
				let actions = [...DefaultActions];
				if (this.itemGroupModeSelected) {
					actions.push(PanelAction.Cancel);
				} else {
					actions.push(PanelAction.AttachFile);
				}
				if (canFormatCurrentTitle) {
					actions.push(...FormattingActions);
				}
				if (this.currentItem.parentId === 0) {
					actions = [...(canFormatCurrentTitle ? FormattingActions : []), ...RootItemActions];
				}
				return actions.filter(action => {
					const isDisabledStakeholders = StakeholderActions.includes(action) && this.isStakeholdersRestricted;
					return !isDisabledStakeholders;
				});
			},
			disabledActions() {
				if (!this.currentItem) {
					return [];
				}
				const disabledActions = [];
				const itemLevel = this.checkListManager.getItemLevel(this.currentItem);
				const canModify = this.currentItem.actions?.modify === true;
				const canRemove = this.currentItem.actions?.remove === true;
				const canReorder = canModify && !this.itemGroupModeSelected;
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
						return itemLevel === 5 || !this.hasIndentTarget || canModify === false;
					},
					[PanelAction.MoveItemUp]: () => {
						return canReorder === false;
					},
					[PanelAction.MoveItemDown]: () => {
						return canReorder === false;
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
			moveItemShortcuts() {
				// Announce only the arrows handleKeydown answers for the current item: a move
				// disabledActions turned off leaves its key as plain page scrolling.
				const keys = [];
				if (!this.disabledActions.includes(PanelAction.MoveItemUp)) {
					keys.push('ArrowUp');
				}
				if (!this.disabledActions.includes(PanelAction.MoveItemDown)) {
					keys.push('ArrowDown');
				}
				return keys.length > 0 ? keys.join(' ') : null;
			},
			activeActions() {
				if (!this.currentItem) {
					return [];
				}
				const actions = [...this.selectedFormattingActions];
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
			this.focusZone = null;
			this.focusZoneContainer = null;
		},
		mounted() {
			this.syncFocusZone();
		},
		updated() {
			// The toolbar root is behind v-if, so an item that loses all its sections and gets
			// them back comes with a brand new node -- the old zone would keep the roving
			// tabindex on the detached one.
			this.syncFocusZone();
		},
		beforeUnmount() {
			this.destroyFocusZone();
		},
		methods: {
			handleMouseDown(event) {
				if (this.placement === ActionPlacement.Text || this.preserveFocusOnMouseDown) {
					event.preventDefault();
				}
			},
			syncFocusZone() {
				const container = this.$el?.nodeType === Node.ELEMENT_NODE ? this.$el : null;
				if (container === this.focusZoneContainer) {
					return;
				}
				this.destroyFocusZone();
				if (!container) {
					return;
				}
				this.focusZoneContainer = container;
				this.focusZone = ui_vue3.markRaw(new ui_a11y.FocusZone(container, {
					bindKeys: ui_a11y.FocusKeys.ArrowHorizontal | ui_a11y.FocusKeys.HomeAndEnd
				}));
				this.focusZone.activate();
			},
			destroyFocusZone() {
				this.focusZone?.deactivate();
				this.focusZone = null;
				this.focusZoneContainer = null;
			},
			focusFirstAction() {
				const target = this.$el?.querySelector?.('button:not([disabled])');
				if (!target) {
					return false;
				}
				target.focus();

				// The toolbar can be mounted but not displayed (updatePanelPosition hides
				// it for a row at the edge of the list), and focusing a hidden element is
				// a no-op. Report the fact, so the caller can fall back to native Tab
				// instead of suppressing it and trapping focus on the item.
				return document.activeElement === target;
			},
			focusLastAction() {
				const buttons = this.$el?.querySelectorAll?.('button:not([disabled])') ?? [];
				const target = buttons[buttons.length - 1];
				if (!target) {
					return false;
				}
				target.focus();
				return document.activeElement === target;
			},
			handleKeydown(event) {
				if (this.ariaLabel || event.target === undefined || this.keyboardActions !== undefined && this.disabledActions === undefined) {
					CheckListItemPanel.methods.handleSplitPanelKeydown.call(this, event);
					return;
				}
				if (event.key === 'Escape') {
					event.preventDefault();
					event.stopPropagation();
					this.$emit('returnFocus');
					return;
				}

				// FocusZone keeps a single tab stop here (roving tabindex), so Tab from any
				// button leaves the toolbar in both directions. The parent decides where
				// focus goes instead of letting it fall onto the footer, which is the
				// toolbar's DOM neighbour: back to the item, or on to the tree flow.
				if (event.key === 'Tab') {
					event.preventDefault();
					this.$emit(event.shiftKey ? 'returnFocus' : 'focusForward');
					return;
				}
				if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
					// Arrows mirror the toolbar buttons: a move the panel would render disabled
					// stays silent here too, instead of reaching a handler that drops it anyway --
					// and page scrolling is suppressed only for a move that is actually made.
					const action = event.key === 'ArrowUp' ? PanelAction.MoveItemUp : PanelAction.MoveItemDown;
					if (this.disabledActions.includes(action)) {
						return;
					}
					event.preventDefault();
					this.$emit('action', {
						action,
						node: this.$el
					});
				}
			},
			handleSplitPanelKeydown(event) {
				if (event.key === 'Escape') {
					event.preventDefault();
					event.stopPropagation();
					this.$emit('escape');
					return;
				}
				if (event.key === 'Tab') {
					event.preventDefault();
					this.$emit('navigate', event.shiftKey ? 'backward' : 'forward');
					return;
				}
				if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
					const actionId = event.key === 'ArrowUp' ? PanelAction.MoveItemUp : PanelAction.MoveItemDown;
					const action = this.keyboardActions.find(({
						id
					}) => id === actionId);
					if (!action) {
						return;
					}
					event.preventDefault();
					this.$emit('action', {
						action: action.id,
						itemId: this.currentItem.id,
						node: event.target,
						placement: ActionPlacement.Keyboard
					});
				}
			},
			handleFocusOut(event) {
				if ((this.actions?.length ?? 0) > 0) {
					if (!this.$el?.contains(event.relatedTarget)) {
						this.$emit('focusLeave', event.relatedTarget);
					}
					return;
				}
				const {
					relatedTarget
				} = event;
				const focusStaysInPanel = this.$el?.contains(relatedTarget) === true;
				const focusReturnsToItem = relatedTarget?.tagName === 'TEXTAREA';

				// An action of this toolbar can open a popup above the field (link, participants,
				// attachments). Tearing the toolbar down there would delete the very button that
				// popup returns focus to. The parent reports such a popup through the prop; the
				// DOM check also covers one that takes focus before the prop reaches us.
				const focusEntersActionPopup = this.actionPopupShown || this.isPopupAbovePanel(relatedTarget);
				if (focusStaysInPanel || focusReturnsToItem || focusEntersActionPopup) {
					return;
				}
				this.$emit('focusLeave');
			},
			isPopupAbovePanel(node) {
				// A popup that WRAPS the toolbar is the checklist's own popup or sheet context,
				// so leaving into it is an ordinary focus exit and must still hide the panel.
				const popup = node?.closest?.('.popup-window');
				return Boolean(popup) && popup.contains(this.$el) === false;
			},
			isItemDisabled(item) {
				return item.disabled ?? this.disabledActions.includes(item.action);
			},
			isItemActive(item) {
				return item.active ?? this.activeActions.includes(item.action);
			},
			getItemIcon(item) {
				return item.active && item.activeIcon ? item.activeIcon : item.icon;
			},
			getItemIconColor(item) {
				if (item.active && item.activeIconColor) {
					return item.activeIconColor;
				}
				return item.iconColor ?? DefaultIconColor;
			},
			handleItemClick(event, item) {
				if (!item.disabled) {
					this.$emit('action', {
						action: item.action,
						...((this.actions?.length ?? 0) > 0 ? {
							itemId: this.currentItem.id,
							placement: this.placement
						} : {}),
						node: event.currentTarget
					});
				}
			},
			handleItemMouseEnter(event, item) {
				this.currentHintElement = event.currentTarget;
				this.currentHintText = item.hint ? this.loc(item.hint) : null;
			},
			getItemTestId(item) {
				return `tasks-check-list-item-panel-${item.action}-btn`;
			},
			canShowPanelSection(sectionName) {
				return !(sectionName === PanelSection.Attachments && !tasks_v2_core.Core.getParams().features.disk);
			}
		},
		template: `
		<div
			v-if="sections.length > 0"
			class="check-list-widget-item-panel"
			:class="{ '--entity': isEntityPlacement }"
			role="toolbar"
			:aria-label="ariaLabel || loc('TASKS_V2_CHECK_LIST_ITEM_PANEL_LABEL')"
			:aria-keyshortcuts="moveItemShortcuts"
			:data-placement="placement"
			:data-testid="testId"
			@mousedown="handleMouseDown"
			@pointerenter="$emit('pointerEnter', $event)"
			@pointerleave="$emit('pointerLeave', $event)"
			@focusin="$emit('focusEnter')"
			@keydown="handleKeydown"
			@focusout="handleFocusOut"
		>
			<template v-for="section in sections" :key="section.name">
				<div class="check-list-widget-item-panel-section" :class="'--' + section.name">
					<template v-for="item in section.items" :key="item.action" >
						<span
							v-if="item.separatorBefore"
							class="check-list-widget-item-panel-section-separator ui-text-editor-toolbar-separator"
							aria-hidden="true"
						></span>
						<button
							v-hint="tooltip"
							type="button"
							class="check-list-widget-item-panel-section-item"
							:class="{
								'--disabled': item.disabled,
								'--active': item.active,
								[item.className]: Boolean(item.className),
							}"
							:disabled="item.disabled"
							:aria-label="item.hint ? loc(item.hint) : null"
							:aria-pressed="item.isToggle ? String(item.active) : null"
							:data-testid="getItemTestId(item)"
							@click="handleItemClick($event, item)"
							@mouseenter="handleItemMouseEnter($event, item)"
						>
							<BIcon
								:name="getItemIcon(item)"
								:hoverable="item.hoverable"
								:size="item.iconSize"
								:color="getItemIconColor(item)"
								aria-hidden="true"
							/>
							<span v-if="item.label">{{ loc(item.label) }}</span>
						</button>
					</template>
				</div>
			</template>
		</div>
	`
	};

	function isLinkUrlSafe(url) {
		return tasks_v2_lib_checkListBbCode.CheckListBbCode.buildLinkSource(url.trim(), '') !== '';
	}

	// @vue/component
	const CheckListLinkPopup = {
		name: 'CheckListLinkPopup',
		components: {
			Popup: ui_vue3_components_popup.Popup
		},
		props: {
			bindElement: {
				type: HTMLElement,
				required: true
			},
			popupId: {
				type: String,
				default: () => `tasks-check-list-link-popup-${main_core.Text.getRandom()}`
			}
		},
		emits: ['apply', 'close'],
		data() {
			return {
				url: '',
				labelId: `tasks-check-list-link-label-${main_core.Text.getRandom()}`
			};
		},
		computed: {
			canApply() {
				return isLinkUrlSafe(this.url);
			},
			popupOptions() {
				return {
					bindElement: this.bindElement,
					autoHide: true,
					closeByEsc: true,
					focusTrap: true,
					ariaLabel: this.loc('TASKS_V2_CHECK_LIST_LINK_POPUP_LABEL'),
					cacheable: false,
					animation: 'fading',
					targetContainer: document.body,
					offsetTop: 6,
					padding: 0
				};
			}
		},
		mounted() {
			void this.$nextTick(() => {
				this.$refs.input?.focus();
			});
		},
		methods: {
			handleApply() {
				const url = this.url.trim();
				if (!isLinkUrlSafe(url)) {
					this.$refs?.input?.focus();
					return;
				}
				this.$emit('apply', url);
			}
		},
		template: `
		<Popup
			:id="popupId"
			:options="popupOptions"
			@close="$emit('close')"
		>
			<div
				class="tasks-check-list-link-popup ui-text-editor-link-editor"
				data-testid="tasks-check-list-link-popup"
			>
				<div class="ui-text-editor-link-form">
					<div class="ui-ctl ui-ctl-textbox ui-ctl-s ui-ctl-inline ui-ctl-w100 ui-text-editor-link-textbox">
						<div class="ui-ctl-tag" :id="labelId">
							{{ loc('TASKS_V2_CHECK_LIST_ITEM_FORMAT_LINK_URL_LABEL') }}
						</div>
						<input
							ref="input"
							v-model="url"
							type="text"
							class="ui-ctl-element"
							placeholder="https://"
							:aria-labelledby="labelId"
							data-testid="link-textbox-input"
							@keydown.enter.prevent="handleApply"
						>
					</div>
					<button
						type="button"
						class="ui-text-editor-link-form-button"
						data-testid="save-link-btn"
						:aria-label="loc('TASKS_V2_CHECK_LIST_LINK_SAVE_LABEL')"
						:disabled="!canApply"
						@click="handleApply"
					>
						<span class="ui-icon-set --check-l" aria-hidden="true"></span>
					</button>
					<button
						type="button"
						class="ui-text-editor-link-form-button"
						data-testid="cancel-link-btn"
						:aria-label="loc('TASKS_V2_CHECK_LIST_LINK_CANCEL_LABEL')"
						@click="$emit('close')"
					>
						<span class="ui-icon-set --cross-l" aria-hidden="true"></span>
					</button>
				</div>
			</div>
		</Popup>
	`
	};

	const Context = Object.freeze({
		Sheet: 'sheet',
		Popup: 'popup',
		Preview: 'preview'
	});

	class CheckListNotifier extends main_core_events.EventEmitter {
		/**
		 * Toast for a finished add: one whole phrase per outcome, also announced politely to screen
		 * readers. Zero never reaches the plural forms: each zero boundary picks a different sentence
		 * instead of leaving a part of one out.
		 */
		static notifyItemsAdded(added, skipped) {
			// Contract guard: the only caller today returns earlier, showing the all-duplicates toast itself.
			if (added === 0) {
				CheckListNotifier.notifyAllDuplicates();
				return;
			}
			if (skipped === 0) {
				CheckListNotifier.#notifyAddedOnly(added);
				return;
			}
			const content = tasks_v2_lib_pluralPhrase.formatPluralPhrase('TASKS_V2_CHECK_LIST_ADD_RESULT_ADDED_SKIPPED', [added, skipped], {
				'#added#': added,
				'#skipped#': skipped
			});
			if (content !== null) {
				CheckListNotifier.#notifyResult(content, 'polite');
				return;
			}

			// Last resort: every shipped locale carries the key, so this only keeps the toast
			// non-empty if one of them ever loses it.
			CheckListNotifier.#notifyAddedOnly(added);
		}
		static notifyAllDuplicates() {
			CheckListNotifier.#notifyResult(main_core.Loc.getMessage('TASKS_V2_CHECK_LIST_ADD_RESULT_ALL_DUPLICATES'), 'polite');
		}

		/**
		 * Error toast with a "Retry" action, announced assertively. Retry renders as a non-focusable
		 * span, so screen readers are told the action can be re-triggered rather than reading the toast.
		 */
		static notifyServerError(onRetry) {
			const content = main_core.Loc.getMessage('TASKS_V2_CHECK_LIST_ADD_RESULT_ERROR');
			ui_notification.UI.Notification.Center.notify({
				content,
				actions: [{
					title: main_core.Loc.getMessage('TASKS_V2_CHECK_LIST_ADD_RESULT_RETRY'),
					events: {
						mouseup: (event, balloon) => {
							balloon.close();
							onRetry();
						}
					}
				}]
			});
			ui_a11y.LiveAnnouncer.announce(main_core.Loc.getMessage('TASKS_V2_CHECK_LIST_ADD_RESULT_ERROR_ANNOUNCE'), 'assertive');
		}

		/**
		 * Panel actions in the task card body save on their own, with no closing save behind them, so
		 * a save that did not go through is announced assertively: the row keeps showing the change
		 * the server never took, and only a reload would reveal the loss.
		 */
		static notifySaveFailed() {
			CheckListNotifier.#notifyResult(main_core.Loc.getMessage('TASKS_V2_CHECK_LIST_SAVE_FAILED'), 'assertive');
		}
		static notifySaveBlockedByEmptyItem() {
			CheckListNotifier.#notifyResult(main_core.Loc.getMessage('TASKS_V2_CHECK_LIST_SAVE_BLOCKED_EMPTY_ITEM'), 'assertive');
		}
		static #notifyAddedOnly(added) {
			CheckListNotifier.#notifyResult(main_core.Loc.getMessagePlural('TASKS_V2_CHECK_LIST_ADD_RESULT_ADDED', added, {
				'#added#': added
			}), 'polite');
		}
		static #notifyResult(content, politeness) {
			ui_notification.UI.Notification.Center.notify({
				content
			});
			ui_a11y.LiveAnnouncer.announce(content, politeness);
		}
		#interval = null;
		#timerValue = 5;
		#counter = 5;
		#content = '';
		#completed = false;
		#balloonWithTimer = null;
		constructor(params) {
			super();
			this.setEventNamespace('Tasks.V2.CheckList.CheckListNotifier');
			this.#content = params.content;
			this.#timerValue = main_core.Type.isUndefined(params.timerValue) ? this.#timerValue : params.timerValue;
		}
		showBalloonWithTimer() {
			if (this.#balloonWithTimer !== null) {
				return;
			}
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
			if (this.#complete(true)) {
				this.#balloonWithTimer?.close();
			}
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
			if (this.#complete(false)) {
				this.#balloonWithTimer?.close();
			}
		}
		#handleClosingBalloon() {
			this.#complete(true);
		}
		#complete(timerHasEnded) {
			if (this.#completed) {
				return false;
			}
			this.#completed = true;
			clearInterval(this.#interval);
			this.#interval = null;
			this.emit('complete', timerHasEnded);
			return true;
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

	const HISTORY_PUSH_TAG = 'history-push';
	class CheckListLinkPlugin extends ui_textEditor.BasePlugin {
		constructor(editor) {
			super(editor);
			this.cleanUpRegister(editor.registerCommand(ui_lexical_link.TOGGLE_LINK_COMMAND, payload => this.toggleLink(payload), ui_lexical_core.COMMAND_PRIORITY_LOW));
		}
		static getName() {
			return 'CheckListLink';
		}
		static getNodes() {
			return [ui_lexical_link.LinkNode];
		}
		importBBCode() {
			return {
				url: () => ({
					conversion: node => {
						const sourceUrl = node.getValue() || node.toPlainText();
						const safeUrl = tasks_v2_lib_checkListBbCode.CheckListBbCode.sanitizeUrl(sourceUrl);
						return {
							node: safeUrl ? ui_lexical_link.$createLinkNode(safeUrl, {
								target: '_blank'
							}) : null
						};
					},
					priority: 0
				})
			};
		}
		exportBBCode() {
			return {
				link: node => {
					const scheme = this.getEditor().getBBCodeScheme();
					const safeUrl = tasks_v2_lib_checkListBbCode.CheckListBbCode.sanitizeUrl(node.getURL());
					return {
						node: safeUrl ? scheme.createElement({
							name: 'url',
							value: safeUrl
						}) : scheme.createFragment()
					};
				}
			};
		}
		validateScheme() {
			return {
				nodes: [{
					nodeClass: ui_lexical_link.LinkNode
				}],
				bbcodeMap: {
					link: 'url'
				}
			};
		}
		toggleLink(payload) {
			if (payload === null) {
				ui_lexical_core.$addUpdateTag(HISTORY_PUSH_TAG);
				ui_lexical_link.$toggleLink(null);
				return true;
			}
			const selection = ui_lexical_core.$getSelection();
			if (!ui_lexical_core.$isRangeSelection(selection)) {
				return false;
			}
			if (this.#selectionHasLink(selection)) {
				ui_lexical_core.$addUpdateTag(HISTORY_PUSH_TAG);
				ui_lexical_link.$toggleLink(null);
				return true;
			}
			const sourceUrl = typeof payload === 'string' ? payload : payload?.url;
			const safeUrl = tasks_v2_lib_checkListBbCode.CheckListBbCode.sanitizeUrl(sourceUrl);
			if (!safeUrl) {
				return false;
			}
			const attributes = {
				target: '_blank',
				rel: 'noopener noreferrer'
			};
			if (selection.isCollapsed()) {
				ui_lexical_core.$addUpdateTag(HISTORY_PUSH_TAG);
				this.#insertLink(selection, safeUrl, attributes);
				return true;
			}
			ui_lexical_core.$addUpdateTag(HISTORY_PUSH_TAG);
			ui_lexical_link.$toggleLink(safeUrl, attributes);
			return true;
		}
		#insertLink(selection, url, attributes) {
			const linkNode = ui_lexical_link.$createLinkNode(url, attributes);
			linkNode.append(ui_lexical_core.$createTextNode(url));
			const anchor = selection.anchor;
			if (anchor.type === 'text' && anchor.getNode().isSimpleText()) {
				const anchorNode = anchor.getNode();
				const selectionOffset = anchor.offset;
				const splitNodes = anchorNode.splitText(selectionOffset);
				if (selectionOffset === 0) {
					splitNodes[0].insertBefore(linkNode);
				} else {
					splitNodes[0].insertAfter(linkNode);
				}
				linkNode.select();
				return;
			}
			ui_lexical_core.$insertNodes([linkNode]);
			if (ui_lexical_core.$isRootOrShadowRoot(linkNode.getParentOrThrow())) {
				ui_lexical_utils.$wrapNodeInElement(linkNode, ui_lexical_core.$createParagraphNode).selectEnd();
			}
		}
		#selectionHasLink(selection) {
			return selection.getNodes().some(node => {
				let currentNode = node;
				while (currentNode) {
					if (ui_lexical_link.$isLinkNode(currentNode)) {
						return true;
					}
					currentNode = currentNode.getParent();
				}
				return false;
			});
		}
	}

	const FormattingByAction = Object.freeze({
		[tasks_v2_lib_checkListBbCode.ChecklistFormattingAction.Bold]: 'bold',
		[tasks_v2_lib_checkListBbCode.ChecklistFormattingAction.Italic]: 'italic',
		[tasks_v2_lib_checkListBbCode.ChecklistFormattingAction.Underline]: 'underline',
		[tasks_v2_lib_checkListBbCode.ChecklistFormattingAction.Strikethrough]: 'strikethrough'
	});
	const FormattingActionByCode = Object.freeze({
		KeyB: tasks_v2_lib_checkListBbCode.ChecklistFormattingAction.Bold,
		KeyI: tasks_v2_lib_checkListBbCode.ChecklistFormattingAction.Italic,
		KeyU: tasks_v2_lib_checkListBbCode.ChecklistFormattingAction.Underline,
		KeyS: tasks_v2_lib_checkListBbCode.ChecklistFormattingAction.Strikethrough
	});
	const getFormattingActionFromKeyboardEvent = event => {
		if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) {
			return null;
		}
		return FormattingActionByCode[event.code] ?? null;
	};

	// Port of the non-exported ui.text-editor helper of the same name.
	const getSelectedNode = selection => {
		const anchorNode = selection.anchor.getNode();
		const focusNode = selection.focus.getNode();
		if (anchorNode === focusNode) {
			return anchorNode;
		}
		const startPoint = selection.isBackward() ? selection.focus : selection.anchor;
		return ui_lexical_selection.$isAtNodeEnd(startPoint) ? anchorNode : focusNode;
	};

	// Port of the non-exported ui.text-editor helpers `getSelectionRect` and `$getSelectionPosition`,
	// narrowed to the caret end of a live native selection: no scroll offsets and no vertical gap.
	const getNativeSelectionAnchorRect = nativeSelection => {
		const range = nativeSelection.getRangeAt(0);
		const isBackward = range.startContainer !== nativeSelection.anchorNode || range.startOffset !== nativeSelection.anchorOffset;
		const rects = range.getClientRects();
		// The caret line is taken as it comes: `top === 0` is where a line at the top edge of the window
		// stands, not a sign of a missing rectangle. Only a range without rectangles at all degrades.
		let rect = rects[isBackward ? 0 : rects.length - 1];
		if (!rect) {
			const {
				anchorNode
			} = nativeSelection;
			if (!main_core.Type.isFunction(anchorNode?.getBoundingClientRect)) {
				return null;
			}
			rect = anchorNode.getBoundingClientRect();
		}
		return {
			x: isBackward ? rect.left : rect.right,
			top: rect.top,
			bottom: rect.bottom
		};
	};

	// The document comes from the editor: a checklist is shown in a slider and in a card popup of its own.
	// `caretPositionFromPoint` is the standard API, `caretRangeFromPoint` its WebKit-only predecessor.
	const createCaretRangeFromPoint = (ownerDocument, {
		x,
		y
	}) => {
		if (main_core.Type.isFunction(ownerDocument.caretPositionFromPoint)) {
			const position = ownerDocument.caretPositionFromPoint(x, y);
			if (!position) {
				return null;
			}
			const range = ownerDocument.createRange();
			range.setStart(position.offsetNode, position.offset);
			range.collapse(true);
			return range;
		}
		if (!main_core.Type.isFunction(ownerDocument.caretRangeFromPoint)) {
			return null;
		}
		const range = ownerDocument.caretRangeFromPoint(x, y);
		range?.collapse(true);
		return range;
	};
	class CheckListEditorAdapter {
		#editor = null;
		#editorFactory;
		#onChange;
		#onSelectionChange;
		#activeSession = null;
		#changeHandler = null;
		#generation = 0;
		#destroyed = false;
		#managedAriaAttributes = new Set();
		constructor(options = {}) {
			this.#editorFactory = main_core.Type.isFunction(options.editorFactory) ? options.editorFactory : editorOptions => new ui_textEditor.BasicEditor(editorOptions);
			this.#onChange = main_core.Type.isFunction(options.onChange) ? options.onChange : () => {};
			this.#onSelectionChange = main_core.Type.isFunction(options.onSelectionChange) ? options.onSelectionChange : () => {};
		}
		activate({
			itemId,
			source,
			container,
			aria,
			selection = null,
			handlers = {}
		}) {
			if (this.#destroyed || !main_core.Type.isElementNode(container)) {
				return null;
			}
			const editor = this.#getEditor();
			if (this.#activeSession?.itemId === itemId) {
				this.#activeSession.handlers = handlers;
				editor.renderTo(container);
				this.#applyAria(aria);
				if (selection) {
					this.restoreSelection(selection);
				}
				return null;
			}
			const previousSession = this.deactivate('switch');
			editor.renderTo(container);
			this.#applyAria(aria);
			const prepared = tasks_v2_lib_checkListBbCode.CheckListBbCode.prepareForEditor(source);
			const generation = ++this.#generation;
			this.#activeSession = {
				itemId,
				originalSource: prepared.originalSource,
				currentSource: prepared.originalSource,
				dirty: false,
				generation,
				handlers
			};
			this.#unsubscribeFromChanges();
			editor.setText(prepared.editorSource, {
				discrete: true
			});
			editor.clearHistory();
			this.#subscribeToChanges(itemId, generation);
			if (selection) {
				this.restoreSelection(selection);
			}
			return previousSession;
		}
		isActive(itemId) {
			return String(this.#activeSession?.itemId) === String(itemId);
		}
		getActiveItemId() {
			return this.#activeSession?.itemId ?? null;
		}
		isDirty() {
			return this.#activeSession?.dirty === true;
		}
		replaceSource(itemId, source) {
			if (!this.isActive(itemId) || !this.#editor) {
				return {
					status: 'inactive'
				};
			}
			if (source === this.#activeSession.currentSource) {
				return {
					status: 'current'
				};
			}
			if (this.#activeSession.dirty) {
				return {
					status: 'conflict',
					itemId,
					localSource: this.#serializeSession(this.#activeSession),
					externalSource: source
				};
			}
			const prepared = tasks_v2_lib_checkListBbCode.CheckListBbCode.prepareForEditor(source);
			const generation = ++this.#generation;
			this.#unsubscribeFromChanges();
			this.#activeSession = {
				...this.#activeSession,
				originalSource: prepared.originalSource,
				currentSource: prepared.originalSource,
				dirty: false,
				generation
			};
			this.#editor.setText(prepared.editorSource, {
				discrete: true
			});
			this.#editor.clearHistory();
			this.#subscribeToChanges(itemId, generation);
			return {
				status: 'replaced',
				generation
			};
		}
		deactivate(reason = 'deactivate') {
			if (!this.#activeSession || !this.#editor) {
				return null;
			}
			const session = this.#activeSession;
			const source = this.#serializeSession(session);
			this.#unsubscribeFromChanges();
			this.#editor.clearHistory();
			this.#editor.update(() => ui_lexical_core.$setSelection(null), {
				discrete: true
			});
			this.#editor.setRootElement(null);
			main_core.Dom.remove(this.#editor.getRootContainer());
			this.#activeSession = null;
			this.#generation++;
			return {
				itemId: session.itemId,
				source,
				dirty: session.dirty,
				reason
			};
		}
		focus(point = null) {
			if (point && this.#editor && this.#activeSession) {
				this.#selectAtPoint(point);
			}
			this.#editor?.focus(null, {
				defaultSelection: 'rootEnd'
			});
		}

		/**
		 * The browser drops a drag whose element has gone, and the press that raises the editor removes
		 * exactly that element -- the read-only title it replaces. The rest of such a drag is followed
		 * here, from the caret left at the press point to the position under the pointer.
		 */
		extendSelectionTo(point) {
			if (!this.#editor || !this.#activeSession) {
				return;
			}
			const editable = this.#editor.getEditableContainer();
			const range = createCaretRangeFromPoint(editable.ownerDocument, point);
			if (!range || !editable.contains(range.startContainer)) {
				return;
			}
			const nativeSelection = editable.ownerDocument.getSelection();
			if (editable.contains(nativeSelection?.anchorNode)) {
				nativeSelection.extend(range.startContainer, range.startOffset);
			}
		}
		selectAll() {
			if (!this.#editor || !this.#activeSession) {
				return false;
			}
			this.#editor.update(() => ui_lexical_core.$selectAll(), {
				discrete: true
			});
			return true;
		}
		setAria(aria) {
			if (this.#editor && this.#activeSession) {
				this.#applyAria(aria);
			}
		}
		getVisibleState() {
			if (!this.#editor || !this.#activeSession) {
				return null;
			}
			return this.#editor.getEditorState().read(() => {
				const root = ui_lexical_core.$getRoot();
				const selection = ui_lexical_core.$getSelection();
				if (!ui_lexical_core.$isRangeSelection(selection)) {
					return {
						text: root.getTextContent(),
						start: 0,
						end: 0
					};
				}
				return {
					text: root.getTextContent(),
					start: this.#getVisibleOffset(selection.anchor),
					end: this.#getVisibleOffset(selection.focus)
				};
			});
		}
		captureVisibleRange(start, end) {
			if (!this.#editor || !this.#activeSession) {
				return null;
			}
			return this.#editor.getEditorState().read(() => {
				const currentSelection = ui_lexical_core.$getSelection();
				if (!ui_lexical_core.$isRangeSelection(currentSelection)) {
					return null;
				}
				const nodes = ui_lexical_core.$getRoot().getAllTextNodes();
				const endNodeIndex = nodes.findIndex(node => node.getKey() === currentSelection.focus.key);
				if (endNodeIndex < 0) {
					return null;
				}
				let startNode = nodes[endNodeIndex];
				let startOffset = currentSelection.focus.offset;
				let remaining = Math.max(0, end - start);
				for (let index = endNodeIndex; index >= 0 && remaining > 0; index--) {
					startNode = nodes[index];
					const available = index === endNodeIndex ? startOffset : startNode.getTextContentSize();
					if (remaining <= available) {
						startOffset = available - remaining;
						remaining = 0;
						break;
					}
					remaining -= available;
					startOffset = 0;
				}
				if (remaining > 0) {
					return null;
				}
				const selection = ui_lexical_core.$createRangeSelection();
				selection.setTextNodeRange(startNode, startOffset, currentSelection.focus.getNode(), currentSelection.focus.offset);
				return selection;
			});
		}
		captureSelection() {
			if (!this.#editor || !this.#activeSession) {
				return null;
			}
			return this.#editor.getEditorState().read(() => {
				const selection = ui_lexical_core.$getSelection();
				return ui_lexical_core.$isRangeSelection(selection) ? selection.clone() : null;
			});
		}
		restoreSelection(snapshot) {
			if (!this.#editor || !this.#activeSession || !ui_lexical_core.$isRangeSelection(snapshot)) {
				return false;
			}
			this.#editor.update(() => {
				ui_lexical_core.$setSelection(snapshot.clone());
			}, {
				discrete: true
			});
			return true;
		}
		getSelectionAnchorRect() {
			const nativeSelection = this.#getEditableNativeSelection();
			return nativeSelection === null ? null : getNativeSelectionAnchorRect(nativeSelection);
		}
		dispatchFormatting(action, payload = null) {
			if (!this.#editor || !this.#activeSession) {
				return false;
			}
			if (action === tasks_v2_lib_checkListBbCode.ChecklistFormattingAction.Link) {
				return this.#editor.dispatchCommand(ui_lexical_link.TOGGLE_LINK_COMMAND, payload);
			}
			const format = FormattingByAction[action];
			return format ? this.#editor.dispatchCommand(ui_lexical_core.FORMAT_TEXT_COMMAND, format) : false;
		}
		getActiveFormattingActions() {
			if (!this.#editor || !this.#activeSession) {
				return [];
			}
			return this.#editor.getEditorState().read(() => {
				const selection = ui_lexical_core.$getSelection();
				if (!ui_lexical_core.$isRangeSelection(selection)) {
					return [];
				}
				const selectedTextNodes = selection.getNodes().filter(node => ui_lexical_core.$isTextNode(node));
				const actions = Object.entries(FormattingByAction).filter(([, format]) => {
					return selection.hasFormat(format) || selectedTextNodes.some(node => node.hasFormat(format));
				}).map(([action]) => action);
				if (this.#selectionHasLink(selection)) {
					actions.push(tasks_v2_lib_checkListBbCode.ChecklistFormattingAction.Link);
				}
				return actions;
			});
		}

		/**
		 * Emits the selection report again for a caller outside a command handler -- the release of a
		 * pointer drag, whose own reports were refused while the button was held. Opens the read context
		 * `#hasFormattableSelection()` needs and a command handler provides.
		 */
		reportSelection() {
			if (!this.#editor || !this.#activeSession) {
				return;
			}
			this.#editor.getEditorState().read(() => this.#emitSelectionChange());
		}
		removeVisibleRange(range) {
			if (!this.#editor || !this.#activeSession || !ui_lexical_core.$isRangeSelection(range)) {
				return false;
			}
			this.#editor.update(() => {
				const selection = range.clone();
				ui_lexical_core.$setSelection(selection);
				selection.removeText();
			});
			return true;
		}
		destroy() {
			if (this.#destroyed) {
				return;
			}
			this.deactivate('destroy');
			this.#editor?.destroy();
			this.#editor = null;
			this.#destroyed = true;
		}
		#getEditor() {
			if (this.#editor) {
				return this.#editor;
			}
			this.#editor = this.#editorFactory({
				plugins: ['RichText', 'Paragraph', 'Clipboard', 'Bold', 'Italic', 'Underline', 'Strikethrough', 'History', 'Placeholder', CheckListLinkPlugin],
				hideToolbar: true,
				toolbar: [],
				floatingToolbar: []
			});
			this.#editor.registerCommand(ui_lexical_core.PASTE_COMMAND, event => this.#handlePaste(event), ui_lexical_core.COMMAND_PRIORITY_HIGH);
			this.#editor.registerCommand(ui_lexical_core.KEY_ENTER_COMMAND, event => this.#handleEnter(event), ui_lexical_core.COMMAND_PRIORITY_HIGH);
			this.#editor.registerCommand(ui_lexical_core.KEY_ESCAPE_COMMAND, event => this.#handleSessionKey('onEscape', event), ui_lexical_core.COMMAND_PRIORITY_HIGH);
			this.#editor.registerCommand(ui_lexical_core.KEY_TAB_COMMAND, event => this.#handleSessionKey('onTab', event), ui_lexical_core.COMMAND_PRIORITY_HIGH);
			this.#editor.registerCommand(ui_lexical_core.KEY_DOWN_COMMAND, event => this.#handleModifier(event), ui_lexical_core.COMMAND_PRIORITY_HIGH);
			this.#editor.registerCommand(ui_lexical_core.SELECTION_CHANGE_COMMAND, () => {
				this.#emitSelectionChange();
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_HIGH);
			return this.#editor;
		}
		#subscribeToChanges(itemId, generation) {
			this.#changeHandler = () => {
				const session = this.#activeSession;
				if (!session || session.itemId !== itemId || session.generation !== generation) {
					return;
				}
				session.dirty = true;
				const source = this.#serializeSession(session);
				session.currentSource = source;
				this.#onChange(source, {
					itemId,
					generation,
					dirty: true
				});
			};
			this.#editor.subscribe('onChange', this.#changeHandler);
		}
		#unsubscribeFromChanges() {
			if (this.#changeHandler && this.#editor) {
				this.#editor.unsubscribe('onChange', this.#changeHandler);
			}
			this.#changeHandler = null;
		}
		#serializeSession(session) {
			return tasks_v2_lib_checkListBbCode.CheckListBbCode.serializeFromEditor(this.#editor.getText(), session.originalSource, session.dirty);
		}
		#emitSelectionChange() {
			this.#onSelectionChange(this.getActiveFormattingActions(), {
				itemId: this.#activeSession?.itemId ?? null,
				generation: this.#activeSession?.generation ?? null,
				hasFormattableSelection: this.#hasFormattableSelection()
			});
		}

		/**
		 * The editor is raised over a title the pointer has already pressed, and the focus event that
		 * raises it carries no coordinates. The editor takes the box the title had, so replaying the press
		 * point over it keeps the caret where the user aimed.
		 */
		#selectAtPoint(point) {
			// The editable container, not the scroller around it: only what it holds is editable text.
			const editable = this.#editor.getEditableContainer();
			const range = createCaretRangeFromPoint(editable.ownerDocument, point);
			if (!range || !editable.contains(range.startContainer)) {
				return;
			}
			this.#editor.update(() => {
				const selection = ui_lexical_core.$createRangeSelection();
				selection.applyDOMRange(range);
				// An unresolved point leaves the fresh selection on the root: the caret then stays with
				// the default of `focus()`.
				if (selection.anchor.key !== ui_lexical_core.$getRoot().getKey()) {
					ui_lexical_core.$setSelection(selection);
				}
			}, {
				discrete: true
			});
		}

		/**
		 * Premises shared by `#hasFormattableSelection()` and `getSelectionAnchorRect()`: an editable
		 * session and a non-empty native selection inside it. Reads the live native selection, so unlike
		 * the editor state it needs no read context.
		 */
		#getEditableNativeSelection() {
			if (!this.#editor || !this.#activeSession || !this.#editor.isEditable()) {
				return null;
			}
			const nativeSelection = window.getSelection();
			if (nativeSelection === null || nativeSelection.isCollapsed) {
				return null;
			}
			return this.#editor.getScrollerContainer().contains(nativeSelection.anchorNode) ? nativeSelection : null;
		}

		/**
		 * Repeats `FloatingToolbarPlugin#shouldShowDialog` minus its check for a visible dialog:
		 * the checklist panel keeps its own holds in the component.
		 * Reads the selection of the active editor state, so it needs a command handler or a read context.
		 */
		#hasFormattableSelection() {
			if (this.#getEditableNativeSelection() === null || this.#editor.isComposing()) {
				return false;
			}
			const selection = ui_lexical_core.$getSelection();
			if (!ui_lexical_core.$isRangeSelection(selection) || selection.isCollapsed()) {
				return false;
			}
			const unformattedParent = ui_lexical_utils.$findMatchingParent(selection.anchor.getNode(),
			// eslint-disable-next-line no-underscore-dangle
			node => (node.__flags & ui_textEditor.Constants.UNFORMATTED) !== 0);
			const textContent = selection.getTextContent();
			if (unformattedParent || textContent === '') {
				return false;
			}
			if (textContent.replaceAll('\n', '') === '') {
				return false;
			}
			return ui_lexical_core.$isTextNode(getSelectedNode(selection));
		}
		#selectionHasLink(selection) {
			return selection.getNodes().some(node => {
				let currentNode = node;
				while (currentNode) {
					if (ui_lexical_link.$isLinkNode(currentNode)) {
						return true;
					}
					currentNode = currentNode.getParent();
				}
				return false;
			});
		}
		#handlePaste(event) {
			const selection = ui_lexical_core.$getSelection();
			if (!ui_lexical_core.$isRangeSelection(selection) || !event?.clipboardData) {
				return false;
			}
			event.preventDefault();
			selection.insertText(event.clipboardData.getData('text/plain'));
			return true;
		}
		#handleModifier(event) {
			const action = getFormattingActionFromKeyboardEvent(event);
			if (!action) {
				return false;
			}
			event.preventDefault();
			this.dispatchFormatting(action);
			return true;
		}
		#handleEnter(event) {
			if (!event || !this.#activeSession) {
				return false;
			}
			if (event.ctrlKey || event.metaKey) {
				event.stopPropagation();
				return true;
			}
			event.preventDefault();
			return this.#handleSessionKey('onEnter', event);
		}
		#handleSessionKey(handlerName, event) {
			const handler = this.#activeSession?.handlers?.[handlerName];
			if (!main_core.Type.isFunction(handler)) {
				return false;
			}
			return handler(event) !== false;
		}
		#getVisibleOffset(point) {
			const selection = ui_lexical_core.$createRangeSelection();
			selection.anchor.set(ui_lexical_core.$getRoot().getKey(), 0, 'element');
			selection.focus.set(point.key, point.offset, point.type);
			return selection.getTextContent().length;
		}
		#applyAria(aria) {
			const editable = this.#editor.getEditableContainer();
			this.#managedAriaAttributes.forEach(attribute => editable.removeAttribute(attribute));
			this.#managedAriaAttributes.clear();
			editable.setAttribute('role', 'textbox');
			editable.setAttribute('aria-multiline', 'true');
			if (main_core.Type.isStringFilled(aria)) {
				this.#setAriaAttribute(editable, 'aria-label', aria);
				return;
			}
			if (main_core.Type.isPlainObject(aria)) {
				Object.entries(aria).forEach(([name, value]) => {
					if (name === 'role') {
						if (main_core.Type.isStringFilled(value)) {
							this.#setAriaAttribute(editable, 'role', value);
						}
						return;
					}
					const attribute = name.startsWith('aria-') ? name : `aria-${name}`;
					if (main_core.Type.isStringFilled(value)) {
						this.#setAriaAttribute(editable, attribute, value);
					}
				});
			}
		}
		#setAriaAttribute(editable, attribute, value) {
			editable.setAttribute(attribute, value);
			this.#managedAriaAttributes.add(attribute);
		}
	}

	function isAvailableForItem(descriptor, options) {
		if (options.item.parentId !== 0) {
			let placement = descriptor.placement;
			if (options.isGroupMode) {
				placement = descriptor.groupPlacement ?? placement;
			}
			return placement === options.placement;
		}
		return descriptor.rootPlacement === options.placement || descriptor.rootVisible === true && descriptor.placement === options.placement;
	}
	function resolveActions(options) {
		if (options.item.parentId === 0 && options.placement === ActionPlacement.Entity) {
			return [];
		}
		return getActionDescriptors().filter(descriptor => isAvailableForItem(descriptor, options)).filter(descriptor => descriptor.isAvailable(options)).sort((first, second) => {
			const firstOrder = getActionOrder(first, options);
			const secondOrder = getActionOrder(second, options);
			return firstOrder - secondOrder;
		}).map(descriptor => ({
			...descriptor,
			active: descriptor.isSelected(options)
		}));
	}
	function getActionOrder(descriptor, options) {
		if (options.item.parentId === 0) {
			return descriptor.rootOrder ?? descriptor.order;
		}
		if (options.isGroupMode) {
			return descriptor.groupOrder ?? descriptor.order;
		}
		return descriptor.order;
	}

	const PanelType = Object.freeze({
		None: 'none',
		Text: 'text',
		Entity: 'entity'
	});
	const PanelOpenSource = Object.freeze({
		Pointer: 'pointer',
		Keyboard: 'keyboard',
		Programmatic: 'programmatic'
	});
	function createPanelState() {
		return {
			activePanel: PanelType.None,
			openSource: null,
			textItemId: null,
			entityItemId: null,
			entityAnchor: null,
			returnFocusElement: null,
			pointerInside: false,
			focusInside: false,
			popupOpen: false,
			participantSelectorOpen: false
		};
	}
	function getActiveItemId(state) {
		return state.activePanel === PanelType.Text ? state.textItemId : state.entityItemId;
	}
	function openTextPanel(_state, itemId, source, returnFocusElement = null) {
		return {
			...createPanelState(),
			activePanel: PanelType.Text,
			openSource: source,
			textItemId: itemId,
			returnFocusElement
		};
	}
	function openEntityPanel(state, itemId, source, anchor = null, returnFocusElement = null) {
		if (source === PanelOpenSource.Pointer && state.activePanel === PanelType.Entity && state.openSource !== PanelOpenSource.Pointer) {
			return state;
		}
		if (source === PanelOpenSource.Pointer && state.activePanel === PanelType.Text) {
			if (String(state.textItemId) === String(itemId)) {
				return closeEntityPanel(state);
			}
			return {
				...state,
				entityItemId: itemId,
				entityAnchor: anchor,
				pointerInside: true
			};
		}
		return {
			...createPanelState(),
			activePanel: PanelType.Entity,
			openSource: source,
			entityItemId: itemId,
			entityAnchor: anchor,
			returnFocusElement,
			pointerInside: source === PanelOpenSource.Pointer
		};
	}
	function closeEntityPanel(state) {
		if (state.entityItemId === null) {
			return state;
		}
		if (state.activePanel === PanelType.Entity) {
			return createPanelState();
		}
		return {
			...state,
			entityItemId: null,
			entityAnchor: null,
			pointerInside: false
		};
	}
	function closePanel(state) {
		return createPanelState();
	}
	function setPanelHold(state, hold, value) {
		if (state[hold] === value) {
			return state;
		}
		return {
			...state,
			[hold]: value
		};
	}
	function shouldClosePointerPanel(state) {
		return state.entityItemId !== null && (state.activePanel === PanelType.Text || state.openSource === PanelOpenSource.Pointer) && !state.pointerInside && !state.focusInside && !state.popupOpen && !state.participantSelectorOpen;
	}
	function closePanelForMissingAnchor(state, itemId) {
		if (state.entityItemId === itemId) {
			return closeEntityPanel(state);
		}
		return getActiveItemId(state) === itemId ? closePanel() : state;
	}

	const TextPanelPlacement = Object.freeze({
		Above: 'above',
		Below: 'below'
	});

	// The offset the checklist already keeps between its panels and the edge of the list.
	const DefaultPaddingOffset = 18;

	// The gap the editor's floating toolbar keeps between itself and the caret line.
	const DefaultVerticalGap = 10;
	function clamp(value, min, max) {
		return Math.min(Math.max(value, min), max);
	}

	/**
	 * Centres the panel on the caret end of the selection and keeps it within the visible window:
	 * below the line when the header leaves no room above, unless the panel would leave the window.
	 * Coordinates are those of the visible window; measuring them and writing the styles is the caller's.
	 */
	function computeTextPanelPosition(input) {
		const {
			anchor,
			panel,
			visibleWindow,
			padding = DefaultPaddingOffset,
			gap = DefaultVerticalGap,
			topBoundary = 0
		} = input;

		// A window narrower than the panel leaves no range to hold it in, and the left edge takes it.
		const maxLeft = Math.max(padding, visibleWindow.width - panel.width - padding);
		const left = clamp(anchor.x - panel.width / 2, padding, maxLeft);
		const above = anchor.top - panel.height - gap;
		const below = anchor.bottom + gap;
		const fitsBelow = below + panel.height <= visibleWindow.height;
		const placement = above >= topBoundary || !fitsBelow ? TextPanelPlacement.Above : TextPanelPlacement.Below;
		const top = placement === TextPanelPlacement.Above ? above : below;
		const visible = anchor.bottom > topBoundary && anchor.top < visibleWindow.height && top >= 0;
		return {
			left,
			top,
			placement,
			visible
		};
	}

	/* global Partial */

	const openConflictTaskIds = new Set();
	const taskViewCounts = new Map();
	const acquireTaskView = taskId => {
		taskViewCounts.set(taskId, (taskViewCounts.get(taskId) ?? 0) + 1);
	};
	const releaseTaskView = taskId => {
		const remaining = (taskViewCounts.get(taskId) ?? 0) - 1;
		if (remaining <= 0) {
			taskViewCounts.delete(taskId);
			return 0;
		}
		taskViewCounts.set(taskId, remaining);
		return remaining;
	};
	const supportsCheckVisibility = main_core.Type.isFunction(window.Element?.prototype?.checkVisibility);

	// How far the text toolbar sinks below the row top, measured from its bottom edge.
	const textPanelRowInset = 10;
	// The list keeps its own top edge clear of the entity toolbar even where no header floats over it.
	const entityPanelTopInset = 28;
	// The clear space the entity toolbar keeps between itself and the text of a title being edited.
	// The same space the text toolbar keeps from its own line, and it is what makes the decision steady
	// under typing: the toolbar goes before the glyphs reach it, not once they already run under it.
	const entityPanelTextGap = 10;
	const linkPopupFocusRestoreFrameLimit = 120;
	const doRectsOverlap = (first, second) => first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top;

	// Line boxes of the text itself. A range over the title node would report the width of the column
	// the title is stretched to, and a toolbar standing at the edge of that column would never be clear
	// of it -- while what has to stay clear is the glyphs.
	const getTextLineRects = node => {
		const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
		const range = document.createRange();
		const rects = [];
		let textNode = walker.nextNode();
		while (textNode) {
			range.selectNodeContents(textNode);
			rects.push(...range.getClientRects());
			textNode = walker.nextNode();
		}
		return rects;
	};

	// A design-system control paints its own box over a native input kept at zero opacity, and the
	// browser still stops on that input by Tab. InteractivityChecker reads any zero opacity as
	// invisible, so the checklist keeps such controls in the walk itself: same checks as isTabbable,
	// with opacity left out of the visibility one.
	function isVisuallyHiddenTabStop(node) {
		if (!node.isConnected || node.closest('[inert]') || !node.matches(ui_a11y.FocusNavigator.FOCUSABLE_SELECTOR) || ui_a11y.InteractivityChecker.hasNegativeTabIndex(node) || ui_a11y.InteractivityChecker.isDisabled(node)) {
			return false;
		}
		if (supportsCheckVisibility) {
			return node.checkVisibility({
				visibilityProperty: true,
				opacityProperty: false
			});
		}
		const hasGeometry = node.offsetWidth > 0 || node.offsetHeight > 0 || node.getClientRects().length > 0;
		return hasGeometry && getComputedStyle(node).visibility === 'visible';
	}

	// @vue/component
	const CheckList = {
		name: 'TaskCheckList',
		inheritAttrs: false,
		components: {
			CheckListWidget,
			CheckListItemPanel,
			CheckListLinkPopup,
			CheckListStub,
			ConflictPopup: ui_vue3.BitrixVue.defineAsyncComponent('tasks.v2.component.fields.check-list-conflict-popup', 'ConflictPopup'),
			UiButton: ui_vue3_components_button.Button,
			BIcon: ui_iconSet_api_vue.BIcon,
			BMenu: ui_system_menu_vue.BMenu
		},
		provide() {
			return {
				setItemsRef: this.setItemsRef,
				getItemsRef: this.getItemsRef,
				checkListKeyboardRouter: {
					routeTab: (itemId, event) => this.routeCheckListTab(itemId, event),
					routeEscape: (itemId, event) => this.routeCheckListEscape(itemId, event)
				},
				checkListEditor: {
					activate: options => this.activateItemEditor(options),
					deactivate: reason => this.deactivateItemEditor(reason),
					finalizeBlur: (itemId, event) => this.finalizeItemEditorBlur(itemId, event),
					handleEscape: event => this.handleItemEscape(event, true),
					dispatchFormatting: (action, payload) => this.editorAdapter.dispatchFormatting(action, payload),
					captureSelection: () => this.editorAdapter.captureSelection(),
					restoreSelection: selection => this.editorAdapter.restoreSelection(selection),
					getActiveFormattingActions: () => this.editorAdapter.getActiveFormattingActions(),
					getVisibleState: () => this.editorAdapter.getVisibleState(),
					captureVisibleRange: (start, end) => this.editorAdapter.captureVisibleRange(start, end),
					removeVisibleRange: range => this.editorAdapter.removeVisibleRange(range),
					setAria: aria => this.editorAdapter.setAria(aria),
					setParticipantSelectorOpen: open => this.setParticipantSelectorOpen(open),
					focus: point => this.focusItemEditor(point),
					isActive: itemId => this.editorAdapter.isActive(itemId)
				}
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
				notifiers: ui_vue3.markRaw(new Map()),
				linkPopupId: `tasks-check-list-link-popup-${main_core.Text.getRandom()}`,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				ButtonIcon: ui_vue3_components_button.ButtonIcon,
				Outline: ui_iconSet_api_vue.Outline,
				ActionPlacement,
				checkListMeta
			};
		},
		data() {
			return {
				itemId: null,
				panelState: createPanelState(),
				hoveredEntityTarget: null,
				itemPanelStyles: {
					top: '0',
					display: 'flex'
				},
				entityPanelStyles: {
					top: '0',
					left: 'auto',
					right: '18px',
					display: 'none'
				},
				isItemPanelFreeze: false,
				isItemPanelActionPopupShown: false,
				isFocusInItemPanel: false,
				isUploadingItemFiles: false,
				itemsRefs: {},
				pendingFocusItemId: null,
				pendingFocusHighlight: false,
				pendingFocusToken: 0,
				isDeactivatingItemEditor: false,
				isForwardMenuShown: false,
				forwardMenuSectionCode: 'createSection',
				forwardBindElement: null,
				forwardContextItemId: null,
				forwardSelectedItemIds: [],
				linkPopupBindElement: null,
				linkPopupItemId: null,
				selectedFormattingActions: [],
				suppressTitlePanelItemId: null,
				isFreeze: false,
				closing: false,
				conflicts: null
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
			textPanelItem() {
				return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getById`](this.panelState.textItemId);
			},
			itemPanelIsShown() {
				return this.panelState.activePanel === PanelType.Text;
			},
			entityPanelItem() {
				return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getById`](this.panelState.entityItemId);
			},
			entityPanelAvailable() {
				return this.componentShown;
			},
			textPanelActions() {
				return this.resolvePanelActions(this.textPanelItem, ActionPlacement.Text, this.selectedFormattingActions);
			},
			entityPanelActions() {
				return this.resolvePanelActions(this.entityPanelItem, ActionPlacement.Entity);
			},
			textPanelKeyboardActions() {
				return this.resolvePanelActions(this.textPanelItem, ActionPlacement.Keyboard);
			},
			entityPanelKeyboardActions() {
				return this.resolvePanelActions(this.entityPanelItem, ActionPlacement.Keyboard);
			},
			itemGroupModeSelected() {
				if (!this.currentItem) {
					return false;
				}
				return this.currentItem.groupMode?.selected === true;
			},
			isItemPanelHeld() {
				return this.isItemPanelFreeze || this.isItemPanelActionPopupShown || this.isFocusInItemPanel || this.isUploadingItemFiles;
			},
			// A hold means the panel is mid-action, so a selection that its own action dropped must not
			// close it. Same set finalizeItemEditorBlur() keeps the editor alive for.
			isTextPanelHeld() {
				return this.isItemPanelHeld || this.panelState?.focusInside === true || this.panelState?.popupOpen === true || this.panelState?.participantSelectorOpen === true;
			},
			forwardContextItem() {
				return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getById`](this.forwardContextItemId);
			},
			forwardMenuOptions() {
				if (!this.forwardContextItem) {
					return null;
				}
				return {
					id: `check-list-item-forward-menu-${this.forwardContextItem.id}`,
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
				if (!this.forwardContextItem) {
					return [];
				}

				// Unlike the picker, forwarding doesn't filter lists by edit right (preserves prior behavior).
				return buildCheckListPickerMenuItems({
					checkLists: this.parentCheckLists,
					excludedCheckListId: this.forwardContextItem.parentId,
					existingItemIdPrefix: 'ForwardMenuCheckList',
					onSelectCheckList: checkList => this.handleForwardMenuSelect(checkList),
					createNewItem: {
						id: `ForwardMenuCreateNew-${this.forwardContextItem.id}`,
						title: this.loc('TASKS_V2_CHECK_LIST_ITEM_FORWARD_MENU_CREATE'),
						sectionCode: this.forwardMenuSectionCode,
						onClick: () => this.handleForwardMenuCreateNew()
					}
				});
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
			showInlineCloseButton() {
				return (this.context === Context.Popup || this.context === Context.Sheet && this.stub) && !this.parentItemDragged;
			},
			showSheetCloseButton() {
				return this.context === Context.Sheet && !this.parentItemDragged;
			},
			canCheckListAdd() {
				if (!this.isEdit) {
					return true;
				}
				return this.task.rights.checklistAdd;
			},
			hasIndentTarget() {
				return this.checkListManager.getIndentTarget(this.currentItem) !== null;
			}
		},
		watch: {
			async entityPanelActions() {
				await this.$nextTick();
				this.schedulePanelPositionUpdate();
			},
			forwardContextItem(value, previousValue) {
				if (!value && previousValue && this.isForwardMenuShown) {
					this.closeForwardMenu(false);
				}
			},
			draggedCheckListId(value) {
				if (value !== null && value !== undefined) {
					this.hoveredEntityTarget = null;
					this.hideEntityPanel();
				}
			},
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
					this.syncActiveEditorSource?.();
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
			this.entityPanelHideTimer = null;
			this.panelPositionFrameId = null;
			this.linkPopupFocusFrameId = null;
			this.linkPopupFocusGeneration = 0;
			this.isUnmounted = false;
			this.escapeKeyUpTarget = null;
			this.escapeKeyUpHandler = null;
			this.escapeKeyUpBlurHandler = null;
			this.escapeClosingByEscTimer = null;
			this.savedRange = null;
			this.lastSelectionAnchor = null;
			this.isSelectingWithPointer = false;
			this.isFollowingPointerSelection = false;
			this.pointerSelectionTarget = null;
			this.pointerSelectionHandlers = null;
			this.pointerSelectionBlurHandler = null;
			this.activeEditorLayer = null;
			this.editorAdapter = new CheckListEditorAdapter({
				onChange: this.handleEditorChange,
				onSelectionChange: this.handleEditorSelectionChange
			});
		},
		mounted() {
			acquireTaskView(this.taskId);
			if (this.isAutonomous || this.isPreview) {
				this.subscribeToEvents();
			}
			main_core_events.EventEmitter.subscribe('tasks:checkList:manualConflicts', this.handleManualConflicts);
			if (main_core.Type.isFunction(window.ResizeObserver) && this.$refs.list) {
				this.resizeObserver = new window.ResizeObserver(this.schedulePanelPositionUpdate);
				this.resizeObserver.observe(this.$refs.list);
			}
		},
		async beforeUnmount() {
			this.editorAdapter?.destroy();
			this.releaseEscapeKeyUpSuppression(false);
			this.releasePointerSelection();
			this.isUnmounted = true;
			this.linkPopupFocusGeneration++;
			this.cancelEntityPanelHide();
			this.cancelPanelPositionUpdate();
			if (this.linkPopupFocusFrameId !== null) {
				cancelAnimationFrame(this.linkPopupFocusFrameId);
				this.linkPopupFocusFrameId = null;
			}
			this.closeActivePanel();
			this.resizeObserver?.disconnect();
			this.resizeObserver = null;
			this.cleanNotifiers();
			main_core_events.EventEmitter.unsubscribe('tasks:checkList:manualConflicts', this.handleManualConflicts);
			const wasConflictOwner = this.conflicts !== null;
			const remainingViews = releaseTaskView(this.taskId);
			if (remainingViews <= 0) {
				openConflictTaskIds.delete(this.taskId);
				tasks_v2_provider_service_checkListService.checkListService.clearPullConflicts(this.taskId);
			} else if (wasConflictOwner) {
				openConflictTaskIds.delete(this.taskId);
				main_core_events.EventEmitter.emit('tasks:checkList:manualConflicts', {
					taskId: this.taskId
				});
			}
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
			syncActiveEditorSource() {
				const itemId = this.editorAdapter?.getActiveItemId();
				if (itemId === null || itemId === undefined) {
					return null;
				}
				const item = this.checkListManager?.getItem(itemId);
				if (!item) {
					return this.deactivateItemEditor('item-deleted');
				}
				return this.editorAdapter.replaceSource(itemId, item.title);
			},
			activateItemEditor(options) {
				const previousLayer = this.activeEditorLayer;
				if (previousLayer && previousLayer !== options.layer) {
					previousLayer.deactivateEditorView();
				}
				const previousSession = this.editorAdapter.activate(options);
				previousLayer?.commitEditorSession?.(previousSession);
				this.activeEditorLayer = options.layer;
				options.layer.activateEditorView();
				return previousSession;
			},
			focusItemEditor(point = null) {
				this.editorAdapter.focus(point);
				// Only a press that raised the editor leaves a drag the browser no longer extends by itself.
				this.isFollowingPointerSelection = point !== null && this.isSelectingWithPointer;
			},
			deactivateItemEditor(reason = 'deactivate') {
				if (this.isDeactivatingItemEditor) {
					return null;
				}
				this.isDeactivatingItemEditor = true;
				try {
					const session = this.editorAdapter.deactivate(reason);
					this.activeEditorLayer?.deactivateEditorView();
					this.activeEditorLayer = null;
					return session;
				} finally {
					this.isDeactivatingItemEditor = false;
				}
			},
			finalizeItemEditorBlur(itemId, event) {
				if (!this.editorAdapter.isActive(itemId)) {
					return null;
				}
				const relatedTarget = event?.relatedTarget;
				const remainsInsideItem = relatedTarget instanceof Node && this.getItemRowNode(itemId)?.contains(relatedTarget);
				if (remainsInsideItem || this.isItemPanelHeld || this.panelState?.focusInside || this.panelState?.popupOpen || this.panelState?.participantSelectorOpen) {
					return null;
				}
				return this.deactivateItemEditor('blur');
			},
			handleListFocusOut(event) {
				const itemId = this.editorAdapter?.getActiveItemId();
				if (itemId === null || itemId === undefined || !(event?.target instanceof Node)) {
					return;
				}
				if (!this.getItemRowNode(itemId)?.contains(event.target)) {
					return;
				}
				const layer = this.activeEditorLayer;
				const session = this.finalizeItemEditorBlur(itemId, event);
				layer?.commitEditorSession?.(session, event);
			},
			setParticipantSelectorOpen(open) {
				if (this.panelState) {
					this.applyPanelState(setPanelHold(this.panelState, 'participantSelectorOpen', open));
				}
			},
			handleEditorChange(source, context) {
				if (!this.editorAdapter.isActive(context.itemId)) {
					return;
				}
				this.getItemsRef(context.itemId)?.handleEditorInput(source);

				// The text the toolbar yields to grows and shrinks under the caret.
				this.refreshEntityPanelDecision();
			},
			handleEditorSelectionChange(actions, context) {
				if (context.itemId !== null) {
					this.handleFormattingSelectionChange(context.itemId, actions);
					this.syncTextPanelWithSelection(context.itemId, context.hasFormattableSelection === true);
					// The click that puts the caret in a row is also what starts editing it, and the toolbar
					// hovered up a moment earlier was placed while the row was not being edited yet. A caret
					// moved by key arrives the same way, so both are answered here.
					this.refreshEntityPanelDecision();
				}
			},
			syncTextPanelWithSelection(itemId, hasFormattableSelection) {
				// The root row keeps raising its panel on focus, so selection does not drive it.
				const item = this.checkListManager?.getItem?.(itemId);
				if (!item || item.parentId === 0) {
					return;
				}
				const shownForItem = this.panelState.activePanel === PanelType.Text && String(this.panelState.textItemId) === String(itemId);
				if (hasFormattableSelection) {
					// While the button is held the panel neither opens nor moves: handleListPointerDown()
					// explains why, and the release reports the selection again.
					if (this.isSelectingWithPointer) {
						return;
					}
					if (shownForItem) {
						// A selection moved under a shown panel moves the panel. The move is booked with the
						// frame rather than written here: a position written now would be overwritten by that
						// frame before it is ever drawn, and the booking coalesces with any other for the frame.
						this.schedulePanelPositionUpdate();
						return;
					}
					const editor = this.getItemsRef(itemId)?.$refs.growingTextArea?.$el ?? null;
					this.showItemPanel(itemId, PanelOpenSource.Keyboard, editor);
					return;
				}
				if (shownForItem && !this.isTextPanelHeld && !this.editorAdapter.isActive(itemId)) {
					this.hideItemPanel(itemId);
					// The row is free of the text panel now, so the actions can have it back.
					this.refreshEntityPanelDecision();
				}
			},
			...ui_vue3_vuex.mapActions(tasks_v2_const.Model.Interface, ['addCheckListItemToDeleting', 'removeCheckListItemFromDeleting', 'executeCheckListCompletionCallbacks']),
			applyPanelState(nextState) {
				this.panelState = nextState;
			},
			releaseEscapeKeyUpSuppression(restoreClosingByEsc = true) {
				if (this.escapeKeyUpTarget && this.escapeKeyUpHandler) {
					main_core.Event.unbind(this.escapeKeyUpTarget, 'keyup', this.escapeKeyUpHandler, {
						capture: true
					});
				}
				if (this.escapeKeyUpTarget && this.escapeKeyUpBlurHandler) {
					main_core.Event.unbind(this.escapeKeyUpTarget, 'blur', this.escapeKeyUpBlurHandler);
				}
				this.escapeKeyUpTarget = null;
				this.escapeKeyUpHandler = null;
				this.escapeKeyUpBlurHandler = null;
				clearTimeout(this.escapeClosingByEscTimer);
				this.escapeClosingByEscTimer = null;
				if (restoreClosingByEsc) {
					this.escapeClosingByEscTimer = setTimeout(() => {
						this.$refs.childComponent?.setClosingByEsc?.(true);
						this.escapeClosingByEscTimer = null;
					}, 0);
				}
			},
			suppressNextEscapeKeyUp() {
				this.releaseEscapeKeyUpSuppression(false);
				this.$refs.childComponent?.setClosingByEsc?.(false);
				const ownerWindow = this.$refs.list?.ownerDocument?.defaultView ?? window;
				this.escapeKeyUpTarget = ownerWindow;
				this.escapeKeyUpHandler = event => {
					this.releaseEscapeKeyUpSuppression();
					if (event.key === 'Escape') {
						event.preventDefault();
						event.stopPropagation();
					}
				};
				this.escapeKeyUpBlurHandler = () => this.releaseEscapeKeyUpSuppression();
				main_core.Event.bind(ownerWindow, 'keyup', this.escapeKeyUpHandler, {
					capture: true
				});
				main_core.Event.bind(ownerWindow, 'blur', this.escapeKeyUpBlurHandler);
			},
			/**
			 * A drag reports its selection all the way through, and a panel answering every report travels
			 * with the pointer. So the reports of a held button are refused and the release asks the adapter
			 * once more: the panel appears once, at the end the caret stopped at. Only the pointer is held
			 * back -- a selection made with the keyboard sends no gesture and keeps showing the panel at once.
			 * The listeners of the end live for the gesture only, and the capture phase carries the pointer
			 * ones past anything a descendant stops.
			 */
			handleListPointerDown(event) {
				if (event.button !== 0) {
					return;
				}
				this.releasePointerSelection();
				const ownerWindow = this.$refs.list?.ownerDocument?.defaultView ?? window;
				this.isSelectingWithPointer = true;
				this.pointerSelectionTarget = ownerWindow;
				this.pointerSelectionHandlers = {
					pointerup: () => this.finishPointerSelection(),
					pointercancel: () => this.finishPointerSelection(),
					// A button released past the window sends no event of its own, so the next move carrying
					// nothing pressed is what proves the gesture is over.
					pointermove: moveEvent => {
						if (moveEvent.buttons === 0) {
							this.finishPointerSelection();
							return;
						}
						if (this.isFollowingPointerSelection) {
							this.editorAdapter.extendSelectionTo({
								x: moveEvent.clientX,
								y: moveEvent.clientY
							});
						}
					}
				};
				// The end of a gesture is the window itself losing the focus, so this one is kept out of the
				// capture phase the others need: captured on the window, it would answer the blur of every
				// descendant as well, and a press that moves the focus from one row to the next would end a
				// gesture nobody released.
				this.pointerSelectionBlurHandler = () => this.finishPointerSelection();
				Object.entries(this.pointerSelectionHandlers).forEach(([name, handler]) => {
					main_core.Event.bind(ownerWindow, name, handler, {
						capture: true
					});
				});
				main_core.Event.bind(ownerWindow, 'blur', this.pointerSelectionBlurHandler);
			},
			finishPointerSelection() {
				if (!this.isSelectingWithPointer) {
					return;
				}

				// The flag goes down before the report, or the report would be refused like the rest.
				this.releasePointerSelection();
				this.editorAdapter?.reportSelection();
			},
			releasePointerSelection() {
				const target = this.pointerSelectionTarget;
				const handlers = this.pointerSelectionHandlers;
				const blurHandler = this.pointerSelectionBlurHandler;
				this.isSelectingWithPointer = false;
				this.isFollowingPointerSelection = false;
				this.pointerSelectionTarget = null;
				this.pointerSelectionHandlers = null;
				this.pointerSelectionBlurHandler = null;
				if (!target || !handlers) {
					return;
				}
				Object.entries(handlers).forEach(([name, handler]) => {
					main_core.Event.unbind(target, name, handler, {
						capture: true
					});
				});
				main_core.Event.unbind(target, 'blur', blurHandler);
			},
			openTextPanel(itemId, source, returnFocusElement = null) {
				if (this.linkPopupBindElement && String(this.linkPopupItemId) !== String(itemId)) {
					this.closeLinkPopup();
				}
				this.cancelEntityPanelHide();
				this.itemId = itemId;
				this.applyPanelState(openTextPanel(this.panelState, itemId, source, returnFocusElement));
				void this.$nextTick(() => {
					this.updatePanelPosition();
					this.updateSelectedFormattingActions();
				});
			},
			openEntityPanel(itemId, source, anchor = null, returnFocusElement = null) {
				const item = this.checkListManager?.getItem?.(itemId) ?? this.currentItem;
				if (!item || item.parentId === 0) {
					return;
				}
				this.applyPanelState(openEntityPanel(this.panelState, itemId, source, anchor, returnFocusElement));
			},
			closeActivePanel() {
				this.applyPanelState(closePanel(this.panelState));
				this.selectedFormattingActions = [];
				this.entityPanelStyles = {
					top: '0',
					left: 'auto',
					right: '18px',
					display: 'none'
				};
				this.lastSelectionAnchor = null;
			},
			resolvePanelActions(item, placement, selectedFormattingActions = []) {
				if (!item) {
					return [];
				}
				const hasTaskRight = right => !this.isEdit || this.task.rights[right] === true;
				const isGroupMode = item.groupMode?.selected === true;
				const needsLevelMovement = placement === ActionPlacement.Text || placement === ActionPlacement.Entity && isGroupMode;
				return resolveActions({
					item,
					placement,
					isGroupMode,
					isStakeholdersAvailable: tasks_v2_core.Core.getParams().restrictions.stakeholder.available,
					isDiskAvailable: tasks_v2_core.Core.getParams().features.disk,
					canCheckListAdd: hasTaskRight('checklistAdd'),
					canAuditorsAdd: hasTaskRight('addAuditors'),
					canChangeAccomplices: hasTaskRight('changeAccomplices'),
					canMoveRight: needsLevelMovement && this.checkListManager.canMoveRight(item),
					canMoveLeft: needsLevelMovement && this.checkListManager.canMoveLeft(item),
					// Keyboard descriptors are always present. The reorder operation checks the boundary
					// and announces it, so resolving the toolbar must not walk the siblings in advance.
					canMoveItemUp: false,
					canMoveItemDown: false,
					selectedFormattingActions
				});
			},
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
				if (this.isForwardMenuShown) {
					this.handleForwardMenuClose();
				}
				this.schedulePanelPositionUpdate?.();
			},
			schedulePanelPositionUpdate() {
				if (this.panelPositionFrameId !== null) {
					return;
				}
				this.panelPositionFrameId = requestAnimationFrame(() => {
					this.panelPositionFrameId = null;
					this.updatePanelPosition();
					this.updateEntityPanelPosition();
				});
			},
			cancelPanelPositionUpdate() {
				if (this.panelPositionFrameId === null) {
					return;
				}
				cancelAnimationFrame(this.panelPositionFrameId);
				this.panelPositionFrameId = null;
			},
			handleItemPointerEnter({
				itemId,
				anchor
			}) {
				this.cancelEntityPanelHide();
				if (!this.entityPanelAvailable) {
					return;
				}

				// A drag passes rows under the pointer on its own, and the panel restored afterwards
				// would open on a row the pointer has long left -- so a drag clears the hover target.
				if (this.draggedCheckListId !== null && this.draggedCheckListId !== undefined) {
					this.hoveredEntityTarget = null;
					return;
				}
				const item = this.checkListManager?.getItem?.(itemId) ?? this.currentItem;
				if (!item || item.parentId === 0) {
					this.hoveredEntityTarget = null;
					return;
				}
				this.hoveredEntityTarget = {
					itemId,
					anchor
				};
				this.showEntityPanelFromPointer(itemId, anchor);
			},
			showEntityPanelFromPointer(itemId, anchor) {
				// The anchor is a plain row container and takes no focus, so it is left out of the
				// return point: an empty one lets the fallbacks run instead of being swallowed.
				this.openEntityPanel(itemId, PanelOpenSource.Pointer, anchor);
				if (String(this.panelState.entityItemId) !== String(itemId)) {
					return;
				}
				void this.$nextTick(() => {
					const panel = this.$refs.entityPanel?.$el;
					if (!(panel instanceof HTMLElement)) {
						this.hideEntityPanel();
						return;
					}
					this.updateEntityPanelPosition();
				});
			},
			handleItemPointerLeave({
				relatedTarget
			}) {
				if (this.isEntityPanelRegionNode(relatedTarget)) {
					return;
				}
				this.hoveredEntityTarget = null;
				this.scheduleEntityPanelHide();
			},
			handleEntityPanelPointerEnter() {
				this.cancelEntityPanelHide();
				this.applyPanelState(setPanelHold(this.panelState, 'pointerInside', true));
			},
			handleEntityPanelPointerLeave(event) {
				if (this.isEntityPanelRegionNode(event.relatedTarget)) {
					return;
				}
				this.hoveredEntityTarget = null;
				this.scheduleEntityPanelHide();
			},
			restoreHoveredEntityPanel() {
				const target = this.hoveredEntityTarget;
				if (!target || !this.entityPanelAvailable || this.draggedCheckListId !== null && this.draggedCheckListId !== undefined || this.panelState.activePanel !== PanelType.None) {
					return;
				}
				const item = this.checkListManager.getItem(target.itemId);
				if (!target.anchor.isConnected || !item || item.parentId === 0) {
					this.hoveredEntityTarget = null;
					return;
				}
				this.showEntityPanelFromPointer(target.itemId, target.anchor);
			},
			/**
			 * Takes the decision about the item toolbar again: a shown one yields if it now covers the text of
			 * the row being edited, and the same mounted panel returns once it no longer does. A closed panel
			 * also comes back for the row the pointer is still on. The position update coalesces into one frame,
			 * so the places calling this need to know nothing of each other.
			 */
			refreshEntityPanelDecision() {
				this.schedulePanelPositionUpdate();
				// The text panel is away for the whole drag, and the actions would take the place it left
				// only to give it back on the release. So a drag raises none; one already shown is left to
				// the position update above.
				if (this.isSelectingWithPointer) {
					return;
				}
				this.restoreHoveredEntityPanel();
			},
			isEntityPanelRegionNode(node) {
				return this.panelState.entityAnchor?.contains?.(node) === true || this.$refs.entityPanel?.$el?.contains?.(node) === true;
			},
			scheduleEntityPanelHide() {
				this.cancelEntityPanelHide();
				this.applyPanelState(setPanelHold(this.panelState, 'pointerInside', false));
				this.entityPanelHideTimer = setTimeout(() => {
					if (shouldClosePointerPanel(this.panelState)) {
						this.hideEntityPanel();
					}
				}, 80);
			},
			cancelEntityPanelHide() {
				if (this.entityPanelHideTimer) {
					clearTimeout(this.entityPanelHideTimer);
					this.entityPanelHideTimer = null;
				}
			},
			hideEntityPanel() {
				this.cancelEntityPanelHide();
				if (this.panelState.activePanel === PanelType.Entity) {
					this.closeActivePanel();
					return;
				}
				if (this.panelState.entityItemId !== null) {
					this.applyPanelState(closeEntityPanel(this.panelState));
					this.entityPanelStyles = {
						top: '0',
						left: 'auto',
						right: '18px',
						display: 'none'
					};
				}
			},
			concealEntityPanel() {
				this.cancelEntityPanelHide();
				if (this.entityPanelStyles.display !== 'none') {
					this.entityPanelStyles = {
						top: '0',
						left: 'auto',
						right: '18px',
						display: 'none'
					};
				}
			},
			updateEntityPanelPosition() {
				if (!this.panelState.entityAnchor || !this.entityPanelItem) {
					return;
				}
				if (!this.panelState.entityAnchor.isConnected) {
					this.applyPanelState(closePanelForMissingAnchor(this.panelState, this.entityPanelItem.id));
					return;
				}
				const list = this.$refs.list;
				const panel = this.$refs.entityPanel?.$el;
				if (!list || !(panel instanceof HTMLElement)) {
					return;
				}
				const itemRect = main_core.Dom.getRelativePosition(this.panelState.entityAnchor, list);
				const panelHeight = panel.offsetHeight || 48;
				const anchorHeight = this.panelState.entityAnchor.offsetHeight;
				const paddingOffset = 18;
				const groupModeOffset = 54;
				const rightOffset = this.entityPanelItem.groupMode?.active ? groupModeOffset : paddingOffset;
				const row = this.panelState.entityAnchor.closest('.check-list-widget-child-item') ?? this.panelState.entityAnchor;

				// A multi-line row must not push the toolbar down to its middle: centre it on the
				// first line instead, whose box is the row's own min-height.
				const singleLineHeight = Number.parseFloat(getComputedStyle(this.panelState.entityAnchor).minHeight);
				const firstLineHeight = Math.min(anchorHeight, singleLineHeight || anchorHeight);
				const top = itemRect.top + (firstLineHeight - panelHeight) / 2;
				const stickyHeaderBottom = this.getStickyHeaderBottom(list, this.panelState.entityAnchor);
				const topLimitValue = Math.max(entityPanelTopInset, stickyHeaderBottom);
				const panelTopLimit = list.clientHeight - panelHeight;
				// Held against a boundary the toolbar keeps its full height, so a row showing less than that
				// carries it onto the neighbouring row, and a row the header swallowed would stand it on the
				// header over the very controls it covers. What has to hold the toolbar is the visible slice
				// of the row, cut by the header bottom above and by the list edge below.
				const rowRect = main_core.Dom.getRelativePosition(row, list);
				const visibleRowHeight = Math.min(rowRect.bottom, list.clientHeight) - Math.max(rowRect.top, stickyHeaderBottom);
				const doesVisibleRowHoldPanel = visibleRowHeight >= panelHeight;
				const hasVisiblePanelRange = topLimitValue <= panelTopLimit;
				if (!doesVisibleRowHoldPanel || !hasVisiblePanelRange) {
					this.hideEntityPanel();
					return;
				}
				const visibleTop = Math.min(Math.max(top, topLimitValue), panelTopLimit);
				const entityRect = this.getEntityPanelFutureRect(panel, visibleTop, rightOffset);
				if (this.doesEntityPanelOverlapTextPanel(entityRect)) {
					this.hideEntityPanel();
					return;
				}
				if (this.doesEditedTitleReachEntityPanel(entityRect)) {
					// Keep the pointer panel mounted while the edited title covers its place. Input can then
					// remeasure the same panel without rebuilding the checklist on every character.
					this.concealEntityPanel();
					return;
				}
				this.entityPanelStyles = {
					top: `${visibleTop}px`,
					left: 'auto',
					right: `${rightOffset}px`,
					display: 'flex'
				};
			},
			// The checklist header floats over the list, and the toolbar is drawn above it on purpose --
			// for a root item the toolbar stands right in the header area. That leaves the header no
			// cover of its own, so its bottom edge is where the range of a child row panel begins.
			// Preview keeps the header in the flow: there it covers nothing and reports no boundary.
			// The node is the one the panel is placed by: each checklist floats a header of its own.
			getStickyHeaderBottom(list, node) {
				const header = node?.closest('.check-list-widget-item.--parent')?.querySelector('.check-list-widget-parent-item');
				if (!(header instanceof HTMLElement) || getComputedStyle(header).position !== 'sticky') {
					return 0;
				}
				return Math.max(0, main_core.Dom.getRelativePosition(header, list).bottom);
			},
			getEntityPanelFutureRect(panel, top, right) {
				const {
					display,
					top: previousTop,
					right: previousRight,
					visibility
				} = panel.style;
				let entityRect;
				try {
					panel.style.display = 'flex';
					panel.style.top = `${top}px`;
					main_core.Dom.style(panel, 'right', `${right}px`);
					panel.style.visibility = 'hidden';
					entityRect = panel.getBoundingClientRect();
				} finally {
					panel.style.display = display;
					panel.style.top = previousTop;
					main_core.Dom.style(panel, 'right', previousRight);
					panel.style.visibility = visibility;
				}
				return entityRect;
			},
			doesEntityPanelOverlapTextPanel(entityRect) {
				const textPanel = this.$refs.panel?.$el;
				if (!(textPanel instanceof HTMLElement)) {
					return false;
				}
				const textRect = textPanel.getBoundingClientRect();
				if (textRect.width === 0 || textRect.height === 0) {
					return false;
				}
				return doRectsOverlap(entityRect, textRect);
			},
			/**
			 * A toolbar raised by the pointer yields to the edited title only when their rectangles overlap.
			 * A toolbar raised by the keyboard never yields: it is the only way to the actions without a mouse.
			 */
			doesEditedTitleReachEntityPanel(entityRect) {
				const itemId = this.entityPanelItem.id;
				if (this.panelState.openSource !== PanelOpenSource.Pointer || this.editorAdapter?.isActive(itemId) !== true) {
					return false;
				}
				const title = this.getItemsRef(itemId)?.$refs.growingTextArea?.$el;
				if (!(title instanceof HTMLElement)) {
					return false;
				}
				const guardRect = new DOMRect(entityRect.left - entityPanelTextGap, entityRect.top, entityRect.width + entityPanelTextGap, entityRect.height);

				// Every line of the title, not just the first one: the toolbar is taller than a line, and
				// a line of a wrapped title can end early where the next word is a long one.
				return getTextLineRects(title).some(rect => doRectsOverlap(rect, guardRect));
			},
			handleShow(data) {
				this.$emit('show', data);
				if (this.isAutonomous) {
					this.focusCheckListTarget();
				}
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
				try {
					await this.saveCheckList();
				} catch {
					// Save errors are surfaced through pull-conflict state below.
				} finally {
					this.closing = false;
				}
				const hasUnresolvedConflicts = tasks_v2_provider_service_checkListService.checkListService.getPullConflicts().some(conflict => conflict.taskId === this.taskId);
				if (hasUnresolvedConflicts) {
					return;
				}
				this.$emit('close', this.deletingCheckListIds[checkListId] ? 0 : checkListId);
			},
			handleIsShown(isShown) {
				if (isShown) {
					this.subscribeToEvents();
					this.focusCheckListTarget();
				} else {
					this.unsubscribeFromEvents();
					this.$bitrix.eventEmitter.emit(tasks_v2_const.EventName.CloseCheckList);
				}
			},
			focusCheckListTarget() {
				const targetItem = this.checkListManager.getItem(this.checkListId);
				if (targetItem && targetItem.parentId !== 0) {
					this.focusToItem(targetItem.id);
				}
			},
			handleShowPopup(baseEvent) {
				const [popup] = baseEvent.getCompatData();
				const isHintPopup = popup.getId().startsWith('bx-vue-hint-');
				if (isHintPopup) {
					return;
				}
				this.shownPopups.add(popup);
				if (this.panelState.activePanel !== PanelType.None) {
					this.applyPanelState(setPanelHold(this.panelState, 'popupOpen', true));
				}
				this.freeze();
			},
			handleClosePopup(baseEvent) {
				const [popup] = baseEvent.getCompatData();
				const isHintPopup = popup.getId().startsWith('bx-vue-hint-');
				if (isHintPopup) {
					return;
				}
				this.shownPopups.delete(popup);
				if (this.panelState.activePanel !== PanelType.None && this.shownPopups.size === 0) {
					this.applyPanelState(setPanelHold(this.panelState, 'popupOpen', false));
				}
				this.unfreeze();
			},
			async handleGroupRemove(itemId, selectedItemsSnapshot = null) {
				this.itemId = itemId;
				this.freeze();
				this.addItemToDelete(itemId);
				this.closeActivePanel();
				const allSelectedItems = selectedItemsSnapshot ?? this.checkListManager.getAllSelectedItems();
				const nearestItem = this.checkListManager.findNearestItem(this.currentItem, false);
				if (nearestItem) {
					await this.updateCheckList(nearestItem.id, {
						groupMode: {
							active: true,
							selected: true
						}
					});
					setTimeout(() => {
						this.showEntityPanelProgrammatically(nearestItem.id);
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
							this.showEntityPanelProgrammatically(nearestItem.id);
						} else {
							this.cancelGroupMode();
						}
					} else {
						this.showEntityPanelProgrammatically(itemId);
					}
					this.unfreeze();
					this.notifiers.delete(itemId);
				});
				this.notifiers.set(itemId, notifier);
				notifier.showBalloonWithTimer();
			},
			handleFocus(itemId) {
				if (String(this.suppressTitlePanelItemId) === String(itemId)) {
					this.suppressTitlePanelItemId = null;
					return;
				}
				this.isItemPanelFreeze = false;
				this.itemId = itemId;
				const editor = this.getItemsRef(itemId)?.$refs.growingTextArea?.$el ?? null;
				this.showItemPanel(itemId, PanelOpenSource.Keyboard, editor);
			},
			handleBlur(itemId) {
				this.itemId = itemId;
				if (!this.panelState) {
					if (!this.isItemPanelHeld) {
						this.hideItemPanel(itemId);
					}
					return;
				}
				if (this.isCurrentItemEmpty() && this.hasItemFiles(this.currentItem)) {
					return;
				}
				if (!this.isTextPanelHeld) {
					const closesTextPanel = this.panelState.activePanel === PanelType.Text && String(this.panelState.textItemId) === String(itemId);
					this.hideItemPanel(itemId);
					if (closesTextPanel && this.panelState.activePanel === PanelType.None) {
						this.restoreHoveredEntityPanel();
					}
				}
			},
			routeCheckListTab(itemId, event) {
				if (!event || event.key !== 'Tab') {
					return false;
				}
				if (event.defaultPrevented) {
					return true;
				}
				if (event.ctrlKey || event.metaKey || event.altKey) {
					return false;
				}
				const mentionManager = this.getItemsRef(itemId)?.mentionManager;
				if (event.isComposing || mentionManager?.isOpen?.() === true) {
					return false;
				}
				const item = this.checkListManager.getItem(itemId);
				const structuralAllowed = Boolean(item && !this.isPreview && item.parentId !== 0 && item.actions?.modify === true && item.groupMode?.active !== true && item.groupMode?.selected !== true);
				let updates = [];
				if (structuralAllowed && item) {
					const canMove = event.shiftKey ? this.checkListManager.canMoveLeft(item) : this.checkListManager.canMoveRight(item);
					if (canMove) {
						const move = event.shiftKey ? 'moveLeft' : 'moveRight';
						this.checkListManager[move](item, localUpdates => {
							updates = localUpdates;
						});
					}
				}
				const hasMovedItemUpdate = updates.some(update => String(update.id) === String(itemId));
				if (updates.length > 0 && hasMovedItemUpdate) {
					const selection = this.captureKeyboardEditorSelection(itemId, event);
					void this.upsertCheckLists(updates);
					this.restoreKeyboardEditor(itemId, selection);
					const level = this.getUpdatedItemLevel(itemId, updates);
					if (level !== null) {
						ui_a11y.LiveAnnouncer.announce(this.loc('TASKS_V2_CHECK_LIST_ITEM_LEVEL_CHANGED', {
							'#level#': level
						}), 'polite');
					}
					return true;
				}
				return this.queuePanelFocus(itemId, event);
			},
			captureKeyboardEditorSelection(itemId, event) {
				if (this.editorAdapter?.isActive(itemId)) {
					return {
						type: 'editor',
						value: this.editorAdapter.captureSelection()
					};
				}
				if (event.target instanceof HTMLTextAreaElement) {
					return {
						type: 'textarea',
						value: {
							start: event.target.selectionStart,
							end: event.target.selectionEnd
						}
					};
				}
				return null;
			},
			restoreKeyboardEditor(itemId, selection) {
				this.focusToItem(itemId);
				void this.$nextTick(() => {
					const layer = this.getItemsRef(itemId)?.$refs.growingTextArea;
					if (selection?.type === 'editor' && this.editorAdapter?.isActive(itemId)) {
						this.editorAdapter.restoreSelection(selection.value);
						this.editorAdapter.focus();
						return;
					}
					if (selection?.type === 'textarea') {
						layer?.focusTextarea();
						void this.$nextTick(() => layer?.setTextareaSelectionRange(selection.value));
					}
				});
			},
			getUpdatedItemLevel(itemId, updates) {
				const items = new Map(this.checkLists.map(item => [String(item.id), item]));
				updates.forEach(item => items.set(String(item.id), item));
				let current = items.get(String(itemId));
				let level = 0;
				const visitedIds = new Set();
				while (current && current.parentId !== 0) {
					if (visitedIds.has(String(current.id))) {
						break;
					}
					visitedIds.add(String(current.id));
					current = items.get(String(current.parentId));
					if (!current) {
						return null;
					}
					level++;
				}
				return current ? level : null;
			},
			routeCheckListEscape(itemId, event) {
				if (!event || event.isComposing) {
					return false;
				}
				const mentionManager = this.getItemsRef(itemId)?.mentionManager;
				if (mentionManager?.isOpen?.() === true && mentionManager.closeIfOpen?.() === true) {
					this.suppressNextEscapeKeyUp();
					return true;
				}
				const editorOwnsItem = this.editorAdapter?.isActive(itemId) === true;
				const textarea = event.target instanceof HTMLTextAreaElement ? event.target : null;
				const textareaOwnsItem = textarea && this.belongsToItem(textarea, itemId);
				if (!editorOwnsItem && !textareaOwnsItem) {
					return false;
				}
				if (editorOwnsItem) {
					const layer = this.activeEditorLayer;
					const session = this.deactivateItemEditor('escape');
					layer?.commitEditorSession?.(session, event);
				} else {
					textarea?.blur();
				}
				this.closeActivePanel();
				this.suppressNextEscapeKeyUp();
				this.focusItemRow(itemId);
				return true;
			},
			handleItemEscape(event, fromEditor = false) {
				if (!fromEditor && event.target instanceof Element && event.target.closest('textarea, [contenteditable="true"]')) {
					return;
				}

				// The panel opens on a selection, not with the editor, so an item edited without a selection
				// stays reachable only through the active editor session.
				const item = this.panelState.activePanel === PanelType.Text ? this.textPanelItem : this.checkListManager?.getItem?.(this.editorAdapter?.getActiveItemId());
				if (!item) {
					return;
				}
				const row = this.getItemRowNode(item.id);
				if (!row || !(event.target instanceof Node) || !row.contains(event.target)) {
					return;
				}
				if (this.routeCheckListEscape(item.id, event)) {
					event.preventDefault();
					event.stopPropagation();
				}
			},
			handlePanelTab({
				itemId,
				event = null
			}) {
				const queuePanelFocus = this.queuePanelFocus ?? CheckList.methods.queuePanelFocus;
				const handled = queuePanelFocus.call(this, itemId, event);
				if (handled) {
					event?.preventDefault();
				}
				return handled;
			},
			queuePanelFocus(itemId, event) {
				if (!this.entityPanelAvailable) {
					return false;
				}
				const item = this.checkListManager.getItem(itemId);
				if (!item) {
					return false;
				}
				const direction = event?.shiftKey ? 'backward' : 'forward';
				if (item?.groupMode?.selected === true) {
					if (!event) {
						return false;
					}
					if (event.shiftKey) {
						this.closeActivePanel();
						this.focusTabStopBeforeGroupModeCheckbox(itemId);
						return true;
					}
					const anchor = this.getItemEntityAnchor(itemId);
					const checkbox = this.getGroupModeCheckbox(itemId);
					this.openEntityPanel(itemId, PanelOpenSource.Keyboard, anchor, checkbox);
					this.applyPanelState(setPanelHold(this.panelState, 'focusInside', true));
					void this.$nextTick(() => {
						this.updateEntityPanelPosition();
						void this.$nextTick(() => {
							if (this.$refs.entityPanel?.focusFirstAction()) {
								return;
							}
							this.applyPanelState(setPanelHold(this.panelState, 'focusInside', false));
							const nextTarget = this.getTabStopAfterItemPanel(itemId);
							this.closeActivePanel();
							nextTarget?.focus();
						});
					});
					return true;
				}
				if (this.isPreview) {
					if (!item || this.resolvePanelActions(item, ActionPlacement.Entity).length === 0) {
						return false;
					}
					const anchor = this.getItemEntityAnchor(itemId);
					const returnFocusElement = event?.target instanceof HTMLElement ? event.target : anchor;
					this.openEntityPanel(itemId, PanelOpenSource.Keyboard, anchor, returnFocusElement);
					this.applyPanelState(setPanelHold(this.panelState, 'focusInside', true));
					void this.$nextTick(() => {
						this.updateEntityPanelPosition();
						void this.$nextTick(() => {
							const focused = direction === 'backward' ? this.$refs.entityPanel?.focusLastAction() : this.$refs.entityPanel?.focusFirstAction();
							if (focused) {
								return;
							}
							this.applyPanelState(setPanelHold(this.panelState, 'focusInside', false));
							const nextTarget = direction === 'backward' ? this.getTabStopBeforeItem(itemId) : this.getTabStopAfterItemPanel(itemId);
							this.closeActivePanel();
							nextTarget?.focus();
						});
					});
					return true;
				}

				// No selection means no text panel to hand the focus to, so the route goes past it.
				if (this.panelState.activePanel !== PanelType.Text || String(this.panelState.textItemId) !== String(itemId)) {
					this.routePastTextPanel(itemId, event?.target instanceof HTMLElement ? event.target : null);
					return true;
				}

				// The hold is set before the focus moves on purpose: the editor reports its collapsed
				// selection only afterwards, and the hold is what keeps that report from closing the
				// panel the focus is heading into. Moving this into $nextTick breaks the route.
				this.applyPanelState(setPanelHold(this.panelState, 'focusInside', true));
				void this.$nextTick(() => {
					this.updatePanelPosition();
					void this.$nextTick(() => {
						const focused = direction === 'backward' ? this.$refs.panel?.focusLastAction() : this.$refs.panel?.focusFirstAction();
						if (focused) {
							return;
						}
						this.applyPanelState(setPanelHold(this.panelState, 'focusInside', false));
						const currentItem = this.checkListManager.getItem(itemId);
						if (direction === 'forward' && currentItem && currentItem.parentId !== 0 && this.resolvePanelActions(currentItem, ActionPlacement.Entity).length > 0) {
							this.handlePanelNavigate(ActionPlacement.Text, 'forward');
							return;
						}
						const nextTarget = direction === 'backward' ? this.getTabStopBeforeItem(itemId) : this.getTabStopAfterItem(itemId);
						this.closeActivePanel();
						nextTarget?.focus();
					});
				});
				return true;
			},
			routePastTextPanel(itemId, returnFocusElement = null) {
				const item = this.checkListManager.getItem(itemId);
				if (item && item.parentId !== 0 && this.resolvePanelActions(item, ActionPlacement.Entity).length > 0) {
					this.enterEntityPanelByKeyboard(itemId, returnFocusElement ?? document.activeElement);
					return;
				}
				const nextTarget = this.getTabStopAfterItem(itemId);
				this.closeActivePanel();
				nextTarget?.focus();
			},
			enterEntityPanelByKeyboard(itemId, returnFocusElement) {
				const anchor = this.getItemEntityAnchor(itemId);
				this.openEntityPanel(itemId, PanelOpenSource.Keyboard, anchor, returnFocusElement);
				this.applyPanelState(setPanelHold(this.panelState, 'focusInside', true));
				void this.$nextTick(() => {
					this.updateEntityPanelPosition();
					void this.$nextTick(() => {
						if (this.$refs.entityPanel?.focusFirstAction()) {
							return;
						}

						// The panel suppressed the native Tab before it emitted, so a panel that
						// refused the focus has to carry the move to the next tab stop itself.
						this.applyPanelState(setPanelHold(this.panelState, 'focusInside', false));
						const nextTarget = this.getTabStopAfterItem(itemId);
						this.closeActivePanel();
						nextTarget?.focus();
					});
				});
			},
			// Opening the entity panel records where the keyboard came from: a text panel action when a
			// selection raised that panel, the editor itself when routePastTextPanel() skipped it. The
			// recorded node keeps its ancestors after the panel unmounts, so the backward move reads the
			// route from it rather than ask the editor for a selection most browsers already dropped
			// when the focus left it.
			enteredEntityPanelFromTextPanel() {
				const returnTarget = this.panelState.returnFocusElement;
				return returnTarget instanceof Element && returnTarget.closest(`[data-placement="${ActionPlacement.Text}"]`) !== null;
			},
			handlePanelFocusEnter(placement) {
				if (this.panelState.activePanel === placement) {
					this.applyPanelState(setPanelHold(this.panelState, 'focusInside', true));
				}
			},
			handlePanelFocusLeave(placement, relatedTarget = null) {
				const editorItemId = this.editorAdapter?.getActiveItemId?.() ?? null;
				const editorLayer = this.activeEditorLayer;
				const editorBlurEvent = {
					relatedTarget: relatedTarget ?? document.activeElement
				};
				const finalizeEditorBlur = () => {
					if (editorItemId === null || editorItemId === undefined) {
						return null;
					}
					const session = this.finalizeItemEditorBlur?.(editorItemId, editorBlurEvent) ?? null;
					editorLayer?.commitEditorSession?.(session, editorBlurEvent);
					return session;
				};
				if (!placement) {
					this.isFocusInItemPanel = false;
					this.hideItemPanel(this.itemId);
					if (!finalizeEditorBlur()) {
						this.replayEmptyBlurAfterHold();
					}
					return;
				}
				if (this.panelState.activePanel !== placement) {
					return;
				}
				this.isFocusInItemPanel = false;
				this.applyPanelState(setPanelHold(this.panelState, 'focusInside', false));
				if (shouldClosePointerPanel(this.panelState)) {
					this.hideEntityPanel();
				} else if (this.panelState.openSource === PanelOpenSource.Keyboard && !this.panelState.popupOpen) {
					this.closeActivePanel();
				}
				finalizeEditorBlur();
			},
			handlePanelNavigate(placement, direction) {
				const itemId = getActiveItemId(this.panelState);
				if (itemId === null || !this.entityPanelAvailable) {
					return;
				}
				if (placement === ActionPlacement.Text && direction === 'forward') {
					const item = this.checkListManager.getItem(itemId);
					if (item?.parentId === 0) {
						const nextTarget = this.getTabStopAfterItem(itemId);
						this.closeActivePanel();
						nextTarget?.focus();
						return;
					}
					const anchor = this.getItemEntityAnchor(itemId);
					const returnFocusElement = document.activeElement;
					const title = anchor?.querySelector('textarea');
					this.suppressTitlePanelItemId = itemId;
					title?.focus({
						preventScroll: true
					});
					this.enterEntityPanelByKeyboard(itemId, returnFocusElement);
					return;
				}
				if (placement === ActionPlacement.Entity && direction === 'backward') {
					if (this.checkListManager.getItem(itemId)?.groupMode?.selected === true) {
						this.returnFocusToGroupModeCheckbox(itemId);
						return;
					}
					if (this.isPreview) {
						this.returnFocusToPanelTrigger(itemId);
						return;
					}
					if (!this.enteredEntityPanelFromTextPanel()) {
						this.returnFocusToItem(itemId);
						return;
					}

					// The hold goes on right after the panel opens and before the focus moves, for the
					// same reason the forward route does it: the editor reports its collapsed selection
					// in between, and the hold is what keeps that report from closing the panel the
					// focus is heading into. Opening the panel resets the holds, so the order is fixed.
					this.openTextPanel(itemId, PanelOpenSource.Keyboard, document.activeElement);
					this.applyPanelState(setPanelHold(this.panelState, 'focusInside', true));
					void this.$nextTick(() => {
						this.updatePanelPosition();
						void this.$nextTick(() => {
							if (this.$refs.panel?.focusLastAction()) {
								return;
							}

							// Shift+Tab is suppressed in the panel as well, so the item the toolbar
							// belongs to is where the refused backward move lands.
							this.applyPanelState(setPanelHold(this.panelState, 'focusInside', false));
							this.returnFocusToItem(itemId);
						});
					});
					return;
				}
				if (direction === 'backward') {
					this.returnFocusToItem(itemId);
					return;
				}
				const nextTarget = this.getTabStopAfterItemPanel(itemId);
				this.closeActivePanel();
				nextTarget?.focus();
			},
			handlePanelEscape() {
				const itemId = getActiveItemId(this.panelState);
				if (itemId === null || !this.entityPanelAvailable) {
					return;
				}

				// The panel stops the keydown, but the popup around the checklist closes on the keyup and
				// takes it off the document before the panel is even in the path -- so an Escape the panel
				// has answered has to be taken off that keyup as well, the way an item Escape is.
				this.suppressNextEscapeKeyUp();
				if (this.checkListManager.getItem(itemId)?.groupMode?.selected === true) {
					this.returnFocusToGroupModeCheckbox(itemId);
					return;
				}
				if (this.isPreview) {
					this.returnFocusToPanelTrigger(itemId);
					return;
				}
				this.returnFocusToItem(itemId);
			},
			returnFocusToPanelTrigger(itemId) {
				const trigger = this.panelState.returnFocusElement;
				this.closeActivePanel();

				// A row anchor and a button the panel is taking down both pass for connected, so only
				// the focus that actually landed counts as a return.
				if (this.tryFocusNode(trigger)) {
					return;
				}
				this.focusItemRow(itemId);
			},
			returnFocusToItem(itemId) {
				this.closeActivePanel();
				this.suppressTitlePanelItemId = itemId;
				this.focusToItem(itemId);
			},
			returnFocusToGroupModeCheckbox(itemId) {
				this.closeActivePanel();
				this.focusGroupModeCheckbox(itemId);
			},
			exitItemEditing(itemId) {
				this.closeActivePanel();
				this.focusItemRow(itemId);
			},
			focusItemRow(itemId) {
				void this.$nextTick(() => {
					const item = this.checkListManager?.getItem?.(itemId);
					const itemNode = this.getItemRowNode(itemId);
					const selectors = item?.parentId === 0 ? ['.check-list-widget-parent-item', '[data-testid="tasks-check-list-child-item"]'] : ['[data-testid="tasks-check-list-child-item"]', '.check-list-widget-parent-item'];
					const itemRow = selectors.map(selector => itemNode?.matches?.(selector) ? itemNode : itemNode?.querySelector(selector)).find(node => node instanceof HTMLElement);
					if (itemRow instanceof HTMLElement) {
						itemRow.focus({
							preventScroll: true
						});
					}
				});
			},
			getItemEntityAnchor(itemId) {
				const row = this.getItemRowNode(itemId);
				return row?.querySelector('.check-list-widget-child-item-base') ?? row;
			},
			getTabStopAfterItem(itemId) {
				const row = this.getItemRowNode(itemId);
				if (!row) {
					return null;
				}
				return this.findTabStopAfter(row.querySelector('.tasks-check-list-formatting-layer') ?? row);
			},
			getTabStopBeforeItem(itemId) {
				const row = this.getItemRowNode(itemId);
				if (!row) {
					return null;
				}
				return this.findTabStopBefore(row.querySelector('.tasks-check-list-formatting-layer') ?? row);
			},
			getTabStopAfterItemRow(itemId) {
				const row = this.getItemRowNode(itemId);
				if (!row) {
					return null;
				}

				// A row leaving the tree takes its attachments with it, and they sit after the
				// formatting layer -- so the whole row, not just the layer, stays behind the walk.
				// Deleting the last item without the add button leaves the widget no stop at all,
				// and then the walk has to carry on into the card instead of dropping the focus.
				return this.findTabStopAfter(row) ?? this.findTabStopBeyondWidget(row);
			},
			getTabStopAfterItemPanel(itemId) {
				// In edit mode the formatting layer holds the textarea the panel was reached from, so
				// the whole layer stays behind the walk.
				if (!this.isPreview) {
					return this.getTabStopAfterItem(itemId);
				}
				const row = this.getItemRowNode(itemId);
				if (!row) {
					return null;
				}

				// In preview the layer is a read-only render carrying real links, and they come after
				// the panel in the forward order -- only the checkbox that opened it is behind us.
				const checkbox = row.querySelector('[data-testid="tasks-check-list-child-item-checkbox"]');

				// Preview hides the checklist footer, so the last item has no stop left inside the
				// widget: the suppressed Tab has to carry on into the card as it did before the panel.
				return this.findTabStopAfter(checkbox ?? row) ?? this.findTabStopBeyondWidget(row);
			},
			findTabStopAfter(origin) {
				const selector = 'textarea, button, input, select, a[href], [tabindex]:not([tabindex="-1"])';
				for (const node of this.$refs.wrapper?.querySelectorAll(selector) ?? []) {
					const follows = (origin.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING) > 0;
					if (follows && !origin.contains(node) && !node.disabled && node.offsetParent !== null
					// The panels sit in the wrapper after the list, and a button of the panel the
					// caller is about to close is no tab stop to move on to.
					&& node.closest('.check-list-widget-item-panel') === null) {
						return node;
					}
				}
				return null;
			},
			findTabStopBefore(origin) {
				const candidates = [...document.querySelectorAll(ui_a11y.FocusNavigator.FOCUSABLE_SELECTOR)];
				return candidates.filter(node => {
					return (node.compareDocumentPosition(origin) & Node.DOCUMENT_POSITION_FOLLOWING) > 0 && !node.contains(origin) && node.closest('.check-list-widget-item-panel') === null && node.closest('[aria-hidden="true"]') === null && node.offsetParent !== null && this.isTreeTabStop(node);
				}).at(-1) ?? null;
			},
			findTabStopBeyondWidget(origin) {
				const wrapper = this.$refs.wrapper;
				for (const node of document.querySelectorAll(ui_a11y.FocusNavigator.FOCUSABLE_SELECTOR)) {
					const follows = (origin.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING) > 0;
					if (follows && !wrapper?.contains(node) && node.closest('.check-list-widget-item-panel') === null && node.closest('[aria-hidden="true"]') === null && node.offsetParent !== null && this.isTreeTabStop(node)) {
						return node;
					}
				}
				return null;
			},
			handleListKeydown(event) {
				if (event.key !== 'Tab' || event.shiftKey) {
					return;
				}
				if (!this.itemPanelIsShown || !this.$refs.panel) {
					return;
				}
				if (!this.isCurrentItemTextarea(event.target)) {
					return;
				}

				// Claim the panel before moving focus: focusing the toolbar blurs the textarea,
				// and handleBlur must already see the claim so it does not hide the panel.
				this.isFocusInItemPanel = true;
				if (this.$refs.panel.focusFirstAction()) {
					event.preventDefault();
				} else {
					this.isFocusInItemPanel = false;
				}
			},
			isCurrentItemTextarea(node) {
				// The bridge belongs to the item that owns the panel; a textarea from any
				// other row keeps the native tab order.
				return node?.tagName === 'TEXTAREA' && Boolean(this.currentItem) && this.belongsToItem(node, this.currentItem.id);
			},
			handlePanelReturnFocus() {
				this.isFocusInItemPanel = false;
				this.focusToItem(this.itemId);
			},
			replayEmptyBlurAfterHold() {
				// The item editor blurred into the held toolbar, so its empty blur was refused and
				// no second one will come -- the editor is not focused anymore. Leaving the toolbar
				// is the last moment to answer it, unless the item is alive after all.
				if (!this.currentItem || !this.isCurrentItemEmpty()) {
					return;
				}
				if (this.belongsToItem(document.activeElement, this.itemId)) {
					return;
				}
				this.handleEmptyBlur(this.itemId);
			},
			handlePanelFocusForward() {
				// The toolbar is a sibling of the footer, so a native Tab out of it lands
				// past the whole tree. Resume the tree flow at the stop that follows the
				// item the toolbar belongs to.
				const target = this.getTabStopAfterCurrentItem() ?? this.getFooterTabStop();

				// The toolbar suppresses the native Tab in any case, so leaving it with no stop
				// to move on to would strand focus on the body. An item that is still there takes
				// focus back; one that is gone has nothing to hold it, and the panel goes down.
				if (!target && this.getItemsRef(this.itemId)) {
					this.handlePanelReturnFocus();
					return;
				}
				this.handlePanelFocusLeave();
				target?.focus();
			},
			belongsToItem(node, itemId) {
				return node?.closest?.('[data-id]')?.dataset.id === String(itemId);
			},
			getItemRowNode(itemId) {
				return this.$refs.list?.querySelector(`[data-id="${CSS.escape(String(itemId))}"]`) ?? null;
			},
			getItemEditorNode(itemId) {
				// The editor swaps its textarea for a read-only view of a long item or one
				// with links as soon as focus leaves it, so the walk anchors on the container
				// that holds both, which the row keeps either way.
				return [...(this.getItemRowNode(itemId)?.querySelectorAll('.tasks-check-list-formatting-layer') ?? [])].find(editor => this.belongsToItem(editor, itemId)) ?? null;
			},
			isTreeTabStop(node) {
				return ui_a11y.InteractivityChecker.isTabbable(node) || isVisuallyHiddenTabStop(node);
			},
			getTabStopAfterCurrentItem() {
				const row = this.getItemRowNode(this.currentItem?.id);
				if (!row) {
					return null;
				}

				// Resume after the item's OWN editor rather than after the whole row: a
				// root row wraps its subtree, so skipping the row would jump over the
				// checklist header controls, and skipping the editor only would jump over
				// what the row renders below its text (attached files).
				const origin = this.getItemEditorNode(this.currentItem.id) ?? row;

				// The walk is in document order, so the first node that follows the origin and
				// is a tab stop is the answer. Position is a cheap comparison and the tab stop
				// check reads style, hence the order: nothing before the origin is ever checked.
				for (const node of this.$refs.list?.querySelectorAll(ui_a11y.FocusNavigator.FOCUSABLE_SELECTOR) ?? []) {
					const follows = (origin.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING) > 0;
					if (follows && !origin.contains(node) && this.isTreeTabStop(node)) {
						return node;
					}
				}
				return null;
			},
			getFooterTabStop() {
				// The footer sits under v-show, so its button survives in the DOM while hidden
				// and focusing it would leave focus on the body.
				return [...(this.$refs.wrapper?.querySelectorAll('.tasks-check-list-footer button') ?? [])].find(node => ui_a11y.InteractivityChecker.isTabbable(node)) ?? null;
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
				if (!this.isItemPanelHeld) {
					this.removeItem(itemId);
				}
			},
			handleFormattingSelectionChange(itemId, actions) {
				if (!this.currentItem || String(this.currentItem.id) !== String(itemId)) {
					return;
				}
				this.selectedFormattingActions = actions;
			},
			async handleGroupMode(itemId) {
				this.itemId = itemId;
				this.cancelGroupMode();
				const firstChild = this.checkListManager.getFirstVisibleChild(itemId);
				if (!firstChild) {
					return;
				}
				const editor = this.getItemRowNode(firstChild.id)?.querySelector('textarea, [contenteditable="true"]');
				if (editor instanceof HTMLElement) {
					editor.blur();
					await this.$nextTick();
				}
				await this.activateGroupMode(itemId);
				await this.$nextTick();

				// The checkbox is the first tab stop of the mode either way: the click that opens the
				// menu already takes the editor down, so waiting for a rendered editor here left the
				// focus on the menu button and the freshly rendered checkboxes unreachable.
				this.focusGroupModeCheckbox(firstChild.id);
			},
			async handleGroupModeSelected(itemId) {
				this.itemId = itemId;
				await this.$nextTick();
				if (!this.hasActiveGroupMode() || this.checkListManager.getAllSelectedItems().length > 0) {
					return;
				}
				this.closeActivePanel();
				this.deactivateGroupMode();
			},
			showEntityPanelProgrammatically(itemId) {
				const item = this.checkListManager.getItem(itemId);
				if (!item || item.parentId === 0) {
					return;
				}
				const anchor = this.getItemEntityAnchor(itemId);
				const returnFocusElement = this.getGroupModeCheckbox(itemId) ?? anchor;
				this.openEntityPanel(itemId, PanelOpenSource.Programmatic, anchor, returnFocusElement);
				void this.$nextTick(() => this.updateEntityPanelPosition());
			},
			getGroupModeCheckbox(itemId) {
				const checkbox = this.getItemRowNode(itemId)?.querySelector('[data-testid="tasks-check-list-child-item-group-checkbox"] input');
				return checkbox instanceof HTMLElement ? checkbox : null;
			},
			focusTabStopBeforeGroupModeCheckbox(itemId) {
				const checkbox = this.getGroupModeCheckbox(itemId);
				const candidates = [...(this.$refs.wrapper?.querySelectorAll(ui_a11y.FocusNavigator.FOCUSABLE_SELECTOR) ?? [])];
				const previous = candidates.filter(node => {
					return checkbox && (node.compareDocumentPosition(checkbox) & Node.DOCUMENT_POSITION_FOLLOWING) > 0 && node.closest('.check-list-widget-item-panel') === null && node.closest('[aria-hidden="true"]') === null && this.isTreeTabStop(node);
				}).at(-1);
				const fallback = this.getItemRowNode(itemId)?.closest('.check-list-widget-item.--parent')?.querySelector('[data-testid="tasks-check-list-parent-item-menu-btn"]');
				(previous ?? fallback)?.focus({
					preventScroll: true
				});
			},
			focusGroupModeCheckbox(itemId) {
				this.getGroupModeCheckbox(itemId)?.focus({
					preventScroll: true
				});
			},
			handlePanelAction({
				action,
				itemId,
				node,
				placement
			}) {
				const item = this.checkListManager?.getItem?.(itemId) ?? this.currentItem;
				if (!item || placement === ActionPlacement.Entity && item.parentId === 0) {
					return;
				}
				if (itemId === undefined) {
					const selectedItems = item.groupMode?.selected === true ? this.checkListManager.getAllSelectedItems() : [];
					CheckList.methods.dispatchPanelAction.call(this, action, item, node, selectedItems);
					return;
				}
				const descriptor = getActionDescriptor(action);
				if (!descriptor) {
					return;
				}
				if (descriptor.interaction.holdPanel && this.panelState) {
					this.applyPanelState(setPanelHold(this.panelState, 'popupOpen', true));

					// Only a panel held open outlives the click: every other action lets Vue unmount
					// the button next tick, so remembering it would return focus to the body.
					this.panelState = {
						...this.panelState,
						returnFocusElement: node
					};
				}
				const selectedItems = item.groupMode?.selected === true ? this.checkListManager.getAllSelectedItems() : [];
				descriptor.handle({
					item,
					trigger: node,
					dispatch: (registeredAction, registeredItem, trigger) => {
						this.dispatchPanelAction(registeredAction, registeredItem, trigger, selectedItems);
					}
				});
			},
			dispatchPanelAction(action, item, node, selectedItems) {
				if (this.isFormattingAction(action)) {
					this.handleFormattingAction(action, item, node);
					return;
				}
				const actionHandlers = {
					[PanelAction.SetImportant]: () => this.setImportant(item, selectedItems),
					[PanelAction.AttachFile]: () => this.attachFile(node, item),
					[PanelAction.MoveRight]: () => this.moveGroupToRight(item, selectedItems),
					[PanelAction.MoveLeft]: () => this.moveGroupToLeft(item, selectedItems),
					[PanelAction.MoveItemUp]: () => this.reorderItem(item, 'up'),
					[PanelAction.MoveItemDown]: () => this.reorderItem(item, 'down'),
					[PanelAction.AssignAccomplice]: n => {
						if (!this.isItemPanelActionPopupShown) {
							this.showParticipantDialog(n, 'accomplices', item, selectedItems);
						}
					},
					[PanelAction.AssignAuditor]: n => {
						if (!this.isItemPanelActionPopupShown) {
							this.showParticipantDialog(n, 'auditors', item, selectedItems);
						}
					},
					[PanelAction.Forward]: n => this.forward(n, item, selectedItems),
					[PanelAction.Delete]: () => this.delete(item, selectedItems),
					[PanelAction.Cancel]: () => this.cancelGroupMode(item)
				};

				// The panel emits and forgets, so a rejected async handler must not escape unhandled.
				void actionHandlers[action]?.(node)?.catch?.(error => {
					console.error('tasks: check-list panel action failed', error);
				});
			},
			handleEntityPanelAction(data) {
				this.handlePanelAction(data);
			},
			isFormattingAction(action) {
				return [PanelAction.Bold, PanelAction.Italic, PanelAction.Underline, PanelAction.Strikethrough, PanelAction.Link].includes(action);
			},
			handleFormattingAction(action, item, node) {
				if (item instanceof HTMLElement) {
					node = item;
					item = this.currentItem;
				}
				if (!item) {
					return;
				}
				if (action === PanelAction.Link) {
					this.savedRange = this.getItemsRef(item.id)?.$refs.growingTextArea?.getTextareaSelectionRange() ?? null;
					this.isItemPanelActionPopupShown = true;
					this.linkPopupBindElement = node;
					this.linkPopupItemId = item.id;
					this.applyPanelState(setPanelHold(this.panelState, 'popupOpen', true));
					return;
				}
				this.applyFormatting(action, item, node);
			},
			applyFormatting(action, item, node = null, url = '') {
				if (item instanceof HTMLElement) {
					url = node ?? '';
					node = item;
					item = this.currentItem;
				}
				if (!item || item.actions?.modify !== true || item.groupMode?.selected === true) {
					return;
				}
				this.getItemsRef(item.id)?.applyFormatting(action, node, url);
			},
			handleLinkPopupApply(url) {
				this.restoreSavedRange();
				if (this.linkPopupItemId === undefined) {
					this.applyFormatting(PanelAction.Link, this.linkPopupBindElement, url);
				} else {
					const item = this.checkListManager?.getItem?.(this.linkPopupItemId) ?? this.currentItem;
					if (item) {
						this.applyFormatting(PanelAction.Link, item, this.linkPopupBindElement, url);
					}
				}
				this.closeLinkPopup();

				// The link lands in the item text, so focus follows it into the editor, where
				// the formatting layer restores the caret, instead of going to the toolbar.
				this.restoreFocusAfterPopup();
			},
			restoreSavedRange() {
				if (!this.savedRange) {
					return;
				}
				this.getItemsRef(this.linkPopupItemId ?? this.currentItem?.id)?.$refs.growingTextArea?.setTextareaSelectionRange(this.savedRange);
			},
			handleLinkPopupClose() {
				const itemId = this.linkPopupItemId ?? this.currentItem?.id;
				const selection = this.savedRange;
				const bindElement = this.closeLinkPopup();
				const formattingLayer = this.getItemsRef(itemId)?.$refs.growingTextArea;
				if (selection && main_core.Type.isFunction(formattingLayer?.setTextareaSelectionRange)) {
					formattingLayer.setTextareaSelectionRange(selection);
					this.focusToItem(itemId);
					return;
				}
				this.focusLinkPopupBindElement(bindElement);
			},
			closeLinkPopup() {
				const bindElement = this.linkPopupBindElement;
				this.linkPopupBindElement = null;
				this.linkPopupItemId = null;
				this.isItemPanelFreeze = false;
				this.isItemPanelActionPopupShown = false;
				this.savedRange = null;
				if (this.panelState) {
					this.applyPanelState(setPanelHold(this.panelState, 'popupOpen', false));
				}
				return bindElement;
			},
			restorePanelFocus(itemId) {
				const trigger = this.panelState.returnFocusElement;
				if (trigger?.isConnected && !trigger.disabled) {
					trigger.focus();
					return;
				}
				const panel = this.panelState.activePanel === PanelType.Text ? this.$refs.panel : this.$refs.entityPanel;
				if (panel?.focusFirstAction()) {
					return;
				}

				// In preview the item has no textarea to come back to, so the fallback is the row.
				if (this.isPreview) {
					this.returnFocusToPanelTrigger(itemId);
					return;
				}
				this.returnFocusToItem(itemId);
			},
			focusLinkPopupBindElement(bindElement) {
				const generation = ++this.linkPopupFocusGeneration;
				const testId = bindElement?.dataset?.testid;
				let framesLeft = linkPopupFocusRestoreFrameLimit;
				const restoreFocus = () => {
					this.linkPopupFocusFrameId = null;
					// Only this instance's popup is worth waiting for: a link popup opened in another
					// checklist on the page would hold the walk until the frame budget runs out and
					// leave the focus behind.
					if (document.getElementById(this.linkPopupId)) {
						framesLeft--;
						if (framesLeft > 0) {
							this.linkPopupFocusFrameId = requestAnimationFrame(restoreFocus);
						}
						return;
					}
					void this.$nextTick(() => {
						let currentBindElement = null;
						if (this.panelState) {
							const panel = this.panelState?.activePanel === PanelType.Text ? this.$refs.panel : this.$refs.entityPanel;
							currentBindElement = panel?.$el?.querySelector?.(`[data-testid="${CSS.escape(testId ?? '')}"]`);
						}
						if (!currentBindElement && bindElement?.isConnected === true) {
							currentBindElement = bindElement;
						}
						if (!this.tryFocusNode(currentBindElement)) {
							this.placeFocusAfterPopup();
						}
					});
				};
				if (this.linkPopupFocusFrameId !== null) {
					cancelAnimationFrame(this.linkPopupFocusFrameId);
				}
				void this.$nextTick(() => {
					if (this.isUnmounted || generation !== this.linkPopupFocusGeneration) {
						return;
					}
					this.linkPopupFocusFrameId = requestAnimationFrame(restoreFocus);
				});
			},
			restoreFocusAfterPopup(triggerNode = null) {
				void this.$nextTick(() => this.placeFocusAfterPopup(triggerNode));
			},
			restoreFocusAfterMenu(triggerNode = null) {
				void this.$nextTick(() => {
					if (!this.hasFocusOwner()) {
						this.placeFocusAfterPopup(triggerNode);
					}
				});
			},
			hasFocusOwner() {
				const active = document.activeElement;
				const isOrphanFocus = !active || active === document.body || active === document.documentElement;
				return !isOrphanFocus && active.isConnected;
			},
			placeFocusAfterPopup(triggerNode) {
				if (this.tryFocusNode(triggerNode)) {
					return;
				}

				// The editor swaps itself for a read-only display layer, so it is the item
				// component, not its textarea node, that tells whether the row is alive.
				if (this.getItemsRef(this.itemId)) {
					// In preview the item has no textarea to come back to, so the fallback is the row.
					if (this.isPreview) {
						this.focusItemRow(this.itemId);
						return;
					}
					this.focusToItem(this.itemId);
					return;
				}

				// Neither the trigger nor the item outlived the popup: resume the tree flow
				// after the item and take the orphaned panel down, so focus is never left
				// on the body.
				this.handlePanelFocusForward();
			},
			tryFocusNode(node) {
				if (node?.isConnected !== true) {
					return false;
				}
				node.focus({
					preventScroll: true
				});

				// updatePanelPosition hides the toolbar for a row at the edge of the list, and
				// focusing a hidden element is a no-op -- report it so the caller falls back.
				return document.activeElement === node;
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
					// Deleting items and their children are filtered inside checkListService.save() (#excludeDeletingItems)
					const saveResult = await tasks_v2_provider_service_checkListService.checkListService.save(this.taskId, this.checkLists);
					const hasUnresolvedConflicts = tasks_v2_provider_service_checkListService.checkListService.getPullConflicts().some(conflict => conflict.taskId === this.taskId);
					if (hasUnresolvedConflicts) {
						return;
					}
					if (saveResult?.hasDeferred) {
						return;
					}
				}
				this.checkListChangeTracker.reset();
			},
			async savePreviewChanges() {
				if (!this.isPreview || !this.isEdit) {
					return;
				}

				// Nothing closes in preview, so this is the only save the action gets: a change left
				// behind stays on screen and turns out lost only after the card is reloaded.
				if (this.hasUnfilledCheckListItems()) {
					CheckListNotifier.notifySaveBlockedByEmptyItem();
					return;
				}
				try {
					await tasks_v2_provider_service_checkListService.checkListService.save(this.taskId, this.checkLists);
				} catch (error) {
					console.error('tasks: check-list preview save failed', error);
					CheckListNotifier.notifySaveFailed();
				}
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
				await this.updateTask({
					checklist
				});
				if (!empty && !this.isPreview) {
					this.focusToItem(childId);
				}
				return parentId;
			},
			async addFastCheckList() {
				const checkListId = await this.addCheckList();
				const firstItemId = this.checkListManager.getChildWithEmptyTitle(checkListId)?.id ?? checkListId;
				this.handleOpenCheckList(firstItemId);
			},
			showForwardMenu(node) {
				if (this.forwardContextItem === null) {
					return;
				}
				this.forwardBindElement = node;

				// The menu opens above the field, so the toolbar must outlive it: unclaimed,
				// the blurred item tears the panel down together with the very button the
				// menu returns focus to.
				this.isItemPanelActionPopupShown = true;
				this.isForwardMenuShown = true;
				if (this.panelState) {
					this.applyPanelState(setPanelHold(this.panelState, 'popupOpen', true));
				}
			},
			handleForwardMenuClose() {
				if (!this.isForwardMenuShown) {
					return;
				}
				const bindElement = this.forwardBindElement;
				if (this.closeForwardMenu) {
					this.closeForwardMenu(false);
				} else {
					this.isForwardMenuShown = false;
					this.forwardBindElement = null;
				}
				this.isItemPanelActionPopupShown = false;
				this.restoreFocusAfterMenu(bindElement);
			},
			closeForwardMenu(restoreFocus = true) {
				const itemId = this.forwardContextItemId;
				this.isForwardMenuShown = false;
				this.applyPanelState(setPanelHold(this.panelState, 'popupOpen', false));
				this.forwardBindElement = null;
				this.forwardContextItemId = null;
				this.forwardSelectedItemIds = [];
				if (restoreFocus && itemId !== null && this.checkListManager.getItem(itemId)) {
					this.restorePanelFocus(itemId);
				}
			},
			handleForwardMenuSelect(checkList) {
				const contextItem = this.forwardContextItem;
				if (!contextItem) {
					this.closeForwardMenu(false);
					return;
				}
				this.closeActivePanel();
				const selectedItems = this.forwardSelectedItemIds.map(id => this.checkListManager.getItem(id)).filter(Boolean);
				if (selectedItems.length > 0) {
					void this.forwardGroupItemsToChecklist(contextItem.id, checkList.id, selectedItems);
				} else {
					void this.forwardToChecklist(contextItem.id, checkList.id);
				}
			},
			handleForwardMenuCreateNew() {
				const contextItem = this.forwardContextItem;
				if (!contextItem) {
					this.closeForwardMenu(false);
					return;
				}
				const selectedItems = this.forwardSelectedItemIds.map(id => this.checkListManager.getItem(id)).filter(Boolean);
				void this.forwardToNewChecklist(contextItem.id, selectedItems);
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
				if (ref && this.pendingFocusItemId === id) {
					this.schedulePendingItemFocus(id, ref, this.pendingFocusToken);
				}
			},
			getItemsRef(id) {
				return this.itemsRefs[id];
			},
			focusToItem(itemId, highlight = false) {
				this.pendingFocusItemId = itemId;
				this.pendingFocusHighlight = highlight;
				this.pendingFocusToken++;
				const token = this.pendingFocusToken;
				const itemRef = this.getItemsRef(itemId);
				if (itemRef) {
					this.schedulePendingItemFocus(itemId, itemRef, token);
				}
				void this.$nextTick(() => {
					if (token === this.pendingFocusToken && itemId === this.pendingFocusItemId && !this.getItemsRef(itemId)) {
						this.pendingFocusItemId = null;
						this.pendingFocusHighlight = false;
					}
				});
			},
			schedulePendingItemFocus(itemId, itemRef, token) {
				void this.$nextTick(() => {
					if (token !== this.pendingFocusToken || itemId !== this.pendingFocusItemId || itemRef !== this.getItemsRef(itemId)) {
						return;
					}
					const formattingLayer = itemRef.$refs.growingTextArea;
					if (!formattingLayer) {
						this.pendingFocusItemId = null;
						this.pendingFocusHighlight = false;
						return;
					}
					const highlight = this.pendingFocusHighlight;
					this.pendingFocusItemId = null;
					this.pendingFocusHighlight = false;
					formattingLayer.focusTextarea();
					if (highlight) {
						void tasks_v2_lib_highlighter.highlighter.highlight(itemRef.$refs.item);
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
			async addItemFromBtn(checkListId) {
				if (this.hasActiveGroupMode()) {
					return;
				}
				const activeItemId = this.editorAdapter?.getActiveItemId?.();
				if (activeItemId !== null && activeItemId !== undefined) {
					const editorLayer = this.activeEditorLayer;
					const session = this.deactivateItemEditor('add-item');
					editorLayer?.commitEditorSession?.(session);
					await this.$nextTick();
				}
				const childId = main_core.Text.getRandom();
				const sortIndex = this.checkListManager.getChildren(checkListId).length;
				await this.insertItem(checkListId, childId, sortIndex);
				if (this.isPreview) {
					this.handleOpenCheckList(childId);
				}
			},
			async insertItem(parentId, childId, sortIndex) {
				const parentItem = parentId ? this.checkListManager.getItem(parentId) : null;
				await this.insertCheckList({
					id: childId,
					nodeId: childId,
					parentId,
					parentNodeId: parentItem ? parentItem.nodeId : null,
					sortIndex
				});
				await this.updateTask({
					checklist: [...this.task.checklist, childId]
				});
				if (!this.isPreview) {
					this.focusToItem(childId);
				}
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
				if (!this.isPreview || !this.isEdit || !main_core.Type.isNumber(itemId)) {
					return;
				}

				// The row is already gone from the screen, so a save that never happens leaves the item
				// deleted here and alive on the server until the card is reloaded. An empty item blocks
				// the request, and silence about it reads as a saved deletion.
				if (this.hasUnfilledCheckListItems()) {
					CheckListNotifier.notifySaveBlockedByEmptyItem();
					return;
				}
				tasks_v2_provider_service_checkListService.checkListService.delete(this.taskId, itemId).catch(error => {
					console.error('tasks: check-list preview delete failed', error);
					CheckListNotifier.notifySaveFailed();
				});
			},
			hasUnfilledCheckListItems() {
				return this.checkLists.some(item => !main_core.Type.isStringFilled(item.title));
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
			async reorderItem(item, direction) {
				if (!item?.actions?.modify || item.parentId === 0 || item.groupMode?.selected) {
					return;
				}

				// the panel drops this promise, so nothing here may escape as an unhandled rejection
				try {
					const method = direction === 'up' ? 'moveItemUp' : 'moveItemDown';
					let updatePromise = Promise.resolve();
					const result = this.checkListManager[method](item, updates => {
						updatePromise = this.upsertCheckLists(updates);
						return updatePromise;
					});
					if (!result) {
						const phrase = direction === 'up' ? 'TASKS_V2_CHECK_LIST_MOVE_BOUNDARY_START' : 'TASKS_V2_CHECK_LIST_MOVE_BOUNDARY_END';
						ui_a11y.LiveAnnouncer.announce(this.loc(phrase), 'polite');
						return;
					}
					await updatePromise;
					ui_a11y.LiveAnnouncer.announce(this.loc('TASKS_V2_CHECK_LIST_MOVE_ITEM_POSITION', {
						'#position#': result.position,
						'#total#': result.total
					}), 'polite');
					void this.$nextTick(() => {
						this.updatePanelPosition();
						this.updateEntityPanelPosition();
					});
					await this.savePreviewChanges();
				} catch (error) {
					console.error('tasks: check-list reorder failed', error);
				}
			},
			showItemPanel(itemId, source = PanelOpenSource.Programmatic, returnFocusElement = null) {
				if (this.isPreview) {
					return;
				}
				this.openTextPanel(itemId, source, returnFocusElement);
			},
			hideItemPanel(itemId) {
				if (this.isPreview) {
					return;
				}
				if (this.hasActiveGroupMode() && this.checkListManager.getAllSelectedItems().length === 0) {
					this.deactivateGroupMode();
				}
				if (this.panelState.activePanel === PanelType.Text) {
					this.closeActivePanel();
				}
				this.isFocusInItemPanel = false;
			},
			showItemPanelOnNearestSelectedItem(itemId) {
				const nearestSelectedItem = this.checkListManager.findNearestItem(this.currentItem, true);
				if (nearestSelectedItem) {
					this.showEntityPanelProgrammatically(nearestSelectedItem.id);
				} else {
					this.closeActivePanel();
					this.deactivateGroupMode();
				}
			},
			updatePanelPosition() {
				// While the button is held nothing recomputes the place, whichever caller asks for a frame;
				// it is taken once, on the release. A panel that a hold keeps open stands still as well.
				if (this.isSelectingWithPointer) {
					return;
				}
				if (this.itemPanelIsShown === false || !this.textPanelItem) {
					return;
				}
				const list = this.$refs.list;
				const panel = this.$refs.panel?.$el;
				if (!list || !panel) {
					return;
				}
				const itemRef = list.querySelector([`[data-id="${this.textPanelItem.id}"]`]);
				if (!itemRef) {
					return;
				}
				const panelRect = main_core.Dom.getPosition(panel);
				const panelBox = {
					width: panelRect.width === 0 ? 304 : panelRect.width,
					height: panelRect.height === 0 ? 48 : panelRect.height
				};
				const placement = this.getSelectionPanelPlacement(list, itemRef, panelBox) ?? this.getRowEdgePanelPlacement(list, itemRef, panelBox);
				if (!placement.popupVisible) {
					// Clear the set first: popup.close() emits onClose synchronously and can re-enter this method.
					const popupsToClose = [...this.shownPopups];
					this.shownPopups.clear();
					popupsToClose.forEach(popup => {
						popup.close();
					});
				}
				this.itemPanelStyles = {
					top: `${placement.top}px`,
					left: `${placement.left}px`,
					display: placement.visible ? 'flex' : 'none'
				};
				if (!placement.visible) {
					this.returnTextPanelFocusToTitle();
				}
			},
			// Hiding the panel drops the focus of the button standing on it, and the leave that follows
			// ends the editing session as well -- so the title takes the focus back. The place computed for
			// the panel is written before that, and the write reaches the DOM only at the render flush, so
			// the panel still holds the focus here and is hidden with the place it was given, not with
			// whatever the leave left behind. Whether the panel holds the focus is asked of the DOM, not of
			// the hold: the hold goes on before the focus moves, and both routes that do so position the
			// panel in between.
			returnTextPanelFocusToTitle() {
				if (this.$refs.panel?.$el?.contains?.(document.activeElement) !== true) {
					return;
				}
				this.getItemsRef(this.textPanelItem?.id)?.$refs.growingTextArea?.focusTextarea();
			},
			/**
			 * The panel of a selection stands where the caret is. The anchor of that place is the caret line of
			 * the live selection, so it exists only while the adapter edits the very item the panel serves.
			 * The root row is left out whole: its panel is raised by focus, not by a selection, and a selection
			 * inside its title must not move it away from the row edge it has always stood at.
			 */
			getSelectionPanelPlacement(list, itemRef, panelBox) {
				if (this.textPanelItem.parentId === 0) {
					return null;
				}
				const liveAnchorRect = this.editorAdapter?.isActive(this.textPanelItem.id) === true ? this.editorAdapter.getSelectionAnchorRect() : null;
				if (liveAnchorRect) {
					// The anchor comes in window coordinates, the panel is placed in the coordinates of the
					// list: subtracting the live list box translates the one into the other without the page
					// scroll, which the client rect of neither carries. The scroll of the list goes on top, so
					// that the anchor kept here keeps pointing at its own text after the list scrolls.
					const listBox = list.getBoundingClientRect();
					this.lastSelectionAnchor = {
						x: liveAnchorRect.x - listBox.left,
						top: liveAnchorRect.top - listBox.top + list.scrollTop,
						bottom: liveAnchorRect.bottom - listBox.top + list.scrollTop
					};
				}

				// The selection is gone the moment the focus enters the panel or a popup takes the document
				// selection over, and the adapter reads the live one only. Parking the panel at the row edge on
				// such a report would tear it away from the text it works on, so a hold keeps the panel on the
				// anchor it last stood on; closing the panel forgets that anchor.
				if (!liveAnchorRect && this.isTextPanelHeld !== true) {
					return null;
				}
				const anchor = this.lastSelectionAnchor;
				if (!anchor) {
					return null;
				}
				const {
					left,
					top,
					visible
				} = computeTextPanelPosition({
					anchor: {
						x: anchor.x,
						top: anchor.top - list.scrollTop,
						bottom: anchor.bottom - list.scrollTop
					},
					panel: panelBox,
					visibleWindow: {
						width: list.clientWidth,
						height: list.clientHeight
					},
					topBoundary: this.getStickyHeaderBottom(list, itemRef)
				});
				const listOffset = this.getListOffsetInContainingBlock(list);
				return {
					left: left + listOffset.left,
					top: top + listOffset.top,
					visible,
					popupVisible: visible
				};
			},
			// Where the panel stands without a selection behind it: the root row raises it on focus, and any
			// row can have it raised programmatically. It docks to the right edge of the list, its bottom
			// aligned with the row top, like the editor's floating toolbar over a selection.
			getRowEdgePanelPlacement(list, itemRef, panelBox) {
				const listRect = main_core.Dom.getPosition(list);
				const itemRect = main_core.Dom.getRelativePosition(itemRef, list);
				const isParentItem = this.textPanelItem.parentId === 0;
				const paddingOffset = 18;
				const listVisibleBottom = list.scrollTop + list.clientHeight;
				const rowPanelTop = itemRect.top - panelBox.height + textPanelRowInset;
				const rowTopLimitValue = isParentItem ? -42 : 28;
				const placement = {
					top: rowPanelTop,
					topLimit: rowTopLimitValue
				};
				const panelTop = placement.top;
				const panelTopLimit = listVisibleBottom - panelBox.height;
				const topPopupLimitValue = isParentItem ? -12 : 58;
				const rightOffset = isParentItem ? paddingOffset * 2 + 80 : paddingOffset;
				return {
					left: Math.max(0, listRect.width - panelBox.width - rightOffset),
					top: panelTop,
					visible: panelTop > placement.topLimit && panelTop < panelTopLimit,
					popupVisible: rowPanelTop > topPopupLimitValue && rowPanelTop < listVisibleBottom
				};
			},
			// The panel is absolute inside the wrapper, while the place computed for it is measured from the
			// list. In popup and sheet modes the wrapper pads the list away from its own top edge, so a place
			// taken for the wrapper's own stands that padding too high until the offset is added back.
			getListOffsetInContainingBlock(list) {
				const wrapper = this.$refs.wrapper;
				return wrapper instanceof HTMLElement ? main_core.Dom.getRelativePosition(list, wrapper) : {
					left: 0,
					top: 0
				};
			},
			updateSelectedFormattingActions() {
				this.selectedFormattingActions = this.getItemsRef(this.textPanelItem?.id)?.$refs.growingTextArea?.getSelectedFormattingActions?.() ?? [];
			},
			async setImportant(item, selectedItems = []) {
				if (item.groupMode?.selected === true && selectedItems.length > 0) {
					const updates = selectedItems.map(selectedItem => ({
						...selectedItem,
						isImportant: !selectedItem.isImportant
					}));
					await this.upsertCheckLists(updates);
				} else {
					await this.updateCheckList(item.id, {
						isImportant: !item.isImportant
					});
				}
				await this.savePreviewChanges();
			},
			attachFile(node, item = this.currentItem) {
				this.fileServiceInstances ??= new Map();
				const fileServiceInstance = this.getCurrentFileService(item);
				this.fileServiceInstances.set(item.id, fileServiceInstance);
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
						this.isItemPanelActionPopupShown = true;
						if (this.panelState) {
							this.applyPanelState(setPanelHold(this.panelState, 'popupOpen', true));
						}
					},
					onHideCallback: () => {
						this.isItemPanelFreeze = false;
						this.isItemPanelActionPopupShown = false;
						if (this.panelState) {
							this.applyPanelState(setPanelHold(this.panelState, 'popupOpen', false));
							this.restorePanelFocus(item.id);
						} else {
							this.restoreFocusAfterMenu(node);
						}
					}
				});
				fileServiceInstance.subscribe('onFileAdd', () => {
					handleFreeze(true);
				});
				fileServiceInstance.subscribe('onFileComplete', () => {
					this.isItemPanelFreeze = fileServiceInstance.isUploading();
					handleFreeze(this.isItemPanelFreeze || this.hasEmptyItem());
					this.focusToItem(item.id);
				});
			},
			getCurrentFileService(item = this.currentItem) {
				if (!item) {
					return null;
				}
				return tasks_v2_provider_service_fileService.fileService.get(item.id, tasks_v2_provider_service_fileService.EntityTypes.CheckListItem, {
					parentEntityId: this.taskId
				});
			},
			hasItemFiles(item) {
				if (!item) {
					return false;
				}
				const fileServiceInstance = this.getCurrentFileService(item);
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
			canModifyItem(item) {
				return item?.actions?.modify === true;
			},
			reorderCurrentItem(direction) {
				if (!this.canModifyItem(this.currentItem) || this.itemGroupModeSelected) {
					return;
				}
				const move = direction === 'up' ? 'moveItemUp' : 'moveItemDown';
				const result = this.checkListManager[move](this.currentItem, updates => this.upsertCheckLists(updates));
				this.announceReorder(direction, result);
				if (result) {
					void this.$nextTick(() => this.updatePanelPosition());
				}
			},
			announceReorder(direction, result) {
				if (!result) {
					const boundaryKey = direction === 'up' ? 'TASKS_V2_CHECK_LIST_MOVE_BOUNDARY_START' : 'TASKS_V2_CHECK_LIST_MOVE_BOUNDARY_END';
					ui_a11y.LiveAnnouncer.announce(this.loc(boundaryKey), 'polite');
					return;
				}
				const positionKey = this.currentItem.parentId === 0 ? 'TASKS_V2_CHECK_LIST_MOVE_LIST_POSITION' : 'TASKS_V2_CHECK_LIST_MOVE_ITEM_POSITION';
				ui_a11y.LiveAnnouncer.announce(this.loc(positionKey, {
					'#position#': result.position,
					'#total#': result.total
				}), 'polite');
			},
			moveGroupToRight(item = this.currentItem, selectedItems = null) {
				selectedItems ??= item?.groupMode?.selected === true ? this.checkListManager.getAllSelectedItems() : [];
				if (item.groupMode?.selected === true && selectedItems.length > 0) {
					selectedItems.sort((a, b) => a.sortIndex - b.sortIndex).forEach(selectedItem => {
						this.moveRight(selectedItem);
					});
				} else {
					this.moveRight(item);
				}
			},
			moveRight(item) {
				if (!this.canModifyItem(item)) {
					return;
				}
				this.checkListManager.moveRight(item, updates => {
					void this.upsertCheckLists(updates);
					if (!item.groupMode?.active) {
						this.focusToItem(item.id);
					}
				});
			},
			moveGroupToLeft(item, selectedItems = []) {
				if (item.groupMode?.selected === true && selectedItems.length > 0) {
					selectedItems.sort((a, b) => b.sortIndex - a.sortIndex).forEach(selectedItem => {
						this.moveLeft(selectedItem);
					});
				} else {
					this.moveLeft(item);
				}
			},
			moveLeft(item) {
				if (!this.canModifyItem(item)) {
					return;
				}
				this.checkListManager.moveLeft(item, updates => {
					void this.upsertCheckLists(updates);
					if (!item.groupMode?.active) {
						this.focusToItem(item.id);
					}
				});
			},
			async forward(node, item, selectedItems = []) {
				this.forwardContextItemId = item.id;
				this.forwardSelectedItemIds = selectedItems.map(({
					id
				}) => id);
				if (this.hasFewParentCheckLists) {
					this.showForwardMenu(node);
				} else {
					this.closeActivePanel();
					void this.forwardToNewChecklist(item.id, selectedItems);
				}
			},
			async forwardToNewChecklist(itemId, selectedItems = []) {
				const newParentId = await this.addCheckList(true);
				if (selectedItems.length > 0) {
					void this.forwardGroupItemsToChecklist(itemId, newParentId, selectedItems);
				} else {
					void this.forwardToChecklist(itemId, newParentId);
				}
			},
			async forwardToChecklist(itemId, checkListId) {
				const finalSortIndex = this.checkListManager.getChildren(checkListId).length;
				const movingItem = this.checkListManager.getItem(itemId);
				if (this.editorAdapter?.isActive?.(itemId)) {
					const editorLayer = this.activeEditorLayer;
					const session = this.deactivateItemEditor('item-forwarded');
					editorLayer?.commitEditorSession?.(session);
				}
				await this.updateCheckList(movingItem.id, {
					parentId: checkListId,
					sortIndex: finalSortIndex
				});
				this.resortItemsOnLevel(checkListId);
				this.resortItemsOnLevel(movingItem.parentId);
				this.handleTargetParentFilter(movingItem);
				if (this.isPreview) {
					this.focusItemRow(movingItem.id);
				} else if (main_core.Type.isNumber(movingItem.id) && main_core.Type.isFunction(this.focusToItem)) {
					this.focusToItem(movingItem.id);
				}
				await this.savePreviewChanges();
			},
			async forwardGroupItemsToChecklist(itemId, checkListId, selectedItemsSnapshot = null) {
				const finalSortIndex = this.checkListManager.getChildren(checkListId).length;
				const movingItem = this.checkListManager.getItem(itemId);
				const checkListIdsFromWhichWereForwarded = new Set();
				const allSelectedItems = selectedItemsSnapshot ?? this.checkListManager.getAllSelectedItems();
				const nearestItem = this.checkListManager.findNearestItem(movingItem, false, allSelectedItems);
				if (nearestItem) {
					this.showEntityPanelProgrammatically(nearestItem.id);
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
				await this.savePreviewChanges();
			},
			handleTargetParentFilter(movedItem) {
				this.checkListManager.handleTargetParentFilter(movedItem, this.currentUserId, updates => {
					setTimeout(() => {
						const actualUpdates = updates.map(({
							id,
							hidden
						}) => {
							const actualItem = this.checkListManager.getItem(id);
							return actualItem ? {
								...actualItem,
								hidden
							} : null;
						}).filter(Boolean);
						if (actualUpdates.length > 0) {
							void this.upsertCheckLists(actualUpdates);
						}
					}, 1000);
				});
			},
			delete(item, selectedItems = []) {
				if (item.groupMode?.selected === true && selectedItems.length > 0) {
					void this.handleGroupRemove(item.id, selectedItems);
				} else {
					const removedSubtree = [item, ...this.checkListManager.getAllChildren(item.id)];
					const nearestItem = this.checkListManager.findNearestItem(item, false, removedSubtree);

					// The removed row leaves the tree, so the stop that follows it has to be read
					// while it is still there.
					const nextTarget = this.isPreview && !nearestItem ? this.getTabStopAfterItemRow(item.id) : null;
					this.closeActivePanel();
					this.handleRemove(item.id);
					if (this.isPreview) {
						if (nearestItem) {
							this.focusItemRow(nearestItem.id);
						} else {
							nextTarget?.focus({
								preventScroll: true
							});
						}
						return;
					}
					if (nearestItem) {
						setTimeout(() => this.focusToItem(nearestItem.id), 0);
					}
				}
			},
			cancelGroupMode(item = null) {
				this.deactivateGroupMode();
				if (item) {
					this.returnFocusToItem(item.id);
				} else {
					this.closeActivePanel();
				}
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
			showParticipantDialog(targetNode, type, item = this.currentItem, selectedItems = []) {
				const handleClose = async () => {
					this.isItemPanelFreeze = false;
					this.isItemPanelActionPopupShown = false;
					if (this.panelState) {
						this.applyPanelState(setPanelHold(this.panelState, 'popupOpen', false));
					}
					if (selectedItems.length === 0) {
						this.restorePanelFocus(item.id);
					}
					this.updatePanelPosition();
					await this.savePreviewChanges();
				};
				this.checkListParticipantService.showParticipantDialog({
					targetNode,
					type,
					items: selectedItems.length > 0 ? selectedItems : [item],
					onClose: handleClose
				});
				this.isItemPanelFreeze = true;
				this.isItemPanelActionPopupShown = true;
				if (this.panelState) {
					this.applyPanelState(setPanelHold(this.panelState, 'popupOpen', true));
				}
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
				return this.upsertCheckLists(updates);
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
			},
			handleManualConflicts(event) {
				const data = event.getData?.() ?? event.data ?? {};
				if (data.taskId !== this.taskId) {
					return;
				}
				const conflicts = tasks_v2_provider_service_checkListService.checkListService.getPullConflicts().filter(conflict => conflict.taskId === this.taskId);
				if (conflicts.length === 0) {
					if (this.conflicts !== null) {
						this.handleConflictsClose();
					}
					return;
				}
				if (openConflictTaskIds.has(this.taskId)) {
					if (this.conflicts !== null) {
						this.conflicts = [...conflicts];
					}
					return;
				}
				if (data.refreshOnly === true) {
					return;
				}
				openConflictTaskIds.add(this.taskId);
				this.conflicts = [...conflicts];
			},
			handleConflictsClose() {
				openConflictTaskIds.delete(this.taskId);
				this.conflicts = null;
			}
		},
		template: `
		<component
			v-if="componentShown"
			v-bind="$attrs"
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
					data-testid="task-check-list-wrapper"
				>
					<button
						v-if="showInlineCloseButton"
						type="button"
						class="tasks-check-list-close-icon"
						data-testid="task-check-list-close-btn"
						:class="contextClass"
						:aria-label="loc('TASKS_V2_CHECK_LIST_CLOSE_LABEL')"
						@click="$emit('close')"
					>
						<BIcon :name="Outline.CROSS_L" data-testid="tasks-check-list-close-btn" aria-hidden="true" size="24"/>
					</button>
					<div
						ref="list"
						data-list
						data-testid="task-check-list-content"
						class="tasks-check-list-content"
						:class="contextClass"
						@pointerdown.capture="handleListPointerDown"
						@keydown.esc.capture="handleItemEscape"
						@focusout="handleListFocusOut"
					>

						<CheckListWidget
							v-show="!stub"
							:checkListId
							:isPreview
							:entityPanelItemId="panelState.entityItemId"
							:showCloseButton="showSheetCloseButton"
							@update="handleUpdate"
							@show="handleShow"
							@addItem="addItem"
							@addItemFromBtn="addItemFromBtn"
							@removeItem="handleRemove"
							@focus="handleFocus"
							@blur="handleBlur"
							@emptyBlur="handleEmptyBlur"
							@formattingSelectionChange="handleFormattingSelectionChange"
							@startGroupMode="handleGroupMode"
							@toggleGroupModeSelected="handleGroupModeSelected"
							@openCheckList="handleOpenCheckList"
							@itemPointerEnter="handleItemPointerEnter"
							@itemPointerLeave="handleItemPointerLeave"
							@panelTab="handlePanelTab"
							@close="$emit('close')"
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
							:dataset="{ testid: 'tasks-check-list-add-btn' }"
							@click="addCheckList"
						/>
						<UiButton
							:text="loc('TASKS_V2_CHECK_LIST_SAVE_BTN')"
							:dataset="{ testid: 'tasks-check-list-save-btn' }"
							:size="ButtonSize.MEDIUM"
							@click="$emit('close')"
						/>
					</div>
					<CheckListItemPanel
						v-if="itemPanelIsShown && !isPreview"
						ref="panel"
						:placement="ActionPlacement.Text"
						:ariaLabel="loc('TASKS_V2_CHECK_LIST_ITEM_TEXT_PANEL_LABEL')"
						:currentItem="textPanelItem"
						:actionPopupShown="isItemPanelActionPopupShown"
						:actions="textPanelActions"
						:keyboardActions="textPanelKeyboardActions"
						:style="itemPanelStyles"
						@action="handlePanelAction"
						@focusEnter="handlePanelFocusEnter(ActionPlacement.Text)"
						@focusLeave="handlePanelFocusLeave(ActionPlacement.Text, $event)"
						@navigate="handlePanelNavigate(ActionPlacement.Text, $event)"
						@escape="handlePanelEscape"
					/>
					<CheckListItemPanel
						v-if="entityPanelItem && entityPanelAvailable"
						ref="entityPanel"
						:placement="ActionPlacement.Entity"
						:ariaLabel="loc('TASKS_V2_CHECK_LIST_ITEM_ENTITY_PANEL_LABEL')"
						testId="task-check-list-item-entity-panel"
						:currentItem="entityPanelItem"
						:actionPopupShown="isItemPanelActionPopupShown"
						:preserveFocusOnMouseDown="itemPanelIsShown"
						:actions="entityPanelActions"
						:keyboardActions="entityPanelKeyboardActions"
						:style="entityPanelStyles"
						@action="handleEntityPanelAction"
						@pointerEnter="handleEntityPanelPointerEnter"
						@pointerLeave="handleEntityPanelPointerLeave"
						@focusEnter="handlePanelFocusEnter(ActionPlacement.Entity)"
						@focusLeave="handlePanelFocusLeave(ActionPlacement.Entity, $event)"
						@navigate="handlePanelNavigate(ActionPlacement.Entity, $event)"
						@escape="handlePanelEscape"
					/>
					<BMenu
						v-if="isForwardMenuShown && forwardContextItem && forwardMenuOptions"
						:options="forwardMenuOptions"
						data-testid="task-check-list-forward-menu"
						@close="handleForwardMenuClose"
					/>
					<CheckListLinkPopup
						v-if="linkPopupBindElement"
						:popupId="linkPopupId"
						:bindElement="linkPopupBindElement"
						@apply="handleLinkPopupApply"
						@close="handleLinkPopupClose"
					/>
				</div>
			</template>
		</component>
		<ConflictPopup
			v-if="conflicts"
			:conflicts
			:checkListItems="checkLists"
			:taskId
			@close="handleConflictsClose"
		/>
	`
	};

	/**
	 * Splits text into checklist item titles by line break, trimming and dropping empty lines.
	 */
	function splitTitles(text) {
		if (!main_core.Type.isString(text) || text === '') {
			return [];
		}
		return text.split(/\r\n|\r|\n/g).map(line => line.trim()).filter(line => line !== '');
	}

	/**
	 * Titles not already present, deduped by exact trimmed text (case-sensitive), including within the input.
	 */
	function selectFreshTitles(titles, existingTitles) {
		const existing = new Set(existingTitles.map(title => title.trim()));
		return titles.filter(title => {
			const normalizedTitle = title.trim();
			if (existing.has(normalizedTitle)) {
				return false;
			}
			existing.add(normalizedTitle);
			return true;
		});
	}

	/**
	 * sortIndexes to append `count` items after the current max (a missing index counts as 0).
	 */
	function computeAppendSortIndexes(existingSortIndexes, count) {
		const maxSortIndex = existingSortIndexes.reduce((max, sortIndex) => Math.max(max, sortIndex ?? 0), -1);
		return Array.from({
			length: count
		}, (unused, index) => maxSortIndex + 1 + index);
	}

	/**
	 * Titles across the whole subtree of rootId (nested items included); an excluded item is skipped with its subtree.
	 */
	function collectSubtreeTitles(checkLists, rootId, excludedIds = new Set()) {
		const titles = [];
		const queue = [rootId];
		const visitedIds = new Set(queue);
		while (queue.length > 0) {
			const parentId = queue.shift();
			checkLists.forEach(item => {
				if (item.parentId !== parentId || visitedIds.has(item.id) || excludedIds.has(item.id)) {
					return;
				}
				visitedIds.add(item.id);
				queue.push(item.id);
				titles.push(item.title ?? '');
			});
		}
		return titles;
	}

	/**
	 * Adds selected text as items to an existing checklist; rolls back all inserts if the save fails.
	 */
	class CheckListAddFromText {
		#taskId;
		constructor(taskId) {
			this.#taskId = taskId;
		}

		/**
		 * Resolves with the add outcome, or null when nothing was processed (empty input or failed save).
		 */
		async addToCheckList(targetCheckList, text, isEdit) {
			const titles = splitTitles(text);
			if (titles.length === 0) {
				return null;
			}
			const freshTitles = selectFreshTitles(titles, this.#titlesOf(targetCheckList));
			if (freshTitles.length === 0) {
				CheckListNotifier.notifyAllDuplicates();
				return {
					added: 0,
					skipped: titles.length
				};
			}
			const skipped = titles.length - freshTitles.length;
			const insertedIds = this.#insertToEnd(targetCheckList, freshTitles);
			if (!isEdit) {
				// Create mode: checklists are saved with the task, so no separate save or rollback.
				CheckListNotifier.notifyItemsAdded(freshTitles.length, skipped);
				return {
					added: freshTitles.length,
					skipped
				};
			}
			try {
				await tasks_v2_provider_service_checkListService.checkListService.save(this.#taskId, this.#getCheckLists());
				CheckListNotifier.notifyItemsAdded(freshTitles.length, skipped);
				return {
					added: freshTitles.length,
					skipped
				};
			} catch (error) {
				console.error('tasks: check-list add from text: save failed', error);
				this.#rollback(insertedIds);
				CheckListNotifier.notifyServerError(() => {
					void this.addToCheckList(targetCheckList, text, isEdit);
				});
				return null;
			}
		}

		/**
		 * Titles across the whole subtree, not just direct children, to dedupe against nested items too.
		 * Items pending deferred deletion are skipped: save() drops them, so they must not count as duplicates.
		 */
		#titlesOf(targetCheckList) {
			return collectSubtreeTitles(this.#getCheckLists(), targetCheckList.id, this.#deletingCheckListIds());
		}
		#deletingCheckListIds() {
			const deletingIds = this.#store.getters[`${tasks_v2_const.Model.Interface}/deletingCheckListIds`] ?? {};
			return new Set(Object.values(deletingIds));
		}
		#insertToEnd(targetCheckList, titles) {
			const sortIndexes = computeAppendSortIndexes(this.#getChildren(targetCheckList.id).map(item => item.sortIndex), titles.length);
			const items = titles.map((title, index) => {
				const id = main_core.Text.getRandom();

				// parentNodeId is omitted: prepareCheckLists rebuilds it before sending.
				return {
					id,
					nodeId: id,
					parentId: targetCheckList.id,
					title,
					sortIndex: sortIndexes[index]
				};
			});
			const insertedIds = items.map(item => item.id);
			void this.#store.dispatch(`${tasks_v2_const.Model.CheckList}/insertMany`, items);
			const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(this.#taskId);
			tasks_v2_provider_service_taskService.taskService.updateStoreTask(this.#taskId, {
				containsChecklist: true,
				checklist: [...(task?.checklist ?? []), ...insertedIds]
			});
			return insertedIds;
		}
		#rollback(insertedIds) {
			void this.#store.dispatch(`${tasks_v2_const.Model.CheckList}/deleteMany`, insertedIds);
			const insertedIdsSet = new Set(insertedIds);
			const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(this.#taskId);
			const checklist = (task?.checklist ?? []).filter(id => !insertedIdsSet.has(id));
			tasks_v2_provider_service_taskService.taskService.updateStoreTask(this.#taskId, {
				containsChecklist: checklist.length > 0,
				checklist
			});
		}
		#getChildren(parentId) {
			return this.#getCheckLists().filter(item => item.parentId === parentId);
		}
		#getCheckLists() {
			const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(this.#taskId);
			return this.#store.getters[`${tasks_v2_const.Model.CheckList}/getByIds`](task?.checklist ?? []);
		}
		get #store() {
			return tasks_v2_core.Core.getStore();
		}
	}

	const PICKER_MENU_CREATE_SECTION = 'createSection';

	// @vue/component
	const CheckListChip = {
		components: {
			Chip: ui_system_chip_vue.Chip,
			BMenu: ui_system_menu_vue.BMenu
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
		data() {
			return {
				isOpen: false,
				isPickerMenuShown: false,
				pickerAnchor: null,
				pickerText: ''
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
			opensDialog() {
				return this.isAutonomous || !this.isSelected;
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
			},
			deletingCheckListIds() {
				return this.$store.getters[`${tasks_v2_const.Model.Interface}/deletingCheckListIds`] ?? {};
			},
			canAddCheckListItems() {
				if (!this.isEdit) {
					return true;
				}
				return this.task.rights.checklistAdd;
			},
			editableParentCheckLists() {
				// A list pending deferred deletion is still in the store, but save() drops it with its children.
				return selectEditableParentCheckLists(this.checkLists, this.canAddCheckListItems).filter(checkList => !this.deletingCheckListIds[checkList.id]);
			},
			pickerMenuItems() {
				return buildCheckListPickerMenuItems({
					checkLists: this.editableParentCheckLists,
					existingItemIdPrefix: 'CheckListPickerExisting',
					onSelectCheckList: checkList => {
						this.isPickerMenuShown = false;
						void this.handleSelectExistingCheckList(checkList, this.pickerText);
					},
					createNewItem: {
						id: `CheckListPickerCreateNew-${this.taskId}`,
						title: this.loc('TASKS_V2_CHECK_LIST_ITEM_FORWARD_MENU_CREATE'),
						sectionCode: PICKER_MENU_CREATE_SECTION,
						onClick: () => {
							this.isPickerMenuShown = false;
							void this.createCheckListFromText(this.pickerText);
						}
					}
				});
			},
			pickerMenuOptions() {
				return {
					id: `check-list-picker-menu-${this.taskId}`,
					// Bind to the live toolbar button node, since the toolbar stays open on click.
					bindElement: this.pickerAnchor,
					role: 'menu',
					ariaLabel: this.loc('TASKS_V2_CHECK_LIST_PICKER_ARIA_LABEL'),
					focusTrap: {
						// true (not 'first-tabbable', which FocusTrap reads as a CSS selector) focuses the first item.
						initialFocus: true,
						restoreFocus: () => this.getPickerRestoreFocusTarget()
					},
					maxWidth: 400,
					maxHeight: 300,
					sections: [{
						code: PICKER_MENU_CREATE_SECTION
					}],
					items: this.pickerMenuItems,
					targetContainer: document.body
				};
			}
		},
		watch: {
			isOpen() {
				this.syncChipAria();
			},
			opensDialog() {
				this.syncChipAria();
			}
		},
		created() {
			this.checkListManager = new CheckListManager({
				computed: {
					checkLists: () => this.checkLists
				}
			});
			this.checkListAddFromText = new CheckListAddFromText(this.taskId);
		},
		mounted() {
			this.$bitrix.eventEmitter.subscribe(tasks_v2_const.EventName.AddCheckListFromText, this.handleAddFromText);
			this.$bitrix.eventEmitter.subscribe(tasks_v2_const.EventName.CloseCheckList, this.handleFieldClose);
			this.syncChipAria();
		},
		beforeUnmount() {
			this.$bitrix.eventEmitter.unsubscribe(tasks_v2_const.EventName.AddCheckListFromText, this.handleAddFromText);
			this.$bitrix.eventEmitter.unsubscribe(tasks_v2_const.EventName.CloseCheckList, this.handleFieldClose);
		},
		methods: {
			handleClick() {
				if (this.opensDialog) {
					void this.showCheckList();
				} else {
					void this.highlightField();
				}
			},
			async handleAddFromText(baseEvent) {
				const {
					text,
					anchor
				} = tasks_v2_const.normalizeAddCheckListFromTextPayload(baseEvent.getData());

				// Nothing to add (e.g. whitespace-only selection): no picker, no highlight, no save.
				if (splitTitles(text).length === 0) {
					return;
				}

				// Without a stable anchor (the AI path) there's nowhere to place the picker, so create a new list.
				if (anchor && this.editableParentCheckLists.length > 0) {
					this.showCheckListPicker(text, anchor);
					return;
				}
				await this.createCheckListFromText(text);
			},
			showCheckListPicker(text, anchor) {
				this.pickerText = text;
				this.pickerAnchor = anchor;
				this.isPickerMenuShown = true;
			},
			async handleSelectExistingCheckList(checkList, text) {
				const outcome = await this.checkListAddFromText.addToCheckList(checkList, text, this.isEdit);
				this.emitCheckListAddResolved();

				// Lead the user to the target list, including the all-duplicates case; not on failure.
				if (outcome) {
					this.persistExpandedState(checkList.id);
					await this.showAddedCheckList(checkList.id);
				}
			},
			async createCheckListFromText(text) {
				const checkListId = await this.buildCheckList(text);

				// Empty id means empty input: no list created, nothing to close.
				if (checkListId === '') {
					return;
				}
				if (this.isEdit) {
					tasks_v2_provider_service_checkListService.checkListService.save(this.taskId, this.checkLists).then(() => this.persistExpandedStateByNodeId(checkListId)).catch(() => {});
				}
				this.emitCheckListAddResolved();
				await this.showAddedCheckList(checkListId);
			},
			async showAddedCheckList(checkListId) {
				await this.expandCheckList(checkListId);

				// The resolved event closes the description sheet; highlight only after its overlay
				// is gone, otherwise the user sees just the tail of the animation.
				await this.waitForOverlayHidden();
				await this.highlightField();

				// By now save() may have re-created the list under its server id, and the node is keyed by id.
				this.checkListManager.scrollToCheckList(this.$root.$el, this.resolveActualCheckListId(checkListId), 'smooth');
			},
			resolveActualCheckListId(checkListId) {
				if (this.checkLists.some(checkList => checkList.id === checkListId)) {
					return checkListId;
				}
				return this.findCheckListByNodeId(checkListId)?.id ?? checkListId;
			},
			async expandCheckList(checkListId) {
				// In the card preview every list but the first one is collapsed (isItemCollapsed),
				// so the just added items would stay hidden behind a collapsed header.
				await this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
					id: checkListId,
					fields: {
						localCollapsedState: false
					}
				});

				// Render the items before the scroll offset is measured.
				await this.$nextTick();
			},
			persistExpandedStateByNodeId(nodeId) {
				const savedCheckList = this.findCheckListByNodeId(nodeId);
				if (!savedCheckList) {
					return;
				}

				// The save response re-creates the list under its server id and drops the flag set for
				// the temporary one, so re-apply it here: without that the list blinks shut until the
				// slower expand response arrives.
				void this.expandCheckList(savedCheckList.id);
				this.persistExpandedState(savedCheckList.id);
			},
			persistExpandedState(checkListId) {
				// The collapsed state is a per-user server option: without the endpoint the list
				// would fold back on the next card load. Unsaved lists have no server id yet.
				if (this.isEdit && main_core.Type.isNumber(checkListId)) {
					tasks_v2_provider_service_checkListService.checkListService.expand(this.taskId, checkListId).catch(error => {
						console.error('tasks: check-list expand failed', error);
					});
				}
			},
			findCheckListByNodeId(nodeId) {
				// A saved list keeps the client nodeId but gets its real id from the server.
				return this.checkLists.find(checkList => checkList.nodeId === nodeId) ?? null;
			},
			waitForOverlayHidden() {
				return new Promise(resolve => {
					const deadline = Date.now() + 2000;
					const check = () => {
						const overlay = this.$root.$el?.querySelector?.('.tasks-full-card-main.--overlay');
						if (!overlay || Date.now() > deadline) {
							resolve();
							return;
						}
						requestAnimationFrame(check);
					};
					check();
				});
			},
			emitCheckListAddResolved() {
				this.$bitrix.eventEmitter.emit(tasks_v2_const.EventName.CheckListAddFromTextResolved);
			},
			handleFieldClose() {
				this.isOpen = false;
				if (this.isAutonomous) {
					this.getChipElement()?.focus();
				}
			},
			syncChipAria() {
				const el = this.getChipElement();
				if (!el) {
					return;
				}
				el.setAttribute('role', 'button');

				// The first built item already turns the next click into a highlight, while the sheet
				// this chip opened stays on screen: it has to remain announced until it reports its close.
				const controlsDialog = this.opensDialog || this.isOpen;
				if (!controlsDialog) {
					el.removeAttribute('aria-haspopup');
					el.removeAttribute('aria-expanded');
					return;
				}
				el.setAttribute('aria-haspopup', 'dialog');
				el.setAttribute('aria-expanded', String(this.isOpen));
			},
			getChipElement() {
				// Multi-root component (Chip + BMenu), so this.$el is the fragment placeholder; get the chip via ref.
				return this.$refs.chipRoot?.$el ?? null;
			},
			getPickerRestoreFocusTarget() {
				// If the picker was cancelled the toolbar button is still focusable; after success fall back to the chip.
				if (ui_a11y.InteractivityChecker.isFocusable(this.pickerAnchor)) {
					return this.pickerAnchor;
				}
				return this.getChipElement();
			},
			async showCheckList() {
				let focusItemId = null;
				if (!this.isSelected) {
					focusItemId = await this.buildEmptyCheckList();
				}
				this.isOpen = true;
				if (focusItemId === null) {
					this.$emit('showCheckList');
					return;
				}
				this.$emit('showCheckList', focusItemId);
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
				return childId;
			},
			async buildCheckList(baseText) {
				const titles = splitTitles(baseText);
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
			ref="chipRoot"
			:design
			:icon
			:text
			:data-task-id="taskId"
			:data-task-chip-id="checkListMeta.id"
			data-testid="task-check-list-chip"
			@click="handleClick"
		/>
		<BMenu
			v-if="isPickerMenuShown"
			:options="pickerMenuOptions"
			@close="isPickerMenuShown = false"
		/>
	`
	};

	exports.ActionPlacement = ActionPlacement;
	exports.CheckList = CheckList;
	exports.CheckListChip = CheckListChip;
	exports.CheckListList = CheckListList;
	exports.checkListMeta = checkListMeta;
	exports.getActionDescriptors = getActionDescriptors;
	exports.registerAction = registerAction;

})(this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}, BX, BX.Event, BX.UI.Accessibility, BX.Vue3.Vuex, BX.Vue3, BX.Vue3.Components, BX.UI.System.Menu, BX.UI.IconSet, window, BX.Tasks.V2.Const, BX.Tasks.V2, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.UI.Vue3.Components, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Lib, BX.Vue3.Directives, window, BX.Tasks.V2.Component.Elements, BX.UI.DragAndDrop, window, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Lib, BX.UI.System.Skeleton.Vue, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX, BX.UI.Notification, BX.Tasks.V2.Lib, BX.UI.TextEditor, BX.UI.Lexical.Core, BX.UI.Lexical.Link, BX.UI.Lexical.Selection, BX.UI.Lexical.Utils, BX.UI.System.Chip.Vue, BX.Tasks.V2.Lib);
//# sourceMappingURL=check-list.bundle.js.map
