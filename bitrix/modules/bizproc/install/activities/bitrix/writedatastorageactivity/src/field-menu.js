import { Type, Text } from 'main.core';
import { PopupMenu, Menu } from 'main.popup';

import type { StorageField } from './types';

export class FieldMenu
{
	#addFieldButton: HTMLElement;
	#fieldsContainer: HTMLElement;
	#getStorageFields: () => StorageField[];
	#onAddStaticField: (field: StorageField) => void;
	#fieldMenu: ?Menu = null;

	constructor({
		addFieldButton,
		fieldsContainer,
		getStorageFields,
		onAddStaticField,
	}: {
		addFieldButton: HTMLElement;
		fieldsContainer: HTMLElement;
		getStorageFields: () => StorageField[];
		onAddStaticField: (field: StorageField) => void;
	})
	{
		this.#addFieldButton = addFieldButton;
		this.#fieldsContainer = fieldsContainer;
		this.#getStorageFields = getStorageFields;
		this.#onAddStaticField = onAddStaticField;
	}

	show(): void
	{
		this.#showFieldSelectionMenu();
	}

	destroy(): void
	{
		if (this.#fieldMenu && this.#fieldMenu.getId())
		{
			PopupMenu.destroy(this.#fieldMenu.getId());
			this.#fieldMenu = null;
		}
	}

	#showFieldSelectionMenu(): void
	{
		const addedFieldIds = this.#getAddedFieldIds();
		const menuItems = this.#buildMenuItems(addedFieldIds);

		this.destroy();
		this.#fieldMenu = this.#createFieldMenu(menuItems);
		this.#fieldMenu.show();
	}

	#buildMenuItems(addedFieldIds: Set<string>): Object[]
	{
		const menuItems = [];
		const storageFields = this.#getStorageFields();

		for (const field of storageFields)
		{
			const fieldId = String(field.Id);
			if (!addedFieldIds.has(fieldId) && Type.isStringFilled(field.Name))
			{
				menuItems.push({
					text: Text.encode(field.Name),
					onclick: async (event, menuItem) => {
						menuItem.getMenuWindow().close();
						this.#onAddStaticField(field);
					},
				});
			}
		}

		return menuItems;
	}

	#createFieldMenu(menuItems: Object[]): Menu
	{
		return PopupMenu.create({
			id: `bp_wsa_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
			bindElement: this.#addFieldButton,
			autoHide: true,
			items: menuItems,
			events: {
				onPopupClose: () => {
					this.destroy();
				},
			},
		});
	}

	#getAddedFieldIds(): Set<string>
	{
		const fieldRows = [...this.#fieldsContainer.querySelectorAll('[data-id]')];

		return new Set(fieldRows.map((row) => row.dataset.id));
	}
}
