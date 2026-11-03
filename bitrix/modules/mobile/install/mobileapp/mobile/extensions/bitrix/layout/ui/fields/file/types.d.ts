// one file of the field value: what the uploader and the server put together about it
type FileFieldItem = {
	id?: number | string;
	url?: string;
	previewUrl?: string;
	type?: string;
	name?: string;
	token?: string;
	readOnly?: boolean;
	isUploading?: boolean;
	isShimmed?: boolean;
	hasError?: boolean;
	// the field instance that started the upload: a field ignores upload events of a foreign uuid
	uuid?: string;
	// taken from disk as is, so it needs no upload task
	isDiskFile?: boolean;
	objectId?: number | string;
	// the upload error toast is shown once per file
	errorShown?: boolean;
	// raw payload of the disk picker; VALUE carries the disk object id
	dataAttributes?: { VALUE?: number | string };
};

// a file marked by markFilesAsUploading: it owns an id up front, and that id becomes the task id
type FileFieldUploadingItem = FileFieldItem & {
	id: string;
	uuid: string;
	isUploading: true;
};

// one task for the uploader client; params is the very file object that sits in the field value,
// so the upload events find it there by id
type FileFieldUploadTask = {
	taskId: string;
	controller?: string;
	controllerOptions?: Record<string, unknown>;
	params: FileFieldUploadingItem;
	name?: string;
	type?: string;
	mimeType?: string;
	url?: string;
	resize?: Record<string, unknown> | null;
	onDestroyEventName: string;
	// set by the background-attach field: the manager attaches the uploaded file to the entity itself
	attachToEntityController?: string;
};

// index and files come as a pair: the delete handler is told which of the files it is closing.
// The name carries the field: ui-system/blocks/file/preview declares its own FilePreviewProps
type FileFieldPreviewProps = {
	file: FileFieldItem;
	index?: number;
	files?: Array<FileFieldItem>;
	onDeleteFile?: ((index: number) => void) | false;
	showName?: boolean;
	textLines?: number;
	// gap to the next tile in the row
	leftIndent?: number;
	onFilePreviewMenuClick?: ((options: FileRenderOptions) => void) | null;
};
