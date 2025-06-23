/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,ui_vue3_components_button,ui_bbcode_formatter_htmlFormatter,ui_iconSet_api_vue,ui_iconSet_api_core,ui_iconSet_outline,tasks_v2_component_elements_bottomSheet,ui_vue3_components_popup,ui_vue3_vuex,main_core,ui_textEditor,tasks_v2_model_tasks,tasks_v2_const,tasks_v2_provider_service_taskService,tasks_v2_provider_service_fileService) {
	'use strict';

	const DefaultEditorOptions = Object.freeze({
	  toolbar: [],
	  floatingToolbar: ['bold', 'italic', 'underline', 'strikethrough', '|', 'numbered-list', 'bulleted-list', '|', 'link'],
	  removePlugins: ['BlockToolbar'],
	  visualOptions: {
	    borderWidth: 0,
	    blockSpaceInline: 0,
	    colorBackground: 'transparent'
	  },
	  mention: {
	    dialogOptions: {
	      entities: [{
	        id: tasks_v2_const.EntitySelectorEntity.User,
	        options: {
	          emailUsers: true,
	          inviteEmployeeLink: false
	        },
	        itemOptions: {
	          default: {
	            link: '',
	            linkTitle: ''
	          }
	        }
	      }, {
	        id: tasks_v2_const.EntitySelectorEntity.StructureNode,
	        options: {
	          selectMode: 'usersOnly',
	          allowFlatDepartments: false
	        }
	      }]
	    }
	  },
	  copilot: {
	    copilotOptions: {}
	  },
	  paragraphPlaceholder: 'auto'
	});

	// @vue/component
	const ActionButton = {
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  props: {
	    title: {
	      type: String,
	      default: ''
	    },
	    iconName: {
	      type: String,
	      required: true
	    },
	    iconColor: {
	      type: String,
	      default: ''
	    }
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  template: `
		<button class="tasks-card-description-action-button" type="button" :title="title">
			<BIcon :name="iconName" :color="iconColor"/>
		</button>
	`
	};

	// @vue/component
	const Copilot = {
	  name: 'TaskDescriptionCopilot',
	  components: {
	    ActionButton,
	    Outline: ui_iconSet_api_vue.Outline
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  computed: {
	    buttonColor() {
	      return 'var(--ui-color-copilot-primary)';
	    }
	  },
	  methods: {
	    handleClick() {
	      alert('Not implemented yet');
	    }
	  },
	  template: `
		<ActionButton
			:iconName="Outline.COPILOT"
			:title="loc('TASKS_V2_DESCRIPTION_ACTION_COPILOT_TITLE')"
			:iconColor="buttonColor"
			@click="handleClick"
		/>
	`
	};

	// @vue/component
	const Attach = {
	  name: 'TaskDescriptionMention',
	  components: {
	    ActionButton,
	    Outline: ui_iconSet_api_vue.Outline
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  methods: {
	    handleClick() {
	      alert('Not implemented yet');
	    }
	  },
	  template: `
		<ActionButton
			:iconName="Outline.ATTACH"
			:title="loc('TASKS_V2_DESCRIPTION_ACTION_ATTACH_TITLE')"
			@click="handleClick"
		/>
	`
	};

	// @vue/component
	const Mention = {
	  name: 'TaskDescriptionMention',
	  components: {
	    ActionButton,
	    Outline: ui_iconSet_api_vue.Outline
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  template: `
		<ActionButton
			:iconName="Outline.MENTION"
			:title="loc('TASKS_V2_DESCRIPTION_ACTION_MENTION_TITLE')"
		/>
	`
	};

	// @vue/component
	const DescriptionEditor = {
	  name: 'TaskDescriptionContent',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    TextEditorComponent: ui_textEditor.TextEditorComponent,
	    HtmlFormatterComponent: ui_bbcode_formatter_htmlFormatter.HtmlFormatterComponent,
	    Popup: ui_vue3_components_popup.Popup,
	    Button: ui_vue3_components_button.Button,
	    Copilot,
	    Attach,
	    Mention
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    },
	    doOpenInEditMode: {
	      type: Boolean,
	      default: false
	    },
	    isExpanded: {
	      type: Boolean,
	      default: null
	    }
	  },
	  emits: ['close', 'editorResize', 'show', 'expand'],
	  setup() {
	    return {
	      /** @type TextEditor */
	      editor: null,
	      ButtonSize: ui_vue3_components_button.ButtonSize,
	      ButtonColor: ui_vue3_components_button.ButtonColor,
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  data() {
	    return {
	      isEditMode: false,
	      isWarningPopupShown: false,
	      files: []
	    };
	  },
	  computed: {
	    task() {
	      return this.$store.getters[`${tasks_v2_const.Model.Tasks}/getById`](this.taskId);
	    },
	    popupOptions() {
	      return {
	        className: 'tasks-card-description-warning-popup',
	        width: 380,
	        padding: 24,
	        autoHide: false,
	        closeByEsc: false,
	        overlay: true
	      };
	    },
	    readonly() {
	      return !this.task.rights.edit;
	    }
	  },
	  async created() {
	    const additionalEditorOptions = {
	      minHeight: 100,
	      placeholder: this.loc('TASKS_V2_DESCRIPTION_EDITOR_PLACEHOLDER'),
	      content: this.task.description,
	      events: {
	        onChange: this.handleChange
	      },
	      file: {
	        mode: 'disk'
	      }
	    };
	    this.editor = new ui_textEditor.TextEditor({
	      ...DefaultEditorOptions,
	      ...additionalEditorOptions
	    });
	    this.isEditMode = this.doOpenInEditMode;
	    this.files = await tasks_v2_provider_service_fileService.fileService.get(this.taskId).list(this.task.fileIds);
	    this.editor.dispatchCommand(ui_textEditor.Plugins.File.ADD_FILES_COMMAND, this.files);
	  },
	  mounted() {
	    this.$emit('show');
	    if (this.task.description.length === 0) {
	      this.isEditMode = true;
	    }
	  },
	  methods: {
	    handleChange() {
	      this.$emit('editorResize');
	    },
	    handleCloseIconClick() {
	      if (this.isEditMode && this.editor.getText() !== this.task.description) {
	        this.isWarningPopupShown = true;
	        return;
	      }
	      this.$emit('close');
	      this.editor.setText(this.task.description);
	    },
	    handleSaveButtonClick() {
	      void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	        description: this.editor.getText()
	      });
	      this.isEditMode = false;
	      if (this.task.description.length === 0) {
	        this.$emit('close');
	      }
	    },
	    handleCancelButtonClick() {
	      this.isEditMode = false;
	      this.editor.setText(this.task.description);
	      if (this.task.description.length === 0) {
	        this.$emit('close');
	      }
	    },
	    handleEditButtonClick() {
	      void this.enableEdit();
	    },
	    async enableEdit() {
	      this.isEditMode = true;
	      await this.$nextTick();
	      this.focusToEnd();
	    },
	    async adjustEditor() {
	      if (this.editor.getMaxHeight() !== this.$refs.editorWrapper.offsetHeight) {
	        this.setMaxHeight(this.$refs.editorWrapper.offsetHeight);
	      }
	    },
	    setMaxHeight(maxHeight) {
	      this.editor.setMaxHeight(maxHeight);
	      main_core.Dom.style(this.$refs.htmlFormatterComponent.$el, 'max-height', `${maxHeight}px`);
	    },
	    showEditor() {
	      main_core.Dom.show(this.$refs.editorWrapper);
	    },
	    hideEditor() {
	      main_core.Dom.hide(this.$refs.editorWrapper);
	    },
	    focusToEnd() {
	      this.editor.focus(null, {
	        defaultSelection: 'rootEnd'
	      });
	    },
	    handlePopupOkButtonClick() {
	      this.$emit('close');
	      this.editor.setText(this.task.description);
	    },
	    handlePopupCancelButtonClick() {
	      this.isWarningPopupShown = false;
	    },
	    onExpandClick() {
	      this.$emit('expand', !this.isExpanded);
	    },
	    onMentionButtonClick() {
	      this.editor.dispatchCommand(BX.UI.TextEditor.Plugins.Mention.INSERT_MENTION_DIALOG_COMMAND);
	    }
	  },
	  template: `
		<div class="tasks-card-description-wrapper">
			<div class="tasks-card-description-header">
				<div class="tasks-card-description-title">
					{{ loc('TASKS_V2_DESCRIPTION_TITLE') }}
				</div>
				<BIcon
					v-if="[true, false].includes(isExpanded)"
					class="tasks-card-description-expand-icon"
					:name="isExpanded ? Outline.COLLAPSE_L : Outline.EXPAND_L"
					@click="onExpandClick"
				/>
				<BIcon :name="Outline.CROSS_L" @click="handleCloseIconClick"/>
			</div>
			<div class="tasks-card-description-editor-wrapper" ref="editorWrapper">
				<TextEditorComponent v-if="isEditMode" :editor-instance="editor"/>
				<HtmlFormatterComponent
					v-show="!isEditMode"
					class="tasks-card-description-view"
					:bbcode="task.description"
					:options="{
						fileMode: 'disk',
					}"
					:formatData="{ files }"
					ref="htmlFormatterComponent"
				/>
			</div>
			<div v-if="!readonly" class="tasks-card-description-footer">
				<div v-if="isEditMode" class="tasks-card-description-action-list">
					<Copilot />
					<Attach/>
					<Mention @click="onMentionButtonClick"/>
				</div>
				<div class="tasks-card-description-footer-buttons">
					<template v-if="isEditMode">
						<Button
							:text="loc('TASKS_V2_DESCRIPTION_BUTTON_CANCEL')"
							:size="ButtonSize.MEDIUM"
							:color="ButtonColor.LINK"
							@click="handleCancelButtonClick"
						/>
						<Button
							:text="loc('TASKS_V2_DESCRIPTION_BUTTON_SAVE')"
							:size="ButtonSize.MEDIUM"
							:color="ButtonColor.PRIMARY"
							@click="handleSaveButtonClick"
						/>
					</template>
					<Button
						v-else
						:text="loc('TASKS_V2_DESCRIPTION_BUTTON_EDIT')"
						:size="ButtonSize.MEDIUM"
						:color="ButtonColor.LINK"
						@click="handleEditButtonClick"
					/>
				</div>
			</div>
			<Popup v-if="isWarningPopupShown" :options="popupOptions">
				<div class="tasks-card-description-warning-popup-content">
					<div class="tasks-card-description-warning-popup-title">
						{{ loc('TASKS_V2_DESCRIPTION_WARNING_POPUP_TITLE') }}
					</div>
					<div class="tasks-card-description-warning-popup-description">
						{{ loc('TASKS_V2_DESCRIPTION_WARNING_POPUP_DESCRIPTION') }}
					</div>
				</div>
				<div class="tasks-card-description-warning-popup-buttons">
					<Button
						:text="loc('TASKS_V2_DESCRIPTION_WARNING_POPUP_BUTTON_CLOSE')"
						:size="ButtonSize.MEDIUM"
						:color="ButtonColor.PRIMARY"
						@click="handlePopupOkButtonClick"
					/>
					<Button
						:text="loc('TASKS_V2_DESCRIPTION_WARNING_POPUP_BUTTON_CANCEL')"
						:size="ButtonSize.MEDIUM"
						:color="ButtonColor.LIGHT_BORDER"
						@click="handlePopupCancelButtonClick"
					/>
				</div>
			</Popup>
		</div>
	`
	};

	// @vue/component
	const EditButton = {
	  name: 'TaskDescriptionEditButton',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  computed: {
	    iconSize() {
	      return 18;
	    }
	  },
	  template: `
		<div class="tasks-card-change-description">
			<BIcon :name="Outline.EDIT_L" :size=iconSize></BIcon>
			<div class="tasks-card-change-description-text">{{ loc('TASKS_V2_CHANGE_DESCRIPTION') }}</div>
		</div>
	`
	};

	// @vue/component
	const DescriptionPreview = {
	  name: 'TaskDescriptionPreview',
	  components: {
	    HtmlFormatterComponent: ui_bbcode_formatter_htmlFormatter.HtmlFormatterComponent,
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    }
	  },
	  emits: ['previewButtonClick'],
	  setup() {
	    return {
	      BIcon: ui_iconSet_api_vue.BIcon,
	      Outline: ui_iconSet_api_core.Outline
	    };
	  },
	  data() {
	    return {
	      isOverflowing: false,
	      files: []
	    };
	  },
	  computed: {
	    task() {
	      return this.$store.getters[`${tasks_v2_const.Model.Tasks}/getById`](this.taskId);
	    },
	    taskDescription() {
	      var _this$task$descriptio;
	      return (_this$task$descriptio = this.task.description) != null ? _this$task$descriptio : '';
	    },
	    readonly() {
	      return !this.task.rights.edit;
	    },
	    isMoreButtonShown() {
	      return this.isOverflowing || this.readonly;
	    }
	  },
	  watch: {
	    async taskDescription() {
	      await this.$nextTick();
	      //TODO files can break this logic
	      this.updateIsOverflowing();
	    }
	  },
	  async created() {
	    this.files = await tasks_v2_provider_service_fileService.fileService.get(this.taskId).list(this.task.fileIds);
	  },
	  async mounted() {
	    setTimeout(() => this.updateIsOverflowing(), 200);
	  },
	  methods: {
	    updateIsOverflowing() {
	      this.isOverflowing = this.$el.offsetHeight - 16 < this.$refs.htmlFormatter.$el.offsetHeight;
	    },
	    onPreviewClick(event) {
	      if (event.target.closest('a')) {
	        return;
	      }
	      this.$emit('previewButtonClick', {
	        doOpenInEditMode: false
	      });
	    },
	    onEditButtonClick() {
	      this.$emit('previewButtonClick', {
	        doOpenInEditMode: true
	      });
	    },
	    onMoreButtonClick() {
	      this.$emit('previewButtonClick', {
	        doOpenInEditMode: false
	      });
	    }
	  },
	  template: `
		<div class="tasks-card-description-preview">
			<HtmlFormatterComponent
				:bbcode="task.description"
				:options="{
					fileMode: 'disk',
				}"
				:formatData="{ files }"
				ref="htmlFormatter"
				@click="onPreviewClick"
			/>
			<div class="tasks-card-description-preview-button" @click="onMoreButtonClick">
				<div v-if="isMoreButtonShown" class="tasks-card-description-preview-button-more">
					<span class="tasks-card-description-preview-button-text">
						{{ loc('TASKS_V2_DESCRIPTION_PREVIEW_BUTTON_MORE') }}
					</span>
				</div>
				<div v-else class="tasks-card-description-preview-button-edit">
					<BIcon
						:size="18"
						:name="Outline.EDIT_L"
					/>
					<span class="tasks-card-description-preview-button-text">
						{{ loc('TASKS_V2_DESCRIPTION_PREVIEW_BUTTON_EDIT') }}
					</span>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const DescriptionField = {
	  name: 'TaskDescriptionField',
	  components: {
	    EditButton,
	    DescriptionPreview
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    }
	  },
	  data() {
	    return {
	      isSlotShown: false,
	      doOpenInEditMode: false
	    };
	  },
	  computed: {
	    task() {
	      return this.$store.getters[`${tasks_v2_const.Model.Tasks}/getById`](this.taskId);
	    },
	    readonly() {
	      return !this.task.rights.edit;
	    }
	  },
	  methods: {
	    onPreviewButtonClick(eventData) {
	      this.doOpenInEditMode = eventData.doOpenInEditMode === true;
	      this.isSlotShown = true;
	    },
	    closeSlot() {
	      this.isSlotShown = false;
	    }
	  },
	  template: `
		<slot :isShown="isSlotShown" :doOpenInEditMode="doOpenInEditMode" :close="closeSlot"></slot>
		<div
			v-if="!readonly || task.description.length > 0"
			class="tasks-card-description-field"
			:data-task-id="taskId"
			:data-task-field-id="'description'"
		>
			<EditButton v-if="task.description.length === 0" @click="isSlotShown = true"></EditButton>
			<DescriptionPreview
				v-else
				:taskId="taskId"
				@previewButtonClick="onPreviewButtonClick"
			/>
		</div>
	`
	};

	// @vue/component
	const DescriptionSheet = {
	  name: 'TaskDescriptionSheet',
	  components: {
	    BottomSheet: tasks_v2_component_elements_bottomSheet.BottomSheet,
	    DescriptionEditor
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    },
	    isShown: {
	      type: Boolean,
	      required: true
	    },
	    doOpenInEditMode: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['show', 'close'],
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
	      var _this$$refs$bottomShe, _this$$refs$editorCom;
	      (_this$$refs$bottomShe = this.$refs.bottomSheet) == null ? void 0 : _this$$refs$bottomShe.adjustPosition();
	      void ((_this$$refs$editorCom = this.$refs.editorComponent) == null ? void 0 : _this$$refs$editorCom.adjustEditor());
	    }
	  },
	  methods: {
	    onAfterEnter() {
	      this.$refs.editorComponent.focusToEnd();
	    },
	    handleShow() {
	      void this.$refs.editorComponent.adjustEditor();
	      this.$emit('show');
	    }
	  },
	  template: `
		<BottomSheet :isShown="isShown" :isExpanded="isExpanded" @after-enter="onAfterEnter" ref="bottomSheet">
			<DescriptionEditor
				ref="editorComponent"
				:taskId="taskId"
				:doOpenInEditMode="doOpenInEditMode"
				:isExpanded="isExpanded"
				@expand="isExpanded = !isExpanded"
				@show="handleShow"
				@close="$emit('close')"
			></DescriptionEditor>
		</BottomSheet>
	`
	};

	// @vue/component
	const DescriptionPopup = {
	  name: 'TaskDescriptionPopup',
	  components: {
	    Popup: ui_vue3_components_popup.Popup,
	    DescriptionEditor
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    },
	    isShown: {
	      type: Boolean,
	      required: true
	    },
	    doOpenInEditMode: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['show', 'close', 'resize'],
	  setup() {
	    return {
	      resizeObserver: null
	    };
	  },
	  data() {
	    return {
	      popupHeight: 0
	    };
	  },
	  computed: {
	    popupId() {
	      return `tasks-field-description-popup-${this.taskId}`;
	    },
	    popupOptions() {
	      return {
	        className: 'tasks-card-description-popup',
	        minHeight: 360,
	        maxHeight: this.popupMaxHeight,
	        width: 580,
	        offsetTop: 0,
	        padding: 0,
	        autoHide: false,
	        closeByEsc: false,
	        animation: {
	          showClassName: 'tasks-description-popup-show',
	          closeClassName: 'tasks-description-popup-close',
	          closeAnimationType: 'animation'
	        },
	        events: {
	          onAfterShow: () => this.$refs.editorComponent.focusToEnd()
	        }
	      };
	    },
	    popupMaxHeight() {
	      return document.body.offsetHeight - 120 - this.titleFieldOffsetHeight;
	    },
	    task() {
	      return this.$store.getters[`${tasks_v2_const.Model.Tasks}/getById`](this.taskId);
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
	      this.resizeEditor();
	      await this.$nextTick();
	      this.onResize();
	    }
	  },
	  created() {
	    this.resizeObserver = new ResizeObserver(entries => {
	      for (const entry of entries) {
	        if (entry.target === this.$refs.popupWrapper) {
	          this.onResize();
	        }
	      }
	    });
	  },
	  mounted() {
	    main_core.Event.bind(window, 'resize', this.onResize);
	  },
	  beforeUnmount() {
	    main_core.Event.unbind(window, 'resize', this.onResize);
	  },
	  methods: {
	    onShow() {
	      var _this$$refs$popupComp;
	      this.resizeEditor();
	      this.$emit('show', {
	        popupInstance: this.$refs.popupComponent.getPopupInstance()
	      });
	      (_this$$refs$popupComp = this.$refs.popupComponent) == null ? void 0 : _this$$refs$popupComp.getPopupInstance().adjustPosition();
	      setTimeout(() => this.resizeObserver.observe(this.$refs.popupWrapper), 300);
	    },
	    resizeEditor() {
	      var _this$$refs$popupComp2;
	      const popupInstance = (_this$$refs$popupComp2 = this.$refs.popupComponent) == null ? void 0 : _this$$refs$popupComp2.getPopupInstance();
	      const popupContainer = popupInstance.getPopupContainer();
	      this.$refs.editorComponent.hideEditor();
	      main_core.Dom.style(popupContainer, 'min-height', 0);
	      const popupWithoutEditorHeight = popupContainer.clientHeight;
	      const additionalOffset = 240;
	      const maxHeight = document.body.clientHeight - popupWithoutEditorHeight - additionalOffset - this.titleFieldOffsetHeight;
	      main_core.Dom.style(popupContainer, 'min-height', '360px');
	      this.$refs.editorComponent.showEditor();
	      this.$refs.editorComponent.setMaxHeight(maxHeight);
	      popupInstance.setOffset();
	    },
	    onResize() {
	      var _this$$refs$popupComp3;
	      const popupInstance = (_this$$refs$popupComp3 = this.$refs.popupComponent) == null ? void 0 : _this$$refs$popupComp3.getPopupInstance();
	      if (popupInstance) {
	        this.$emit('resize');
	        popupInstance.adjustPosition();
	      }
	    },
	    onClose() {
	      this.resizeObserver.disconnect();
	      this.$emit('close');
	    }
	  },
	  template: `
		<Popup v-if="isShown" :options="popupOptions" ref="popupComponent">
			<div class="tasks-card-description-popup-wrapper" ref="popupWrapper">
				<DescriptionEditor
					ref="editorComponent"
					:taskId="taskId"
					:doOpenInEditMode="doOpenInEditMode"
					@show="onShow"
					@close="onClose"
				></DescriptionEditor>
			</div>
		</Popup>
	`
	};

	// @vue/component
	const DescriptionInline = {
	  name: 'TaskDescriptionInline',
	  components: {
	    TextEditorComponent: ui_textEditor.TextEditorComponent
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    }
	  },
	  setup() {
	    return {
	      editor: null,
	      DefaultEditorOptions
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
	    task() {
	      return this.$store.getters[`${tasks_v2_const.Model.Tasks}/getById`](this.taskId);
	    },
	    taskDescription() {
	      return this.task.description;
	    }
	  },
	  created() {
	    const additionalEditorOptions = {
	      minHeight: 20,
	      maxHeight: 112,
	      placeholder: this.loc('TASKS_V2_DESCRIPTION_INLINE_EDITOR_PLACEHOLDER'),
	      content: this.taskDescription,
	      events: {
	        onFocus: () => this.handleEditorFocus(),
	        onBlur: () => this.handleEditorBlur(),
	        onChange: () => this.handleEditorChange()
	      }
	    };
	    this.editor = new ui_textEditor.TextEditor({
	      ...DefaultEditorOptions,
	      ...additionalEditorOptions
	    });
	    main_core.Event.bind(this.editor.getScrollerContainer(), 'scroll', this.handleScroll);
	  },
	  beforeUnmount() {
	    main_core.Event.unbind(this.editor.getScrollerContainer(), 'scroll', this.handleScroll);
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
	    },
	    async handlePaste(clipboardEvent) {
	      if (!this.isFocused) {
	        return;
	      }
	      const service = tasks_v2_provider_service_fileService.fileService.get(this.taskId);
	      void service.uploadFromClipboard({
	        clipboardEvent
	      });
	    }
	  },
	  template: `
		<div
			class="tasks-card-description-inline"
			:class="{ '--bottom-shadow': !isScrolledToBottom, '--top-shadow': !isScrolledToTop }"
			:data-task-id="taskId"
			:data-task-field-id="'description'"
			@paste="handlePaste"
		>
			<div class="tasks-card-description-inline-shadow --revert" :class="{'--shown': !isScrolledToTop}">
				<div class="tasks-card-description-inline-shadow-white"/>
				<div class="tasks-card-description-inline-shadow-black"/>
			</div>
			<TextEditorComponent :editor-instance="editor"/>
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
	exports.DescriptionPopup = DescriptionPopup;
	exports.DescriptionInline = DescriptionInline;

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX.Vue3.Components,BX.UI.BBCode.Formatter,BX.UI.IconSet,BX.UI.IconSet,BX,BX.Tasks.V2.Component.Elements,BX.UI.Vue3.Components,BX.Vue3.Vuex,BX,BX.UI.TextEditor,BX.Tasks.V2.Model,BX.Tasks.V2.Const,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service));
//# sourceMappingURL=description.bundle.js.map
