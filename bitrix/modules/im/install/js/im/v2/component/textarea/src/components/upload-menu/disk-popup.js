import 'file_dialog';
import { DiskPicker, type PickerResultItem } from 'disk.disk-picker';
import { ajax } from 'main.core';

const FILE_DIALOG_ID = 'im-file-dialog';

type LegacyDiskFile = {
	id: string,
	name: string,
	ext: string,
	sizeInt: number,
};

function mapPickerFiles(items: PickerResultItem[]): { [string]: LegacyDiskFile }
{
	return items.reduce((files, item) => {
		const id = `n${item.objectId}`;
		files[id] = {
			id,
			name: item.name,
			ext: item.extension ?? '',
			sizeInt: item.size,
		};

		return files;
	}, {});
}

/* eslint-disable @bitrix24/bitrix24-rules/no-bx */
// @vue/component
export const DiskPopup = {
	name: 'DiskPopup',
	emits: ['close', 'diskFileSelect'],
	created()
	{
		if (DiskPicker.isEnabled())
		{
			const picker = new DiskPicker();
			let isClosed = false;
			const closeOnce = () => {
				if (isClosed)
				{
					return;
				}

				isClosed = true;
				this.$emit('close');
			};
			picker.open({
				selectionMode: 'multiple',
				onSelect: ({ items }) => {
					if (items.length === 0)
					{
						return;
					}

					this.$emit('diskFileSelect', { files: mapPickerFiles(items) });
				},
				onClose: closeOnce,
				onError: closeOnce,
			});

			return;
		}

		if (!BX.DiskFileDialog)
		{
			console.error('Couldn\'t initialize disk popup');

			return;
		}

		this.subscribeEvents();
		this.open();
	},
	beforeUnmount()
	{
		this.unsubscribeEvents();
	},
	methods:
	{
		subscribeEvents()
		{
			BX.addCustomEvent(BX.DiskFileDialog, 'inited', this.onInited);
			BX.addCustomEvent(BX.DiskFileDialog, 'loadItems', this.onLoadItems);
		},
		unsubscribeEvents()
		{
			BX.removeCustomEvent(BX.DiskFileDialog, 'inited', this.onInited);
			BX.removeCustomEvent(BX.DiskFileDialog, 'loadItems', this.onLoadItems);
		},
		onInited(name: string)
		{
			if (name !== FILE_DIALOG_ID)
			{
				return;
			}

			BX.DiskFileDialog.obCallback[name] = {
				saveButton: (tab, path, selected) => {
					this.$emit('diskFileSelect', { files: selected });
				},
				popupDestroy: () => {
					this.unsubscribeEvents();
					this.$emit('close');
				},
			};

			BX.DiskFileDialog.openDialog(name);
		},
		onLoadItems(link: string, name: string)
		{
			if (name !== FILE_DIALOG_ID)
			{
				return;
			}

			BX.DiskFileDialog.target[name] = link.replace(
				'/bitrix/tools/disk/uf.php',
				'/bitrix/components/bitrix/im.messenger/file.ajax.php',
			);
		},
		open()
		{
			ajax({
				url: `/bitrix/components/bitrix/im.messenger/file.ajax.php?action=selectFile&dialogName=${FILE_DIALOG_ID}`,
				method: 'GET',
				skipAuthCheck: true,
				timeout: 30,
			});
		},
	},
	template: '<template></template>',
};
