/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,ui_vue3,ui_uploader_core,tasks_v2_const,main_core,main_core_events,ui_lexical_core,tasks_v2_provider_service_fileService,tasks_v2_component_elements_userFieldWidgetComponent,ui_bbcode_formatter_htmlFormatter,ui_system_typography_vue,ui_vue3_directives_hint,tasks_v2_component_elements_hint,tasks_v2_core,ui_system_menu_vue,ui_iconSet_outline,ui_iconSet_editor,ui_textEditor,ui_iconSet_api_vue,ui_lexical_list) {
	'use strict';

	const CHECK_LIST_BUTTON = 'tasks-check-list-button';
	var _eventEmitter = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("eventEmitter");
	class CheckListPlugin extends ui_textEditor.BasePlugin {
	  constructor(editor) {
	    super(editor);
	    Object.defineProperty(this, _eventEmitter, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _eventEmitter)[_eventEmitter] = new main_core_events.EventEmitter();
	    babelHelpers.classPrivateFieldLooseBase(this, _eventEmitter)[_eventEmitter].setEventNamespace('Tasks.V2.Component.EntityTextEditor.CheckListPlugin');
	    this.getEditor().getComponentRegistry().register(CHECK_LIST_BUTTON, () => {
	      const button = new ui_textEditor.Button();
	      button.setContent('<div class="ui-icon-set --o-move-to-checklist"></div>');
	      button.setTooltip(main_core.Loc.getMessage('TASKS_V2_ENTITY_TEXT_PLUGIN_TITLE_CHECK_LIST'));
	      button.subscribe('onClick', () => {
	        this.getEditor().update(() => {
	          const selection = ui_lexical_core.$getSelection() || ui_lexical_core.$getPreviousSelection();
	          if (ui_lexical_core.$isRangeSelection(selection)) {
	            babelHelpers.classPrivateFieldLooseBase(this, _eventEmitter)[_eventEmitter].emit('checkListButtonClick', selection.getTextContent());
	            this.getEditor().blur();
	            this.getEditor().dispatchCommand(ui_textEditor.Commands.HIDE_DIALOG_COMMAND);
	          }
	        });
	      });
	      return button;
	    });
	  }
	  static getName() {
	    return 'TasksCheckList';
	  }
	  getEmitter() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _eventEmitter)[_eventEmitter];
	  }
	}

	const DefaultEditorOptions = Object.freeze({
	  toolbar: [],
	  floatingToolbar: ['bold', 'italic', 'underline', 'strikethrough', '|', 'numbered-list', 'bulleted-list', '|', CHECK_LIST_BUTTON, 'link', 'spoiler', 'quote', 'code', 'copilot'],
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
	    this.handleClickInCheckList = baseEvent => {
	      const selectionText = baseEvent.getData();
	      this.emit('addCheckList', selectionText);
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
	      extraPlugins: [CheckListPlugin],
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
	  const checkListPlugin = babelHelpers.classPrivateFieldLooseBase(this, _editor)[_editor].getPlugin(CheckListPlugin.getName());
	  checkListPlugin.getEmitter().subscribe('checkListButtonClick', this.handleClickInCheckList);
	  babelHelpers.classPrivateFieldLooseBase(this, _fileService)[_fileService].subscribe('onFileComplete', this.onFileComplete);
	  babelHelpers.classPrivateFieldLooseBase(this, _fileService)[_fileService].subscribe('onFileRemove', this.onFileRemove);
	  main_core.Event.bind(document, 'visibilitychange', this.onVisibilityChange);
	}
	function _unsubscribeToEvents2() {
	  const checkListPlugin = babelHelpers.classPrivateFieldLooseBase(this, _editor)[_editor].getPlugin(CheckListPlugin.getName());
	  checkListPlugin.getEmitter().unsubscribe('checkListButtonClick', this.handleClickInCheckList);
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
	          enableDropzone: false,
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
	      isOverflowChecked: false,
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
	    },
	    maxHeightStyle() {
	      if (this.isOverflowChecked && !this.isOverflowing) {
	        return 'none';
	      }
	      return this.opened ? 'none' : `${this.maxHeight}px`;
	    }
	  },
	  watch: {
	    async content() {
	      this.isOverflowChecked = false;
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
	      this.isOverflowChecked = true;
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
			class="tasks-card-entity-collapsible-text print-fit-height"
			:class="{ '--disable-animation': openByDefault }"
			:style="{ 'maxHeight': maxHeightStyle }"
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
				<div class="tasks-card-entity-collapsible-shadow print-ignore">
					<div class="tasks-card-entity-collapsible-shadow-white-bottom"/>
				</div>
			</template>
		</div>
		<slot/>
		<div
			v-if="showFooter"
			class="tasks-card-entity-collapsible-footer print-ignore"
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

	// @vue/component
	const ActionButton = {
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    TextSm: ui_system_typography_vue.TextSm
	  },
	  directives: {
	    hint: ui_vue3_directives_hint.hint
	  },
	  props: {
	    title: {
	      type: String,
	      default: ''
	    },
	    copilotText: {
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
	    },
	    iconSize: {
	      type: Number,
	      default: null
	    }
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  computed: {
	    showTooltip() {
	      return this.title.length > 0;
	    },
	    tooltip() {
	      return () => tasks_v2_component_elements_hint.tooltip({
	        text: this.title,
	        popupOptions: {
	          offsetLeft: this.$el.offsetWidth / 2
	        }
	      });
	    }
	  },
	  template: `
		<div
			class="tasks-card-entity-text-action-button-container"
			v-hint="showTooltip ? tooltip : null"
		>
			<button class="tasks-card-entity-text-action-button" type="button">
				<BIcon
					:name="iconName"
					:color="iconColor"
					:size="iconSize"
					hoverable
					class="tasks-card-entity-text-action-button-icon"
				/>
			</button>
			<TextSm
				v-if="copilotText"
				class="tasks-card-entity-text-action-button-text-copilot"
			>
				{{ copilotText }}
			</TextSm>
		</div>
	`
	};

	// @vue/component
	const CopilotButton = {
	  name: 'EditorActionCopilot',
	  components: {
	    ActionButton,
	    Outline: ui_iconSet_api_vue.Outline
	  },
	  props: {
	    editor: {
	      type: Object,
	      required: true
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
	    copilotText() {
	      return tasks_v2_core.Core.getParams().copilotName;
	    }
	  },
	  methods: {
	    handleClick() {
	      this.editor.focus(() => {
	        this.editor.dispatchCommand(ui_textEditor.Plugins.Copilot.INSERT_COPILOT_DIALOG_COMMAND);
	      }, {
	        defaultSelection: 'rootEnd'
	      });
	    }
	  },
	  template: `
		<ActionButton
			:iconName="Outline.COPILOT"
			:iconColor="buttonColor"
			:copilotText
			@click="handleClick"
		/>
	`
	};

	// @vue/component
	const MoreButton = {
	  components: {
	    ActionButton,
	    BIcon: ui_iconSet_api_vue.BIcon,
	    BMenu: ui_system_menu_vue.BMenu
	  },
	  props: {
	    editor: {
	      type: Object,
	      required: true
	    }
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline,
	      Editor: ui_iconSet_api_vue.Editor
	    };
	  },
	  data() {
	    return {
	      isMenuShown: false
	    };
	  },
	  computed: {
	    menuOptions() {
	      return {
	        id: 'tasks-entity-text-more-actions-menu',
	        bindElement: this.$refs.actionButton.$el,
	        offsetTop: 8,
	        items: this.menuItems,
	        targetContainer: document.body
	      };
	    },
	    menuItems() {
	      return [{
	        title: this.loc('TASKS_V2_ENTITY_TEXT_MORE_CODE'),
	        icon: ui_iconSet_api_vue.Outline.DEVELOPER_RESOURCES,
	        onClick: this.insertCodeBlock
	      }, {
	        title: this.loc('TASKS_V2_ENTITY_TEXT_MORE_QUOTE'),
	        icon: ui_iconSet_api_vue.Outline.QUOTE,
	        onClick: this.insertQuote
	      }, {
	        title: this.loc('TASKS_V2_ENTITY_TEXT_MORE_SPOILER'),
	        icon: ui_iconSet_api_vue.Editor.INSERT_SPOILER,
	        onClick: this.insertSpoiler
	      }];
	    }
	  },
	  methods: {
	    insertQuote() {
	      var _Plugins$Quote$TOGGLE;
	      const command = (_Plugins$Quote$TOGGLE = ui_textEditor.Plugins.Quote.TOGGLE_QUOTE_COMMAND) != null ? _Plugins$Quote$TOGGLE : ui_textEditor.Plugins.Quote.INSERT_QUOTE_COMMAND;
	      this.editor.dispatchCommand(command);
	    },
	    insertCodeBlock() {
	      var _Plugins$Code$TOGGLE_;
	      const command = (_Plugins$Code$TOGGLE_ = ui_textEditor.Plugins.Code.TOGGLE_CODE_COMMAND) != null ? _Plugins$Code$TOGGLE_ : ui_textEditor.Plugins.Code.INSERT_CODE_COMMAND;
	      this.editor.dispatchCommand(command);
	    },
	    insertSpoiler() {
	      var _Plugins$Spoiler$TOGG;
	      const command = (_Plugins$Spoiler$TOGG = ui_textEditor.Plugins.Spoiler.TOGGLE_SPOILER_COMMAND) != null ? _Plugins$Spoiler$TOGG : ui_textEditor.Plugins.Spoiler.INSERT_SPOILER_COMMAND;
	      this.editor.dispatchCommand(command);
	    }
	  },
	  template: `
		<ActionButton 
			:iconName="Outline.MORE_L" 
			:title="loc('TASKS_V2_ENTITY_TEXT_ACTION_MORE')" 
			@click="isMenuShown = true"
			ref="actionButton"
		/>
		<BMenu v-if="isMenuShown" :options="menuOptions" @close="isMenuShown = false"/>
	`
	};

	// @vue/component
	const AttachButton = {
	  name: 'EditorActionAttach',
	  components: {
	    ActionButton,
	    Outline: ui_iconSet_api_vue.Outline
	  },
	  props: {
	    fileService: {
	      type: Object,
	      required: true
	    }
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  methods: {
	    handleClick() {
	      this.fileService.browse({
	        bindElement: this.$el,
	        onHideCallback: this.onFileBrowserClose
	      });
	    },
	    onFileBrowserClose() {
	      this.fileService.setFileBrowserClosed(false);
	    }
	  },
	  template: `
		<ActionButton
			:iconName="Outline.ATTACH"
			:title="loc('TASKS_V2_ENTITY_TEXT_ACTION_ATTACH')"
			@click="handleClick"
		/>
	`
	};

	// @vue/component
	const MentionButton = {
	  name: 'EditorActionMention',
	  components: {
	    ActionButton,
	    Outline: ui_iconSet_api_vue.Outline
	  },
	  props: {
	    editor: {
	      type: Object,
	      required: true
	    }
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  methods: {
	    handleClick() {
	      this.editor.focus(() => {
	        this.editor.dispatchCommand(ui_textEditor.Plugins.Mention.INSERT_MENTION_DIALOG_COMMAND);
	      }, {
	        defaultSelection: 'rootEnd'
	      });
	    }
	  },
	  template: `
		<ActionButton
			:iconName="Outline.MENTION"
			:title="loc('TASKS_V2_ENTITY_TEXT_ACTION_MENTION')"
			@click="handleClick"
		/>
	`
	};

	// @vue/component
	const NumberListButton = {
	  name: 'EditorActionNumberList',
	  components: {
	    ActionButton,
	    Outline: ui_iconSet_api_vue.Outline
	  },
	  props: {
	    editor: {
	      type: Object,
	      required: true
	    }
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  methods: {
	    handleClick() {
	      this.editor.dispatchCommand(ui_lexical_list.INSERT_ORDERED_LIST_COMMAND);
	    }
	  },
	  template: `
		<ActionButton
			:iconName="Outline.NUMBERED_LIST"
			:title="loc('TASKS_V2_ENTITY_TEXT_MORE_NUMBER_LIST')"
			@click="handleClick"
		/>
	`
	};

	// @vue/component
	const BulletListButton = {
	  name: 'EditorActionBulletList',
	  components: {
	    ActionButton,
	    Outline: ui_iconSet_api_vue.Outline
	  },
	  props: {
	    editor: {
	      type: Object,
	      required: true
	    }
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  methods: {
	    handleClick() {
	      this.editor.dispatchCommand(ui_lexical_list.INSERT_UNORDERED_LIST_COMMAND);
	    }
	  },
	  template: `
		<ActionButton
			:iconName="Outline.BULLETED_LIST"
			:title="loc('TASKS_V2_ENTITY_TEXT_MORE_BULLET_LIST')"
			@click="handleClick"
		/>
	`
	};

	exports.entityTextEditor = entityTextEditor;
	exports.EntityTextTypes = EntityTextTypes;
	exports.EntityTextArea = EntityTextArea;
	exports.EntityCollapsibleText = EntityCollapsibleText;
	exports.DefaultEditorOptions = DefaultEditorOptions;
	exports.ActionButton = ActionButton;
	exports.CopilotButton = CopilotButton;
	exports.MoreButton = MoreButton;
	exports.AttachButton = AttachButton;
	exports.MentionButton = MentionButton;
	exports.NumberListButton = NumberListButton;
	exports.BulletListButton = BulletListButton;

}((this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {}),BX.Vue3,BX.UI.Uploader,BX.Tasks.V2.Const,BX,BX.Event,BX.UI.Lexical.Core,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Component.Elements,BX.UI.BBCode.Formatter,BX.UI.System.Typography.Vue,BX.Vue3.Directives,BX.Tasks.V2.Component.Elements,BX.Tasks.V2,BX.UI.System.Menu,BX,BX,BX.UI.TextEditor,BX.UI.IconSet,BX.UI.Lexical.List));
//# sourceMappingURL=entity-text.bundle.js.map
