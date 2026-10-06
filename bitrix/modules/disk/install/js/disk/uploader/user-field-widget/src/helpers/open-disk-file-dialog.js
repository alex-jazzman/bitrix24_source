import { Text, Type } from 'main.core';
import { DiskPicker } from 'disk.disk-picker';
import { formatFileSize, Uploader } from 'ui.uploader.core';

import { loadDiskFileDialog } from './load-disk-file-dialog';

const loadingDialogs: Set<string> = new Set();

const adaptPickerResultItemToLegacy = (item: Object): Object => {
	const id = `n${item.objectId}`;
	const adaptedItem = {
		id,
		type: 'file',
		name: item.name,
		size: formatFileSize(item.size),
		sizeInt: item.size,
		ext: item.extension ?? '',
		storage: item.parentFolderName,
	};

	if (Type.isStringFilled(item.previewUrl))
	{
		adaptedItem.previewUrl = item.previewUrl;
	}

	if (item.editorFileType !== null)
	{
		adaptedItem.fileType = item.editorFileType;
	}

	return adaptedItem;
};

const resolveOnOpen = (options: Object): ?Function => {
	if (Type.isFunction(options.onOpen))
	{
		return options.onOpen;
	}

	return Type.isFunction(options.onLoad) ? options.onLoad : null;
};

export const openDiskFileDialog = (options): void => {
	const dialogOptions = Type.isPlainObject(options) ? options : {};
	const dialogId: string = Type.isStringFilled(dialogOptions.dialogId)
		? dialogOptions.dialogId
		: `file-dialog-${Text.getRandom(5)}`
	;

	if (DiskPicker.isEnabled())
	{
		openUniversalDiskPicker(dialogId, dialogOptions);

		return;
	}

	openLegacyDiskFileDialog(dialogId, dialogOptions);
};

const openUniversalDiskPicker = (dialogId: string, options: Object): void => {
	const onOpen: ?Function = resolveOnOpen(options);
	const onSelect: ?Function = Type.isFunction(options.onSelect) ? options.onSelect : null;
	const onClose: ?Function = Type.isFunction(options.onClose) ? options.onClose : null;
	const onError: ?Function = Type.isFunction(options.onError) ? options.onError : null;
	const uploader: ?Uploader = options.uploader instanceof Uploader ? options.uploader : null;

	if (loadingDialogs.has(dialogId))
	{
		return;
	}

	loadingDialogs.add(dialogId);

	const picker = new DiskPicker();
	picker.open({
		selectionMode: 'multiple',
		onOpen: (): void => {
			if (onOpen !== null)
			{
				onOpen();
			}
		},
		onSelect: (result): void => {
			const selectedItems = {};
			result.items.forEach((item): void => {
				const adaptedItem = adaptPickerResultItemToLegacy(item);
				selectedItems[adaptedItem.id] = adaptedItem;

				if (uploader !== null)
				{
					uploader.addFile(adaptedItem.id, { name: adaptedItem.name, preload: true });
				}
			});

			if (onSelect !== null)
			{
				onSelect(null, null, selectedItems);
			}
		},
		onClose: (): void => {
			loadingDialogs.delete(dialogId);
			if (onClose !== null)
			{
				onClose();
			}
		},
		onError: (error): void => {
			loadingDialogs.delete(dialogId);
			if (onError !== null)
			{
				onError(error);
			}
		},
	});
};

const openLegacyDiskFileDialog = (dialogId: string, options: Object): void => {
	const onOpen: ?Function = resolveOnOpen(options);
	const onSelect: ?Function = Type.isFunction(options.onSelect) ? options.onSelect : null;
	const onClose: ?Function = Type.isFunction(options.onClose) ? options.onClose : null;
	const uploader: ?Uploader = options.uploader instanceof Uploader ? options.uploader : null;

	if (loadingDialogs.has(dialogId))
	{
		return;
	}

	loadingDialogs.add(dialogId);

	loadDiskFileDialog(dialogId).then((): void => {
		loadingDialogs.delete(dialogId);
		if (onOpen !== null)
		{
			onOpen();
		}

		BX.DiskFileDialog.obCallback[dialogId] = {
			saveButton: (tab, path, selectedItems): void => {
				Object.values(selectedItems).forEach(item => {
					if (uploader !== null)
					{
						uploader.addFile(item.id, { name: item.name, preload: true });
					}
				});

				if (onSelect !== null)
				{
					onSelect(tab, path, selectedItems);
				}
			},
			popupDestroy: (): void => {
				loadingDialogs.delete(dialogId);
				if (onClose !== null)
				{
					onClose();
				}
			},
		};

		if (BX.DiskFileDialog.popupWindow === null)
		{
			BX.DiskFileDialog.openDialog(dialogId);
		}
	});
};
