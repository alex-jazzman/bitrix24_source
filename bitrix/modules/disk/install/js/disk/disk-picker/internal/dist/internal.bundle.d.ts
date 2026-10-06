/* eslint-disable */
type PickerAppHandle = {
	unmount: () => void;
	start: (options: SessionStartOptions) => void;
	notifyClosing: () => void;
};

type SessionStartOptions = {
	constraints: PickerConstraints;
	restoredFilter: NormalizedFilterValues;
	filterId: string;
	callbacks: SessionCallbacks;
};

type PickerConstraints = {
	signedConfig: object | null;
	allowedFileTypes: string[];
	initialStage: {
		type: StageTypeValue;
		storageId: number | null;
		folderId: number | null;
	} | null;
	selectionMode: SelectionModeValue;
	maxItems: number | null;
};

type StageTypeValue = 'recent' | 'folder' | 'sources';

type SelectionModeValue = 'single' | 'multiple';

type NormalizedFilterValues = {
	find: string;
	objectTypeFilter: ObjectTypeFilterValue;
	fileTypeFilters: FileTypeFilterValue[];
};

type ObjectTypeFilterValue = 'all' | 'files' | 'folders';

type FileTypeFilterValue = 'document' | 'spreadsheet' | 'presentation' | 'board' | 'image' | 'audio' | 'video' | 'other';

type SessionCallbacks = {
	suppressFilterFind: () => void;
	resetFilters: () => void;
	onContextInvalid: () => void;
	notify: (messageCode: string, replacements?: {
		[key: string]: string;
	}) => void;
	emitSelection: (result: PickerSelectionResult) => void;
	requestCancel: () => void;
};

type PickerSelectionResult = {
	items: PickerSelectionItem[];
};

type PickerSelectionItem = {
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

type StandardFilter = {
	getFilterFieldsValues?: () => {
		[key: string]: any;
	};
	getApi?: () => FilterApi;
};

type FilterApi = {
	setFields?: (fields: {
		[key: string]: any;
	}) => void;
	apply?: () => void;
};

declare namespace BX.Disk.DiskPickerInternal {
	function mountPickerApp(container: HTMLElement, props?: {
		[key: string]: any;
	}): PickerAppHandle;

	function applyFindSuppressed(filter: StandardFilter, value: string): void;

	function normalizeFilterValues(raw: {
		[key: string]: any;
	}): NormalizedFilterValues;

	function readInitialFilterValues(filter: StandardFilter): NormalizedFilterValues;

	function resetInitialFilterValues(filter: StandardFilter): boolean;

	const FILE_TYPE_ALIASES: readonly string[];
}
