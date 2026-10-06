/* eslint-disable */
type UploaderOptions = {
	controller?: string;
	controllerOptions?: {
		[key: string]: string | number;
	};
	id?: string;
	browseElement?: HTMLElement | HTMLElement[];
	dropElement?: HTMLElement | HTMLElement[];
	pasteElement?: HTMLElement | HTMLElement[];
	hiddenFieldsContainer?: string | HTMLElement;
	hiddenFieldName?: string;
	assignAsFile?: boolean;
	assignServerFile?: boolean;
	autoUpload?: boolean;
	multiple?: boolean;
	allowReplaceSingle?: boolean;
	maxParallelUploads?: number;
	maxParallelLoads?: number;
	acceptOnlyImages?: boolean;
	acceptedFileTypes?: string | string[];
	maxFileSize?: number;
	minFileSize?: number;
	maxTotalFileSize?: number;
	maxFileCount?: number;
	imageMinWidth?: number;
	imageMinHeight?: number;
	imageMaxWidth?: number;
	imageMaxHeight?: number;
	imageMaxFileSize?: number;
	imageMinFileSize?: number;
	ignoreUnknownImageTypes?: boolean;
	treatOversizeImageAsFile?: boolean;
	imageResizeWidth?: number;
	imageResizeHeight?: number;
	imageResizeMode?: ResizeImageMode;
	imageResizeMimeType?: ResizeImageMimeType;
	imageResizeMimeTypeMode?: ResizeImageMimeTypeMode;
	imageResizeQuality?: number;
	imageResizeFilter?: (file: BX.UI.Uploader.UploaderFile) => true | ResizeImageOptions;
	imagePreviewWidth?: number;
	imagePreviewHeight?: number;
	imagePreviewResizeMode?: ResizeImageMode;
	imagePreviewMimeType?: ResizeImageMimeType;
	imagePreviewMimeTypeMode?: ResizeImageMimeTypeMode;
	imagePreviewQuality?: number;
	imagePreviewUpscale?: boolean;
	imagePreviewFilter?: (file: BX.UI.Uploader.UploaderFile) => true | ResizeImageOptions;
	ignoredFileNames?: string[];
	serverOptions?: ServerOptions;
	filters?: Array<{
		type: BX.UI.Uploader.FilterType;
		filter: BX.UI.Uploader.Filter | (new (...args: any[]) => BX.UI.Uploader.Filter) | string;
		options: {
			[key: string]: any;
		};
	}>;
	files?: UploaderFileOptions[];
	events?: {
		[eventName: string]: (event: BX.Event.BaseEvent) => void;
	};
};

type ResizeImageMode = 'contain' | 'cover' | 'crop' | 'force';

type ResizeImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

type ResizeImageMimeTypeMode = 'auto' | 'force';

type UploaderFileOptions = {
	id?: string;
	serverFileId?: number | string;
	name?: string;
	type?: string;
	size?: number;
	width?: number;
	height?: number;
	treatImageAsFile?: boolean;
	downloadUrl?: string;
	clientPreview?: Blob;
	clientPreviewWidth?: number;
	clientPreviewHeight?: number;
	serverPreviewUrl?: string;
	serverPreviewWidth?: number;
	serverPreviewHeight?: number;
	preload?: boolean;
	uploadController?: BX.UI.Uploader.AbstractUploadController;
	loadController?: BX.UI.Uploader.AbstractLoadController;
	removeController?: BX.UI.Uploader.AbstractRemoveController;
	customData?: {
		[key: string]: any;
	};
	viewerAttrs?: {
		[key: string]: string;
	};
	events?: {
		[eventName: string]: (event: BX.Event.BaseEvent) => void;
	};
};

