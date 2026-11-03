import { Tag, Loc, Dom, Event, Text, Type, Reflection, Cache } from 'main.core';
import { DateTimeFormat } from 'main.date';
import { Loader } from 'main.loader';
import { Popup } from 'main.popup';
import { EventEmitter, BaseEvent } from 'main.core.events';
import { BlankScenario } from 'sign.type';
import { isTemplateMode } from 'sign.v2.sign-settings';
import { Layout } from 'ui.sidepanel.layout';
import { TileWidget } from 'ui.uploader.tile-widget';
import { UploaderEvent, FileStatus, formatFileSize, type UploaderFile } from 'ui.uploader.core';
import { Api } from 'sign.v2.api';
import { getAllowedReplaceExtensions } from 'sign.v2.b2e.document-block';
import { ListItem } from './list-item';
import { Blank } from './blank';
import { BlankField } from './blank-field';
import { DragDropHandler } from './handlers/drag-drop-handler';
import {
	type BatchUploadState,
	type BlankSelectorConfig,
	type BlankData,
	type ListItemProps,
	type BlankProps,
	type ToggleEvent,
	type ButtonConfig,
} from './types/type';
import { UI } from 'ui.notification';
import './style.css';

type RemoveOptions = {
	removeFromServer: boolean;
};

const blankType = Object.freeze({
	default: 'default',
	placeholders: 'placeholders',
});

const uploaderOptions = {
	controller: 'sign.upload.blankUploadController',
	acceptedFileTypes: [
		'.jpg', '.jpeg',
		'.png', '.pdf',
		'.doc', '.docx',
		'.rtf', '.odt',
	],
	acceptedPlaceholdersFileTypes: [
		'.docx',
	],
	multiple: true,
	autoUpload: false,
	maxFileSize: 50 * 1024 * 1024,
	maxFileCount: 100,
	imageMaxFileSize: 10 * 1024 * 1024,
	maxTotalFileSize: 50 * 1024 * 1024,
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
	closeByEsc: true,
	// the popup carries an error message, not a dialog: a screen reader must read it on its own
	role: 'alert',
	cacheable: false,
	bindOptions: {
		position: 'bottom',
	},
};

export { BlankField, ListItem };
export type { BlankSelectorConfig, ToggleEvent };

export class BlankSelector extends EventEmitter
{
	events = Object.freeze({
		beforeAddFileSuccessfully: 'beforeAddFileSuccessfully',
		toggleSelection: 'toggleSelection',
		addFile: 'addFile',
		batchSelected: 'batchSelected',
	});

	#cache = new Cache.MemoryCache();
	selectedBlankId: number;
	#blanks: Map<string, Blank<BlankProps>>;
	#tileWidget: TileWidget;
	#tileWidgetContainer: HTMLElement;
	#uploadButtonsContainer: HTMLElement;
	#relatedTarget: ?HTMLElement;
	#blanksContainer: HTMLElement;
	#page: number;
	#loadMoreButton: HTMLElement;
	#api: Api;
	#config: BlankSelectorConfig;
	#isPlaceholdersUpload: boolean = false;
	#browseAcceptMap: WeakMap<HTMLElement, string[]> = new WeakMap();
	#batchHasPlaceholders: boolean = false;
	#batchBrowseInput: HTMLInputElement | null = null;
	#isBatchBrowseSelection: boolean = false;
	// The batch itself belongs to the owner of the selector: the selection is checked against what
	// is already in it, but nothing here knows how a batch is uploaded.
	#resolveBatchState: (() => BatchUploadState) | null = null;

