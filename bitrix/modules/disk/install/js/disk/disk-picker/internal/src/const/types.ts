export type StageTypeValue = 'recent' | 'folder' | 'sources';

export type ObjectTypeFilterValue = 'all' | 'files' | 'folders';

export type FileTypeFilterValue =
	| 'document'
	| 'spreadsheet'
	| 'presentation'
	| 'board'
	| 'image'
	| 'audio'
	| 'video'
	| 'other';

export type StorageTypeValue = 'user' | 'common' | 'group' | 'project' | 'collab';

export type OrderFieldValue = 'name' | 'createTime' | 'updateTime';

export type OrderDirectionValue = 'asc' | 'desc';

export type ViewModeValue = 'list' | 'table';

export type SelectionModeValue = 'single' | 'multiple';

export type ErrorCodeValue =
	| 'invalid_context'
	| 'invalid_filter'
	| 'invalid_order'
	| 'invalid_query'
	| 'not_found'
	| 'total_unavailable'
	| 'too_many_items'
	| 'not_selectable';

// Empty-feed marker computed by the backend: `empty` for an empty result, null
// for a non-empty one. The frontend never re-derives it from the items array.
export type EmptyReasonValue = 'empty' | null;

export type NormalizedFilterValues = {
	find: string,
	objectTypeFilter: ObjectTypeFilterValue,
	fileTypeFilters: FileTypeFilterValue[],
};
