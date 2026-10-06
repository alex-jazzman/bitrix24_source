import { type StorageTypeValue } from '../../const/types';

// DTO-06: a disk source used to open a storage root. `folderId` is the root
// folder id and is NOT derived from `storageId` - they are distinct ids.
export type PickerSource = {
	storageId: number,
	folderId: number,
	title: string,
	storageType: StorageTypeValue,
	entityId: number | string | null,
	avatarUrl: string | null,
};
