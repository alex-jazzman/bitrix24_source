/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, ui_buttons, ui_notification, ui_system_dialog, ui_stepprocessing) {
	'use strict';

	const DELETE_ACTION = 'delete';
	const SELECTED_SCOPE = 'selected';
	const ALL_SCOPE = 'all';
	const FOR_ALL_VALUE = 'Y';
	const MEASURE_ID_PLACEHOLDER = '#measure_id#';
	const SLIDER_SAVE_STATUS_KEY = 'crmMeasureSaveSucceeded';
	class MeasureGrid {
		static #instances = new Map();
		#options;
		#grid;
		#process = null;
		#hasDeletedItems = false;
		#processGridReloaded = false;
		#originalRemoveSelected = null;
		#originalSendRowAction = null;
		#singleDeletePending = false;
		#batchDeletePending = false;
		constructor(options, grid) {
			this.#options = options;
			this.#grid = grid;
			this.#bindGridActions();
			this.#bindPageEvents();
		}
		static create(options) {
			MeasureGrid.#validateOptions(options);
			const grid = MeasureGrid.#getGrid(options.gridId);
			if (grid === null) {
				return null;
			}
			const existingInstance = MeasureGrid.#instances.get(options.gridId);
			if (existingInstance) {
				existingInstance.#reinitialize(options, grid);
				return existingInstance;
			}
			const instance = new MeasureGrid(options, grid);
			MeasureGrid.#instances.set(options.gridId, instance);
			return instance;
		}
		static handleEditAction(gridId, url) {
			const instance = MeasureGrid.#instances.get(gridId);
			if (!instance || !instance.#options.isSlider) {
				return true;
			}
			return !instance.#openEditSlider(url);
		}
		static #validateOptions(options) {
			if (!main_core.Type.isPlainObject(options) || !main_core.Type.isStringFilled(options.gridId) || !main_core.Type.isStringFilled(options.componentName) || !main_core.Type.isString(options.editUrlTemplate) || !main_core.Type.isBoolean(options.isSlider)) {
				throw new TypeError('Invalid MeasureGrid options.');
			}
		}
		static #getGrid(gridId) {
			if (!main_core.Reflection.getClass('BX.Main.gridManager.getInstanceById')) {
				return null;
			}
			return BX.Main.gridManager.getInstanceById(gridId) ?? null;
		}
		#reinitialize(options, grid) {
			this.#options = options;
			if (this.#grid === grid) {
				return;
			}
			this.#unbindGridActions();
			this.#grid = grid;
			this.#bindGridActions();
		}
		#bindGridActions() {
			this.#originalRemoveSelected = this.#grid.removeSelected;
			this.#originalSendRowAction = this.#grid.sendRowAction;
			this.#grid.removeSelected = this.#handleRemoveSelected;
			this.#grid.sendRowAction = this.#handleSendRowAction;
		}
		#unbindGridActions() {
			if (this.#grid.removeSelected === this.#handleRemoveSelected && this.#originalRemoveSelected) {
				this.#grid.removeSelected = this.#originalRemoveSelected;
			}
			if (this.#grid.sendRowAction === this.#handleSendRowAction && this.#originalSendRowAction) {
				this.#grid.sendRowAction = this.#originalSendRowAction;
			}
			this.#originalRemoveSelected = null;
			this.#originalSendRowAction = null;
		}
		#bindPageEvents() {
			main_core.Event.bind(document, 'click', this.#handleDocumentClick);
			main_core.Event.bind(window, 'unload', this.#destroy);
		}
		#unbindPageEvents() {
			main_core.Event.unbind(document, 'click', this.#handleDocumentClick);
			main_core.Event.unbind(window, 'unload', this.#destroy);
		}
		#destroy = () => {
			this.#unbindPageEvents();
			this.#unbindGridActions();
			MeasureGrid.#instances.delete(this.#options.gridId);
		};
		#handleDocumentClick = event => {
			if (!this.#options.isSlider || event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || !(event.target instanceof Element)) {
				return;
			}
			const link = event.target.closest('a[href]');
			if (!(link instanceof HTMLAnchorElement) || link.hasAttribute('download') || link.target !== '' && link.target !== '_self') {
				return;
			}
			const url = link.getAttribute('href');
			if (!this.#isEditUrl(url) || !this.#openEditSlider(url)) {
				return;
			}
			event.preventDefault();
		};
		#isEditUrl(url) {
			if (!main_core.Type.isStringFilled(url)) {
				return false;
			}
			const placeholderPosition = this.#options.editUrlTemplate.indexOf(MEASURE_ID_PLACEHOLDER);
			if (placeholderPosition < 0) {
				return false;
			}
			const prefix = this.#options.editUrlTemplate.slice(0, placeholderPosition);
			const suffix = this.#options.editUrlTemplate.slice(placeholderPosition + MEASURE_ID_PLACEHOLDER.length);
			const [urlPath] = url.split(/[#?]/);
			if (!urlPath.startsWith(prefix) || !urlPath.endsWith(suffix)) {
				return false;
			}
			const measureId = urlPath.slice(prefix.length, suffix === '' ? undefined : -suffix.length);
			return /^\d+$/.test(measureId);
		}
		#openEditSlider(url) {
			const sidePanel = main_core.Reflection.getClass('BX.SidePanel.Instance');
			if (!sidePanel || !main_core.Type.isFunction(sidePanel.open)) {
				return false;
			}
			sidePanel.open(url, {
				cacheable: false,
				events: {
					onClose: this.#handleEditSliderClose
				}
			});
			return true;
		}
		#handleEditSliderClose = event => {
			if (event.getSlider()?.getData().get(SLIDER_SAVE_STATUS_KEY) === true) {
				this.#grid.reload();
			}
		};
		#handleRemoveSelected = () => {
			if (this.#process && (this.#process.getState() === ui_stepprocessing.ProcessState.running || this.#process.getState() === ui_stepprocessing.ProcessState.canceling)) {
				this.#process.showDialog();
				return;
			}
			if (this.#batchDeletePending) {
				return;
			}
			const request = this.#getBatchDeleteRequest();
			if (request === null) {
				return;
			}
			this.#batchDeletePending = true;
			this.#showDeleteConfirmation('CRM_MEASURE_GRID_BATCH_DELETE_TITLE', 'CRM_MEASURE_GRID_BATCH_DELETE_WARNING', 'CRM_MEASURE_GRID_BATCH_DELETE_BUTTON', () => {
				this.#batchDeletePending = false;
				this.#startDeletion(request);
			}, () => {
				this.#batchDeletePending = false;
			});
		};
		#handleSendRowAction = (action, data = {}) => {
			if (action !== DELETE_ACTION) {
				this.#originalSendRowAction?.call(this.#grid, action, data);
				return;
			}
			const id = Number(data.id);
			if (!Number.isInteger(id) || id <= 0) {
				return;
			}
			if (this.#singleDeletePending) {
				return;
			}
			this.#singleDeletePending = true;
			this.#showDeleteConfirmation('CRM_MEASURE_GRID_SINGLE_DELETE_TITLE', 'CRM_MEASURE_GRID_SINGLE_DELETE_WARNING', 'CRM_MEASURE_GRID_SINGLE_DELETE_BUTTON', () => this.#deleteSingleItem(id), () => {
				this.#singleDeletePending = false;
			});
		};
		#showDeleteConfirmation(titleMessageId, warningMessageId, confirmButtonMessageId, onConfirm, onCancel) {
			let settled = false;
			const dialog = new ui_system_dialog.Dialog({
				title: main_core.Loc.getMessage(titleMessageId) ?? '',
				content: main_core.Tag.render`
				<div data-testid="crm-measure-delete-dialog-content">
					${main_core.Loc.getMessage(warningMessageId) ?? ''}
				</div>
			`,
				centerButtons: [new ui_buttons.Button({
					text: main_core.Loc.getMessage(confirmButtonMessageId) ?? '',
					dataset: {
						testid: 'crm-measure-delete-dialog-confirm-button'
					},
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.FILLED,
					useAirDesign: true,
					onclick: () => {
						if (settled) {
							return {};
						}
						settled = true;
						dialog.hide();
						onConfirm();
						return {};
					}
				}), new ui_buttons.CancelButton({
					dataset: {
						testid: 'crm-measure-delete-dialog-cancel-button'
					},
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.OUTLINE,
					useAirDesign: true,
					onclick: () => {
						dialog.hide();
						return {};
					}
				})],
				hasOverlay: true,
				closeByEsc: true,
				closeByClickOutside: true,
				events: {
					onShow: () => {},
					onAfterShow: () => {},
					onHide: () => {
						if (settled) {
							return;
						}
						settled = true;
						onCancel();
					},
					onAfterHide: () => {}
				}
			});
			dialog.show();
		}
		async #deleteSingleItem(id) {
			try {
				await main_core.ajax.runComponentAction(this.#options.componentName, 'deleteItem', {
					mode: 'class',
					data: {
						id
					}
				});
				this.#grid.reload();
			} catch (response) {
				const errorResponse = response;
				const serverMessage = errorResponse.errors?.[0]?.message;
				const message = main_core.Type.isStringFilled(serverMessage) ? serverMessage : main_core.Loc.getMessage('CRM_MEASURE_GRID_SINGLE_DELETE_ERROR') ?? '';
				BX.UI.Notification.Center.notify({
					content: main_core.Text.encode(message),
					autoHideDelay: 5000
				});
			} finally {
				this.#singleDeletePending = false;
			}
		}
		#getBatchDeleteRequest() {
			const actionPanelValues = this.#grid.getActionsPanel()?.getValues() ?? {};
			if (actionPanelValues[this.#grid.getForAllKey()] === FOR_ALL_VALUE) {
				return {
					scope: ALL_SCOPE
				};
			}
			const ids = this.#grid.getRows().getSelectedIds().map(id => Number(id)).filter(id => Number.isInteger(id) && id > 0);
			return ids.length > 0 ? {
				scope: SELECTED_SCOPE,
				ids
			} : null;
		}
		#startDeletion(request) {
			if (this.#process && (this.#process.getState() === ui_stepprocessing.ProcessState.running || this.#process.getState() === ui_stepprocessing.ProcessState.canceling)) {
				this.#process.showDialog();
				return;
			}
			this.#hasDeletedItems = false;
			this.#processGridReloaded = false;
			const processOptions = {
				id: `crm-measure-grid-delete-${this.#options.gridId}`,
				component: this.#options.componentName,
				componentMode: 'class',
				method: 'POST',
				params: request,
				messages: {
					DialogTitle: main_core.Loc.getMessage('CRM_MEASURE_GRID_PROCESS_TITLE') ?? '',
					DialogSummary: main_core.Loc.getMessage('CRM_MEASURE_GRID_PROCESS_SUMMARY') ?? ''
				},
				queue: [{
					action: DELETE_ACTION,
					title: main_core.Loc.getMessage('CRM_MEASURE_GRID_PROCESS_SUMMARY') ?? '',
					progressBarTitle: main_core.Loc.getMessage('CRM_MEASURE_GRID_PROCESS_PROGRESS') ?? '',
					handlers: {
						[ui_stepprocessing.ProcessCallback.StepCompleted]: this.#handleStepCompleted
					}
				}],
				handlers: {
					[ui_stepprocessing.ProcessCallback.RequestStart]: this.#handleRequestStart,
					[ui_stepprocessing.ProcessCallback.StateChanged]: this.#handleProcessStateChanged
				}
			};
			this.#process = ui_stepprocessing.ProcessManager.create(processOptions);
			this.#process.showDialog();
			this.#process.start();
		}
		#handleRequestStart = actionData => {
			const processToken = actionData.get('PROCESS_TOKEN');
			if (!main_core.Type.isStringFilled(processToken)) {
				return;
			}
			try {
				window.sessionStorage.setItem(this.#getProcessTokenStorageKey(), processToken);
			} catch {
			}
		};
		#handleStepCompleted = (status, result) => {
			if (status !== ui_stepprocessing.ProcessResultStatus.progress && status !== ui_stepprocessing.ProcessResultStatus.completed) {
				return;
			}
			const errors = main_core.Type.isArray(result.ERRORS) ? result.ERRORS : [];
			const errorMessages = errors.filter(error => main_core.Type.isPlainObject(error) && Number.isInteger(error.id) && error.id > 0 && main_core.Type.isStringFilled(error.message)).map(error => main_core.Loc.getMessage('CRM_MEASURE_GRID_PARTIAL_ERROR', {
				'#ID#': String(error.id),
				'#MESSAGE#': error.message
			}) ?? '');
			if (errorMessages.length > 0) {
				const errorList = errorMessages.map(message => main_core.Text.encode(message)).join('<br>');
				this.#process?.getDialog().setErrors([errorList], true);
			}
			if (main_core.Type.isNumber(result.DELETED_ITEMS) && result.DELETED_ITEMS > 0) {
				this.#hasDeletedItems = true;
			}
		};
		#handleProcessStateChanged = state => {
			if (state === ui_stepprocessing.ProcessState.completed || state === ui_stepprocessing.ProcessState.stopped || state === ui_stepprocessing.ProcessState.error) {
				this.#clearProcessToken();
				this.#reloadGridIfNeeded();
			}
		};
		#reloadGridIfNeeded() {
			if (!this.#hasDeletedItems || this.#processGridReloaded) {
				return;
			}
			this.#processGridReloaded = true;
			this.#grid.reload();
		}
		#clearProcessToken() {
			try {
				window.sessionStorage.removeItem(this.#getProcessTokenStorageKey());
			} catch {
			}
		}
		#getProcessTokenStorageKey() {
			return `crm.measure-grid.${this.#options.gridId}.process-token`;
		}
	}

	exports.MeasureGrid = MeasureGrid;

})(this.BX.Crm.Config = this.BX.Crm.Config || {}, BX, BX.UI, BX.UI.Notification, BX.UI.System, BX.UI.StepProcessing);
//# sourceMappingURL=measure-grid.bundle.js.map
