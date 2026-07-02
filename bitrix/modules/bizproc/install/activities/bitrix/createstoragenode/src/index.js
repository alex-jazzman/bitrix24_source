import { StorageFieldSelector } from './storage-field-selector';

export class CreateStorageNodeRenderer
{
	getControlRenderers(): Object
	{
		return {
			storageFieldSelector: StorageFieldSelector,
		};
	}
}
