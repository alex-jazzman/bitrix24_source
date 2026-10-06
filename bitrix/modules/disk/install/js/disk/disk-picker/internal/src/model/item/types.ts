import { type FileTypeFilterValue } from '../../const/types';

// DTO-05: the single client-side shape of an output item, shared by models and
// components. Produced by the service mapper from DTO-01; components never see
// the wire shape.
export type PickerItem = {
	objectId: number,
	isFolder: boolean,
	name: string,
	extension: string | null,
	size: number | null,
	updateTime: number | null,
	createTime: number | null,
	recentTime: number | null,
	selectable: boolean,
	fileType: FileTypeFilterValue | null,
	iconType: string,
	previewUrl: string | null,
	sourceTitle: string,
	sourceId: number,
};
