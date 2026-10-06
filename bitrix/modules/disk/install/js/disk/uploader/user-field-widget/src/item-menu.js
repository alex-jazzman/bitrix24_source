import { Loc, Text, Type, Tag, Dom, Runtime, ajax as Ajax } from 'main.core';

import { UploaderFile, getFilenameWithoutExtension, getFileExtension } from 'ui.uploader.core';
import { loadDiskFileDialog } from './helpers/load-disk-file-dialog';

import type { TileWidgetItem } from 'ui.uploader.tile-widget';
import type { Menu, MenuItem } from 'main.popup';
import type { BaseEvent } from 'main.core.events';
import { Button, ButtonSize, ButtonColor } from 'ui.buttons';
import type UserFieldControl from './user-field-control';
import { Icon, Outline } from 'ui.icon-set.api.core';

// ui.viewer and ui.notification are loaded lazily on first click to avoid eager
// loading heavy extensions for every UF widget. See #loadViewer() / #loadNotification().

import './css/item-rename-form.css';
import './css/item-menu-icons.css';

export const ItemMenuView = Object.freeze({
	Tile: 'tile',
	List: 'list',
});

export const ItemMenuEntityType = Object.freeze({
	Task: 'task',
	Result: 'result',
	Description: 'description',
});

export default class ItemMenu
{
	#userFieldControl: UserFieldControl = null;
	#item: TileWidgetItem = null;
	#menu: Menu = null;
	#folderDialogId: string = null;
	#readonly: boolean = false;
	#insertIntoText: boolean = false;
	#removeFromServer: boolean = true;

	// Cached promises for lazy-loaded extensions (shared across all instances).
	static #viewerPromise: ?Promise = null;
	static #notificationPromise: ?Promise = null;

	constructor(userFieldControl: UserFieldControl, item: TileWidgetItem, menu: Menu, context: Object = {})
	{
		this.#userFieldControl = userFieldControl;
		this.#item = item;
		this.#menu = menu;
		this.#folderDialogId = `folder-dialog-${Text.getRandom(5)}`;
		this.#readonly = context.readonly === true;
		this.#insertIntoText = context.insertIntoText === true;
		this.#removeFromServer = context.removeFromServer !== false;
	}

