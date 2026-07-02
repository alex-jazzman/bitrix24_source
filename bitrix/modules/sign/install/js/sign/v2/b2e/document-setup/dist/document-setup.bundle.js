/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
(function (exports, main_core, main_core_cache, main_popup, sign_featureStorage, sign_type, sign_v2_api, sign_v2_b2e_documentBlock, sign_v2_b2e_documentCounters, sign_v2_b2e_signDropdown, sign_v2_documentSetup, sign_v2_helper, sign_v2_signSettings, ui_uploader_core, main_core_events) {
	'use strict';

	class EditorIntegration {
		#api;
		#onApplied;
		#onFinished;
		constructor(api, onApplied, onFinished = () => {}) {
			this.#api = api;
			this.#onApplied = onApplied;
			this.#onFinished = onFinished;
		}
		async openEditor(documentData) {
			const {
				editUrl,
				diskFileId
			} = await this.#api.getEditUrl(documentData.uid);
			if (!editUrl) {
				return null;
			}
			let fileSaved = false;
			let editorClosed = false;
			let documentWasChanged = false;
			const tryApply = async () => {
				if (!fileSaved || !editorClosed) {
					if (editorClosed && !documentWasChanged) {
						unsubscribeAll();
						await this.#discardEditedFile(documentData, diskFileId);
						this.#onFinished();
					}
					return;
				}
				unsubscribeAll();
				await this.#applyEditedFile(documentData, diskFileId);
			};
			const handleSaved = event => {
				const data = event.getData();
				const object = Array.isArray(data) ? data[0] : data?.object;
				if (Number(object?.id) !== diskFileId) {
					return;
				}
				fileSaved = true;
				tryApply();
			};
			const handleClosed = event => {
				const [sliderEvent] = event.getData();
				if (sliderEvent.getEventId() !== 'Disk.OnlyOffice:onClosed') {
					return;
				}
				const eventData = sliderEvent.getData();
				if (Number(eventData?.object?.id) !== diskFileId) {
					return;
				}
				documentWasChanged = Boolean(eventData?.documentWasChanged);
			};
			const handleSliderClosed = () => {
				editorClosed = true;
				tryApply();
			};
			const unsubscribeAll = () => {
				main_core_events.EventEmitter.unsubscribe('Disk.OnlyOffice:onSaved', handleSaved);
				main_core_events.EventEmitter.unsubscribe('SidePanel.Slider:onMessage', handleClosed);
			};
			await main_core.Runtime.loadExtension('disk');
			main_core_events.EventEmitter.subscribe('Disk.OnlyOffice:onSaved', handleSaved);
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onMessage', handleClosed);
			main_core.Reflection.getClass('BX.SidePanel').Instance.open(editUrl, {
				width: '100%',
				cacheable: false,
				customLeftBoundary: 30,
				allowChangeHistory: false,
				data: {
					documentEditor: true
				},
				events: {
					onCloseComplete: handleSliderClosed
				}
			});
			return {
				diskFileId
			};
		}
		async #applyEditedFile(documentData, diskFileId) {
			try {
				const {
					blankId
				} = await this.#api.applyEditedFile(documentData.uid, diskFileId);
				await this.#onApplied(documentData, blankId);
			} catch (applyError) {
				console.error(applyError);
				window.top.BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('SIGN_V2_B2E_DOCUMENT_SETUP_EDITOR_APPLY_ERROR')
				});
			} finally {
				this.#onFinished();
			}
		}
		async #discardEditedFile(documentData, diskFileId) {
			try {
				await this.#api.discardEditedFile(documentData.uid, diskFileId);
			} catch (discardError) {
				console.error(discardError);
			}
		}
	}

	var placeholderCodeIcon = "/bitrix/js/sign/v2/b2e/document-setup/dist/assets/sign-wizard-placeholder-code-icon.svg";

	const HelpdeskCodes = Object.freeze({
		HowToWorkWithTemplates: '23174934'
	});
	const disabledClass = '--disabled';
	class DocumentSetup extends sign_v2_documentSetup.DocumentSetup {
		#cache = new main_core_cache.MemoryCache();
		#api;
		#region;
		#senderDocumentTypes;
		#documentSenderTypeDropdown;
		#documentTitleInput;
		documentCounters = null;
		#b2eDocumentLimitCount;
		#isOpenedFromRobot = false;
		#isOpenedFromTemplateFolder = false;
		#isOpenedAsFolder = false;
		#initiatedByType;
		#replaceUploader = null;
		#replaceDocumentData = null;
		#blockByElement = new WeakMap();
		#expectedAddFileCount = 0;
		#loadingBlock = null;
		#editorFlowPending = false;
		#editorIntegration;
		#blockEditorUnavailableHintPopup = null;
		constructor(blankSelectorConfig) {
			super(blankSelectorConfig);
			const {
				region,
				b2eDocumentLimitCount,
				isOpenedFromRobot,
				isOpenedFromTemplateFolder,
				isOpenedAsFolder,
				initiatedByType
			} = blankSelectorConfig;
			this.#api = new sign_v2_api.Api();
			this.#editorIntegration = new EditorIntegration(this.#api, this.#applyNewBlank.bind(this), () => {
				this.#editorFlowPending = false;
				this.ready = true;
				this.emit('editorUnlock');
			});
			this.#region = region;
			this.#b2eDocumentLimitCount = b2eDocumentLimitCount;
			this.editMode = false;
			this.onClickShowHintPopup = this.showHintPopup.bind(this);
			this.#isOpenedFromRobot = isOpenedFromRobot;
			this.#isOpenedFromTemplateFolder = isOpenedFromTemplateFolder;
			this.#isOpenedAsFolder = isOpenedAsFolder;
			this.#senderDocumentTypes = this.#getSenderDocumentTypes();
			this.#documentTitleInput = main_core.Tag.render`
			<input
					type="text"
					class="ui-ctl-element"
					maxlength="255"
					oninput="${({
			target
		}) => this.setDocumentTitle(target.value)}"
			/>
		`;
			this.#initiatedByType = initiatedByType;
			this.#disableDocumentInputs();
			this.#init();
		}
		#init() {
			this.#initDocumentSenderType();
			main_core.Dom.append(this.#getDocumentSenderTypeLayout(), this.layout);
			if (!this.isTemplateMode() && sign_featureStorage.FeatureStorage.isGroupSendingEnabled()) {
				this.documentCounters = new sign_v2_b2e_documentCounters.DocumentCounters({
					documentCountersLimit: this.#b2eDocumentLimitCount
				});
				main_core.Dom.append(this.documentCounters.getLayout(), this.titleCounterSlot);
				main_core.Dom.append(this.getAddDocumentNotice(), this.noticeSlot);
			}
			sign_v2_helper.Hint.create(this.layout);
			this.#subscribeOnEvents();
		}
		#getSenderDocumentTypes() {
			if (this.#isOpenedFromTemplateFolder || this.#isOpenedAsFolder) {
				return [sign_type.DocumentInitiated.company];
			}
			return Object.values(sign_type.DocumentInitiated);
		}
		#subscribeOnEvents() {
			const blankSelector = this.blankSelector;
			blankSelector.subscribe(blankSelector.events.toggleSelection, this.#onBlankSelectorToggleSelection.bind(this));
			blankSelector.subscribe(blankSelector.events.addFile, this.#onBlankSelectorAddFile.bind(this));
			blankSelector.subscribe(blankSelector.events.beforeAddFileSuccessfully, this.#onBlankSelectorBeforeAddFile.bind(this));
			if (!this.isTemplateMode() && sign_featureStorage.FeatureStorage.isGroupSendingEnabled()) {
				this.documentCounters.subscribe('limitNotExceeded', this.#refreshDocumentLimitState.bind(this));
				this.documentCounters.subscribe('limitExceeded', this.#refreshDocumentLimitState.bind(this));
			}
		}
		#onBlankSelectorBeforeAddFile(event) {
			const {
				files = []
			} = event.getData() ?? {};
			this.#expectedAddFileCount = files.length;
		}
		#refreshDocumentLimitState() {
			if (!this.documentCounters) {
				return;
			}
			if (this.#isDocumentLimitExceeded()) {
				this.#setDocumentLimitNoticeText();
				this.emit('documentsLimitExceeded');
				return;
			}
			this.#setAddDocumentNoticeText();
			this.emit('documentsLimitNotExceeded');
		}
		#onBlankSelectorAddFile(event) {
			const data = event.getData();
			this.isFileAdded = true;
			this.enableDocumentInputs();
			const isCombinedImageDocument = Boolean(data.isImage) && (data.filesCount ?? 1) > 1;
			const displayTitle = isCombinedImageDocument ? main_core.Loc.getMessage('SIGN_DOCUMENT_SETUP_COMBINED_IMAGE_DOCUMENT') : data.title;
			if (!this.isTemplateMode() || !this.isEditActionMode()) {
				this.setDocumentTitle(displayTitle);
			}
			const hasDocumentBlock = Boolean(this.layout?.querySelector('.sign-b2e-document-setup__document-block'));
			if (this.isTemplateMode() && hasDocumentBlock) {
				return;
			}
			if (this.#expectedAddFileCount > 1) {
				this.#expectedAddFileCount -= 1;
				return;
			}
			this.#expectedAddFileCount = 0;
			this.#showLoadingDocumentBlock(displayTitle, {
				isPlaceholderDocument: !data.isMixedB2eUpload
			});
			const completedHandler = () => {
				this.unsubscribe('addDocumentCompleted', completedHandler);
				this.#removeLoadingDocumentBlock();
			};
			this.subscribe('addDocumentCompleted', completedHandler);
			this.emit('addDocument');
		}
		#showLoadingDocumentBlock(title, options = {}) {
			if (!this.headerLayout) {
				return;
			}
			this.#removeLoadingDocumentBlock();
			const block = new sign_v2_b2e_documentBlock.DocumentBlock({
				documentData: {
					id: 'loadingDocumentId',
					title
				},
				options: {
					isPlaceholderDocument: options.isPlaceholderDocument,
					isLoading: true
				},
				api: this.#api,
				isTemplateMode: this.isTemplateMode()
			});
			this.#loadingBlock = block;
			main_core.Dom.append(block.getLayout(), this.headerLayout);
		}
		#removeLoadingDocumentBlock() {
			if (!this.#loadingBlock) {
				return;
			}
			this.#loadingBlock.destroy();
			this.#loadingBlock = null;
		}
		#onBlankSelectorToggleSelection(event) {
			if (this.blankIsNotSelected && this.editMode) {
				return;
			}
			const data = event.getData();
			this.setDocumentTitle(data.title);
			if (data.selected) {
				this.enableDocumentInputs();
			}
		}
		#isDocumentLimitExceeded() {
			if (!this.documentCounters) {
				return false;
			}
			return this.documentCounters.getCount() >= this.#b2eDocumentLimitCount;
		}
		isRuRegion() {
			return this.#region === 'ru';
		}
		#initDocumentSenderType() {
			if (!this.isTemplateMode() || !this.isSenderTypeAvailable()) {
				return;
			}
			this.#documentSenderTypeDropdown = new sign_v2_b2e_signDropdown.SignDropdown({
				tabs: [{
					id: 'b2e-document-sender-types',
					title: ' '
				}],
				entities: [{
					id: 'b2e-document-sender-type',
					searchFields: [{
						name: 'caption',
						system: true
					}]
				}],
				className: 'sign-b2e-document-setup__sender-type-selector',
				withCaption: true,
				isEnableSearch: false,
				height: 120,
				width: 350
			});
			this.#senderDocumentTypes.forEach(item => {
				if (main_core.Type.isStringFilled(item)) {
					const langPhraseCode = `SIGN_DOCUMENT_SETUP_SENDER_TYPE_${item.toUpperCase()}`;
					this.#documentSenderTypeDropdown.addItem({
						id: item,
						title: main_core.Loc.getMessage(langPhraseCode),
						entityId: 'b2e-document-sender-type',
						tabs: 'b2e-document-sender-types',
						deselectable: false
					});
				}
			});
			const selectedKey = this.#isOpenedFromRobot ? 1 : 0;
			const selectedItem = this.#senderDocumentTypes[selectedKey] ?? null;
			if (selectedItem) {
				this.#documentSenderTypeDropdown.selectItem(selectedItem);
			}
		}
		#getDocumentSenderTypeLayout() {
			if (this.#shouldHideSenderTypeLayout()) {
				return null;
			}
			return main_core.Tag.render`
			<div class="sign-b2e-settings__item">
				<p class="sign-b2e-settings__item_title">
					<span>${main_core.Loc.getMessage('SIGN_DOCUMENT_SETUP_SENDER_TYPE_TITLE')}</span>
				</p>
				${this.#documentSenderTypeDropdown.getLayout()}
				${this.#getHelpLink()}
			</div>
		`;
		}
		#shouldHideSenderTypeLayout() {
			return !this.isTemplateMode() || !this.isSenderTypeAvailable() || this.#isOpenedFromRobot || this.#isOpenedFromTemplateFolder || this.#isOpenedAsFolder;
		}
		#getHelpLink() {
			return sign_v2_helper.Helpdesk.replaceLink(main_core.Loc.getMessage('SIGN_DOCUMENT_SETUP_SENDER_TYPE_HELP_LINK'), HelpdeskCodes.HowToWorkWithTemplates, 'detail', ['ui-link']);
		}
		getAddDocumentNotice() {
			return this.#cache.remember('addDocumentNotice', () => {
				return main_core.Tag.render`
				<p class="sign-wizard__notice">${main_core.Loc.getMessage('SIGN_DOCUMENT_SETUP_ADD_DOCUMENT_NOTICE')}</p>
			`;
			});
		}
		#setDocumentLimitNoticeText() {
			main_core.Dom.addClass(this.getAddDocumentNotice(), '--warning');
			this.getAddDocumentNotice().textContent = main_core.Loc.getMessage('SIGN_DOCUMENT_SETUP_DOCUMENT_GROUP_LIMIT_NOTICE', {
				'%limit%': this.#b2eDocumentLimitCount
			});
		}
		#setAddDocumentNoticeText() {
			main_core.Dom.removeClass(this.getAddDocumentNotice(), '--warning');
			this.getAddDocumentNotice().textContent = main_core.Loc.getMessage('SIGN_DOCUMENT_SETUP_ADD_DOCUMENT_NOTICE');
		}
		toggleDeleteBtnLoadingState(deleteButton) {
			main_core.Dom.toggleClass(deleteButton, 'ui-btn-wait');
		}
		renderDocumentBlock(documentData) {
			if (!documentData) {
				return;
			}
			const existingBlock = this.layout?.querySelector(`[data-id="document-id-${documentData.id}"]`);
			if (existingBlock) {
				this.#removeLoadingDocumentBlock();
				return;
			}
			const block = this.#createDocumentBlock(documentData);
			if (this.#loadingBlock) {
				main_core.Dom.replace(this.#loadingBlock.getLayout(), block.getLayout());
				this.#loadingBlock.destroy();
				this.#loadingBlock = null;
				return;
			}
			main_core.Dom.append(block.getLayout(), this.headerLayout);
		}
		#isPlaceholderDocumentByBlankId(blankId) {
			if (!main_core.Type.isNumber(blankId)) {
				return false;
			}
			const blank = this.blankSelector.getBlank(blankId);
			if (!blank?.getLayout) {
				return false;
			}
			const layout = blank.getLayout();
			return layout?.dataset?.hasPlaceholders;
		}
		#isPlaceholderDocument(documentData, options = {}) {
			return options.isPlaceholderDocument || documentData?.hasPlaceholders || this.#isPlaceholderDocumentByBlankId(documentData?.blankId);
		}
		#createDocumentBlock(documentData, options = {}) {
			const isPlaceholderDocument = this.#isPlaceholderDocument(documentData, options);
			const block = new sign_v2_b2e_documentBlock.DocumentBlock({
				documentData,
				options: {
					...options,
					isPlaceholderDocument
				},
				api: this.#api,
				isTemplateMode: this.isTemplateMode()
			});
			this.#subscribeOnDocumentBlockEvents(block);
			this.#blockByElement.set(block.getLayout(), block);
			return block;
		}
		#subscribeOnDocumentBlockEvents(block) {
			block.subscribe('delete', this.#onDocumentBlockDelete.bind(this));
			block.subscribe('replaceConfirmed', this.#onDocumentBlockReplaceConfirmed.bind(this));
			block.subscribe('titleChange', this.#onDocumentBlockTitleChange.bind(this));
			block.subscribe('edit', this.#onDocumentBlockEdit.bind(this));
		}
		updateDocumentBlock(id, title = null) {
			const editedBlock = this.layout.querySelector(`[data-id="document-id-${id}"]`);
			if (!editedBlock) {
				return;
			}
			if (main_core.Type.isStringFilled(title)) {
				const block = this.#blockByElement.get(editedBlock);
				if (block) {
					block.setTitle(title);
					return;
				}
			}
			const titleNode = editedBlock.querySelector('.sign-b2e-document-setup__document-block_title');
			if (titleNode) {
				titleNode.textContent = this.#documentTitleInput.title;
			}
		}
		replaceDocumentBlock(oldDocument, newDocument) {
			const editedBlock = this.layout.querySelector(`[data-id="document-id-${oldDocument.id}"]`);
			const block = this.#createDocumentBlock(newDocument);
			main_core.Dom.replace(editedBlock, block.getLayout());
		}
		#onClickDeleteDocument(documentData) {
			this.setupData = null;
			const {
				id,
				uid,
				blankId
			} = documentData;
			this.emit('deleteDocument', {
				id,
				uid,
				blankId
			});
		}
		#onDocumentBlockDelete(event) {
			this.#onClickDeleteDocument(event.getData());
		}
		#onDocumentBlockReplaceConfirmed(event) {
			const {
				documentData,
				isPlaceholderDocument,
				files
			} = event.getData();
			this.#handleReplaceConfirmed(documentData, {
				isPlaceholderDocument
			}, files);
		}
		#onDocumentBlockTitleChange(event) {
			const data = event.getData();
			this.setDocumentTitle(data.title);
			this.emit('changeDocumentTitle', data);
		}
		#onDocumentBlockEdit(event) {
			const {
				documentData,
				bindElement,
				closeMenu
			} = event.getData();
			this.#handleEditDocumentClick(documentData, bindElement, closeMenu);
		}
		async #handleEditDocumentClick(documentData, bindElement = null, closeMenu = null) {
			if (this.#isPlaceholderDocument(documentData)) {
				closeMenu?.();
				await this.openOnlineEditor(documentData);
				return;
			}
			this.#showBlockEditorUnavailableHint(documentData, bindElement);
		}
		#showBlockEditorUnavailableHint(documentData, bindElement = null) {
			const anchor = bindElement ?? this.layout?.querySelector(`[data-id="document-id-${documentData.id}"]`);
			if (!anchor) {
				return;
			}
			this.#blockEditorUnavailableHintPopup?.destroy();
			this.#blockEditorUnavailableHintPopup = new main_popup.Popup({
				bindElement: anchor,
				bindOptions: {
					position: 'top',
					forceBindPosition: true
				},
				offsetTop: -10,
				darkMode: true,
				angle: {
					position: 'bottom',
					offset: anchor.offsetWidth / 2
				},
				autoHide: true,
				closeByEsc: true,
				minWidth: 340,
				content: main_core.Loc.getMessage('SIGN_V2_B2E_DOCUMENT_SETUP_BLOCK_EDITOR_UNAVAILABLE_HINT')
			});
			this.#blockEditorUnavailableHintPopup.show();
		}
		async openOnlineEditor(documentData) {
			this.#editorFlowPending = true;
			this.emit('editorLock');
			this.ready = false;
			try {
				const result = await this.#editorIntegration.openEditor(documentData);
				if (!result) {
					this.#editorFlowPending = false;
					this.ready = true;
					this.emit('editorUnlock');
				}
			} catch (error) {
				console.error(error);
				this.#editorFlowPending = false;
				this.ready = true;
				this.emit('editorUnlock');
			}
		}
		get isEditorFlowPending() {
			return this.#editorFlowPending;
		}
		cancelEditorFlow() {
			if (!this.#editorFlowPending) {
				return;
			}
			this.#editorFlowPending = false;
			this.ready = true;
			this.emit('editorUnlock');
		}
		async #applyNewBlank(documentData, newBlankId) {
			const previousBlankId = documentData.blankId;
			await this.blankSelector.loadBlankById(newBlankId);
			this.blankSelector.enableSelectedBlank(previousBlankId);
			this.blankSelector.disableSelectedBlank(newBlankId);
			const updatedDocumentData = {
				...documentData,
				blankId: newBlankId,
				previewUrl: null,
				templateUid: this.setupData?.templateUid ?? documentData?.templateUid
			};
			if (this.setupData?.uid === updatedDocumentData.uid) {
				this.setupData = updatedDocumentData;
				if (this.blankSelector.selectedBlankId !== newBlankId) {
					await this.blankSelector.selectBlank(newBlankId, {
						isInitial: true
					});
				}
			}
			this.emit('replaceDocument', {
				documentData: updatedDocumentData
			});
		}
		#handleReplaceConfirmed(documentData, options, files) {
			this.emit('replaceDocumentStart', {
				documentData
			});
			this.emit('editorLock');
			this.ready = false;
			try {
				this.#replaceDocumentData = documentData;
				this.#initReplaceUploader(options);
				this.#replaceUploader.addFiles(files);
			} catch (error) {
				console.error(error);
				this.ready = true;
				this.emit('editorUnlock');
				this.emit('replaceDocumentFinish', {
					isSuccess: false
				});
				this.#replaceDocumentData = null;
			}
		}
		getHeaderLayout() {
			const headerText = this.isTemplateMode() ? main_core.Loc.getMessage('SIGN_DOCUMENT_SETUP_TEMPLATE_HEADER') : main_core.Loc.getMessage('SIGN_DOCUMENT_SETUP_HEADER');
			const placeholdersInfoButton = main_core.Tag.render`
			<button
				type="button"
				class="sign-b2e-document-setup__placeholders-info-btn"
				data-hint="${main_core.Loc.getMessage('SIGN_DOCUMENT_SETUP_PLACEHOLDERS_BUTTON')}"
				data-hint-no-icon
				onclick="${() => this.#onPlaceholdersInfoClick()}"
			>
				<img src="${placeholderCodeIcon}" alt="">
			</button>
		`;
			this.headerLayout = main_core.Tag.render`
			<div class="sign-b2e-settings__header-container">
				<div class="sign-b2e-settings__header-row">
					<h1 class="sign-b2e-settings__header">${headerText}</h1>
					${placeholdersInfoButton}
				</div>
			</div>
		`;
			return this.headerLayout;
		}
		#sendDocumentSenderType(uid) {
			if (!this.isTemplateMode() || !this.isSenderTypeAvailable()) {
				return Promise.resolve();
			}
			const senderType = this.#getDocumentSenderType();
			this.setupData.initiatedByType = senderType;
			return this.#api.changeSenderDocumentType(uid, senderType);
		}
		#getDocumentSenderType() {
			if (!this.isTemplateMode()) {
				return null;
			}
			if (!this.isSenderTypeAvailable()) {
				return this.#initiatedByType;
			}
			return this.#documentSenderTypeDropdown.getSelectedId();
		}
		setDocumentTitle(title = '') {
			this.#documentTitleInput.value = title;
			this.#documentTitleInput.title = title;
		}
		setDocumentSenderType(initiatedByType) {
			if (!this.isTemplateMode() || !this.isSenderTypeAvailable()) {
				return;
			}
			const senderType = this.#senderDocumentTypes.includes(initiatedByType) ? initiatedByType : 'employee';
			this.#documentSenderTypeDropdown.selectItem(senderType);
		}
		initLayout() {
			this.layout = main_core.Tag.render`
			<div class="sign-document-setup">
				${this.getHeaderLayout()}
				${this.getDocumentSectionLayout()}
			</div>
		`;
		}
		getDocumentSectionLayout() {
			if (!this.documentSectionLayout) {
				this.documentSectionLayout = main_core.Tag.render`
				<div class="sign-b2e-settings__item">
					${this.getDocumentSectionInnerLayout()}
				</div>
			`;
				this.createHintPopup();
			}
			return this.documentSectionLayout;
		}
		getDocumentSectionInnerLayout() {
			const itemTitleText = this.isTemplateMode() ? main_core.Loc.getMessage('SIGN_DOCUMENT_SETUP_ADD_TEMPLATE_TITLE') : main_core.Loc.getMessage('SIGN_DOCUMENT_SETUP_DOWNLOAD_TITLE');
			this.titleCounterSlot = main_core.Tag.render`<span class="sign-b2e-document-setup__title-counter-slot"></span>`;
			this.noticeSlot = main_core.Tag.render`<div class="sign-b2e-document-setup__notice-slot"></div>`;
			this.documentSectionInnerLayout = main_core.Tag.render`
			<div class="sign-b2e-settings__item-inner">
				<div class="sign-b2e-settings__item_title --with-counter">
					<span>${itemTitleText}</span>
					${this.titleCounterSlot}
				</div>
				${this.blankSelector.getLayout()}
				${this.noticeSlot}
			</div>
		`;
			return this.documentSectionInnerLayout;
		}
		#onPlaceholdersInfoClick() {
			void top.BX.Runtime.loadExtension('sign.v2.grid.b2e.placeholders').then(() => {
				new top.BX.Sign.V2.Grid.B2e.Placeholders().show();
			});
		}
		createHintPopup() {
			this.hintPopup = new main_popup.Popup({
				content: main_core.Loc.getMessage('SIGN_DOCUMENT_SETUP_DOCUMENT_LIMIT_POPUP'),
				autoHide: true,
				darkMode: true
			});
		}
		setAvailabilityDocumentSection(isAvailable) {
			if (!this.hintPopup) {
				return;
			}
			const uploadArea = this.documentSectionInnerLayout?.querySelector('.sign-blank-selector__list.--with-buttons');
			if (isAvailable) {
				if (uploadArea) {
					main_core.Dom.removeClass(uploadArea, disabledClass);
				}
				main_core.Event.unbind(this.documentSectionLayout, 'click', this.onClickShowHintPopup);
				this.hintPopup.close();
				return;
			}
			if (uploadArea) {
				main_core.Dom.addClass(uploadArea, disabledClass);
			}
			main_core.Event.bind(this.documentSectionLayout, 'click', this.onClickShowHintPopup);
		}
		showHintPopup(event) {
			this.hintPopup.setBindElement(event);
			this.hintPopup.show();
		}
		#removeDocumentSection() {
			main_core.Event.unbind(this.documentSectionLayout, 'click', this.onClickShowHintPopup);
			this.hintPopup?.destroy();
			this.hintPopup = null;
			main_core.Dom.remove(this.documentSectionLayout);
			this.layout.querySelectorAll('.sign-b2e-settings__counter').forEach(counter => {
				main_core.Dom.remove(counter);
			});
			sign_v2_helper.SignSettingsItemCounter.numerate(this.layout);
		}
		async setup(uid) {
			try {
				await super.setup(uid, this.isTemplateMode(), this.#getDocumentSenderType());
				if (!this.setupData || this.blankIsNotSelected) {
					this.ready = true;
					return;
				}
				if (uid) {
					const {
						title,
						initiatedByType
					} = this.setupData;
					this.setDocumentTitle(title);
					this.setDocumentSenderType(initiatedByType);
					if (this.isTemplateMode()) {
						this.#removeDocumentSection();
					}
					return;
				}
				const shouldRemoveDocumentSection = this.isTemplateMode() && this.setupData?.uid;
				this.ready = false;
				this.setupData = await this.updateDocumentData(this.setupData);
				if (shouldRemoveDocumentSection) {
					this.#removeDocumentSection();
				}
			} catch {
				const {
					blankId
				} = this.setupData;
				this.handleError(blankId);
			}
			this.ready = true;
		}
		async updateDocumentData(documentData) {
			if (!documentData) {
				return;
			}
			await Promise.all([this.#sendDocumentSenderType(documentData.uid)]);
			const {
				value: title
			} = this.#documentTitleInput;
			const {
				templateUid
			} = this.setupData;
			const modifyDocumentTitleResponse = await this.#api.modifyTitle(documentData.uid, title);
			const {
				blankTitle
			} = modifyDocumentTitleResponse;
			if (blankTitle) {
				const {
					blankId
				} = documentData;
				this.blankSelector.modifyBlankTitle(blankId, blankTitle);
			}
			return {
				...documentData,
				title,
				templateUid
			};
		}
		#validateInput(input) {
			if (!input) {
				return true;
			}
			const {
				parentNode,
				value
			} = input;
			if (value.trim() !== '') {
				main_core.Dom.removeClass(parentNode, 'ui-ctl-warning');
				return true;
			}
			main_core.Dom.addClass(parentNode, 'ui-ctl-warning');
			input.focus();
			return false;
		}
		validate() {
			return this.#validateInput(this.#documentTitleInput);
		}
		isSenderTypeAvailable() {
			const settings = main_core.Extension.getSettings('sign.v2.b2e.document-setup');
			return settings.get('isSenderTypeAvailable');
		}
		resetDocument() {
			this.blankSelector.resetSelectedBlank();
			this.setDocumentTitle('');
			this.isFileAdded = false;
			this.#disableDocumentInputs();
		}
		enableDocumentInputs() {
			this.#documentTitleInput.disabled = false;
			this.blankIsNotSelected = false;
		}
		#disableDocumentInputs() {
			this.#documentTitleInput.disabled = true;
			this.blankIsNotSelected = true;
		}
		#initReplaceUploader(options) {
			const acceptedFileTypes = sign_v2_b2e_documentBlock.getAllowedReplaceExtensions(options.isPlaceholderDocument).map(extension => `.${extension}`);
			this.#replaceUploader = new ui_uploader_core.Uploader({
				id: 'sign-replace-document-uploader',
				controller: 'sign.upload.blankUploadController',
				acceptedFileTypes,
				multiple: false,
				autoUpload: true,
				maxFileSize: 50 * 1024 * 1024,
				events: {
					[ui_uploader_core.UploaderEvent.UPLOAD_COMPLETE]: event => {
						this.#onReplaceUploadComplete(options, event);
					}
				}
			});
		}
		async #onReplaceUploadComplete(options) {
			const files = this.#replaceUploader.getFiles();
			if (files.length === 0 || !this.#replaceDocumentData) {
				return;
			}
			let isSuccess = false;
			try {
				const previousBlankId = this.#replaceDocumentData.blankId;
				const documentUid = this.#replaceDocumentData.uid;
				const filesIds = files.map(file => file.getServerFileId());
				const hasPlaceholders = this.#replaceDocumentData?.hasPlaceholders || this.#isPlaceholderDocumentByBlankId(this.#replaceDocumentData?.blankId);
				const createBlankResult = await this.#api.createBlank(filesIds, sign_type.BlankScenario.b2e, sign_v2_signSettings.isTemplateMode(), hasPlaceholders);
				await this.#api.changeBlank(documentUid, createBlankResult.id, !options.isPlaceholderDocument);
				await this.blankSelector.loadBlankById(createBlankResult.id);
				this.blankSelector.enableSelectedBlank(previousBlankId);
				this.blankSelector.disableSelectedBlank(createBlankResult.id);
				const newFile = files[0];
				const newTitle = newFile ? newFile.getName().replace(/\.[^.]+$/, '') : this.#replaceDocumentData.title;
				const titleData = await this.#api.modifyTitle(documentUid, newTitle);
				const [loadedData, blocks] = await Promise.all([this.#api.loadDocument(documentUid), this.#api.loadBlocksByDocument(documentUid)]);
				const updatedDocumentData = {
					...this.#replaceDocumentData,
					...loadedData,
					blocks,
					blankId: createBlankResult.id,
					previewUrl: null,
					hasPlaceholders,
					title: newTitle,
					templateUid: this.setupData?.templateUid ?? this.#replaceDocumentData?.templateUid
				};
				if (titleData?.blankTitle) {
					this.blankSelector.modifyBlankTitle(updatedDocumentData.blankId, titleData.blankTitle);
				}
				if (this.setupData?.uid === updatedDocumentData.uid) {
					this.setupData = updatedDocumentData;
					if (this.blankSelector.selectedBlankId !== createBlankResult.id) {
						await this.blankSelector.selectBlank(createBlankResult.id, {
							isInitial: true
						});
					}
				}
				this.replaceDocumentBlock(this.#replaceDocumentData, updatedDocumentData);
				this.emit('replaceDocument', {
					documentData: updatedDocumentData
				});
				this.emit('changeDocumentTitle', {
					uid: updatedDocumentData.uid,
					title: newTitle,
					blankTitle: titleData?.blankTitle
				});
				this.#replaceUploader.removeFiles();
				isSuccess = true;
			} catch (e) {
				console.error(e);
			} finally {
				this.ready = true;
				this.emit('editorUnlock');
				this.emit('replaceDocumentFinish', {
					isSuccess
				});
				this.#replaceDocumentData = null;
			}
		}
	}

	exports.DocumentSetup = DocumentSetup;

})(this.BX.Sign.V2.B2e = this.BX.Sign.V2.B2e || {}, BX, BX.Cache, BX.Main, BX.Sign, BX.Sign, BX.Sign.V2, BX.Sign.V2.B2e, BX.Sign.V2.B2e, BX.Sign.V2.B2e, BX.Sign.V2, BX.Sign.V2, BX.Sign.V2, BX.UI.Uploader, BX.Event);
//# sourceMappingURL=document-setup.bundle.js.map
