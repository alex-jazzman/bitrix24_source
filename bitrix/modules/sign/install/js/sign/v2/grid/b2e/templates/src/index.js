import { Dom, Event, Loc, Type, Uri } from 'main.core';
import { AirButtonStyle, ButtonSize } from 'ui.buttons';
import { MessageBox } from 'ui.dialogs.messagebox';
import { Switcher, SwitcherSize } from 'ui.switcher';

import { FeatureStorage } from 'sign.feature-storage';
import { DocumentInitiated, TemplateEntity, type TemplateEntityType } from 'sign.type';
import { Analytics } from 'sign.v2.analytics';
import { Api } from 'sign.v2.api';
import { ActionPanel } from 'sign.v2.grid.components.action-panel';
import { type PreselectedSignerEntity } from 'sign.v2.b2e.user-party';
import {
	CreateFolderPopup,
	DeleteConfirmationPopup,
	FolderSelectionPopup,
} from 'sign.v2.grid.components.folder';

import { extractRowMetadata } from './rows';
import { type sendBlockedParams } from './type';

type GridRow = BX.Grid.Row;

type TemplateSelectedEntity = {
	id: number;
	entityType: TemplateEntity.template | TemplateEntity.folder;
};

type DeleteConfirmationTexts = {
	title: string;
	message: string;
	successNotification: string;
	failNotification: string;
};

type Grid = BX.Main.grid;

const SIGNERS_LIST_ENTITY_TYPE = 'signers-list';

export class Templates
{
	#gridId: string;
	#addNewTemplateLink: string;
	#urlsForReload: string[];

	constructor(gridId: string, addNewTemplateLink: string, urlsForReload: string[])
	{
		this.#gridId = gridId;
		this.#addNewTemplateLink = addNewTemplateLink;
		this.#urlsForReload = urlsForReload;
	}

	#analytics = new Analytics();
	#api = new Api();
	#actionPanel = new ActionPanel();

	#changeVisibilityForTemplate(templateId: number, visibility: string): Promise<any>
	{
		const api = this.#api.template;

		return api.changeVisibility(templateId, visibility);
	}

	#changeVisibilityForFolder(folderId: number, visibility: string): Promise<any>
	{
		const api = this.#api.templateFolder;

		return api.changeVisibility(folderId, visibility);
	}

	renderSendButton(
		entityId: number,
		entityType: string,
		templateIds: number[],
		blockParams: sendBlockedParams,
		preselectedSignersListId: number = 0,
	): HTMLElement
	{
		if (entityId <= 0)
		{
			throw new Error('Invalid entityId must be greater than 0');
		}

		const validEntityTypes = ['template', 'folder'];
		if (!validEntityTypes.includes(entityType))
		{
			throw new Error(`Invalid entityType must be one of ${validEntityTypes.join(', ')}`);
		}

		const button = new BX.UI.Button({
			text: Loc.getMessage('SIGN_B2E_EMPLOYEE_TEMPLATE_LIST_ACTION_BUTTON_LAUNCH_SIGNING'),
			color: BX.UI.Button.Color.SUCCESS,
			size: BX.UI.Button.Size.SMALL,
			round: true,
			disabled: blockParams.isBlocked,
		});

		const buttonElement = button.render();

		if (blockParams.isNoCompaniesInFolder)
		{
			buttonElement.setAttribute('title', Loc.getMessage('SIGN_B2E_EMPLOYEE_TEMPLATE_LIST_ACTION_BUTTON_BLOCKED_HINT_EMPTY_FOLDER'));
		}
		else if (blockParams.isTemplateDisabled)
		{
			buttonElement.setAttribute('title', Loc.getMessage('SIGN_B2E_EMPLOYEE_TEMPLATE_LIST_ACTION_BUTTON_BLOCKED_HINT_TEMPLATE_DISABLED'));
		}
		else if (blockParams.isMultipleCompaniesInFolder)
		{
			buttonElement.setAttribute('title', Loc.getMessage('SIGN_B2E_EMPLOYEE_TEMPLATE_LIST_ACTION_BUTTON_BLOCKED_HINT_MULTIPLE_COMPANIES_IN_FOLDER'));
		}
		else if (blockParams.isInvisible && entityType === 'template')
		{
			buttonElement.setAttribute('title', Loc.getMessage('SIGN_B2E_EMPLOYEE_TEMPLATE_LIST_ACTION_BUTTON_BLOCKED_HINT_INVISIBLE_TEMPLATE'));
		}
		else if (blockParams.isInvisible && entityType === 'folder')
		{
			buttonElement.setAttribute('title', Loc.getMessage('SIGN_B2E_EMPLOYEE_TEMPLATE_LIST_ACTION_BUTTON_BLOCKED_HINT_INVISIBLE_FOLDER'));
		}
		else if (blockParams.hasAnyInvisibleTemplates)
		{
			buttonElement.setAttribute('title', Loc.getMessage('SIGN_B2E_EMPLOYEE_TEMPLATE_LIST_ACTION_BUTTON_BLOCKED_HINT_INVISIBLE_TEMPLATES_IN_FOLDER'));
		}
		else if (blockParams.hasNoReadAccess)
		{
			buttonElement.setAttribute('title', Loc.getMessage('SIGN_B2E_EMPLOYEE_TEMPLATE_LIST_ACTION_BUTTON_BLOCKED_HINT_NO_READ_ACCESS'));
		}
		else
		{
			BX.Event.bind(buttonElement, 'click', (event: MouseEvent): void => {
				event.preventDefault();
				event.stopPropagation();

				const sliderUrl = `sign-b2e-templates-settings-${entityId}-${entityType}`;
				BX.SidePanel.Instance.open(sliderUrl, {
					width: 900,
					cacheable: false,
					contentCallback: (): Promise<HTMLElement> => {
						return top.BX.Runtime.loadExtension(['sign.v2.b2e.sign-settings-templates']).then((exports) => {
							const { B2ETemplatesSignSettings } = exports;
							const container = BX.Tag.render`<div id="sign-b2e-templates-settings-container-${entityId}-${entityType}"></div>`;
							const templatesSignSettings = new B2ETemplatesSignSettings(templateIds, sliderUrl, {
								preselectedSigners: this.#getPreselectedSigners(preselectedSignersListId),
							});
							templatesSignSettings.renderToContainer(container);

							return container;
						});
					},
				});
			});
		}

		return buttonElement;
	}