type ServerOptions = {
	controller?: string;
	controllerOptions?: {
		[key: string]: any;
	};
	chunkSize?: number;
	forceChunkSize?: boolean;
	chunkRetryDelays?: number[] | false | null;
	parallelChunkUpload?: boolean;
	maxParallelChunks?: number;
	presignedChunkUpload?: boolean;
	presignedThreshold?: number;
	presignedRegisterInterval?: number;
	uploadControllerClass?: (new (...args: any[]) => BX.UI.Uploader.AbstractUploadController) | string;
	uploadControllerOptions?: {
		[key: string]: any;
	};
	loadControllerClass?: (new (...args: any[]) => BX.UI.Uploader.AbstractLoadController) | string;
	loadControllerOptions?: {
		[key: string]: any;
	};
	removeControllerClass?: (new (...args: any[]) => BX.UI.Uploader.AbstractRemoveController) | string;
	removeControllerOptions?: {
		[key: string]: any;
	};
};

type RemoveFileOptions = {
	removeFromServer?: boolean;
};

/**
 * @namespace BX.UI.Uploader
 */
type FileStatusType = {
	INIT: string;
	ADDED: string;
	LOADING: string;
	PENDING: string;
	PREPARING: string;
	UPLOADING: string;
	COMPLETE: string;
	LOAD_FAILED: string;
	UPLOAD_FAILED: string;
};

type FileStatus = FileStatusType[keyof FileStatusType];

type FileOrigin = (typeof BX.UI.Uploader.FileOrigin)[keyof typeof BX.UI.Uploader.FileOrigin];

type UploaderErrorOrigin = (typeof BX.UI.Uploader.UploaderError.Origin)[keyof typeof BX.UI.Uploader.UploaderError.Origin];

type UploaderErrorType = (typeof BX.UI.Uploader.UploaderError.Type)[keyof typeof BX.UI.Uploader.UploaderError.Type];

type AjaxError = {
	type?: string;
	system?: boolean;
	code?: string | number;
	message?: string;
	description?: string;
	customData?: {
		[key: string]: any;
	} | null;
};

type UploaderFileInfo = {
	id: string;
	serverFileId: number | string | null;
	serverId?: number | string | null;
	status: BX.UI.Uploader.FileStatus;
	name: string;
	size: number;
	sizeFormatted: string;
	type: string;
	extension: string;
	origin: BX.UI.Uploader.FileOrigin;
	isImage: boolean;
	isVideo: boolean;
	animated?: boolean;
	failed: boolean;
	width: number | null;
	height: number | null;
	progress: number;
	error?: BX.UI.Uploader.UploaderError | null;
	errors?: BX.UI.Uploader.UploaderError[];
	previewUrl: string | null;
	previewWidth: number | null;
	previewHeight: number | null;
	clientPreviewUrl: string | null;
	clientPreviewWidth: number | null;
	clientPreviewHeight: number | null;
	serverPreviewUrl: string | null;
	serverPreviewWidth: number | null;
	serverPreviewHeight: number | null;
	downloadUrl: string | null;
	customData: Record<string, any>;
	viewerAttrs: Record<string, string> | null;
};

type ResizeImageOptions = {
	mode?: ResizeImageMode;
	upscale?: boolean;
	width?: number | null;
	height?: number | null;
	quality?: number;
	mimeType?: ResizeImageMimeType;
	mimeTypeMode?: ResizeImageMimeTypeMode;
};

type FilterType = (typeof BX.UI.Uploader.FilterType)[keyof typeof BX.UI.Uploader.FilterType];

type DestroyOptions = {
	removeFilesFromServer?: boolean;
};

type UploaderStatus = (typeof BX.UI.Uploader.UploaderStatus)[keyof typeof BX.UI.Uploader.UploaderStatus];

type ResizeImageResult = {
	preview: Blob | File;
	width: number;
	height: number;
};

type ImageSize = {
	width: number;
	height: number;
	animated?: boolean;
	orientation?: number;
};

type ImageData = ImageBitmap | HTMLImageElement | {
	width: number;
	height: number;
};

type ResizedImageSizeResult = {
	targetWidth: number;
	targetHeight: number;
	useOriginalSize: boolean;
};

type VideoPreviewResult = {
	preview: Blob;
	width: number;
	height: number;
};

