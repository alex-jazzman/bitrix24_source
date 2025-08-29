/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,main_popup,ui_entitySelector,tasks_v2_component_elements_participantList,tasks_v2_core,tasks_v2_lib_entitySelectorDialog,ui_vue3_components_button,ui_vue3_components_popup,ui_vue3_vuex,tasks_v2_component_elements_bottomSheet,tasks_v2_provider_service_checkListService,ui_vue3_components_menu,tasks_v2_component_elements_progressBar,ui_uploader_core,disk_uploader_userFieldWidget,tasks_v2_component_elements_growingTextArea,tasks_v2_component_elements_userAvatarList,ui_vue3_directives_hint,ui_iconSet_api_vue,tasks_v2_component_elements_hint,main_core_events,ui_notification,main_core,ui_iconSet_api_core,ui_iconSet_outline,tasks_v2_lib_fieldHighlighter,tasks_v2_component_elements_chip,tasks_v2_provider_service_fileService,tasks_v2_const) {
	'use strict';

	// @vue/component
	const CheckListStub = {
	  name: 'CheckListStub',
	  components: {
	    UiButton: ui_vue3_components_button.Button
	  },
	  emits: ['click'],
	  setup() {
	    return {
	      ButtonSize: ui_vue3_components_button.ButtonSize
	    };
	  },
	  template: `
		<div class="check-list-stub">
			<div class="check-list-stub-title">
				{{ loc('TASKS_V2_CHECK_LIST_STUB_TITLE') }}
			</div>
			<div class="check-list-stub-icon"></div>
			<div class="check-list-stub-btn">
				<UiButton
					:text="loc('TASKS_V2_CHECK_LIST_STUB_BTN')"
					:size="ButtonSize.MEDIUM"
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
	  inheritAttrs: false,
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    }
	  },
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
	    popupOptions() {
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
	          onClose: this.handleClose.bind(this)
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
	    }
	  },
	  template: `
		<Popup :options="popupOptions" ref="childComponent">
			<slot
				:handleShow="handleShow"
				:handleClose="handleClose"
			></slot>
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
	    isShown: {
	      type: Boolean,
	      required: true
	    }
	  },
	  emits: ['show', 'close', 'isShown'],
	  data() {
	    return {
	      isExpanded: false
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      titleFieldOffsetHeight: `${tasks_v2_const.Model.Interface}/titleFieldOffsetHeight`
	    })
	  },
	  watch: {
	    titleFieldOffsetHeight() {
	      var _this$$refs$childComp;
	      (_this$$refs$childComp = this.$refs.childComponent) == null ? void 0 : _this$$refs$childComp.adjustPosition();
	    },
	    async isShown(value) {
	      await this.$nextTick();
	      this.$emit('isShown', value);
	    }
	  },
	  methods: {
	    handleShow() {
	      this.$emit('show');
	    },
	    handleClose() {
	      this.$emit('close');
	    }
	  },
	  template: `
		<BottomSheet
			:isShown="isShown"
			:isExpanded="isExpanded"
			:class="'--check-list'"
			ref="childComponent"
		>
			<slot
				:handleShow="handleShow"
				:handleClose="handleClose"
			></slot>
		</BottomSheet>
	`
	};

	var _params = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("params");
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
	    Object.defineProperty(this, _params, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _params)[_params] = params;
	  }
	  getItem(itemId) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().find(item => item.id === itemId);
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
	  syncParentCompletionState(itemId, updateFn, parentItemId) {
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
	    const allChildrenCompleted = childrenItems.every(child => child.isComplete);
	    const someChildrenIncomplete = childrenItems.some(child => !child.isComplete);
	    const shouldUpdateParent = isEmptyParent || allChildrenCompleted && !parentItem.isComplete || someChildrenIncomplete && parentItem.isComplete;
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
	      const children = allItems.filter(item => parentIds.includes(item.parentId) && !result.has(item.id));
	      children.forEach(child => result.set(child.id, child));
	      if (children.length > 0) {
	        getChildren(children.map(child => child.id));
	      }
	    };
	    getChildren(selectedItems.map(item => item.id));
	    return Array.from(result.values());
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
	  getAllCompletedChildrenChildren(itemId) {
	    return this.getAllChildren(itemId).filter(item => item.isComplete === true);
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
	  resortItemsAfterIndex(parentId, sortIndex, updateFn) {
	    const allItems = babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().filter(item => item.parentId === parentId);
	    const itemsToResort = allItems.filter(item => item.sortIndex >= sortIndex).sort((a, b) => a.sortIndex - b.sortIndex);
	    const updates = itemsToResort.map(item => ({
	      ...item,
	      sortIndex: item.sortIndex + 1
	    }));
	    if (updates.length > 0) {
	      updateFn(updates);
	    }
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
	  getFirstChild(itemId) {
	    const children = babelHelpers.classPrivateFieldLooseBase(this, _getCheckLists)[_getCheckLists]().filter(item => item.parentId === itemId).sort((a, b) => a.sortIndex - b.sortIndex);
	    return children[0] || null;
	  }
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

	const checkListMeta = Object.freeze({
	  id: 'checklist',
	  title: main_core.Loc.getMessage('TASKS_V2_CHECK_LIST_TITLE')
	});

	// @vue/component
	const CheckListList = {
	  name: 'TaskCheckListList',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    }
	  },
	  emits: ['open', 'addFastCheckList'],
	  setup() {
	    return {
	      Animated: ui_iconSet_api_core.Animated,
	      Outline: ui_iconSet_api_core.Outline,
	      checkListMeta
	    };
	  },
	  data() {
	    return {
	      checkListManager: null
	    };
	  },
	  computed: {
	    task() {
	      return this.$store.getters[`${tasks_v2_const.Model.Tasks}/getById`](this.taskId);
	    },
	    checkLists() {
	      return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getByIds`](this.task.checklist);
	    },
	    isLoading() {
	      return this.checkLists.length === 0;
	    },
	    containsChecklist() {
	      return this.task.containsChecklist;
	    }
	  },
	  async created() {
	    this.checkListManager = new CheckListManager({
	      computed: {
	        checkLists: () => this.checkLists
	      }
	    });
	    if (this.containsChecklist) {
	      void this.loadData();
	    }
	  },
	  methods: {
	    async loadData() {
	      await tasks_v2_provider_service_checkListService.checkListService.load(this.taskId);
	    }
	  },
	  template: `
		<div
			:data-task-field-id="checkListMeta.id"
			class="tasks-check-list-list"
			:class="{ '--default': isLoading }"
		>
			<div
				class="tasks-check-list-list-content"
				:class="{ '--default': isLoading }"
			>
				<template v-if="isLoading">
					<div class="tasks-check-list-list-content-row">
						<BIcon :name="Animated.LOADER_WAIT"/>
						<div class="tasks-check-list-list-content-text">
							{{ loc('TASKS_V2_CHECK_LIST_LOADING') }}
						</div>
					</div>
				</template>
				<template v-else>
					<slot></slot>
					<div class="tasks-check-list-list-content-row --footer">
						<div
							class="tasks-check-list-list-content-btn"
							@click="$emit('addFastCheckList')"
						>
							<BIcon :name="Outline.PLUS_L"/>
							<div class="tasks-check-list-list-content-btn-text">
								{{ loc('TASKS_V2_CHECK_LIST_ADD_LABEL') }}
							</div>
						</div>
					</div>
				</template>
			</div>
		</div>
	`
	};

	// @vue/component
	const CheckListItemMixin = {
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    },
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
	  data() {
	    return {
	      isHovered: false,
	      scrollContainer: null
	    };
	  },
	  computed: {
	    task() {
	      return this.$store.getters[`${tasks_v2_const.Model.Tasks}/getById`](this.taskId);
	    },
	    checkLists() {
	      return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getByIds`](this.task.checklist);
	    },
	    item() {
	      return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getById`](this.id);
	    },
	    canModify() {
	      return this.item.actions.modify === true;
	    },
	    canRemove() {
	      return this.item.actions.remove === true;
	    },
	    canToggle() {
	      return this.item.actions.toggle === true;
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
	      return this.item.isComplete ? 'var(--ui-color-base-4)' : 'var(--ui-color-base-1)';
	    },
	    groupMode() {
	      var _this$item$groupMode;
	      return ((_this$item$groupMode = this.item.groupMode) == null ? void 0 : _this$item$groupMode.active) === true;
	    },
	    groupModeSelected() {
	      var _this$item$groupMode2;
	      return ((_this$item$groupMode2 = this.item.groupMode) == null ? void 0 : _this$item$groupMode2.selected) === true;
	    }
	  },
	  methods: {
	    handleFocus() {
	      this.$emit('focus', this.id);
	    },
	    handleBlur() {
	      this.$emit('blur', this.id);
	    },
	    handleEmptyBlur() {
	      this.$emit('emptyBlur', this.id);
	    },
	    updateTitle(title = '') {
	      this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
	        id: this.id,
	        fields: {
	          title
	        }
	      });
	      this.$emit('update');
	    },
	    addItem(sort) {
	      this.$emit('addItem', {
	        id: this.id,
	        sort: main_core.Type.isNumber(sort) ? sort : null
	      });
	    },
	    removeItem() {
	      this.$emit('removeItem', this.id);
	    },
	    getChildren(itemId) {
	      return this.checkLists.filter(item => {
	        return item.parentId === itemId;
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
	    ProgressBar: tasks_v2_component_elements_progressBar.ProgressBar
	  },
	  mixins: [CheckListItemMixin],
	  inject: ['setItemsRef'],
	  emits: ['toggleCompleted', 'startGroupMode', 'openCheckList'],
	  setup() {
	    return {
	      Actions: ui_iconSet_api_core.Actions,
	      Outline: ui_iconSet_api_core.Outline
	    };
	  },
	  data() {
	    return {
	      isSticky: false,
	      isMenuShown: false,
	      menuRemoveSectionCode: 'removeSection',
	      areCompletedCollapsed: false
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
	        title: this.areCompletedCollapsed ? this.loc('TASKS_V2_CHECK_LIST_ITEM_MENU_SHOW') : this.loc('TASKS_V2_CHECK_LIST_ITEM_MENU_HIDE'),
	        icon: this.areCompletedCollapsed ? ui_iconSet_api_core.Outline.OBSERVER : ui_iconSet_api_core.Outline.CROSSED_EYE,
	        dataset: {
	          id: `MenuProfileHide-${this.id}`
	        },
	        onClick: () => {
	          this.isMenuShown = false;
	          this.areCompletedCollapsed = !this.areCompletedCollapsed;
	          this.$emit('toggleCompleted', {
	            itemId: this.id,
	            collapsed: this.areCompletedCollapsed
	          });
	        }
	      };
	      const groupActionsItem = {
	        title: this.loc('TASKS_V2_CHECK_LIST_ITEM_MENU_GROUP'),
	        icon: ui_iconSet_api_core.Outline.MULTICHOICE_ON,
	        dataset: {
	          id: `MenuProfileGroup-${this.id}`
	        },
	        onClick: () => {
	          if (this.item.collapsed === true) {
	            this.collapseChildrenItems(this.id);
	          }
	          this.$emit('startGroupMode', this.id);
	          this.isMenuShown = false;
	        }
	      };
	      const editItem = {
	        sectionCode: this.menuRemoveSectionCode,
	        title: this.loc('TASKS_V2_CHECK_LIST_ITEM_MENU_EDIT'),
	        icon: ui_iconSet_api_core.Outline.EDIT_L,
	        dataset: {
	          id: `MenuProfileEdit-${this.id}`
	        },
	        onClick: () => this.$emit('openCheckList', this.id)
	      };
	      const removeItem = {
	        sectionCode: this.menuRemoveSectionCode,
	        design: 'alert',
	        title: this.loc('TASKS_V2_CHECK_LIST_ITEM_MENU_REMOVE'),
	        icon: ui_iconSet_api_core.Outline.TRASHCAN,
	        dataset: {
	          id: `MenuProfileRemove-${this.id}`
	        },
	        onClick: this.removeItem.bind(this)
	      };
	      if (this.isPreview) {
	        return [collapseItem, editItem, removeItem];
	      } else {
	        return [collapseItem, groupActionsItem, removeItem];
	      }
	    },
	    itemIcon() {
	      return this.item.isComplete ? ui_iconSet_api_core.Outline.CHECK_L : ui_iconSet_api_core.Outline.CHECK_LIST;
	    },
	    checkListStatus() {
	      const label = this.loc('TASKS_V2_CHECK_LIST_STATUS_LABEL_NEW');
	      return label.replace('#completed#', this.completedCount).replace('#total#', this.totalCount);
	    },
	    completedCount() {
	      return this.checkLists.filter(checklist => {
	        return checklist.parentId === this.id && checklist.isComplete;
	      }).length;
	    },
	    totalCount() {
	      return this.checkLists.filter(checklist => {
	        return checklist.parentId === this.id;
	      }).length;
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
	      this.isMenuShown = false;
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
	    collapseChildrenItems(itemId) {
	      this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
	        id: itemId,
	        fields: {
	          collapsed: !this.item.collapsed && !this.item.previewCollapsed,
	          previewCollapsed: false
	        }
	      });
	    },
	    isCollapsed(item) {
	      return item.collapsed === true || this.isPreview && item.previewCollapsed === true;
	    }
	  },
	  template: `
		<div
			ref="item"
			class="check-list-widget-parent-item"
			:class="{
				'--complete': item.isComplete,
				'--collapsed': isCollapsed(item),
				'--preview': isPreview,
			}"
			:data-id="id"
			:data-parent="id"
		>
			<div class="check-list-widget-parent-item-label-container">
				<BIcon :name="itemIcon"/>
			</div>
			<div class="check-list-widget-parent-item-title-container">
				<GrowingTextArea
					class="check-list-widget-parent-item-title"
					:data-check-list-id="'check-list-parent-item-title-' + id"
					:modelValue="item.title"
					:placeholder="loc('TASKS_V2_CHECK_LIST_ITEM_PLACEHOLDER')"
					:readonly="groupMode || isPreview"
					:fontColor="textColor"
					:fontSize="17"
					:lineHeight="20"
					:fontWeight="500"
					@update:modelValue="updateTitle"
					@focus="handleFocus"
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
					<BIcon ref="more" :name="Outline.MORE_L" @click="showMenu" />
					<BIcon
						:name="isCollapsed(item) ? Actions.CHEVRON_DOWN : Actions.CHEVRON_UP"
						@click="collapseChildrenItems(this.id)"
					/>
				</div>
				<div v-if="isSticky && !isPreview" class="check-list-widget-parent-item-empty"></div>
			</div>
			<BMenu v-if="isMenuShown" :options="menuOptions" @close="isMenuShown = false"/>
		</div>
	`
	};

	// @vue/component
	const CheckListChildItem = {
	  name: 'CheckListChildItem',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    GrowingTextArea: tasks_v2_component_elements_growingTextArea.GrowingTextArea,
	    UserAvatarList: tasks_v2_component_elements_userAvatarList.UserAvatarList,
	    UserFieldWidgetComponent: disk_uploader_userFieldWidget.UserFieldWidgetComponent
	  },
	  mixins: [CheckListItemMixin],
	  inject: ['setItemsRef'],
	  props: {
	    itemOffset: {
	      type: String,
	      default: '0'
	    }
	  },
	  emits: ['toggleIsComplete', 'toggleGroupModeSelected'],
	  setup(props) {
	    return {
	      Outline: ui_iconSet_api_core.Outline,
	      fileService: tasks_v2_provider_service_fileService.fileService.get(props.id, tasks_v2_provider_service_fileService.EntityTypes.CheckListItem),
	      uploaderAdapter: tasks_v2_provider_service_fileService.fileService.get(props.id, tasks_v2_provider_service_fileService.EntityTypes.CheckListItem).getAdapter()
	    };
	  },
	  data() {
	    return {
	      uploadingFiles: this.fileService.getFiles()
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
	          readonly: this.isPreview
	        }
	      };
	    },
	    hasAttachments() {
	      return this.hasUsers || this.hasFilesAttach;
	    },
	    hasFilesAttach() {
	      return this.hasFiles || this.isUploading || this.hasUploadingError;
	    },
	    hasFiles() {
	      var _this$files;
	      return ((_this$files = this.files) == null ? void 0 : _this$files.length) > 0;
	    },
	    isUploading() {
	      return this.uploadingFiles.some(({
	        status
	      }) => [ui_uploader_core.FileStatus.UPLOADING, ui_uploader_core.FileStatus.LOADING].includes(status));
	    },
	    hasUploadingError() {
	      return this.uploadingFiles.some(({
	        status
	      }) => [ui_uploader_core.FileStatus.UPLOAD_FAILED, ui_uploader_core.FileStatus.LOAD_FAILED].includes(status));
	    },
	    hasTrashcanIcon() {
	      return this.isHovered && !this.item.panelIsShown && !this.groupMode && !this.isPreview;
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
	  },
	  beforeUnmount() {
	    if (this.setItemsRef) {
	      this.setItemsRef(this.id, null);
	    }
	  },
	  methods: {
	    toggleIsComplete() {
	      if (this.canToggle === false) {
	        return;
	      }
	      this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
	        id: this.id,
	        fields: {
	          isComplete: !this.item.isComplete
	        }
	      });
	      this.$emit('toggleIsComplete', this.id);
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
	    focusToItem() {
	      var _this$scrollContainer, _this$$parent$$el;
	      (_this$scrollContainer = this.scrollContainer) != null ? _this$scrollContainer : this.scrollContainer = (_this$$parent$$el = this.$parent.$el) == null ? void 0 : _this$$parent$$el.closest('[data-list]');
	      const offset = 200;
	      this.scrollContainer.scrollTo({
	        top: this.$refs.item.offsetTop - offset,
	        behavior: 'smooth'
	      });
	    },
	    focusToTextarea(event) {
	      const ignoreList = new Set([this.$refs.checkbox]);
	      if (!ignoreList.has(event.target)) {
	        var _this$$refs$growingTe;
	        (_this$$refs$growingTe = this.$refs.growingTextArea) == null ? void 0 : _this$$refs$growingTe.focusTextarea();
	      }
	    },
	    async loadFiles() {
	      var _this$files2;
	      const ids = (_this$files2 = this.files) == null ? void 0 : _this$files2.map(file => {
	        var _file$id;
	        return (_file$id = file == null ? void 0 : file.id) != null ? _file$id : file;
	      });
	      await this.fileService.list(ids != null ? ids : []);
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
	      if (this.isPreview) {
	        this.toggleIsComplete();
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
	      const hasExcludedClass = excludedClasses.some(className => target.closest(`.${className}`) !== null);
	      return !hasExcludedClass;
	    }
	  },
	  template: `
		<div
			ref="item"
			class="check-list-widget-child-item"
			:class="{
				'--extra-indent': hasUsers && !hasFilesAttach,
				'--complete': item.isComplete,
				'--group-mode': groupMode,
				'--group-mode-selected': groupModeSelected,
				'--preview': isPreview,
			}"
			:data-id="id"
			:style="{ marginLeft: itemOffset }"
			@mouseover="isHovered = true"
			@mouseleave="isHovered = false"
			@click="handleClick"
		>
			<div class="check-list-widget-child-item-base">
				<label
					class="check-list-widget-child-item-checkbox"
					:class="{'--important': !item.isImportant}"
				>
					<input
						ref="checkbox"
						type="checkbox"
						:checked="item.isComplete"
						:disabled="!canToggle || groupMode"
						@click.stop="toggleIsComplete"
					>
				</label>
				<div
					v-if="item.isImportant"
					class="check-list-widget-child-item-important"
				>
					<BIcon :name="Outline.FIRE_SOLID" :hoverable="false"/>
				</div>
				<GrowingTextArea
					ref="growingTextArea"
					class="check-list-widget-child-item-title"
					:data-check-list-id="'check-list-child-item-title-' + item.id"
					:modelValue="item.title"
					:placeholder="loc('TASKS_V2_CHECK_LIST_ITEM_PLACEHOLDER')"
					:readonly="groupMode || isPreview"
					:fontColor="textColor"
					:fontSize="15"
					:lineHeight="20"
					@update:modelValue="updateTitle"
					@focus="handleFocus"
					@blur="handleBlur"
					@emptyBlur="handleEmptyBlur"
					@emptyFocus="focusToItem"
					@enterBlur="handleEnter"
				/>
				<div
					v-if="hasTrashcanIcon"
					class="check-list-widget-child-item-action"
					@click="removeItem"
				>
					<BIcon :name="Outline.TRASHCAN"/>
				</div>
				<div v-else-if="groupMode" class="check-list-widget-child-item-action-checkbox">
					<input
						ref="checkbox"
						type="checkbox"
						:checked="groupModeSelected"
					>
				</div>
				<div v-else class="check-list-widget-child-item-action-stub"></div>
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
							<UserFieldWidgetComponent
								ref="files-widget"
								:uploaderAdapter="uploaderAdapter"
								:widgetOptions="widgetOptions"
							/>
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
	      Outline: ui_iconSet_api_core.Outline
	    };
	  },
	  template: `
		<div
			class="check-list-widget-add-item"
			:class="{'--preview': isPreview}"
			@click="$emit('addItem')"
		>
			<div class="check-list-widget-add-item-icon">
				<BIcon :name="Outline.PLUS_L"/>
			</div>
			<div class="check-list-widget-add-item-title">
				{{ loc('TASKS_V2_CHECK_LIST_ITEM_ADD_BTN') }}
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
	    CheckListAddItem
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
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
	  emits: ['beforeCreated', 'show', 'update', 'addItem', 'addItemFromBtn', 'removeItem', 'toggleIsComplete', 'focus', 'blur', 'emptyBlur', 'toggleCompleted', 'startGroupMode', 'toggleGroupModeSelected', 'openCheckList'],
	  data() {
	    return {};
	  },
	  computed: {
	    task() {
	      return this.$store.getters[`${tasks_v2_const.Model.Tasks}/getById`](this.taskId);
	    },
	    checkLists() {
	      return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getByIds`](this.task.checklist);
	    },
	    parentCheckLists() {
	      return this.checkLists.filter(checkList => checkList.parentId === 0).sort((a, b) => a.sortIndex - b.sortIndex);
	    },
	    siblings() {
	      return this.checkLists.filter(item => item.parentId === this.parentId).sort((a, b) => a.sortIndex - b.sortIndex);
	    }
	  },
	  created() {
	    this.$emit('beforeCreated');
	    this.checkListManager = new CheckListManager({
	      computed: {
	        checkLists: () => this.checkLists
	      }
	    });
	  },
	  mounted() {
	    if (this.checkListId) {
	      var _this$$root$$el;
	      this.scrollContainer = (_this$$root$$el = this.$root.$el) == null ? void 0 : _this$$root$$el.querySelector(['[data-list]']);
	      const targetParentItem = this.scrollContainer.querySelector([`[data-parent="${this.checkListId}"]`]);
	      setTimeout(() => {
	        this.scrollContainer.scrollTop = targetParentItem.offsetTop;
	      }, 0);
	    }
	    this.$emit('show');
	  },
	  methods: {
	    getItemOffset(item) {
	      if (item.parentId === 0) {
	        return '0';
	      }
	      const level = this.checkListManager.getItemLevel(item);
	      if (level === 1) {
	        return '0';
	      }
	      return `${(level - 1) * 12}px`;
	    },
	    isFirstVisibleItem(index) {
	      if (this.isPreview === true) {
	        return false;
	      }
	      const siblings = this.siblings;
	      const firstVisibleIndex = siblings.findIndex(item => !item.hidden);
	      return firstVisibleIndex !== -1 && firstVisibleIndex === index;
	    },
	    getChildren(parent) {
	      if (this.isCollapsed(parent)) {
	        return [];
	      }
	      return this.checkListManager.getAllChildren(parent.id);
	    },
	    isCollapsed(item) {
	      return item.collapsed === true || this.isPreview && item.previewCollapsed === true;
	    }
	  },
	  template: `
		<div class="check-list-widget-container">
			<ul class="check-list-widget --parent" :class="{'--preview': isPreview}">
				<template v-for="(parentItem, parentItemIndex) in parentCheckLists" :key="parentItem.id">
					<li
						class="check-list-widget-item --parent"
						:class="{
							'--first-visible': parentId === 0 && isFirstVisibleItem(parentItemIndex),
							'--hidden': parentItem.hidden,
							'--collapsed': isCollapsed(parentItem),
							'--preview': isPreview,
						}"
					>
						<CheckListParentItem
							:id="parentItem.id"
							:taskId="taskId"
							:isPreview="isPreview"
							@update="$emit('update')"
							@removeItem="(id) => $emit('removeItem', id)"
							@focus="(id) => $emit('focus', id)"
							@blur="(id) => $emit('blur', id)"
							@emptyBlur="(id) => $emit('emptyBlur', id)"
							@toggleCompleted="(data) => $emit('toggleCompleted', data)"
							@startGroupMode="(id) => $emit('startGroupMode', id)"
							@openCheckList="(id) => $emit('openCheckList', id)"
						/>
						<TransitionGroup name="list" tag="ul" class="check-list-widget">
							<template
								v-for="childItem in getChildren(parentItem)"
								:key="childItem.id
							">
								<li
									class="check-list-widget-item"
									:class="{
										'--hidden': childItem.hidden,
									}"
								>
									<CheckListChildItem
										:id="childItem.id"
										:taskId="taskId"
										:itemOffset="getItemOffset(childItem)"
										:isPreview="isPreview"
										@update="$emit('update')"
										@toggleIsComplete="(id) => $emit('toggleIsComplete', id)"
										@addItem="(data) => $emit('addItem', data)"
										@removeItem="(id) => $emit('removeItem', id)"
										@focus="(id) => $emit('focus', id)"
										@blur="(id) => $emit('blur', id)"
										@emptyBlur="(id) => $emit('emptyBlur', id)"
										@toggleGroupModeSelected="(id) => $emit('toggleGroupModeSelected', id)"
									/>
								</li>
							</template>
						</TransitionGroup>
						<Transition name="addBtn" tag="div" class="check-list-widget-add-container">
							<CheckListAddItem
								v-if="!isCollapsed(parentItem)"
								:isPreview="isPreview"
								@addItem="$emit('addItemFromBtn', parentItem.id)"
							/>
						</Transition>
					</li>
				</template>
			</ul>
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
	      icon: ui_iconSet_api_core.Outline.FIRE,
	      activeIcon: ui_iconSet_api_core.Outline.FIRE_SOLID,
	      action: PanelAction.SetImportant,
	      hint: 'TASKS_V2_CHECK_LIST_ITEM_IMPORTANT_HINT',
	      className: '--important',
	      hoverable: false
	    }]
	  }, {
	    name: PanelSection.Attachments,
	    items: [{
	      icon: ui_iconSet_api_core.Outline.ATTACH,
	      action: PanelAction.AttachFile,
	      hint: 'TASKS_V2_CHECK_LIST_ITEM_ATTACH_HINT'
	    }]
	  }, {
	    name: PanelSection.Movement,
	    items: [{
	      icon: ui_iconSet_api_core.Outline.POINT_RIGHT,
	      action: PanelAction.MoveRight,
	      hint: 'TASKS_V2_CHECK_LIST_ITEM_MOVE_RIGHT_HINT'
	    }, {
	      icon: ui_iconSet_api_core.Outline.POINT_LEFT,
	      action: PanelAction.MoveLeft,
	      hint: 'TASKS_V2_CHECK_LIST_ITEM_MOVE_LEFT_HINT'
	    }]
	  }, {
	    name: PanelSection.Accomplice,
	    items: [{
	      icon: ui_iconSet_api_core.Outline.PERSON,
	      action: PanelAction.AssignAccomplice,
	      hint: 'TASKS_V2_CHECK_LIST_ITEM_ACCOMPLICE_HINT'
	    }]
	  }, {
	    name: PanelSection.Auditor,
	    items: [{
	      icon: ui_iconSet_api_core.Outline.OBSERVER,
	      action: PanelAction.AssignAuditor,
	      hint: 'TASKS_V2_CHECK_LIST_ITEM_AUDITOR_HINT'
	    }]
	  }, {
	    name: PanelSection.Forward,
	    items: [{
	      icon: ui_iconSet_api_core.Outline.FORWARD,
	      action: PanelAction.Forward,
	      hint: 'TASKS_V2_CHECK_LIST_ITEM_FORWARD_HINT'
	    }]
	  }, {
	    name: PanelSection.Delete,
	    items: [{
	      icon: ui_iconSet_api_core.Outline.TRASHCAN,
	      action: PanelAction.Delete,
	      hint: 'TASKS_V2_CHECK_LIST_ITEM_REMOVE_HINT'
	    }]
	  }, {
	    name: PanelSection.Cancel,
	    items: [{
	      icon: ui_iconSet_api_core.Outline.CROSS_L,
	      action: PanelAction.Cancel,
	      hint: 'TASKS_V2_CHECK_LIST_ITEM_CANCEL_HINT'
	    }]
	  }]
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
	  props: {
	    /** @type VisibleActions */
	    visibleSections: {
	      type: Array,
	      default: () => PanelMeta.defaultSections.map(section => section.name)
	    },
	    visibleActions: {
	      type: Array,
	      default: () => []
	    },
	    disabledActions: {
	      type: Array,
	      default: () => []
	    },
	    activeActions: {
	      type: Array,
	      default: () => []
	    }
	  },
	  emits: ['action'],
	  data() {
	    return {
	      currentHintElement: null,
	      currentHintText: ''
	    };
	  },
	  computed: {
	    sections() {
	      return PanelMeta.defaultSections.filter(section => this.visibleSections.includes(section.name)).map(section => ({
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
	    }
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
	    babelHelpers.classPrivateFieldLooseBase(this, _balloonWithTimer)[_balloonWithTimer] = ui_notification.UI.Notification.Center.notify({
	      id: `check-list-balloon-${main_core.Text.getRandom()}`,
	      content: babelHelpers.classPrivateFieldLooseBase(this, _getBalloonContent)[_getBalloonContent](),
	      actions: [{
	        title: main_core.Loc.getMessage('TASKS_V2_CHECK_LIST_BALLOON_CANCEL'),
	        events: {
	          mouseup: babelHelpers.classPrivateFieldLooseBase(this, _handleCancelClick)[_handleCancelClick].bind(this)
	        }
	      }],
	      events: {
	        onClose: babelHelpers.classPrivateFieldLooseBase(this, _handleClosingBalloon)[_handleClosingBalloon].bind(this)
	      }
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _startTimer)[_startTimer]();
	  }
	}
	function _startTimer2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _interval)[_interval] = setInterval(() => {
	    babelHelpers.classPrivateFieldLooseBase(this, _counter)[_counter]--;
	    babelHelpers.classPrivateFieldLooseBase(this, _balloonWithTimer)[_balloonWithTimer].update({
	      content: babelHelpers.classPrivateFieldLooseBase(this, _getBalloonContent)[_getBalloonContent]()
	    });
	    if (babelHelpers.classPrivateFieldLooseBase(this, _counter)[_counter] <= 0) {
	      babelHelpers.classPrivateFieldLooseBase(this, _balloonWithTimer)[_balloonWithTimer].close();
	      this.emit('complete', true);
	    }
	  }, 1000);
	}
	function _handleCancelClick2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _balloonWithTimer)[_balloonWithTimer].close();
	}
	function _handleClosingBalloon2() {
	  clearInterval(babelHelpers.classPrivateFieldLooseBase(this, _interval)[_interval]);
	  this.emit('complete', false);
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
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    },
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
	    }
	  },
	  emits: ['show', 'close', 'resize', 'open'],
	  setup() {
	    return {
	      resizeObserver: null,
	      AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
	      ButtonSize: ui_vue3_components_button.ButtonSize,
	      ButtonIcon: ui_vue3_components_button.ButtonIcon,
	      Outline: ui_iconSet_api_core.Outline
	    };
	  },
	  data() {
	    return {
	      checkListManager: null,
	      itemPanelIsShown: false,
	      checkListWasUpdated: false,
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
	      itemsToDelete: [],
	      collapsedItems: new Map(),
	      shownPopups: new Set()
	    };
	  },
	  computed: {
	    componentName() {
	      if (this.isAutonomous) {
	        return CheckListPopup;
	      } else if (this.isPreview) {
	        return CheckListList;
	      }
	      return CheckListSheet;
	    },
	    componentShown() {
	      if (this.isPreview) {
	        return this.isComponentShown;
	      }
	      return true;
	    },
	    isEdit() {
	      return main_core.Type.isNumber(this.taskId) && this.taskId > 0;
	    },
	    task() {
	      return this.$store.getters[`${tasks_v2_const.Model.Tasks}/getById`](this.taskId);
	    },
	    checkLists() {
	      return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getByIds`](this.task.checklist);
	    },
	    parentCheckLists() {
	      return this.checkLists.filter(checkList => checkList.parentId === 0);
	    },
	    hasFewParentCheckLists() {
	      return this.parentCheckLists.length > 1;
	    },
	    item() {
	      return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getById`](this.itemId);
	    },
	    itemGroupModeSelected() {
	      var _this$item$groupMode;
	      if (!this.item) {
	        return false;
	      }
	      return ((_this$item$groupMode = this.item.groupMode) == null ? void 0 : _this$item$groupMode.selected) === true;
	    },
	    visiblePanelActions() {
	      if (!this.item) {
	        return [];
	      }
	      let actions = [PanelAction.SetImportant, PanelAction.MoveRight, PanelAction.MoveLeft, PanelAction.AssignAccomplice, PanelAction.AssignAuditor, PanelAction.Forward, PanelAction.Delete];
	      if (this.itemGroupModeSelected) {
	        actions.push(PanelAction.Cancel);
	      } else {
	        actions.push(PanelAction.AttachFile);
	      }
	      if (this.item.parentId === 0) {
	        actions = [PanelAction.AssignAccomplice, PanelAction.AssignAuditor];
	      }
	      const limits = tasks_v2_core.Core.getParams().limits;
	      const stakeholdersActions = new Set([PanelAction.AssignAccomplice, PanelAction.AssignAuditor]);
	      return actions.filter(action => {
	        const isDisabledStakeholders = stakeholdersActions.has(action) && !limits.stakeholders;
	        return !isDisabledStakeholders;
	      });
	    },
	    disabledPanelActions() {
	      if (!this.item) {
	        return [];
	      }
	      const disabledActions = [];
	      const itemLevel = this.checkListManager.getItemLevel(this.item);
	      const canModify = this.item.actions.modify === true;
	      const canRemove = this.item.actions.remove === true;
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
	          return itemLevel === 5 || this.item.sortIndex === 0 || canModify === false;
	        },
	        [PanelAction.AssignAccomplice]: () => {
	          return canModify === false;
	        },
	        [PanelAction.AssignAuditor]: () => {
	          return canModify === false;
	        },
	        [PanelAction.Forward]: () => {
	          return canModify === false || this.item.title === '';
	        },
	        [PanelAction.Delete]: () => {
	          return canRemove === false || this.item.title === '';
	        }
	      };
	      Object.entries(conditionHandlers).forEach(([action, condition]) => {
	        if (condition()) {
	          disabledActions.push(action);
	        }
	      });
	      return disabledActions;
	    },
	    activePanelActions() {
	      if (!this.item) {
	        return [];
	      }
	      const actions = [];
	      if (this.item.isImportant) {
	        actions.push(PanelAction.SetImportant);
	      }
	      return actions;
	    },
	    forwardMenuOptions() {
	      return {
	        id: `check-list-item-forward-menu-${this.item.id}`,
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
	      const checklistItems = this.parentCheckLists.filter(checkList => checkList.id !== this.item.parentId).map(checkList => ({
	        title: checkList.title,
	        dataset: {
	          id: `ForwardMenuCheckList-${checkList.id}`
	        },
	        onClick: () => {
	          this.hideItemPanel();
	          if (this.itemGroupModeSelected) {
	            void this.forwardGroupItemsToChecklist(checkList.id);
	          } else {
	            this.forwardToChecklist(checkList.id);
	          }
	        }
	      }));
	      return [...checklistItems, {
	        sectionCode: this.forwardMenuSectionCode,
	        title: this.loc('TASKS_V2_CHECK_LIST_ITEM_FORWARD_MENU_CREATE'),
	        dataset: {
	          id: `ForwardMenuCreateNew-${this.item.id}`
	        },
	        onClick: this.forwardToNewChecklist.bind(this)
	      }];
	    },
	    stub() {
	      return this.checkLists.length === 0 || this.emptyList === true;
	    },
	    emptyList() {
	      const siblings = this.parentCheckLists.filter(item => !this.itemsToDelete.includes(item.id));
	      return siblings.length === 0;
	    },
	    contextClass() {
	      if (this.isPreview) {
	        return '--preview';
	      }
	      return this.isAutonomous ? '--popup' : '--sheet';
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
	    parentCheckLists() {
	      if (this.isPreview) {
	        this.unCollapseFirstParent();
	      }
	    },
	    componentShown(value) {
	      if (!this.isPreview) {
	        return;
	      }
	      if (value) {
	        this.subscribeToEvents();
	      } else {
	        this.unsubscribeFromEvents();
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
	  beforeUnmount() {
	    if (this.isAutonomous || this.isPreview) {
	      this.unsubscribeFromEvents();
	    }
	  },
	  methods: {
	    subscribeToEvents() {
	      main_core.Event.bind(this.$refs.list, 'scroll', this.handleScroll);
	      main_core_events.EventEmitter.subscribe('BX.Main.Popup:onInit', this.handleInitPopup);
	      main_core_events.EventEmitter.subscribe('BX.Main.Popup:onShow', this.handleShowPopup);
	      main_core_events.EventEmitter.subscribe('BX.Main.Popup:onClose', this.handleClosePopup);
	    },
	    unsubscribeFromEvents() {
	      main_core.Event.unbind(this.$refs.list, 'scroll', this.handleScroll);
	      main_core_events.EventEmitter.unsubscribe('BX.Main.Popup:onInit', this.handleInitPopup);
	      main_core_events.EventEmitter.unsubscribe('BX.Main.Popup:onShow', this.handleShowPopup);
	      main_core_events.EventEmitter.unsubscribe('BX.Main.Popup:onClose', this.handleClosePopup);
	    },
	    handleBeforeCreated() {
	      if (this.isPreview) {
	        this.unCollapseFirstParent();
	      }
	    },
	    handleUpdate() {
	      this.checkListWasUpdated = true;
	    },
	    handleRemove(itemId) {
	      this.itemId = itemId;
	      this.freeze();
	      this.itemsToDelete = [...this.itemsToDelete, itemId];
	      this.hideItem(itemId);
	      const messageKey = this.item.parentId === 0 ? 'TASKS_V2_CHECK_LIST_ITEM_REMOVE_BALLOON_PARENT' : 'TASKS_V2_CHECK_LIST_ITEM_REMOVE_BALLOON_CHILD';
	      const notifier = new CheckListNotifier({
	        content: this.loc(messageKey)
	      });
	      notifier.subscribeOnce('complete', baseEvent => {
	        const timerHasEnded = baseEvent.getData();
	        if (timerHasEnded) {
	          this.removeItem(itemId);
	        } else {
	          this.showItem(itemId);
	        }
	        this.itemsToDelete = this.itemsToDelete.filter(id => id !== itemId);
	        this.unfreeze();
	      });
	      notifier.showBalloonWithTimer();
	    },
	    handleScroll() {
	      this.isForwardMenuShown = false;
	      this.updatePanelPosition();
	    },
	    handleShow(data) {
	      this.$emit('show', data);
	    },
	    async handleClose() {
	      this.cancelGroupMode();
	      this.$emit('close');
	      await this.saveCheckList();
	    },
	    handleIsShown(isShown) {
	      if (isShown) {
	        this.subscribeToEvents();
	      } else {
	        this.unsubscribeFromEvents();
	      }
	    },
	    handleInitPopup(baseEvent) {
	      const data = baseEvent.getCompatData();
	      const bindElement = data[1];
	      const params = data[2];
	      if (main_core.Type.isDomNode(bindElement)) {
	        var _this$$refs$list;
	        if ((_this$$refs$list = this.$refs.list) != null && _this$$refs$list.contains(bindElement)) {
	          params.targetContainer = this.$refs.list;
	        } else {
	          params.targetContainer = document.body;
	        }
	      }
	    },
	    handleShowPopup(baseEvent) {
	      const [popup] = baseEvent.getCompatData();
	      this.shownPopups.add(popup.getId());
	      this.freeze();
	    },
	    handleClosePopup(baseEvent) {
	      const [popup] = baseEvent.getCompatData();
	      this.shownPopups.delete(popup.getId());
	      this.unfreeze();
	    },
	    async handleGroupRemove(itemId) {
	      this.itemId = itemId;
	      this.freeze();
	      this.itemsToDelete = [...this.itemsToDelete, itemId];
	      this.hideItemPanel(itemId);
	      const allSelectedItems = this.checkListManager.getAllSelectedItems();
	      const nearestItem = this.checkListManager.findNearestItem(this.item, false);
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
	      allSelectedItems.forEach(item => {
	        this.hideItem(item.id);
	      });
	      const messageKey = allSelectedItems.length > 1 ? 'TASKS_V2_CHECK_LIST_ITEM_REMOVE_BALLOON_CHILDREN' : 'TASKS_V2_CHECK_LIST_ITEM_REMOVE_BALLOON_CHILD';
	      const notifier = new CheckListNotifier({
	        content: this.loc(messageKey)
	      });
	      notifier.subscribeOnce('complete', baseEvent => {
	        const timerHasEnded = baseEvent.getData();
	        allSelectedItems.forEach(item => {
	          if (timerHasEnded) {
	            this.removeItem(item.id);
	          } else {
	            this.showItem(item.id);
	          }
	          this.itemsToDelete = this.itemsToDelete.filter(id => id !== item.id);
	        });
	        if (timerHasEnded) {
	          if (nearestItem && !this.itemsToDelete.includes(nearestItem.id)) {
	            this.showItemPanel(nearestItem.id);
	          } else {
	            this.cancelGroupMode();
	          }
	        } else {
	          this.showItemPanel(this.item.id);
	        }
	        this.unfreeze();
	      });
	      notifier.showBalloonWithTimer();
	    },
	    handleToggleIsComplete(itemId) {
	      this.syncParentCompletionState(itemId);
	    },
	    handleFocus(itemId) {
	      this.showItemPanel(itemId);
	    },
	    handleBlur(itemId) {
	      this.itemId = itemId;
	      if (this.isItemPanelFreeze === false) {
	        this.hideItemPanel(itemId);
	      }
	    },
	    handleEmptyBlur(itemId) {
	      this.itemId = itemId;
	      if (this.item.parentId === 0) {
	        this.setDefaultCheckListTitle(itemId);
	        return;
	      }
	      if (this.isItemPanelFreeze === false) {
	        this.removeItem(itemId);
	      }
	    },
	    handleGroupMode(itemId) {
	      this.itemId = itemId;
	      const firstChild = this.checkListManager.getFirstChild(itemId);
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
	      void this.updateCheckList(checkListId, {
	        collapsed: false,
	        previewCollapsed: false
	      });
	      this.$emit('open', checkListId);
	    },
	    updateCheckList(id, fields) {
	      return this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
	        id,
	        fields
	      });
	    },
	    updateTask(fields) {
	      return this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/update`, {
	        id: this.taskId,
	        fields
	      });
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
	      if (this.checkListWasUpdated && this.isEdit) {
	        await tasks_v2_provider_service_checkListService.checkListService.save(this.taskId, this.checkLists);
	      }
	      if (!this.isDemoCheckListModified()) {
	        this.removeChecklists();
	      }
	      this.checkListWasUpdated = false;
	    },
	    isDemoCheckListModified() {
	      if (this.checkLists.length !== 1) {
	        return true;
	      }
	      const [checkList] = this.checkLists;
	      const demoTitle = this.loc('TASKS_V2_CHECK_LIST_TITLE_NUMBER', {
	        '#number#': 1
	      });
	      return checkList.title !== demoTitle || checkList.accomplices.length > 0 || checkList.auditors.length > 0;
	    },
	    removeChecklists() {
	      this.checkLists.filter(checklist => checklist.parentId === 0).forEach(item => {
	        this.removeItem(item.id);
	      });
	    },
	    async addCheckList(empty = false) {
	      const parentId = main_core.Text.getRandom();
	      const childId = main_core.Text.getRandom();
	      const items = [this.getDataForNewCheckList(parentId)];
	      if (!empty) {
	        items.push({
	          id: childId,
	          nodeId: childId,
	          parentId,
	          sortIndex: 0
	        });
	      }
	      await this.insertManyCheckLists(items);
	      void this.updateTask({
	        checklist: [...this.task.checklist, parentId, childId]
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
	        return checklist.parentId === 0 && !this.itemsToDelete.includes(checklist.id);
	      }).length;
	    },
	    getDataForNewCheckList(parentId) {
	      return {
	        id: parentId,
	        nodeId: parentId,
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
	    focusToItem(itemId) {
	      void this.$nextTick(() => {
	        var _this$getItemsRef, _this$getItemsRef$$re;
	        (_this$getItemsRef = this.getItemsRef(itemId)) == null ? void 0 : (_this$getItemsRef$$re = _this$getItemsRef.$refs.growingTextArea) == null ? void 0 : _this$getItemsRef$$re.focusTextarea();
	      });
	    },
	    showItem(itemId) {
	      void this.updateCheckList(itemId, {
	        hidden: false
	      });
	      const children = this.checkListManager.getChildren(itemId);
	      if (children.length > 0) {
	        children.forEach(child => {
	          this.showItem(child.id);
	        });
	      }
	    },
	    hideItem(itemId) {
	      void this.updateCheckList(itemId, {
	        hidden: true
	      });
	      const children = this.checkListManager.getChildren(itemId);
	      if (children.length > 0) {
	        children.forEach(child => {
	          this.hideItem(child.id);
	        });
	      }
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
	      const parentId = this.item.parentId;
	      this.resortItemsAfterIndex(parentId, sort);
	      void this.insertCheckList({
	        id: childId,
	        nodeId: childId,
	        parentId,
	        sortIndex: sort
	      });
	      void this.updateTask({
	        checklist: [...this.task.checklist, childId]
	      });
	      this.syncParentCompletionState(childId);
	    },
	    addItemFromBtn(checkListId) {
	      if (this.isPreview) {
	        this.handleOpenCheckList(checkListId);
	        return;
	      }
	      if (this.hasActiveGroupMode()) {
	        return;
	      }
	      const childId = main_core.Text.getRandom();
	      const sortIndex = this.checkListManager.getChildren(checkListId).length;
	      void this.insertCheckList({
	        id: childId,
	        nodeId: childId,
	        parentId: checkListId,
	        sortIndex
	      });
	      void this.updateTask({
	        checklist: [...this.task.checklist, childId]
	      });
	      this.syncParentCompletionState(childId);
	    },
	    removeItem(id, isRootCall = true) {
	      var _this$item, _this$item2;
	      if (!this.task) {
	        return;
	      }
	      this.itemId = id;
	      if ((_this$item = this.item) != null && _this$item.title) {
	        this.checkListWasUpdated = true;
	      }
	      const parentId = ((_this$item2 = this.item) == null ? void 0 : _this$item2.parentId) || null;
	      const children = this.checkListManager.getChildren(id);
	      if (children.length > 0) {
	        children.forEach(child => {
	          this.removeItem(child.id, false);
	        });
	      }
	      void this.updateTask({
	        checklist: this.task.checklist.filter(itemId => itemId !== id)
	      });
	      void this.deleteCheckList(id);
	      if (isRootCall) {
	        this.resortItemsOnLevel(parentId);
	      }
	      this.syncParentCompletionState(id, parentId);
	      tasks_v2_provider_service_fileService.fileService.delete(id, tasks_v2_provider_service_fileService.EntityTypes.CheckListItem);
	    },
	    resortItemsAfterIndex(parentId, sortIndex) {
	      this.checkListManager.resortItemsAfterIndex(parentId, sortIndex, updates => {
	        void this.upsertCheckLists(updates);
	      });
	    },
	    resortItemsOnLevel(parentId) {
	      this.checkListManager.resortItemsOnLevel(parentId, updates => this.upsertCheckLists(updates));
	    },
	    syncParentCompletionState(itemId, parentId) {
	      this.checkListManager.syncParentCompletionState(itemId, (id, fields) => this.updateCheckList(id, fields), parentId);
	    },
	    toggleCompleted({
	      itemId,
	      collapsed
	    }) {
	      this.itemId = itemId;
	      this.checkListManager.getAllCompletedChildrenChildren(itemId).forEach(item => {
	        if (collapsed === false) {
	          this.showItem(item.id);
	        } else {
	          this.hideItem(item.id);
	        }
	      });
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
	      const nearestSelectedItem = this.checkListManager.findNearestItem(this.item, true);
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
	      const itemRef = this.$refs.list.querySelector([`[data-id="${this.item.id}"]`]);
	      const panelRect = main_core.Dom.getPosition(this.$refs.panel.$el);
	      const listRect = main_core.Dom.getPosition(this.$refs.list);
	      const itemRect = main_core.Dom.getRelativePosition(itemRef, this.$refs.list);
	      const isParentItem = this.item.parentId === 0;
	      const paddingOffset = 18;
	      const panelWidth = panelRect.width === 0 ? 304 : panelRect.width;
	      const top = itemRect.top - 14;
	      if (isParentItem) {
	        const left = listRect.width - panelWidth - paddingOffset * 2 - 80;
	        const display = top > -30 && top < this.itemPanelTopLimit ? 'flex' : 'none';
	        this.itemPanelStyles = {
	          top: `${top}px`,
	          left: `${left}px`,
	          display
	        };
	      } else {
	        const left = listRect.width - panelWidth - paddingOffset;
	        const display = top > 40 && top < this.itemPanelTopLimit ? 'flex' : 'none';
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
	        void this.updateCheckList(this.item.id, {
	          isImportant: !this.item.isImportant
	        });
	      }
	      this.checkListWasUpdated = true;
	    },
	    attachFile(node) {
	      this.isItemPanelFreeze = true;
	      tasks_v2_provider_service_fileService.fileService.get(this.item.id, tasks_v2_provider_service_fileService.EntityTypes.CheckListItem).browse({
	        bindElement: node
	      });
	      tasks_v2_provider_service_fileService.fileService.get(this.item.id, tasks_v2_provider_service_fileService.EntityTypes.CheckListItem).subscribeOnce('onFileComplete', () => {
	        this.isItemPanelFreeze = false;
	        this.focusToItem(this.item.id);
	        this.checkListWasUpdated = true;
	      });
	    },
	    moveGroupToRight() {
	      if (this.itemGroupModeSelected) {
	        this.checkListManager.getAllSelectedItems().sort((a, b) => a.sortIndex - b.sortIndex).forEach(item => {
	          this.moveRight(item);
	        });
	      } else {
	        this.moveRight(this.item);
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
	        this.moveLeft(this.item);
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
	        void this.forwardToNewChecklist();
	      }
	      this.checkListWasUpdated = true;
	    },
	    async forwardToNewChecklist() {
	      const newParentId = await this.addCheckList(true);
	      if (this.itemGroupModeSelected) {
	        void this.forwardGroupItemsToChecklist(newParentId);
	      } else {
	        this.forwardToChecklist(newParentId);
	      }
	    },
	    forwardToChecklist(checkListId) {
	      const finalSortIndex = this.checkListManager.getChildren(checkListId).length;
	      void this.updateCheckList(this.item.id, {
	        parentId: checkListId,
	        sortIndex: finalSortIndex
	      });
	      this.resortItemsOnLevel(checkListId);
	      this.resortItemsOnLevel(this.item.parentId);
	    },
	    async forwardGroupItemsToChecklist(checkListId) {
	      const finalSortIndex = this.checkListManager.getChildren(checkListId).length;
	      const checkListIdsFromWhichWereForwarded = new Set();
	      const allSelectedItems = this.checkListManager.getAllSelectedItems();
	      const nearestItem = this.checkListManager.findNearestItem(this.item, false, allSelectedItems);
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
	    },
	    delete() {
	      if (this.itemGroupModeSelected) {
	        void this.handleGroupRemove(this.item.id);
	      } else {
	        this.hideItemPanel();
	        this.handleRemove(this.item.id);
	      }
	    },
	    cancelGroupMode() {
	      this.deactivateGroupMode();
	      this.hideItemPanel();
	    },
	    showParticipantDialog(targetNode, type) {
	      var _this$selector;
	      this.isItemPanelFreeze = true;
	      const preselected = this.item[type].map(user => ['user', user.id]);
	      (_this$selector = this.selector) != null ? _this$selector : this.selector = new tasks_v2_lib_entitySelectorDialog.EntitySelectorDialog({
	        ...tasks_v2_component_elements_participantList.participantMeta.dialogOptions(this.taskId, 'check-list'),
	        preselectedItems: preselected,
	        popupOptions: {
	          events: {
	            onShow: baseEvent => {
	              const popup = baseEvent.getTarget();
	              const popupWidth = popup.getPopupContainer().offsetWidth;
	              const targetNodeWidth = 10;
	              const offsetLeft = targetNodeWidth - popupWidth / 2;
	              const angleShift = main_popup.Popup.getOption('angleLeftOffset') - main_popup.Popup.getOption('angleMinTop');
	              popup.setAngle({
	                offset: popupWidth / 2 - angleShift
	              });
	              popup.setOffset({
	                offsetLeft: offsetLeft + main_popup.Popup.getOption('angleLeftOffset')
	              });
	            },
	            onClose: () => {
	              const users = this.selector.getSelectedItems().map(item => ({
	                id: item.getId(),
	                name: item.getTitle(),
	                image: item.getAvatar(),
	                type: item.getEntityType()
	              }));
	              this.saveParticipants(this.selector.params.itemId, this.selector.params.type, users);
	            }
	          }
	        },
	        events: {
	          onHide: () => {
	            this.isItemPanelFreeze = false;
	            if (!this.itemGroupModeSelected && this.item.id === this.selector.params.itemId) {
	              this.focusToItem(this.selector.params.itemId);
	            }
	            this.updatePanelPosition();
	          }
	        }
	      });
	      this.selector.selectItemsByIds(preselected);
	      this.selector.params = {
	        itemId: this.item.id,
	        type
	      };
	      this.selector.showTo(targetNode);
	    },
	    saveParticipants(id, type, users) {
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
	      const ids = users.map(user => user.id);
	      const fields = {
	        [`${type}Ids`]: ids
	      };
	      void this.updateTask(fields);
	    },
	    activateGroupMode(parentItemId) {
	      this.itemId = parentItemId;
	      const updates = this.checkListManager.getAllChildren(parentItemId).map((item, index) => ({
	        ...item,
	        groupMode: {
	          active: true,
	          selected: index === 0
	        }
	      }));
	      updates.push({
	        ...this.item,
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
	      (_this$$refs$childComp = this.$refs.childComponent) == null ? void 0 : (_this$$refs$childComp2 = _this$$refs$childComp.$refs) == null ? void 0 : (_this$$refs$childComp3 = _this$$refs$childComp2.childComponent) == null ? void 0 : _this$$refs$childComp3.freeze();
	    },
	    unfreeze() {
	      if (this.shownPopups.size === 0 && this.itemsToDelete.length === 0) {
	        var _this$$refs$childComp4, _this$$refs$childComp5, _this$$refs$childComp6;
	        (_this$$refs$childComp4 = this.$refs.childComponent) == null ? void 0 : (_this$$refs$childComp5 = _this$$refs$childComp4.$refs) == null ? void 0 : (_this$$refs$childComp6 = _this$$refs$childComp5.childComponent) == null ? void 0 : _this$$refs$childComp6.unfreeze();
	      }
	    },
	    setDefaultCheckListTitle(itemId) {
	      void this.updateCheckList(itemId, {
	        title: this.loc('TASKS_V2_CHECK_LIST_TITLE_NUMBER', {
	          '#number#': this.getCheckListsNumber()
	        })
	      });
	    },
	    unCollapseFirstParent() {
	      const firstParent = this.parentCheckLists[0];
	      if (firstParent.previewCollapsed === true) {
	        void this.updateCheckList(firstParent.id, {
	          previewCollapsed: false
	        });
	      }
	    }
	  },
	  template: `
		<component
			v-if="componentShown"
			ref="childComponent"
			:is="componentName"
			:taskId="taskId"
			:isShown="isShown"
			@show="handleShow"
			@close="handleClose"
			@isShown="handleIsShown"
			@addFastCheckList="addFastCheckList"
			@resize="$emit('resize')"
		>
			<template v-slot:default="{ handleShow, handleClose }">
				<div ref="wrapper" class="tasks-check-list-wrapper" :class="contextClass">
					<div v-if="!isPreview" class="tasks-check-list-close-icon" :class="contextClass">
						<BIcon :name="Outline.CROSS_L" @click="handleClose"/>
					</div>
					<div ref="list" data-list class="tasks-check-list-content" :class="contextClass">
						<CheckListWidget
							v-show="!stub"
							:taskId="taskId"
							:checkListId="checkListId"
							:isPreview="isPreview"
							@beforeCreated="handleBeforeCreated"
							@update="handleUpdate"
							@toggleIsComplete="handleToggleIsComplete"
							@show="handleShow"
							@addItem="addItem"
							@addItemFromBtn="addItemFromBtn"
							@removeItem="handleRemove"
							@focus="handleFocus"
							@blur="handleBlur"
							@emptyBlur="handleEmptyBlur"
							@toggleCompleted="toggleCompleted"
							@startGroupMode="handleGroupMode"
							@toggleGroupModeSelected="handleGroupModeSelect"
							@openCheckList="handleOpenCheckList"
						/>
						<CheckListStub v-if="stub" @click="addCheckList" />
					</div>
					<div v-show="!stub && !isPreview" class="tasks-check-list-footer" :class="contextClass">
						<UiButton
							:text="loc('TASKS_V2_CHECK_LIST_NEW_BTN')"
							:size="ButtonSize.MEDIUM"
							:leftIcon="ButtonIcon.ADD"
							:style="AirButtonStyle.PLAIN_NO_ACCENT"
							@click="addCheckList"
						/>
						<UiButton
							:text="loc('TASKS_V2_CHECK_LIST_READY_BTN')"
							:size="ButtonSize.MEDIUM"
							@click="handleClose"
						/>
					</div>
					<CheckListItemPanel
						v-if="itemPanelIsShown && !isPreview"
						ref="panel"
						:style="itemPanelStyles"
						:visibleActions="visiblePanelActions"
						:disabledActions="disabledPanelActions"
						:activeActions="activePanelActions"
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
	    Chip: tasks_v2_component_elements_chip.Chip
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    },
	    isAutonomous: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['showCheckList'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_core.Outline,
	      checkListMeta
	    };
	  },
	  computed: {
	    task() {
	      return this.$store.getters[`${tasks_v2_const.Model.Tasks}/getById`](this.taskId);
	    },
	    checkLists() {
	      return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getByIds`](this.task.checklist);
	    },
	    isUploading() {
	      var _this$task$checklist;
	      return (_this$task$checklist = this.task.checklist) == null ? void 0 : _this$task$checklist.some(itemId => tasks_v2_provider_service_fileService.fileService.get(itemId, tasks_v2_provider_service_fileService.EntityTypes.CheckListItem).isUploading());
	    },
	    design() {
	      return {
	        [!this.isAutonomous && !this.isSelected]: tasks_v2_component_elements_chip.ChipDesign.Shadow,
	        [!this.isAutonomous && this.isSelected]: tasks_v2_component_elements_chip.ChipDesign.ShadowAccent,
	        [this.isAutonomous && !this.isSelected]: tasks_v2_component_elements_chip.ChipDesign.Outline,
	        [this.isAutonomous && this.isSelected]: tasks_v2_component_elements_chip.ChipDesign.OutlineAccent
	      }.true;
	    },
	    isSelected() {
	      return this.checkLists.length > 0;
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
	      if (this.isUploading) {
	        return ui_iconSet_api_core.Animated.LOADER_WAIT;
	      }
	      return ui_iconSet_api_core.Outline.CHECK_LIST;
	    }
	  },
	  mounted() {
	    this.$bitrix.eventEmitter.subscribe(tasks_v2_const.EventName.CloseCheckList, this.handleFieldClose);
	  },
	  beforeUnmount() {
	    this.$bitrix.eventEmitter.unsubscribe(tasks_v2_const.EventName.CloseCheckList, this.handleFieldClose);
	  },
	  methods: {
	    handleClick() {
	      if (this.isAutonomous) {
	        void this.showCheckList();
	      } else {
	        // eslint-disable-next-line no-lonely-if
	        if (this.isSelected) {
	          this.highlightField();
	        } else {
	          void this.showCheckList();
	        }
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
	      await this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/update`, {
	        id: this.taskId,
	        fields: {
	          checklist: [parentId, childId]
	        }
	      });
	    },
	    highlightField() {
	      void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(checkListMeta.id);
	    },
	    getCompletedCount() {
	      return this.checkLists.filter(checklist => {
	        return checklist.isComplete && checklist.parentId !== 0;
	      }).length;
	    },
	    handleFieldClose() {
	      if (this.isAutonomous) {
	        this.$refs.chip.focus();
	      }
	    }
	  },
	  template: `
		<Chip
			:design="design"
			:icon="icon"
			:text="text"
			:data-task-id="taskId"
			:data-task-chip-id="checkListMeta.id"
			ref="chip"
			@click="handleClick"
		/>
	`
	};

	exports.CheckList = CheckList;
	exports.CheckListChip = CheckListChip;
	exports.CheckListList = CheckListList;
	exports.checkListMeta = checkListMeta;

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX.Main,BX.UI.EntitySelector,BX.Tasks.V2.Component.Elements,BX.Tasks.V2,BX.Tasks.V2.Lib,BX.Vue3.Components,BX.UI.Vue3.Components,BX.Vue3.Vuex,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Provider.Service,BX.UI.Vue3.Components,BX.Tasks.V2.Component.Elements,BX.UI.Uploader,BX.Disk.Uploader,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements,BX.Vue3.Directives,BX.UI.IconSet,BX.Tasks.V2.Component.Elements,BX.Event,BX,BX,BX.UI.IconSet,BX,BX.Tasks.V2.Lib,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Const));
//# sourceMappingURL=check-list.bundle.js.map
