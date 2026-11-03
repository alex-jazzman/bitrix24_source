// runtime values live in src/config.js; the union names them for the type layer only
type DiskUploadStatus = 'progress' | 'done' | 'error' | 'canceled';

// the runtime map from src/config.js: the union on its members keeps them from widening to string
type DiskUploadStatusMap = Record<Uppercase<DiskUploadStatus>, DiskUploadStatus>;

// one file as the image picker hands it over
type DiskUploaderPickedFile = {
	name: string;
	// file extension, not a mime type: 'jpg', 'mp4', 'heic'
	type?: string;
	url?: string;
	previewUrl?: string;
	width?: number;
	height?: number;
};

// ready-made ajax parameters the server returns with a finished upload; the client only forwards them
type DiskUploadAjaxConfig = Record<string, unknown>;

// a picked file prepared for the uploader client; the view then updates it in place as the upload runs
type DiskUploadTask = DiskUploaderPickedFile & {
	taskId: string;
	folderId: number;
	chunk: number;
	params: {
		disableAutoCommit: boolean;
	};
	// doubling the side for heic: the converted jpeg loses detail otherwise
	resize?: {
		width?: number;
		height?: number;
		quality: number;
	};
	status?: DiskUploadStatus;
	byteSent?: number;
	byteTotal?: number;
	commitConfig?: DiskUploadAjaxConfig;
	rollbackConfig?: DiskUploadAjaxConfig;
};

// how far one upload has got
type DiskUploadProgress = {
	byteSent?: number;
	byteTotal?: number;
};

// what the row and the progress bar keep about an upload in flight
type DiskUploadProgressState = DiskUploadProgress & {
	status?: DiskUploadStatus;
};

// what the uploader client reports when a task is done
type DiskUploadDoneData = {
	result?: {
		commitConfig?: DiskUploadAjaxConfig;
		rollbackConfig?: DiskUploadAjaxConfig;
	};
};

// a disk file as the commit response returns it; consumers read its name, size and disk type,
// and the rest of the server payload travels along untouched
type DiskUploadedFile = {
	id?: number | string;
	name?: string;
	size?: number;
	typeFile?: number;
	[field: string]: unknown;
};

// answer of a single commit request
type DiskUploadCommitResult = {
	status?: string;
	data?: {
		file?: DiskUploadedFile;
	};
};

// extra multipart headers and body that carry the video poster along with the commit request
type DiskUploadVideoPreviewPart = {
	headers?: Record<string, string>;
	data?: string;
};