declare namespace BX.UI.Uploader {
	/**
	 * @namespace BX.UI.Uploader
	 */
	class Uploader extends BX.Event.EventEmitter {
		static getById(id: string): Uploader | null;
		static getInstances(): Uploader[];
		constructor(uploaderOptions?: UploaderOptions);
		static getGlobalOption(path: string, defaultValue?: any): any;
		addFiles(fileList: ArrayLike<any> | null | undefined): UploaderFile[];
		addFile(source: File | Blob | string | number | UploaderFileOptions | UploaderFile, options?: UploaderFileOptions): UploaderFile | null;
		start(): void;
		stop(): void;
		isDestroyed(): boolean;
		destroy(options?: DestroyOptions): void;
		removeFiles(options?: RemoveFileOptions): void;
		removeFile(fileOrId: UploaderFile | string, options?: RemoveFileOptions): void;
		getFile(id: string): UploaderFile | null;
		getFiles(): UploaderFile[];
		getFileCount(): number;
		getId(): string;
		isMultiple(): boolean;
		getStatus(): UploaderStatus;
		addFilter(type: FilterType, filterEntity: Filter | (new (...args: any[]) => Filter) | string, filterOptions?: BX.JsonObject): void;
		addFilters(filters: UploaderOptions['filters']): void;
		getServer(): Server;
		assignBrowse(htmlElement: HTMLElement | HTMLElement[] | null | undefined): void;
		unassignBrowse(htmlElement: HTMLElement | HTMLElement[]): void;
		unassignBrowseAll(): void;
		assignDropzone(htmlElement: HTMLElement | HTMLElement[] | null | undefined): void;
		unassignDropzone(htmlElement: HTMLElement | HTMLElement[]): void;
		unassignDropzoneAll(): void;
		assignPaste(htmlElement: HTMLElement | HTMLElement[] | null | undefined): void;
		unassignPaste(htmlElement: HTMLElement | HTMLElement[]): void;
		unassignPasteAll(): void;
		getHiddenFieldsContainer(): HTMLElement | null;
		setHiddenFieldsContainer(container: string | HTMLElement | null | undefined): void;
		getHiddenFieldName(): string;
		setHiddenFieldName(name: string | undefined): void;
		shouldAssignAsFile(): boolean;
		setAssignAsFile(flag: boolean | undefined): void;
		shouldAssignServerFile(): boolean;
		setAssignServerFile(flag: boolean | undefined): void;
		getTotalSize(): number;
		shouldAutoUpload(): boolean;
		setAutoUpload(flag: boolean | undefined): void;
		getMaxParallelUploads(): number;
		setMaxParallelUploads(number: number | undefined): void;
		getMaxParallelLoads(): number;
		setMaxParallelLoads(number: number | undefined): void;
		getUploadingFileCount(): number;
		getPendingFileCount(): number;
		isInProgress(): boolean;
		static getImageExtensions(): Array<string>;
		static getVideoExtensions(): Array<string>;
		setAcceptOnlyImages(flag: boolean | null | undefined): void;
		acceptOnlyImages(): void;
		shouldAcceptOnlyImages(): boolean;
		getAcceptedFileTypes(): string[];
		setAcceptedFileTypes(fileTypes: string | string[]): void;
		getIgnoredFileNames(): string[];
		setIgnoredFileNames(fileNames: string[] | null | undefined): void;
		setMaxFileCount(maxFileCount: number | null | undefined): void;
		getMaxFileCount(): number | null;
		setAllowReplaceSingle(flag: boolean | undefined): void;
		shouldReplaceSingle(): boolean;
	}

