/* eslint-disable */
type DiskPickerParams = {
	selectionMode?: SelectionMode;
	maxItems?: number | null;
	allowedFileTypes?: string[];
	initialStage?: InitialStageParam | null;
	signedConfig?: object | null;
	onOpen?: (payload: {
		container: HTMLElement;
	}) => void;
	onSelect?: (result: PickerResult) => void;
	onCancel?: () => void;
	onClose?: () => void;
	onError?: (error: PickerError) => void;
};

type SelectionMode = 'single' | 'multiple';

type InitialStageParam = {
	type: 'recent' | 'folder' | 'sources';
	storageId?: number | null;
	folderId?: number | null;
};

type PickerResult = {
	items: PickerResultItem[];
};

type PickerResultItem = {
	objectId: number;
	name: string;
	size: number;
	extension: string | null;
	fileType: string;
	previewUrl: string | null;
	sourceTitle: string;
	parentFolderName: string;
	editorFileType: string | null;
};

type PickerError = {
	code: PickerErrorCode;
};

type PickerErrorCode = 'invalid_params' | 'bootstrap_failed' | 'already_open' | 'context_invalid';

declare namespace BX.Disk {
	class DiskPicker {
		static isEnabled(): boolean;
		open(params: DiskPickerParams): void;
		containsEvent(event: MouseEvent): boolean;
		close(): void;
	}
}
