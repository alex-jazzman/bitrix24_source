import { Dom, Event, Loc, Tag, Text } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Loader } from 'main.loader';

export type FolderData = {
	id: number;
	title: string;
};

export type FolderPage = {
	folders: FolderData[];
	total: number;
	nextOffset: number;
};

export type LoadFolders = (limit: number, offset: number) => Promise<FolderPage | FolderData[]>;

export type FolderSelectionPopupOptions = {
	loadFolders?: LoadFolders;
	rootItemTitle?: string;
};

const LOAD_LIMIT = 50;

export class FolderSelectionPopup extends EventEmitter
{
	#loadFolders: LoadFolders;
	#rootItemTitle: string;
	#offset = 0;
	#total = 0;
	#hasMore = true;
	#loading = false;

	constructor(options: FolderSelectionPopupOptions = {})
	{
		super();
		this.setEventNamespace('BX.Sign.V2.Grid.Components.Folder.FolderSelectionPopup');
		this.#loadFolders = options.loadFolders ?? (() => Promise.resolve([]));
		this.#rootItemTitle = options.rootItemTitle
			?? Loc.getMessage('SIGN_V2_GRID_COMPONENTS_FOLDER_SELECTION_ROOT_ITEM')
			?? '';
	}

	show(): HTMLDivElement
	{
		this.#offset = 0;
		this.#total = 0;
		this.#hasMore = true;
		this.#loading = false;

		const folderList = this.#createFolderListContainer();
		const rootFolderData = {
			title: this.#rootItemTitle,
			id: 0,
		};
		const rootFolder = this.#createFolderItem(rootFolderData);
		Dom.addClass(rootFolder, 'sign-folder-selection__item--selected');
		Dom.append(rootFolder, folderList);
		this.#emitFolderSelected(rootFolderData);

		const subFolderContainer = this.#createSubFolderContainer();
		Dom.append(subFolderContainer, folderList);
		Event.bind(folderList, 'scroll', () => {
			const remainingHeight = folderList.scrollHeight - folderList.scrollTop - folderList.clientHeight;
			if (remainingHeight <= 64)
			{
				void this.#loadFolderItems(folderList, subFolderContainer);
			}
		});
		void this.#loadFolderItems(folderList, subFolderContainer);

		return folderList;
	}

	#createFolderListContainer(): HTMLDivElement
	{
		return Tag.render<HTMLDivElement>`
			<div
				class="sign-folder-selection"
				data-test-id="sign-folder-selection"
				aria-busy="true"
			></div>
		`;
	}

	#createSubFolderContainer(): HTMLDivElement
	{
		return Tag.render<HTMLDivElement>`<div class="sign-folder-selection__children"></div>`;
	}

	#createLoaderContainer(): HTMLDivElement
	{
		return Tag.render<HTMLDivElement>`
			<div
				class="sign-folder-selection__loader"
				data-test-id="sign-folder-selection-loader"
			></div>
		`;
	}

	async #loadFolderItems(
		folderList: HTMLDivElement,
		subFolderContainer: HTMLDivElement,
	): Promise<void>
	{
		if (this.#loading || !this.#hasMore)
		{
			return;
		}

		this.#loading = true;
		const loaderContainer = this.#createLoaderContainer();
		Dom.append(loaderContainer, folderList);
		Dom.attr(folderList, 'aria-busy', 'true');
		const loader = new Loader({ target: loaderContainer, size: 48, mode: 'inline' });
		void loader.show();
		try
		{
			const response = await this.#loadFolders(LOAD_LIMIT, this.#offset);
			const page = Array.isArray(response)
				? { folders: response, total: response.length, nextOffset: response.length }
				: response
			;
			const folders = Array.isArray(page?.folders) ? page.folders : [];
			const fragment = document.createDocumentFragment();
			folders.forEach((folder: FolderData) => {
				fragment.append(this.#createFolderItem(folder));
			});
			subFolderContainer.append(fragment);

			const previousOffset = this.#offset;
			this.#total = Number.isInteger(page?.total) ? page.total : folders.length;
			this.#offset = Number.isInteger(page?.nextOffset)
				? page.nextOffset
				: previousOffset + folders.length
			;
			this.#hasMore = this.#offset > previousOffset && this.#offset < this.#total;
		}
		catch
		{
			this.#hasMore = false;
			this.emit('loadError');
		}
		finally
		{
			loader.destroy();
			loaderContainer.remove();
			Dom.attr(folderList, 'aria-busy', 'false');
			this.#loading = false;
		}
	}

	#createFolderItem(folder: FolderData): HTMLDivElement
	{
		const listItem = Tag.render<HTMLDivElement>`
			<div class="sign-folder-selection__item" data-test-id="sign-folder-selection-item">
				<span class="sign-folder-selection__icon"></span>
				<span>${Text.encode(folder.title)}</span>
			</div>
		`;

		Event.bind(listItem, 'click', (event: MouseEvent) => {
			event.stopPropagation();
			this.#selectAndHighlightFolder(listItem, folder);
		});

		return listItem;
	}

	#selectAndHighlightFolder(selectedItem: HTMLDivElement, folder: FolderData): void
	{
		const folderList = selectedItem.closest('.sign-folder-selection');
		if (folderList === null)
		{
			return;
		}

		folderList.querySelectorAll('.sign-folder-selection__item').forEach((child: Element) => {
			Dom.removeClass(child, 'sign-folder-selection__item--selected');
		});

		Dom.addClass(selectedItem, 'sign-folder-selection__item--selected');
		this.#emitFolderSelected(folder);
	}

	#emitFolderSelected(folder: FolderData): void
	{
		this.emit('folderSelected', { folderId: folder.id });
	}
}
