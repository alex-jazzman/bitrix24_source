import { Dom, Loc, Runtime, Text, Type } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { Center } from 'ui.notification';

import {
	DeleteCategory,
	EditDialog,
	type EditDialogDependencies,
	type EditDialogOptions,
} from '../feature/edit-dialog/edit-dialog';
import { BulkDelete } from '../feature/bulk-delete/bulk-delete';
import {
	type DealCategoryBulkDeleteAction,
	type DealCategoryDto,
	type DealCategoryGrid,
	type DealCategoryGridRow,
	type DealCategoryListAction,
	type DealCategoryListOptions,
} from '../types';

const ACTION_EVENT = 'Crm.DealCategoryList:onAction';
const CREATE_EVENT = 'CrmDealCategoryCreate';
const CATEGORY_FIELDS = [
	'id',
	'name',
	'sort',
	'createdDate',
	'isDefault',
	'stageEditorUrl',
];

type DialogInstance = {
	show: () => void,
	hide: () => void,
};

type DialogConstructor = new (options: Record<string, unknown>) => DialogInstance;

type DialogExtensionExports = {
	Dialog: DialogConstructor,
};

type SidePanelExtensionExports = {
	SidePanel: {
		Instance: {
			open: (url: string, options: Record<string, unknown>) => boolean,
		},
	},
};

type InfoHelperExtensionExports = {
	InfoHelper: {
		show: (id: string) => void,
	},
};

export class DealCategoryList extends EventEmitter
{
	static #instance: DealCategoryList | null = null;

	#gridId: string;
	#actionIds: DealCategoryListOptions['actionIds'];
	#categoryCount: number;
	#quantityLimit: number;
	#infoHelperId: string;
	#bulkDelete: BulkDelete;
	#editDialogDependenciesPromise: Promise<EditDialogDependencies> | null = null;
	#dialogDependenciesPromise: Promise<DialogExtensionExports> | null = null;
	#sidePanelPromise: Promise<SidePanelExtensionExports> | null = null;
	#infoHelperPromise: Promise<InfoHelperExtensionExports> | null = null;
	#editDialogOpening: boolean = false;
	#deleteDialogOpening: boolean = false;
	#deleteDialog: DialogInstance | null = null;
	#deleteButton: Button | null = null;
	#deleteCategory: DealCategoryDto | null = null;
	#isDeleting: boolean = false;
	#isDeleteCompleted: boolean = false;

