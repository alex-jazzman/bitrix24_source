/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, main_core_events, ui_buttons, ui_system_dialog) {
	'use strict';

	class NavigationManager {
		#filterId;
		#filter = null;
		constructor(filterId) {
			this.#filterId = filterId;
		}
		init() {
			this.#filter = BX.Main.filterManager.getById(this.#filterId) ?? null;
		}
		showChildren(parentId) {
			const filter = this.#getFilter();
			const fields = {
				...filter.getFilterFieldsValues(),
				PARENT_ID_numsel: 'exact',
				PARENT_ID_from: String(this.#normalizeParentId(parentId) || ''),
				PARENT_ID_to: ''
			};
			filter.getApi().setFields(fields);
			filter.getApi().apply();
		}
		getParentId() {
			const fields = this.#getFilter().getFilterFieldsValues();
			const parentId = fields.PARENT_ID_from;
			if (fields.PARENT_ID_numsel !== 'exact' || !main_core.Type.isString(parentId) || !/^[1-9]\d*$/.test(parentId)) {
				return 0;
			}
			return Number(parentId);
		}
		#getFilter() {
			this.#filter ??= BX.Main.filterManager.getById(this.#filterId) ?? null;
			if (this.#filter === null) {
				throw new Error(`Filter "${this.#filterId}" is not initialized.`);
			}
			return this.#filter;
		}
		#normalizeParentId(value) {
			const parentId = Number(value);
			return Number.isInteger(parentId) && parentId > 0 ? parentId : 0;
		}
	}

	class SliderManager {
		#onChanged;
		constructor(onChanged) {
			this.#onChanged = onChanged;
		}
		open(url, options = {}) {
			BX.SidePanel.Instance.open(url, {
				cacheable: false,
				data: {
					changed: false
				},
				events: {
					onCloseComplete: event => {
						if (event.getSlider()?.getData().get('changed') === true) {
							this.#onChanged();
						}
					}
				},
				...options
			});
		}
	}

	const StorageKeyPrefix = 'crm.config.locations.batchDelete';
	async function loadRuntimeDependencies() {
		const [autorun, notification, stepProcessing] = await Promise.all([main_core.Runtime.loadExtension('crm.autorun'), main_core.Runtime.loadExtension('ui.notification'), main_core.Runtime.loadExtension('ui.stepprocessing')]);
		return {
			Dialog: ui_system_dialog.Dialog,
			Button: ui_buttons.Button,
			buttonSizeLarge: ui_buttons.ButtonSize.LARGE,
			buttonStyleFilled: ui_buttons.AirButtonStyle.FILLED,
			buttonStyleOutline: ui_buttons.AirButtonStyle.OUTLINE,
			processManager: stepProcessing.ProcessManager,
			processRegistry: {
				isProcessRunning: gridId => autorun.ProcessRegistry.isProcessRunning(gridId),
				registerProcessRun: gridId => autorun.ProcessRegistry.Instance.registerProcessRun(gridId),
				registerProcessStop: gridId => autorun.ProcessRegistry.Instance.registerProcessStop(gridId)
			},
			processState: stepProcessing.ProcessState,
			notify: options => notification.Center.notify(options)
		};
	}
	class BatchDeleteManager {
		#config;
		#dependencies;
		#runtimeDependencies;
		#runtimeDependenciesPromise = null;
		#isRunning = false;
		#isRecoveryBlocked = false;
		#mayHaveMutated = false;
		#hasCompleted = false;
		constructor(config, dependencies = {}) {
			this.#config = config;
			const injectedRuntimeDependencies = this.#getInjectedRuntimeDependencies(dependencies);
			this.#runtimeDependencies = dependencies.loadRuntimeDependencies === undefined ? injectedRuntimeDependencies : null;
			this.#dependencies = {
				ajax: dependencies.ajax ?? BX.ajax,
				storage: dependencies.storage ?? window.sessionStorage,
				getGrid: dependencies.getGrid ?? (() => this.#getPlatformGrid()),
				getFilterValues: dependencies.getFilterValues ?? (() => this.#getPlatformFilterValues()),
				loadRuntimeDependencies: dependencies.loadRuntimeDependencies ?? loadRuntimeDependencies
			};
		}
		async init() {
			const token = this.#dependencies.storage.getItem(this.#storageKey());
			if (token === null || token === '') {
				return;
			}
			this.#isRecoveryBlocked = true;
			await this.#ensureRuntimeDependencies();
			await this.#recover(token);
		}
		execute() {
			if (this.#runtimeDependencies === null) {
				void this.#ensureRuntimeDependencies().then(() => this.#execute());
				return;
			}
			this.#execute();
		}
		#execute() {
			if (this.#isRunning || this.#isRecoveryBlocked) {
				return;
			}
			const runtimeDependencies = this.#getRuntimeDependencies();
			if (runtimeDependencies.processRegistry.isProcessRunning(this.#config.gridId)) {
				this.#notify(this.#message('CRM_CONFIG_LOCATIONS_BATCH_DELETE_ANOTHER_PROCESS'));
				return;
			}
			const scope = this.#getScope();
			if (scope.mode === 'selected' && scope.ids.length === 0) {
				this.#notify(this.#message('CRM_CONFIG_LOCATIONS_BATCH_DELETE_NOT_SELECTED'));
				return;
			}
			const content = document.createElement('div');
			content.dataset.testid = 'crm-locations-batch-delete-confirm';
			content.textContent = this.#message('CRM_CONFIG_LOCATIONS_BATCH_DELETE_CONFIRM_TEXT');
			const dialog = new runtimeDependencies.Dialog({
				title: this.#message('CRM_CONFIG_LOCATIONS_BATCH_DELETE_CONFIRM_TITLE'),
				content,
				centerButtons: [new runtimeDependencies.Button({
					text: this.#message('CRM_CONFIG_LOCATIONS_BATCH_DELETE_CONFIRM_BUTTON'),
					size: runtimeDependencies.buttonSizeLarge,
					style: runtimeDependencies.buttonStyleFilled,
					useAirDesign: true,
					onclick: () => {
						dialog.hide();
						this.#start(scope);
					}
				}), new runtimeDependencies.Button({
					text: this.#message('CRM_CONFIG_LOCATIONS_BATCH_DELETE_CONFIRM_CANCEL'),
					size: runtimeDependencies.buttonSizeLarge,
					style: runtimeDependencies.buttonStyleOutline,
					useAirDesign: true,
					onclick: () => dialog.hide()
				})],
				hasOverlay: true,
				hasCloseButton: true,
				closeByEsc: true
			});
			dialog.show();
		}
		#start(scope) {
			const runtimeDependencies = this.#getRuntimeDependencies();
			if (this.#isRunning || this.#isRecoveryBlocked || runtimeDependencies.processRegistry.isProcessRunning(this.#config.gridId)) {
				return;
			}
			this.#isRunning = true;
			this.#mayHaveMutated = false;
			this.#hasCompleted = false;
			runtimeDependencies.processRegistry.registerProcessRun(this.#config.gridId);
			const process = runtimeDependencies.processManager.create({
				id: `crm_location_batch_delete_${this.#config.gridId}`,
				controller: this.#config.controller,
				params: scope,
				queue: [{
					action: 'process',
					title: this.#message('CRM_CONFIG_LOCATIONS_BATCH_DELETE_PROGRESS'),
					progressBarTitle: this.#message('CRM_CONFIG_LOCATIONS_BATCH_DELETE_PROGRESS'),
					handlers: {
						RequestStart: formData => {
							const token = String(formData.get('PROCESS_TOKEN') ?? '');
							if (token !== '') {
								this.#dependencies.storage.setItem(this.#storageKey(), token);
								process.setParams({
									PROCESS_TOKEN: token
								});
							}
							this.#mayHaveMutated = true;
						},
						StepCompleted: (status, result) => {
							this.#hasCompleted = status === 'COMPLETED' && result.STATUS === 'COMPLETED';
						}
					}
				}],
				handlers: {
					StateChanged: state => {
						if (state === runtimeDependencies.processState.completed) {
							if (this.#hasCompleted) {
								this.#dependencies.storage.removeItem(this.#storageKey());
							}
							this.#finish();
						} else if (state === runtimeDependencies.processState.error) {
							this.#finish();
							const token = this.#dependencies.storage.getItem(this.#storageKey());
							if (token !== null && token !== '') {
								this.#isRecoveryBlocked = true;
								this.#showRecoveryError(token);
							}
						}
					},
					dialogClosed: () => {
						if (!this.#mayHaveMutated) {
							this.#finish();
						}
					}
				},
				messages: {
					DialogTitle: this.#message('CRM_CONFIG_LOCATIONS_BATCH_DELETE_TITLE'),
					DialogSummary: this.#message('CRM_CONFIG_LOCATIONS_BATCH_DELETE_SUMMARY'),
					RequestCanceling: this.#message('CRM_CONFIG_LOCATIONS_BATCH_DELETE_CANCELING')
				},
				showButtons: {
					start: true,
					stop: true,
					close: true
				}
			});
			process.showDialog();
		}
		#finish() {
			if (!this.#isRunning) {
				return;
			}
			this.#isRunning = false;
			this.#getRuntimeDependencies().processRegistry.registerProcessStop(this.#config.gridId);
			if (this.#mayHaveMutated) {
				this.#config.onReload();
			}
		}
		async #recover(token) {
			try {
				const response = await this.#dependencies.ajax.runAction(`${this.#config.controller}.cancel`, {
					data: {
						PROCESS_TOKEN: token
					}
				});
				if (response.data.STATUS !== 'COMPLETED') {
					throw new Error('Recovery cancel has not completed.');
				}
				this.#dependencies.storage.removeItem(this.#storageKey());
				this.#isRecoveryBlocked = false;
				this.#config.onReload();
			} catch {
				this.#isRecoveryBlocked = true;
				this.#showRecoveryError(token);
			}
		}
		#showRecoveryError(token) {
			const notification = this.#getRuntimeDependencies().notify({
				content: this.#message('CRM_CONFIG_LOCATIONS_BATCH_DELETE_RECOVERY_ERROR'),
				autoHide: false,
				actions: [{
					id: 'retry',
					title: this.#message('CRM_CONFIG_LOCATIONS_BATCH_DELETE_RECOVERY_RETRY'),
					events: {
						click: () => {
							void this.#recover(token);
						}
					}
				}]
			});
			const retryAction = notification?.getActions().find(action => action.getId() === 'retry');
			if (retryAction !== undefined) {
				retryAction.getContainer().dataset.testid = 'crm-locations-batch-delete-recovery-retry';
			}
		}
		#getScope() {
			const grid = this.#dependencies.getGrid();
			const values = grid.getActionsPanel().getValues();
			const forAll = values[grid.getForAllKey()] === 'Y';
			const filter = {
				...this.#dependencies.getFilterValues()
			};
			if (!Object.hasOwn(filter, 'PARENT_ID') && !Object.hasOwn(filter, 'PARENT_ID_numsel')) {
				filter.PARENT_ID = 0;
			}
			return {
				mode: forAll ? 'all' : 'selected',
				ids: forAll ? [] : grid.getRows().getSelectedIds().map(id => Number(id)).filter(id => Number.isInteger(id) && id > 0),
				filter
			};
		}
		#getPlatformGrid() {
			const grid = BX.Main.gridManager.getInstanceById(this.#config.gridId);
			if (grid === null || grid === undefined) {
				throw new Error(`Grid "${this.#config.gridId}" is not initialized.`);
			}
			return grid;
		}
		#getPlatformFilterValues() {
			return BX.Main.filterManager.getById(this.#config.filterId)?.getFilterFieldsValues() ?? {};
		}
		#storageKey() {
			return `${StorageKeyPrefix}.${this.#config.gridId}`;
		}
		#notify(content) {
			this.#getRuntimeDependencies().notify({
				content,
				autoHide: true
			});
		}
		#getInjectedRuntimeDependencies(dependencies) {
			if (dependencies.Dialog === undefined || dependencies.Button === undefined || dependencies.buttonSizeLarge === undefined || dependencies.buttonStyleFilled === undefined || dependencies.buttonStyleOutline === undefined || dependencies.processManager === undefined || dependencies.processRegistry === undefined || dependencies.processState === undefined || dependencies.notify === undefined) {
				return null;
			}
			return {
				Dialog: dependencies.Dialog,
				Button: dependencies.Button,
				buttonSizeLarge: dependencies.buttonSizeLarge,
				buttonStyleFilled: dependencies.buttonStyleFilled,
				buttonStyleOutline: dependencies.buttonStyleOutline,
				processManager: dependencies.processManager,
				processRegistry: dependencies.processRegistry,
				processState: dependencies.processState,
				notify: dependencies.notify
			};
		}
		async #ensureRuntimeDependencies() {
			if (this.#runtimeDependencies !== null) {
				return this.#runtimeDependencies;
			}
			this.#runtimeDependenciesPromise ??= this.#dependencies.loadRuntimeDependencies();
			try {
				this.#runtimeDependencies = await this.#runtimeDependenciesPromise;
				return this.#runtimeDependencies;
			} catch (error) {
				this.#runtimeDependenciesPromise = null;
				throw error;
			}
		}
		#getRuntimeDependencies() {
			if (this.#runtimeDependencies === null) {
				throw new Error('Batch delete runtime dependencies are not loaded.');
			}
			return this.#runtimeDependencies;
		}
		#message(code) {
			return main_core.Loc.getMessage(code) ?? '';
		}
	}

	const EDIT_EVENT = 'BX.Crm.Config.LocationGrid:edit';
	const SHOW_CHILDREN_EVENT = 'BX.Crm.Config.LocationGrid:showChildren';
	const BATCH_DELETE_BUTTON_ID = 'grid_remove_button_control';
	const DefaultConfirmationDialogDependencies = {
		Dialog: ui_system_dialog.Dialog,
		Button: ui_buttons.Button,
		buttonSizeLarge: ui_buttons.ButtonSize.LARGE,
		buttonStyleFilled: ui_buttons.AirButtonStyle.FILLED,
		buttonStyleOutline: ui_buttons.AirButtonStyle.OUTLINE
	};
	class LocationGridManager {
		static Instance = null;
		#config;
		#navigationManager;
		#sliderManager;
		#batchDeleteManager;
		#confirmationDialogDependencies;
		#grid = null;
		constructor(config, confirmationDialogDependencies = DefaultConfirmationDialogDependencies) {
			this.#config = config;
			this.#confirmationDialogDependencies = confirmationDialogDependencies;
			this.#navigationManager = new NavigationManager(config.filterId);
			this.#sliderManager = new SliderManager(() => this.reload());
			this.#batchDeleteManager = new BatchDeleteManager({
				gridId: config.gridId,
				filterId: config.filterId,
				controller: config.batchController,
				onReload: () => this.reload()
			});
		}
		init() {
			this.#grid = BX.Main.gridManager.getInstanceById(this.#config.gridId) ?? null;
			this.#navigationManager.init();
			void this.#batchDeleteManager.init();
			const batchDeleteButton = document.getElementById(BATCH_DELETE_BUTTON_ID);
			if (batchDeleteButton !== null) {
				batchDeleteButton.dataset.testid = 'crm-locations-batch-delete';
			}
			main_core_events.EventEmitter.subscribe(EDIT_EVENT, event => {
				this.#sliderManager.open(String(event.getData().url));
			});
			main_core_events.EventEmitter.subscribe(SHOW_CHILDREN_EVENT, event => {
				this.#navigationManager.showChildren(Number(event.getData().parentId));
			});
		}
		reload() {
			this.#getGrid().reload();
		}
		openAdd() {
			const uri = new main_core.Uri(this.#config.addUrl);
			uri.setQueryParam('PARENT_ID', String(this.#navigationManager.getParentId()));
			this.#sliderManager.open(uri.toString());
		}
		openImport() {
			this.#sliderManager.open(this.#config.importUrl, {
				width: 900
			});
		}
		deleteSelected() {
			this.#batchDeleteManager.execute();
		}
		confirmDelete(locationName, onConfirm) {
			const dependencies = this.#confirmationDialogDependencies;
			const content = document.createElement('div');
			content.dataset.testid = 'crm-locations-delete-confirm';
			content.textContent = main_core.Loc.getMessage('CRM_CONFIG_LOCATIONS_DELETE_CONFIRM_TEXT', {
				'#NAME#': locationName
			}) ?? '';
			const dialog = new dependencies.Dialog({
				title: main_core.Loc.getMessage('CRM_CONFIG_LOCATIONS_DELETE_CONFIRM_TITLE') ?? '',
				content,
				centerButtons: [new dependencies.Button({
					text: main_core.Loc.getMessage('CRM_CONFIG_LOCATIONS_DELETE_CONFIRM_BUTTON') ?? '',
					size: dependencies.buttonSizeLarge,
					style: dependencies.buttonStyleFilled,
					useAirDesign: true,
					onclick: () => {
						dialog.hide();
						onConfirm();
					}
				}), new dependencies.Button({
					text: main_core.Loc.getMessage('CRM_CONFIG_LOCATIONS_DELETE_CONFIRM_CANCEL') ?? '',
					size: dependencies.buttonSizeLarge,
					style: dependencies.buttonStyleOutline,
					useAirDesign: true,
					onclick: () => dialog.hide()
				})],
				hasOverlay: true,
				hasCloseButton: true,
				closeByEsc: true
			});
			dialog.show();
		}
		#getGrid() {
			this.#grid ??= BX.Main.gridManager.getInstanceById(this.#config.gridId) ?? null;
			if (this.#grid === null) {
				throw new Error(`Grid "${this.#config.gridId}" is not initialized.`);
			}
			return this.#grid;
		}
	}

	exports.LocationGridManager = LocationGridManager;

})(this.BX.Crm.Config = this.BX.Crm.Config || {}, BX, BX.Event, BX.UI, BX.UI.System);
//# sourceMappingURL=locations.bundle.js.map
