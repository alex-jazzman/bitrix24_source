export type SelectionMode = 'single' | 'multiple';

export type InitialStageParam = {
	type: 'recent' | 'folder' | 'sources',
	storageId?: number | null,
	folderId?: number | null,
};

export type PickerErrorCode =
	| 'invalid_params'
	| 'bootstrap_failed'
	| 'already_open'
	| 'context_invalid';

export type PickerError = {
	code: PickerErrorCode,
};

export type PickerResultItem = {
	objectId: number,
	name: string,
	size: number,
	extension: string | null,
	fileType: string,
	previewUrl: string | null,
	sourceTitle: string,
	parentFolderName: string,
	editorFileType: string | null,
};

export type PickerResult = {
	items: PickerResultItem[],
};

export type DiskPickerParams = {
	selectionMode?: SelectionMode,
	maxItems?: number | null,
	allowedFileTypes?: string[],
	initialStage?: InitialStageParam | null,
	signedConfig?: object | null,
	onOpen?: (payload: { container: HTMLElement }) => void,
	onSelect?: (result: PickerResult) => void,
	onCancel?: () => void,
	onClose?: () => void,
	onError?: (error: PickerError) => void,
};
