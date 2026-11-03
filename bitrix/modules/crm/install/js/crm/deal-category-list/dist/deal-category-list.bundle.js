/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, ui_buttons, ui_notification) {
	'use strict';

	class CategoryApi {
		async delete(id) {
			await main_core.ajax.runAction('crm.api.dealcategory.grid.delete', {
				data: {
					id
				}
			});
		}
		async save(category, fields) {
			const action = category === null ? 'add' : 'update';
			const data = category === null ? {
				fields
			} : {
				id: category.id,
				fields
			};
			const response = await main_core.ajax.runAction(`crm.api.dealcategory.grid.${action}`, {
				data
			});
			return response.data.category;
		}
	}
	const categoryApi = new CategoryApi();

	class DeleteCategory {
		static async execute(id) {
			await categoryApi.delete(id);
		}
	}

	class EditDialog {
		#category;
		#onSave;
		#api;
		#dependencies;
		#nameInput;
		#sortInput;
		#saveButton;
		#dialog;
		#isSaving = false;
		#isCompleted = false;
		static show(options, dependencies) {
			const dialog = new EditDialog(options, dependencies);
			dialog.show();
			return dialog;
		}
		constructor(options, dependencies) {
			this.#category = options.category ?? null;
			this.#onSave = options.onSave;
			this.#api = options.api ?? categoryApi;
			this.#dependencies = dependencies;
			this.#nameInput = this.#createNameInput();
			this.#sortInput = this.#createSortInput();
			this.#saveButton = this.#createSaveButton();
			this.#dialog = new this.#dependencies.Dialog({
				width: 430,
				title: main_core.Loc.getMessage(this.#category === null ? 'CRM_DEAL_CATEGORY_LIST_EDIT_DIALOG_CREATE_TITLE' : 'CRM_DEAL_CATEGORY_LIST_EDIT_DIALOG_EDIT_TITLE') ?? '',
				content: this.#renderContent(),
				centerButtons: [this.#saveButton, this.#createCancelButton()],
				hasCloseButton: true,
				closeByEsc: true,
				closeByClickOutside: true,
				hasOverlay: true
			});
		}
		show() {
			this.#dialog.show();
		}
		close() {
			this.#dialog.hide();
		}
		#createNameInput() {
			return new this.#dependencies.Input({
				value: this.#category?.name ?? '',
				label: main_core.Loc.getMessage('CRM_DEAL_CATEGORY_LIST_EDIT_DIALOG_NAME') ?? '',
				type: 'text',
				size: this.#dependencies.InputSize.Lg,
				design: this.#dependencies.InputDesign.Grey,
				stretched: true,
				required: true,
				onInput: () => this.#nameInput.setError('')
			});
		}
		#createSortInput() {
			return new this.#dependencies.Input({
				value: String(this.#category?.sort ?? 0),
				label: main_core.Loc.getMessage('CRM_DEAL_CATEGORY_LIST_EDIT_DIALOG_SORT') ?? '',
				type: 'number',
				size: this.#dependencies.InputSize.Lg,
				design: this.#dependencies.InputDesign.Grey,
				stretched: true,
				onInput: () => this.#sortInput.setError('')
			});
		}
		#createSaveButton() {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('CRM_DEAL_CATEGORY_LIST_EDIT_DIALOG_SAVE') ?? '',
				size: ui_buttons.ButtonSize.LARGE,
				style: ui_buttons.AirButtonStyle.FILLED,
				useAirDesign: true,
				dataset: {
					testid: 'crm-deal-category-edit-dialog-save'
				},
				onclick: () => {
					void this.#handleSave();
					return {};
				}
			});
		}
		#createCancelButton() {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('CRM_DEAL_CATEGORY_LIST_EDIT_DIALOG_CANCEL') ?? '',
				size: ui_buttons.ButtonSize.LARGE,
				style: ui_buttons.AirButtonStyle.OUTLINE,
				useAirDesign: true,
				dataset: {
					testid: 'crm-deal-category-edit-dialog-cancel'
				},
				onclick: () => {
					this.close();
					return {};
				}
			});
		}
		#renderContent() {
			const content = main_core.Tag.render`
			<div
				class="crm-deal-category-list-edit-dialog__content"
				data-testid="crm-deal-category-edit-dialog"
			></div>
		`;
			const nameInput = this.#nameInput.render();
			const sortInput = this.#sortInput.render();
			const nameInputElement = nameInput.querySelector('input');
			const sortInputElement = sortInput.querySelector('input');
			if (nameInputElement !== null && sortInputElement !== null) {
				main_core.Dom.attr(nameInputElement, {
					'data-testid': 'crm-deal-category-edit-dialog-name'
				});
				main_core.Dom.attr(sortInputElement, {
					'data-testid': 'crm-deal-category-edit-dialog-sort'
				});
			}
			main_core.Dom.append(nameInput, content);
			main_core.Dom.append(sortInput, content);
			return content;
		}
		#handleSave = async () => {
			if (this.#isSaving || this.#isCompleted) {
				return;
			}
			const fields = this.#validateFields();
			if (fields === null) {
				return;
			}
			this.#isSaving = true;
			this.#saveButton.setWaiting(true);
			let savedCategory = null;
			try {
				savedCategory = await this.#api.save(this.#category, fields);
			} catch {
				ui_notification.Center.notify({
					content: main_core.Loc.getMessage('CRM_DEAL_CATEGORY_LIST_EDIT_DIALOG_SAVE_ERROR') ?? ''
				});
			} finally {
				this.#isSaving = false;
				this.#saveButton.setWaiting(false);
			}
			if (savedCategory !== null) {
				this.#isCompleted = true;
				this.close();
				this.#onSave(savedCategory);
			}
		};
		#validateFields() {
			const name = this.#nameInput.getValue().trim();
			const sortValue = this.#sortInput.getValue().trim();
			const isNameValid = name !== '';
			const isSortValid = /^\d+$/.test(sortValue);
			this.#nameInput.setError(isNameValid ? '' : main_core.Loc.getMessage('CRM_DEAL_CATEGORY_LIST_EDIT_DIALOG_NAME_REQUIRED') ?? '');
			this.#sortInput.setError(isSortValid ? '' : main_core.Loc.getMessage('CRM_DEAL_CATEGORY_LIST_EDIT_DIALOG_INVALID_SORT') ?? '');
			if (!isNameValid) {
				this.#nameInput.focus();
			} else if (!isSortValid) {
				this.#sortInput.focus();
			}
			return isNameValid && isSortValid ? {
				name,
				sort: sortValue
			} : null;
		}
	}

	const PROCESS_ID = 'crm-deal-category-bulk-delete';
	const SLIDER_CLOSE_EVENT = 'SidePanel.Slider:onClose';
	class BulkDelete {
		#getGrid;
		#onSuccess;
		#dependencies;
		#dependenciesPromise = null;
		#grid = null;
		#process = null;
		#slider = null;
		#confirmDialog = null;
		#closeDialog = null;
		#startPending = false;
		#processActive = false;
		#closePending = false;
		#closeApproved = false;
		#closeListenerBound = false;
		#reloadCompleted = false;
		constructor(options) {
			this.#getGrid = options.getGrid;
			this.#onSuccess = options.onSuccess ?? (() => {});
			this.#dependencies = options.dependencies ?? null;
		}
		start(action) {
			if (this.#startPending || this.#processActive) {
				return false;
			}
			const grid = this.#getGrid();
			if (grid === null) {
				return false;
			}
			const scope = grid.getActionsPanel?.()?.getForAllCheckbox?.()?.checked === true ? 'all' : 'selected';
			const selectedIds = grid.getRows().getSelectedIds();
			if (scope === 'selected' && selectedIds.length === 0) {
				return false;
			}
			const ids = Object.freeze(scope === 'selected' ? [...selectedIds] : []);
			const params = Object.freeze({
				scope,
				ids
			});
			this.#grid = grid;
			this.#startPending = true;
			if (this.#dependencies === null) {
				void this.#loadDependencies().then(() => this.#showStartConfirmation(action, params)).catch(() => {
					this.#startPending = false;
				});
			} else {
				this.#showStartConfirmation(action, params);
			}
			return true;
		}
		#showStartConfirmation(action, params) {
			if (this.#dependencies === null) {
				this.#startPending = false;
				return;
			}
			const {
				Dialog
			} = this.#dependencies;
			const isAll = params.scope === 'all';
			const content = main_core.Dom.create('div', {
				attrs: {
					'data-testid': 'crm-deal-category-bulk-delete-dialog'
				}
			});
			const message = main_core.Dom.create('div', {
				text: main_core.Loc.getMessage(isAll ? 'CRM_DEAL_CATEGORY_LIST_BULK_DELETE_ALL_CONTENT' : 'CRM_DEAL_CATEGORY_LIST_BULK_DELETE_SELECTED_CONTENT', isAll ? undefined : {
					'#COUNT#': String(params.ids.length)
				}) ?? '',
				attrs: isAll ? {
					'data-testid': 'crm-deal-category-bulk-delete-warning'
				} : {}
			});
			main_core.Dom.append(message, content);
			this.#confirmDialog = new Dialog({
				title: main_core.Loc.getMessage('CRM_DEAL_CATEGORY_LIST_BULK_DELETE_TITLE') ?? '',
				content,
				centerButtons: [this.#createButton('CRM_DEAL_CATEGORY_LIST_BULK_DELETE_CONFIRM', 'crm-deal-category-bulk-delete-confirm', ui_buttons.AirButtonStyle.FILLED, () => {
					this.#confirmDialog?.hide();
					this.#begin(action, params);
				}), this.#createButton('CRM_DEAL_CATEGORY_LIST_BULK_DELETE_CANCEL', 'crm-deal-category-bulk-delete-cancel', ui_buttons.AirButtonStyle.OUTLINE, () => {
					this.#startPending = false;
					this.#confirmDialog?.hide();
				})],
				hasCloseButton: true,
				closeByEsc: true,
				closeByClickOutside: true,
				hasOverlay: true
			});
			this.#confirmDialog.subscribe('onHide', () => {
				this.#startPending = false;
			});
			this.#confirmDialog.show();
		}
		#begin(action, params) {
			this.#startPending = false;
			this.#reloadCompleted = false;
			this.#closePending = false;
			this.#closeApproved = false;
			if (this.#dependencies === null) {
				return;
			}
			this.#slider = this.#dependencies.SidePanel.Instance.getSliderByWindow(window);
			const {
				ProcessCallback,
				ProcessManager
			} = this.#dependencies;
			const processOptions = {
				id: PROCESS_ID,
				controller: action.controller,
				method: action.method,
				params,
				queue: [{
					action: 'process',
					title: main_core.Loc.getMessage('CRM_DEAL_CATEGORY_LIST_BULK_DELETE_PROCESS_SUMMARY') ?? '',
					progressBarTitle: main_core.Loc.getMessage('CRM_DEAL_CATEGORY_LIST_BULK_DELETE_PROCESS_PROGRESS') ?? ''
				}],
				messages: {
					DialogTitle: main_core.Loc.getMessage('CRM_DEAL_CATEGORY_LIST_BULK_DELETE_PROCESS_TITLE') ?? '',
					DialogSummary: main_core.Loc.getMessage('CRM_DEAL_CATEGORY_LIST_BULK_DELETE_PROCESS_SUMMARY') ?? ''
				},
				showButtons: {
					start: false,
					stop: true,
					close: true
				},
				handlers: {
					[ProcessCallback.StateChanged]: this.#handleProcessStateChanged
				}
			};
			this.#process = ProcessManager.create(processOptions);
			this.#process.showDialog();
			this.#process.start();
		}
		#handleProcessStateChanged = (state, result) => {
			if (state === this.#dependencies?.ProcessState.running) {
				this.#processActive = true;
				this.#bindCloseListener();
				return;
			}
			const processState = this.#dependencies?.ProcessState;
			if (processState === undefined || !new Set([processState.stopped, processState.completed, processState.error]).has(state)) {
				return;
			}
			this.#processActive = false;
			this.#closeDialog?.hide();
			this.#reloadOnce(result);
			this.#unbindCloseListener();
			if (this.#closeApproved) {
				this.#closeApproved = false;
				this.#slider?.close();
			}
		};
		#handleSliderClose = event => {
			const [sliderEvent] = event.getData();
			if (!this.#processActive || sliderEvent?.getSlider() !== this.#slider) {
				return;
			}
			sliderEvent.denyAction();
			if (this.#closePending) {
				return;
			}
			this.#closePending = true;
			this.#showCloseConfirmation();
		};
		#showCloseConfirmation() {
			if (this.#dependencies === null) {
				return;
			}
			const {
				Dialog
			} = this.#dependencies;
			this.#closeDialog = new Dialog({
				title: main_core.Loc.getMessage('CRM_DEAL_CATEGORY_LIST_BULK_DELETE_CLOSE_TITLE') ?? '',
				content: main_core.Dom.create('div', {
					text: main_core.Loc.getMessage('CRM_DEAL_CATEGORY_LIST_BULK_DELETE_CLOSE_CONTENT') ?? '',
					attrs: {
						'data-testid': 'crm-deal-category-bulk-delete-close-dialog'
					}
				}),
				centerButtons: [this.#createButton('CRM_DEAL_CATEGORY_LIST_BULK_DELETE_CLOSE_STOP', 'crm-deal-category-bulk-delete-close-stop', ui_buttons.AirButtonStyle.FILLED, () => {
					this.#closeApproved = true;
					this.#closeDialog?.hide();
					this.#process?.stop();
				}), this.#createButton('CRM_DEAL_CATEGORY_LIST_BULK_DELETE_CLOSE_STAY', 'crm-deal-category-bulk-delete-close-stay', ui_buttons.AirButtonStyle.OUTLINE, () => {
					this.#closeDialog?.hide();
				})],
				hasCloseButton: true,
				closeByEsc: true,
				closeByClickOutside: true,
				hasOverlay: true
			});
			this.#closeDialog.subscribe('onHide', () => {
				if (!this.#closeApproved) {
					this.#closePending = false;
				}
			});
			this.#closeDialog.show();
		}
		#bindCloseListener() {
			if (this.#slider === null || this.#closeListenerBound) {
				return;
			}
			main_core_events.EventEmitter.subscribe(this.#slider, SLIDER_CLOSE_EVENT, this.#handleSliderClose);
			this.#closeListenerBound = true;
		}
		#unbindCloseListener() {
			if (this.#slider === null || !this.#closeListenerBound) {
				return;
			}
			main_core_events.EventEmitter.unsubscribe(this.#slider, SLIDER_CLOSE_EVENT, this.#handleSliderClose);
			this.#closeListenerBound = false;
		}
		#reloadOnce(result) {
			if (this.#reloadCompleted) {
				return;
			}
			this.#reloadCompleted = true;
			this.#onSuccess(Math.max(0, result?.successCount ?? 0));
			const grid = this.#getGrid() ?? this.#grid;
			this.#grid = null;
			grid?.reload();
		}
		#loadDependencies() {
			if (this.#dependencies !== null) {
				return Promise.resolve(this.#dependencies);
			}
			if (this.#dependenciesPromise === null) {
				const promise = Promise.all([main_core.Runtime.loadExtension('ui.system.dialog'), main_core.Runtime.loadExtension('ui.stepprocessing'), main_core.Runtime.loadExtension('main.sidepanel')]).then(([dialogExports, processExports, sidePanelExports]) => {
					const dependencies = {
						Dialog: dialogExports.Dialog,
						SidePanel: sidePanelExports.SidePanel,
						ProcessCallback: processExports.ProcessCallback,
						ProcessManager: processExports.ProcessManager,
						ProcessState: processExports.ProcessState
					};
					if (!main_core.Type.isFunction(dependencies.Dialog) || !main_core.Type.isFunction(dependencies.SidePanel?.Instance?.getSliderByWindow) || !main_core.Type.isPlainObject(dependencies.ProcessCallback) || !main_core.Type.isFunction(dependencies.ProcessManager) || !main_core.Type.isFunction(dependencies.ProcessManager?.create) || !main_core.Type.isPlainObject(dependencies.ProcessState)) {
						throw new TypeError('Bulk delete dependencies are invalid');
					}
					this.#dependencies = dependencies;
					return this.#dependencies;
				}).catch(error => {
					if (this.#dependenciesPromise === promise) {
						this.#dependenciesPromise = null;
					}
					throw error;
				});
				this.#dependenciesPromise = promise;
			}
			return this.#dependenciesPromise;
		}
		#createButton(messageId, testId, style, onClick) {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage(messageId) ?? '',
				size: ui_buttons.ButtonSize.LARGE,
				style,
				useAirDesign: true,
				dataset: {
					testid: testId
				},
				onclick: () => {
					onClick();
					return {};
				}
			});
		}
	}

	const ACTION_EVENT = 'Crm.DealCategoryList:onAction';
	const CREATE_EVENT = 'CrmDealCategoryCreate';
	const CATEGORY_FIELDS = ['id', 'name', 'sort', 'createdDate', 'isDefault', 'stageEditorUrl'];
	class DealCategoryList extends main_core_events.EventEmitter {
		static #instance = null;
		#gridId;
		#actionIds;
		#categoryCount;
		#quantityLimit;
		#infoHelperId;
		#bulkDelete;
		#editDialogDependenciesPromise = null;
		#dialogDependenciesPromise = null;
		#sidePanelPromise = null;
		#infoHelperPromise = null;
		#editDialogOpening = false;
		#deleteDialogOpening = false;
		#deleteDialog = null;
		#deleteButton = null;
		#deleteCategory = null;
		#isDeleting = false;
		#isDeleteCompleted = false;
		static init(options) {
			if (DealCategoryList.#instance === null) {
				DealCategoryList.#instance = new DealCategoryList(options);
			} else {
				DealCategoryList.#instance.#synchronizeOptions(options);
			}
			return DealCategoryList.#instance;
		}
		constructor(options) {
			super();
			if (!this.#isOptionsValid(options)) {
				throw new TypeError('Deal category list options are invalid');
			}
			this.setEventNamespace('BX.Crm.DealCategoryList');
			this.#gridId = options.gridId;
			this.#actionIds = options.actionIds;
			this.#categoryCount = options.categoryCount;
			this.#quantityLimit = options.quantityLimit;
			this.#infoHelperId = options.infoHelperId;
			this.#bulkDelete = new BulkDelete({
				getGrid: () => this.#getGrid(),
				onSuccess: successCount => this.#decreaseCategoryCount(successCount)
			});
			main_core_events.EventEmitter.subscribe(ACTION_EVENT, this.#handleAction.bind(this));
			main_core_events.EventEmitter.subscribe(CREATE_EVENT, this.#openCreateDialog.bind(this), {
				compatMode: true
			});
			if (options.openEditId !== null) {
				if (options.openEditId === 0) {
					this.#openCreateDialog();
				} else {
					this.#openEditDialogById(options.openEditId);
				}
				this.#removeOpenEditQueryParameter();
			}
		}
		#openStageEditor(category) {
			if (!this.#isDealCategoryDto(category)) {
				this.#showInvalidDataNotification();
				return false;
			}
			void this.#loadSidePanel().then(({
				SidePanel
			}) => SidePanel.Instance.open(category.stageEditorUrl, {
				cacheable: false,
				customLeftBoundary: 40,
				allowChangeHistory: false
			})).catch(() => {});
			return true;
		}
		#openStageEditorById(id) {
			const category = this.#getCategoryById(id);
			return category === null ? false : this.#openStageEditor(category);
		}
		#openCreateDialog() {
			if (this.#isQuantityLimitReached() || this.#editDialogOpening) {
				if (this.#isQuantityLimitReached()) {
					void this.#showInfoHelper().catch(() => {});
				}
				return;
			}
			this.emit('onCreate');
			void this.#showEditDialog({
				onSave: () => {
					this.#categoryCount++;
					this.#reloadGrid();
				}
			});
		}
		#openEditDialog(category) {
			if (this.#editDialogOpening) {
				return;
			}
			this.emit('onEdit', {
				category
			});
			void this.#showEditDialog({
				category,
				onSave: () => this.#reloadGrid()
			});
		}
		#openEditDialogById(id) {
			const category = this.#getCategoryById(id);
			if (category === null) {
				return false;
			}
			this.#openEditDialog(category);
			return true;
		}
		#showDeleteDialog(category, Dialog) {
			this.#deleteCategory = category;
			this.#isDeleting = false;
			this.#isDeleteCompleted = false;
			this.#deleteButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('CRM_DEAL_CATEGORY_LIST_DELETE_DIALOG_DELETE') ?? '',
				size: ui_buttons.ButtonSize.LARGE,
				style: ui_buttons.AirButtonStyle.FILLED,
				useAirDesign: true,
				dataset: {
					testid: 'crm-deal-category-delete-dialog-delete'
				},
				onclick: () => {
					void this.#handleDelete();
					return {};
				}
			});
			this.#deleteDialog = new Dialog({
				title: main_core.Loc.getMessage('CRM_DEAL_CATEGORY_LIST_DELETE_DIALOG_TITLE') ?? '',
				content: main_core.Dom.create('div', {
					text: main_core.Loc.getMessage('CRM_DEAL_CATEGORY_LIST_DELETE_DIALOG_CONTENT', {
						'#NAME#': category.name
					}) ?? '',
					attrs: {
						'data-testid': 'crm-deal-category-delete-dialog'
					}
				}),
				centerButtons: [this.#deleteButton, this.#createDeleteCancelButton()],
				hasCloseButton: true,
				closeByEsc: true,
				closeByClickOutside: true,
				hasOverlay: true
			});
			this.#deleteDialog.show();
		}
		#openDeleteDialogById(id) {
			const category = this.#getCategoryById(id);
			if (category === null || category.isDefault || this.#deleteDialogOpening || this.#isDeleting) {
				return false;
			}
			this.emit('onDelete', {
				category
			});
			this.#deleteDialogOpening = true;
			void this.#loadDialogDependencies().then(({
				Dialog
			}) => this.#showDeleteDialog(category, Dialog)).catch(() => {
				ui_notification.Center.notify({
					content: main_core.Loc.getMessage('CRM_DEAL_CATEGORY_LIST_DELETE_DIALOG_ERROR') ?? ''
				});
			}).finally(() => {
				this.#deleteDialogOpening = false;
			});
			return true;
		}
		#getCategoryById(id) {
			const row = this.#getRow(id);
			if (row === null) {
				this.#showInvalidDataNotification();
				return null;
			}
			const serializedCategory = row.getNode()?.dataset.category;
			if (!main_core.Type.isStringFilled(serializedCategory)) {
				this.#showInvalidDataNotification();
				return null;
			}
			try {
				const category = JSON.parse(serializedCategory);
				if (this.#isDealCategoryDto(category)) {
					return category;
				}
			} catch {
			}
			this.#showInvalidDataNotification();
			return null;
		}
		#processAction(action) {
			if (this.#isBulkDeleteAction(action)) {
				return this.#bulkDelete.start(action);
			}
			if (!this.#isActionValid(action)) {
				return false;
			}
			if (action.actionId === this.#actionIds.edit) {
				return this.#openEditDialogById(action.id);
			}
			if (action.actionId === this.#actionIds.editStages) {
				return this.#openStageEditorById(action.id);
			}
			if (action.actionId === this.#actionIds.delete) {
				return this.#openDeleteDialogById(action.id);
			}
			return false;
		}
		#isOptionsValid(options) {
			return main_core.Type.isPlainObject(options) && main_core.Type.isStringFilled(options.gridId) && (main_core.Type.isInteger(options.openEditId) || main_core.Type.isNull(options.openEditId)) && (options.openEditId === null || options.openEditId >= 0) && main_core.Type.isInteger(options.categoryCount) && options.categoryCount >= 0 && main_core.Type.isInteger(options.quantityLimit) && main_core.Type.isStringFilled(options.infoHelperId) && main_core.Type.isPlainObject(options.actionIds) && main_core.Type.isStringFilled(options.actionIds.edit) && main_core.Type.isStringFilled(options.actionIds.editStages) && main_core.Type.isStringFilled(options.actionIds.delete);
		}
		#synchronizeOptions(options) {
			if (!this.#isOptionsValid(options)) {
				throw new TypeError('Deal category list options are invalid');
			}
			this.#gridId = options.gridId;
			this.#actionIds = options.actionIds;
			this.#categoryCount = options.categoryCount;
			this.#quantityLimit = options.quantityLimit;
			this.#infoHelperId = options.infoHelperId;
		}
		#isDealCategoryDto(category) {
			if (!main_core.Type.isPlainObject(category)) {
				return false;
			}
			const value = category;
			return Object.keys(value).length === CATEGORY_FIELDS.length && CATEGORY_FIELDS.every(field => Object.hasOwn(value, field)) && main_core.Type.isInteger(value.id) && value.id >= 0 && main_core.Type.isString(value.name) && main_core.Type.isInteger(value.sort) && value.sort >= 0 && main_core.Type.isBoolean(value.isDefault) && value.id === 0 === value.isDefault && (value.isDefault && main_core.Type.isNull(value.createdDate) || !value.isDefault && main_core.Type.isStringFilled(value.createdDate)) && main_core.Type.isStringFilled(value.stageEditorUrl);
		}
		#isActionValid(action) {
			if (!main_core.Type.isPlainObject(action)) {
				return false;
			}
			const value = action;
			return main_core.Type.isStringFilled(value.actionId) && main_core.Type.isInteger(value.id) && value.id >= 0;
		}
		#isBulkDeleteAction(action) {
			if (!main_core.Type.isPlainObject(action)) {
				return false;
			}
			const value = action;
			return value.actionId === 'bulk-delete' && value.controller === 'crm.api.dealcategory.grid' && value.method === 'POST';
		}
		#getGrid() {
			const grid = BX.Main.gridManager.getInstanceById(this.#gridId);
			return main_core.Type.isFunction(grid?.getRows) ? grid : null;
		}
		#getRow(id) {
			return this.#getGrid()?.getRows().getById(id) ?? null;
		}
		#reloadGrid() {
			this.#getGrid()?.reload();
		}
		#isQuantityLimitReached() {
			return this.#quantityLimit > 0 && this.#categoryCount >= this.#quantityLimit;
		}
		#decreaseCategoryCount(count) {
			this.#categoryCount = Math.max(0, this.#categoryCount - count);
		}
		async #showEditDialog(options) {
			this.#editDialogOpening = true;
			try {
				const dependencies = await this.#loadEditDialogDependencies();
				EditDialog.show(options, dependencies);
			} catch {
				ui_notification.Center.notify({
					content: main_core.Loc.getMessage('CRM_DEAL_CATEGORY_LIST_EDIT_DIALOG_SAVE_ERROR') ?? ''
				});
			} finally {
				this.#editDialogOpening = false;
			}
		}
		#loadEditDialogDependencies() {
			if (this.#editDialogDependenciesPromise === null) {
				const promise = main_core.Runtime.loadExtension(['ui.system.dialog', 'ui.system.input']).then(exports => {
					const dependencies = exports;
					if (!main_core.Type.isFunction(dependencies.Dialog) || !main_core.Type.isFunction(dependencies.Input) || !main_core.Type.isPlainObject(dependencies.InputDesign) || !main_core.Type.isPlainObject(dependencies.InputSize)) {
						throw new TypeError('Edit dialog dependencies are invalid');
					}
					return dependencies;
				}).catch(error => {
					if (this.#editDialogDependenciesPromise === promise) {
						this.#editDialogDependenciesPromise = null;
					}
					throw error;
				});
				this.#editDialogDependenciesPromise = promise;
			}
			return this.#editDialogDependenciesPromise;
		}
		#loadDialogDependencies() {
			if (this.#dialogDependenciesPromise === null) {
				const promise = main_core.Runtime.loadExtension('ui.system.dialog').then(exports => {
					const dependencies = exports;
					if (!main_core.Type.isFunction(dependencies.Dialog)) {
						throw new TypeError('Dialog dependency is invalid');
					}
					return dependencies;
				}).catch(error => {
					if (this.#dialogDependenciesPromise === promise) {
						this.#dialogDependenciesPromise = null;
					}
					throw error;
				});
				this.#dialogDependenciesPromise = promise;
			}
			return this.#dialogDependenciesPromise;
		}
		#loadSidePanel() {
			if (this.#sidePanelPromise === null) {
				const promise = main_core.Runtime.loadExtension('main.sidepanel').then(exports => {
					const dependencies = exports;
					if (!main_core.Type.isFunction(dependencies.SidePanel?.Instance?.open)) {
						throw new TypeError('Side panel dependency is invalid');
					}
					return dependencies;
				}).catch(error => {
					if (this.#sidePanelPromise === promise) {
						this.#sidePanelPromise = null;
					}
					throw error;
				});
				this.#sidePanelPromise = promise;
			}
			return this.#sidePanelPromise;
		}
		#showInfoHelper() {
			if (this.#infoHelperPromise === null) {
				const promise = main_core.Runtime.loadExtension('ui.info-helper').then(exports => {
					const dependencies = exports;
					if (!main_core.Type.isFunction(dependencies.InfoHelper?.show)) {
						throw new TypeError('Info helper dependency is invalid');
					}
					return dependencies;
				}).catch(error => {
					if (this.#infoHelperPromise === promise) {
						this.#infoHelperPromise = null;
					}
					throw error;
				});
				this.#infoHelperPromise = promise;
			}
			return this.#infoHelperPromise.then(({
				InfoHelper
			}) => {
				InfoHelper.show(this.#infoHelperId);
			});
		}
		#handleAction(event) {
			this.#processAction(event.getData());
		}
		#showInvalidDataNotification() {
			ui_notification.Center.notify({
				content: main_core.Loc.getMessage('CRM_DEAL_CATEGORY_LIST_INVALID_DATA') ?? ''
			});
		}
		#createDeleteCancelButton() {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('CRM_DEAL_CATEGORY_LIST_DELETE_DIALOG_CANCEL') ?? '',
				size: ui_buttons.ButtonSize.LARGE,
				style: ui_buttons.AirButtonStyle.OUTLINE,
				useAirDesign: true,
				dataset: {
					testid: 'crm-deal-category-delete-dialog-cancel'
				},
				onclick: () => {
					this.#deleteDialog?.hide();
					return {};
				}
			});
		}
		#getDeleteErrorMessage(error) {
			const fallbackMessage = main_core.Loc.getMessage('CRM_DEAL_CATEGORY_LIST_DELETE_DIALOG_ERROR') ?? '';
			if (!main_core.Type.isPlainObject(error)) {
				return fallbackMessage;
			}
			const errors = error.errors;
			if (!Array.isArray(errors)) {
				return fallbackMessage;
			}
			const serverError = errors.find(item => {
				return main_core.Type.isPlainObject(item) && main_core.Type.isStringFilled(item.message);
			});
			return serverError?.message ?? fallbackMessage;
		}
		#handleDelete = async () => {
			if (this.#isDeleting || this.#isDeleteCompleted || this.#deleteCategory === null || this.#deleteCategory.isDefault) {
				return;
			}
			this.#isDeleting = true;
			this.#deleteButton?.setWaiting(true);
			let isDeleted = false;
			try {
				await DeleteCategory.execute(this.#deleteCategory.id);
				isDeleted = true;
			} catch (error) {
				ui_notification.Center.notify({
					content: main_core.Text.encode(this.#getDeleteErrorMessage(error))
				});
			} finally {
				this.#isDeleting = false;
				this.#deleteButton?.setWaiting(false);
			}
			if (isDeleted) {
				this.#isDeleteCompleted = true;
				this.#decreaseCategoryCount(1);
				this.#deleteDialog?.hide();
				this.#reloadGrid();
			}
		};
		#removeOpenEditQueryParameter() {
			const url = new URL(window.location.href);
			if (!url.searchParams.has('open_edit')) {
				return;
			}
			url.searchParams.delete('open_edit');
			window.history.replaceState(window.history.state, document.title, `${url.pathname}${url.search}${url.hash}`);
		}
	}

	exports.DealCategoryList = DealCategoryList;

})(this.BX.Crm = this.BX.Crm || {}, BX, BX.Event, BX.UI, BX.UI.Notification);
//# sourceMappingURL=deal-category-list.bundle.js.map
