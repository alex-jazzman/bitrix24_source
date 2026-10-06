export const StageType = Object.freeze({
	Recent: 'recent',
	Folder: 'folder',
	Sources: 'sources',
});

export const ObjectTypeFilter = Object.freeze({
	All: 'all',
	Files: 'files',
	Folders: 'folders',
});

export const FileTypeFilter = Object.freeze({
	Document: 'document',
	Spreadsheet: 'spreadsheet',
	Presentation: 'presentation',
	Board: 'board',
	Image: 'image',
	Audio: 'audio',
	Video: 'video',
	Other: 'other',
});

export const StorageType = Object.freeze({
	User: 'user',
	Common: 'common',
	Group: 'group',
	Project: 'project',
	Collab: 'collab',
});

export const OrderField = Object.freeze({
	Name: 'name',
	CreateTime: 'createTime',
	UpdateTime: 'updateTime',
});

export const OrderDirection = Object.freeze({
	Asc: 'asc',
	Desc: 'desc',
});

export const DEFAULT_ORDER = Object.freeze({
	field: OrderField.Name,
	direction: OrderDirection.Asc,
});

export const EmptyReason = Object.freeze({
	Empty: 'empty',
});

export const FilePickerAction = Object.freeze({
	GetInitialStage: 'disk.api.FilePicker.getInitialStage',
	ListChildren: 'disk.api.FilePicker.listChildren',
	Search: 'disk.api.FilePicker.search',
	ResolveSelection: 'disk.api.FilePicker.resolveSelection',
});

// Server-side page-size envelope (Provider::DEFAULT_PAGE_SIZE / MAX_PAGE_SIZE).
// `recent` is a bounded start selection of up to a hundred files without paging.
export const PageSize = Object.freeze({
	Default: 50,
	Max: 100,
	Recent: 100,
});

// Server accepts search queries of 3..255 Unicode code points after trim.
export const SearchQueryLength = Object.freeze({
	Min: 3,
	Max: 255,
});

export const ViewMode = Object.freeze({
	List: 'list',
	Table: 'table',
});

// Debounce for the standard filter search input, so a fast typist fires a single
// request; the actuality token still guards against races the debounce cannot.
export const SEARCH_DEBOUNCE_MS = 300;

export const SelectionMode = Object.freeze({
	Single: 'single',
	Multiple: 'multiple',
});

export const ErrorCode = Object.freeze({
	InvalidContext: 'invalid_context',
	InvalidFilter: 'invalid_filter',
	InvalidOrder: 'invalid_order',
	InvalidQuery: 'invalid_query',
	NotFound: 'not_found',
	TotalUnavailable: 'total_unavailable',
	TooManyItems: 'too_many_items',
	NotSelectable: 'not_selectable',
});

export const STAGE_TYPES: readonly string[] = Object.freeze(Object.values(StageType));
export const OBJECT_TYPE_FILTERS: readonly string[] = Object.freeze(Object.values(ObjectTypeFilter));
export const FILE_TYPE_ALIASES: readonly string[] = Object.freeze(Object.values(FileTypeFilter));
export const STORAGE_TYPES: readonly string[] = Object.freeze(Object.values(StorageType));
