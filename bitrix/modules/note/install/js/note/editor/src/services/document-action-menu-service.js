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
		const isTrashed = Boolean(context?.isTrashed);
		const isArchived = Boolean(context?.isArchived);
		const canEditCollection = Boolean(context?.canEditCollection);
		const canManagePermissions = Boolean(context?.canManagePermissions);
		const canRestore = Boolean(context?.canRestore);
		const canHardDelete = Boolean(context?.canHardDelete);
		const documentTitle = Type.isString(context?.documentTitle) ? context.documentTitle : '';
		const onCopyMarkdown = typeof context?.onCopyMarkdown === 'function' ? context.onCopyMarkdown : null;
		const onArchive = typeof context?.onArchive === 'function' ? context.onArchive : null;
		const onRestore = typeof context?.onRestore === 'function' ? context.onRestore : null;
		const onDelete = typeof context?.onDelete === 'function' ? context.onDelete : null;
		const onRestoreFromTrash = typeof context?.onRestoreFromTrash === 'function' ? context.onRestoreFromTrash : null;
		const onHardDelete = typeof context?.onHardDelete === 'function' ? context.onHardDelete : null;
		const items = [];

		if (onCopyMarkdown)
		{
			items.push({
				text: this.#messages.copyMarkdown ?? '',
				iconModifier: 'o-copy',
				onClick: onCopyMarkdown,
			});
		}

		if (isTrashed)
		{
			if (canRestore && onRestoreFromTrash)
			{
				items.push({
					text: this.#messages.restoreFromTrash ?? '',
					iconModifier: 'o-undo',
					onClick: onRestoreFromTrash,
				});
			}

			if (canHardDelete && onHardDelete)
			{
				items.push({
					text: this.#messages.hardDelete ?? '',
					iconModifier: 'o-trashcan',
					danger: true,
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
					onClick: onRestore,
				});
			}

			if (onDelete)
			{
				items.push({
					text: this.#messages.delete ?? '',
					iconModifier: 'o-trashcan',
					danger: true,
					onClick: onDelete,
				});
			}

			return items;
		}

		if (!isArchived && canEditCollection && onArchive)
		{
			items.push({
				text: this.#messages.archive ?? '',
				iconModifier: 'o-box-with-lid',
				onClick: onArchive,
			});
		}

		if (!isArchived && canManagePermissions)
		{
			items.push({
				text: this.#messages.permissions ?? '',
				iconModifier: 'o-settings',
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
				onClick: onDelete,
			});
		}

		return items;
	}
}
