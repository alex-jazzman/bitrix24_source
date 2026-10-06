/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
this.BX.Sign.V2.Grid = this.BX.Sign.V2.Grid || {};
(function (exports, main_core, ui_buttons, ui_dialogs_messagebox, ui_switcher, sign_featureStorage, sign_type, sign_v2_analytics, sign_v2_api, sign_v2_grid_components_actionPanel, sign_v2_grid_components_folder) {
	'use strict';

	const DEFAULT_METADATA_SELECTOR = '.sign-grid-template__cell-metadata';
	function buildMetadataFromElement(element) {
		return {
			id: Number(element.dataset.id),
			entityType: element.dataset.entityType,
			initiatedByType: element.dataset.initiatedByType,
			canEdit: element.dataset.canEdit,
			canDelete: element.dataset.canDelete,
			canEditAccess() {
				return Boolean(this.canEdit);
			},
			canDeleteAccess() {
				return Boolean(this.canDelete);
			}
		};
	}
	function extractRowMetadata(row, metadataSelector = DEFAULT_METADATA_SELECTOR) {
		const cellWithMetadataElement = [...row.getCells()].map(cell => cell.querySelector(metadataSelector)).find(element => element);
		if (!cellWithMetadataElement) {
			return null;
		}
		return buildMetadataFromElement(cellWithMetadataElement);
	}

	const SIGNERS_LIST_ENTITY_TYPE = 'signers-list';
	class Templates {
		#gridId;
		#addNewTemplateLink;
		#urlsForReload;
		constructor(gridId, addNewTemplateLink, urlsForReload) {
			this.#gridId = gridId;
			this.#addNewTemplateLink = addNewTemplateLink;
			this.#urlsForReload = urlsForReload;
		}
		#analytics = new sign_v2_analytics.Analytics();
		#api = new sign_v2_api.Api();
		#actionPanel = new sign_v2_grid_components_actionPanel.ActionPanel();
		#changeVisibilityForTemplate(templateId, visibility) {
			const api = this.#api.template;
			return api.changeVisibility(templateId, visibility);
		}
		#changeVisibilityForFolder(folderId, visibility) {
			const api = this.#api.templateFolder;
			return api.changeVisibility(folderId, visibility);
		}
		renderSendButton(entityId, entityType, templateIds, blockParams, preselectedSignersListId = 0) {
			if (entityId <= 0) {
				throw new Error('Invalid entityId must be greater than 0');
			}
			const validEntityTypes = ['template', 'folder'];
			if (!validEntityTypes.includes(entityType)) {
				throw new Error(`Invalid entityType must be one of ${validEntityTypes.join(', ')}`);
			}
			const button = new BX.UI.Button({
				text: main_core.Loc.getMessage('SIGN_B2E_EMPLOYEE_TEMPLATE_LIST_ACTION_BUTTON_LAUNCH_SIGNING'),
				color: BX.UI.Button.Color.SUCCESS,
				size: BX.UI.Button.Size.SMALL,
				round: true,
				disabled: blockParams.isBlocked
			});
			const buttonElement = button.render();
			if (blockParams.isNoCompaniesInFolder) {
				buttonElement.setAttribute('title', main_core.Loc.getMessage('SIGN_B2E_EMPLOYEE_TEMPLATE_LIST_ACTION_BUTTON_BLOCKED_HINT_EMPTY_FOLDER'));
			} else if (blockParams.isTemplateDisabled) {
				buttonElement.setAttribute('title', main_core.Loc.getMessage('SIGN_B2E_EMPLOYEE_TEMPLATE_LIST_ACTION_BUTTON_BLOCKED_HINT_TEMPLATE_DISABLED'));
			} else if (blockParams.isMultipleCompaniesInFolder) {
				buttonElement.setAttribute('title', main_core.Loc.getMessage('SIGN_B2E_EMPLOYEE_TEMPLATE_LIST_ACTION_BUTTON_BLOCKED_HINT_MULTIPLE_COMPANIES_IN_FOLDER'));
			} else if (blockParams.isInvisible && entityType === 'template') {
				buttonElement.setAttribute('title', main_core.Loc.getMessage('SIGN_B2E_EMPLOYEE_TEMPLATE_LIST_ACTION_BUTTON_BLOCKED_HINT_INVISIBLE_TEMPLATE'));
			} else if (blockParams.isInvisible && entityType === 'folder') {
				buttonElement.setAttribute('title', main_core.Loc.getMessage('SIGN_B2E_EMPLOYEE_TEMPLATE_LIST_ACTION_BUTTON_BLOCKED_HINT_INVISIBLE_FOLDER'));
			} else if (blockParams.hasAnyInvisibleTemplates) {
				buttonElement.setAttribute('title', main_core.Loc.getMessage('SIGN_B2E_EMPLOYEE_TEMPLATE_LIST_ACTION_BUTTON_BLOCKED_HINT_INVISIBLE_TEMPLATES_IN_FOLDER'));
			} else if (blockParams.hasNoReadAccess) {
				buttonElement.setAttribute('title', main_core.Loc.getMessage('SIGN_B2E_EMPLOYEE_TEMPLATE_LIST_ACTION_BUTTON_BLOCKED_HINT_NO_READ_ACCESS'));
			} else {
				BX.Event.bind(buttonElement, 'click', event => {
					event.preventDefault();
					event.stopPropagation();
					const sliderUrl = `sign-b2e-templates-settings-${entityId}-${entityType}`;
					BX.SidePanel.Instance.open(sliderUrl, {
						width: 900,
						cacheable: false,
						contentCallback: () => {
							return top.BX.Runtime.loadExtension(['sign.v2.b2e.sign-settings-templates']).then(exports => {
								const {
									B2ETemplatesSignSettings
								} = exports;
								const container = BX.Tag.render`<div id="sign-b2e-templates-settings-container-${entityId}-${entityType}"></div>`;
								const templatesSignSettings = new B2ETemplatesSignSettings(templateIds, sliderUrl, {
									preselectedSigners: this.#getPreselectedSigners(preselectedSignersListId)
								});
								templatesSignSettings.renderToContainer(container);
								return container;
							});
						}
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
		#getPreselectedSigners(signersListId) {
			if (signersListId <= 0) {
				return [];
			}
			return [{
				entityType: SIGNERS_LIST_ENTITY_TYPE,
				entityId: String(signersListId)
			}];
		}
		async renderSwitcher(entityId, entityType, isChecked, isDisabled, hasEditTemplateAccess) {
			const switcherNode = document.getElementById(`switcher_b2e_template_grid_${entityId}_${entityType}`);
			const switcher = new ui_switcher.Switcher({
				node: switcherNode,
				checked: isChecked,
				size: ui_switcher.SwitcherSize.medium,
				disabled: isDisabled,
				handlers: {
					toggled: async event => {
						event.stopPropagation();
						switcher.setLoading(true);
						const checked = switcher.isChecked();
						const visibility = checked ? 'visible' : 'invisible';
						try {
							switch (entityType) {
								case sign_type.TemplateEntity.template:
									await this.#changeVisibilityForTemplate(entityId, visibility);
									break;
								case sign_type.TemplateEntity.folder:
									await this.#changeVisibilityForFolder(entityId, visibility);
									break;
								default:
									await console.error(`Unknown entity type: ${entityType}`);
							}
							await this.reload();
						} catch {
							switcher.setLoading(false);
							switcher.check(!checked, false);
						} finally {
							this.#sendActionStateAnalytics(checked, entityId);
							switcher.setLoading(false);
						}
					}
				}
			});
			if (!isDisabled) {
				return;
			}
			let title = '';
			switch (entityType) {
				case sign_type.TemplateEntity.template:
					title = hasEditTemplateAccess ? main_core.Loc.getMessage('SIGN_TEMPLATE_BLOCKED_SWITCHER_HINT') : main_core.Loc.getMessage('SIGN_TEMPLATE_BLOCKED_SWITCHER_HINT_NO_ACCESS');
					break;
				case sign_type.TemplateEntity.folder:
					title = hasEditTemplateAccess ? main_core.Loc.getMessage('SIGN_TEMPLATE_FOLDER_BLOCKED_SWITCHER_HINT') : main_core.Loc.getMessage('SIGN_TEMPLATE_FOLDER_BLOCKED_SWITCHER_HINT_NO_ACCESS');
					break;
				default:
					title = '';
					break;
			}
			switcherNode.setAttribute('title', title);
		}
		#createFolderPopupTexts() {
			return {
				placeholder: main_core.Loc.getMessage('SIGN_TEMPLATE_GRID_CREATE_FOLDER_POPUP_INPUT_PLACEHOLDER'),
				createButtonText: main_core.Loc.getMessage('SIGN_TEMPLATE_GRID_CREATE_FOLDER_CREATE_BUTTON_TEXT'),
				saveButtonText: main_core.Loc.getMessage('SIGN_TEMPLATE_GRID_CREATE_FOLDER_SAVE_BUTTON_TEXT'),
				cancelButtonText: main_core.Loc.getMessage('SIGN_TEMPLATE_GRID_CREATE_FOLDER_CANCEL_BUTTON_TEXT'),
				emptyTitleNotification: main_core.Loc.getMessage('SIGN_TEMPLATE_GRID_CREATE_FOLDER_HINT_TITLE_NOT_EMPTY')
			};
		}
		createFolder() {
			const createFolderPopup = new sign_v2_grid_components_folder.CreateFolderPopup(this.#createFolderPopupTexts());
			createFolderPopup.subscribe('submit', async event => {
				const {
					title
				} = event.getData();
				try {
					await this.#api.templateFolder.create(title);
					window.top.BX.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('SIGN_TEMPLATE_GRID_CREATE_FOLDER_HINT_SUCCESS')
					});
				} catch {
					window.top.BX.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('SIGN_TEMPLATE_GRID_CREATE_FOLDER_HINT_FAIL')
					});
				}
				await this.reload();
			});
			createFolderPopup.show();
		}
		renameFolder(entityId, oldTitle) {
			const createFolderPopup = new sign_v2_grid_components_folder.CreateFolderPopup({
				...this.#createFolderPopupTexts(),
				initialTitle: oldTitle
			});
			createFolderPopup.subscribe('submit', async event => {
				const {
					title
				} = event.getData();
				try {
					await this.#api.templateFolder.rename(entityId, title);
					window.top.BX.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('SIGN_TEMPLATE_GRID_CREATE_FOLDER_HINT_RENAME_SUCCESS')
					});
				} catch {
					window.top.BX.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('SIGN_TEMPLATE_GRID_CREATE_FOLDER_HINT_RENAME_FAIL')
					});
				}
				await this.reload();
			});
			createFolderPopup.show();
		}
		#sendActionStateAnalytics(checked, templateId) {
			this.#analytics.send({
				category: 'templates',
				event: 'turn_on_off_template',
				type: 'manual',
				c_section: 'sign',
				c_sub_section: 'templates',
				c_element: checked ? 'on' : 'off',
				p5: `templateid_${templateId}`
			});
		}
		reload() {
			main_core.Event.ready(() => {
				const grid = this.#getFolderGrid() ?? this.#getTemplateListGrid();
				if (main_core.Type.isObject(grid)) {
					grid.reload();
				}
			});
		}
		#getFolderGrid() {
			return BX.SidePanel.Instance.getTopSlider()?.getFrameWindow().BX.Main.gridManager.getById(this.#gridId)?.instance;
		}
		#getTemplateListGrid() {
			return BX.Main.gridManager.getById(this.#gridId)?.instance;
		}
		reloadAfterSliderClose() {
			const context = window === top ? window : top;
			context.BX.Event.EventEmitter.subscribe('SidePanel.Slider:onCloseComplete', async event => {
				const closedSliderUrl = event.getData()[0].getSlider().getUrl();
				if (this.#shouldReloadAfterClose(closedSliderUrl)) {
					await this.reload();
				}
			});
		}
		#shouldReloadAfterClose(closedSliderUrl) {
			const uri = new main_core.Uri(closedSliderUrl);
			const path = uri.getPath();
			return closedSliderUrl === this.#addNewTemplateLink || closedSliderUrl === 'sign-settings-template-created' || this.#urlsForReload.some(url => path.startsWith(new main_core.Uri(url).getPath()));
		}
		async exportBlank(templateId) {
			try {
				const {
					json,
					filename
				} = await this.#api.template.exportBlank(templateId);
				const mimeType = 'application/json';
				this.#downloadStringLikeFile(json, filename, mimeType);
				window.top.BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('SIGN_TEMPLATE_GRID_EXPORT_BLANK_SUCCESS')
				});
			} catch (e) {
				console.error(e);
				window.top.BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('SIGN_TEMPLATE_GRID_EXPORT_BLANK_FAILURE')
				});
			}
		}
		#downloadStringLikeFile(data, filename, mimeType) {
			const blob = new Blob([data], {
				type: mimeType
			});
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			main_core.Dom.style(a, 'display', 'none');
			a.href = url;
			a.download = filename;
			main_core.Dom.append(a, document.body);
			a.click();
			window.URL.revokeObjectURL(url);
			main_core.Dom.remove(a);
		}
		async copyTemplate(templateId, folderId) {
			try {
				const response = await this.#api.template.copy(templateId, folderId);
				const copyTemplateId = response.template.id;
				await this.reload();
				window.top.BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('SIGN_TEMPLATE_GRID_COPY_HINT_SUCCESS')
				});
				if (window.top.BX.SidePanel && this.#addNewTemplateLink && copyTemplateId) {
					window.top.BX.SidePanel.Instance.open(`${this.#addNewTemplateLink}&templateId=${copyTemplateId}&stepId=changePartner&noRedirect=Y`);
				}
			} catch (error) {
				console.error('Error copying template:', error);
				window.top.BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('SIGN_TEMPLATE_GRID_COPY_HINT_FAIL')
				});
			}
		}
		#getSelectedItems() {
			const items = [];
			const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
			checkboxes.forEach(checkbox => {
				const id = checkbox.value;
				if (Number.isInteger(Number(id))) {
					const rowElement = checkbox.closest('tr');
					const entityElement = rowElement ? rowElement.querySelector('.sign-template-title, .sign-template-title-without-link') : null;
					const entityType = entityElement ? entityElement.getAttribute('data-entity-type') : null;
					items.push({
						id,
						entityType
					});
				}
			});
			return items;
		}
		#showDeleteConfirmationPopup(entityType, deleteOperation) {
			const texts = this.#getDeleteConfirmationTexts(entityType);
			const popup = new sign_v2_grid_components_folder.DeleteConfirmationPopup({
				title: texts.title,
				message: texts.message,
				confirmButtonText: main_core.Loc.getMessage('SIGN_TEMPLATE_GRID_DELETE_POPUP_YES'),
				cancelButtonText: main_core.Loc.getMessage('SIGN_TEMPLATE_GRID_DELETE_POPUP_NO'),
				onConfirm: async () => {
					try {
						await deleteOperation();
						window.top.BX.UI.Notification.Center.notify({
							content: texts.successNotification
						});
					} catch {
						if (entityType !== sign_type.TemplateEntity.folder) {
							window.top.BX.UI.Notification.Center.notify({
								content: texts.failNotification
							});
						}
					}
					await this.reload();
				}
			});
			popup.show();
		}
		#getDeleteConfirmationTexts(entityType) {
			switch (entityType) {
				case sign_type.TemplateEntity.template:
					return {
						title: main_core.Loc.getMessage('SIGN_TEMPLATE_DELETE_CONFIRMATION_TITLE'),
						message: main_core.Loc.getMessage('SIGN_TEMPLATE_DELETE_CONFIRMATION_MESSAGE'),
						successNotification: main_core.Loc.getMessage('SIGN_TEMPLATE_GRID_DELETE_HINT_SUCCESS'),
						failNotification: main_core.Loc.getMessage('SIGN_TEMPLATE_GRID_DELETE_HINT_FAIL')
					};
				case sign_type.TemplateEntity.folder:
					return {
						title: main_core.Loc.getMessage('SIGN_FOLDER_DELETE_CONFIRMATION_TITLE'),
						message: main_core.Loc.getMessage('SIGN_FOLDER_DELETE_CONFIRMATION_MESSAGE'),
						successNotification: main_core.Loc.getMessage('SIGN_FOLDER_GRID_DELETE_HINT_SUCCESS'),
						failNotification: main_core.Loc.getMessage('SIGN_FOLDER_GRID_DELETE_HINT_FAIL')
					};
				case sign_type.TemplateEntity.multiple:
					{
						const isFolderGroupingAllowed = sign_featureStorage.FeatureStorage.isTemplateFolderGroupingAllowed();
						return {
							title: main_core.Loc.getMessage('SIGN_MULTIPLE_DELETE_CONFIRMATION_TITLE'),
							message: main_core.Loc.getMessage(isFolderGroupingAllowed ? 'SIGN_MULTIPLE_DELETE_CONFIRMATION_MESSAGE' : 'SIGN_MULTIPLE_DELETE_TEMPLATES_CONFIRMATION_MESSAGE'),
							successNotification: main_core.Loc.getMessage(isFolderGroupingAllowed ? 'SIGN_MULTIPLE_GRID_DELETE_HINT_SUCCESS' : 'SIGN_MULTIPLE_GRID_DELETE_HINT_TEMPLATES_SUCCESS'),
							failNotification: main_core.Loc.getMessage(isFolderGroupingAllowed ? 'SIGN_MULTIPLE_GRID_DELETE_HINT_FAIL' : 'SIGN_MULTIPLE_GRID_DELETE_HINT_TEMPLATES_FAIL')
						};
					}
				default:
					throw new Error(`Unknown entity type: ${entityType}`);
			}
		}
		async delete(entityId, entityType) {
			this.#showDeleteConfirmationPopup(entityType, async () => {
				const api = this.#api;
				switch (entityType) {
					case sign_type.TemplateEntity.template:
						await api.template.delete(entityId);
						break;
					case sign_type.TemplateEntity.folder:
						await api.templateFolder.delete(entityId);
						break;
					default:
						throw new Error(`Unknown entity type: ${entityType}`);
				}
			});
		}
		async deleteSelectedItems() {
			const selectedItems = this.#getSelectedItems();
			if (selectedItems.length > 0) {
				this.#showDeleteConfirmationPopup(sign_type.TemplateEntity.multiple, async () => {
					await this.#api.template.deleteEntities(selectedItems);
				});
			}
		}
		async moveTemplatesToFolder(templateId = null) {
			const selectedItems = this.#getSelectedItems();
			if (selectedItems.length > 0 || templateId !== null) {
				const folderSelectionPopup = new sign_v2_grid_components_folder.FolderSelectionPopup({
					loadFolders: () => this.#api.templateFolder.getListByDepthLevel(0),
					rootItemTitle: main_core.Loc.getMessage('SIGN_TEMPLATE_GRID_MOVE_TO_FOLDER_POPUP_ROOT_LEVEL_ITEM')
				});
				folderSelectionPopup.subscribe('folderSelected', event => {
					this.selectedFolderId = event.getData().folderId;
				});
				const folderList = await folderSelectionPopup.show();
				ui_dialogs_messagebox.MessageBox.show({
					title: main_core.Loc.getMessage('SIGN_TEMPLATE_GRID_MOVE_TO_FOLDER_POPUP_TITLE'),
					message: folderList,
					modal: true,
					minWidth: 500,
					minHeight: 370,
					buttons: [new BX.UI.Button({
						useAirDesign: true,
						style: ui_buttons.AirButtonStyle.FILLED_SUCCESS,
						size: ui_buttons.ButtonSize.LARGE,
						text: main_core.Loc.getMessage('SIGN_TEMPLATE_GRID_MOVE_TO_FOLDER_POPUP_OK_BUTTON_TEXT'),
						onclick: async button => {
							if (this.selectedFolderId !== null && this.selectedFolderId !== undefined) {
								const selectedItem = {
									id: templateId,
									entityType: sign_type.TemplateEntity.template
								};
								const selectedTemplates = templateId === null ? selectedItems : [selectedItem];
								await this.#api.template.moveToFolder(selectedTemplates, Number(this.selectedFolderId));
								button.getContext().close();
								await this.reload();
							}
						}
					}), new BX.UI.Button({
						useAirDesign: true,
						style: ui_buttons.AirButtonStyle.PLAIN,
						size: ui_buttons.ButtonSize.LARGE,
						text: main_core.Loc.getMessage('SIGN_TEMPLATE_GRID_MOVE_TO_FOLDER_POPUP_CANCEL_BUTTON_TEXT'),
						onclick: button => {
							button.getContext().close();
						}
					})]
				});
			}
		}
		openSliderTemplateFolderContent(folderId = 0) {
			window.event.stopPropagation();
			if (BX.SidePanel && BX.SidePanel.Instance) {
				const basePath = folderId === 0 ? 'employee/templates/folder/' : 'templates/folder/';
				const queryParams = new URLSearchParams(window.location.search);
				const targetParams = new URLSearchParams({
					folderId: String(folderId)
				});

				// keep the group context of the send flow while navigating into a folder, otherwise
				// a template chosen inside it would open the wizard without the preselected group
				const signersListId = queryParams.get('signersListId');
				if (signersListId !== null) {
					targetParams.set('signersListId', signersListId);
				}
				const url = folderId !== 0 && queryParams.has('folderId') ? `?${targetParams.toString()}` : `${basePath}?${targetParams.toString()}`;
				BX.SidePanel.Instance.open(url, {
					width: 1650,
					cacheable: false,
					allowChangeHistory: true
				});
			}
		}
		subscribeOnGridEvents() {
			main_core.Event.ready(() => {
				const grid = this.#getFolderGrid() ?? this.#getTemplateListGrid();
				if (!main_core.Type.isObject(grid)) {
					return;
				}
				const gridTreeAttributesChangesMutationObserver = new MutationObserver(() => this.#onGridTreeAttributesMutate(grid));
				gridTreeAttributesChangesMutationObserver.observe(grid.getContainer(), {
					subtree: true,
					attributes: true
				});
			});
		}
		#onGridTreeAttributesMutate(grid) {
			const rows = grid.getRows().getRows();
			const isRowUnmovable = row => {
				const metadata = extractRowMetadata(row);
				if (main_core.Type.isNull(metadata)) {
					return true;
				}
				const isChecked = row.getCheckbox()?.checked;
				const isRestricted = metadata.entityType === sign_type.TemplateEntity.folder || metadata.initiatedByType === sign_type.DocumentInitiated.employee || !metadata.canEditAccess();
				return isRestricted && isChecked;
			};
			const allSelectedCellsAmount = parseInt(document.querySelector('[data-role="action-panel-total-param"]')?.textContent ?? '0', 10);
			const moveButtonId = 'sign-template-list-move-to-folder-button';
			const moveButtonTitle = main_core.Loc.getMessage('SIGN_TEMPLATE_GRID_MOVE_TO_FOLDER_GROUP_ACTION_BUTTON_DISABLED_HINT');
			const rowsWithoutHeaderAndHiddenRow = rows.slice(2);
			const isMoveDisabled = rowsWithoutHeaderAndHiddenRow.some(row => isRowUnmovable(row));
			this.#actionPanel.toggleActionButton(moveButtonId, !isMoveDisabled, moveButtonTitle);
			const isRowNonDeletable = row => {
				const metadata = extractRowMetadata(row);
				if (main_core.Type.isNull(metadata)) {
					return true;
				}
				const isChecked = row.getCheckbox()?.checked;
				return !metadata.canDeleteAccess() && isChecked;
			};
			const deleteButtonId = 'sign-template-list-delete-button';
			const deleteButtonTitle = sign_featureStorage.FeatureStorage.isTemplateFolderGroupingAllowed() ? main_core.Loc.getMessage('SIGN_TEMPLATE_GRID_DELETE_GROUP_ACTION_BUTTON_DISABLED_HINT') : main_core.Loc.getMessage('SIGN_TEMPLATE_GRID_DELETE_TEMPLATES_GROUP_ACTION_BUTTON_DISABLED_HINT');
			if (allSelectedCellsAmount <= 1) {
				this.#actionPanel.toggleActionButton(moveButtonId, !isMoveDisabled, moveButtonTitle);
				return;
			}
			const isDeleteDisabled = rowsWithoutHeaderAndHiddenRow.some(row => isRowNonDeletable(row));
			this.#actionPanel.toggleActionButton(deleteButtonId, !isDeleteDisabled, deleteButtonTitle);
		}
	}

	exports.Templates = Templates;

})(this.BX.Sign.V2.Grid.B2e = this.BX.Sign.V2.Grid.B2e || {}, BX, BX.UI, BX.UI.Dialogs, BX.UI, BX.Sign, BX.Sign, BX.Sign.V2, BX.Sign.V2, BX.Sign.V2.Grid.Components, BX.Sign.V2.Grid.Components);
//# sourceMappingURL=index.bundle.js.map