	class UploaderFile extends BX.Event.EventEmitter {
		constructor(source: File | Blob | string | number | UploaderFileOptions, fileOptions?: UploaderFileOptions);
		load(): void;
		shouldForceServerLoad(): boolean;
		upload(callbacks?: {
			onComplete?: Function;
			onError?: Function;
		}): void;
		remove(options?: RemoveFileOptions): void;
		abort(): void;
		getUploadController(): AbstractUploadController | null;
		setUploadController(controller: AbstractUploadController | null | undefined): void;
		setLoadController(controller: AbstractLoadController | null | undefined): void;
		setRemoveController(controller: AbstractRemoveController | null | undefined): void;
		isReadyToUpload(): boolean;
		isUploadable(): boolean;
		setServer(server: Server | null): void;
		isLoadable(): boolean;
		isRemoveable(): boolean;
		canUpload(): boolean;
		canLoad(): boolean;
		isUploading(): boolean;
		isPreparing(): boolean;
		isLoading(): boolean;
		isComplete(): boolean;
		isFailed(): boolean;
		isLoadFailed(): boolean;
		isUploadFailed(): boolean;
		isInProgress(): boolean;
		getBinary(): File | null;
		setFile(file: File | Blob): void;
		update(options: UploaderFileOptions): void;
		getName(): string;
		setName(name: string | null | undefined): void;
		getExtension(): string;
		getType(): string;
		setType(type: string | undefined): void;
		getSize(): number;
		getSizeFormatted(): string;
		setSize(size: number | undefined): void;
		getId(): string;
		getServerFileId(): number | string | null;
		/**
		 * @deprecated
		 * use getServerFileId
		 */
		getServerId(): number | string | null;
		setServerFileId(id: number | string | null | undefined): void;
		getStatus(): FileStatus;
		getOrigin(): FileOrigin;
		getDownloadUrl(): string | null;
		setDownloadUrl(url: string | null | undefined): void;
		getWidth(): number | null;
		setWidth(width: number | null | undefined): void;
		getHeight(): number | null;
		setHeight(height: number | null | undefined): void;
		isAnimated(): boolean;
		setAnimated(flag: boolean): void;
		setTreatImageAsFile(flag: boolean | undefined): void;
		shouldTreatImageAsFile(): boolean;
		getPreviewUrl(): string | null;
		getPreviewWidth(): number | null;
		getPreviewHeight(): number | null;
		getClientPreview(): Blob | null;
		setClientPreview(file: Blob | null | undefined, width?: number | null | undefined, height?: number | null | undefined): void;
		getClientPreviewUrl(): string | null;
		revokeClientPreviewUrl(): void;
		getClientPreviewWidth(): number | null;
		getClientPreviewHeight(): number | null;
		getServerPreviewUrl(): string | null;
		setServerPreview(url: string | null | undefined, width?: number | null | undefined, height?: number | null | undefined): void;
		getServerPreviewWidth(): number | null;
		getServerPreviewHeight(): number | null;
		isImage(): boolean;
		isVideo(): boolean;
		getProgress(): number;
		setProgress(progress: number | null | undefined): void;
		addError(error: Error | UploaderError): UploaderError;
		getError(): UploaderError | null;
		getErrors(): UploaderError[];
		getState(): UploaderFileInfo;
		setCustomData(property: (string | null | undefined) | {
			[key: string]: any;
		}, value?: any): void;
		getCustomData(property?: string): any;
		setViewerAttrs(viewerAttrs: {
			[key: string]: string;
		} | null | undefined): void;
		getViewerAttrs(): Record<string, string> | null;
		toJSON(): UploaderFileInfo;
	}

	class AbstractUploadController extends BX.Event.EventEmitter {
		constructor(server: Server, options?: {
			[key: string]: any;
		});
		getServer(): Server;
		getOptions(): {
			[key: string]: any;
		};
		getOption(option: string, defaultValue?: any): any;
		upload(file: UploaderFile): void;
		abort(): void;
	}

	class Server {
		constructor(serverOptions: ServerOptions);
		canCreateUploadController(): boolean;
		createUploadController(file?: UploaderFile | null | undefined): AbstractUploadController | null;
		createServerLoadController(): AbstractLoadController;
		createDefaultServerLoadController(): ServerLoadController;
		createClientLoadController(): ClientLoadController;
		createServerlessLoadController(): ServerlessLoadController;
		createRemoveController(): AbstractRemoveController | null | undefined;
		getController(): string | null | undefined;
		getControllerOptions(): {
			[key: string]: any;
		} | null | void;
		getChunkSize(): number;
		getDefaultChunkSize(): number;
		getChunkMinSize(): number;
		getChunkMaxSize(): number;
		getChunkRetryDelays(): number[];
		isParallelChunkUploadEnabled(): boolean;
		getMaxParallelChunks(): number;
		isPresignedChunkUploadEnabled(): boolean;
		/**
		 * Lower bound (in bytes) above which the presigned strategy is allowed to
		 * kick in. null means no threshold — every multi-chunk file qualifies.
		 */
		getPresignedThreshold(): number | null | undefined;
		getPresignedRegisterInterval(): number;
	}

