import { StageType } from '../../const/picker';
import { type PickerSource } from '../../model/source/types';
import { changeFeed, type FeedDeps } from '../open-folder/open-folder';

// Selecting a source is a feed change to the storage root, opened by the pair
// (source.storageId, source.folderId) from DTO-06. The active storage is never
// substituted.
export function switchSource(source: PickerSource, deps: FeedDeps): Promise<void>
{
	return changeFeed(
		{ stageType: StageType.Folder, storageId: source.storageId, folderId: source.folderId },
		deps,
	);
}
