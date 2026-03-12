/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,tasks_v2_component_elements_hoverPill,tasks_v2_component_elements_fieldAdd,ui_vue3_components_popup,ui_vue3_components_button,tasks_v2_provider_service_userService,ui_notificationManager,ui_system_menu_vue,ui_iconSet_api_core,ui_iconSet_crm,tasks_v2_lib_scrumManager,tasks_v2_lib_color,tasks_v2_core,tasks_v2_lib_entitySelectorDialog,ui_system_typography_vue,ui_system_skeleton_vue,main_core,ui_system_chip_vue,ui_iconSet_api_vue,ui_iconSet_outline,tasks_v2_const,tasks_v2_component_elements_hint,tasks_v2_lib_fieldHighlighter,tasks_v2_lib_showLimit,tasks_v2_lib_analytics,tasks_v2_provider_service_groupService,tasks_v2_provider_service_taskService) {
	'use strict';

	const groupMeta = Object.freeze({
	  id: tasks_v2_const.TaskField.Group,
	  title: main_core.Loc.getMessage('TASKS_V2_GROUP_TITLE'),
	  stageTitle: main_core.Loc.getMessage('TASKS_V2_GROUP_STAGE_TITLE'),
	  epicTitle: main_core.Loc.getMessage('TASKS_V2_GROUP_EPIC_TITLE'),
	  storyPointsTitle: main_core.Loc.getMessage('TASKS_V2_GROUP_STORY_POINTS_TITLE'),
	  getTitle: groupId => {
	    var _GroupType$Collab$Gro;
	    const group = tasks_v2_core.Core.getStore().getters[`${tasks_v2_const.Model.Groups}/getById`](groupId);
	    return (_GroupType$Collab$Gro = {
	      [tasks_v2_const.GroupType.Collab]: main_core.Loc.getMessage('TASKS_V2_GROUP_TITLE_COLLAB'),
	      [tasks_v2_const.GroupType.Scrum]: main_core.Loc.getMessage('TASKS_V2_GROUP_TITLE_SCRUM')
	    }[group == null ? void 0 : group.type]) != null ? _GroupType$Collab$Gro : main_core.Loc.getMessage('TASKS_V2_GROUP_TITLE');
	  }
	});

	const GroupPopup = {
	  components: {
	    Popup: ui_vue3_components_popup.Popup,
	    UiButton: ui_vue3_components_button.Button
	  },
	  inject: {
	    task: {}
	  },
	  props: {
	    getBindElement: {
	      type: Function,
	      required: true
	    }
	  },
	  emits: ['close'],
	  setup() {
	    return {
	      AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
	      ButtonSize: ui_vue3_components_button.ButtonSize
	    };
	  },
	  data() {
	    return {
	      isPopupShown: false,
	      /** @type GroupInfo */
	      groupInfo: {}
	    };
	  },
	  computed: {
	    group() {
	      return this.$store.getters[`${tasks_v2_const.Model.Groups}/getById`](this.task.groupId);
	    },
	    bindElement() {
	      return this.getBindElement();
	    },
	    options() {
	      return {
	        id: 'tasks-field-group-popup',
	        bindElement: this.bindElement,
	        padding: 24,
	        minWidth: 260,
	        maxWidth: 400,
	        offsetTop: 8,
	        targetContainer: document.body
	      };
	    },
	    groupOwnerUrl() {
	      return tasks_v2_provider_service_userService.userService.getUrl(this.groupInfo.ownerId);
	    },
	    groupMembersCountFormatted() {
	      return main_core.Loc.getMessagePlural('TASKS_V2_GROUP_COUNT_MEMBERS', this.groupInfo.numberOfMembers, {
	        '#COUNT#': this.groupInfo.numberOfMembers
	      });
	    },
	    groupAboutFormatted() {
	      var _GroupType$Collab$Gro, _this$group;
	      return (_GroupType$Collab$Gro = {
	        [tasks_v2_const.GroupType.Collab]: this.loc('TASKS_V2_GROUP_ABOUT_COLLAB'),
	        [tasks_v2_const.GroupType.Scrum]: this.loc('TASKS_V2_GROUP_ABOUT_SCRUM')
	      }[(_this$group = this.group) == null ? void 0 : _this$group.type]) != null ? _GroupType$Collab$Gro : this.loc('TASKS_V2_GROUP_ABOUT');
	    }
	  },
	  mounted() {
	    main_core.Event.bind(this.bindElement, 'click', this.handleClick);
	    main_core.Event.bind(this.bindElement, 'mouseenter', this.handleMouseEnter);
	    main_core.Event.bind(this.bindElement, 'mouseleave', this.handleMouseLeave);
	  },
	  methods: {
	    async openGroup() {
	      const href = await tasks_v2_provider_service_groupService.groupService.getUrl(this.group.id, this.group.type);
	      BX.SidePanel.Instance.emulateAnchorClick(href);
	    },
	    handleClick() {
	      this.clearTimeouts();
	    },
	    handleMouseEnter() {
	      if (!this.group) {
	        return;
	      }
	      this.groupInfoPromise = tasks_v2_provider_service_groupService.groupService.getGroupInfo(this.group.id);
	      this.clearTimeouts();
	      this.showTimeout = setTimeout(() => this.showPopup(), 400);
	    },
	    handleMouseLeave() {
	      main_core.Event.unbind(document, 'mouseover', this.updateHoverElement);
	      main_core.Event.bind(document, 'mouseover', this.updateHoverElement);
	      this.clearTimeouts();
	      this.closeTimeout = setTimeout(() => {
	        var _this$$refs$container;
	        if (!((_this$$refs$container = this.$refs.container) != null && _this$$refs$container.contains(this.hoverElement)) && !this.bindElement.contains(this.hoverElement)) {
	          this.closePopup();
	        }
	      }, 100);
	    },
	    updateHoverElement(event) {
	      this.hoverElement = event.target;
	    },
	    async showPopup() {
	      if (this.groupInfoPromise) {
	        this.groupInfo = await this.groupInfoPromise;
	      }
	      if (!this.group || Object.keys(this.groupInfo).length === 0) {
	        return;
	      }
	      this.clearTimeouts();
	      this.isPopupShown = true;
	      await this.$nextTick();
	      this.$refs.popup.adjustPosition();
	    },
	    closePopup() {
	      this.clearTimeouts();
	      this.isPopupShown = false;
	      main_core.Event.unbind(this.$refs.container, 'mouseleave', this.handleMouseLeave);
	      main_core.Event.unbind(document, 'mouseover', this.updateHoverElement);
	    },
	    clearTimeouts() {
	      clearTimeout(this.closeTimeout);
	      clearTimeout(this.showTimeout);
	    }
	  },
	  template: `
		<Popup v-if="isPopupShown" :options ref="popup" @close="closePopup">
			<div class="tasks-field-group-popup" ref="container">
				<div class="tasks-field-group-popup-header">
					<img class="tasks-field-group-popup-image" :src="encodeURI(group?.image)" :alt="group?.name">
					<div class="tasks-field-group-popup-title-container">
						<div class="tasks-field-group-popup-title" :title="group?.name">{{ group?.name }}</div>
						<div class="tasks-field-group-popup-subtitle">{{ groupMembersCountFormatted }}</div>
					</div>
				</div>
				<div class="tasks-field-group-popup-button">
					<UiButton
						:text="groupAboutFormatted"
						:style="AirButtonStyle.OUTLINE_ACCENT_2"
						:size="ButtonSize.SMALL"
						wide
						@click="openGroup"
					/>
				</div>
				<div class="tasks-field-group-popup-info">
					<div class="tasks-field-group-popup-field">
						<div class="tasks-field-group-popup-field-title">{{ loc('TASKS_V2_GROUP_OWNER') }}</div>
						<div class="tasks-field-group-popup-field-value">
							<a :href="groupOwnerUrl">{{ groupInfo.ownerName }}</a>
						</div>
					</div>
					<div class="tasks-field-group-popup-field">
						<div class="tasks-field-group-popup-field-title">{{ loc('TASKS_V2_GROUP_DATE_CREATE') }}</div>
						<div class="tasks-field-group-popup-field-value">{{ groupInfo.dateCreate }}</div>
					</div>
					<div class="tasks-field-group-popup-field">
						<div class="tasks-field-group-popup-field-title">{{ loc('TASKS_V2_GROUP_SUBJECT') }}</div>
						<div class="tasks-field-group-popup-field-value">{{ groupInfo.subjectTitle }}</div>
					</div>
				</div>
			</div>
		</Popup>
	`
	};

	var _dialog, _taskId, _onClose, _createDialog, _handleGroupSelect, _fillStore, _items, _groupId;
	const groupDialog = new (_dialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("dialog"), _taskId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("taskId"), _onClose = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onClose"), _createDialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createDialog"), _handleGroupSelect = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleGroupSelect"), _fillStore = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("fillStore"), _items = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("items"), _groupId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("groupId"), class {
	  constructor() {
	    Object.defineProperty(this, _groupId, {
	      get: _get_groupId,
	      set: void 0
	    });
	    Object.defineProperty(this, _items, {
	      get: _get_items,
	      set: void 0
	    });
	    Object.defineProperty(this, _createDialog, {
	      value: _createDialog2
	    });
	    Object.defineProperty(this, _dialog, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _taskId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _onClose, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _handleGroupSelect, {
	      writable: true,
	      value: async () => {
	        var _babelHelpers$classPr, _babelHelpers$classPr2, _result$Endpoint$Task;
	        if (!babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].isLoaded()) {
	          return;
	        }
	        const groupId = await babelHelpers.classPrivateFieldLooseBase(this, _fillStore)[_fillStore]();
	        if (babelHelpers.classPrivateFieldLooseBase(this, _groupId)[_groupId] === groupId) {
	          return;
	        }
	        tasks_v2_provider_service_groupService.groupService.setHasScrumInfo(babelHelpers.classPrivateFieldLooseBase(this, _taskId)[_taskId]);
	        (_babelHelpers$classPr = (_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _onClose))[_onClose]) == null ? void 0 : _babelHelpers$classPr.call(_babelHelpers$classPr2, groupId);
	        tasks_v2_provider_service_taskService.taskService.setSilentErrorMode(true);
	        const result = await tasks_v2_provider_service_taskService.taskService.update(babelHelpers.classPrivateFieldLooseBase(this, _taskId)[_taskId], {
	          groupId,
	          stageId: 0
	        });
	        tasks_v2_provider_service_taskService.taskService.setSilentErrorMode(false);
	        if ((_result$Endpoint$Task = result[tasks_v2_const.Endpoint.TaskUpdate]) != null && _result$Endpoint$Task.length) {
	          const error = result[tasks_v2_const.Endpoint.TaskUpdate][0];
	          ui_notificationManager.Notifier.notifyViaBrowserProvider({
	            id: 'task-notify-update-group-error',
	            text: error == null ? void 0 : error.message
	          });
	        }
	      }
	    });
	    Object.defineProperty(this, _fillStore, {
	      writable: true,
	      value: async () => {
	        const item = babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].getSelectedItems()[0];
	        if (!item) {
	          return 0;
	        }
	        const group = {
	          id: item.getId(),
	          name: item.getTitle(),
	          image: item.getAvatar(),
	          type: item.getEntityType()
	        };
	        await tasks_v2_core.Core.getStore().dispatch(`${tasks_v2_const.Model.Groups}/insert`, group);
	        return group.id;
	      }
	    });
	  }
	  show(params) {
	    var _babelHelpers$classPr3, _babelHelpers$classPr4;
	    babelHelpers.classPrivateFieldLooseBase(this, _taskId)[_taskId] = params.taskId;
	    babelHelpers.classPrivateFieldLooseBase(this, _onClose)[_onClose] = params.onClose;
	    (_babelHelpers$classPr4 = (_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _dialog))[_dialog]) != null ? _babelHelpers$classPr4 : _babelHelpers$classPr3[_dialog] = babelHelpers.classPrivateFieldLooseBase(this, _createDialog)[_createDialog]();
	    babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].selectItemsByIds(babelHelpers.classPrivateFieldLooseBase(this, _items)[_items]);
	    babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].showTo(params.targetNode);
	  }
	})();
	function _createDialog2() {
	  return new tasks_v2_lib_entitySelectorDialog.EntitySelectorDialog({
	    context: 'tasks-card',
	    multiple: false,
	    hideOnDeselect: true,
	    enableSearch: true,
	    entities: [{
	      id: tasks_v2_const.EntitySelectorEntity.Project
	    }],
	    preselectedItems: babelHelpers.classPrivateFieldLooseBase(this, _items)[_items],
	    events: {
	      onLoad: babelHelpers.classPrivateFieldLooseBase(this, _fillStore)[_fillStore]
	    },
	    popupOptions: {
	      events: {
	        onClose: babelHelpers.classPrivateFieldLooseBase(this, _handleGroupSelect)[_handleGroupSelect]
	      }
	    }
	  });
	}
	function _get_items() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _groupId)[_groupId] ? [[tasks_v2_const.EntitySelectorEntity.Project, babelHelpers.classPrivateFieldLooseBase(this, _groupId)[_groupId]]] : [];
	}
	function _get_groupId() {
	  return tasks_v2_provider_service_taskService.taskService.getStoreTask(babelHelpers.classPrivateFieldLooseBase(this, _taskId)[_taskId]).groupId;
	}

	// @vue/component
	const Group = {
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    Hint: tasks_v2_component_elements_hint.Hint,
	    HoverPill: tasks_v2_component_elements_hoverPill.HoverPill,
	    FieldAdd: tasks_v2_component_elements_fieldAdd.FieldAdd,
	    GroupPopup
	  },
	  inject: {
	    settings: {},
	    task: {},
	    taskId: {},
	    isEdit: {}
	  },
	  setup() {
	    return {
	      groupMeta,
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  data() {
	    return {
	      isHintShown: false
	    };
	  },
	  computed: {
	    group() {
	      return this.$store.getters[`${tasks_v2_const.Model.Groups}/getById`](this.task.groupId);
	    },
	    groupName() {
	      var _this$group$name, _this$group;
	      return (_this$group$name = (_this$group = this.group) == null ? void 0 : _this$group.name) != null ? _this$group$name : this.loc('TASKS_V2_GROUP_HIDDEN');
	    },
	    groupImage() {
	      var _this$group2;
	      return encodeURI((_this$group2 = this.group) == null ? void 0 : _this$group2.image);
	    },
	    isSecret() {
	      return Boolean(this.task.groupId) && !this.group;
	    },
	    hasFlow() {
	      return this.task.flowId > 0;
	    },
	    readonly() {
	      return !this.task.rights.edit || this.hasFlow;
	    },
	    isLocked() {
	      return !this.settings.restrictions.project.available;
	    },
	    withClear() {
	      var _this$task$flowId;
	      return !this.readonly && ((_this$task$flowId = this.task.flowId) != null ? _this$task$flowId : 0) <= 0;
	    }
	  },
	  methods: {
	    handleClick() {
	      if (!this.isEdit && this.hasFlow) {
	        this.isHintShown = true;
	        return;
	      }
	      if (this.readonly) {
	        if (!this.isSecret) {
	          void this.openGroup();
	        }
	        return;
	      }
	      if (this.isLocked) {
	        this.showLimitDialog();
	      } else {
	        this.showDialog();
	      }
	    },
	    async openGroup() {
	      const href = await tasks_v2_provider_service_groupService.groupService.getUrl(this.group.id, this.group.type);
	      BX.SidePanel.Instance.emulateAnchorClick(href);
	    },
	    showDialog() {
	      groupDialog.show({
	        targetNode: this.$refs.group,
	        taskId: this.taskId
	      });
	    },
	    clear() {
	      void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	        groupId: 0,
	        stageId: 0
	      });
	    },
	    showLimitDialog() {
	      void tasks_v2_lib_showLimit.showLimit({
	        featureId: this.settings.restrictions.project.featureId
	      });
	    }
	  },
	  template: `
		<div
			:data-task-id="taskId"
			:data-task-field-id="groupMeta.id"
			:data-task-field-value="task.groupId"
			ref="group"
		>
			<div class="tasks-field-group-group" :class="{ '--secret': isSecret }" @click="handleClick">
				<HoverPill
					v-if="task.groupId"
					:withClear
					@clear="clear"
				>
					<img v-if="groupImage" class="tasks-field-group-image" :src="groupImage" :alt="groupName"/>
					<BIcon v-else class="tasks-field-group-icon" :name="Outline.FOLDER"/>
					<div class="tasks-field-group-title">{{ groupName }}</div>
				</HoverPill>
				<FieldAdd v-else :icon="Outline.FOLDER_PLUS"/>
			</div>
		</div>
		<Hint v-if="isHintShown" :bindElement="$refs.group" @close="isHintShown = false">
			{{ loc('TASKS_V2_GROUP_CANT_CHANGE_FLOW') }}
		</Hint>
		<GroupPopup :getBindElement="() => $refs.group"/>
	`
	};

	// @vue/component
	const Stage = {
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    BMenu: ui_system_menu_vue.BMenu,
	    BLine: ui_system_skeleton_vue.BLine
	  },
	  inject: {
	    task: {},
	    taskId: {},
	    isEdit: {}
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  data() {
	    return {
	      isMenuShown: false
	    };
	  },
	  computed: {
	    group() {
	      return this.$store.getters[`${tasks_v2_const.Model.Groups}/getById`](this.task.groupId);
	    },
	    groupId() {
	      return this.task.groupId;
	    },
	    stageId() {
	      return this.task.stageId;
	    },
	    stage() {
	      return this.$store.getters[`${tasks_v2_const.Model.Stages}/getById`](this.stageId);
	    },
	    menuOptions() {
	      return () => ({
	        id: 'tasks-field-group-stage-menu',
	        bindElement: this.$refs.stage,
	        offsetTop: 8,
	        maxWidth: 500,
	        items: this.menuItems,
	        maxHeight: window.innerHeight / 2,
	        targetContainer: document.body
	      });
	    },
	    menuItems() {
	      var _this$group$stagesIds;
	      const stages = this.$store.getters[`${tasks_v2_const.Model.Stages}/getByIds`]((_this$group$stagesIds = this.group.stagesIds) != null ? _this$group$stagesIds : []).sort(({
	        sort: a
	      }, {
	        sort: b
	      }) => a - b);
	      return stages == null ? void 0 : stages.map(stage => ({
	        title: stage.title,
	        svg: this.getStageSvg(new tasks_v2_lib_color.Color(stage.color).limit(250).toRgb()),
	        isSelected: stage.id === this.stage.id,
	        onClick: () => this.setStage(stage.id)
	      }));
	    },
	    backgroundColor() {
	      return new tasks_v2_lib_color.Color(this.stage.color).setOpacity(0.1).limit(250).toRgb();
	    },
	    isDarkColor() {
	      return new tasks_v2_lib_color.Color(this.stage.color).isDark();
	    },
	    readonly() {
	      return !this.task.rights.sort;
	    }
	  },
	  watch: {
	    groupId() {
	      void this.loadStagesForCreation();
	    }
	  },
	  created() {
	    void this.loadStagesForCreation();
	  },
	  methods: {
	    getStageSvg(color) {
	      return new ui_iconSet_api_core.Icon({
	        icon: ui_iconSet_api_vue.CRM.STAGE,
	        color
	      }).render();
	    },
	    async handleClick() {
	      if (this.readonly) {
	        return;
	      }
	      if (!this.group.stagesIds || this.group.stagesIds.length === 0) {
	        await tasks_v2_provider_service_groupService.groupService.getStages(this.groupId);
	      }
	      this.isMenuShown = true;
	    },
	    async setStage(stageId) {
	      var _this$group, _this$group2;
	      const scrumManager = new tasks_v2_lib_scrumManager.ScrumManager({
	        taskId: this.task.id,
	        parentId: this.task.parentId,
	        groupId: this.task.groupId
	      });
	      let canMove = true;
	      if (scrumManager.isScrum((_this$group = this.group) == null ? void 0 : _this$group.type)) {
	        var _await$this$$store$ge;
	        const stage = (_await$this$$store$ge = await this.$store.getters[`${tasks_v2_const.Model.Stages}/getById`](stageId)) != null ? _await$this$$store$ge : null;
	        if (stage.systemType === 'FINISH') {
	          canMove = await scrumManager.handleDodDisplay();
	        }
	      }
	      if (!canMove) {
	        return;
	      }
	      await tasks_v2_provider_service_taskService.taskService.setStage(this.taskId, stageId);
	      if (scrumManager.isScrum((_this$group2 = this.group) == null ? void 0 : _this$group2.type)) {
	        void (scrumManager == null ? void 0 : scrumManager.handleParentState());
	      }
	    },
	    async loadStagesForCreation() {
	      if (this.isEdit || this.group.stagesIds) {
	        return;
	      }
	      await tasks_v2_provider_service_groupService.groupService.getStages(this.groupId);
	    }
	  },
	  template: `
		<div
			v-if="stage?.id"
			class="tasks-field-group-stage"
			:class="{ '--dark': isDarkColor, '--readonly': readonly }"
			:style="{
				'--stage-color': '#' + stage.color,
				'--stage-background': backgroundColor,
			}"
			:title="stage?.title"
			:data-task-id="taskId"
			:data-task-field-id="'stageId'"
			:data-task-field-value="stageId"
			:data-task-stage-title="stage?.title"
			ref="stage"
			@click="handleClick"
		>
			<div class="tasks-field-group-stage-text-container print-background-white print-font-weight-normal print-no-padding-left print-font-size-lg">
				<div class="tasks-field-group-stage-text print-font-color-base-1">{{ stage.title }}</div>
			</div>
			<div class="tasks-field-group-stage-arrow print-ignore"/>
			<BIcon v-if="!readonly" :name="Outline.CHEVRON_DOWN_S" class="print-ignore"/>
		</div>
		<div v-else class="tasks-field-group-stage-loader">
			<BLine :width="80" :height="10"/>
		</div>
		<BMenu v-if="isMenuShown" :options="menuOptions()" @close="isMenuShown = false"/>
	`
	};

	var _taskId$1, _dialog$1, _createDialog$1, _handleEpicSelect, _fillStore$1, _items$1;
	const dialogs = {};
	const epicDialog = new (_taskId$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("taskId"), _dialog$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("dialog"), _createDialog$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createDialog"), _handleEpicSelect = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleEpicSelect"), _fillStore$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("fillStore"), _items$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("items"), class {
	  constructor() {
	    Object.defineProperty(this, _items$1, {
	      get: _get_items$1,
	      set: void 0
	    });
	    Object.defineProperty(this, _createDialog$1, {
	      value: _createDialog2$1
	    });
	    Object.defineProperty(this, _dialog$1, {
	      get: _get_dialog,
	      set: void 0
	    });
	    Object.defineProperty(this, _taskId$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _handleEpicSelect, {
	      writable: true,
	      value: async () => {
	        if (!babelHelpers.classPrivateFieldLooseBase(this, _dialog$1)[_dialog$1].isLoaded()) {
	          return;
	        }
	        const epicId = await babelHelpers.classPrivateFieldLooseBase(this, _fillStore$1)[_fillStore$1]();
	        await tasks_v2_provider_service_taskService.taskService.update(babelHelpers.classPrivateFieldLooseBase(this, _taskId$1)[_taskId$1], {
	          epicId
	        });
	      }
	    });
	    Object.defineProperty(this, _fillStore$1, {
	      writable: true,
	      value: async () => {
	        const item = babelHelpers.classPrivateFieldLooseBase(this, _dialog$1)[_dialog$1].getSelectedItems()[0];
	        if (!item) {
	          return 0;
	        }
	        const epic = {
	          id: item.getId(),
	          title: item.getTitle(),
	          color: item.getAvatarOption('bgColor')
	        };
	        await tasks_v2_core.Core.getStore().dispatch(`${tasks_v2_const.Model.Epics}/insert`, epic);
	        return epic.id;
	      }
	    });
	  }
	  show(params) {
	    babelHelpers.classPrivateFieldLooseBase(this, _taskId$1)[_taskId$1] = params.taskId;
	    babelHelpers.classPrivateFieldLooseBase(this, _dialog$1)[_dialog$1].selectItemsByIds(babelHelpers.classPrivateFieldLooseBase(this, _items$1)[_items$1]);
	    babelHelpers.classPrivateFieldLooseBase(this, _dialog$1)[_dialog$1].showTo(params.targetNode);
	  }
	})();
	function _get_dialog() {
	  var _dialogs$groupId;
	  const groupId = tasks_v2_provider_service_taskService.taskService.getStoreTask(babelHelpers.classPrivateFieldLooseBase(this, _taskId$1)[_taskId$1]).groupId;
	  (_dialogs$groupId = dialogs[groupId]) != null ? _dialogs$groupId : dialogs[groupId] = babelHelpers.classPrivateFieldLooseBase(this, _createDialog$1)[_createDialog$1](groupId);
	  return dialogs[groupId];
	}
	function _createDialog2$1(groupId) {
	  return new tasks_v2_lib_entitySelectorDialog.EntitySelectorDialog({
	    context: 'tasks-card',
	    multiple: false,
	    hideOnDeselect: true,
	    enableSearch: true,
	    entities: [{
	      id: tasks_v2_const.EntitySelectorEntity.Epic,
	      options: {
	        groupId
	      },
	      dynamicLoad: true,
	      dynamicSearch: true
	    }],
	    preselectedItems: babelHelpers.classPrivateFieldLooseBase(this, _items$1)[_items$1],
	    events: {
	      onLoad: babelHelpers.classPrivateFieldLooseBase(this, _fillStore$1)[_fillStore$1]
	    },
	    popupOptions: {
	      events: {
	        onClose: babelHelpers.classPrivateFieldLooseBase(this, _handleEpicSelect)[_handleEpicSelect]
	      }
	    }
	  });
	}
	function _get_items$1() {
	  const epicId = tasks_v2_provider_service_taskService.taskService.getStoreTask(babelHelpers.classPrivateFieldLooseBase(this, _taskId$1)[_taskId$1]).epicId;
	  return epicId ? [[tasks_v2_const.EntitySelectorEntity.Epic, epicId]] : [];
	}

	// @vue/component
	const Epic = {
	  components: {
	    TextXs: ui_system_typography_vue.TextXs,
	    BIcon: ui_iconSet_api_vue.BIcon,
	    BLine: ui_system_skeleton_vue.BLine
	  },
	  inject: {
	    task: {},
	    taskId: {}
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  data() {
	    return {
	      hasScrumInfo: tasks_v2_provider_service_groupService.groupService.hasScrumInfo(this.taskId)
	    };
	  },
	  computed: {
	    epic() {
	      return this.$store.getters[`${tasks_v2_const.Model.Epics}/getById`](this.task.epicId);
	    },
	    epicColor() {
	      if (!this.epic) {
	        return '';
	      }
	      return new tasks_v2_lib_color.Color(this.epic.color).toRgb();
	    },
	    backgroundColor() {
	      if (!this.epic) {
	        return '';
	      }
	      return new tasks_v2_lib_color.Color(this.epic.color).setOpacity(0.3).limit(250).toRgb();
	    },
	    isDarkColor() {
	      if (!this.epic) {
	        return false;
	      }
	      return new tasks_v2_lib_color.Color(this.epic.color).isDark();
	    }
	  },
	  async mounted() {
	    await tasks_v2_provider_service_groupService.groupService.getScrumInfo(this.taskId);
	    this.hasScrumInfo = tasks_v2_provider_service_groupService.groupService.hasScrumInfo(this.taskId);
	  },
	  methods: {
	    showDialog() {
	      epicDialog.show({
	        targetNode: this.$el,
	        taskId: this.taskId
	      });
	    }
	  },
	  template: `
		<div
			v-if="hasScrumInfo"
			class="tasks-field-epic print-background-white"
			:class="{ '--dark': isDarkColor, '--filled': epic }"
			:style="{
				'--epic-color': epicColor,
				'--epic-background': backgroundColor,
			}"
			:title="epic?.title"
			@click="showDialog"
		>
			<TextXs className="tasks-field-epic-title">
				{{ epic?.title || loc('TASKS_V2_GROUP_CHOOSE_EPIC') }}
			</TextXs>
			<BIcon :name="Outline.CHEVRON_DOWN_S" class="print-ignore"/>
		</div>
		<div v-else class="tasks-field-epic-loader">
			<BLine :width="80" :height="10"/>
		</div>
	`
	};

	// @vue/component
	const StoryPoints = {
	  components: {
	    TextXs: ui_system_typography_vue.TextXs,
	    BLine: ui_system_skeleton_vue.BLine
	  },
	  inject: {
	    task: {},
	    taskId: {}
	  },
	  setup() {},
	  data() {
	    return {
	      isFocused: false,
	      hasScrumInfo: tasks_v2_provider_service_groupService.groupService.hasScrumInfo(this.taskId)
	    };
	  },
	  computed: {
	    storyPoints() {
	      var _this$task$storyPoint;
	      return (_this$task$storyPoint = this.task.storyPoints) == null ? void 0 : _this$task$storyPoint.trim();
	    }
	  },
	  async mounted() {
	    await tasks_v2_provider_service_groupService.groupService.getScrumInfo(this.taskId);
	    this.hasScrumInfo = tasks_v2_provider_service_groupService.groupService.hasScrumInfo(this.taskId);
	  },
	  methods: {
	    async handleClick() {
	      this.isFocused = true;
	      await this.$nextTick();
	      this.$refs.input.focus();
	    },
	    handleBlur() {
	      this.isFocused = false;
	      void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	        storyPoints: this.$refs.input.value.trim()
	      });
	    }
	  },
	  template: `
		<div v-if="hasScrumInfo" class="tasks-field-story-points" :class="{ '--filled': storyPoints }">
			<input
				v-if="isFocused"
				class="tasks-field-story-points-input"
				:value="storyPoints"
				ref="input"
				@blur="handleBlur"
			/>
			<TextXs
				v-else
				className="tasks-field-story-points-text print-background-white print-font-color-base-1"
				@click="handleClick"
			>
				{{ storyPoints || '-' }}
			</TextXs>
		</div>
		<div v-else class="tasks-field-story-points-loader">
			<BLine :width="30" :height="10"/>
		</div>
	`
	};

	// @vue/component
	const GroupChip = {
	  components: {
	    Chip: ui_system_chip_vue.Chip,
	    Hint: tasks_v2_component_elements_hint.Hint,
	    GroupPopup
	  },
	  inject: {
	    settings: {},
	    analytics: {},
	    cardType: {},
	    task: {},
	    taskId: {}
	  },
	  props: {
	    isAutonomous: {
	      type: Boolean,
	      default: false
	    }
	  },
	  setup() {
	    return {
	      groupMeta
	    };
	  },
	  data() {
	    return {
	      doShowHint: false
	    };
	  },
	  computed: {
	    group() {
	      return this.$store.getters[`${tasks_v2_const.Model.Groups}/getById`](this.task.groupId);
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
	        return this.task.groupId > 0;
	      }
	      return this.task.filledFields[groupMeta.id];
	    },
	    isFilled() {
	      return Boolean(this.isAutonomous && this.group);
	    },
	    isFlowFilled() {
	      return this.task.flowId > 0;
	    },
	    text() {
	      if (this.isFilled) {
	        var _this$group$name, _this$group;
	        return (_this$group$name = (_this$group = this.group) == null ? void 0 : _this$group.name) != null ? _this$group$name : this.loc('TASKS_V2_GROUP_HIDDEN');
	      }
	      return this.loc('TASKS_V2_GROUP_TITLE_CHIP');
	    },
	    icon() {
	      if (this.isFilled) {
	        return null;
	      }
	      return ui_iconSet_api_vue.Outline.FOLDER;
	    },
	    image() {
	      var _this$group2, _this$group3;
	      if (!this.isFilled) {
	        return null;
	      }
	      if (!((_this$group2 = this.group) != null && _this$group2.image)) {
	        return null;
	      }
	      return {
	        src: encodeURI(this.group.image),
	        alt: (_this$group3 = this.group) == null ? void 0 : _this$group3.name
	      };
	    },
	    canChange() {
	      var _this$task$flowId;
	      return ((_this$task$flowId = this.task.flowId) != null ? _this$task$flowId : 0) <= 0;
	    },
	    isLocked() {
	      return !this.settings.restrictions.project.available;
	    }
	  },
	  created() {
	    if (this.task.groupId && !this.group) {
	      void tasks_v2_provider_service_groupService.groupService.getGroup(this.task.groupId);
	    }
	  },
	  methods: {
	    handleClick() {
	      if (!this.isAutonomous && this.isSelected) {
	        this.highlightField();
	        return;
	      }
	      if (this.isLocked) {
	        void tasks_v2_lib_showLimit.showLimit({
	          featureId: this.settings.restrictions.project.featureId
	        });
	        return;
	      }
	      if (this.isFlowFilled) {
	        this.doShowHint = true;
	        return;
	      }
	      groupDialog.show({
	        targetNode: this.$refs.chip.$el,
	        taskId: this.taskId,
	        onClose: this.handleDialogClose
	      });
	    },
	    handleDialogClose(groupId) {
	      if (this.isAutonomous) {
	        var _this$$refs$chip;
	        (_this$$refs$chip = this.$refs.chip) == null ? void 0 : _this$$refs$chip.$el.focus();
	      }
	      if (!this.isAutonomous && this.isSelected) {
	        this.highlightField();
	      }
	      if (groupId) {
	        tasks_v2_lib_analytics.analytics.sendAddProject(this.analytics, {
	          cardType: this.cardType,
	          taskId: main_core.Type.isNumber(this.taskId) ? this.taskId : 0,
	          viewersCount: this.task.auditorsIds.length,
	          coexecutorsCount: this.task.accomplicesIds.length
	        });
	      }
	    },
	    highlightField() {
	      void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(groupMeta.id);
	    },
	    handleClear() {
	      void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	        groupId: 0,
	        stageId: 0
	      });
	    }
	  },
	  template: `
		<Chip
			:design
			:icon
			:image
			:text
			:withClear="isFilled && !isFlowFilled"
			:lock="isLocked"
			:trimmable="isFilled"
			:data-task-id="taskId"
			:data-task-chip-id="groupMeta.id"
			:data-task-chip-value="task.groupId"
			ref="chip"
			@click="handleClick"
			@clear="handleClear"
		/>
		<Hint
			v-if="doShowHint"
			:bindElement="$refs.chip.$el"
			@close="doShowHint = false"
		>
			{{ loc('TASKS_V2_GROUP_CANT_CHANGE_FLOW') }}
		</Hint>
		<GroupPopup v-if="isAutonomous" :getBindElement="() => $refs.chip.$el"/>
	`
	};

	exports.Group = Group;
	exports.Stage = Stage;
	exports.Epic = Epic;
	exports.StoryPoints = StoryPoints;
	exports.GroupChip = GroupChip;
	exports.groupMeta = groupMeta;

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements,BX.UI.Vue3.Components,BX.Vue3.Components,BX.Tasks.V2.Provider.Service,BX.UI.NotificationManager,BX.UI.System.Menu,BX.UI.IconSet,BX,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Tasks.V2,BX.Tasks.V2.Lib,BX.UI.System.Typography.Vue,BX.UI.System.Skeleton.Vue,BX,BX.UI.System.Chip.Vue,BX.UI.IconSet,BX,BX.Tasks.V2.Const,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service));
//# sourceMappingURL=group.bundle.js.map
