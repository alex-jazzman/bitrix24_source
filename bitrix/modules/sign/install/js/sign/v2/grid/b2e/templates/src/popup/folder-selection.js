import { Dom, Event, Loc, Tag, Text } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Api } from 'sign.v2.api';
import '../style.css';

type Folder = {
	id: number;
	title: string;
};

export class FolderSelectionPopup extends EventEmitter
{
	#api = new Api();

	async show(): HTMLDivElement
	{
		const firstLevelDeepFolders = await this.#api.templateFolder.getListByDepthLevel(0);

		const folderList = this.#createFolderListContainer();

		const rootFolderData = {
			title: Loc.getMessage('SIGN_TEMPLATE_GRID_MOVE_TO_FOLDER_POPUP_ROOT_LEVEL_ITEM'),
			id: 0,
		};
		const rootFolder = this.#createFolderItem(rootFolderData);
		Dom.addClass(rootFolder, 'selected-folder');
		Dom.append(rootFolder, folderList);

		this.emit('folderSelected', rootFolderData);

		const subFolderContainer = this.#createSubFolderContainer();
		Dom.append(subFolderContainer, folderList);

		firstLevelDeepFolders.forEach((folder) => {
			const listItem = this.#createFolderItem(folder);
			Dom.append(listItem, subFolderContainer);
		});

		return folderList;
	}

	#createFolderListContainer(): HTMLDivElement
	{
		return Tag.render`<div class="folder-list-container"></div>`;
	}

	#createSubFolderContainer(): HTMLDivElement
	{
		return Tag.render`<div class="sub-folder-container"></div>`;
	}

	#createFolderItem(folder: Folder): HTMLDivElement
	{
		const listItem = Tag.render`
			<div class="folder-item">
				<span class="folder-icon-folder-list-popup"></span>
				<span>${Text.encode(folder.title)}</span>
			</div>
		`;

		Event.bind(listItem, 'click', (event) => {
			event.stopPropagation();
			this.#selectAndHighlightFolder(listItem, folder);
		});

		return listItem;
	}

	#selectAndHighlightFolder(selectedItem: HTMLDivElement, folder: Folder): void
	{
		const folderListContainer = selectedItem.closest('.folder-list-container');
		if (folderListContainer)
		{
			folderListContainer.querySelectorAll('.folder-item').forEach((child) => {
				Dom.removeClass(child, 'selected-folder');
			});

			Dom.addClass(selectedItem, 'selected-folder');
			this.emit('folderSelected', folder);
		}
	}
}
