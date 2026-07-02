/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,ui_vue3_vuex,ui_vue3_directives_hint,ui_system_typography_vue,ui_iconSet_api_vue,ui_system_menu_vue,ui_iconSet_actions,tasks_v2_core,tasks_v2_const,tasks_v2_component_taskList,tasks_v2_component_elements_hint,tasks_v2_lib_idUtils,tasks_v2_provider_service_taskService,ui_system_chip_vue,tasks_v2_lib_showLimit,tasks_v2_lib_fieldHighlighter) {
	'use strict';

	// @vue/component
	const RelationTasks = {
	  name: 'TaskRelationTasks',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    TaskList: tasks_v2_component_taskList.TaskList,
	    TextMd: ui_system_typography_vue.TextMd,
	    BMenu: ui_system_menu_vue.BMenu
	  },
	  directives: {
	    hint: ui_vue3_directives_hint.hint
	  },
	  inject: {
	    task: {},
	    taskId: {},
	    isEdit: {},
	    isTemplate: {},
	    settings: {}
	  },
	  props: {
	    /** @type RelationFieldMeta */
	    meta: {
	      type: Object,
	      required: true
	    },
	    fields: {
	      type: Set,
	      default: undefined
	    },
	    isLocked: {
	      type: Boolean,
	      default: false
	    },
	    featureId: {
	      type: String,
	      default: ''
	    },
	    shouldShowSubTasksOption: {
	      type: Boolean,
	      default: true
	    },
	    shouldShowCompletedOption: {
	      type: Boolean,
	      default: true
	    }
	  },
	  emits: ['add'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  data() {
	    return {
	      idsLoaded: false,
	      isMenuShown: false,
	      showCompleted: true,
	      showSubTasks: false
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      taskListOptions: `${tasks_v2_const.Model.Interface}/taskListOptions`
	    }),
	    ids() {
	      return this.meta.service.getSortedIds(this.taskId, this.task[this.meta.idsField], this.showCompleted, this.isTemplateEntities);
	    },
	    loadingIds() {
	      return this.ids.filter(id => !this.meta.service.hasStoreTask(id));
	    },
	    text() {
	      if (this.ids.length > 0) {
	        return this.loc(this.meta.getCountLoc(this.isTemplate), {
	          '#COUNT#': this.ids.length
	        });
	      }
	      return this.meta.getTitle(this.isTemplate);
	    },
	    canOpenMore() {
	      return this.isEdit && (this.readonly || this.task[this.meta.containsField]);
	    },
	    readonly() {
	      return !this.task.rights[this.meta.right];
	    },
	    tooltip() {
	      return () => tasks_v2_component_elements_hint.tooltip({
	        text: this.meta.getHint(this.isTemplate),
	        popupOptions: {
	          offsetLeft: this.$refs.add.offsetWidth / 2
	        }
	      });
	    },
	    tasksKey() {
	      return this.ids.reduce((key, id) => {
	        var _taskService$getStore;
	        const task = (_taskService$getStore = tasks_v2_provider_service_taskService.taskService.getStoreTask(id)) != null ? _taskService$getStore : {};
	        return `${key},${task.id}-${String(task.activityTs)}`;
	      }, '');
	    },
	    isTemplateEntities() {
	      return this.meta.id === tasks_v2_const.TaskField.SubTasks && this.isTemplate;
	    },
	    useOptions() {
	      return this.shouldShowCompletedOption || this.shouldShowSubTasksOption;
	    },
	    menuItems() {
	      return [!this.isTemplateEntities && this.shouldShowCompletedOption && {
	        id: 'showCompleted',
	        title: this.loc('TASKS_V2_RELATION_TASKS_MENU_SHOW_COMPLETED'),
	        isSelected: Boolean(this.taskListOptions[this.meta.showCompletedField]),
	        onClick: this.handleShowCompletedOptionClick
	      }, !this.isTemplateEntities && this.shouldShowSubTasksOption && {
	        id: 'showSubTasks',
	        title: this.loc('TASKS_V2_RELATION_TASKS_MENU_SHOW_WITH_SUBTASKS'),
	        isSelected: Boolean(this.taskListOptions.showSubTasks),
	        onClick: this.handleShowSubtasksOptionClick
	      }, this.isTemplateEntities && this.shouldShowSubTasksOption && {
	        id: 'showSubTemplates',
	        title: this.loc('TASKS_V2_RELATION_TASKS_MENU_SHOW_WITH_SUBTEMPLATES'),
	        isSelected: Boolean(this.taskListOptions.showSubTemplates),
	        onClick: this.handleShowSubtemplatesOptionClick
	      }].filter(Boolean);
	    },
	    menuOptions() {
	      return {
	        id: `tasks-relation-tasks-menu-${String(this.meta.id)}-${String(this.taskId)}`,
	        bindElement: this.$refs.settings,
	        items: this.menuItems,
	        targetContainer: document.body,
	        minWidth: 240,
	        offsetLeft: -100,
	        closeByEsc: true,
	        autoHide: true
	      };
	    }
	  },
	  watch: {
	    tasksKey() {
	      if (this.meta.service.hasUnloadedIds(this.taskId, this.isTemplateEntities)) {
	        void this.meta.service.list(this.taskId);
	      }
	    },
	    taskListOptions(newValue, oldValue) {
	      const field = this.meta.showCompletedField;
	      if (newValue[field] !== oldValue[field]) {
	        this.handleShowCompletedChange(newValue[field]);
	      }
	      if (newValue.showSubTasks !== oldValue.showSubTasks) {
	        this.handleShowSubTasksChange(newValue.showSubTasks);
	      }
	      if (newValue.showSubTemplates !== oldValue.showSubTemplates) {
	        this.handleShowSubTasksChange(newValue.showSubTemplates);
	      }
	    }
	  },
	  async created() {
	    this.idsLoaded = this.meta.service.areIdsLoaded(this.taskId);
	    if (!this.idsLoaded || this.meta.service.hasUnloadedIds(this.taskId, this.isTemplateEntities)) {
	      await this.meta.service.list(this.taskId, true);
	    }
	    this.idsLoaded = true;
	    if (this.shouldShowCompletedOption) {
	      this.showCompleted = this.taskListOptions[this.meta.showCompletedField];
	    }
	    if (this.shouldShowSubTasksOption) {
	      this.showSubTasks = this.isTemplate ? this.taskListOptions.showSubTemplates : this.taskListOptions.showSubTasks;
	    }
	  },
	  methods: {
	    openMore() {
	      if (!this.canOpenMore) {
	        return;
	      }
	      if (this.isLocked) {
	        this.showLimit();
	        return;
	      }
	      const userId = tasks_v2_core.Core.getParams().currentUser.id;
	      const tasksGridType = {
	        [this.meta.id === tasks_v2_const.TaskField.SubTasks]: 'subTasks',
	        [this.meta.id === tasks_v2_const.TaskField.RelatedTasks]: 'relatedTasks',
	        [this.meta.id === tasks_v2_const.TaskField.RelatedTasks && this.isTemplate]: 'relatedTemplateTasks',
	        [this.meta.id === tasks_v2_const.TaskField.Gantt]: 'gantt'
	      }.true;
	      const templateGridType = {
	        [this.meta.id === tasks_v2_const.TaskField.SubTasks && this.isTemplate]: 'subTemplates'
	      }.true;
	      const gridPath = {
	        [Boolean(tasksGridType)]: this.settings.paths.userListTaskPathTemplate.replace('#user_id#', userId),
	        [Boolean(templateGridType)]: this.settings.paths.userTemplateListPathTemplate.replace('#user_id#', userId)
	      }.true;
	      const relationType = tasksGridType != null ? tasksGridType : templateGridType;
	      const relationToId = tasks_v2_lib_idUtils.idUtils.unbox(this.taskId);
	      const urlParams = new URLSearchParams({
	        relationToId,
	        relationType
	      });
	      BX.SidePanel.Instance.open(`${gridPath}?${urlParams}`, {
	        newWindowLabel: false,
	        copyLinkLabel: false
	      });
	    },
	    showLimit() {
	      void tasks_v2_lib_showLimit.showLimit({
	        featureId: this.featureId
	      });
	    },
	    async handleRemove(id) {
	      await this.meta.service.delete(this.taskId, [id]);
	    },
	    handleShowCompletedOptionClick() {
	      this.meta.service.saveTaskListOptions({
	        ...this.taskListOptions,
	        [this.meta.showCompletedField]: !this.taskListOptions[this.meta.showCompletedField]
	      });
	    },
	    handleShowSubtasksOptionClick() {
	      this.meta.service.saveTaskListOptions({
	        ...this.taskListOptions,
	        showSubTasks: !this.taskListOptions.showSubTasks
	      });
	    },
	    handleShowSubtemplatesOptionClick() {
	      this.meta.service.saveTaskListOptions({
	        ...this.taskListOptions,
	        showSubTemplates: !this.taskListOptions.showSubTemplates
	      });
	    },
	    handleShowCompletedChange(newValue) {
	      if (!this.shouldShowCompletedOption || this.isTemplateEntities) {
	        return;
	      }
	      this.showCompleted = newValue;
	      if (newValue && this.meta.service.hasUnloadedIds(this.taskId, this.isTemplateEntities)) {
	        void this.meta.service.list(this.taskId);
	      }
	    },
	    handleShowSubTasksChange(newValue) {
	      if (!newValue || this.showSubTasks || !this.shouldShowSubTasksOption) {
	        return;
	      }
	      this.showSubTasks = newValue;
	      void this.meta.service.getSubTaskIds(this.taskId, this.ids);
	    }
	  },
	  template: `
		<div
			class="tasks-field-relation-tasks"
			:data-task-id="taskId"
			:data-task-field-id="meta.id"
		>
			<div class="tasks-field-relation-tasks-title">
				<div
					class="tasks-field-relation-tasks-main"
					:class="{ '--readonly': !canOpenMore }"
					data-task-relation-open
					@click="openMore"
				>
					<BIcon :name="meta.icon"/>
					<TextMd accent>{{ text }}</TextMd>
				</div>
				<div class="tasks-field-results-title-actions">
					<div
						v-if="useOptions && idsLoaded"
						class="tasks-field-relation-tasks-icon print-ignore"
						ref="settings"
					>
						<BIcon 
							:name="Outline.MORE_L"
							hoverable
							:data-task-relation-settings="meta.id"
							@click="isMenuShown = true"
						/>
					</div>
					<div
						v-if="!readonly && idsLoaded && !isLocked"
						v-hint="tooltip"
						class="tasks-field-relation-tasks-icon print-ignore"
						ref="add"
					>
						<BIcon
							:name="Outline.PLUS_L"
							hoverable
							:data-task-relation-add="meta.id"
							@click="$emit('add', $refs.add)"
						/>
					</div>
					<div
						v-else-if="isLocked"
						class="tasks-field-relation-tasks-icon --lock"
					>
						<BIcon
							:name="Outline.LOCK_L"
							hoverable
							:data-task-relation-locked="meta.id"
							@click="showLimit"
						/>
					</div>
				</div>
			</div>
			<BMenu v-if="isMenuShown" :options="menuOptions" @close="isMenuShown = false"/>
			<TaskList
				v-if="task[meta.containsField]"
				:ids
				:loadingIds
				:fields
				:canOpenMore
				:shouldShowSubTasksOption
				:idsLoaded
				:isTemplateEntities
				@openMore="openMore"
				@removeTask="handleRemove"
			/>
		</div>
	`
	};

	// @vue/component
	const RelationTasksChip = {
	  components: {
	    Chip: ui_system_chip_vue.Chip
	  },
	  inject: {
	    task: {},
	    taskId: {},
	    isTemplate: {}
	  },
	  props: {
	    /** @type RelationFieldMeta */
	    meta: {
	      type: Object,
	      required: true
	    },
	    disabled: {
	      type: Boolean,
	      default: false
	    },
	    isLocked: {
	      type: Boolean,
	      default: false
	    },
	    featureId: {
	      type: String,
	      default: ''
	    }
	  },
	  emits: ['add'],
	  setup() {},
	  computed: {
	    count() {
	      return this.task[this.meta.idsField].length;
	    },
	    design() {
	      if (this.disabled) {
	        return ui_system_chip_vue.ChipDesign.ShadowDisabled;
	      }
	      return this.isSelected ? ui_system_chip_vue.ChipDesign.ShadowAccent : ui_system_chip_vue.ChipDesign.ShadowNoAccent;
	    },
	    isSelected() {
	      return this.task.filledFields[this.meta.id];
	    }
	  },
	  methods: {
	    handleClick() {
	      if (this.disabled) {
	        return;
	      }
	      if (this.isSelected) {
	        this.highlightField();
	        return;
	      }
	      if (this.isLocked) {
	        void tasks_v2_lib_showLimit.showLimit({
	          featureId: this.featureId
	        });
	        return;
	      }
	      this.$emit('add', this.$el);
	    },
	    highlightField() {
	      void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(this.meta.id);
	    }
	  },
	  template: `
		<Chip
			:design
			:text="meta.getChipTitle(isTemplate)"
			:icon="meta.icon"
			:lock="isLocked"
			:data-task-id="taskId"
			:data-task-chip-id="meta.id"
			@click="handleClick"
		/>
	`
	};

	exports.RelationTasks = RelationTasks;
	exports.RelationTasksChip = RelationTasksChip;

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX.Vue3.Vuex,BX.Vue3.Directives,BX.UI.System.Typography.Vue,BX.UI.IconSet,BX.UI.System.Menu,BX,BX.Tasks.V2,BX.Tasks.V2.Const,BX.Tasks.V2.Component,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX.UI.System.Chip.Vue,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib));
//# sourceMappingURL=relation-tasks.bundle.js.map