	/**
	 * Builds the supplementary part of the menu for the tile view.
	 * Base items (filesize, insert-into-text, download, remove) are added by TileItem
	 * before the TileItem:onMenuCreate hook; here we add the disk-specific actions
	 * and keep them in the canonical UX order.
	 */
	build(): void
	{
		this.#menu.getPopupWindow().setMaxWidth(500);
		Dom.addClass(this.#menu.getPopupWindow().getPopupContainer(), 'disk-uf-file-menu');

		// "view" and "copyToMe" sit right after the filesize block, before the first
		// base action (insert-into-text / download / remove) already added by TileItem.
		const leadingAnchor: ?string = this.#firstExistingMenuItemId(['insert-into-text', 'download', 'remove']);
		// "edit" and "rename" sit before the destructive "remove" item, after download.
		const trailingAnchor: ?string = this.#firstExistingMenuItemId(['remove']);

		this.#addViewItem(leadingAnchor);
		this.#addCopyToMeItem(leadingAnchor);
		this.#addEditItem(trailingAnchor);
		this.#addRenameItem(trailingAnchor);

		// "download" and "remove" are base items added by TileItem (not by us in tile
		// view), so they lack the icon treatment. Decorate them here to keep the menu
		// identical to the list view.
		this.#addActionIcon(this.#menu.getMenuItem('download'), Outline.DOWNLOAD);
		this.#addActionIcon(this.#menu.getMenuItem('remove'), Outline.TRASHCAN, true);

		this.#addAllowEditItem();
		this.#addStorageFooter();
	}

	#firstExistingMenuItemId(ids: string[]): ?string
	{
		for (const id of ids)
		{
			if (this.#menu.getMenuItem(id))
			{
				return id;
			}
		}

		return null;
	}

	/**
	 * Builds the complete menu from scratch for the list view, where there is no
	 * TileItem to provide base items. The composition and order are identical to
	 * the tile view (single source of truth).
	 */
	buildAll(): void
	{
		this.#menu.getPopupWindow().setMaxWidth(500);
		Dom.addClass(this.#menu.getPopupWindow().getPopupContainer(), 'disk-uf-file-menu');

		this.#addFileSizeItem();
		this.#menu.addMenuItem({ delimiter: true });

		this.#addViewItem();
		this.#addCopyToMeItem();
		this.#addInsertIntoTextItem();
		this.#addDownloadItem();
		this.#addEditItem();
		this.#addRenameItem();
		this.#addRemoveItem();

		this.#addAllowEditItem();
		this.#addStorageFooter();
	}

	#addFileSizeItem(): void
	{
		this.#menu.addMenuItem({
			id: 'filesize',
			text: Loc.getMessage('DISK_UF_WIDGET_FILE_SIZE', { '#filesize#': Text.encode(this.#item.sizeFormatted) }),
			disabled: true,
		});
	}

	/**
	 * Turns a menu item into an action item with a right-aligned icon.
	 * Drops the auto-applied "menu-popup-no-icon" so the icon column shows, adds the
	 * marker class(es) and renders the icon into the item's icon slot. Shared by both
	 * the addMenuItem path (own items in list/tile) and the post-processing of base
	 * items provided by TileItem, so the menu is identical in tile and list views.
	 */
	#addActionIcon(menuItem: ?MenuItem, icon: Object, remove: boolean = false): void
	{
		if (!menuItem)
		{
			return;
		}

		const container: HTMLElement = menuItem.getContainer();
		Dom.removeClass(container, 'menu-popup-no-icon');
		Dom.addClass(container, 'disk-uf-file-menu-item');
		if (remove)
		{
			Dom.addClass(container, 'disk-uf-file-menu-item--remove');
		}

		const iconSlot: ?HTMLElement = container.querySelector('.menu-popup-item-icon');
		if (iconSlot)
		{
			new Icon({ icon, size: 24 }).renderTo(iconSlot);
			Dom.attr(iconSlot, 'aria-hidden', 'true');
		}
	}

	#addViewItem(beforeId: ?string = null): void
	{
		if (Type.isStringFilled(this.#item.customData.viewLink))
		{
			const menuItem: MenuItem = this.#menu.addMenuItem({
				id: 'view',
				className: 'disk-uf-file-menu-item',
				text: Loc.getMessage('DISK_UF_WIDGET_OPEN_FILE_MENU_TITLE'),
				href: this.#item.customData.viewLink,
				target: '_blank',
				onclick: (event, item: MenuItem): void => item.getMenuWindow().close(),
			}, beforeId);

			this.#addActionIcon(menuItem, Outline.OPEN_NEW);

			return;
		}

		const menuItem: MenuItem = this.#menu.addMenuItem({
			id: 'view',
			className: 'disk-uf-file-menu-item',
			text: Loc.getMessage('DISK_UF_WIDGET_OPEN_FILE_MENU_TITLE'),
			onclick: (event, item: MenuItem): void => {
				item.getMenuWindow().close();
				ItemMenu.#loadViewer().then((): void => {
					const node: HTMLElement = this.#createViewerNode();
					if (node !== null)
					{
						BX.UI.Viewer.Instance.openByNode(node);
					}
				});
			},
		}, beforeId);

		this.#addActionIcon(menuItem, Outline.OPEN_NEW);
	}

