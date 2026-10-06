import { Type } from 'main.core';
import { ActionMenuService } from 'note.ui.action-menu';
import { App as PermissionsApp } from 'note.permissions';

const POPUP_CLASS = 'note-action-menu';

export class DocumentActionMenuService
{
	#service: ActionMenuService;
	#messages: Object;

	constructor(messages: Object)
	{
		this.#messages = messages || {};
		this.#service = new ActionMenuService({ popupClass: POPUP_CLASS });
	}

	destroy(): void
	{
		this.#service?.destroy?.();
	}

	open(documentId: number, bindElement: HTMLElement, context: Object = {}): void
	{
		const docId = Number(documentId);
		if (!Number.isInteger(docId) || docId <= 0 || !bindElement)
		{
			return;
		}

		const items = this.#buildMenuItems(docId, context);
		if (items.length === 0)
		{
			return;
		}

		this.#service.open(items, bindElement, {
			key: `document-${docId}`,
			popupClass: POPUP_CLASS,
		});
	}

	#buildMenuItems(docId: number, context: Object): Array<Object>
	{
		const isMain = Boolean(context?.isMain);
		const isTrashed = Boolean(context?.isTrashed);
		const isArchived = Boolean(context?.isArchived);
		const canEditCollection = Boolean(context?.canEditCollection);
		const canManagePermissions = Boolean(context?.canManagePermissions);
		const canRestore = Boolean(context?.canRestore);
		const canHardDelete = Boolean(context?.canHardDelete);
		const documentTitle = Type.isString(context?.documentTitle) ? context.documentTitle : '';
		const onCopyLink = typeof context?.onCopyLink === 'function' ? context.onCopyLink : null;
		const canEdit = Boolean(context?.canEdit);
		const onCopyMarkdown = typeof context?.onCopyMarkdown === 'function' ? context.onCopyMarkdown : null;
		const onDownload = typeof context?.onDownload === 'function' ? context.onDownload : null;
		const onImportMarkdown = typeof context?.onImportMarkdown === 'function' ? context.onImportMarkdown : null;
		const onArchive = typeof context?.onArchive === 'function' ? context.onArchive : null;
		const onRestore = typeof context?.onRestore === 'function' ? context.onRestore : null;
		const onDelete = typeof context?.onDelete === 'function' ? context.onDelete : null;
		const onRestoreFromTrash = typeof context?.onRestoreFromTrash === 'function' ? context.onRestoreFromTrash : null;
		const onHardDelete = typeof context?.onHardDelete === 'function' ? context.onHardDelete : null;
		const items = [];

		if (onCopyLink)
		{
			items.push({
				text: this.#messages.copyLink ?? '',
				iconModifier: 'o-link',
				testId: 'note-doc-menu-copy-link',
				onClick: onCopyLink,
			});
		}

		if (onCopyMarkdown)
		{
			items.push({
				text: this.#messages.copyMarkdown ?? '',
				iconModifier: 'o-copy',
				testId: 'note-doc-menu-copy-markdown',
				onClick: onCopyMarkdown,
			});
		}

		// Not gated by isTrashed/isArchived/canEditCollection: viewing the document page
		// already implies view access, and downloading is allowed for trashed/archived docs too.
		if (onDownload)
		{
			items.push({
				text: this.#messages.download ?? '',
				iconModifier: 'o-download',
				testId: 'note-doc-menu-download',
				onClick: onDownload,
			});
		}

		// The collection's main document (the "About" description) cannot be archived,
		// deleted, moved, or have its permissions managed - it lives and dies with the
		// collection. Expose only the safe, non-destructive actions (e.g. copy markdown).
		if (isMain)
		{
			return items;
		}

		if (isTrashed)
		{
			if (canRestore && onRestoreFromTrash)
			{
				items.push({
					text: this.#messages.restoreFromTrash ?? '',
					iconModifier: 'o-undo',
					testId: 'note-doc-menu-restore',
					onClick: onRestoreFromTrash,
				});
			}

			if (canHardDelete && onHardDelete)
			{
				items.push({
					text: this.#messages.hardDelete ?? '',
					iconModifier: 'o-trashcan',
					danger: true,
					testId: 'note-doc-menu-hard-delete',
					onClick: onHardDelete,
				});
			}

			return items;
		}

		if (isArchived && canEditCollection)
		{
			if (onRestore)
			{
				items.push({
					text: this.#messages.restore ?? '',
					iconModifier: 'o-undo',
					testId: 'note-doc-menu-restore',
					onClick: onRestore,
				});
			}

			if (onDelete)
			{
				items.push({
					text: this.#messages.delete ?? '',
					iconModifier: 'o-trashcan',
					danger: true,
					testId: 'note-doc-menu-delete',
					onClick: onDelete,
				});
			}

			return items;
		}

		if (!isArchived && canEdit && onImportMarkdown)
		{
			items.push({
				text: this.#messages.importMarkdown ?? '',
				iconModifier: 'o-share',
				testId: 'note-doc-menu-import-markdown',
				onClick: onImportMarkdown,
			});
		}

		if (!isArchived && canEditCollection && onArchive)
		{
			items.push({
				text: this.#messages.archive ?? '',
				iconModifier: 'o-box-with-lid',
				testId: 'note-doc-menu-archive',
				onClick: onArchive,
			});
		}

		if (!isArchived && canManagePermissions)
		{
			items.push({
				text: this.#messages.permissions ?? '',
				iconModifier: 'o-settings',
				testId: 'note-doc-menu-permissions',
				onClick: () => {
					void PermissionsApp.openDocumentPopup(docId, { documentTitle });
				},
			});
		}

		if (!isArchived && canEditCollection && onDelete)
		{
			items.push({
				text: this.#messages.delete ?? '',
				iconModifier: 'o-trashcan',
				danger: true,
				testId: 'note-doc-menu-delete',
				onClick: onDelete,
			});
		}

		return items;
	}
}
