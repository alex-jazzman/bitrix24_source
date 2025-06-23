/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,main_core,ui_vue3_vuex,ui_iconSet_api_vue,tasks_v2_component_elements_bottomSheet,ui_uploader_core,ui_iconSet_api_core,ui_iconSet_animated,ui_iconSet_outline,tasks_v2_component_elements_chip,tasks_v2_const,tasks_v2_lib_fieldHighlighter,tasks_v2_lib_analytics,ui_vue3_components_popup,ui_vue3_components_button,disk_uploader_userFieldWidget,tasks_v2_provider_service_fileService) {
	'use strict';

	const filesMeta = Object.freeze({
	  id: 'fileIds',
	  title: main_core.Loc.getMessage('TASKS_V2_FILES_TITLE')
	});

	// @vue/component
	const Files = {
	  name: 'TaskFiles',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
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
	      filesMeta
	    };
	  },
	  data() {
	    return {
	      files: tasks_v2_provider_service_fileService.fileService.get(this.taskId).getFiles()
	    };
	  },
	  computed: {
	    task() {
	      return this.$store.getters[`${tasks_v2_const.Model.Tasks}/getById`](this.taskId);
	    },
	    filesCount() {
	      return this.task.fileIds.length;
	    },
	    textFormatted() {
	      if (this.filesCount > 0) {
	        return this.loc('TASKS_V2_FILES_COUNT', {
	          '#COUNT#': this.filesCount
	        });
	      }
	      return this.loc('TASKS_V2_FILES_ADD');
	    },
	    isUploading() {
	      return this.files.some(({
	        status
	      }) => [ui_uploader_core.FileStatus.UPLOADING, ui_uploader_core.FileStatus.LOADING].includes(status));
	    },
	    readonly() {
	      return !this.task.rights.edit;
	    }
	  },
	  methods: {
	    handleAddClick() {
	      tasks_v2_provider_service_fileService.fileService.get(this.taskId).browse({
	        bindElement: this.$refs.add.$el
	      });
	    }
	  },
	  template: `
		<div
			class="tasks-field-files"
			:data-task-id="taskId"
			:data-task-field-id="filesMeta.id"
			:data-task-files-count="filesCount"
		>
			<div
				class="tasks-field-files-main"
				data-task-files-open
				@click="$emit('open')"
			>
				<template v-if="isUploading">
					<BIcon class="tasks-field-files-icon" :name="Animated.LOADER_WAIT"/>
					<div class="tasks-field-files-text">{{ loc('TASKS_V2_FILES_LOADING') }}</div>
				</template>
				<template v-else>
					<BIcon class="tasks-field-files-icon" :name="Outline.ATTACH"/>
					<div class="tasks-field-files-text" :class="{ '--add': filesCount === 0 }">
						{{ textFormatted }}
					</div>
				</template>
			</div>
			<BIcon
				v-if="!readonly"
				class="tasks-field-files-add"
				:name="Outline.PLUS_L"
				data-task-files-plus
				ref="add"
				@click="handleAddClick"
			/>
		</div>
	`
	};

	// @vue/component
	const UploadButton = {
	  components: {
	    UiButton: ui_vue3_components_button.Button
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    }
	  },
	  setup() {
	    return {
	      ButtonSize: ui_vue3_components_button.ButtonSize
	    };
	  },
	  methods: {
	    handleClick() {
	      tasks_v2_provider_service_fileService.fileService.get(this.taskId).browse({
	        bindElement: this.$el
	      });
	    }
	  },
	  template: `
		<span data-task-files-upload>
			<UiButton
				:text="loc('TASKS_V2_FILES_UPLOAD')"
				:size="ButtonSize.MEDIUM"
				@click="handleClick"
			/>
		</span>
	`
	};

	// @vue/component
	const FilesSheet = {
	  name: 'TaskFilesSheet',
	  components: {
	    UserFieldWidgetComponent: disk_uploader_userFieldWidget.UserFieldWidgetComponent,
	    UploadButton,
	    BottomSheet: tasks_v2_component_elements_bottomSheet.BottomSheet,
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    },
	    isShown: {
	      type: Boolean,
	      required: true
	    }
	  },
	  emits: ['close'],
	  setup(props) {
	    return {
	      Outline: ui_iconSet_api_core.Outline,
	      uploaderAdapter: tasks_v2_provider_service_fileService.fileService.get(props.taskId).getAdapter()
	    };
	  },
	  data() {
	    return {
	      files: []
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      titleFieldOffsetHeight: `${tasks_v2_const.Model.Interface}/titleFieldOffsetHeight`
	    }),
	    task() {
	      return this.$store.getters[`${tasks_v2_const.Model.Tasks}/getById`](this.taskId);
	    },
	    readonly() {
	      return !this.task.rights.edit;
	    },
	    widgetOptions() {
	      return {
	        isEmbedded: true,
	        withControlPanel: false,
	        canCreateDocuments: false,
	        tileWidgetOptions: {
	          compact: true
	        }
	      };
	    }
	  },
	  watch: {
	    isShown() {
	      if (!this.isShown) {
	        return;
	      }
	      void this.loadFiles();
	    },
	    titleFieldOffsetHeight() {
	      var _this$$refs$bottomShe;
	      (_this$$refs$bottomShe = this.$refs.bottomSheet) == null ? void 0 : _this$$refs$bottomShe.adjustPosition();
	    }
	  },
	  methods: {
	    async loadFiles() {
	      this.files = await tasks_v2_provider_service_fileService.fileService.get(this.taskId).list(this.task.fileIds);
	    }
	  },
	  template: `
		<BottomSheet :isShown="isShown" ref="bottomSheet">
			<div class="tasks-field-files-sheet" :data-task-id="taskId">
				<div class="tasks-field-files-header">
					<div class="tasks-field-files-title">{{ loc('TASKS_V2_FILES_TITLE') }}</div>
					<BIcon :name="Outline.CROSS_L" data-task-files-close @click="$emit('close')"/>
				</div>
				<div class="tasks-field-files-list">
					<UserFieldWidgetComponent :uploaderAdapter="uploaderAdapter" :widgetOptions="widgetOptions"/>
				</div>
				<div class="tasks-field-files-footer" v-if="!readonly">
					<UploadButton :taskId="taskId"/>
				</div>
			</div>
		</BottomSheet>
	`
	};

	// @vue/component
	const FilesPopup = {
	  components: {
	    Popup: ui_vue3_components_popup.Popup,
	    UiButton: ui_vue3_components_button.Button,
	    UserFieldWidgetComponent: disk_uploader_userFieldWidget.UserFieldWidgetComponent
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    },
	    getBindElement: {
	      type: Function,
	      required: true
	    }
	  },
	  emits: ['upload', 'close'],
	  setup(props) {
	    return {
	      ButtonSize: ui_vue3_components_button.ButtonSize,
	      AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
	      ButtonIcon: ui_vue3_components_button.ButtonIcon,
	      uploaderAdapter: tasks_v2_provider_service_fileService.fileService.get(props.taskId).getAdapter()
	    };
	  },
	  data() {
	    return {
	      files: tasks_v2_provider_service_fileService.fileService.get(this.taskId).getFiles()
	    };
	  },
	  computed: {
	    bindElement() {
	      return this.getBindElement();
	    },
	    popupOptions() {
	      return {
	        id: 'tasks-field-files-popup',
	        bindElement: this.bindElement,
	        minWidth: 350,
	        maxHeight: 320,
	        padding: 18,
	        bindOptions: {
	          forceBindPosition: true,
	          forceTop: true,
	          position: 'top'
	        },
	        closeByEsc: true,
	        autoHideHandler: event => {
	          var _this$$refs$popup;
	          const anyTileMenuShown = this.files.some(({
	            isMenuShown
	          }) => isMenuShown);
	          return ((_this$$refs$popup = this.$refs.popup) == null ? void 0 : _this$$refs$popup.autoHideHandler(event)) && !anyTileMenuShown;
	        }
	      };
	    },
	    widgetOptions() {
	      return {
	        isEmbedded: true,
	        withControlPanel: false,
	        canCreateDocuments: false,
	        tileWidgetOptions: {
	          enableDropzone: false,
	          hideDropArea: true,
	          compact: true,
	          autoCollapse: false
	        }
	      };
	    },
	    filesCount() {
	      return this.files.length;
	    }
	  },
	  watch: {
	    filesCount() {
	      if (this.filesCount === 0) {
	        this.closePopup();
	      }
	    }
	  },
	  methods: {
	    handleClearClick() {
	      tasks_v2_provider_service_fileService.fileService.get(this.taskId).getAdapter().getUploader().removeFiles();
	      this.closePopup();
	    },
	    handleUploadClick() {
	      tasks_v2_provider_service_fileService.fileService.get(this.taskId).browseFiles();
	    },
	    handleMyDriveClick() {
	      tasks_v2_provider_service_fileService.fileService.get(this.taskId).browseMyDrive();
	    },
	    closePopup() {
	      this.$emit('close');
	    }
	  },
	  template: `
		<Popup
			:options="popupOptions"
			ref="popup"
			@close="closePopup"
		>
			<div class="tasks-field-files-popup">
				<div class="tasks-field-files-popup-files">
					<UserFieldWidgetComponent :uploaderAdapter="uploaderAdapter" :widgetOptions="widgetOptions"/>
				</div>
				<div class="tasks-field-files-popup-footer">
					<div class="tasks-field-files-popup-add-buttons">
						<UiButton
							:text="loc('TASKS_V2_FILES_UPLOAD_BUTTON')"
							:size="ButtonSize.EXTRA_SMALL"
							:style="AirButtonStyle.TINTED"
							:leftIcon="ButtonIcon.DOWNLOAD"
							@click="handleUploadClick"
						/>
						<UiButton
							:text="loc('TASKS_V2_FILES_MY_DRIVE')"
							:size="ButtonSize.EXTRA_SMALL"
							:style="AirButtonStyle.TINTED"
							:leftIcon="ButtonIcon.CLOUD"
							@click="handleMyDriveClick"
						/>
					</div>
					<UiButton
						:text="loc('TASKS_V2_FILES_CLEAR')"
						:size="ButtonSize.EXTRA_SMALL"
						:style="AirButtonStyle.PLAIN_NO_ACCENT"
						:leftIcon="ButtonIcon.REMOVE"
						@click="handleClearClick"
					/>
				</div>
			</div>
		</Popup>
	`
	};

	// @vue/component
	const FilesChip = {
	  components: {
	    Chip: tasks_v2_component_elements_chip.Chip,
	    FilesPopup
	  },
	  inject: ['analytics', 'cardType'],
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
	  setup(props) {
	    return {
	      filesMeta,
	      fileService: tasks_v2_provider_service_fileService.fileService.get(props.taskId)
	    };
	  },
	  data() {
	    return {
	      files: this.fileService.getFiles(),
	      isPopupShown: false,
	      isPopupShownWithFiles: false
	    };
	  },
	  computed: {
	    task() {
	      return this.$store.getters[`${tasks_v2_const.Model.Tasks}/getById`](this.taskId);
	    },
	    group() {
	      return this.$store.getters[`${tasks_v2_const.Model.Groups}/getById`](this.task.groupId);
	    },
	    filesCount() {
	      return this.task.fileIds.length;
	    },
	    design() {
	      return {
	        [!this.isAutonomous && !this.isSelected]: tasks_v2_component_elements_chip.ChipDesign.Shadow,
	        [!this.isAutonomous && this.isSelected]: tasks_v2_component_elements_chip.ChipDesign.ShadowAccent,
	        [this.isAutonomous && !this.isSelected]: tasks_v2_component_elements_chip.ChipDesign.Outline,
	        [this.isAutonomous && this.isSelected]: tasks_v2_component_elements_chip.ChipDesign.OutlineAccent,
	        [this.hasError]: tasks_v2_component_elements_chip.ChipDesign.OutlineAlert
	      }.true;
	    },
	    isSelected() {
	      if (this.isAutonomous) {
	        return this.files.length > 0;
	      }
	      const wasFilesFilled = this.$store.getters[`${tasks_v2_const.Model.Tasks}/wasFieldFilled`](this.taskId, filesMeta.id);
	      return wasFilesFilled || this.files.length > 0;
	    },
	    icon() {
	      if (this.isAutonomous && this.isUploading) {
	        return ui_iconSet_api_core.Animated.LOADER_WAIT;
	      }
	      return ui_iconSet_api_core.Outline.ATTACH;
	    },
	    text() {
	      if (this.isAutonomous && this.filesCount > 0) {
	        return this.loc('TASKS_V2_FILES_COUNT', {
	          '#COUNT#': this.filesCount
	        });
	      }
	      return filesMeta.title;
	    },
	    isUploading() {
	      return this.fileService.isUploading();
	    },
	    hasError() {
	      return this.files.some(({
	        status
	      }) => [ui_uploader_core.FileStatus.UPLOAD_FAILED, ui_uploader_core.FileStatus.LOAD_FAILED].includes(status));
	    },
	    readonly() {
	      return !this.task.rights.edit;
	    },
	    popupHasAlreadyBeenShown() {
	      return this.filesCount > 0 && this.isPopupShownWithFiles;
	    }
	  },
	  mounted() {
	    this.fileService.subscribe('onFileAdd', this.handleFileAdd);
	    this.fileService.subscribe('onFileComplete', this.handleFileComplete);
	  },
	  beforeUnmount() {
	    this.fileService.unsubscribe('onFileAdd', this.handleFileAdd);
	    this.fileService.unsubscribe('onFileComplete', this.handleFileComplete);
	  },
	  methods: {
	    handleFileAdd() {
	      if (this.isAutonomous && this.popupHasAlreadyBeenShown) {
	        this.showPopup();
	      }
	    },
	    handleFileComplete(event) {
	      this.sendAnalytics(event.getData());
	    },
	    sendAnalytics(file) {
	      var _this$group;
	      tasks_v2_lib_analytics.analytics.sendAttachFile(this.analytics, {
	        cardType: this.cardType,
	        collabId: ((_this$group = this.group) == null ? void 0 : _this$group.type) === tasks_v2_const.GroupType.Collab ? this.group.id : null,
	        fileOrigin: file.origin,
	        fileSize: file.size,
	        fileExtension: file.extension,
	        filesCount: this.filesCount
	      });
	    },
	    handleClick() {
	      if (!this.isAutonomous && this.isSelected) {
	        this.highlightField();
	        return;
	      }
	      if (this.files.length > 0) {
	        this.isPopupShownWithFiles = true;
	        this.showPopup();
	      } else {
	        this.browseFiles();
	      }
	    },
	    showPopup() {
	      this.isPopupShown = true;
	    },
	    closePopup() {
	      this.isPopupShown = false;
	      if (!this.filesCount) {
	        this.isPopupShownWithFiles = false;
	      }
	    },
	    browseFiles() {
	      this.fileService.browse({
	        bindElement: this.$refs.chip.$el,
	        onHideCallback: this.onFileBrowserClose
	      });
	    },
	    highlightField() {
	      void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(filesMeta.id);
	    },
	    onFileBrowserClose() {
	      var _this$$refs$chip;
	      (_this$$refs$chip = this.$refs.chip) == null ? void 0 : _this$$refs$chip.focus();
	    }
	  },
	  template: `
		<Chip
			v-if="isSelected || !readonly"
			:design="design"
			:icon="icon"
			:text="text"
			:data-task-id="taskId"
			:data-task-chip-id="filesMeta.id"
			ref="chip"
			@click="handleClick"
		/>
		<FilesPopup
			v-if="isPopupShown"
			:taskId="taskId"
			:getBindElement="() => $refs.chip.$el"
			@upload="browseFiles"
			@close="closePopup"
		/>
	`
	};

	exports.Files = Files;
	exports.FilesSheet = FilesSheet;
	exports.FilesChip = FilesChip;
	exports.filesMeta = filesMeta;

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX,BX.Vue3.Vuex,BX.UI.IconSet,BX.Tasks.V2.Component.Elements,BX.UI.Uploader,BX.UI.IconSet,BX,BX,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Const,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.UI.Vue3.Components,BX.Vue3.Components,BX.Disk.Uploader,BX.Tasks.V2.Provider.Service));
//# sourceMappingURL=files.bundle.js.map