	#addCopyToMeItem(beforeId: ?string = null): void
	{
		const menuItem: MenuItem = this.#menu.addMenuItem({
			id: 'copyToMe',
			className: 'disk-uf-file-menu-item',
			text: Loc.getMessage('DISK_UF_WIDGET_ITEM_MENU_SAVE_TO_DISK'),
			onclick: (event, item: MenuItem): void => {
				item.getMenuWindow().close();
				this.#runCopyToMe();
			},
		}, beforeId);

		this.#addActionIcon(menuItem, Outline.FOLDER_24);
	}

	#addEditItem(beforeId: ?string = null): void
	{
		if (this.#readonly || !this.#canEdit())
		{
			return;
		}

		const menuItem: MenuItem = this.#menu.addMenuItem({
			id: 'edit',
			className: 'disk-uf-file-menu-item',
			text: Loc.getMessage('DISK_UF_WIDGET_ITEM_MENU_EDIT'),
			onclick: (event, item: MenuItem): void => {
				item.getMenuWindow().close();
				ItemMenu.#loadViewer().then((): void => {
					const node: HTMLElement = this.#createViewerNode();
					if (node !== null)
					{
						BX.UI.Viewer.Instance.runActionByNode(node, 'edit', { checkPromoBoost: true });
					}
				});
			},
		}, beforeId);

		this.#addActionIcon(menuItem, Outline.EDIT_M);
	}

	#addInsertIntoTextItem(): void
	{
		if (!this.#insertIntoText)
		{
			return;
		}

		this.#menu.addMenuItem({
			id: 'insert-into-text',
			text: Loc.getMessage('DISK_UF_WIDGET_INSERT_INTO_THE_TEXT'),
			onclick: (event, menuItem: MenuItem): void => {
				menuItem.getMenuWindow().close();
				this.#userFieldControl.getMainPostForm()?.insertIntoText(this.#item);
			},
		});
	}

	#addDownloadItem(): void
	{
		if (!Type.isStringFilled(this.#item.downloadUrl))
		{
			return;
		}

		const menuItem: MenuItem = this.#menu.addMenuItem({
			id: 'download',
			className: 'disk-uf-file-menu-item',
			text: Loc.getMessage('TILE_UPLOADER_MENU_DOWNLOAD'),
			href: this.#item.downloadUrl,
			onclick: (event, item: MenuItem): void => item.getMenuWindow().close(),
		});

		this.#addActionIcon(menuItem, Outline.DOWNLOAD);
	}

	#addRemoveItem(): void
	{
		if (this.#readonly)
		{
			return;
		}

		const menuItem: MenuItem = this.#menu.addMenuItem({
			id: 'remove',
			text: Loc.getMessage('TILE_UPLOADER_MENU_REMOVE'),
			onclick: (event, item: MenuItem): void => {
				item.getMenuWindow().close();
				this.#userFieldControl.getUploader().removeFile(this.#item.id, { removeFromServer: this.#removeFromServer });
			},
		});

		this.#addActionIcon(menuItem, Outline.TRASHCAN, true);
	}

	#addAllowEditItem(): void
	{
		if (!this.#userFieldControl.canItemAllowEdit(this.#item))
		{
			return;
		}

		this.#menu.addMenuItem({ delimiter: true });
		this.#menu.addMenuItem({
			id: 'allow-edit',
			className: this.#item.customData.allowEdit === true ? 'disk-user-field-item-checked' : '',
			text: Loc.getMessage('DISK_UF_WIDGET_ALLOW_DOCUMENT_EDIT'),
			onclick: (event, menuItem: MenuItem): void => {
				if (this.#item.customData.allowEdit === true)
				{
					this.#userFieldControl.setDocumentEdit(this.#item, false);
				}
				else
				{
					this.#userFieldControl.setDocumentEdit(this.#item, true);
				}

				menuItem.getMenuWindow().close();
			},
		});
	}

	#addRenameItem(beforeId: ?string = null): void
	{
		if (this.#readonly || !this.#item.customData.canRename)
		{
			return;
		}

		this.#menu.addMenuItem({
			id: 'rename',
			text: Loc.getMessage('DISK_UF_WIDGET_RENAME_FILE_MENU_TITLE'),
			events: {
				'SubMenu:onShow': (event: BaseEvent): void => {
					const renameItem: MenuItem = event.getTarget();
					this.#showRenameMenu(renameItem);
				},
			},
			items: [{
				id: 'rename-textarea',
				html: '<div class="disk-user-field-rename-loading"></div>',
				className: 'disk-user-field-rename-menu-item',
			}],
		}, beforeId);
	}

	#addStorageFooter(): void
	{
		if (!Type.isStringFilled(this.#item.customData.storage))
		{
			return;
		}

		this.#menu.addMenuItem({ delimiter: true });

		if (this.#item.customData.canMove)
		{
			this.#menu.addMenuItem({
				id: 'storage',
				text: `${Text.encode(this.#item.customData.storage)}&mldr;`,
				onclick: (): void => {
					this.openFolderDialog();
					this.#menu.close();
				},
				disabled: this.#item.customData.tileSelected === true,
			});
		}
		else
		{
			this.#menu.addMenuItem({
				id: 'storage',
				text: Text.encode(this.#item.customData.storage),
				disabled: true,
			});
		}
	}

	#canEdit(): boolean
	{
		const data = this.#item.customData;
		// isLocked/isLockedBySelf are set by the backend for every path that has a Disk\File
		// (both Disk\File uploads and AttachedObject). Absence of the fields (false/undefined)
		// means no lock — treating them as "not locked" via !== true is intentional and correct.
		const lockAllowsEdit = data.isLocked !== true || data.isLockedBySelf === true;

		return data.isEditable === true && data.canUpdate === true && lockAllowsEdit;
	}

	#isNewFile(): boolean
	{
		// Freshly uploaded files carry the NEW_FILE_PREFIX ('n') in their server id;
		// attached objects have a plain numeric id.
		const serverFileId = this.#item.serverFileId ?? this.#item.id;

		return Type.isStringFilled(serverFileId) && serverFileId.startsWith('n');
	}

	#createViewerNode(): ?HTMLElement
	{
		const viewerAttrs = this.#item.viewerAttrs;
		if (!Type.isPlainObject(viewerAttrs))
		{
			return null;
		}

		const node: HTMLElement = Dom.create('div');
		for (const [key, value] of Object.entries(viewerAttrs))
		{
			Dom.attr(node, `data-${Text.toKebabCase(key)}`, value);
		}

		Dom.attr(node, 'data-viewer', true);

		if (Type.isStringFilled(this.#item.previewUrl))
		{
			Dom.attr(node, 'data-viewer-preview', this.#item.previewUrl);
		}

		return node;
	}

	#runCopyToMe(): void
	{
		const data = this.#item.customData;
		const { action, requestData } = this.#isNewFile()
			? { action: 'disk.api.file.copyTome', requestData: { fileId: data.objectId } }
			: { action: 'disk.attachedObject.copyTome', requestData: { attachedObjectId: data.fileId } };

		Ajax.runAction(action, { data: requestData })
			.then((response): void => {
				const url = response?.data?.file?.extra?.showInGridUri;
				const actions = Type.isStringFilled(url)
					? [{
						title: Loc.getMessage('DISK_UF_WIDGET_OPEN_FILE_MENU_TITLE'),
						href: url,
					}]
					: [];

				ItemMenu.#loadNotification().then((): void => {
					BX.UI.Notification.Center.notify({
						content: Loc.getMessage('DISK_UF_WIDGET_ITEM_MENU_SAVE_TO_DISK_SUCCESS', {
							'#name#': Text.encode(this.#item.name),
						}),
						autoHideDelay: 5000,
						actions,
					});
				});
			})
			.catch((): void => {
				this.#showCopyToMeError();
			});
	}

	#showCopyToMeError(): void
	{
		ItemMenu.#loadNotification().then((): void => {
			BX.UI.Notification.Center.notify({
				content: Loc.getMessage('DISK_UF_WIDGET_ITEM_MENU_SAVE_TO_DISK_ERROR'),
				autoHideDelay: 8000,
				actions: [{
					title: Loc.getMessage('DISK_UF_WIDGET_ITEM_MENU_RETRY'),
					events: {
						click: (event, balloon): void => {
							balloon.close();
							this.#runCopyToMe();
						},
					},
				}],
			});
		});
	}

	rename(newName: string): Promise
	{
		return new Promise((resolve, reject): void => {
			Ajax.runAction('disk.api.commonActions.rename', {
				data: {
					objectId: this.#item.customData.objectId,
					newName,
					autoCorrect: true,
					generateUniqueName: true,
				},
			})
				.then((response): void => {
					if (response?.status === 'success' && response?.data?.object?.name !== this.#item.name)
					{
						const file: UploaderFile = this.#userFieldControl.getFile(this.#item.id);
						const name = response.data.object.name;
						file.setName(name);
					}
					resolve();
				})
				.catch((response): void => {
					BX.Disk.showModalWithStatusAction(response);
					reject();
				});
		});
	}

	#showRenameMenu(renameItem: MenuItem): void
	{
		Runtime.loadExtension('ui.buttons').then((exports): void => {
			const Button: Class<Button> = exports.Button;
			const ButtonSize: Class<ButtonSize> = exports.ButtonSize;
			const ButtonColor: Class<ButtonColor> = exports.ButtonColor;
			const CancelButton: Class<CancelButton> = exports.CancelButton;

			const handleKeydown = (event: KeyboardEvent): void => {
				if (event.code === 'Enter')
				{
					handleRenameClick();
				}
			};

			const nameWithoutExtension = getFilenameWithoutExtension(this.#item.name);
			const handleRenameClick = (): void => {
				const textareaValue: string = textarea.value.trim();
				if (!Type.isStringFilled(textareaValue) || textareaValue === nameWithoutExtension)
				{
					renameItem.getMenuWindow().close();

					return;
				}

				renameBtn.setWaiting(true);
				const newFilename = `${textareaValue}.${getFileExtension(this.#item.name)}`;
				this.rename(newFilename)
					.then((): void => {
						renameBtn.setWaiting(false);
						renameItem.getMenuWindow().close();
					})
					.catch((): void => {
						renameBtn.setWaiting(false);
					})
				;
			};
			const textarea: HTMLTextAreaElement = Tag.render`
				<textarea
					class="disk-user-field-rename-textarea"
					onkeydown="${handleKeydown}"
				>${Text.encode(nameWithoutExtension)}</textarea>
			`;

			const renameBtn: Button = new Button({
				text: Loc.getMessage('DISK_UF_WIDGET_RENAME_FILE_BUTTON_TITLE'),
				color: ButtonColor.PRIMARY,
				size: ButtonSize.SMALL,
				onclick: handleRenameClick,
			});

			const cancelBtn: CancelButton = new CancelButton({
				size: ButtonSize.SMALL,
				onclick: (): void => {
					renameItem.getMenuWindow().close();
				},
			});

			const submenu: Menu = renameItem.getSubMenu();
			const textareaItem: MenuItem = submenu.getMenuItem('rename-textarea');

			textareaItem.setText(
				Tag.render`
					<div class="disk-user-field-rename-form">
						${textarea}
						<div class="disk-user-field-rename-buttons">${[renameBtn.render(), cancelBtn.render()]}</div>
					</div>
				`,
				true
			);

			renameItem.showSubMenu();
		});
	}

	static #loadViewer(): Promise
	{
		ItemMenu.#viewerPromise ??= Runtime.loadExtension('ui.viewer');

		return ItemMenu.#viewerPromise;
	}

	static #loadNotification(): Promise
	{
		ItemMenu.#notificationPromise ??= Runtime.loadExtension('ui.notification');

		return ItemMenu.#notificationPromise;
	}

	openFolderDialog(): void
	{
		loadDiskFileDialog(this.#folderDialogId, { wish: 'fakemove' }).then((): void => {
			BX.DiskFileDialog.obCallback[this.#folderDialogId] = {
				saveButton: (tab, path, selectedItems, folderByPath): void => {
					const selectedItem = Object.values(selectedItems)[0] || folderByPath;
					if (!selectedItem)
					{
						return;
					}

					const folderId = selectedItem.id === 'root' ? tab.rootObjectId : selectedItem.id;

					Ajax.runAction('disk.api.commonActions.move', {
						data: {
							objectId: this.#item.customData.objectId,
							toFolderId: folderId,
						},
					})
						.then((response): void => {
							if (response?.status === 'success')
							{
								const file: UploaderFile = this.#userFieldControl.getFile(this.#item.id);
								const name = response.data.object.name;
								const id = response.data.object.id;

								file.setServerFileId(`n${id}`);
								file.setName(name);

								if (selectedItem.id === 'root')
								{
									file.setCustomData('storage', `${tab.name} / `);
								}
								else
								{
									file.setCustomData('storage', `${tab.name} / ${selectedItem.name}`);
								}
							}
						})
						.catch((response): void => {
							BX.Disk.showModalWithStatusAction(response);
						});
				},
			};

			if (BX.DiskFileDialog.popupWindow === null)
			{
				BX.DiskFileDialog.openDialog(this.#folderDialogId);
			}
		})
			.catch(() => {
				// just ignore
			});
	}
}
