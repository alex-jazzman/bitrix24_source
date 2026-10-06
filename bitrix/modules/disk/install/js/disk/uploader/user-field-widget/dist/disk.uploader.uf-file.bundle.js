/* eslint-disable */
this.BX = this.BX || {};
this.BX.Disk = this.BX.Disk || {};
(function (exports, main_core, ui_uploader_vue, main_popup, ui_uploader_tileWidget, main_core_events, ui_uploader_core, ui_buttons, ui_iconSet_api_core, ui_system_menu, disk_diskPicker, ui_infoHelper, disk_document, ui_vue3_components_richLoc, ui_icons_generator, ui_iconSet_api_vue) {
	'use strict';

	class HtmlParser {
		#form = null;
		#parserId = 'diskfile0';
		#tag = '[DISK FILE ID=#id#]';
		#regexp = /\[(?:DOCUMENT ID|DISK FILE ID)=(n?[0-9]+)\]/ig;
		syncHighlightsDebounced = null;
		constructor(form) {
			this.#form = form;
			this.syncHighlightsDebounced = main_core.Runtime.debounce(this.syncHighlights, 500, this);

			// BBCode Parser Registration ([DISK FILE ID=190])
			main_core_events.EventEmitter.emit(this.#form.getEventObject(), 'OnParserRegister', this.getParser());
		}
		getParser() {
			return {
				id: this.#parserId,
				init: this.#init.bind(this),
				parse: this.#parse.bind(this),
				unparse: this.#unparse.bind(this)
			};
		}

		/**
		 *
		 * @returns {Window.BXEditor}
		 */
		getHtmlEditor() {
			return this.#form.getHtmlEditor();
		}
		insertFile(file) {
			const bbDelimiter = file.isImage() ? '\n' : ' ';
			const htmlDelimiter = file.isImage() ? '<br>' : '&nbsp;';
			main_core_events.EventEmitter.emit(this.getHtmlEditor(), 'OnInsertContent', [bbDelimiter + this.createItemBBCode(file) + bbDelimiter, htmlDelimiter + this.createItemHtml(file) + htmlDelimiter]);
			this.syncHighlights();
		}
		removeFile(item) {
			if (this.getHtmlEditor().GetViewMode() === 'wysiwyg') {
				const doc = this.getHtmlEditor().GetIframeDoc();
				Object.keys(this.getHtmlEditor().bxTags).forEach(tagId => {
					const tag = this.getHtmlEditor().bxTags[tagId];
					if (tag.tag === this.#parserId && tag.serverFileId === item.serverFileId) {
						const node = doc.getElementById(tagId);
						if (node) {
							node.parentNode.removeChild(node);
						}
					}
				});
				this.getHtmlEditor().SaveContent();
			} else {
				const content = this.getHtmlEditor().GetContent().replace(this.#regexp, (str, foundId) => {
					const {
						objectId,
						attachedId
					} = this.#getIds(foundId);
					const items = this.#form.getUserFieldControl().getItems();
					const item = items.find(item => {
						return item.serverFileId === attachedId || item.customData.objectId === objectId;
					});
					return item ? '' : str;
				});
				this.getHtmlEditor().SetContent(content);
				this.getHtmlEditor().Focus();
			}
			this.syncHighlights();
		}
		selectItem(file) {
			file.setCustomData('tileSelected', true);
		}
		deselectItem(file) {
			file.setCustomData('tileSelected', false);
		}
		syncHighlights() {
			const doc = this.getHtmlEditor().GetIframeDoc();
			const inserted = new Set();
			Object.keys(this.getHtmlEditor().bxTags).forEach(tagId => {
				const tag = this.getHtmlEditor().bxTags[tagId];
				if (tag.tag === this.#parserId && doc.getElementById(tagId)) {
					inserted.add(tag.serverFileId);
				}
			});
			let hasInsertedItems = false;
			const files = this.#form.getUserFieldControl().getFiles();
			files.forEach(file => {
				if (inserted.has(file.getServerFileId())) {
					hasInsertedItems = true;
					this.selectItem(file);
				} else {
					this.deselectItem(file);
				}
			});
			if (this.#form.getUserFieldControl().getPhotoTemplateMode() === 'auto') {
				this.#form.getUserFieldControl().setPhotoTemplate(hasInsertedItems ? 'gallery' : 'grid');
			}
		}
		createItemHtml(file, id) {
			const tagId = this.getHtmlEditor().SetBxTag(false, {
				tag: this.#parserId,
				serverFileId: file.getServerFileId(),
				hideContextMenu: true,
				fileId: file.getServerFileId()
			});
			if (file.isImage()) {
				const imageSrc = this.getHtmlEditor().bbCode ? file.getPreviewUrl() : file.getServerPreviewUrl();
				const previewWidth = this.getHtmlEditor().bbCode ? file.getPreviewWidth() : file.getServerPreviewWidth();
				const previewHeight = this.getHtmlEditor().bbCode ? file.getPreviewHeight() : file.getServerPreviewHeight();
				const renderWidth = 600; // half size of imagePreviewWidth
				const renderHeight = 600; // half size of imagePreviewHeight
				const ratioWidth = renderWidth / previewWidth;
				const ratioHeight = renderHeight / previewHeight;
				const ratio = Math.min(ratioWidth, ratioHeight);
				const useOriginalSize = ratio > 1; // image is too small
				const width = useOriginalSize ? previewWidth : previewWidth * ratio;
				const height = useOriginalSize ? previewHeight : previewHeight * ratio;
				return `<img style="max-width: 90%;" width="${width}" height="${height}" data-bx-file-id="${main_core.Text.encode(file.getServerFileId())}" id="${tagId}" src="${imageSrc}" title="${main_core.Text.encode(file.getName())}" data-bx-paste-check="Y" />`;
			} else if (file.getCustomData('fileType') === 'player') {
				return `<img contenteditable="false" class="bxhtmled-player-surrogate" data-bx-file-id="${main_core.Text.encode(file.getServerFileId())}" id="${tagId}" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" data-bx-paste-check="Y" />`;
			}
			return `<span contenteditable="false" data-bx-file-id="${main_core.Text.encode(file.getServerFileId())}" id="${tagId}" style="color: #2067B0; border-bottom: 1px dashed #2067B0; margin:0 2px;">${main_core.Text.encode(file.getName())}</span>`;
		}
		createItemBBCode(file) {
			return this.#tag.replace('#id#', file.getServerFileId());
		}
		#init(htmlEditor) {
			// stub
		}
		#parse(content) {
			if (!this.#regexp.test(content)) {
				return content;
			}
			this.syncHighlightsDebounced();
			return content.replace(this.#regexp, (str, id) => {
				const {
					objectId,
					attachedId
				} = this.#getIds(id);
				const files = this.#form.getUserFieldControl().getFiles();
				const insertedFile = files.find(file => {
					return file.getServerFileId() === attachedId || file.getCustomData('objectId') === objectId;
				});
				if (insertedFile) {
					this.selectItem(insertedFile);
					return this.createItemHtml(insertedFile, id);
				}
				return str;
			});
		}
		#unparse(bxTag) {
			const {
				serverFileId
			} = bxTag;
			const files = this.#form.getUserFieldControl().getFiles();
			const uploaderFile = files.find(file => {
				return file.getServerFileId() === serverFileId;
			});
			if (uploaderFile) {
				return this.createItemBBCode(uploaderFile);
			}
			return '';
		}
		#getIds(id) {
			let objectId = null;
			let attachedId = null;
			if (id[0] === 'n') {
				objectId = main_core.Text.toInteger(id.replace('n', ''));
			} else {
				attachedId = main_core.Text.toInteger(id);
			}
			return {
				objectId,
				attachedId
			};
		}
	}

	class MainPostForm extends main_core_events.EventEmitter {
		#userFieldControl = null;
		#createDocumentButton = null;
		#eventObject = null;
		#htmlParser = null;
		#htmlEditor = null;
		#inited = false;
		constructor(userFieldControl, options) {
			super();
			this.setEventNamespace('BX.Disk.Uploader.Integration');
			this.#userFieldControl = userFieldControl;
			this.#eventObject = options.eventObject;
			this.#bindEventObject();
			this.subscribeFromOptions(options.events);
			this.subscribeOnce('onReady', () => {
				if (this.#userFieldControl.canCreateDocuments()) {
					this.#addCreateDocumentButton();
				}
			});
			this.#userFieldControl.subscribe('onUploaderPanelToggle', this.#handleUploaderPanelToggle.bind(this));
			this.#userFieldControl.subscribe('onDocumentPanelToggle', this.#handleDocumentPanelToggle.bind(this));
			main_core.Event.ready(this.#handleDocumentReady.bind(this));
		}
		getUserFieldControl() {
			return this.#userFieldControl;
		}
		getParser() {
			return this.#htmlParser;
		}

		/**
		 *
		 * @returns {BXEditor}
		 */
		getHtmlEditor() {
			return this.#htmlEditor;
		}
		getEventObject() {
			return this.#eventObject;
		}
		selectFileButton() {
			const event = new main_core_events.BaseEvent({
				data: 'show',
				// needs to determine our own event (main.post.form emits onShowControllers as well)
				compatData: ['user-field-widget']
			});
			main_core_events.EventEmitter.emit(this.#eventObject, 'onShowControllers', event);
		}
		deselectFileButton() {
			const event = new main_core_events.BaseEvent({
				data: 'hide',
				// needs to determine our own event (main.post.form emits onShowControllers as well)
				compatData: ['user-field-widget']
			});
			main_core_events.EventEmitter.emit(this.#eventObject, 'onShowControllers', event);
		}
		selectCreateDocumentButton() {
			if (this.#createDocumentButton) {
				const container = this.#createDocumentButton.closest('[data-id="disk-document"]');
				if (container) {
					container.setAttribute('data-bx-button-status', 'active');
					container.setAttribute('aria-expanded', 'true');
				}
			}
		}
		deselectCreateDocumentButton() {
			if (this.#createDocumentButton) {
				const container = this.#createDocumentButton.closest('[data-id="disk-document"]');
				if (container) {
					container.removeAttribute('data-bx-button-status');
					container.setAttribute('aria-expanded', 'false');
				}
			}
		}
		#handleDocumentReady() {
			const postForm = this.#getPostForm();
			if (postForm === null) {
				setTimeout(() => {
					const postForm = this.#getPostForm();
					if (postForm) {
						this.#handlePostFormReady(postForm);
					} else {
						console.error('Disk User Field: Post Form Not Found.');
					}
				}, 100);
			} else {
				this.#handlePostFormReady(postForm);
			}
		}
		#handlePostFormReady(postForm) {
			if (postForm.isReady) {
				this.#init(postForm);
			} else {
				main_core_events.EventEmitter.subscribe(postForm, 'OnEditorIsLoaded', () => {
					this.#init(postForm);
				});
			}
		}

		/**
		 *
		 * @param {PostForm} postForm
		 */
		#init(postForm) {
			this.#bindAdapterEvents();
			this.#htmlEditor = postForm.getEditor();
			this.#htmlParser = new HtmlParser(this);
			main_core_events.EventEmitter.subscribe(this.#htmlEditor, 'OnContentChanged', event => {
				this.#htmlParser.syncHighlightsDebounced();
			});
			main_core_events.EventEmitter.subscribe(this.#htmlEditor, 'BXEditor:onBeforePasteAsync', event => {
				return new Promise((resolve, reject) => {
					const clipboardEvent = event.getData().clipboardEvent;
					const clipboardData = clipboardEvent.clipboardData;
					clipboardEvent.stopImmediatePropagation(); // Skip HTML Editor InitClipboardHandler
					if (!clipboardData || !ui_uploader_core.isFilePasted(clipboardData)) {
						resolve();
						return;
					}
					clipboardEvent.preventDefault(); // Prevent Browser behavior
					event.preventDefault(); // Prevent invoking HTMLEditor Paste Handler (OnPasteHandler)

					ui_uploader_core.getFilesFromDataTransfer(clipboardData).then(files => {
						files.forEach(file => {
							this.getUserFieldControl().getUploader().addFile(file, {
								events: {
									[ui_uploader_core.FileEvent.LOAD_ERROR]: () => {},
									[ui_uploader_core.FileEvent.UPLOAD_ERROR]: () => {},
									[ui_uploader_core.FileEvent.LOAD_COMPLETE]: event => {
										// const file: UploaderFile = event.getTarget();
										// const item: TileWidgetItem = this.getUserFieldControl().getItem(file.getId());
										// We could try insert a file/image stub.
										// if (item)
										// {
										// 	this.getUserFieldControl().show();
										// 	this.getParser().insertFile(item);
										// }
									},
									[ui_uploader_core.FileEvent.UPLOAD_COMPLETE]: event => {
										const uploadedFile = event.getTarget();
										this.getUserFieldControl().showUploaderPanel();
										this.getParser().insertFile(uploadedFile);
									}
								}
							});
						});
						resolve();
					}).catch(() => {
						resolve();
					});
				});
			});
			this.emit('onReady');
			this.#inited = true;
		}
		#getPostForm() {
			const PostForm = main_core.Reflection.getClass('BX.Main.PostForm');
			if (!PostForm) {
				return null;
			}
			let result = null;
			PostForm.repo.forEach(editor => {
				if (editor.getEventObject() === this.getEventObject()) {
					result = editor;
				}
			});
			return result;
		}
		#bindEventObject() {
			// Show / Hide files control panel
			main_core_events.EventEmitter.subscribe(this.getEventObject(), 'onShowControllers', event => {
				if (main_core.Type.isArrayFilled(event.getCompatData()) && event.getCompatData()[0] === 'user-field-widget') {
					// Skip our own event (main.post.form emits onShowControllers as well).
					return;
				}
				const status = main_core.Type.isArray(event.getData()) ? event.getData().shift() : event.getData();
				if (status === 'show') {
					this.getUserFieldControl().showUploaderPanel();
				} else {
					this.getUserFieldControl().hide();
				}
			});

			// Inline a post/comment editing
			main_core_events.EventEmitter.subscribe(this.getEventObject(), 'onReinitializeBeforeAsync', event => {
				return new Promise(resolve => {
					if (this.#inited) {
						this.#handleReinitializeBefore(event).then(() => resolve());
					} else {
						this.subscribeOnce('onReady', () => {
							this.#handleReinitializeBefore(event).then(() => resolve());
						});
					}
				});
			});

			// Some components get attachments from main.post.form via arFiles and controllers properties.
			// See main.post.form/templates/.default/src/editor.js:778
			// See timeline/src/commenteditor.js:320
			main_core_events.EventEmitter.subscribe(this.getEventObject(), 'onCollectControllers', event => {
				const data = event.getData();
				const fieldName = this.getUserFieldControl().getUploader().getHiddenFieldName();
				const ids = this.getUserFieldControl().getItems().map(item => {
					return item.serverFileId;
				});
				data[fieldName] = {
					storage: 'disk',
					tag: '[DISK FILE ID=#id#]',
					values: ids,
					handler: {
						selectFile: (tab, path, selected) => {
							Object.values(selected).forEach(item => {
								this.getUserFieldControl().getUploader().addFile(item);
							});
						},
						removeFiles: files => {
							if (files !== undefined && Array.isArray(files)) {
								const uploader = this.getUserFieldControl().getUploader();
								const uploadFiles = uploader.getFiles();
								let filteredFiles = files.map(item => uploadFiles.find(uploadFile => uploadFile.getServerFileId() === item).getId());
								filteredFiles.forEach(file => {
									uploader.removeFile(file);
								});
							}
						}
					}
				};
			});

			// Video records
			main_core_events.EventEmitter.subscribe(this.getEventObject(), 'OnVideoHasCaught', event => {
				event.stopImmediatePropagation();
				this.getUserFieldControl().getUploader().addFile(event.getData(), {
					events: {
						[ui_uploader_core.FileEvent.UPLOAD_COMPLETE]: event => {
							const file = event.getTarget();
							this.getUserFieldControl().showUploaderPanel();
							this.getParser().insertFile(file);
						}
					}
				});
			});

			// An old approach (see BXEditor:onBeforePasteAsync) to process images from clipboard. Just in case.
			main_core_events.EventEmitter.subscribe(this.getEventObject(), 'OnImageHasCaught', event => {
				event.stopImmediatePropagation();
				return new Promise((resolve, reject) => {
					this.getUserFieldControl().getUploader().addFile(event.getData(), {
						events: {
							[ui_uploader_core.FileEvent.LOAD_ERROR]: event => {
								const error = event.getData().error;
								reject(error);
							},
							[ui_uploader_core.FileEvent.UPLOAD_ERROR]: () => event => {
								const error = event.getData().error;
								reject(error);
							},
							[ui_uploader_core.FileEvent.UPLOAD_COMPLETE]: event => {
								const file = event.getTarget();
								const item = this.getUserFieldControl().getItem(file.getId());
								if (item) {
									this.getParser().syncHighlights();
									resolve({
										image: {
											src: file.getPreviewUrl(),
											width: file.getPreviewWidth(),
											height: file.getPreviewHeight()
										},
										html: this.getParser().createItemHtml(file)
									});
								} else {
									reject(new ui_uploader_core.UploaderError('WRONG_FILE_SOURCE'));
								}
							}
						}
					});
				});
			});

			// Files from Drag&Drop
			main_core_events.EventEmitter.subscribe(this.getEventObject(), 'onFilesHaveCaught', event => {
				// Skip this because an event doesn't have all Drag&Drop data
				event.stopImmediatePropagation();
			});
			main_core_events.EventEmitter.subscribe(this.getEventObject(), 'onFilesHaveDropped', event => {
				event.stopImmediatePropagation();
				const dragEvent = event.getData().event;
				ui_uploader_core.getFilesFromDataTransfer(dragEvent.dataTransfer).then(files => {
					this.getUserFieldControl().getUploader().addFiles(files);
				}).catch(() => {});
			});
		}
		#bindAdapterEvents() {
			// Button counter: File -> File (1) -> File (2)
			const adapter = this.getUserFieldControl().getAdapter();
			adapter.subscribe('Item:onAdd', () => {
				main_core_events.EventEmitter.emit(this.getEventObject(), 'onShowControllers:File:Increment');
			});
			adapter.subscribe('Item:onRemove', event => {
				main_core_events.EventEmitter.emit(this.getEventObject(), 'onShowControllers:File:Decrement');
				const item = event.getData().item;
				if (this.getParser()) {
					this.getParser().removeFile(item);
				}
			});
		}

		/**
		 * This method invokes for inline entity editing
		 * @param event
		 */
		#handleReinitializeBefore(event) {
			this.getUserFieldControl().clear();
			const [, userFields] = event.getData();
			const fieldName = this.getUserFieldControl().getUploader().getHiddenFieldName();
			const userField = userFields && userFields[fieldName] && userFields[fieldName]['USER_TYPE_ID'] === 'disk_file' ? userFields[fieldName] : null;
			if (userField !== null) {
				// existing entity
				if (main_core.Type.isPlainObject(userField['CUSTOM_DATA']) && main_core.Type.isStringFilled(userField['CUSTOM_DATA']['PHOTO_TEMPLATE'])) {
					this.getUserFieldControl().setPhotoTemplateMode('manual');
					this.getUserFieldControl().setPhotoTemplate(userField['CUSTOM_DATA']['PHOTO_TEMPLATE']);
				} else {
					this.getUserFieldControl().setPhotoTemplateMode('auto');
				}
			} else {
				// new entity
				this.getUserFieldControl().setPhotoTemplateMode('auto');
				this.getUserFieldControl().setPhotoTemplate('grid');
			}
			if (userField === null) {
				return Promise.resolve();
			}

			// nextTick needs to unmount a TileList component after clear().
			// Component unmounting resets an auto collapse.
			if (main_core.Type.isArray(userField['FILES'])) {
				return this.#userFieldControl.nextTick().then(() => {
					userField['FILES'].forEach(file => {
						if (!this.getUserFieldControl().getUploader().getFile(file.serverFileId)) {
							this.getUserFieldControl().getUploader().addFile(file);
						}
					});
					if (this.getUserFieldControl().getUploader().getFiles().length > 0) {
						this.#userFieldControl.enableAutoCollapse();
					}
				});
			} else if (main_core.Type.isArrayFilled(userField['VALUE'])) {
				return this.#userFieldControl.nextTick().then(() => {
					return new Promise(resolve => {
						let fileIds = userField['VALUE'];
						fileIds = fileIds.filter(id => !this.getUserFieldControl().getUploader().getFile(id));
						let loaded = 0;
						let addedFiles = [];
						const onLoad = () => {
							loaded++;
							if (loaded === addedFiles.length) {
								resolve();
							}
						};
						const events = {
							[ui_uploader_core.FileEvent.LOAD_COMPLETE]: onLoad,
							[ui_uploader_core.FileEvent.LOAD_ERROR]: onLoad
						};
						const fileOptions = fileIds.map(id => [id, {
							events
						}]);
						if (fileOptions.length > 0) {
							addedFiles = this.getUserFieldControl().getUploader().addFiles(fileOptions);
							if (addedFiles.length === 0) {
								resolve();
							} else {
								this.#userFieldControl.enableAutoCollapse();
							}
						} else {
							resolve();
						}
					});
				});
			}
			return Promise.resolve();
		}
		#addCreateDocumentButton() {
			this.#createDocumentButton = main_core.Tag.render`
			<div onclick="${this.#handleButtonClick.bind(this)}">
				<i></i>
				${main_core.Loc.getMessage('DISK_UF_WIDGET_CREATE_DOCUMENT')}
			</div>
		`;
			main_core_events.EventEmitter.emit(this.getEventObject(), 'OnAddButton', [{
				BODY: this.#createDocumentButton,
				ID: 'disk-document'
			}, 'file']);
			const container = this.#createDocumentButton.closest('[data-id="disk-document"]');
			container?.setAttribute('aria-expanded', 'false');
		}
		#handleButtonClick() {
			const container = this.#createDocumentButton.closest('[data-id="disk-document"]');
			if (container && container.hasAttribute('data-bx-button-status')) {
				this.getUserFieldControl().hide();
			} else {
				this.getUserFieldControl().showDocumentPanel();
			}
		}
		insertIntoText(item) {
			const file = this.#userFieldControl.getFile(item.id);
			this.#htmlParser.insertFile(file);
		}
		#handleUploaderPanelToggle(event) {
			const isOpen = event.getData().isOpen;
			if (isOpen) {
				this.selectFileButton();
			} else {
				this.deselectFileButton();
			}
			const fileButton = this.#eventObject?.querySelector('[data-id="file"]');
			fileButton?.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
		}
		#handleDocumentPanelToggle(event) {
			const isOpen = event.getData().isOpen;
			if (isOpen) {
				this.selectCreateDocumentButton();
			} else {
				this.deselectCreateDocumentButton();
			}
		}
	}

	const DocumentService = Object.freeze({
		Google: 'gdrive',
		Office: 'office365',
		Dropbox: 'dropbox',
		Onedrive: 'onedrive',
		OnlyOffice: 'onlyoffice',
		Local: 'l'
	});
	const DocumentType = Object.freeze({
		Docx: 'docx',
		Xlsx: 'xlsx',
		Pptx: 'pptx',
		Board: 'board'
	});

	const settings = main_core.Extension.getSettings('disk.uploader.user-field-widget');
	class UserFieldSettings {
		canCreateDocuments() {
			return settings.get('canCreateDocuments', false);
		}
		getDocumentServices() {
			const documentHandlers = settings.get('documentHandlers', {});
			if (main_core.Type.isPlainObject(documentHandlers)) {
				return documentHandlers;
			}
			return {};
		}
		getImportServices() {
			const importHandlers = settings.get('importHandlers', {});
			if (main_core.Type.isPlainObject(importHandlers)) {
				return importHandlers;
			}
			return {};
		}
		canUseImportService() {
			return settings.get('canUseImport', true);
		}
		getImportFeatureId() {
			return settings.get('importFeatureId', '');
		}
		isBoardsEnabled() {
			return settings.get('isBoardsEnabled', false);
		}
	}
	const userFieldSettings = new UserFieldSettings();

	const instances = new Map();
	class UserFieldControl extends main_core_events.EventEmitter {
		#id = null;
		#adapter = null;
		#mainPostForm = null;
		#allowDocumentFieldName = null;
		#photoTemplateFieldName = null;
		#photoTemplateInput = null;
		#photoTemplateMode = 'auto';
		#widgetComponent = null;
		constructor(widgetComponent) {
			super();
			this.setEventNamespace('BX.Disk.Uploader.Integration');
			this.#widgetComponent = widgetComponent;
			this.#adapter = widgetComponent.adapter;
			const options = main_core.Type.isPlainObject(widgetComponent.widgetOptions) ? widgetComponent.widgetOptions : {};
			this.#photoTemplateFieldName = main_core.Type.isStringFilled(options.photoTemplateFieldName) ? options.photoTemplateFieldName : null;
			this.#allowDocumentFieldName = main_core.Type.isStringFilled(options.allowDocumentFieldName) ? options.allowDocumentFieldName : null;
			this.#bindHandlers();
			if (options.disableLocalEdit) {
				// it would be better to load disk.document on demand
				BX.Disk.Document.Local.Instance.disable();
			}
			if (this.#photoTemplateFieldName !== null && this.getUploader().getHiddenFieldsContainer() !== null) {
				this.#photoTemplateInput = main_core.Tag.render`
				<input 
					name="${this.#photoTemplateFieldName}" 
					value="${main_core.Type.isStringFilled(options.photoTemplate) ? options.photoTemplate : 'grid'}"
					type="hidden" 
				/>
			`;
				this.setPhotoTemplateMode(options.photoTemplateMode);
				main_core.Dom.append(this.#photoTemplateInput, this.getUploader().getHiddenFieldsContainer());
			}
			if (this.getUploader().getHiddenFieldsContainer() === null && (this.#photoTemplateFieldName !== null || this.#allowDocumentFieldName !== null)) {
				// eslint-disable-next-line no-console
				console.warn('DiskUserField: to use "photoTemplateFieldName" or "allowDocumentFieldName" options ' + 'you have to set "hiddenFieldsContainer" in the uploader options.');
			}
			this.subscribeFromOptions(options.events);
			const eventObject = main_core.Type.isElementNode(options.eventObject) ? options.eventObject : null;
			if (eventObject) {
				this.#mainPostForm = new MainPostForm(this, {
					eventObject,
					events: {
						onReady: () => {
							this.getUploader().addFiles(options.files);
							if (this.getUploader().getFiles().length > 0) {
								this.showUploaderPanel();
								this.enableAutoCollapse();
							}
						}
					}
				});
			} else {
				this.getUploader().addFiles(options.files);
			}
			this.#id = main_core.Type.isStringFilled(options.mainPostFormId) ? options.mainPostFormId : `user-field-control-${main_core.Text.getRandom().toLowerCase()}`;
			instances.set(this.#id, this);
		}
		destroy() {
			this.#unbindHandlers();
		}
		#bindHandlers() {
			this.#adapter.subscribe('Item:onAdd', this.#handleItemAdd);
			this.#adapter.subscribe('Item:onComplete', this.#handleItemComplete);
			this.#adapter.subscribe('Item:onRemove', this.#handleItemRemove);
		}
		#unbindHandlers() {
			this.#adapter.unsubscribe('Item:onAdd', this.#handleItemAdd);
			this.#adapter.unsubscribe('Item:onComplete', this.#handleItemComplete);
			this.#adapter.unsubscribe('Item:onRemove', this.#handleItemRemove);
		}
		#handleItemAdd = event => {
			const item = event.getData().item;
			this.emit('Item:onAdd', {
				item
			});
		};
		#handleItemComplete = event => {
			const item = event.getData().item;
			this.setDocumentEdit(item);
			this.emit('Item:onComplete', {
				item
			});
		};
		#handleItemRemove = event => {
			const item = event.getData().item;
			this.removeAllowDocumentEditInput(item);
			this.emit('Item:onRemove', {
				item
			});
		};
		static getById(id) {
			return instances.get(id) || null;
		}
		static getInstances() {
			return [...instances.values()];
		}
		canCreateDocuments() {
			const canCreateDocuments = userFieldSettings.canCreateDocuments();
			return canCreateDocuments && this.#widgetComponent.widgetOptions.canCreateDocuments !== false;
		}
		getAdapter() {
			return this.#adapter;
		}
		getMainPostForm() {
			return this.#mainPostForm;
		}
		getItems() {
			return this.#adapter.getItems();
		}
		getItem(id) {
			return this.#adapter.getItem(id);
		}
		getFiles() {
			return this.#adapter.getUploader().getFiles();
		}
		getFile(id) {
			return this.#adapter.getUploader().getFile(id);
		}
		getUploader() {
			return this.#adapter.getUploader();
		}
		nextTick() {
			return this.#widgetComponent.$nextTick();
		}
		hide() {
			this.#widgetComponent.priorityVisibility = 'hidden';
			this.emit('onUploaderPanelToggle', {
				isOpen: false
			});
			this.emit('onDocumentPanelToggle', {
				isOpen: false
			});
		}
		showUploaderPanel() {
			this.#widgetComponent.priorityVisibility = 'uploader';
			this.emit('onUploaderPanelToggle', {
				isOpen: true
			});
			this.emit('onDocumentPanelToggle', {
				isOpen: false
			});
		}
		showDocumentPanel() {
			if (!this.canCreateDocuments()) {
				return;
			}
			this.#widgetComponent.priorityVisibility = 'documents';
			this.emit('onUploaderPanelToggle', {
				isOpen: false
			});
			this.emit('onDocumentPanelToggle', {
				isOpen: true
			});
		}
		clear() {
			this.getUploader().removeFiles({
				removeFromServer: false
			});
		}
		enableAutoCollapse() {
			this.#widgetComponent.enableAutoCollapse();
		}
		canAllowDocumentEdit() {
			return this.#allowDocumentFieldName !== null && this.getUploader().getHiddenFieldsContainer() !== null;
		}
		canItemAllowEdit(item) {
			return this.canAllowDocumentEdit() && item.customData.isEditable === true && item.customData.canUpdate === true;
		}
		getAllowDocumentEditInput(item) {
			const selector = `input[name='${this.#allowDocumentFieldName}[${item.serverFileId}]']`;
			if (this.getUploader().getHiddenFieldsContainer() !== null) {
				return this.getUploader().getHiddenFieldsContainer().querySelector(selector);
			}
			return null;
		}
		removeAllowDocumentEditInput(item) {
			const input = this.getAllowDocumentEditInput(item);
			if (input !== null) {
				main_core.Dom.remove(input);
			}
		}
		setDocumentEdit(item, allowEdit = null) {
			if (!this.canItemAllowEdit(item)) {
				return;
			}
			let input = this.getAllowDocumentEditInput(item);
			if (input === null) {
				input = main_core.Tag.render`<input name="${this.#allowDocumentFieldName}[${item.serverFileId}]" type="hidden" />`;
				main_core.Dom.append(input, this.getUploader().getHiddenFieldsContainer());
			}
			allowEdit = allowEdit === null ? item.customData.allowEdit === true : allowEdit;
			input.value = allowEdit ? 1 : 0;
			const file = this.getFile(item.id);
			file.setCustomData('allowEdit', allowEdit);
		}
		canChangePhotoTemplate() {
			return this.#photoTemplateInput !== null;
		}
		setPhotoTemplate(name) {
			if (main_core.Type.isStringFilled(name) && this.#photoTemplateInput !== null) {
				this.#photoTemplateInput.value = name;
			}
		}
		getPhotoTemplate() {
			return this.#photoTemplateInput !== null ? this.#photoTemplateInput.value : '';
		}
		setPhotoTemplateMode(mode) {
			if (mode === 'auto' || mode === 'manual') {
				this.#photoTemplateMode = mode;
			}
		}
		getPhotoTemplateMode() {
			return this.#photoTemplateMode;
		}
		getDocumentServices() {
			return userFieldSettings.getDocumentServices();
		}
		getCurrentDocumentService() {
			let currentServiceCode = BX.Disk.getDocumentService();
			if (!currentServiceCode && BX.Disk.isAvailableOnlyOffice()) {
				currentServiceCode = DocumentService.OnlyOffice;
			} else if (!currentServiceCode) {
				currentServiceCode = DocumentService.Local;
			}
			return this.getDocumentServices()[currentServiceCode] || null;
		}
	}

	const loadDiskFileDialog = (dialogName, params = {}) => {
		return new Promise(resolve => {
			main_core.Runtime.loadExtension('disk.legacy.file-dialog').then(() => {
				const handleInit = event => {
					const [name] = event.getData();
					if (dialogName === name) {
						main_core_events.EventEmitter.unsubscribe(BX.DiskFileDialog, 'inited', handleInit);
						resolve();
					}
				};
				main_core_events.EventEmitter.subscribe(BX.DiskFileDialog, 'inited', handleInit);

				// Invokes BX.DiskFileDialog.init
				main_core.ajax.get(getDialogInitUrl(dialogName, params));
			});
		});
	};
	const getDialogInitUrl = (dialogName, params = {}) => {
		const url = `/bitrix/tools/disk/uf.php?action=openDialog&SITE_ID=${main_core.Loc.getMessage('SITE_ID')}&dialog2=Y&ACTION=SELECT&MULTI=Y&dialogName=${dialogName}`;
		return main_core.Uri.addParam(url, params);
	};

	class ItemMenu {
		#userFieldControl = null;
		#item = null;
		#menu = null;
		#folderDialogId = null;
		#readonly = false;
		#insertIntoText = false;
		#removeFromServer = true;

		// Cached promises for lazy-loaded extensions (shared across all instances).
		static #viewerPromise = null;
		static #notificationPromise = null;
		constructor(userFieldControl, item, menu, context = {}) {
			this.#userFieldControl = userFieldControl;
			this.#item = item;
			this.#menu = menu;
			this.#folderDialogId = `folder-dialog-${main_core.Text.getRandom(5)}`;
			this.#readonly = context.readonly === true;
			this.#insertIntoText = context.insertIntoText === true;
			this.#removeFromServer = context.removeFromServer !== false;
		}

		/**
		 * Builds the supplementary part of the menu for the tile view.
		 * Base items (filesize, insert-into-text, download, remove) are added by TileItem
		 * before the TileItem:onMenuCreate hook; here we add the disk-specific actions
		 * and keep them in the canonical UX order.
		 */
		build() {
			this.#menu.getPopupWindow().setMaxWidth(500);
			main_core.Dom.addClass(this.#menu.getPopupWindow().getPopupContainer(), 'disk-uf-file-menu');

			// "view" and "copyToMe" sit right after the filesize block, before the first
			// base action (insert-into-text / download / remove) already added by TileItem.
			const leadingAnchor = this.#firstExistingMenuItemId(['insert-into-text', 'download', 'remove']);
			// "edit" and "rename" sit before the destructive "remove" item, after download.
			const trailingAnchor = this.#firstExistingMenuItemId(['remove']);
			this.#addViewItem(leadingAnchor);
			this.#addCopyToMeItem(leadingAnchor);
			this.#addEditItem(trailingAnchor);
			this.#addRenameItem(trailingAnchor);

			// "download" and "remove" are base items added by TileItem (not by us in tile
			// view), so they lack the icon treatment. Decorate them here to keep the menu
			// identical to the list view.
			this.#addActionIcon(this.#menu.getMenuItem('download'), ui_iconSet_api_core.Outline.DOWNLOAD);
			this.#addActionIcon(this.#menu.getMenuItem('remove'), ui_iconSet_api_core.Outline.TRASHCAN, true);
			this.#addAllowEditItem();
			this.#addStorageFooter();
		}
		#firstExistingMenuItemId(ids) {
			for (const id of ids) {
				if (this.#menu.getMenuItem(id)) {
					return id;
				}
			}
			return null;
		}

		/**
		 * Builds the complete menu from scratch for the list view, where there is no
		 * TileItem to provide base items. The composition and order are identical to
		 * the tile view (single source of truth).
		 */
		buildAll() {
			this.#menu.getPopupWindow().setMaxWidth(500);
			main_core.Dom.addClass(this.#menu.getPopupWindow().getPopupContainer(), 'disk-uf-file-menu');
			this.#addFileSizeItem();
			this.#menu.addMenuItem({
				delimiter: true
			});
			this.#addViewItem();
			this.#addCopyToMeItem();
			this.#addInsertIntoTextItem();
			this.#addDownloadItem();
			this.#addEditItem();
			this.#addRenameItem();
			this.#addRemoveItem();
			this.#addAllowEditItem();
			this.#addStorageFooter();
		}
		#addFileSizeItem() {
			this.#menu.addMenuItem({
				id: 'filesize',
				text: main_core.Loc.getMessage('DISK_UF_WIDGET_FILE_SIZE', {
					'#filesize#': main_core.Text.encode(this.#item.sizeFormatted)
				}),
				disabled: true
			});
		}

		/**
		 * Turns a menu item into an action item with a right-aligned icon.
		 * Drops the auto-applied "menu-popup-no-icon" so the icon column shows, adds the
		 * marker class(es) and renders the icon into the item's icon slot. Shared by both
		 * the addMenuItem path (own items in list/tile) and the post-processing of base
		 * items provided by TileItem, so the menu is identical in tile and list views.
		 */
		#addActionIcon(menuItem, icon, remove = false) {
			if (!menuItem) {
				return;
			}
			const container = menuItem.getContainer();
			main_core.Dom.removeClass(container, 'menu-popup-no-icon');
			main_core.Dom.addClass(container, 'disk-uf-file-menu-item');
			if (remove) {
				main_core.Dom.addClass(container, 'disk-uf-file-menu-item--remove');
			}
			const iconSlot = container.querySelector('.menu-popup-item-icon');
			if (iconSlot) {
				new ui_iconSet_api_core.Icon({
					icon,
					size: 24
				}).renderTo(iconSlot);
				main_core.Dom.attr(iconSlot, 'aria-hidden', 'true');
			}
		}
		#addViewItem(beforeId = null) {
			if (main_core.Type.isStringFilled(this.#item.customData.viewLink)) {
				const menuItem = this.#menu.addMenuItem({
					id: 'view',
					className: 'disk-uf-file-menu-item',
					text: main_core.Loc.getMessage('DISK_UF_WIDGET_OPEN_FILE_MENU_TITLE'),
					href: this.#item.customData.viewLink,
					target: '_blank',
					onclick: (event, item) => item.getMenuWindow().close()
				}, beforeId);
				this.#addActionIcon(menuItem, ui_iconSet_api_core.Outline.OPEN_NEW);
				return;
			}
			const menuItem = this.#menu.addMenuItem({
				id: 'view',
				className: 'disk-uf-file-menu-item',
				text: main_core.Loc.getMessage('DISK_UF_WIDGET_OPEN_FILE_MENU_TITLE'),
				onclick: (event, item) => {
					item.getMenuWindow().close();
					ItemMenu.#loadViewer().then(() => {
						const node = this.#createViewerNode();
						if (node !== null) {
							BX.UI.Viewer.Instance.openByNode(node);
						}
					});
				}
			}, beforeId);
			this.#addActionIcon(menuItem, ui_iconSet_api_core.Outline.OPEN_NEW);
		}
		#addCopyToMeItem(beforeId = null) {
			const menuItem = this.#menu.addMenuItem({
				id: 'copyToMe',
				className: 'disk-uf-file-menu-item',
				text: main_core.Loc.getMessage('DISK_UF_WIDGET_ITEM_MENU_SAVE_TO_DISK'),
				onclick: (event, item) => {
					item.getMenuWindow().close();
					this.#runCopyToMe();
				}
			}, beforeId);
			this.#addActionIcon(menuItem, ui_iconSet_api_core.Outline.FOLDER_24);
		}
		#addEditItem(beforeId = null) {
			if (this.#readonly || !this.#canEdit()) {
				return;
			}
			const menuItem = this.#menu.addMenuItem({
				id: 'edit',
				className: 'disk-uf-file-menu-item',
				text: main_core.Loc.getMessage('DISK_UF_WIDGET_ITEM_MENU_EDIT'),
				onclick: (event, item) => {
					item.getMenuWindow().close();
					ItemMenu.#loadViewer().then(() => {
						const node = this.#createViewerNode();
						if (node !== null) {
							BX.UI.Viewer.Instance.runActionByNode(node, 'edit', {
								checkPromoBoost: true
							});
						}
					});
				}
			}, beforeId);
			this.#addActionIcon(menuItem, ui_iconSet_api_core.Outline.EDIT_M);
		}
		#addInsertIntoTextItem() {
			if (!this.#insertIntoText) {
				return;
			}
			this.#menu.addMenuItem({
				id: 'insert-into-text',
				text: main_core.Loc.getMessage('DISK_UF_WIDGET_INSERT_INTO_THE_TEXT'),
				onclick: (event, menuItem) => {
					menuItem.getMenuWindow().close();
					this.#userFieldControl.getMainPostForm()?.insertIntoText(this.#item);
				}
			});
		}
		#addDownloadItem() {
			if (!main_core.Type.isStringFilled(this.#item.downloadUrl)) {
				return;
			}
			const menuItem = this.#menu.addMenuItem({
				id: 'download',
				className: 'disk-uf-file-menu-item',
				text: main_core.Loc.getMessage('TILE_UPLOADER_MENU_DOWNLOAD'),
				href: this.#item.downloadUrl,
				onclick: (event, item) => item.getMenuWindow().close()
			});
			this.#addActionIcon(menuItem, ui_iconSet_api_core.Outline.DOWNLOAD);
		}
		#addRemoveItem() {
			if (this.#readonly) {
				return;
			}
			const menuItem = this.#menu.addMenuItem({
				id: 'remove',
				text: main_core.Loc.getMessage('TILE_UPLOADER_MENU_REMOVE'),
				onclick: (event, item) => {
					item.getMenuWindow().close();
					this.#userFieldControl.getUploader().removeFile(this.#item.id, {
						removeFromServer: this.#removeFromServer
					});
				}
			});
			this.#addActionIcon(menuItem, ui_iconSet_api_core.Outline.TRASHCAN, true);
		}
		#addAllowEditItem() {
			if (!this.#userFieldControl.canItemAllowEdit(this.#item)) {
				return;
			}
			this.#menu.addMenuItem({
				delimiter: true
			});
			this.#menu.addMenuItem({
				id: 'allow-edit',
				className: this.#item.customData.allowEdit === true ? 'disk-user-field-item-checked' : '',
				text: main_core.Loc.getMessage('DISK_UF_WIDGET_ALLOW_DOCUMENT_EDIT'),
				onclick: (event, menuItem) => {
					if (this.#item.customData.allowEdit === true) {
						this.#userFieldControl.setDocumentEdit(this.#item, false);
					} else {
						this.#userFieldControl.setDocumentEdit(this.#item, true);
					}
					menuItem.getMenuWindow().close();
				}
			});
		}
		#addRenameItem(beforeId = null) {
			if (this.#readonly || !this.#item.customData.canRename) {
				return;
			}
			this.#menu.addMenuItem({
				id: 'rename',
				text: main_core.Loc.getMessage('DISK_UF_WIDGET_RENAME_FILE_MENU_TITLE'),
				events: {
					'SubMenu:onShow': event => {
						const renameItem = event.getTarget();
						this.#showRenameMenu(renameItem);
					}
				},
				items: [{
					id: 'rename-textarea',
					html: '<div class="disk-user-field-rename-loading"></div>',
					className: 'disk-user-field-rename-menu-item'
				}]
			}, beforeId);
		}
		#addStorageFooter() {
			if (!main_core.Type.isStringFilled(this.#item.customData.storage)) {
				return;
			}
			this.#menu.addMenuItem({
				delimiter: true
			});
			if (this.#item.customData.canMove) {
				this.#menu.addMenuItem({
					id: 'storage',
					text: `${main_core.Text.encode(this.#item.customData.storage)}&mldr;`,
					onclick: () => {
						this.openFolderDialog();
						this.#menu.close();
					},
					disabled: this.#item.customData.tileSelected === true
				});
			} else {
				this.#menu.addMenuItem({
					id: 'storage',
					text: main_core.Text.encode(this.#item.customData.storage),
					disabled: true
				});
			}
		}
		#canEdit() {
			const data = this.#item.customData;
			// isLocked/isLockedBySelf are set by the backend for every path that has a Disk\File
			// (both Disk\File uploads and AttachedObject). Absence of the fields (false/undefined)
			// means no lock — treating them as "not locked" via !== true is intentional and correct.
			const lockAllowsEdit = data.isLocked !== true || data.isLockedBySelf === true;
			return data.isEditable === true && data.canUpdate === true && lockAllowsEdit;
		}
		#isNewFile() {
			// Freshly uploaded files carry the NEW_FILE_PREFIX ('n') in their server id;
			// attached objects have a plain numeric id.
			const serverFileId = this.#item.serverFileId ?? this.#item.id;
			return main_core.Type.isStringFilled(serverFileId) && serverFileId.startsWith('n');
		}
		#createViewerNode() {
			const viewerAttrs = this.#item.viewerAttrs;
			if (!main_core.Type.isPlainObject(viewerAttrs)) {
				return null;
			}
			const node = main_core.Dom.create('div');
			for (const [key, value] of Object.entries(viewerAttrs)) {
				main_core.Dom.attr(node, `data-${main_core.Text.toKebabCase(key)}`, value);
			}
			main_core.Dom.attr(node, 'data-viewer', true);
			if (main_core.Type.isStringFilled(this.#item.previewUrl)) {
				main_core.Dom.attr(node, 'data-viewer-preview', this.#item.previewUrl);
			}
			return node;
		}
		#runCopyToMe() {
			const data = this.#item.customData;
			const {
				action,
				requestData
			} = this.#isNewFile() ? {
				action: 'disk.api.file.copyTome',
				requestData: {
					fileId: data.objectId
				}
			} : {
				action: 'disk.attachedObject.copyTome',
				requestData: {
					attachedObjectId: data.fileId
				}
			};
			main_core.ajax.runAction(action, {
				data: requestData
			}).then(response => {
				const url = response?.data?.file?.extra?.showInGridUri;
				const actions = main_core.Type.isStringFilled(url) ? [{
					title: main_core.Loc.getMessage('DISK_UF_WIDGET_OPEN_FILE_MENU_TITLE'),
					href: url
				}] : [];
				ItemMenu.#loadNotification().then(() => {
					BX.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('DISK_UF_WIDGET_ITEM_MENU_SAVE_TO_DISK_SUCCESS', {
							'#name#': main_core.Text.encode(this.#item.name)
						}),
						autoHideDelay: 5000,
						actions
					});
				});
			}).catch(() => {
				this.#showCopyToMeError();
			});
		}
		#showCopyToMeError() {
			ItemMenu.#loadNotification().then(() => {
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('DISK_UF_WIDGET_ITEM_MENU_SAVE_TO_DISK_ERROR'),
					autoHideDelay: 8000,
					actions: [{
						title: main_core.Loc.getMessage('DISK_UF_WIDGET_ITEM_MENU_RETRY'),
						events: {
							click: (event, balloon) => {
								balloon.close();
								this.#runCopyToMe();
							}
						}
					}]
				});
			});
		}
		rename(newName) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('disk.api.commonActions.rename', {
					data: {
						objectId: this.#item.customData.objectId,
						newName,
						autoCorrect: true,
						generateUniqueName: true
					}
				}).then(response => {
					if (response?.status === 'success' && response?.data?.object?.name !== this.#item.name) {
						const file = this.#userFieldControl.getFile(this.#item.id);
						const name = response.data.object.name;
						file.setName(name);
					}
					resolve();
				}).catch(response => {
					BX.Disk.showModalWithStatusAction(response);
					reject();
				});
			});
		}
		#showRenameMenu(renameItem) {
			main_core.Runtime.loadExtension('ui.buttons').then(exports => {
				const Button = exports.Button;
				const ButtonSize = exports.ButtonSize;
				const ButtonColor = exports.ButtonColor;
				const CancelButton = exports.CancelButton;
				const handleKeydown = event => {
					if (event.code === 'Enter') {
						handleRenameClick();
					}
				};
				const nameWithoutExtension = ui_uploader_core.getFilenameWithoutExtension(this.#item.name);
				const handleRenameClick = () => {
					const textareaValue = textarea.value.trim();
					if (!main_core.Type.isStringFilled(textareaValue) || textareaValue === nameWithoutExtension) {
						renameItem.getMenuWindow().close();
						return;
					}
					renameBtn.setWaiting(true);
					const newFilename = `${textareaValue}.${ui_uploader_core.getFileExtension(this.#item.name)}`;
					this.rename(newFilename).then(() => {
						renameBtn.setWaiting(false);
						renameItem.getMenuWindow().close();
					}).catch(() => {
						renameBtn.setWaiting(false);
					});
				};
				const textarea = main_core.Tag.render`
				<textarea
					class="disk-user-field-rename-textarea"
					onkeydown="${handleKeydown}"
				>${main_core.Text.encode(nameWithoutExtension)}</textarea>
			`;
				const renameBtn = new Button({
					text: main_core.Loc.getMessage('DISK_UF_WIDGET_RENAME_FILE_BUTTON_TITLE'),
					color: ButtonColor.PRIMARY,
					size: ButtonSize.SMALL,
					onclick: handleRenameClick
				});
				const cancelBtn = new CancelButton({
					size: ButtonSize.SMALL,
					onclick: () => {
						renameItem.getMenuWindow().close();
					}
				});
				const submenu = renameItem.getSubMenu();
				const textareaItem = submenu.getMenuItem('rename-textarea');
				textareaItem.setText(main_core.Tag.render`
					<div class="disk-user-field-rename-form">
						${textarea}
						<div class="disk-user-field-rename-buttons">${[renameBtn.render(), cancelBtn.render()]}</div>
					</div>
				`, true);
				renameItem.showSubMenu();
			});
		}
		static #loadViewer() {
			ItemMenu.#viewerPromise ??= main_core.Runtime.loadExtension('ui.viewer');
			return ItemMenu.#viewerPromise;
		}
		static #loadNotification() {
			ItemMenu.#notificationPromise ??= main_core.Runtime.loadExtension('ui.notification');
			return ItemMenu.#notificationPromise;
		}
		openFolderDialog() {
			loadDiskFileDialog(this.#folderDialogId, {
				wish: 'fakemove'
			}).then(() => {
				BX.DiskFileDialog.obCallback[this.#folderDialogId] = {
					saveButton: (tab, path, selectedItems, folderByPath) => {
						const selectedItem = Object.values(selectedItems)[0] || folderByPath;
						if (!selectedItem) {
							return;
						}
						const folderId = selectedItem.id === 'root' ? tab.rootObjectId : selectedItem.id;
						main_core.ajax.runAction('disk.api.commonActions.move', {
							data: {
								objectId: this.#item.customData.objectId,
								toFolderId: folderId
							}
						}).then(response => {
							if (response?.status === 'success') {
								const file = this.#userFieldControl.getFile(this.#item.id);
								const name = response.data.object.name;
								const id = response.data.object.id;
								file.setServerFileId(`n${id}`);
								file.setName(name);
								if (selectedItem.id === 'root') {
									file.setCustomData('storage', `${tab.name} / `);
								} else {
									file.setCustomData('storage', `${tab.name} / ${selectedItem.name}`);
								}
							}
						}).catch(response => {
							BX.Disk.showModalWithStatusAction(response);
						});
					}
				};
				if (BX.DiskFileDialog.popupWindow === null) {
					BX.DiskFileDialog.openDialog(this.#folderDialogId);
				}
			}).catch(() => {
				// just ignore
			});
		}
	}

	class SettingsMenu {
		#userFieldControl = null;
		#menu = null;
		constructor(userFieldControl) {
			this.#userFieldControl = userFieldControl;
		}
		getMenu(button) {
			this.#menu ??= new ui_system_menu.Menu({
				bindElement: button.getContainer(),
				angle: true,
				autoHide: true,
				offsetLeft: 16,
				items: this.#getItems(),
				events: {
					onShow: () => button.select(),
					onClose: () => button.deselect()
				}
			});
			return this.#menu;
		}
		#getItems() {
			if (!this.#userFieldControl.canChangePhotoTemplate()) {
				return [];
			}
			return [{
				isSelected: this.#userFieldControl.getPhotoTemplate() === 'grid',
				title: main_core.Loc.getMessage('DISK_UF_WIDGET_ALLOW_PHOTO_COLLAGE'),
				onClick: () => {
					this.#userFieldControl.setPhotoTemplateMode('manual');
					if (this.#userFieldControl.getPhotoTemplate() === 'grid') {
						this.#userFieldControl.setPhotoTemplate('gallery');
					} else {
						this.#userFieldControl.setPhotoTemplate('grid');
					}
					this.#menu.updateItems(this.#getItems());
				}
			}];
		}
		show(button) {
			this.getMenu(button).show();
		}
		toggle(button) {
			if (this.#menu?.getPopup()?.isShown()) {
				this.#menu.close();
			} else {
				this.show(button);
			}
		}
		hide() {
			this.#menu?.close();
		}
		hasItems() {
			return this.#getItems().length > 0;
		}
	}

	const loadingDialogs$1 = new Set();
	const adaptPickerResultItemToLegacy = item => {
		const id = `n${item.objectId}`;
		const adaptedItem = {
			id,
			type: 'file',
			name: item.name,
			size: ui_uploader_core.formatFileSize(item.size),
			sizeInt: item.size,
			ext: item.extension ?? '',
			storage: item.parentFolderName
		};
		if (main_core.Type.isStringFilled(item.previewUrl)) {
			adaptedItem.previewUrl = item.previewUrl;
		}
		if (item.editorFileType !== null) {
			adaptedItem.fileType = item.editorFileType;
		}
		return adaptedItem;
	};
	const resolveOnOpen = options => {
		if (main_core.Type.isFunction(options.onOpen)) {
			return options.onOpen;
		}
		return main_core.Type.isFunction(options.onLoad) ? options.onLoad : null;
	};
	const openDiskFileDialog = options => {
		const dialogOptions = main_core.Type.isPlainObject(options) ? options : {};
		const dialogId = main_core.Type.isStringFilled(dialogOptions.dialogId) ? dialogOptions.dialogId : `file-dialog-${main_core.Text.getRandom(5)}`;
		if (disk_diskPicker.DiskPicker.isEnabled()) {
			openUniversalDiskPicker(dialogId, dialogOptions);
			return;
		}
		openLegacyDiskFileDialog(dialogId, dialogOptions);
	};
	const openUniversalDiskPicker = (dialogId, options) => {
		const onOpen = resolveOnOpen(options);
		const onSelect = main_core.Type.isFunction(options.onSelect) ? options.onSelect : null;
		const onClose = main_core.Type.isFunction(options.onClose) ? options.onClose : null;
		const onError = main_core.Type.isFunction(options.onError) ? options.onError : null;
		const uploader = options.uploader instanceof ui_uploader_core.Uploader ? options.uploader : null;
		if (loadingDialogs$1.has(dialogId)) {
			return;
		}
		loadingDialogs$1.add(dialogId);
		const picker = new disk_diskPicker.DiskPicker();
		picker.open({
			selectionMode: 'multiple',
			onOpen: () => {
				if (onOpen !== null) {
					onOpen();
				}
			},
			onSelect: result => {
				const selectedItems = {};
				result.items.forEach(item => {
					const adaptedItem = adaptPickerResultItemToLegacy(item);
					selectedItems[adaptedItem.id] = adaptedItem;
					if (uploader !== null) {
						uploader.addFile(adaptedItem.id, {
							name: adaptedItem.name,
							preload: true
						});
					}
				});
				if (onSelect !== null) {
					onSelect(null, null, selectedItems);
				}
			},
			onClose: () => {
				loadingDialogs$1.delete(dialogId);
				if (onClose !== null) {
					onClose();
				}
			},
			onError: error => {
				loadingDialogs$1.delete(dialogId);
				if (onError !== null) {
					onError(error);
				}
			}
		});
	};
	const openLegacyDiskFileDialog = (dialogId, options) => {
		const onOpen = resolveOnOpen(options);
		const onSelect = main_core.Type.isFunction(options.onSelect) ? options.onSelect : null;
		const onClose = main_core.Type.isFunction(options.onClose) ? options.onClose : null;
		const uploader = options.uploader instanceof ui_uploader_core.Uploader ? options.uploader : null;
		if (loadingDialogs$1.has(dialogId)) {
			return;
		}
		loadingDialogs$1.add(dialogId);
		loadDiskFileDialog(dialogId).then(() => {
			loadingDialogs$1.delete(dialogId);
			if (onOpen !== null) {
				onOpen();
			}
			BX.DiskFileDialog.obCallback[dialogId] = {
				saveButton: (tab, path, selectedItems) => {
					Object.values(selectedItems).forEach(item => {
						if (uploader !== null) {
							uploader.addFile(item.id, {
								name: item.name,
								preload: true
							});
						}
					});
					if (onSelect !== null) {
						onSelect(tab, path, selectedItems);
					}
				},
				popupDestroy: () => {
					loadingDialogs$1.delete(dialogId);
					if (onClose !== null) {
						onClose();
					}
				}
			};
			if (BX.DiskFileDialog.popupWindow === null) {
				BX.DiskFileDialog.openDialog(dialogId);
			}
		});
	};

	class CloudLoadController extends ui_uploader_core.AbstractLoadController {
		constructor(server, options = {}) {
			super(server, options);
		}
		load(file) {
			this.emit('onProgress', {
				progress: 100
			});
			this.emit('onLoad');
		}
		abort() {}
	}

	class CloudUploadController extends ui_uploader_core.AbstractUploadController {
		#fileId = null;
		#serviceId = null;
		constructor(server, options = {}) {
			super(server, options);
			this.#fileId = options.fileId;
			this.#serviceId = options.serviceId;
		}
		upload(file) {
			BX.Disk.ExternalLoader.startLoad({
				file: {
					id: this.#fileId,
					service: this.#serviceId
				},
				onFinish: newData => {
					this.emit('onUpload', {
						fileInfo: newData.fileInfo
					});
				},
				onProgress: progress => {
					this.emit('onProgress', {
						progress: progress
					});
				},
				onError: errors => {
					this.emit('onError', {
						error: ui_uploader_core.UploaderError.createFromAjaxErrors(errors)
					});
				}
			});
		}
		abort() {}
	}

	const loadingDialogs = new Set();
	const openCloudFileDialog = options => {
		if (!userFieldSettings.canUseImportService()) {
			ui_infoHelper.FeaturePromotersRegistry.getPromoter({
				featureId: userFieldSettings.getImportFeatureId()
			}).show();
			return;
		}
		options = main_core.Type.isPlainObject(options) ? options : {};
		const dialogId = main_core.Type.isStringFilled(options.dialogId) ? options.dialogId : `cloud-dialog-${main_core.Text.getRandom(5)}`;
		const serviceId = main_core.Type.isStringFilled(options.serviceId) ? options.serviceId : DocumentService.Google;
		const onLoad = main_core.Type.isFunction(options.onLoad) ? options.onLoad : null;
		const onSelect = main_core.Type.isFunction(options.onSelect) ? options.onSelect : null;
		const onClose = main_core.Type.isFunction(options.onClose) ? options.onClose : null;
		const uploader = options.uploader instanceof ui_uploader_core.Uploader ? options.uploader : null;
		if (loadingDialogs.has(dialogId)) {
			return;
		}
		loadingDialogs.add(dialogId);
		loadDiskFileDialog(dialogId, {
			service: serviceId,
			cloudImport: 1
		}).then(() => {
			loadingDialogs.delete(dialogId);
			if (onLoad !== null) {
				onLoad();
			}
			BX.DiskFileDialog.obCallback[dialogId] = {
				saveButton: (tab, path, selectedItems) => {
					main_core.Runtime.loadExtension('disk.legacy.external-loader').then(() => {
						Object.values(selectedItems).forEach(item => {
							if (item.type === 'file' && uploader !== null) {
								uploader.addFile({
									id: item.id,
									serverFileId: item.id,
									name: item.name,
									size: main_core.Text.toNumber(item.sizeInt),
									loadController: new CloudLoadController(uploader.getServer(), {
										fileId: item.id,
										serviceId: item.provider
									}),
									uploadController: new CloudUploadController(uploader.getServer(), {
										fileId: item.id,
										serviceId: item.provider
									})
								});
							}
						});
						if (onSelect !== null) {
							onSelect(tab, path, selectedItems);
						}
					});
				},
				popupDestroy: () => {
					loadingDialogs.delete(dialogId);
					if (onClose !== null) {
						onClose();
					}
				}
			};
			if (serviceId === DocumentService.Google) {
				main_core.ajax({
					url: '/bitrix/tools/disk/uf.php?action=getGoogleAppData',
					dataType: 'json',
					onsuccess(data) {
						if (data.authUrl) {
							openAuthPopup(data.authUrl, options);
							return;
						}
						initGooglePicker(data, dialogId).then(picker => {
							picker.loadAndShowPicker();
						}).catch(error => {
							console.error(error);
						});
					},
					onfailure(data) {
						BX.DiskFileDialog.sendRequest = false;
					}
				});
				return;
			}
			if (BX.DiskFileDialog.popupWindow === null) {
				BX.DiskFileDialog.openDialog(dialogId);
			}
		});
	};
	const openAuthPopup = function (authUrl, dialogOptions) {
		BX.util.popup(authUrl, 1030, 700);
		main_core.Event.bind(window, 'hashchange', () => {
			const matches = document.location.hash.match(/external-auth-(\w+)/);
			if (!matches) {
				return;
			}
			BX.DiskFileDialog.sendRequest = false;
			openCloudFileDialog(dialogOptions);
		});
	};
	const initGooglePicker = async function (data, dialogId) {
		return main_core.Runtime.loadExtension('disk.google-drive-picker').then(({
			GoogleDrivePicker
		}) => {
			return new GoogleDrivePicker(data.clientId, data.appId, data.apiKey, data.accessToken, BX.DiskFileDialog.obCallback[dialogId]);
		});
	};

	const createDocumentDialog = (options = {}) => {
		const uploader = options.uploader instanceof ui_uploader_core.Uploader ? options.uploader : null;
		const documentType = main_core.Type.isStringFilled(options.documentType) ? options.documentType : null;
		const onAddFile = main_core.Type.isFunction(options.onAddFile) ? options.onAddFile : null;

		// TODO: load disk and disk.document extensions on demand
		if (!BX.Disk.getDocumentService()) {
			const service = BX.Disk.isAvailableOnlyOffice() ? DocumentService.OnlyOffice : DocumentService.Local;
			BX.Disk.saveDocumentService(service);
		}
		let newTab = null;
		if (documentType === DocumentType.Board) {
			newTab = window.open('', '_blank');
		}
		if (BX.Disk.Document.Local.Instance.isSetWorkWithLocalBDisk() || documentType === 'board') {
			BX.Disk.Document.Local.Instance.createFile({
				type: documentType
			}).then(response => {
				if (response.status === 'success') {
					if (documentType === 'board') {
						BX.UI.Analytics.sendData({
							event: 'create',
							tool: 'boards',
							category: 'boards',
							c_element: 'docs_attach_uploader_widget'
						});
					}
					uploader.addFile(`n${response.object.id}`, {
						name: response.object.name,
						preload: true
					});
					onAddFile?.();
					options.onSuccess?.(response);
					if (newTab !== null && response.openUrl) {
						newTab.location.href = response.openUrl;
					}
				}
			});
		} else {
			const documentService = BX.Disk.getDocumentService();
			const byUnifiedLink = options.documentHandlers.some(handler => handler.supportsUnifiedLink && handler.code === documentService);
			const saveCallback = response => {
				if (response.status !== 'success') {
					return;
				}
				const key = response.object ? 'object' : 'data';
				if (response[key]) {
					uploader.addFile(`n${response[key].id}`, {
						name: response[key].name,
						size: response[key].size,
						preload: true
					});
					onAddFile?.();
					options.onSuccess?.(response);
				}
			};
			const createProcess = new BX.Disk.Document.CreateProcess({
				typeFile: documentType,
				serviceCode: documentService,
				byUnifiedLink,
				triggerNode: options.node,
				onAfterSave: saveCallback,
				onAfterCreateFile: saveCallback,
				analytics: {
					c_sub_section: 'new_element',
					c_element: 'docs_attach'
				}
			});
			createProcess.start();
		}
	};

	const Loader = {
		name: 'Loader',
		props: {
			size: {
				type: Number,
				default: 70
			},
			color: {
				type: String,
				default: '#2fc6f6'
			},
			offset: {
				type: Object,
				default: null
			},
			mode: {
				type: String,
				default: ''
			}
		},
		created() {
			this.loader = null;
		},
		mounted() {
			main_core.Runtime.loadExtension('main.loader').then(exports => {
				const {
					Loader
				} = exports;
				this.loader = new Loader({
					target: this.$refs.container,
					size: this.size,
					color: this.color,
					offset: this.offset,
					mode: this.mode
				});
				this.loader.show();
			});
		},
		beforeUnmount() {
			if (this.loader) {
				this.loader.destroy();
				this.loader = null;
			}
		},
		template: '<span ref="container"></span>'
	};

	// @vue/component
	const ControlPanel = {
		name: 'ControlPanel',
		components: {
			Loader
		},
		inject: ['userFieldControl', 'uploader', 'getMessage'],
		setup() {
			return {
				DocumentService,
				importServices: userFieldSettings.getImportServices()
			};
		},
		data: () => ({
			showDialogLoader: false,
			showCloudDialogLoader: false,
			currentServiceId: null
		}),
		created() {
			this.fileDialogId = `file-dialog-${main_core.Text.getRandom(5)}`;
			this.cloudDialogId = `cloud-dialog-${main_core.Text.getRandom(5)}`;
		},
		mounted() {
			this.uploader.assignBrowse(this.$refs.upload);
		},
		methods: {
			openDiskFileDialog() {
				if (this.showDialogLoader) {
					return;
				}
				this.showDialogLoader = true;
				openDiskFileDialog({
					dialogId: this.fileDialogId,
					uploader: this.uploader,
					onOpen: () => {
						this.showDialogLoader = false;
					},
					onClose: () => {
						this.showDialogLoader = false;
					},
					onError: () => {
						this.showDialogLoader = false;
					}
				});
			},
			openCloudFileDialog(serviceId) {
				if (this.showCloudDialogLoader) {
					return;
				}
				this.currentServiceId = serviceId;
				this.showCloudDialogLoader = true;
				const finalize = () => {
					this.showCloudDialogLoader = false;
					this.currentServiceId = null;
				};
				openCloudFileDialog({
					dialogId: this.cloudDialogId,
					uploader: this.uploader,
					serviceId,
					onLoad: finalize,
					onClose: finalize
				});
			}
		},
		template: `
		<div class="disk-user-field-panel">
			<div class="disk-user-field-panel-file-wrap">
				<div class="disk-user-field-panel-card-box disk-user-field-panel-card-file" ref="upload">
					<div class="disk-user-field-panel-card disk-user-field-panel-card-icon--upload">
						<div class="disk-user-field-panel-card-content">
							<div class="disk-user-field-panel-card-icon"></div>
							<div class="disk-user-field-panel-card-btn"></div>
							<div class="disk-user-field-panel-card-name">{{ getMessage('DISK_UF_WIDGET_UPLOAD_FILES') }}</div>
						</div>
					</div>
				</div>
				<div class="disk-user-field-panel-card-box disk-user-field-panel-card-file" @click="openDiskFileDialog">
					<div class="disk-user-field-panel-card disk-user-field-panel-card-icon--b24">
						<div class="disk-user-field-panel-card-content">
							<Loader v-if="showDialogLoader" :offset="{ top: '-7px' }" />
							<div class="disk-user-field-panel-card-icon"></div>
							<div class="disk-user-field-panel-card-btn"></div>
							<div class="disk-user-field-panel-card-name">{{ getMessage('DISK_UF_WIDGET_MY_DRIVE') }}</div>
						</div>
					</div>
				</div>
				<div class="disk-user-field-panel-card-divider"></div>
				<div 
					class="disk-user-field-panel-card-box disk-user-field-panel-card-file"
					v-if="importServices[DocumentService.Google]"
					@click="openCloudFileDialog(DocumentService.Google)"
				>
					<div class="disk-user-field-panel-card disk-user-field-panel-card-icon--google-docs">
						<div class="disk-user-field-panel-card-content">
							<Loader v-if="showCloudDialogLoader && currentServiceId === DocumentService.Google" :offset="{ top: '-7px' }" />
							<div class="disk-user-field-panel-card-icon"></div>
							<div class="disk-user-field-panel-card-btn"></div>
							<div class="disk-user-field-panel-card-name">{{ importServices[DocumentService.Google]['name'] }}</div>
						</div>
					</div>
				</div>
				<div 
					class="disk-user-field-panel-card-box disk-user-field-panel-card-file"
					v-if="importServices[DocumentService.Office]"
					@click="openCloudFileDialog(DocumentService.Office)"
				>
					<div class="disk-user-field-panel-card disk-user-field-panel-card-icon--office365">
						<div class="disk-user-field-panel-card-content">
							<Loader v-if="showCloudDialogLoader && currentServiceId === DocumentService.Office" :offset="{ top: '-7px' }" />
							<div class="disk-user-field-panel-card-icon"></div>
							<div class="disk-user-field-panel-card-btn"></div>
							<div class="disk-user-field-panel-card-name">{{ importServices[DocumentService.Office].name }}</div>
						</div>
					</div>
				</div>
				<div 
					class="disk-user-field-panel-card-box disk-user-field-panel-card-file"
					v-if="importServices[DocumentService.Dropbox]"
					@click="openCloudFileDialog(DocumentService.Dropbox)"
				>
					<div class="disk-user-field-panel-card disk-user-field-panel-card-icon--dropbox">
						<div class="disk-user-field-panel-card-content">
							<Loader v-if="showCloudDialogLoader && currentServiceId === DocumentService.Dropbox" :offset="{ top: '-7px' }" />
							<div class="disk-user-field-panel-card-icon"></div>
							<div class="disk-user-field-panel-card-btn"></div>
							<div class="disk-user-field-panel-card-name">{{ importServices[DocumentService.Dropbox].name }}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const DocumentPanel = {
		name: 'DocumentPanel',
		components: {
			RichLoc: ui_vue3_components_richLoc.RichLoc
		},
		inject: ['uploader', 'userFieldControl', 'getMessage'],
		setup() {
			return {
				DocumentType,
				isBoardsEnabled: userFieldSettings.isBoardsEnabled()
			};
		},
		data() {
			return {
				currentServiceName: this.userFieldControl.getCurrentDocumentService()?.name,
				cardButtonSuffix: '-card-button'
			};
		},
		computed: {
			createServiceFormatted() {
				const labelText = main_core.Loc.getMessage('DISK_UF_WIDGET_EDIT_SERVICE_LABEL');
				const macros = '#NAME#';
				const position = labelText.indexOf(macros);
				const preText = labelText.slice(0, position);
				const postText = labelText.slice(position + macros.length);
				return `${preText}[link]${this.currentServiceName}[/link]${postText}`;
			}
		},
		methods: {
			renderSvg(documentType) {
				return new ui_icons_generator.FileIcon({
					name: documentType,
					size: 36,
					align: 'center'
				}).generate().outerHTML;
			},
			createDocument(documentType) {
				createDocumentDialog({
					uploader: this.uploader,
					documentType,
					documentHandlers: Object.values(userFieldSettings.getDocumentServices()),
					onAddFile: () => this.userFieldControl.showUploaderPanel(),
					node: this.$refs[`${documentType}${this.cardButtonSuffix}`]
				});
			},
			openMenu() {
				this.menu ??= new ui_system_menu.Menu({
					bindElement: this.$refs.service,
					autoHide: true,
					offsetTop: 5,
					items: this.getMenuItems()
				});
				this.menu.show();
			},
			getMenuItems() {
				const services = Object.values(userFieldSettings.getDocumentServices());
				const currentServiceCode = this.userFieldControl.getCurrentDocumentService()?.code;
				return services.map(service => ({
					title: service.name,
					isSelected: currentServiceCode === service.code,
					onClick: () => {
						BX.Disk.saveDocumentService(service.code);
						this.currentServiceName = service.name;
						this.menu.updateItems(this.getMenuItems());
					}
				}));
			}
		},
		template: `
		<div class="disk-user-field-panel">
			<div class="disk-user-field-panel-doc-wrap">
				<div class="disk-user-field-panel-card-box" @click="createDocument(DocumentType.Docx)">
					<div class="disk-user-field-panel-card disk-user-field-panel-card--doc">
						<div class="disk-user-field-panel-card-icon" v-html="renderSvg(DocumentType.Docx)"></div>
						<div class="disk-user-field-panel-card-btn" :ref="DocumentType.Docx + cardButtonSuffix"></div>
						<div class="disk-user-field-panel-card-name">{{ getMessage('DISK_UF_WIDGET_CREATE_DOCX') }}</div>
					</div>
				</div>
				<div class="disk-user-field-panel-card-box" @click="createDocument(DocumentType.Xlsx)">
					<div class="disk-user-field-panel-card disk-user-field-panel-card--xls">
						<div class="disk-user-field-panel-card-icon" v-html="renderSvg(DocumentType.Xlsx)"></div>
						<div class="disk-user-field-panel-card-btn" :ref="DocumentType.Xlsx + cardButtonSuffix"></div>
						<div class="disk-user-field-panel-card-name">{{ getMessage('DISK_UF_WIDGET_CREATE_XLSX') }}</div>
					</div>
				</div>
				<div class="disk-user-field-panel-card-box" @click="createDocument(DocumentType.Pptx)">
					<div class="disk-user-field-panel-card disk-user-field-panel-card--ppt">
						<div class="disk-user-field-panel-card-icon" v-html="renderSvg(DocumentType.Pptx)"></div>
						<div class="disk-user-field-panel-card-btn" :ref="DocumentType.Pptx + cardButtonSuffix"></div>
						<div class="disk-user-field-panel-card-name">{{ getMessage('DISK_UF_WIDGET_CREATE_PPTX') }}</div>
					</div>
				</div>
				<div class="disk-user-field-panel-card-box" @click="createDocument(DocumentType.Board)" v-if="isBoardsEnabled">
					<div class="disk-user-field-panel-card disk-user-field-panel-card--board">
						<div class="disk-user-field-panel-card-icon"></div>
						<div class="disk-user-field-panel-card-btn" :ref="DocumentType.Board + cardButtonSuffix"></div>
						<div class="disk-user-field-panel-card-name">{{ getMessage('DISK_UF_WIDGET_CREATE_BOARD') }}</div>
					</div>
				</div>
			</div>
			<div class="disk-user-field-create-document-by-service" @click="openMenu">
				<RichLoc :text="createServiceFormatted" placeholder="[link]">
					<template #link="{ text }">
						<span class="disk-user-field-document-current-service" ref="service">{{ text }}</span>
					</template>
				</RichLoc>
			</div>
		</div>
	`
	};

	const MAX_FILENAME_LENGTH = 60;
	const CROP_FILENAME_END_LENGTH = 5;
	const FILE_ICON_SIZE = 24;

	// @vue/component
	const FileListItem = {
		name: 'DiskUserFieldFileListItem',
		components: {
			FileIcon: ui_uploader_tileWidget.FileIcon,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			groupBy: {
				type: String,
				default: null
			},
			showMenuButton: {
				type: Boolean,
				default: true
			}
		},
		emits: ['menuClick'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				FILE_ICON_SIZE
			};
		},
		data() {
			return {
				isMenuShown: false
			};
		},
		computed: {
			file() {
				return this.item;
			},
			formattedFileName() {
				const fileName = this.fileNameWithoutExtension;
				if (fileName.length <= MAX_FILENAME_LENGTH) {
					return fileName;
				}
				const start = fileName.slice(0, MAX_FILENAME_LENGTH - CROP_FILENAME_END_LENGTH - 1);
				const end = fileName.slice(-1 * CROP_FILENAME_END_LENGTH);
				return `${start}...${end}`;
			},
			fileNameWithoutExtension() {
				if (!this.file.extension) {
					return this.file.name;
				}
				const start = 0;
				const end = this.file.name.length - this.file.extension.length - 1;
				return this.file.name.slice(start, end);
			},
			formattedExtension() {
				return this.file.extension ? `.${this.file.extension}` : '';
			},
			sizeFormatted() {
				return this.file.sizeFormatted || '';
			},
			isComplete() {
				return this.file.status === ui_uploader_core.FileStatus.COMPLETE;
			},
			canOpen() {
				return this.isComplete && main_core.Type.isPlainObject(this.file.viewerAttrs);
			},
			// Mirrors ui.uploader.tile-widget TileItem.viewerAttrs so a list row opens through the
			// same global ui.viewer delegation and the same gallery grouping as a tile.
			viewerAttrs() {
				const {
					viewerAttrs,
					previewUrl
				} = this.file;
				if (!main_core.Type.isPlainObject(viewerAttrs)) {
					return {};
				}
				const params = {};
				for (const [key, value] of Object.entries(viewerAttrs)) {
					params[`data-${main_core.Text.toKebabCase(key)}`] = value;
				}
				params['data-viewer'] = true;
				if (main_core.Type.isStringFilled(previewUrl)) {
					params['data-viewer-preview'] = previewUrl;
				}
				if (this.groupBy && main_core.Type.isUndefined(viewerAttrs.viewerSeparateItem)) {
					params['data-viewer-group-by'] = this.groupBy;
				}
				return params;
			}
		},
		methods: {
			getMessage(code, replacements) {
				return main_core.Loc.getMessage(code, replacements);
			},
			// Mouse clicks open through the global ui.viewer delegation (the data-viewer node);
			// this handler is only for keyboard activation and opens the very same in-DOM node,
			// so the gallery grouping is identical to a mouse click and to the tile view.
			handleOpenClick(event) {
				if (!this.canOpen) {
					return;
				}
				const node = event.currentTarget;
				main_core.Runtime.loadExtension('ui.viewer').then(() => {
					BX.UI.Viewer.Instance.openByNode(node);
				});
			},
			handleMenuClick() {
				// Track the open state reactively so :aria-expanded survives a rerender;
				// the parent drives it back via these callbacks when the menu opens/closes.
				this.$emit('menuClick', {
					item: this.item,
					bindElement: this.$refs.menuButton?.$el,
					onMenuShow: () => {
						this.isMenuShown = true;
					},
					onMenuClose: () => {
						this.isMenuShown = false;
					}
				});
			}
		},
		template: `
		<div class="disk-user-field-file-list-item" data-testid="disk-file-list-item">
			<div
				class="disk-user-field-file-list-item-openable"
				:class="{ '--clickable': canOpen }"
				v-bind="canOpen ? viewerAttrs : {}"
				:role="canOpen ? 'button' : null"
				:tabindex="canOpen ? 0 : null"
				@keydown.enter.prevent="handleOpenClick"
				@keydown.space.prevent="handleOpenClick"
			>
				<div class="disk-user-field-file-list-item-preview-container">
					<div v-if="file.isImage && file.previewUrl" class="disk-user-field-file-list-item-preview --image">
						<img class="disk-user-field-file-list-item-image" :src="file.previewUrl" alt="">
					</div>
					<FileIcon
						v-else
						class="disk-user-field-file-list-item-preview --icon"
						:name="file.extension || '...'"
						:size="FILE_ICON_SIZE"
					/>
				</div>
				<div class="disk-user-field-file-list-item-info">
					<div class="disk-user-field-file-list-item-filename-container" :title="file.name">
						<span class="disk-user-field-file-list-item-filename">{{ formattedFileName }}</span>
						<span class="disk-user-field-file-list-item-extension">{{ formattedExtension }}</span>
					</div>
					<span v-if="sizeFormatted" class="disk-user-field-file-list-item-size">{{ sizeFormatted }}</span>
				</div>
			</div>
			<BIcon
				v-if="showMenuButton && isComplete"
				class="disk-user-field-file-list-item-menu"
				:name="Outline.MORE_M"
				:size="FILE_ICON_SIZE"
				hoverable
				tabindex="0"
				role="button"
				:aria-label="getMessage('DISK_UF_WIDGET_ITEM_MENU_ARIA_LABEL', { '#name#': file.name })"
				aria-haspopup="menu"
				:aria-expanded="isMenuShown ? 'true' : 'false'"
				data-testid="disk-file-list-item-menu-btn"
				@click="handleMenuClick"
				@keydown.enter.prevent="handleMenuClick"
				@keydown.space.prevent="handleMenuClick"
				ref="menuButton"
			/>
		</div>
	`
	};

	// @vue/component
	const FileList = {
		name: 'DiskUserFieldFileList',
		components: {
			FileListItem
		},
		props: {
			items: {
				type: Array,
				required: true
			},
			showMenuButton: {
				type: Boolean,
				default: true
			}
		},
		emits: ['menuClick'],
		computed: {
			// One stable group id per list render so ui.viewer opens all list files as a single
			// navigable gallery — identical to ui.uploader.tile-widget TileList.groupBy.
			groupBy() {
				return main_core.Text.getRandom(16);
			}
		},
		mounted() {
			// The list opens files through the global ui.viewer click delegation (like tiles do);
			// make sure the extension — and thus its document click handler — is loaded.
			main_core.Runtime.loadExtension('ui.viewer');
		},
		methods: {
			handleMenuClick(payload) {
				this.$emit('menuClick', payload);
			}
		},
		template: `
		<div class="disk-user-field-file-list" data-testid="disk-file-list">
			<FileListItem
				v-for="item in items"
				:key="item.id"
				:item="item"
				:groupBy="groupBy"
				:showMenuButton="showMenuButton"
				@menuClick="handleMenuClick"
			/>
		</div>
	`
	};

	/**
	 * @memberof BX.Disk.Uploader
	 * @vue/component
	 */
	const UserFieldWidgetComponent = {
		name: 'UserFieldWidget',
		components: {
			TileWidgetComponent: ui_uploader_tileWidget.TileWidgetComponent,
			DocumentPanel,
			FileList
		},
		extends: ui_uploader_vue.VueUploaderComponent,
		provide() {
			return {
				userFieldControl: this.userFieldControl,
				postForm: this.userFieldControl.getMainPostForm(),
				getMessage: this.getMessage
			};
		},
		props: {
			visibility: {
				type: String,
				default(props) {
					const mainPostFormContext = main_core.Type.isElementNode(props.widgetOptions.eventObject);
					return mainPostFormContext ? 'hidden' : 'both';
				}
			}
		},
		setup() {
			return {
				customUploaderOptions: UserFieldWidget.getDefaultUploaderOptions()
			};
		},
		data() {
			return {
				documentsCollapsed: this.visibility === 'both',
				priorityVisibility: null
			};
		},
		computed: {
			viewMode() {
				return this.widgetOptions.viewMode === 'list' ? 'list' : 'tile';
			},
			insertIntoTextEnabled() {
				return main_core.Type.isBoolean(this.widgetOptions.insertIntoText) ? this.widgetOptions.insertIntoText : this.userFieldControl.getMainPostForm() !== null;
			},
			menuContext() {
				return {
					readonly: this.widgetOptions.readonly === true || this.widgetOptions.tileWidgetOptions?.readonly === true,
					removeFromServer: this.widgetOptions.tileWidgetOptions?.removeFromServer !== false,
					insertIntoText: this.insertIntoTextEnabled
				};
			},
			tileWidgetOptions() {
				const widgetOptions = this.widgetOptions;
				const tileWidgetOptions = main_core.Type.isPlainObject(widgetOptions.tileWidgetOptions) ? {
					...widgetOptions.tileWidgetOptions
				} : {};
				tileWidgetOptions.slots = main_core.Type.isPlainObject(tileWidgetOptions.slots) ? tileWidgetOptions.slots : {};
				if (widgetOptions.withControlPanel !== false) {
					tileWidgetOptions.slots[ui_uploader_tileWidget.TileWidgetSlot.AFTER_TILE_LIST] = ControlPanel;
				}
				tileWidgetOptions.insertIntoText = this.insertIntoTextEnabled;
				tileWidgetOptions.showItemMenuButton = true;
				tileWidgetOptions.events = tileWidgetOptions.events || {};
				tileWidgetOptions.events['TileItem:onMenuCreate'] = event => {
					const {
						item,
						menu
					} = event.getData();
					const itemMenu = new ItemMenu(this.userFieldControl, item, menu, this.menuContext);
					itemMenu.build();
				};
				if (this.userFieldControl.getMainPostForm() !== null) {
					tileWidgetOptions.events.onInsertIntoText = event => {
						const {
							item
						} = event.getData();
						this.userFieldControl.getMainPostForm().insertIntoText(item);
					};
					tileWidgetOptions.enableDropzone = false;
				}
				const settingsMenu = new SettingsMenu(this.userFieldControl);
				if (settingsMenu.hasItems()) {
					tileWidgetOptions.showSettingsButton = true;
					tileWidgetOptions.events['SettingsButton:onClick'] = event => {
						const {
							button
						} = event.getData();
						settingsMenu.toggle(button);
					};
				}
				return tileWidgetOptions;
			},
			shouldShowCreateDocumentLink() {
				return this.userFieldControl.canCreateDocuments() && this.documentsCollapsed && this.finalVisibility === 'both';
			},
			shouldShowDocuments() {
				return this.userFieldControl.canCreateDocuments() && (this.finalVisibility === 'documents' || this.finalVisibility === 'both' && !this.documentsCollapsed);
			},
			finalVisibility() {
				if (this.priorityVisibility !== null) {
					return this.priorityVisibility;
				}
				return this.visibility;
			}
		},
		beforeCreate() {
			this.userFieldControl = new UserFieldControl(this);
			this.listMenu = null;
		},
		beforeUnmount() {
			this.userFieldControl.destroy();
			if (this.listMenu) {
				this.listMenu.destroy();
				this.listMenu = null;
			}
		},
		methods: {
			getMessage(code, replacements) {
				return main_core.Loc.getMessage(code, replacements);
			},
			enableAutoCollapse() {
				this.$refs.tileWidget.enableAutoCollapse();
			},
			getUploaderOptions() {
				return UserFieldWidget.prepareUploaderOptions(this.uploaderOptions);
			},
			getUserFieldControl() {
				return this.userFieldControl;
			},
			handleListMenuClick(payload) {
				const {
					item,
					bindElement,
					onMenuShow,
					onMenuClose
				} = payload;
				if (!main_core.Type.isElementNode(bindElement)) {
					return;
				}
				if (this.listMenu) {
					this.listMenu.destroy();
				}
				this.listMenu = main_popup.MenuManager.create({
					id: `disk-user-field-list-item-menu-${main_core.Text.getRandom().toLowerCase()}`,
					bindElement,
					targetContainer: document.body,
					angle: true,
					offsetLeft: 13,
					cacheable: false,
					items: [],
					events: {
						onShow: () => {
							// The child owns aria-expanded reactively; toggle its flag instead
							// of mutating the DOM, so a rerender cannot reset the attribute.
							onMenuShow?.();
						},
						onClose: () => {
							onMenuClose?.();
							bindElement.focus();
						},
						onDestroy: () => {
							// destroy() fires only onDestroy (not onClose), so reset the item's flag here too,
							// otherwise switching to another file's menu leaves the previous "..." button visible.
							onMenuClose?.();
							this.listMenu = null;
						}
					}
				});
				const itemMenu = new ItemMenu(this.userFieldControl, item, this.listMenu, this.menuContext);
				itemMenu.buildAll();
				this.listMenu.show();
			}
		},
		template: `
		<div
			class="disk-user-field-control"
			:class="{ '--has-files': items.length > 0, '--embedded': widgetOptions.isEmbedded }"
			:style="{ display: finalVisibility === 'hidden' ? 'none' : 'block' }"
			ref="container"
		>
			<div 
				class="disk-user-field-uploader-panel"
				:class="[{ '--hidden': finalVisibility !== 'uploader' && finalVisibility !== 'both' }]"
				ref="uploader-container"
			>
				<FileList
					v-if="viewMode === 'list'"
					:items="items"
					@menuClick="handleListMenuClick"
				/>
				<TileWidgetComponent
					v-else
					:widgetOptions="tileWidgetOptions"
					:uploader-adapter="adapter"
					ref="tileWidget"
				/>
			</div>
			<div
				class="disk-user-field-create-document"
				v-if="shouldShowCreateDocumentLink"
				@click="documentsCollapsed = false"
			>{{ getMessage('DISK_UF_WIDGET_CREATE_DOCUMENT') }}</div>
			<div
				class="disk-user-field-document-panel"
				:class="{ '--single': finalVisibility !== 'both' }"
				ref="document-container"
				v-if="shouldShowDocuments"
			>
				<DocumentPanel />
			</div>
		</div>
	`
	};

	/**
	 * @memberof BX.Disk.Uploader
	 */
	class UserFieldWidget extends ui_uploader_vue.VueUploaderWidget {
		constructor(uploaderOptions, options) {
			const widgetOptions = main_core.Type.isPlainObject(options) ? {
				...options
			} : {};
			super(UserFieldWidget.prepareUploaderOptions(uploaderOptions), widgetOptions);
		}
		defineComponent() {
			return UserFieldWidgetComponent;
		}
		static prepareUploaderOptions(uploaderOptions) {
			return {
				...UserFieldWidget.getDefaultUploaderOptions(),
				...(main_core.Type.isPlainObject(uploaderOptions) ? uploaderOptions : {})
			};
		}
		static getDefaultUploaderOptions() {
			return {
				controller: 'disk.uf.integration.diskUploaderController',
				multiple: true,
				maxFileSize: null
			};
		}
	}

	const sectionCreateDocument = 'create-document';
	const sectionCreateDocumentService = 'create-document-service';
	const importServices = userFieldSettings.getImportServices();
	const createServices = userFieldSettings.getDocumentServices();
	class UserFieldMenu {
		#params;
		#menu;
		#browseElement;
		constructor(params) {
			this.#params = params;
			if (!BX.Disk.getDocumentService()) {
				const service = BX.Disk.isAvailableOnlyOffice() ? DocumentService.OnlyOffice : DocumentService.Local;
				BX.Disk.saveDocumentService(service);
			}
		}
		getMenu() {
			return this.#menu;
		}
		show(bindElement) {
			this.#menu ??= new ui_system_menu.Menu({
				id: `disk-user-field-menu-${Date.now()}`,
				minWidth: 250,
				sections: this.#getSections(),
				items: this.#getItems(),
				closeOnItemClick: false,
				...this.#params.menuOptions
			});
			this.#menu.show(bindElement);
		}
		#getSections() {
			return [{
				code: sectionCreateDocument,
				title: main_core.Loc.getMessage('DISK_UF_WIDGET_CREATE')
			}, {
				code: sectionCreateDocumentService
			}];
		}
		#getItems() {
			const items = [{
				title: main_core.Loc.getMessage('DISK_UF_WIDGET_UPLOAD_FILES'),
				icon: ui_iconSet_api_core.Outline.DOWNLOAD,
				onClick: () => {
					this.#browse();
					this.getMenu().close();
				}
			}, {
				title: main_core.Loc.getMessage('DISK_UF_WIDGET_MY_DRIVE'),
				icon: ui_iconSet_api_core.Outline.UPLOAD,
				onClick: () => {
					openDiskFileDialog({
						dialogId: this.#params.dialogId,
						uploader: this.#params.uploader
					});
					this.getMenu().close();
				}
			}];
			if (this.#params.compact === true) {
				return items;
			}
			items.push(this.#getSelectImportServiceItem(), this.#getCreateDocumentItem(DocumentType.Docx), this.#getCreateDocumentItem(DocumentType.Xlsx), this.#getCreateDocumentItem(DocumentType.Pptx), this.#getCreateDocumentItem(DocumentType.Board), this.#getSelectCreateServiceItem());
			return items;
		}
		#browse() {
			if (!this.#browseElement) {
				this.#browseElement = document.createElement('div');
				this.#params.uploader.assignBrowse(this.#browseElement);
			}
			this.#browseElement.click();
		}
		#getSelectImportServiceItem() {
			const items = [this.#getImportDocumentItem(DocumentService.Google), this.#getImportDocumentItem(DocumentService.Office), this.#getImportDocumentItem(DocumentService.Dropbox)].filter(it => it);
			if (items.length === 0) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('DISK_UF_WIDGET_EXTERNAL_DRIVES'),
				subMenu: {
					items
				}
			};
		}
		#getImportDocumentItem(documentService) {
			if (!importServices[documentService]) {
				return null;
			}
			return {
				title: importServices[documentService].name,
				onClick: () => {
					openCloudFileDialog({
						dialogId: this.#params.dialogId,
						uploader: this.#params.uploader,
						serviceId: documentService
					});
					this.getMenu().close();
				}
			};
		}
		#getCreateDocumentItem(documentType) {
			const cantCreateDocuments = !this.#canCreateDocument();
			const boardsDisabled = documentType === DocumentType.Board && !userFieldSettings.isBoardsEnabled();
			if (cantCreateDocuments || boardsDisabled) {
				return null;
			}
			return {
				sectionCode: sectionCreateDocument,
				title: this.#getCreateDocumentTitle(documentType),
				svg: this.#getDocumentSvg(documentType),
				onClick: () => {
					const titleNodes = this.getMenu().getPopupContainer().querySelectorAll('.ui-popup-menu-item-title-text');
					const titleToFind = this.#getCreateDocumentTitle(documentType);
					const node = [...titleNodes].find(node => node.textContent === titleToFind);
					const targetNode = node?.closest('.ui-popup-menu-item') ?? null;
					createDocumentDialog({
						uploader: this.#params.uploader,
						documentType,
						documentHandlers: Object.values(userFieldSettings.getDocumentServices()),
						node: targetNode,
						onSuccess: () => {
							this.getMenu().close();
						}
					});
					if (documentType === DocumentType.Board) {
						this.getMenu().close();
					}
				}
			};
		}
		#getCreateDocumentTitle(documentType) {
			return {
				[DocumentType.Docx]: main_core.Loc.getMessage('DISK_UF_WIDGET_CREATE_DOCX'),
				[DocumentType.Xlsx]: main_core.Loc.getMessage('DISK_UF_WIDGET_CREATE_XLSX'),
				[DocumentType.Pptx]: main_core.Loc.getMessage('DISK_UF_WIDGET_CREATE_PPTX'),
				[DocumentType.Board]: main_core.Loc.getMessage('DISK_UF_WIDGET_CREATE_BOARD')
			}[documentType];
		}
		#getDocumentSvg(name) {
			const size = 20;
			const svg = new ui_icons_generator.FileIcon({
				name,
				size
			}).generate();
			main_core.Dom.style(svg, 'width', `${size}px`);
			main_core.Dom.style(svg, 'height', `${size}px`);
			return svg;
		}
		#getSelectCreateServiceItem() {
			if (!this.#canCreateDocument()) {
				return null;
			}
			return {
				sectionCode: sectionCreateDocumentService,
				title: main_core.Loc.getMessage('DISK_UF_WIDGET_CREATE_WITH'),
				subtitle: createServices[BX.Disk.getDocumentService()].name,
				closeOnSubItemClick: false,
				subMenu: {
					items: Object.keys(createServices).map(documentService => ({
						title: createServices[documentService].name,
						isSelected: BX.Disk.getDocumentService() === documentService,
						onClick: () => {
							BX.Disk.saveDocumentService(documentService);
							this.#menu.updateItems(this.#getItems());
						}
					}))
				}
			};
		}
		#canCreateDocument() {
			return userFieldSettings.canCreateDocuments() && Object.keys(createServices).length > 0;
		}
	}

	exports.UserFieldControl = UserFieldControl;
	exports.UserFieldMenu = UserFieldMenu;
	exports.UserFieldWidget = UserFieldWidget;
	exports.UserFieldWidgetComponent = UserFieldWidgetComponent;
	exports.createDocumentDialog = createDocumentDialog;
	exports.loadDiskFileDialog = loadDiskFileDialog;
	exports.openCloudFileDialog = openCloudFileDialog;
	exports.openDiskFileDialog = openDiskFileDialog;

})(this.BX.Disk.Uploader = this.BX.Disk.Uploader || {}, BX, BX.UI.Uploader, BX.Main, BX.UI.Uploader, BX.Event, BX.UI.Uploader, BX.UI, BX.UI.IconSet, BX.UI.System, BX.Disk, BX.UI, BX, BX.UI.Vue3.Components, BX.UI.Icons.Generator, BX.UI.IconSet);
//# sourceMappingURL=disk.uploader.uf-file.bundle.js.map
