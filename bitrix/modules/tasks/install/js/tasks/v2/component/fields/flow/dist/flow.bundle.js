/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,main_sidepanel,ui_system_menu_vue,tasks_v2_component_elements_hoverPill,tasks_v2_component_elements_fieldAdd,main_core,tasks_v2_core,tasks_v2_lib_entitySelectorDialog,tasks_v2_provider_service_groupService,ui_system_chip_vue,ui_iconSet_api_vue,ui_iconSet_outline,tasks_v2_const,tasks_v2_lib_fieldHighlighter,tasks_v2_provider_service_flowService,tasks_v2_provider_service_taskService) {
	'use strict';

	const flowMeta = Object.freeze({
	  id: tasks_v2_const.TaskField.Flow,
	  title: main_core.Loc.getMessage('TASKS_V2_FLOW_TITLE')
	});

	var _dialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("dialog");
	var _taskId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("taskId");
	var _onClose = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onClose");
	var _createDialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createDialog");
	var _fillStore = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("fillStore");
	var _items = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("items");
	class FlowDialog {
	  constructor() {
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
	    Object.defineProperty(this, _fillStore, {
	      writable: true,
	      value: async () => {
	        const item = babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].getSelectedItems()[0];
	        if (!item) {
	          return null;
	        }
	        const flow = {
	          id: item.getId(),
	          name: item.getTitle(),
	          groupId: item.getCustomData().get('groupId'),
	          templateId: item.getCustomData().get('templateId')
	        };
	        if (!tasks_v2_core.Core.getStore().getters[`${tasks_v2_const.Model.Groups}/getById`](flow.groupId)) {
	          await tasks_v2_provider_service_groupService.groupService.getGroup(flow.groupId);
	        }
	        await tasks_v2_core.Core.getStore().dispatch(`${tasks_v2_const.Model.Flows}/insert`, flow);
	        return flow;
	      }
	    });
	  }
	  show(params) {
	    var _babelHelpers$classPr, _babelHelpers$classPr2;
	    babelHelpers.classPrivateFieldLooseBase(this, _taskId)[_taskId] = params.taskId;
	    babelHelpers.classPrivateFieldLooseBase(this, _onClose)[_onClose] = params.onClose;
	    (_babelHelpers$classPr2 = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _dialog))[_dialog]) != null ? _babelHelpers$classPr2 : _babelHelpers$classPr[_dialog] = babelHelpers.classPrivateFieldLooseBase(this, _createDialog)[_createDialog]();
	    babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].selectItemsByIds(babelHelpers.classPrivateFieldLooseBase(this, _items)[_items]);
	    babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].showTo(params.targetNode);
	  }
	}
	function _createDialog2() {
	  const dialog = new tasks_v2_lib_entitySelectorDialog.EntitySelectorDialog({
	    context: 'tasks-card',
	    width: 380,
	    height: 370,
	    multiple: false,
	    hideOnDeselect: true,
	    enableSearch: true,
	    entities: [{
	      id: tasks_v2_const.EntitySelectorEntity.Flow,
	      options: {
	        onlyActive: true
	      }
	    }],
	    preselectedItems: babelHelpers.classPrivateFieldLooseBase(this, _items)[_items],
	    events: {
	      onLoad: babelHelpers.classPrivateFieldLooseBase(this, _fillStore)[_fillStore]
	    },
	    popupOptions: {
	      events: {
	        onClose: async () => {
	          var _babelHelpers$classPr3, _babelHelpers$classPr4;
	          const flow = await babelHelpers.classPrivateFieldLooseBase(this, _fillStore)[_fillStore]();
	          if (flow) {
	            const {
	              id: flowId,
	              templateId,
	              groupId
	            } = flow;
	            tasks_v2_provider_service_groupService.groupService.setHasScrumInfo(babelHelpers.classPrivateFieldLooseBase(this, _taskId)[_taskId]);
	            void tasks_v2_provider_service_taskService.taskService.update(babelHelpers.classPrivateFieldLooseBase(this, _taskId)[_taskId], {
	              flowId,
	              templateId,
	              groupId,
	              stageId: 0
	            });
	          }
	          (_babelHelpers$classPr3 = (_babelHelpers$classPr4 = babelHelpers.classPrivateFieldLooseBase(this, _onClose))[_onClose]) == null ? void 0 : _babelHelpers$classPr3.call(_babelHelpers$classPr4);
	        }
	      }
	    }
	  });
	  if (tasks_v2_core.Core.getParams().rights.flow.create) {
	    const isFeatureTriable = main_core.Extension.getSettings('tasks.v2.component.fields.flow').get('isFeatureTriable');
	    void main_core.Runtime.loadExtension('tasks.flow.entity-selector').then(({
	      EmptyStub,
	      Footer
	    }) => {
	      dialog.setFooter(new Footer(dialog, {
	        isFeatureTriable
	      }).render());
	      dialog.getRecentTab().getStub().hide();
	      dialog.getRecentTab().setStub(EmptyStub, {
	        showArrow: false
	      });
	      dialog.getRecentTab().render();
	    });
	  }
	  return dialog;
	}
	function _get_items() {
	  return [[tasks_v2_const.EntitySelectorEntity.Flow, tasks_v2_provider_service_taskService.taskService.getStoreTask(babelHelpers.classPrivateFieldLooseBase(this, _taskId)[_taskId]).flowId]];
	}
	const flowDialog = new FlowDialog();

	// @vue/component
	const Flow = {
	  name: 'TaskFlow',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    BMenu: ui_system_menu_vue.BMenu,
	    HoverPill: tasks_v2_component_elements_hoverPill.HoverPill,
	    FieldAdd: tasks_v2_component_elements_fieldAdd.FieldAdd
	  },
	  inject: {
	    task: {},
	    taskId: {},
	    isEdit: {}
	  },
	  setup() {
	    return {
	      flowMeta,
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  data() {
	    return {
	      isMenuShown: false
	    };
	  },
	  computed: {
	    flow() {
	      return this.$store.getters[`${tasks_v2_const.Model.Flows}/getById`](this.task.flowId);
	    },
	    menuOptions() {
	      return {
	        id: 'tasks-field-flow-menu',
	        bindElement: this.$refs.container,
	        offsetTop: 8,
	        items: [{
	          title: this.loc('TASKS_V2_FLOW_ABOUT'),
	          icon: ui_iconSet_api_vue.Outline.BOTTLENECK,
	          onClick: this.openFlow
	        }, {
	          title: this.loc('TASKS_V2_FLOW_CHANGE'),
	          icon: ui_iconSet_api_vue.Outline.EDIT_L,
	          onClick: this.showDialog
	        }, {
	          design: ui_system_menu_vue.MenuItemDesign.Alert,
	          title: this.loc('TASKS_V2_FLOW_DETACH'),
	          icon: ui_iconSet_api_vue.Outline.CROSS_L,
	          onClick: this.clearField
	        }],
	        targetContainer: document.body
	      };
	    },
	    readonly() {
	      return !this.task.rights.edit;
	    }
	  },
	  methods: {
	    handleClick() {
	      if (this.flow && this.readonly) {
	        this.openFlow();
	        return;
	      }
	      if (this.isEdit && this.flow) {
	        this.isMenuShown = true;
	      } else {
	        this.showDialog();
	      }
	    },
	    openFlow() {
	      const href = tasks_v2_provider_service_flowService.flowService.getUrl(this.flow.id, tasks_v2_core.Core.getParams().currentUser.id);
	      main_sidepanel.SidePanel.Instance.open(href);
	    },
	    clearField() {
	      void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	        flowId: 0,
	        groupId: 0,
	        stageId: 0
	      });
	    },
	    showDialog() {
	      flowDialog.show({
	        targetNode: this.$refs.container,
	        taskId: this.taskId
	      });
	    }
	  },
	  template: `
		<div
			:data-task-id="taskId"
			:data-task-field-id="flowMeta.id"
			:data-task-field-value="task.flowId"
			ref="container"
		>
			<HoverPill
				v-if="flow"
				:withClear="!readonly && !isEdit"
				:active="isMenuShown"
				@click="handleClick"
				@clear="clearField"
			>
				<div class="tasks-field-flow">
					<BIcon :name="Outline.BOTTLENECK"/>
					<div class="tasks-field-flow-title">{{ flow.name }}</div>
				</div>
			</HoverPill>
			<FieldAdd v-else :icon="Outline.BOTTLENECK" @click="handleClick"/>
		</div>
		<BMenu v-if="isMenuShown" :options="menuOptions" @close="isMenuShown = false"/>
	`
	};

	// @vue/component
	const FlowChip = {
	  components: {
	    Chip: ui_system_chip_vue.Chip
	  },
	  inject: {
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
	      Outline: ui_iconSet_api_vue.Outline,
	      flowMeta
	    };
	  },
	  computed: {
	    flow() {
	      return this.$store.getters[`${tasks_v2_const.Model.Flows}/getById`](this.task.flowId);
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
	        return this.task.flowId > 0;
	      }
	      return this.task.filledFields[flowMeta.id];
	    },
	    isFilled() {
	      return this.isAutonomous && this.task.flowId > 0;
	    },
	    text() {
	      if (this.isFilled) {
	        return this.flow.name;
	      }
	      return this.loc('TASKS_V2_FLOW_TITLE_CHIP');
	    }
	  },
	  created() {
	    if (this.task.flowId && !this.flow) {
	      void tasks_v2_provider_service_flowService.flowService.getFlow(this.task.flowId);
	    }
	  },
	  methods: {
	    handleClick() {
	      if (!this.isAutonomous && this.isSelected) {
	        this.highlightField();
	        return;
	      }
	      flowDialog.show({
	        targetNode: this.$el,
	        taskId: this.taskId,
	        onClose: this.highlightField
	      });
	    },
	    highlightField() {
	      void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(flowMeta.id);
	    },
	    handleClear() {
	      void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	        flowId: 0,
	        groupId: 0
	      });
	    }
	  },
	  // TODO: remove title prop when flow popup added
	  template: `
		<Chip
			:design
			:icon="Outline.BOTTLENECK"
			:text
			:withClear="isFilled"
			:trimmable="isFilled"
			:data-task-id="taskId"
			:data-task-chip-id="flowMeta.id"
			:data-task-chip-value="task.flowId"
			@click="handleClick"
			@clear="handleClear"
			:title="flow?.name ?? ''"
		/>
	`
	};

	exports.Flow = Flow;
	exports.FlowChip = FlowChip;
	exports.flowMeta = flowMeta;

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX.SidePanel,BX.UI.System.Menu,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements,BX,BX.Tasks.V2,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX.UI.System.Chip.Vue,BX.UI.IconSet,BX,BX.Tasks.V2.Const,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service));
//# sourceMappingURL=flow.bundle.js.map
