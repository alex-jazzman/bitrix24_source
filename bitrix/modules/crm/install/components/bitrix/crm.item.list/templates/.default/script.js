/* eslint-disable */
(function (crm_entityList_panel, crm_router, crm_settingsButtonExtender, main_core, main_core_events, ui_dialogs_messagebox) {
	'use strict';

	const namespace = main_core.Reflection.namespace('BX.Crm');
	class ItemListComponent {
		#isIframe = false;
		// is the list is embedded in another entity detail tab
		#isEmbedded = false;
		#settingsButtonExtenderParams;
		constructor(params) {
			this.exportPopups = {};
			if (main_core.Type.isPlainObject(params)) {
				this.entityTypeId = main_core.Text.toInteger(params.entityTypeId);
				this.entityTypeName = params.entityTypeName;
				this.categoryId = main_core.Text.toInteger(params.categoryId);
				this.analytics = main_core.Type.isPlainObject(params.analytics) ? params.analytics : {};
				if (main_core.Type.isString(params.gridId)) {
					this.gridId = params.gridId;
				}
				this.progressBarContainerId = String(params.progressBarContainerId);
				if (this.gridId && BX.Main.grid && BX.Main.gridManager) {
					this.grid = BX.Main.gridManager.getInstanceById(this.gridId);
					if (this.grid && params.backendUrl) {
						BX.addCustomEvent(window, "Grid::beforeRequest", (gridData, requestParams) => {
							if (!gridData.parent || gridData.parent !== this.grid) {
								return;
							}
							const currentUrl = new main_core.Uri(requestParams.url);
							const backendUrl = new main_core.Uri(params.backendUrl);
							if (currentUrl.getPath() !== backendUrl.getPath()) {
								currentUrl.setPath(backendUrl.getPath());
								currentUrl.setQueryParams({
									...currentUrl.getQueryParams(),
									...backendUrl.getQueryParams()
								});
							}
							requestParams.url = currentUrl.toString();
						});
					}
				}
				if (main_core.Type.isElementNode(params.errorTextContainer)) {
					this.errorTextContainer = params.errorTextContainer;
				}
				if (main_core.Type.isBoolean(params.isIframe)) {
					this.#isIframe = params.isIframe;
				}
				if (main_core.Type.isBoolean(params.isEmbedded)) {
					this.#isEmbedded = params.isEmbedded;
				}
				if (main_core.Type.isPlainObject(params.settingsButtonExtenderParams)) {
					this.#settingsButtonExtenderParams = params.settingsButtonExtenderParams;
				}
			}
			this.reloadGridTimeoutId = 0;
		}
		init() {
			this.bindEvents();
			this.#initSettingsButtonExtender();
			this.#initGridPanel();
		}
		bindEvents() {
			main_core_events.EventEmitter.subscribe('BX.Crm.ItemListComponent:onClickDelete', this.handleItemDelete.bind(this));
			main_core_events.EventEmitter.subscribe('BX.Crm.ItemListComponent:onStartExportCsv', event => {
				this.handleStartExport(event, 'csv');
			});
			main_core_events.EventEmitter.subscribe('BX.Crm.ItemListComponent:onStartExportExcel', event => {
				this.handleStartExport(event, 'excel');
			});
			const toolbarComponent = this.#getToolbarComponent();
			if (toolbarComponent) {
				toolbarComponent.subscribeTypeUpdatedEvent(() => {
					const newUrl = crm_router.Router.Instance.getItemListUrl(this.entityTypeId, this.categoryId);
					if (newUrl) {
						window.location.href = newUrl;
						return;
					}
					window.location.reload();
				});
				if (this.grid) {
					toolbarComponent.subscribeCategoriesUpdatedEvent(() => {
						this.reloadGridAfterTimeout();
					});
				}
			}
			main_core_events.EventEmitter.subscribe('Crm.EntityConverter.Converted', event => {
				const parameters = event.data;
				if (!main_core.Type.isArray(parameters) || !parameters[1]) {
					return;
				}
				const eventData = parameters[1];
				if (!this.entityTypeName || !eventData.entityTypeName) {
					return;
				}
				this.reloadGridAfterTimeout();
			});
			BX.Crm.EntityEvent.subscribeToEntityType(this.entityTypeId, () => this.reloadGridAfterTimeout());
			const addItemButton = document.querySelector('[data-role="add-new-item-button-' + this.gridId + '"]');
			if (addItemButton) {
				const detailUrl = addItemButton.href;
				addItemButton.href = "javascript: void(0);";
				main_core.Event.bind(addItemButton, 'click', event => {
					event.preventDefault();
					event.stopPropagation();
					main_core_events.EventEmitter.emit("BX.Crm.ItemListComponent:onAddNewItemButtonClick", {
						detailUrl,
						entityTypeId: this.entityTypeId
					});
				});
			}
		}
		#getToolbarComponent() {
			const component = main_core.Reflection.getClass('BX.Crm.ToolbarComponent');
			return component ? component.Instance : null;
		}
		#initSettingsButtonExtender() {
			if (this.#isIframe || this.#isEmbedded || !this.#settingsButtonExtenderParams) {
				return;
			}
			const toolbar = this.#getToolbarComponent();
			if (!toolbar) {
				console.error('BX.Crm.ToolbarComponent not found');
				return;
			}
			const settingsMenu = toolbar.getSettingsButton()?.getMenuWindow();
			if (settingsMenu) {
				this.#settingsButtonExtenderParams.grid = this.grid;
				this.#settingsButtonExtenderParams.rootMenu = settingsMenu;

				/** @see BX.Crm.SettingsButtonExtender */
				new crm_settingsButtonExtender.SettingsButtonExtender(this.#settingsButtonExtenderParams);
			}
		}
		#initGridPanel() {
			crm_entityList_panel.init({
				gridId: this.gridId,
				progressBarContainerId: this.progressBarContainerId
			});
		}
		reloadGridAfterTimeout() {
			if (!this.grid) {
				return;
			}
			if (this.reloadGridTimeoutId > 0) {
				clearTimeout(this.reloadGridTimeoutId);
				this.reloadGridTimeoutId = 0;
			}
			this.reloadGridTimeoutId = setTimeout(() => {
				this.grid.reload();
			}, 1000);
		}
		showErrors(errors) {
			let text = '';
			errors.forEach(message => {
				text = text + message + ' ';
			});
			if (main_core.Type.isElementNode(this.errorTextContainer)) {
				this.errorTextContainer.innerText = text;
				this.errorTextContainer.parentElement.style.display = 'block';
			} else {
				console.error(text);
			}
		}
		hideErrors() {
			if (main_core.Type.isElementNode(this.errorTextContainer)) {
				this.errorTextContainer.innerText = '';
				this.errorTextContainer.parentElement.style.display = 'none';
			}
		}
		showErrorsFromResponse({
			errors
		}) {
			const messages = [];
			errors.forEach(({
				message
			}) => messages.push(message));
			this.showErrors(messages);
		}

		// region EventHandlers
		handleItemDelete(event) {
			const entityTypeId = main_core.Text.toInteger(event.data.entityTypeId);
			const id = main_core.Text.toInteger(event.data.id);
			if (!entityTypeId) {
				this.showErrors([main_core.Loc.getMessage('CRM_TYPE_TYPE_NOT_FOUND')]);
				return;
			}
			if (!id) {
				this.showErrors([main_core.Loc.getMessage('CRM_TYPE_ITEM_NOT_FOUND')]);
				return;
			}
			ui_dialogs_messagebox.MessageBox.show({
				title: main_core.Loc.getMessage('CRM_TYPE_ITEM_DELETE_CONFIRMATION_TITLE'),
				message: main_core.Loc.getMessage('CRM_TYPE_ITEM_DELETE_CONFIRMATION_MESSAGE'),
				modal: true,
				buttons: ui_dialogs_messagebox.MessageBoxButtons.YES_CANCEL,
				onYes: messageBox => {
					main_core.ajax.runAction('crm.controller.item.delete', {
						data: {
							entityTypeId,
							id,
							analytics: this.analytics
						}
					}).then(() => {
						BX.UI.Notification.Center.notify({
							content: main_core.Loc.getMessage('CRM_TYPE_ITEM_DELETE_NOTIFICATION')
						});
						this.reloadGridAfterTimeout();
					}).catch(this.showErrorsFromResponse.bind(this));
					messageBox.close();
				}
			});
		}
		handleStartExport(event, exportType) {
			this.getExportPopup(exportType).then(process => process.showDialog());
		}
		//endregion

		getExportPopup(exportType) {
			if (this.exportPopups[exportType]) {
				return Promise.resolve(this.exportPopups[exportType]);
			}
			return main_core.Runtime.loadExtension('ui.stepprocessing').then(exports$1 => {
				this.exportPopups[exportType] = exports$1.ProcessManager.create({
					id: 'crm.item.list.export.' + exportType,
					controller: 'bitrix:crm.api.itemExport',
					queue: [{
						action: 'dispatcher'
					}],
					params: {
						SITE_ID: main_core.Loc.getMessage('SITE_ID'),
						entityTypeId: this.entityTypeId,
						categoryId: this.categoryId,
						EXPORT_TYPE: exportType,
						COMPONENT_NAME: 'bitrix:crm.item.list'
					},
					messages: {
						DialogTitle: main_core.Loc.getMessage('CRM_ITEM_EXPORT_' + exportType.toUpperCase() + '_TITLE'),
						DialogSummary: main_core.Loc.getMessage('CRM_ITEM_EXPORT_' + exportType.toUpperCase() + '_SUMMARY')
					},
					dialogMaxWidth: '650'
				});
				this.exportPopups[exportType].setHandler(BX.UI.StepProcessing.ProcessCallback.StepCompleted, (formatInner => {
					return () => {
						delete this.exportPopups[formatInner];
					};
				})(exportType));
				return this.exportPopups[exportType];
			});
		}
	}
	namespace.ItemListComponent = ItemListComponent;

})(BX.Crm.EntityList.Panel, BX.Crm, BX.Crm, BX, BX.Event, BX.UI.Dialogs);
//# sourceMappingURL=script.js.map
