/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,ui_system_skeleton_vue,tasks_v2_component_elements_fieldHoverButton,tasks_v2_component_elements_fieldAdd,ui_vue3_components_richLoc,ui_system_typography_vue,tasks_v2_component_elements_hoverPill,main_core,tasks_v2_const,tasks_v2_lib_idUtils,tasks_v2_provider_service_crmService,tasks_v2_provider_service_taskService,tasks_v2_lib_entitySelectorDialog,ui_system_chip_vue,ui_iconSet_api_vue,ui_iconSet_outline,tasks_v2_core,tasks_v2_lib_fieldHighlighter,tasks_v2_lib_showLimit) {
	'use strict';

	// @vue/component
	const CrmItem = {
	  components: {
	    HoverPill: tasks_v2_component_elements_hoverPill.HoverPill,
	    TextMd: ui_system_typography_vue.TextMd,
	    RichLoc: ui_vue3_components_richLoc.RichLoc
	  },
	  inject: {
	    task: {},
	    taskId: {},
	    isEdit: {}
	  },
	  props: {
	    /** @type CrmItemModel */
	    item: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['clear'],
	  setup() {},
	  async mounted() {
	    const {
	      EntityMiniCard
	    } = await main_core.Runtime.loadExtension('crm.mini-card');
	    const card = new EntityMiniCard({
	      bindElement: this.$el,
	      entityTypeId: tasks_v2_provider_service_crmService.CrmMappers.getEntityTypeId(this.item.id),
	      entityId: this.item.entityId
	    });
	    const scrollContainer = document.querySelector(`[data-task-card-scroll="${this.taskId}"]`);
	    card.getMiniCard().popup().setTargetContainer(scrollContainer);
	  },
	  methods: {
	    prepareTitle(item) {
	      return this.loc('TASKS_V2_CRM_ENTITY_TITLE', {
	        '#TYPE_NAME#': item.typeName,
	        '#TITLE#': item.title
	      });
	    },
	    handleClick() {
	      BX.SidePanel.Instance.emulateAnchorClick(this.item.link);
	    }
	  },
	  template: `
		<HoverPill
			class="tasks-field-crm-item"
			:withClear="!isEdit || task.rights.edit"
			textOnly
			@click.stop="handleClick"
			@clear="$emit('clear', item.id)"
		>
			<TextMd class="tasks-field-crm-item-text print-font-color-base-1-recursive">
				<RichLoc tag="span" :text="prepareTitle(item)" placeholder="[a]">
					<template #a="{ text }">
						<a @click.prevent>{{ text }}</a>
					</template>
				</RichLoc>
			</TextMd>
		</HoverPill>
	`
	};

	const crmMeta = Object.freeze({
	  id: tasks_v2_const.TaskField.Crm,
	  title: main_core.Loc.getMessage('TASKS_V2_CRM_TITLE')
	});

	var _taskId, _onClose, _dialog, _createDialog, _fillStore, _fillDialog, _mapItemToModel, _items, _ids;
	const dialogs = {};
	const crmDialog = new (_taskId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("taskId"), _onClose = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onClose"), _dialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("dialog"), _createDialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createDialog"), _fillStore = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("fillStore"), _fillDialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("fillDialog"), _mapItemToModel = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("mapItemToModel"), _items = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("items"), _ids = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("ids"), class {
	  constructor() {
	    Object.defineProperty(this, _ids, {
	      get: _get_ids,
	      set: void 0
	    });
	    Object.defineProperty(this, _items, {
	      get: _get_items,
	      set: void 0
	    });
	    Object.defineProperty(this, _mapItemToModel, {
	      value: _mapItemToModel2
	    });
	    Object.defineProperty(this, _fillDialog, {
	      value: _fillDialog2
	    });
	    Object.defineProperty(this, _createDialog, {
	      value: _createDialog2
	    });
	    Object.defineProperty(this, _dialog, {
	      get: _get_dialog,
	      set: void 0
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
	        const crmItems = babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].getSelectedItems().map(item => babelHelpers.classPrivateFieldLooseBase(this, _mapItemToModel)[_mapItemToModel](item));
	        await tasks_v2_core.Core.getStore().dispatch(`${tasks_v2_const.Model.CrmItems}/upsertMany`, crmItems);
	        return crmItems;
	      }
	    });
	  }
	  fillDialog(taskId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _taskId)[_taskId] = taskId;
	    babelHelpers.classPrivateFieldLooseBase(this, _fillDialog)[_fillDialog](babelHelpers.classPrivateFieldLooseBase(this, _ids)[_ids]);
	  }
	  show(params) {
	    babelHelpers.classPrivateFieldLooseBase(this, _taskId)[_taskId] = params.taskId;
	    babelHelpers.classPrivateFieldLooseBase(this, _onClose)[_onClose] = params.onClose;
	    babelHelpers.classPrivateFieldLooseBase(this, _fillDialog)[_fillDialog](babelHelpers.classPrivateFieldLooseBase(this, _ids)[_ids]);
	    babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].selectItemsByIds(babelHelpers.classPrivateFieldLooseBase(this, _items)[_items]);
	    babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].showTo(params.targetNode);
	  }
	})();
	function _get_dialog() {
	  var _babelHelpers$classPr, _dialogs$_babelHelper;
	  (_dialogs$_babelHelper = dialogs[_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _taskId)[_taskId]]) != null ? _dialogs$_babelHelper : dialogs[_babelHelpers$classPr] = babelHelpers.classPrivateFieldLooseBase(this, _createDialog)[_createDialog]();
	  return dialogs[babelHelpers.classPrivateFieldLooseBase(this, _taskId)[_taskId]];
	}
	function _createDialog2() {
	  const {
	    crmIntegration
	  } = main_core.Extension.getSettings('tasks.v2.component.fields.crm');
	  const settings = tasks_v2_lib_idUtils.idUtils.isTemplate(babelHelpers.classPrivateFieldLooseBase(this, _taskId)[_taskId]) ? crmIntegration == null ? void 0 : crmIntegration.template : crmIntegration == null ? void 0 : crmIntegration.task;
	  const dynamicTypeIds = Object.entries(settings != null ? settings : {}).filter(([entityId, enabled]) => enabled === 'Y' && entityId.startsWith('DYNAMIC_')).map(([entityId]) => Number(entityId.slice(8)));
	  return new tasks_v2_lib_entitySelectorDialog.EntitySelectorDialog({
	    context: 'tasks-card',
	    enableSearch: true,
	    entities: [tasks_v2_const.EntitySelectorEntity.Deal, tasks_v2_const.EntitySelectorEntity.Contact, tasks_v2_const.EntitySelectorEntity.Company, tasks_v2_const.EntitySelectorEntity.Lead, tasks_v2_const.EntitySelectorEntity.SmartInvoice, tasks_v2_const.EntitySelectorEntity.DynamicMultiple].map(entityId => ({
	      id: entityId,
	      dynamicLoad: true,
	      dynamicSearch: true,
	      options: {
	        dynamicTypeIds,
	        showTab: true,
	        allowAllCategories: true
	      },
	      dynamicSearchMatchMode: 'all'
	    })),
	    preselectedItems: babelHelpers.classPrivateFieldLooseBase(this, _items)[_items],
	    events: {
	      onLoad: babelHelpers.classPrivateFieldLooseBase(this, _fillStore)[_fillStore]
	    },
	    popupOptions: {
	      events: {
	        onClose: async () => {
	          var _babelHelpers$classPr2, _babelHelpers$classPr3;
	          if (!babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].isLoaded()) {
	            return;
	          }
	          const items = await babelHelpers.classPrivateFieldLooseBase(this, _fillStore)[_fillStore]();
	          const crmItemIds = items.map(({
	            id
	          }) => id);
	          void tasks_v2_provider_service_taskService.taskService.update(babelHelpers.classPrivateFieldLooseBase(this, _taskId)[_taskId], {
	            crmItemIds
	          });
	          (_babelHelpers$classPr2 = (_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _onClose))[_onClose]) == null ? void 0 : _babelHelpers$classPr2.call(_babelHelpers$classPr3);
	        }
	      }
	    }
	  });
	}
	function _fillDialog2(ids) {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].isLoaded()) {
	    return;
	  }
	  const itemIds = new Set(babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].getItems().map(it => tasks_v2_provider_service_crmService.CrmMappers.mapId(it.getEntityId(), it.getId())));
	  ids.forEach(crmItemId => {
	    const [entityId, id] = tasks_v2_provider_service_crmService.CrmMappers.splitId(crmItemId);
	    if (itemIds.has(crmItemId)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].getItem([entityId, id]).select(true);
	      return;
	    }
	    const crmItem = tasks_v2_core.Core.getStore().getters[`${tasks_v2_const.Model.CrmItems}/getById`](crmItemId);
	    babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].addItem({
	      id,
	      entityId,
	      title: crmItem.title,
	      customData: {
	        entityInfo: {
	          typeNameTitle: crmItem.typeName,
	          url: crmItem.link
	        }
	      },
	      selected: true,
	      tabs: ['recents', entityId, entityId.toUpperCase()]
	    });
	  });
	}
	function _mapItemToModel2(item) {
	  const entityInfo = item.getCustomData().get('entityInfo');
	  const id = item.getId();
	  return {
	    id: tasks_v2_provider_service_crmService.CrmMappers.mapId(item.getEntityId(), item.getId()),
	    entityId: Number.isInteger(id) ? id : Number(id.split(':')[1]),
	    type: item.getEntityId(),
	    typeName: entityInfo.typeNameTitle,
	    title: item.getTitle(),
	    link: entityInfo.url
	  };
	}
	function _get_items() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _ids)[_ids].map(id => tasks_v2_provider_service_crmService.CrmMappers.splitId(id));
	}
	function _get_ids() {
	  var _taskService$getStore;
	  return (_taskService$getStore = tasks_v2_provider_service_taskService.taskService.getStoreTask(babelHelpers.classPrivateFieldLooseBase(this, _taskId)[_taskId]).crmItemIds) != null ? _taskService$getStore : [];
	}

	const maxCount = 7;

	// @vue/component
	const Crm = {
	  components: {
	    FieldHoverButton: tasks_v2_component_elements_fieldHoverButton.FieldHoverButton,
	    TextSm: ui_system_typography_vue.TextSm,
	    BLine: ui_system_skeleton_vue.BLine,
	    FieldAdd: tasks_v2_component_elements_fieldAdd.FieldAdd,
	    CrmItem
	  },
	  inject: {
	    settings: {},
	    task: {},
	    taskId: {},
	    isEdit: {}
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline,
	      crmMeta,
	      maxCount
	    };
	  },
	  data() {
	    return {
	      isDialogShown: false,
	      isExpanded: false,
	      isHovered: false
	    };
	  },
	  computed: {
	    crmItems() {
	      const items = this.$store.getters[`${tasks_v2_const.Model.CrmItems}/getByIds`](this.task.crmItemIds);
	      return items.sort((a, b) => tasks_v2_provider_service_crmService.CrmMappers.compareIds(a.id, b.id));
	    },
	    visibleItems() {
	      return this.crmItems.slice(0, maxCount);
	    },
	    collapsedItems() {
	      return this.crmItems.slice(maxCount);
	    },
	    isLoading() {
	      var _this$crmItems;
	      return !this.isEmpty && !((_this$crmItems = this.crmItems) != null && _this$crmItems.length);
	    },
	    isEmpty() {
	      var _this$task$crmItemIds;
	      return !((_this$task$crmItemIds = this.task.crmItemIds) != null && _this$task$crmItemIds.length);
	    },
	    readonly() {
	      return !this.task.rights.edit;
	    },
	    expandButtonText() {
	      if (this.isExpanded) {
	        return this.loc('TASKS_V2_CRM_COLLAPSE');
	      }
	      return this.loc('TASKS_V2_CRM_AND_COUNT', {
	        '#COUNT#': this.collapsedItems.length
	      });
	    },
	    isAddActive() {
	      return !this.readonly && !this.isEmpty;
	    },
	    isAddVisible() {
	      return this.isDialogShown || this.isHovered;
	    },
	    isLocked() {
	      return !this.settings.restrictions.crmIntegration.available;
	    }
	  },
	  watch: {
	    'task.crmItemIds': {
	      async handler() {
	        if (!this.isEdit) {
	          return;
	        }
	        await tasks_v2_provider_service_crmService.crmService.list(this.taskId, this.task.crmItemIds);
	        crmDialog.fillDialog(this.taskId);
	      }
	    }
	  },
	  mounted() {
	    if (this.isEdit) {
	      void tasks_v2_provider_service_crmService.crmService.list(this.taskId, this.task.crmItemIds);
	    } else {
	      crmDialog.fillDialog(this.taskId);
	    }
	  },
	  methods: {
	    handleClick() {
	      if (!this.readonly) {
	        this.showDialog();
	      }
	    },
	    showDialog() {
	      if (this.isLocked) {
	        void tasks_v2_lib_showLimit.showLimit({
	          featureId: this.settings.restrictions.crmIntegration.featureId
	        });
	        return;
	      }
	      crmDialog.show({
	        targetNode: this.$refs.anchor,
	        taskId: this.taskId,
	        onClose: this.handleClose
	      });
	      this.isDialogShown = true;
	    },
	    handleClose() {
	      this.isDialogShown = false;
	    },
	    handleClear(crmItemId) {
	      const crmItemIds = this.task.crmItemIds.filter(id => id !== crmItemId);
	      void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	        crmItemIds
	      });
	    }
	  },
	  template: `
		<div
			@mouseenter="isHovered = true"
			@mouseleave="isHovered = false"
		>
			<FieldHoverButton
				v-if="isAddActive"
				:icon="Outline.PLUS_L"
				:isVisible="isAddVisible"
				:isLocked
				@click="handleClick"
			/>
			<div
				class="tasks-field-crm"
				:data-task-id="taskId"
				:data-task-field-id="crmMeta.id"
				:data-task-crm-item-ids="task.crmItemIds?.join(',')"
			>
				<FieldAdd
					v-if="isEmpty"
					:icon="Outline.CRM"
					:isLocked
					@click="showDialog"
				/>
				<div v-if="isLoading" class="tasks-field-crm-skeleton">
					<template v-for="key in task.crmItemIds.slice(0, maxCount)" :key>
						<BLine :height="20"/>
					</template>
				</div>
				<template v-for="item in visibleItems" :key="item.id">
					<CrmItem :item @clear="handleClear"/>
				</template>
				<template v-if="isExpanded" v-for="item in collapsedItems" :key="item.id">
					<CrmItem :item @clear="handleClear"/>
				</template>
				<TextSm
					v-if="collapsedItems.length > 0"
					class="tasks-field-crm-expand print-font-color-base-1"
					@click.capture.stop="isExpanded = !isExpanded"
				>
					{{ expandButtonText }}
				</TextSm>
			</div>
			<div class="tasks-field-crm-anchor" ref="anchor"/>
		</div>
	`
	};

	// @vue/component
	const CrmChip = {
	  components: {
	    Chip: ui_system_chip_vue.Chip
	  },
	  inject: {
	    task: {},
	    taskId: {}
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline,
	      crmMeta
	    };
	  },
	  computed: {
	    design() {
	      return this.isSelected ? ui_system_chip_vue.ChipDesign.ShadowAccent : ui_system_chip_vue.ChipDesign.ShadowNoAccent;
	    },
	    isSelected() {
	      return this.task.filledFields[crmMeta.id];
	    },
	    isLocked() {
	      return !tasks_v2_core.Core.getParams().restrictions.crmIntegration.available;
	    }
	  },
	  methods: {
	    handleClick() {
	      if (this.isSelected) {
	        this.highlightField();
	        return;
	      }
	      if (this.isLocked) {
	        void tasks_v2_lib_showLimit.showLimit({
	          featureId: tasks_v2_core.Core.getParams().restrictions.crmIntegration.featureId
	        });
	        return;
	      }
	      crmDialog.show({
	        targetNode: this.$el,
	        taskId: this.taskId,
	        onClose: this.highlightField
	      });
	    },
	    highlightField() {
	      void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(crmMeta.id);
	    }
	  },
	  template: `
		<Chip
			v-if="task.rights.edit || isSelected"
			:design
			:icon="Outline.CRM"
			:lock="isLocked"
			:text="loc('TASKS_V2_CRM_TITLE_CHIP')"
			:data-task-id="taskId"
			:data-task-chip-id="crmMeta.id"
			:data-task-crm-item-ids="task.crmItemIds?.join(',')"
			@click="handleClick"
		/>
	`
	};

	exports.Crm = Crm;
	exports.CrmChip = CrmChip;
	exports.crmMeta = crmMeta;

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX.UI.System.Skeleton.Vue,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements,BX.UI.Vue3.Components,BX.UI.System.Typography.Vue,BX.Tasks.V2.Component.Elements,BX,BX.Tasks.V2.Const,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Lib,BX.UI.System.Chip.Vue,BX.UI.IconSet,BX,BX.Tasks.V2,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib));
//# sourceMappingURL=crm.bundle.js.map
