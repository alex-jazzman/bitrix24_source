import { Dom, Event, Extension, Loc, Tag, Type } from 'main.core';
import { MemoryCache } from 'main.core.cache';
import { type BaseEvent } from 'main.core.events';
import { Popup } from 'main.popup';
import { FeatureStorage } from 'sign.feature-storage';
import { BlankScenario, DocumentInitiated, type DocumentInitiatedType } from 'sign.type';
import { Api } from 'sign.v2.api';
import { DocumentBlock, getAllowedReplaceExtensions } from 'sign.v2.b2e.document-block';
import { DocumentCounters } from 'sign.v2.b2e.document-counters';
import { SignDropdown } from 'sign.v2.b2e.sign-dropdown';
import { type BlankSelectorConfig, type ToggleEvent } from 'sign.v2.blank-selector';
import { type DocumentDetails, DocumentSetup as BaseDocumentSetup } from 'sign.v2.document-setup';
import { Helpdesk, Hint, SignSettingsItemCounter } from 'sign.v2.helper';
import { isTemplateMode } from 'sign.v2.sign-settings';
import { Uploader, UploaderEvent } from 'ui.uploader.core';
import { EditorIntegration } from './editor-integration';
import placeholderCodeIcon from './images/sign-wizard-placeholder-code-icon.svg';
import 'sign.v2.ui.notice';
import './style.css';

const HelpdeskCodes = Object.freeze({
	HowToWorkWithTemplates: '23174934',
});

const disabledClass = '--disabled';

export class DocumentSetup extends BaseDocumentSetup
{
	#cache: MemoryCache<any> = new MemoryCache();
	#api: Api;
	#region: string;
	#senderDocumentTypes: DocumentInitiatedType[];
	#documentSenderTypeDropdown: HTMLElement;
	#documentTitleInput: HTMLInputElement;
	headerLayout: HTMLElement;
	documentCounters: DocumentCounters | null = null;
	#b2eDocumentLimitCount: number;
	#isOpenedFromRobot: boolean = false;
	#isOpenedFromTemplateFolder: boolean = false;
	#isOpenedAsFolder: boolean = false;
	documentSectionLayout: HTMLElement;
	documentSectionInnerLayout: HTMLElement;
	#initiatedByType: DocumentInitiatedType;
	#replaceUploader: Uploader | null = null;
	#replaceDocumentData: DocumentDetails | null = null;
	#blockByElement: WeakMap<HTMLElement, DocumentBlock> = new WeakMap();
	#expectedAddFileCount: number = 0;
	#loadingBlock: DocumentBlock | null = null;
	#editorFlowPending: boolean = false;
	#editorIntegration: EditorIntegration;
	#blockEditorUnavailableHintPopup: Popup | null = null;

	constructor(blankSelectorConfig: BlankSelectorConfig)
	{
		super(blankSelectorConfig);
		const {
			region,
			b2eDocumentLimitCount,
			isOpenedFromRobot,
			isOpenedFromTemplateFolder,
			isOpenedAsFolder,
			initiatedByType,
		} = blankSelectorConfig;
		this.#api = new Api();
		this.#editorIntegration = new EditorIntegration(
			this.#api,
			this.#applyNewBlank.bind(this),
			() => {
				this.#editorFlowPending = false;
				this.ready = true;
				this.emit('editorUnlock');
			},
		);
		this.#region = region;
		this.#b2eDocumentLimitCount = b2eDocumentLimitCount;
		this.editMode = false;
		this.onClickShowHintPopup = this.showHintPopup.bind(this);
		this.#isOpenedFromRobot = isOpenedFromRobot;
		this.#isOpenedFromTemplateFolder = isOpenedFromTemplateFolder;
		this.#isOpenedAsFolder = isOpenedAsFolder;
		this.#senderDocumentTypes = this.#getSenderDocumentTypes();

