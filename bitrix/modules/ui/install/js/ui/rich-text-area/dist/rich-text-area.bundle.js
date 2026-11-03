/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
(function (exports, main_core, ui_textEditor, ui_uploader_core, ui_uploader_tileWidget, main_core_events, ui_lexical_core, ui_lexical_utils, ui_uploader_vue, ui_vue3) {
	'use strict';

	const {
		DRAG_END_COMMAND,
		DRAG_START_COMMAND
	} = ui_textEditor.Commands;
	class RichTextArea extends main_core_events.EventEmitter {
		#textEditor = null;
		#uploaderAdapter = null;
		#uploader = null;
		#allowDropFiles = true;
		#syncHighlightsDebounced = main_core.Runtime.debounce(this.#syncHighlights, 500);
		#lastInserted = new Set();
		constructor(richTextAreaOptions) {
			super();
			this.setEventNamespace('BX.UI.RichTextArea');
			const options = main_core.Type.isPlainObject(richTextAreaOptions) ? richTextAreaOptions : {};
			this.subscribeFromOptions(options.widgetOptions.events);
			this.#createTextEditor(options.editorOptions, options.editorInstance);
			this.#createUploaderAdapter(options.uploaderOptions, options.uploaderInstance, options.files);
			const fileInfos = this.#uploaderAdapter.getUploader().getFiles().map(file => {
				return file.toJSON();
			});
			this.getEditor().dispatchCommand(ui_textEditor.Plugins.File.ADD_FILES_COMMAND, fileInfos);
			this.#registerCommands();
		}
		#createTextEditor(editorOptions, editorInstance) {
			if (editorInstance) {
				this.#textEditor = editorInstance;
			} else {
				const options = main_core.Type.isPlainObject(editorOptions) ? {
					...editorOptions
				} : {};
				this.#textEditor = new ui_textEditor.TextEditor(options);
			}
			this.#textEditor.subscribeFromOptions({
				onChange: event => {
					const {
						tags,
						isInitialChange
					} = event.getData();
					if (tags.has('historic')) {
						// Undo/Redo case uses setEditorState that's why we need a new update circle
						this.getEditor().update(() => {
							this.#syncHighlights();
						});
					} else if (isInitialChange) {
						this.#syncHighlights(true);
					} else {
						this.#syncHighlightsDebounced();
					}
				}
			});
			return this.#textEditor;
		}
		#createUploaderAdapter(uploaderOptions, uploader, files) {
			if (uploader instanceof ui_uploader_core.Uploader) {
				this.#uploaderAdapter = new ui_uploader_vue.VueUploaderAdapter(uploader);
			} else {
				const options = main_core.Type.isPlainObject(uploaderOptions) ? uploaderOptions : {};
				const defaultOptions = {
					imagePreviewHeight: 1200,
					// double size (see DiskUploaderController)
					imagePreviewWidth: 1200,
					imagePreviewQuality: 0.85,
					treatOversizeImageAsFile: true,
					ignoreUnknownImageTypes: true,
					multiple: true
				};
				this.#uploaderAdapter = new ui_uploader_vue.VueUploaderAdapter({
					...defaultOptions,
					...options
				});
			}
			this.#uploaderAdapter.subscribeFromOptions({
				'Item:onAdd': event => {
					const item = event.getData().item;
					const fileCount = this.getFileCount();
					this.emit('Item:onAdd', {
						item,
						fileCount
					});
				},
				'Item:onComplete': event => {
					const item = event.getData().item;
					const fileCount = this.getFileCount();
					this.getEditor().dispatchCommand(ui_textEditor.Plugins.File.ADD_FILE_COMMAND, item);
					this.emit('Item:onComplete', {
						item,
						fileCount
					});
				},
				'Item:onRemove': event => {
					const item = event.getData().item;
					this.removeFile(event.getData().item.serverFileId);
					const fileCount = this.getFileCount();
					this.emit('Item:onRemove', {
						item,
						fileCount
					});
				}
			});
			this.#uploaderAdapter.getUploader().addFiles(files);
		}
		getUploaderAdapter() {
			return this.#uploaderAdapter;
		}
		getUploader() {
			return this.#uploaderAdapter.getUploader();
		}
		getFileCount() {
			return this.getUploader().getFiles().length;
		}
		getEditor() {
			return this.#textEditor;
		}
		isFilePluginEnabled() {
			const filePlugin = this.getEditor().getPlugin('File');
			return filePlugin?.isEnabled() === true;
		}
		canDropFiles() {
			return this.#allowDropFiles;
		}
		insertFile(fileInfo) {
			this.getEditor().dispatchCommand(ui_textEditor.Plugins.File.INSERT_FILE_COMMAND, {
				serverFileId: fileInfo.serverFileId,
				width: 600,
				// half size of imagePreviewWidth
				height: 600,
				// half size of imagePreviewHeight
				info: fileInfo
			});
		}
		removeFile(serverFileId) {
			this.getEditor().dispatchCommand(ui_textEditor.Plugins.File.REMOVE_FILE_COMMAND, {
				serverFileId,
				skipHistoryStack: true
			});
			this.#syncHighlights(); // onChange doesn't emit due to history-merge
		}
		#registerCommands() {
			this.getEditor().registerCommand(ui_lexical_core.PASTE_COMMAND, clipboardEvent => {
				if (!ui_lexical_utils.objectKlassEquals(clipboardEvent, ClipboardEvent)) {
					return false;
				}
				const clipboardData = clipboardEvent.clipboardData;
				if (!clipboardData || !ui_uploader_core.isFilePasted(clipboardData)) {
					return false;
				}
				clipboardEvent.preventDefault();
				ui_uploader_core.getFilesFromDataTransfer(clipboardData).then(files => {
					if (files.length > 0) {
						this.emit('onBeforeFilePaste');
					}
					files.forEach(file => {
						this.getUploader().addFile(file, {
							events: {
								[ui_uploader_core.FileEvent.LOAD_ERROR]: () => {},
								[ui_uploader_core.FileEvent.UPLOAD_ERROR]: () => {},
								[ui_uploader_core.FileEvent.UPLOAD_COMPLETE]: event => {
									const uploaderFile = event.getTarget();
									this.emit('onFilePaste', {
										file: uploaderFile
									});
									this.insertFile(uploaderFile.toJSON());
								}
							}
						});
					});
				}).catch(() => {
					console.error('RichTextArea: clipboard pasting error.');
				});
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_NORMAL);
			this.getEditor().registerCommand(DRAG_START_COMMAND, () => {
				this.#allowDropFiles = false;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW);
			this.getEditor().registerCommand(DRAG_END_COMMAND, () => {
				this.#allowDropFiles = true;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW);
		}
		#syncHighlights(initialSync = false) {
			this.getEditor().dispatchCommand(ui_textEditor.Plugins.File.GET_INSERTED_FILES_COMMAND, nodes => {
				const inserted = new Set();
				for (const node of nodes) {
					const {
						serverFileId
					} = node.getInfo();
					if (main_core.Type.isStringFilled(serverFileId) || main_core.Type.isNumber(serverFileId)) {
						inserted.add(serverFileId);
					}
				}
				const isInsertedChanged = this.#isInsertedChanged(inserted);
				this.#lastInserted = new Set(inserted);
				let hasInsertedItems = false;
				this.getUploader().getFiles().forEach(file => {
					if (inserted.has(file.getServerFileId())) {
						hasInsertedItems = true;
						file.setCustomData('tileSelected', true);
						inserted.delete(file.getServerFileId());
					} else {
						file.setCustomData('tileSelected', false);
					}
				});

				// Redo/Undo history can have files that were removed from uploader
				for (const serverFileId of inserted) {
					this.richTextArea.removeFile(serverFileId);
				}
				if (!initialSync && isInsertedChanged) {
					this.emit('Item:onInsertChange', {
						hasInsertedItems
					});
				}
			});
		}
		#isInsertedChanged(inserted) {
			if (this.#lastInserted.size !== inserted.size) {
				return true;
			}
			for (const serverFileId of this.#lastInserted) {
				if (!inserted.has(serverFileId)) {
					return true;
				}
			}
			return false;
		}
		destroy() {
			this.#textEditor.destroy();
			this.#uploader.destroy();
			this.#textEditor = null;
			this.#uploader = null;
		}
	}

	// @vue/component
	const DropArea = {
		name: 'DropArea',
		props: {
			show: {
				type: Boolean,
				required: true
			}
		},
		template: `
		<Transition name="ui-rich-text-area-fade">
			<div v-if="show" class="ui-rich-text-area-drop-area">
				<div class="ui-rich-text-area-drop-area-box">
					<label class="ui-rich-text-area-drop-area-text">
						{{ $Bitrix.Loc.getMessage('UI_RICH_TEXT_AREA_DROP_AREA') }}
					</label>
				</div>
			</div>
		</Transition>
	`
	};

	const ActionButton = {
		name: 'ActionButton',
		props: {
			icon: {
				type: String
			},
			title: {
				type: String
			},
			counter: {
				type: Number,
				default: 0
			},
			selected: {
				type: Boolean,
				default: false
			},
			buttonRef: {
				default: null
			}
		},
		// language=Vue
		template: `
		<button class="ui-rich-text-area-action" :class="{ '--selected': selected }" :ref="buttonRef">
			<span class="ui-rich-text-area-action-icon"><span
				:class="icon"
				class="ui-icon-set"
				style="--ui-icon-set__icon-color: var(--ui-color-base-90)"
			></span></span>
			<span class="ui-rich-text-area-action-title">{{ title }}</span>
			<span class="ui-rich-text-area-action-counter" v-show="counter > 0">
				<span class="ui-counter ui-counter-sm ui-counter-gray"><span class="ui-counter-inner">{{ counter }}</span></span>
			</span>
		</button>
	`
	};

	const FileButton = {
		name: 'FileButton',
		components: {
			ActionButton
		},
		// language=Vue
		template: `
		<ActionButton icon="--attach" :title="$Bitrix.Loc.getMessage('UI_RICH_TEXT_AREA_UPLOAD_FILE')" />
	`
	};

	const CreateDocumentButton = {
		name: 'CreateDocumentButton',
		components: {
			ActionButton
		},
		// language=Vue
		template: `
		<ActionButton icon="--file" :title="$Bitrix.Loc.getMessage('UI_RICH_TEXT_AREA_CREATE_DOCUMENT')" />
	`
	};

	const RecordVideoButton = {
		name: 'RecordVideoButton',
		components: {
			ActionButton
		},
		// language=Vue
		template: `
		<ActionButton icon="--video-3" :title="$Bitrix.Loc.getMessage('UI_RICH_TEXT_AREA_RECORD_VIDEO')" />
	`
	};

	/**
	 * @memberof BX.UI.RichTextArea
	 */
	const RichTextAreaComponent = {
		name: 'RichTextAreaComponent',
		components: {
			TextEditorComponent: ui_textEditor.TextEditorComponent,
			TileWidgetComponent: ui_uploader_tileWidget.TileWidgetComponent,
			DropArea,
			FileButton,
			ActionButton,
			CreateDocumentButton,
			RecordVideoButton
		},
		props: {
			editorOptions: {
				type: Object
			},
			editorInstance: {
				type: ui_textEditor.TextEditor
			},
			uploaderOptions: {
				type: Object
			},
			uploaderInstance: {
				type: ui_uploader_core.Uploader
			},
			widgetOptions: {
				type: Object,
				default: {}
			},
			files: {
				type: Array
			}
		},
		data() {
			return {
				showDropArea: false,
				uploaderVisibility: false
			};
		},
		beforeCreate() {
			this.richTextArea = new RichTextArea({
				editorOptions: this.editorOptions,
				editorInstance: this.editorInstance,
				uploaderOptions: this.uploaderOptions,
				uploaderInstance: this.uploaderInstance,
				widgetOptions: this.widgetOptions,
				files: this.files
			});
			this.richTextArea.subscribe('Item:onAdd', () => {
				this.uploaderVisibility = true;
			});
			this.fileButtonRef = ui_vue3.ref(null);
		},
		created() {
			this.uploaderVisibility = this.richTextArea.getFileCount() > 0;
		},
		methods: {
			getRichTextArea() {
				return this.richTextArea;
			},
			getEditor() {
				return this.richTextArea.getEditor();
			},
			getUploader() {
				return this.richTextArea.getUploader();
			},
			getUploaderAdapter() {
				return this.richTextArea.getUploaderAdapter();
			},
			onDragOver(event) {
				if (this.richTextArea.canDropFiles()) {
					event.preventDefault();
				}
			},
			onDragEnter(event) {
				if (!this.richTextArea.canDropFiles()) {
					return;
				}
				event.preventDefault();
				event.stopPropagation();
				void ui_uploader_core.hasDataTransferOnlyFiles(event.dataTransfer, false).then(success => {
					if (!success) {
						return;
					}
					this.lastDropAreaEnterTarget = event.target;
					this.showDropArea = true;
				});
			},
			onDragLeave(event) {
				if (!this.richTextArea.canDropFiles()) {
					return;
				}
				event.preventDefault();
				event.stopPropagation();
				if (this.lastDropAreaEnterTarget === event.target) {
					this.showDropArea = false;
				}
			},
			onDrop(event) {
				if (!this.richTextArea.canDropFiles()) {
					return;
				}
				event.preventDefault();
				void ui_uploader_core.getFilesFromDataTransfer(event.dataTransfer).then(files => {
					this.getUploader().addFiles(files);
					this.getEditor().expand();
				});
				this.showDropArea = false;
			}
		},
		computed: {
			tileWidgetOptions() {
				const options = this.widgetOptions;
				const tileWidgetOptions = {
					insertIntoText: main_core.Type.isBoolean(options.insertIntoText) ? options.insertIntoText : true,
					...(main_core.Type.isPlainObject(options.tileWidgetOptions) ? options.tileWidgetOptions : {})
				};
				tileWidgetOptions.enableDropzone = false;
				if (tileWidgetOptions.insertIntoText) {
					tileWidgetOptions.events = tileWidgetOptions.events || {};
					tileWidgetOptions.events.onInsertIntoText = event => {
						this.richTextArea.insertFile(event.getData().item);
					};
				}
				return tileWidgetOptions;
			},
			isUploadEnabled() {
				return this.getRichTextArea().isFilePluginEnabled();
			}
		},
		mounted() {
			if (this.isUploadEnabled) {
				this.getUploader().assignBrowse(this.fileButtonRef.value);
			}
		},
		unmounted() {
			this.richTextArea.destroy();
			this.richTextArea = null;
		},
		// language=Vue
		template: `
		<div 
			class="ui-rich-text-area"
			v-on="
				isUploadEnabled
				? { drop: onDrop, dragleave: onDragLeave, dragenter: onDragEnter, dragover: onDragOver }
				: {}
			"
		>
			<TextEditorComponent :editor-instance="getEditor()">
				<template #footer>
					<div class="ui-rich-text-area-actions">
						<slot name="before-buttons" :richTextArea="getRichTextArea()"></slot>
						<slot name="file-button" :richTextArea="getRichTextArea()">
							<FileButton v-if="isUploadEnabled" ref="fileButton" :buttonRef="fileButtonRef" />
						</slot>
						<slot name="after-buttons" :richTextArea="getRichTextArea()"></slot>
					</div>
					<slot name="uploader" :adapter="getUploaderAdapter()" :richTextArea="getRichTextArea()">
						<div class="ui-rich-text-area-uploader" :class="{ '--visible': uploaderVisibility }">
							<TileWidgetComponent
								:widgetOptions="tileWidgetOptions"
								:uploader-adapter="getUploaderAdapter()"
								ref="tileWidget"
							/>
						</div>
					</slot>
				</template>
			</TextEditorComponent>
			<DropArea :show="showDropArea" />
		</div>
	`
	};

	exports.ActionButton = ActionButton;
	exports.CreateDocumentButton = CreateDocumentButton;
	exports.FileButton = FileButton;
	exports.RecordVideoButton = RecordVideoButton;
	exports.RichTextAreaComponent = RichTextAreaComponent;

})(this.BX.UI.RichTextArea = this.BX.UI.RichTextArea || {}, BX, BX.UI.TextEditor, BX.UI.Uploader, BX.UI.Uploader, BX.Event, BX.UI.Lexical.Core, BX.UI.Lexical.Utils, BX.UI.Uploader, BX.Vue3);
//# sourceMappingURL=rich-text-area.bundle.js.map
