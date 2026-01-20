/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,tasks_v2_lib_userSelectorDialog,ui_vue3_components_button,ui_vue3_components_popup,tasks_v2_component_elements_bottomSheet,ui_draganddrop_draggable,ui_vue3_components_menu,tasks_v2_component_elements_userCheckbox,tasks_v2_component_elements_progressBar,ui_vue3_vuex,ui_system_skeleton_vue,tasks_v2_component_elements_growingTextArea,tasks_v2_component_elements_userAvatarList,tasks_v2_lib_highlighter,tasks_v2_component_elements_userFieldWidgetComponent,tasks_v2_component_elements_checkbox,ui_iconSet_actions,ui_vue3_directives_hint,tasks_v2_core,tasks_v2_component_elements_hint,ui_notification,main_core,main_core_events,tasks_v2_provider_service_checkListService,ui_system_chip_vue,ui_iconSet_api_vue,ui_iconSet_animated,ui_iconSet_outline,tasks_v2_const,tasks_v2_lib_fieldHighlighter,tasks_v2_provider_service_fileService,tasks_v2_provider_service_taskService) {
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
	    main_core.Event.bind(document, 'keydown', this.handleKeyDown, {
	      capture: true
	    });
	  },
	  beforeUnmount() {
	    main_core.Event.unbind(window, 'resize', this.resize);
	    main_core.Event.unbind(document, 'keydown', this.handleKeyDown, {
	      capture: true
	    });
	  },
	  methods: {
	    resize() {
	      var _this$$refs$childComp;
	      const popupInstance = (_this$$refs$childComp = this.$refs.childComponent) == null ? void 0 : _this$$refs$childComp.getPopupInstance();
	      if (popupInstance) {
	        this.$emit('resize');
	        popupInstance.adjustPosition();
	      }
	    },
	    handleShow() {
	      var _this$$refs$childComp2;
	      this.$emit('show', {
	        popupInstance: this.$refs.childComponent.getPopupInstance()
	      });
	      (_this$$refs$childComp2 = this.$refs.childComponent) == null ? void 0 : _this$$refs$childComp2.getPopupInstance().adjustPosition();
	      setTimeout(() => this.resizeObserver.observe(this.$parent.$refs.wrapper), 300);
	    },
	    handleClose() {
	      this.resizeObserver.disconnect();
	      this.$bitrix.eventEmitter.emit(tasks_v2_const.EventName.CloseCheckList);
	      this.$emit('close');
	    },
	    handleKeyDown(event) {
	      if (event.key === 'Escape') {
	        this.$emit('close');
	        event.stopPropagation();
	      }
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
	      if (value === true) {
	        main_core.Event.bind(document, 'keydown', this.handleKeyDown, {
	          capture: true
	        });
	      } else {
	        main_core.Event.unbind(document, 'keydown', this.handleKeyDown, {
	          capture: true
	        });
	      }
	      this.$emit('isShown', value);
	    }
	  },
	  methods: {
	    handleClose() {
	      this.$emit('close');
	    },
	    handleKeyDown(event) {
	      if (event.key === 'Escape') {
	        this.handleClose();
	        event.stopPropagation();
	      }
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

	var _params = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("params");
	var _getDraggedChildren = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getDraggedChildren");
	var _processCompletedFilter = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("processCompletedFilter");
	var _processUserFilter = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("processUserFilter");
	var _applyVisibilityChanges = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("applyVisibilityChanges");
	var _splitIdsByAction = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("splitIdsByAction");
	var _createVisibilityUpdates = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createVisibilityUpdates");
	var _setItemsVisibility = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setItemsVisibility");
	var _findNestedChildren = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("findNestedChildren");
	var _getRootParent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getRootParent");
	var _getCheckLists = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getCheckLists");
	class CheckListManager {
	  constructor(params) {
	    Object.defineProperty(this, _getCheckLists, {
	      value: _getCheckLists2
	    });
	    Object.defineProperty(this, _getRootParent, {
	      value: _getRootParent2
	    });
	    Object.defineProperty(this, _findNestedChildren, {
	      value: _findNestedChildren2
	    });
	    Object.defineProperty(this, _setItemsVisibility, {
	      value: _setItemsVisibility2
	    });
	    Object.defineProperty(this, _createVisibilityUpdates, {
	      value: _createVisibilityUpdates2
	    });
	    Object.defineProperty(this, _splitIdsByAction, {
	      value: _splitIdsByAction2
	    });
	    Object.defineProperty(this, _applyVisibilityChanges, {
	      value: _applyVisibilityChanges2
	    });
	    Object.defineProperty(this, _processUserFilter, {
	      value: _processUserFilter2
	    });
	    Object.defineProperty(this, _processCompletedFilter, {
	      value: _processCompletedFilter2
	    });
	    Object.defineProperty(this, _getDraggedChildren, {
	      value: _getDraggedChildren2
	    });
	    Object.defineProperty(this, _params, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _params)[_params] = params;
	  }
	  getItem(itemId) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().find(item => item.id === this.prepareItemId(itemId));
	  }
	  getItems(itemIds) {
	    const itemIdsSet = new Set(itemIds);
	    return babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().filter(item => itemIdsSet.has(item.id));
	  }
	  getItemsOnLevel(parentId) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().filter(item => item.parentId === parentId).sort((a, b) => a.sortIndex - b.sortIndex);
	  }
	  getItemLevel(checkListItem) {
	    let level = 0;
	    let current = checkListItem;
	    const visitedIds = new Set();
	    const findParent = parentId => babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().find(item => item.id === parentId);
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
	    if ((item == null ? void 0 : item.parentId) === (potentialAncestor == null ? void 0 : potentialAncestor.id)) {
	      return true;
	    }
	    if ((item == null ? void 0 : item.parentId) === 0) {
	      return false;
	    }
	    const parent = babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().find(i => i.id === (item == null ? void 0 : item.parentId));
	    if (!parent) {
	      return false;
	    }
	    return this.isItemDescendant(potentialAncestor, parent);
	  }
	  showItems(itemIds, updateFn) {
	    const updates = [];
	    itemIds.forEach(itemId => babelHelpers.classPrivateFieldLooseBase(this, _setItemsVisibility)[_setItemsVisibility](itemId, false, updates));
	    if (updates.length > 0) {
	      updateFn(updates);
	    }
	  }
	  hideItems(itemIds, updateFn) {
	    const updates = [];
	    itemIds.forEach(itemId => babelHelpers.classPrivateFieldLooseBase(this, _setItemsVisibility)[_setItemsVisibility](itemId, true, updates));
	    if (updates.length > 0) {
	      updateFn(updates);
	    }
	  }
	  syncParentCompletionState(itemId, updateFn, parentItemId) {
	    var _parentItem$localComp;
	    const changedItem = babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().find(item => item.id === itemId);
	    if ((!changedItem || !changedItem.parentId) && !parentItemId) {
	      return;
	    }
	    const parentId = parentItemId || changedItem.parentId;
	    const parentItem = babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().find(item => item.id === parentId);
	    if (!parentItem) {
	      return;
	    }
	    const childrenItems = babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().filter(item => item.parentId === parentItem.id);
	    const isEmptyParent = childrenItems.length === 0;
	    const allChildrenCompleted = childrenItems.every(child => {
	      var _child$localCompleteS;
	      return (_child$localCompleteS = child.localCompleteState) != null ? _child$localCompleteS : child.isComplete;
	    });
	    const someChildrenIncomplete = !allChildrenCompleted;
	    const parentCompleted = (_parentItem$localComp = parentItem.localCompleteState) != null ? _parentItem$localComp : parentItem.isComplete;
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
	    return babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().filter(item => {
	      var _item$groupMode;
	      return ((_item$groupMode = item.groupMode) == null ? void 0 : _item$groupMode.active) === true;
	    });
	  }
	  getAllSelectedItems() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().filter(item => {
	      var _item$groupMode2;
	      return item.parentId !== 0 && ((_item$groupMode2 = item.groupMode) == null ? void 0 : _item$groupMode2.selected) === true;
	    });
	  }
	  getAllSelectedItemsWithChildren() {
	    const result = new Map();
	    const selectedItems = this.getAllSelectedItems();
	    const allItems = babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]();
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
	      const children = babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().filter(item => item.parentId === currentId).sort((a, b) => a.sortIndex - b.sortIndex);
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
	      var _item$localCompleteSt;
	      return ((_item$localCompleteSt = item.localCompleteState) != null ? _item$localCompleteSt : item.isComplete) === true;
	    });
	  }
	  getChildren(itemId) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().filter(item => {
	      return item.parentId === itemId;
	    });
	  }
	  getSiblings(itemId, parentId) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().filter(sibling => sibling.parentId === parentId && sibling.id !== itemId).sort((a, b) => a.sortIndex - b.sortIndex);
	  }
	  resortItemsOnLevel(parentId, updateFn) {
	    const allItems = babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().filter(item => item.parentId === parentId);
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
	    const allItems = babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().filter(item => item.parentId === parentId);
	    const itemsToResort = allItems.filter(item => item.sortIndex <= sortIndex).sort((a, b) => a.sortIndex - b.sortIndex);
	    const updates = itemsToResort.map((item, index) => ({
	      ...item,
	      sortIndex: index
	    }));
	    updateFn(updates);
	  }
	  resortItemsAfterIndex(parentId, sortIndex, updateFn) {
	    const allItems = babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().filter(item => item.parentId === parentId);
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
	    const newParentChildren = babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().filter(child => child.parentId === newParent.id).sort((a, b) => a.sortIndex - b.sortIndex);
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
	    const currentParent = babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().find(parent => parent.id === item.parentId);
	    if (!currentParent) {
	      return;
	    }
	    const itemsOnLevel = this.getItemsOnLevel(currentParent.parentId);
	    const parentInNewListIndex = itemsOnLevel.findIndex(sibling => sibling.id === currentParent.id);
	    const currentSiblingsUpdates = babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().filter(sibling => sibling.parentId === item.parentId && sibling.sortIndex > item.sortIndex).map(sibling => ({
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
	    const rootParent = babelHelpers.classPrivateFieldLooseBase(this, _getRootParent)[_getRootParent](initialItem);
	    if (!rootParent) {
	      return null;
	    }
	    const currentSortIndex = initialItem.sortIndex;
	    const excludedParentIds = new Set(excludeChildrenOf.map(item => item.id));
	    const eligibleItems = babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().sort((a, b) => a.sortIndex - b.sortIndex).filter(item => {
	      var _item$groupMode3, _babelHelpers$classPr;
	      const isChildOfExcluded = excludedParentIds.has(item.parentId);
	      return item.id !== initialItem.id && item.parentId !== 0 && ((_item$groupMode3 = item.groupMode) == null ? void 0 : _item$groupMode3.selected) === selected && ((_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _getRootParent)[_getRootParent](item)) == null ? void 0 : _babelHelpers$classPr.id) === rootParent.id && !isChildOfExcluded;
	    });
	    if (eligibleItems.length === 0) {
	      return null;
	    }
	    return eligibleItems.reduce((nearest, item) => {
	      return item.sortIndex > currentSortIndex && (item.sortIndex < nearest.sortIndex || nearest.sortIndex <= currentSortIndex) ? item : nearest;
	    });
	  }
	  getFirstVisibleChild(itemId) {
	    const children = babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().filter(item => item.parentId === itemId && !item.hidden).sort((a, b) => a.sortIndex - b.sortIndex);
	    return children[0] || null;
	  }
	  getEmptiesItem() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().filter(item => {
	      return item.title === '';
	    });
	  }
	  hasEmptyItemWithFiles(hasItemFiles) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().some(item => {
	      return item.title === '' && hasItemFiles(item);
	    });
	  }
	  hasEmptyParentItem() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().some(item => {
	      return item.parentId === 0 && item.title === '';
	    });
	  }
	  getFirstEmptyItem() {
	    const items = babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().filter(item => item.title === '').sort((a, b) => a.sortIndex - b.sortIndex);
	    return items[0] || null;
	  }
	  getChildWithEmptyTitle(itemId) {
	    const children = babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().filter(item => item.parentId === itemId).sort((a, b) => b.sortIndex - a.sortIndex).find(item => item.title === '');
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
	    var _currentItem;
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
	    return ((_currentItem = currentItem) == null ? void 0 : _currentItem.parentId) === 0 ? currentItem : null;
	  }
	  expandIdsWithChildren(itemIds) {
	    const fullSet = new Set(itemIds);
	    if (itemIds.size === 0 || babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().length === 0) {
	      return fullSet;
	    }
	    const checkListMap = new Map(babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().map(item => [item.id, item]));
	    const processedIds = new Set();
	    itemIds.forEach(id => {
	      if (!processedIds.has(id)) {
	        babelHelpers.classPrivateFieldLooseBase(this, _findNestedChildren)[_findNestedChildren](id, checkListMap, fullSet, processedIds);
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
	      var _item$accomplices, _item$auditors;
	      const hasUser = ((_item$accomplices = item.accomplices) == null ? void 0 : _item$accomplices.some(user => user.id === userId)) || ((_item$auditors = item.auditors) == null ? void 0 : _item$auditors.some(user => user.id === userId));
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
	    return babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().some(child => child.parentId === item.id);
	  }
	  isItemCompleted(item) {
	    var _item$localCompleteSt2;
	    return (_item$localCompleteSt2 = item.localCompleteState) != null ? _item$localCompleteSt2 : item.isComplete;
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
	    const draggedChildren = babelHelpers.classPrivateFieldLooseBase(this, _getDraggedChildren)[_getDraggedChildren](movedItem);
	    babelHelpers.classPrivateFieldLooseBase(this, _processCompletedFilter)[_processCompletedFilter](movedItem, targetParentItem, itemIdsToUpdateInNewParent);
	    draggedChildren.forEach(child => {
	      babelHelpers.classPrivateFieldLooseBase(this, _processCompletedFilter)[_processCompletedFilter](child, targetParentItem, itemIdsToUpdateInNewParent);
	    });
	    const myItemIds = this.findItemIdsWithUser(targetParentItem.id, currentUserId);
	    babelHelpers.classPrivateFieldLooseBase(this, _processUserFilter)[_processUserFilter](movedItem, targetParentItem, myItemIds, itemIdsToUpdateInNewParent);
	    draggedChildren.forEach(child => {
	      babelHelpers.classPrivateFieldLooseBase(this, _processUserFilter)[_processUserFilter](child, targetParentItem, myItemIds, itemIdsToUpdateInNewParent);
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _applyVisibilityChanges)[_applyVisibilityChanges](itemIdsToUpdateInNewParent, updateFn);
	    return true;
	  }
	}
	function _getDraggedChildren2(movedItem) {
	  return this.getAllChildren(movedItem.id);
	}
	function _processCompletedFilter2(item, targetParentItem, itemIdsMap) {
	  if (targetParentItem.areCompletedCollapsed && this.isItemCompleted(item)) {
	    itemIdsMap.set(item.id, 'hide');
	  }
	  if (!targetParentItem.areCompletedCollapsed && this.isItemCompleted(item)) {
	    itemIdsMap.set(item.id, 'show');
	  }
	}
	function _processUserFilter2(item, targetParentItem, myItemIds, itemIdsMap) {
	  if (targetParentItem.myFilterActive && !myItemIds.has(item.id)) {
	    itemIdsMap.set(item.id, 'hide');
	  }
	  if (!targetParentItem.myFilterActive && myItemIds.has(item.id) && !itemIdsMap.has(item.id)) {
	    itemIdsMap.set(item.id, 'show');
	  }
	}
	function _applyVisibilityChanges2(itemIdsToUpdateInNewParent, updateFn) {
	  const {
	    hideIds,
	    showIds
	  } = babelHelpers.classPrivateFieldLooseBase(this, _splitIdsByAction)[_splitIdsByAction](itemIdsToUpdateInNewParent);
	  const updates = babelHelpers.classPrivateFieldLooseBase(this, _createVisibilityUpdates)[_createVisibilityUpdates](hideIds, showIds);
	  if (updates.length > 0) {
	    updateFn(updates);
	  }
	}
	function _splitIdsByAction2(itemIdsMap) {
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
	function _createVisibilityUpdates2(hideIds, showIds) {
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
	function _setItemsVisibility2(itemId, hidden, updates) {
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
	    babelHelpers.classPrivateFieldLooseBase(this, _setItemsVisibility)[_setItemsVisibility](child.id, hidden, updates);
	  });
	}
	function _findNestedChildren2(parentId, checkListMap, resultSet, processedIds) {
	  if (processedIds.has(parentId)) {
	    return;
	  }
	  processedIds.add(parentId);
	  checkListMap.forEach(item => {
	    if (item.parentId === parentId && !resultSet.has(item.id)) {
	      resultSet.add(item.id);
	      babelHelpers.classPrivateFieldLooseBase(this, _findNestedChildren)[_findNestedChildren](item.id, checkListMap, resultSet, processedIds);
	    }
	  });
	}
	function _getRootParent2(item) {
	  if (!item || item.parentId === 0) {
	    return item || null;
	  }
	  const parentItem = babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().find(parent => parent.id === item.parentId);
	  if (!parentItem) {
	    return null;
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _getRootParent)[_getRootParent](parentItem);
	}
	function _getCheckLists2() {
	  var _babelHelpers$classPr2, _babelHelpers$classPr3, _babelHelpers$classPr4;
	  return (_babelHelpers$classPr2 = (_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _params)[_params]) == null ? void 0 : (_babelHelpers$classPr4 = _babelHelpers$classPr3.computed) == null ? void 0 : _babelHelpers$classPr4.checkLists()) != null ? _babelHelpers$classPr2 : [];
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
						class="tasks-check-list-list-content-row --footer"
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

	var _store = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("store");
	var _checkListManager = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("checkListManager");
	var _stubItemId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("stubItemId");
	var _calculateAfterSortIndex = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("calculateAfterSortIndex");
	var _calculateBeforeSortIndex = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("calculateBeforeSortIndex");
	class CheckListDragManager extends main_core_events.EventEmitter {
	  constructor(params) {
	    super();
	    Object.defineProperty(this, _calculateBeforeSortIndex, {
	      value: _calculateBeforeSortIndex2
	    });
	    Object.defineProperty(this, _calculateAfterSortIndex, {
	      value: _calculateAfterSortIndex2
	    });
	    Object.defineProperty(this, _store, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _checkListManager, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _stubItemId, {
	      writable: true,
	      value: void 0
	    });
	    this.setEventNamespace('Tasks.V2.CheckList.CheckListDragManager');
	    babelHelpers.classPrivateFieldLooseBase(this, _store)[_store] = params.store;
	    babelHelpers.classPrivateFieldLooseBase(this, _checkListManager)[_checkListManager] = params.checkListManager;
	    babelHelpers.classPrivateFieldLooseBase(this, _stubItemId)[_stubItemId] = params.stubItemId;
	  }
	  moveDropPreview(draggedItem, overedItem, directionFromBottom, isSameLevelMove) {
	    let tmpDraggedIndex = directionFromBottom ? babelHelpers.classPrivateFieldLooseBase(this, _calculateAfterSortIndex)[_calculateAfterSortIndex](overedItem) - 0.5 : babelHelpers.classPrivateFieldLooseBase(this, _calculateBeforeSortIndex)[_calculateBeforeSortIndex](overedItem) + 0.5;
	    if (!isSameLevelMove) {
	      const isDraggedItemHigher = babelHelpers.classPrivateFieldLooseBase(this, _checkListManager)[_checkListManager].isFirstItemHigherLevelThan(draggedItem, overedItem);
	      const isOverStubItem = overedItem.id === babelHelpers.classPrivateFieldLooseBase(this, _stubItemId)[_stubItemId];
	      if (!isDraggedItemHigher && !isOverStubItem) {
	        tmpDraggedIndex = babelHelpers.classPrivateFieldLooseBase(this, _calculateBeforeSortIndex)[_calculateBeforeSortIndex](overedItem) + 0.5;
	        void babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
	          id: overedItem.id,
	          fields: {
	            sortIndex: tmpDraggedIndex + 1
	          }
	        });
	      }
	    }
	    void babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
	      id: draggedItem.id,
	      fields: {
	        sortIndex: tmpDraggedIndex,
	        parentId: overedItem.parentId
	      }
	    });
	  }
	  resortLevelDependingOnPosition(draggedItem, overedItem, directionFromBottom, isSameLevelMove) {
	    let newDraggedSortIndex = directionFromBottom ? babelHelpers.classPrivateFieldLooseBase(this, _calculateAfterSortIndex)[_calculateAfterSortIndex](overedItem) : babelHelpers.classPrivateFieldLooseBase(this, _calculateBeforeSortIndex)[_calculateBeforeSortIndex](overedItem);
	    let levelResort = false;
	    if (!isSameLevelMove) {
	      const isDraggedItemHigher = babelHelpers.classPrivateFieldLooseBase(this, _checkListManager)[_checkListManager].isFirstItemHigherLevelThan(draggedItem, overedItem);
	      if (!isDraggedItemHigher) {
	        newDraggedSortIndex = babelHelpers.classPrivateFieldLooseBase(this, _calculateBeforeSortIndex)[_calculateBeforeSortIndex](overedItem);
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
	      babelHelpers.classPrivateFieldLooseBase(this, _checkListManager)[_checkListManager].resortItemsAfterIndex(overedItem.parentId, newDraggedSortIndex, resortUpdates => {
	        babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, [...updates, ...resortUpdates]);
	      });
	    } else {
	      babelHelpers.classPrivateFieldLooseBase(this, _checkListManager)[_checkListManager].resortItemsBeforeIndex(overedItem.parentId, newDraggedSortIndex, resortUpdates => {
	        babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, [...updates, ...resortUpdates]);
	      });
	    }
	  }
	  resortLevel(parentId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _checkListManager)[_checkListManager].resortItemsOnLevel(parentId, updates => {
	      babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, updates);
	    });
	  }
	}
	function _calculateAfterSortIndex2(item) {
	  return item.sortIndex + 1;
	}
	function _calculateBeforeSortIndex2(item) {
	  return item.sortIndex - 1;
	}

	var _store$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("store");
	var _checkListManager$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("checkListManager");
	var _draggable = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("draggable");
	var _draggedItem = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("draggedItem");
	var _canAddItem = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("canAddItem");
	var _stubItemId$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("stubItemId");
	var _currentUserId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("currentUserId");
	var _isSameLevelMove = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isSameLevelMove");
	var _handleBeforeDragStart = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleBeforeDragStart");
	var _handleDragStart = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleDragStart");
	var _handleDragOver = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleDragOver");
	var _handleDragEnd = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleDragEnd");
	var _handleDropEnd = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleDropEnd");
	var _handleDropZoneEnter = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleDropZoneEnter");
	var _handleDropZoneOut = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleDropZoneOut");
	var _handleDrop = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleDrop");
	var _handleItemMovingOnSameLevel = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleItemMovingOnSameLevel");
	var _handleItemMovingOnBetweenLevel = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleItemMovingOnBetweenLevel");
	var _getItemByNode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getItemByNode");
	class CheckListItemDragManager extends CheckListDragManager {
	  constructor(params) {
	    super(params);
	    Object.defineProperty(this, _getItemByNode, {
	      value: _getItemByNode2
	    });
	    Object.defineProperty(this, _handleItemMovingOnBetweenLevel, {
	      value: _handleItemMovingOnBetweenLevel2
	    });
	    Object.defineProperty(this, _handleItemMovingOnSameLevel, {
	      value: _handleItemMovingOnSameLevel2
	    });
	    Object.defineProperty(this, _handleDrop, {
	      value: _handleDrop2
	    });
	    Object.defineProperty(this, _handleDropZoneOut, {
	      value: _handleDropZoneOut2
	    });
	    Object.defineProperty(this, _handleDropZoneEnter, {
	      value: _handleDropZoneEnter2
	    });
	    Object.defineProperty(this, _handleDropEnd, {
	      value: _handleDropEnd2
	    });
	    Object.defineProperty(this, _handleDragEnd, {
	      value: _handleDragEnd2
	    });
	    Object.defineProperty(this, _handleDragOver, {
	      value: _handleDragOver2
	    });
	    Object.defineProperty(this, _handleDragStart, {
	      value: _handleDragStart2
	    });
	    Object.defineProperty(this, _handleBeforeDragStart, {
	      value: _handleBeforeDragStart2
	    });
	    Object.defineProperty(this, _store$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _checkListManager$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _draggable, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _draggedItem, {
	      writable: true,
	      value: {
	        item: null,
	        childrenIds: [],
	        enterDropzone: false
	      }
	    });
	    Object.defineProperty(this, _canAddItem, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _stubItemId$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _currentUserId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _isSameLevelMove, {
	      writable: true,
	      value: false
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1] = params.store;
	    babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$1)[_checkListManager$1] = params.checkListManager;
	    babelHelpers.classPrivateFieldLooseBase(this, _canAddItem)[_canAddItem] = params.canAddItem;
	    babelHelpers.classPrivateFieldLooseBase(this, _stubItemId$1)[_stubItemId$1] = params.stubItemId;
	    babelHelpers.classPrivateFieldLooseBase(this, _currentUserId)[_currentUserId] = params.currentUserId;
	  }
	  init(container, offsetX = 0, listDropzone = []) {
	    babelHelpers.classPrivateFieldLooseBase(this, _draggable)[_draggable] = new ui_draganddrop_draggable.Draggable({
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
	    babelHelpers.classPrivateFieldLooseBase(this, _draggable)[_draggable].subscribe('beforeStart', babelHelpers.classPrivateFieldLooseBase(this, _handleBeforeDragStart)[_handleBeforeDragStart].bind(this));
	    babelHelpers.classPrivateFieldLooseBase(this, _draggable)[_draggable].subscribe('start', babelHelpers.classPrivateFieldLooseBase(this, _handleDragStart)[_handleDragStart].bind(this));
	    babelHelpers.classPrivateFieldLooseBase(this, _draggable)[_draggable].subscribe('over', babelHelpers.classPrivateFieldLooseBase(this, _handleDragOver)[_handleDragOver].bind(this));
	    babelHelpers.classPrivateFieldLooseBase(this, _draggable)[_draggable].subscribe('end', babelHelpers.classPrivateFieldLooseBase(this, _handleDragEnd)[_handleDragEnd].bind(this));
	    babelHelpers.classPrivateFieldLooseBase(this, _draggable)[_draggable].subscribe('drop', babelHelpers.classPrivateFieldLooseBase(this, _handleDropEnd)[_handleDropEnd].bind(this));
	    babelHelpers.classPrivateFieldLooseBase(this, _draggable)[_draggable].subscribe('dropzone:enter', babelHelpers.classPrivateFieldLooseBase(this, _handleDropZoneEnter)[_handleDropZoneEnter].bind(this));
	    babelHelpers.classPrivateFieldLooseBase(this, _draggable)[_draggable].subscribe('dropzone:out', babelHelpers.classPrivateFieldLooseBase(this, _handleDropZoneOut)[_handleDropZoneOut].bind(this));
	  }
	  destroy() {
	    var _babelHelpers$classPr;
	    (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _draggable)[_draggable]) == null ? void 0 : _babelHelpers$classPr.destroy();
	  }
	}
	function _handleBeforeDragStart2(event) {
	  const data = event.getData();
	  const source = data == null ? void 0 : data.source;
	  const dataset = source == null ? void 0 : source.dataset;
	  if (!dataset) {
	    event.preventDefault();
	    return;
	  }
	  const draggedItemId = babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$1)[_checkListManager$1].prepareItemId(dataset.id);
	  const draggedItem = babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$1)[_checkListManager$1].getItem(draggedItemId);
	  if (!draggedItem) {
	    event.preventDefault();
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].dispatch(`${tasks_v2_const.Model.Interface}/setDisableCheckListAnimations`, true);
	  babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].dispatch(`${tasks_v2_const.Model.Interface}/setDraggedCheckListId`, draggedItem.id);
	  babelHelpers.classPrivateFieldLooseBase(this, _draggedItem)[_draggedItem] = {
	    item: draggedItem,
	    childrenIds: [],
	    enterDropzone: false
	  };
	  if (babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$1)[_checkListManager$1].hasItemChildren(draggedItem)) {
	    main_core.Dom.addClass(source, '--multiple-drag');
	  }
	}
	function _handleDragStart2() {
	  const draggedItem = babelHelpers.classPrivateFieldLooseBase(this, _draggedItem)[_draggedItem].item;
	  if (babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$1)[_checkListManager$1].hasItemChildren(draggedItem)) {
	    const children = babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$1)[_checkListManager$1].getAllChildren(draggedItem.id);
	    babelHelpers.classPrivateFieldLooseBase(this, _draggedItem)[_draggedItem].childrenIds = children.map(child => child.id);
	    babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$1)[_checkListManager$1].hideItems(babelHelpers.classPrivateFieldLooseBase(this, _draggedItem)[_draggedItem].childrenIds, updates => {
	      babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, updates);
	    });
	  }
	}
	function _handleDragOver2(event) {
	  const {
	    source: {
	      dataset
	    },
	    over,
	    clientY
	  } = event.getData();
	  const overedItem = babelHelpers.classPrivateFieldLooseBase(this, _getItemByNode)[_getItemByNode](over);
	  if (overedItem) {
	    const isOverStubItem = overedItem.id === babelHelpers.classPrivateFieldLooseBase(this, _stubItemId$1)[_stubItemId$1];
	    const draggedItemId = babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$1)[_checkListManager$1].prepareItemId(dataset.id);
	    const draggedItem = babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$1)[_checkListManager$1].getItem(draggedItemId);
	    babelHelpers.classPrivateFieldLooseBase(this, _draggedItem)[_draggedItem].item = draggedItem;
	    const overedRootParent = babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$1)[_checkListManager$1].getRootParentByChildId(overedItem.id);
	    const draggedRootParent = babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$1)[_checkListManager$1].getRootParentByChildId(draggedItem.id);
	    const overedRootParentId = isOverStubItem ? overedItem.parentId : overedRootParent.id;
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _canAddItem)[_canAddItem] && overedRootParentId !== draggedRootParent.id) {
	      event.preventDefault();
	      return;
	    }
	    const overMiddlePoint = babelHelpers.classPrivateFieldLooseBase(this, _draggable)[_draggable].getElementMiddlePoint(over);
	    const direction = clientY > overMiddlePoint.y ? 1 : -1;
	    let directionFromBottom = direction === 1;
	    if (isOverStubItem) {
	      directionFromBottom = false;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _isSameLevelMove)[_isSameLevelMove] = draggedItem.parentId === overedItem.parentId;
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isSameLevelMove)[_isSameLevelMove]) {
	      void babelHelpers.classPrivateFieldLooseBase(this, _handleItemMovingOnSameLevel)[_handleItemMovingOnSameLevel](draggedItem, overedItem, directionFromBottom);
	    } else {
	      babelHelpers.classPrivateFieldLooseBase(this, _handleItemMovingOnBetweenLevel)[_handleItemMovingOnBetweenLevel](draggedItem, overedItem, directionFromBottom);
	    }
	  }
	}
	function _handleDragEnd2(event) {
	  const {
	    source,
	    source: {
	      dataset
	    }
	  } = event.getData();
	  const draggedItemId = babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$1)[_checkListManager$1].prepareItemId(dataset.id);
	  const draggedItem = babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$1)[_checkListManager$1].getItem(draggedItemId);
	  main_core.Dom.removeClass(source, '--multiple-drag');
	  if (babelHelpers.classPrivateFieldLooseBase(this, _draggedItem)[_draggedItem].enterDropzone) {
	    return;
	  }
	  this.resortLevel(draggedItem.parentId);
	  babelHelpers.classPrivateFieldLooseBase(this, _handleDrop)[_handleDrop](draggedItem);
	}
	function _handleDropEnd2(event) {
	  const {
	    dropzone,
	    source: {
	      dataset
	    }
	  } = event.getData();
	  const draggedItemId = babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$1)[_checkListManager$1].prepareItemId(dataset.id);
	  const draggedItem = babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$1)[_checkListManager$1].getItem(draggedItemId);
	  const newParentId = babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$1)[_checkListManager$1].prepareItemId(dropzone.dataset.id);
	  if (draggedItem.parentId !== newParentId) {
	    this.resortLevel(draggedItem.parentId);
	  }
	  void babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
	    id: draggedItem.id,
	    fields: {
	      sortIndex: babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$1)[_checkListManager$1].getChildren(newParentId).length + 1,
	      parentId: newParentId,
	      hidden: false
	    }
	  });
	  this.resortLevel(newParentId);
	  babelHelpers.classPrivateFieldLooseBase(this, _handleDrop)[_handleDrop](draggedItem);
	  main_core.Dom.removeClass(dropzone, '--dropzone');
	}
	function _handleDropZoneEnter2(event) {
	  const {
	    dropzone,
	    source: {
	      dataset
	    }
	  } = event.getData();
	  const draggedItemId = babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$1)[_checkListManager$1].prepareItemId(dataset.id);
	  const draggedItem = babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$1)[_checkListManager$1].getItem(draggedItemId);
	  if (!draggedItem) {
	    event.preventDefault();
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _draggedItem)[_draggedItem].enterDropzone = true;
	  babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$1)[_checkListManager$1].hideItems([draggedItemId], updates => {
	    babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, updates);
	  });
	  main_core.Dom.addClass(dropzone, '--dropzone');
	}
	function _handleDropZoneOut2(event) {
	  const {
	    dropzone,
	    source: {
	      dataset
	    }
	  } = event.getData();
	  const draggedItemId = babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$1)[_checkListManager$1].prepareItemId(dataset.id);
	  const draggedItem = babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$1)[_checkListManager$1].getItem(draggedItemId);
	  if (!draggedItem) {
	    event.preventDefault();
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _draggedItem)[_draggedItem].enterDropzone = false;
	  babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$1)[_checkListManager$1].showItems([draggedItemId], updates => {
	    babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, updates);
	  });
	  main_core.Dom.removeClass(dropzone, '--dropzone');
	}
	function _handleDrop2(draggedItem) {
	  const draggedItemChanged = draggedItem.parentId !== babelHelpers.classPrivateFieldLooseBase(this, _draggedItem)[_draggedItem].item.parentId || draggedItem.sortIndex !== babelHelpers.classPrivateFieldLooseBase(this, _draggedItem)[_draggedItem].item.sortIndex;
	  if (draggedItemChanged) {
	    this.emit('update', draggedItem.id);
	  }
	  if (babelHelpers.classPrivateFieldLooseBase(this, _draggedItem)[_draggedItem].childrenIds.length > 0) {
	    babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$1)[_checkListManager$1].showItems(babelHelpers.classPrivateFieldLooseBase(this, _draggedItem)[_draggedItem].childrenIds, updates => {
	      babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, updates);
	    });
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _draggedItem)[_draggedItem] = {
	    item: null,
	    childrenIds: [],
	    enterDropzone: false
	  };
	  babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].dispatch(`${tasks_v2_const.Model.Interface}/setDraggedCheckListId`, null);
	  babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].dispatch(`${tasks_v2_const.Model.Interface}/setDisableCheckListAnimations`, false);
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _isSameLevelMove)[_isSameLevelMove]) {
	    babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$1)[_checkListManager$1].handleTargetParentFilter(draggedItem, babelHelpers.classPrivateFieldLooseBase(this, _currentUserId)[_currentUserId], updates => {
	      setTimeout(() => {
	        babelHelpers.classPrivateFieldLooseBase(this, _store$1)[_store$1].dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, updates);
	      }, 1000);
	    });
	  }
	  this.emit('end', draggedItem.id);
	}
	async function _handleItemMovingOnSameLevel2(draggedItem, overedItem, directionFromBottom) {
	  const isFirstOnLevel = overedItem.sortIndex === 0;
	  const numberOfItemPerLevel = babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$1)[_checkListManager$1].getChildren(overedItem.parentId).length;
	  const isSimpleAndLastOnLevel = overedItem.sortIndex === numberOfItemPerLevel - 1 && !babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$1)[_checkListManager$1].hasItemChildren(overedItem);
	  const shouldSkip = Math.abs(draggedItem.sortIndex - overedItem.sortIndex) === 1 && !isFirstOnLevel && !isSimpleAndLastOnLevel;
	  if (shouldSkip) {
	    return;
	  }
	  this.moveDropPreview(draggedItem, overedItem, directionFromBottom, true);
	  this.resortLevelDependingOnPosition(draggedItem, overedItem, directionFromBottom, true);
	}
	async function _handleItemMovingOnBetweenLevel2(draggedItem, overedItem, directionFromBottom) {
	  const previousParentId = draggedItem.parentId;
	  this.moveDropPreview(draggedItem, overedItem, directionFromBottom, false);
	  this.resortLevelDependingOnPosition(draggedItem, overedItem, directionFromBottom, false);
	  this.resortLevel(previousParentId);
	}
	function _getItemByNode2(node) {
	  const itemId = babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$1)[_checkListManager$1].prepareItemId(node.dataset.id);
	  const isStubItem = itemId === babelHelpers.classPrivateFieldLooseBase(this, _stubItemId$1)[_stubItemId$1];
	  if (isStubItem) {
	    const parentId = babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$1)[_checkListManager$1].prepareItemId(node.dataset.parentId);
	    const sortIndex = babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$1)[_checkListManager$1].getChildren(parentId).length;
	    return {
	      id: babelHelpers.classPrivateFieldLooseBase(this, _stubItemId$1)[_stubItemId$1],
	      parentId,
	      sortIndex
	    };
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$1)[_checkListManager$1].getItem(itemId);
	}

	var _store$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("store");
	var _checkListManager$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("checkListManager");
	var _draggable$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("draggable");
	var _draggedItem$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("draggedItem");
	var _container = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("container");
	var _handleBeforeDragStart$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleBeforeDragStart");
	var _handleDragStart$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleDragStart");
	var _handleDragOver$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleDragOver");
	var _handleDragEnd$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleDragEnd");
	var _handleItemMoving = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleItemMoving");
	var _setYOffset = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setYOffset");
	class CheckListListDragManager extends CheckListDragManager {
	  constructor(params) {
	    super(params);
	    Object.defineProperty(this, _setYOffset, {
	      value: _setYOffset2
	    });
	    Object.defineProperty(this, _handleItemMoving, {
	      value: _handleItemMoving2
	    });
	    Object.defineProperty(this, _handleDragEnd$1, {
	      value: _handleDragEnd2$1
	    });
	    Object.defineProperty(this, _handleDragOver$1, {
	      value: _handleDragOver2$1
	    });
	    Object.defineProperty(this, _handleDragStart$1, {
	      value: _handleDragStart2$1
	    });
	    Object.defineProperty(this, _handleBeforeDragStart$1, {
	      value: _handleBeforeDragStart2$1
	    });
	    Object.defineProperty(this, _store$2, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _checkListManager$2, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _draggable$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _draggedItem$1, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _container, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _store$2)[_store$2] = params.store;
	    babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$2)[_checkListManager$2] = params.checkListManager;
	  }
	  init(container, offsetX = 0) {
	    babelHelpers.classPrivateFieldLooseBase(this, _container)[_container] = container;
	    babelHelpers.classPrivateFieldLooseBase(this, _draggable$1)[_draggable$1] = new ui_draganddrop_draggable.Draggable({
	      container: babelHelpers.classPrivateFieldLooseBase(this, _container)[_container],
	      draggable: '.check-list-draggable-list',
	      dragElement: '.check-list-drag-list',
	      delay: 0,
	      type: ui_draganddrop_draggable.Draggable.MOVE,
	      offset: {
	        x: offsetX
	      }
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _draggable$1)[_draggable$1].subscribe('beforeStart', babelHelpers.classPrivateFieldLooseBase(this, _handleBeforeDragStart$1)[_handleBeforeDragStart$1].bind(this));
	    babelHelpers.classPrivateFieldLooseBase(this, _draggable$1)[_draggable$1].subscribe('start', babelHelpers.classPrivateFieldLooseBase(this, _handleDragStart$1)[_handleDragStart$1].bind(this));
	    babelHelpers.classPrivateFieldLooseBase(this, _draggable$1)[_draggable$1].subscribe('over', babelHelpers.classPrivateFieldLooseBase(this, _handleDragOver$1)[_handleDragOver$1].bind(this));
	    babelHelpers.classPrivateFieldLooseBase(this, _draggable$1)[_draggable$1].subscribe('end', babelHelpers.classPrivateFieldLooseBase(this, _handleDragEnd$1)[_handleDragEnd$1].bind(this));
	  }
	  destroy() {
	    var _babelHelpers$classPr;
	    (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _draggable$1)[_draggable$1]) == null ? void 0 : _babelHelpers$classPr.destroy();
	  }
	}
	function _handleBeforeDragStart2$1(event) {
	  const data = event.getData();
	  const source = data == null ? void 0 : data.source;
	  const dataset = source == null ? void 0 : source.dataset;
	  if (!dataset) {
	    event.preventDefault();
	    return;
	  }
	  const draggedItemId = babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$2)[_checkListManager$2].prepareItemId(dataset.id);
	  const draggedItem = babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$2)[_checkListManager$2].getItem(draggedItemId);
	  if (!draggedItem) {
	    event.preventDefault();
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _draggedItem$1)[_draggedItem$1] = draggedItem;
	  babelHelpers.classPrivateFieldLooseBase(this, _setYOffset)[_setYOffset](source);
	}
	function _handleDragStart2$1(event) {
	  babelHelpers.classPrivateFieldLooseBase(this, _store$2)[_store$2].dispatch(`${tasks_v2_const.Model.Interface}/setDisableCheckListAnimations`, true);
	  babelHelpers.classPrivateFieldLooseBase(this, _store$2)[_store$2].dispatch(`${tasks_v2_const.Model.Interface}/setDraggedCheckListId`, babelHelpers.classPrivateFieldLooseBase(this, _draggedItem$1)[_draggedItem$1].id);
	}
	function _handleDragOver2$1(event) {
	  const {
	    over,
	    clientY
	  } = event.getData();
	  const overedItemId = babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$2)[_checkListManager$2].prepareItemId(over.dataset.id);
	  const overedItem = babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$2)[_checkListManager$2].getItem(overedItemId);
	  if (overedItem) {
	    const overMiddlePoint = babelHelpers.classPrivateFieldLooseBase(this, _draggable$1)[_draggable$1].getElementMiddlePoint(over);
	    const direction = clientY > overMiddlePoint.y ? 1 : -1;
	    const directionFromBottom = direction === 1;
	    void babelHelpers.classPrivateFieldLooseBase(this, _handleItemMoving)[_handleItemMoving](babelHelpers.classPrivateFieldLooseBase(this, _draggedItem$1)[_draggedItem$1], overedItem, directionFromBottom);
	  }
	}
	function _handleDragEnd2$1(event) {
	  const {
	    source: {
	      dataset
	    }
	  } = event.getData();
	  const draggedItemId = babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$2)[_checkListManager$2].prepareItemId(dataset.id);
	  const draggedItem = babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$2)[_checkListManager$2].getItem(draggedItemId);
	  this.resortLevel(draggedItem.parentId);
	  const draggedItemChanged = draggedItem.sortIndex !== babelHelpers.classPrivateFieldLooseBase(this, _draggedItem$1)[_draggedItem$1].sortIndex;
	  if (draggedItemChanged) {
	    this.emit('update', draggedItem.id);
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _store$2)[_store$2].dispatch(`${tasks_v2_const.Model.Interface}/setDraggedCheckListId`, null);
	  babelHelpers.classPrivateFieldLooseBase(this, _store$2)[_store$2].dispatch(`${tasks_v2_const.Model.Interface}/setDisableCheckListAnimations`, false);
	  babelHelpers.classPrivateFieldLooseBase(this, _draggedItem$1)[_draggedItem$1] = null;
	  this.emit('end', draggedItem.id);
	}
	function _handleItemMoving2(draggedItem, overedItem, directionFromBottom) {
	  const isFirstOnLevel = overedItem.sortIndex === 0;
	  const numberOfItemPerLevel = babelHelpers.classPrivateFieldLooseBase(this, _checkListManager$2)[_checkListManager$2].getChildren(overedItem.parentId).length;
	  const isLastOnLevel = overedItem.sortIndex === numberOfItemPerLevel - 1;
	  const shouldSkip = Math.abs(draggedItem.sortIndex - overedItem.sortIndex) === 1 && !isFirstOnLevel && !isLastOnLevel;
	  if (shouldSkip) {
	    return;
	  }
	  this.moveDropPreview(draggedItem, overedItem, directionFromBottom, true);
	  this.resortLevelDependingOnPosition(draggedItem, overedItem, directionFromBottom, true);
	}
	function _setYOffset2(draggedItemElement) {
	  const relativePosition = main_core.Dom.getRelativePosition(draggedItemElement, babelHelpers.classPrivateFieldLooseBase(this, _container)[_container]);
	  const relativeTop = relativePosition.top;
	  const isTopItem = relativeTop <= 0;
	  const offsetY = isTopItem ? relativeTop : 0;
	  const options = babelHelpers.classPrivateFieldLooseBase(this, _draggable$1)[_draggable$1].getOptions();
	  options.offset.y = -offsetY;
	  babelHelpers.classPrivateFieldLooseBase(this, _draggable$1)[_draggable$1].setOptions(options);
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
	    canAdd() {
	      if (!this.isEdit) {
	        return true;
	      }
	      return this.task.rights.checklistAdd;
	    },
	    canEdit() {
	      var _this$item, _checkListItem$creato;
	      if (!this.isEdit) {
	        return true;
	      }
	      const checkListItem = this.checkListManager.getRootParentByChildId((_this$item = this.item) == null ? void 0 : _this$item.id);
	      return this.task.rights.checklistEdit || (checkListItem == null ? void 0 : (_checkListItem$creato = checkListItem.creator) == null ? void 0 : _checkListItem$creato.id) === this.currentUserId;
	    },
	    canModify() {
	      var _this$item2;
	      return ((_this$item2 = this.item) == null ? void 0 : _this$item2.actions.modify) === true;
	    },
	    canRemove() {
	      var _this$item3;
	      return ((_this$item3 = this.item) == null ? void 0 : _this$item3.actions.remove) === true;
	    },
	    canToggle() {
	      var _this$item4;
	      return ((_this$item4 = this.item) == null ? void 0 : _this$item4.actions.toggle) === true;
	    },
	    hasAttachments() {
	      return this.hasUsers;
	    },
	    hasUsers() {
	      return this.hasAccomplices || this.hasAuditors;
	    },
	    hasAccomplices() {
	      var _this$accomplices;
	      return ((_this$accomplices = this.accomplices) == null ? void 0 : _this$accomplices.length) > 0;
	    },
	    hasAuditors() {
	      var _this$auditors;
	      return ((_this$auditors = this.auditors) == null ? void 0 : _this$auditors.length) > 0;
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
	    groupMode() {
	      var _this$item$groupMode;
	      return ((_this$item$groupMode = this.item.groupMode) == null ? void 0 : _this$item$groupMode.active) === true;
	    },
	    groupModeSelected() {
	      var _this$item$groupMode2;
	      return ((_this$item$groupMode2 = this.item.groupMode) == null ? void 0 : _this$item$groupMode2.selected) === true;
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
	    async complete(isComplete) {
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
	          if (this.isPreview && this.isEdit) {
	            this.saveCompleteState(id, fields.isComplete);
	          }
	        });
	      };
	      this.addCheckListCompletionCallback({
	        id: this.id,
	        callback: completionCallback
	      });
	      if (this.isPreview && this.isEdit) {
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
	      var _this$$parent$$el;
	      await new Promise(resolve => {
	        setTimeout(() => resolve(), 300);
	      });
	      const item = this.$refs.item;
	      const scrollContainer = (_this$$parent$$el = this.$parent.$el) == null ? void 0 : _this$$parent$$el.closest('[data-list]');
	      const itemRect = main_core.Dom.getPosition(item);
	      const containerRect = main_core.Dom.getPosition(scrollContainer);
	      const offsetTopInsideContainer = itemRect.top - containerRect.top + scrollContainer.scrollTop;
	      scrollContainer.scrollTo({
	        top: offsetTopInsideContainer - 200,
	        behavior: 'smooth'
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
	        var _checklist$localCompl;
	        if (checklist.parentId !== this.id) {
	          return false;
	        }
	        return (_checklist$localCompl = checklist.localCompleteState) != null ? _checklist$localCompl : checklist.isComplete;
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
	    var _this$$parent$$el;
	    this.scrollContainer = (_this$$parent$$el = this.$parent.$el) == null ? void 0 : _this$$parent$$el.closest('[data-list]');
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
	          var _item$localCompleteSt;
	          const completed = (_item$localCompleteSt = item.localCompleteState) != null ? _item$localCompleteSt : item.isComplete;
	          return !this.item.areCompletedCollapsed || !completed;
	        }).map(item => item.id);
	        this.checkListManager.showItems(childrenIds, updates => this.upsertCheckLists(updates));
	      }
	    },
	    handleCompleteState() {
	      if (this.totalCount > 0) {
	        this.complete(this.totalCount === this.completedCount);
	      } else if (this.completed) {
	        this.complete(false);
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
			class="check-list-widget-parent-item"
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
					:fontSize
					:lineHeight="20"
					:fontWeight="500"
					@click="handleTextClick"
					@update:modelValue="updateTitle"
					@input="updateTitle"
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
					<div class="check-list-widget-parent-item-main-action-actions">
						<BIcon ref="more" :name="Outline.MORE_L" @click="showMenu"/>
						<BIcon
							:name="collapsed ? Outline.CHEVRON_DOWN_L : Outline.CHEVRON_TOP_L"
							@click="toggleCollapse()"
						/>
					</div>
				</div>
				<div v-if="isSticky && !isPreview" class="check-list-widget-parent-item-empty"/>
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
	        var _this$$refs$growingTe;
	        (_this$$refs$growingTe = this.$refs.growingTextArea) == null ? void 0 : _this$$refs$growingTe.focusTextarea();
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
	      var _this$files;
	      this.filesLoading = true;
	      const ids = (_this$files = this.files) == null ? void 0 : _this$files.map(file => {
	        var _file$id;
	        return (_file$id = file == null ? void 0 : file.id) != null ? _file$id : file;
	      });
	      await this.fileService.list(ids != null ? ids : []);
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
	      if (this.isClickInsideFilesWidget(filesWidget == null ? void 0 : filesWidget.$el, event.target)) {
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
			class="check-list-widget-child-item"
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
					:fontSize="15"
					:lineHeight="20"
					@update:modelValue="updateTitle"
					@input="updateTitle"
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
				<div class="check-list-widget-item-attach">
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
			class="check-list-widget-add-item"
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
			<div class="check-list-widget-group-completed-list-action">
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
	    var _this$itemDragManager;
	    (_this$itemDragManager = this.itemDragManager) == null ? void 0 : _this$itemDragManager.destroy();
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
	      var _childWithEmptyTitle$;
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
	        targetId: (_childWithEmptyTitle$ = childWithEmptyTitle == null ? void 0 : childWithEmptyTitle.id) != null ? _childWithEmptyTitle$ : focusedItem.id,
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
	      var _this$$refs$parentCom;
	      let offsetX = 0;
	      if (this.context !== Context.Popup && main_core.Type.isElementNode(this.$root.$el)) {
	        const parentRect = main_core.Dom.getPosition(this.$el);
	        const parentRelativeRect = main_core.Dom.getRelativePosition(this.$el, this.$root.$el);
	        offsetX = parentRelativeRect.left - parentRect.left;
	      }
	      this.listDragManager.init(this.scrollContainer, offsetX);
	      const listDropzone = this.canAddItem ? (_this$$refs$parentCom = this.$refs.parentComponents) == null ? void 0 : _this$$refs$parentCom.map(parent => parent.$el) : [];
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
	        items: section.items.filter(item => this.visibleActions.includes(item.action)).map(item => {
	          var _item$hoverable;
	          return {
	            ...item,
	            disabled: this.isItemDisabled(item),
	            active: this.isItemActive(item),
	            hoverable: (_item$hoverable = item.hoverable) != null ? _item$hoverable : true
	          };
	        })
	      })).filter(section => section.items.length > 0);
	    },
	    tooltip() {
	      return () => {
	        var _this$currentHintElem, _this$currentHintElem2;
	        return {
	          text: this.currentHintText,
	          timeout: 500,
	          popupOptions: {
	            className: 'tasks-hint',
	            background: 'var(--ui-color-bg-content-inapp)',
	            darkMode: false,
	            offsetLeft: -((_this$currentHintElem = (_this$currentHintElem2 = this.currentHintElement) == null ? void 0 : _this$currentHintElem2.offsetWidth) != null ? _this$currentHintElem : 0),
	            padding: 6,
	            bindOptions: {
	              forceBindPosition: true,
	              forceTop: true,
	              position: 'top'
	            },
	            targetContainer: document.body
	          }
	        };
	      };
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
	      var _this$currentItem$gro;
	      if (!this.currentItem) {
	        return false;
	      }
	      return ((_this$currentItem$gro = this.currentItem.groupMode) == null ? void 0 : _this$currentItem$gro.selected) === true;
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
	      var _item$disabled;
	      return (_item$disabled = item.disabled) != null ? _item$disabled : this.disabledActions.includes(item.action);
	    },
	    isItemActive(item) {
	      var _item$active;
	      return (_item$active = item.active) != null ? _item$active : this.activeActions.includes(item.action);
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

	var _interval = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("interval");
	var _timerValue = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("timerValue");
	var _counter = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("counter");
	var _content = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("content");
	var _balloonWithTimer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("balloonWithTimer");
	var _startTimer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("startTimer");
	var _handleCancelClick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleCancelClick");
	var _handleClosingBalloon = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleClosingBalloon");
	var _getBalloonContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getBalloonContent");
	class CheckListNotifier extends main_core_events.EventEmitter {
	  constructor(params) {
	    super();
	    Object.defineProperty(this, _getBalloonContent, {
	      value: _getBalloonContent2
	    });
	    Object.defineProperty(this, _handleClosingBalloon, {
	      value: _handleClosingBalloon2
	    });
	    Object.defineProperty(this, _handleCancelClick, {
	      value: _handleCancelClick2
	    });
	    Object.defineProperty(this, _startTimer, {
	      value: _startTimer2
	    });
	    Object.defineProperty(this, _interval, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _timerValue, {
	      writable: true,
	      value: 5
	    });
	    Object.defineProperty(this, _counter, {
	      writable: true,
	      value: 5
	    });
	    Object.defineProperty(this, _content, {
	      writable: true,
	      value: ''
	    });
	    Object.defineProperty(this, _balloonWithTimer, {
	      writable: true,
	      value: void 0
	    });
	    this.setEventNamespace('Tasks.V2.CheckList.CheckListNotifier');
	    babelHelpers.classPrivateFieldLooseBase(this, _content)[_content] = params.content;
	    babelHelpers.classPrivateFieldLooseBase(this, _timerValue)[_timerValue] = main_core.Type.isUndefined(params.timerValue) ? babelHelpers.classPrivateFieldLooseBase(this, _timerValue)[_timerValue] : params.timerValue;
	  }
	  showBalloonWithTimer() {
	    babelHelpers.classPrivateFieldLooseBase(this, _counter)[_counter] = babelHelpers.classPrivateFieldLooseBase(this, _timerValue)[_timerValue];
	    const balloonId = `check-list-balloon-${main_core.Text.getRandom()}`;
	    babelHelpers.classPrivateFieldLooseBase(this, _balloonWithTimer)[_balloonWithTimer] = ui_notification.UI.Notification.Center.notify({
	      id: balloonId,
	      content: babelHelpers.classPrivateFieldLooseBase(this, _getBalloonContent)[_getBalloonContent](),
	      actions: [{
	        title: main_core.Loc.getMessage('TASKS_V2_CHECK_LIST_BALLOON_CANCEL'),
	        events: {
	          mouseup: babelHelpers.classPrivateFieldLooseBase(this, _handleCancelClick)[_handleCancelClick].bind(this)
	        }
	      }]
	    });
	    const handler = baseEvent => {
	      const closingBalloon = baseEvent.getTarget();
	      if (closingBalloon.getId() === balloonId) {
	        babelHelpers.classPrivateFieldLooseBase(this, _handleClosingBalloon)[_handleClosingBalloon]();
	        main_core_events.EventEmitter.unsubscribe('UI.Notification.Balloon:onClose', handler);
	      }
	    };
	    main_core_events.EventEmitter.subscribe('UI.Notification.Balloon:onClose', handler);
	    babelHelpers.classPrivateFieldLooseBase(this, _startTimer)[_startTimer]();
	  }
	  stopTimer() {
	    babelHelpers.classPrivateFieldLooseBase(this, _balloonWithTimer)[_balloonWithTimer].close();
	  }
	}
	function _startTimer2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _interval)[_interval] = setInterval(() => {
	    babelHelpers.classPrivateFieldLooseBase(this, _counter)[_counter]--;
	    babelHelpers.classPrivateFieldLooseBase(this, _balloonWithTimer)[_balloonWithTimer].update({
	      content: babelHelpers.classPrivateFieldLooseBase(this, _getBalloonContent)[_getBalloonContent]()
	    });
	    if (babelHelpers.classPrivateFieldLooseBase(this, _counter)[_counter] <= 0) {
	      this.stopTimer();
	    }
	  }, 1000);
	}
	function _handleCancelClick2() {
	  this.emit('complete', false);
	  babelHelpers.classPrivateFieldLooseBase(this, _balloonWithTimer)[_balloonWithTimer].close();
	}
	function _handleClosingBalloon2() {
	  clearInterval(babelHelpers.classPrivateFieldLooseBase(this, _interval)[_interval]);
	  this.emit('complete', true);
	}
	function _getBalloonContent2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _content)[_content].replace('#countdown#', babelHelpers.classPrivateFieldLooseBase(this, _counter)[_counter]);
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
	      resizeObserver: null,
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
	      checkListWasUpdated: false,
	      lastUpdatedCheckListId: 0,
	      itemId: null,
	      itemPanelStyles: {
	        top: '0',
	        display: 'flex'
	      },
	      isItemPanelFreeze: false,
	      itemPanelTopOffset: this.isAutonomous ? 5 : 2,
	      itemPanelTopLimit: this.isAutonomous ? 450 : 700,
	      itemsRefs: {},
	      isForwardMenuShown: false,
	      forwardMenuSectionCode: 'createSection',
	      forwardBindElement: null,
	      shownPopups: new Set(),
	      notifiers: new Map(),
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
	      var _this$currentItem$gro;
	      if (!this.currentItem) {
	        return false;
	      }
	      return ((_this$currentItem$gro = this.currentItem.groupMode) == null ? void 0 : _this$currentItem$gro.selected) === true;
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
	    checkListWasUpdated(value) {
	      if (!this.currentItem) {
	        return;
	      }
	      if (value === true) {
	        const parentItem = this.checkListManager.getRootParentByChildId(this.currentItem.id);
	        this.lastUpdatedCheckListId = parentItem ? parentItem.id : 0;
	      }
	    },
	    checkListId(value) {
	      const isNewCheckList = main_core.Type.isString(value);
	      if (isNewCheckList) {
	        this.checkListWasUpdated = true;
	      }
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
	      this.checkListWasUpdated = true;
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
	      const checkListId = this.lastUpdatedCheckListId === 0 ? this.checkListId : this.lastUpdatedCheckListId;
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
	      var _actionHandlers$actio;
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
	      (_actionHandlers$actio = actionHandlers[action]) == null ? void 0 : _actionHandlers$actio.call(actionHandlers, node);
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
	        this.checkListWasUpdated = false;
	      }
	      if (this.checkListWasUpdated && this.isEdit) {
	        const deletingIds = new Set(Object.values(this.deletingCheckListIds));
	        const fullListDeletingIds = this.checkListManager.expandIdsWithChildren(deletingIds);
	        const checkListsToSave = this.checkLists.filter(checkList => {
	          return !fullListDeletingIds.has(checkList.id);
	        });
	        await tasks_v2_provider_service_checkListService.checkListService.save(this.taskId, checkListsToSave);
	      }
	      this.checkListWasUpdated = false;
	    },
	    isDemoCheckListModified() {
	      if (this.getCheckListsNumber() > 1) {
	        return true;
	      }
	      const [checkList] = this.checkLists;
	      if (!checkList) {
	        return false;
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
	      this.checkListWasUpdated = true;
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
	        var _itemRef$$refs$growin;
	        const itemRef = this.getItemsRef(itemId);
	        itemRef == null ? void 0 : (_itemRef$$refs$growin = itemRef.$refs.growingTextArea) == null ? void 0 : _itemRef$$refs$growin.focusTextarea();
	        if (highlight) {
	          void tasks_v2_lib_highlighter.highlighter.highlight(itemRef == null ? void 0 : itemRef.$refs.item);
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
	      if (item != null && item.title || item.parentId === 0) {
	        this.checkListWasUpdated = true;
	      }
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
	      if (this.itemPanelIsShown === false) {
	        return;
	      }
	      const itemRef = this.$refs.list.querySelector([`[data-id="${this.currentItem.id}"]`]);
	      const panelRect = main_core.Dom.getPosition(this.$refs.panel.$el);
	      const listRect = main_core.Dom.getPosition(this.$refs.list);
	      const itemRect = main_core.Dom.getRelativePosition(itemRef, this.$refs.list);
	      const isParentItem = this.currentItem.parentId === 0;
	      const paddingOffset = 18;
	      const panelWidth = panelRect.width === 0 ? 304 : panelRect.width;
	      const top = itemRect.top - 28;
	      const topLimitValue = isParentItem ? -30 : 40;
	      const panelVisible = top > topLimitValue && top < this.itemPanelTopLimit;
	      const topPopupLimitValue = isParentItem ? 0 : 70;
	      const popupVisible = top > topPopupLimitValue && top < this.itemPanelTopLimit;
	      if (!popupVisible) {
	        this.shownPopups.forEach(popup => {
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
	      this.checkListWasUpdated = true;
	    },
	    attachFile(node) {
	      var _this$fileServiceInst;
	      (_this$fileServiceInst = this.fileServiceInstances) != null ? _this$fileServiceInst : this.fileServiceInstances = new Map();
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
	        this.checkListWasUpdated = true;
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
	      return files.length > 0 || (fileServiceInstance == null ? void 0 : fileServiceInstance.isUploading()) || (fileServiceInstance == null ? void 0 : fileServiceInstance.hasUploadingError());
	    },
	    hasItemUsers(item) {
	      return item.accomplices.length > 0 || item.auditors.length > 0;
	    },
	    getItemIdWithUploadingFiles() {
	      var _find;
	      if (!this.fileServiceInstances) {
	        return null;
	      }
	      return (_find = [...this.fileServiceInstances.values()].find(fileServiceInstance => fileServiceInstance.isUploading())) == null ? void 0 : _find.getEntityId();
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
	        var _item$groupMode;
	        void this.upsertCheckLists(updates);
	        this.checkListWasUpdated = true;
	        if (!((_item$groupMode = item.groupMode) != null && _item$groupMode.active)) {
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
	        var _item$groupMode2;
	        void this.upsertCheckLists(updates);
	        this.checkListWasUpdated = true;
	        if (!((_item$groupMode2 = item.groupMode) != null && _item$groupMode2.active)) {
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
	      this.checkListWasUpdated = true;
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
	      const ids = this.currentItem[type].map(user => user.id);
	      const itemId = this.currentItem.id;
	      const handleClose = usersIds => {
	        this.saveParticipants(itemId, type, usersIds);
	        this.isItemPanelFreeze = false;
	        if (!this.itemGroupModeSelected && this.currentItem.id === itemId) {
	          this.focusToItem(itemId);
	        }
	        this.updatePanelPosition();
	      };
	      void tasks_v2_lib_userSelectorDialog.usersDialog.show({
	        targetNode,
	        ids,
	        withAngle: true,
	        onClose: handleClose
	      });
	      this.isItemPanelFreeze = true;
	    },
	    async saveParticipants(id, type, usersIds) {
	      const users = this.$store.getters[`${tasks_v2_const.Model.Users}/getByIds`](usersIds);
	      if (this.itemGroupModeSelected) {
	        const updates = this.checkListManager.getAllSelectedItems().map(item => ({
	          ...item,
	          [type]: users
	        }));
	        void this.upsertCheckLists(updates);
	      } else {
	        void this.updateCheckList(id, {
	          [type]: users
	        });
	      }
	      const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(this.taskId);
	      const existingIds = task[`${type}Ids`];
	      const mergedIds = [...new Set([...existingIds, ...usersIds])];
	      const fields = {
	        [`${type}Ids`]: mergedIds
	      };
	      void this.updateTask(fields);
	      this.checkListWasUpdated = true;
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
	      var _this$$refs$childComp, _this$$refs$childComp2, _this$$refs$childComp3;
	      this.isFreeze = true;
	      (_this$$refs$childComp = this.$refs.childComponent) == null ? void 0 : (_this$$refs$childComp2 = _this$$refs$childComp.$refs) == null ? void 0 : (_this$$refs$childComp3 = _this$$refs$childComp2.childComponent) == null ? void 0 : _this$$refs$childComp3.freeze();
	    },
	    unfreeze() {
	      var _this$$refs$childComp4, _this$$refs$childComp5, _this$$refs$childComp6;
	      if (this.hasEmptyItem() || this.getItemIdWithUploadingFiles()) {
	        return;
	      }
	      this.isFreeze = false;
	      (_this$$refs$childComp4 = this.$refs.childComponent) == null ? void 0 : (_this$$refs$childComp5 = _this$$refs$childComp4.$refs) == null ? void 0 : (_this$$refs$childComp6 = _this$$refs$childComp5.childComponent) == null ? void 0 : _this$$refs$childComp6.unfreeze();
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
					<div v-show="!stub && !isPreview" class="tasks-check-list-footer" :class="contextClass">
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
	      var _this$task$checklist;
	      return (_this$task$checklist = this.task.checklist) == null ? void 0 : _this$task$checklist.some(itemId => {
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
	    this.$bitrix.eventEmitter.subscribe(tasks_v2_const.EventName.AiAddCheckList, this.handleAiAdd);
	    this.$bitrix.eventEmitter.subscribe(tasks_v2_const.EventName.CloseCheckList, this.handleFieldClose);
	  },
	  beforeUnmount() {
	    this.$bitrix.eventEmitter.unsubscribe(tasks_v2_const.EventName.AiAddCheckList, this.handleAiAdd);
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
	    async handleAiAdd(baseEvent) {
	      const checkListId = await this.buildAiCheckList(baseEvent.getData());
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
	    async buildAiCheckList(baseText) {
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

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX.Tasks.V2.Lib,BX.Vue3.Components,BX.UI.Vue3.Components,BX.Tasks.V2.Component.Elements,BX.UI.DragAndDrop,BX.UI.Vue3.Components,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements,BX.Vue3.Vuex,BX.UI.System.Skeleton.Vue,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Lib,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements,BX,BX.Vue3.Directives,BX.Tasks.V2,BX.Tasks.V2.Component.Elements,BX,BX,BX.Event,BX.Tasks.V2.Provider.Service,BX.UI.System.Chip.Vue,BX.UI.IconSet,BX,BX,BX.Tasks.V2.Const,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service));
//# sourceMappingURL=check-list.bundle.js.map
