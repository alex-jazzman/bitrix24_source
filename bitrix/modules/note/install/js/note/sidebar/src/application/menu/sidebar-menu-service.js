import { Type } from 'main.core';
import { MenuManager } from 'main.popup';
import type { Collection, SidebarDocument } from '../../type';

export class SidebarMenuService
{
	#uiState;
	#collectionMenu = null;
	#docMenu = null;

	constructor(uiState: Object)
	{
		this.#uiState = uiState;
	}

	destroy(): void
	{
		this.destroyCollectionMenu();
		this.destroyDocMenu();
	}

	openCollectionMenu(collection: Collection | null, event: Event, options: Object): void
	{
		if (!collection || !event?.currentTarget)
		{
			return;
		}

		const collectionId = Number(collection.id);
		if (this.#uiState.collectionMenuId === collectionId)
		{
			this.destroyCollectionMenu();

			return;
		}

		this.destroyDocMenu();
		this.destroyCollectionMenu();
		this.#uiState.collectionMenuId = collectionId;

		const menuItems = [
			...(Type.isFunction(options.onRename) ? [
				{
					text: options.messages.rename,
					onclick: () => {
						this.destroyCollectionMenu();
						void options.onRename(collection);
					},
				},
			] : []),
		];

		if (Type.isFunction(options.onPermissions))
		{
			menuItems.push({
				text: options.messages.collectionPermissions,
				onclick: () => {
					this.destroyCollectionMenu();
					void options.onPermissions(collection);
				},
			});
		}

		if (Type.isFunction(options.onDelete))
		{
			menuItems.push({
				text: options.messages.delete,
				onclick: () => {
					this.destroyCollectionMenu();
					void options.onDelete(collection);
				},
			});
		}

		if (menuItems.length === 0)
		{
			this.#uiState.collectionMenuId = null;

			return;
		}

		const menuId = `note-sidebar-collection-menu-${collectionId}`;
		this.#collectionMenu = MenuManager.create(
			menuId,
			event.currentTarget,
			menuItems,
			{
				autoHide: true,
				closeByEsc: true,
				cacheable: false,
				offsetTop: 4,
				events: {
					onPopupClose: () => {
						if (this.#uiState)
						{
							this.#uiState.collectionMenuId = null;
						}
						this.#collectionMenu = null;
					},
				},
			},
		);

		this.#collectionMenu?.show();
	}

	openDocMenu(doc: SidebarDocument | null, event: Event, options: Object): void
	{
		if (!doc || !event?.currentTarget)
		{
			return;
		}

		const docId = Number(doc.id);
		if (this.#uiState.docMenuId === docId)
		{
			this.destroyDocMenu();

			return;
		}

		this.destroyCollectionMenu();
		this.destroyDocMenu();
		this.#uiState.docMenuId = docId;

		const menuItems = [
			...(Type.isFunction(options.onRename) ? [
				{
					text: options.messages.rename,
					onclick: () => {
						this.destroyDocMenu();
						void options.onRename(doc);
					},
				},
			] : []),
			...(Type.isFunction(options.onDelete) ? [
				{
					text: options.messages.delete,
					onclick: () => {
						this.destroyDocMenu();
						void options.onDelete(doc);
					},
				},
			] : []),
		];
		if (menuItems.length === 0)
		{
			this.#uiState.docMenuId = null;

			return;
		}

		const menuId = `note-sidebar-doc-menu-${docId}`;
		this.#docMenu = MenuManager.create(
			menuId,
			event.currentTarget,
			menuItems,
			{
				autoHide: true,
				closeByEsc: true,
				cacheable: false,
				offsetTop: 4,
				events: {
					onPopupClose: () => {
						if (this.#uiState)
						{
							this.#uiState.docMenuId = null;
						}
						this.#docMenu = null;
					},
				},
			},
		);

		this.#docMenu?.show();
	}

	destroyCollectionMenu(): void
	{
		if (this.#uiState)
		{
			this.#uiState.collectionMenuId = null;
		}

		if (this.#collectionMenu)
		{
			this.#collectionMenu.destroy();
			this.#collectionMenu = null;
		}
	}

	destroyDocMenu(): void
	{
		if (this.#uiState)
		{
			this.#uiState.docMenuId = null;
		}

		if (this.#docMenu)
		{
			this.#docMenu.destroy();
			this.#docMenu = null;
		}
	}
}
