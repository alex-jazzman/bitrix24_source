/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,main_core,main_core_events,ui_vue3,ui_uploader_core,ui_lexical_core,tasks_v2_core,tasks_v2_const,ui_textEditor,tasks_v2_provider_service_fileService,tasks_v2_component_elements_userFieldWidgetComponent,ui_bbcode_formatter_htmlFormatter,ui_iconSet_api_vue,ui_iconSet_outline,ui_system_typography_vue) {
	'use strict';

	const DefaultEditorOptions = Object.freeze({
	  toolbar: [],
	  floatingToolbar: ['bold', 'italic', 'underline', 'strikethrough', '|', 'numbered-list', 'bulleted-list', '|', 'link', 'spoiler', 'quote', 'code', 'copilot'],
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
	  copilot: {},
	  paragraphPlaceholder: 'auto'
	});

	const EntityTextTypes = Object.freeze({
	  Task: 'task',
	  Result: 'result'
	});
	var _editor = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("editor");
	var _fileService = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("fileService");
	var _uploaderAdapter = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("uploaderAdapter");
	var _syncHighlightsDebounced = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("syncHighlightsDebounced");
	var _entityId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("entityId");
	var _entityType = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("entityType");
	var _subscribeToEvents = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("subscribeToEvents");
	var _unsubscribeToEvents = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("unsubscribeToEvents");
	var _registerCommands = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerCommands");
	var _syncHighlights = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("syncHighlights");
	var _getCopilotParams = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getCopilotParams");
	class EntityTextEditor extends main_core_events.EventEmitter {
	  constructor(entityId, entityType = EntityTextTypes.Task, options = {}) {
	    super();
	    Object.defineProperty(this, _getCopilotParams, {
	      value: _getCopilotParams2
	    });
	    Object.defineProperty(this, _syncHighlights, {
	      value: _syncHighlights2
	    });
	    Object.defineProperty(this, _registerCommands, {
	      value: _registerCommands2
	    });
	    Object.defineProperty(this, _unsubscribeToEvents, {
	      value: _unsubscribeToEvents2
	    });
	    Object.defineProperty(this, _subscribeToEvents, {
	      value: _subscribeToEvents2
	    });
	    Object.defineProperty(this, _editor, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _fileService, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _uploaderAdapter, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _syncHighlightsDebounced, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _entityId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _entityType, {
	      writable: true,
	      value: void 0
	    });
	    this.handleEditorChange = () => {
	      babelHelpers.classPrivateFieldLooseBase(this, _syncHighlightsDebounced)[_syncHighlightsDebounced]();
	      this.emit('editorChanged');
	    };
	    this.handleEditorBlur = () => {
	      if (this.isTabHidden) {
	        return;
	      }
	      this.emit('editorBlurred');
	    };
	    this.onFileComplete = event => {
	      const file = event.getData();
	      babelHelpers.classPrivateFieldLooseBase(this, _editor)[_editor].dispatchCommand(ui_textEditor.Plugins.File.ADD_FILE_COMMAND, file);
	    };
	    this.onFileRemove = event => {
	      const {
	        file
	      } = event.getData();
	      this.handleRemoveFile(file.serverFileId);
	    };
	    this.onVisibilityChange = () => {
	      this.isTabHidden = document.hidden;
	    };
	    this.setEventNamespace('Tasks.V2.Component.Entity-Text-Editor');
	    this.setEntityId(entityId, entityType);
	    this.initService(entityId, entityType);
	    this.initEditor(options);
	    babelHelpers.classPrivateFieldLooseBase(this, _subscribeToEvents)[_subscribeToEvents]();
	    babelHelpers.classPrivateFieldLooseBase(this, _registerCommands)[_registerCommands]();
	    babelHelpers.classPrivateFieldLooseBase(this, _syncHighlightsDebounced)[_syncHighlightsDebounced] = main_core.Runtime.debounce(babelHelpers.classPrivateFieldLooseBase(this, _syncHighlights)[_syncHighlights], 500, this);
	    this.isTabHidden = false;
	  }
	  setEntityId(entityId, entityType) {
	    babelHelpers.classPrivateFieldLooseBase(this, _entityId)[_entityId] = entityId;
	    babelHelpers.classPrivateFieldLooseBase(this, _entityType)[_entityType] = entityType;
	  }
	  getEditor() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _editor)[_editor];
	  }
	  getEntityId() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _entityId)[_entityId];
	  }
	  getEntityType() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _entityType)[_entityType];
	  }
	  initService(entityId, entityType) {
	    babelHelpers.classPrivateFieldLooseBase(this, _fileService)[_fileService] = tasks_v2_provider_service_fileService.fileService.get(entityId, entityType);
	    babelHelpers.classPrivateFieldLooseBase(this, _uploaderAdapter)[_uploaderAdapter] = babelHelpers.classPrivateFieldLooseBase(this, _fileService)[_fileService].getAdapter();
	  }
	  initEditor(options) {
	    var _options$content, _options$blockSpaceIn;
	    const content = (_options$content = options.content) != null ? _options$content : null;
	    const restrictions = tasks_v2_core.Core.getParams().restrictions;
	    const additionalEditorOptions = {
	      content,
	      minHeight: 118,
	      placeholder: main_core.Loc.getMessage('TASKS_V2_CHANGE_DESCRIPTION'),
	      newLineMode: 'paragraph',
	      events: {
	        onChange: this.handleEditorChange,
	        onBlur: this.handleEditorBlur
	      },
	      file: {
	        mode: tasks_v2_core.Core.getParams().features.disk ? 'disk' : 'file',
	        files: this.getFiles()
	      },
	      visualOptions: {
	        borderWidth: 0,
	        blockSpaceInline: (_options$blockSpaceIn = options == null ? void 0 : options.blockSpaceInline) != null ? _options$blockSpaceIn : 'var(--ui-space-stack-md2)',
	        colorBackground: 'transparent'
	      },
	      mention: {
	        dialogOptions: {
	          width: 565,
	          entities: [{
	            id: tasks_v2_const.EntitySelectorEntity.User,
	            options: {
	              emailUsers: true,
	              inviteGuestLink: true,
	              lockGuestLink: !restrictions.mailUserIntegration.available,
	              lockGuestLinkFeatureId: restrictions.mailUserIntegration.featureId
	            }
	          }, {
	            id: tasks_v2_const.EntitySelectorEntity.Department
	          }]
	        }
	      },
	      removePlugins: [],
	      copilot: babelHelpers.classPrivateFieldLooseBase(this, _getCopilotParams)[_getCopilotParams]()
	    };
	    babelHelpers.classPrivateFieldLooseBase(this, _editor)[_editor] = new ui_textEditor.TextEditor({
	      ...DefaultEditorOptions,
	      ...additionalEditorOptions
	    });
	  }
	  setEditorText(content) {
	    babelHelpers.classPrivateFieldLooseBase(this, _editor)[_editor].setText(content);
	  }
	  getFiles() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _uploaderAdapter)[_uploaderAdapter].getItems();
	  }
	  destroy() {
	    var _babelHelpers$classPr;
	    babelHelpers.classPrivateFieldLooseBase(this, _unsubscribeToEvents)[_unsubscribeToEvents]();
	    (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _editor)[_editor]) == null ? void 0 : _babelHelpers$classPr.destroy();
	    babelHelpers.classPrivateFieldLooseBase(this, _editor)[_editor] = null;
	  }
	  handleRemoveFile(serverFileId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _editor)[_editor].dispatchCommand(ui_textEditor.Plugins.File.REMOVE_FILE_COMMAND, {
	      serverFileId,
	      skipHistoryStack: true
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _syncHighlightsDebounced)[_syncHighlightsDebounced]();
	  }
	  insertFile(fileInfo) {
	    babelHelpers.classPrivateFieldLooseBase(this, _editor)[_editor].dispatchCommand(ui_textEditor.Plugins.File.INSERT_FILE_COMMAND, {
	      serverFileId: fileInfo.serverFileId,
	      width: 600,
	      height: 600,
	      info: ui_vue3.toRaw(fileInfo)
	    });
	  }
	  get $store() {
	    return tasks_v2_core.Core.getStore();
	  }
	}
	function _subscribeToEvents2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _fileService)[_fileService].subscribe('onFileComplete', this.onFileComplete);
	  babelHelpers.classPrivateFieldLooseBase(this, _fileService)[_fileService].subscribe('onFileRemove', this.onFileRemove);
	  main_core.Event.bind(document, 'visibilitychange', this.onVisibilityChange);
	}
	function _unsubscribeToEvents2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _fileService)[_fileService].unsubscribe('onFileComplete', this.onFileComplete);
	  babelHelpers.classPrivateFieldLooseBase(this, _fileService)[_fileService].unsubscribe('onFileRemove', this.onFileRemove);
	  main_core.Event.unbind(document, 'visibilitychange', this.onVisibilityChange);
	}
	function _registerCommands2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _editor)[_editor].registerCommand(ui_lexical_core.PASTE_COMMAND, clipboardEvent => {
	    const clipboardData = clipboardEvent.clipboardData;
	    if (!clipboardData || !ui_uploader_core.isFilePasted(clipboardData)) {
	      return false;
	    }
	    clipboardEvent.preventDefault();
	    ui_uploader_core.getFilesFromDataTransfer(clipboardData).then(files => {
	      files.forEach(file => {
	        babelHelpers.classPrivateFieldLooseBase(this, _uploaderAdapter)[_uploaderAdapter].getUploader().addFile(file, {
	          events: {
	            [ui_uploader_core.FileEvent.LOAD_ERROR]: () => {},
	            [ui_uploader_core.FileEvent.UPLOAD_ERROR]: () => {},
	            [ui_uploader_core.FileEvent.UPLOAD_COMPLETE]: event => {
	              const uploaderFile = event.getTarget();
	              this.insertFile(uploaderFile.toJSON());
	            }
	          }
	        });
	      });
	    }).catch(() => {
	      console.error('clipboard pasting error');
	    });
	    return true;
	  }, ui_lexical_core.COMMAND_PRIORITY_NORMAL);
	}
	function _syncHighlights2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _editor)[_editor]) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _editor)[_editor].dispatchCommand(ui_textEditor.Plugins.File.GET_INSERTED_FILES_COMMAND, nodes => {
	    const inserted = new Set();
	    for (const node of nodes) {
	      const {
	        serverFileId
	      } = node.getInfo();
	      if (main_core.Type.isStringFilled(serverFileId) || main_core.Type.isNumber(serverFileId)) {
	        inserted.add(serverFileId);
	      }
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _uploaderAdapter)[_uploaderAdapter].getUploader().getFiles().forEach(file => {
	      if (inserted.has(file.getServerFileId())) {
	        file.setCustomData('tileSelected', true);
	        inserted.delete(file.getServerFileId());
	      } else {
	        file.setCustomData('tileSelected', false);
	      }
	    });
	    for (const serverFileId of inserted) {
	      this.handleRemoveFile(serverFileId);
	    }
	  });
	}
	function _getCopilotParams2() {
	  if (tasks_v2_core.Core.getParams().features.isCopilotEnabled) {
	    switch (babelHelpers.classPrivateFieldLooseBase(this, _entityType)[_entityType]) {
	      case EntityTextTypes.Task:
	        return {
	          copilotOptions: {
	            moduleId: 'tasks',
	            category: 'tasks',
	            contextId: `tasks_${babelHelpers.classPrivateFieldLooseBase(this, _entityId)[_entityId]}`,
	            menuForceTop: false
	          },
	          triggerBySpace: true
	        };
	      case EntityTextTypes.Result:
	        return {
	          copilotOptions: {
	            moduleId: 'tasks',
	            category: 'system',
	            contextId: `tasks_result_${babelHelpers.classPrivateFieldLooseBase(this, _entityId)[_entityId]}`,
	            menuForceTop: false
	          },
	          triggerBySpace: true
	        };
	      default:
	        return {};
	    }
	  }
	  return {};
	}
	const instances = {};
	function getKey(entityId, entityType) {
	  return `${entityType}:${entityId}`;
	}
	const entityTextEditor = {
	  get(entityId, entityType = EntityTextTypes.Task, options = {}) {
	    var _instances$key;
	    const key = getKey(entityId, entityType);
	    (_instances$key = instances[key]) != null ? _instances$key : instances[key] = new EntityTextEditor(entityId, entityType, options);
	    if (main_core.Type.isStringFilled(options == null ? void 0 : options.content)) {
	      instances[key].setEditorText(options.content);
	    }
	    return instances[key];
	  },
	  replace(tempId, entityId, entityType = EntityTextTypes.Task) {
	    var _instances$newKey, _instances$newKey2;
	    const oldKey = getKey(tempId, entityType);
	    const newKey = getKey(entityId, entityType);
	    instances[newKey] = instances[oldKey];
	    (_instances$newKey = instances[newKey]) == null ? void 0 : _instances$newKey.setEntityId(entityId, entityType);
	    (_instances$newKey2 = instances[newKey]) == null ? void 0 : _instances$newKey2.initService(entityId, entityType);
	    delete instances[oldKey];
	  },
	  delete(entityId, entityType = EntityTextTypes.Task) {
	    var _instances$key2;
	    const key = getKey(entityId, entityType);
	    (_instances$key2 = instances[key]) == null ? void 0 : _instances$key2.destroy();
	    delete instances[key];
	  }
	};

	// @vue/component
	const EntityTextArea = {
	  components: {
	    TextEditorComponent: ui_textEditor.TextEditorComponent,
	    UserFieldWidgetComponent: tasks_v2_component_elements_userFieldWidgetComponent.DiskUserFieldWidgetComponent
	  },
	  props: {
	    entityId: {
	      type: [Number, String],
	      required: true
	    },
	    entityType: {
	      type: String,
	      default: EntityTextTypes.Task,
	      validator: value => Object.values(EntityTextTypes).includes(value)
	    },
	    readonly: {
	      type: Boolean,
	      default: false
	    },
	    removeFromServer: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['change', 'blur', 'filesChange'],
	  setup(props) {
	    return {
	      /** @type TextEditor */
	      editor: null,
	      entityTextEditor: entityTextEditor.get(props.entityId, props.entityType),
	      fileService: tasks_v2_provider_service_fileService.fileService.get(props.entityId, props.entityType),
	      uploaderAdapter: tasks_v2_provider_service_fileService.fileService.get(props.entityId, props.entityType).getAdapter()
	    };
	  },
	  data() {
	    return {
	      files: this.fileService.getFiles()
	    };
	  },
	  computed: {
	    widgetOptions() {
	      return {
	        isEmbedded: true,
	        withControlPanel: false,
	        canCreateDocuments: false,
	        insertIntoText: true,
	        tileWidgetOptions: {
	          compact: true,
	          hideDropArea: true,
	          readonly: this.readonly,
	          autoCollapse: false,
	          removeFromServer: this.removeFromServer,
	          events: {
	            onInsertIntoText: this.handleInsertFile
	          }
	        }
	      };
	    },
	    filesCount() {
	      return this.files.length;
	    }
	  },
	  created() {
	    this.editor = this.entityTextEditor.getEditor();
	  },
	  mounted() {
	    this.fileService.subscribe('onFileAdd', this.onFileAdd);
	    this.fileService.subscribe('onFileRemove', this.onFileRemove);
	    this.entityTextEditor.subscribe('editorChanged', this.onEditorChange);
	    this.entityTextEditor.subscribe('editorBlurred', this.onEditorBlur);
	  },
	  unmounted() {
	    this.fileService.unsubscribe('onFileAdd', this.onFileAdd);
	    this.fileService.unsubscribe('onFileRemove', this.onFileRemove);
	    this.entityTextEditor.unsubscribe('editorChanged', this.onEditorChange);
	    this.entityTextEditor.unsubscribe('editorBlurred', this.onEditorBlur);
	  },
	  methods: {
	    onFileAdd() {
	      this.$emit('filesChange');
	    },
	    onFileRemove() {
	      this.$emit('filesChange');
	    },
	    onEditorChange() {
	      this.$emit('change');
	    },
	    onEditorBlur() {
	      this.$emit('blur');
	    },
	    handleInsertFile(event) {
	      const fileInfo = event.getData().item;
	      this.entityTextEditor.insertFile(fileInfo);
	    }
	  },
	  template: `
		<div class="tasks-entity-text-area-wrapper" ref="editorWrapper">
			<TextEditorComponent :editorInstance="editor">
				<template v-if="filesCount > 0" #footer>
					<div class="tasks-entity-text-area-files" ref="filesWrapper">
						<UserFieldWidgetComponent :uploaderAdapter :widgetOptions/>
					</div>
				</template>
			</TextEditorComponent>
		</div>
	`
	};

	// @vue/component
	const EditButton = {
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    TextMd: ui_system_typography_vue.TextMd
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  template: `
		<div class="tasks-card-entity-collapsible-edit-button">
			<BIcon
				class="tasks-card-entity-collapsible-edit-button-icon"
				:name="Outline.EDIT_L"
				:size="20"
			/>
			<TextMd className="tasks-card-entity-collapsible-edit-button-text">
				{{ loc('TASKS_V2_ENTITY_TEXT_EDIT') }}
			</TextMd>
		</div>
	`
	};

	// @vue/component
	const ExpandButton = {
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    TextMd: ui_system_typography_vue.TextMd
	  },
	  props: {
	    showFilesIndicator: {
	      type: Boolean,
	      default: false
	    },
	    filesCount: {
	      type: Number,
	      default: 0
	    }
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  template: `
		<div class="tasks-card-entity-collapsible-collapse-button">
			<span
				v-if="showFilesIndicator && filesCount"
				class="tasks-card-entity-collapsible-collapse-button-files"
			>
				<BIcon
					:name="Outline.ATTACH"
					:size="20"
					class="tasks-card-entity-collapsible-collapse-button-icon"
				/>
				<TextMd className="tasks-card-entity-collapsible-collapse-button-text">
					{{ filesCount }}
				</TextMd>
			</span>
			<TextMd className="tasks-card-entity-collapsible-collapse-button-text">
				{{ loc('TASKS_V2_ENTITY_TEXT_EXPAND') }}
			</TextMd>
		</div>
	`
	};

	// @vue/component
	const CollapseButton = {
	  components: {
	    TextMd: ui_system_typography_vue.TextMd
	  },
	  template: `
		<div class="tasks-card-entity-collapsible-collapse-button">
			<TextMd className="tasks-card-entity-collapsible-collapse-button-text">
				{{ loc('TASKS_V2_ENTITY_TEXT_COLLAPSE') }}
			</TextMd>
		</div>
	`
	};

	// @vue/component
	const EntityCollapsibleText = {
	  components: {
	    HtmlFormatterComponent: ui_bbcode_formatter_htmlFormatter.HtmlFormatterComponent,
	    BIcon: ui_iconSet_api_vue.BIcon,
	    TextMd: ui_system_typography_vue.TextMd,
	    EditButton,
	    ExpandButton,
	    CollapseButton
	  },
	  props: {
	    content: {
	      type: String,
	      required: true
	    },
	    files: {
	      type: Array,
	      required: true
	    },
	    readonly: {
	      type: Boolean,
	      default: false
	    },
	    openByDefault: {
	      type: Boolean,
	      default: false
	    },
	    opened: {
	      type: Boolean,
	      default: false
	    },
	    showFilesIndicator: {
	      type: Boolean,
	      default: true
	    },
	    maxHeight: {
	      type: Number,
	      default: 200
	    }
	  },
	  emits: ['editButtonClick', 'update:opened'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  data() {
	    return {
	      isOverflowing: false,
	      isMouseDown: false,
	      selectionMade: false
	    };
	  },
	  computed: {
	    filesCount() {
	      return this.files.length;
	    },
	    hasFiles() {
	      return this.filesCount > 0;
	    },
	    hasContent() {
	      return this.content.length > 0;
	    },
	    hidden() {
	      if (this.opened) {
	        return false;
	      }
	      if (this.showFilesIndicator) {
	        return this.filesCount || this.isOverflowing;
	      }
	      return this.isOverflowing;
	    },
	    showCollapseButton() {
	      return this.opened && !this.openByDefault;
	    },
	    showEditButton() {
	      return !this.readonly;
	    },
	    showFooter() {
	      return this.hidden || this.showEditButton || this.showCollapseButton;
	    }
	  },
	  watch: {
	    async content() {
	      await this.$nextTick();
	      this.updateIsOverflowing();
	    }
	  },
	  async mounted() {
	    await this.$nextTick();
	    this.updateIsOverflowing();
	    if (this.openByDefault) {
	      this.setPreviewShown(true);
	    }
	  },
	  methods: {
	    updateIsOverflowing() {
	      if (this.openByDefault || !this.$refs.htmlFormatter || !this.$refs.preview) {
	        return;
	      }
	      const previewOffsetHeight = this.$refs.preview.offsetHeight;
	      const htmlFormatterOffsetHeight = this.$refs.htmlFormatter.$el.offsetHeight;
	      const offsetParam = this.opened ? 32 : 20;
	      const fitsWithinPreview = previewOffsetHeight - offsetParam <= htmlFormatterOffsetHeight;
	      const exceedsMaxHeight = htmlFormatterOffsetHeight > this.maxHeight;
	      this.isOverflowing = fitsWithinPreview && (!this.opened || exceedsMaxHeight);
	      if (!this.isOverflowing && this.showCollapseButton) {
	        this.setPreviewShown(false);
	      }
	    },
	    onPreviewClick() {
	      if (this.hidden) {
	        this.setPreviewShown(true);
	      }
	    },
	    setPreviewShown(isShown) {
	      this.$emit('update:opened', isShown);
	    },
	    onMouseDown(event) {
	      if (this.opened) {
	        return;
	      }
	      if (event.button === 0) {
	        this.isMouseDown = true;
	        this.selectionMade = false;
	      }
	    },
	    onMouseMove() {
	      if (this.selectionMade || this.opened) {
	        return;
	      }
	      if (this.isMouseDown) {
	        const selection = window.getSelection();
	        if (selection.toString().length > 0) {
	          this.selectionMade = true;
	        }
	      }
	    },
	    onMouseUp(event) {
	      if (this.opened) {
	        return;
	      }
	      this.isMouseDown = false;
	      if (!this.selectionMade) {
	        const target = event.target;
	        const isLinkClick = target.tagName === 'A' || target.closest('a');
	        if (!isLinkClick) {
	          this.onPreviewClick();
	        }
	      }
	    }
	  },
	  template: `
		<div
			v-if="hasContent"
			class="tasks-card-entity-collapsible-text"
			:class="{ '--disable-animation': openByDefault }"
			:style="{ 'maxHeight': opened ? 'none' : maxHeight + 'px' }"
			ref="preview"
		>
			<HtmlFormatterComponent
				:bbcode="content"
				:options="{ fileMode: 'disk' }"
				:formatData="{ files }"
				ref="htmlFormatter"
				@mousedown="onMouseDown"
				@mousemove="onMouseMove"
				@mouseup="onMouseUp"
			/>
			<template v-if="hidden && isOverflowing">
				<div class="tasks-card-entity-collapsible-shadow">
					<div class="tasks-card-entity-collapsible-shadow-white-bottom"/>
				</div>
			</template>
		</div>
		<slot/>
		<div
			v-if="showFooter"
			class="tasks-card-entity-collapsible-footer"
			:class="{
				'--empty-content': !hasContent && hidden,
				'--without-padding': !showFilesIndicator && hasFiles,
				'--with-edit-button': showEditButton,
			}"
		>
			<EditButton v-if="showEditButton" @click="$emit('editButtonClick')"/>
			<ExpandButton v-if="hidden" :showFilesIndicator :filesCount @click="onPreviewClick"/>
			<CollapseButton v-if="showCollapseButton" @click="setPreviewShown(false)"/>
		</div>
	`
	};

	exports.entityTextEditor = entityTextEditor;
	exports.EntityTextTypes = EntityTextTypes;
	exports.EntityTextArea = EntityTextArea;
	exports.EntityCollapsibleText = EntityCollapsibleText;
	exports.DefaultEditorOptions = DefaultEditorOptions;

}((this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {}),BX,BX.Event,BX.Vue3,BX.UI.Uploader,BX.UI.Lexical.Core,BX.Tasks.V2,BX.Tasks.V2.Const,BX.UI.TextEditor,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Component.Elements,BX.UI.BBCode.Formatter,BX.UI.IconSet,BX,BX.UI.System.Typography.Vue));
//# sourceMappingURL=entity-text.bundle.js.map