		this.#documentTitleInput = Tag.render`
			<input
			    type="text"
			    class="ui-ctl-element"
			    maxlength="255"
			    oninput="${({ target }) => this.setDocumentTitle(target.value)}"
			/>
		`;
		this.#initiatedByType = initiatedByType;

		this.#disableDocumentInputs();

		this.#init();
	}

	#init(): void
	{
		this.#initDocumentSenderType();
		Dom.append(this.#getDocumentSenderTypeLayout(), this.layout);

		if (!this.isTemplateMode() && FeatureStorage.isGroupSendingEnabled())
		{
			this.documentCounters = new DocumentCounters({
				documentCountersLimit: this.#b2eDocumentLimitCount,
			});
			Dom.append(this.documentCounters.getLayout(), this.titleCounterSlot);
			Dom.append(this.getAddDocumentNotice(), this.noticeSlot);
		}
		Hint.create(this.layout);

		this.#subscribeOnEvents();
	}

	#getSenderDocumentTypes(): DocumentInitiatedType[]
	{
		if (this.#isOpenedFromTemplateFolder || this.#isOpenedAsFolder)
		{
			return [DocumentInitiated.company];
		}

		return Object.values(DocumentInitiated);
	}

	#subscribeOnEvents(): void
	{
		const blankSelector = this.blankSelector;
		blankSelector.subscribe(blankSelector.events.toggleSelection, this.#onBlankSelectorToggleSelection.bind(this));
		blankSelector.subscribe(blankSelector.events.addFile, this.#onBlankSelectorAddFile.bind(this));
		blankSelector.subscribe(
			blankSelector.events.beforeAddFileSuccessfully,
			this.#onBlankSelectorBeforeAddFile.bind(this),
		);
		if (!this.isTemplateMode() && FeatureStorage.isGroupSendingEnabled())
		{
			this.documentCounters.subscribe('limitNotExceeded', this.#refreshDocumentLimitState.bind(this));
			this.documentCounters.subscribe('limitExceeded', this.#refreshDocumentLimitState.bind(this));
		}
	}

	#onBlankSelectorBeforeAddFile(event: BaseEvent<{ files: Array<Object> }>): void
	{
		const { files = [] } = event.getData() ?? {};
		this.#expectedAddFileCount = files.length;
	}

	#refreshDocumentLimitState(): void
	{
		if (!this.documentCounters)
		{
			return;
		}

		if (this.#isDocumentLimitExceeded())
		{
			this.#setDocumentLimitNoticeText();
			this.emit('documentsLimitExceeded');

			return;
		}

		this.#setAddDocumentNoticeText();
		this.emit('documentsLimitNotExceeded');
	}

	#onBlankSelectorAddFile(event: BaseEvent<{
		title: string,
		isImage?: boolean,
		isMixedB2eUpload?: boolean,
		filesCount?: number,
	}>)
	{
		const data = event.getData();
		this.isFileAdded = true;
		this.enableDocumentInputs();

		const isCombinedImageDocument = Boolean(data.isImage) && (data.filesCount ?? 1) > 1;
		const displayTitle = isCombinedImageDocument
			? Loc.getMessage('SIGN_DOCUMENT_SETUP_COMBINED_IMAGE_DOCUMENT')
			: data.title
		;

		if (!this.isTemplateMode() || !this.isEditActionMode())
		{
			this.setDocumentTitle(displayTitle);
		}

		const hasDocumentBlock = Boolean(this.layout?.querySelector('.sign-b2e-document-setup__document-block'));
		if (this.isTemplateMode() && hasDocumentBlock)
		{
			return;
		}

		if (this.#expectedAddFileCount > 1)
		{
			this.#expectedAddFileCount -= 1;

			return;
		}

		this.#expectedAddFileCount = 0;
		this.#showLoadingDocumentBlock(displayTitle, { isPlaceholderDocument: !data.isMixedB2eUpload });

		const completedHandler = () => {
			this.unsubscribe('addDocumentCompleted', completedHandler);
			this.#removeLoadingDocumentBlock();
		};
		this.subscribe('addDocumentCompleted', completedHandler);

		this.emit('addDocument');
	}

	#showLoadingDocumentBlock(title: string, options: { isPlaceholderDocument?: boolean } = {}): void
	{
		if (!this.headerLayout)
		{
			return;
		}

		this.#removeLoadingDocumentBlock();

		const block = new DocumentBlock({
			documentData: { id: 'loadingDocumentId', title },
			options: { isPlaceholderDocument: options.isPlaceholderDocument, isLoading: true },
			api: this.#api,
			isTemplateMode: this.isTemplateMode(),
		});
		this.#loadingBlock = block;
		Dom.append(block.getLayout(), this.headerLayout);
	}

	#removeLoadingDocumentBlock(): void
	{
		if (!this.#loadingBlock)
		{
			return;
		}

		this.#loadingBlock.destroy();
		this.#loadingBlock = null;
	}

	#onBlankSelectorToggleSelection(event: ToggleEvent): void
	{
		if (this.blankIsNotSelected && this.editMode)
		{
			return;
		}

		const data = event.getData();

		this.setDocumentTitle(data.title);

		if (data.selected)
		{
			this.enableDocumentInputs();
		}
	}

	#isDocumentLimitExceeded(): boolean
	{
		if (!this.documentCounters)
		{
			return false;
		}

		return this.documentCounters.getCount() >= this.#b2eDocumentLimitCount;
	}

	isRuRegion(): boolean
	{
		return this.#region === 'ru';
	}

	#initDocumentSenderType(): void
	{
		if (!this.isTemplateMode() || !this.isSenderTypeAvailable())
		{
			return;
		}

		this.#documentSenderTypeDropdown = new SignDropdown({
			tabs: [{ id: 'b2e-document-sender-types', title: ' ' }],
			entities: [
				{ id: 'b2e-document-sender-type', searchFields: [{ name: 'caption', system: true }] },
			],
			className: 'sign-b2e-document-setup__sender-type-selector',
			withCaption: true,
			isEnableSearch: false,
			height: 120,
			width: 350,
		});
		this.#senderDocumentTypes.forEach((item) => {
			if (Type.isStringFilled(item))
			{
				const langPhraseCode = `SIGN_DOCUMENT_SETUP_SENDER_TYPE_${item.toUpperCase()}`;
				this.#documentSenderTypeDropdown.addItem({
					id: item,
					title: Loc.getMessage(langPhraseCode),
					entityId: 'b2e-document-sender-type',
					tabs: 'b2e-document-sender-types',
					deselectable: false,
				});
			}
		});
		const selectedKey = this.#isOpenedFromRobot ? 1 : 0;
		const selectedItem = this.#senderDocumentTypes[selectedKey] ?? null;
		if (selectedItem)
		{
			this.#documentSenderTypeDropdown.selectItem(selectedItem);
		}
	}

	#getDocumentSenderTypeLayout(): HTMLElement | null
	{
		if (this.#shouldHideSenderTypeLayout())
		{
			return null;
		}

		return Tag.render`
			<div class="sign-b2e-settings__item">
				<p class="sign-b2e-settings__item_title">
					<span>${Loc.getMessage('SIGN_DOCUMENT_SETUP_SENDER_TYPE_TITLE')}</span>
				</p>
				${this.#documentSenderTypeDropdown.getLayout()}
				${this.#getHelpLink()}
			</div>
		`;
	}

	#shouldHideSenderTypeLayout(): boolean
	{
		return (
			!this.isTemplateMode()
			|| !this.isSenderTypeAvailable()
			|| this.#isOpenedFromRobot
			|| this.#isOpenedFromTemplateFolder
			|| this.#isOpenedAsFolder
		);
	}

	#getHelpLink(): HTMLElement
	{
		return Helpdesk.replaceLink(
			Loc.getMessage('SIGN_DOCUMENT_SETUP_SENDER_TYPE_HELP_LINK'),
			HelpdeskCodes.HowToWorkWithTemplates,
			'detail',
			['ui-link'],
		);
	}

	getAddDocumentNotice(): HTMLElement
	{
		return this.#cache.remember('addDocumentNotice', () => {
			return Tag.render`
				<p class="sign-wizard__notice">${Loc.getMessage('SIGN_DOCUMENT_SETUP_ADD_DOCUMENT_NOTICE')}</p>
			`;
		});
	}

	#setDocumentLimitNoticeText(): void
	{
		Dom.addClass(this.getAddDocumentNotice(), '--warning');
		this.getAddDocumentNotice().textContent = Loc.getMessage(
			'SIGN_DOCUMENT_SETUP_DOCUMENT_GROUP_LIMIT_NOTICE',
			{ '%limit%': this.#b2eDocumentLimitCount },
		);
	}

	#setAddDocumentNoticeText(): void
	{
		Dom.removeClass(this.getAddDocumentNotice(), '--warning');
		this.getAddDocumentNotice().textContent = Loc.getMessage('SIGN_DOCUMENT_SETUP_ADD_DOCUMENT_NOTICE');
	}

	toggleDeleteBtnLoadingState(deleteButton: HTMLElement): void
	{
		Dom.toggleClass(deleteButton, 'ui-btn-wait');
	}

	renderDocumentBlock(documentData: Object): void
	{
		if (!documentData)
		{
			return;
		}

		const existingBlock = this.layout?.querySelector(`[data-id="document-id-${documentData.id}"]`);
		if (existingBlock)
		{
			this.#removeLoadingDocumentBlock();

			return;
		}

		const block = this.#createDocumentBlock(documentData);
		if (this.#loadingBlock)
		{
			Dom.replace(this.#loadingBlock.getLayout(), block.getLayout());
			this.#loadingBlock.destroy();
			this.#loadingBlock = null;

			return;
		}

		Dom.append(block.getLayout(), this.headerLayout);
	}

	#isPlaceholderDocumentByBlankId(blankId: ?number): boolean
	{
		if (!Type.isNumber(blankId))
		{
			return false;
		}

		const blank = this.blankSelector.getBlank(blankId);
		if (!blank?.getLayout)
		{
			return false;
		}

		const layout = blank.getLayout();

		return layout?.dataset?.hasPlaceholders;
	}

	#isPlaceholderDocument(
		documentData: Object,
		options: { isPlaceholderDocument?: boolean } = {},
	): boolean
	{
		return options.isPlaceholderDocument
			|| documentData?.hasPlaceholders
			|| this.#isPlaceholderDocumentByBlankId(documentData?.blankId)
		;
	}

	#createDocumentBlock(
		documentData: Object,
		options: { isPlaceholderDocument?: boolean } = {},
	): DocumentBlock
	{
		const isPlaceholderDocument = this.#isPlaceholderDocument(documentData, options);
		const block = new DocumentBlock({
			documentData,
			options: { ...options, isPlaceholderDocument },
			api: this.#api,
			isTemplateMode: this.isTemplateMode(),
		});

		this.#subscribeOnDocumentBlockEvents(block);
		this.#blockByElement.set(block.getLayout(), block);

		return block;
	}

	#subscribeOnDocumentBlockEvents(block: DocumentBlock): void
	{
		block.subscribe('delete', this.#onDocumentBlockDelete.bind(this));
		block.subscribe('replaceConfirmed', this.#onDocumentBlockReplaceConfirmed.bind(this));
		block.subscribe('titleChange', this.#onDocumentBlockTitleChange.bind(this));
		block.subscribe('edit', this.#onDocumentBlockEdit.bind(this));
	}

	updateDocumentBlock(id: number, title: ?string = null): void
	{
		const editedBlock = this.layout.querySelector(`[data-id="document-id-${id}"]`);
		if (!editedBlock)
		{
			return;
		}

		if (Type.isStringFilled(title))
		{
			const block = this.#blockByElement.get(editedBlock);
			if (block)
			{
				block.setTitle(title);

				return;
			}
		}

		const titleNode = editedBlock.querySelector('.sign-b2e-document-setup__document-block_title');
		if (titleNode)
		{
			titleNode.textContent = this.#documentTitleInput.title;
		}
	}

	replaceDocumentBlock(oldDocument, newDocument): void
	{
		const editedBlock = this.layout.querySelector(`[data-id="document-id-${oldDocument.id}"]`);
		const block = this.#createDocumentBlock(newDocument);
		Dom.replace(editedBlock, block.getLayout());
	}

	#onClickDeleteDocument(documentData: DocumentDetails): void
	{
		this.setupData = null;
		const { id, uid, blankId } = documentData;
		this.emit('deleteDocument', { id, uid, blankId });
	}

	#onDocumentBlockDelete(event: BaseEvent): void
	{
		this.#onClickDeleteDocument(event.getData());
	}

	#onDocumentBlockReplaceConfirmed(event: BaseEvent): void
	{
		const { documentData, isPlaceholderDocument, files } = event.getData();
		this.#handleReplaceConfirmed(documentData, { isPlaceholderDocument }, files);
	}

	#onDocumentBlockTitleChange(event: BaseEvent): void
	{
		const data = event.getData();
		this.setDocumentTitle(data.title);
		this.emit('changeDocumentTitle', data);
	}

	#onDocumentBlockEdit(event: BaseEvent): void
	{
		const { documentData, bindElement, closeMenu } = event.getData();
		this.#handleEditDocumentClick(documentData, bindElement, closeMenu);
	}

	async #handleEditDocumentClick(
		documentData: Object,
		bindElement: ?HTMLElement = null,
		closeMenu: ?() => void = null,
	): Promise<void>
	{
		if (this.#isPlaceholderDocument(documentData))
		{
			closeMenu?.();
			await this.openOnlineEditor(documentData);

			return;
		}

		this.#showBlockEditorUnavailableHint(documentData, bindElement);
	}

	#showBlockEditorUnavailableHint(documentData: Object, bindElement: ?HTMLElement = null): void
	{
		const anchor = bindElement
			?? this.layout?.querySelector(`[data-id="document-id-${documentData.id}"]`);
		if (!anchor)
		{
			return;
		}

		this.#blockEditorUnavailableHintPopup?.destroy();
		this.#blockEditorUnavailableHintPopup = new Popup({
			bindElement: anchor,
			bindOptions: { position: 'top', forceBindPosition: true },
			offsetTop: -10,
			darkMode: true,
			angle: { position: 'bottom', offset: anchor.offsetWidth / 2 },
			autoHide: true,
			closeByEsc: true,
			minWidth: 340,
			content: Loc.getMessage('SIGN_V2_B2E_DOCUMENT_SETUP_BLOCK_EDITOR_UNAVAILABLE_HINT'),
		});
		this.#blockEditorUnavailableHintPopup.show();
	}

	async openOnlineEditor(documentData: Object): Promise<void>
	{
		this.#editorFlowPending = true;
		this.emit('editorLock');

		this.ready = false;

		try
		{
			const result = await this.#editorIntegration.openEditor(documentData);
			if (!result)
			{
				this.#editorFlowPending = false;
				this.ready = true;
				this.emit('editorUnlock');
			}
		}
		catch (error)
		{
			console.error(error);
			this.#editorFlowPending = false;
			this.ready = true;
			this.emit('editorUnlock');
		}
	}

	get isEditorFlowPending(): boolean
	{
		return this.#editorFlowPending;
	}

	cancelEditorFlow(): void
	{
		if (!this.#editorFlowPending)
		{
			return;
		}

		this.#editorFlowPending = false;
		this.ready = true;
		this.emit('editorUnlock');
	}

	async #applyNewBlank(documentData: Object, newBlankId: number): Promise<void>
	{
		const previousBlankId = documentData.blankId;

		await this.blankSelector.loadBlankById(newBlankId);
		this.blankSelector.enableSelectedBlank(previousBlankId);
		this.blankSelector.disableSelectedBlank(newBlankId);

		const updatedDocumentData = {
			...documentData,
			blankId: newBlankId,
			previewUrl: null,
			templateUid: this.setupData?.templateUid ?? documentData?.templateUid,
		};

		if (this.setupData?.uid === updatedDocumentData.uid)
		{
			this.setupData = updatedDocumentData;
			if (this.blankSelector.selectedBlankId !== newBlankId)
			{
				await this.blankSelector.selectBlank(newBlankId, { isInitial: true });
			}
		}

		this.emit('replaceDocument', { documentData: updatedDocumentData });
	}

	#handleReplaceConfirmed(
		documentData: DocumentDetails,
		options: { isPlaceholderDocument?: boolean },
		files: File[],
	): void
	{
		this.emit('replaceDocumentStart', { documentData });
		this.emit('editorLock');
		this.ready = false;
		try
		{
			this.#replaceDocumentData = documentData;
			this.#initReplaceUploader(options);
			this.#replaceUploader.addFiles(files);
		}
		catch (error)
		{
			console.error(error);
			this.ready = true;
			this.emit('editorUnlock');
			this.emit('replaceDocumentFinish', { isSuccess: false });
			this.#replaceDocumentData = null;
		}
	}

	getHeaderLayout(): HTMLElement
	{
		const headerText = this.isTemplateMode()
			? Loc.getMessage('SIGN_DOCUMENT_SETUP_TEMPLATE_HEADER')
			: Loc.getMessage('SIGN_DOCUMENT_SETUP_HEADER')
		;

		const placeholdersInfoButton = Tag.render`
			<button
				type="button"
				class="sign-b2e-document-setup__placeholders-info-btn"
				data-hint="${Loc.getMessage('SIGN_DOCUMENT_SETUP_PLACEHOLDERS_BUTTON')}"
				data-hint-no-icon
				onclick="${() => this.#onPlaceholdersInfoClick()}"
			>
				<img src="${placeholderCodeIcon}" alt="">
			</button>
		`;

		this.headerLayout = Tag.render`
			<div class="sign-b2e-settings__header-container">
				<div class="sign-b2e-settings__header-row">
					<h1 class="sign-b2e-settings__header">${headerText}</h1>
					${placeholdersInfoButton}
				</div>
			</div>
		`;

		return this.headerLayout;
	}

	#sendDocumentSenderType(uid: string): Promise<void>
	{
		if (!this.isTemplateMode() || !this.isSenderTypeAvailable())
		{
			return Promise.resolve();
		}

		const senderType = this.#getDocumentSenderType();
		this.setupData.initiatedByType = senderType;

		return this.#api.changeSenderDocumentType(uid, senderType);
	}

	#getDocumentSenderType(): ?DocumentInitiatedType
	{
		if (!this.isTemplateMode())
		{
			return null;
		}

		if (!this.isSenderTypeAvailable())
		{
			return this.#initiatedByType;
		}

		return this.#documentSenderTypeDropdown.getSelectedId();
	}

	setDocumentTitle(title: string = ''): void
	{
		this.#documentTitleInput.value = title;
		this.#documentTitleInput.title = title;
	}

	setDocumentSenderType(initiatedByType: string): void
	{
		if (!this.isTemplateMode() || !this.isSenderTypeAvailable())
		{
			return;
		}
		const senderType = this.#senderDocumentTypes.includes(initiatedByType) ? initiatedByType : 'employee';
		this.#documentSenderTypeDropdown.selectItem(senderType);
	}

	initLayout(): void
	{
		this.layout = Tag.render`
			<div class="sign-document-setup">
				${this.getHeaderLayout()}
				${this.getDocumentSectionLayout()}
			</div>
		`;
	}

	getDocumentSectionLayout(): HTMLElement
	{
		if (!this.documentSectionLayout)
		{
			this.documentSectionLayout = Tag.render`
				<div class="sign-b2e-settings__item">
					${this.getDocumentSectionInnerLayout()}
				</div>
			`;
			this.createHintPopup();
		}

		return this.documentSectionLayout;
	}

	getDocumentSectionInnerLayout(): HTMLElement
	{
		const itemTitleText = this.isTemplateMode()
			? Loc.getMessage('SIGN_DOCUMENT_SETUP_ADD_TEMPLATE_TITLE')
			: Loc.getMessage('SIGN_DOCUMENT_SETUP_DOWNLOAD_TITLE')
		;

		this.titleCounterSlot = Tag.render`<span class="sign-b2e-document-setup__title-counter-slot"></span>`;
		this.noticeSlot = Tag.render`<div class="sign-b2e-document-setup__notice-slot"></div>`;

		this.documentSectionInnerLayout = Tag.render`
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

	#onPlaceholdersInfoClick(): void
	{
		void top.BX.Runtime.loadExtension('sign.v2.grid.b2e.placeholders').then(() => {
			new top.BX.Sign.V2.Grid.B2e.Placeholders().show();
		});
	}

	createHintPopup(): void
	{
		this.hintPopup = new Popup({
			content: Loc.getMessage('SIGN_DOCUMENT_SETUP_DOCUMENT_LIMIT_POPUP'),
			autoHide: true,
			darkMode: true,
		});
	}

	setAvailabilityDocumentSection(isAvailable: boolean): void
	{
		if (!this.hintPopup)
		{
			return;
		}

		const uploadArea = this.documentSectionInnerLayout?.querySelector('.sign-blank-selector__list.--with-buttons');

		if (isAvailable)
		{
			if (uploadArea)
			{
				Dom.removeClass(uploadArea, disabledClass);
			}
			Event.unbind(this.documentSectionLayout, 'click', this.onClickShowHintPopup);
			this.hintPopup.close();

			return;
		}

		if (uploadArea)
		{
			Dom.addClass(uploadArea, disabledClass);
		}
		Event.bind(this.documentSectionLayout, 'click', this.onClickShowHintPopup);
	}

	showHintPopup(event): void
	{
		this.hintPopup.setBindElement(event);
		this.hintPopup.show();
	}

	#removeDocumentSection(): void
	{
		Event.unbind(this.documentSectionLayout, 'click', this.onClickShowHintPopup);
		this.hintPopup?.destroy();
		this.hintPopup = null;
		Dom.remove(this.documentSectionLayout);
		this.layout.querySelectorAll('.sign-b2e-settings__counter').forEach((counter) => {
			Dom.remove(counter);
		});
		SignSettingsItemCounter.numerate(this.layout);
	}

	async setup(uid: ?string): Promise<void>
	{
		try
		{
			await super.setup(
				uid,
				this.isTemplateMode(),
				this.#getDocumentSenderType(),
			);
			if (!this.setupData || this.blankIsNotSelected)
			{
				this.ready = true;

				return;
			}

			if (uid)
			{
				const { title, initiatedByType } = this.setupData;
				this.setDocumentTitle(title);
				this.setDocumentSenderType(initiatedByType);
				if (this.isTemplateMode())
				{
					this.#removeDocumentSection();
				}

				return;
			}

			const shouldRemoveDocumentSection = this.isTemplateMode() && this.setupData?.uid;

			this.ready = false;

			this.setupData = await this.updateDocumentData(this.setupData);

			if (shouldRemoveDocumentSection)
			{
				this.#removeDocumentSection();
			}
		}
		catch
		{
			const { blankId } = this.setupData;
			this.handleError(blankId);
		}

		this.ready = true;
	}

	async updateDocumentData(documentData: DocumentDetails): Promise<DocumentDetails | undefined>
	{
		if (!documentData)
		{
			return;
		}

		await Promise.all([
			this.#sendDocumentSenderType(documentData.uid),
		]);

		const { value: title } = this.#documentTitleInput;
		const { templateUid } = this.setupData;
		const modifyDocumentTitleResponse = await this.#api.modifyTitle(documentData.uid, title);
		const { blankTitle } = modifyDocumentTitleResponse;
		if (blankTitle)
		{
			const { blankId } = documentData;
			this.blankSelector.modifyBlankTitle(blankId, blankTitle);
		}

		return { ...documentData, title, templateUid };
	}

	#validateInput(input: HTMLElement): boolean
	{
		if (!input)
		{
			return true;
		}

		const { parentNode, value } = input;
		if (value.trim() !== '')
		{
			Dom.removeClass(parentNode, 'ui-ctl-warning');

			return true;
		}

		Dom.addClass(parentNode, 'ui-ctl-warning');
		input.focus();

		return false;
	}

	validate(): boolean
	{
		return this.#validateInput(this.#documentTitleInput);
	}

	isSenderTypeAvailable(): boolean
	{
		const settings = Extension.getSettings('sign.v2.b2e.document-setup');

		return settings.get('isSenderTypeAvailable');
	}

	resetDocument(): void
	{
		this.blankSelector.resetSelectedBlank();
		this.setDocumentTitle('');

		this.isFileAdded = false;
		this.#disableDocumentInputs();
	}

	enableDocumentInputs(): void
	{
		this.#documentTitleInput.disabled = false;
		this.blankIsNotSelected = false;
	}

	#disableDocumentInputs(): void
	{
		this.#documentTitleInput.disabled = true;
		this.blankIsNotSelected = true;
	}

	#initReplaceUploader(options: { isPlaceholderDocument?: boolean }): void
	{
		const acceptedFileTypes = getAllowedReplaceExtensions(options.isPlaceholderDocument)
			.map((extension) => `.${extension}`)
		;
		this.#replaceUploader = new Uploader({
			id: 'sign-replace-document-uploader',
			controller: 'sign.upload.blankUploadController',
			acceptedFileTypes,
			multiple: false,
			autoUpload: true,
			maxFileSize: 50 * 1024 * 1024,
			events: {
				[UploaderEvent.UPLOAD_COMPLETE]: (event) => {
					this.#onReplaceUploadComplete(options, event);
				},
			},
		});
	}