	class AbstractLoadController extends BX.Event.EventEmitter {
		constructor(server: Server, options?: {
			[key: string]: any;
		});
		getServer(): Server;
		getOptions(): {
			[key: string]: any;
		};
		getOption(option: string, defaultValue?: any): any;
		load(file: UploaderFile): void;
		abort(): void;
	}

	class AbstractRemoveController extends BX.Event.EventEmitter {
		constructor(server: Server, options?: {
			[key: string]: any;
		});
		getServer(): Server;
		getOptions(): {
			[key: string]: any;
		};
		getOption(option: string, defaultValue?: any): any;
		remove(file: UploaderFile): void;
	}

	class ServerLoadController extends AbstractLoadController {
		constructor(server: Server, options?: {
			[key: string]: any;
		});
		load(file: UploaderFile): void;
		abort(): void;
	}

	class ClientLoadController extends AbstractLoadController {
		constructor(server: Server, options?: {
			[key: string]: any;
		});
		load(file: UploaderFile): void;
		abort(): void;
	}

	class ServerlessLoadController extends AbstractLoadController {
		constructor(server: Server, options?: {
			[key: string]: any;
		});
		load(file: UploaderFile): void;
		abort(): void;
	}

	/**
	 * @namespace BX.UI.Uploader
	 */
	const FileStatus: FileStatusType;

	/**
	 * @namespace BX.UI.Uploader
	 */
	const FileOrigin: {
		CLIENT: string;
		SERVER: string;
	};

	/**
	 * @namespace BX.UI.Uploader
	 */
	class UploaderError extends BX.BaseError {
		static Origin: {
			SERVER: string;
			CLIENT: string;
		};
		static Type: {
			USER: string;
			SYSTEM: string;
			UNKNOWN: string;
		};
		description: string;
		origin: UploaderErrorOrigin;
		type: UploaderErrorType;
		/**
		 * new UploaderError(code)
		 * new UploaderError(code, customData)
		 * new UploaderError(code, message)
		 * new UploaderError(code, message, description)
		 * new UploaderError(code, message, customData)
		 * new UploaderError(code, message, description, customData)
		 */
		constructor(code: string, ...args: Array<any>);
		static createFromAjaxErrors(errors: Array<AjaxError>): UploaderError;
		static createFromError(error: Error): UploaderError;
		getDescription(): string;
		setDescription(text: string | null | undefined): this;
		getOrigin(): UploaderErrorOrigin;
		setOrigin(origin: UploaderErrorOrigin): this;
		getType(): UploaderErrorType;
		setType(type: UploaderErrorType): this;
		clone(): UploaderError;
		toString(): string;
		toJSON(): {
			[key: string]: any;
		};
	}

	/**
	 * @namespace BX.UI.Uploader
	 */
	const FilterType: {
		VALIDATION: string;
		PREPARATION: string;
	};

	class Filter {
		constructor(uploader: Uploader, filterOptions?: {
			[key: string]: any;
		});
		getUploader(): Uploader;
		/**
		 * @abstract
		 */
		apply(...args: any[]): Promise<void>;
	}

	const UploaderStatus: {
		STARTED: number;
		STOPPED: number;
	};

