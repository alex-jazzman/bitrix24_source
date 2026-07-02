/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
(function (exports, main_core, main_date, main_loader, main_popup, main_core_events, sign_type, sign_v2_signSettings, ui_sidepanel_layout, ui_uploader_tileWidget, ui_uploader_core, sign_v2_api, sign_v2_b2e_documentBlock, ui_icons, ui_entitySelector, ui_notification) {
	'use strict';

	class DragDropHandler {
		#layout;
		#isDragOver = false;
		#onDragEnter;
		constructor(layout, options = {}) {
			this.#layout = layout;
			this.#onDragEnter = options.onDragEnter;
			this.#bindEvents();
		}
		#bindEvents() {
			main_core.Event.bind(this.#layout, 'dragenter', this.#handleDragEnter.bind(this));
			main_core.Event.bind(this.#layout, 'dragover', this.#handleDragOver.bind(this));
			main_core.Event.bind(this.#layout, 'drop', this.#handleDrop.bind(this));
			main_core.Event.bind(this.#layout, 'dragleave', this.#handleDragLeave.bind(this));
		}
		#handleDragEnter(event) {
			event.preventDefault();
			this.#setDragState();
			if (this.#onDragEnter) {
				this.#onDragEnter(event);
			}
		}
		#handleDragOver(event) {
			event.preventDefault();
		}
		#handleDrop(event) {
			event.preventDefault();
			this.#resetDragState();
		}
		#handleDragLeave(event) {
			if (!this.#layout.contains(event.relatedTarget)) {
				this.#resetDragState();
			}
		}
		#resetDragState() {
			if (this.#isDragOver) {
				this.#isDragOver = false;
				main_core.Dom.removeClass(this.#layout, '--drag-over');
				main_core.Dom.removeClass(this.#layout, '--dragging');
			}
		}
		#setDragState() {
			if (!this.#isDragOver) {
				this.#isDragOver = true;
				main_core.Dom.addClass(this.#layout, '--drag-over');
				main_core.Dom.addClass(this.#layout, '--dragging');
			}
		}
	}

	class ListItem {
		#layout;
		#props;
		#titleNode;
		#descriptionNode;
		#linkNode;
		#contentNode;
		#dragOverlayNode;
		constructor(props) {
			this.#titleNode = main_core.Tag.render`
			<span class="sign-blank-selector__list_item-title"></span>
		`;
			this.#descriptionNode = main_core.Tag.render`
			<span class="sign-blank-selector__list_item-info"></span>
		`;
			this.#linkNode = null;
			this.setProps(props);
		}
		#createListItem() {
			const {
				title,
				description,
				modifier,
				link,
				onLinkClick,
				isNew,
				isB2eBlankScenario
			} = this.getProps();
			this.setTitle(title);
			this.setDescription(description);
			const children = [this.#titleNode, this.#descriptionNode];
			if (link && onLinkClick) {
				this.#linkNode = main_core.Tag.render`
				<a class="sign-blank-selector__list_item-link" onclick="${e => {
				e.stopPropagation();
				onLinkClick();
			}}">
					${main_core.Text.encode(link)}
				</a>
			`;
				children.push(this.#linkNode);
			}
			if (isNew) {
				const badgeText = main_core.Loc.getMessage('SIGN_BLANK_SELECTOR_NEW_BADGE');
				const badge = main_core.Tag.render`
				<span class="sign-blank-selector__list_item-badge" title="${main_core.Text.encode(badgeText)}">
					${main_core.Text.encode(badgeText)}
				</span>
			`;
				children.push(badge);
			}
			if (isB2eBlankScenario) {
				this.#contentNode = main_core.Tag.render`
				<div class="sign-blank-selector__list_item-content">
					${children}
				</div>
			`;
				const {
					dragDescriptionTextHTML
				} = this.getProps();
				this.#dragOverlayNode = main_core.Tag.render`
				<div class="sign-blank-selector__list_item-drag-overlay">
					<div class="sign-blank-selector__list_item-drag-overlay-content">
						<span class="sign-blank-selector__list_item-drag-overlay-title">
							${main_core.Text.encode(title)}
						</span>
						<span>
							${dragDescriptionTextHTML}
						</span>
					</div>
				</div>
			`;
				const layout = main_core.Tag.render`
				<div class="sign-blank-selector__list_item --${main_core.Text.encode(modifier)} --b2e">
					${this.#contentNode}
					${this.#dragOverlayNode}
				</div>
			`;
				this.#bindDragEvents(layout);
				return layout;
			}
			return main_core.Tag.render`
			<div class="sign-blank-selector__list_item --${main_core.Text.encode(modifier)} --b2b">
				${children}
			</div>
		`;
		}
		#bindDragEvents(layout) {
			new DragDropHandler(layout, {
				onDragEnter: event => {
					const {
						onDragEnter
					} = this.getProps();
					if (onDragEnter) {
						onDragEnter(event);
					}
				}
			});
		}
		getLayout() {
			if (this.#layout) {
				return this.#layout;
			}
			this.#layout = this.#createListItem();
			return this.#layout;
		}
		setTitle(title = '') {
			this.#titleNode.textContent = title;
			this.#titleNode.title = title;
			this.setProps({
				...this.getProps(),
				title
			});
		}
		setDescription(description = '') {
			this.#descriptionNode.textContent = description;
			this.#descriptionNode.title = description;
			this.setProps({
				...this.getProps(),
				description
			});
		}
		getProps() {
			return this.#props;
		}
		setProps(props) {
			this.#props = props;
		}
	}

	class Blank extends ListItem {
		#placeholder;
		#preview;
		#loader;
		constructor(props) {
			super({
				...props,
				modifier: 'blank'
			});
			this.#placeholder = main_core.Tag.render`<div class="sign-blank-selector__list_item-status"></div>`;
			this.#preview = main_core.Tag.render`
			<div class="sign-blank-selector__list_item-preview" hidden>
				<img
					onload="${() => {
			this.#preview.hidden = false;
			this.#placeholder.hidden = true;
		}}"
				/>
			</div>
		`;
			this.#loader = new main_loader.Loader({
				size: 30,
				target: this.#placeholder
			});
			const layout = this.getLayout();
			main_core.Dom.prepend(this.#placeholder, layout);
			main_core.Dom.prepend(this.#preview, layout);
		}
		setAvatarWithDescription(description, userAvatarUrl) {
			this.setDescription(description);
			this.setProps({
				...this.getProps(),
				userAvatarUrl
			});
			const avatarIcon = userAvatarUrl ? main_core.Tag.render`
				<img class="sign-blank-selector__list_item-info-avatar" src="${userAvatarUrl}" />
			` : main_core.Tag.render`
				<span class="sign-blank-selector__list_item-info-avatar ui-icon ui-icon-common-user">
					<i></i>
				</span>
			`;
			const {
				lastElementChild: descriptionNode
			} = this.getLayout();
			main_core.Dom.prepend(avatarIcon, descriptionNode);
		}
		select() {
			main_core.Dom.addClass(this.getLayout(), '--active');
		}
		deselect() {
			main_core.Dom.removeClass(this.getLayout(), '--active');
			this.getLayout().blur();
		}
		remove() {
			main_core.Dom.remove(this.getLayout());
		}
		setId(id) {
			this.getLayout().dataset.id = id;
		}
		setReady(isReady) {
			if (!isReady) {
				this.#loader.show();
				return;
			}
			const layout = this.getLayout();
			layout.tabIndex = '0';
			this.#loader.hide();
			main_core.Dom.addClass(layout, '--loaded');
		}
		setPreview(previewUrl) {
			if (previewUrl) {
				this.#preview.firstElementChild.src = previewUrl;
			}
		}
	}

	/**
	 * @namespace BX.Sign.V2
	 */
	class BlankField extends main_core_events.EventEmitter {
		#cache = new main_core.Cache.MemoryCache();
		constructor(options) {
			super();
			this.setEventNamespace('BX.Sign.BlankSelector.BlankField');
			this.subscribeFromOptions(options?.events);
			this.#setOptions(options);
			const blankId = options?.data?.blankId;
			if (main_core.Type.isStringFilled(blankId) || main_core.Type.isNumber(blankId)) {
				this.#getApi().getBlankById(options.data.blankId).then(({
					id,
					title
				}) => {
					this.#getTagSelector().addTag({
						id,
						title,
						entityId: 'blank'
					});
				});
			}
		}
		#setOptions(options) {
			this.#cache.set('options', options);
		}
		#getOptions() {
			return this.#cache.get('options', {});
		}
		#getApi() {
			return this.#cache.remember('api', () => new sign_v2_api.Api());
		}
		#getBlankSelector() {
			return this.#cache.remember('blankSelector', () => {
				return new BlankSelector({
					...this.#getOptions().selectorOptions,
					events: {
						toggleSelection: event => {
							const {
								id,
								title,
								selected
							} = event.getData();
							const tagSelector = this.#getTagSelector();
							if (selected) {
								tagSelector.addTag({
									id,
									title,
									entityId: 'blank'
								});
								tagSelector.showAddButton();
								this.emit('onSelect', event);
								return;
							}
							if (tagSelector.getTags().length === 0) {
								tagSelector.showAddButton();
							}
							this.emit('onCancel');
						},
						onSliderClose: () => {
							const tagSelector = this.#getTagSelector();
							if (tagSelector.getTags().length === 0) {
								tagSelector.showAddButton();
							}
							this.#resetBlankSelector();
						}
					}
				});
			});
		}
		#getTagSelector() {
			return this.#cache.remember('tagSelector', () => {
				return new ui_entitySelector.TagSelector({
					id: main_core.Text.getRandom(),
					multiple: false,
					showTextBox: false,
					addButtonCaption: main_core.Loc.getMessage('SIGN_BLANK_SELECTOR_FIELD_ADD_BUTTON_LABEL'),
					tagMaxWidth: 500,
					events: {
						onAddButtonClick: () => {
							this.#getBlankSelector().openInSlider();
							this.#getTagSelector().hideTextBox();
						},
						onAfterTagRemove: () => {
							this.#getTagSelector().hideTextBox();
							this.#getTagSelector().showAddButton();
							this.emit('onRemove');
						}
					}
				});
			});
		}
		getLayout() {
			return this.#cache.remember('layout', () => {
				const layout = main_core.Tag.render`
				<div class="sign-blank-selector-field">
				</div>
			`;
				this.#getTagSelector().renderTo(layout);
				return layout;
			});
		}
		renderTo(targetContainer) {
			if (main_core.Type.isDomNode(targetContainer)) {
				main_core.Dom.append(this.getLayout(), targetContainer);
			}
		}
		#resetBlankSelector() {
			this.#cache.delete('blankSelector');
		}
	}

	const blankType = Object.freeze({
		default: 'default',
		placeholders: 'placeholders'
	});
	const uploaderOptions = {
		controller: 'sign.upload.blankUploadController',
		acceptedFileTypes: ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx', '.rtf', '.odt'],
		acceptedPlaceholdersFileTypes: ['.docx'],
		multiple: true,
		autoUpload: false,
		maxFileSize: 50 * 1024 * 1024,
		maxFileCount: 100,
		imageMaxFileSize: 10 * 1024 * 1024,
		maxTotalFileSize: 50 * 1024 * 1024
	};
	const imageExtensions = new Set(['jpg', 'jpeg', 'png']);
	const errorPopupOptions = {
		id: 'qwerty',
		padding: 20,
		offsetLeft: 40,
		offsetTop: -12,
		angle: true,
		darkMode: true,
		width: 300,
		autoHide: true,
		cacheable: false,
		bindOptions: {
			position: 'bottom'
		}
	};
	class BlankSelector extends main_core_events.EventEmitter {
		events = Object.freeze({
			beforeAddFileSuccessfully: 'beforeAddFileSuccessfully',
			toggleSelection: 'toggleSelection',
			addFile: 'addFile'
		});
		#cache = new main_core.Cache.MemoryCache();
		#blanks;
		#tileWidget;
		#tileWidgetContainer;
		#uploadButtonsContainer;
		#relatedTarget;
		#blanksContainer;
		#page;
		#loadMoreButton;
		#api;
		#config;
		#isPlaceholdersUpload = false;
		#browseAcceptMap = new WeakMap();
		constructor(config) {
			super();
			this.setEventNamespace('BX.Sign.V2.BlankSelector');
			this.subscribeFromOptions(config?.events ?? {});
			this.#config = config;
			this.selectedBlankId = 0;
			this.#blanks = new Map();
			this.#page = 0;
			this.#isPlaceholdersUpload = false;
			const uploadButtons = this.#createUploadButtons();
			const dragArea = main_core.Tag.render`
			<label class="sign-blank-selector__list_drag-area-label">
				${main_core.Loc.getMessage('SIGN_BLANK_SELECTOR_DRAG_AREA')}
			</label>
		`;
			const widgetOptions = {
				slots: {
					afterDropArea: {
						computed: {
							title: () => main_core.Loc.getMessage('SIGN_BLANK_SELECTOR_CLEAR_ALL')
						},
						methods: {
							clear: () => {
								this.clearFiles({
									removeFromServer: false
								});
							}
						},
						template: `
						<span
							class="sign-blank-selector__tile-widget_clear-btn"
							:title="title"
							@click="clear()"
						>
						</span>
					`
					}
				}
			};
			this.#uploadButtonsContainer = main_core.Tag.render`
			<div class="sign-blank-selector__list --with-buttons">
				${uploadButtons}
				${dragArea}
			</div>
		`;
			new DragDropHandler(this.#uploadButtonsContainer);
			this.#tileWidget = new ui_uploader_tileWidget.TileWidget({
				...uploaderOptions,
				...config.uploaderOptions,
				dropElement: this.#uploadButtonsContainer,
				browseElement: [...uploadButtons, dragArea],
				events: {
					[ui_uploader_core.UploaderEvent.BEFORE_FILES_ADD]: event => this.#onFileBeforeAdd(event),
					[ui_uploader_core.UploaderEvent.BEFORE_BROWSE]: event => this.#onBeforeBrowse(event),
					[ui_uploader_core.UploaderEvent.FILE_ADD]: event => this.#onFileAdd(event),
					[ui_uploader_core.UploaderEvent.FILE_REMOVE]: event => this.#onFileRemove(event),
					[ui_uploader_core.UploaderEvent.UPLOAD_START]: event => this.#onUploadStart(event),
					[ui_uploader_core.UploaderEvent.UPLOAD_COMPLETE]: event => this.#onUploadComplete(event)
				}
			}, widgetOptions);
			this.#relatedTarget = null;
			main_core.Event.bind(document, 'mousedown', event => {
				this.#relatedTarget = event.target;
			});
			this.#blanksContainer = main_core.Tag.render`
			<div
				class="sign-blank-selector__list"
				onfocusin="${({
			target
		}) => {
			this.selectBlank(Number(target.dataset.id));
		}}"
				onclick="${({
			target,
			ctrlKey,
			metaKey
		}) => {
			if (ctrlKey || metaKey) {
				this.resetSelectedBlank(Number(target.dataset.id), this.#relatedTarget);
			}
		}}"
			></div>
		`;
			this.#tileWidgetContainer = main_core.Tag.render`
			<div class="sign-blank-selector__tile-widget"></div>
		`;
			this.#loadMoreButton = main_core.Tag.render`
			<div class="sign-blank-selector__load-more --hidden">
				<span onclick="${() => this.#loadBlanks(this.#page + 1)}">
					${main_core.Loc.getMessage('SIGN_BLANK_SELECTOR_LOAD_MORE')}
				</span>
			</div>
		`;
			this.#api = new sign_v2_api.Api();
		}
		#getAcceptedFileTypes() {
			return this.#isPlaceholdersUpload ? uploaderOptions.acceptedPlaceholdersFileTypes : uploaderOptions.acceptedFileTypes;
		}
		#isB2eBlankScenario() {
			return this.#config?.type === sign_type.BlankScenario.b2e;
		}
		#checkForFilesValid(addedFiles) {
			const isImage = file => file.getType().includes('image/');
			const allAddedImages = addedFiles.every(file => isImage(file));
			const uploader = this.#tileWidget.getUploader();
			const files = uploader.getFiles();
			const filesLength = files.length;
			const imagesLimit = this.#getImagesLimit();
			const isB2eAutoCommit = this.#isB2eBlankScenario() && !sign_v2_signSettings.isTemplateMode(this.#config.documentMode) && filesLength > 0 && (addedFiles.length === 1 || allAddedImages);
			const acceptedFileTypes = isB2eAutoCommit && !this.#isPlaceholdersUpload ? uploaderOptions.acceptedFileTypes : this.#getAcceptedFileTypes();
			const validExtension = addedFiles.every(file => {
				// TODO merge with this.#config.uploaderOptions.acceptedFileTypes
				return acceptedFileTypes.includes(`.${file.getExtension()}`);
			});
			if (!validExtension || addedFiles.length > 1 && !allAddedImages) {
				return false;
			}
			if (filesLength === 0 && addedFiles.length === 1) {
				return true;
			}
			if (isB2eAutoCommit) {
				const exceedsImagesLimit = addedFiles.length > 1 && addedFiles.length > imagesLimit;
				return !exceedsImagesLimit;
			}
			const allExistImages = files.every(file => isImage(file));
			return allAddedImages && allExistImages && imagesLimit - filesLength >= addedFiles.length;
		}
		#onBeforeBrowse(event) {
			const {
				input,
				node
			} = event.getData();
			const acceptList = this.#browseAcceptMap.get(node);
			if (main_core.Type.isArrayFilled(acceptList)) {
				input.setAttribute('accept', acceptList.join(','));
			}
		}
		#onFileBeforeAdd(uploaderEvent) {
			const {
				files: addedFiles
			} = uploaderEvent.getData();
			const hasOversizedImage = !this.#isPlaceholdersUpload && addedFiles.some(file => {
				return file.getType().includes('image/') && file.getSize() > uploaderOptions.imageMaxFileSize;
			});
			if (hasOversizedImage) {
				const messageCode = addedFiles.length > 1 ? 'SIGN_BLANK_SELECTOR_UPLOAD_IMAGE_SIZE_GROUP_HINT' : 'SIGN_BLANK_SELECTOR_UPLOAD_IMAGE_SIZE_HINT';
				this.#showUploadErrorPopup(messageCode);
				uploaderEvent.preventDefault();
				return;
			}
			const valid = this.#checkForFilesValid(addedFiles);
			if (valid) {
				const selfEvent = new main_core_events.BaseEvent({
					data: {
						files: addedFiles,
						isPlaceholdersUpload: this.#isPlaceholdersUpload
					}
				});
				this.emit(this.events.beforeAddFileSuccessfully, selfEvent);
				if (selfEvent.isDefaultPrevented()) {
					uploaderEvent.preventDefault();
				}
				return;
			}
			let messageCode = 'SIGN_BLANK_SELECTOR_UPLOAD_HINT';
			const hasExistingFiles = this.#tileWidget.getUploader().getFiles().length > 0;
			const isLimitHint = hasExistingFiles && sign_v2_signSettings.isTemplateMode(this.#config.documentMode);
			if (this.#isPlaceholdersUpload) {
				messageCode = isLimitHint ? 'SIGN_BLANK_SELECTOR_UPLOAD_LIMIT_HINT' : 'SIGN_BLANK_SELECTOR_UPLOAD_PLACEHOLDERS_HINT';
			} else if (this.#isB2eBlankScenario() && isLimitHint) {
				messageCode = 'SIGN_BLANK_SELECTOR_UPLOAD_LIMIT_HINT';
			}
			this.#showUploadErrorPopup(messageCode);
			uploaderEvent.preventDefault();
		}
		#showUploadErrorPopup(messageCode) {
			let bindElement = this.#uploadButtonsContainer.firstElementChild;
			if (this.#isPlaceholdersUpload) {
				bindElement = this.#uploadButtonsContainer.querySelector('.--placeholders') ?? bindElement;
			} else if (this.#isB2eBlankScenario()) {
				bindElement = this.#uploadButtonsContainer.querySelector('.--mixed') ?? bindElement;
			}
			if (main_core.Dom.hasClass(this.#uploadButtonsContainer, '--hidden')) {
				const {
					$refs: {
						container
					}
				} = this.#tileWidget.getRootComponent();
				bindElement = container.firstElementChild;
			}

			// Wait for CSS transition to complete before showing popup
			setTimeout(() => {
				const errorPopup = new main_popup.Popup({
					...errorPopupOptions,
					bindElement,
					content: main_core.Loc.getMessage(messageCode, {
						'%imageCountLimit%': this.#getImagesLimit()
					})
				});
				errorPopup.show();
				setTimeout(() => errorPopup.close(), 7000);
			}, 200);
		}
		#getImagesLimit() {
			return main_core.Type.isInteger(parseInt(this.#config?.uploaderOptions?.maxFileCount, 10)) ? this.#config?.uploaderOptions?.maxFileCount : uploaderOptions.maxFileCount;
		}
		#onFileAdd(event) {
			const file = event.data.file;
			const title = file.getName();
			const uploadType = this.#getUploadType();
			const isImage = this.#isImageFile(file);
			file.setCustomData('uploadType', uploadType);
			if (this.#shouldShowTileUploader(isImage, uploadType)) {
				this.#toggleTileVisibility(true);
			}
			this.resetSelectedBlank();
			this.emit(this.events.addFile, {
				title: this.#normalizeTitle(title),
				isImage,
				isMixedB2eUpload: this.#isMixedB2eUpload(uploadType),
				filesCount: this.#tileWidget.getUploader().getFiles().length
			});
		}
		#onUploadComplete() {
			this.#isPlaceholdersUpload = false;
		}
		#getUploadType() {
			return this.#isPlaceholdersUpload ? blankType.placeholders : blankType.default;
		}
		#isImageFile(file) {
			const mimeType = file.getType();
			if (main_core.Type.isStringFilled(mimeType) && mimeType.startsWith('image/')) {
				return true;
			}
			const extension = file.getExtension().toLowerCase();
			return imageExtensions.has(extension);
		}
		#isMixedB2eUpload(uploadType) {
			return uploadType === blankType.default;
		}
		#shouldShowTileUploader(isImage, uploadType) {
			if (!this.#isB2eBlankScenario()) {
				return true;
			}
			const isTemplate = sign_v2_signSettings.isTemplateMode(this.#config.documentMode);
			const isMixedImage = isImage && this.#isMixedB2eUpload(uploadType);
			return isTemplate && isMixedImage;
		}
		getUploadedFileName(fileIndex) {
			const uploader = this.#tileWidget.getUploader();
			const files = uploader.getFiles();
			if (files.length === 0) {
				return null;
			}
			const file = files.at(fileIndex);
			if (!file) {
				return null;
			}
			return this.#normalizeTitle(file.getName());
		}
		#onFileRemove(event) {
			this.emit('removeFile');
			const uploader = this.#tileWidget.getUploader();
			const files = uploader.getFiles();
			if (files.length === 0) {
				this.#toggleTileVisibility(false);
				this.emit('clearFiles');
			}
		}
		#onUploadStart() {
			const uploader = this.#tileWidget.getUploader();
			const [firstFile] = uploader.getFiles();
			const title = firstFile.getName();
			const fileId = firstFile.getId();
			const uploadingBlank = new Blank({
				title
			});
			uploadingBlank.setReady(false);
			main_core.Dom.prepend(uploadingBlank.getLayout(), this.#blanksContainer);
			firstFile.setCustomData(fileId, uploadingBlank);
		}
		#toggleTileVisibility(shouldShow) {
			const hiddenClass = '--hidden';
			if (shouldShow) {
				main_core.Dom.removeClass(this.#tileWidgetContainer, hiddenClass);
				main_core.Dom.addClass(this.#uploadButtonsContainer, hiddenClass);
				return;
			}
			main_core.Dom.addClass(this.#tileWidgetContainer, hiddenClass);
			main_core.Dom.removeClass(this.#uploadButtonsContainer, hiddenClass);
			this.clearFiles({
				removeFromServer: false
			});
		}
		#createUploadButtons() {
			const entries = Object.entries(this.#getUploadButtonsConfig());
			return entries.map(([key, config]) => {
				const isPlaceholders = key === blankType.placeholders;
				const listItem = new ListItem({
					title: config.title,
					description: config.description,
					modifier: key,
					link: config.link ?? null,
					onLinkClick: config.onLinkClick ?? null,
					isNew: isPlaceholders,
					isB2eBlankScenario: this.#isB2eBlankScenario(),
					dragDescriptionTextHTML: config.dragDescriptionTextHTML ?? null,
					onDragEnter: () => {
						this.#isPlaceholdersUpload = isPlaceholders;
					}
				});
				const layout = listItem.getLayout();
				main_core.Event.bind(layout, 'click', () => {
					this.#isPlaceholdersUpload = isPlaceholders;
				});
				if (main_core.Type.isArrayFilled(config.acceptedFileTypes)) {
					this.#browseAcceptMap.set(layout, config.acceptedFileTypes);
				}
				return layout;
			});
		}
		#getUploadButtonsConfig() {
			if (this.#isB2eBlankScenario()) {
				return this.#getB2eButtonsConfig();
			}
			return this.#getB2bButtonsConfig();
		}
		#getB2bButtonsConfig() {
			return {
				img: {
					title: main_core.Loc.getMessage('SIGN_BLANK_SELECTOR_CREATE_NEW_PIC'),
					description: 'jpeg, png'
				},
				pdf: {
					title: main_core.Loc.getMessage('SIGN_BLANK_SELECTOR_NEW_PDF'),
					description: 'Adobe Acrobat'
				},
				doc: {
					title: main_core.Loc.getMessage('SIGN_BLANK_SELECTOR_NEW_DOC'),
					description: 'doc, docx'
				}
			};
		}
		#getB2eButtonsConfig() {
			const toAcceptList = extensions => extensions.map(ext => `.${ext}`);
			return {
				placeholders: {
					title: 'docx',
					description: main_core.Loc.getMessage('SIGN_BLANK_SELECTOR_PLACEHOLDERS_DOCX_MSGVER_1'),
					dragDescriptionTextHTML: main_core.Loc.getMessage('SIGN_BLANK_SELECTOR_DROP_ZONE_PLACEHOLDERS', {
						'[highlight]': '<span class="sign-blank-selector__list_item-drag-overlay-highlighting">',
						'[/highlight]': '</span>'
					}),
					acceptedFileTypes: toAcceptList(sign_v2_b2e_documentBlock.getAllowedReplaceExtensions(true))
				},
				mixed: {
					title: 'pdf, png, doc, jpeg',
					description: main_core.Loc.getMessage('SIGN_BLANK_SELECTOR_MIXED'),
					dragDescriptionTextHTML: main_core.Loc.getMessage('SIGN_BLANK_SELECTOR_DROP_ZONE_MIXED', {
						'[highlight]': '<span class="sign-blank-selector__list_item-drag-overlay-highlighting">',
						'[/highlight]': '</span>'
					}),
					acceptedFileTypes: toAcceptList(sign_v2_b2e_documentBlock.getAllowedReplaceExtensions(false))
				}
			};
		}
		async #resumeUploading() {
			const uploader = this.#tileWidget.getUploader();
			if (uploader.getPendingFileCount() === 0) {
				return;
			}
			const pendingFiles = uploader.getFiles();
			uploader.setMaxParallelUploads(pendingFiles.length);
			const uploadPromise = new Promise(resolve => {
				uploader.subscribeOnce('onUploadComplete', resolve);
			});
			uploader.start();
			await uploadPromise;
		}
		async createBlankFromOuterUploaderFiles(files) {
			if (files.length === 0) {
				return;
			}
			if (!this.#isAllFileUploadsComplete(files)) {
				const errorMessage = main_core.Loc.getMessage('SIGN_BLANK_SELECTOR_UPLOADER_ERROR_INCOMPLETE');
				ui_notification.UI.Notification.Center.notify({
					content: errorMessage
				});
				throw new Error(errorMessage);
			}
			const firstFile = files.at(0);
			const blank = new Blank({
				title: firstFile.getName()
			});
			blank.setReady(false);
			main_core.Dom.prepend(blank.getLayout(), this.#blanksContainer);
			try {
				const filesIds = files.map(file => file.getServerFileId());
				const hasPlaceholders = files.some(file => file.getCustomData('uploadType') === blankType.placeholders);
				const blankData = await this.#api.createBlank(filesIds, this.#config.type ?? null, sign_v2_signSettings.isTemplateMode(this.#config.documentMode), hasPlaceholders);
				this.#setupBlank({
					...blankData,
					userName: main_core.Loc.getMessage('SIGN_BLANK_SELECTOR_CREATED_MYSELF'),
					hasPlaceholders
				}, blank);
				return blankData.id;
			} catch (ex) {
				blank?.remove?.();
				console.log(ex);
				throw ex;
			}
		}
		async createBlank() {
			const uploader = this.#tileWidget.getUploader();
			const files = uploader.getFiles();
			if (files.length === 0) {
				return;
			}
			const [firstFile] = files;
			await this.#resumeUploading();
			const blank = firstFile.getCustomData(firstFile.getId());
			const failedFiles = files.filter(file => {
				return file.getStatus() !== ui_uploader_core.FileStatus.COMPLETE || main_core.Type.isNull(file.getServerFileId());
			});
			if (failedFiles.length > 0) {
				failedFiles.forEach(file => {
					uploader.removeFile(file, {
						removeFromServer: false
					});
				});
				if (failedFiles.length === files.length) {
					blank?.remove?.();
				}
				const errorMessage = main_core.Loc.getMessage('SIGN_BLANK_SELECTOR_UPLOADER_ERROR_INCOMPLETE');
				ui_notification.UI.Notification.Center.notify({
					content: errorMessage
				});
				throw new Error(errorMessage);
			}
			try {
				const filesIds = files.map(file => file.getServerFileId());
				const hasPlaceholders = files.some(file => file.getCustomData('uploadType') === 'placeholders');
				const blankData = await this.#api.createBlank(filesIds, this.#config.type ?? null, sign_v2_signSettings.isTemplateMode(this.#config.documentMode), hasPlaceholders);
				this.#setupBlank({
					...blankData,
					userName: main_core.Loc.getMessage('SIGN_BLANK_SELECTOR_CREATED_MYSELF'),
					hasPlaceholders
				}, blank);
				return blankData.id;
			} catch (ex) {
				blank.remove();
				throw ex;
			}
		}
		async #loadBlanks(page) {
			const loader = new main_loader.Loader({
				target: this.#blanksContainer,
				size: 80,
				mode: 'custom'
			});
			loader.show();
			try {
				const blanksOnPage = 3;
				const data = await this.#api.loadBlanks(page, this.#config.type ?? null, blanksOnPage);
				if (data.length < blanksOnPage) {
					main_core.Dom.addClass(this.#loadMoreButton, '--hidden');
				} else {
					main_core.Dom.removeClass(this.#loadMoreButton, '--hidden');
				}
				if (data.length > 0) {
					data.forEach(blankData => {
						if (this.hasBlank(blankData.id)) {
							return;
						}
						const {
							title
						} = blankData;
						const blank = new Blank({
							title
						});
						this.#addBlank(blankData, blank);
					});
					this.#page = page;
				}
			} catch {
				main_core.Dom.removeClass(this.#loadMoreButton, '--hidden');
			}
			loader.destroy();
		}
		#setupBlank(blankData, blank) {
			const {
				id: blankId,
				previewUrl,
				userAvatarUrl,
				userName,
				dateCreate,
				hasPlaceholders = false
			} = blankData;
			const creationDate = dateCreate ? new Date(dateCreate) : new Date();
			const descriptionText = `${userName}, ${main_date.DateTimeFormat.format('j M. Y', creationDate)}`;
			blank.setId(blankId);
			blank.setReady(true);
			blank.setPreview(previewUrl);
			blank.setAvatarWithDescription(descriptionText, userAvatarUrl);
			if (hasPlaceholders) {
				blank.getLayout().dataset.hasPlaceholders = 'true';
			}
			this.#blanks.set(blankId, blank);
		}
		#normalizeTitle(title) {
			const acceptedType = uploaderOptions.acceptedFileTypes.find(fileType => {
				return title.endsWith(fileType);
			});
			if (!acceptedType) {
				return title;
			}
			const dotExtensionIndex = title.lastIndexOf(acceptedType);
			return title.slice(0, dotExtensionIndex);
		}
		#addBlank(blankData, blank) {
			this.#setupBlank(blankData, blank);
			main_core.Dom.append(blank.getLayout(), this.#blanksContainer);
		}
		resetSelectedBlank() {
			const previousSelectedBlankId = this.selectedBlankId;
			const blank = this.getBlank(this.selectedBlankId);
			blank?.deselect();
			this.selectedBlankId = 0;
			if (blank) {
				this.emit(this.events.toggleSelection, {
					selected: false,
					previousSelectedBlankId
				});
			}
			this.#enableSaveButtonIntoSlider();
		}
		async modifyBlankTitle(blankId, blankTitle) {
			let blank = this.#blanks.get(blankId);
			if (!blank) {
				await this.loadBlankById(blankId);
				blank = this.#blanks.get(blankId);
			}
			blank.setTitle(blankTitle);
		}
		hasBlank(blankId) {
			return this.#blanks.has(blankId);
		}
		getBlank(blankId) {
			return this.#blanks.get(blankId);
		}
		async loadBlankById(blankId) {
			const blankData = await this.#api.getBlankById(blankId);
			if (!this.hasBlank(blankId)) {
				const blank = new Blank({
					title: blankData.title
				});
				this.#addBlank(blankData, blank);
			}
		}
		async selectBlank(blankId, eventExtraOptions = {}) {
			const previousSelectedBlankId = this.selectedBlankId;
			if (blankId !== this.selectedBlankId) {
				this.resetSelectedBlank();
			}
			this.selectedBlankId = blankId;
			this.#toggleTileVisibility(false);
			let blank = this.getBlank(blankId);
			if (!blank) {
				await this.loadBlankById(blankId);
				blank = this.getBlank(blankId);
			}
			const {
				title
			} = blank.getProps();
			blank.select();
			this.emit(this.events.toggleSelection, {
				id: blankId,
				selected: true,
				title: this.#normalizeTitle(title),
				extra: eventExtraOptions,
				previousSelectedBlankId
			});
		}
		deleteBlank(blankId) {
			const lastBlank = this.#blanks.get(blankId);
			if (lastBlank) {
				this.#blanks.delete(blankId);
				lastBlank.remove();
			}
		}
		clearFiles(options) {
			const uploader = this.#tileWidget.getUploader();
			uploader.removeFiles(options);
		}
		addFiles(files, options = {}) {
			if (main_core.Type.isBoolean(options.isPlaceholdersUpload)) {
				this.#isPlaceholdersUpload = options.isPlaceholdersUpload;
			}
			const uploader = this.#tileWidget.getUploader();
			uploader.addFiles(files);
		}
		isFilesReadyForUpload() {
			if (this.#tileWidget.getUploader().getFiles().length === 0) {
				return false;
			}
			return this.#tileWidget.getUploader().getFiles().every(file => file.getErrors().length <= 0);
		}
		hasPlaceholderFilesForUpload() {
			return this.#tileWidget.getUploader().getFiles().some(file => file.getCustomData('uploadType') === blankType.placeholders);
		}
		getLayout() {
			this.#tileWidget.renderTo(this.#tileWidgetContainer);
			this.#toggleTileVisibility(false);
			const canUploadNewBlank = this.#config.canUploadNewBlank ?? true;
			const titleBlock = this.#isB2eBlankScenario() ? '' : main_core.Tag.render`
				<p class="sign-blank-selector__templates_title">
					${main_core.Loc.getMessage('SIGN_BLANK_SELECTOR_RECENT_TEMPLATES_TITLE')}
				</p>
			`;
			const selectorContainer = main_core.Tag.render`
			<div class="sign-blank-selector">
				${this.#tileWidgetContainer}
				${canUploadNewBlank ? this.#uploadButtonsContainer : ''}
				${titleBlock}
				${this.#isB2eBlankScenario() ? '' : this.#blanksContainer}
				${this.#isB2eBlankScenario() ? '' : this.#loadMoreButton}
			</div>
		`;
			if (this.#page === 0) {
				this.#loadBlanks(1);
			}
			return selectorContainer;
		}
		openInSlider() {
			const SidePanel = main_core.Reflection.getClass('BX.SidePanel');
			if (!main_core.Type.isNil(SidePanel)) {
				SidePanel.Instance.open('v2-blank-selector', {
					width: 628,
					cacheable: false,
					events: {
						onClose: () => {
							this.emit('onSliderClose');
						}
					},
					contentCallback: () => {
						return ui_sidepanel_layout.Layout.createContent({
							extensions: ['sign.v2.blank-selector'],
							title: main_core.Loc.getMessage('SIGN_BLANK_SELECTOR_SLIDER_TITLE'),
							content: () => this.getLayout(),
							buttons: ({
								cancelButton,
								SaveButton
							}) => {
								this.#setSaveButtonIntoSlider(new SaveButton({
									text: main_core.Loc.getMessage('SIGN_BLANK_SELECTOR_SLIDER_SELECT_BLANK_BUTTON_LABEL'),
									onclick: () => {
										SidePanel.Instance.close();
									}
								}));
								this.#disableSaveButtonIntoSlider();
								return [this.#getSaveButtonIntoSlider(), cancelButton];
							}
						});
					}
				});
			}
		}
		#setSaveButtonIntoSlider(button) {
			this.#cache.set('saveButton', button);
		}
		#disableSaveButtonIntoSlider() {
			const saveButton = this.#getSaveButtonIntoSlider();
			saveButton?.setDisabled(true);
		}
		#enableSaveButtonIntoSlider() {
			const saveButton = this.#getSaveButtonIntoSlider();
			saveButton?.setDisabled(false);
		}
		#getSaveButtonIntoSlider() {
			return this.#cache.get('saveButton');
		}
		disableSelectedBlank(blankId) {
			const blank = this.#blanks.get(blankId);
			if (blank) {
				main_core.Dom.addClass(blank.getLayout(), '--disabled');
			}
		}
		enableSelectedBlank(blankId) {
			const blank = this.#blanks.get(blankId);
			if (blank) {
				main_core.Dom.removeClass(blank.getLayout(), '--disabled');
			}
		}
		#isAllFileUploadsComplete(files) {
			const notUploadedFiles = files.filter(file => {
				return file.getStatus() !== ui_uploader_core.FileStatus.COMPLETE || main_core.Type.isNull(file.getServerFileId());
			});
			return notUploadedFiles.length === 0;
		}
	}

	exports.BlankField = BlankField;
	exports.BlankSelector = BlankSelector;
	exports.ListItem = ListItem;

})(this.BX.Sign.V2 = this.BX.Sign.V2 || {}, BX, BX.Main, BX, BX.Main, BX.Event, BX.Sign, BX.Sign.V2, BX.UI.SidePanel, BX.UI.Uploader, BX.UI.Uploader, BX.Sign.V2, BX.Sign.V2.B2e, BX, BX.UI.EntitySelector, BX.UI.Notification);
//# sourceMappingURL=blank-selector.bundle.js.map
