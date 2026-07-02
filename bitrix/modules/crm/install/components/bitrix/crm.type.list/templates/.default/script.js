/* eslint-disable */
(function (crm_integration_analytics, crm_router, main_core, main_core_events, ui_analytics, ui_dialogs_messagebox) {
	'use strict';

	const namespace = main_core.Reflection.namespace('BX.Crm');
	class TypeListComponent {
		constructor(params) {
			if (main_core.Type.isPlainObject(params)) {
				if (main_core.Type.isString(params.gridId)) {
					this.gridId = params.gridId;
				}
				if (this.gridId && BX.Main.grid && BX.Main.gridManager) {
					this.grid = BX.Main.gridManager.getInstanceById(this.gridId);
				}
				if (main_core.Type.isElementNode(params.errorTextContainer)) {
					this.errorTextContainer = params.errorTextContainer;
				}
				if (main_core.Type.isElementNode(params.welcomeMessageContainer)) {
					this.welcomeMessageContainer = params.welcomeMessageContainer;
				}
				if (main_core.Type.isBoolean(params.isExternal)) {
					this.isExternal = params.isExternal;
				}
			}
		}
		init() {
			this.bindEvents();
		}
		bindEvents() {
			main_core_events.EventEmitter.subscribe('BX.Crm.TypeListComponent:onClickCreate', this.handleTypeCreate.bind(this));
			main_core_events.EventEmitter.subscribe('BX.Crm.TypeListComponent:onClickDelete', this.handleTypeDelete.bind(this));
			main_core_events.EventEmitter.subscribe('BX.Crm.TypeListComponent:onFilterByAutomatedSolution', this.handleFilterByAutomatedSolution.bind(this));
			main_core_events.EventEmitter.subscribe('BX.Crm.TypeListComponent:onResetFilterByAutomatedSolution', this.handleFilterByAutomatedSolution.bind(this));
			const toolbarComponent = this.getToolbarComponent();
			if (toolbarComponent) {
				/** @see BX.Crm.ToolbarComponent.subscribeTypeUpdatedEvent */
				toolbarComponent.subscribeTypeUpdatedEvent(event => {
					const isUrlChanged = main_core.Type.isObject(event.getData()) && event.getData().isUrlChanged === true;
					if (isUrlChanged) {
						window.location.reload();
						return;
					}
					if (this.gridId && main_core.Reflection.getClass('BX.Main.gridManager.reload')) {
						main_core.Dom.removeClass(document.getElementById('crm-type-list-container'), 'crm-type-list-grid-empty');
						BX.Main.gridManager.reload(this.gridId);
					}
				});
			}
		}
		showErrors(errors) {
			let text = '';
			errors.forEach(message => {
				text = `${text + message} `;
			});
			if (main_core.Type.isElementNode(this.errorTextContainer)) {
				this.errorTextContainer.innerText = text;
				main_core.Dom.style(this.errorTextContainer.parentElement, {
					display: 'block'
				});
			} else {
				console.error(text);
			}
		}
		hideErrors() {
			if (main_core.Type.isElementNode(this.errorTextContainer)) {
				this.errorTextContainer.innerText = '';
				main_core.Dom.style(this.errorTextContainer.parentElement, {
					display: 'none'
				});
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
		handleTypeCreate(event) {
			let {
				queryParams
			} = event.getData();
			if (!main_core.Type.isPlainObject(queryParams)) {
				queryParams = {};
			}
			const automatedSolutionId = this.#getAutomatedSolutionIdFromFilter();
			if (automatedSolutionId > 0) {
				queryParams.automatedSolutionId = automatedSolutionId;
			}
			void crm_router.Router.Instance.openTypeDetail(0, null, queryParams);
		}
		#getAutomatedSolutionIdFromFilter() {
			const {
				AUTOMATED_SOLUTION: automatedSolutionId
			} = this.#getCurrentFilter();
			if (main_core.Text.toInteger(automatedSolutionId) > 0) {
				return main_core.Text.toInteger(automatedSolutionId);
			}
			return null;
		}
		handleTypeDelete(event) {
			const id = main_core.Text.toInteger(event.data.id);
			if (!id) {
				this.showErrors([main_core.Loc.getMessage('CRM_TYPE_TYPE_NOT_FOUND')]);
				return;
			}
			const analyticsBuilder = new crm_integration_analytics.Builder.Automation.Type.DeleteEvent().setSubSection(crm_integration_analytics.Dictionary.ELEMENT_GRID_ROW_CONTEXT_MENU).setIsExternal(this.isExternal).setId(id);
			let isCancelRegistered = false;
			ui_dialogs_messagebox.MessageBox.show({
				title: main_core.Loc.getMessage('CRM_TYPE_TYPE_DELETE_CONFIRMATION_TITLE'),
				message: main_core.Loc.getMessage('CRM_TYPE_TYPE_DELETE_CONFIRMATION_MESSAGE'),
				modal: true,
				buttons: ui_dialogs_messagebox.MessageBoxButtons.YES_CANCEL,
				onYes: messageBox => {
					ui_analytics.sendData(analyticsBuilder.setStatus(crm_integration_analytics.Dictionary.STATUS_ATTEMPT).buildData());
					main_core.ajax.runAction('crm.controller.type.delete', {
						analyticsLabel: 'crmTypeListDeleteType',
						data: {
							id
						}
					}).then(response => {
						ui_analytics.sendData(analyticsBuilder.setStatus(crm_integration_analytics.Dictionary.STATUS_SUCCESS).buildData());
						const isUrlChanged = main_core.Type.isObject(response.data) && response.data.isUrlChanged === true;
						if (isUrlChanged) {
							window.location.reload();
							return;
						}
						this.grid.reloadTable();
					}).catch(response => {
						ui_analytics.sendData(analyticsBuilder.setStatus(crm_integration_analytics.Dictionary.STATUS_ERROR).buildData());
						this.showErrorsFromResponse(response);
					});
					messageBox.close();
				},
				onCancel: messageBox => {
					if (isCancelRegistered) {
						messageBox.close();
						return;
					}
					isCancelRegistered = true;
					ui_analytics.sendData(analyticsBuilder.setElement(crm_integration_analytics.Dictionary.ELEMENT_CANCEL_BUTTON).setStatus(crm_integration_analytics.Dictionary.STATUS_CANCEL).buildData());
					messageBox.close();
				},
				popupOptions: {
					events: {
						onPopupClose: () => {
							if (isCancelRegistered) {
								return;
							}
							isCancelRegistered = true;
							ui_analytics.sendData(analyticsBuilder.setElement(null).setStatus(crm_integration_analytics.Dictionary.STATUS_CANCEL).buildData());
						}
					}
				}
			});
		}
		// endregion

		getToolbarComponent() {
			if (main_core.Reflection.getClass('BX.Crm.ToolbarComponent')) {
				return BX.Crm.ToolbarComponent.Instance;
			}
			return null;
		}
		handleFilterByAutomatedSolution(event) {
			const data = {
				...this.#getCurrentFilter(),
				AUTOMATED_SOLUTION: event.data || null
			};
			const api = BX.Main.filterManager?.getList()[0]?.getApi();
			if (!api) {
				return;
			}
			api.setFields(data);
			api.apply();
		}
		#getCurrentFilter() {
			return BX.Main.filterManager?.getList()[0]?.getFilterFieldsValues() || {};
		}
	}
	namespace.TypeListComponent = TypeListComponent;

})(BX.Crm.Integration.Analytics, BX.Crm, BX, BX.Event, BX.UI.Analytics, BX.UI.Dialogs);
//# sourceMappingURL=script.js.map
