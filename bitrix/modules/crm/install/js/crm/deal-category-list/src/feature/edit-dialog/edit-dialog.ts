import { Dom, Loc, Tag } from 'main.core';
import { Button, ButtonSize, AirButtonStyle } from 'ui.buttons';
import { Center } from 'ui.notification';

import { categoryApi, type CategoryApi } from '../../infrastructure/category-api/category-api';
import {
	type DealCategoryDto,
	type DealCategoryMutationFields,
} from '../../types';

import './edit-dialog.css';

export { DeleteCategory } from './delete-category';

export type EditDialogOptions = {
	category?: DealCategoryDto | null,
	onSave: (category: DealCategoryDto) => void,
	api?: CategoryApi,
};

type DialogInstance = {
	show: () => void,
	hide: () => void,
};

type InputInstance = {
	render: () => HTMLElement,
	getValue: () => string,
	setError: (message: string) => void,
	focus: () => void,
};

export type EditDialogDependencies = {
	Dialog: new (options: Record<string, unknown>) => DialogInstance,
	Input: new (options: Record<string, unknown>) => InputInstance,
	InputDesign: { Grey: string },
	InputSize: { Lg: string },
};

export class EditDialog
{
	#category: DealCategoryDto | null;
	#onSave: EditDialogOptions['onSave'];
	#api: CategoryApi;
	#dependencies: EditDialogDependencies;
	#nameInput: InputInstance;
	#sortInput: InputInstance;
	#saveButton: Button;
	#dialog: DialogInstance;
	#isSaving: boolean = false;
	#isCompleted: boolean = false;

	static show(options: EditDialogOptions, dependencies: EditDialogDependencies): EditDialog
	{
		const dialog = new EditDialog(options, dependencies);
		dialog.show();

		return dialog;
	}

	constructor(options: EditDialogOptions, dependencies: EditDialogDependencies)
	{
		this.#category = options.category ?? null;
		this.#onSave = options.onSave;
		this.#api = options.api ?? categoryApi;
		this.#dependencies = dependencies;
		this.#nameInput = this.#createNameInput();
		this.#sortInput = this.#createSortInput();
		this.#saveButton = this.#createSaveButton();
		this.#dialog = new this.#dependencies.Dialog({
			width: 430,
			title: Loc.getMessage(
				this.#category === null
					? 'CRM_DEAL_CATEGORY_LIST_EDIT_DIALOG_CREATE_TITLE'
					: 'CRM_DEAL_CATEGORY_LIST_EDIT_DIALOG_EDIT_TITLE',
			) ?? '',
			content: this.#renderContent(),
			centerButtons: [this.#saveButton, this.#createCancelButton()],
			hasCloseButton: true,
			closeByEsc: true,
			closeByClickOutside: true,
			hasOverlay: true,
		});
	}

	show(): void
	{
		this.#dialog.show();
	}

	close(): void
	{
		this.#dialog.hide();
	}

	#createNameInput(): InputInstance
	{
		return new this.#dependencies.Input({
			value: this.#category?.name ?? '',
			label: Loc.getMessage('CRM_DEAL_CATEGORY_LIST_EDIT_DIALOG_NAME') ?? '',
			type: 'text',
			size: this.#dependencies.InputSize.Lg,
			design: this.#dependencies.InputDesign.Grey,
			stretched: true,
			required: true,
			onInput: () => this.#nameInput.setError(''),
		});
	}

	#createSortInput(): InputInstance
	{
		return new this.#dependencies.Input({
			value: String(this.#category?.sort ?? 0),
			label: Loc.getMessage('CRM_DEAL_CATEGORY_LIST_EDIT_DIALOG_SORT') ?? '',
			type: 'number',
			size: this.#dependencies.InputSize.Lg,
			design: this.#dependencies.InputDesign.Grey,
			stretched: true,
			onInput: () => this.#sortInput.setError(''),
		});
	}

	#createSaveButton(): Button
	{
		return new Button(({
			text: Loc.getMessage('CRM_DEAL_CATEGORY_LIST_EDIT_DIALOG_SAVE') ?? '',
			size: ButtonSize.LARGE,
			style: AirButtonStyle.FILLED,
			useAirDesign: true,
			dataset: {
				testid: 'crm-deal-category-edit-dialog-save',
			},
			onclick: (): {} => {
				void this.#handleSave();

				return {};
			},
		}) as any);
	}

	#createCancelButton(): Button
	{
		return new Button(({
			text: Loc.getMessage('CRM_DEAL_CATEGORY_LIST_EDIT_DIALOG_CANCEL') ?? '',
			size: ButtonSize.LARGE,
			style: AirButtonStyle.OUTLINE,
			useAirDesign: true,
			dataset: {
				testid: 'crm-deal-category-edit-dialog-cancel',
			},
			onclick: (): {} => {
				this.close();

				return {};
			},
		}) as any);
	}

	#renderContent(): HTMLElement
	{
		const content = Tag.render`
			<div
				class="crm-deal-category-list-edit-dialog__content"
				data-testid="crm-deal-category-edit-dialog"
			></div>
		`;
		const nameInput = this.#nameInput.render();
		const sortInput = this.#sortInput.render();
		const nameInputElement = nameInput.querySelector('input');
		const sortInputElement = sortInput.querySelector('input');
		if (nameInputElement !== null && sortInputElement !== null)
		{
			Dom.attr(nameInputElement, { 'data-testid': 'crm-deal-category-edit-dialog-name' });
			Dom.attr(sortInputElement, { 'data-testid': 'crm-deal-category-edit-dialog-sort' });
		}
		Dom.append(nameInput, content);
		Dom.append(sortInput, content);

		return content;
	}

	#handleSave = async (): Promise<void> => {
		if (this.#isSaving || this.#isCompleted)
		{
			return;
		}

		const fields = this.#validateFields();
		if (fields === null)
		{
			return;
		}

		this.#isSaving = true;
		this.#saveButton.setWaiting(true);

		let savedCategory: DealCategoryDto | null = null;
		try
		{
			savedCategory = await this.#api.save(
				this.#category,
				fields,
			);
		}
		catch
		{
			Center.notify({
				content: Loc.getMessage('CRM_DEAL_CATEGORY_LIST_EDIT_DIALOG_SAVE_ERROR') ?? '',
			});
		}
		finally
		{
			this.#isSaving = false;
			this.#saveButton.setWaiting(false);
		}

		if (savedCategory !== null)
		{
			this.#isCompleted = true;
			this.close();
			this.#onSave(savedCategory);
		}
	};

	#validateFields(): DealCategoryMutationFields | null
	{
		const name = this.#nameInput.getValue().trim();
		const sortValue = this.#sortInput.getValue().trim();
		const isNameValid = name !== '';
		const isSortValid = /^\d+$/.test(sortValue);

		this.#nameInput.setError(
			isNameValid
				? ''
				: Loc.getMessage('CRM_DEAL_CATEGORY_LIST_EDIT_DIALOG_NAME_REQUIRED') ?? '',
		);
		this.#sortInput.setError(
			isSortValid
				? ''
				: Loc.getMessage('CRM_DEAL_CATEGORY_LIST_EDIT_DIALOG_INVALID_SORT') ?? '',
		);

		if (!isNameValid)
		{
			this.#nameInput.focus();
		}
		else if (!isSortValid)
		{
			this.#sortInput.focus();
		}

		return isNameValid && isSortValid ? { name, sort: sortValue } : null;
	}
}
