import { ajax, Dom, Event, Loc, Tag, Text, Type } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { MessageBox } from 'ui.dialogs.messagebox';
import { type Item, type ItemId } from 'ui.entity-selector';

import { normalizeAccessCode, toAccessCode, toItemId } from './access-code-map';
import { loadScopedDialog } from './dialog-loader';
import { buildDialogEntities } from './dialog-entities';

// `Event` is taken by the main.core binder, so the DOM event type is reached through the event map.
type DomEvent = GlobalEventHandlersEventMap['change'];

export type PermissionsSelectorOptions = {
	container: HTMLElement,
	ajaxUrl: string,
	sessid: string,
	providerNames: { [entityId: string]: string },
	useStructureRoles: boolean,
};

const ROW_TEMPLATE_ID = 'bx-vi-new-access-row';

export class PermissionsSelector
{
	#options: PermissionsSelectorOptions;
	#accessTable: HTMLTableElement;
	#lastRow: HTMLTableRowElement;
	#dialogPending: boolean = false;

	constructor(options: PermissionsSelectorOptions)
	{
		this.#options = options;
		this.#accessTable = options.container.querySelector('table.bx-vi-js-role-access-table') as HTMLTableElement;
		this.#lastRow = options.container.querySelector('tr.bx-vi-js-access-table-last-row') as HTMLTableRowElement;

		Event.bind(options.container, 'click', this.#handleClick);
		Event.bind(options.container, 'change', this.#handleChange);
	}

	#handleClick = (event: MouseEvent): void => {
		const target = event.target as HTMLElement;

		const addAccess = target.closest('.bx-vi-js-add-access') as HTMLElement | null;
		if (addAccess)
		{
			event.preventDefault();
			this.#showDialog(addAccess).catch((error: Error) => {
				console.error('voximplant.permissions-selector: the selection dialog could not be loaded', error);
			});

			return;
		}

		const deleteAccess = target.closest('.bx-vi-js-delete-access') as HTMLElement | null;
		if (deleteAccess)
		{
			event.preventDefault();
			this.#removeOwnRow(deleteAccess);

			return;
		}