	/**
	 * @namespace BX.UI.Uploader
	 */
	const UploaderEvent: {
		UPLOAD_START: string;
		UPLOAD_COMPLETE: string;
		ERROR: string;
		MAX_FILE_COUNT_EXCEEDED: string;
		DESTROY: string;
		BEFORE_BROWSE: string;
		BEFORE_DROP: string;
		BEFORE_PASTE: string;
		BEFORE_FILES_ADD: string;
		FILE_BEFORE_ADD: string;
		FILE_ADD_START: string;
		FILE_LOAD_START: string;
		FILE_LOAD_PROGRESS: string;
		FILE_LOAD_COMPLETE: string;
		FILE_ERROR: string;
		FILE_ADD: string;
		FILE_REMOVE: string;
		FILE_UPLOAD_START: string;
		FILE_UPLOAD_PROGRESS: string;
		FILE_UPLOAD_COMPLETE: string;
		FILE_COMPLETE: string;
		FILE_STATUS_CHANGE: string;
		FILE_STATE_CHANGE: string;
	};

	/**
	 * @namespace BX.UI.Uploader
	 */
	const FileEvent: {
		ADD: string;
		BEFORE_UPLOAD: string;
		UPLOAD_START: string;
		UPLOAD_ERROR: string;
		UPLOAD_PROGRESS: string;
		UPLOAD_COMPLETE: string;
		UPLOAD_CONTROLLER_INIT: string;
		LOAD_START: string;
		LOAD_PROGRESS: string;
		LOAD_COMPLETE: string;
		LOAD_ERROR: string;
		LOAD_CONTROLLER_INIT: string;
		REMOVE_ERROR: string;
		REMOVE_COMPLETE: string;
		REMOVE_CONTROLLER_INIT: string;
		STATE_CHANGE: string;
		STATUS_CHANGE: string;
		VALIDATE_FILE_ASYNC: string;
		PREPARE_FILE_ASYNC: string;
	};

	class ParallelUploadController extends AbstractUploadController {
		constructor(server: Server, options?: {
			[key: string]: any;
		});
		upload(file: UploaderFile): void;
		abort(): void;
	}

	class PresignedUploadController extends AbstractUploadController {
		constructor(server: Server, options?: {
			[key: string]: any;
		});
		upload(file: UploaderFile): void;
		abort(): void;
	}

	const formatFileSize: (size: number, base?: number) => string;

	const getFileExtension: (filename: string) => string;

	const getFilenameWithoutExtension: (name: string) => string;

	const getExtensionFromType: (type: string) => string;

	const getJpegOrientation: (file: Blob) => Promise<number>;

	const getArrayBuffer: (file: File | Blob) => Promise<ArrayBuffer>;

	const isDataUri: (str: string) => boolean;

	const isImage: (blob: Blob) => boolean;

	const isResizableImage: (file: File | string, mimeType?: string | null) => boolean;

	const isSupportedVideo: (file: File | string, mimeType?: string | null) => boolean;

	const isJpeg: (blob: Blob) => boolean;

	const getImageSize: (file: File) => Promise<ImageSize>;

	const getResizedImageSize: (imageData: ImageData, options: ResizeImageOptions) => ResizedImageSizeResult;

	const resizeImage: (source: Blob | File, options: ResizeImageOptions) => Promise<ResizeImageResult>;

	const loadImage: (file: File | Blob) => Promise<unknown>;

	const isValidFileType: (file: File, fileTypes: string[]) => boolean;

	const canAppendFileToForm: () => boolean;

	const assignFileToInput: (input: HTMLInputElement, file: File | File[]) => boolean;

	const createFileFromBlob: (blob: Blob, fileName: string) => File;

	const createBlobFromDataUri: (dataURI: string) => Blob;

	const createVideoPreview: (blob: Blob, options?: ResizeImageOptions, seekTime?: number) => Promise<VideoPreviewResult>;

	const createUniqueId: () => string;

	const createWorker: (fn: Function) => {
		post: (message: any, callback: (message: any) => void, transfer?: Transferable[]) => void;
		terminate: () => void;
	};

	const getFilesFromDataTransfer: (dataTransfer: DataTransfer, browseFolders?: boolean) => Promise<File[]>;

	const hasDataTransferOnlyFiles: (dataTransfer: DataTransfer, browseFolders?: boolean) => Promise<boolean>;

	const isFilePasted: (dataTransfer: DataTransfer, browseFolders?: boolean) => boolean;
}
