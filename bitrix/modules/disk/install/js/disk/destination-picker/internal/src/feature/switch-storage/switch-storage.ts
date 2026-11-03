import { useFolderTreeStore } from '../../model/folder-tree/folder-tree';
import { useSessionStore } from '../../model/session/session';
import { type DestinationStorage, useStorageStore } from '../../model/storage/storage';

/**
 * Re-roots the destination tree on the picked storage.
 *
 * Everything the previous storage stood behind goes with it: the cached levels, the
 * path the breadcrumbs are built from and the chosen target with its verdict (LBS
 * item 2). Picking the storage that is already picked keeps the tree as it is, so a
 * second click does not collapse what the person has opened.
 */
export function switchStorage(target: DestinationStorage): void
{
	const storage = useStorageStore();
	if (storage.selectedStorageId === target.id)
	{
		return;
	}

	storage.selectStorage(target.id);
	useFolderTreeStore().setRoot({ folderId: target.rootFolderId, name: target.name });
	useSessionStore().clearTarget();
}
