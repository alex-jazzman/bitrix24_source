import { DiskPicker } from 'disk.disk-picker';
import {Event, Loc, Runtime, Tag, Text, Type} from 'main.core';
import {Popup} from 'main.popup';
import {EventEmitter} from 'main.core.events';

import '../css/disk.manager.css';

type Params = {
	targetElement: HTMLElement
}

export class DiskManager extends EventEmitter
{
	constructor(params: Params)
	{
		super(params);

		this.setEventNamespace('BX.Tasks.Scrum.DiskManager');

		this.targetElement = params.targetElement;

		this.diskUrls = {
			urlSelect: '/bitrix/tools/disk/uf.php?action=selectFile&SITE_ID=' + Loc.getMessage('SITE_ID'),
			urlRenameFile: '/bitrix/tools/disk/uf.php?action=renameFile',
			urlDeleteFile: '/bitrix/tools/disk/uf.php?action=deleteFile',
			urlUpload: '/bitrix/tools/disk/uf.php?action=uploadFile&ncc=1'
		};

		this.onFinishDebounce = Runtime.debounce(
			(attachedIds) => {
				this.attachedIds = [];

				this.emit('onFinish', attachedIds);
			},
			500
		);

		this.attachedIds = [];
		this.diskPickerContainer = null;
		this.diskPicker = null;

	}

	showAttachmentMenu(node)
	{
		const controlId = Text.getRandom();

		this.popup = new Popup(
			`disk-manager-attachment-menu-${Text.getRandom()}`,
			node,
			{
				content: this.getAttachmentsLoaderContent(controlId),
				autoHide: false,
				closeByEsc: true,
				angle: false,
				offsetTop: 12,
				offsetLeft: -32
			}
		);

		this.popup.subscribe('onShow', () => {
			const uploadMenu = BX.Disk.UF.add({
				UID: controlId,
				controlName: `[${controlId}][]`,
				hideSelectDialog: false,
				urlSelect: this.diskUrls.urlSelect,
				urlRenameFile: this.diskUrls.urlRenameFile,
				urlDeleteFile: this.diskUrls.urlDeleteFile,
				urlUpload: this.diskUrls.urlUpload,
			});

			const filesChooser = this.popup.contentContainer.querySelector('#files_chooser');

			/* eslint-disable */
			BX.onCustomEvent(filesChooser, 'DiskLoadFormController', ['show']);
			/* eslint-enable */

			if (DiskPicker.isEnabled())
			{
				const diskSelector = filesChooser.querySelector('.diskuf-selector-link');
				if (diskSelector && uploadMenu)
				{
					this.bindDiskPicker(diskSelector, uploadMenu.getUploader());
				}
			}
			else if (BX.DiskFileDialog)
			{
				EventEmitter.subscribe(BX.DiskFileDialog, 'loadItemsDone', this.openDiskFileDialog.bind(this));
			}
		});

		EventEmitter.subscribe('onFinish', () => this.popup.close());

		this.popup.show();
	}

	closeAttachmentMenu()
	{
		if (this.popup)
		{
			this.popup.close();
		}
	}

	isClickInside(event: MouseEvent): boolean
	{
		if (this.diskPicker && this.diskPicker.containsEvent(event))
		{
			return true;
		}

		const node = event.target;
		if (!Type.isDomNode(node))
		{
			return false;
		}

		let isClickInside = false;

		if (this.targetElement.contains(node))
		{
			isClickInside = true;
		}

		if (this.popup && this.popup.getPopupContainer().contains(node))
		{
			isClickInside = true;
		}

		if (this.diskPickerContainer && this.diskPickerContainer.contains(node))
		{
			isClickInside = true;
		}

		if (
			BX.DiskFileDialog
			&& BX.DiskFileDialog.popupWindow !== null
			&& BX.DiskFileDialog.popupWindow.getPopupContainer().contains(node)
		)
		{
			isClickInside = true;
		}

		return isClickInside;
	}

	openDiskFileDialog()
	{
		if (BX.DiskFileDialog.popupWindow !== null)
		{
			BX.DiskFileDialog.popupWindow.subscribe('onClose', () => this.popup.close());
		}
	}

	bindDiskPicker(diskSelector, uploader)
	{
		Event.bind(diskSelector, 'click', (event) => {
			event.stopPropagation();
			this.openDiskPicker(uploader);
		});
	}

	openDiskPicker(uploader)
	{
		const picker = this.createDiskPicker();
		this.diskPicker = picker;
		picker.open({
			selectionMode: 'multiple',
			onOpen: ({ container }) => {
				this.diskPickerContainer = container;
			},
			onSelect: ({ items }) => {
				items.forEach(({ objectId, name }) => {
					uploader.addFile(`n${objectId}`, { name, preload: true });
				});
			},
			onClose: () => {
				this.diskPicker = null;
				this.diskPickerContainer = null;
				this.popup.close();
			},
		});
	}

	createDiskPicker()
	{
		return new DiskPicker();
	}

	getAttachmentsLoaderContent(controlId): HTMLElement
	{
		const filesChooser = Tag.render`
			<div id="files_chooser">
			<div id="diskuf-selectdialog-${controlId}" class="diskuf-files-entity diskuf-selectdialog bx-disk">
				<div class="diskuf-files-block">
					<div class="diskuf-placeholder">
						<table class="files-list">
							<tbody class="diskuf-placeholder-tbody"></tbody>
						</table>
					</div>
				</div>
				<div class="diskuf-extended" style="display: block">
					<input type="hidden" name="[${controlId}][]" value=""/>
					<div class="diskuf-extended-item">
						<label for="file_loader_${controlId}">
							${Loc.getMessage('TASKS_SCRUM_FILES_LOADER_POPUP_FROM_COMPUTER')}
						</label>
						<input
							class="diskuf-fileUploader"
							id="file_loader_${controlId}"
							type="file"
							multiple="multiple"
							size="1"
							style="display: none"
						>
					</div>
					<div class="diskuf-extended-item">
						<button type="button" class="diskuf-selector-link" data-testid="tasks-scrum-disk-picker-open-btn">
							${Loc.getMessage('TASKS_SCRUM_FILES_LOADER_POPUP_FROM_B24')}
						</button>
					</div>
					<div class="diskuf-extended-item">
						<span class="diskuf-selector-link-cloud" data-bx-doc-handler="gdrive">
							<span>${Loc.getMessage('TASKS_SCRUM_FILES_LOADER_POPUP_FROM_CLOUD')}</span>
						</span>
					</div>
				</div>
			</div>
			</div>
		`;

		/* eslint-disable */
		BX.addCustomEvent(filesChooser, 'OnFileUploadSuccess', this.onFileUploadSuccess.bind(this));
		/* eslint-enable */

		return filesChooser;
	}

	onFileUploadSuccess(fileResult, uf, file, uploaderFile)
	{
		if (Type.isUndefined(file) || Type.isUndefined(uploaderFile))
		{
			return;
		}

		this.attachedIds.push(fileResult.element_id.toString());

		this.onFinishDebounce(this.attachedIds);
	}
}
