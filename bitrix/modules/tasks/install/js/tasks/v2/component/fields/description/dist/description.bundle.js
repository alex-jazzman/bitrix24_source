/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,ui_vue3_components_button,main_core_events,ui_dialogs_messagebox,tasks_v2_const,ui_iconSet_api_vue,ui_iconSet_outline,tasks_v2_component_elements_userFieldWidgetComponent,tasks_v2_component_elements_bottomSheet,tasks_v2_component_dropZone,main_core,ui_textEditor,tasks_v2_core,tasks_v2_provider_service_taskService,tasks_v2_provider_service_fileService,tasks_v2_component_entityText) {
	'use strict';

	const emitAddCheckListDebounced = main_core.Runtime.debounce((component, checklistString) => {
	  component.$emit('addCheckList', checklistString);
	}, 500);

	// @vue/component
	const DescriptionCheckListMixin = {
	  data() {
	    return {
	      isAiCommandProcessing: false
	    };
	  },
	  computed: {
	    checkLists() {
	      return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getByIds`](this.task.checklist);
	    }
	  },
	  mounted() {
	    this.entityTextEditor.subscribe('addCheckList', this.handleAddCheckList);
	  },
	  unmounted() {
	    this.entityTextEditor.unsubscribe('addCheckList', this.handleAddCheckList);
	  },
	  methods: {
	    handleAddCheckList(baseEvent) {
	      this.handleCloseWithCheckList(baseEvent.getData());
	    },
	    async handleCheckListButtonClick() {
	      if (this.isAiCommandProcessing) {
	        return;
	      }
	      this.isAiCommandProcessing = true;
	      const {
	        CommandExecutor
	      } = await main_core.Runtime.loadExtension('ai.command-executor');
	      const aiCommandExecutor = new CommandExecutor({
	        moduleId: 'tasks',
	        contextId: 'tasks_field_checklist'
	      });
	      const editorText = this.editor.getText() || 'empty';
	      const checklistString = await aiCommandExecutor.makeChecklistFromText(editorText);
	      this.isAiCommandProcessing = false;
	      this.handleCloseWithCheckList(checklistString);
	    },
	    handleCloseWithCheckList(checklistString) {
	      emitAddCheckListDebounced(this, checklistString);
	    }
	  }
	};

	// @vue/component
	const CheckList = {
	  name: 'TaskDescriptionCheckList',
	  components: {
	    ActionButton: tasks_v2_component_entityText.ActionButton,
	    Outline: ui_iconSet_api_vue.Outline
	  },
	  props: {
	    loading: {
	      type: Boolean,
	      default: false
	    }
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  computed: {
	    buttonColor() {
	      return 'var(--ui-color-copilot-primary)';
	    },
	    iconName() {
	      return this.loading ? ui_iconSet_api_vue.Outline.AI_STARS : ui_iconSet_api_vue.Outline.LIST_AI;
	    },
	    title() {
	      return this.loc('TASKS_V2_DESCRIPTION_ACTION_CHECK_LIST_HINT_MSGVER_1', {
	        '#COPILOT_NAME#': tasks_v2_core.Core.getParams().copilotName
	      });
	    },
	    copilotText() {
	      return this.loading ? this.loc('TASKS_V2_DESCRIPTION_ACTION_CHECK_LIST_CREATING') : this.loc('TASKS_V2_DESCRIPTION_ACTION_CHECK_LIST_TITLE');
	    }
	  },
	  template: `
		<ActionButton
			:iconColor="buttonColor"
			:iconSize="loading ? 20 : null"
			:iconName
			:title
			:copilotText
		/>
	`
	};

	// @vue/component
	const DescriptionEditor = {
	  name: 'TaskDescriptionContent',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    UiButton: ui_vue3_components_button.Button,
	    CheckList,
	    CopilotButton: tasks_v2_component_entityText.CopilotButton,
	    AttachButton: tasks_v2_component_entityText.AttachButton,
	    MentionButton: tasks_v2_component_entityText.MentionButton,
	    MoreButton: tasks_v2_component_entityText.MoreButton,
	    NumberListButton: tasks_v2_component_entityText.NumberListButton,
	    BulletListButton: tasks_v2_component_entityText.BulletListButton
	  },
	  mixins: [DescriptionCheckListMixin],
	  inject: {
	    task: {}
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    },
	    enableSaveButton: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['close', 'show', 'addCheckList'],
	  setup(props) {
	    return {
	      ButtonSize: ui_vue3_components_button.ButtonSize,
	      ButtonColor: ui_vue3_components_button.ButtonColor,
	      Outline: ui_iconSet_api_vue.Outline,
	      fileService: tasks_v2_provider_service_fileService.fileService.get(props.taskId),
	      entityTextEditor: tasks_v2_component_entityText.entityTextEditor.get(props.taskId)
	    };
	  },
	  computed: {
	    readonly() {
	      return !this.task.rights.edit;
	    },
	    editor() {
	      return this.entityTextEditor.getEditor();
	    },
	    isDiskModuleInstalled() {
	      return tasks_v2_core.Core.getParams().features.disk;
	    },
	    isCopilotEnabled() {
	      return tasks_v2_core.Core.getParams().features.isCopilotEnabled;
	    }
	  },
	  mounted() {
	    this.$emit('show');
	    if (!main_core.Type.isStringFilled(this.task.description) || this.taskId === 0) {
	      setTimeout(this.focusToEnd, 500);
	    }
	  },
	  methods: {
	    focusToEnd() {
	      this.editor.focus(null, {
	        defaultSelection: 'rootEnd'
	      });
	    },
	    handleClose() {
	      this.$emit('close');
	    }
	  },
	  template: `
		<div class="tasks-card-description-wrapper" ref="wrapper">
			<div class="tasks-card-description-header" ref="descriptionHeader">
				<div class="tasks-card-description-title">
					{{ loc('TASKS_V2_CHANGE_DESCRIPTION') }}
				</div>
				<BIcon
					:name="Outline.CROSS_L"
					hoverable
					class="tasks-card-description-field-icon"
					@click="handleClose"
				/>
			</div>
			<div class="tasks-card-description-editor-wrapper" id="descriptionTextAreaDestination"/>
			<div v-if="!readonly" class="tasks-card-description-editor-footer" ref="descriptionActions">
				<div class="tasks-card-description-action-list">
					<AttachButton v-if="isDiskModuleInstalled" :fileService/>
					<MentionButton :editor/>
					<BulletListButton :editor/>
					<NumberListButton :editor/>
					<MoreButton :editor/>
					<CopilotButton v-if="isCopilotEnabled" :editor/>
					<CheckList
						v-if="isCopilotEnabled"
						:loading="isAiCommandProcessing"
						@click="handleCheckListButtonClick"
					/>
				</div>
				<div class="tasks-card-description-footer-buttons">
					<UiButton
						:text="loc('TASKS_V2_DESCRIPTION_BUTTON_SAVE')"
						:size="ButtonSize.MEDIUM"
						:color="ButtonColor.PRIMARY"
						:disabled="!enableSaveButton"
						@click="handleClose"
					/>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const MiniFormButton = {
	  name: 'TaskDescriptionMiniFormButton',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  props: {
	    filesCount: {
	      type: Number,
	      required: true
	    }
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  template: `
		<div class="tasks-card-change-description-mini-btn print-ignore">
			<div class="tasks-full-card-field-container --small-vertical-padding">
				<div class="tasks-card-change-description" :class="{ '--no-hover': filesCount }">
					<template v-if="filesCount">
						<BIcon
							:name="Outline.ATTACH"
							:size="20"
							class="tasks-card-description-field-icon-link"
						/>
						<div class="tasks-card-change-description-mini-text-files">
							{{ loc('TASKS_V2_DESCRIPTION_FILES_COUNT', { '#COUNT#': String(filesCount) }) }}
						</div>
					</template>
					<template v-else>
						<div class="tasks-card-change-description-mini-text">
							{{ loc('TASKS_V2_CHANGE_DESCRIPTION') }}
						</div>
						<BIcon
							:name="Outline.CREATE_CHAT"
							:size="20"
							hoverable
							class="tasks-card-description-field-icon"
						/>
					</template>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const FullDescription = {
	  name: 'TaskFullDescription',
	  components: {
	    ActionButton: tasks_v2_component_entityText.ActionButton
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  template: `
		<ActionButton
			:iconName="Outline.GO_TO_L"
			:title="loc('TASKS_V2_DESCRIPTION_BUTTON_EXPAND')"
		/>
	`
	};

	// @vue/component
	const MiniForm = {
	  name: 'TaskDescriptionMiniForm',
	  components: {
	    CheckList,
	    CopilotButton: tasks_v2_component_entityText.CopilotButton,
	    AttachButton: tasks_v2_component_entityText.AttachButton,
	    MentionButton: tasks_v2_component_entityText.MentionButton,
	    MoreButton: tasks_v2_component_entityText.MoreButton,
	    FullDescription,
	    EntityTextArea: tasks_v2_component_entityText.EntityTextArea,
	    NumberListButton: tasks_v2_component_entityText.NumberListButton,
	    BulletListButton: tasks_v2_component_entityText.BulletListButton
	  },
	  mixins: [DescriptionCheckListMixin],
	  inject: {
	    task: {},
	    isEdit: {}
	  },
	  provide() {
	    return {
	      editor: () => this.editor,
	      fileService: () => this.fileService
	    };
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    },
	    isSheetShown: {
	      type: Boolean,
	      required: true
	    }
	  },
	  emits: ['expand', 'change', 'filesChange', 'addCheckList'],
	  setup(props) {
	    return {
	      Outline: ui_iconSet_api_vue.Outline,
	      EntityTextTypes: tasks_v2_component_entityText.EntityTextTypes,
	      fileService: tasks_v2_provider_service_fileService.fileService.get(props.taskId),
	      entityTextEditor: tasks_v2_component_entityText.entityTextEditor.get(props.taskId)
	    };
	  },
	  data() {
	    return {
	      isNeedTeleport: false
	    };
	  },
	  computed: {
	    readonly() {
	      return !this.task.rights.edit;
	    },
	    editor() {
	      return this.entityTextEditor.getEditor();
	    },
	    isDiskModuleInstalled() {
	      return tasks_v2_core.Core.getParams().features.disk;
	    },
	    isCopilotEnabled() {
	      return tasks_v2_core.Core.getParams().features.isCopilotEnabled;
	    }
	  },
	  watch: {
	    isSheetShown(newValue) {
	      this.handleTeleport(newValue);
	    }
	  },
	  methods: {
	    handleExpand() {
	      this.$emit('expand');
	    },
	    handleTeleport(isSheetShown) {
	      if (isSheetShown === true) {
	        setTimeout(() => {
	          this.isNeedTeleport = true;
	          this.editor.setVisualOptions({
	            blockSpaceInline: 'var(--ui-space-stack-xl)'
	          });
	        }, 100);
	        setTimeout(() => {
	          this.editor.focus(null, {
	            defaultSelection: 'rootEnd'
	          });
	        }, 300);
	      } else {
	        this.isNeedTeleport = false;
	        this.editor.setMaxHeight(null);
	        this.editor.setVisualOptions({
	          blockSpaceInline: 'var(--ui-space-stack-md2)'
	        });
	      }
	    }
	  },
	  template: `
		<div class="tasks-card-change-description-mini-container">
			<div
				class="tasks-full-card-field-container --description-preview"
				ref="container"
				tabindex="-1"
			>
				<Teleport :to="isNeedTeleport ? '#descriptionTextAreaDestination' : undefined" :disabled="!isNeedTeleport">
					<EntityTextArea
						:entityId="taskId"
						:entityType="EntityTextTypes.Task"
						:readonly
						:removeFromServer="!isEdit"
						@change="$emit('change')"
						@filesChange="$emit('filesChange')"
						ref="descriptionTextArea"
					/>
				</Teleport>
				<div class="tasks-card-description-footer-container">
					<div class="tasks-card-description-footer">
						<div class="tasks-card-description-action-list">
							<AttachButton v-if="isDiskModuleInstalled" :fileService/>
							<MentionButton :editor/>
							<BulletListButton :editor/>
							<NumberListButton :editor/>
							<MoreButton :editor/>
							<CopilotButton v-if="isCopilotEnabled" :editor/>
							<CheckList
								v-if="isCopilotEnabled"
								:loading="isAiCommandProcessing"
								@click="handleCheckListButtonClick"
							/>
						</div>
						<div
							class="tasks-card-description-footer-buttons"
							ref="fullDescriptionArea"
						>
							<FullDescription @click="handleExpand"/>
						</div>
					</div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const DescriptionPreview = {
	  name: 'TaskDescriptionPreview',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    EntityCollapsibleText: tasks_v2_component_entityText.EntityCollapsibleText,
	    UserFieldWidgetComponent: tasks_v2_component_elements_userFieldWidgetComponent.DiskUserFieldWidgetComponent
	  },
	  inject: {
	    task: {},
	    isEdit: {}
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    },
	    files: {
	      type: Array,
	      required: true
	    },
	    isMiniFormShown: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['editButtonClick'],
	  setup(props) {
	    return {
	      BIcon: ui_iconSet_api_vue.BIcon,
	      Outline: ui_iconSet_api_vue.Outline,
	      uploaderAdapter: tasks_v2_provider_service_fileService.fileService.get(props.taskId).getAdapter()
	    };
	  },
	  data() {
	    return {
	      opened: false
	    };
	  },
	  computed: {
	    taskDescription() {
	      var _this$task$descriptio;
	      return (_this$task$descriptio = this.task.description) != null ? _this$task$descriptio : '';
	    },
	    readonly() {
	      return !this.task.rights.edit;
	    },
	    filesCount() {
	      return this.files.length;
	    },
	    widgetOptions() {
	      return {
	        isEmbedded: true,
	        withControlPanel: false,
	        canCreateDocuments: false,
	        tileWidgetOptions: {
	          compact: true,
	          hideDropArea: true,
	          readonly: true,
	          enableDropzone: false,
	          autoCollapse: false,
	          removeFromServer: !this.isEdit
	        }
	      };
	    }
	  },
	  template: `
		<div class="tasks-full-card-field-container print-no-box-shadow">
			<EntityCollapsibleText
				ref="collapsible"
				:content="taskDescription"
				:files
				:readonly
				:openByDefault="isMiniFormShown"
				showFilesIndicator
				:maxHeight="300"
				v-model:opened="opened"
				@editButtonClick="$emit('editButtonClick')"
			>
				<div
					v-if="opened && filesCount"
					class="tasks-card-description-editor-files --read-only print-ignore"
					:class="{ '--with-description': taskDescription.length > 0 }"
					ref="filesWrapper"
				>
					<UserFieldWidgetComponent :uploaderAdapter :widgetOptions/>
				</div>
			</EntityCollapsibleText>
		</div>
	`
	};

	// @vue/component
	const DescriptionSheet = {
	  name: 'TaskDescriptionSheet',
	  components: {
	    BottomSheet: tasks_v2_component_elements_bottomSheet.BottomSheet,
	    DescriptionEditor,
	    DropZone: tasks_v2_component_dropZone.DropZone
	  },
	  inject: {
	    task: {},
	    taskId: {}
	  },
	  props: {
	    sheetBindProps: {
	      type: Object,
	      required: true
	    },
	    enableSaveButton: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['close', 'addCheckList'],
	  setup() {
	    return {
	      EntityTypes: tasks_v2_provider_service_fileService.EntityTypes
	    };
	  },
	  data() {
	    return {
	      uniqueKey: main_core.Text.getRandom()
	    };
	  },
	  computed: {
	    bottomSheetContainer() {
	      return document.getElementById(`b24-bottom-sheet-${this.uniqueKey}`) || null;
	    },
	    isDiskModuleInstalled() {
	      return tasks_v2_core.Core.getParams().features.disk;
	    }
	  },
	  template: `
		<BottomSheet
			isExpanded
			:padding="0"
			:popupPadding="0"
			:sheetBindProps
			:uniqueKey
			@close="$emit('close')"
		>
			<DescriptionEditor
				:taskId
				:enableSaveButton
				@close="$emit('close')"
				@addCheckList="(checklistString) => $emit('addCheckList', checklistString)"
			/>
			<DropZone
				v-if="isDiskModuleInstalled && task.rights.edit"
				:container="bottomSheetContainer || {}"
				:entityId="taskId"
				:entityType="EntityTypes.Task"
			/>
		</BottomSheet>
	`
	};

	// @vue/component
	const DescriptionField = {
	  name: 'TaskDescriptionField',
	  components: {
	    MiniFormButton,
	    MiniForm,
	    DescriptionPreview,
	    DescriptionSheet
	  },
	  expose: ['save'],
	  inject: {
	    task: {},
	    isEdit: {}
	  },
	  props: {
	    isSheetShown: {
	      type: Boolean,
	      required: true
	    },
	    taskId: {
	      type: [Number, String],
	      required: true
	    },
	    sheetBindProps: {
	      type: Object,
	      required: true
	    }
	  },
	  // eslint-disable-next-line max-len
	  setup(props) {
	    return {
	      fileService: tasks_v2_provider_service_fileService.fileService.get(props.taskId),
	      uploaderAdapter: tasks_v2_provider_service_fileService.fileService.get(props.taskId).getAdapter(),
	      entityTextEditor: tasks_v2_component_entityText.entityTextEditor.get(props.taskId)
	    };
	  },
	  data() {
	    return {
	      checksum: '',
	      isSaving: false,
	      isMiniFormShown: false,
	      enableSaveButton: false,
	      hasFilesChanges: false,
	      files: this.fileService.getFiles()
	    };
	  },
	  computed: {
	    taskDescription() {
	      var _this$task$descriptio;
	      return (_this$task$descriptio = this.task.description) != null ? _this$task$descriptio : '';
	    },
	    taskDescriptionChecksum() {
	      var _this$task$descriptio2;
	      return (_this$task$descriptio2 = this.task.descriptionChecksum) != null ? _this$task$descriptio2 : '';
	    },
	    readonly() {
	      return !this.task.rights.edit;
	    },
	    filesCount() {
	      return this.files.length;
	    },
	    shouldShowDescriptionField() {
	      return !this.readonly || this.taskDescription.length > 0 || this.filesCount > 0 && !this.readonly;
	    },
	    shouldShowMiniForm() {
	      if (this.readonly) {
	        return false;
	      }
	      if (!this.isEdit) {
	        return this.isMiniFormShown || this.task.description.length > 0;
	      }
	      return true;
	    },
	    shouldShowMiniFormButton() {
	      return this.taskDescription.length === 0 && (!this.isEdit && !this.isMiniFormShown || this.isEdit && this.filesCount === 0);
	    },
	    shouldShowDescriptionPreview() {
	      return this.isEdit && (this.taskDescription.length > 0 || this.filesCount > 0);
	    },
	    miniFormStyle() {
	      if (this.isEdit) {
	        return {
	          display: 'none'
	        };
	      }
	      return null;
	    },
	    editor() {
	      return this.entityTextEditor.getEditor();
	    }
	  },
	  watch: {
	    taskDescriptionChecksum: {
	      handler() {
	        if (this.editor && this.isSheetShown && !this.hasChanges()) {
	          this.updateChecksum();
	        }
	      },
	      deep: true
	    }
	  },
	  mounted() {
	    this.entityTextEditor.setEditorText(this.taskDescription);
	    this.updateChecksum();
	  },
	  methods: {
	    expandDescription() {
	      this.setSheetShown(true);
	    },
	    openEditMode() {
	      if (this.editor && this.hasChanges() && !this.isSaving) {
	        this.entityTextEditor.setEditorText(this.taskDescription);
	      }
	      this.updateChecksum();
	      this.setSheetShown(true);
	    },
	    async closeEditMode() {
	      this.setSheetShown(false);
	      this.hasFilesChanges = false;
	      this.enableSaveButton = false;
	      await this.handleSave();
	    },
	    async addCheckListFromSheet(checklistString) {
	      await this.closeEditMode();
	      this.addCheckList(checklistString);
	    },
	    handleMiniFormButtonClick() {
	      if (this.isEdit) {
	        this.openEditMode();
	      } else {
	        this.isMiniFormShown = true;
	      }
	    },
	    async handleTextChanges() {
	      if (this.isEdit) {
	        if (this.hasFilesChanges) {
	          return;
	        }
	        this.enableSaveButton = this.hasChanges();
	      } else {
	        this.enableSaveButton = true;
	        await this.save();
	      }
	    },
	    async addCheckListFromMiniForm(checklistString) {
	      await this.handleTextChanges();
	      this.addCheckList(checklistString);
	    },
	    addCheckList(checklistString) {
	      this.$bitrix.eventEmitter.emit(tasks_v2_const.EventName.AddCheckListFromText, checklistString);
	    },
	    handleFilesChanges() {
	      if (!this.isSheetShown) {
	        return;
	      }
	      this.hasFilesChanges = true;
	      this.enableSaveButton = true;
	    },
	    async handleSave() {
	      var _result$Endpoint$Task;
	      if (!this.editor || !this.hasChanges()) {
	        return;
	      }
	      this.isSaving = true;
	      tasks_v2_provider_service_taskService.taskService.setSilentErrorMode(true);
	      const result = await this.save();
	      tasks_v2_provider_service_taskService.taskService.setSilentErrorMode(false);
	      if ((result == null ? void 0 : (_result$Endpoint$Task = result[tasks_v2_const.Endpoint.TaskDescriptionUpdate]) == null ? void 0 : _result$Endpoint$Task.length) > 0) {
	        const errorData = result[tasks_v2_const.Endpoint.TaskDescriptionUpdate][0];
	        const {
	          customData
	        } = errorData;
	        if (customData && customData.changed && customData.changedBy) {
	          this.showDescriptionChangedAlert(customData.changedBy);
	        } else {
	          console.error('Error saving description:', errorData);
	        }
	      }
	      this.isSaving = false;
	    },
	    async save(forceUpdateDescription = false) {
	      return tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	        forceUpdateDescription,
	        description: this.editor.getText(),
	        descriptionChecksum: this.checksum
	      });
	    },
	    hasChanges() {
	      var _this$editor;
	      const preparedOldText = this.getPreparedText(this.taskDescription);
	      const preparedNewText = this.getPreparedText((_this$editor = this.editor) == null ? void 0 : _this$editor.getText());
	      return preparedOldText !== preparedNewText;
	    },
	    getPreparedText(text) {
	      return text.replaceAll(/\[p]\n|\[p]\[\/p]|\[\/p]/gi, '').trim();
	    },
	    setSheetShown(isShown) {
	      this.$emit('update:isSheetShown', isShown);
	    },
	    showDescriptionChangedAlert(changedBy) {
	      ui_dialogs_messagebox.MessageBox.show({
	        useAirDesign: true,
	        title: this.loc('TASKS_V2_DESCRIPTION_CHECKSUM_ERROR_TITLE'),
	        message: this.loc(`TASKS_V2_DESCRIPTION_CHECKSUM_ERROR_DESC_${changedBy.gender.toUpperCase()}`, {
	          '#NAME#': changedBy.name
	        }),
	        buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
	        okCaption: this.loc('TASKS_V2_DESCRIPTION_CHECKSUM_ERROR_BUTTON_OK'),
	        onOk: dialog => this.onOkDescriptionChangedAlert(dialog),
	        popupOptions: {
	          closeByEsc: false,
	          autoHide: false,
	          events: {
	            onClose: () => this.onCloseDescriptionChangedAlert()
	          }
	        }
	      });
	    },
	    async onOkDescriptionChangedAlert(dialog) {
	      dialog.close();
	      await this.save(true);
	    },
	    onCloseDescriptionChangedAlert() {
	      this.updateChecksum();
	    },
	    updateChecksum() {
	      this.checksum = this.taskDescriptionChecksum;
	    }
	  },
	  template: `
		<div
			v-if="shouldShowDescriptionField"
			class="tasks-card-description-field"
			:data-task-id="taskId"
			:data-task-field-id="'description'"
		>
			<MiniFormButton
				v-if="shouldShowMiniFormButton"
				:filesCount
				@click="handleMiniFormButtonClick"
			/>
			<MiniForm
				v-if="shouldShowMiniForm"
				:taskId
				:isSheetShown
				:style="miniFormStyle"
				@expand="expandDescription"
				@change="handleTextChanges"
				@filesChange="handleFilesChanges"
				@addCheckList="addCheckListFromMiniForm"
			/>
			<DescriptionPreview
				v-if="shouldShowDescriptionPreview"
				:taskId
				:files
				:isMiniFormShown
				@editButtonClick="openEditMode"
			/>
		</div>
		<DescriptionSheet
			v-if="isSheetShown"
			:sheetBindProps
			:enableSaveButton
			@close="closeEditMode"
			@addCheckList="addCheckListFromSheet"
		/>
	`
	};

	// @vue/component
	const DescriptionInline = {
	  name: 'TaskDescriptionInline',
	  components: {
	    TextEditorComponent: ui_textEditor.TextEditorComponent
	  },
	  inject: {
	    task: {},
	    taskId: {}
	  },
	  setup() {
	    return {
	      editor: null,
	      DefaultEditorOptions: tasks_v2_component_entityText.DefaultEditorOptions
	    };
	  },
	  data() {
	    return {
	      isFocused: false,
	      isScrolledToTop: true,
	      isScrolledToBottom: true
	    };
	  },
	  computed: {
	    taskDescription() {
	      return this.task.description;
	    },
	    copilotParams() {
	      if (tasks_v2_core.Core.getParams().features.isCopilotEnabled) {
	        return {
	          copilotOptions: {
	            moduleId: 'tasks',
	            category: 'tasks',
	            contextId: `tasks_${this.taskId}`,
	            menuForceTop: false
	          },
	          triggerBySpace: true
	        };
	      }
	      return {};
	    }
	  },
	  created() {
	    const additionalEditorOptions = {
	      minHeight: 20,
	      maxHeight: 112,
	      placeholder: this.loc('TASKS_V2_DESCRIPTION_INLINE_EDITOR_PLACEHOLDER'),
	      content: this.taskDescription,
	      newLineMode: 'paragraph',
	      events: {
	        onFocus: this.handleEditorFocus,
	        onBlur: this.handleEditorBlur,
	        onChange: this.handleEditorChange
	      },
	      copilot: this.copilotParams
	    };
	    this.editor = new ui_textEditor.TextEditor({
	      ...tasks_v2_component_entityText.DefaultEditorOptions,
	      ...additionalEditorOptions
	    });
	  },
	  mounted() {
	    main_core.Event.bind(this.editor.getScrollerContainer(), 'scroll', this.handleScroll);
	    tasks_v2_provider_service_fileService.fileService.get(this.taskId).getAdapter().getUploader().assignPaste(this.$refs.description);
	  },
	  beforeUnmount() {
	    main_core.Event.unbind(this.editor.getScrollerContainer(), 'scroll', this.handleScroll);
	    tasks_v2_provider_service_fileService.fileService.get(this.taskId).getAdapter().getUploader().unassignPaste(this.$refs.description);
	  },
	  methods: {
	    hasScroll() {
	      return !this.isScrolledToTop || !this.isScrolledToBottom;
	    },
	    async handleEditorFocus() {
	      this.isFocused = true;
	    },
	    async handleEditorBlur() {
	      this.isFocused = false;
	      const description = this.editor.getText();
	      void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	        description
	      });
	    },
	    handleEditorChange() {
	      this.handleScroll();
	    },
	    handleScroll() {
	      const container = this.editor.getScrollerContainer();
	      this.isScrolledToTop = container.scrollTop === 0;
	      this.isScrolledToBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 5;
	    }
	  },
	  template: `
		<div
			class="tasks-card-description-inline"
			:class="{ '--bottom-shadow': !isScrolledToBottom, '--top-shadow': !isScrolledToTop }"
			:data-task-id="taskId"
			:data-task-field-id="'description'"
			ref="description"
		>
			<div class="tasks-card-description-inline-shadow --revert" :class="{'--shown': !isScrolledToTop}">
				<div class="tasks-card-description-inline-shadow-white"/>
				<div class="tasks-card-description-inline-shadow-black"/>
			</div>
			<TextEditorComponent :editorInstance="editor"/>
			<div class="tasks-card-description-inline-shadow" :class="{'--shown': !isScrolledToBottom}">
				<div class="tasks-card-description-inline-shadow-white"/>
				<div class="tasks-card-description-inline-shadow-black"/>
			</div>
		</div>
	`
	};

	exports.DescriptionEditor = DescriptionEditor;
	exports.DescriptionField = DescriptionField;
	exports.DescriptionSheet = DescriptionSheet;
	exports.DescriptionInline = DescriptionInline;

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX.Vue3.Components,BX.Event,BX.UI.Dialogs,BX.Tasks.V2.Const,BX.UI.IconSet,BX,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component,BX,BX.UI.TextEditor,BX.Tasks.V2,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Component));
//# sourceMappingURL=description.bundle.js.map