	constructor(config: BlankSelectorConfig)
	{
		super();
		this.setEventNamespace('BX.Sign.V2.BlankSelector');
		this.subscribeFromOptions(config?.events ?? {});
		this.#config = config;
		this.selectedBlankId = 0;
		this.#blanks = new Map();
		this.#page = 0;
		this.#isPlaceholdersUpload = false;
		const uploadButtons = this.#createUploadButtons();
		const dragArea = Tag.render`
			<label class="sign-blank-selector__list_drag-area-label">
				${Loc.getMessage('SIGN_BLANK_SELECTOR_DRAG_AREA')}
			</label>
		`;
		const widgetOptions = {
			slots: {
				afterDropArea: {
					computed: {
						title: () => Loc.getMessage('SIGN_BLANK_SELECTOR_CLEAR_ALL'),
					},
					methods: {
						clear: () => {
							this.clearFiles({ removeFromServer: false });
						},
					},
					template: `
						<span
							class="sign-blank-selector__tile-widget_clear-btn"
							:title="title"
							@click="clear()"
						>
						</span>
					`,
				},
			},
		};
		this.#uploadButtonsContainer = Tag.render`
			<div class="sign-blank-selector__list --with-buttons">
				${uploadButtons}
				${dragArea}
			</div>
		`;
		new DragDropHandler(this.#uploadButtonsContainer);
		this.#tileWidget = new TileWidget({
			...uploaderOptions,
			...config.uploaderOptions,
			dropElement: this.#uploadButtonsContainer,
			browseElement: [...uploadButtons, dragArea],
			events: {
				[UploaderEvent.BEFORE_FILES_ADD]: (event) => this.#onFileBeforeAdd(event),
				[UploaderEvent.BEFORE_BROWSE]: (event) => this.#onBeforeBrowse(event),
				[UploaderEvent.FILE_ADD]: (event) => this.#onFileAdd(event),
				[UploaderEvent.FILE_REMOVE]: (event) => this.#onFileRemove(event),
				[UploaderEvent.UPLOAD_START]: (event) => this.#onUploadStart(event),
				[UploaderEvent.UPLOAD_COMPLETE]: (event) => this.#onUploadComplete(event),
			},
		}, widgetOptions);
		this.#relatedTarget = null;
		Event.bind(document, 'mousedown', (event) => {
			this.#relatedTarget = event.target;
		});
		this.#blanksContainer = Tag.render`
			<div
				class="sign-blank-selector__list"
				onfocusin="${({ target }) => {
					this.selectBlank(Number(target.dataset.id));
				}}"
				onclick="${({ target, ctrlKey, metaKey }) => {
					if (ctrlKey || metaKey)
					{
						this.resetSelectedBlank(Number(target.dataset.id), this.#relatedTarget);
					}
				}}"
			></div>
		`;
		this.#tileWidgetContainer = Tag.render`
			<div class="sign-blank-selector__tile-widget"></div>
		`;
		this.#loadMoreButton = Tag.render`
			<div class="sign-blank-selector__load-more --hidden">
				<span onclick="${() => this.#loadBlanks(this.#page + 1)}">
					${Loc.getMessage('SIGN_BLANK_SELECTOR_LOAD_MORE')}
				</span>
			</div>
		`;
		this.#api = new Api();
	}

	#getAcceptedFileTypes(): string[]
	{
		return this.#isPlaceholdersUpload
			? uploaderOptions.acceptedPlaceholdersFileTypes
			: uploaderOptions.acceptedFileTypes
		;
	}

	#isB2eBlankScenario(): boolean
	{
		return this.#config?.type === BlankScenario.b2e;
	}

	#checkForFilesValid(addedFiles: UploaderFile[]): boolean
	{
		const isImage = (file) => file.getType().includes('image/');
		const allAddedImages = addedFiles.every((file) => isImage(file));
		const uploader = this.#tileWidget.getUploader();
		const files = uploader.getFiles();
		const filesLength = files.length;
		const imagesLimit = this.#getImagesLimit();
		const isB2eAutoCommit = this.#isB2eBlankScenario()
			&& !isTemplateMode(this.#config.documentMode)
			&& filesLength > 0
			&& (addedFiles.length === 1 || allAddedImages)
		;
		const acceptedFileTypes = isB2eAutoCommit && !this.#isPlaceholdersUpload
			? uploaderOptions.acceptedFileTypes
			: this.#getAcceptedFileTypes()
		;
		const validExtension = addedFiles.every((file) => {
			// TODO merge with this.#config.uploaderOptions.acceptedFileTypes
			return acceptedFileTypes.includes(
				`.${file.getExtension()}`,
			);
		});
		if (!validExtension || (addedFiles.length > 1 && !allAddedImages))
		{
			return false;
		}

		if (filesLength === 0 && addedFiles.length === 1)
		{
			return true;
		}

		if (isB2eAutoCommit)
		{
			const exceedsImagesLimit = addedFiles.length > 1 && addedFiles.length > imagesLimit;

			return !exceedsImagesLimit;
		}

		const allExistImages = files.every((file) => isImage(file));

		return allAddedImages
			&& allExistImages
			&& imagesLimit - filesLength >= addedFiles.length;
	}

	/**
	 * The owner of the batch tells whether one is running and how much it already weighs.
	 */
	setBatchStateResolver(resolveBatchState: () => BatchUploadState): void
	{
		this.#resolveBatchState = resolveBatchState;
	}

	#getBatchState(): BatchUploadState
	{
		return this.#resolveBatchState?.() ?? { isActive: false, totalSize: 0 };
	}

	/**
	 * Batch mode covers several document files at once: images keep the old merge behaviour
	 * and a mixed selection keeps the old error. Any selection made while a batch is running joins
	 * it, a single file included: dropping one file into the zone and adding one through the window
	 * of the batch must not end up in two different places.
	 */
	#isBatchDocumentSelection(addedFiles: UploaderFile[]): boolean
	{
		const startsBatch = addedFiles.length > 1 && this.#tileWidget.getUploader().getFiles().length === 0;
		if (
			this.#config?.batchUploadEnabled !== true
			|| !(startsBatch || this.#isBatchBrowseSelection || this.#getBatchState().isActive)
		)
		{
			return false;
		}

		const acceptedFileTypes = this.#getAcceptedFileTypes();

		return addedFiles.every((file: UploaderFile) => {
			return !this.#isImageFile(file) && acceptedFileTypes.includes(`.${file.getExtension()}`);
		});
	}

	/**
	 * The whole batch is uploaded and sent to the sign service inside a single request, so a batch
	 * over the total size limit is rejected entirely instead of partially. A selection joins the
	 * files already in the running batch, so their weight counts towards the limit as well.
	 */
	#handleBatchSelection(addedFiles: UploaderFile[]): void
	{
		const totalSizeLimit = this.#getBatchTotalSizeLimit();
		const totalSize = this.#getTotalSize(addedFiles) + this.#getBatchState().totalSize;
		if (totalSizeLimit !== null && totalSize > totalSizeLimit)
		{
			this.#showUploadErrorPopup(
				'SIGN_BLANK_SELECTOR_UPLOAD_BATCH_SIZE_HINT',
				{ '%totalSizeLimit%': formatFileSize(totalSizeLimit) },
			);

			return;
		}

		const files = addedFiles
			.map((file: UploaderFile) => file.getBinary())
			.filter((file: ?File) => file !== null)
		;
		// the mode of the running batch, needed to keep browseBatchFiles() on the same tile rules
		this.#batchHasPlaceholders = this.#isPlaceholdersUpload;
		this.emit(this.events.batchSelected, {
			files,
			hasPlaceholders: this.#batchHasPlaceholders,
		});
	}

	/**
	 * Opens the system file dialog for the batch that is already running. Unlike the upload
	 * buttons, a single chosen file joins the batch instead of starting a regular upload.
	 */
	browseBatchFiles(): void
	{
		this.#isPlaceholdersUpload = this.#batchHasPlaceholders;
		const input = this.#getBatchBrowseInput();
		input.setAttribute('accept', this.#getBatchAcceptedFileTypes().join(','));
		input.click();
	}

	#getBatchBrowseInput(): HTMLInputElement
	{
		if (this.#batchBrowseInput === null)
		{
			// the input is never inserted into the document, exactly like the uploader browse input
			this.#batchBrowseInput = Tag.render`<input type="file" multiple>`;
			Event.bind(this.#batchBrowseInput, 'change', () => this.#onBatchBrowseChange());
		}

		return this.#batchBrowseInput;
	}

	#onBatchBrowseChange(): void
	{
		const files = [...(this.#batchBrowseInput.files ?? [])];
		this.#batchBrowseInput.value = '';
		if (files.length === 0)
		{
			return;
		}

		// addFiles() runs #onFileBeforeAdd synchronously, so the flag never outlives this call
		this.#isBatchBrowseSelection = true;
		try
		{
			this.addFiles(files, { isPlaceholdersUpload: this.#batchHasPlaceholders });
		}
		finally
		{
			this.#isBatchBrowseSelection = false;
		}
	}

	#getBatchAcceptedFileTypes(): string[]
	{
		return this.#getAcceptedFileTypes()
			.filter((fileType: string) => !imageExtensions.has(fileType.slice(1)))
		;
	}

	/**
	 * The limit belongs to the server; without it there is nothing to compare against
	 * and any batch is allowed.
	 */
	#getBatchTotalSizeLimit(): number | null
	{
		const limit = parseInt(this.#config?.uploaderOptions?.maxBatchTotalFileSize, 10);

		return Type.isInteger(limit) && limit > 0 ? limit : null;
	}

	#getTotalSize(files: UploaderFile[]): number
	{
		return files.reduce((totalSize: number, file: UploaderFile) => totalSize + file.getSize(), 0);
	}

	#onBeforeBrowse(event: BaseEvent<{ input: HTMLInputElement, node: HTMLElement }>): void
	{
		const { input, node } = event.getData();
		const acceptList = this.#browseAcceptMap.get(node);
		if (Type.isArrayFilled(acceptList))
		{
			input.setAttribute('accept', acceptList.join(','));
		}
	}

	#onFileBeforeAdd(uploaderEvent: BaseEvent<{ files: UploaderFile[] }>): void
	{
		const { files: addedFiles } = uploaderEvent.getData();
		const hasOversizedImage = !this.#isPlaceholdersUpload && addedFiles.some((file) => {
			return file.getType().includes('image/') && file.getSize() > uploaderOptions.imageMaxFileSize;
		});
		if (hasOversizedImage)
		{
			const messageCode = addedFiles.length > 1
				? 'SIGN_BLANK_SELECTOR_UPLOAD_IMAGE_SIZE_GROUP_HINT'
				: 'SIGN_BLANK_SELECTOR_UPLOAD_IMAGE_SIZE_HINT';
			this.#showUploadErrorPopup(messageCode);
			uploaderEvent.preventDefault();

			return;
		}

		if (this.#isBatchDocumentSelection(addedFiles))
		{
			this.#handleBatchSelection(addedFiles);
			// the batch skips the regular upload, so #onUploadComplete never resets the mode
			this.#isPlaceholdersUpload = false;
			uploaderEvent.preventDefault();

			return;
		}

		const valid = this.#checkForFilesValid(addedFiles);
		if (valid)
		{
			const selfEvent = new BaseEvent({
				data: {
					files: addedFiles,
					isPlaceholdersUpload: this.#isPlaceholdersUpload,
				},
			});
			this.emit(this.events.beforeAddFileSuccessfully, selfEvent);
			if (selfEvent.isDefaultPrevented())
			{
				uploaderEvent.preventDefault();
			}

			return;
		}

		// several documents at once are allowed only where the batch mode is on: everywhere else
		// the hint must keep promising a single document
		let messageCode = this.#config?.batchUploadEnabled === true
			? 'SIGN_BLANK_SELECTOR_UPLOAD_BATCH_HINT'
			: 'SIGN_BLANK_SELECTOR_UPLOAD_HINT'
		;
		const hasExistingFiles = this.#tileWidget.getUploader().getFiles().length > 0;
		const isLimitHint = hasExistingFiles && isTemplateMode(this.#config.documentMode);
		if (this.#isPlaceholdersUpload)
		{
			messageCode = isLimitHint
				? 'SIGN_BLANK_SELECTOR_UPLOAD_LIMIT_HINT'
				: 'SIGN_BLANK_SELECTOR_UPLOAD_PLACEHOLDERS_HINT';
		}
		else if (this.#isB2eBlankScenario() && isLimitHint)
		{
			messageCode = 'SIGN_BLANK_SELECTOR_UPLOAD_LIMIT_HINT';
		}

		this.#showUploadErrorPopup(messageCode);
		uploaderEvent.preventDefault();
	}

	#showUploadErrorPopup(messageCode: string, replacements: { [string]: string | number } = {}): void
	{
		let bindElement = this.#uploadButtonsContainer.firstElementChild;
		if (this.#isPlaceholdersUpload)
		{
			bindElement = this.#uploadButtonsContainer.querySelector('.--placeholders') ?? bindElement;
		}
		else if (this.#isB2eBlankScenario())
		{
			bindElement = this.#uploadButtonsContainer.querySelector('.--mixed') ?? bindElement;
		}

		if (Dom.hasClass(this.#uploadButtonsContainer, '--hidden'))
		{
			const {
				$refs: { container },
			} = this.#tileWidget.getRootComponent();
			bindElement = container.firstElementChild;
		}

		const content = this.#getUploadErrorText(messageCode, replacements);

		// Wait for CSS transition to complete before showing popup
		setTimeout(() => {
			const errorPopup = new Popup({
				...errorPopupOptions,
				bindElement,
				content,
			});
			errorPopup.show();
			setTimeout(() => errorPopup.close(), 7000);
		}, 200);
	}

	/**
	 * The popup renders a string content as HTML and Loc does not escape substitutions,
	 * so every replacement is encoded here.
	 */
	#getUploadErrorText(messageCode: string, replacements: { [string]: string | number }): string
	{
		const encoded: { [string]: string } = {};
		Object.entries({ '%imageCountLimit%': this.#getImagesLimit(), ...replacements })
			.forEach(([placeholder, value]: [string, string | number]) => {
				encoded[placeholder] = Text.encode(String(value));
			})
		;

		return Loc.getMessage(messageCode, encoded);
	}

	#getImagesLimit(): number
	{
		return Type.isInteger(parseInt(this.#config?.uploaderOptions?.maxFileCount, 10))
			? this.#config?.uploaderOptions?.maxFileCount
			: uploaderOptions.maxFileCount
		;
	}

	#onFileAdd(event: BaseEvent): void
	{
		const file = event.data.file;
		const title = file.getName();
		const uploadType = this.#getUploadType();
		const isImage = this.#isImageFile(file);
		file.setCustomData('uploadType', uploadType);

		if (this.#shouldShowTileUploader(isImage, uploadType))
		{
			this.#toggleTileVisibility(true);
		}

		this.resetSelectedBlank();
		this.emit(this.events.addFile, {
			title: this.#normalizeTitle(title),
			isImage,
			isMixedB2eUpload: this.#isMixedB2eUpload(uploadType),
			filesCount: this.#tileWidget.getUploader().getFiles().length,
		});
	}

	#onUploadComplete(): void
	{
		this.#isPlaceholdersUpload = false;
	}

	#getUploadType(): string
	{
		return this.#isPlaceholdersUpload
			? blankType.placeholders
			: blankType.default
		;
	}

	#isImageFile(file: UploaderFile): boolean
	{
		const mimeType = file.getType();
		if (Type.isStringFilled(mimeType) && mimeType.startsWith('image/'))
		{
			return true;
		}

		const extension = file.getExtension().toLowerCase();

		return imageExtensions.has(extension);
	}

	#isMixedB2eUpload(uploadType: string): boolean
	{
		return uploadType === blankType.default;
	}

	#shouldShowTileUploader(isImage: boolean, uploadType: string): boolean
	{
		if (!this.#isB2eBlankScenario())
		{
			return true;
		}

		const isTemplate = isTemplateMode(this.#config.documentMode);
		const isMixedImage = isImage && this.#isMixedB2eUpload(uploadType);

		return isTemplate && isMixedImage;
	}

	getUploadedFileName(fileIndex: number): string | null
	{
		const uploader = this.#tileWidget.getUploader();
		const files = uploader.getFiles();
		if (files.length === 0)
		{
			return null;
		}
		const file = files.at(fileIndex);
		if (!file)
		{
			return null;
		}

		return this.#normalizeTitle(file.getName());
	}

	#onFileRemove(event: BaseEvent): void
	{
		this.emit('removeFile');
		const uploader = this.#tileWidget.getUploader();
		const files = uploader.getFiles();
		if (files.length === 0)
		{
			this.#toggleTileVisibility(false);
			this.emit('clearFiles');
		}
	}

	#onUploadStart(): void
	{
		const uploader = this.#tileWidget.getUploader();
		const [firstFile] = uploader.getFiles();
		const title = firstFile.getName();
		const fileId = firstFile.getId();
		const uploadingBlank: Blank<BlankProps> = new Blank({ title });
		uploadingBlank.setReady(false);
		Dom.prepend(uploadingBlank.getLayout(), this.#blanksContainer);
		firstFile.setCustomData(fileId, uploadingBlank);
	}

	#toggleTileVisibility(shouldShow: boolean)
	{
		const hiddenClass = '--hidden';
		if (shouldShow)
		{
			Dom.removeClass(this.#tileWidgetContainer, hiddenClass);
			Dom.addClass(this.#uploadButtonsContainer, hiddenClass);

			return;
		}

		Dom.addClass(this.#tileWidgetContainer, hiddenClass);
		Dom.removeClass(this.#uploadButtonsContainer, hiddenClass);
		this.clearFiles({ removeFromServer: false });
	}

	#createUploadButtons(): Array<HTMLElement>
	{
		const entries = Object.entries(this.#getUploadButtonsConfig());

		return entries.map(([key, config]) => {
			const isPlaceholders = key === blankType.placeholders;
			const listItem: ListItem<ListItemProps> = new ListItem({
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
				},
			});

			const layout = listItem.getLayout();
			Event.bind(layout, 'click', () => {
				this.#isPlaceholdersUpload = isPlaceholders;
			});

			if (Type.isArrayFilled(config.acceptedFileTypes))
			{
				this.#browseAcceptMap.set(layout, config.acceptedFileTypes);
			}

			return layout;
		});
	}

	#getUploadButtonsConfig(): Record<string, ButtonConfig>
	{
		if (this.#isB2eBlankScenario())
		{
			return this.#getB2eButtonsConfig();
		}

		return this.#getB2bButtonsConfig();
	}

	#getB2bButtonsConfig(): Record<string, ButtonConfig>
	{
		return {
			img: {
				title: Loc.getMessage('SIGN_BLANK_SELECTOR_CREATE_NEW_PIC'),
				description: 'jpeg, png',
			},
			pdf: {
				title: Loc.getMessage('SIGN_BLANK_SELECTOR_NEW_PDF'),
				description: 'Adobe Acrobat',
			},
			doc: {
				title: Loc.getMessage('SIGN_BLANK_SELECTOR_NEW_DOC'),
				description: 'doc, docx',
			},
		};
	}

	#getB2eButtonsConfig(): Record<string, ButtonConfig>
	{
		const toAcceptList = (extensions: string[]): string[] => extensions.map((ext) => `.${ext}`);

		return {
			placeholders: {
				title: 'docx',
				description: Loc.getMessage('SIGN_BLANK_SELECTOR_PLACEHOLDERS_DOCX_MSGVER_1'),
				dragDescriptionTextHTML: Loc.getMessage('SIGN_BLANK_SELECTOR_DROP_ZONE_PLACEHOLDERS', {
					'[highlight]': '<span class="sign-blank-selector__list_item-drag-overlay-highlighting">',
					'[/highlight]': '</span>',
				}),
				acceptedFileTypes: toAcceptList(getAllowedReplaceExtensions(true)),
			},
			mixed: {
				title: 'pdf, png, doc, jpeg',
				description: Loc.getMessage('SIGN_BLANK_SELECTOR_MIXED'),
				dragDescriptionTextHTML: Loc.getMessage('SIGN_BLANK_SELECTOR_DROP_ZONE_MIXED', {
					'[highlight]': '<span class="sign-blank-selector__list_item-drag-overlay-highlighting">',
					'[/highlight]': '</span>',
				}),
				acceptedFileTypes: toAcceptList(getAllowedReplaceExtensions(false)),
			},
		};
	}

	async #resumeUploading()
	{
		const uploader = this.#tileWidget.getUploader();
		if (uploader.getPendingFileCount() === 0)
		{
			return;
		}
		const pendingFiles = uploader.getFiles();
		uploader.setMaxParallelUploads(pendingFiles.length);
		const uploadPromise = new Promise((resolve) => {
			uploader.subscribeOnce('onUploadComplete', resolve);
		});
		uploader.start();
		await uploadPromise;
	}

	async createBlankFromOuterUploaderFiles(files: Array<UploaderFile>): Promise<number>
	{
		if (files.length === 0)
		{
			return;
		}

		if (!this.#isAllFileUploadsComplete(files))
		{
			const errorMessage = Loc.getMessage('SIGN_BLANK_SELECTOR_UPLOADER_ERROR_INCOMPLETE');
			UI.Notification.Center.notify({ content: errorMessage });
			throw new Error(errorMessage);
		}

		const firstFile = files.at(0);
		const blank = new Blank({ title: firstFile.getName() });
		blank.setReady(false);
		Dom.prepend(blank.getLayout(), this.#blanksContainer);
		try
		{
			const filesIds = files.map((file) => file.getServerFileId());
			const hasPlaceholders = files.some(
				(file) => file.getCustomData('uploadType') === blankType.placeholders,
			);
			const blankData = await this.#api.createBlank(
				filesIds,
				this.#config.type ?? null,
				isTemplateMode(this.#config.documentMode),
				hasPlaceholders,
			);
			this.#setupBlank({
				...blankData,
				userName: Loc.getMessage('SIGN_BLANK_SELECTOR_CREATED_MYSELF'),
				hasPlaceholders,
			}, blank);

			return blankData.id;
		}
		catch (ex)
		{
			blank?.remove?.();
			console.log(ex);
			throw ex;
		}
	}

	async createBlank(): ?Promise<number>
	{
		const uploader = this.#tileWidget.getUploader();
		const files = uploader.getFiles();

		if (files.length === 0)
		{
			return;
		}

		const [firstFile] = files;
		await this.#resumeUploading();
		const blank = firstFile.getCustomData(firstFile.getId());

		const failedFiles = files.filter((file) => {
			return file.getStatus() !== FileStatus.COMPLETE || Type.isNull(file.getServerFileId());
		});

		if (failedFiles.length > 0)
		{
			failedFiles.forEach((file) => {
				uploader.removeFile(file, { removeFromServer: false });
			});
			if (failedFiles.length === files.length)
			{
				blank?.remove?.();
			}
			const errorMessage = Loc.getMessage('SIGN_BLANK_SELECTOR_UPLOADER_ERROR_INCOMPLETE');
			UI.Notification.Center.notify({ content: errorMessage });
			throw new Error(errorMessage);
		}

		try
		{
			const filesIds = files.map((file): string => file.getServerFileId());
			const hasPlaceholders = files.some((file) => file.getCustomData('uploadType') === 'placeholders');

			const blankData = await this.#api.createBlank(
				filesIds,
				this.#config.type ?? null,
				isTemplateMode(this.#config.documentMode),
				hasPlaceholders,
			);
			this.#setupBlank({
				...blankData,
				userName: Loc.getMessage('SIGN_BLANK_SELECTOR_CREATED_MYSELF'),
				hasPlaceholders,
			}, blank);

			return blankData.id;
		}
		catch (ex)
		{
			blank.remove();
			throw ex;
		}
	}

	async #loadBlanks(page: number)
	{
		const loader = new Loader({
			target: this.#blanksContainer,
			size: 80,
			mode: 'custom',
		});
		loader.show();
		try
		{
			const blanksOnPage = 3;
			const data = await this.#api.loadBlanks(page, this.#config.type ?? null, blanksOnPage);
			if (data.length < blanksOnPage)
			{
				Dom.addClass(this.#loadMoreButton, '--hidden');
			}
			else
			{
				Dom.removeClass(this.#loadMoreButton, '--hidden');
			}

			if (data.length > 0)
			{
				data.forEach((blankData: BlankData) => {
					if (this.hasBlank(blankData.id))
					{
						return;
					}

					const { title } = blankData;
					const blank: Blank<BlankProps> = new Blank({ title });
					this.#addBlank(blankData, blank);
				});
				this.#page = page;
			}
		}
		catch
		{
			Dom.removeClass(this.#loadMoreButton, '--hidden');
		}

		loader.destroy();
	}

	#setupBlank(blankData: BlankData, blank: Blank): void
	{
		const {
			id: blankId,
			previewUrl,
			userAvatarUrl,
			userName,
			dateCreate,
			hasPlaceholders = false,
		} = blankData;
		const creationDate = dateCreate ? new Date(dateCreate) : new Date();
		const descriptionText = `${userName}, ${DateTimeFormat.format('j M. Y', creationDate)}`;
		blank.setId(blankId);
		blank.setReady(true);
		blank.setPreview(previewUrl);
		blank.setAvatarWithDescription(descriptionText, userAvatarUrl);

		if (hasPlaceholders)
		{
			blank.getLayout().dataset.hasPlaceholders = 'true';
		}

		this.#blanks.set(blankId, blank);
	}

	#normalizeTitle(title: string): string
	{
		const acceptedType = uploaderOptions.acceptedFileTypes.find((fileType) => {
			return title.endsWith(fileType);
		});
		if (!acceptedType)
		{
			return title;
		}

		const dotExtensionIndex = title.lastIndexOf(acceptedType);

		return title.slice(0, dotExtensionIndex);
	}

	#addBlank(blankData: BlankData, blank: Blank): void
	{
		this.#setupBlank(blankData, blank);
		Dom.append(blank.getLayout(), this.#blanksContainer);
	}

	resetSelectedBlank()
	{
		const previousSelectedBlankId = this.selectedBlankId;
		const blank = this.getBlank(this.selectedBlankId);

		blank?.deselect();
		this.selectedBlankId = 0;
		if (blank)
		{
			this.emit(this.events.toggleSelection, { selected: false, previousSelectedBlankId });
		}
		this.#enableSaveButtonIntoSlider();
	}

	async modifyBlankTitle(blankId: number, blankTitle: string): void
	{
		let blank = this.#blanks.get(blankId);
		if (!blank)
		{
			await this.loadBlankById(blankId);
			blank = this.#blanks.get(blankId);
		}
		blank.setTitle(blankTitle);
	}

	hasBlank(blankId: number): boolean
	{
		return this.#blanks.has(blankId);
	}

	getBlank(blankId: number): Blank
	{
		return this.#blanks.get(blankId);
	}

	async loadBlankById(blankId: number): Promise<void>
	{
		const blankData = await this.#api.getBlankById(blankId);
		if (!this.hasBlank(blankId))
		{
			const blank: Blank<BlankProps> = new Blank({ title: blankData.title });
			this.#addBlank(blankData, blank);
		}
	}

	async selectBlank(blankId: number, eventExtraOptions: Object = {}): Promise<void>
	{
		const previousSelectedBlankId = this.selectedBlankId;
		if (blankId !== this.selectedBlankId)
		{
			this.resetSelectedBlank();
		}

		this.selectedBlankId = blankId;
		this.#toggleTileVisibility(false);
		let blank = this.getBlank(blankId);

		if (!blank)
		{
			await this.loadBlankById(blankId);
			blank = this.getBlank(blankId);
		}
		const { title } = blank.getProps();
		blank.select();

		this.emit(
			this.events.toggleSelection,
			{
				id: blankId,
				selected: true,
				title: this.#normalizeTitle(title),
				extra: eventExtraOptions,
				previousSelectedBlankId,
			},
		);
	}

	deleteBlank(blankId: number)
	{
		const lastBlank = this.#blanks.get(blankId);
		if (lastBlank)
		{
			this.#blanks.delete(blankId);
			lastBlank.remove();
		}
	}

	clearFiles(options: RemoveOptions)
	{
		const uploader = this.#tileWidget.getUploader();
		uploader.removeFiles(options);
	}

	addFiles(files: File[], options: { isPlaceholdersUpload?: boolean } = {}): void
	{
		if (Type.isBoolean(options.isPlaceholdersUpload))
		{
			this.#isPlaceholdersUpload = options.isPlaceholdersUpload;
		}
		const uploader = this.#tileWidget.getUploader();
		uploader.addFiles(files);
	}

	isFilesReadyForUpload(): boolean
	{
		if (this.#tileWidget.getUploader().getFiles().length === 0)
		{
			return false;
		}

		return this.#tileWidget.getUploader().getFiles()
			.every((file: UploaderFile) => file.getErrors().length <= 0)
		;
	}

	hasPlaceholderFilesForUpload(): boolean
	{
		return this.#tileWidget
			.getUploader()
			.getFiles()
			.some((file: UploaderFile) => file.getCustomData('uploadType') === blankType.placeholders)
		;
	}

	getLayout(): HTMLElement
	{
		this.#tileWidget.renderTo(this.#tileWidgetContainer);
		this.#toggleTileVisibility(false);
		const canUploadNewBlank = this.#config.canUploadNewBlank ?? true;
		const titleBlock = this.#isB2eBlankScenario() ? ''
			: Tag.render`
				<p class="sign-blank-selector__templates_title">
					${Loc.getMessage('SIGN_BLANK_SELECTOR_RECENT_TEMPLATES_TITLE')}
				</p>
			`
		;
		const selectorContainer = Tag.render`
			<div class="sign-blank-selector">
				${this.#tileWidgetContainer}
				${canUploadNewBlank ? this.#uploadButtonsContainer : ''}
				${titleBlock}
				${this.#isB2eBlankScenario() ? '' : this.#blanksContainer}
				${this.#isB2eBlankScenario() ? '' : this.#loadMoreButton}
			</div>
		`;
		if (this.#page === 0)
		{
			this.#loadBlanks(1);
		}

		return selectorContainer;
	}

	openInSlider()
	{
		const SidePanel: BX.SidePanel = Reflection.getClass('BX.SidePanel');
		if (!Type.isNil(SidePanel))
		{
			SidePanel.Instance.open('v2-blank-selector', {
				width: 628,
				cacheable: false,
				events: {
					onClose: () => {
						this.emit('onSliderClose');
					},
				},
				contentCallback: () => {
					return Layout.createContent({
						extensions: ['sign.v2.blank-selector'],
						title: Loc.getMessage('SIGN_BLANK_SELECTOR_SLIDER_TITLE'),
						content: () => this.getLayout(),
						buttons: ({ cancelButton, SaveButton }) => {
							this.#setSaveButtonIntoSlider(
								new SaveButton({
									text: Loc.getMessage('SIGN_BLANK_SELECTOR_SLIDER_SELECT_BLANK_BUTTON_LABEL'),
									onclick: () => {
										SidePanel.Instance.close();
									},
								}),
							);

							this.#disableSaveButtonIntoSlider();

							return [
								this.#getSaveButtonIntoSlider(),
								cancelButton,
							];
						},
					});
				},
			});
		}
	}

	#setSaveButtonIntoSlider(button)
	{
		this.#cache.set('saveButton', button);
	}

	#disableSaveButtonIntoSlider()
	{
		const saveButton = this.#getSaveButtonIntoSlider();
		saveButton?.setDisabled(true);
	}

	#enableSaveButtonIntoSlider()
	{
		const saveButton = this.#getSaveButtonIntoSlider();
		saveButton?.setDisabled(false);
	}

	#getSaveButtonIntoSlider(): any
	{
		return this.#cache.get('saveButton');
	}

	disableSelectedBlank(blankId: number): void
	{
		const blank = this.#blanks.get(blankId);

		if (blank)
		{
			Dom.addClass(blank.getLayout(), '--disabled');
		}
	}

	enableSelectedBlank(blankId: number): void
	{
		const blank = this.#blanks.get(blankId);

		if (blank)
		{
			Dom.removeClass(blank.getLayout(), '--disabled');
		}
	}

	#isAllFileUploadsComplete(files: Array<UploaderFile>): boolean
	{
		const notUploadedFiles = files.filter((file) => {
			return file.getStatus() !== FileStatus.COMPLETE || Type.isNull(file.getServerFileId());
		});

		return notUploadedFiles.length === 0;
	}
}