	/**
	 * Group the send flow was started for, as a signers list entity of the signers step.
	 * The group is never expanded into its employees here: the server does that when the
	 * signers are saved, so the set is fixed at the moment of sending.
	 */
	#getPreselectedSigners(signersListId: number): PreselectedSignerEntity[]
	{
		if (signersListId <= 0)
		{
			return [];
		}

		return [{ entityType: SIGNERS_LIST_ENTITY_TYPE, entityId: String(signersListId) }];
	}

	async renderSwitcher(
		entityId: number,
		entityType: TemplateEntityType,
		isChecked: boolean,
		isDisabled: boolean,
		hasEditTemplateAccess?: boolean,
	): Promise<void>
	{
		const switcherNode = document.getElementById(`switcher_b2e_template_grid_${entityId}_${entityType}`);
		const switcher = new Switcher({
			node: switcherNode,
			checked: isChecked,
			size: SwitcherSize.medium,
			disabled: isDisabled,
			handlers: {
				toggled: async (event) => {
					event.stopPropagation();
					switcher.setLoading(true);
					const checked = switcher.isChecked();
					const visibility = checked ? 'visible' : 'invisible';
					try
					{
						switch (entityType)
						{
							case TemplateEntity.template:
								await this.#changeVisibilityForTemplate(entityId, visibility);
								break;
							case TemplateEntity.folder:
								await this.#changeVisibilityForFolder(entityId, visibility);
								break;
							default:
								await console.error(`Unknown entity type: ${entityType}`);
						}
						await this.reload();
					}
					catch
					{
						switcher.setLoading(false);
						switcher.check(!checked, false);
					}
					finally
					{
						this.#sendActionStateAnalytics(checked, entityId);
						switcher.setLoading(false);
					}
				},
			},
		});

		if (!isDisabled)
		{
			return;
		}

		let title = '';
		switch (entityType)
		{
			case TemplateEntity.template:
				title = hasEditTemplateAccess
					? Loc.getMessage('SIGN_TEMPLATE_BLOCKED_SWITCHER_HINT')
					: Loc.getMessage('SIGN_TEMPLATE_BLOCKED_SWITCHER_HINT_NO_ACCESS');
				break;
			case TemplateEntity.folder:
				title = hasEditTemplateAccess
					? Loc.getMessage('SIGN_TEMPLATE_FOLDER_BLOCKED_SWITCHER_HINT')
					: Loc.getMessage('SIGN_TEMPLATE_FOLDER_BLOCKED_SWITCHER_HINT_NO_ACCESS');
				break;
			default:
				title = '';
				break;
		}

		switcherNode.setAttribute('title', title);
	}

