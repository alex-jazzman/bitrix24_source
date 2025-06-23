/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,main_popup,ui_entitySelector,tasks_v2_core,tasks_v2_lib_userSelectorDialog,tasks_v2_provider_service_checkListService,tasks_v2_component_elements_participantList,ui_notification,ui_iconSet_outline,tasks_v2_lib_fieldHighlighter,tasks_v2_component_elements_chip,tasks_v2_component_elements_bottomSheet,ui_vue3_components_menu,ui_uploader_core,disk_uploader_userFieldWidget,tasks_v2_component_elements_growingTextArea,tasks_v2_component_elements_userAvatarList,tasks_v2_provider_service_fileService,tasks_v2_component_elements_hint,main_core,main_core_events,ui_vue3_components_popup,ui_vue3_vuex,ui_vue3_components_button,ui_iconSet_api_vue,ui_iconSet_api_core,tasks_v2_const) {
	'use strict';

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

	const CheckListMixin = {
	  components: {
	    BMenu: ui_vue3_components_menu.BMenu
	  },
	  data() {
	    return {
	      listShownItemPanels: [],
	      itemPanelIsShown: false,
	      checkListWasUpdated: false,
	      itemId: null,
	      itemPanelStyles: {
	        top: '0',
	        display: 'flex'
	      },
	      isItemPanelFreeze: false,
	      itemPanelTopOffset: 0,
	      itemPanelTopLimit: 0,
	      itemsRefs: {},
	      isForwardMenuShown: false,
	      forwardMenuSectionCode: 'createSection',
	      forwardBindElement: null,
	      itemsToDelete: [],
	      collapsedItems: new Map(),
	      shownPopups: new Set()
	    };
	  },
	  provide() {
	    return {
	      setItemsRef: this.setItemsRef,
	      getItemsRef: this.getItemsRef
	    };
	  },
	  computed: {
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
	    siblings() {
	      if (!this.item) {
	        return [];
	      }
	      return this.checkLists.filter(item => item.parentId === this.item.parentId);
	    },
	    children() {
	      if (!this.item) {
	        return [];
	      }
	      return this.checkLists.filter(item => {
	        return item.parentId === this.item.id;
	      });
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
	      const itemLevel = this.getItemLevel(this.item);
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
	          void this.forwardToChecklist(checkList.id);
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
	    }
	  },
	  mounted() {
	    main_core.Event.bind(this.$refs.list, 'scroll', this.handleScroll);
	  },
	  beforeUnmount() {
	    main_core.Event.unbind(this.$refs.list, 'scroll', this.handleScroll);
	  },
	  methods: {
	    handleScroll() {
	      this.isForwardMenuShown = false;
	      this.updatePanelPosition();
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
	      await this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/insertMany`, items);
	      this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/update`, {
	        id: this.taskId,
	        fields: {
	          checklist: [...this.task.checklist, parentId, childId]
	        }
	      });
	      return parentId;
	    },
	    addFastCheckList() {
	      const parentId = main_core.Text.getRandom();
	      this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/insert`, this.getDataForNewCheckList(parentId));
	      this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/update`, {
	        id: this.taskId,
	        fields: {
	          checklist: [...this.task.checklist, parentId]
	        }
	      });
	      void this.saveCheckList();
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
	      void this.$nextTick(() => {
	        var _this$getItemsRef2;
	        (_this$getItemsRef2 = this.getItemsRef(itemId)) == null ? void 0 : _this$getItemsRef2.show();
	      });
	    },
	    hideItem(itemId) {
	      void this.$nextTick(() => {
	        var _this$getItemsRef3;
	        (_this$getItemsRef3 = this.getItemsRef(itemId)) == null ? void 0 : _this$getItemsRef3.hide();
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
	      const sortIndex = sort != null ? sort : this.getSort();
	      const parentId = this.item.parentId === 0 ? this.item.id : this.item.parentId;
	      this.resortSiblingsItems(sortIndex);
	      this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/insert`, {
	        id: childId,
	        nodeId: childId,
	        parentId,
	        sortIndex
	      });
	      this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/update`, {
	        id: this.taskId,
	        fields: {
	          checklist: [...this.task.checklist, childId]
	        }
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
	      if (this.children.length > 0) {
	        this.children.forEach(child => {
	          this.removeItem(child.id, false);
	        });
	      }
	      this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/update`, {
	        id: this.taskId,
	        fields: {
	          checklist: this.task.checklist.filter(itemId => itemId !== id)
	        }
	      });
	      this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/delete`, id);
	      if (isRootCall) {
	        this.resortSiblingsItems();
	      }
	      this.syncParentCompletionState(id, parentId);
	      tasks_v2_provider_service_fileService.fileService.delete(id, tasks_v2_provider_service_fileService.EntityTypes.CheckListItem);
	    },
	    resortSiblingsItems(sortIndex) {
	      const updates = [];
	      if (main_core.Type.isUndefined(sortIndex)) {
	        const siblings = this.siblings.sort((a, b) => {
	          return a.sortIndex - b.sortIndex;
	        });
	        siblings.forEach((item, index) => {
	          if (item.sortIndex !== index) {
	            updates.push({
	              ...item,
	              sortIndex: index
	            });
	          }
	        });
	      } else {
	        this.siblings.filter(item => item.sortIndex >= sortIndex).forEach(item => {
	          updates.push({
	            ...item,
	            sortIndex: item.sortIndex + 1
	          });
	        });
	      }
	      if (updates.length > 0) {
	        this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, updates);
	      }
	    },
	    getSort() {
	      if (this.item && this.item.parentId === 0) {
	        return this.children.length;
	      }
	      return this.siblings.length;
	    },
	    toggleCompleted({
	      itemId,
	      collapsed
	    }) {
	      this.itemId = itemId;
	      const children = this.getAllChildren();
	      const completedChildren = children.filter(item => item.isComplete === true);
	      completedChildren.forEach(item => {
	        if (collapsed === false) {
	          this.showItem(item.id);
	        } else {
	          this.hideItem(item.id);
	        }
	      });
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
	    async handleGroupRemove(itemId) {
	      this.itemId = itemId;
	      this.freeze();
	      this.itemsToDelete = [...this.itemsToDelete, itemId];
	      this.hideItemPanel(itemId);
	      const allSelectedItems = this.getAllSelectedItems();
	      const nearestItem = this.findNearestItem(false);
	      if (nearestItem) {
	        await this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
	          id: nearestItem.id,
	          fields: {
	            groupMode: {
	              active: true,
	              selected: true
	            }
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
	      const firstChild = this.getFirstChild();
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
	    showItemPanel(itemId) {
	      this.itemId = itemId;
	      this.itemPanelIsShown = true;
	      if (!this.listShownItemPanels.includes(itemId)) {
	        this.listShownItemPanels = [...this.listShownItemPanels, itemId];
	      }
	      void this.$nextTick(() => this.updatePanelPosition());
	    },
	    hideItemPanel(itemId) {
	      this.itemPanelIsShown = false;
	      if (this.hasActiveGroupMode() && this.getAllSelectedItems().length === 0) {
	        this.deactivateGroupMode();
	      }
	      this.listShownItemPanels = this.listShownItemPanels.filter(id => id !== itemId);
	      this.isItemPanelFreeze = false;
	    },
	    showItemPanelOnNearestSelectedItem(itemId) {
	      // eslint-disable-next-line no-lonely-if
	      const nearestSelectedItem = this.findNearestItem(true);
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
	      const itemRect = main_core.Dom.getRelativePosition(itemRef, this.$refs.list);
	      const isParentItem = this.item.parentId === 0;
	      const paddingOffset = 24;
	      const panelWidth = panelRect.width === 0 ? 304 : panelRect.width;
	      const top = itemRect.top - 10;
	      if (isParentItem) {
	        const left = itemRect.width - panelWidth - paddingOffset * 2 - 80;
	        const display = top > -30 && top < this.itemPanelTopLimit ? 'flex' : 'none';
	        this.itemPanelStyles = {
	          top: `${top}px`,
	          left: `${left}px`,
	          display
	        };
	      } else {
	        const left = itemRect.width - panelWidth - paddingOffset;
	        const display = top > 40 && top < this.itemPanelTopLimit ? 'flex' : 'none';
	        this.itemPanelStyles = {
	          top: `${top}px`,
	          left: `${left}px`,
	          display
	        };
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
	        [PanelAction.MoveRight]: n => this.handleMoveRight(n),
	        [PanelAction.MoveLeft]: n => this.handleMoveLeft(n),
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
	    setImportant() {
	      if (this.itemGroupModeSelected) {
	        const updates = this.getAllSelectedItems().map(item => ({
	          ...item,
	          isImportant: !item.isImportant
	        }));
	        this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, updates);
	      } else {
	        this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
	          id: this.item.id,
	          fields: {
	            isImportant: !this.item.isImportant
	          }
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
	      });
	    },
	    handleMoveRight() {
	      if (this.itemGroupModeSelected) {
	        this.getAllSelectedItems().sort((a, b) => a.sortIndex - b.sortIndex).forEach(item => {
	          this.moveRight(item);
	        });
	      } else {
	        this.moveRight(this.item);
	      }
	    },
	    moveRight(item) {
	      var _item$groupMode;
	      if (item.parentId === 0 || this.getItemLevel(item) > 5) {
	        return;
	      }
	      const siblings = this.checkLists.filter(sibling => sibling.parentId === item.parentId).sort((a, b) => (a.sortIndex || 0) - (b.sortIndex || 0));
	      const currentIndex = siblings.findIndex(sibling => sibling.id === item.id);
	      if (currentIndex <= 0) {
	        return;
	      }
	      let newParent = null;
	      for (let i = currentIndex - 1; i >= 0; i--) {
	        const candidate = siblings[i];
	        if (!this.isItemDescendant(candidate, item)) {
	          newParent = candidate;
	          break;
	        }
	      }
	      if (!newParent) {
	        return;
	      }
	      const newParentChildren = this.checkLists.filter(child => child.parentId === newParent.id).sort((a, b) => a.sortIndex - b.sortIndex);
	      const updates = siblings.filter((sibling, index) => index > currentIndex).map(sibling => ({
	        ...sibling,
	        sortIndex: sibling.sortIndex - 1
	      }));
	      updates.push({
	        ...item,
	        parentId: newParent.id,
	        parentNodeId: newParent.nodeId,
	        sortIndex: newParentChildren.length > 0 ? newParentChildren[newParentChildren.length - 1].sortIndex + 1 : 0
	      });
	      this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, updates);
	      this.checkListWasUpdated = true;
	      if (!((_item$groupMode = item.groupMode) != null && _item$groupMode.active)) {
	        this.focusToItem(item.id);
	      }
	    },
	    handleMoveLeft() {
	      if (this.itemGroupModeSelected) {
	        this.getAllSelectedItems().sort((a, b) => b.sortIndex - a.sortIndex).forEach(item => {
	          this.moveLeft(item);
	        });
	      } else {
	        this.moveLeft(this.item);
	      }
	    },
	    moveLeft(item) {
	      var _item$groupMode2;
	      if (item.parentId === 0 || this.getItemLevel(item) <= 1) {
	        return;
	      }
	      const currentParent = this.checkLists.find(parent => parent.id === item.parentId);
	      if (!currentParent) {
	        return;
	      }
	      const newParentId = currentParent.parentId || 0;
	      const newSiblings = this.checkLists.filter(sibling => sibling.parentId === newParentId).sort((a, b) => a.sortIndex - b.sortIndex);
	      const parentInNewListIndex = newSiblings.findIndex(sibling => sibling.id === currentParent.id);
	      const currentSiblingsUpdates = this.checkLists.filter(sibling => sibling.parentId === item.parentId && sibling.sortIndex > item.sortIndex).map(sibling => ({
	        ...sibling,
	        sortIndex: sibling.sortIndex - 1
	      }));
	      let newSortIndex = 0;
	      if (parentInNewListIndex === -1 || parentInNewListIndex === newSiblings.length - 1) {
	        newSortIndex = newSiblings.length > 0 ? newSiblings[newSiblings.length - 1].sortIndex + 1 : 0;
	      } else {
	        newSortIndex = newSiblings[parentInNewListIndex].sortIndex + 1;
	        const shiftUpdates = newSiblings.filter(sibling => sibling.sortIndex >= newSortIndex).map(sibling => ({
	          ...sibling,
	          sortIndex: sibling.sortIndex + 1
	        }));
	        currentSiblingsUpdates.push(...shiftUpdates);
	      }
	      const movedItemUpdate = {
	        ...item,
	        parentId: newParentId,
	        parentNodeId: currentParent.parentNodeId || null,
	        sortIndex: newSortIndex
	      };
	      const updates = [...currentSiblingsUpdates, movedItemUpdate];
	      this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, updates);
	      this.checkListWasUpdated = true;
	      if (!((_item$groupMode2 = item.groupMode) != null && _item$groupMode2.active)) {
	        this.focusToItem(item.id);
	      }
	    },
	    isItemDescendant(potentialAncestor, item) {
	      if (item.parentId === potentialAncestor.id) {
	        return true;
	      }
	      if (item.parentId === 0) {
	        return false;
	      }
	      const parent = this.checkLists.find(i => i.id === item.parentId);
	      if (!parent) {
	        return false;
	      }
	      return this.isItemDescendant(potentialAncestor, parent);
	    },
	    assignAccomplice(node) {
	      this.showParticipantDialog(node, 'accomplices');
	    },
	    assignAuditor(node) {
	      this.showParticipantDialog(node, 'auditors');
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
	      void this.forwardToChecklist(newParentId);
	    },
	    async forwardToChecklist(parentId) {
	      if (this.itemGroupModeSelected) {
	        const allSelectedItems = this.getAllSelectedItems();
	        const nearestItem = this.findNearestItem(false, allSelectedItems);
	        if (nearestItem) {
	          this.showItemPanel(nearestItem.id);
	        } else {
	          this.cancelGroupMode();
	        }
	        const allSelectedWithChildren = this.getAllSelectedItemsWithChildren();
	        const selectedItemsIds = new Set(allSelectedItems.map(item => item.id));
	        const updates = [];
	        allSelectedItems.forEach(item => {
	          const shouldUpdateParentId = !selectedItemsIds.has(item.parentId);
	          updates.push({
	            ...item,
	            parentId: shouldUpdateParentId ? parentId : item.parentId,
	            groupMode: {
	              active: false,
	              selected: false
	            }
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
	        await this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, updates);
	        if (nearestItem) {
	          void this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
	            id: nearestItem.id,
	            fields: {
	              groupMode: {
	                active: true,
	                selected: true
	              }
	            }
	          });
	        }
	      } else {
	        this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
	          id: this.item.id,
	          fields: {
	            parentId
	          }
	        });
	      }
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
	      var _this$selectors, _this$selectors2, _this$selectors2$sele;
	      this.isItemPanelFreeze = true;
	      const itemId = this.item.id;
	      const preselected = this.preselectedParticipants(type);
	      (_this$selectors = this.selectors) != null ? _this$selectors : this.selectors = {};
	      const selectorId = `${type}-${itemId}`;
	      (_this$selectors2$sele = (_this$selectors2 = this.selectors)[selectorId]) != null ? _this$selectors2$sele : _this$selectors2[selectorId] = new tasks_v2_lib_userSelectorDialog.UserSelectorDialog({
	        taskId: this.taskId,
	        preselected,
	        dialogOptions: {
	          ...tasks_v2_component_elements_participantList.participantMeta.dialogOptions(this.taskId, `check-list-${selectorId}`),
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
	                const users = this.selectors[selectorId].getDialog().getSelectedItems().map(item => ({
	                  id: item.getId(),
	                  name: item.getTitle(),
	                  image: item.getAvatar(),
	                  type: item.getEntityType()
	                }));
	                this.saveParticipants(itemId, type, users);
	              }
	            }
	          }
	        },
	        events: {
	          onHide: () => {
	            this.isItemPanelFreeze = false;
	            if (!this.itemGroupModeSelected) {
	              this.focusToItem(itemId);
	            }
	            this.updatePanelPosition();
	          }
	        }
	      });
	      this.selectors[selectorId].show(targetNode);
	    },
	    preselectedParticipants(type) {
	      switch (type) {
	        case 'accomplices':
	          return this.item.accomplices.map(user => ['user', user.id]);
	        case 'auditors':
	          return this.item.auditors.map(user => ['user', user.id]);
	        default:
	          return [];
	      }
	    },
	    saveParticipants(id, type, users) {
	      if (this.itemGroupModeSelected) {
	        const updates = this.getAllSelectedItems().map(item => ({
	          ...item,
	          [type]: users
	        }));
	        this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, updates);
	      } else {
	        this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
	          id,
	          fields: {
	            [type]: users
	          }
	        });
	      }
	      const ids = users.map(user => user.id);
	      const fields = {
	        [`${type}Ids`]: ids
	      };
	      this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/update`, {
	        id: this.taskId,
	        fields
	      });
	    },
	    syncParentCompletionState(itemId, parentItemId) {
	      const changedItem = this.checkLists.find(item => item.id === itemId);
	      if ((!changedItem || !changedItem.parentId) && !parentItemId) {
	        return;
	      }
	      const parentId = parentItemId || changedItem.parentId;
	      const parentItem = this.checkLists.find(item => item.id === parentId);
	      if (!parentItem) {
	        return;
	      }
	      const childrenItems = this.checkLists.filter(item => item.parentId === parentItem.id);
	      const isEmptyParent = childrenItems.length === 0;
	      const allChildrenCompleted = childrenItems.every(child => child.isComplete);
	      const someChildrenIncomplete = childrenItems.some(child => !child.isComplete);
	      const shouldUpdateParent = isEmptyParent || allChildrenCompleted && !parentItem.isComplete || someChildrenIncomplete && parentItem.isComplete;
	      if (!shouldUpdateParent) {
	        return;
	      }
	      this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
	        id: parentItem.id,
	        fields: {
	          isComplete: allChildrenCompleted && !isEmptyParent
	        }
	      });
	      if (parentItem.parentId) {
	        this.syncParentCompletionState(parentItem.id);
	      }
	    },
	    activateGroupMode(parentItemId) {
	      this.itemId = parentItemId;
	      const updates = this.getAllChildren().map((item, index) => ({
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
	      this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, updates);
	    },
	    deactivateGroupMode() {
	      const updates = this.getAllGroupModeItems().map(item => ({
	        ...item,
	        groupMode: {
	          active: false,
	          selected: false
	        }
	      }));
	      this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, updates);
	    },
	    getRootParent(item) {
	      if (!item || item.parentId === 0) {
	        return item || null;
	      }
	      const parentItem = this.checkLists.find(parent => parent.id === item.parentId);
	      if (!parentItem) {
	        return null;
	      }
	      return this.getRootParent(parentItem);
	    },
	    getAllChildren() {
	      if (!this.item) {
	        return [];
	      }
	      const getAllChildren = parentId => {
	        const directChildren = this.checkLists.filter(item => item.parentId === parentId).sort((a, b) => a.sortIndex - b.sortIndex);
	        let allChildren = [...directChildren];
	        directChildren.forEach(child => {
	          allChildren = [...allChildren, ...getAllChildren(child.id)];
	        });
	        return allChildren;
	      };
	      return getAllChildren(this.item.id);
	    },
	    getFirstChild() {
	      if (!this.item) {
	        return null;
	      }
	      const children = this.checkLists.filter(item => item.parentId === this.item.id).sort((a, b) => a.sortIndex - b.sortIndex);
	      return children[0] || null;
	    },
	    findNearestItem(selected, excludeChildrenOf = []) {
	      if (!this.item) {
	        return null;
	      }
	      const rootParent = this.getRootParent(this.item);
	      if (!rootParent) {
	        return null;
	      }
	      const currentSortIndex = this.item.sortIndex;
	      const excludedParentIds = new Set(excludeChildrenOf.map(item => item.id));
	      const eligibleItems = this.checkLists.sort((a, b) => a.sortIndex - b.sortIndex).filter(item => {
	        var _item$groupMode3, _this$getRootParent;
	        const isChildOfExcluded = excludedParentIds.has(item.parentId);
	        return item.id !== this.item.id && item.parentId !== 0 && ((_item$groupMode3 = item.groupMode) == null ? void 0 : _item$groupMode3.selected) === selected && ((_this$getRootParent = this.getRootParent(item)) == null ? void 0 : _this$getRootParent.id) === rootParent.id && !isChildOfExcluded;
	      });
	      if (eligibleItems.length === 0) {
	        return null;
	      }
	      return eligibleItems.reduce((nearest, item) => {
	        return item.sortIndex > currentSortIndex && (item.sortIndex < nearest.sortIndex || nearest.sortIndex <= currentSortIndex) ? item : nearest;
	      });
	    },
	    getAllGroupModeItems() {
	      return this.checkLists.filter(item => {
	        var _item$groupMode4;
	        return ((_item$groupMode4 = item.groupMode) == null ? void 0 : _item$groupMode4.active) === true;
	      });
	    },
	    getAllSelectedItems() {
	      return this.checkLists.filter(item => {
	        var _item$groupMode5;
	        return item.parentId !== 0 && ((_item$groupMode5 = item.groupMode) == null ? void 0 : _item$groupMode5.selected) === true;
	      });
	    },
	    getAllSelectedItemsWithChildren() {
	      const selectedItems = this.checkLists.filter(item => {
	        var _item$groupMode6;
	        return item.parentId !== 0 && ((_item$groupMode6 = item.groupMode) == null ? void 0 : _item$groupMode6.selected) === true;
	      });
	      const getChildren = parentIds => {
	        const children = this.checkLists.filter(item => parentIds.includes(item.parentId));
	        return children.length > 0 ? [...children, ...getChildren(children.map(child => child.id))] : children;
	      };
	      return [...selectedItems, ...getChildren(selectedItems.map(item => item.id))];
	    },
	    hasActiveGroupMode() {
	      return this.getAllGroupModeItems().length > 0;
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
	    freeze() {
	      var _this$$refs$popupComp;
	      (_this$$refs$popupComp = this.$refs.popupComponent) == null ? void 0 : _this$$refs$popupComp.freeze();
	    },
	    unfreeze() {
	      if (this.shownPopups.size === 0 && this.itemsToDelete.length === 0) {
	        var _this$$refs$popupComp2;
	        (_this$$refs$popupComp2 = this.$refs.popupComponent) == null ? void 0 : _this$$refs$popupComp2.unfreeze();
	      }
	    },
	    setDefaultCheckListTitle(itemId) {
	      this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
	        id: itemId,
	        fields: {
	          title: this.loc('TASKS_V2_CHECK_LIST_TITLE_NUMBER', {
	            '#number#': this.getCheckListsNumber()
	          })
	        }
	      });
	    }
	  }
	};

	const checkListMeta = Object.freeze({
	  id: 'checklist',
	  title: main_core.Loc.getMessage('TASKS_V2_CHECK_LIST_TITLE')
	});

	// @vue/component
	const CheckList = {
	  name: 'TaskCheckList',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  mixins: [CheckListMixin],
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    }
	  },
	  emits: ['open'],
	  setup() {
	    return {
	      Animated: ui_iconSet_api_core.Animated,
	      Outline: ui_iconSet_api_core.Outline,
	      checkListMeta
	    };
	  },
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
	    isLoading() {
	      return this.checkLists.length === 0;
	    },
	    containsChecklist() {
	      return this.task.containsChecklist;
	    },
	    parentCheckLists() {
	      return this.checkLists.filter(checkList => checkList.parentId === 0);
	    }
	  },
	  async created() {
	    if (this.containsChecklist) {
	      void this.loadData();
	    }
	  },
	  methods: {
	    async loadData() {
	      await tasks_v2_provider_service_checkListService.checkListService.load(this.taskId);
	    },
	    getCompletedCount(parentId) {
	      return this.checkLists.filter(checklist => {
	        return checklist.parentId === parentId && checklist.isComplete;
	      }).length;
	    },
	    getTotalCount(parentId) {
	      return this.checkLists.filter(checklist => {
	        return checklist.parentId === parentId;
	      }).length;
	    },
	    showCheckList(checkListId) {
	      this.$emit('open', checkListId);
	    },
	    renderCheckListStatus(checkListId) {
	      return this.loc('TASKS_V2_CHECK_LIST_STATUS_LABEL', {
	        '#completed#': this.getCompletedCount(checkListId),
	        '#total#': this.getTotalCount(checkListId)
	      });
	    }
	  },
	  template: `
		<div
			:data-task-field-id="checkListMeta.id"
			class="tasks-field-check-list"
			:class="{ '--default': isLoading }"
		>
			<div
				class="tasks-field-check-list-content"
				:class="{ '--default': isLoading }"
			>
				<template v-if="isLoading">
					<div class="tasks-field-check-list-content-row">
						<BIcon :name="Animated.LOADER_WAIT"/>
						<div class="tasks-field-check-list-content-text">
							{{ loc('TASKS_V2_CHECK_LIST_LOADING') }}
						</div>
					</div>
				</template>
				<template v-else>
					<div class="tasks-field-check-list-content-list">
						<div
							v-for="checklist in parentCheckLists"
							:key="checklist.id"
							class="tasks-field-check-list-content-list-item"
							@click="() => this.showCheckList(checklist.id)"
						>
							<div class="tasks-field-check-list-content-list-item-icon">
								<BIcon :name="Outline.CHECK_LIST"/>
							</div>
							<div class="tasks-field-check-list-content-list-item-title">
								{{ checklist.title }}
							</div>
							<div
								class="tasks-field-check-list-content-list-item-status"
								v-html="renderCheckListStatus(checklist.id)"
							>
							</div>
							<div class="tasks-field-check-list-content-list-item-arrow">
								<BIcon :name="Outline.CHEVRON_RIGHT_L"/>
							</div>
						</div>
					</div>
					<div class="tasks-field-check-list-content-row --footer">
						<div
							class="tasks-field-check-list-content-btn"
							@click="addFastCheckList"
						>
							<BIcon :name="Outline.PLUS_L"/>
							<div class="tasks-field-check-list-content-btn-text">
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

	// @vue/component
	const CheckListStub = {
	  name: 'CheckListStub',
	  template: `
		<div class="check-list-stub">
			<div class="check-list-stub-title">
				{{ loc('TASKS_V2_CHECK_LIST_STUB_TITLE') }}
			</div>
			<div class="check-list-stub-icon"></div>
		</div>
	`
	};

	const CheckListWidgetMixin = {
	  methods: {
	    getItemLevel(checkList) {
	      let level = 0;
	      let current = checkList;
	      const findParent = parentId => this.checkLists.find(item => item.id === parentId);
	      while (current.parentId !== 0) {
	        current = findParent(current.parentId);
	        if (!current) {
	          break;
	        }
	        level++;
	      }
	      return level;
	    }
	  }
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
	    panelIsShown: {
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
	    updateTitle(title = '') {
	      this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
	        id: this.id,
	        fields: {
	          title
	        }
	      });
	      this.$emit('update');
	    },
	    clearTitle() {
	      var _this$$refs$growingTe;
	      (_this$$refs$growingTe = this.$refs.growingTextArea) == null ? void 0 : _this$$refs$growingTe.clearValue();
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
	    handleFocus() {
	      this.$emit('focus', this.id);
	    },
	    handleBlur() {
	      this.$emit('blur', this.id);
	    },
	    handleEmptyBlur() {
	      this.$emit('emptyBlur', this.id);
	    },
	    show() {
	      this.$emit('show', this.id);
	    },
	    hide() {
	      this.$emit('hide', this.id);
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
	    UserAvatarList: tasks_v2_component_elements_userAvatarList.UserAvatarList
	  },
	  mixins: [CheckListWidgetMixin, CheckListItemMixin],
	  inject: ['setItemsRef'],
	  emits: ['toggleCompleted', 'toggleCollapse', 'startGroupMode'],
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
	      areChildrenCollapsed: false,
	      areCompletedCollapsed: false
	    };
	  },
	  computed: {
	    menuOptions() {
	      return {
	        id: `check-list-parent-item-action-menu-${this.id}`,
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
	      return [{
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
	      }, {
	        title: this.loc('TASKS_V2_CHECK_LIST_ITEM_MENU_GROUP'),
	        icon: ui_iconSet_api_core.Outline.MULTICHOICE_ON,
	        dataset: {
	          id: `MenuProfileGroup-${this.id}`
	        },
	        onClick: () => {
	          if (this.areChildrenCollapsed === true) {
	            this.collapseChildrenItems();
	          }
	          this.$emit('startGroupMode', this.id);
	          this.isMenuShown = false;
	        }
	      }, {
	        sectionCode: this.menuRemoveSectionCode,
	        design: 'alert',
	        title: this.loc('TASKS_V2_CHECK_LIST_ITEM_MENU_REMOVE'),
	        icon: ui_iconSet_api_core.Outline.TRASHCAN,
	        dataset: {
	          id: `MenuProfileRemove-${this.id}`
	        },
	        onClick: this.removeItem.bind(this)
	      }];
	    },
	    itemIcon() {
	      return this.item.isComplete ? ui_iconSet_api_core.Outline.CHECK_L : ui_iconSet_api_core.Outline.CHECK_LIST;
	    },
	    checkListStatus() {
	      const label = this.loc('TASKS_V2_CHECK_LIST_STATUS_LABEL');
	      return label.replace('#completed#', this.getCompletedCount()).replace('#total#', this.getTotalCount());
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
	      const paddingOffset = 18;
	      this.isSticky = stickyRect.top <= containerRect.top + stickyRect.height - paddingOffset;
	    },
	    showMenu() {
	      this.isMenuShown = true;
	    },
	    getCompletedCount() {
	      return this.checkLists.filter(checklist => {
	        return checklist.parentId === this.id && checklist.isComplete;
	      }).length;
	    },
	    getTotalCount() {
	      return this.checkLists.filter(checklist => {
	        return checklist.parentId === this.id;
	      }).length;
	    },
	    collapseChildrenItems() {
	      this.areChildrenCollapsed = !this.areChildrenCollapsed;
	      this.$emit('toggleCollapse', {
	        parentId: this.id,
	        areChildrenCollapsed: this.areChildrenCollapsed
	      });
	    }
	  },
	  template: `
		<div
			ref="item"
			class="check-list-widget-parent-item"
			:class="{
				'--complete': item.isComplete,
				'--collapsed': areChildrenCollapsed,
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
					:initialValue="item.title"
					:placeholderValue="loc('TASKS_V2_CHECK_LIST_ITEM_PLACEHOLDER')"
					:readonly="groupMode"
					:fontColor="textColor"
					:fontSize="17"
					:lineHeight="20"
					:fontWeight="500"
					@update="updateTitle"
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
				<div
					class="check-list-widget-parent-item-title-status"
					v-html="checkListStatus"
				></div>
			</div>
			<div class="check-list-widget-parent-item-action">
				<div class="check-list-widget-parent-item-main-action">
					<BIcon ref="more" :name="Outline.MORE_L" @click="showMenu" />
					<BIcon
						:name="areChildrenCollapsed ? Actions.CHEVRON_DOWN : Actions.CHEVRON_UP"
						@click="collapseChildrenItems"
					/>
				</div>
				<div v-if="isSticky" class="check-list-widget-parent-item-empty"></div>
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
	  mixins: [CheckListWidgetMixin, CheckListItemMixin],
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
	          hideDropArea: true
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
	      await this.fileService.list(this.files.map(file => {
	        var _file$id;
	        return (_file$id = file == null ? void 0 : file.id) != null ? _file$id : file;
	      }));
	    },
	    handleEnter() {
	      if (!this.item) {
	        return;
	      }
	      this.addItem(this.item.sortIndex + 1);
	    },
	    handleClick() {
	      if (this.groupMode) {
	        this.toggleGroupModeSelected();
	      }
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
					@mousedown.stop
				>
					<input
						ref="checkbox"
						type="checkbox"
						:checked="item.isComplete"
						:disabled="!canToggle || groupMode"
						@change="toggleIsComplete"
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
					:initialValue="item.title"
					:placeholderValue="loc('TASKS_V2_CHECK_LIST_ITEM_PLACEHOLDER')"
					:readonly="groupMode"
					:fontColor="textColor"
					:fontSize="15"
					:lineHeight="20"
					@update="updateTitle"
					@focus="handleFocus"
					@blur="handleBlur"
					@emptyBlur="handleEmptyBlur"
					@emptyFocus="focusToItem"
					@enterBlur="handleEnter"
				/>
				<div
					v-if="isHovered && !panelIsShown && !groupMode"
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
	  mixins: [CheckListItemMixin],
	  emits: ['addItem'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_core.Outline
	    };
	  },
	  template: `
		<div
			class="check-list-widget-add-item"
			@click="addItem"
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
	  mixins: [CheckListWidgetMixin],
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
	    listShownItemPanels: {
	      type: Array,
	      default: () => []
	    }
	  },
	  emits: ['show', 'update', 'addItem', 'removeItem', 'toggleIsComplete', 'focus', 'blur', 'emptyBlur', 'toggleCompleted', 'startGroupMode', 'toggleGroupModeSelected'],
	  data() {
	    return {
	      collapsedStates: {},
	      hiddenStates: {}
	    };
	  },
	  computed: {
	    task() {
	      return this.$store.getters[`${tasks_v2_const.Model.Tasks}/getById`](this.taskId);
	    },
	    checkLists() {
	      return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getByIds`](this.task.checklist);
	    },
	    siblings() {
	      return this.checkLists.filter(item => item.parentId === this.parentId).sort((a, b) => a.sortIndex - b.sortIndex);
	    },
	    getCollapsedClassForItem() {
	      return itemId => {
	        return `check-list-widget-collapse ${this.collapsedStates[itemId] ? '--collapsed' : '--expanded'}`;
	      };
	    }
	  },
	  mounted() {
	    if (this.checkListId) {
	      var _this$$root$$el;
	      this.scrollContainer = (_this$$root$$el = this.$root.$el) == null ? void 0 : _this$$root$$el.querySelector(['[data-list]']);
	      const targetParentItem = this.scrollContainer.querySelector([`[data-parent="${this.checkListId}"]`]);
	      const offset = 12;
	      setTimeout(() => {
	        this.scrollContainer.scrollTop = targetParentItem.offsetTop - offset;
	      }, 0);
	    }
	    this.$emit('show');
	  },
	  methods: {
	    getItemOffset(item) {
	      if (item.parentId === 0) {
	        return '0';
	      }
	      const level = this.getItemLevel(item);
	      if (level === 1) {
	        return '0';
	      }
	      return `${(level - 1) * 12}px`;
	    },
	    toggleCollapse({
	      parentId,
	      areChildrenCollapsed
	    }) {
	      this.collapsedStates[parentId] = areChildrenCollapsed;
	    },
	    handleShowItem(itemId) {
	      this.hiddenStates[itemId] = false;
	    },
	    handleHideItem(itemId) {
	      this.hiddenStates[itemId] = true;
	    },
	    isFirstVisibleItem(title, index) {
	      const siblings = this.siblings;
	      const firstVisibleIndex = siblings.findIndex(item => !this.hiddenStates[item.id]);
	      return firstVisibleIndex !== -1 && firstVisibleIndex === index;
	    }
	  },
	  template: `
		<div class="check-list-widget-container">
			<ul class="check-list-widget">
				<li
					v-for="(item, index) in siblings"
					:key="item.id"
					class="check-list-widget-item"
					:class="{
						'--first-visible': parentId === 0 && isFirstVisibleItem(item.title, index),
						'--hidden': hiddenStates[item.id],
						'--parent': parentId === 0
					}"
				>
					<CheckListParentItem
						v-if="item.parentId === 0"
						:id="item.id"
						:taskId="taskId"
						:panelIsShown="listShownItemPanels.includes(item.id)"
						@update="$emit('update')"
						@removeItem="(id) => $emit('removeItem', id)"
						@focus="(id) => $emit('focus', id)"
						@blur="(id) => $emit('blur', id)"
						@emptyBlur="(id) => $emit('emptyBlur', id)"
						@toggleCompleted="(data) => $emit('toggleCompleted', data)"
						@toggleCollapse="toggleCollapse"
						@startGroupMode="(id) => $emit('startGroupMode', id)"
						@show="handleShowItem"
						@hide="handleHideItem"
					/>
					<CheckListChildItem
						v-else
						:id="item.id"
						:taskId="taskId"
						:itemOffset="getItemOffset(item)"
						:panelIsShown="listShownItemPanels.includes(item.id)"
						@update="$emit('update')"
						@toggleIsComplete="(id) => $emit('toggleIsComplete', id)"
						@addItem="(data) => $emit('addItem', data)"
						@removeItem="(id) => $emit('removeItem', id)"
						@focus="(id) => $emit('focus', id)"
						@blur="(id) => $emit('blur', id)"
						@emptyBlur="(id) => $emit('emptyBlur', id)"
						@toggleGroupModeSelected="(id) => $emit('toggleGroupModeSelected', id)"
						@show="handleShowItem"
						@hide="handleHideItem"
					/>
					<CheckListWidget
						v-if="checkLists.some(child => child.parentId === item.id)"
						:taskId="taskId"
						:parentId="item.id"
						:listShownItemPanels="listShownItemPanels"
						:class="getCollapsedClassForItem(item.id)"
						@update="$emit('update')"
						@toggleIsComplete="(id) => $emit('toggleIsComplete', id)"
						@addItem="(data) => $emit('addItem', data)"
						@removeItem="(id) => $emit('removeItem', id)"
						@focus="(id) => $emit('focus', id)"
						@blur="(id) => $emit('blur', id)"
						@emptyBlur="(id) => $emit('emptyBlur', id)"
						@toggleCompleted="(data) => $emit('toggleCompleted', data)"
						@toggleCollapse="toggleCollapse"
						@startGroupMode="(id) => $emit('startGroupMode', id)"
						@toggleGroupModeSelected="(id) => $emit('toggleGroupModeSelected', id)"
						@show="handleShowItem"
						@hide="handleHideItem"
					/>
					<div class="check-list-widget-add-container" :class="getCollapsedClassForItem(item.id)">
						<CheckListAddItem
							v-if="item.parentId === 0"
							:taskId="taskId"
							:id="item.id"
							@update="$emit('update')"
							@addItem="(data) => $emit('addItem', data)"
						/>
					</div>
				</li>
			</ul>
		</div>
	`
	};

	// @vue/component
	const CheckListItemPanel = {
	  name: 'CheckListItemPanel',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    Hint: tasks_v2_component_elements_hint.Hint
	  },
	  props: {
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
	  setup() {
	    return {
	      Outline: ui_iconSet_api_core.Outline
	    };
	  },
	  data() {
	    return {
	      isHintShown: false,
	      currentHintElement: null,
	      currentHintText: '',
	      hintTimeout: null
	    };
	  },
	  computed: {
	    hintOptions() {
	      return {
	        offsetLeft: this.currentHintElement ? -main_core.Dom.getPosition(this.currentHintElement).width : 0,
	        bindOptions: {
	          forceBindPosition: true,
	          forceTop: true,
	          position: 'top'
	        },
	        angle: false
	      };
	    },
	    hasSections() {
	      return this.sections.length > 0;
	    },
	    sections() {
	      const visibleActions = this.visibleActions;
	      return PanelMeta.defaultSections.filter(section => this.visibleSections.includes(section.name)).map(section => ({
	        ...section,
	        items: section.items.filter(item => visibleActions.includes(item.action)).map(item => ({
	          ...item,
	          disabled: this.isItemDisabled(item),
	          active: this.isItemActive(item),
	          hoverable: main_core.Type.isUndefined(item.hoverable) ? true : item.hoverable
	        }))
	      })).filter(section => section.items.length > 0);
	    }
	  },
	  methods: {
	    isItemDisabled(item) {
	      if (!main_core.Type.isUndefined(item.disabled)) {
	        return item.disabled;
	      }
	      return this.disabledActions.includes(item.action);
	    },
	    isItemActive(item) {
	      if (!main_core.Type.isUndefined(item.active)) {
	        return item.active;
	      }
	      return this.activeActions.includes(item.action);
	    },
	    getItemIcon(item) {
	      return item.active && item.activeIcon ? item.activeIcon : item.icon;
	    },
	    getItemHint(item) {
	      if (item.disabled === true && item.disabledHint) {
	        return this.loc(item.disabledHint);
	      }
	      if (item.hint) {
	        return this.loc(item.hint);
	      }
	      return '';
	    },
	    handleItemClick(event, item) {
	      if (!item.disabled) {
	        this.$emit('action', {
	          action: item.action,
	          node: event.currentTarget
	        });
	      }
	    },
	    showHint(event, item) {
	      const hintText = this.getItemHint(item);
	      if (!hintText) {
	        return;
	      }
	      if (this.hintTimeout) {
	        clearTimeout(this.hintTimeout);
	        this.hintTimeout = null;
	      }
	      this.currentHintElement = event.currentTarget;
	      this.currentHintText = hintText;
	      this.hintTimeout = setTimeout(() => {
	        this.isHintShown = true;
	      }, 1000);
	    },
	    hideHint() {
	      if (this.hintTimeout) {
	        clearTimeout(this.hintTimeout);
	        this.hintTimeout = null;
	      }
	      this.isHintShown = false;
	      this.currentHintElement = null;
	      this.currentHintText = '';
	    }
	  },
	  template: `
		<div v-if="hasSections" class="check-list-widget-item-panel" @mousedown.prevent>
			<div 
				v-for="section in sections" 
				:key="section.name"
				class="check-list-widget-item-panel-section"
				:class="'--' + section.name"
			>
				<div 
					v-for="item in section.items" 
					:key="item.action" 
					class="check-list-widget-item-panel-section-item"
					:class="{
						'--disabled': item.disabled, 
						'--active': item.active,
						[item.className]: !!item.className
					}"
					@mouseenter="showHint($event, item)"
					@mouseleave="hideHint()"
					@click="handleItemClick($event, item)"
				>
					<BIcon :name="getItemIcon(item)" :hoverable="item.hoverable"/>
					<span v-if="item.label">{{ loc(item.label) }}</span>
				</div>
			</div>
			<Hint
				v-if="isHintShown"
				:bindElement="currentHintElement"
				:options="hintOptions"
			>
				{{ currentHintText }}
			</Hint>
		</div>
	`
	};

	// @vue/component
	const CheckListSheet = {
	  name: 'TaskCheckListSheet',
	  components: {
	    BottomSheet: tasks_v2_component_elements_bottomSheet.BottomSheet,
	    CheckListWidget,
	    CheckListItemPanel,
	    CheckListStub,
	    UiButton: ui_vue3_components_button.Button,
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  mixins: [CheckListMixin, CheckListWidgetMixin],
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    },
	    checkListId: {
	      type: [Number, String],
	      default: 0
	    },
	    isShown: {
	      type: Boolean,
	      required: true
	    }
	  },
	  emits: ['close'],
	  setup() {
	    return {
	      ButtonSize: ui_vue3_components_button.ButtonSize,
	      ButtonIcon: ui_vue3_components_button.ButtonIcon,
	      Outline: ui_iconSet_api_core.Outline
	    };
	  },
	  data() {
	    return {
	      isExpanded: false,
	      itemPanelTopOffset: 2,
	      itemPanelTopLimit: 700
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      titleFieldOffsetHeight: `${tasks_v2_const.Model.Interface}/titleFieldOffsetHeight`
	    }),
	    task() {
	      return this.$store.getters[`${tasks_v2_const.Model.Tasks}/getById`](this.taskId);
	    },
	    checkLists() {
	      return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getByIds`](this.task.checklist);
	    }
	  },
	  watch: {
	    titleFieldOffsetHeight() {
	      var _this$$refs$bottomShe;
	      (_this$$refs$bottomShe = this.$refs.bottomSheet) == null ? void 0 : _this$$refs$bottomShe.adjustPosition();
	    },
	    async isShown(value) {
	      await this.$nextTick();
	      if (value) {
	        main_core.Event.bind(this.$refs.list, 'scroll', this.handleScroll);
	      } else {
	        main_core.Event.unbind(this.$refs.list, 'scroll', this.handleScroll);
	      }
	    }
	  },
	  methods: {
	    handleClose() {
	      this.cancelGroupMode();
	      void this.saveCheckList();
	      this.$emit('close');
	    }
	  },
	  template: `
		<BottomSheet
			:isShown="isShown"
			:isExpanded="isExpanded"
			:class="'--check-list'"
			ref="bottomSheet"
		>
			<div ref="wrapper" class="tasks-field-check-list-sheet">
				<div ref="list" data-list class="tasks-field-check-list-list">
					<CheckListWidget
						v-show="!stub"
						:taskId="taskId"
						:checkListId="checkListId"
						:listShownItemPanels="listShownItemPanels"
						@update="handleUpdate"
						@toggleIsComplete="handleToggleIsComplete"
						@addItem="addItem"
						@removeItem="handleRemove"
						@focus="handleFocus"
						@blur="handleBlur"
						@emptyBlur="handleEmptyBlur"
						@toggleCompleted="toggleCompleted"
						@startGroupMode="handleGroupMode"
						@toggleGroupModeSelected="handleGroupModeSelect"
					/>
					<CheckListStub v-if="stub" />
					<div class="tasks-field-check-list-close-icon --sheet">
						<BIcon :name="Outline.CROSS_L" @click="handleClose"/>
					</div>
				</div>
				<div class="tasks-field-check-list-footer">
					<UiButton
						:text="loc('TASKS_V2_CHECK_LIST_ADD_BTN')"
						:size="ButtonSize.MEDIUM"
						:leftIcon="ButtonIcon.ADD"
						@click="addCheckList"
					/>
				</div>
				<CheckListItemPanel
					v-if="itemPanelIsShown"
					ref="panel"
					:style="itemPanelStyles"
					:visibleActions="visiblePanelActions"
					:disabledActions="disabledPanelActions"
					:activeActions="activePanelActions"
					@action="handlePanelAction"
				/>
			</div>
		</BottomSheet>
	`
	};

	// @vue/component
	const CheckListPopup = {
	  name: 'TaskCheckListPopup',
	  components: {
	    Popup: ui_vue3_components_popup.Popup,
	    CheckListWidget,
	    CheckListItemPanel,
	    CheckListStub,
	    UiButton: ui_vue3_components_button.Button,
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  mixins: [CheckListMixin, CheckListWidgetMixin],
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    }
	  },
	  emits: ['show', 'close', 'resize'],
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
	      itemPanelTopOffset: 5,
	      itemPanelTopLimit: 450
	    };
	  },
	  computed: {
	    task() {
	      return this.$store.getters[`${tasks_v2_const.Model.Tasks}/getById`](this.taskId);
	    },
	    checkLists() {
	      return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getByIds`](this.task.checklist);
	    },
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
	      if (!this.$refs.popupComponent) {
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
	    main_core_events.EventEmitter.subscribe('BX.Main.Popup:onShow', this.handleShowPopup);
	    main_core_events.EventEmitter.subscribe('BX.Main.Popup:onClose', this.handleClosePopup);
	  },
	  beforeUnmount() {
	    main_core.Event.unbind(window, 'resize', this.resize);
	    main_core_events.EventEmitter.unsubscribe('BX.Main.Popup:onShow', this.handleShowPopup);
	    main_core_events.EventEmitter.unsubscribe('BX.Main.Popup:onClose', this.handleClosePopup);
	  },
	  methods: {
	    resize() {
	      var _this$$refs$popupComp;
	      const popupInstance = (_this$$refs$popupComp = this.$refs.popupComponent) == null ? void 0 : _this$$refs$popupComp.getPopupInstance();
	      if (popupInstance) {
	        this.$emit('resize');
	        popupInstance.adjustPosition();
	      }
	    },
	    handleShow() {
	      var _this$$refs$popupComp2;
	      this.$emit('show', {
	        popupInstance: this.$refs.popupComponent.getPopupInstance()
	      });
	      (_this$$refs$popupComp2 = this.$refs.popupComponent) == null ? void 0 : _this$$refs$popupComp2.getPopupInstance().adjustPosition();
	      setTimeout(() => this.resizeObserver.observe(this.$refs.wrapper), 300);
	    },
	    handleClose() {
	      this.cancelGroupMode();
	      void this.saveCheckList();
	      this.resizeObserver.disconnect();
	      this.$bitrix.eventEmitter.emit(tasks_v2_const.EventName.CloseCheckList);
	      this.$emit('close');
	    }
	  },
	  template: `
		<Popup :options="popupOptions" ref="popupComponent">
			<div ref="wrapper" class="tasks-check-list-popup-wrapper">
				<div ref="list" data-list class="tasks-check-list-popup-list">
					<CheckListWidget
						v-show="!stub"
						:taskId="taskId"
						:listShownItemPanels="listShownItemPanels"
						@update="handleUpdate"
						@toggleIsComplete="handleToggleIsComplete"
						@show="handleShow"
						@addItem="addItem"
						@removeItem="handleRemove"
						@focus="handleFocus"
						@blur="handleBlur"
						@emptyBlur="handleEmptyBlur"
						@toggleCompleted="toggleCompleted"
						@startGroupMode="handleGroupMode"
						@toggleGroupModeSelected="handleGroupModeSelect"
					/>
					<CheckListStub v-if="stub" />
					<div class="tasks-field-check-list-close-icon --popup">
						<BIcon :name="Outline.CROSS_L" @click="handleClose"/>
					</div>
				</div>
				<div class="tasks-check-list-popup-footer">
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
					v-if="itemPanelIsShown"
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
		</Popup>
	`
	};

	exports.CheckList = CheckList;
	exports.CheckListChip = CheckListChip;
	exports.CheckListSheet = CheckListSheet;
	exports.CheckListPopup = CheckListPopup;
	exports.checkListMeta = checkListMeta;

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX.Main,BX.UI.EntitySelector,BX.Tasks.V2,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Component.Elements,BX,BX,BX.Tasks.V2.Lib,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements,BX.UI.Vue3.Components,BX.UI.Uploader,BX.Disk.Uploader,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Component.Elements,BX,BX.Event,BX.UI.Vue3.Components,BX.Vue3.Vuex,BX.Vue3.Components,BX.UI.IconSet,BX.UI.IconSet,BX.Tasks.V2.Const));
//# sourceMappingURL=check-list.bundle.js.map