	static init(options: DealCategoryListOptions): DealCategoryList
	{
		if (DealCategoryList.#instance === null)
		{
			DealCategoryList.#instance = new DealCategoryList(options);
		}
		else
		{
			DealCategoryList.#instance.#synchronizeOptions(options);
		}

		return DealCategoryList.#instance;
	}

	private constructor(options: DealCategoryListOptions)
	{
		super();

		if (!this.#isOptionsValid(options))
		{
			throw new TypeError('Deal category list options are invalid');
		}

		this.setEventNamespace('BX.Crm.DealCategoryList');
		this.#gridId = options.gridId;
		this.#actionIds = options.actionIds;
		this.#categoryCount = options.categoryCount;
		this.#quantityLimit = options.quantityLimit;
		this.#infoHelperId = options.infoHelperId;
		this.#bulkDelete = new BulkDelete({
			getGrid: (): DealCategoryGrid | null => this.#getGrid(),
			onSuccess: (successCount: number): void => this.#decreaseCategoryCount(successCount),
		});

		EventEmitter.subscribe(ACTION_EVENT, this.#handleAction.bind(this));
		EventEmitter.subscribe(
			CREATE_EVENT,
			this.#openCreateDialog.bind(this),
			{ compatMode: true },
		);

		if (options.openEditId !== null)
		{
			if (options.openEditId === 0)
			{
				this.#openCreateDialog();
			}
			else
			{
				this.#openEditDialogById(options.openEditId);
			}
			this.#removeOpenEditQueryParameter();
		}
	}

	#openStageEditor(category: unknown): boolean
	{
		if (!this.#isDealCategoryDto(category))
		{
			this.#showInvalidDataNotification();

			return false;
		}

		void this.#loadSidePanel()
			.then(({ SidePanel }) => SidePanel.Instance.open(
				category.stageEditorUrl,
				{
					cacheable: false,
					customLeftBoundary: 40,
					allowChangeHistory: false,
				},
			))
			.catch(() => {})
		;

		return true;
	}

	#openStageEditorById(id: number): boolean
	{
		const category = this.#getCategoryById(id);

		return category === null ? false : this.#openStageEditor(category);
	}

	#openCreateDialog(): void
	{
		if (this.#isQuantityLimitReached() || this.#editDialogOpening)
		{
			if (this.#isQuantityLimitReached())
			{
				void this.#showInfoHelper().catch(() => {});
			}

			return;
		}

		this.emit('onCreate');
		void this.#showEditDialog({
			onSave: (): void => {
				this.#categoryCount++;
				this.#reloadGrid();
			},
		});
	}

	#openEditDialog(category: DealCategoryDto): void
	{
		if (this.#editDialogOpening)
		{
			return;
		}

		this.emit('onEdit', { category });
		void this.#showEditDialog({
			category,
			onSave: (): void => this.#reloadGrid(),
		});
	}

	#openEditDialogById(id: number): boolean
	{
		const category = this.#getCategoryById(id);
		if (category === null)
		{
			return false;
		}

		this.#openEditDialog(category);

		return true;
	}

	#showDeleteDialog(category: DealCategoryDto, Dialog: DialogConstructor): void
	{
		this.#deleteCategory = category;
		this.#isDeleting = false;
		this.#isDeleteCompleted = false;
		this.#deleteButton = new Button(({
			text: Loc.getMessage('CRM_DEAL_CATEGORY_LIST_DELETE_DIALOG_DELETE') ?? '',
			size: ButtonSize.LARGE,
			style: AirButtonStyle.FILLED,
			useAirDesign: true,
			dataset: {
				testid: 'crm-deal-category-delete-dialog-delete',
			},
			onclick: (): {} => {
				void this.#handleDelete();

				return {};
			},
		}) as any);
		this.#deleteDialog = new Dialog({
			title: Loc.getMessage('CRM_DEAL_CATEGORY_LIST_DELETE_DIALOG_TITLE') ?? '',
			content: Dom.create('div', {
				text: Loc.getMessage(
					'CRM_DEAL_CATEGORY_LIST_DELETE_DIALOG_CONTENT',
					{ '#NAME#': category.name },
				) ?? '',
				attrs: {
					'data-testid': 'crm-deal-category-delete-dialog',
				},
			}),
			centerButtons: [this.#deleteButton, this.#createDeleteCancelButton()],
			hasCloseButton: true,
			closeByEsc: true,
			closeByClickOutside: true,
			hasOverlay: true,
		});
		this.#deleteDialog.show();
	}

	#openDeleteDialogById(id: number): boolean
	{
		const category = this.#getCategoryById(id);
		if (category === null || category.isDefault || this.#deleteDialogOpening || this.#isDeleting)
		{
			return false;
		}

		this.emit('onDelete', { category });
		this.#deleteDialogOpening = true;
		void this.#loadDialogDependencies()
			.then(({ Dialog }) => this.#showDeleteDialog(category, Dialog))
			.catch(() => {
				Center.notify({
					content: Loc.getMessage('CRM_DEAL_CATEGORY_LIST_DELETE_DIALOG_ERROR') ?? '',
				});
			})
			.finally(() => {
				this.#deleteDialogOpening = false;
			})
		;

		return true;
	}

	#getCategoryById(id: number): DealCategoryDto | null
	{
		const row = this.#getRow(id);
		if (row === null)
		{
			this.#showInvalidDataNotification();

			return null;
		}

		const serializedCategory = row.getNode()?.dataset.category;
		if (!Type.isStringFilled(serializedCategory))
		{
			this.#showInvalidDataNotification();

			return null;
		}

		try
		{
			const category: unknown = JSON.parse(serializedCategory);
			if (this.#isDealCategoryDto(category))
			{
				return category;
			}
		}
		catch
		{
			// The same safe notification is used for malformed JSON and an invalid DTO.
		}

		this.#showInvalidDataNotification();

		return null;
	}

	#processAction(action: unknown): boolean
	{
		if (this.#isBulkDeleteAction(action))
		{
			return this.#bulkDelete.start(action);
		}

		if (!this.#isActionValid(action))
		{
			return false;
		}

		if (action.actionId === this.#actionIds.edit)
		{
			return this.#openEditDialogById(action.id);
		}

		if (action.actionId === this.#actionIds.editStages)
		{
			return this.#openStageEditorById(action.id);
		}

		if (action.actionId === this.#actionIds.delete)
		{
			return this.#openDeleteDialogById(action.id);
		}

		return false;
	}

	#isOptionsValid(options: DealCategoryListOptions): boolean
	{
		return Type.isPlainObject(options)
			&& Type.isStringFilled(options.gridId)
			&& (Type.isInteger(options.openEditId) || Type.isNull(options.openEditId))
			&& (options.openEditId === null || options.openEditId >= 0)
			&& Type.isInteger(options.categoryCount)
			&& options.categoryCount >= 0
			&& Type.isInteger(options.quantityLimit)
			&& Type.isStringFilled(options.infoHelperId)
			&& Type.isPlainObject(options.actionIds)
			&& Type.isStringFilled(options.actionIds.edit)
			&& Type.isStringFilled(options.actionIds.editStages)
			&& Type.isStringFilled(options.actionIds.delete)
		;
	}

	#synchronizeOptions(options: DealCategoryListOptions): void
	{
		if (!this.#isOptionsValid(options))
		{
			throw new TypeError('Deal category list options are invalid');
		}

		this.#gridId = options.gridId;
		this.#actionIds = options.actionIds;
		this.#categoryCount = options.categoryCount;
		this.#quantityLimit = options.quantityLimit;
		this.#infoHelperId = options.infoHelperId;
	}

	#isDealCategoryDto(category: unknown): category is DealCategoryDto
	{
		if (!Type.isPlainObject(category))
		{
			return false;
		}

		const value = category as Partial<DealCategoryDto>;

		return Object.keys(value).length === CATEGORY_FIELDS.length
			&& CATEGORY_FIELDS.every((field: string): boolean => Object.hasOwn(value, field))
			&& Type.isInteger(value.id)
			&& value.id >= 0
			&& Type.isString(value.name)
			&& Type.isInteger(value.sort)
			&& value.sort >= 0
			&& Type.isBoolean(value.isDefault)
			&& (value.id === 0) === value.isDefault
			&& (
				(value.isDefault && Type.isNull(value.createdDate))
				|| (!value.isDefault && Type.isStringFilled(value.createdDate))
			)
			&& Type.isStringFilled(value.stageEditorUrl)
		;
	}

	#isActionValid(action: unknown): action is DealCategoryListAction
	{
		if (!Type.isPlainObject(action))
		{
			return false;
		}

		const value = action as Partial<DealCategoryListAction>;

		return Type.isStringFilled(value.actionId)
			&& Type.isInteger(value.id)
			&& value.id >= 0
		;
	}

	#isBulkDeleteAction(action: unknown): action is DealCategoryBulkDeleteAction
	{
		if (!Type.isPlainObject(action))
		{
			return false;
		}

		const value = action as Partial<DealCategoryBulkDeleteAction>;

		return value.actionId === 'bulk-delete'
		&& value.controller === 'crm.api.dealcategory.grid'
			&& value.method === 'POST'
		;
	}

	#getGrid(): DealCategoryGrid | null
	{
		const grid = BX.Main.gridManager.getInstanceById(this.#gridId) as DealCategoryGrid | null;

		return Type.isFunction(grid?.getRows) ? grid : null;
	}

	#getRow(id: number): DealCategoryGridRow | null
	{
		return this.#getGrid()?.getRows().getById(id) ?? null;
	}

	#reloadGrid(): void
	{
		this.#getGrid()?.reload();
	}

	#isQuantityLimitReached(): boolean
	{
		return this.#quantityLimit > 0 && this.#categoryCount >= this.#quantityLimit;
	}

	#decreaseCategoryCount(count: number): void
	{
		this.#categoryCount = Math.max(0, this.#categoryCount - count);
	}

	async #showEditDialog(options: EditDialogOptions): Promise<void>
	{
		this.#editDialogOpening = true;
		try
		{
			const dependencies = await this.#loadEditDialogDependencies();
			EditDialog.show(options, dependencies);
		}
		catch
		{
			Center.notify({
				content: Loc.getMessage('CRM_DEAL_CATEGORY_LIST_EDIT_DIALOG_SAVE_ERROR') ?? '',
			});
		}
		finally
		{
			this.#editDialogOpening = false;
		}
	}

	#loadEditDialogDependencies(): Promise<EditDialogDependencies>
	{
		if (this.#editDialogDependenciesPromise === null)
		{
			const promise = Runtime.loadExtension(['ui.system.dialog', 'ui.system.input'])
				.then((exports: unknown): EditDialogDependencies => {
					const dependencies = exports as Partial<EditDialogDependencies>;
					if (
						!Type.isFunction(dependencies.Dialog)
						|| !Type.isFunction(dependencies.Input)
						|| !Type.isPlainObject(dependencies.InputDesign)
						|| !Type.isPlainObject(dependencies.InputSize)
					)
					{
						throw new TypeError('Edit dialog dependencies are invalid');
					}

					return dependencies as EditDialogDependencies;
				})
				.catch((error: unknown) => {
					if (this.#editDialogDependenciesPromise === promise)
					{
						this.#editDialogDependenciesPromise = null;
					}

					throw error;
				})
			;
			this.#editDialogDependenciesPromise = promise;
		}

		return this.#editDialogDependenciesPromise;
	}

	#loadDialogDependencies(): Promise<DialogExtensionExports>
	{
		if (this.#dialogDependenciesPromise === null)
		{
			const promise = Runtime.loadExtension('ui.system.dialog')
				.then((exports: unknown): DialogExtensionExports => {
					const dependencies = exports as Partial<DialogExtensionExports>;
					if (!Type.isFunction(dependencies.Dialog))
					{
						throw new TypeError('Dialog dependency is invalid');
					}

					return dependencies as DialogExtensionExports;
				})
				.catch((error: unknown) => {
					if (this.#dialogDependenciesPromise === promise)
					{
						this.#dialogDependenciesPromise = null;
					}

					throw error;
				})
			;
			this.#dialogDependenciesPromise = promise;
		}

		return this.#dialogDependenciesPromise;
	}

	#loadSidePanel(): Promise<SidePanelExtensionExports>
	{
		if (this.#sidePanelPromise === null)
		{
			const promise = Runtime.loadExtension('main.sidepanel')
				.then((exports: unknown): SidePanelExtensionExports => {
					const dependencies = exports as Partial<SidePanelExtensionExports>;
					if (!Type.isFunction(dependencies.SidePanel?.Instance?.open))
					{
						throw new TypeError('Side panel dependency is invalid');
					}

					return dependencies as SidePanelExtensionExports;
				})
				.catch((error: unknown) => {
					if (this.#sidePanelPromise === promise)
					{
						this.#sidePanelPromise = null;
					}

					throw error;
				})
			;
			this.#sidePanelPromise = promise;
		}

		return this.#sidePanelPromise;
	}

	#showInfoHelper(): Promise<void>
	{
		if (this.#infoHelperPromise === null)
		{
			const promise = Runtime.loadExtension('ui.info-helper')
				.then((exports: unknown): InfoHelperExtensionExports => {
					const dependencies = exports as Partial<InfoHelperExtensionExports>;
					if (!Type.isFunction(dependencies.InfoHelper?.show))
					{
						throw new TypeError('Info helper dependency is invalid');
					}

					return dependencies as InfoHelperExtensionExports;
				})
				.catch((error: unknown) => {
					if (this.#infoHelperPromise === promise)
					{
						this.#infoHelperPromise = null;
					}

					throw error;
				})
			;
			this.#infoHelperPromise = promise;
		}

		return this.#infoHelperPromise.then(({ InfoHelper }) => {
			InfoHelper.show(this.#infoHelperId);
		});
	}

	#handleAction(event: BaseEvent): void
	{
		this.#processAction(event.getData());
	}

	#showInvalidDataNotification(): void
	{
		Center.notify({
			content: Loc.getMessage('CRM_DEAL_CATEGORY_LIST_INVALID_DATA') ?? '',
		});
	}

	#createDeleteCancelButton(): Button
	{
		return new Button(({
			text: Loc.getMessage('CRM_DEAL_CATEGORY_LIST_DELETE_DIALOG_CANCEL') ?? '',
			size: ButtonSize.LARGE,
			style: AirButtonStyle.OUTLINE,
			useAirDesign: true,
			dataset: {
				testid: 'crm-deal-category-delete-dialog-cancel',
			},
			onclick: (): {} => {
				this.#deleteDialog?.hide();

				return {};
			},
		}) as any);
	}

	#getDeleteErrorMessage(error: unknown): string
	{
		const fallbackMessage = Loc.getMessage('CRM_DEAL_CATEGORY_LIST_DELETE_DIALOG_ERROR') ?? '';
		if (!Type.isPlainObject(error))
		{
			return fallbackMessage;
		}

		const errors = (error as { errors?: unknown }).errors;
		if (!Array.isArray(errors))
		{
			return fallbackMessage;
		}

		const serverError = errors.find((item: unknown): boolean => {
			return Type.isPlainObject(item)
				&& Type.isStringFilled((item as { message?: unknown }).message)
			;
		}) as { message: string } | undefined;

		return serverError?.message ?? fallbackMessage;
	}

	#handleDelete = async (): Promise<void> => {
		if (
			this.#isDeleting
			|| this.#isDeleteCompleted
			|| this.#deleteCategory === null
			|| this.#deleteCategory.isDefault
		)
		{
			return;
		}

		this.#isDeleting = true;
		this.#deleteButton?.setWaiting(true);

		let isDeleted = false;
		try
		{
			await DeleteCategory.execute(this.#deleteCategory.id);
			isDeleted = true;
		}
		catch (error)
		{
			Center.notify({
				content: Text.encode(this.#getDeleteErrorMessage(error)),
			});
		}
		finally
		{
			this.#isDeleting = false;
			this.#deleteButton?.setWaiting(false);
		}

		if (isDeleted)
		{
			this.#isDeleteCompleted = true;
			this.#decreaseCategoryCount(1);
			this.#deleteDialog?.hide();
			this.#reloadGrid();
		}
	};

	#removeOpenEditQueryParameter(): void
	{
		const url = new URL(window.location.href);
		if (!url.searchParams.has('open_edit'))
		{
			return;
		}

		url.searchParams.delete('open_edit');
		window.history.replaceState(
			window.history.state,
			document.title,
			`${url.pathname}${url.search}${url.hash}`,
		);
	}
}