	async #onReplaceUploadComplete(options: { isPlaceholderDocument?: boolean }): Promise<void>
	{
		const files = this.#replaceUploader.getFiles();
		if (files.length === 0 || !this.#replaceDocumentData)
		{
			return;
		}

		let isSuccess = false;

		try
		{
			const previousBlankId = this.#replaceDocumentData.blankId;
			const documentUid = this.#replaceDocumentData.uid;
			const filesIds = files.map((file) => file.getServerFileId());
			const hasPlaceholders = this.#replaceDocumentData?.hasPlaceholders
				|| this.#isPlaceholderDocumentByBlankId(this.#replaceDocumentData?.blankId)
			;
			const createBlankResult = await this.#api.createBlank(
				filesIds,
				BlankScenario.b2e,
				isTemplateMode(),
				hasPlaceholders,
			);

			await this.#api.changeBlank(
				documentUid,
				createBlankResult.id,
				!options.isPlaceholderDocument,
			);

			await this.blankSelector.loadBlankById(createBlankResult.id);
			this.blankSelector.enableSelectedBlank(previousBlankId);
			this.blankSelector.disableSelectedBlank(createBlankResult.id);

			const newFile = files[0];
			const newTitle = newFile
				? newFile.getName().replace(/\.[^.]+$/, '')
				: this.#replaceDocumentData.title
			;

			const titleData = await this.#api.modifyTitle(documentUid, newTitle);
			const [loadedData, blocks] = await Promise.all([
				this.#api.loadDocument(documentUid),
				this.#api.loadBlocksByDocument(documentUid),
			]);

			const updatedDocumentData = {
				...this.#replaceDocumentData,
				...loadedData,
				blocks,
				blankId: createBlankResult.id,
				previewUrl: null,
				hasPlaceholders,
				title: newTitle,
				templateUid: this.setupData?.templateUid ?? this.#replaceDocumentData?.templateUid,
			};

			if (titleData?.blankTitle)
			{
				this.blankSelector.modifyBlankTitle(updatedDocumentData.blankId, titleData.blankTitle);
			}

			if (this.setupData?.uid === updatedDocumentData.uid)
			{
				this.setupData = updatedDocumentData;
				if (this.blankSelector.selectedBlankId !== createBlankResult.id)
				{
					await this.blankSelector.selectBlank(createBlankResult.id, { isInitial: true });
				}
			}

			this.replaceDocumentBlock(this.#replaceDocumentData, updatedDocumentData);
			this.emit('replaceDocument', { documentData: updatedDocumentData });
			this.emit('changeDocumentTitle', {
				uid: updatedDocumentData.uid,
				title: newTitle,
				blankTitle: titleData?.blankTitle,
			});
			this.#replaceUploader.removeFiles();
			isSuccess = true;
		}
		catch (e)
		{
			console.error(e);
		}
		finally
		{
			this.ready = true;
			this.emit('editorUnlock');
			this.emit('replaceDocumentFinish', { isSuccess });
			this.#replaceDocumentData = null;
		}
	}
}