	#createFolderPopupTexts(): Object
	{
		return {
			placeholder: Loc.getMessage('SIGN_TEMPLATE_GRID_CREATE_FOLDER_POPUP_INPUT_PLACEHOLDER'),
			createButtonText: Loc.getMessage('SIGN_TEMPLATE_GRID_CREATE_FOLDER_CREATE_BUTTON_TEXT'),
			saveButtonText: Loc.getMessage('SIGN_TEMPLATE_GRID_CREATE_FOLDER_SAVE_BUTTON_TEXT'),
			cancelButtonText: Loc.getMessage('SIGN_TEMPLATE_GRID_CREATE_FOLDER_CANCEL_BUTTON_TEXT'),
			emptyTitleNotification: Loc.getMessage('SIGN_TEMPLATE_GRID_CREATE_FOLDER_HINT_TITLE_NOT_EMPTY'),
		};
	}

	createFolder(): void
	{
		const createFolderPopup = new CreateFolderPopup(this.#createFolderPopupTexts());
		createFolderPopup.subscribe('submit', async (event) => {
			const { title } = event.getData();
			try
			{
				await this.#api.templateFolder.create(title);
				window.top.BX.UI.Notification.Center.notify({
					content: Loc.getMessage('SIGN_TEMPLATE_GRID_CREATE_FOLDER_HINT_SUCCESS'),
				});
			}
			catch
			{
				window.top.BX.UI.Notification.Center.notify({
					content: Loc.getMessage('SIGN_TEMPLATE_GRID_CREATE_FOLDER_HINT_FAIL'),
				});
			}

			await this.reload();
		});
		createFolderPopup.show();
	}

	renameFolder(entityId: number, oldTitle: string): void
	{
		const createFolderPopup = new CreateFolderPopup({
			...this.#createFolderPopupTexts(),
			initialTitle: oldTitle,
		});
		createFolderPopup.subscribe('submit', async (event) => {
			const { title } = event.getData();
			try
			{
				await this.#api.templateFolder.rename(entityId, title);
				window.top.BX.UI.Notification.Center.notify({
					content: Loc.getMessage('SIGN_TEMPLATE_GRID_CREATE_FOLDER_HINT_RENAME_SUCCESS'),
				});
			}
			catch
			{
				window.top.BX.UI.Notification.Center.notify({
					content: Loc.getMessage('SIGN_TEMPLATE_GRID_CREATE_FOLDER_HINT_RENAME_FAIL'),
				});
			}

			await this.reload();
		});
		createFolderPopup.show();
	}

	#sendActionStateAnalytics(checked: boolean, templateId: number): void
	{
		this.#analytics.send({
			category: 'templates',
			event: 'turn_on_off_template',
			type: 'manual',
			c_section: 'sign',
			c_sub_section: 'templates',
			c_element: checked ? 'on' : 'off',
			p5: `templateid_${templateId}`,
		});
	}

	reload(): Promise<void>
	{
		Event.ready(() => {
			const grid = this.#getFolderGrid() ?? this.#getTemplateListGrid();
			if (Type.isObject(grid))
			{
				grid.reload();
			}
		});
	}

	#getFolderGrid(): ?Grid
	{
		return BX.SidePanel.Instance.getTopSlider()?.getFrameWindow().BX.Main.gridManager.getById(this.#gridId)?.instance;
	}

	#getTemplateListGrid(): ?Grid
	{
		return BX.Main.gridManager.getById(this.#gridId)?.instance;
	}

	reloadAfterSliderClose(): void
	{
		const context = window === top ? window : top;

		context.BX.Event.EventEmitter.subscribe('SidePanel.Slider:onCloseComplete', async (event) => {
			const closedSliderUrl = event.getData()[0].getSlider().getUrl();

			if (this.#shouldReloadAfterClose(closedSliderUrl))
			{
				await this.reload();
			}
		});
	}

	#shouldReloadAfterClose(closedSliderUrl: string): boolean
	{
		const uri = new Uri(closedSliderUrl);
		const path = uri.getPath();

		return closedSliderUrl === this.#addNewTemplateLink
			|| closedSliderUrl === 'sign-settings-template-created'
			|| this.#urlsForReload.some((url) => path.startsWith(new Uri(url).getPath()));
	}

	async exportBlank(templateId: number): Promise<void>
	{
		try
		{
			const { json, filename } = await this.#api.template.exportBlank(templateId);
			const mimeType = 'application/json';
			this.#downloadStringLikeFile(json, filename, mimeType);

			window.top.BX.UI.Notification.Center.notify({
				content: Loc.getMessage('SIGN_TEMPLATE_GRID_EXPORT_BLANK_SUCCESS'),
			});
		}
		catch (e)
		{
			console.error(e);
			window.top.BX.UI.Notification.Center.notify({
				content: Loc.getMessage('SIGN_TEMPLATE_GRID_EXPORT_BLANK_FAILURE'),
			});
		}
	}

	#downloadStringLikeFile(data: string, filename: string, mimeType: string): void
	{
		const blob = new Blob([data], { type: mimeType });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		Dom.style(a, 'display', 'none');
		a.href = url;
		a.download = filename;
		Dom.append(a, document.body);
		a.click();
		window.URL.revokeObjectURL(url);
		Dom.remove(a);
	}

	async copyTemplate(templateId: number, folderId: number): Promise<void>
	{
		try
		{
			const response = await this.#api.template.copy(templateId, folderId);
			const copyTemplateId = response.template.id;

			await this.reload();

			window.top.BX.UI.Notification.Center.notify({
				content: Loc.getMessage('SIGN_TEMPLATE_GRID_COPY_HINT_SUCCESS'),
			});

			if (window.top.BX.SidePanel && this.#addNewTemplateLink && copyTemplateId)
			{
				window.top.BX.SidePanel.Instance.open(
					`${this.#addNewTemplateLink}&templateId=${copyTemplateId}&stepId=changePartner&noRedirect=Y`,
				);
			}
		}
		catch (error)
		{
			console.error('Error copying template:', error);
			window.top.BX.UI.Notification.Center.notify({
				content: Loc.getMessage('SIGN_TEMPLATE_GRID_COPY_HINT_FAIL'),
			});
		}
	}

	#getSelectedItems(): TemplateSelectedEntity
	{
		const items = [];
		const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
		checkboxes.forEach((checkbox) => {
			const id = checkbox.value;

			if (Number.isInteger(Number(id)))
			{
				const rowElement = checkbox.closest('tr');
				const entityElement = rowElement
					? rowElement.querySelector('.sign-template-title, .sign-template-title-without-link')
					: null;
				const entityType = entityElement
					? entityElement.getAttribute('data-entity-type')
					: null;

				items.push({
					id,
					entityType,
				});
			}
		});

		return items;
	}

	#showDeleteConfirmationPopup(
		entityType: TemplateEntityType,
		deleteOperation: () => Promise<void>,
	): void
	{
		const texts = this.#getDeleteConfirmationTexts(entityType);
		const popup = new DeleteConfirmationPopup({
			title: texts.title,
			message: texts.message,
			confirmButtonText: Loc.getMessage('SIGN_TEMPLATE_GRID_DELETE_POPUP_YES'),
			cancelButtonText: Loc.getMessage('SIGN_TEMPLATE_GRID_DELETE_POPUP_NO'),
			onConfirm: async () => {
				try
				{
					await deleteOperation();
					window.top.BX.UI.Notification.Center.notify({
						content: texts.successNotification,
					});
				}
				catch
				{
					if (entityType !== TemplateEntity.folder)
					{
						window.top.BX.UI.Notification.Center.notify({
							content: texts.failNotification,
						});
					}
				}

				await this.reload();
			},
		});

		popup.show();
	}

	#getDeleteConfirmationTexts(entityType: TemplateEntityType): DeleteConfirmationTexts
	{
		switch (entityType)
		{
			case TemplateEntity.template:
				return {
					title: Loc.getMessage('SIGN_TEMPLATE_DELETE_CONFIRMATION_TITLE'),
					message: Loc.getMessage('SIGN_TEMPLATE_DELETE_CONFIRMATION_MESSAGE'),
					successNotification: Loc.getMessage('SIGN_TEMPLATE_GRID_DELETE_HINT_SUCCESS'),
					failNotification: Loc.getMessage('SIGN_TEMPLATE_GRID_DELETE_HINT_FAIL'),
				};
			case TemplateEntity.folder:
				return {
					title: Loc.getMessage('SIGN_FOLDER_DELETE_CONFIRMATION_TITLE'),
					message: Loc.getMessage('SIGN_FOLDER_DELETE_CONFIRMATION_MESSAGE'),
					successNotification: Loc.getMessage('SIGN_FOLDER_GRID_DELETE_HINT_SUCCESS'),
					failNotification: Loc.getMessage('SIGN_FOLDER_GRID_DELETE_HINT_FAIL'),
				};
			case TemplateEntity.multiple:
			{
				const isFolderGroupingAllowed = FeatureStorage.isTemplateFolderGroupingAllowed();

				return {
					title: Loc.getMessage('SIGN_MULTIPLE_DELETE_CONFIRMATION_TITLE'),
					message: Loc.getMessage(isFolderGroupingAllowed
						? 'SIGN_MULTIPLE_DELETE_CONFIRMATION_MESSAGE'
						: 'SIGN_MULTIPLE_DELETE_TEMPLATES_CONFIRMATION_MESSAGE'),
					successNotification: Loc.getMessage(isFolderGroupingAllowed
						? 'SIGN_MULTIPLE_GRID_DELETE_HINT_SUCCESS'
						: 'SIGN_MULTIPLE_GRID_DELETE_HINT_TEMPLATES_SUCCESS'),
					failNotification: Loc.getMessage(isFolderGroupingAllowed
						? 'SIGN_MULTIPLE_GRID_DELETE_HINT_FAIL'
						: 'SIGN_MULTIPLE_GRID_DELETE_HINT_TEMPLATES_FAIL'),
				};
			}
			default:
				throw new Error(`Unknown entity type: ${entityType}`);
		}
	}

	async delete(entityId: number, entityType: TemplateEntityType)
	{
		this.#showDeleteConfirmationPopup(entityType, async () => {
			const api = this.#api;
			switch (entityType)
			{
				case TemplateEntity.template:
					await api.template.delete(entityId);
					break;
				case TemplateEntity.folder:
					await api.templateFolder.delete(entityId);
					break;
				default:
					throw new Error(`Unknown entity type: ${entityType}`);
			}
		});
	}

	async deleteSelectedItems(): Promise<void>
	{
		const selectedItems = this.#getSelectedItems();
		if (selectedItems.length > 0)
		{
			this.#showDeleteConfirmationPopup(TemplateEntity.multiple, async () => {
				await this.#api.template.deleteEntities(selectedItems);
			});
		}
	}

	async moveTemplatesToFolder(templateId: number | null = null): void
	{
		const selectedItems = this.#getSelectedItems();
		if (selectedItems.length > 0 || templateId !== null)
		{
			const folderSelectionPopup = new FolderSelectionPopup({
				loadFolders: () => this.#api.templateFolder.getListByDepthLevel(0),
				rootItemTitle: Loc.getMessage('SIGN_TEMPLATE_GRID_MOVE_TO_FOLDER_POPUP_ROOT_LEVEL_ITEM'),
			});
			folderSelectionPopup.subscribe('folderSelected', (event) => {
				this.selectedFolderId = event.getData().folderId;
			});
			const folderList = await folderSelectionPopup.show();

			MessageBox.show({
				title: Loc.getMessage('SIGN_TEMPLATE_GRID_MOVE_TO_FOLDER_POPUP_TITLE'),
				message: folderList,
				modal: true,
				minWidth: 500,
				minHeight: 370,
				buttons: [
					new BX.UI.Button({
						useAirDesign: true,
						style: AirButtonStyle.FILLED_SUCCESS,
						size: ButtonSize.LARGE,
						text: Loc.getMessage('SIGN_TEMPLATE_GRID_MOVE_TO_FOLDER_POPUP_OK_BUTTON_TEXT'),
						onclick: async (button) => {
							if (this.selectedFolderId !== null && this.selectedFolderId !== undefined)
							{
								const selectedItem = { id: templateId, entityType: TemplateEntity.template };
								const selectedTemplates = templateId === null ? selectedItems : [selectedItem];
								await this.#api.template.moveToFolder(selectedTemplates, Number(this.selectedFolderId));
								button.getContext().close();
								await this.reload();
							}
						},
					}),
					new BX.UI.Button({
						useAirDesign: true,
						style: AirButtonStyle.PLAIN,
						size: ButtonSize.LARGE,
						text: Loc.getMessage('SIGN_TEMPLATE_GRID_MOVE_TO_FOLDER_POPUP_CANCEL_BUTTON_TEXT'),
						onclick: (button) => {
							button.getContext().close();
						},
					}),
				],
			});
		}
	}

	openSliderTemplateFolderContent(folderId: number = 0): boolean | any
	{
		window.event.stopPropagation();
		if (BX.SidePanel && BX.SidePanel.Instance)
		{
			const basePath = folderId === 0 ? 'employee/templates/folder/' : 'templates/folder/';

			const queryParams = new URLSearchParams(window.location.search);
			const targetParams = new URLSearchParams({ folderId: String(folderId) });

			// keep the group context of the send flow while navigating into a folder, otherwise
			// a template chosen inside it would open the wizard without the preselected group
			const signersListId = queryParams.get('signersListId');
			if (signersListId !== null)
			{
				targetParams.set('signersListId', signersListId);
			}

			const url = (folderId !== 0 && queryParams.has('folderId'))
				? `?${targetParams.toString()}`
				: `${basePath}?${targetParams.toString()}`;

			BX.SidePanel.Instance.open(url, {
				width: 1650,
				cacheable: false,
				allowChangeHistory: true,
			});
		}
	}

	subscribeOnGridEvents(): void
	{
		Event.ready(() => {
			const grid: ?Grid = this.#getFolderGrid() ?? this.#getTemplateListGrid();
			if (!Type.isObject(grid))
			{
				return;
			}

			const gridTreeAttributesChangesMutationObserver = new MutationObserver(
				() => this.#onGridTreeAttributesMutate(grid),
			);
			gridTreeAttributesChangesMutationObserver.observe(grid.getContainer(), { subtree: true, attributes: true });
		});
	}

	#onGridTreeAttributesMutate(grid: Grid): void
	{
		const rows: GridRow[] = grid.getRows().getRows();
		const isRowUnmovable = (row: GridRow): boolean => {
			const metadata = extractRowMetadata(row);
			if (Type.isNull(metadata))
			{
				return true;
			}

			const isChecked = row.getCheckbox()?.checked;
			const isRestricted = metadata.entityType === TemplateEntity.folder
				|| metadata.initiatedByType === DocumentInitiated.employee
				|| !metadata.canEditAccess()
			;

			return isRestricted && isChecked;
		};

		const allSelectedCellsAmount = parseInt(
			document.querySelector('[data-role="action-panel-total-param"]')?.textContent ?? '0',
			10,
		);

		const moveButtonId = 'sign-template-list-move-to-folder-button';
		const moveButtonTitle = Loc.getMessage('SIGN_TEMPLATE_GRID_MOVE_TO_FOLDER_GROUP_ACTION_BUTTON_DISABLED_HINT');

		const rowsWithoutHeaderAndHiddenRow = rows.slice(2);

		const isMoveDisabled = rowsWithoutHeaderAndHiddenRow
			.some((row) => isRowUnmovable(row));

		this.#actionPanel.toggleActionButton(moveButtonId, !isMoveDisabled, moveButtonTitle);

		const isRowNonDeletable = (row: GridRow): boolean => {
			const metadata = extractRowMetadata(row);
			if (Type.isNull(metadata))
			{
				return true;
			}

			const isChecked = row.getCheckbox()?.checked;

			return !metadata.canDeleteAccess() && isChecked;
		};

		const deleteButtonId = 'sign-template-list-delete-button';
		const deleteButtonTitle = FeatureStorage.isTemplateFolderGroupingAllowed()
			? Loc.getMessage('SIGN_TEMPLATE_GRID_DELETE_GROUP_ACTION_BUTTON_DISABLED_HINT')
			: Loc.getMessage('SIGN_TEMPLATE_GRID_DELETE_TEMPLATES_GROUP_ACTION_BUTTON_DISABLED_HINT');

		if (allSelectedCellsAmount <= 1)
		{
			this.#actionPanel.toggleActionButton(moveButtonId, !isMoveDisabled, moveButtonTitle);

			return;
		}

		const isDeleteDisabled = rowsWithoutHeaderAndHiddenRow
			.some((row) => isRowNonDeletable(row));

		this.#actionPanel.toggleActionButton(deleteButtonId, !isDeleteDisabled, deleteButtonTitle);
	}
}
