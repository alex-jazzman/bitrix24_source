/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,main_core,ui_vue3_vuex,ui_vue3_components_button,ui_dialogs_messagebox,tasks_v2_component_elements_hint,tasks_v2_const,tasks_v2_lib_fieldHighlighter,tasks_v2_provider_service_fileService,tasks_v2_component_fields_userFields) {
	'use strict';

	// @vue/component
	const AddTaskButton = {
	  name: 'AddTaskButton',
	  components: {
	    UiButton: ui_vue3_components_button.Button,
	    Hint: tasks_v2_component_elements_hint.Hint
	  },
	  inject: {
	    task: {},
	    taskId: {},
	    isTemplate: {}
	  },
	  props: {
	    size: {
	      type: String,
	      default: ui_vue3_components_button.ButtonSize.LARGE
	    },
	    hasError: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['addTask', 'copyTask', 'fromTemplate', 'update:hasError'],
	  setup() {},
	  data() {
	    return {
	      fieldContainer: null,
	      isPopupShown: false,
	      isLoading: false,
	      errorReason: null
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      taskUserFieldScheme: `${tasks_v2_const.Model.Interface}/taskUserFieldScheme`,
	      templateUserFieldScheme: `${tasks_v2_const.Model.Interface}/templateUserFieldScheme`
	    }),
	    isUploading() {
	      return tasks_v2_provider_service_fileService.fileService.get(this.taskId).isUploading();
	    },
	    isCheckListUploading() {
	      var _this$task$checklist;
	      return (_this$task$checklist = this.task.checklist) == null ? void 0 : _this$task$checklist.some(itemId => {
	        return tasks_v2_provider_service_fileService.fileService.get(itemId, tasks_v2_provider_service_fileService.EntityTypes.CheckListItem).isUploading();
	      });
	    },
	    userFieldScheme() {
	      return this.isTemplate ? this.templateUserFieldScheme : this.taskUserFieldScheme;
	    },
	    hasUnfilledMandatoryUserFields() {
	      return tasks_v2_component_fields_userFields.userFieldsManager.hasUnfilledMandatoryFields(this.task.userFields, this.userFieldScheme);
	    },
	    isDisabled() {
	      return this.task.title.trim() === '' || this.isUploading || this.isCheckListUploading || this.hasUnfilledMandatoryUserFields || this.isLoading;
	    }
	  },
	  watch: {
	    hasError(value) {
	      if (value === true) {
	        this.isLoading = false;
	      }
	    }
	  },
	  methods: {
	    async handleClick() {
	      if (this.isDisabled) {
	        this.handleDisabledClick();
	        return;
	      }
	      this.isLoading = true;
	      this.$emit('update:hasError', false);
	      if (this.task.copiedFromId) {
	        const result = await this.handleCopyTask();
	        if (!result) {
	          this.isLoading = false;
	        }
	        return;
	      }
	      if (this.task.templateId) {
	        const result = await this.handleCreateTaskFromTemplate();
	        if (!result) {
	          this.isLoading = false;
	        }
	        return;
	      }
	      this.$emit('addTask');
	    },
	    async handleCopyTask() {
	      let withSubTasks = false;
	      if (this.task.containsSubTasks) {
	        const captions = {
	          title: this.loc('TASKS_V2_COPY_POPUP_TITLE'),
	          message: this.loc('TASKS_V2_COPY_POPUP_MESSAGE'),
	          yesCaption: this.loc('TASKS_V2_COPY_POPUP_YES'),
	          noCaption: this.loc('TASKS_V2_COPY_POPUP_NO')
	        };
	        withSubTasks = await this.askPopup(captions);
	        if (main_core.Type.isNull(withSubTasks)) {
	          return false;
	        }
	      }
	      this.$emit('copyTask', {
	        withSubTasks
	      });
	      return true;
	    },
	    async handleCreateTaskFromTemplate() {
	      let withSubTasks = false;
	      if (this.task.containsSubTasks) {
	        const captions = {
	          title: this.loc('TASKS_V2_CREATE_SUBTASKS_POPUP_TITLE'),
	          message: this.loc('TASKS_V2_CREATE_SUBTASKS_POPUP_MESSAGE'),
	          yesCaption: this.loc('TASKS_V2_CREATE_SUBTASKS_POPUP_YES'),
	          noCaption: this.loc('TASKS_V2_CREATE_SUBTASKS_POPUP_NO')
	        };
	        withSubTasks = await this.askPopup(captions);
	        if (main_core.Type.isNull(withSubTasks)) {
	          return false;
	        }
	      }
	      this.$emit('fromTemplate', {
	        withSubTasks
	      });
	      return true;
	    },
	    handleDisabledClick() {
	      if (this.task.title.trim() === '') {
	        setTimeout(() => this.highlightTitle());
	      } else if (this.isUploading) {
	        setTimeout(() => this.highlightFiles());
	      } else if (this.isCheckListUploading) {
	        setTimeout(() => this.highlightChecklist());
	      } else if (this.hasUnfilledMandatoryUserFields) {
	        setTimeout(() => this.highlightUserFields());
	      }
	    },
	    highlightTitle() {
	      this.errorReason = this.loc(this.isTemplate ? 'TASKS_V2_TEMPLATE_TITLE_IS_EMPTY' : 'TASKS_V2_TITLE_IS_EMPTY');
	      this.fieldContainer = tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).addHighlight(tasks_v2_const.TaskField.Title).getFieldContainer(tasks_v2_const.TaskField.Title);
	      this.fieldContainer.querySelector('textarea').focus();
	      this.showPopup();
	    },
	    highlightFiles() {
	      this.errorReason = this.loc('TASKS_V2_FILE_IS_UPLOADING');
	      this.fieldContainer = tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).addChipHighlight(tasks_v2_const.TaskField.Files).getChipContainer(tasks_v2_const.TaskField.Files);
	      this.showPopup();
	    },
	    highlightChecklist() {
	      this.errorReason = this.loc('TASKS_V2_FILE_IS_UPLOADING');
	      this.fieldContainer = tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).addChipHighlight(tasks_v2_const.TaskField.CheckList).getChipContainer(tasks_v2_const.TaskField.CheckList);
	      this.showPopup();
	    },
	    highlightUserFields() {
	      this.errorReason = this.loc('TASKS_V2_NOT_FILLED_MANDATORY_USER_FIELDS');
	      this.fieldContainer = tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).addHighlight(tasks_v2_const.TaskField.UserFields).scrollToField(tasks_v2_const.TaskField.UserFields).getFieldContainer(tasks_v2_const.TaskField.UserFields);
	      this.showPopup();
	    },
	    showPopup() {
	      const removeHighlight = () => {
	        this.isPopupShown = false;
	        main_core.Event.unbind(window, 'keydown', removeHighlight);
	      };
	      main_core.Event.bind(window, 'keydown', removeHighlight);
	      this.isPopupShown = true;
	    },
	    askPopup(captions) {
	      return new Promise(resolve => {
	        let result = null;
	        ui_dialogs_messagebox.MessageBox.show({
	          ...captions,
	          useAirDesign: true,
	          buttons: ui_dialogs_messagebox.MessageBoxButtons.YES_NO,
	          onYes: box => {
	            result = true;
	            box.close();
	          },
	          onNo: box => {
	            result = false;
	            box.close();
	          },
	          popupOptions: {
	            events: {
	              onClose: () => {
	                resolve(result);
	              }
	            }
	          }
	        });
	      });
	    }
	  },
	  template: `
		<div
			class="tasks-add-task-button-container"
			:data-task-id="taskId"
			data-task-button-id="create"
			@click="handleClick"
		>
			<UiButton
				class="tasks-add-task-button"
				:text="loc('TASKS_V2_ADD_TASK')"
				:size
				:loading="isLoading && !hasError"
			/>
		</div>
		<Hint
			v-if="isPopupShown"
			:bindElement="fieldContainer"
			@close="isPopupShown = false"
		>
			{{ errorReason }}
		</Hint>
	`
	};

	exports.AddTaskButton = AddTaskButton;

}((this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {}),BX,BX.Vue3.Vuex,BX.Vue3.Components,BX.UI.Dialogs,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Const,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Component.Fields));
//# sourceMappingURL=add-task-button.bundle.js.map
