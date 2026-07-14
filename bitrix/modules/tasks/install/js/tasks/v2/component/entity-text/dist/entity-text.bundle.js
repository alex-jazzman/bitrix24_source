/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, main_core, main_core_events, ui_vue3, ui_uploader_core, ui_lexical_core, ui_textEditor, tasks_v2_core, tasks_v2_const, tasks_v2_provider_service_fileService, tasks_v2_component_elements_userFieldWidgetComponent, ui_bbcode_formatter_htmlFormatter, ui_iconSet_api_vue, ui_iconSet_outline, ui_system_typography_vue, ui_vue3_directives_hint, tasks_v2_component_elements_hint, ui_system_menu_vue, ui_iconSet_editor, ui_lexical_list) {
	'use strict';

	const CHECK_LIST_BUTTON = 'tasks-check-list-button';
	class CheckListPlugin extends ui_textEditor.BasePlugin {
		#eventEmitter;
		constructor(editor) {
			super(editor);
			this.#eventEmitter = new main_core_events.EventEmitter();
			this.#eventEmitter.setEventNamespace('Tasks.V2.Component.EntityTextEditor.CheckListPlugin');
			this.getEditor().getComponentRegistry().register(CHECK_LIST_BUTTON, () => {
				const button = new ui_textEditor.Button();
				button.setContent('<div class="ui-icon-set --o-move-to-checklist"></div>');
				button.setTooltip(main_core.Loc.getMessage('TASKS_V2_ENTITY_TEXT_PLUGIN_TITLE_CHECK_LIST'));
				button.subscribe('onClick', () => {
					this.getEditor().update(() => {
						const selection = ui_lexical_core.$getSelection() || ui_lexical_core.$getPreviousSelection();
						if (ui_lexical_core.$isRangeSelection(selection)) {
							this.#eventEmitter.emit('checkListButtonClick', selection.getTextContent());
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
			return this.#eventEmitter;
		}
	}

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
	const ExtendedEditorOptions = Object.freeze({
		...DefaultEditorOptions,
		floatingToolbar: ['bold', 'italic', 'underline', 'strikethrough', '|', 'numbered-list', 'bulleted-list', '|', CHECK_LIST_BUTTON, 'link', 'spoiler', 'quote', 'code', 'copilot']
	});

	const EntityTextTypes = Object.freeze({
		Task: 'task',
		Result: 'result'
	});
	class EntityTextEditor extends main_core_events.EventEmitter {
		#editor;
		#fileService;
		#uploaderAdapter;
		#syncHighlightsDebounced;
		#entityId;
		#entityType;
		constructor(entityId, entityType = EntityTextTypes.Task, options = {}) {
			super();
			this.setEventNamespace('Tasks.V2.Component.Entity-Text-Editor');
			this.setEntityId(entityId, entityType);
			this.initService(entityId, entityType);
			this.initEditor(options);
			this.#subscribeToEvents();
			this.#registerCommands();
			this.#syncHighlightsDebounced = main_core.Runtime.debounce(this.#syncHighlights, 500, this);
			this.isTabHidden = false;
		}
		setEntityId(entityId, entityType) {
			this.#entityId = entityId;
			this.#entityType = entityType;
		}
		getEditor() {
			return this.#editor;
		}
		getEntityId() {
			return this.#entityId;
		}
		getEntityType() {
			return this.#entityType;
		}
		initService(entityId, entityType) {
			this.#fileService = tasks_v2_provider_service_fileService.fileService.get(entityId, entityType);
			this.#uploaderAdapter = this.#fileService.getAdapter();
		}
		initEditor(options) {
			const content = options.content ?? null;
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
					blockSpaceInline: options?.blockSpaceInline ?? 'var(--ui-space-stack-md2)',
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
				copilot: this.#getCopilotParams()
			};
			this.#editor = new ui_textEditor.TextEditor({
				...ExtendedEditorOptions,
				...additionalEditorOptions
			});
		}
		setEditorText(content) {
			this.#editor.setText(content);
		}
		getFiles() {
			return this.#uploaderAdapter.getItems();
		}
		destroy() {
			this.#unsubscribeToEvents();
			this.#editor?.destroy();
			this.#editor = null;
		}
		#subscribeToEvents() {
			const checkListPlugin = this.#editor.getPlugin(CheckListPlugin.getName());
			checkListPlugin.getEmitter().subscribe('checkListButtonClick', this.handleClickInCheckList);
			this.#fileService.subscribe('onFileComplete', this.onFileComplete);
			this.#fileService.subscribe('onFileRemove', this.onFileRemove);
			main_core.Event.bind(document, 'visibilitychange', this.onVisibilityChange);
		}
		#unsubscribeToEvents() {
			const checkListPlugin = this.#editor.getPlugin(CheckListPlugin.getName());
			checkListPlugin.getEmitter().unsubscribe('checkListButtonClick', this.handleClickInCheckList);
			this.#fileService.unsubscribe('onFileComplete', this.onFileComplete);
			this.#fileService.unsubscribe('onFileRemove', this.onFileRemove);
			main_core.Event.unbind(document, 'visibilitychange', this.onVisibilityChange);
		}
		#registerCommands() {
			this.#editor.registerCommand(ui_lexical_core.PASTE_COMMAND, clipboardEvent => {
				const clipboardData = clipboardEvent.clipboardData;
				if (!clipboardData || !ui_uploader_core.isFilePasted(clipboardData)) {
					return false;
				}
				clipboardEvent.preventDefault();
				ui_uploader_core.getFilesFromDataTransfer(clipboardData).then(files => {
					files.forEach(file => {
						this.#uploaderAdapter.getUploader().addFile(file, {
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
		#syncHighlights() {
			if (!this.#editor) {
				return;
			}
			this.#editor.dispatchCommand(ui_textEditor.Plugins.File.GET_INSERTED_FILES_COMMAND, nodes => {
				const inserted = new Set();
				for (const node of nodes) {
					const {
						serverFileId
					} = node.getInfo();
					if (main_core.Type.isStringFilled(serverFileId) || main_core.Type.isNumber(serverFileId)) {
						inserted.add(serverFileId);
					}
				}
				this.#uploaderAdapter.getUploader().getFiles().forEach(file => {
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
		#getCopilotParams() {
			if (tasks_v2_core.Core.getParams().features.isCopilotEnabled) {
				switch (this.#entityType) {
					case EntityTextTypes.Task:
						return {
							copilotOptions: {
								moduleId: 'tasks',
								category: 'tasks',
								contextId: `tasks_${this.#entityId}`,
								menuForceTop: false
							},
							triggerBySpace: true
						};
					case EntityTextTypes.Result:
						return {
							copilotOptions: {
								moduleId: 'tasks',
								category: 'system',
								contextId: `tasks_result_${this.#entityId}`,
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
		handleEditorChange = () => {
			this.#syncHighlightsDebounced();
			this.emit('editorChanged');
		};
		handleEditorBlur = () => {
			if (this.isTabHidden) {
				return;
			}
			this.emit('editorBlurred');
		};
		handleClickInCheckList = baseEvent => {
			const selectionText = baseEvent.getData();
			this.emit('addCheckList', selectionText);
		};
		onFileComplete = event => {
			const file = event.getData();
			this.#editor.dispatchCommand(ui_textEditor.Plugins.File.ADD_FILE_COMMAND, file);
		};
		onFileRemove = event => {
			const {
				file
			} = event.getData();
			this.handleRemoveFile(file.serverFileId);
		};
		onVisibilityChange = () => {
			this.isTabHidden = document.hidden;
		};
		handleRemoveFile(serverFileId) {
			this.#editor.dispatchCommand(ui_textEditor.Plugins.File.REMOVE_FILE_COMMAND, {
				serverFileId,
				skipHistoryStack: true
			});
			this.#syncHighlightsDebounced();
		}
		insertFile(fileInfo) {
			this.#editor.dispatchCommand(ui_textEditor.Plugins.File.INSERT_FILE_COMMAND, {
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
	const instances = {};
	function getKey(entityId, entityType) {
		return `${entityType}:${entityId}`;
	}
	const entityTextEditor = {
		get(entityId, entityType = EntityTextTypes.Task, options = {}) {
			const key = getKey(entityId, entityType);
			instances[key] ??= new EntityTextEditor(entityId, entityType, options);
			if (main_core.Type.isStringFilled(options?.content)) {
				instances[key].setEditorText(options.content);
			}
			return instances[key];
		},
		replace(tempId, entityId, entityType = EntityTextTypes.Task) {
			const oldKey = getKey(tempId, entityType);
			const newKey = getKey(entityId, entityType);
			instances[newKey] = instances[oldKey];
			instances[newKey]?.setEntityId(entityId, entityType);
			instances[newKey]?.initService(entityId, entityType);
			delete instances[oldKey];
		},
		delete(entityId, entityType = EntityTextTypes.Task) {
			const key = getKey(entityId, entityType);
			instances[key]?.destroy();
			delete instances[key];
		}
	};

	const mountedAreas = new Map();

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
				files: this.fileService.getFiles(),
				isActiveRenderer: true,
				editorRenderKey: 0
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
			this.registerArea();
			this.subscribeEvents();
		},
		unmounted() {
			this.unregisterArea();
			this.unsubscribeEvents();
		},
		methods: {
			subscribeEvents() {
				this.fileService.subscribe('onFileAdd', this.onFileAdd);
				this.fileService.subscribe('onFileRemove', this.onFileRemove);
				this.entityTextEditor.subscribe('editorChanged', this.onEditorChange);
				this.entityTextEditor.subscribe('editorBlurred', this.onEditorBlur);
			},
			unsubscribeEvents() {
				this.fileService.unsubscribe('onFileAdd', this.onFileAdd);
				this.fileService.unsubscribe('onFileRemove', this.onFileRemove);
				this.entityTextEditor.unsubscribe('editorChanged', this.onEditorChange);
				this.entityTextEditor.unsubscribe('editorBlurred', this.onEditorBlur);
			},
			registerArea() {
				const key = this.getAreaKey(this.entityId, this.entityType);
				if (!mountedAreas.has(key)) {
					mountedAreas.set(key, new Set());
				}
				mountedAreas.get(key).forEach(instance => {
					instance.setActiveRenderer(false);
				});
				mountedAreas.get(key).add(this);
				this.setActiveRenderer(true);
			},
			unregisterArea() {
				const key = this.getAreaKey(this.entityId, this.entityType);
				const areas = mountedAreas.get(key);
				if (!areas) {
					return;
				}
				areas.delete(this);
				if (areas.size === 0) {
					mountedAreas.delete(key);
				} else {
					[...areas].pop().setActiveRenderer(true);
				}
			},
			setActiveRenderer(active) {
				const wasInactive = !this.isActiveRenderer;
				this.isActiveRenderer = active;
				if (active && wasInactive) {
					this.editorRenderKey++;
				}
			},
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
			},
			getAreaKey(entityId, entityType) {
				return `${entityType}:${entityId}`;
			}
		},
		template: `
		<div class="tasks-entity-text-area-wrapper" ref="editorWrapper">
			<TextEditorComponent v-if="isActiveRenderer" :key="editorRenderKey" :editorInstance="editor">
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

	const EntityCollapsibleTextEvent = Object.freeze({
		ExpandButtonClick: 'ExpandButton.Click',
		CollapseButtonClick: 'CollapseButton.Click',
		HtmlFormatterComponentMouseUp: 'HtmlFormatterComponent.MouseUp',
		ByDefault: 'ByDefault',
		UpdateIsContentOverflowing: 'UpdateIsContentOverflowing'
	});

	// @vue/component
	const EntityCollapsibleText = {
		name: 'EntityCollapsibleText',
		components: {
			HtmlFormatterComponent: ui_bbcode_formatter_htmlFormatter.HtmlFormatterComponent,
			BIcon: ui_iconSet_api_vue.BIcon,
			TextMd: ui_system_typography_vue.TextMd,
			EditButton,
			ExpandButton,
			CollapseButton
		},
		inject: {
			task: {}
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
			},
			stickyFooter: {
				type: Boolean,
				default: false
			}
		},
		emits: ['editButtonClick', 'update:opened'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				EntityCollapsibleTextEvent
			};
		},
		data() {
			return {
				isOverflowing: false,
				isOverflowChecked: false
			};
		},
		computed: {
			formatData() {
				return {
					files: this.files
				};
			},
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
			this.addHandlerSelectionStart();
			await this.$nextTick();
			this.updateIsOverflowing();
			if (this.openByDefault) {
				this.setPreviewShown(true, EntityCollapsibleTextEvent.ByDefault);
			}
		},
		beforeUnmount() {
			this.removeHandlerSelectionStart();
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
					this.setPreviewShown(false, EntityCollapsibleTextEvent.UpdateIsContentOverflowing);
				}
			},
			processSelection() {
				if (this.opened) {
					return;
				}

				// waiting for selection event to get calculated
				setTimeout(() => {
					const selection = window.getSelection();
					const textSelected = selection?.toString();
					const textSelectedTrimmed = textSelected?.trim();
					if (textSelectedTrimmed) {
						const sel = window.getSelection();
						if (!sel.rangeCount) {
							return;
						}
						const rangeFresh = sel.getRangeAt(0).cloneRange();
						const isIntersectingPreview = rangeFresh.intersectsNode(this.$refs.preview);
						if (!isIntersectingPreview) {
							return;
						}
						const rectPreview = this.$refs.preview.getBoundingClientRect();
						const rectsRange = rangeFresh.getClientRects();
						const rectIndexToOrientate = rectsRange.length - 1;
						const rectRange = rectsRange[rectIndexToOrientate];
						if (rectPreview.length <= 0 || rectRange.length <= 0) {
							return;
						}
						const topLowestPreview = rectPreview.top + rectPreview.height;
						const topLowestRange = rectRange.top + rectRange.height;
						const isSelectionLowerThanContainer = topLowestRange > topLowestPreview;
						if (isSelectionLowerThanContainer) {
							this.setPreviewShown(true);
						}
					}
				}, 0);
			},
			setPreviewShown(isShown, targetEvent) {
				this.$emit('update:opened', isShown, targetEvent);
			},
			handleClickOpener(targetEvent) {
				this.setPreviewShown(true, targetEvent);
			},
			handleClickCollapser(targetEvent) {
				this.setPreviewShown(false, targetEvent);
			},
			handleMouseDownText() {},
			handleMouseMoveText() {},
			handleMouseUpText() {},
			handleSelectionStart() {
				this.removeHandlerSelectionFinish();
				this.addHandlerSelectionFinish();
			},
			handleSelectionFinish() {
				this.removeHandlerSelectionFinish();
				this.processSelection();
			},
			addHandlerSelectionStart() {
				main_core.Event.bind(document, 'selectstart', this.handleSelectionStart);
			},
			removeHandlerSelectionStart() {
				main_core.Event.unbind(document, 'selectstart', this.handleSelectionStart);
			},
			addHandlerSelectionFinish() {
				main_core.Event.bind(document, 'mouseup', this.handleSelectionFinish);
			},
			removeHandlerSelectionFinish() {
				main_core.Event.unbind(document, 'mouseup', this.handleSelectionFinish);
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
				:formatData
				ref="htmlFormatter"
				@mousedown="handleMouseDownText"
				@mousemove="handleMouseMoveText"
				@mouseup="handleMouseUpText"
			/>
			<div
				v-if="hidden && isOverflowing"
				class="tasks-card-entity-collapsible-shadow print-ignore"
			>
				<div class="tasks-card-entity-collapsible-shadow-white-bottom" />
			</div>
		</div>
		<slot/>
		<div
			v-if="showFooter"
			class="tasks-card-entity-collapsible-footer print-ignore"
			:class="{
				'--empty-content': !hasContent && hidden,
				'--without-padding': !showFilesIndicator && hasFiles,
				'--with-edit-button': showEditButton,
				'--sticky': stickyFooter,
			}"
		>
			<EditButton v-if="showEditButton" @click="$emit('editButtonClick')" />
			<ExpandButton v-if="hidden" :showFilesIndicator :filesCount @click="handleClickOpener(EntityCollapsibleTextEvent.ExpandButtonClick)" />
			<CollapseButton v-if="showCollapseButton" @click="handleClickCollapser(EntityCollapsibleTextEvent.CollapseButtonClick)" />
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
				const command = ui_textEditor.Plugins.Quote.TOGGLE_QUOTE_COMMAND ?? ui_textEditor.Plugins.Quote.INSERT_QUOTE_COMMAND;
				this.editor.dispatchCommand(command);
			},
			insertCodeBlock() {
				const command = ui_textEditor.Plugins.Code.TOGGLE_CODE_COMMAND ?? ui_textEditor.Plugins.Code.INSERT_CODE_COMMAND;
				this.editor.dispatchCommand(command);
			},
			insertSpoiler() {
				const command = ui_textEditor.Plugins.Spoiler.TOGGLE_SPOILER_COMMAND ?? ui_textEditor.Plugins.Spoiler.INSERT_SPOILER_COMMAND;
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

	exports.ActionButton = ActionButton;
	exports.AttachButton = AttachButton;
	exports.BulletListButton = BulletListButton;
	exports.CopilotButton = CopilotButton;
	exports.DefaultEditorOptions = DefaultEditorOptions;
	exports.EntityCollapsibleText = EntityCollapsibleText;
	exports.EntityCollapsibleTextEvent = EntityCollapsibleTextEvent;
	exports.EntityTextArea = EntityTextArea;
	exports.EntityTextTypes = EntityTextTypes;
	exports.MentionButton = MentionButton;
	exports.MoreButton = MoreButton;
	exports.NumberListButton = NumberListButton;
	exports.entityTextEditor = entityTextEditor;

})(this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {}, BX, BX.Event, BX.Vue3, BX.UI.Uploader, BX.UI.Lexical.Core, BX.UI.TextEditor, BX.Tasks.V2, BX.Tasks.V2.Const, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Component.Elements, BX.UI.BBCode.Formatter, BX.UI.IconSet, window, BX.UI.System.Typography.Vue, BX.Vue3.Directives, BX.Tasks.V2.Component.Elements, BX.UI.System.Menu, window, BX.UI.Lexical.List);
//# sourceMappingURL=entity-text.bundle.js.map