		const deleteRole = target.closest('.bx-vi-js-delete-role') as HTMLElement | null;
		if (deleteRole)
		{
			event.preventDefault();
			this.#confirmRoleDelete(deleteRole.dataset.roleId);
		}
	};

	#handleChange = (event: DomEvent): void => {
		const target = event.target as HTMLElement;
		const select = target.closest('.bx-vi-js-select-role') as HTMLSelectElement | null;
		if (!select)
		{
			return;
		}

		// The row of this very select: one access code can be bound to several roles, so a lookup
		// by code would stamp the role onto whichever of those rows comes first.
		const row = select.closest('tr') as HTMLTableRowElement | null;
		if (row)
		{
			Dom.attr(row, 'data-role-id', select.value);
		}
	};

	/**
	 * The selector arrives on the first call, so the click is answered over a round trip and a second
	 * click can land before the first dialog exists - it would open a dialog of its own.
	 */
	async #showDialog(targetNode: HTMLElement): Promise<void>
	{
		if (this.#dialogPending)
		{
			return;
		}

		this.#dialogPending = true;

		try
		{
			const ScopedDialog = await loadScopedDialog();

			const dialog = new ScopedDialog({
				targetNode,
				multiple: true,
				cacheable: false,
				enableSearch: true,
				entities: buildDialogEntities(this.#options.useStructureRoles),
				preselectedItems: this.#getPreselectedItems(),
				events: {
					'Item:onSelect': (event: BaseEvent) => this.#addRow(event.getData().item),
					'Item:onDeselect': (event: BaseEvent) => this.#removeRowsOf(toAccessCode(event.getData().item)),
					onHide: () => dialog.destroy(),
				},
			});

			dialog.show();
		}
		finally
		{
			this.#dialogPending = false;
		}
	}

	#getPreselectedItems(): ItemId[]
	{
		const preselected: ItemId[] = [];

		this.#getRows().forEach((row: HTMLTableRowElement) => {
			const itemId = toItemId(String(row.dataset.accessCode));
			if (!Type.isNull(itemId))
			{
				preselected.push(itemId as ItemId);
			}
		});

		return preselected;
	}

	#addRow(item: Item): void
	{
		const accessCode = toAccessCode(item);
		if (!Type.isStringFilled(accessCode) || this.#hasRow(accessCode))
		{
			return;
		}

		const row: HTMLTableRowElement = Tag.render`<tr>${this.#renderCells(item, accessCode)}</tr>`;
		const select = row.querySelector('select');

		Dom.attr(row, 'data-access-code', accessCode);
		Dom.attr(row, 'data-role-id', select ? select.value : '');
		Dom.attr(row, 'data-testid', `vox-perms-access-row-${accessCode}`);
		Dom.insertBefore(row, this.#lastRow);
	}

	#renderCells(item: Item, accessCode: string): string
	{
		const template = document.getElementById(ROW_TEMPLATE_ID);
		if (!template)
		{
			return '';
		}

		return template.innerHTML
			.replaceAll('#PROVIDER#', Text.encode(this.#options.providerNames[item.getEntityId()] ?? ''))
			.replaceAll('#NAME#', Text.encode(item.getTitle()))
			.replaceAll('#ACCESS_CODE#', Text.encode(accessCode))
		;
	}

	/**
	 * Removing a row is not the same operation as dropping a recipient, so the two do not share a
	 * lookup. The icon belongs to one row and has to take that row out: the same access code can be
	 * bound to several roles, and then the table legitimately holds more than one row carrying it.
	 */
	#removeOwnRow(node: HTMLElement): void
	{
		const row = node.closest('tr') as HTMLTableRowElement | null;
		if (row)
		{
			Dom.remove(row);
		}
	}

	/**
	 * Every row of the recipient, not just the first one. A person may sit in the table under both
	 * code forms at once, and the dialog shows the two rows as a single selected item, so a single
	 * deselect has to clear both: a row left behind keeps granting the role after save.
	 */
	#removeRowsOf(accessCode: string): void
	{
		if (!Type.isStringFilled(accessCode))
		{
			return;
		}

		const key = normalizeAccessCode(accessCode);

		this.#getRows()
			.filter((row: HTMLTableRowElement) => normalizeAccessCode(String(row.dataset.accessCode)) === key)
			.forEach((row: HTMLTableRowElement) => Dom.remove(row))
		;
	}

	#hasRow(accessCode: string): boolean
	{
		const key = normalizeAccessCode(accessCode);

		return this.#getRows().some((row: HTMLTableRowElement) => {
			return normalizeAccessCode(String(row.dataset.accessCode)) === key;
		});
	}

	#getRows(): HTMLTableRowElement[]
	{
		return [...this.#accessTable.rows].filter((row: HTMLTableRowElement) => {
			return Type.isStringFilled(row.dataset.accessCode);
		});
	}

	#confirmRoleDelete(roleId: string | undefined): void
	{
		if (!Type.isStringFilled(roleId))
		{
			return;
		}

		MessageBox.confirm(
			Loc.getMessage('VOXIMPLANT_PERM_ROLE_DELETE_CONFIRM') ?? '',
			Loc.getMessage('VOXIMPLANT_PERM_ROLE_DELETE') ?? '',
			(messageBox: MessageBox) => {
				messageBox.close();
				this.#deleteRole(roleId as string);
			},
		);
	}

	#deleteRole(roleId: string): void
	{
		ajax({
			url: this.#options.ajaxUrl,
			method: 'POST',
			dataType: 'json',
			data: {
				action: 'deleteRole',
				roleId,
				sessid: this.#options.sessid,
			},
			onsuccess: (response: { ERROR?: string } | null) => {
				if (!response || response.ERROR)
				{
					this.#showDeleteRoleError();

					return;
				}

				this.#removeRoleNodes(roleId);
			},
			onfailure: () => this.#showDeleteRoleError(),
		});
	}

	#removeRoleNodes(roleId: string): void
	{
		this.#options.container
			.querySelectorAll(`[data-role-id="${CSS.escape(roleId)}"]`)
			.forEach((node: Element) => Dom.remove(node as HTMLElement))
		;
	}

	#showDeleteRoleError(): void
	{
		MessageBox.alert(
			Loc.getMessage('VOXIMPLANT_PERM_ROLE_DELETE_ERROR') ?? '',
			Loc.getMessage('VOXIMPLANT_PERM_ERROR') ?? '',
		);
	}
}
