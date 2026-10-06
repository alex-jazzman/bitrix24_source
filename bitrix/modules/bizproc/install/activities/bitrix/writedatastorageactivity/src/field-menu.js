import { Type, Text, Tag, Dom, Event } from 'main.core';
import { PopupMenu, Menu } from 'main.popup';

import type { StorageField } from './types';

export class FieldMenu
{
	#addFieldButton: HTMLElement;
	#fieldsContainer: HTMLElement;
	#getStorageFields: () => StorageField[];
	#onAddStaticField: (field: StorageField) => void;
	#createFieldCaption: string;
	#canCreateField: () => boolean;
	#onCreateField: () => void;
	#fieldMenu: ?Menu = null;

	constructor({
		addFieldButton,
		fieldsContainer,
		getStorageFields,
		onAddStaticField,
		createFieldCaption,
		canCreateField,
		onCreateField,
	}: {
		addFieldButton: HTMLElement;
		fieldsContainer: HTMLElement;
		getStorageFields: () => StorageField[];
		onAddStaticField: (field: StorageField) => void;
		createFieldCaption: string;
		canCreateField: () => boolean;
		onCreateField: () => void;
	})
	{
		this.#addFieldButton = addFieldButton;
		this.#fieldsContainer = fieldsContainer;
		this.#getStorageFields = getStorageFields;
		this.#onAddStaticField = onAddStaticField;
		this.#createFieldCaption = createFieldCaption;
		this.#canCreateField = canCreateField;
		this.#onCreateField = onCreateField;
	}

	show(): void
	{
		const menuItems = this.#buildMenuItems(this.#getAddedFieldIds());

		// nothing left to pick from, so skip the menu holding the create footer alone
		if (menuItems.length === 0)
		{
			if (this.#canCreateField())
			{
				this.#onCreateField();
			}

			return;
		}

		this.#showFieldSelectionMenu(menuItems);
	}

	hasAvailableFields(): boolean
	{
		const addedFieldIds = this.#getAddedFieldIds();

		return this.#getStorageFields().some((field) => this.#isFieldAvailable(field, addedFieldIds));
	}

	destroy(): void
	{
		if (this.#fieldMenu && this.#fieldMenu.getId())
		{
			PopupMenu.destroy(this.#fieldMenu.getId());
			this.#fieldMenu = null;
		}
	}

	#showFieldSelectionMenu(menuItems: Object[]): void
	{
		this.destroy();
		this.#fieldMenu = this.#createFieldMenu(menuItems);

		if (this.#canCreateField())
		{
			Dom.append(this.#createFooter(), this.#fieldMenu.getLayout().menuContainer);
		}

		this.#fieldMenu.show();
	}

	#isFieldAvailable(field: StorageField, addedFieldIds: Set<string>): boolean
	{
		return !addedFieldIds.has(String(field.Id)) && Type.isStringFilled(field.Name);
	}

	#buildMenuItems(addedFieldIds: Set<string>): Object[]
	{
		return this.#getStorageFields()
			.filter((field) => this.#isFieldAvailable(field, addedFieldIds))
			.map((field) => ({
				text: field.Name,
				dataset: { testid: 'bizproc-write-fields-menu-item' },
				onclick: async (event, menuItem) => {
					menuItem.getMenuWindow().close();
					this.#onAddStaticField(field);
				},
			}));
	}

	#createFieldMenu(menuItems: Object[]): Menu
	{
		return PopupMenu.create({
			id: `bp_wsa_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
			bindElement: this.#addFieldButton,
			className: 'bizproc-write-activity__field-menu',
			autoHide: true,
			items: menuItems,
			events: {
				onPopupClose: () => {
					this.destroy();
				},
			},
		});
	}

	// The menu footer sits next to the items container, as main.popup has no footer option.
	#createFooter(): HTMLElement
	{
		const footer = Tag.render`
			<div class="bizproc-write-activity__menu-footer" data-testid="bizproc-write-fields-create-footer">
				<div class="ui-icon-set --circle-plus bizproc-write-activity__menu-footer-icon"></div>
				<span class="bizproc-write-activity__menu-footer-text">${Text.encode(this.#createFieldCaption)}</span>
			</div>
		`;

		Event.bind(footer, 'click', (event) => {
			event.preventDefault();
			this.#fieldMenu?.close();
			this.#onCreateField();
		});

		return footer;
	}

	#getAddedFieldIds(): Set<string>
	{
		const fieldRows = [...this.#fieldsContainer.querySelectorAll('[data-id]')];

		return new Set(fieldRows.map((row) => row.dataset.id));
	}
}
